-- Migration: Add pinned posts feature
-- Description: Allow users to pin their posts to the top
-- Date: 2024

-- Add is_pinned column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN posts.is_pinned IS 'Whether the post is pinned by the author';

-- Create index for faster queries on pinned posts
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned, created_at DESC) WHERE is_pinned = true;

-- Create index for efficient sorting (pinned first, then by date)
CREATE INDEX IF NOT EXISTS idx_posts_pinned_sort ON posts(is_pinned DESC, created_at DESC);
