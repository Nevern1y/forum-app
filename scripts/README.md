# Scripts Documentation

Этот каталог содержит скрипты для управления базой данных и storage форума.

## 📁 Структура

```
scripts/
├── 001_create_tables.sql       - Создание основных таблиц БД
├── 002_enable_rls.sql          - Включение Row Level Security
├── 003_create_triggers.sql     - Создание триггеров
├── 004_create_functions.sql    - Создание функций БД
├── 005_disable_email_confirmation.sql - Отключение подтверждения email
├── backup_data.sql             - 🆕 Бэкап всех данных БД
├── cleanup_data.sql            - 🆕 Очистка всех данных БД
├── backup_storage.js           - 🆕 Бэкап файлов из Storage
├── cleanup_storage.js          - 🆕 Очистка файлов из Storage
└── README.md                   - Эта документация
```

## 🔥 Новые скрипты бэкапа и очистки

### 1. backup_data.sql

**Назначение:** Создает полный бэкап всех данных из PostgreSQL БД в CSV формате.

**Использование:**
```bash
psql "YOUR_DATABASE_URL" -f scripts/backup_data.sql
```

**Создает файлы:**
- `backup_profiles.csv` - Профили пользователей
- `backup_posts.csv` - Посты
- `backup_comments.csv` - Комментарии
- `backup_post_reactions.csv` - Реакции на посты
- `backup_comment_reactions.csv` - Реакции на комментарии
- `backup_post_views.csv` - Просмотры постов
- `backup_bookmarks.csv` - Закладки
- `backup_subscriptions.csv` - Подписки
- `backup_friendships.csv` - Дружба
- `backup_conversations.csv` - Беседы
- `backup_direct_messages.csv` - Личные сообщения
- `backup_notifications.csv` - Уведомления
- `backup_blocked_users.csv` - Заблокированные пользователи
- `backup_reports.csv` - Жалобы
- `backup_tags.csv` - Теги
- `backup_post_tags.csv` - Связи постов и тегов
- `backup_statistics.txt` - Статистика бэкапа

**Особенности:**
- ✅ Экспортирует все данные в CSV
- ✅ Сортирует по дате создания
- ✅ Создает статистику количества записей
- ✅ Безопасно для production (только чтение)

---

### 2. cleanup_data.sql

**Назначение:** Полное удаление всех пользовательских данных из БД.

**⚠️ ВНИМАНИЕ:** Это необратимая операция!

**Использование:**
```bash
psql "YOUR_DATABASE_URL" -f scripts/cleanup_data.sql
```

**Что делает:**
1. Запрашивает подтверждение (введите "YES")
2. Временно отключает триггеры для ускорения
3. Удаляет данные в правильном порядке (учитывая FK)
4. Выполняет VACUUM для освобождения места
5. Проверяет результат
6. Выводит статистику

**Особенности:**
- ✅ Удаляет данные в правильном порядке
- ✅ Использует транзакцию (можно откатить)
- ✅ Сохраняет структуру таблиц
- ✅ Сохраняет RLS политики
- ✅ Сохраняет функции и триггеры
- ✅ Очищает место на диске (VACUUM)

---

### 3. backup_storage.js

**Назначение:** Скачивает все файлы из Supabase Storage buckets.

**Использование:**
```bash
# Установите переменные окружения
export NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Запустите скрипт
node scripts/backup_storage.js
# или
npm run backup:storage
```

**Что делает:**
1. Подключается к Supabase Storage
2. Перебирает все buckets (post-images, comment-images и т.д.)
3. Скачивает все файлы в `storage-backup/[bucket-name]/`
4. Сохраняет структуру папок
5. Показывает прогресс

**Buckets:**
- `post-images` - Изображения в постах
- `comment-images` - Изображения в комментариях
- `media_uploads` - Другие медиа файлы
- `audio_uploads` - Аудиозаписи

**Особенности:**
- ✅ Сохраняет структуру папок
- ✅ Показывает прогресс
- ✅ Обрабатывает ошибки
- ✅ Поддерживает большое количество файлов

---

### 4. cleanup_storage.js

**Назначение:** Удаляет все файлы из Supabase Storage buckets.

**⚠️ ВНИМАНИЕ:** Это необратимая операция!

**Использование:**
```bash
# Установите переменные окружения
export NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Запустите скрипт
node scripts/cleanup_storage.js
# или
npm run cleanup:storage
```

**Что делает:**
1. Запрашивает подтверждение (введите "YES")
2. Перебирает все buckets
3. Удаляет файлы пакетами по 100 штук
4. Показывает прогресс
5. Проверяет результат

**Особенности:**
- ✅ Удаляет пакетами для производительности
- ✅ Показывает прогресс
- ✅ Обрабатывает ошибки
- ✅ Проверяет результат
- ✅ Сохраняет buckets (удаляет только файлы)

---

## 🚀 Быстрый старт

### Полный бэкап и очистка:

```bash
# 1. Создайте папку для бэкапа
mkdir ../forum-app-backup

# 2. Установите переменные окружения (Windows PowerShell)
$env:NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# 3. Бэкап БД
psql "YOUR_DATABASE_URL" -f scripts/backup_data.sql
move backup_*.* ../forum-app-backup/

# 4. Бэкап Storage
npm run backup:storage

# 5. Проверьте бэкап
type ../forum-app-backup/backup_statistics.txt

# 6. Очистка БД (введите YES для подтверждения)
psql "YOUR_DATABASE_URL" -f scripts/cleanup_data.sql

# 7. Очистка Storage (введите YES для подтверждения)
npm run cleanup:storage
```

---

## 📚 Документация

Для подробной информации смотрите:

- **[BACKUP_QUICKSTART.md](../BACKUP_QUICKSTART.md)** - Краткая инструкция
- **[BACKUP_AND_CLEANUP_GUIDE.md](../BACKUP_AND_CLEANUP_GUIDE.md)** - Полное руководство

---

## ⚙️ Требования

### Для SQL скриптов:
- PostgreSQL клиент (psql)
- Строка подключения к БД

### Для JS скриптов:
- Node.js >= 14
- npm или yarn
- Переменные окружения:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔐 Безопасность

**Service Role Key:**
- Используется только для Storage операций
- Имеет полный доступ к Storage
- Никогда не коммитьте его в git!
- Храните в `.env.local` или переменных окружения

**Рекомендации:**
1. Всегда делайте бэкап перед очисткой
2. Проверяйте бэкап перед удалением
3. Используйте production ключи только на production
4. Храните бэкапы в безопасном месте

---

## 🆘 Поддержка

При возникновении проблем:

1. **psql не найден:**
   ```bash
   # Windows: Установите PostgreSQL
   # Или используйте Supabase SQL Editor
   ```

2. **Node.js скрипт не работает:**
   ```bash
   # Убедитесь, что @supabase/supabase-js установлен
   npm install @supabase/supabase-js
   ```

3. **Ошибка доступа к БД:**
   - Проверьте строку подключения
   - Проверьте пароль
   - Проверьте права доступа

4. **Ошибка доступа к Storage:**
   - Проверьте SUPABASE_SERVICE_ROLE_KEY
   - Проверьте NEXT_PUBLIC_SUPABASE_URL
   - Убедитесь, что buckets существуют

---

## 📝 Changelog

**v1.0 (2025)**
- ✅ Добавлен backup_data.sql
- ✅ Добавлен cleanup_data.sql
- ✅ Добавлен backup_storage.js
- ✅ Добавлен cleanup_storage.js
- ✅ Добавлены npm скрипты
- ✅ Добавлена документация

---

**Дата обновления:** 2025  
**Версия:** 1.0
