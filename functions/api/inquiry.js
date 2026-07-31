/**
 * POST /api/inquiry
 * 
 * Handles contact form submissions.
 * Validates input and returns success/error response.
 * This endpoint doesn't use any database (could optionally store in D1).
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Parse form data
    const data = await request.json();
    
    // Validate required fields
    const { name, email, phone, subject, message } = data;
    
    if (!name || !email || !message) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: name, email, and message are required'
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
    
    // Here you could:
    // 1. Send email via Cloudflare Email Workers
    // 2. Store in D1 database for records
    // 3. Send to external CRM
    
    // Log the inquiry (for debugging - remove in production)
    console.log('New inquiry:', {
      name,
      email,
      phone: phone || '',
      subject: subject || '',
      message,
      timestamp: new Date().toISOString()
    });
    
    // Success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Inquiry submitted successfully! We will contact you soon.',
      inquiryId: `inq_${Date.now()}`
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' // Don't cache POST responses
      }
    });
    
  } catch (error) {
    console.error('Inquiry processing error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to process inquiry. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
