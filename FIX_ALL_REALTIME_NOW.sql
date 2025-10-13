-- ============================================
-- ПОЛНОЕ ИСПРАВЛЕНИЕ REALTIME ДЛЯ ВСЕХ ТАБЛИЦ
-- Скопируйте ВСЁ и выполните в Supabase SQL Editor
-- ============================================

-- 1. Устанавливаем REPLICA IDENTITY FULL для ВСЕХ realtime таблиц
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE post_reactions REPLICA IDENTITY FULL;
ALTER TABLE direct_messages REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE posts REPLICA IDENTITY FULL;

-- 2. Добавляем все таблицы в realtime publication
-- (Если таблица уже добавлена, будет NOTICE - это нормально!)
DO $$
BEGIN
    -- notifications
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'notifications already in publication';
    END;

    -- post_reactions
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'post_reactions already in publication';
    END;

    -- direct_messages
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'direct_messages already in publication';
    END;

    -- comments
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE comments;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'comments already in publication';
    END;

    -- posts
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE posts;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'posts already in publication';
    END;
END $$;

-- 3. Проверка результата - ВСЕ должны быть ✅
SELECT 
  c.relname as "Таблица",
  CASE c.relreplident 
    WHEN 'd' THEN '❌ default (НЕ РАБОТАЕТ)' 
    WHEN 'f' THEN '✅ FULL (ОК!)' 
  END as "REPLICA IDENTITY",
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables pt
    WHERE pt.tablename = c.relname 
    AND pt.pubname = 'supabase_realtime'
  ) THEN '✅ В publication'
  ELSE '❌ НЕ в publication'
  END as "Publication Status"
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('notifications', 'post_reactions', 'direct_messages', 'comments', 'posts')
ORDER BY c.relname;

-- РЕЗУЛЬТАТ ДОЛЖЕН БЫТЬ:
-- Таблица          | REPLICA IDENTITY  | Publication Status
-- -----------------|-------------------|-------------------
-- comments         | ✅ FULL (ОК!)     | ✅ В publication
-- direct_messages  | ✅ FULL (ОК!)     | ✅ В publication
-- notifications    | ✅ FULL (ОК!)     | ✅ В publication
-- post_reactions   | ✅ FULL (ОК!)     | ✅ В publication
-- posts            | ✅ FULL (ОК!)     | ✅ В publication
