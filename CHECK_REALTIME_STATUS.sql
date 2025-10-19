-- Проверка статуса Realtime для post_reactions и notifications
SELECT 
  schemaname,
  tablename,
  'Is in publication' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('post_reactions', 'notifications')
ORDER BY tablename;

-- Проверка всех таблиц в публикации
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
