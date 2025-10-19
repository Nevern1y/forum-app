-- ============================================================================
-- ПРОВЕРКА ТЕКУЩЕЙ ВЕРСИИ ФУНКЦИИ get_posts_with_counts
-- ============================================================================
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor
-- чтобы увидеть текущую версию функции
-- ============================================================================

SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'get_posts_with_counts';

-- ============================================================================
-- ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
-- ============================================================================
-- return_type должен содержать:
-- TABLE(id uuid, author_id uuid, title text, content text, views integer, 
--       likes integer, dislikes integer, is_pinned boolean, media_urls json, 
--       audio_url text, created_at timestamp with time zone, 
--       updated_at timestamp with time zone, author json, tags json, 
--       comment_count bigint, user_reaction text)
--
-- Если tags указан как text[] - функцию нужно обновить!
-- ============================================================================
