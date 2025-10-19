-- ============================================================================
-- ФИНАЛЬНОЕ РЕШЕНИЕ БЕЗ DISCARD (работает в транзакции)
-- ============================================================================
-- Просто скопируйте и выполните в Supabase SQL Editor
-- ============================================================================

-- Полное удаление старых версий
DROP FUNCTION IF EXISTS get_posts_with_counts(text, integer, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_posts_with_counts(text, integer) CASCADE;
DROP FUNCTION IF EXISTS get_posts_with_counts(text) CASCADE;
DROP FUNCTION IF EXISTS get_posts_with_counts() CASCADE;

-- Создание SQL функции (не PLPGSQL!)
CREATE OR REPLACE FUNCTION get_posts_with_counts(
  sort_by text DEFAULT 'recent',
  limit_count integer DEFAULT 20,
  user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  title text,
  content text,
  views integer,
  likes integer,
  dislikes integer,
  is_pinned boolean,
  media_urls json,
  audio_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  author json,
  tags json,
  comment_count bigint,
  user_reaction text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.author_id,
    p.title,
    p.content,
    p.views,
    COALESCE(like_counts.like_count, 0)::integer as likes,
    COALESCE(dislike_counts.dislike_count, 0)::integer as dislikes,
    p.is_pinned,
    p.media_urls,
    p.audio_url,
    p.created_at,
    p.updated_at,
    json_build_object(
      'username', pr.username,
      'display_name', pr.display_name,
      'avatar_url', pr.avatar_url,
      'reputation', pr.reputation
    )::json as author,
    COALESCE(
      (
        SELECT json_agg(json_build_object('name', t.name::text))::json
        FROM post_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE pt.post_id = p.id
      ),
      '[]'::json
    ) as tags,
    COALESCE(comment_counts.comment_count, 0)::bigint as comment_count,
    CASE
      WHEN $3 IS NOT NULL THEN (
        SELECT reaction_type::text
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id 
          AND pr2.user_id = $3
        LIMIT 1
      )
      ELSE NULL::text
    END as user_reaction
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN (
    SELECT post_id, COUNT(*)::bigint as comment_count
    FROM comments
    GROUP BY post_id
  ) comment_counts ON p.id = comment_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*)::integer as like_count
    FROM post_reactions
    WHERE reaction_type = 'like'
    GROUP BY post_id
  ) like_counts ON p.id = like_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*)::integer as dislike_count
    FROM post_reactions
    WHERE reaction_type = 'dislike'
    GROUP BY post_id
  ) dislike_counts ON p.id = dislike_counts.post_id
  ORDER BY
    CASE
      WHEN $1 = 'popular' THEN COALESCE(like_counts.like_count, 0)
      ELSE 0
    END DESC,
    CASE
      WHEN $1 = 'discussed' THEN p.views
      ELSE 0
    END DESC,
    p.created_at DESC
  LIMIT $2;
$$;

-- Права доступа
GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO anon;

-- Тест
SELECT 
  id,
  title,
  tags,
  pg_typeof(tags) as tags_type
FROM get_posts_with_counts('recent', 3, NULL);

-- ============================================================================
-- Если видите результаты без ошибок - ГОТОВО! ✅
-- Перезапустите npm run dev
-- ============================================================================
