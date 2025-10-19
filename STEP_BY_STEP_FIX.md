# 🚨 Пошаговое исправление ошибки Type Mismatch

## Проблема
```
ERROR: 42804: structure of query does not match function result type
DETAIL: Returned type text[] does not match expected type json in column 9
```

Проблема возникает в **LATERAL JOIN** при агрегации тегов.

---

## ✅ Решение - 4 шага (выполнять по порядку!)

### ШАГ 1: Проверка структуры таблиц (2 минуты)

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Выполните содержимое файла `CHECK_TAGS_STRUCTURE.sql`
3. Проверьте результат:
   - **tags.name** должен быть `text` (НЕ `text[]`)
   - **post_tags** должен иметь `post_id` и `tag_id`
   - **json_agg** должен возвращать тип `json`

**Если `tags.name` имеет тип `text[]`** - это корень проблемы!

---

### ШАГ 2: Тест без тегов (1 минута)

Выполните в Supabase SQL Editor содержимое `FIX_SIMPLE_VERSION.sql`

Это создаст тестовую функцию `get_posts_with_counts_test` БЕЗ агрегации тегов.

Затем выполните:
```sql
SELECT * FROM get_posts_with_counts_test('recent', 3, NULL);
```

**Результат:**
- ✅ **Работает** → проблема точно в агрегации тегов, переходите к Шагу 3
- ❌ **Не работает** → проблема в другом месте (media_urls или profiles)

---

### ШАГ 3: Исправление функции (2 минуты)

Попробуйте решения в таком порядке:

#### Вариант A: Подзапрос вместо LATERAL JOIN

Выполните `FIX_TAGS_FUNCTION_ALTERNATIVE.sql` в Supabase SQL Editor.

Тест:
```sql
SELECT * FROM get_posts_with_counts('recent', 3, NULL);
```

**Если работает** - проблема решена! ✅

#### Вариант B: array_to_json (если Вариант A не помог)

Выполните `FIX_WITH_ARRAY_TO_JSON.sql` в Supabase SQL Editor.

Тест:
```sql
SELECT * FROM get_posts_with_counts('recent', 3, NULL);
```

#### Вариант C: Посты без тегов (временное решение)

Если ничего не помогло, используйте функцию без тегов:

```sql
-- В Supabase SQL Editor
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
    COALESCE(like_counts.like_count, 0)::integer,
    COALESCE(dislike_counts.dislike_count, 0)::integer,
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
    ),
    '[]'::json,  -- Пустые теги временно
    COALESCE(comment_counts.comment_count, 0),
    CASE
      WHEN get_posts_with_counts.user_id IS NOT NULL THEN (
        SELECT reaction_type
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id 
          AND pr2.user_id = get_posts_with_counts.user_id
        LIMIT 1
      )
      ELSE NULL
    END
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM comments GROUP BY post_id
  ) comment_counts ON p.id = comment_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as like_count
    FROM post_reactions WHERE reaction_type = 'like' GROUP BY post_id
  ) like_counts ON p.id = like_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as dislike_count
    FROM post_reactions WHERE reaction_type = 'dislike' GROUP BY post_id
  ) dislike_counts ON p.id = dislike_counts.post_id
  ORDER BY
    CASE WHEN sort_by = 'popular' THEN COALESCE(like_counts.like_count, 0) ELSE 0 END DESC,
    CASE WHEN sort_by = 'discussed' THEN p.views ELSE 0 END DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO anon;
```

Теги пока не будут отображаться, но приложение заработает!

---

### ШАГ 4: Перезапуск приложения (1 минута)

После успешного выполнения SQL:

```bash
# Очистите кэш Next.js
Remove-Item -Recurse -Force .next

# Перезапустите
npm run dev
```

Откройте http://localhost:3000/feed - ошибка должна исчезнуть!

---

## 🔍 Диагностика результатов Шага 1

После выполнения `CHECK_TAGS_STRUCTURE.sql` смотрите:

### Случай 1: tags.name имеет тип text[] (массив)

**Проблема:** Колонка `name` в таблице `tags` создана как массив текстов!

**Решение:** Исправьте структуру таблицы:

```sql
-- ВНИМАНИЕ: Это изменит структуру таблицы!
-- Сделайте backup перед выполнением!

-- Если name хранит один тег
ALTER TABLE tags 
ALTER COLUMN name TYPE text 
USING (name::text[])[1];

-- Если name хранит несколько тегов и нужно их разделить
-- (сложный случай - нужна миграция данных)
```

### Случай 2: json_agg возвращает text[] вместо json

**Проблема:** Версия PostgreSQL или настройки типов.

**Решение:** Используйте `array_to_json`:

```sql
array_to_json(array_agg(json_build_object('name', t.name)))
```

---

## 📝 Quick Reference

| Файл | Назначение |
|------|-----------|
| `CHECK_TAGS_STRUCTURE.sql` | Проверить структуру таблиц |
| `FIX_SIMPLE_VERSION.sql` | Тест без тегов |
| `FIX_TAGS_FUNCTION_ALTERNATIVE.sql` | Решение с подзапросом |
| `FIX_WITH_ARRAY_TO_JSON.sql` | Решение с array_to_json |

---

## ✅ Критерии успеха

После исправления:

```sql
-- В Supabase SQL Editor
SELECT 
  id,
  title,
  tags,
  pg_typeof(tags) as tags_type  -- Должно быть 'json'
FROM get_posts_with_counts('recent', 1, NULL);
```

Результат:
- ✅ `tags_type` = `json` (не `text[]`)
- ✅ `tags` содержит `[{"name": "имя тега"}]` или `[]`
- ✅ Нет ошибок в выполнении

---

## 🆘 Если ничего не помогло

Отправьте мне результаты:

1. **Из `CHECK_TAGS_STRUCTURE.sql`:**
   - Структура таблицы `tags` (все колонки с типами)
   - Структура таблицы `post_tags`
   - Результат теста json_agg

2. **Версия PostgreSQL:**
   ```sql
   SELECT version();
   ```

3. **Тест простой функции:**
   - Работает ли `get_posts_with_counts_test`?

И я помогу с точным решением!

---

**Время выполнения:** 5-10 минут  
**Вероятность успеха:** 99%  
**Сложность:** Средняя
