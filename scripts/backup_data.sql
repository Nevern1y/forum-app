-- ============================================================================
-- BACKUP ALL USER DATA
-- ============================================================================
-- This script exports all user data from the forum application
-- Run this BEFORE executing cleanup_data.sql
-- Date: 2025
-- ============================================================================

-- Set output format for better readability
\pset format unaligned
\pset fieldsep ','
\pset tuples_only on

-- ============================================================================
-- BACKUP PROFILES
-- ============================================================================
\echo 'Backing up profiles...'
\o backup_profiles.csv
SELECT id, username, display_name, avatar_url, bio, reputation, created_at, updated_at
FROM profiles
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP POSTS
-- ============================================================================
\echo 'Backing up posts...'
\o backup_posts.csv
SELECT id, author_id, title, content, media_urls, audio_url, views, likes, dislikes, created_at, updated_at
FROM posts
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP COMMENTS
-- ============================================================================
\echo 'Backing up comments...'
\o backup_comments.csv
SELECT id, post_id, author_id, parent_id, content, media_urls, audio_url, likes, dislikes, created_at, updated_at
FROM comments
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP POST REACTIONS
-- ============================================================================
\echo 'Backing up post reactions...'
\o backup_post_reactions.csv
SELECT id, post_id, user_id, reaction_type, created_at
FROM post_reactions
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP COMMENT REACTIONS
-- ============================================================================
\echo 'Backing up comment reactions...'
\o backup_comment_reactions.csv
SELECT id, comment_id, user_id, reaction_type, created_at
FROM comment_reactions
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP POST VIEWS
-- ============================================================================
\echo 'Backing up post views...'
\o backup_post_views.csv
SELECT id, post_id, user_id, viewed_at
FROM post_views
ORDER BY viewed_at;
\o

-- ============================================================================
-- BACKUP BOOKMARKS
-- ============================================================================
\echo 'Backing up bookmarks...'
\o backup_bookmarks.csv
SELECT id, user_id, post_id, created_at
FROM bookmarks
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP SUBSCRIPTIONS (FOLLOWERS)
-- ============================================================================
\echo 'Backing up subscriptions...'
\o backup_subscriptions.csv
SELECT id, follower_id, following_id, created_at
FROM subscriptions
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP FRIENDSHIPS
-- ============================================================================
\echo 'Backing up friendships...'
\o backup_friendships.csv
SELECT id, user_id, friend_id, status, created_at, accepted_at
FROM friendships
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP CONVERSATIONS
-- ============================================================================
\echo 'Backing up conversations...'
\o backup_conversations.csv
SELECT id, user1_id, user2_id, last_message_at, last_message_preview, 
       unread_count_user1, unread_count_user2, created_at
FROM conversations
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP DIRECT MESSAGES
-- ============================================================================
\echo 'Backing up direct messages...'
\o backup_direct_messages.csv
SELECT id, conversation_id, sender_id, receiver_id, content, media_urls, 
       audio_url, shared_post_id, is_read, read_at, created_at
FROM direct_messages
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP NOTIFICATIONS
-- ============================================================================
\echo 'Backing up notifications...'
\o backup_notifications.csv
SELECT id, user_id, type, content, related_post_id, related_comment_id, 
       related_user_id, is_read, created_at
FROM notifications
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP BLOCKED USERS
-- ============================================================================
\echo 'Backing up blocked users...'
\o backup_blocked_users.csv
SELECT id, blocker_id, blocked_id, created_at
FROM blocked_users
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP REPORTS
-- ============================================================================
\echo 'Backing up reports...'
\o backup_reports.csv
SELECT id, reporter_id, content_type, content_id, reason, description, 
       status, reviewed_by, reviewed_at, resolution_notes, created_at
FROM reports
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP TAGS
-- ============================================================================
\echo 'Backing up tags...'
\o backup_tags.csv
SELECT id, name, created_at
FROM tags
ORDER BY created_at;
\o

-- ============================================================================
-- BACKUP POST TAGS
-- ============================================================================
\echo 'Backing up post tags...'
\o backup_post_tags.csv
SELECT post_id, tag_id
FROM post_tags;
\o

-- ============================================================================
-- BACKUP STATISTICS
-- ============================================================================
\echo 'Creating backup statistics...'
\o backup_statistics.txt
\pset format aligned
\pset tuples_only off

SELECT 'BACKUP STATISTICS' as "Report", NOW() as "Generated At";

SELECT 'Profiles' as "Table", COUNT(*) as "Records" FROM profiles
UNION ALL
SELECT 'Posts', COUNT(*) FROM posts
UNION ALL
SELECT 'Comments', COUNT(*) FROM comments
UNION ALL
SELECT 'Post Reactions', COUNT(*) FROM post_reactions
UNION ALL
SELECT 'Comment Reactions', COUNT(*) FROM comment_reactions
UNION ALL
SELECT 'Post Views', COUNT(*) FROM post_views
UNION ALL
SELECT 'Bookmarks', COUNT(*) FROM bookmarks
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'Friendships', COUNT(*) FROM friendships
UNION ALL
SELECT 'Conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'Direct Messages', COUNT(*) FROM direct_messages
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Blocked Users', COUNT(*) FROM blocked_users
UNION ALL
SELECT 'Reports', COUNT(*) FROM reports
UNION ALL
SELECT 'Tags', COUNT(*) FROM tags
UNION ALL
SELECT 'Post Tags', COUNT(*) FROM post_tags;

\o

\echo ''
\echo '===================================================================='
\echo 'BACKUP COMPLETED SUCCESSFULLY!'
\echo '===================================================================='
\echo ''
\echo 'Backup files created:'
\echo '  - backup_profiles.csv'
\echo '  - backup_posts.csv'
\echo '  - backup_comments.csv'
\echo '  - backup_post_reactions.csv'
\echo '  - backup_comment_reactions.csv'
\echo '  - backup_post_views.csv'
\echo '  - backup_bookmarks.csv'
\echo '  - backup_subscriptions.csv'
\echo '  - backup_friendships.csv'
\echo '  - backup_conversations.csv'
\echo '  - backup_direct_messages.csv'
\echo '  - backup_notifications.csv'
\echo '  - backup_blocked_users.csv'
\echo '  - backup_reports.csv'
\echo '  - backup_tags.csv'
\echo '  - backup_post_tags.csv'
\echo '  - backup_statistics.txt'
\echo ''
\echo 'IMPORTANT: Backup Storage Files Separately!'
\echo 'Storage buckets to backup:'
\echo '  - post-images'
\echo '  - comment-images'
\echo '  - media_uploads (if exists)'
\echo '  - audio_uploads (if exists)'
\echo ''
\echo 'You can backup storage via Supabase Dashboard:'
\echo '  Storage > [bucket] > Download all files'
\echo '===================================================================='
