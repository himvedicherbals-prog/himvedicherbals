/**
 * POST /api/auth/login
 * 
 * Authenticates a user with username/email and password.
 * Uses USERS_DB (D1) for credential verification.
 * Returns JWT token on success.
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();
    
    // Validate input
    if (!username || !password) {
      return new Response(JSON.stringify({
        error: 'Username and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Look up user in database
    const userQuery = `
      SELECT id, username, email, password_hash, salt, display_name, is_admin 
      FROM users 
      WHERE username = ? OR email = ?
      LIMIT 1
    `;
    
    const result = await env.USERS_DB.prepare(userQuery)
      .bind(username, username)
      .first();
    
    if (!result) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify password (using simple hash comparison - use bcrypt in production)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(result.salt + password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(result.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      cryptoKey,
      256
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (computedHash !== result.password_hash) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + (parseInt(env.SESSION_EXPIRY_DAYS) || 30) * 24 * 60 * 60 * 1000);
    
    // Store session in database
    await env.USERS_DB.prepare(`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(result.id, token, expiresAt.toISOString()).run();
    
    // Return user data and token
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: result.id,
        username: result.username,
        email: result.email,
        displayName: result.display_name,
        isAdmin: result.is_admin === 1
      },
      token,
      expiresIn: parseInt(env.SESSION_EXPIRY_DAYS) || 30 * 24 * 60 * 60
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(JSON.stringify({
      error: 'Login failed. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}
