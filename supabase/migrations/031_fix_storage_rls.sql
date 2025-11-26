-- =====================================================
-- FIX STORAGE RLS POLICIES FOR KYC BUCKET
-- Allow authenticated users to upload files to their own folder
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "KYC owners read" ON storage.objects;
DROP POLICY IF EXISTS "KYC owners write" ON storage.objects;
DROP POLICY IF EXISTS "KYC owners delete" ON storage.objects;
DROP POLICY IF EXISTS "KYC admins read all" ON storage.objects;
DROP POLICY IF EXISTS "KYC update policy" ON storage.objects;

-- Users can read their own files
CREATE POLICY "Users can read own KYC files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload files to their own folder
CREATE POLICY "Users can upload own KYC files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own files
CREATE POLICY "Users can update own KYC files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own KYC files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all KYC files
CREATE POLICY "Admins can read all KYC files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc' 
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all KYC files
CREATE POLICY "Admins can update all KYC files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kyc'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete all KYC files
CREATE POLICY "Admins can delete all KYC files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kyc'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Make sure the bucket exists and is configured correctly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc',
  'kyc',
  FALSE,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
