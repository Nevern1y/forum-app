-- ============================================================================
-- ПРОСТОЕ РЕШЕНИЕ: Функция БЕЗ тегов (для проверки)
-- ============================================================================
-- Сначала проверим работает ли функция без тегов
-- ============================================================================

DROP FUNCTION IF EXISTS get_posts_with_counts_test(text, integer, uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_posts_with_counts_test(
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
    '[]'::json as tags,  -- Пустой массив для тестирования
    COALESCE(comment_counts.comment_count, 0) as comment_count,
    CASE
      WHEN get_posts_with_counts_test.user_id IS NOT NULL THEN (
        SELECT reaction_type
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id 
          AND pr2.user_id = get_posts_with_counts_test.user_id
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

GRANT EXECUTE ON FUNCTION get_posts_with_counts_test(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_with_counts_test(text, integer, uuid) TO anon;

-- Тест - ДОЛЖЕН РАБОТАТЬ!
SELECT * FROM get_posts_with_counts_test('recent', 3, NULL);

-- ============================================================================
-- ЕСЛИ ТЕСТ РАБОТАЕТ:
-- Проблема точно в агрегации тегов, проверьте структуру таблицы tags
-- выполнив CHECK_TAGS_STRUCTURE.sql
--
-- ЕСЛИ ТЕСТ НЕ РАБОТАЕТ:
-- Проблема в другой колонке, возможно в media_urls или profiles
-- ============================================================================
