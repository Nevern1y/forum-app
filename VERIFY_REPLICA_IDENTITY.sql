-- Проверка что replica identity изменился на 'default'
SELECT 
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN '✅ default (primary key) - CORRECT'
    WHEN 'n' THEN '❌ nothing - WRONG'
    WHEN 'f' THEN '❌ full - WRONG (causes mismatch error)'
    WHEN 'i' THEN '❌ index - WRONG'
  END AS replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('post_reactions', 'notifications')
  AND c.relkind = 'r'
ORDER BY c.relname;

-- Если видите "❌ full", выполните:
-- ALTER TABLE post_reactions REPLICA IDENTITY DEFAULT;
-- ALTER TABLE notifications REPLICA IDENTITY DEFAULT;
