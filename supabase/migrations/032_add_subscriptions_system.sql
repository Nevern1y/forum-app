-- ============================================================================
-- SUBSCRIPTIONS SYSTEM: Follow/Unfollow functionality
-- ============================================================================
-- Allows users to follow/unfollow other users and get personalized feed
-- ============================================================================

-- ============================================================================
-- 1. CHECK: Subscriptions table already exists?
-- ============================================================================

-- Table should already exist from earlier migrations
-- If not, create it:

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subscriptions'
  ) THEN
    CREATE TABLE subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(follower_id, following_id),
      CHECK (follower_id != following_id)
    );
    
    COMMENT ON TABLE subscriptions IS 'User subscriptions (follow/unfollow)';
    COMMENT ON COLUMN subscriptions.follower_id IS 'User who follows';
    COMMENT ON COLUMN subscriptions.following_id IS 'User being followed';
  END IF;
END $$;

-- ============================================================================
-- 2. INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_follower 
ON subscriptions(follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_following 
ON subscriptions(following_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_lookup 
ON subscriptions(follower_id, following_id);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can view subscriptions
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON subscriptions;
CREATE POLICY "Anyone can view subscriptions"
  ON subscriptions FOR SELECT
  TO public
  USING (true);

-- Authenticated users can follow others
DROP POLICY IF EXISTS "Users can follow others" ON subscriptions;
CREATE POLICY "Users can follow others"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
DROP POLICY IF EXISTS "Users can unfollow" ON subscriptions;
CREATE POLICY "Users can unfollow"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- ============================================================================
-- 4. RPC: Toggle Follow/Unfollow
-- ============================================================================

CREATE OR REPLACE FUNCTION toggle_follow(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  existing_follow_id UUID;
  result JSON;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Cannot follow yourself
  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;
  
  -- Check if already following
  SELECT id INTO existing_follow_id
  FROM subscriptions
  WHERE follower_id = current_user_id
    AND following_id = target_user_id;
  
  IF existing_follow_id IS NOT NULL THEN
    -- Unfollow
    DELETE FROM subscriptions WHERE id = existing_follow_id;
    
    result := json_build_object(
      'action', 'unfollowed',
      'following', false,
      'target_user_id', target_user_id
    );
  ELSE
    -- Follow
    INSERT INTO subscriptions (follower_id, following_id)
    VALUES (current_user_id, target_user_id);
    
    result := json_build_object(
      'action', 'followed',
      'following', true,
      'target_user_id', target_user_id
    );
  END IF;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_follow(UUID) TO authenticated;

COMMENT ON FUNCTION toggle_follow IS 'Toggle follow/unfollow for a user. Returns action taken.';

-- ============================================================================
-- 5. RPC: Get personalized feed (posts from followed users)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_following_feed(
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  views INT,
  likes INT,
  dislikes INT,
  comment_count INT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_username TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,
  author_reputation INT,
  user_reaction TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.author_id,
    p.views,
    p.likes,
    p.dislikes,
    p.comment_count,
    p.is_pinned,
    p.created_at,
    p.updated_at,
    pr.username as author_username,
    pr.display_name as author_display_name,
    pr.avatar_url as author_avatar_url,
    pr.reputation as author_reputation,
    (
      SELECT reaction_type 
      FROM post_reactions 
      WHERE post_id = p.id AND user_id = current_user_id
      LIMIT 1
    ) as user_reaction
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_id
  WHERE p.author_id IN (
    SELECT following_id 
    FROM subscriptions 
    WHERE follower_id = current_user_id
  )
  ORDER BY 
    p.is_pinned DESC,
    p.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_following_feed(INT, INT) TO authenticated;

COMMENT ON FUNCTION get_following_feed IS 'Get personalized feed with posts from followed users';

-- ============================================================================
-- 6. RPC: Get follower/following counts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_follow_stats(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  follower_count INT;
  following_count INT;
  result JSON;
BEGIN
  -- Count followers
  SELECT COUNT(*) INTO follower_count
  FROM subscriptions
  WHERE following_id = user_id;
  
  -- Count following
  SELECT COUNT(*) INTO following_count
  FROM subscriptions
  WHERE follower_id = user_id;
  
  result := json_build_object(
    'user_id', user_id,
    'followers', follower_count,
    'following', following_count
  );
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_follow_stats(UUID) TO public;

-- ============================================================================
-- 7. TRIGGER: Notify on new follow
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower's name
  SELECT COALESCE(display_name, username) INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    related_user_id,
    title,
    message,
    link,
    is_read
  )
  VALUES (
    NEW.following_id,
    'friend_request', -- Используем существующий тип
    NEW.follower_id,
    'Новый подписчик',
    follower_name || ' подписался на вас',
    '/profile/' || (SELECT username FROM profiles WHERE id = NEW.follower_id),
    false
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_follower_notify ON subscriptions;
CREATE TRIGGER on_new_follower_notify
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Test toggle_follow (run manually with real user_id)
/*
SELECT toggle_follow('some-user-uuid');
SELECT toggle_follow('some-user-uuid'); -- Should unfollow
*/

-- Test get_following_feed
/*
SELECT * FROM get_following_feed(10, 0);
*/

-- Test get_user_follow_stats
/*
SELECT * FROM get_user_follow_stats('some-user-uuid');
*/

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions'
ORDER BY indexname;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subscriptions IS 'User follow/unfollow relationships for personalized feed';
COMMENT ON FUNCTION toggle_follow IS 'Smart toggle: follows if not following, unfollows if already following';
COMMENT ON FUNCTION get_following_feed IS 'Personalized feed showing posts only from followed users';
COMMENT ON FUNCTION get_user_follow_stats IS 'Get follower and following counts for a user';
COMMENT ON FUNCTION notify_new_follower IS 'Automatically notify users when someone follows them';
