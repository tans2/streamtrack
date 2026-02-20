-- Migration: 003_add_providers_to_events.sql
-- Purpose: Add streaming provider information to notification events
-- Run in Supabase SQL Editor

-- Add providers column to pending_notification_events
ALTER TABLE pending_notification_events
  ADD COLUMN IF NOT EXISTS providers TEXT;

-- Comment for clarity
COMMENT ON COLUMN pending_notification_events.providers IS 'Comma-separated list of streaming platform names where the episode is available';
