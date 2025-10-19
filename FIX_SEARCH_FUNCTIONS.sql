-- ============================================================================
-- FIX SEARCH FUNCTIONS - Быстрое исправление ошибки поиска
-- ============================================================================
-- Применить этот скрипт чтобы пересоздать RPC функции с правильной структурой
-- Исправляет ошибку: column p.likes does not exist
-- ============================================================================

-- 1. Удалить старые функции (если есть)
DROP FUNCTION IF EXISTS search_posts(text, text, uuid, timestamptz, timestamptz, text, int, int);
DROP FUNCTION IF EXISTS search_users(text, int);
DROP FUNCTION IF EXISTS get_search_suggestions(text, int);

-- ============================================================================
-- 2. Создать исправленную функцию search_posts
-- ============================================================================

CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  tag_filter TEXT DEFAULT NULL,
  author_filter UUID DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  views INT,
  likes BIGINT,
  dislikes BIGINT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  author_username TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,
  tags TEXT[],
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  ts_query tsquery;
BEGIN
  ts_query := plainto_tsquery('russian', search_query);
  
  RETURN QUERY
  WITH post_stats AS (
    SELECT
      p.id,
      p.title,
      LEFT(p.content, 300) as content,
      p.author_id,
      p.views,
      p.created_at,
      p.search_vector,
      
      prof.username as author_username,
      prof.display_name as author_display_name,
      prof.avatar_url as author_avatar_url,
      
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.id END) as like_count,
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.id END) as dislike_count,
      COUNT(DISTINCT c.id) as comment_count,
      COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::TEXT[]) as tag_array,
      ts_rank(p.search_vector, ts_query) as search_rank
      
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN post_reactions pr ON p.id = pr.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    
    WHERE
      (search_query = '' OR p.search_vector @@ ts_query)
      AND (
        tag_filter IS NULL 
        OR EXISTS (
          SELECT 1 FROM post_tags pt2
          JOIN tags t2 ON t2.id = pt2.tag_id
          WHERE pt2.post_id = p.id AND t2.name ILIKE tag_filter
        )
      )
      AND (author_filter IS NULL OR p.author_id = author_filter)
      AND (date_from IS NULL OR p.created_at >= date_from)
      AND (date_to IS NULL OR p.created_at <= date_to)
      
    GROUP BY p.id, prof.username, prof.display_name, prof.avatar_url
  )
  
  SELECT
    ps.id,
    ps.title,
    ps.content,
    ps.author_id,
    ps.views,
    ps.like_count,
    ps.dislike_count,
    ps.comment_count,
    ps.created_at,
    ps.author_username,
    ps.author_display_name,
    ps.author_avatar_url,
    ps.tag_array as tags,
    ps.search_rank as rank
  FROM post_stats ps
  
  ORDER BY
    CASE WHEN sort_by = 'relevance' THEN ps.search_rank END DESC NULLS LAST,
    CASE WHEN sort_by = 'recent' THEN ps.created_at END DESC NULLS LAST,
    CASE WHEN sort_by = 'popular' THEN ps.like_count END DESC NULLS LAST,
    ps.created_at DESC
    
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- ============================================================================
-- 3. Создать функцию search_users
-- ============================================================================

CREATE OR REPLACE FUNCTION search_users(
  search_query TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  reputation INT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  ts_query tsquery;
BEGIN
  ts_query := plainto_tsquery('russian', search_query);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.reputation
  FROM profiles p
  WHERE 
    p.search_vector @@ ts_query
    OR p.username ILIKE '%' || search_query || '%'
    OR p.display_name ILIKE '%' || search_query || '%'
  ORDER BY
    ts_rank(p.search_vector, ts_query) DESC,
    p.reputation DESC
  LIMIT result_limit;
END;
$$;

-- ============================================================================
-- 4. Создать функцию get_search_suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_prefix TEXT,
  result_limit INT DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  type TEXT,
  count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      p.title as suggestion,
      'post_title'::TEXT as type,
      1 as count
    FROM posts p
    WHERE p.title ILIKE search_prefix || '%'
    ORDER BY p.views DESC
    LIMIT result_limit
  )
  UNION ALL
  (
    SELECT 
      t.name as suggestion,
      'tag'::TEXT as type,
      COUNT(pt.post_id)::INT as count
    FROM tags t
    LEFT JOIN post_tags pt ON pt.tag_id = t.id
    WHERE t.name ILIKE search_prefix || '%'
    GROUP BY t.id, t.name
    ORDER BY COUNT(pt.post_id) DESC
    LIMIT result_limit
  )
  UNION ALL
  (
    SELECT 
      p.username as suggestion,
      'username'::TEXT as type,
      p.reputation as count
    FROM profiles p
    WHERE p.username ILIKE search_prefix || '%'
    ORDER BY p.reputation DESC
    LIMIT result_limit
  )
  ORDER BY count DESC
  LIMIT result_limit;
END;
$$;

-- ============================================================================
-- 5. Предоставить права доступа
-- ============================================================================

GRANT EXECUTE ON FUNCTION search_posts TO public, authenticated, anon;
GRANT EXECUTE ON FUNCTION search_users TO public, authenticated, anon;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO public, authenticated, anon;

-- ============================================================================
-- 6. ТЕСТ - Проверить что функции работают
-- ============================================================================

-- Должен вернуть результаты (или пустую таблицу если нет постов)
SELECT COUNT(*) as posts_found FROM search_posts('', NULL, NULL, NULL, NULL, 'relevance', 10, 0);

-- Должен вернуть пользователей (или пусто)
SELECT COUNT(*) as users_found FROM search_users('', 10);

-- Должен вернуть предложения (или пусто)
SELECT COUNT(*) as suggestions_found FROM get_search_suggestions('', 10);

-- ============================================================================
-- УСПЕХ!
-- ============================================================================
-- Если все 3 теста выполнились без ошибок:
-- ✅ Функции созданы правильно
-- ✅ Поиск должен работать в приложении
-- → Перезагрузите страницу /search и попробуйте поиск!
