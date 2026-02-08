-- SOCIAL & MESSAGING HARDENING V7 (PERSISTENCE & DUPLICATE FIX)
-- INSTRUCTIONS: Run this block in your Supabase SQL Editor. 
-- This fixes the deduplication logic and ensure messages NEVER disappear.

-- 1. Hardened Access Check
CREATE OR REPLACE FUNCTION public.can_access_conversation(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Clean/Reset Messaging Policies (Total Wipe & Re-Apply)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_convs" ON conversations;
DROP POLICY IF EXISTS "create_convs" ON conversations;
DROP POLICY IF EXISTS "view_members" ON conversation_members;
DROP POLICY IF EXISTS "create_members" ON conversation_members;
DROP POLICY IF EXISTS "view_messages" ON messages;
DROP POLICY IF EXISTS "send_messages" ON messages;

-- Fresh non-recursive policies
CREATE POLICY "view_convs" ON conversations FOR SELECT USING (public.can_access_conversation(id));
CREATE POLICY "create_convs" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "view_members" ON conversation_members FOR SELECT USING (public.can_access_conversation(conversation_id));
CREATE POLICY "create_members" ON conversation_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "view_messages" ON messages FOR SELECT USING (public.can_access_conversation(conversation_id));
CREATE POLICY "send_messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND public.can_access_conversation(conversation_id)
);

-- 3. THE ATOMIC CHAT RPC (Ultra-Robust Deduplication)
-- This function is the single source of truth for 1-on-1 chats.
CREATE OR REPLACE FUNCTION create_chat_with_user(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    final_conv_id UUID;
BEGIN
    -- 1. Check if they are trying to chat with themselves (edge case)
    IF auth.uid() = other_user_id THEN
       -- Find existing self-chat
       SELECT c.id INTO final_conv_id
       FROM conversations c
       JOIN conversation_members cm ON c.id = cm.conversation_id
       WHERE cm.user_id = auth.uid()
         AND c.is_group = false
       GROUP BY c.id
       HAVING COUNT(cm.id) = 1;
       
       IF final_conv_id IS NOT NULL THEN
          RETURN final_conv_id;
       END IF;
       
       -- Create new self-chat
       INSERT INTO conversations (is_group, created_by)
       VALUES (false, auth.uid())
       RETURNING id INTO final_conv_id;
       
       INSERT INTO conversation_members (conversation_id, user_id)
       VALUES (final_conv_id, auth.uid());
       
       RETURN final_conv_id;
    END IF;

    -- 2. Find existing 1-on-1 conversation
    SELECT cm1.conversation_id INTO final_conv_id
    FROM conversation_members cm1
    JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    JOIN conversations c ON cm1.conversation_id = c.id
    WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = other_user_id
      AND c.is_group = false;

    -- 3. If found, return it immediately
    IF final_conv_id IS NOT NULL THEN
        RETURN final_conv_id;
    END IF;

    -- 4. Otherwise, create it atomically
    INSERT INTO conversations (is_group, created_by)
    VALUES (false, auth.uid())
    RETURNING id INTO final_conv_id;

    -- Add both members
    INSERT INTO conversation_members (conversation_id, user_id)
    VALUES (final_conv_id, auth.uid()), (final_conv_id, other_user_id);

    RETURN final_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Restore Global Profile Discovery (Ensures you can always find other users)
DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
CREATE POLICY "Everyone can view profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Everyone can view follows" ON user_follows;
CREATE POLICY "Everyone can view follows" ON user_follows FOR SELECT USING (true);
