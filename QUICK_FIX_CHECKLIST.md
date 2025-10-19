# ⚡ Быстрый чеклист исправлений

## 🚨 КРИТИЧНО - Выполните эти 2 SQL скрипта:

### 1️⃣ Уникальные просмотры (FIX_UNIQUE_POST_VIEWS.sql)

**Откройте Supabase SQL Editor и выполните:**

```sql
-- Шаг 1: Разрешаем NULL
ALTER TABLE post_views ALTER COLUMN user_id DROP NOT NULL;

-- Шаг 2: Удаляем UNIQUE constraint (ВАЖНО!)
ALTER TABLE post_views DROP CONSTRAINT IF EXISTS post_views_post_id_user_id_key;

-- Шаг 3: Создаем функцию
DROP FUNCTION IF EXISTS increment_post_views(uuid);

CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_last_view_at timestamptz;
  v_cooldown_minutes integer := 60;
  v_should_increment boolean := false;
  v_new_count integer;
BEGIN
  v_user_id := auth.uid();
  
  SELECT viewed_at INTO v_last_view_at
  FROM post_views
  WHERE post_views.post_id = increment_post_views.post_id
    AND (
      (v_user_id IS NOT NULL AND post_views.user_id = v_user_id)
      OR (v_user_id IS NULL AND post_views.user_id IS NULL)
    )
  ORDER BY viewed_at DESC
  LIMIT 1;
  
  IF v_last_view_at IS NULL THEN
    v_should_increment := true;
  ELSIF (EXTRACT(EPOCH FROM (NOW() - v_last_view_at)) / 60) >= v_cooldown_minutes THEN
    v_should_increment := true;
  ELSE
    v_should_increment := false;
  END IF;
  
  INSERT INTO post_views (post_id, user_id, viewed_at)
  VALUES (increment_post_views.post_id, v_user_id, NOW());
  
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
  
  RETURN json_build_object(
    'incremented', v_should_increment,
    'views', COALESCE(v_new_count, 0),
    'cooldown_minutes', v_cooldown_minutes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO anon;
```

---

### 2️⃣ Realtime исправление (FIX_ALL_REPLICA_IDENTITY.sql)

**Выполните в новом SQL запросе:**

```sql
-- Исправление для Realtime
ALTER TABLE IF EXISTS post_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS notifications REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS comments REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS posts REPLICA IDENTITY DEFAULT;
ALTER TABLE IF EXISTS profiles REPLICA IDENTITY DEFAULT;
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
```

---

## 3️⃣ Перезапуск

```bash
# Ctrl+C для остановки
npm run dev
```

---

## ✅ Проверка

### Откройте любой пост:

**Первый раз:**
```
[Post Views] ✅ Incremented to 42
```

**Обновите страницу:**
```
[Post Views] 🕐 Cooldown (60min), current: 42
```

**✅ Счетчик НЕ увеличился = Работает!**

---

## 🔍 Если не работает:

### Ошибка "NULL constraint"
→ Выполните шаг 1 (ALTER COLUMN DROP NOT NULL)

### Ошибка "duplicate key"
→ Выполните шаг 2 (DROP CONSTRAINT)

### Ошибка "function not found"
→ Выполните шаг 3 (CREATE FUNCTION)

### Realtime ошибки
→ Выполните скрипт 2 (REPLICA IDENTITY)

---

## 📄 Полная документация:

- **EXECUTE_SQL_INSTRUCTIONS.md** - детальные инструкции
- **ANTI_CHEAT_VIEWS_GUIDE.md** - полный гайд
- **FIX_UNIQUE_POST_VIEWS.sql** - полный SQL скрипт
- **FIX_ALL_REPLICA_IDENTITY.sql** - Realtime исправление

---

**Время: 5 минут | Результат: Полностью рабочее приложение! 🚀**
