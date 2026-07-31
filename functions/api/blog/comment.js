/**
 * GET/POST /api/blog/comment
 * 
 * GET:  List comments for a blog post (with pagination)
 * POST: Create a new comment on a blog post
 * Uses BLOG_DB (D1) for comment storage.
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const postSlug = url.searchParams.get('post_slug');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const status = url.searchParams.get('status') || 'approved'; // Only show approved by default
    
    if (!postSlug) {
      return new Response(JSON.stringify({
        error: 'post_slug parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get total count
    const countResult = await env.BLOG_DB.prepare(`
      SELECT COUNT(*) as total FROM comments 
      WHERE post_slug = ? AND status = ?
    `).bind(postSlug, status).first();
    
    // Get comments with user info
    const comments = await env.BLOG_DB.prepare(`
      SELECT c.id, c.text, c.parent_id, c.created_at,
             u.username, u.display_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_slug = ? AND c.status = ?
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `).bind(postSlug, status, limit, (page - 1) * limit).all();
    
    return new Response(JSON.stringify({
      success: true,
      data: comments.results,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
    
  } catch (error) {
    console.error('Get comments error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to fetch comments.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    const { post_slug, text, parent_id, user_id } = data;
    
    // Validate required fields
    if (!post_slug || !text) {
      return new Response(JSON.stringify({
        error: 'post_slug and text are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate comment length
    if (text.length < 3 || text.length > 2000) {
      return new Response(JSON.stringify({
        error: 'Comment must be between 3 and 2000 characters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get client IP for spam detection
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashString(clientIP);
    
    // Insert comment (status defaults to 'pending' for moderation)
    const result = await env.BLOG_DB.prepare(`
      INSERT INTO comments (post_slug, user_id, text, parent_id, ip_hash)
      VALUES (?, ?, ?, ?, ?)
    `).bind(post_slug, user_id || null, text, parent_id || null, ipHash).run();
    
    console.log(`New comment on ${post_slug} by user ${user_id || 'anonymous'}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Comment submitted successfully! It will be visible after moderation.',
      commentId: result.meta.last_row_id,
      status: 'pending'
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Create comment error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create comment.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
