# 🌿 Trishanku Baba - Cloudflare Pages + D1 Setup

Complete setup package for deploying **himvedicherbals** to Cloudflare Pages with **D1 databases** for blog and user management.

---

## 📦 What's Included

### ✅ Updated Files
| File | Description |
|------|-------------|
| `wrangler.toml` | Updated with D1 database bindings (BLOG_DB, USERS_DB) |
| `package.json` | New scripts for build, deploy, and database management |

### ✅ New Files
| File/Directory | Purpose |
|----------------|---------|
| `scripts/build.js` | Build script for Cloudflare Pages output |
| `scripts/init-databases.js` | Database initialization helper |
| `scripts/deploy.sh` | One-click deployment bash script |
| `functions/api/config.js` | Site configuration endpoint |
| `functions/api/inquiry.js` | Contact form handler |
| `functions/api/auth/login.js` | User login with D1 |
| `functions/api/auth/signup.js` | User registration with D1 |
| `functions/api/auth/logout.js` | Session invalidation |
| `functions/api/auth/me.js` | Current user info |
| `functions/api/blog/comment.js` | Blog comments CRUD |
| `functions/api/blog/comment/[id].js` | Comment moderation |
| `functions/api/blog/like.js` | Post like/unlike toggle |
| `functions/api/blog/views.js` | View tracking |
| `blog-schema.sql` | Blog D1 database schema |
| `users-schema.sql` | Users D1 database schema |

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account: `wrangler login`

### Step 1: Replace Your Existing Files

Copy all files from this package to your repository root, replacing existing files:
- `wrangler.toml` → replace existing
- `package.json` → replace existing
- `blog-schema.sql` → add if not exists
- `users-schema.sql` → add if not exists
- `functions/` → merge with existing (new files added)
- `scripts/` → new directory

### Step 2: Install Dependencies & Build

```bash
npm install
npm run build
```

### Step 3: Initialize D1 Databases

```bash
# Option A: Use the helper script
node scripts/init-databases.js

# Option B: Manual commands
wrangler d1 create blog-db      # Note the database_id!
wrangler d1 create users-db     # Note the database_id!

# Apply schemas
wrangler d1 execute blog-db --file=./blog-schema.sql --remote
wrangler d1 execute users-db --file=./users-schema.sql --remote
```

**⚠️ CRITICAL:** Copy the `database_id` values from the output and update them in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "BLOG_DB"
database_name = "blog-db"
database_id = "PASTE_YOUR_BLOG_DB_ID_HERE"  # ← Update this!

[[d1_databases]]
binding = "USERS_DB"
database_name = "users-db"
database_id = "PASTE_YOUR_USERS_DB_ID_HERE"  # ← Update this!
```

### Step 4: Deploy

```bash
# Build + Deploy in one command
npm run deploy

# Or use the bash script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## 🗄️ Database Architecture

### users-db (D1)
```
┌─────────────────────────────────────────┐
│                  users                   │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ username (UNIQUE)                       │
│ email (UNIQUE)                          │
│ password_hash                           │
│ salt                                    │
│ display_name                            │
│ is_admin                                │
│ created_at                              │
└─────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────┐
│                sessions                 │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ user_id (FK → users.id)                 │
│ token (UNIQUE)                          │
│ expires_at                              │
└─────────────────────────────────────────┘
```

### blog-db (D1)
```
┌─────────────────────────────────────────┐
│                comments                 │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ post_slug                               │
│ user_id (FK → users.id)                 │
│ text                                    │
│ parent_id (self-referencing FK)         │
│ status (pending/approved/rejected)      │
│ ip_hash                                 │
└─────────────────────────────────────────┘
           │
           ├──────────────┬──────────────┐
           ▼              ▼              ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │post_likes  │ │comment_    │ │post_views  │
    │            │ │reactions   │ │            │
    └────────────┘ └────────────┘ └────────────┘
```

---

## 🔌 API Endpoints

### Authentication (uses USERS_DB)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, get JWT token |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Get current user info |

### Blog (uses BLOG_DB)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blog/comment?post_slug=xxx` | List comments for post |
| POST | `/api/blog/comment` | Create new comment |
| PUT | `/api/blog/comment/:id` | Moderate/edit comment |
| DELETE | `/api/blog/comment/:id` | Delete comment |
| POST | `/api/blog/like` | Toggle post like |
| POST | `/api/blog/views` | Track page view |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get site configuration |
| POST | `/api/inquiry` | Submit contact form |

---

## ⚙️ Environment Variables

Set these in your `wrangler.toml` or Cloudflare Dashboard:

```toml
[vars]
# Required
SITE_NAME = "Trishanku Baba"
CONTACT_EMAIL = "your@email.com"
JWT_SECRET = "change-this-to-a-random-32+char-string"

# Optional
ADMIN_EMAIL = "admin@yourdomain.com"  # First signup becomes admin
SESSION_EXPIRY_DAYS = "30"
BCRYPT_ROUNDS = "10"
CORS_ORIGIN = "*"
```

---

## 🔒 Security Notes

1. **Change JWT_SECRET**: Always use a unique, random secret in production
2. **HTTPS Only**: Cloudflare Pages enforces HTTPS automatically
3. **Rate Limiting**: Configure rate limits in Cloudflare Dashboard
4. **Password Hashing**: Uses PBKDF2 with SHA-256 (100k iterations)
5. **Session Tokens**: 32-byte cryptographically secure random tokens

---

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Local development server on port 8788

# Building
npm run build            # Production build to dist/
npm run build:prod       # Production build with NODE_ENV=production

# Deployment
npm run deploy           # Build + Deploy to production
npm run deploy:preview   # Deploy to preview branch

# Database Management
npm run db:init          # Initialize both databases
npm run db:migrate:all   # Run all migrations
npm run db:migrate:blog  # Migrate only blog-db
npm run db:migrate:users # Migrate only users-db

# Utilities
npm run clean            # Remove dist/ and .wrangler/
```

---

## 📁 Project Structure After Setup

```
himvedicherbals/
├── index.html              # Your main SPA (keep as-is)
├── wrangler.toml           # ✅ UPDATED - With D1 bindings
├── package.json            # ✅ UPDATED - New scripts
├── blog-schema.sql         # ✅ NEW - Blog DB schema
├── users-schema.sql        # ✅ NEW - Users DB schema
│
├── css/, js/, images/      # Static assets (keep as-is)
├── data/                   # JSON data files (keep as-is)
│
├── functions/api/          # ✅ UPDATED - Cloudflare Functions
│   ├── config.js
│   ├── inquiry.js
│   ├── auth/
│   │   ├── login.js        # ✅ NEW - With D1 integration
│   │   ├── signup.js       # ✅ NEW - With D1 integration
│   │   ├── logout.js       # ✅ NEW - With D1 integration
│   │   └── me.js           # ✅ NEW - With D1 integration
│   └── blog/
│       ├── comment.js      # ✅ NEW - With D1 integration
│       ├── comment/
│       │   └── [id].js     # ✅ NEW - Moderation endpoints
│       ├── like.js         # ✅ NEW - With D1 integration
│       └── views.js        # ✅ NEW - With D1 integration
│
├── scripts/                # ✅ NEW DIRECTORY
│   ├── build.js            # Build script
│   ├── init-databases.js   # DB initialization helper
│   └── deploy.sh           # One-click deployment
│
├── _headers, _redirects    # Keep as-is
└── robots.txt              # Keep as-is
```

---

## ❓ Troubleshooting

### "D1 database not found"
→ Run `node scripts/init-databases.js` first, then copy IDs to wrangler.toml

### "Binding error" during deployment
→ Ensure database IDs are correctly set in wrangler.toml

### "Build failed" 
→ Check Node.js version is 18+: `node --version`

### Functions not working after deployment
→ Verify functions/ directory exists in dist/ after build

---

## 📞 Support

For issues or questions:
1. Check Cloudflare Dashboard logs
2. Review function console.log outputs
3. Test locally: `npm run dev`

---

**Built with ❤️ using Cloudflare Pages + Workers + D1**
