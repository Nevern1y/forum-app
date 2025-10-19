# 🔧 Исправление ошибки "type text[] does not match expected type json"

## ❌ Проблема

```
Error fetching posts: {
  message: "structure of query does not match function result type",
  details: "Returned type text[] does not match expected type json in column 9.",
  code: "42804"
}
```

**Причина:** В Supabase используется старая версия RPC функции `get_posts_with_counts`, где колонка `tags` (колонка 9) возвращает `text[]` вместо `json`.

---

## ✅ Решение (5 минут)

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

#### 1️⃣ Откройте Supabase Dashboard

1. Перейдите на [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. В левом меню найдите **SQL Editor**

#### 2️⃣ Проверьте текущую версию (опционально)

Вставьте и выполните:

```sql
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'get_posts_with_counts';
```

Если в `return_type` видите `tags text[]` - нужно обновить!

#### 3️⃣ Примените исправление

1. Откройте файл `docs/sql/APPLY_SQL_FIX.sql` в вашем проекте
2. Скопируйте **ВЕСЬ** SQL код (112 строк)
3. Вставьте в SQL Editor в Supabase
4. Нажмите **Run** (или `Ctrl+Enter`)

**Ожидаемый результат:**
```
Success. No rows returned
```

#### 4️⃣ Проверьте исправление

Выполните тестовый запрос:

```sql
SELECT * FROM get_posts_with_counts('recent', 5, NULL);
```

Должны вернуться посты без ошибок!

#### 5️⃣ Перезапустите Next.js

```bash
# В терминале проекта
npm run dev
```

Откройте [http://localhost:3000/feed](http://localhost:3000/feed) - ошибки больше не должно быть!

---

### Вариант 2: Через командную строку Supabase CLI

Если у вас установлен Supabase CLI:

```bash
# Убедитесь что вы залогинены
supabase login

# Примените миграцию
supabase db push

# Или напрямую выполните SQL
supabase db execute --file docs/sql/APPLY_SQL_FIX.sql
```

---

## 🔍 Диагностика

### Проблема остаётся?

#### 1. Проверьте функцию в базе

```sql
-- В Supabase SQL Editor
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'get_posts_with_counts';
```

Должен быть код с `tags json` (не `text[]`)!

#### 2. Проверьте таблицы

```sql
-- Убедитесь что таблицы существуют
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'profiles', 'tags', 'post_tags', 'post_reactions', 'comments');
```

Все 6 таблиц должны существовать!

#### 3. Проверьте связи

```sql
-- Проверьте post_tags
SELECT COUNT(*) FROM post_tags;

-- Проверьте tags
SELECT COUNT(*) FROM tags;
```

#### 4. Очистите кэш Next.js

```bash
# Удалите .next кэш
rm -rf .next
# или в PowerShell:
Remove-Item -Recurse -Force .next

# Перезапустите
npm run dev
```

---

## 📝 Что было исправлено

### До (СТАРАЯ версия):

```sql
-- Проблема: tags возвращает array_agg который даёт text[]
SELECT 
  ...
  array_agg(t.name) as tags  -- ❌ Возвращает text[]
  ...
```

### После (НОВАЯ версия):

```sql
-- Решение: json_agg с json_build_object
LEFT JOIN LATERAL (
  SELECT json_agg(
    json_build_object('name', t.name)  -- ✅ Возвращает json
  ) as tags
  FROM post_tags pt
  JOIN tags t ON pt.tag_id = t.id
  WHERE pt.post_id = p.id
) tag_array ON true
```

**Ключевые изменения:**
1. `array_agg(t.name)` → `json_agg(json_build_object('name', t.name))`
2. Добавлен `COALESCE(tag_array.tags, '[]'::json)` для пустых тегов
3. Использован `LEFT JOIN LATERAL` для правильной агрегации

---

## 🚀 Профилактика (чтобы не повторялось)

### 1. Используйте миграции Supabase

Всегда применяйте SQL через миграции:

```bash
# Создайте новую миграцию
supabase migration new my_changes

# Примените
supabase db push
```

### 2. Проверяйте типы данных

При создании RPC функций всегда указывайте точные типы:

```sql
RETURNS TABLE (
  tags json  -- ✅ Точный тип
  -- НЕ: tags text[]
)
```

### 3. Тестируйте локально

```sql
-- Всегда тестируйте функции перед deploy
SELECT * FROM your_function();
```

### 4. Используйте TypeScript

В Next.js компонентах типизируйте данные:

```typescript
interface Post {
  tags: { name: string }[]  // JSON массив объектов
  // НЕ: tags: string[]
}
```

---

## ✅ Checklist

После применения исправления проверьте:

- [ ] SQL выполнен успешно в Supabase Dashboard
- [ ] Тестовый запрос `SELECT * FROM get_posts_with_counts(...)` работает
- [ ] Next.js перезапущен (`npm run dev`)
- [ ] Страница `/feed` загружается без ошибок
- [ ] В console (F12) нет ошибок "type text[] does not match"
- [ ] Посты отображаются корректно

---

## 📞 Если не помогло

### Проблема 1: "function get_posts_with_counts does not exist"

**Решение:** Функция не создана, выполните SQL из `docs/sql/APPLY_SQL_FIX.sql`

### Проблема 2: "permission denied for function"

**Решение:** Выполните GRANT команды в конце SQL файла:

```sql
GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_with_counts(text, integer, uuid) TO anon;
```

### Проблема 3: "relation 'post_tags' does not exist"

**Решение:** Примените все миграции из `supabase/migrations/`:

```bash
supabase db push
```

---

## 📚 Дополнительные ресурсы

- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL json_agg](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

**Создано:** 19 января 2025  
**Статус:** ✅ Решение готово  
**Время применения:** 5 минут
