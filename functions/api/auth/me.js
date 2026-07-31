/**
 * GET /api/auth/me
 * 
 * Returns current authenticated user information.
 * Uses USERS_DB (D1) for session and user lookup.
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'No authentication token provided'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Look up session in database
    const session = await env.USERS_DB.prepare(`
      SELECT s.user_id, s.expires_at, u.id, u.username, u.email, u.display_name, u.is_admin, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).bind(token).first();
    
    if (!session) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await env.USERS_DB.prepare(`
        DELETE FROM sessions WHERE token = ?
      `).bind(token).run();
      
      return new Response(JSON.stringify({
        error: 'Session expired. Please login again.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return user data
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: session.id,
        username: session.username,
        email: session.email,
        displayName: session.display_name,
        isAdmin: session.is_admin === 1,
        createdAt: session.created_at
      },
      sessionExpiresAt: session.expires_at
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Auth me error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to get user information.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
