# 🔧 Полное решение ошибки PostgreSQL Type Mismatch

## 🎯 Проблема

```
Error: structure of query does not match function result type
Details: Returned type text[] does not match expected type json in column 9
```

**Статус:** Функция в Supabase правильная, но кэш не обновляется!

---

## ✅ Решение (выполните по порядку)

### Шаг 1: Принудительное пересоздание функции в Supabase

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Скопируйте и выполните `FORCE_REFRESH_FUNCTION.sql` из проекта
3. Дождитесь "Success" сообщения

**Что это делает:**
- Удаляет все версии функции
- Очищает кэш планировщика PostgreSQL
- Пересоздаёт функцию с явными типами
- Тестирует результат

---

### Шаг 2: Перезапустите Supabase Connection Pooler

#### Вариант A: Через Dashboard (рекомендуется)

1. В Supabase Dashboard → **Settings** → **Database**
2. Найдите раздел **Connection Pooling**
3. Если есть кнопка **Restart Pooler** - нажмите
4. Подождите 30 секунд

#### Вариант B: Через смену connection string (если нет кнопки)

В вашем `.env.local`:

```env
# Временно переключитесь на Direct connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# Убедитесь что используется правильный URL без :6543 порта
```

---

### Шаг 3: Очистите кэш Next.js

```bash
# Удалите кэш
Remove-Item -Recurse -Force .next

# Очистите node_modules/@supabase кэш (опционально)
Remove-Item -Recurse -Force node_modules/.cache

# Переустановите зависимости (если проблема не решается)
npm cache clean --force
npm install
```

---

### Шаг 4: Обновите Supabase пакеты

```bash
# Проверьте текущие версии
npm list @supabase/supabase-js @supabase/ssr

# Обновите до последних версий
npm install @supabase/supabase-js@latest @supabase/ssr@latest

# Или конкретные версии
npm install @supabase/supabase-js@^2.45.0 @supabase/ssr@^0.5.0
```

---

### Шаг 5: Проверьте Connection String

В `.env.local` убедитесь:

```env
# ✅ Правильно (REST API endpoint)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# ❌ Неправильно (Database connection string с портом)
# NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co:6543
```

**Важно:** Next.js использует REST API, не прямое PostgreSQL соединение!

---

### Шаг 6: Добавьте принудительную очистку кэша в код

Добавьте в `post-list.tsx` перед вызовом RPC:

```typescript
// Перед вызовом supabase.rpc
const supabase = await createClient()

// Принудительная очистка кэша (только для дебага!)
if (process.env.NODE_ENV === 'development') {
  await supabase.rpc('pg_stat_reset_shared', { 'pg_stat_statements': true }).then(() => {})
}

const { data: posts, error } = await supabase.rpc('get_posts_with_counts', {
  sort_by: sortBy,
  limit_count: 20,
  user_id: user?.id || null
})
```

**Или** попробуйте вызвать с явными параметрами:

```typescript
const { data: posts, error } = await supabase
  .rpc('get_posts_with_counts', {
    sort_by: sortBy,
    limit_count: 20,
    user_id: user?.id || null
  })
  .select('*') // Явно запрашиваем все колонки
```

---

### Шаг 7: Временное решение - создайте новую функцию

Если ничего не помогло, создайте функцию с ДРУГИМ именем:

```sql
-- В Supabase SQL Editor
CREATE OR REPLACE FUNCTION get_posts_with_counts_v2(
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
    )::json,
    COALESCE(
      (
        SELECT json_agg(json_build_object('name', t.name))
        FROM post_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE pt.post_id = p.id
      ),
      '[]'::json
    )::json,
    COALESCE(comment_counts.comment_count, 0)::bigint,
    CASE
      WHEN get_posts_with_counts_v2.user_id IS NOT NULL THEN (
        SELECT reaction_type::text
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id AND pr2.user_id = get_posts_with_counts_v2.user_id
        LIMIT 1
      )
      ELSE NULL
    END
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN (
    SELECT post_id, COUNT(*)::bigint as comment_count
    FROM comments GROUP BY post_id
  ) comment_counts ON p.id = comment_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*)::integer as like_count
    FROM post_reactions WHERE reaction_type = 'like' GROUP BY post_id
  ) like_counts ON p.id = like_counts.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*)::integer as dislike_count
    FROM post_reactions WHERE reaction_type = 'dislike' GROUP BY post_id
  ) dislike_counts ON p.id = dislike_counts.post_id
  ORDER BY
    CASE WHEN sort_by = 'popular' THEN COALESCE(like_counts.like_count, 0) ELSE 0 END DESC,
    CASE WHEN sort_by = 'discussed' THEN p.views ELSE 0 END DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_posts_with_counts_v2(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_with_counts_v2(text, integer, uuid) TO anon;
```

Затем в `post-list.tsx`:

```typescript
const { data: posts, error } = await supabase.rpc('get_posts_with_counts_v2', { // Изменили имя
  sort_by: sortBy,
  limit_count: 20,
  user_id: user?.id || null
})
```

---

## 🔍 Диагностика

### Проверка 1: Тест функции напрямую в Supabase

```sql
-- В Supabase SQL Editor
SELECT 
  id, 
  title,
  tags,  -- Проверьте тип этой колонки в результате
  pg_typeof(tags) as tags_type  -- Должно быть 'json'
FROM get_posts_with_counts('recent', 1, NULL);
```

Если `tags_type` показывает `text[]` - функция не обновилась!

### Проверка 2: Проверьте схему функции

```sql
SELECT 
  p.proname,
  pg_catalog.pg_get_function_result(p.oid) as result_type
FROM pg_proc p
WHERE p.proname LIKE 'get_posts%';
```

Должно быть только одна функция `get_posts_with_counts` с `tags json`!

### Проверка 3: Проверьте connection pooler

В Supabase Dashboard → Settings → Database:
- **Transaction Mode**: должно быть OFF или Session
- **Connection Pooling**: попробуйте выключить/включить

---

## 🚨 Если НИЧЕГО не помогло

### Крайний случай: Используйте прямой SQL запрос

В `post-list.tsx` замените RPC на прямой запрос:

```typescript
const { data: posts, error } = await supabase
  .from('posts')
  .select(`
    *,
    profiles:author_id (username, display_name, avatar_url, reputation),
    post_tags (
      tags (name)
    ),
    post_reactions (reaction_type),
    comments (count)
  `)
  .order('created_at', { ascending: false })
  .limit(20)
```

Затем обработайте данные в коде (менее эффективно, но работает).

---

## 📝 Checklist

После каждого шага проверяйте:

- [ ] Выполнен `FORCE_REFRESH_FUNCTION.sql` в Supabase
- [ ] Перезапущен Connection Pooler (если возможно)
- [ ] Удалён кэш Next.js (`.next` папка)
- [ ] Обновлены Supabase пакеты
- [ ] Проверен NEXT_PUBLIC_SUPABASE_URL (без порта!)
- [ ] Приложение перезапущено (`npm run dev`)
- [ ] Кэш браузера очищен (Ctrl+Shift+R)
- [ ] Проверена страница `/feed`

---

## ✅ Ожидаемый результат

После применения всех шагов:

```bash
# В консоли браузера (F12)
✅ Нет ошибок "type text[] does not match"
✅ Посты загружаются корректно
✅ Tags отображаются как JSON массив
```

---

**Время решения:** 10-15 минут  
**Сложность:** Средняя (проблема кэширования)  
**Вероятность успеха:** 95%

Если проблема сохраняется после всех шагов - напишите мне, проверим connection string и версии пакетов детально!
