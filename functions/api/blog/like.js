/**
 * POST /api/blog/like
 * Toggle like on a post. Uses IP + optional user_id for dedup.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { post_slug } = body;

    if (!post_slug || typeof post_slug !== 'string') {
      return jsonResponse({ success: false, error: 'post_slug is required' }, 400, env);
    }

    // Identify user
    let userId = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const session = await env.USERS_DB.prepare(
        'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime(\'now\')'
      )
        .bind(token)
        .first();
      if (session) userId = session.user_id;
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(ip));
    const ipHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

    // Check if already liked
    const existing = await env.BLOG_DB.prepare(
      'SELECT id FROM post_likes WHERE post_slug = ? AND (user_id = ? OR (user_id IS NULL AND ip_hash = ?))'
    )
      .bind(post_slug, userId, ipHash)
      .first();

    if (existing) {
      // Unlike
      await env.BLOG_DB.prepare('DELETE FROM post_likes WHERE id = ?').bind(existing.id).run();
      const count = await getLikeCount(env, post_slug);
      return jsonResponse({ success: true, liked: false, likeCount: count }, 200, env);
    } else {
      // Like
      await env.BLOG_DB.prepare(
        'INSERT INTO post_likes (post_slug, user_id, ip_hash) VALUES (?, ?, ?)'
      )
        .bind(post_slug, userId, ipHash)
        .run();
      const count = await getLikeCount(env, post_slug);
      return jsonResponse({ success: true, liked: true, likeCount: count }, 201, env);
    }
  } catch (err) {
    console.error('Like error:', err);
    return jsonResponse({ success: false, error: 'Failed to process like' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

async function getLikeCount(env, postSlug) {
  const result = await env.BLOG_DB.prepare(
    'SELECT COUNT(*) as count FROM post_likes WHERE post_slug = ?'
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
    'Access-Control-Allow-Credentials': 'true',
  };
}

function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}