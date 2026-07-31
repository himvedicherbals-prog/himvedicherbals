/**
 * POST /api/inquiry
 * Handles contact form submissions
 * In production, integrate with email service (SendGrid, Mailgun, etc.)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders(env),
    });
  }

  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validation
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email is required');
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      errors.push('Message must be at least 10 characters');
    }

    if (errors.length > 0) {
      return jsonResponse({ success: false, errors }, 400, env);
    }

    // Log the inquiry (in production, send email / store in D1 / etc.)
    console.log('📩 New inquiry received:', {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || 'N/A',
      subject: subject?.trim() || 'General Inquiry',
      messageLength: message.trim().length,
      timestamp: new Date().toISOString(),
    });

    // Optional: Store in a D1 table if you create one
    // await env.BLOG_DB.prepare(
    //   'INSERT INTO inquiries (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    // ).bind(name.trim(), email.trim(), phone?.trim() || null, subject?.trim() || null, message.trim(), new Date().toISOString()).run();

    return jsonResponse(
      {
        success: true,
        message: 'Thank you for your inquiry! We will get back to you soon.',
      },
      200,
      env
    );
  } catch (err) {
    console.error('Inquiry error:', err);
    return jsonResponse({ success: false, error: 'Invalid request body' }, 400, env);
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders(context.env) });
}

function corsHeaders(env) {
  const origin = env.CORS_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    },
  });
}