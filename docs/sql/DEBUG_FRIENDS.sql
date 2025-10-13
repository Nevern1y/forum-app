-- DEBUG: Check friendships data
-- Run this in Supabase SQL Editor to see what's in the database

-- 1. Check if friendships table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'friendships'
ORDER BY ordinal_position;

-- 2. Count all friendships
SELECT 
  status,
  COUNT(*) as count
FROM friendships
GROUP BY status;

-- 3. Show all friendships with usernames
SELECT 
  f.id,
  f.status,
  f.created_at,
  u1.username as requester,
  u2.username as friend
FROM friendships f
JOIN profiles u1 ON f.user_id = u1.id
JOIN profiles u2 ON f.friend_id = u2.id
ORDER BY f.created_at DESC
LIMIT 20;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'friendships';

-- 5. Test query as specific user (replace YOUR_USER_ID)
-- SELECT * FROM friendships 
-- WHERE (user_id = 'YOUR_USER_ID' OR friend_id = 'YOUR_USER_ID')
-- AND status = 'accepted';
