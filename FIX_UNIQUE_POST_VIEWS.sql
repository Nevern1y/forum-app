-- ============================================================================
-- ИСПРАВЛЕНИЕ: УНИКАЛЬНЫЕ ПРОСМОТРЫ ПОСТОВ
-- ============================================================================
-- Проблема: Каждый вход в пост увеличивает счетчик, даже от одного пользователя
-- Решение: Отслеживаем уникальные просмотры с защитой от накрутки
-- ============================================================================

-- Шаг 1: Разрешаем NULL для анонимных пользователей
ALTER TABLE post_views 
ALTER COLUMN user_id DROP NOT NULL;

-- Шаг 2: УДАЛЯЕМ UNIQUE CONSTRAINT (он мешает записывать повторные просмотры)
ALTER TABLE post_views 
DROP CONSTRAINT IF EXISTS post_views_post_id_user_id_key;

-- Проверяем что constraint удален
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'post_views' 
  AND table_schema = 'public';

-- Проверяем структуру таблицы post_views
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_views' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- НОВАЯ ФУНКЦИЯ: Increment post views с защитой от накрутки
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
  v_cooldown_minutes integer := 60; -- Повторный просмотр засчитывается только через 1 час
  v_should_increment boolean := false;
  v_new_count integer;
BEGIN
  -- Получаем ID текущего пользователя (может быть NULL для анонимов)
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
    -- Прошло больше часа - засчитываем повторный просмотр
    v_should_increment := true;
  ELSE
    -- Просмотр был недавно - не засчитываем
    v_should_increment := false;
  END IF;
  
  -- Записываем просмотр в историю
  INSERT INTO post_views (post_id, user_id, viewed_at)
  VALUES (
    increment_post_views.post_id,
    v_user_id,
    NOW()
  );
  
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

-- Grants
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO anon;

-- ============================================================================
-- ТЕСТ
-- ============================================================================

-- Проверяем что функция работает
SELECT increment_post_views('d8f0348d-b8b4-4496-9b9f-83b7bc921546'::uuid);

-- Вызовите еще раз - incremented должно быть false
SELECT increment_post_views('d8f0348d-b8b4-4496-9b9f-83b7bc921546'::uuid);

-- Проверяем историю просмотров
SELECT * FROM post_views 
WHERE post_id = 'd8f0348d-b8b4-4496-9b9f-83b7bc921546'::uuid
ORDER BY viewed_at DESC
LIMIT 5;

-- ============================================================================
-- КОММЕНТАРИИ
-- ============================================================================

/*
Логика работы:
1. Каждый просмотр записывается в post_views (для аналитики)
2. Счетчик views увеличивается только если:
   - Это первый просмотр этого поста этим пользователем
   - ИЛИ прошло больше 60 минут с последнего просмотра
3. Для анонимных пользователей (user_id IS NULL) логика та же
4. Функция возвращает JSON с информацией о результате

Преимущества:
- Защита от накрутки
- История всех просмотров сохраняется
- Аналитика: можно узнать кто и когда смотрел пост
- Настраиваемый cooldown период
- Работает для авторизованных и анонимных пользователей

Примечания:
- Cooldown можно настроить (сейчас 60 минут)
- Для более строгой защиты можно увеличить до 24 часов
- Анонимные просмотры с одного устройства не различаются
*/

-- ============================================================================
-- ПОСЛЕ ВЫПОЛНЕНИЯ:
-- 1. Обновите клиентский код чтобы обрабатывать новый формат ответа
-- 2. Перезапустите приложение
-- 3. Счетчик просмотров будет защищен от накрутки
-- ============================================================================
