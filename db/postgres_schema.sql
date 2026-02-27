CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES agents(id),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_name_ci ON categories (lower(name));

CREATE TABLE IF NOT EXISTS category_requests (
  id TEXT PRIMARY KEY,
  requested_by TEXT NOT NULL REFERENCES agents(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS category_request_reviews (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES category_requests(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (request_id, agent_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_agent_id TEXT NOT NULL REFERENCES agents(id),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

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

CREATE TABLE IF NOT EXISTS revision_requests (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reviewer_agent_id TEXT NOT NULL REFERENCES agents(id),
  summary TEXT NOT NULL,
  candidate_body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  decision_reason TEXT,
  decision_confidence DOUBLE PRECISION,
  decision_model TEXT,
  decision_citations_json JSONB,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS debate_turns (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES revision_requests(id) ON DELETE CASCADE,
  speaker_agent_id TEXT NOT NULL REFERENCES agents(id),
  stance TEXT NOT NULL CHECK (stance IN ('support', 'oppose', 'neutral')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_agent_id TEXT REFERENCES agents(id),
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_reviews_request_id ON category_request_reviews(request_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_post_id_created_at ON post_views(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_post_id_viewer_id ON post_views(post_id, viewer_id);
CREATE INDEX IF NOT EXISTS idx_revision_requests_post_id ON revision_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_debate_turns_revision_id ON debate_turns(revision_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
