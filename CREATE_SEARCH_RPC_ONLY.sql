-- ============================================================================
-- CREATE SEARCH RPC FUNCTIONS ONLY
-- ============================================================================
-- Если индексы созданы, но RPC функции отсутствуют
-- Выполните этот скрипт чтобы создать только функции
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: search_posts (Full-Text Search)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  tag_filter TEXT DEFAULT NULL,
  author_filter UUID DEFAULT NULL,
  date_from TIMESTAMP DEFAULT NULL,
  date_to TIMESTAMP DEFAULT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE,
  author_username TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,
  tags TEXT[],
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
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
      p.tags,
      p.search_vector,
      
      -- Calculate rank based on search_vector
      CASE 
        WHEN search_query = '' THEN 0
        ELSE ts_rank(p.search_vector, to_tsquery('russian', search_query || ':*'))
      END as search_rank,
      
      -- Get author info
      prof.username as author_username,
      prof.display_name as author_display_name,
      prof.avatar_url as author_avatar_url,
      
      -- Aggregate likes
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.id END) as like_count,
      
      -- Aggregate dislikes
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.id END) as dislike_count,
      
      -- Count comments
      COUNT(DISTINCT c.id) as comment_count
      
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN post_reactions pr ON p.id = pr.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    
    WHERE
      -- Full-Text Search filter
      (
        search_query = '' 
        OR p.search_vector @@ to_tsquery('russian', search_query || ':*')
      )
      
      -- Tag filter
      AND (tag_filter IS NULL OR tag_filter = ANY(p.tags))
      
      -- Author filter
      AND (author_filter IS NULL OR p.author_id = author_filter)
      
      -- Date range filter
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
    ps.tags,
    ps.search_rank as rank
  FROM post_stats ps
  
  -- Sorting
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
-- 2. FUNCTION: search_users (User search with autocomplete)
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
    search_query = ''
    OR p.search_vector @@ to_tsquery('russian', search_query || ':*')
    OR p.username ILIKE '%' || search_query || '%'
    OR p.display_name ILIKE '%' || search_query || '%'
  ORDER BY
    -- Exact match first
    CASE WHEN p.username = search_query THEN 1 ELSE 2 END,
    -- Then by reputation
    p.reputation DESC,
    -- Then by username
    p.username
  LIMIT result_limit;
END;
$$;

-- ============================================================================
-- 3. FUNCTION: get_search_suggestions (Autocomplete suggestions)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_query TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  type TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  
  -- Post titles that match
  SELECT 
    p.title as suggestion,
    'post_title'::TEXT as type,
    1::BIGINT as count
  FROM posts p
  WHERE 
    p.search_vector @@ to_tsquery('russian', search_query || ':*')
    OR p.title ILIKE '%' || search_query || '%'
  ORDER BY p.views DESC
  LIMIT (result_limit / 3)
  
  UNION ALL
  
  -- Tags that match
  SELECT
    unnest(p.tags) as suggestion,
    'tag'::TEXT as type,
    COUNT(*)::BIGINT as count
  FROM posts p
  WHERE unnest(p.tags) ILIKE '%' || search_query || '%'
  GROUP BY unnest(p.tags)
  ORDER BY count DESC
  LIMIT (result_limit / 3)
  
  UNION ALL
  
  -- Usernames that match
  SELECT
    prof.username as suggestion,
    'username'::TEXT as type,
    prof.reputation::BIGINT as count
  FROM profiles prof
  WHERE
    prof.search_vector @@ to_tsquery('russian', search_query || ':*')
    OR prof.username ILIKE '%' || search_query || '%'
  ORDER BY prof.reputation DESC
  LIMIT (result_limit / 3);
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to use search functions
GRANT EXECUTE ON FUNCTION search_posts TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_users TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated, anon;

-- ============================================================================
-- TEST THE FUNCTIONS
-- ============================================================================

-- Test search_posts
SELECT COUNT(*) as search_posts_works FROM search_posts('test', NULL, NULL, NULL, NULL, 'relevance', 10, 0);

-- Test search_users
SELECT COUNT(*) as search_users_works FROM search_users('test', 10);

-- Test get_search_suggestions
SELECT COUNT(*) as suggestions_work FROM get_search_suggestions('test', 10);

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Если все 3 теста вернули результат:
-- ✅ search_posts создана
-- ✅ search_users создана
-- ✅ get_search_suggestions создана
-- → Full-Text Search должен работать в приложении!
