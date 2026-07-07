-- Migration: 009_beta_signups_rls
-- Fixes Supabase linter finding: "Table public.beta_signups is public, but RLS has not been enabled."
--
-- Context: RLS was originally disabled (and INSERT/SELECT granted to anon) so the
-- public beta-landing waitlist form could insert rows with the anon key. That grant
-- also meant ANYONE with the public anon key could read every waitlist name + email
-- through PostgREST — a PII exposure, not just a linter warning.
--
-- The public waitlist is now closed (beta-landing signup form removed; signups happen
-- via referral codes in the main app), so no anon access is needed at all.
--
-- After this migration: only the service role (backend) can read or write beta_signups.
-- Existing rows are retained — they are the seed list for referral-code invite emails.

ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- No policies are created intentionally: with RLS on and zero policies,
-- anon/authenticated get nothing. The service role bypasses RLS.

REVOKE INSERT, SELECT ON beta_signups FROM anon;
REVOKE INSERT, SELECT ON beta_signups FROM authenticated;

-- Drop the old permissive policies if they exist from the original setup
-- (they may or may not have been created depending on which setup path was run)
DROP POLICY IF EXISTS "Allow public inserts" ON beta_signups;
DROP POLICY IF EXISTS "Restrict reads to service role" ON beta_signups;
