-- Проверка RLS политик для friendships
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'friendships'
ORDER BY cmd;
