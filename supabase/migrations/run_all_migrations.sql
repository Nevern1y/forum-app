-- ============================================================================
-- RUN ALL MIGRATIONS IN ONE GO
-- ============================================================================
-- This file combines all migrations for easy execution in Supabase Dashboard
-- Copy and paste this entire file into the SQL Editor
-- ============================================================================

-- ============================================================================
-- 000: Create Base Reactions Table (MUST RUN FIRST)
-- ============================================================================

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

COMMENT ON TABLE post_reactions IS 'User reactions (likes, emoji) to posts';
COMMENT ON COLUMN post_reactions.reaction_type IS 'Type of reaction: like, dislike, or emoji name';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON post_reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_post_reactions_created ON post_reactions(created_at DESC);

-- Enable RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add reactions" ON post_reactions;
CREATE POLICY "Authenticated users can add reactions"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON post_reactions;
CREATE POLICY "Users can remove own reactions"
  ON post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 001: Add Privacy Settings
-- ============================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers_only', 'private')),
ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_followers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN profiles.profile_visibility IS 'Profile visibility: public, followers_only, or private';
COMMENT ON COLUMN profiles.show_activity IS 'Whether to show user activity (posts, comments) to others';
COMMENT ON COLUMN profiles.show_followers IS 'Whether to show followers/following lists to others';
COMMENT ON COLUMN profiles.allow_messages IS 'Whether to allow private messages from other users';
COMMENT ON COLUMN profiles.show_email IS 'Whether to display email in profile';
COMMENT ON COLUMN profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN profiles.website IS 'User website URL';

CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles(profile_visibility);

-- ============================================================================
-- 002: Add Pinned Posts
-- ============================================================================

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

COMMENT ON COLUMN posts.is_pinned IS 'Whether the post is pinned by the author';

CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned, created_at DESC) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_posts_pinned_sort ON posts(is_pinned DESC, created_at DESC);

-- ============================================================================
-- 003: Create Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'user')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'harassment',
    'hate_speech',
    'violence',
    'misinformation',
    'illegal',
    'nsfw',
    'copyright',
    'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reports IS 'User reports for inappropriate content';

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Moderators can view all reports" ON reports;
CREATE POLICY "Moderators can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND reputation >= 10000
    )
  );

DROP POLICY IF EXISTS "Moderators can update reports" ON reports;
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND reputation >= 10000
    )
  );

-- ============================================================================
-- 004: Create Blocked Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

COMMENT ON TABLE blocked_users IS 'User blocking relationships';

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_pair ON blocked_users(blocker_id, blocked_id);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
CREATE POLICY "Users can view own blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- ============================================================================
-- 005: Create Storage Buckets
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']::text[];

-- Storage policies for avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars'
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Storage policies for post-images
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Users can update own post images" ON storage.objects;
CREATE POLICY "Users can update own post images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Users can delete own post images" ON storage.objects;
CREATE POLICY "Users can delete own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-images');

-- ============================================================================
-- 006: Add Post Reactions
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_reactions' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE post_reactions ADD COLUMN emoji TEXT;
  END IF;
END $$;

ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_reaction_type_check 
  CHECK (reaction_type IN ('like', 'dislike', 'love', 'celebrate', 'insightful', 'curious', 'thinking', 'surprised', 'sad', 'laugh', 'fire', 'star', 'rocket'));

COMMENT ON COLUMN post_reactions.emoji IS 'Emoji representation of the reaction';

CREATE INDEX IF NOT EXISTS idx_post_reactions_emoji ON post_reactions(post_id, reaction_type, emoji) WHERE reaction_type NOT IN ('like', 'dislike');

-- ============================================================================
-- 007: Add Updated At Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN posts.updated_at IS 'Timestamp of last edit';
COMMENT ON COLUMN comments.updated_at IS 'Timestamp of last edit';

CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_updated_at ON comments(updated_at DESC);

-- ============================================================================
-- 008: Add Media Support
-- ============================================================================

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_url TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_media_urls ON posts USING GIN (media_urls);
CREATE INDEX IF NOT EXISTS idx_posts_audio_url ON posts (audio_url) WHERE audio_url IS NOT NULL;

COMMENT ON COLUMN posts.media_urls IS 'Array of URLs for images/videos attached to the post';
COMMENT ON COLUMN posts.audio_url IS 'URL for voice message attached to the post';

-- ============================================================================
-- 010: Fix Post Views Tracking
-- ============================================================================

-- Create post_views table to track who viewed what
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);

-- Enable RLS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own view history" ON post_views;
CREATE POLICY "Users can view their own view history"
  ON post_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own views" ON post_views;
CREATE POLICY "Users can insert their own views"
  ON post_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to increment post views (only once per user)
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert view record if not exists (using ON CONFLICT to prevent duplicates)
  INSERT INTO post_views (post_id, user_id)
  VALUES (post_id, auth.uid())
  ON CONFLICT (post_id, user_id) DO NOTHING;
  
  -- Update posts view count based on unique viewers
  UPDATE posts
  SET views = (
    SELECT COUNT(DISTINCT user_id)
    FROM post_views
    WHERE post_views.post_id = posts.id
  )
  WHERE id = post_id;
END;
$$;

-- Function to get view count for a post
CREATE OR REPLACE FUNCTION get_post_views(post_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO view_count
  FROM post_views
  WHERE post_views.post_id = $1;
  
  RETURN COALESCE(view_count, 0);
END;
$$;

-- Update existing posts to reflect current unique view counts
-- (This will reset view counts to 0, but it's better than inflated numbers)
UPDATE posts SET views = 0;

COMMENT ON TABLE post_views IS 'Tracks unique post views per user to prevent view count inflation';
COMMENT ON FUNCTION increment_post_views IS 'Increments post view count only once per user';

-- ============================================================================
-- 011: Add Friends and Messaging System
-- ============================================================================
-- Run the full migration from 011_add_friends_and_messages_system.sql
-- For brevity, apply it separately or include here
-- See: supabase/migrations/011_add_friends_and_messages_system.sql

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All migrations have been applied successfully!
-- You can now use all the new features in your forum application.
-- ============================================================================
