-- Migration: Create base post_reactions table
-- Description: Create the post_reactions table for likes and reactions
-- Date: 2024
-- Note: This should be run BEFORE migration 006

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

-- Function to count reactions by type
CREATE OR REPLACE FUNCTION get_post_reaction_counts(p_post_id UUID)
RETURNS TABLE(reaction_type TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT pr.reaction_type, COUNT(*)::BIGINT
  FROM post_reactions pr
  WHERE pr.post_id = p_post_id
  GROUP BY pr.reaction_type;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_post_reaction_counts IS 'Get count of each reaction type for a post';
