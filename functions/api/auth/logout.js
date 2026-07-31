/**
 * POST /api/auth/logout
 * 
 * Invalidates user session by removing token from database.
 * Uses USERS_DB (D1) for session management.
 */

export async function onRequestPost(context) {
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
    
    // Delete session from database
    const result = await env.USERS_DB.prepare(`
      DELETE FROM sessions WHERE token = ?
    `).bind(token).run();
    
    if (result.meta.changes > 0) {
      console.log('User logged out successfully');
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    } else {
      // Token might already be invalid, but that's okay
      return new Response(JSON.stringify({
        success: true,
        message: 'Session ended'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Logout error:', error);
    
    return new Response(JSON.stringify({
      error: 'Logout failed. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
