# Руководство по бэкапу и очистке данных

## ⚠️ ВАЖНО: Прочитайте перед выполнением!

Это руководство описывает процесс создания бэкапа и полной очистки всех пользовательских данных из базы данных форума. **Это необратимая операция!**

---

## Что будет сохранено в бэкап:

### 📊 Данные пользователей:
- **Профили** - все учетные записи пользователей
- **Посты** - все публикации с текстом и медиа
- **Комментарии** - все комментарии с медиа
- **Реакции** - лайки/дизлайки на посты и комментарии
- **Просмотры постов** - история просмотров
- **Закладки** - сохраненные посты
- **Подписки** - связи подписчиков
- **Дружба** - запросы и принятые друзья
- **Сообщения** - приватные сообщения между пользователями
- **Беседы** - история диалогов
- **Уведомления** - все уведомления
- **Блокировки** - заблокированные пользователи
- **Жалобы** - отчеты о нарушениях
- **Теги** - все теги постов

### 📁 Медиа файлы (Storage):
- **post-images** - изображения в постах
- **comment-images** - изображения в комментариях
- **media_uploads** - загруженные медиа (если есть)
- **audio_uploads** - аудиозаписи (если есть)

---

## 📋 Предварительные требования

1. **PostgreSQL клиент (psql)** - для выполнения SQL скриптов
2. **Доступ к Supabase** - для управления Storage
3. **Права администратора БД** - для выполнения операций

---

## 🔧 Шаг 1: Подготовка

### 1.1 Найдите строку подключения к БД

Откройте Supabase Dashboard:
1. Перейдите в ваш проект
2. Settings > Database
3. Скопируйте **Connection string** (URI)
4. Замените `[YOUR-PASSWORD]` на ваш реальный пароль БД

Пример:
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### 1.2 Создайте папку для бэкапов

```bash
mkdir C:\Users\cynok\OneDrive\Документы\forum-app-backup
cd C:\Users\cynok\OneDrive\Документы\forum-app-backup
```

---

## 💾 Шаг 2: Выполнение бэкапа данных

### 2.1 Выполните SQL скрипт бэкапа

```bash
# Перейдите в папку проекта
cd C:\Users\cynok\OneDrive\Документы\forum-app

# Выполните скрипт бэкапа
psql "postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f scripts/backup_data.sql
```

### 2.2 Проверьте созданные файлы

После выполнения скрипта будут созданы файлы:
- `backup_profiles.csv`
- `backup_posts.csv`
- `backup_comments.csv`
- `backup_post_reactions.csv`
- `backup_comment_reactions.csv`
- `backup_post_views.csv`
- `backup_bookmarks.csv`
- `backup_subscriptions.csv`
- `backup_friendships.csv`
- `backup_conversations.csv`
- `backup_direct_messages.csv`
- `backup_notifications.csv`
- `backup_blocked_users.csv`
- `backup_reports.csv`
- `backup_tags.csv`
- `backup_post_tags.csv`
- `backup_statistics.txt` - статистика бэкапа

### 2.3 Переместите файлы в папку бэкапа

```bash
move backup_*.* C:\Users\cynok\OneDrive\Документы\forum-app-backup\
```

---

## 📦 Шаг 3: Бэкап Storage (медиа файлы)

### Вариант A: Через Supabase Dashboard (рекомендуется)

1. Откройте Supabase Dashboard
2. Перейдите в **Storage**
3. Для каждого bucket:
   - Выберите bucket (post-images, comment-images и т.д.)
   - Выберите все файлы (Ctrl+A)
   - Нажмите **Download** или **Download all**
4. Сохраните файлы в `forum-app-backup/storage/[bucket-name]/`

### Вариант B: Через Supabase CLI

```bash
# Установите Supabase CLI (если еще не установлен)
npm install -g supabase

# Войдите в Supabase
supabase login

# Свяжите проект
supabase link --project-ref YOUR_PROJECT_REF

# Скачайте файлы из каждого bucket
supabase storage download post-images --recursive --output C:\Users\cynok\OneDrive\Документы\forum-app-backup\storage\post-images
supabase storage download comment-images --recursive --output C:\Users\cynok\OneDrive\Документы\forum-app-backup\storage\comment-images
```

### Вариант C: Через API (скрипт)

Можно использовать скрипт Node.js для автоматической загрузки всех файлов из Storage.

---

## 🗑️ Шаг 4: Очистка данных из БД

⚠️ **ВНИМАНИЕ**: Убедитесь, что бэкап выполнен успешно!

### 4.1 Проверьте бэкап файлы

```bash
# Проверьте наличие всех файлов
dir C:\Users\cynok\OneDrive\Документы\forum-app-backup\

# Откройте backup_statistics.txt и проверьте количество записей
```

### 4.2 Выполните скрипт очистки

```bash
# Перейдите в папку проекта
cd C:\Users\cynok\OneDrive\Документы\forum-app

# Выполните скрипт очистки
psql "postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f scripts/cleanup_data.sql
```

Скрипт попросит подтверждение:
```
WARNING: This will DELETE ALL user data! Type YES to continue:
```

Введите **YES** (заглавными буквами) и нажмите Enter.

### 4.3 Дождитесь завершения

Скрипт выполнит:
- Удаление всех данных из таблиц (в правильном порядке)
- Очистку и оптимизацию таблиц (VACUUM)
- Проверку результатов

---

## 🧹 Шаг 5: Очистка Storage

### Вариант A: Через Supabase Dashboard

1. Откройте Supabase Dashboard
2. Перейдите в **Storage**
3. Для каждого bucket:
   - Выберите bucket (post-images, comment-images и т.д.)
   - Выберите все файлы (Ctrl+A)
   - Нажмите **Delete**
   - Подтвердите удаление

### Вариант B: Через Supabase CLI

```bash
# Очистите каждый bucket
supabase storage empty post-images
supabase storage empty comment-images
supabase storage empty media_uploads
supabase storage empty audio_uploads
```

---

## ✅ Шаг 6: Проверка

### 6.1 Проверьте БД

```bash
psql "postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

```sql
-- Проверьте количество записей в таблицах
SELECT 
  'profiles' as table_name, COUNT(*) as records FROM profiles
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'direct_messages', COUNT(*) FROM direct_messages;

-- Должно быть 0 записей во всех таблицах
```

### 6.2 Проверьте Storage

Откройте Supabase Dashboard > Storage и убедитесь, что все buckets пусты.

### 6.3 Проверьте бэкап

Откройте несколько CSV файлов в `forum-app-backup/` и убедитесь, что данные сохранены корректно.

---

## 📂 Структура бэкапа

```
forum-app-backup/
├── backup_profiles.csv
├── backup_posts.csv
├── backup_comments.csv
├── backup_post_reactions.csv
├── backup_comment_reactions.csv
├── backup_post_views.csv
├── backup_bookmarks.csv
├── backup_subscriptions.csv
├── backup_friendships.csv
├── backup_conversations.csv
├── backup_direct_messages.csv
├── backup_notifications.csv
├── backup_blocked_users.csv
├── backup_reports.csv
├── backup_tags.csv
├── backup_post_tags.csv
├── backup_statistics.txt
└── storage/
    ├── post-images/
    ├── comment-images/
    ├── media_uploads/
    └── audio_uploads/
```

---

## 🔄 Восстановление данных (если нужно)

Если вы захотите восстановить данные из бэкапа:

### Восстановление БД

```bash
# Для каждой таблицы выполните COPY
psql "YOUR_CONNECTION_STRING" -c "\COPY profiles FROM 'backup_profiles.csv' WITH CSV HEADER"
psql "YOUR_CONNECTION_STRING" -c "\COPY posts FROM 'backup_posts.csv' WITH CSV HEADER"
# И так далее для каждой таблицы
```

### Восстановление Storage

Загрузите файлы обратно через Supabase Dashboard или CLI.

---

## ⚠️ Важные замечания

1. **Структура БД сохраняется** - удаляются только данные, таблицы и схема остаются
2. **RLS политики сохраняются** - все правила безопасности остаются активными
3. **Функции и триггеры сохраняются** - вся логика БД остается на месте
4. **Auth пользователи удаляются** - через каскадное удаление profiles
5. **Storage buckets остаются** - удаляются только файлы, сами buckets сохраняются

---

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи выполнения скриптов
2. Убедитесь, что у вас есть права администратора БД
3. Проверьте строку подключения к БД
4. Убедитесь, что установлен psql клиент

---

## 📝 Контрольный список

- [ ] Создана папка для бэкапа
- [ ] Выполнен SQL бэкап данных
- [ ] Проверены созданные CSV файлы
- [ ] Выполнен бэкап Storage файлов
- [ ] Проверен backup_statistics.txt
- [ ] Выполнена очистка БД
- [ ] Проверено удаление данных
- [ ] Выполнена очистка Storage
- [ ] Проверена пустота buckets
- [ ] Бэкап сохранен в безопасном месте

---

**Дата создания**: 2025  
**Версия**: 1.0
