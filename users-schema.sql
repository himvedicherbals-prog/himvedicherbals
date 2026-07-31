-- ============================================
-- Users Database Schema (users-db)
-- Cloudflare D1 Database
-- For himvedicherbals (Trishanku Baba)
-- ============================================

-- Enable WAL mode for better performance
PRAGMA journal_mode = WAL;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  is_admin INTEGER DEFAULT 0 CHECK(is_admin IN (0, 1)),
  is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Sessions table for token-based authentication
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT DEFAULT (datetime('now', '+30 days')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Password reset tokens (optional feature)
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  used INTEGER DEFAULT 0,
  expires_at TEXT DEFAULT (datetime('now', '+1 hour')),
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

-- User preferences/settings (optional)
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  email_notifications INTEGER DEFAULT 1,
  newsletter_subscribed INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'light',
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)
);

-- Note: The first user to sign up with ADMIN_EMAIL will automatically become admin.
-- This is handled in the signup function logic, not in the database schema.

-- View for active users with session count
CREATE VIEW IF NOT EXISTS v_active_users AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.display_name,
  u.is_admin,
  u.created_at,
  COUNT(s.id) as active_sessions
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id AND s.expires_at > datetime('now')
WHERE u.is_active = 1
GROUP BY u.id;
