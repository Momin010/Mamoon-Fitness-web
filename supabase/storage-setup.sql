-- Supabase Storage Setup for Forge Fitness & RPG
-- Run this in the Supabase SQL Editor to set up storage buckets and policies

-- ============================================
-- 1. Create Storage Buckets
-- ============================================

-- Create bucket for meal images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for social media (posts, chat)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social_media', 'social_media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing social media policies
DROP POLICY IF EXISTS "Public social media access" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload social media" ON storage.objects;

-- Allow public read access to social media
CREATE POLICY "Public social media access"
ON storage.objects FOR SELECT
USING (bucket_id = 'social_media');

-- Allow authenticated users to upload to social media
CREATE POLICY "Auth upload social media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'social_media');

-- ============================================
-- 2. Enable Row Level Security on Storage Objects
-- ============================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Drop existing policies if they exist (to avoid conflicts)
-- ============================================

DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;

-- ============================================
-- 4. Create RLS Policies for Images Bucket
-- ============================================

-- Allow authenticated users to upload to images bucket
-- The folder structure is: {userId}/{filename}
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own images
CREATE POLICY "Users can read their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 5. Create RLS Policies for Avatars Bucket
-- ============================================

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars (for profile display)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 6. Alternative: Allow any authenticated user to upload (less secure but easier)
-- Uncomment these if the above policies don't work
-- ============================================

-- DROP POLICY IF EXISTS "Allow all uploads to images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow all uploads to avatars" ON storage.objects;
-- 
-- CREATE POLICY "Allow all uploads to images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'images');
-- 
-- CREATE POLICY "Allow all uploads to avatars"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'avatars');

-- ============================================
-- 7. Verify setup
-- ============================================

-- Verify buckets exist
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id IN ('images', 'avatars');

-- Verify policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
