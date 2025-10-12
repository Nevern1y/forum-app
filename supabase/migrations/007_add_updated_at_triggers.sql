-- Migration: Add updated_at triggers for tracking edits
-- Description: Automatically update updated_at timestamp on record changes
-- Date: 2024

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column to posts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add updated_at column to comments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create trigger for posts
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for comments
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN posts.updated_at IS 'Timestamp of last edit';
COMMENT ON COLUMN comments.updated_at IS 'Timestamp of last edit';

-- Create index for sorting by last updated
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_updated_at ON comments(updated_at DESC);
