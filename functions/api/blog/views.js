/**
 * POST /api/blog/views
 * Track a page view for a blog post
 * Debounced: only records 1 view per IP per post per hour
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { post_slug } = body;

    if (!post_slug || typeof post_slug !== 'string') {
      return jsonResponse({ success: false, error: 'post_slug is required' }, 400, env);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(ip));
    const ipHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

    // Check if viewed in the last hour
    const recent = await env.BLOG_DB.prepare(
      "SELECT id FROM post_views WHERE post_slug = ? AND ip_hash = ? AND created_at > datetime('now', '-1 hour')"
    )
      .bind(post_slug, ipHash)
      .first();

    if (recent) {
      // Already counted recently
      const count = await getViewCount(env, post_slug);
      return jsonResponse({ success: true, viewCount: count, recorded: false }, 200, env);
    }

    // Record the view
    await env.BLOG_DB.prepare(
      'INSERT INTO post_views (post_slug, ip_hash, user_agent) VALUES (?, ?, ?)'
    )
      .bind(post_slug, ipHash, request.headers.get('User-Agent') || null)
      .run();

    const count = await getViewCount(env, post_slug);
    return jsonResponse({ success: true, viewCount: count, recorded: true }, 201, env);
  } catch (err) {
    console.error('Views error:', err);
    return jsonResponse({ success: false, error: 'Failed to record view' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

async function getViewCount(env, postSlug) {
  const result = await env.BLOG_DB.prepare(
    'SELECT COUNT(*) as count FROM post_views WHERE post_slug = ?'
  )
    .bind(postSlug)
    .first();
  return result?.count || 0;
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    },
  });
}