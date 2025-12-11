-- Create storage buckets for request images and videos
-- Run this migration to enable photo/video uploads for service requests

-- Create bucket for request images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-images', 
  'request-images', 
  true, 
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for request videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-videos', 
  'request-videos', 
  true, 
  52428800, -- 50MB max
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for request-images bucket
-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload request images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view request images (public bucket)
CREATE POLICY "Anyone can view request images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'request-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own request images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'request-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policies for request-videos bucket
-- Allow authenticated users to upload their own videos
CREATE POLICY "Users can upload request videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view request videos (public bucket)
CREATE POLICY "Anyone can view request videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'request-videos');

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own request videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'request-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
