# 🎯 НАЧНИТЕ ЗДЕСЬ: Система бэкапа и очистки данных

## ✅ Что готово?

Создана полная система для бэкапа и очистки всех данных вашего форума:

### 📦 Что можно сделать:
- ✅ **Бэкап БД** - Экспорт всех 16 таблиц в CSV файлы
- ✅ **Бэкап Storage** - Скачивание всех медиа файлов из 4 buckets
- ✅ **Очистка БД** - Безопасное удаление всех данных с сохранением структуры
- ✅ **Очистка Storage** - Удаление всех файлов с сохранением buckets

---

## 🚀 Быстрый старт (3 команды!)

```bash
# 1. Настройте окружение
$env:NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# 2. Бэкап
psql "YOUR_DB_URL" -f scripts/backup_data.sql
npm run backup:storage

# 3. Очистка (введите YES для подтверждения)
psql "YOUR_DB_URL" -f scripts/cleanup_data.sql
npm run cleanup:storage
```

---

## 📚 Документация (выберите подходящий вариант)

### 🏃 Для тех, кто спешит
→ **[BACKUP_QUICKSTART.md](BACKUP_QUICKSTART.md)**
- Краткая инструкция на 1 страницу
- Только основные команды
- ~5 минут чтения

### 📖 Для тех, кто хочет разобраться
→ **[BACKUP_AND_CLEANUP_GUIDE.md](BACKUP_AND_CLEANUP_GUIDE.md)**
- Полное руководство со всеми деталями
- Пошаговые инструкции
- Troubleshooting
- Восстановление из бэкапа
- ~15 минут чтения

### 📋 Для тех, кому нужна шпаргалка
→ **[BACKUP_CHEATSHEET.md](BACKUP_CHEATSHEET.md)**
- Все команды в одном месте
- Где взять ключи и пароли
- Частые ошибки и решения
- Держите под рукой!

---

## 🗂️ Созданные файлы

### Документация (5 файлов)
```
✓ BACKUP_AND_CLEANUP_GUIDE.md (11.2 KB) - Полное руководство
✓ BACKUP_QUICKSTART.md        (3.5 KB)  - Быстрый старт
✓ BACKUP_CHEATSHEET.md         (3.5 KB)  - Шпаргалка с командами
✓ BACKUP_SUMMARY.md            (9.9 KB)  - Сводка о системе
✓ BACKUP_FILES_INDEX.md        (9.1 KB)  - Навигация по файлам
```

### Скрипты (5 файлов)
```
✓ scripts/backup_data.sql      (8.6 KB)  - SQL бэкап БД
✓ scripts/cleanup_data.sql     (8.7 KB)  - SQL очистка БД
✓ scripts/backup_storage.js    (5.2 KB)  - JS бэкап Storage
✓ scripts/cleanup_storage.js   (6.2 KB)  - JS очистка Storage
✓ scripts/README.md            (9.2 KB)  - Документация скриптов
```

### NPM команды (добавлены в package.json)
```
✓ npm run backup:storage   - Бэкап Storage
✓ npm run cleanup:storage  - Очистка Storage
```

---

## 📊 Что будет сохранено в бэкап

### База данных (16 таблиц)
```
✓ profiles            - Пользователи
✓ posts               - Посты с медиа
✓ comments            - Комментарии с медиа
✓ post_reactions      - Лайки/дизлайки постов
✓ comment_reactions   - Лайки/дизлайки комментариев
✓ post_views          - Просмотры постов
✓ bookmarks           - Закладки
✓ subscriptions       - Подписки
✓ friendships         - Дружба
✓ conversations       - Диалоги
✓ direct_messages     - Личные сообщения
✓ notifications       - Уведомления
✓ blocked_users       - Блокировки
✓ reports             - Жалобы
✓ tags                - Теги
✓ post_tags           - Связи постов и тегов
```

### Storage (4 buckets)
```
✓ post-images         - Изображения в постах
✓ comment-images      - Изображения в комментариях
✓ media_uploads       - Медиа файлы
✓ audio_uploads       - Аудиозаписи
```

---

## ⚙️ Что нужно для работы

### Для SQL скриптов:
- ✅ PostgreSQL клиент (psql)
- ✅ Строка подключения к БД
- ✅ Права доступа

### Для JS скриптов:
- ✅ Node.js >= 14
- ✅ Переменные окружения:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**Где взять?**
→ Supabase Dashboard → Settings → Database (для DB URL)
→ Supabase Dashboard → Settings → API (для ключей)

---

## ⚠️ Важно знать!

### Очистка необратима!
- ❌ Удаляются ВСЕ данные пользователей
- ❌ Удаляются ВСЕ медиа файлы
- ✅ Структура БД остается (таблицы, индексы, RLS)
- ✅ Storage buckets остаются (удаляются только файлы)

### Всегда делайте бэкап перед очисткой!
1. Выполните бэкап БД
2. Выполните бэкап Storage
3. **Проверьте бэкап!**
4. Только потом очищайте

---

## 🎯 Рекомендуемый порядок действий

### Первый раз используете?
```
1. Прочитайте BACKUP_QUICKSTART.md
2. Подготовьте строку подключения и ключи
3. Создайте папку для бэкапа
4. Выполните бэкап БД
5. Выполните бэкап Storage
6. Проверьте созданные файлы
7. (Опционально) Выполните очистку
```

### Уже знакомы с процессом?
```
1. Откройте BACKUP_CHEATSHEET.md
2. Выполните команды из шпаргалки
3. Готово!
```

---

## 🆘 Помощь и поддержка

### Проблемы с бэкапом?
→ См. **BACKUP_AND_CLEANUP_GUIDE.md** → раздел "Troubleshooting"

### Нужна справка по командам?
→ См. **BACKUP_CHEATSHEET.md** → "Частые ошибки"

### Хотите понять, как работают скрипты?
→ См. **scripts/README.md**

### Нужна полная картина?
→ См. **BACKUP_SUMMARY.md**

---

## 📂 Структура бэкапа

После выполнения бэкапа у вас будет:

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
├── backup_statistics.txt          ← Важно! Проверьте это
└── storage/
    ├── post-images/
    ├── comment-images/
    ├── media_uploads/
    └── audio_uploads/
```

---

## ✅ Контрольный список

Перед началом:
- [ ] Прочитал документацию
- [ ] Установил psql
- [ ] Установил Node.js
- [ ] Подготовил строку подключения к БД
- [ ] Подготовил SUPABASE_SERVICE_ROLE_KEY
- [ ] Создал папку для бэкапа

После бэкапа:
- [ ] Проверил CSV файлы
- [ ] Проверил backup_statistics.txt
- [ ] Проверил медиа файлы
- [ ] Сохранил бэкап в безопасном месте

Перед очисткой:
- [ ] **Бэкап выполнен и проверен!**
- [ ] Понял, что это необратимо
- [ ] Готов ввести "YES" для подтверждения

---

## 🎉 Готово к использованию!

Выберите документацию по вашим потребностям и начинайте!

**Рекомендуем:**
- Новичкам → [BACKUP_QUICKSTART.md](BACKUP_QUICKSTART.md)
- Опытным → [BACKUP_CHEATSHEET.md](BACKUP_CHEATSHEET.md)
- Детали → [BACKUP_AND_CLEANUP_GUIDE.md](BACKUP_AND_CLEANUP_GUIDE.md)

---

## 💡 Дополнительная информация

- **Версия:** 1.0
- **Дата:** 13 октября 2025
- **Статус:** ✅ Production Ready
- **Тестировано:** Да
- **Безопасность:** Транзакции, подтверждения, проверки

---

**🚀 Начните с [BACKUP_QUICKSTART.md](BACKUP_QUICKSTART.md)**
