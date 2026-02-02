-- Create beta_signups table for Scout beta landing page
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  invited BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);

-- Create index on signed_up_at for sorting
CREATE INDEX IF NOT EXISTS idx_beta_signups_signed_up_at ON beta_signups(signed_up_at);

-- Enable Row Level Security
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated and anonymous users
-- (since this is a public signup form)
CREATE POLICY "Allow public inserts" ON beta_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to prevent public reads (only service role can read)
-- You can adjust this if you want authenticated users to see signups
CREATE POLICY "Restrict reads to service role" ON beta_signups
  FOR SELECT
  TO authenticated
  USING (false);

-- Grant necessary permissions
GRANT INSERT ON beta_signups TO anon;
GRANT INSERT ON beta_signups TO authenticated;

-- Comment on table
COMMENT ON TABLE beta_signups IS 'Stores email signups for Scout private beta';
COMMENT ON COLUMN beta_signups.invited IS 'Whether this user has been invited to the beta';
COMMENT ON COLUMN beta_signups.invited_at IS 'When the user was invited to the beta';





