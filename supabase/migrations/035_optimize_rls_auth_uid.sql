-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Wrap auth.uid() in SELECT for RLS policies
-- ============================================================================
-- According to Supabase best practices, auth.uid() should be wrapped in SELECT
-- to allow PostgreSQL optimizer to cache the result per statement.
-- This significantly improves performance by preventing redundant function calls.
-- 
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================================================

-- Users can follow others
DROP POLICY IF EXISTS "Users can follow others" ON subscriptions;
CREATE POLICY "Users can follow others"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = follower_id);

-- Users can unfollow
DROP POLICY IF EXISTS "Users can unfollow" ON subscriptions;
CREATE POLICY "Users can unfollow"
  ON subscriptions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = follower_id);

-- ============================================================================
-- 2. COMMENTS TABLE
-- ============================================================================

-- Users can insert their own comments
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
CREATE POLICY "Users can insert their own comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- Users can update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);

-- ============================================================================
-- 3. BLOCKED_USERS TABLE
-- ============================================================================

-- Users can block others
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = blocker_id);

-- Users can unblock
DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;
CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = blocker_id);

-- Users can see blocks they're involved in
DROP POLICY IF EXISTS "Users can see blocks they're involved in" ON blocked_users;
CREATE POLICY "Users can see blocks they're involved in"
  ON blocked_users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = blocker_id OR (SELECT auth.uid()) = blocked_id);

-- ============================================================================
-- 4. REPORTS TABLE
-- ============================================================================

-- Authenticated users can create reports
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = reporter_id);

-- High reputation users can view all reports
DROP POLICY IF EXISTS "High reputation users can view all reports" ON reports;
CREATE POLICY "High reputation users can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) AND reputation >= 10000
    )
  );

-- High reputation users can update reports
DROP POLICY IF EXISTS "High reputation users can update reports" ON reports;
CREATE POLICY "High reputation users can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) AND reputation >= 10000
    )
  );

-- ============================================================================
-- 5. POST_REACTIONS TABLE
-- ============================================================================

-- Users can create their own reactions
DROP POLICY IF EXISTS "Users can create their own reactions" ON post_reactions;
CREATE POLICY "Users can create their own reactions"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own reactions
DROP POLICY IF EXISTS "Users can delete their own reactions" ON post_reactions;
CREATE POLICY "Users can delete their own reactions"
  ON post_reactions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 6. POST_VIEWS TABLE
-- ============================================================================

-- Authenticated users can track their views
DROP POLICY IF EXISTS "Authenticated users can track their views" ON post_views;
CREATE POLICY "Authenticated users can track their views"
  ON post_views FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own views
DROP POLICY IF EXISTS "Users can insert their own views" ON post_views;
CREATE POLICY "Users can insert their own views"
  ON post_views FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 7. FRIENDSHIPS TABLE
-- ============================================================================

-- Users can view their friendships
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = friend_id);

-- Users can send friend requests
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their friendships
DROP POLICY IF EXISTS "Users can update their friendships" ON friendships;
CREATE POLICY "Users can update their friendships"
  ON friendships FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = friend_id);

-- Users can delete friendships
DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = friend_id);

-- ============================================================================
-- 8. DIRECT_MESSAGES TABLE
-- ============================================================================

-- Users can view messages they're involved in
DROP POLICY IF EXISTS "Users can view messages they're involved in" ON direct_messages;
CREATE POLICY "Users can view messages they're involved in"
  ON direct_messages FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = receiver_id);

-- Users can send messages
DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = sender_id);

-- Users can mark received messages as read
DROP POLICY IF EXISTS "Users can mark received messages as read" ON direct_messages;
CREATE POLICY "Users can mark received messages as read"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = receiver_id);

-- Users can delete their sent messages
DROP POLICY IF EXISTS "Users can delete their sent messages" ON direct_messages;
CREATE POLICY "Users can delete their sent messages"
  ON direct_messages FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = sender_id);

-- ============================================================================
-- 9. CONVERSATIONS TABLE
-- ============================================================================

-- Users can view their conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id);

-- Users can create conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id);

-- Users can update their conversations
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id);

-- ============================================================================
-- 10. STORAGE BUCKETS (avatars, post-media, comment-media)
-- ============================================================================

-- Note: Storage policies use storage.foldername() which extracts user_id from path
-- Format: user_id/filename

-- Avatars: Users can upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

-- Avatars: Users can update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

-- Avatars: Users can delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

-- Post-media: Authors can manage their post media
DROP POLICY IF EXISTS "Authors can upload post media" ON storage.objects;
CREATE POLICY "Authors can upload post media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-media' AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.author_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authors can delete post media" ON storage.objects;
CREATE POLICY "Authors can delete post media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-media' AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.author_id = (SELECT auth.uid())
    )
  );

-- Comment-media: Similar pattern
DROP POLICY IF EXISTS "Users can upload comment media" ON storage.objects;
CREATE POLICY "Users can upload comment media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comment-media' AND
    (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all RLS policies that use auth.uid()
-- Run this to verify optimization was applied:
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE qual::text LIKE '%auth.uid()%' 
   OR with_check::text LIKE '%auth.uid()%'
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can follow others" ON subscriptions IS 
'Optimized: auth.uid() wrapped in SELECT for performance';

COMMENT ON POLICY "Users can create their own reactions" ON post_reactions IS 
'Optimized: auth.uid() wrapped in SELECT for performance';

-- Add comment to track optimization
DO $$
BEGIN
  RAISE NOTICE 'RLS Optimization Complete: All auth.uid() calls wrapped in SELECT for caching';
END $$;
