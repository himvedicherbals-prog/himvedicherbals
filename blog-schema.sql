-- ============================================
-- Blog Database Schema (blog-db)
-- Cloudflare D1 Database
-- For himvedicherbals (Trishanku Baba)
-- ============================================

-- Enable WAL mode for better performance
PRAGMA journal_mode = WAL;

-- Comments table for blog posts
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  user_id INTEGER,
  text TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Create index for faster comment lookups by post
CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Comment reactions (like/dislike)
CREATE TABLE IF NOT EXISTS comment_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER,
  reaction_type TEXT NOT NULL CHECK(reaction_type IN ('like', 'dislike')),
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  UNIQUE(comment_id, user_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  user_id INTEGER,
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(post_slug, user_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_slug ON post_likes(post_slug);

-- Post view tracking
CREATE TABLE IF NOT EXISTS post_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_post_views_slug ON post_views(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_views_date ON post_views(created_at);

-- Insert default admin comment if not exists (for testing)
INSERT OR IGNORE INTO comments (post_slug, text, status, created_at) 
VALUES 
  ('welcome', 'Welcome to Trishanku Baba blog! This is a sample comment.', 'approved', datetime('now'));
