-- ============================================================================
-- RLS PERFORMANCE: Add indexes for columns used in RLS policies
-- ============================================================================
-- According to Supabase best practices, columns used in RLS policies should
-- be indexed to improve query performance. This is especially important for
-- foreign keys like user_id, author_id, etc.
-- 
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================================================

-- Index for follower_id (used in RLS: auth.uid() = follower_id)
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower_rls 
ON subscriptions(follower_id) 
WHERE follower_id IS NOT NULL;

COMMENT ON INDEX idx_subscriptions_follower_rls IS 
'RLS optimization: improves performance for follower_id = auth.uid() checks';

-- ============================================================================
-- 2. COMMENTS TABLE
-- ============================================================================

-- Index for author_id (used in RLS: auth.uid() = author_id)
CREATE INDEX IF NOT EXISTS idx_comments_author_rls 
ON comments(author_id) 
WHERE author_id IS NOT NULL;

COMMENT ON INDEX idx_comments_author_rls IS 
'RLS optimization: improves performance for author_id = auth.uid() checks';

-- ============================================================================
-- 3. BLOCKED_USERS TABLE
-- ============================================================================

-- Index for blocker_id (used in RLS: auth.uid() = blocker_id)
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_rls 
ON blocked_users(blocker_id) 
WHERE blocker_id IS NOT NULL;

-- Index for blocked_id (used in RLS: auth.uid() = blocked_id)
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_rls 
ON blocked_users(blocked_id) 
WHERE blocked_id IS NOT NULL;

-- Composite index for OR conditions (blocker_id OR blocked_id)
CREATE INDEX IF NOT EXISTS idx_blocked_users_both_rls 
ON blocked_users(blocker_id, blocked_id);

COMMENT ON INDEX idx_blocked_users_blocker_rls IS 
'RLS optimization: improves performance for blocker_id = auth.uid() checks';

-- ============================================================================
-- 4. REPORTS TABLE
-- ============================================================================

-- Index for reporter_id (used in RLS: auth.uid() = reporter_id)
CREATE INDEX IF NOT EXISTS idx_reports_reporter_rls 
ON reports(reporter_id) 
WHERE reporter_id IS NOT NULL;

COMMENT ON INDEX idx_reports_reporter_rls IS 
'RLS optimization: improves performance for reporter_id = auth.uid() checks';

-- ============================================================================
-- 5. POST_REACTIONS TABLE
-- ============================================================================

-- Index for user_id (used in RLS: auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_rls 
ON post_reactions(user_id) 
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_post_reactions_user_rls IS 
'RLS optimization: improves performance for user_id = auth.uid() checks';

-- ============================================================================
-- 6. POST_VIEWS TABLE
-- ============================================================================

-- Index for user_id (used in RLS: auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_post_views_user_rls 
ON post_views(user_id) 
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_post_views_user_rls IS 
'RLS optimization: improves performance for user_id = auth.uid() checks';

-- ============================================================================
-- 7. FRIENDSHIPS TABLE
-- ============================================================================

-- Index for user_id (used in RLS: auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_friendships_user_rls 
ON friendships(user_id) 
WHERE user_id IS NOT NULL;

-- Index for friend_id (used in RLS: auth.uid() = friend_id)
CREATE INDEX IF NOT EXISTS idx_friendships_friend_rls 
ON friendships(friend_id) 
WHERE friend_id IS NOT NULL;

-- Composite index for OR conditions (user_id OR friend_id)
CREATE INDEX IF NOT EXISTS idx_friendships_both_rls 
ON friendships(user_id, friend_id);

COMMENT ON INDEX idx_friendships_user_rls IS 
'RLS optimization: improves performance for user_id = auth.uid() checks';

-- ============================================================================
-- 8. DIRECT_MESSAGES TABLE
-- ============================================================================

-- Index for sender_id (used in RLS: auth.uid() = sender_id)
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_rls 
ON direct_messages(sender_id) 
WHERE sender_id IS NOT NULL;

-- Index for receiver_id (used in RLS: auth.uid() = receiver_id)
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_rls 
ON direct_messages(receiver_id) 
WHERE receiver_id IS NOT NULL;

-- Composite index for OR conditions (sender_id OR receiver_id)
CREATE INDEX IF NOT EXISTS idx_direct_messages_both_rls 
ON direct_messages(sender_id, receiver_id);

COMMENT ON INDEX idx_direct_messages_sender_rls IS 
'RLS optimization: improves performance for sender_id = auth.uid() checks';

-- ============================================================================
-- 9. CONVERSATIONS TABLE
-- ============================================================================

-- Index for user1_id (used in RLS: auth.uid() = user1_id)
CREATE INDEX IF NOT EXISTS idx_conversations_user1_rls 
ON conversations(user1_id) 
WHERE user1_id IS NOT NULL;

-- Index for user2_id (used in RLS: auth.uid() = user2_id)
CREATE INDEX IF NOT EXISTS idx_conversations_user2_rls 
ON conversations(user2_id) 
WHERE user2_id IS NOT NULL;

-- Composite index for OR conditions (user1_id OR user2_id)
CREATE INDEX IF NOT EXISTS idx_conversations_both_rls 
ON conversations(user1_id, user2_id);

COMMENT ON INDEX idx_conversations_user1_rls IS 
'RLS optimization: improves performance for user1_id = auth.uid() checks';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all indexes created
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%_rls'
ORDER BY tablename, indexname;
*/

-- Analyze tables after index creation
ANALYZE subscriptions;
ANALYZE comments;
ANALYZE blocked_users;
ANALYZE reports;
ANALYZE post_reactions;
ANALYZE post_views;
ANALYZE friendships;
ANALYZE direct_messages;
ANALYZE conversations;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA public IS 
'RLS indexes added: All columns used in auth.uid() comparisons are now indexed for optimal performance';

-- Add notice
DO $$
BEGIN
  RAISE NOTICE 'RLS Indexes Created: All auth.uid() comparison columns are now indexed';
  RAISE NOTICE 'Run ANALYZE on your tables to update query planner statistics';
END $$;
