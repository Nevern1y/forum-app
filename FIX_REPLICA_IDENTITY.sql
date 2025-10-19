-- ============================================================================
-- ИСПРАВЛЕНИЕ REPLICA IDENTITY ДЛЯ REALTIME
-- ============================================================================
-- Проблема: replica_identity = 'full' вызывает "mismatch between server and client bindings"
-- Решение: Установить replica_identity = 'default' (использует primary key)
-- ============================================================================

-- Изменяем replica identity на default для post_reactions
ALTER TABLE post_reactions REPLICA IDENTITY DEFAULT;

-- Изменяем replica identity на default для notifications
ALTER TABLE notifications REPLICA IDENTITY DEFAULT;

-- ============================================================================
-- ПРОВЕРКА
-- ============================================================================

-- Проверяем что изменения применились
SELECT 
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'default (primary key)'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('post_reactions', 'notifications')
  AND c.relkind = 'r';

-- Ожидаемый результат: обе таблицы должны иметь 'default (primary key)'

-- ============================================================================
-- ПОСЛЕ ВЫПОЛНЕНИЯ:
-- 1. Перезапустите npm run dev
-- 2. Realtime должен заработать без ошибок "mismatch"
-- ============================================================================
