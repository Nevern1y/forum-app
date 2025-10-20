-- Fix Replica Identity for Realtime
-- This script fixes the "mismatch between server and client bindings" error
-- that can occur when using Supabase Realtime subscriptions.
--
-- PROBLEM: Tables have replica_identity set to 'FULL' instead of 'DEFAULT'
-- SOLUTION: Change replica_identity to 'DEFAULT' for all tables
--
-- Run this in Supabase SQL Editor if you see WebSocket errors

-- Main tables
ALTER TABLE public.posts REPLICA IDENTITY DEFAULT;
ALTER TABLE public.comments REPLICA IDENTITY DEFAULT;
ALTER TABLE public.messages REPLICA IDENTITY DEFAULT;
ALTER TABLE public.notifications REPLICA IDENTITY DEFAULT;
ALTER TABLE public.profiles REPLICA IDENTITY DEFAULT;
ALTER TABLE public.friendships REPLICA IDENTITY DEFAULT;
ALTER TABLE public.subscriptions REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_votes REPLICA IDENTITY DEFAULT;
ALTER TABLE public.comment_votes REPLICA IDENTITY DEFAULT;

-- Verify changes
SELECT 
  schemaname,
  tablename,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
    WHEN 'n' THEN 'NOTHING'
  END as replica_identity
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE 
  nspname = 'public' 
  AND relkind = 'r'
  AND tablename IN (
    'posts', 'comments', 'messages', 'notifications', 
    'profiles', 'friendships', 'subscriptions', 
    'post_votes', 'comment_votes'
  )
ORDER BY tablename;
