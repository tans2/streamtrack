-- Migration: 007_picks
-- Creates the picks table for the social discovery "Picks" feature.
-- Users can pick any show they have completed, with an optional short note.
-- The social graph is derived from existing watch_group_members — if two users
-- share any group, they can see each other's picks.

CREATE TABLE IF NOT EXISTS picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, show_id)
);

CREATE INDEX IF NOT EXISTS idx_picks_user_id ON picks(user_id);
CREATE INDEX IF NOT EXISTS idx_picks_show_id ON picks(show_id);
