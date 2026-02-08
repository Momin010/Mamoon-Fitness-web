
-- ============================================
-- FORGE FITNESS - SOCIAL ENHANCEMENTS
-- General Follows, Mentorships, and Public Access
-- ============================================

-- 1. General Follow System (Follow anyone)
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
CREATE POLICY "Anyone can view follows" ON user_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- 2. Mentorships (For Coaches)
CREATE TABLE IF NOT EXISTS coach_mentorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coach_mentorships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view mentorships" ON coach_mentorships;
CREATE POLICY "Anyone can view mentorships" ON coach_mentorships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Coaches can manage their mentorships" ON coach_mentorships;
CREATE POLICY "Coaches can manage their mentorships" 
ON coach_mentorships FOR ALL 
USING (auth.uid() = coach_id);

CREATE INDEX IF NOT EXISTS idx_coach_mentorships_coach ON coach_mentorships(coach_id);

-- 3. Update Social Activities for new types
-- (The check constraint already exist, we might need to update it if we want 'post' and 'mentorship')
-- Actually, let's just make it a TEXT column without the strict CHECK if we want more flexibility, 
-- or update the check constraint.
ALTER TABLE social_activities DROP CONSTRAINT IF EXISTS social_activities_type_check;
ALTER TABLE social_activities ADD CONSTRAINT social_activities_type_check 
CHECK (type IN ('workout', 'meal', 'task', 'achievement', 'level_up', 'post', 'mentorship'));

-- 4. Ensure Privacy Settings allow public by default as requested
UPDATE user_privacy_settings SET profile_visible = TRUE;

-- 5. Add Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE coach_mentorships;
