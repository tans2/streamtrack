-- Add next episode air date columns to shows table for countdown display
ALTER TABLE shows
  ADD COLUMN IF NOT EXISTS next_air_date TEXT,
  ADD COLUMN IF NOT EXISTS next_episode_season INT,
  ADD COLUMN IF NOT EXISTS next_episode_number INT;
