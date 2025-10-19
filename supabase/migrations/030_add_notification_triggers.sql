-- ============================================================================
-- NOTIFICATION TRIGGERS: Автоматические уведомления для важных событий
-- ============================================================================
-- Создает уведомления при:
-- 1. Комментировании постов
-- 2. Ответах на комментарии
-- 3. Реакциях на посты (лайки/дизлайки)
-- 4. Упоминаниях @username
-- ============================================================================

-- ============================================================================
-- 1. ТРИГГЕР: Уведомление о новом комментарии к посту
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_author_id uuid;
  post_title text;
  commenter_name text;
BEGIN
  -- Получаем автора поста и название
  SELECT author_id, title INTO post_author_id, post_title
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Получаем имя комментатора
  SELECT COALESCE(display_name, username) INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Создаем уведомление (но не для самого себя)
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      related_user_id,
      related_post_id,
      title,
      content,
      link,
      is_read
    )
    VALUES (
      post_author_id,
      'comment',
      NEW.user_id,
      NEW.post_id,
      'Новый комментарий',
      commenter_name || ' прокомментировал ваш пост: "' || LEFT(post_title, 50) || '"',
      '/post/' || NEW.post_id,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS on_comment_created_notify ON comments;

-- Создаем новый триггер
CREATE TRIGGER on_comment_created_notify
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

-- ============================================================================
-- 2. ТРИГГЕР: Уведомление об ответе на комментарий
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_comment_author_id uuid;
  post_title text;
  replier_name text;
BEGIN
  -- Проверяем что это ответ (есть parent_id)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Получаем автора родительского комментария
  SELECT user_id INTO parent_comment_author_id
  FROM comments
  WHERE id = NEW.parent_id;
  
  -- Получаем название поста
  SELECT title INTO post_title
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Получаем имя ответившего
  SELECT COALESCE(display_name, username) INTO replier_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Создаем уведомление (но не для самого себя)
  IF parent_comment_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      related_user_id,
      related_post_id,
      title,
      content,
      link,
      is_read
    )
    VALUES (
      parent_comment_author_id,
      'reply',
      NEW.user_id,
      NEW.post_id,
      'Ответ на комментарий',
      replier_name || ' ответил на ваш комментарий в посте: "' || LEFT(post_title, 50) || '"',
      '/post/' || NEW.post_id || '#comment-' || NEW.id,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS on_comment_reply_notify ON comments;

-- Создаем новый триггер
CREATE TRIGGER on_comment_reply_notify
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply();

-- ============================================================================
-- 3. ТРИГГЕР: Уведомление о реакции на пост
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_post_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_author_id uuid;
  post_title text;
  reactor_name text;
  reaction_text text;
BEGIN
  -- Получаем автора поста и название
  SELECT author_id, title INTO post_author_id, post_title
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Получаем имя того кто поставил реакцию
  SELECT COALESCE(display_name, username) INTO reactor_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Определяем текст реакции
  reaction_text := CASE 
    WHEN NEW.reaction_type = 'like' THEN 'поставил лайк вашему посту'
    WHEN NEW.reaction_type = 'dislike' THEN 'поставил дизлайк вашему посту'
    ELSE 'отреагировал на ваш пост'
  END;
  
  -- Создаем уведомление только для лайков (не для дизлайков чтобы не расстраивать)
  -- И не для самого себя
  IF post_author_id != NEW.user_id AND NEW.reaction_type = 'like' THEN
    INSERT INTO notifications (
      user_id,
      type,
      related_user_id,
      related_post_id,
      title,
      content,
      link,
      is_read
    )
    VALUES (
      post_author_id,
      'like',
      NEW.user_id,
      NEW.post_id,
      'Новый лайк',
      reactor_name || ' ' || reaction_text || ': "' || LEFT(post_title, 50) || '"',
      '/post/' || NEW.post_id,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS on_reaction_created_notify ON post_reactions;

-- Создаем новый триггер
CREATE TRIGGER on_reaction_created_notify
  AFTER INSERT ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_reaction();

-- ============================================================================
-- 4. ФУНКЦИЯ: Поиск и уведомление об упоминаниях @username
-- ============================================================================
-- Примечание: Это более сложная функция, которая парсит текст
-- Вызывается из клиентского кода при создании поста/комментария

CREATE OR REPLACE FUNCTION notify_mentions(
  content_text text,
  post_id_param uuid,
  mentioner_id uuid,
  mention_type text DEFAULT 'post'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mention_record record;
  mentioned_user_id uuid;
  mentioner_name text;
BEGIN
  -- Получаем имя упоминающего
  SELECT COALESCE(display_name, username) INTO mentioner_name
  FROM profiles
  WHERE id = mentioner_id;
  
  -- Ищем все упоминания @username в тексте
  FOR mention_record IN
    SELECT DISTINCT unnest(regexp_matches(content_text, '@([a-zA-Z0-9_]+)', 'g')) as username
  LOOP
    -- Находим пользователя по username
    SELECT id INTO mentioned_user_id
    FROM profiles
    WHERE username = mention_record.username;
    
    -- Если пользователь найден и это не сам упоминающий
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != mentioner_id THEN
      INSERT INTO notifications (
        user_id,
        type,
        related_user_id,
        related_post_id,
        title,
        content,
        link,
        is_read
      )
      VALUES (
        mentioned_user_id,
        'mention',
        mentioner_id,
        post_id_param,
        'Вас упомянули',
        mentioner_name || ' упомянул вас в ' || 
        CASE 
          WHEN mention_type = 'post' THEN 'посте'
          WHEN mention_type = 'comment' THEN 'комментарии'
          ELSE 'обсуждении'
        END,
        '/post/' || post_id_param,
        false
      );
    END IF;
  END LOOP;
END;
$$;

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION notify_mentions(text, uuid, uuid, text) TO authenticated;

-- ============================================================================
-- 5. ОПТИМИЗАЦИЯ: Группировка похожих уведомлений
-- ============================================================================
-- Удаляем дубликаты уведомлений за последние 5 минут
-- Например: 3 лайка от разных пользователей = 1 уведомление "3 человека лайкнули"

CREATE OR REPLACE FUNCTION should_group_notification(
  user_id_param uuid,
  type_param text,
  post_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  recent_notification_exists boolean;
BEGIN
  -- Проверяем есть ли похожее уведомление за последние 5 минут
  SELECT EXISTS(
    SELECT 1
    FROM notifications
    WHERE user_id = user_id_param
      AND type = type_param
      AND related_post_id = post_id_param
      AND created_at > NOW() - INTERVAL '5 minutes'
      AND is_read = false
  ) INTO recent_notification_exists;
  
  RETURN recent_notification_exists;
END;
$$;

-- ============================================================================
-- 6. ОЧИСТКА: Функция для удаления старых прочитанных уведомлений
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Удаляем прочитанные уведомления старше 30 дней
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Удаляем непрочитанные уведомления старше 90 дней
  DELETE FROM notifications
  WHERE is_read = false
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Даем права
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;

-- ============================================================================
-- ИНДЕКСЫ для быстрой работы уведомлений
-- ============================================================================

-- Индекс для быстрого подсчета непрочитанных
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

-- Индекс для быстрой выборки по типу
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(user_id, type, created_at DESC);

-- Индекс для связанного поста
CREATE INDEX IF NOT EXISTS idx_notifications_post 
ON notifications(related_post_id, created_at DESC)
WHERE related_post_id IS NOT NULL;

-- ============================================================================
-- КОММЕНТАРИИ
-- ============================================================================

COMMENT ON FUNCTION notify_post_comment() IS 
'Автоматически создает уведомление при новом комментарии к посту';

COMMENT ON FUNCTION notify_comment_reply() IS 
'Автоматически создает уведомление при ответе на комментарий';

COMMENT ON FUNCTION notify_post_reaction() IS 
'Автоматически создает уведомление при лайке поста (не дизлайке)';

COMMENT ON FUNCTION notify_mentions(text, uuid, uuid, text) IS 
'Ищет @упоминания в тексте и создает уведомления. Вызывается из клиентского кода.';

COMMENT ON FUNCTION cleanup_old_notifications() IS 
'Удаляет старые прочитанные уведомления (>30 дней) и непрочитанные (>90 дней)';

-- ============================================================================
-- МИГРАЦИЯ ЗАВЕРШЕНА
-- ============================================================================

-- Проверка: получить количество активных триггеров
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%notify%'
ORDER BY event_object_table, trigger_name;
