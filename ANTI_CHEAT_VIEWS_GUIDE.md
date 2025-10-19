# 🛡️ Защита просмотров постов от накрутки

## 🐛 Проблема

**До исправления:**
- Каждый вход на пост увеличивал счетчик просмотров
- Один пользователь мог обновлять страницу и накручивать просмотры
- Не было защиты от манипуляций

## ✅ Решение

### Уникальные просмотры с cooldown периодом

**Логика работы:**
1. ✅ Каждый просмотр записывается в `post_views` (для аналитики)
2. ✅ Счетчик увеличивается ТОЛЬКО если:
   - Это первый просмотр этого поста этим пользователем
   - ИЛИ прошло больше **60 минут** с последнего просмотра
3. ✅ Работает для авторизованных и анонимных пользователей
4. ✅ История всех просмотров сохраняется

---

## 🚀 Применение

### 1️⃣ Выполните SQL в Supabase SQL Editor

**Файл:** `FIX_UNIQUE_POST_VIEWS.sql`

```sql
DROP FUNCTION IF EXISTS increment_post_views(uuid);

CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_last_view_at timestamptz;
  v_cooldown_minutes integer := 60; -- 1 час
  v_should_increment boolean := false;
  v_new_count integer;
BEGIN
  v_user_id := auth.uid();
  
  -- Проверяем последний просмотр
  SELECT viewed_at INTO v_last_view_at
  FROM post_views
  WHERE post_views.post_id = increment_post_views.post_id
    AND (
      (v_user_id IS NOT NULL AND post_views.user_id = v_user_id)
      OR (v_user_id IS NULL AND post_views.user_id IS NULL)
    )
  ORDER BY viewed_at DESC
  LIMIT 1;
  
  -- Определяем нужно ли увеличивать
  IF v_last_view_at IS NULL THEN
    v_should_increment := true;
  ELSIF (EXTRACT(EPOCH FROM (NOW() - v_last_view_at)) / 60) >= v_cooldown_minutes THEN
    v_should_increment := true;
  ELSE
    v_should_increment := false;
  END IF;
  
  -- Записываем в историю
  INSERT INTO post_views (post_id, user_id, viewed_at)
  VALUES (increment_post_views.post_id, v_user_id, NOW());
  
  -- Увеличиваем счетчик если нужно
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

GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO anon;
```

### 2️⃣ Перезапустите приложение

```bash
npm run dev
```

### 3️⃣ Протестируйте

1. **Откройте пост** → В консоли: `[Post Views] ✅ Incremented to X`
2. **Обновите страницу** → В консоли: `[Post Views] 🕐 Cooldown (60min), current: X`
3. **Подождите 1 час и откройте снова** → Просмотр засчитается

---

## 📊 Возвращаемые данные

Функция возвращает JSON:

```json
{
  "incremented": true,
  "views": 42,
  "cooldown_minutes": 60
}
```

**Поля:**
- `incremented` - был ли увеличен счетчик (true/false)
- `views` - текущее количество просмотров
- `cooldown_minutes` - период cooldown в минутах

---

## ⚙️ Настройка

### Изменить период cooldown

В SQL функции измените строку:
```sql
v_cooldown_minutes integer := 60; -- Измените на нужное значение
```

**Рекомендуемые значения:**
- `5` - 5 минут (мягкая защита, удобно для тестирования)
- `60` - 1 час (баланс)
- `1440` - 24 часа (строгая защита)

---

## 📈 Аналитика

### Просмотреть историю просмотров поста

```sql
SELECT 
  pv.viewed_at,
  pv.user_id,
  p.username
FROM post_views pv
LEFT JOIN profiles p ON p.id = pv.user_id
WHERE pv.post_id = 'YOUR_POST_ID'
ORDER BY pv.viewed_at DESC
LIMIT 100;
```

### Статистика по пользователю

```sql
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT post_id) as unique_posts
FROM post_views
WHERE user_id = 'USER_ID';
```

### Топ просматриваемых постов

```sql
SELECT 
  p.title,
  COUNT(*) as view_count
FROM post_views pv
JOIN posts p ON p.id = pv.post_id
GROUP BY p.id, p.title
ORDER BY view_count DESC
LIMIT 10;
```

---

## 🔒 Защита

### Что защищено:
- ✅ Накрутка обновлением страницы
- ✅ Повторные просмотры в короткий период
- ✅ Искусственное завышение счетчика

### Ограничения:
- ⚠️ Анонимные пользователи не различаются (все с `user_id = NULL`)
- ⚠️ Смена аккаунта позволяет обойти защиту
- ⚠️ Для строгой защиты используйте IP tracking (отдельная реализация)

---

## 🐛 Troubleshooting

### Счетчик не увеличивается
**Проблема:** Cooldown активен  
**Решение:** Подождите 60 минут или измените период в SQL

### Ошибка: "function increment_post_views does not exist"
**Проблема:** SQL не выполнен  
**Решение:** Выполните SQL из `FIX_UNIQUE_POST_VIEWS.sql`

### Консоль показывает пустой объект {}
**Проблема:** Старая версия функции  
**Решение:** Пересоздайте функцию (DROP + CREATE)

---

## 📝 Примечания

- История просмотров полезна для аналитики и рекомендаций
- Можно добавить таблицу с IP адресами для более строгой защиты
- Cooldown можно сделать адаптивным (разный для разных пользователей)
- Для production рекомендуется добавить индексы на `post_views(post_id, user_id, viewed_at)`

---

## ✅ Результат

**До:**
```
Пользователь обновляет страницу 10 раз → 10 просмотров
```

**После:**
```
Пользователь обновляет страницу 10 раз → 1 просмотр
Через 1 час открывает снова → 2 просмотра
```

**Честная статистика!** 🎯
