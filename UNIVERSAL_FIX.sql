-- ============================================================================
-- УНИВЕРСАЛЬНОЕ РЕШЕНИЕ (работает в большинстве случаев)
-- ============================================================================
-- Это решение обходит проблему с типами используя to_jsonb
-- Выполните в Supabase SQL Editor
-- ============================================================================

DROP FUNCTION IF EXISTS get_posts_with_counts(text, integer, uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_posts_with_counts(
  sort_by text DEFAULT 'recent',
  limit_count integer DEFAULT 20,
  user_id uuid DEFAULT NULL
) RETURNS TABLE (
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
) AS $$
BEGIN
  RETURN QUERY
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
    ) as author,
    -- УНИВЕРСАЛЬНОЕ РЕШЕНИЕ: to_jsonb гарантирует правильный тип
    COALESCE(
      to_jsonb(
        ARRAY(
          SELECT json_build_object('name', t.name)
          FROM post_tags pt
          JOIN tags t ON pt.tag_id = t.id
          WHERE pt.post_id = p.id
        )
      )::json,
      '[]'::json
    ) as tags,
    COALESCE(comment_counts.comment_count, 0) as comment_count,
    CASE
      WHEN get_posts_with_counts.user_id IS NOT NULL THEN (
        SELECT reaction_type
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id 
          AND pr2.user_id = get_posts_with_counts.user_id
        LIMIT 1
      )
      ELSE NULL
    END as user_reaction
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM comments
    GROUP BY post_id
  ) comment_counts ON p.id = comment_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as like_count
    FROM post_reactions
    WHERE reaction_type = 'like'
    GROUP BY post_id
  ) like_counts ON p.id = like_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as dislike_count
    FROM post_reactions
    WHERE reaction_type = 'dislike'
    GROUP BY post_id
  ) dislike_counts ON p.id = dislike_counts.post_id
  ORDER BY
    CASE
      WHEN sort_by = 'popular' THEN COALESCE(like_counts.like_count, 0)
      ELSE 0
    END DESC,
    CASE
      WHEN sort_by = 'discussed' THEN p.views
      ELSE 0
    END DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO anon;

-- ============================================================================
-- ТЕСТ: Проверка что функция работает
-- ============================================================================
SELECT 
  id,
  title,
  tags,
  pg_typeof(tags) as tags_type  -- Должно быть 'json'
FROM get_posts_with_counts('recent', 3, NULL);

-- Если видите результат без ошибок - ГОТОВО! ✅
-- ============================================================================
