-- Migration: 002_daily_digest.sql
-- Purpose: Support daily digest notification system
-- Run in Supabase SQL Editor

-- =============================================
-- 1. New table: pending_notification_events
-- Queues notification events for daily digest aggregation
-- =============================================
CREATE TABLE IF NOT EXISTS pending_notification_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'new_episode', 'season_premiere', 'show_premiere', 'upcoming_release'
  )),
  season_number INTEGER,
  episode_number INTEGER,
  episode_title TEXT,
  air_date DATE,
  poster_path TEXT,
  show_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  digest_id UUID,
  CONSTRAINT unique_pending_event UNIQUE (user_id, show_id, event_type, season_number, episode_number)
);

-- Index for fetching unprocessed events per user
CREATE INDEX IF NOT EXISTS idx_pending_events_user_pending
  ON pending_notification_events(user_id)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pending_events_created
  ON pending_notification_events(created_at);

-- =============================================
-- 2. New table: digest_log
-- Tracks daily digest emails sent per user
-- =============================================
CREATE TABLE IF NOT EXISTS digest_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_count INTEGER NOT NULL DEFAULT 0,
  resend_message_id TEXT,
  digest_date DATE NOT NULL,
  CONSTRAINT unique_daily_digest UNIQUE (user_id, digest_date)
);

CREATE INDEX IF NOT EXISTS idx_digest_log_user ON digest_log(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_log_date ON digest_log(digest_date);

-- =============================================
-- 3. Expand notification_log constraint
-- Allow new notification types
-- =============================================
ALTER TABLE notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;

ALTER TABLE notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN (
    'new_episode', 'season_premiere', 'show_premiere',
    'upcoming_release', 'daily_digest'
  ));

-- =============================================
-- 4. Row Level Security for new tables
-- =============================================

-- pending_notification_events: service role only
ALTER TABLE pending_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to pending_notification_events"
  ON pending_notification_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT ALL ON pending_notification_events TO service_role;

-- digest_log: service role full access, users can view own
ALTER TABLE digest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to digest_log"
  ON digest_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own digests"
  ON digest_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON digest_log TO authenticated;
GRANT ALL ON digest_log TO service_role;
