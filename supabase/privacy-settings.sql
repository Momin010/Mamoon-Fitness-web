-- ============================================
-- USER PRIVACY SETTINGS TABLE
-- ============================================
CREATE TABLE user_privacy_settings (
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
CREATE INDEX idx_user_privacy_user ON user_privacy_settings(user_id);

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

CREATE TRIGGER on_profile_created_privacy
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_privacy();

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_privacy_settings;
