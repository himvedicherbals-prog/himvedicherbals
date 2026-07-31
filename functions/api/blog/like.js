/**
 * POST /api/blog/like
 * 
 * Toggle like/unlike on a blog post.
 * Uses BLOG_DB (D1) for storing likes.
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    const { post_slug, user_id } = data;
    
    // Validate required fields
    if (!post_slug) {
      return new Response(JSON.stringify({
        error: 'post_slug is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get client IP for anonymous users
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // Check if already liked (by user or IP)
    const existingLike = await env.BLOG_DB.prepare(`
      SELECT id FROM post_likes 
      WHERE post_slug = ? AND (user_id = ? OR (user_id IS NULL AND ip_hash = ?))
    `).bind(post_slug, user_id || null, await hashString(clientIP)).first();
    
    let liked = false;
    let totalLikes = 0;
    
    if (existingLike) {
      // Unlike: remove the like
      await env.BLOG_DB.prepare(`
        DELETE FROM post_likes WHERE id = ?
      `).bind(existingLike.id).run();
      
      liked = false;
      console.log(`Post ${post_slug} unliked`);
    } else {
      // Like: add new record
      await env.BLOG_DB.prepare(`
        INSERT INTO post_likes (post_slug, user_id, ip_hash)
        VALUES (?, ?, ?)
      `).bind(post_slug, user_id || null, await hashString(clientIP)).run();
      
      liked = true;
      console.log(`Post ${post_slug} liked`);
    }
    
    // Get updated count
    const countResult = await env.BLOG_DB.prepare(`
      SELECT COUNT(*) as total FROM post_likes WHERE post_slug = ?
    `).bind(post_slug).first();
    
    totalLikes = countResult.total;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        liked,
        totalLikes
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Like error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to process like.'
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
