CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL CHECK (length(nickname) BETWEEN 2 AND 20),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 2 AND 300),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  approved_at INTEGER,
  moderation_reason TEXT
);

CREATE INDEX idx_messages_status_created
ON messages(status, created_at DESC, id DESC);

CREATE INDEX idx_messages_ip_created
ON messages(ip_hash, created_at DESC);

CREATE TABLE daily_visitors (
  visit_date TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 1 CHECK (page_views >= 1),
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (visit_date, visitor_hash)
);

CREATE INDEX idx_daily_visitors_date
ON daily_visitors(visit_date);

PRAGMA optimize;
