# 🪟 Windows Setup Guide

## Проблема: psql не найден

У вас нет установленного PostgreSQL клиента. Есть **3 способа** решения:

---

## ✅ Способ 1: Через Supabase Dashboard (САМЫЙ ПРОСТОЙ!)

### Для SQL скриптов (backup_data.sql, cleanup_data.sql):

1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (левое меню)
4. Откройте файл скрипта в текстовом редакторе:
   - `scripts/backup_data.sql` или
   - `scripts/cleanup_data.sql`
5. Скопируйте весь текст скрипта
6. Вставьте в SQL Editor
7. Нажмите **Run** (или Ctrl+Enter)

**Важно для backup_data.sql:**
- Этот скрипт создаст CSV файлы НА СЕРВЕРЕ Supabase
- Для скачивания данных используйте Способ 2 (Node.js скрипт)

---

## ✅ Способ 2: Через Node.js скрипты (РЕКОМЕНДУЕМ!)

Я создам Node.js версии SQL скриптов, которые работают без psql!

### Шаг 1: Установите переменные окружения

Создайте файл `.env.local` в корне проекта:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://teftcesgqqwhqhdiornh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Где взять ключ:**
1. Откройте Supabase Dashboard
2. Settings → API
3. Скопируйте `service_role` key (⚠️ секретный!)

### Шаг 2: Используйте Node.js скрипты

```powershell
# Установите зависимости (если еще не установлены)
npm install

# Бэкап (создам новые скрипты)
npm run backup:db
npm run backup:storage

# Очистка (создам новые скрипты)
npm run cleanup:db
npm run cleanup:storage
```

---

## ✅ Способ 3: Установить PostgreSQL (для psql)

### Через Scoop (быстро):
```powershell
# Установите Scoop (если еще нет)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Установите PostgreSQL
scoop install postgresql
```

### Через официальный установщик:
1. Скачайте: https://www.postgresql.org/download/windows/
2. Установите PostgreSQL
3. Добавьте в PATH: `C:\Program Files\PostgreSQL\16\bin`
4. Перезапустите PowerShell

---

## 🔧 Сейчас сделаем Способ 2!

Создам Node.js версии скриптов для работы без psql.
