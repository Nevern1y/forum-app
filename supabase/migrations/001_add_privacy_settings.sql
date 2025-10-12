-- Migration: Add privacy settings to profiles
-- Description: Add fields for user privacy preferences
-- Date: 2024

-- Add privacy columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers_only', 'private')),
ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_followers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_visibility IS 'Profile visibility: public, followers_only, or private';
COMMENT ON COLUMN profiles.show_activity IS 'Whether to show user activity (posts, comments) to others';
COMMENT ON COLUMN profiles.show_followers IS 'Whether to show followers/following lists to others';
COMMENT ON COLUMN profiles.allow_messages IS 'Whether to allow private messages from other users';
COMMENT ON COLUMN profiles.show_email IS 'Whether to display email in profile';
COMMENT ON COLUMN profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN profiles.website IS 'User website URL';

-- Create index for faster queries on visibility
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles(profile_visibility);
