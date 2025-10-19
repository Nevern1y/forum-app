-- ============================================================================
-- КРИТИЧЕСКАЯ ДИАГНОСТИКА - выполните ВСЁ и покажите результаты
-- ============================================================================

-- ПРОВЕРКА 1: Тип колонки name в tags
SELECT 
    'Проверка колонки tags.name:' as step,
    column_name,
    data_type,
    udt_name,
    CASE 
        WHEN data_type = 'ARRAY' THEN '❌ ЭТО МАССИВ! (корень проблемы)'
        WHEN udt_name = '_text' THEN '❌ ЭТО МАССИВ! (корень проблемы)'
        WHEN data_type = 'text' THEN '✅ Правильно'
        ELSE '⚠️ Неожиданный тип: ' || data_type
    END as diagnosis
FROM information_schema.columns 
WHERE table_name = 'tags'
AND column_name = 'name';

-- ПРОВЕРКА 2: Пример данных из tags
SELECT 
    'Пример данных из tags:' as step,
    id,
    name,
    pg_typeof(name) as actual_type
FROM tags 
LIMIT 3;

-- ПРОВЕРКА 3: Тест агрегации
SELECT 
    'Тест json_agg:' as step,
    json_agg(json_build_object('name', name)) as result,
    pg_typeof(json_agg(json_build_object('name', name))) as result_type
FROM tags
LIMIT 1;

-- ПРОВЕРКА 4: Полная структура tags
SELECT 
    'Полная структура tags:' as step,
    column_name,
    data_type,
    udt_name,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tags'
ORDER BY ordinal_position;

-- ============================================================================
-- ПОКАЖИТЕ МНЕ ВСЕ 4 РЕЗУЛЬТАТА!
-- ============================================================================
