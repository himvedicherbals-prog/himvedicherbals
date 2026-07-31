/**
 * POST /api/auth/logout
 * Invalidate the current session token
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'No token provided' }, 401, env);
    }

    const token = authHeader.slice(7);

    // Delete the session
    const result = await env.USERS_DB.prepare('DELETE FROM sessions WHERE token = ?')
      .bind(token)
      .run();

    if (result.meta.changes > 0) {
      return jsonResponse({ success: true, message: 'Logged out successfully' }, 200, env);
    }

    // Token might have already expired — still return success
    return jsonResponse({ success: true, message: 'Logged out' }, 200, env);
  } catch (err) {
    console.error('Logout error:', err);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
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