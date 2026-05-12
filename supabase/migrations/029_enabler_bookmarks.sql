CREATE TABLE enabler_bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, enabler_id)
);

CREATE INDEX idx_enabler_bookmarks_user ON enabler_bookmarks(user_id, created_at DESC);

ALTER TABLE enabler_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_own_all" ON enabler_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
