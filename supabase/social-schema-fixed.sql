-- ============================================
-- FORGE FITNESS - SOCIAL FEATURES SCHEMA (FIXED)
-- Friends, Coaches, Social Feed, Messages
-- Complete schema with proper foreign keys
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FRIEND REQUESTS TABLE
-- Stores pending friend requests
-- ============================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Add explicit foreign key constraints
ALTER TABLE friend_requests 
DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE friend_requests 
DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON friend_requests;

-- Policies
CREATE POLICY "Users can view their own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own requests"
  ON friend_requests FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(receiver_id, status);

-- ============================================
-- FRIEND CONNECTIONS TABLE
-- Stores bidirectional friend relationships
-- ============================================
CREATE TABLE IF NOT EXISTS friend_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Add explicit foreign key constraints (CRITICAL FOR JOINS)
ALTER TABLE friend_connections 
DROP CONSTRAINT IF EXISTS friend_connections_user_id_fkey;

ALTER TABLE friend_connections 
ADD CONSTRAINT friend_connections_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE friend_connections 
DROP CONSTRAINT IF EXISTS friend_connections_friend_id_fkey;

ALTER TABLE friend_connections 
ADD CONSTRAINT friend_connections_friend_id_fkey 
FOREIGN KEY (friend_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own friend connections" ON friend_connections;
DROP POLICY IF EXISTS "Users can create friend connections" ON friend_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON friend_connections;

-- Policies
CREATE POLICY "Users can view their own friend connections"
  ON friend_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create friend connections"
  ON friend_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON friend_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_friend_connections_user ON friend_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_connections_friend ON friend_connections(friend_id);

-- ============================================
-- COACH APPLICATIONS TABLE
-- Stores coach signup applications
-- ============================================
CREATE TABLE IF NOT EXISTS coach_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER NOT NULL DEFAULT 0,
  certifications TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own application" ON coach_applications;
DROP POLICY IF EXISTS "Users can create their own application" ON coach_applications;

-- Policies
CREATE POLICY "Users can view their own application"
  ON coach_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own application"
  ON coach_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_coach_applications_user ON coach_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_applications_status ON coach_applications(status);

-- ============================================
-- COACH PROFILES TABLE
-- Stores approved coach information
-- ============================================
CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER NOT NULL DEFAULT 0,
  certifications TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  follower_count INTEGER NOT NULL DEFAULT 0,
  plan_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view coach profiles" ON coach_profiles;
DROP POLICY IF EXISTS "Coaches can update their own profile" ON coach_profiles;

-- Policies
CREATE POLICY "Anyone can view coach profiles"
  ON coach_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Coaches can update their own profile"
  ON coach_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_verified ON coach_profiles(is_verified) WHERE is_verified = TRUE;

-- ============================================
-- COACH FOLLOWERS TABLE
-- Stores coach follower relationships
-- ============================================
CREATE TABLE IF NOT EXISTS coach_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coach_id, user_id)
);

-- Enable RLS
ALTER TABLE coach_followers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own follows" ON coach_followers;
DROP POLICY IF EXISTS "Users can follow coaches" ON coach_followers;
DROP POLICY IF EXISTS "Users can unfollow" ON coach_followers;

-- Policies
CREATE POLICY "Users can view their own follows"
  ON coach_followers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow coaches"
  ON coach_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow"
  ON coach_followers FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_coach_followers_coach ON coach_followers(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_followers_user ON coach_followers(user_id);

-- ============================================
-- COACH WORKOUT PLANS TABLE
-- Stores workout plans created by coaches
-- ============================================
CREATE TABLE IF NOT EXISTS coach_workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INTEGER,
  workouts_per_week INTEGER,
  exercises JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  follower_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coach_workout_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public plans" ON coach_workout_plans;
DROP POLICY IF EXISTS "Coaches can manage their own plans" ON coach_workout_plans;

-- Policies
CREATE POLICY "Anyone can view public plans"
  ON coach_workout_plans FOR SELECT
  TO authenticated, anon
  USING (is_public = TRUE);

CREATE POLICY "Coaches can manage their own plans"
  ON coach_workout_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles 
      WHERE coach_profiles.id = coach_workout_plans.coach_id 
      AND coach_profiles.user_id = auth.uid()
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_coach_plans_coach ON coach_workout_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_plans_public ON coach_workout_plans(is_public) WHERE is_public = TRUE;

-- ============================================
-- USER WORKOUT PLANS TABLE
-- Stores plans assigned to/followed by users
-- ============================================
CREATE TABLE IF NOT EXISTS user_workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES coach_workout_plans(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  start_date DATE,
  progress JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- Enable RLS
ALTER TABLE user_workout_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own plans" ON user_workout_plans;
DROP POLICY IF EXISTS "Users can follow plans" ON user_workout_plans;
DROP POLICY IF EXISTS "Users can update their own plans" ON user_workout_plans;

-- Policies
CREATE POLICY "Users can view their own plans"
  ON user_workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow plans"
  ON user_workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON user_workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_active ON user_workout_plans(user_id, is_active);

-- ============================================
-- SOCIAL ACTIVITIES TABLE
-- Stores user activities for the social feed
-- ============================================
CREATE TABLE IF NOT EXISTS social_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workout', 'meal', 'task', 'achievement', 'level_up')),
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  comments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add explicit foreign key constraint (CRITICAL FOR JOINS)
ALTER TABLE social_activities 
DROP CONSTRAINT IF EXISTS social_activities_user_id_fkey;

ALTER TABLE social_activities 
ADD CONSTRAINT social_activities_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE social_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view activities" ON social_activities;
DROP POLICY IF EXISTS "Users can create their own activities" ON social_activities;

-- Policies
CREATE POLICY "Anyone can view activities"
  ON social_activities FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create their own activities"
  ON social_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_social_activities_user ON social_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_social_activities_created ON social_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_activities_type ON social_activities(type);

-- ============================================
-- SOCIAL LIKES TABLE
-- Stores likes on activities
-- ============================================
CREATE TABLE IF NOT EXISTS social_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- Add explicit foreign key constraints
ALTER TABLE social_likes 
DROP CONSTRAINT IF EXISTS social_likes_activity_id_fkey;

ALTER TABLE social_likes 
ADD CONSTRAINT social_likes_activity_id_fkey 
FOREIGN KEY (activity_id) 
REFERENCES social_activities(id) 
ON DELETE CASCADE;

ALTER TABLE social_likes 
DROP CONSTRAINT IF EXISTS social_likes_user_id_fkey;

ALTER TABLE social_likes 
ADD CONSTRAINT social_likes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view likes" ON social_likes;
DROP POLICY IF EXISTS "Users can like/unlike" ON social_likes;

-- Policies
CREATE POLICY "Anyone can view likes"
  ON social_likes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can like/unlike"
  ON social_likes FOR ALL
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_social_likes_activity ON social_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_user ON social_likes(user_id);

-- ============================================
-- DIRECT MESSAGES TABLE
-- Stores private messages between users
-- ============================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
DROP POLICY IF EXISTS "Receivers can mark as read" ON direct_messages;

-- Policies
CREATE POLICY "Users can view their own messages"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark as read"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);

-- ============================================
-- CONVERSATIONS VIEW
-- Helper view for getting conversation list
-- ============================================
CREATE OR REPLACE VIEW user_conversations AS
SELECT 
  DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
  id,
  sender_id,
  receiver_id,
  content,
  is_read,
  created_at,
  CASE 
    WHEN sender_id = auth.uid() THEN receiver_id
    ELSE sender_id
  END as other_user_id
FROM direct_messages
WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC;

-- ============================================
-- USER PRIVACY SETTINGS TABLE
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

-- Drop existing policies
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
CREATE INDEX IF NOT EXISTS idx_user_privacy_user ON user_privacy_settings(user_id);

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

DROP TRIGGER IF EXISTS on_profile_created_privacy ON public.profiles;

CREATE TRIGGER on_profile_created_privacy
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_privacy();

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle friend request acceptance
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Create bidirectional connections
    INSERT INTO friend_connections (user_id, friend_id)
    VALUES (NEW.sender_id, NEW.receiver_id)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO friend_connections (user_id, friend_id)
    VALUES (NEW.receiver_id, NEW.sender_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_updated ON friend_requests;

CREATE TRIGGER on_friend_request_updated
  AFTER UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION handle_friend_request_accepted();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE coach_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE coach_followers;
ALTER PUBLICATION supabase_realtime ADD TABLE coach_workout_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE user_workout_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE social_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE social_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_privacy_settings;
