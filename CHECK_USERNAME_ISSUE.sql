-- ============================================================================
-- ПРОВЕРКА ПРОБЛЕМЫ С USERNAME "Franchik"
-- ============================================================================

-- 1. Проверить существует ли пользователь с таким username (case-insensitive)
SELECT 
  id,
  username,
  display_name,
  email,
  created_at
FROM profiles
WHERE username ILIKE 'franchik'
ORDER BY created_at DESC;

-- 2. Поиск похожих usernames
SELECT 
  id,
  username,
  display_name,
  created_at
FROM profiles
WHERE username ILIKE '%franc%'
ORDER BY created_at DESC;

-- 3. Проверить все usernames (первые 20)
SELECT 
  id,
  username,
  display_name,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- 4. Проверить есть ли посты от пользователя с display_name "Franchik"
SELECT 
  p.id as post_id,
  p.title,
  pr.id as profile_id,
  pr.username,
  pr.display_name
FROM posts p
JOIN profiles pr ON pr.id = p.author_id
WHERE pr.display_name ILIKE '%franchik%'
LIMIT 10;

-- ============================================================================
-- РЕШЕНИЕ (если пользователь не найден):
-- ============================================================================

-- Если пользователь существует с другим username, но display_name = "Franchik":
/*
-- Вариант 1: Обновить username чтобы совпадал с display_name
UPDATE profiles 
SET username = LOWER(display_name)
WHERE display_name ILIKE 'franchik'
  AND username != LOWER(display_name);

-- Вариант 2: Создать тестового пользователя (если нужен для тестирования)
INSERT INTO profiles (id, username, display_name, email)
VALUES (
  gen_random_uuid(),
  'franchik',
  'Franchik',
  'franchik@test.com'
);
*/

-- ============================================================================
-- ДИАГНОСТИКА
-- ============================================================================

-- Проверить что case-insensitive поиск работает
SELECT COUNT(*) as total_profiles FROM profiles;

-- Проверить дубликаты username (case-insensitive)
SELECT 
  LOWER(username) as username_lower,
  COUNT(*) as count,
  STRING_AGG(username, ', ') as variations
FROM profiles
GROUP BY LOWER(username)
HAVING COUNT(*) > 1;
