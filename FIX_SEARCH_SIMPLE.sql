-- ============================================================================
-- SIMPLE SEARCH FIX - Упрощенная версия поиска без полнотекстового поиска
-- ============================================================================
-- Эта версия работает даже если search_vector не настроен
-- Использует простой ILIKE для поиска
-- ============================================================================

-- Удалить все версии функции search_posts
DROP FUNCTION IF EXISTS search_posts(text, text, uuid, timestamptz, timestamptz, text, int, int) CASCADE;
DROP FUNCTION IF EXISTS search_posts CASCADE;

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
  likes INT,
  dislikes INT,
  comment_count INT,
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
BEGIN
  RETURN QUERY
  WITH post_stats AS (
    SELECT
      p.id,
      p.title,
      LEFT(p.content, 300) as content,
      p.author_id,
      p.views,
      p.created_at,
      
      prof.username as author_username,
      prof.display_name as author_display_name,
      prof.avatar_url as author_avatar_url,
      
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.id END)::INT as like_count,
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.id END)::INT as dislike_count,
      COUNT(DISTINCT c.id)::INT as comment_count,
      COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::TEXT[]) as tag_array,
      
      -- Simple relevance score based on title/content match
      (CASE 
        WHEN search_query = '' THEN 0
        WHEN p.title ILIKE '%' || search_query || '%' THEN 2.0
        WHEN p.content ILIKE '%' || search_query || '%' THEN 1.0
        ELSE 0.0
      END)::REAL as search_rank
      
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN post_reactions pr ON p.id = pr.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    
    WHERE
      -- Search in title or content
      (
        search_query = '' 
        OR p.title ILIKE '%' || search_query || '%'
        OR p.content ILIKE '%' || search_query || '%'
      )
      -- Tag filter
      AND (
        tag_filter IS NULL 
        OR EXISTS (
          SELECT 1 FROM post_tags pt2
          JOIN tags t2 ON t2.id = pt2.tag_id
          WHERE pt2.post_id = p.id AND t2.name ILIKE tag_filter
        )
      )
      -- Author filter
      AND (author_filter IS NULL OR p.author_id = author_filter)
      -- Date filters
      AND (date_from IS NULL OR p.created_at >= date_from)
      AND (date_to IS NULL OR p.created_at <= date_to)
      
    GROUP BY p.id, p.title, p.content, p.views, p.created_at, prof.username, prof.display_name, prof.avatar_url
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
-- Простая функция поиска пользователей
-- ============================================================================

DROP FUNCTION IF EXISTS search_users(text, int) CASCADE;
DROP FUNCTION IF EXISTS search_users CASCADE;

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
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.reputation
  FROM profiles p
  WHERE
    p.username ILIKE '%' || search_query || '%'
    OR p.display_name ILIKE '%' || search_query || '%'
  ORDER BY p.reputation DESC
  LIMIT result_limit;
END;
$$;

-- ============================================================================
-- Простая функция автодополнения
-- ============================================================================

DROP FUNCTION IF EXISTS get_search_suggestions(text, int) CASCADE;
DROP FUNCTION IF EXISTS get_search_suggestions CASCADE;

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
  WITH post_suggestions AS (
    SELECT
      p.title as suggestion,
      'post_title'::TEXT as type,
      1 as count
    FROM posts p
    WHERE p.title ILIKE search_prefix || '%'
    ORDER BY p.views DESC
    LIMIT result_limit / 2
  ),
  tag_suggestions AS (
    SELECT
      t.name as suggestion,
      'tag'::TEXT as type,
      COUNT(pt.post_id)::INT as count
    FROM tags t
    LEFT JOIN post_tags pt ON t.id = pt.tag_id
    WHERE t.name ILIKE search_prefix || '%'
    GROUP BY t.id, t.name
    ORDER BY COUNT(pt.post_id) DESC
    LIMIT result_limit / 2
  )
  SELECT * FROM post_suggestions
  UNION ALL
  SELECT * FROM tag_suggestions;
END;
$$;

-- ============================================================================
-- ГОТОВО! Теперь поиск работает с простым ILIKE
-- ============================================================================
-- 
-- ИНСТРУКЦИЯ:
-- 1. Откройте Supabase Dashboard -> SQL Editor
-- 2. Скопируйте и вставьте весь этот файл
-- 3. Нажмите "Run" чтобы выполнить скрипт
-- 4. Обновите страницу поиска в браузере
-- 
-- После этого поиск будет работать!
-- ============================================================================
