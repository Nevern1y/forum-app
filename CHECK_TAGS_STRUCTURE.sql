-- ============================================================================
-- ПРОВЕРКА СТРУКТУРЫ ТАБЛИЦ TAGS И POST_TAGS
-- ============================================================================
-- Выполните в Supabase SQL Editor
-- ============================================================================

-- Проверка 1: Структура таблицы tags
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tags'
ORDER BY ordinal_position;

-- Проверка 2: Структура таблицы post_tags
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_tags'
ORDER BY ordinal_position;

-- Проверка 3: Пример данных из tags
SELECT * FROM tags LIMIT 3;

-- Проверка 4: Пример данных из post_tags
SELECT * FROM post_tags LIMIT 3;

-- Проверка 5: Тест json_agg напрямую
SELECT 
    post_id,
    json_agg(json_build_object('name', t.name)) as tags_json,
    pg_typeof(json_agg(json_build_object('name', t.name))) as type
FROM post_tags pt
JOIN tags t ON pt.tag_id = t.id
GROUP BY post_id
LIMIT 1;

-- ============================================================================
-- ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
-- tags.name должен быть типа text (не text[])
-- post_tags должен иметь post_id и tag_id (оба uuid или bigint)
-- json_agg должен возвращать тип json
-- ============================================================================
