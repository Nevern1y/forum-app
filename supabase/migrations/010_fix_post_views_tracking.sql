-- Migration: Fix Post Views Tracking
-- Description: Track unique views per user to prevent view count inflation
-- Date: 2024

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
