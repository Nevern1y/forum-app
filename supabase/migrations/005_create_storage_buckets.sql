-- Migration: Create storage buckets for avatars and images
-- Description: Setup storage buckets with proper permissions
-- Date: 2024

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Create post-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Storage policies for avatars

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.filename(name))[1]
  );

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.filename(name))[1]
  );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.filename(name))[1]
  );

-- Storage policies for post-images

-- Policy: Anyone can view post images (public bucket)
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- Policy: Authenticated users can upload post images
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-images');

-- Policy: Users can update their own post images
CREATE POLICY "Users can update own post images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.author_id = auth.uid()
    )
  );

-- Policy: Users can delete their own post images
CREATE POLICY "Users can delete own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.author_id = auth.uid()
    )
  );
