-- Add media support to posts
-- Adds media_urls (array of image/video URLs) and audio_url (voice message)

-- Add media columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create storage bucket for post media if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-images bucket
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_media_urls ON posts USING GIN (media_urls);
CREATE INDEX IF NOT EXISTS idx_posts_audio_url ON posts (audio_url) WHERE audio_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN posts.media_urls IS 'Array of URLs for images/videos attached to the post';
COMMENT ON COLUMN posts.audio_url IS 'URL for voice message attached to the post';
