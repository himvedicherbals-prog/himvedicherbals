/**
 * POST /api/auth/signup
 * 
 * Registers a new user account.
 * Uses USERS_DB (D1) for user storage.
 * First user with ADMIN_EMAIL automatically becomes admin.
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, email, password, displayName } = await request.json();
    
    // Validate required fields
    if (!username || !email || !password) {
      return new Response(JSON.stringify({
        error: 'Username, email, and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate username length
    if (username.length < 3 || username.length > 30) {
      return new Response(JSON.stringify({
        error: 'Username must be between 3 and 30 characters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({
        error: 'Password must be at least 8 characters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if username or email already exists
    const existingUser = await env.USERS_DB.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).bind(username, email).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({
        error: 'Username or email already exists'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if this should be admin user
    const isAdmin = email.toLowerCase() === (env.ADMIN_EMAIL || '').toLowerCase() || 
                    username.toLowerCase() === (env.ADMIN_USERNAME || '').toLowerCase();
    
    // Generate salt and hash password
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    
    // Insert user into database
    const result = await env.USERS_DB.prepare(`
      INSERT INTO users (username, email, password_hash, salt, display_name, is_admin)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(username, email, passwordHash, salt, displayName || '', isAdmin ? 1 : 0).run();
    
    if (!result.success) {
      throw new Error('Failed to create user');
    }
    
    // Generate session token for auto-login
    const token = generateToken();
    const expiresAt = new Date(Date.now() + (parseInt(env.SESSION_EXPIRY_DAYS) || 30) * 24 * 60 * 60 * 1000);
    
    // Store session
    await env.USERS_DB.prepare(`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES ((SELECT id FROM users WHERE username = ?), ?, ?)
    `).bind(username, token, expiresAt.toISOString()).run();
    
    console.log(`New user registered: ${username} (${email})${isAdmin ? ' [ADMIN]' : ''}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: isAdmin 
        ? 'Admin account created successfully!' 
        : 'Account created successfully!',
      user: {
        username,
        email,
        displayName: displayName || '',
        isAdmin
      },
      token,
      expiresIn: parseInt(env.SESSION_EXPIRY_DAYS) || 30 * 24 * 60 * 60
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    
    return new Response(JSON.stringify({
      error: 'Registration failed. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(salt + password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
