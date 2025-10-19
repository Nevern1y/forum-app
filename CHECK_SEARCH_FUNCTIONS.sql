-- ============================================================================
-- CHECK SEARCH FUNCTIONS - Проверка RPC функций для Full-Text Search
-- ============================================================================

-- 1. Проверить существование RPC функций
SELECT 
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('search_posts', 'search_users', 'get_search_suggestions')
ORDER BY routine_name;

-- Должны быть:
-- search_posts
-- search_users  
-- get_search_suggestions

-- ============================================================================
-- 2. Проверить детали функции search_posts
-- ============================================================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'search_posts';

-- ============================================================================
-- 3. Проверить search_vector колонки
-- ============================================================================

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND column_name = 'search_vector'
ORDER BY table_name;

-- Должны быть:
-- posts.search_vector (tsvector)
-- profiles.search_vector (tsvector)

-- ============================================================================
-- 4. Проверить триггеры для auto-update
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%search_vector%'
ORDER BY event_object_table, trigger_name;

-- Должны быть:
-- trigger_update_posts_search_vector (posts)
-- trigger_update_profiles_search_vector (profiles)

-- ============================================================================
-- 5. Тестовый поиск (проверить работу функции)
-- ============================================================================

-- Если функция существует, этот запрос должен работать:
SELECT * FROM search_posts(
  search_query := 'test',
  tag_filter := NULL,
  author_filter := NULL,
  date_from := NULL,
  date_to := NULL,
  sort_by := 'relevance',
  page_size := 10,
  page_offset := 0
);

-- Если ошибка "function does not exist" - нужно создать RPC функции
-- Если другая ошибка - смотрите детали ошибки

-- ============================================================================
-- 6. Проверить заполнение search_vector
-- ============================================================================

-- Посты с заполненным search_vector
SELECT 
  COUNT(*) as posts_with_search_vector,
  COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as non_null_count
FROM posts;

-- Профили с заполненным search_vector  
SELECT 
  COUNT(*) as profiles_with_search_vector,
  COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as non_null_count
FROM profiles;

-- ============================================================================
-- РЕЗУЛЬТАТ
-- ============================================================================

-- Если все 4 проверки пройдены:
-- ✅ RPC функции существуют
-- ✅ search_vector колонки есть
-- ✅ Триггеры работают
-- ✅ Данные заполнены
-- → Full-Text Search должен работать!

-- Если что-то отсутствует:
-- → Примените 033_add_full_text_search.sql полностью
