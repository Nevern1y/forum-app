-- ============================================================================
-- ИСПРАВЛЕНИЕ REALTIME И RPC ФУНКЦИЙ
-- ============================================================================
-- Выполните в Supabase SQL Editor
-- ============================================================================

-- 1. Создание/обновление increment_post_views
DROP FUNCTION IF EXISTS increment_post_views(uuid);

CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts 
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO anon;

-- 2. Включение Realtime для post_reactions (игнорируем если уже добавлена)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Таблица уже в публикации, всё ОК
  END;
END $$;

-- 3. RLS политики для post_reactions
DROP POLICY IF EXISTS "Public can view reactions" ON post_reactions;
CREATE POLICY "Public can view reactions" ON post_reactions
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their reactions" ON post_reactions;
CREATE POLICY "Users can manage their reactions" ON post_reactions
FOR ALL USING (auth.uid() = user_id);

-- 4. Включение Realtime для notifications (игнорируем если уже добавлена)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Таблица уже в публикации, всё ОК
  END;
END $$;

-- 5. RLS для notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- 6. Тесты
SELECT increment_post_views('d8f0348d-b8b4-4496-9b9f-83b7bc921546'::uuid);

-- Проверка Realtime
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- ============================================================================
-- После выполнения:
-- 1. Перейдите в Supabase Dashboard → Database → Replication
-- 2. Включите для post_reactions: INSERT, UPDATE, DELETE
-- 3. Включите для notifications: INSERT, UPDATE, DELETE
-- 4. Перезапустите npm run dev
-- ============================================================================
