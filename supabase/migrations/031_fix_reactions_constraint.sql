-- ============================================================================
-- FIX: Post Reactions UNIQUE Constraint
-- ============================================================================
-- Problem: UNIQUE(post_id, user_id, reaction_type) allows user to have
--          both like AND dislike on same post - logically incorrect!
-- Solution: Change to UNIQUE(post_id, user_id) - one reaction per user per post
-- ============================================================================

-- 1. Удаляем старый constraint
ALTER TABLE post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_reaction_type_key;

-- 2. Удаляем дубликаты если есть (один пользователь с несколькими реакциями на один пост)
-- Оставляем только последнюю реакцию
DELETE FROM post_reactions a
USING post_reactions b
WHERE a.post_id = b.post_id
  AND a.user_id = b.user_id
  AND a.id < b.id;  -- Удаляем старые, оставляем новые (больший ID)

-- 3. Создаем правильный constraint
ALTER TABLE post_reactions 
ADD CONSTRAINT post_reactions_post_user_unique 
UNIQUE (post_id, user_id);

-- 4. Добавляем индекс для быстрого UPSERT
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_user 
ON post_reactions(post_id, user_id);

-- ============================================================================
-- ПРОВЕРКА
-- ============================================================================

-- Должно показать constraint post_reactions_post_user_unique
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'post_reactions'
  AND con.contype = 'u';  -- unique constraints

-- ============================================================================
-- КОММЕНТАРИЙ
-- ============================================================================

COMMENT ON CONSTRAINT post_reactions_post_user_unique ON post_reactions IS
'Ensures one user can have only one reaction (like OR dislike) per post, not both';

-- ============================================================================
-- ТЕСТ (опционально)
-- ============================================================================

/*
-- Должно вставиться
INSERT INTO post_reactions (post_id, user_id, reaction_type)
VALUES ('some-post-id', 'some-user-id', 'like');

-- Должно обновиться (UPSERT)
INSERT INTO post_reactions (post_id, user_id, reaction_type)
VALUES ('some-post-id', 'some-user-id', 'dislike')
ON CONFLICT (post_id, user_id)
DO UPDATE SET 
  reaction_type = EXCLUDED.reaction_type,
  created_at = NOW();

-- Очистка
DELETE FROM post_reactions 
WHERE post_id = 'some-post-id' AND user_id = 'some-user-id';
*/
