-- ============================================================================
-- ОТЛАДКА: Проверка агрегации тегов НАПРЯМУЮ
-- ============================================================================
-- Выполните это чтобы увидеть что именно возвращает агрегация
-- ============================================================================

-- Тест 1: Прямая агрегация из tags
SELECT 
    'Тест 1: Прямая агрегация' as test,
    json_agg(json_build_object('name', name)) as result,
    pg_typeof(json_agg(json_build_object('name', name))) as result_type
FROM tags
WHERE id IN (SELECT tag_id FROM post_tags LIMIT 3);

-- Тест 2: Через подзапрос (как в функции)
SELECT 
    'Тест 2: Через подзапрос' as test,
    (
        SELECT json_agg(json_build_object('name', t.name))
        FROM post_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE pt.post_id = p.id
    ) as result,
    pg_typeof(
        (
            SELECT json_agg(json_build_object('name', t.name))
            FROM post_tags pt
            JOIN tags t ON pt.tag_id = t.id
            WHERE pt.post_id = p.id
        )
    ) as result_type
FROM posts p
LIMIT 1;

-- Тест 3: С явным приведением к json
SELECT 
    'Тест 3: С ::json приведением' as test,
    (
        SELECT json_agg(json_build_object('name', t.name))::json
        FROM post_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE pt.post_id = p.id
    ) as result,
    pg_typeof(
        (
            SELECT json_agg(json_build_object('name', t.name))::json
            FROM post_tags pt
            JOIN tags t ON pt.tag_id = t.id
            WHERE pt.post_id = p.id
        )
    ) as result_type
FROM posts p
LIMIT 1;

-- Тест 4: С COALESCE
SELECT 
    'Тест 4: С COALESCE' as test,
    COALESCE(
        (
            SELECT json_agg(json_build_object('name', t.name))
            FROM post_tags pt
            JOIN tags t ON pt.tag_id = t.id
            WHERE pt.post_id = p.id
        ),
        '[]'::json
    ) as result,
    pg_typeof(
        COALESCE(
            (
                SELECT json_agg(json_build_object('name', t.name))
                FROM post_tags pt
                JOIN tags t ON pt.tag_id = t.id
                WHERE pt.post_id = p.id
            ),
            '[]'::json
        )
    ) as result_type
FROM posts p
LIMIT 1;

-- Тест 5: Версия PostgreSQL
SELECT 
    'Версия PostgreSQL:' as info,
    version() as pg_version;

-- ============================================================================
-- ПОКАЖИТЕ МНЕ ВСЕ 5 РЕЗУЛЬТАТОВ!
-- Особенно важны result_type - должно быть 'json' везде
-- ============================================================================
