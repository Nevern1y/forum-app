# 🪟 Windows Quick Start (БЕЗ psql!)

## ✅ Решение для Windows без установки PostgreSQL

Вам **НЕ НУЖНО** устанавливать PostgreSQL! Используйте Node.js скрипты.

---

## 📋 Шаг 1: Создайте файл .env.local

### Вариант A: Скопируйте пример
```powershell
# В корне проекта
copy .env.local.example .env.local
```

### Вариант B: Создайте вручную
Создайте файл `.env.local` в корне проекта с содержимым:

```env
NEXT_PUBLIC_SUPABASE_URL=https://teftcesgqqwhqhdiornh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 🔑 Шаг 2: Получите ключи из Supabase

1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. **Settings** (левое меню) → **API**
4. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (нажмите "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **service_role** key - это СЕКРЕТНЫЙ ключ! Никогда не коммитьте его в git!

---

## 📦 Шаг 3: Установите зависимости

```powershell
npm install
```

Это установит `dotenv` для чтения .env.local файла.

---

## 🚀 Шаг 4: Запустите бэкап и очистку!

### Только бэкап БД:
```powershell
npm run backup:db
```

### Только бэкап Storage:
```powershell
npm run backup:storage
```

### Полный бэкап (БД + Storage):
```powershell
npm run backup:all
```

### Только очистка БД:
```powershell
npm run cleanup:db
```

### Только очистка Storage:
```powershell
npm run cleanup:storage
```

### Полная очистка (БД + Storage):
```powershell
npm run cleanup:all
```

---

## 📁 Где найти бэкапы?

После выполнения бэкапа:

```
forum-app/
├── database-backup/          ← Бэкап БД (CSV файлы)
│   ├── backup_profiles.csv
│   ├── backup_posts.csv
│   ├── ... (16 файлов)
│   └── backup_statistics.txt
│
└── storage-backup/           ← Бэкап Storage (медиа файлы)
    ├── post-images/
    ├── comment-images/
    ├── media_uploads/
    └── audio_uploads/
```

---

## ✅ Проверка

### Проверить бэкап:
```powershell
# Проверить CSV файлы БД
dir database-backup

# Проверить статистику
type database-backup\backup_statistics.txt

# Проверить медиа файлы
dir storage-backup
```

### Проверить очистку:
Откройте Supabase Dashboard → Table Editor и убедитесь, что таблицы пустые.

---

## 🎯 Полный процесс (от начала до конца)

```powershell
# 1. Создайте .env.local (один раз)
copy .env.local.example .env.local
# Откройте .env.local и вставьте ваши ключи

# 2. Установите зависимости (один раз)
npm install

# 3. Выполните полный бэкап
npm run backup:all

# 4. Проверьте бэкап
type database-backup\backup_statistics.txt

# 5. Выполните полную очистку (введите YES для подтверждения)
npm run cleanup:all
```

---

## ⚡ Преимущества Node.js версии

✅ **Не нужен psql** - работает на чистой Windows  
✅ **Не нужен PostgreSQL** - только Node.js  
✅ **Простая установка** - npm install и готово  
✅ **Автоматические переменные** - читает .env.local  
✅ **Прогресс выполнения** - показывает, что происходит  
✅ **Проверка результатов** - автоматическая верификация  

---

## 🆘 Частые проблемы

### Проблема: Missing environment variables
**Решение:** Создайте файл `.env.local` с ключами (см. Шаг 1-2)

### Проблема: Cannot find module 'dotenv'
**Решение:** Запустите `npm install`

### Проблема: Invalid API key
**Решение:** Проверьте `SUPABASE_SERVICE_ROLE_KEY` в .env.local (используйте service_role, не anon!)

### Проблема: Network error
**Решение:** Проверьте `NEXT_PUBLIC_SUPABASE_URL` в .env.local

---

## 📚 Дополнительная документация

- **Полное руководство:** BACKUP_AND_CLEANUP_GUIDE.md
- **Шпаргалка:** BACKUP_CHEATSHEET.md
- **Для Windows:** WINDOWS_SETUP.md

---

## 🎉 Готово!

Теперь у вас есть полноценная система бэкапа и очистки, которая работает на Windows без psql!

**Начните с:** `npm run backup:all`
