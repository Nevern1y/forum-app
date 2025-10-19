-- ============================================================================
-- ПОЛНОЕ ИСПРАВЛЕНИЕ REALTIME: REPLICA IDENTITY ДЛЯ ВСЕХ ТАБЛИЦ
-- ============================================================================
-- КОРНЕВАЯ ПРОБЛЕМА: replica_identity установлен в 'full' вместо 'default'
-- Это вызывает ошибки "mismatch between server and client bindings"
-- ============================================================================

-- Проверяем все таблицы с неправильным replica identity
SELECT 
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN '✅ default'
    WHEN 'f' THEN '❌ full (BAD)'
    WHEN 'n' THEN '❌ nothing'
    WHEN 'i' THEN '❌ index'
  END AS current_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relreplident = 'f'  -- Находим все с 'full'
ORDER BY c.relname;

-- ============================================================================
-- ИСПРАВЛЕНИЕ: Устанавливаем 'default' для ВСЕХ таблиц с Realtime
-- ============================================================================

-- Основные таблицы с Realtime
ALTER TABLE IF EXISTS post_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS notifications REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS comments REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS posts REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS profiles REPLICA IDENTITY DEFAULT;

-- Остальные таблицы (на всякий случай)
ALTER TABLE IF EXISTS comment_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS bookmarks REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS subscriptions REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS post_tags REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS tags REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS friendships REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS conversations REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS direct_messages REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS blocked_users REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS post_views REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS reports REPLICA IDENTITY DEFAULT;

-- ============================================================================
-- ПРОВЕРКА: Все таблицы должны иметь 'default'
-- ============================================================================

SELECT 
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN '✅ default (primary key) - CORRECT'
    WHEN 'n' THEN '⚠️ nothing'
    WHEN 'f' THEN '❌ full - STILL WRONG!'
    WHEN 'i' THEN '⚠️ index'
  END AS replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'post_reactions', 'notifications', 'comments', 'posts', 'profiles',
    'comment_reactions', 'bookmarks', 'subscriptions', 'post_tags', 'tags',
    'friendships', 'conversations', 'direct_messages', 'blocked_users',
    'post_views', 'reports'
  )
ORDER BY c.relname;

-- ============================================================================
-- ОЖИДАЕМЫЙ РЕЗУЛЬТАТ: Все таблицы должны показывать '✅ default'
-- ============================================================================

-- После выполнения:
-- 1. Перезапустите: npm run dev
-- 2. Все ошибки "mismatch" и "timed out" должны исчезнуть
-- 3. Realtime будет работать корректно
