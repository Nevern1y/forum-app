-- Migration: Add emoji reactions to posts
-- Description: Support for emoji reactions beyond like/dislike
-- Date: 2024

-- post_reactions table should already exist, but let's ensure it has the right structure
-- Add emoji column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_reactions' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE post_reactions ADD COLUMN emoji TEXT;
  END IF;
END $$;

-- Update check constraint to allow emoji reactions
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_reaction_type_check 
  CHECK (reaction_type IN ('like', 'dislike', 'love', 'celebrate', 'insightful', 'curious', 'thinking', 'surprised', 'sad', 'laugh', 'fire', 'star', 'rocket'));

-- Add comment for documentation
COMMENT ON COLUMN post_reactions.emoji IS 'Emoji representation of the reaction';
COMMENT ON COLUMN post_reactions.reaction_type IS 'Type of reaction: like, dislike, or emoji name';

-- Create index for faster emoji reaction queries
CREATE INDEX IF NOT EXISTS idx_post_reactions_emoji ON post_reactions(post_id, reaction_type, emoji) WHERE reaction_type NOT IN ('like', 'dislike');
