/**
 * GET  /api/blog/comment?post_slug=xxx    — List comments for a post
 * POST /api/blog/comment                   — Create a new comment
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const postSlug = url.searchParams.get('post_slug');

  if (!postSlug) {
    return jsonResponse({ success: false, error: 'post_slug is required' }, 400, env);
  }

  try {
    // Only return approved comments for public view
    const { results } = await env.BLOG_DB.prepare(
      `SELECT c.id, c.text, c.parent_id, c.created_at,
              u.username, u.display_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_slug = ? AND c.status = 'approved'
       ORDER BY c.created_at ASC`
    )
      .bind(postSlug)
      .all();

    // Build threaded structure
    const commentMap = {};
    const roots = [];

    for (const comment of results) {
      commentMap[comment.id] = {
        id: comment.id,
        text: comment.text,
        author: comment.username
          ? { username: comment.username, displayName: comment.display_name }
          : { username: 'anonymous', displayName: 'Anonymous' },
        parentId: comment.parent_id,
        createdAt: comment.created_at,
        replies: [],
      };
    }

    for (const id of Object.keys(commentMap)) {
      const comment = commentMap[id];
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(comment);
      } else {
        roots.push(comment);
      }
    }

    return jsonResponse({ success: true, comments: roots, total: results.length }, 200, env);
  } catch (err) {
    console.error('List comments error:', err);
    return jsonResponse({ success: false, error: 'Failed to load comments' }, 500, env);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { post_slug, text, parent_id } = body;

    // Validation
    if (!post_slug || typeof post_slug !== 'string') {
      return jsonResponse({ success: false, error: 'post_slug is required' }, 400, env);
    }
    if (!text || typeof text !== 'string' || text.trim().length < 1) {
      return jsonResponse({ success: false, error: 'Comment text cannot be empty' }, 400, env);
    }
    if (text.length > 5000) {
      return jsonResponse({ success: false, error: 'Comment too long (max 5000 chars)' }, 400, env);
    }

    // Get user from token if available
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

    // Hash IP for spam tracking
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashValue(ip + (env.JWT_SECRET || 'x'));

    // Insert comment (status = 'pending' unless user is logged in, then 'approved')
    const status = userId ? 'approved' : 'pending';

    const result = await env.BLOG_DB.prepare(
      'INSERT INTO comments (post_slug, user_id, text, parent_id, status, ip_hash) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(post_slug, userId, text.trim(), parent_id || null, status, ipHash)
      .run();

    return jsonResponse(
      {
        success: true,
        message: status === 'approved'
          ? 'Comment posted!'
          : 'Comment submitted for moderation.',
        commentId: result.meta.last_row_id,
        status,
      },
      201,
      env
    );
  } catch (err) {
    console.error('Create comment error:', err);
    return jsonResponse({ success: false, error: 'Failed to create comment' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

// ── Helpers ──

async function hashValue(str) {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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