-- Fix: Resolve ambiguous column references in get_or_create_conversation function
-- Run this in Supabase SQL Editor

-- Drop and recreate function with qualified column names
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
  smaller_id UUID;
  larger_id UUID;
BEGIN
  -- Ensure user1_id < user2_id
  IF user1_id < user2_id THEN
    smaller_id := user1_id;
    larger_id := user2_id;
  ELSE
    smaller_id := user2_id;
    larger_id := user1_id;
  END IF;

  -- Try to get existing conversation (FIXED: added conversations. prefix)
  SELECT conversations.id INTO conversation_id
  FROM conversations
  WHERE conversations.user1_id = smaller_id 
    AND conversations.user2_id = larger_id;

  -- Create if doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (smaller_id, larger_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- Also fix the trigger that has similar issues
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = substring(NEW.content, 1, 100),
    unread_count_user1 = CASE 
      WHEN conversations.user1_id = NEW.receiver_id THEN conversations.unread_count_user1 + 1 
      ELSE conversations.unread_count_user1 
    END,
    unread_count_user2 = CASE 
      WHEN conversations.user2_id = NEW.receiver_id THEN conversations.unread_count_user2 + 1 
      ELSE conversations.unread_count_user2 
    END
  WHERE conversations.id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- And fix the reset unread count trigger
CREATE OR REPLACE FUNCTION reset_unread_count_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_read = false AND NEW.is_read = true THEN
    UPDATE conversations
    SET 
      unread_count_user1 = CASE 
        WHEN conversations.user1_id = NEW.receiver_id THEN GREATEST(0, conversations.unread_count_user1 - 1)
        ELSE conversations.unread_count_user1 
      END,
      unread_count_user2 = CASE 
        WHEN conversations.user2_id = NEW.receiver_id THEN GREATEST(0, conversations.unread_count_user2 - 1)
        ELSE conversations.unread_count_user2 
      END
    WHERE conversations.id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify fix
SELECT 'Functions updated successfully!' as status;
