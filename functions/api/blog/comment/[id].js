/**
 * PUT    /api/blog/comment/:id  — Moderate/update comment (admin only)
 * DELETE /api/blog/comment/:id  — Delete comment (admin or author)
 */

async function getAdminUser(env, request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  return await env.USERS_DB.prepare(
    'SELECT u.id, u.is_admin FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime(\'now\') AND u.is_active = 1'
  )
    .bind(token)
    .first();
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const commentId = params.id;

  try {
    // Admin check
    const user = await getAdminUser(env, request);
    if (!user || !user.is_admin) {
      return jsonResponse({ success: false, error: 'Admin access required' }, 403, env);
    }

    const body = await request.json();
    const { status, text } = body;

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return jsonResponse({ success: false, error: 'Invalid status value' }, 400, env);
    }

    // Build dynamic update
    const updates = [];
    const values = [];
    if (status) { updates.push('status = ?'); values.push(status); }
    if (text) { updates.push('text = ?'); values.push(text.trim()); }
    updates.push("updated_at = datetime('now')");

    if (updates.length <= 1) {
      return jsonResponse({ success: false, error: 'No fields to update' }, 400, env);
    }

    values.push(commentId);
    const result = await env.BLOG_DB.prepare(
      `UPDATE comments SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (result.meta.changes === 0) {
      return jsonResponse({ success: false, error: 'Comment not found' }, 404, env);
    }

    return jsonResponse({ success: true, message: 'Comment updated' }, 200, env);
  } catch (err) {
    console.error('Update comment error:', err);
    return jsonResponse({ success: false, error: 'Failed to update comment' }, 500, env);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const commentId = params.id;

  try {
    const user = await getAdminUser(env, request);
    if (!user) {
      return jsonResponse({ success: false, error: 'Authentication required' }, 401, env);
    }

    // Admin can delete any, regular user can only delete their own
    let query = 'DELETE FROM comments WHERE id = ?';
    const binds = [commentId];

    if (!user.is_admin) {
      query += ' AND user_id = ?';
      binds.push(user.id);
    }

    const result = await env.BLOG_DB.prepare(query).bind(...binds).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ success: false, error: 'Comment not found or not authorized' }, 404, env);
    }

    return jsonResponse({ success: true, message: 'Comment deleted' }, 200, env);
  } catch (err) {
    console.error('Delete comment error:', err);
    return jsonResponse({ success: false, error: 'Failed to delete comment' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
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