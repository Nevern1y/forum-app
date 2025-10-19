-- Проверка replica identity для post_reactions и notifications
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('post_reactions', 'notifications')
  AND indexname LIKE '%pkey%';

-- Проверка текущего replica identity
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

-- Если replica identity не 'default', установите его:
-- ALTER TABLE post_reactions REPLICA IDENTITY DEFAULT;
-- ALTER TABLE notifications REPLICA IDENTITY DEFAULT;
