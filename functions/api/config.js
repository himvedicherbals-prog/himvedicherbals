/**
 * GET /api/config
 * Returns public site configuration for the frontend
 */

export async function onRequestGet(context) {
  const { env } = context;

  const config = {
    siteName: env.SITE_NAME || 'Trishanku Baba',
    siteTagline: env.SITE_TAGLINE || 'Premium Organic Gau Products & Medicinal Herbs',
    contactEmail: env.CONTACT_EMAIL || '',
    features: {
      auth: true,
      blogComments: true,
      blogLikes: true,
      contactForm: true,
    },
    version: '1.0.0',
  };

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    },
  });
}