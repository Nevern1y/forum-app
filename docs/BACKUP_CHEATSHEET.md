# 📋 Шпаргалка: Бэкап и очистка

## ⚡ Одна команда для всего

### Windows PowerShell

```powershell
# Установите переменные
$env:NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
$DB_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# Бэкап БД
psql $DB_URL -f scripts/backup_data.sql
Move-Item backup_*.* ..\forum-app-backup\

# Бэкап Storage
npm run backup:storage

# Очистка БД (введите YES)
psql $DB_URL -f scripts/cleanup_data.sql

# Очистка Storage (введите YES)
npm run cleanup:storage
```

---

## 📦 Отдельные команды

### Бэкап БД
```bash
psql "YOUR_DB_URL" -f scripts/backup_data.sql
```

### Бэкап Storage
```bash
npm run backup:storage
# или
node scripts/backup_storage.js
```

### Очистка БД
```bash
psql "YOUR_DB_URL" -f scripts/cleanup_data.sql
# Введите: YES
```

### Очистка Storage
```bash
npm run cleanup:storage
# или
node scripts/cleanup_storage.js
# Введите: YES
```

---

## 🔗 Где взять строку подключения

Supabase Dashboard → Settings → Database → Connection string (URI)

```
postgresql://postgres.[project]:PASSWORD@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## 🔑 Где взять ключи

Supabase Dashboard → Settings → API

- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key (secret!)

---

## ✅ Проверка бэкапа

```bash
# Проверьте файлы
dir ..\forum-app-backup\

# Статистика
type ..\forum-app-backup\backup_statistics.txt

# Storage
dir storage-backup\
```

---

## 🗑️ Проверка очистки

```sql
-- В psql или Supabase SQL Editor
SELECT 
  'profiles' as table_name, COUNT(*) FROM profiles
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'comments', COUNT(*) FROM comments;

-- Должно быть 0 везде
```

---

## 🆘 Частые ошибки

| Ошибка | Решение |
|--------|---------|
| `psql: command not found` | Установите PostgreSQL или используйте Supabase SQL Editor |
| `Cannot find module '@supabase/supabase-js'` | `npm install @supabase/supabase-js` |
| `Invalid API key` | Проверьте SUPABASE_SERVICE_ROLE_KEY |
| `Connection refused` | Проверьте строку подключения и пароль |
| `Permission denied` | Используйте service_role key, не anon key |

---

## 📁 Созданные файлы

```
✅ scripts/backup_data.sql       - SQL бэкап
✅ scripts/cleanup_data.sql      - SQL очистка
✅ scripts/backup_storage.js     - JS бэкап Storage
✅ scripts/cleanup_storage.js    - JS очистка Storage
✅ BACKUP_AND_CLEANUP_GUIDE.md   - Полная документация
✅ BACKUP_QUICKSTART.md          - Быстрый старт
✅ BACKUP_CHEATSHEET.md          - Эта шпаргалка
✅ scripts/README.md             - Документация скриптов
```

---

## 📚 Документация

- **Быстрый старт:** `BACKUP_QUICKSTART.md`
- **Полное руководство:** `BACKUP_AND_CLEANUP_GUIDE.md`
- **Документация скриптов:** `scripts/README.md`

---

**Tip:** Сохраните эту шпаргалку для быстрого доступа!
