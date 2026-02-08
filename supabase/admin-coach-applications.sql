-- ============================================
-- ADMIN COACH APPLICATIONS SCHEMA
-- Adds admin functionality for reviewing coach applications
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- ADD is_admin TO PROFILES TABLE
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- UPDATE COACH APPLICATIONS POLICIES
-- Allow admins to view all applications
-- ============================================

-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view their own application" ON coach_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON coach_applications;
DROP POLICY IF EXISTS "Users and admins can view applications" ON coach_applications;

-- Create new policy that allows users to view their own and admins to view all
CREATE POLICY "Users and admins can view applications"
  ON coach_applications FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Drop existing update policy
DROP POLICY IF EXISTS "Admins can update applications" ON coach_applications;

-- Create policy for admins to update applications (approve/reject)
CREATE POLICY "Admins can update applications"
  ON coach_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Keep insert policy as is (users can only create their own)
DROP POLICY IF EXISTS "Users can create their own application" ON coach_applications;
CREATE POLICY "Users can create their own application"
  ON coach_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTION TO MAKE A USER ADMIN
-- Run this to grant admin access to a specific user
-- ============================================

-- Function to set admin status
CREATE OR REPLACE FUNCTION set_user_admin(user_email TEXT, admin_status BOOLEAN)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update profile
  UPDATE profiles 
  SET is_admin = admin_status 
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id, email, name, is_admin)
    SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'User'), admin_status
    FROM auth.users
    WHERE id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- QUICK SETUP: MAKE YOURSELF AN ADMIN
-- Replace with your email address
-- ============================================

-- Uncomment and run this with your email:
-- SELECT set_user_admin('your-email@example.com', TRUE);

-- Example:
-- SELECT set_user_admin('mamoon.aldahdouh@gmail.com', TRUE);

-- ============================================
-- VIEW FOR ADMIN DASHBOARD
-- Convenient view of all applications with user info
-- ============================================

CREATE OR REPLACE VIEW coach_applications_admin AS
SELECT 
  ca.*,
  p.name as user_name,
  p.email as user_email,
  p.avatar_url as user_avatar,
  p.level as user_level
FROM coach_applications ca
LEFT JOIN profiles p ON ca.user_id = p.id
ORDER BY ca.created_at DESC;

-- ============================================
-- NOTIFICATIONS TABLE (Optional)
-- For notifying users about application status changes
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================
-- FUNCTION TO NOTIFY USER ON APPLICATION STATUS CHANGE
-- ============================================

CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'coach_application_' || NEW.status,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Coach Application Approved!'
        WHEN NEW.status = 'rejected' THEN 'Coach Application Update'
        ELSE 'Coach Application Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Congratulations! Your coach application has been approved. You can now access your coach dashboard.'
        WHEN NEW.status = 'rejected' THEN COALESCE(
          'Your coach application was not approved. Reason: ' || NEW.admin_notes,
          'Unfortunately, your coach application was not approved at this time.'
        )
        ELSE 'Your application status has been updated to: ' || NEW.status
      END,
      jsonb_build_object(
        'application_id', NEW.id,
        'status', NEW.status,
        'admin_notes', NEW.admin_notes
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for notifications
DROP TRIGGER IF EXISTS on_application_status_change ON coach_applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON coach_applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_status_change();

-- ============================================
-- ADD TO REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- HELPER QUERIES
-- ============================================

-- Count applications by status
-- SELECT status, COUNT(*) FROM coach_applications GROUP BY status;

-- Get pending applications count
-- SELECT COUNT(*) FROM coach_applications WHERE status = 'pending';

-- Get all admins
-- SELECT id, email, name FROM profiles WHERE is_admin = TRUE;
