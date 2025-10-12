-- Migration: Add Friends and Messaging System
-- Description: Complete system for friendships, direct messages, and notifications
-- Date: 2024

-- ============================================================================
-- 1. FRIENDSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_users_friendship CHECK (user_id != friend_id),
  UNIQUE(user_id, friend_id)
);

-- Indexes for friendships
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_both_users ON friendships(user_id, friend_id);

COMMENT ON TABLE friendships IS 'Friendship relationships and requests between users';
COMMENT ON COLUMN friendships.status IS 'pending: awaiting acceptance, accepted: friends, rejected: declined, blocked: blocked user';

-- ============================================================================
-- 2. CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_preview TEXT,
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_users_conversation CHECK (user1_id != user2_id),
  CONSTRAINT ordered_users CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_both ON conversations(user1_id, user2_id);

COMMENT ON TABLE conversations IS 'Conversation threads between two users';
COMMENT ON CONSTRAINT ordered_users ON conversations IS 'Ensures user1_id is always less than user2_id for consistency';

-- ============================================================================
-- 3. DIRECT MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  audio_url TEXT,
  shared_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT non_empty_message CHECK (
    (content IS NOT NULL AND length(trim(content)) > 0) OR 
    media_urls IS NOT NULL OR 
    audio_url IS NOT NULL OR 
    shared_post_id IS NOT NULL
  )
);

-- Indexes for direct_messages
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages(receiver_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_shared_post ON direct_messages(shared_post_id) WHERE shared_post_id IS NOT NULL;

COMMENT ON TABLE direct_messages IS 'Direct messages between users';
COMMENT ON COLUMN direct_messages.shared_post_id IS 'ID of shared post if this is a post share';

-- ============================================================================
-- 4. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'friend_request', 
    'friend_accepted', 
    'new_message', 
    'post_shared',
    'post_like',
    'post_comment',
    'comment_reply'
  )),
  related_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  related_content_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);

COMMENT ON TABLE notifications IS 'User notifications for various events';

-- ============================================================================
-- 5. RLS POLICIES - FRIENDSHIPS
-- ============================================================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships where they are involved
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can send friend requests
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update friendships they're involved in (accept/reject/block)
DROP POLICY IF EXISTS "Users can update their friendships" ON friendships;
CREATE POLICY "Users can update their friendships"
  ON friendships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can delete their friendships
DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- ============================================================================
-- 6. RLS POLICIES - CONVERSATIONS
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they're part of
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- System creates conversations (handled by function)
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Users can update their conversations
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================================================
-- 7. RLS POLICIES - DIRECT MESSAGES
-- ============================================================================

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
DROP POLICY IF EXISTS "Users can view their messages" ON direct_messages;
CREATE POLICY "Users can view their messages"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can send messages
DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Users can update their received messages (mark as read)
DROP POLICY IF EXISTS "Users can update received messages" ON direct_messages;
CREATE POLICY "Users can update received messages"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Users can delete messages they sent
DROP POLICY IF EXISTS "Users can delete their messages" ON direct_messages;
CREATE POLICY "Users can delete their messages"
  ON direct_messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- ============================================================================
-- 8. RLS POLICIES - NOTIFICATIONS
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their notifications
DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;
CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = user1_id AND friend_id = user2_id) OR
      (user_id = user2_id AND friend_id = user1_id)
    )
  );
END;
$$;

-- Function to get or create conversation
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

  -- Try to get existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE user1_id = smaller_id AND user2_id = larger_id;

  -- Create if doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (smaller_id, larger_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- Function to get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_messages_count(for_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM direct_messages
  WHERE receiver_id = for_user_id AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to get unread notifications count for user
CREATE OR REPLACE FUNCTION get_unread_notifications_count(for_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = for_user_id AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- Update conversation last_message_at when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = substring(NEW.content, 1, 100),
    unread_count_user1 = CASE 
      WHEN user1_id = NEW.receiver_id THEN unread_count_user1 + 1 
      ELSE unread_count_user1 
    END,
    unread_count_user2 = CASE 
      WHEN user2_id = NEW.receiver_id THEN unread_count_user2 + 1 
      ELSE unread_count_user2 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation ON direct_messages;
CREATE TRIGGER trigger_update_conversation
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Reset unread count when messages are marked as read
CREATE OR REPLACE FUNCTION reset_unread_count_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_read = false AND NEW.is_read = true THEN
    UPDATE conversations
    SET 
      unread_count_user1 = CASE 
        WHEN user1_id = NEW.receiver_id THEN GREATEST(0, unread_count_user1 - 1)
        ELSE unread_count_user1 
      END,
      unread_count_user2 = CASE 
        WHEN user2_id = NEW.receiver_id THEN GREATEST(0, unread_count_user2 - 1)
        ELSE unread_count_user2 
      END
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_unread ON direct_messages;
CREATE TRIGGER trigger_reset_unread
  AFTER UPDATE ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_count_on_read();

-- Create notification on friend request
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, related_user_id, title, link)
    VALUES (
      NEW.friend_id,
      'friend_request',
      NEW.user_id,
      'Новый запрос в друзья',
      '/friends'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_friend_request_notification ON friendships;
CREATE TRIGGER trigger_friend_request_notification
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_request_notification();

-- Create notification when friend request is accepted
CREATE OR REPLACE FUNCTION create_friend_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, type, related_user_id, title, link)
    VALUES (
      NEW.user_id,
      'friend_accepted',
      NEW.friend_id,
      'Запрос в друзья принят',
      '/friends'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_friend_accepted_notification ON friendships;
CREATE TRIGGER trigger_friend_accepted_notification
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_accepted_notification();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE friendships IS 'System for managing friend relationships - v1.0';
COMMENT ON TABLE conversations IS 'Message conversation threads - v1.0';
COMMENT ON TABLE direct_messages IS 'Direct messaging system - v1.0';
COMMENT ON TABLE notifications IS 'User notification system - v1.0';
