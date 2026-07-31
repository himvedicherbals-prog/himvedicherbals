/**
 * POST /api/auth/signup
 * Register a new user with D1
 * Password hashed with PBKDF2-SHA256 (100k iterations)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { username, email, password, displayName } = body;

    // ── Validation ──
    const errors = [];
    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 30) {
      errors.push('Username must be 3-30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email is required');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (errors.length > 0) {
      return jsonResponse({ success: false, errors }, 400, env);
    }

    // ── Check if user already exists ──
    const existingUser = await env.USERS_DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    )
      .bind(username.toLowerCase(), email.toLowerCase())
      .first();

    if (existingUser) {
      return jsonResponse(
        { success: false, error: 'Username or email already registered' },
        409,
        env
      );
    }

    // ── Hash password with PBKDF2 ──
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashHex = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // ── Determine if first user = admin ──
    const userCount = await env.USERS_DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const isAdmin = userCount.count === 0 ? 1 : 0;

    // ── Insert user ──
    const result = await env.USERS_DB.prepare(
      'INSERT INTO users (username, email, password_hash, salt, display_name, is_admin) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(
        username.toLowerCase(),
        email.toLowerCase(),
        hashHex,
        saltHex,
        displayName?.trim() || username.trim(),
        isAdmin
      )
      .run();

    const userId = result.meta.last_row_id;

    // ── Create session ──
    const session = await createSession(env.USERS_DB, userId, request);

    return jsonResponse(
      {
        success: true,
        message: isAdmin ? 'Admin account created successfully!' : 'Account created successfully!',
        user: {
          id: userId,
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          displayName: displayName?.trim() || username.trim(),
          isAdmin: isAdmin === 1,
        },
        token: session.token,
        expiresIn: getSessionExpiryDays(env),
      },
      201,
      env
    );
  } catch (err) {
    console.error('Signup error:', err);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

// ── Helpers ──

async function createSession(db, userId, request) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const expiryDays = 30;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  await db.prepare(
    'INSERT INTO sessions (user_id, token, user_agent, expires_at) VALUES (?, ?, ?, ?)'
  )
    .bind(userId, token, request.headers.get('User-Agent') || null, expiresAt)
    .run();

  return { token, expiresAt };
}

function getSessionExpiryDays(env) {
  return parseInt(env.SESSION_EXPIRY_DAYS || '30', 10);
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