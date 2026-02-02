-- Notification System Migration for Scout
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. Episode Cache Table
-- Tracks known episodes to detect new ones
-- =====================================================
CREATE TABLE IF NOT EXISTS episode_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT,
  air_date DATE,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate episodes
  CONSTRAINT unique_episode UNIQUE (show_id, season_number, episode_number)
);

-- Indexes for episode_cache
CREATE INDEX IF NOT EXISTS idx_episode_cache_show_id ON episode_cache(show_id);
CREATE INDEX IF NOT EXISTS idx_episode_cache_tmdb_id ON episode_cache(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_episode_cache_air_date ON episode_cache(air_date);
CREATE INDEX IF NOT EXISTS idx_episode_cache_first_seen ON episode_cache(first_seen_at);

COMMENT ON TABLE episode_cache IS 'Caches episodes from TMDB to detect new releases';

-- =====================================================
-- 2. Notification Log Table
-- Prevents duplicate notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_episode', 'season_premiere')),
  season_number INTEGER,
  episode_number INTEGER,
  email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resend_message_id TEXT,

  -- Prevent duplicate notifications for same episode
  CONSTRAINT unique_notification UNIQUE (user_id, show_id, notification_type, season_number, episode_number)
);

-- Indexes for notification_log
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_show_id ON notification_log(show_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(email_sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);

COMMENT ON TABLE notification_log IS 'Tracks sent notifications to prevent duplicates';

-- =====================================================
-- 3. Episode Poll Status Table
-- Tracks TMDB polling per show
-- =====================================================
CREATE TABLE IF NOT EXISTS episode_poll_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE UNIQUE,
  tmdb_id INTEGER NOT NULL,
  last_polled_at TIMESTAMP WITH TIME ZONE,
  last_known_season INTEGER DEFAULT 0,
  last_known_episode INTEGER DEFAULT 0,
  next_poll_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_count INTEGER DEFAULT 0,
  last_error TEXT,

  CONSTRAINT unique_poll_status UNIQUE (tmdb_id)
);

-- Indexes for episode_poll_status
CREATE INDEX IF NOT EXISTS idx_poll_status_next_poll ON episode_poll_status(next_poll_at);
CREATE INDEX IF NOT EXISTS idx_poll_status_tmdb_id ON episode_poll_status(tmdb_id);

COMMENT ON TABLE episode_poll_status IS 'Tracks TMDB polling schedule per show';

-- =====================================================
-- 4. Modify Users Table
-- Add email verification fields
-- =====================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Index for verification token lookup
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(email_verification_token)
  WHERE email_verification_token IS NOT NULL;

COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token sent via email for verification';

-- =====================================================
-- 5. Modify User Shows Table
-- Add per-show notification toggle
-- =====================================================
ALTER TABLE user_shows
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN user_shows.notifications_enabled IS 'Per-show notification toggle';

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Episode Cache (service role only for writes, authenticated can read their tracked shows)
ALTER TABLE episode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to episode_cache" ON episode_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Notification Log (users can only see their own notifications)
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notification_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to notification_log" ON notification_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Episode Poll Status (service role only)
ALTER TABLE episode_poll_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to episode_poll_status" ON episode_poll_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT SELECT ON episode_cache TO authenticated;
GRANT SELECT ON notification_log TO authenticated;
GRANT ALL ON episode_cache TO service_role;
GRANT ALL ON notification_log TO service_role;
GRANT ALL ON episode_poll_status TO service_role;
