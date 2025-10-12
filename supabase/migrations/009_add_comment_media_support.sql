-- Add media support to comments
-- Adds media_urls (array of image URLs) and audio_url (voice message)

-- Add media columns to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create storage bucket for comment media if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-images', 'comment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view comment images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload comment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own comment images" ON storage.objects;

-- Storage policies for comment-images bucket
CREATE POLICY "Anyone can view comment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-images');

CREATE POLICY "Authenticated users can upload comment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comment-images');

CREATE POLICY "Users can delete own comment images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comment-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_media_urls ON comments USING GIN (media_urls);
CREATE INDEX IF NOT EXISTS idx_comments_audio_url ON comments (audio_url) WHERE audio_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN comments.media_urls IS 'Array of URLs for images attached to the comment';
COMMENT ON COLUMN comments.audio_url IS 'URL for voice message attached to the comment';
