-- ============================================================================
-- FULL-TEXT SEARCH: PostgreSQL Full-Text Search for posts and users
-- ============================================================================
-- Enables fast search across posts (title, content) and profiles (username)
-- Uses ts_vector for optimized search performance
-- ============================================================================

-- ============================================================================
-- 1. ADD ts_vector columns for Full-Text Search
-- ============================================================================

-- Add ts_vector column to posts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE posts ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Add ts_vector column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE profiles ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE GIN indexes for fast search
-- ============================================================================

-- GIN index on posts search_vector (much faster than LIKE queries!)
CREATE INDEX IF NOT EXISTS idx_posts_search_vector 
ON posts USING GIN(search_vector);

-- GIN index on profiles search_vector
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector 
ON profiles USING GIN(search_vector);

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc 
ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_author_created 
ON posts(author_id, created_at DESC);

-- ============================================================================
-- 3. FUNCTION: Update search_vector for posts
-- ============================================================================

CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create search vector from title (weight A) and content (weight B)
  -- Weight A is more important than B in ranking
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.content, '')), 'B');
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. FUNCTION: Update search_vector for profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profiles_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create search vector from username and display_name
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.display_name, '')), 'B');
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. TRIGGERS: Auto-update search_vector on INSERT/UPDATE
-- ============================================================================

-- Trigger for posts
DROP TRIGGER IF EXISTS trigger_update_posts_search_vector ON posts;
CREATE TRIGGER trigger_update_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, content
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_search_vector();

-- Trigger for profiles
DROP TRIGGER IF EXISTS trigger_update_profiles_search_vector ON profiles;
CREATE TRIGGER trigger_update_profiles_search_vector
  BEFORE INSERT OR UPDATE OF username, display_name
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_search_vector();

-- ============================================================================
-- 6. POPULATE existing data
-- ============================================================================

-- Update search_vector for all existing posts
UPDATE posts 
SET search_vector = 
  setweight(to_tsvector('russian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(content, '')), 'B')
WHERE search_vector IS NULL;

-- Update search_vector for all existing profiles
UPDATE profiles
SET search_vector = 
  setweight(to_tsvector('russian', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(display_name, '')), 'B')
WHERE search_vector IS NULL;

-- ============================================================================
-- 7. RPC: Advanced search with filters
-- ============================================================================

CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  tag_filter TEXT DEFAULT NULL,
  author_filter UUID DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance', -- 'relevance', 'recent', 'popular'
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
  -- Convert search query to tsquery
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
      
      -- Get author info
      prof.username as author_username,
      prof.display_name as author_display_name,
      prof.avatar_url as author_avatar_url,
      
      -- Aggregate likes
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.id END) as like_count,
      
      -- Aggregate dislikes
      COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.id END) as dislike_count,
      
      -- Count comments
      COUNT(DISTINCT c.id) as comment_count,
      
      -- Get tags array
      COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::TEXT[]) as tag_array,
      
      -- Calculate rank
      ts_rank(p.search_vector, ts_query) as search_rank
      
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN post_reactions pr ON p.id = pr.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    
    WHERE
      -- Full-Text Search filter
      (search_query = '' OR p.search_vector @@ ts_query)
      
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
    ps.tag_array as tags,
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

GRANT EXECUTE ON FUNCTION search_posts TO public;

COMMENT ON FUNCTION search_posts IS 'Advanced full-text search with filters and sorting';

-- ============================================================================
-- 8. RPC: Search users (for autocomplete)
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
  -- Convert to tsquery
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

GRANT EXECUTE ON FUNCTION search_users TO public;

-- ============================================================================
-- 9. RPC: Get search suggestions (autocomplete)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_prefix TEXT,
  result_limit INT DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  type TEXT, -- 'post_title', 'tag', 'username'
  count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  -- Post titles
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
  -- Tags
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
  -- Usernames
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

GRANT EXECUTE ON FUNCTION get_search_suggestions TO public;

-- ============================================================================
-- 10. VERIFICATION
-- ============================================================================

-- Test Full-Text Search
/*
-- Search for posts containing "javascript"
SELECT * FROM search_posts('javascript', NULL, NULL, NULL, NULL, 'relevance', 10, 0);

-- Search with tag filter
SELECT * FROM search_posts('react', 'javascript', NULL, NULL, NULL, 'relevance', 10, 0);

-- Search users
SELECT * FROM search_users('john', 10);

-- Get autocomplete suggestions
SELECT * FROM get_search_suggestions('java', 5);
*/

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%search%'
  OR indexname LIKE '%posts_created%'
ORDER BY tablename, indexname;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN posts.search_vector IS 'Full-text search vector for title and content';
COMMENT ON COLUMN profiles.search_vector IS 'Full-text search vector for username and display_name';
COMMENT ON FUNCTION search_posts IS 'Full-text search with filters: tags, author, dates, sorting';
COMMENT ON FUNCTION search_users IS 'Search users by username or display name';
COMMENT ON FUNCTION get_search_suggestions IS 'Autocomplete suggestions for search';
