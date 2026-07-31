# HimVedi Herbals - Fresh Setup Files

## 📁 File Structure

```
himvedi-fresh-setup/
├── package.json              # Project dependencies
├── next.config.js            # Next.js configuration for Cloudflare Pages
├── tsconfig.json             # TypeScript configuration
├── wrangler.toml             # Cloudflare Pages config (D1 bindings managed via GUI)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with metadata
│   │   ├── page.tsx          # Homepage with product/blog integration
│   │   ├── globals.css       # Complete styling system
│   │   ├── blog/
│   │   │   └── page.tsx      # Blog listing page
│   │   └── products/
│   │       └── page.tsx      # Products catalog page
│   ├── components/
│   │   ├── index.ts          # Component exports
│   │   ├── ProductCard.tsx   # Product display component
│   │   ├── BlogPostCard.tsx  # Blog post component
│   │   ├── UserCard.tsx      # User display component
│   │   ├── Header.tsx        # Site header with navigation
│   │   └── Footer.tsx        # Site footer
│   └── lib/
│       └── api.ts            # API integration layer (connects to Worker)
└── README.md                 # This file
```

## 🔗 Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│  CLOUDFLARE PAGES   │  HTTP   │  CLOUDFLARE WORKER  │
│  (Frontend)         │ ──────► │  (Backend/API)      │
│                     │ ◄────── │                     │
│  • Next.js/React    │  JSON   │  • D1 Database      │
│  • Static Content   │         │  • DB = blog-db     │
│  • Public Site       │         │  • DB1 = users-db   │
└─────────────────────┘         └─────────────────────┘
```

## 🚀 Quick Start

### 1. Replace Your Repository Contents

**Files to DELETE from your existing repo:**
- `src/` folder (entire directory)
- `wrangler.toml`
- `package.json`
- `next.config.js`
- `tsconfig.json`
- Any other config files you want to replace

**Files to ADD from this package:**
- All files included in this ZIP/folder

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Worker URL

Edit `src/lib/api.ts` and update:
```typescript
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://YOUR-WORKER.workers.dev';
```

Or set environment variable in Cloudflare Dashboard.

### 4. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Deploy to Cloudflare Pages

Push to GitHub - auto-deployment will trigger!

## ⚙️ Configuration

### D1 Bindings (Cloudflare Dashboard)

Since we removed D1 config from `wrangler.toml`, configure bindings in GUI:

1. Go to **Cloudflare Dashboard**
2. Navigate to **Workers & Pages** → **himvedicherbals-api** (your Worker)
3. Click **Settings** → **Variables and Bindings**
4. Under **D1 Database Bindings**, add:

| Variable Name | Database | Purpose |
|---------------|----------|---------|
| `DB` | blog-db | Blog posts content |
| `DB1` | users-db | User data |

### Worker Code

Your Worker (`himvedicherbals-api`) should have this code:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/') {
      return Response.json({ 
        message: 'HimVedi Herbals API is running!',
        endpoints: ['/api/users', '/api/blog'],
        status: 'healthy'
      });
    }
    
    // Users endpoint (DB1 = users-db)
    if (url.pathname === '/api/users') {
      const { results } = await env.DB1.prepare('SELECT * FROM users').all();
      return Response.json(results);
    }
    
    // Blog endpoint (DB = blog-db)
    if (url.pathname === '/api/blog') {
      const { results } = await env.DB.prepare('SELECT * FROM posts').all();
      return Response.json(results);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

## 📝 Features Included

### ✅ Homepage
- Hero section with CTA
- Featured products grid (from Worker API or sample data)
- Latest blog posts preview
- Category navigation
- Newsletter signup
- Trust badges

### ✅ Products Page
- Product grid with filtering
- Search functionality
- Category tabs
- Sort options (price, name)
- Product cards with details
- Sample products as fallback when API offline

### ✅ Blog Page
- Blog post grid
- Category filtering
- Search functionality
- Featured post highlight
- Full post view support
- Sample posts as fallback when API offline

### ✅ Components
- **ProductCard**: Multiple variants (default, compact, featured)
- **BlogPostCard**: Multiple variants + full post view
- **UserCard**: Card + table views
- **Header**: Responsive navigation with mobile menu
- **Footer**: Multi-column layout with newsletter

### ✅ Styling System
- CSS Custom Properties (design tokens)
- Ayurvedic-inspired green color palette
- Fully responsive design
- Smooth animations and transitions
- Loading states and empty states

### ✅ API Integration
- Automatic health check on page load
- Graceful fallback to sample data when Worker is offline
- Type-safe API functions
- Error handling throughout

## 🎨 Design Tokens

```css
/* Primary Green */
--color-primary-600: #16a34a;  /* Main brand color */
--color-primary-700: #15803d;  /* Darker variant */

/* Accent Gold */
--color-accent-500: #f59e0b;   /* Highlights */

/* Typography */
--font-sans: 'Inter', sans-serif;
--font-serif: 'Playfair Display', serif;
```

## 🔧 Troubleshooting

### Issue: Products/Blog not loading
- Check Worker URL in `src/lib/api.ts`
- Verify Worker is deployed and running
- Check browser console for errors
- Ensure D1 bindings are configured correctly

### Issue: Styles not applying
- Ensure `globals.css` is imported in `layout.tsx`
- Clear browser cache
- Check for CSS compilation errors

### Issue: Build fails
- Run `npm install` to ensure dependencies
- Check TypeScript errors
- Verify Next.js configuration

## 📞 Support

For issues with this setup:
1. Check Cloudflare Workers/Pages logs
2. Verify D1 database tables exist
3. Confirm bindings are correct in Dashboard

---

**Built with ❤️ using Next.js + Cloudflare Pages + D1**
