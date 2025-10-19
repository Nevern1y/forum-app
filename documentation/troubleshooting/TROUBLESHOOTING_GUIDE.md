# 🔧 Troubleshooting Guide - Полное руководство по устранению ошибок

## 📋 Содержание

1. [Database Errors](#database-errors)
2. [Turbopack Errors](#turbopack-errors)
3. [Supabase Realtime Issues](#supabase-realtime-issues)
4. [Build & Manifest Errors](#build--manifest-errors)
5. [Unreachable Code Warnings](#unreachable-code-warnings)

---

## 1. Database Errors

### ❌ Error: "column reference 'likes' is ambiguous"

**Причина:** SQL запрос содержит неквалифицированную ссылку на колонку, которая есть в нескольких таблицах/подзапросах.

**Решение:**

#### Шаг 1: Примените исправленную миграцию

```bash
# В Supabase Dashboard -> SQL Editor выполните:
```

```sql
-- Пересоздайте функцию с правильными ссылками на колонки
DROP FUNCTION IF EXISTS get_posts_with_counts(text, integer, uuid);

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
    COALESCE(tag_array.tags, '[]'::json) as tags,
    COALESCE(comment_counts.comment_count, 0) as comment_count,
    CASE
      WHEN user_id IS NOT NULL THEN (
        SELECT reaction_type
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id AND pr2.user_id = get_posts_with_counts.user_id
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
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object('name', t.name)
    ) as tags
    FROM post_tags pt
    JOIN tags t ON pt.tag_id = t.id
    WHERE pt.post_id = p.id
  ) tag_array ON true
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
```

#### Шаг 2: Проверьте исправление

```bash
# Перезапустите dev сервер
npm run dev
```

**Ключевые изменения:**
- ✅ `likes` → `COALESCE(like_counts.like_count, 0)` в ORDER BY
- ✅ `views` → `p.views` в ORDER BY
- ✅ `created_at` → `p.created_at` в ORDER BY

---

## 2. Turbopack Errors

### ❌ Fatal: "Next.js package not found" / Build Manifest Errors

**Причины:**
1. Кэш Turbopack поврежден
2. Конфликт с OneDrive синхронизацией (Windows)
3. Устаревшая конфигурация Turbopack

**Решение:**

#### Метод 1: Полная очистка (рекомендуется)

```powershell
# 1. Остановите dev сервер (Ctrl+C)

# 2. Удалите .next и кэши
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force .turbo
Remove-Item "$env:TEMP\next-panic-*" -Force -ErrorAction SilentlyContinue

# 3. Очистите npm кэш
npm cache clean --force

# 4. Переустановите зависимости (опционально, если проблемы остаются)
Remove-Item -Recurse -Force node_modules
npm install

# 5. Запустите снова
npm run dev
```

#### Метод 2: Отключите Turbopack временно

**Option A:** Измените package.json:

```json
{
  "scripts": {
    "dev": "next dev",  // Без --turbo
    "dev:turbo": "next dev --turbo"
  }
}
```

**Option B:** Используйте переменную окружения:

```bash
# В PowerShell
$env:TURBOPACK_ENABLED="0"; npm run dev

# Или создайте новый скрипт
```

#### Метод 3: Исключите папку из OneDrive (Windows)

Если проект в OneDrive:

1. ПКМ на папку `forum-app` → Properties
2. Вкладка General → Advanced
3. Снимите галочку "Allow files in this folder to have contents indexed..."
4. OK → Apply to folder and subfolders

**Или переместите проект:**

```powershell
# Переместите проект из OneDrive в локальную папку
# Например: C:\Projects\forum-app
```

#### Метод 4: Обновите Next.js config

Файл уже исправлен - удалены устаревшие настройки turbo.

---

## 3. Supabase Realtime Issues

### ⏱️ "Connection timed out" / Realtime не работает

**Причины:**
1. Firewall блокирует WebSocket соединения
2. Неправильные настройки Supabase
3. Лимиты на бесплатном плане

**Решение:**

#### Шаг 1: Проверьте настройки Supabase

В Supabase Dashboard → Settings → API:
- ✅ Убедитесь что Realtime включен
- ✅ Проверьте что URL и ключи правильные

#### Шаг 2: Проверьте RLS политики

```sql
-- Убедитесь что есть SELECT политики для таблиц:
-- posts, post_reactions, comments, notifications

-- Пример для posts:
CREATE POLICY "Anyone can view posts" ON posts
  FOR SELECT
  USING (true);
```

#### Шаг 3: Добавьте retry логику

Файл `hooks/use-realtime.ts` уже содержит timeout и cleanup, но можно улучшить:

```typescript
// В useRealtime hook добавьте retry:
const MAX_RETRIES = 3
const RETRY_DELAY = 2000

let retryCount = 0

const subscribe = () => {
  const channel = supabase
    .channel('your-channel')
    .on(/* ... */)
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        if (retryCount < MAX_RETRIES) {
          retryCount++
          console.warn(`Retry ${retryCount}/${MAX_RETRIES}`)
          setTimeout(() => {
            channel.unsubscribe()
            subscribe()
          }, RETRY_DELAY)
        }
      } else if (status === 'SUBSCRIBED') {
        retryCount = 0 // Reset on success
      }
    })
}
```

#### Шаг 4: Увеличьте timeout

В `useRealtime.ts`:

```typescript
const timeoutId = setTimeout(() => {
  console.warn('[Realtime] Connection timed out')
  // Не unsubscribe сразу, дайте больше времени
}, 15000) // Увеличено с 10 до 15 секунд
```

---

## 4. Build & Manifest Errors

### ❌ ENOENT: no such file or directory (build manifest)

**Причина:** Turbopack не успевает создать файлы или они удаляются.

**Решение:**

```powershell
# 1. Полная очистка
Remove-Item -Recurse -Force .next

# 2. Запуск БЕЗ Turbopack (стабильнее)
$env:TURBOPACK_ENABLED="0"
npm run dev

# 3. Если проблема в production build:
npm run build

# Если build failed, проверьте:
# - TypeScript errors: npm run type-check
# - ESLint errors: npm run lint
```

**Если ошибка в .tmp файлах:**

Это race condition в Turbopack. Решение:
1. Отключите Turbopack
2. Или дождитесь исправления в Next.js 15.6+

---

## 5. Unreachable Code Warnings

### ⚠️ "unreachable code after return statement" в node_modules

**Причина:** Библиотеки содержат устаревший или неоптимальный код.

**Почему безопасно игнорировать:**
- ✅ Это warnings, не errors
- ✅ Код в production минифицирован и работает
- ✅ Проблема в сторонних библиотеках, не в вашем коде

**Если хотите скрыть:**

#### Option 1: Настройте ESLint (не рекомендуется для node_modules)

```javascript
// eslint.config.mjs
export default [
  // ...
  {
    ignores: [
      'node_modules/**',
      '.next/**'
    ]
  }
]
```

#### Option 2: Отключите в браузере

В DevTools Console → Settings (⚙️) → Hide network messages

#### Option 3: Обновите зависимости

```bash
npm update
npm audit fix
```

**Приоритет:** НИЗКИЙ - не влияет на работу приложения.

---

## 🚀 Quick Fix Checklist

Если у вас несколько проблем одновременно:

```powershell
# 1. Остановите dev сервер (Ctrl+C)

# 2. Полная очистка
Remove-Item -Recurse -Force .next, .turbo -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\next-panic-*" -Force -ErrorAction SilentlyContinue
npm cache clean --force

# 3. Примените SQL исправления в Supabase Dashboard

# 4. Убедитесь что next.config.mjs без turbo.rules

# 5. Запустите БЕЗ Turbopack
npm run dev
# ИЛИ отредактируйте package.json убрав --turbo

# 6. Если всё работает, можно пробовать снова с Turbopack:
npm run dev:turbo
```

---

## 📊 Приоритеты исправлений

| Проблема | Приоритет | Время на исправление |
|----------|-----------|---------------------|
| Database ambiguity | 🔴 ВЫСОКИЙ | 5 минут |
| Turbopack fatal error | 🔴 ВЫСОКИЙ | 10 минут |
| Build manifest errors | 🟡 СРЕДНИЙ | 10 минут |
| Realtime timeout | 🟡 СРЕДНИЙ | 15 минут |
| Unreachable code warnings | 🟢 НИЗКИЙ | Игнорировать |

---

## 🆘 Если ничего не помогло

1. **Создайте новый Next.js проект для теста:**

```bash
npx create-next-app@latest test-app
cd test-app
npm run dev
```

Если работает - проблема в конфигурации вашего проекта.

2. **Проверьте системные требования:**

- Node.js >= 20.x
- npm >= 10.x
- Свободное место на диске >= 2GB
- Антивирус не блокирует Node процессы

3. **GitHub Issue:**

Если Turbopack продолжает падать:
- Сохраните файл из `%TEMP%\next-panic-*.log`
- Создайте issue: https://github.com/vercel/next.js/issues

---

## 📚 Дополнительные ресурсы

- [Next.js Turbopack Docs](https://nextjs.org/docs/app/api-reference/turbopack)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Ambiguous Column Reference](https://www.postgresql.org/docs/current/queries-table-expressions.html)

---

**Последнее обновление:** 19 января 2025
