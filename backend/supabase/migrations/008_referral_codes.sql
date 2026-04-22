-- Migration: 008_referral_codes
-- Replaces the admin-generated beta_invites system with per-user referral codes.
-- Each user gets a unique referral code generated at registration.
-- Referrals are tracked via referred_by_user_id on the users table.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users(id);

-- Backfill existing users who don't have a referral code yet
UPDATE users
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 1, 8))
WHERE referral_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_user_id);
