-- ============================================================================
-- FIX: Удалить trailing spaces из usernames
-- ============================================================================
-- Проблема: Username 'Franchik ' (с пробелом) не находится по 'Franchik'
-- Решение: TRIM всех usernames в базе
-- ============================================================================

-- 1. Проверить usernames с пробелами
SELECT 
  id,
  username,
  LENGTH(username) as username_length,
  display_name,
  CASE 
    WHEN username != TRIM(username) THEN '❌ HAS SPACES'
    ELSE '✅ OK'
  END as status
FROM profiles
WHERE username != TRIM(username);

-- Если нашлись - переходите к шагу 2

-- ============================================================================
-- 2. ИСПРАВИТЬ ВСЕ USERNAMES (удалить leading/trailing пробелы)
-- ============================================================================

UPDATE profiles
SET username = TRIM(username)
WHERE username != TRIM(username);

-- Должно показать: UPDATE X (количество исправленных)

-- ============================================================================
-- 3. ПРОВЕРКА после исправления
-- ============================================================================

-- Проверить что теперь находится
SELECT 
  id,
  username,
  display_name,
  LENGTH(username) as len
FROM profiles
WHERE username ILIKE 'franchik'
ORDER BY created_at DESC;

-- Должно показать: 'Franchik' (без пробела)

-- ============================================================================
-- 4. Добавить CHECK constraint чтобы предотвратить в будущем
-- ============================================================================

-- Опционально: запретить пробелы в начале/конце username
ALTER TABLE profiles
ADD CONSTRAINT username_no_spaces
CHECK (username = TRIM(username));

-- Теперь нельзя создать username с пробелами!

-- ============================================================================
-- ПРОВЕРКА РАБОТОСПОСОБНОСТИ
-- ============================================================================

-- Попробовать создать username с пробелом (должно упасть)
-- INSERT INTO profiles (id, username, display_name)
-- VALUES (gen_random_uuid(), 'test ', 'Test');
-- ERROR: new row violates check constraint "username_no_spaces"

-- ✅ Отлично! Constraint работает
