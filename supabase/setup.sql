-- ============================================
-- FORGE FITNESS APP - SUPABASE SETUP
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Stores user profile and stats
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL DEFAULT 'New User',
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  rank INTEGER NOT NULL DEFAULT 1,
  calories_goal INTEGER NOT NULL DEFAULT 2500,
  protein_goal INTEGER NOT NULL DEFAULT 150,
  carbs_goal INTEGER NOT NULL DEFAULT 250,
  fats_goal INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'New User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TASKS TABLE
-- Stores user tasks/todos
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT 'TODAY',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can CRUD own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(user_id, completed);

-- ============================================
-- MEALS TABLE
-- Stores logged meals with nutrition data
-- ============================================
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fats INTEGER NOT NULL DEFAULT 0,
  meal_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can CRUD own meals"
  ON meals FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_timestamp ON meals(user_id, timestamp);

-- ============================================
-- WORKOUT SESSIONS TABLE
-- Stores completed workout sessions
-- ============================================
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration INTEGER NOT NULL, -- in minutes
  total_xp INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can CRUD own workout sessions"
  ON workout_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_workouts_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workouts_date ON workout_sessions(user_id, date);

-- ============================================
-- WORKOUT EXERCISES TABLE
-- Stores exercises within a workout session
-- ============================================
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  completed_sets INTEGER NOT NULL DEFAULT 0,
  weight INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can CRUD own exercises"
  ON workout_exercises FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_exercises_session ON workout_exercises(workout_session_id);
CREATE INDEX idx_exercises_user ON workout_exercises(user_id);

-- ============================================
-- FRIENDS TABLE
-- Stores user's friends for leaderboard
-- ============================================
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  tier TEXT NOT NULL DEFAULT 'NOVICE',
  avatar_url TEXT,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can CRUD own friends"
  ON friends FOR ALL
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_friends_user_id ON friends(user_id);

-- ============================================
-- USER SETTINGS TABLE
-- Stores user preferences and configuration
-- ============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_list TEXT[] NOT NULL DEFAULT ARRAY[
    'Bench Press',
    'Overhead Press',
    'Lat Pulldown',
    'Barbell Row',
    'Tricep Extensions',
    'Lateral Raises',
    'Face Pulls',
    'Squat',
    'Deadlift',
    'Leg Press',
    'Bicep Curls',
    'Plank',
    'Push-ups',
    'Pull-ups'
  ],
  daily_reset_hour INTEGER NOT NULL DEFAULT 0,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  dark_mode BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to create settings on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for live sync
-- ============================================
BEGIN;
  -- Drop the publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create a new publication
  CREATE PUBLICATION supabase_realtime;
  
  -- Add tables to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  ALTER PUBLICATION supabase_realtime ADD TABLE meals;
  ALTER PUBLICATION supabase_realtime ADD TABLE workout_sessions;
  ALTER PUBLICATION supabase_realtime ADD TABLE workout_exercises;
  ALTER PUBLICATION supabase_realtime ADD TABLE friends;
  ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
COMMIT;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate user's tier based on level
CREATE OR REPLACE FUNCTION calculate_tier(user_level INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF user_level >= 80 THEN RETURN 'LEGENDARY';
  ELSIF user_level >= 60 THEN RETURN 'ELITE';
  ELSIF user_level >= 40 THEN RETURN 'MASTER';
  ELSIF user_level >= 20 THEN RETURN 'VETERAN';
  ELSE RETURN 'NOVICE';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user's level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := FLOOR(NEW.xp / 1000) + 1;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment if you want sample data
-- ============================================
/*
-- Note: This requires an existing auth user
-- Replace 'your-user-id' with an actual user UUID

INSERT INTO tasks (user_id, title, due_date, completed, xp_reward)
VALUES 
  ('your-user-id', 'Complete workout', 'TODAY', false, 150),
  ('your-user-id', 'Log meals', 'TODAY', false, 100);

INSERT INTO friends (user_id, name, xp, level, tier)
VALUES 
  ('your-user-id', 'Marcus Thorne', 28900, 89, 'LEGENDARY'),
  ('your-user-id', 'Jordan Smith', 21800, 68, 'ELITE');
*/
