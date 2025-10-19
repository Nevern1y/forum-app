# 🚀 Пошаговая инструкция по применению SQL исправлений

## 📋 Что нужно выполнить:

### 1. **FIX_UNIQUE_POST_VIEWS.sql** - Защита от накрутки просмотров
### 2. **FIX_ALL_REPLICA_IDENTITY.sql** - Исправление Realtime ошибок

---

## 🛡️ ШАГ 1: Уникальные просмотры (ПРИОРИТЕТ!)

### Открыть Supabase SQL Editor:
1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Нажмите **SQL Editor** в левом меню
4. Нажмите **New query**

### Скопируйте и выполните:

```sql
-- ============================================================================
-- ШАГ 1: РАЗРЕШАЕМ NULL ДЛЯ АНОНИМНЫХ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================================================

ALTER TABLE post_views 
ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================================
-- ШАГ 2: УДАЛЯЕМ UNIQUE CONSTRAINT
-- ============================================================================
-- ВАЖНО: Constraint мешает записывать историю просмотров!

ALTER TABLE post_views 
DROP CONSTRAINT IF EXISTS post_views_post_id_user_id_key;

-- Проверка: не должно быть UNIQUE constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'post_views' 
  AND table_schema = 'public';

-- Проверка: is_nullable должен быть YES
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_views' 
  AND column_name = 'user_id'
  AND table_schema = 'public';

-- ============================================================================
-- ШАГ 3: СОЗДАЕМ ФУНКЦИЮ С ЗАЩИТОЙ ОТ НАКРУТКИ
-- ============================================================================

DROP FUNCTION IF EXISTS increment_post_views(uuid);

CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_last_view_at timestamptz;
  v_cooldown_minutes integer := 60; -- 1 час cooldown
  v_should_increment boolean := false;
  v_new_count integer;
BEGIN
  -- Получаем ID текущего пользователя (может быть NULL)
  v_user_id := auth.uid();
  
  -- Проверяем последний просмотр этого поста этим пользователем
  SELECT viewed_at INTO v_last_view_at
  FROM post_views
  WHERE post_views.post_id = increment_post_views.post_id
    AND (
      (v_user_id IS NOT NULL AND post_views.user_id = v_user_id)
      OR (v_user_id IS NULL AND post_views.user_id IS NULL)
    )
  ORDER BY viewed_at DESC
  LIMIT 1;
  
  -- Определяем нужно ли увеличивать счетчик
  IF v_last_view_at IS NULL THEN
    -- Первый просмотр - засчитываем
    v_should_increment := true;
  ELSIF (EXTRACT(EPOCH FROM (NOW() - v_last_view_at)) / 60) >= v_cooldown_minutes THEN
    -- Прошло больше часа - засчитываем
    v_should_increment := true;
  ELSE
    -- Просмотр был недавно - не засчитываем
    v_should_increment := false;
  END IF;
  
  -- Записываем просмотр в историю (для аналитики)
  INSERT INTO post_views (post_id, user_id, viewed_at)
  VALUES (increment_post_views.post_id, v_user_id, NOW());
  
  -- Увеличиваем счетчик только если нужно
  IF v_should_increment THEN
    UPDATE posts 
    SET views = COALESCE(views, 0) + 1
    WHERE id = increment_post_views.post_id
    RETURNING views INTO v_new_count;
  ELSE
    SELECT views INTO v_new_count
    FROM posts
    WHERE id = increment_post_views.post_id;
  END IF;
  
  -- Возвращаем результат
  RETURN json_build_object(
    'incremented', v_should_increment,
    'views', COALESCE(v_new_count, 0),
    'cooldown_minutes', v_cooldown_minutes
  );
END;
$$;

-- ============================================================================
-- ШАГ 4: ДАЕМ ПРАВА
-- ============================================================================

GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO anon;

-- ============================================================================
-- ШАГ 5: ТЕСТ (ОПЦИОНАЛЬНО)
-- ============================================================================

-- Замените YOUR_POST_ID на реальный ID поста
-- SELECT increment_post_views('YOUR_POST_ID'::uuid);
```

### ✅ Результат:
```
ALTER TABLE      (drop NOT NULL)
ALTER TABLE      (drop constraint)
SELECT 1         (constraints check)
SELECT 1         (column check)
DROP FUNCTION
CREATE FUNCTION
GRANT
GRANT
```

---

## ⚡ ШАГ 2: Исправление Realtime

### Скопируйте и выполните в новом запросе:

```sql
-- ============================================================================
-- ИСПРАВЛЕНИЕ REALTIME: REPLICA IDENTITY ДЛЯ ВСЕХ ТАБЛИЦ
-- ============================================================================

-- Основные таблицы с Realtime
ALTER TABLE IF EXISTS post_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS notifications REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS comments REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS posts REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS profiles REPLICA IDENTITY DEFAULT;

-- Остальные таблицы
ALTER TABLE IF EXISTS comment_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS bookmarks REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS subscriptions REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS post_tags REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS tags REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS friendships REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS conversations REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS direct_messages REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS blocked_users REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS post_views REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS reports REPLICA IDENTITY DEFAULT;

-- ============================================================================
-- ПРОВЕРКА: Все должны быть 'default'
-- ============================================================================

SELECT 
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN '✅ default (CORRECT)'
    WHEN 'n' THEN '⚠️ nothing'
    WHEN 'f' THEN '❌ full (BAD)'
    WHEN 'i' THEN '⚠️ index'
  END AS replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'post_reactions', 'notifications', 'comments', 'posts', 'profiles',
    'comment_reactions', 'bookmarks', 'subscriptions', 'post_tags', 'tags',
    'friendships', 'conversations', 'direct_messages', 'blocked_users',
    'post_views', 'reports'
  )
ORDER BY c.relname;
```

### ✅ Результат:
Все таблицы должны показывать `✅ default (CORRECT)`

---

## 🔄 ШАГ 3: Перезапуск приложения

```bash
# Остановите dev server (Ctrl+C)
npm run dev
```

---

## 🧪 ШАГ 4: Проверка

### 1. **Проверка уникальных просмотров:**
- Откройте любой пост
- Консоль: `[Post Views] ✅ Incremented to X`
- Обновите страницу (F5)
- Консоль: `[Post Views] 🕐 Cooldown (60min), current: X`
- ✅ **Счетчик НЕ увеличился!**

### 2. **Проверка Realtime:**
- Откройте пост в двух вкладках
- Поставьте лайк в первой вкладке
- ✅ **Счетчик обновился во второй вкладке!**

### 3. **Проверка консоли:**
- ❌ **До:** Спам ошибок "mismatch", "timed out"
- ✅ **После:** Чистая консоль

---

## 🐛 Troubleshooting

### Ошибка: "null value in column user_id violates not-null constraint"
**Причина:** Шаг 1 не выполнен  
**Решение:** Выполните `ALTER TABLE post_views ALTER COLUMN user_id DROP NOT NULL;`

### Ошибка: "duplicate key value violates unique constraint"
**Причина:** Шаг 2 не выполнен (UNIQUE constraint не удален)  
**Решение:** Выполните `ALTER TABLE post_views DROP CONSTRAINT IF EXISTS post_views_post_id_user_id_key;`

### Ошибка: "function increment_post_views does not exist"
**Причина:** Шаг 2 не выполнен  
**Решение:** Выполните CREATE FUNCTION

### Realtime ошибки продолжаются
**Причина:** Шаг 2 (Replica Identity) не выполнен  
**Решение:** Выполните все ALTER TABLE ... REPLICA IDENTITY DEFAULT

### Консоль показывает пустой объект {}
**Причина:** SQL не выполнен или функция вернула ошибку  
**Решение:** Проверьте SQL Editor на наличие ошибок

---

## 📊 Ожидаемый результат

### До:
```
✅ Post views incremented successfully
✅ Post views incremented successfully  <-- Обновление страницы
✅ Post views incremented successfully  <-- Обновление страницы
❌ Realtime: mismatch between server and client bindings
❌ Realtime: subscription timed out
```

### После:
```
[Post Views] ✅ Incremented to 42
[Post Views] 🕐 Cooldown (60min), current: 42  <-- Обновление
[Post Views] 🕐 Cooldown (60min), current: 42  <-- Обновление
(Никаких Realtime ошибок!)
```

---

## ⏱️ Время выполнения: 5 минут

**Файлы:**
- `FIX_UNIQUE_POST_VIEWS.sql` - полный код
- `FIX_ALL_REPLICA_IDENTITY.sql` - полный код
- `ANTI_CHEAT_VIEWS_GUIDE.md` - детальная документация

🎯 **После выполнения приложение будет полностью рабочим!**
