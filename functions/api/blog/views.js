/**
 * POST /api/blog/views
 * 
 * Track page views for blog posts.
 * Uses BLOG_DB (D1) for view counting.
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    const { post_slug } = data;
    
    // Validate required fields
    if (!post_slug) {
      return new Response(JSON.stringify({
        error: 'post_slug is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get client IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashString(clientIP);
    
    // Check for recent view from same IP (prevent spam, allow once per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentView = await env.BLOG_DB.prepare(`
      SELECT id FROM post_views 
      WHERE post_slug = ? AND ip_hash = ? AND created_at > ?
    `).bind(post_slug, ipHash, oneHourAgo).first();
    
    let isNewView = false;
    let totalViews = 0;
    
    if (!recentView) {
      // Record new view
      await env.BLOG_DB.prepare(`
        INSERT INTO post_views (post_slug, ip_hash)
        VALUES (?, ?)
      `).bind(post_slug, ipHash).run();
      
      isNewView = true;
    }
    
    // Get total views count
    const countResult = await env.BLOG_DB.prepare(`
      SELECT COUNT(*) as total FROM post_views WHERE post_slug = ?
    `).bind(post_slug).first();
    
    totalViews = countResult.total;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        isNewView,
        totalViews
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Views error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to track view.'
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
