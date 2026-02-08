-- Remove dummy data
DELETE FROM social_activities WHERE user_id IN ('a4841e12-e3aa-42ba-a981-449a0ec52f90', 'b4841e12-e3aa-42ba-a981-449a0ec52f91', 'c4841e12-e3aa-42ba-a981-449a0ec52f92');
DELETE FROM user_privacy_settings WHERE user_id IN ('a4841e12-e3aa-42ba-a981-449a0ec52f90', 'b4841e12-e3aa-42ba-a981-449a0ec52f91', 'c4841e12-e3aa-42ba-a981-449a0ec52f92');
DELETE FROM profiles WHERE id IN ('a4841e12-e3aa-42ba-a981-449a0ec52f90', 'b4841e12-e3aa-42ba-a981-449a0ec52f91', 'c4841e12-e3aa-42ba-a981-449a0ec52f92');
-- We can't easily delete from auth.users via SQL without admin/trigger bypass in some environments, 
-- but deleting from profiles/activities will remove them from the UI.

-- Also clear generic social activities for a fresh start if requested
-- DELETE FROM social_activities; 
