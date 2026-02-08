-- FINAL HARDENING: MESSAGES SCHEMA & POLICIES
-- Run this in your Supabase SQL Editor to fix the 'media_type' column error

-- 1. Ensure Columns Exist in messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT;

-- 2. Clean/Reset Messaging Policies (Total Wipe & Re-Apply)
-- This ensures the DB can handle the new columns under RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_messages" ON messages;
DROP POLICY IF EXISTS "send_messages" ON messages;

-- Fresh policies that recognize the new schema
CREATE POLICY "view_messages" ON messages FOR SELECT USING (
  public.can_access_conversation(conversation_id)
);

CREATE POLICY "send_messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND public.can_access_conversation(conversation_id)
);

-- 3. Notify Schema Cache (Optional but recommended)
-- Usually Supabase catches schema changes auto, but if persistent:
-- You may need to click 'Reload postgREST schema' in Supabase API settings if this error persists.
