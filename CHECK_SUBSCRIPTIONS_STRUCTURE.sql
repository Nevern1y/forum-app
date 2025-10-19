-- Проверка структуры таблицы subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;
