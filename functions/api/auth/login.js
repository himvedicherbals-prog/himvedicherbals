/**
 * POST /api/auth/login
 * Authenticate user against D1 and return session token
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { username, password } = body;

    // ── Validation ──
    if (!username || !password) {
      return jsonResponse({ success: false, error: 'Username and password are required' }, 400, env);
    }

    // ── Find user ──
    const user = await env.USERS_DB.prepare(
      'SELECT id, username, email, password_hash, salt, display_name, is_admin, is_active FROM users WHERE username = ? OR email = ?'
    )
      .bind(username.toLowerCase(), username.toLowerCase())
      .first();

    if (!user) {
      return jsonResponse({ success: false, error: 'Invalid credentials' }, 401, env);
    }

    if (!user.is_active) {
      return jsonResponse({ success: false, error: 'Account is disabled' }, 403, env);
    }

    // ── Verify password ──
    const saltBytes = new Uint8Array(
      user.salt.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );

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
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashHex = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (hashHex !== user.password_hash) {
      return jsonResponse({ success: false, error: 'Invalid credentials' }, 401, env);
    }

    // ── Create session ──
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const expiryDays = parseInt(env.SESSION_EXPIRY_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    await env.USERS_DB.prepare(
      'INSERT INTO sessions (user_id, token, user_agent, ip_hash, expires_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(
        user.id,
        token,
        request.headers.get('User-Agent') || null,
        await hashIp(request, env),
        expiresAt
      )
      .run();

    // ── Update last login ──
    await env.USERS_DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id)
      .run();

    return jsonResponse(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          isAdmin: user.is_admin === 1,
        },
        token,
        expiresIn: expiryDays,
      },
      200,
      env
    );
  } catch (err) {
    console.error('Login error:', err);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

// ── Helpers ──

async function hashIp(request, env) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(ip + (env.JWT_SECRET || 'salt')));
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
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