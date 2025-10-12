# Применение миграции для лайков

## Проблема
Таблица `post_reactions` не была создана в базе данных, из-за чего лайки не работают.

## Решение

### Вариант 1: Через Supabase Dashboard (Быстро) ⚡

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (левое меню)
4. Создайте **New Query**
5. Скопируйте и вставьте этот SQL код:

```sql
-- Create post_reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

COMMENT ON TABLE post_reactions IS 'User reactions (likes, emoji) to posts';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON post_reactions(reaction_type);

-- Enable RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add reactions" ON post_reactions;
CREATE POLICY "Authenticated users can add reactions"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON post_reactions;
CREATE POLICY "Users can remove own reactions"
  ON post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

6. Нажмите **Run** (или Ctrl+Enter)
7. Должно появиться сообщение "Success" ✅

### Вариант 2: Применить все миграции заново

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. SQL Editor → New Query
3. Скопируйте весь файл `supabase/migrations/run_all_migrations.sql`
4. Вставьте и нажмите **Run**

## Проверка

После применения миграции проверьте:

1. В Supabase Dashboard → **Table Editor**
2. Найдите таблицу `post_reactions`
3. Убедитесь, что она создана с колонками:
   - `id`
   - `post_id`
   - `user_id`
   - `reaction_type`
   - `created_at`

## Готово! 🎉

Теперь лайки должны работать! Попробуйте лайкнуть пост в ленте.
