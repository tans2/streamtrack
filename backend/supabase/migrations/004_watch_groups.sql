-- Migration: 004_watch_groups.sql
-- Purpose: Watch Groups feature - show-specific groups for tracking progress with friends
-- Run in Supabase SQL Editor

-- =============================================
-- 1. New table: watch_groups
-- One group = one show. Creator is admin.
-- =============================================
CREATE TABLE IF NOT EXISTS watch_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watch_groups_show ON watch_groups(show_id);
CREATE INDEX IF NOT EXISTS idx_watch_groups_created_by ON watch_groups(created_by);

-- =============================================
-- 2. New table: watch_group_members
-- Junction table: group <-> user membership
-- =============================================
CREATE TABLE IF NOT EXISTS watch_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES watch_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON watch_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON watch_group_members(user_id);

-- =============================================
-- 3. Expand event type constraint for group progress notifications
-- =============================================
ALTER TABLE pending_notification_events
  DROP CONSTRAINT IF EXISTS pending_notification_events_event_type_check;

ALTER TABLE pending_notification_events
  ADD CONSTRAINT pending_notification_events_event_type_check
  CHECK (event_type IN (
    'new_episode', 'season_premiere', 'show_premiere',
    'upcoming_release', 'group_progress_update'
  ));

-- =============================================
-- 4. Row Level Security
-- =============================================

-- watch_groups: service role full access, users can view groups they belong to
ALTER TABLE watch_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to watch_groups" ON watch_groups;
CREATE POLICY "Service role full access to watch_groups"
  ON watch_groups FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view groups they belong to" ON watch_groups;
CREATE POLICY "Users can view groups they belong to"
  ON watch_groups FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT group_id FROM watch_group_members WHERE user_id = auth.uid()
    )
  );

GRANT ALL ON watch_groups TO service_role;
GRANT SELECT ON watch_groups TO authenticated;

-- watch_group_members: service role full access, users can view members of their groups
ALTER TABLE watch_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to watch_group_members" ON watch_group_members;
CREATE POLICY "Service role full access to watch_group_members"
  ON watch_group_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view members of their groups" ON watch_group_members;
CREATE POLICY "Users can view members of their groups"
  ON watch_group_members FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM watch_group_members WHERE user_id = auth.uid()
    )
  );

GRANT ALL ON watch_group_members TO service_role;
GRANT SELECT ON watch_group_members TO authenticated;
