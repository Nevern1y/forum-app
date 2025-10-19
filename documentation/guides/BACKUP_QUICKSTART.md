# 🚀 Быстрый старт: Бэкап и очистка данных

## Краткая инструкция

### 📋 Что нужно:
1. PostgreSQL клиент (psql)
2. Node.js (для бэкапа Storage)
3. Строка подключения к Supabase БД

---

## 🔥 Быстрое выполнение

### Шаг 1: Подготовка

```bash
# Создайте папку для бэкапа
mkdir C:\Users\cynok\OneDrive\Документы\forum-app-backup

# Перейдите в папку проекта
cd C:\Users\cynok\OneDrive\Документы\forum-app
```

### Шаг 2: Установите переменные окружения

```bash
# Windows CMD
set NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Windows PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### Шаг 3: Бэкап БД

```bash
# Выполните SQL бэкап
psql "postgresql://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f scripts/backup_data.sql

# Переместите файлы
move backup_*.* C:\Users\cynok\OneDrive\Документы\forum-app-backup\
```

### Шаг 4: Бэкап Storage

```bash
# Через Node.js скрипт
node scripts/backup_storage.js
```

**Альтернатива:** Скачайте через Supabase Dashboard (Storage > Select all > Download)

### Шаг 5: Проверьте бэкап

```bash
# Проверьте файлы
dir C:\Users\cynok\OneDrive\Документы\forum-app-backup\
type C:\Users\cynok\OneDrive\Документы\forum-app-backup\backup_statistics.txt
```

### Шаг 6: Очистка БД

```bash
# ⚠️ ВНИМАНИЕ: Необратимая операция!
psql "postgresql://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f scripts/cleanup_data.sql

# Введите YES для подтверждения
```

### Шаг 7: Очистка Storage

```bash
# Через Node.js скрипт
node scripts/cleanup_storage.js

# Введите YES для подтверждения
```

**Альтернатива:** Удалите через Supabase Dashboard (Storage > Select all > Delete)

---

## ✅ Готово!

Проверьте:
- [ ] Все CSV файлы в папке бэкапа
- [ ] Storage файлы скачаны
- [ ] БД пустая (0 записей)
- [ ] Storage buckets пустые

---

## 📚 Полная документация

Смотрите `BACKUP_AND_CLEANUP_GUIDE.md` для подробной информации.

---

## 🆘 Быстрая помощь

**Проблема:** psql не найден  
**Решение:** Установите PostgreSQL или используйте Supabase SQL Editor

**Проблема:** Node.js скрипт не работает  
**Решение:** 
```bash
npm install @supabase/supabase-js
node scripts/backup_storage.js
```

**Проблема:** Ошибка доступа к БД  
**Решение:** Проверьте строку подключения и пароль в Supabase Dashboard

---

## 📦 Созданные файлы:

- `scripts/backup_data.sql` - SQL бэкап
- `scripts/cleanup_data.sql` - SQL очистка
- `scripts/backup_storage.js` - Бэкап Storage
- `scripts/cleanup_storage.js` - Очистка Storage
- `BACKUP_AND_CLEANUP_GUIDE.md` - Полная документация
- `BACKUP_QUICKSTART.md` - Эта инструкция

---

**Версия:** 1.0  
**Дата:** 2025
