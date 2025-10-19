-- ============================================================================
-- КРИТИЧЕСКАЯ ПРОВЕРКА: Структура таблицы tags
-- ============================================================================

-- Проверка 1: Структура tags (КЛЮЧЕВАЯ!)
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tags'
ORDER BY ordinal_position;

-- Проверка 2: Пример данных
SELECT * FROM tags LIMIT 5;

-- Проверка 3: Тип колонки name (прямая проверка)
SELECT 
    pg_typeof(name) as name_type,
    name
FROM tags 
LIMIT 3;

-- Проверка 4: Тест json_agg напрямую
SELECT 
    json_agg(json_build_object('name', name)) as test_json,
    pg_typeof(json_agg(json_build_object('name', name))) as json_type
FROM tags
WHERE id IN (SELECT tag_id FROM post_tags LIMIT 1);

-- ============================================================================
-- ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
-- name должен быть 'text' (НЕ 'text[]' или '_text')
-- json_type должен быть 'json' (НЕ 'text[]')
-- ============================================================================
