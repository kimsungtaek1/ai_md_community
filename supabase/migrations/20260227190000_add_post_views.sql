CREATE TABLE IF NOT EXISTS post_views (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewer_id TEXT,
  user_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  locale TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id_created_at ON post_views(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_post_id_viewer_id ON post_views(post_id, viewer_id);
