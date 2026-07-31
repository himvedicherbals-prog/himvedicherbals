/**
 * GET /api/auth/me
 * Return current user info from session token
 */

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'Not authenticated' }, 401, env);
    }

    const token = authHeader.slice(7);

    // Find valid session
    const session = await env.USERS_DB.prepare(
      'SELECT s.id, s.user_id, s.expires_at, u.username, u.email, u.display_name, u.is_admin, u.created_at ' +
      'FROM sessions s JOIN users u ON s.user_id = u.id ' +
      'WHERE s.token = ? AND s.expires_at > datetime(\'now\') AND u.is_active = 1'
    )
      .bind(token)
      .first();

    if (!session) {
      // Clean up expired session
      await env.USERS_DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return jsonResponse({ success: false, error: 'Session expired' }, 401, env);
    }

    return jsonResponse(
      {
        success: true,
        user: {
          id: session.user_id,
          username: session.username,
          email: session.email,
          displayName: session.display_name,
          isAdmin: session.is_admin === 1,
          memberSince: session.created_at,
        },
      },
      200,
      env
    );
  } catch (err) {
    console.error('Me error:', err);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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