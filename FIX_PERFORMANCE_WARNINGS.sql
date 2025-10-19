-- ============================================================================
-- ИСПРАВЛЕНИЕ ПРЕДУПРЕЖДЕНИЙ ПРОИЗВОДИТЕЛЬНОСТИ SUPABASE LINTER
-- ============================================================================
-- Выполните в Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ЧАСТЬ 1: УДАЛЕНИЕ ДУБЛИРУЮЩИХСЯ ИНДЕКСОВ
-- ============================================================================

-- Comments: удаляем старые индексы, оставляем новые с _id суффиксом
DROP INDEX IF EXISTS idx_comments_author;
DROP INDEX IF EXISTS idx_comments_post;

-- Posts: удаляем старые индексы
DROP INDEX IF EXISTS idx_posts_author;
DROP INDEX IF EXISTS idx_posts_created;

-- ============================================================================
-- ЧАСТЬ 2: УДАЛЕНИЕ ДУБЛИРУЮЩИХСЯ RLS ПОЛИТИК
-- ============================================================================

-- post_reactions: удаляем старые дублирующиеся политики
DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can remove own reactions" ON post_reactions;

-- posts: удаляем старую политику
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;

-- ============================================================================
-- ЧАСТЬ 3: ОПТИМИЗАЦИЯ RLS ПОЛИТИК (auth.uid() -> SELECT auth.uid())
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles
FOR DELETE USING ((SELECT auth.uid()) = id);

-- posts
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts
FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts
FOR UPDATE USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts
FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- comments
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments
FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments
FOR UPDATE USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments
FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- comment_reactions
DROP POLICY IF EXISTS "comment_reactions_insert_own" ON comment_reactions;
CREATE POLICY "comment_reactions_insert_own" ON comment_reactions
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "comment_reactions_delete_own" ON comment_reactions;
CREATE POLICY "comment_reactions_delete_own" ON comment_reactions
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- bookmarks
DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
CREATE POLICY "bookmarks_select_own" ON bookmarks
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
CREATE POLICY "bookmarks_insert_own" ON bookmarks
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
CREATE POLICY "bookmarks_delete_own" ON bookmarks
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own" ON subscriptions
FOR INSERT WITH CHECK ((SELECT auth.uid()) = subscriber_id);

DROP POLICY IF EXISTS "subscriptions_delete_own" ON subscriptions;
CREATE POLICY "subscriptions_delete_own" ON subscriptions
FOR DELETE USING ((SELECT auth.uid()) = subscriber_id);

-- post_tags
DROP POLICY IF EXISTS "post_tags_insert_via_post" ON post_tags;
CREATE POLICY "post_tags_insert_via_post" ON post_tags
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE id = post_id AND author_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "post_tags_delete_via_post" ON post_tags;
CREATE POLICY "post_tags_delete_via_post" ON post_tags
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE id = post_id AND author_id = (SELECT auth.uid())
  )
);

-- notifications
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;
CREATE POLICY "Users can delete their notifications" ON notifications
FOR DELETE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- post_reactions (объединённая политика)
DROP POLICY IF EXISTS "Public can view reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can manage their reactions" ON post_reactions;

CREATE POLICY "Public can view reactions" ON post_reactions
FOR SELECT USING (true);

CREATE POLICY "Users can manage their reactions" ON post_reactions
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- reports
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
FOR INSERT WITH CHECK ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports" ON reports
FOR SELECT USING ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Moderators can view all reports" ON reports;
CREATE POLICY "Moderators can view all reports" ON reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role IN ('moderator', 'admin')
  )
);

DROP POLICY IF EXISTS "Moderators can update reports" ON reports;
CREATE POLICY "Moderators can update reports" ON reports
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role IN ('moderator', 'admin')
  )
);

-- blocked_users
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others" ON blocked_users
FOR INSERT WITH CHECK ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;
CREATE POLICY "Users can unblock others" ON blocked_users
FOR DELETE USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
CREATE POLICY "Users can view own blocks" ON blocked_users
FOR SELECT USING ((SELECT auth.uid()) = blocker_id);

-- post_views
DROP POLICY IF EXISTS "Users can view their own view history" ON post_views;
CREATE POLICY "Users can view their own view history" ON post_views
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own views" ON post_views;
CREATE POLICY "Users can insert their own views" ON post_views
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- friendships
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
CREATE POLICY "Users can view their friendships" ON friendships
FOR SELECT USING (
  (SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = friend_id
);

DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
CREATE POLICY "Users can send friend requests" ON friendships
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their friendships" ON friendships;
CREATE POLICY "Users can update their friendships" ON friendships
FOR UPDATE USING (
  (SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = friend_id
);

DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships" ON friendships
FOR DELETE USING (
  (SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = friend_id
);

-- conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
FOR SELECT USING (
  (SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id
);

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations" ON conversations
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id
);

DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations" ON conversations
FOR UPDATE USING (
  (SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id
);

-- direct_messages
DROP POLICY IF EXISTS "Users can view their messages" ON direct_messages;
CREATE POLICY "Users can view their messages" ON direct_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND ((SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id)
  )
);

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages
FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id);

DROP POLICY IF EXISTS "Users can update received messages" ON direct_messages;
CREATE POLICY "Users can update received messages" ON direct_messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND ((SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id)
  )
);

DROP POLICY IF EXISTS "Users can delete their messages" ON direct_messages;
CREATE POLICY "Users can delete their messages" ON direct_messages
FOR DELETE USING ((SELECT auth.uid()) = sender_id);

-- ============================================================================
-- РЕЗУЛЬТАТЫ
-- ============================================================================

SELECT 'Performance optimizations completed!' as status;

-- Проверка оставшихся индексов
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'comments')
ORDER BY tablename, indexname;
