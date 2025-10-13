-- ============================================================================
-- CLEANUP ALL USER DATA
-- ============================================================================
-- This script deletes ALL user data from the forum application
-- IMPORTANT: Run backup_data.sql BEFORE executing this script!
-- Date: 2025
-- ============================================================================

-- Confirmation prompt
\prompt 'WARNING: This will DELETE ALL user data! Type YES to continue: ' confirm

-- ============================================================================
-- BEGIN TRANSACTION
-- ============================================================================
BEGIN;

\echo ''
\echo '===================================================================='
\echo 'STARTING DATA CLEANUP...'
\echo '===================================================================='

-- ============================================================================
-- DISABLE TRIGGERS TEMPORARILY (to speed up deletion)
-- ============================================================================
\echo 'Disabling triggers...'
SET session_replication_role = replica;

-- ============================================================================
-- DELETE DATA IN CORRECT ORDER (respecting foreign keys)
-- ============================================================================

-- Step 1: Delete child tables first
\echo ''
\echo 'Step 1/16: Deleting post tags...'
DELETE FROM post_tags;
\echo 'Deleted post tags'

\echo 'Step 2/16: Deleting post views...'
DELETE FROM post_views;
\echo 'Deleted post views'

\echo 'Step 3/16: Deleting post reactions...'
DELETE FROM post_reactions;
\echo 'Deleted post reactions'

\echo 'Step 4/16: Deleting comment reactions...'
DELETE FROM comment_reactions;
\echo 'Deleted comment reactions'

\echo 'Step 5/16: Deleting bookmarks...'
DELETE FROM bookmarks;
\echo 'Deleted bookmarks'

\echo 'Step 6/16: Deleting direct messages...'
DELETE FROM direct_messages;
\echo 'Deleted direct messages'

\echo 'Step 7/16: Deleting conversations...'
DELETE FROM conversations;
\echo 'Deleted conversations'

\echo 'Step 8/16: Deleting notifications...'
DELETE FROM notifications;
\echo 'Deleted notifications'

\echo 'Step 9/16: Deleting reports...'
DELETE FROM reports;
\echo 'Deleted reports'

\echo 'Step 10/16: Deleting comments...'
DELETE FROM comments;
\echo 'Deleted comments'

\echo 'Step 11/16: Deleting posts...'
DELETE FROM posts;
\echo 'Deleted posts'

\echo 'Step 12/16: Deleting blocked users...'
DELETE FROM blocked_users;
\echo 'Deleted blocked users'

\echo 'Step 13/16: Deleting friendships...'
DELETE FROM friendships;
\echo 'Deleted friendships'

\echo 'Step 14/16: Deleting subscriptions...'
DELETE FROM subscriptions;
\echo 'Deleted subscriptions'

\echo 'Step 15/16: Deleting tags...'
DELETE FROM tags;
\echo 'Deleted tags'

-- Step 2: Delete profiles (this will cascade to auth.users via triggers)
\echo 'Step 16/16: Deleting profiles...'
DELETE FROM profiles;
\echo 'Deleted profiles'

-- ============================================================================
-- RE-ENABLE TRIGGERS
-- ============================================================================
\echo ''
\echo 'Re-enabling triggers...'
SET session_replication_role = DEFAULT;

-- ============================================================================
-- RESET SEQUENCES (for auto-incrementing IDs if any)
-- ============================================================================
\echo 'Resetting sequences...'
-- Most tables use UUID, so no sequences to reset

-- ============================================================================
-- VACUUM TABLES (reclaim space)
-- ============================================================================
\echo 'Vacuuming tables to reclaim space...'
VACUUM ANALYZE profiles;
VACUUM ANALYZE posts;
VACUUM ANALYZE comments;
VACUUM ANALYZE post_reactions;
VACUUM ANALYZE comment_reactions;
VACUUM ANALYZE post_views;
VACUUM ANALYZE bookmarks;
VACUUM ANALYZE subscriptions;
VACUUM ANALYZE friendships;
VACUUM ANALYZE conversations;
VACUUM ANALYZE direct_messages;
VACUUM ANALYZE notifications;
VACUUM ANALYZE blocked_users;
VACUUM ANALYZE reports;
VACUUM ANALYZE tags;
VACUUM ANALYZE post_tags;

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================
\echo ''
\echo '===================================================================='
\echo 'VERIFYING CLEANUP...'
\echo '===================================================================='

DO $$
DECLARE
  total_records INTEGER := 0;
  table_count INTEGER;
BEGIN
  -- Count remaining records in all tables
  SELECT COUNT(*) INTO table_count FROM profiles;
  RAISE NOTICE 'Profiles: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM posts;
  RAISE NOTICE 'Posts: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM comments;
  RAISE NOTICE 'Comments: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM post_reactions;
  RAISE NOTICE 'Post Reactions: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM comment_reactions;
  RAISE NOTICE 'Comment Reactions: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM post_views;
  RAISE NOTICE 'Post Views: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM bookmarks;
  RAISE NOTICE 'Bookmarks: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM subscriptions;
  RAISE NOTICE 'Subscriptions: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM friendships;
  RAISE NOTICE 'Friendships: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM conversations;
  RAISE NOTICE 'Conversations: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM direct_messages;
  RAISE NOTICE 'Direct Messages: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM notifications;
  RAISE NOTICE 'Notifications: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM blocked_users;
  RAISE NOTICE 'Blocked Users: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM reports;
  RAISE NOTICE 'Reports: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM tags;
  RAISE NOTICE 'Tags: % records', table_count;
  total_records := total_records + table_count;
  
  SELECT COUNT(*) INTO table_count FROM post_tags;
  RAISE NOTICE 'Post Tags: % records', table_count;
  total_records := total_records + table_count;
  
  RAISE NOTICE '';
  RAISE NOTICE 'TOTAL REMAINING RECORDS: %', total_records;
  
  IF total_records = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'SUCCESS: All user data has been deleted!';
    RAISE NOTICE '====================================================================';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'WARNING: Some records remain. Check for foreign key constraints.';
    RAISE NOTICE '====================================================================';
  END IF;
END $$;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
\echo ''
\echo 'Committing changes...'
COMMIT;

\echo ''
\echo '===================================================================='
\echo 'CLEANUP COMPLETED!'
\echo '===================================================================='
\echo ''
\echo 'IMPORTANT: Clean up Storage buckets manually!'
\echo ''
\echo 'Storage buckets to clean:'
\echo '  - post-images'
\echo '  - comment-images'
\echo '  - media_uploads (if exists)'
\echo '  - audio_uploads (if exists)'
\echo ''
\echo 'You can clean storage via Supabase Dashboard:'
\echo '  Storage > [bucket] > Select all > Delete'
\echo ''
\echo 'Or use Supabase CLI:'
\echo '  supabase storage empty post-images'
\echo '  supabase storage empty comment-images'
\echo '===================================================================='
