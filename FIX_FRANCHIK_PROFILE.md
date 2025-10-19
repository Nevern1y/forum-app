# 🔧 ИСПРАВЛЕНИЕ: Проблема с профилем Franchik

## 🎯 Проблема

```
Error: [Profile Page] User not found: Franchik
```

**Root Cause:** Username в базе = `'Franchik '` (с пробелом в конце)  
**URL:** `/profile/Franchik` (без пробела)  
**Результат:** Не совпадает! ❌

---

## ✅ Решение (3 минуты)

### Шаг 1: Применить SQL (ОБЯЗАТЕЛЬНО)

Откройте **Supabase SQL Editor** и выполните:

```sql
-- 1. Проверить проблемные usernames
SELECT 
  id,
  username,
  LENGTH(username) as len,
  display_name,
  CASE 
    WHEN username != TRIM(username) THEN '❌ HAS SPACES'
    ELSE '✅ OK'
  END as status
FROM profiles
WHERE username != TRIM(username);

-- Результат должен показать 'Franchik ' (с пробелом)
```

### Шаг 2: Исправить данные

```sql
-- 2. TRIM все usernames (удалить пробелы)
UPDATE profiles
SET username = TRIM(username)
WHERE username != TRIM(username);

-- Должно показать: UPDATE 1 (или сколько пользователей с пробелами)
```

### Шаг 3: Добавить защиту (рекомендуется)

```sql
-- 3. Запретить пробелы в будущем
ALTER TABLE profiles
ADD CONSTRAINT username_no_spaces
CHECK (username = TRIM(username));

-- Теперь невозможно создать username с пробелами!
```

### Шаг 4: Проверить результат

```sql
-- 4. Убедиться что исправлено
SELECT id, username, display_name
FROM profiles
WHERE username ILIKE 'franchik';

-- Результат: 'Franchik' (БЕЗ пробела) ✅
```

---

## 🧪 Тестирование

После применения SQL:

```bash
# Перезапустите приложение
npm run dev

# Попробуйте все варианты:
http://localhost:3000/profile/Franchik   # ✅ Работает
http://localhost:3000/profile/franchik   # ✅ Работает (case-insensitive)
http://localhost:3000/profile/FRANCHIK   # ✅ Работает
```

---

## 📊 Что исправлено

### В коде:
```typescript
// ✅ Trim username from URL
const decodedUsername = decodeURIComponent(username).trim()

// ✅ Case-insensitive search
.ilike("username", decodedUsername)

// ✅ Better error handling (.limit(1) вместо .single())
```

### В базе данных:
```sql
-- ✅ Удалены trailing spaces
UPDATE profiles SET username = TRIM(username)

-- ✅ Добавлен CHECK constraint
ALTER TABLE profiles ADD CONSTRAINT username_no_spaces ...
```

---

## 🔍 Диагностика (если не работает)

### Проверка 1: Username в базе
```sql
SELECT username, LENGTH(username), display_name 
FROM profiles 
WHERE LOWER(username) LIKE '%franchik%';
```

**Ожидается:**
```
username | length | display_name
─────────┼────────┼─────────────
Franchik |      8 | Franchik
```

Если `length = 9` → еще есть пробел!

### Проверка 2: Constraint установлен
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname = 'username_no_spaces';
```

**Ожидается:**
```
conname              | pg_get_constraintdef
────────────────────┼─────────────────────────
username_no_spaces  | CHECK ((username = ...
```

### Проверка 3: Попробовать создать с пробелом
```sql
-- Должно упасть с ошибкой!
INSERT INTO profiles (id, username, display_name)
VALUES (gen_random_uuid(), 'test ', 'Test');

-- ERROR: violates check constraint "username_no_spaces"
-- ✅ Constraint работает!
```

---

## 📝 Коммиты

```
8693d27 Fix: Improve profile lookup to handle edge cases
807fa14 Fix: Add SQL to remove trailing spaces from usernames
87d728d Fix: Remove non-existent email column from profiles query
d5575b4 Fix: Make profile username search case-insensitive
```

---

## ✅ Checklist

После применения SQL:

- [ ] ✅ SQL выполнен без ошибок
- [ ] ✅ UPDATE показал количество исправленных (UPDATE 1+)
- [ ] ✅ Constraint добавлен
- [ ] ✅ Профиль Franchik открывается
- [ ] ✅ Case-insensitive поиск работает
- [ ] ✅ Нет ошибок в консоли

---

## 🎉 Готово!

После всех шагов:
- ✅ Профиль "Franchik" доступен
- ✅ Все варианты URL работают (Franchik/franchik/FRANCHIK)
- ✅ Будущие usernames не могут иметь пробелы
- ✅ Case-insensitive поиск работает

**Время исправления:** 3 минуты  
**Риск:** Низкий (только TRIM, не удаляет данные)  
**Результат:** Production-ready! ✅
