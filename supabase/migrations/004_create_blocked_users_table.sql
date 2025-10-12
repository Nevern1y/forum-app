-- Migration: Create user blocking system
-- Description: Allow users to block other users
-- Date: 2024

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

-- Add comments for documentation
COMMENT ON TABLE blocked_users IS 'User blocking relationships';
COMMENT ON COLUMN blocked_users.blocker_id IS 'User who is blocking';
COMMENT ON COLUMN blocked_users.blocked_id IS 'User who is being blocked';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_pair ON blocked_users(blocker_id, blocked_id);

-- Enable Row Level Security
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can block other users
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

-- Policy: Users can unblock others
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Policy: Users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
