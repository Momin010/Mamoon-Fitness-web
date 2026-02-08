-- ============================================
-- FORGE FITNESS - FOREIGN KEY FIXES
-- Fixes relationship errors for social features
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- FIX 1: social_activities -> auth.users relationship
-- The query uses: user:user_id(name,avatar_url)
-- Need to ensure FK exists and points to auth.users
-- ============================================

-- First, check if the constraint exists and drop if needed
ALTER TABLE social_activities 
DROP CONSTRAINT IF EXISTS social_activities_user_id_fkey;

-- Add explicit foreign key to auth.users
ALTER TABLE social_activities 
ADD CONSTRAINT social_activities_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_social_activities_user_id 
ON social_activities(user_id);

-- ============================================
-- FIX 2: friend_connections FK relationships
-- The query uses: friend:friend_id(id,name,avatar_url,level,xp)
-- Need FK on friend_id pointing to auth.users
-- ============================================

-- Drop existing constraints if they exist
ALTER TABLE friend_connections 
DROP CONSTRAINT IF EXISTS friend_connections_user_id_fkey;

ALTER TABLE friend_connections 
DROP CONSTRAINT IF EXISTS friend_connections_friend_id_fkey;

-- Add explicit foreign key for user_id
ALTER TABLE friend_connections 
ADD CONSTRAINT friend_connections_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add explicit foreign key for friend_id (this is the critical one!)
ALTER TABLE friend_connections 
ADD CONSTRAINT friend_connections_friend_id_fkey 
FOREIGN KEY (friend_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add indexes for join performance
CREATE INDEX IF NOT EXISTS idx_friend_connections_user_id 
ON friend_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_friend_connections_friend_id 
ON friend_connections(friend_id);

-- ============================================
-- FIX 3: friend_requests FK relationships
-- The query uses: sender:sender_id(id, name, avatar_url, level)
-- ============================================

-- Drop existing constraints if they exist
ALTER TABLE friend_requests 
DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;

ALTER TABLE friend_requests 
DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

-- Add explicit foreign key for sender_id
ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add explicit foreign key for receiver_id
ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================
-- FIX 4: social_likes FK relationships
-- ============================================

-- Drop existing constraints if they exist
ALTER TABLE social_likes 
DROP CONSTRAINT IF EXISTS social_likes_activity_id_fkey;

ALTER TABLE social_likes 
DROP CONSTRAINT IF EXISTS social_likes_user_id_fkey;

-- Add explicit foreign key for activity_id
ALTER TABLE social_likes 
ADD CONSTRAINT social_likes_activity_id_fkey 
FOREIGN KEY (activity_id) 
REFERENCES social_activities(id) 
ON DELETE CASCADE;

-- Add explicit foreign key for user_id
ALTER TABLE social_likes 
ADD CONSTRAINT social_likes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================
-- FIX 5: user_settings - ensure unique constraint on user_id
-- This fixes the "68 rows" issue - should only return 1 row per user
-- ============================================

-- First, remove duplicate rows keeping only the most recent
DELETE FROM user_settings a
USING user_settings b
WHERE a.id < b.id 
AND a.user_id = b.user_id;

-- Drop existing constraint if exists
ALTER TABLE user_settings 
DROP CONSTRAINT IF EXISTS user_settings_user_id_key;

-- Add unique constraint to ensure one row per user
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_user_id_key 
UNIQUE (user_id);

-- ============================================
-- FIX 6: Create user_privacy_settings table if not exists
-- ============================================

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visible BOOLEAN NOT NULL DEFAULT TRUE,
  show_workouts BOOLEAN NOT NULL DEFAULT TRUE,
  show_meals BOOLEAN NOT NULL DEFAULT FALSE,
  show_stats BOOLEAN NOT NULL DEFAULT TRUE,
  allow_friend_requests BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON user_privacy_settings;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON user_privacy_settings;
DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON user_privacy_settings;

-- Policies
CREATE POLICY "Users can view their own privacy settings"
  ON user_privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
  ON user_privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
  ON user_privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_privacy_user 
ON user_privacy_settings(user_id);

-- Trigger to create privacy settings on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile_privacy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_privacy_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_profile_created_privacy ON public.profiles;

CREATE TRIGGER on_profile_created_privacy
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_privacy();

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_privacy_settings;

-- ============================================
-- FIX 7: Ensure profiles table has proper FK to auth.users
-- ============================================

-- The profiles table id should reference auth.users.id
-- This is needed for proper joins from social_activities
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================
-- VERIFICATION QUERIES (run these to verify fixes)
-- ============================================

-- Check social_activities FK
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
-- AND tc.table_name = 'social_activities';

-- Check friend_connections FK
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
-- AND tc.table_name = 'friend_connections';
