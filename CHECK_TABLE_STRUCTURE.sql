-- ============================================
-- ПРОВЕРКА СТРУКТУРЫ ТАБЛИЦ
-- Скопируйте и выполните в Supabase SQL Editor
-- ============================================

-- 1. Проверка структуры таблицы notifications
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Ожидаемые колонки для notifications:
-- id, user_id, type, content, link, read, created_at

-- 2. Проверка структуры таблицы post_reactions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'post_reactions'
ORDER BY ordinal_position;

-- Ожидаемые колонки для post_reactions:
-- id, post_id, user_id, reaction_type, emoji, created_at

-- 3. Проверка, что Realtime действительно работает
SELECT 
  schemaname,
  tablename,
  c.oid::regclass::text as table_oid
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'post_reactions', 'direct_messages', 'comments', 'posts')
ORDER BY tablename;

-- 4. Проверка RLS (Row Level Security)
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'post_reactions', 'direct_messages', 'comments', 'posts')
ORDER BY tablename;

-- Все должны показывать RLS Enabled = true
