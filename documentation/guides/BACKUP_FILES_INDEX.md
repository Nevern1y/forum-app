# 📚 Индекс файлов системы бэкапа

## 🗂️ Структура проекта

```
forum-app/
│
├── 📄 BACKUP_AND_CLEANUP_GUIDE.md    ← 📖 ПОЛНОЕ РУКОВОДСТВО (начните здесь!)
├── 📄 BACKUP_QUICKSTART.md           ← ⚡ БЫСТРЫЙ СТАРТ (если спешите)
├── 📄 BACKUP_CHEATSHEET.md           ← 📋 ШПАРГАЛКА (команды и решения)
├── 📄 BACKUP_SUMMARY.md              ← ✅ СВОДКА (что было сделано)
├── 📄 BACKUP_FILES_INDEX.md          ← 📚 ЭТОТ ФАЙЛ (навигация)
│
├── 📦 package.json                   ← ⚙️  Добавлены npm скрипты
│
└── scripts/
    ├── 📄 README.md                  ← 📖 Документация скриптов
    │
    ├── 💾 backup_data.sql            ← SQL: Бэкап БД → CSV
    ├── 🗑️  cleanup_data.sql           ← SQL: Очистка БД
    ├── 💾 backup_storage.js          ← JS: Бэкап Storage → папки
    └── 🗑️  cleanup_storage.js         ← JS: Очистка Storage
```

---

## 🎯 Быстрая навигация

### 🚀 Хочу быстро начать
→ Читайте **[BACKUP_QUICKSTART.md](BACKUP_QUICKSTART.md)**

### 📖 Хочу подробное руководство
→ Читайте **[BACKUP_AND_CLEANUP_GUIDE.md](BACKUP_AND_CLEANUP_GUIDE.md)**

### 📋 Нужны только команды
→ Смотрите **[BACKUP_CHEATSHEET.md](BACKUP_CHEATSHEET.md)**

### 🔍 Хочу понять, что было сделано
→ Читайте **[BACKUP_SUMMARY.md](BACKUP_SUMMARY.md)**

### 🛠️ Нужна документация скриптов
→ Читайте **[scripts/README.md](scripts/README.md)**

---

## 📄 Описание файлов

### Документация

| Файл | Размер | Описание | Для кого |
|------|--------|----------|----------|
| **BACKUP_AND_CLEANUP_GUIDE.md** | 11.4 KB | Полное руководство с пошаговыми инструкциями | Тем, кто делает впервые |
| **BACKUP_QUICKSTART.md** | 3.6 KB | Краткая инструкция для быстрого старта | Опытным пользователям |
| **BACKUP_CHEATSHEET.md** | 3.5 KB | Шпаргалка с командами и решениями | Всем для справки |
| **BACKUP_SUMMARY.md** | Новый | Сводка о созданной системе | Для понимания масштаба |
| **BACKUP_FILES_INDEX.md** | Этот файл | Навигация по файлам | Для быстрого поиска |

### Скрипты

| Файл | Размер | Язык | Описание | Использование |
|------|--------|------|----------|---------------|
| **backup_data.sql** | 8.8 KB | SQL | Экспорт всех данных БД в CSV | `psql "DB_URL" -f scripts/backup_data.sql` |
| **cleanup_data.sql** | 9.0 KB | SQL | Удаление всех данных из БД | `psql "DB_URL" -f scripts/cleanup_data.sql` |
| **backup_storage.js** | 5.4 KB | Node.js | Скачивание файлов из Storage | `npm run backup:storage` |
| **cleanup_storage.js** | 6.4 KB | Node.js | Удаление файлов из Storage | `npm run cleanup:storage` |
| **scripts/README.md** | Новый | Markdown | Документация скриптов | Для справки |

---

## 🔄 Процесс использования

### Шаг 1️⃣: Подготовка
1. Прочитайте **BACKUP_QUICKSTART.md** или **BACKUP_AND_CLEANUP_GUIDE.md**
2. Подготовьте строку подключения к БД
3. Подготовьте переменные окружения для Storage

### Шаг 2️⃣: Бэкап
1. Запустите `backup_data.sql` → Создаст CSV файлы
2. Запустите `backup_storage.js` → Скачает медиа файлы
3. Проверьте результат

### Шаг 3️⃣: Очистка
1. **Убедитесь, что бэкап готов!**
2. Запустите `cleanup_data.sql` → Удалит данные из БД
3. Запустите `cleanup_storage.js` → Удалит файлы из Storage
4. Проверьте результат

---

## 🎯 Что бэкапится

### 🗄️ База данных (16 таблиц)
- profiles
- posts, comments
- post_reactions, comment_reactions
- post_views
- bookmarks, subscriptions
- friendships, conversations, direct_messages
- notifications
- blocked_users, reports
- tags, post_tags

### 📁 Storage (4 buckets)
- post-images
- comment-images
- media_uploads
- audio_uploads

---

## 📦 NPM команды

Добавлены в `package.json`:

```json
{
  "scripts": {
    "backup:storage": "node scripts/backup_storage.js",
    "cleanup:storage": "node scripts/cleanup_storage.js"
  }
}
```

**Использование:**
```bash
npm run backup:storage   # Бэкап Storage
npm run cleanup:storage  # Очистка Storage
```

---

## ⚙️ Требования

### Для SQL скриптов
- ✅ PostgreSQL клиент (psql)
- ✅ Строка подключения к БД
- ✅ Права доступа к БД

### Для JS скриптов
- ✅ Node.js >= 14
- ✅ npm или yarn
- ✅ Переменные окружения:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎓 Порядок изучения

**Для новичков:**
1. BACKUP_SUMMARY.md (понять, что это)
2. BACKUP_QUICKSTART.md (быстрый старт)
3. BACKUP_AND_CLEANUP_GUIDE.md (полное руководство)
4. BACKUP_CHEATSHEET.md (сохранить для справки)

**Для опытных:**
1. BACKUP_QUICKSTART.md (быстрый старт)
2. BACKUP_CHEATSHEET.md (команды)
3. scripts/README.md (детали скриптов)

**Для разработчиков:**
1. scripts/README.md (документация API)
2. backup_data.sql (изучить SQL)
3. backup_storage.js (изучить код)

---

## 🔍 Поиск информации

| Вопрос | Где искать |
|--------|-----------|
| Как начать? | BACKUP_QUICKSTART.md |
| Подробные шаги? | BACKUP_AND_CLEANUP_GUIDE.md |
| Какие команды? | BACKUP_CHEATSHEET.md |
| Что было создано? | BACKUP_SUMMARY.md |
| Как работают скрипты? | scripts/README.md |
| Где взять ключи? | BACKUP_CHEATSHEET.md → "Где взать ключи" |
| Ошибки и решения? | BACKUP_CHEATSHEET.md → "Частые ошибки" |
| Восстановление? | BACKUP_AND_CLEANUP_GUIDE.md → "Восстановление" |

---

## 📊 Статистика

**Создано файлов:** 9  
**Строк кода:** ~1,500  
**Документации:** ~600 строк  
**Языки:** SQL, JavaScript, Markdown  

**Функциональность:**
- ✅ Полный бэкап БД (16 таблиц)
- ✅ Полный бэкап Storage (4 buckets)
- ✅ Безопасная очистка БД
- ✅ Безопасная очистка Storage
- ✅ Проверка результатов
- ✅ Статистика операций
- ✅ Обработка ошибок

---

## 🆘 Поддержка

**Проблемы с бэкапом БД?**
→ См. BACKUP_AND_CLEANUP_GUIDE.md → "Troubleshooting"

**Проблемы с Storage?**
→ См. scripts/README.md → "Поддержка"

**Не понимаю, как начать?**
→ Начните с BACKUP_QUICKSTART.md

**Нужны детали?**
→ Читайте BACKUP_AND_CLEANUP_GUIDE.md

---

## ✅ Контрольный список

Перед началом работы убедитесь:
- [ ] Прочитал BACKUP_QUICKSTART.md или BACKUP_AND_CLEANUP_GUIDE.md
- [ ] Установлен psql (для SQL скриптов)
- [ ] Установлен Node.js (для JS скриптов)
- [ ] Есть строка подключения к БД
- [ ] Есть SUPABASE_SERVICE_ROLE_KEY
- [ ] Создана папка для бэкапа
- [ ] Понял, что очистка необратима

После бэкапа:
- [ ] Проверил созданные CSV файлы
- [ ] Проверил backup_statistics.txt
- [ ] Проверил скачанные медиа файлы
- [ ] Сохранил бэкап в безопасном месте

После очистки:
- [ ] Проверил, что БД пустая (0 записей)
- [ ] Проверил, что Storage пуст
- [ ] Убедился, что бэкап сохранен

---

## 🎉 Готово к использованию!

Все файлы готовы. Выберите документ из списка выше и начинайте!

**Рекомендуем начать с:**
→ **[BACKUP_QUICKSTART.md](BACKUP_QUICKSTART.md)** ⚡

---

**Дата создания:** 13 октября 2025  
**Версия:** 1.0  
**Статус:** ✅ Production Ready
