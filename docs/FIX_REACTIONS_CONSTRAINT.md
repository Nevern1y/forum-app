# Исправление constraint для post_reactions

## Проблема
В базе данных есть старый constraint который не учитывает `reaction_type`, что вызывает ошибку:
```
duplicate key value violates unique constraint "post_reactions_post_id_user_id_key"
```

## Решение - Вариант 1: Исправить constraint (Рекомендуется)

Выполните этот SQL в Supabase Dashboard → SQL Editor:

```sql
-- 1. Удалить все старые constraints
ALTER TABLE post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_key;

ALTER TABLE post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_reaction_type_key;

ALTER TABLE post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_unique_reaction;

-- 2. Добавить правильный constraint
ALTER TABLE post_reactions 
ADD CONSTRAINT post_reactions_unique_reaction 
UNIQUE(post_id, user_id, reaction_type);

-- 3. Проверка (должен показать только один UNIQUE constraint)
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'post_reactions'::regclass
ORDER BY conname;
```

## Решение - Вариант 2: Пересоздать таблицу (Если Вариант 1 не помог)

⚠️ **ВНИМАНИЕ**: Это удалит все существующие лайки!

```sql
-- 1. Удалить старую таблицу
DROP TABLE IF EXISTS post_reactions CASCADE;

-- 2. Создать заново
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT post_reactions_unique_reaction UNIQUE(post_id, user_id, reaction_type)
);

-- 3. Индексы
CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user ON post_reactions(user_id);
CREATE INDEX idx_post_reactions_type ON post_reactions(reaction_type);

-- 4. RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON post_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON post_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

## Проверка

После выполнения любого варианта, проверьте constraints:

```sql
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'post_reactions'::regclass
AND contype = 'u'
ORDER BY conname;
```

Должен быть только один UNIQUE constraint на `(post_id, user_id, reaction_type)`.

## После этого

Лайки будут работать идеально! Попробуйте лайкнуть пост.
