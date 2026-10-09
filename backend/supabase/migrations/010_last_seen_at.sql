-- Migration: 010_last_seen_at
-- Adds a server-side activity signal so "is anyone actually using Scout?" becomes answerable.
--
-- Context: before this, the app recorded NO activity. Login performed no write,
-- there were no sessions or page views, and user_shows.updated_at is overwritten
-- in place (so it shows only the last touch per row, never a history). That made
-- DAU/WAU and retention impossible to compute — even from raw SQL.
--
-- last_seen_at is written on every GET /api/auth/me, which the frontend calls on
-- app load. It therefore captures passive sessions (opening the app to check
-- what aired) that a write-based proxy misses entirely.
--
-- Note this still cannot reconstruct history retroactively — it starts producing
-- data from the moment it ships.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at);

-- Seed existing users so they aren't all indistinguishably NULL. created_at is
-- the only defensible starting point we have for them.
UPDATE users SET last_seen_at = created_at WHERE last_seen_at IS NULL;
