/**
 * GET /api/config
 * 
 * Returns site configuration from environment variables.
 * This endpoint doesn't use any database.
 */

export async function onRequestGet(context) {
  const { env } = context;
  
  const config = {
    site: {
      name: env.SITE_NAME || 'Trishanku Baba',
      tagline: env.SITE_TAGLINE || '',
      copyright: env.SITE_COPYRIGHT || ''
    },
    contact: {
      email: env.CONTACT_EMAIL || '',
      phone: env.CONTACT_PHONE || ''
    },
    location: {
      city: env.ADDRESS_CITY || '',
      province: env.ADDRESS_PROVINCE || '',
      country: env.ADDRESS_COUNTRY || ''
    },
    currency: {
      default: env.DEFAULT_CURRENCY || 'USD',
      exchangeRateToNPR: parseFloat(env.EXCHANGE_RATE_TO_NPR) || 133.50
    },
    features: {
      authEnabled: true,
      blogComments: true,
      shoppingCart: true
    }
  };
  
  return new Response(JSON.stringify(config, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    }
  });
}
