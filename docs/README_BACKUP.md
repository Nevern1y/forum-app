# 🎯 Система бэкапа готова! (Windows версия)

## ✅ Что было сделано:

### 1. Созданы Node.js скрипты (работают БЕЗ psql!)
- ✅ `scripts/backup_database.js` - Бэкап БД
- ✅ `scripts/backup_storage.js` - Бэкап Storage  
- ✅ `scripts/cleanup_database.js` - Очистка БД
- ✅ `scripts/cleanup_storage.js` - Очистка Storage

### 2. Добавлены npm команды в package.json
- ✅ `npm run backup:db` - Бэкап базы данных
- ✅ `npm run backup:storage` - Бэкап медиа файлов
- ✅ `npm run backup:all` - Полный бэкап (БД + Storage)
- ✅ `npm run cleanup:db` - Очистка БД
- ✅ `npm run cleanup:storage` - Очистка Storage
- ✅ `npm run cleanup:all` - Полная очистка

### 3. Создан файл .env.local
- ✅ Файл `.env.local` уже открыт в Notepad
- ⚠️ **СЕЙЧАС:** Вставьте ваши ключи и сохраните!

---

## 🔑 ШАГ 1: Заполните .env.local (СЕЙЧАС!)

Файл уже открыт в Notepad. Вставьте ваши ключи:

```env
NEXT_PUBLIC_SUPABASE_URL=https://teftcesgqqwhqhdiornh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<ваш_service_role_key_здесь>
```

### Где взять service_role key:
1. Откройте: https://supabase.com/dashboard
2. Выберите проект
3. **Settings** → **API**
4. Найдите **service_role** key
5. Нажмите **"Reveal"** (глаз)
6. Скопируйте ключ (начинается с `eyJhbGci...`)
7. Вставьте в .env.local вместо `<ваш_service_role_key_здесь>`
8. **Сохраните файл** (Ctrl+S)

⚠️ **ВАЖНО:** Не коммитьте .env.local в git! Он уже в .gitignore.

---

## 🚀 ШАГ 2: Попробуйте бэкап!

После заполнения .env.local:

```powershell
# Полный бэкап (БД + Storage)
npm run backup:all
```

Или по отдельности:
```powershell
# Только БД
npm run backup:db

# Только Storage
npm run backup:storage
```

---

## 📁 ШАГ 3: Проверьте результат

После бэкапа проверьте созданные папки:

```powershell
# Бэкап БД
dir database-backup

# Статистика
type database-backup\backup_statistics.txt

# Бэкап Storage
dir storage-backup
```

---

## 🗑️ ШАГ 4: Очистка данных (опционально)

⚠️ **ВНИМАНИЕ:** Это удалит ВСЕ данные! Делайте только после проверки бэкапа!

```powershell
# Полная очистка (БД + Storage)
npm run cleanup:all
```

Или по отдельности:
```powershell
# Только БД
npm run cleanup:db

# Только Storage
npm run cleanup:storage
```

При запуске нужно ввести **YES** (заглавными!) для подтверждения.

---

## 📊 Что бэкапится:

### База данных (16 таблиц):
```
✓ profiles            ✓ posts               ✓ comments
✓ post_reactions      ✓ comment_reactions   ✓ post_views
✓ bookmarks           ✓ subscriptions       ✓ friendships
✓ conversations       ✓ direct_messages     ✓ notifications
✓ blocked_users       ✓ reports             ✓ tags
✓ post_tags
```

### Storage (4 buckets):
```
✓ post-images         ✓ comment-images
✓ media_uploads       ✓ audio_uploads
```

---

## 🎯 Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run backup:db` | Бэкап базы данных → CSV файлы |
| `npm run backup:storage` | Бэкап Storage → локальные папки |
| `npm run backup:all` | Полный бэкап (БД + Storage) |
| `npm run cleanup:db` | Очистка базы данных |
| `npm run cleanup:storage` | Очистка Storage |
| `npm run cleanup:all` | Полная очистка (БД + Storage) |

---

## 📚 Документация

### Быстрый старт (Windows):
→ **WINDOWS_QUICKSTART.md** ⭐ НАЧНИТЕ ЗДЕСЬ!

### Полная документация:
→ **BACKUP_AND_CLEANUP_GUIDE.md**

### Шпаргалка:
→ **BACKUP_CHEATSHEET.md**

### Главная страница:
→ **START_HERE.md**

---

## ✅ Контрольный список

- [ ] Открыл .env.local в Notepad (уже открыт)
- [ ] Вставил NEXT_PUBLIC_SUPABASE_URL
- [ ] Получил service_role key из Supabase Dashboard
- [ ] Вставил SUPABASE_SERVICE_ROLE_KEY
- [ ] Сохранил файл .env.local (Ctrl+S)
- [ ] Запустил `npm run backup:all`
- [ ] Проверил папку `database-backup/`
- [ ] Проверил папку `storage-backup/`
- [ ] Прочитал backup_statistics.txt
- [ ] Готов к очистке (опционально)

---

## 🆘 Помощь

### Ошибка: Missing environment variables
→ Проверьте, что .env.local создан и содержит оба ключа

### Ошибка: Invalid API key
→ Используйте **service_role** key, не anon key!
→ Убедитесь, что ключ скопирован полностью

### Ошибка: Network error
→ Проверьте NEXT_PUBLIC_SUPABASE_URL
→ Убедитесь, что проект активен в Supabase

---

## 🎉 Готово!

После заполнения .env.local:

**Запустите:** `npm run backup:all`

И всё готово! 🚀

---

**P.S.** Больше НЕ НУЖЕН psql! Всё работает через Node.js! 🎊
