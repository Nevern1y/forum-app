# 🚀 Migration Guide - Применение изменений

## ⚠️ ВАЖНО! Выполните миграцию базы данных

### Шаг 1: Откройте Supabase Dashboard

1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (левое меню)

### Шаг 2: Выполните миграцию

Скопируйте и вставьте **полностью** содержимое файла:
```
supabase/migrations/run_all_migrations.sql
```

Или выполните только Migration 008 (если остальные уже применены):

```sql
-- Add media columns to posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_media_urls 
  ON posts USING GIN (media_urls);

CREATE INDEX IF NOT EXISTS idx_posts_audio_url 
  ON posts (audio_url) WHERE audio_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN posts.media_urls 
  IS 'Array of URLs for images/videos attached to the post';

COMMENT ON COLUMN posts.audio_url 
  IS 'URL for voice message attached to the post';
```

### Шаг 3: Проверьте выполнение

Должны появиться сообщения:
```
✓ Success. No rows returned
```

Если появляются ошибки типа "column already exists" - это нормально, значит колонка уже существует.

### Шаг 4: Проверьте Storage Bucket

В Supabase Dashboard → **Storage** проверьте наличие bucket:
- `post-images` (должен быть public)

Если нет - создайте вручную:
1. Storage → New Bucket
2. Name: `post-images`
3. Public: ✅ (включено)
4. File size limit: 5MB

## ✅ Что было добавлено

### 🎨 Компоненты

```
components/media/
├── image-uploader.tsx           ✨ NEW
├── voice-recorder.tsx           ✨ NEW
├── media-gallery.tsx            ✨ NEW
├── audio-player.tsx             ✨ NEW
└── audio-player-compact.tsx     ✨ NEW
```

### 🗄️ База данных

```sql
posts table:
├── media_urls (TEXT[])          ✨ NEW
└── audio_url (TEXT)             ✨ NEW
```

### 📝 Обновленные файлы

```
components/post/create-post-form.tsx    (интеграция загрузки)
components/feed/post-card.tsx           (компактный просмотр)
app/post/[id]/page.tsx                  (полный просмотр)
```

## 🎯 Функциональность

### Создание поста с медиа

1. Перейдите на `/post/create`
2. Заполните заголовок и контент
3. **Добавьте изображения:**
   - Кнопка "Добавить изображения"
   - Макс. 5 изображений
   - Макс. 5MB каждое
   - Превью с возможностью удаления
4. **Запишите голосовое сообщение:**
   - Кнопка "Начать запись"
   - Запрос доступа к микрофону
   - Таймер записи
   - Предпросмотр с Play/Pause
5. Опубликуйте пост

### Просмотр медиа

**В ленте постов:**
- ✅ Компактные превью (128-160px)
- ✅ Макс. 3 изображения + "+N"
- ✅ Компактный аудио плеер
- ✅ Клик → Lightbox со всеми фото

**В детальном просмотре:**
- ✅ Все изображения полностью
- ✅ Адаптивная сетка
- ✅ Полный аудио плеер с контролами
- ✅ Клик → Lightbox с навигацией

## 🎨 Размеры и стили

### Компактный режим (лента):
```
Изображения:
├── 1 фото: 160px высота
├── 2-3 фото: 128px высота
└── Ширина: 100%

Аудио плеер:
├── Высота: 52px
├── Кнопки: 32px
└── Progress bar: 6px
```

### Полный режим (пост):
```
Изображения:
├── Adaptive height
├── aspect-video (1 фото)
└── aspect-square (2+ фото)

Аудио плеер:
├── Высота: 68px
├── Seek controls: ✅
└── Mute/Unmute: ✅
```

## 🔧 Устранение ошибок

### Ошибка: "ENOENT: no such file or directory"

**Решение:**
```bash
# Очистите кеш Next.js
rm -rf .next

# Или в PowerShell:
Remove-Item -Recurse -Force .next

# Перезапустите dev server
npm run dev
```

### Ошибка: "Failed to upload image"

**Проверьте:**
1. Storage bucket `post-images` существует
2. Bucket is public (✅)
3. RLS policies настроены (из миграции)

### Ошибка: "column does not exist: media_urls"

**Решение:**
1. Выполните миграцию 008 (см. выше)
2. Перезапустите dev server

## 📚 Документация

Подробная документация доступна в файлах:
- `MEDIA_FEATURES.md` - Полное описание функций
- `COMPACT_MEDIA_MODE.md` - Компактный режим
- `MEDIA_IMPROVEMENTS.md` - Улучшения видимости
- `BUTTON_ANIMATIONS.md` - Ripple эффекты

## 🚀 Тестирование

### Чеклист:

1. **Загрузка изображений:**
   - [ ] Загрузить 1 изображение
   - [ ] Загрузить 5 изображений
   - [ ] Попытаться загрузить 6 (должна быть ошибка)
   - [ ] Попытаться загрузить >5MB файл (должна быть ошибка)
   - [ ] Удалить изображение из превью

2. **Запись аудио:**
   - [ ] Начать запись (разрешить микрофон)
   - [ ] Видеть таймер записи
   - [ ] Остановить запись
   - [ ] Прослушать запись (Play/Pause)
   - [ ] Удалить запись

3. **Просмотр в ленте:**
   - [ ] Видеть компактные превью
   - [ ] Кликнуть на превью → lightbox
   - [ ] Навигация стрелками в lightbox
   - [ ] Проиграть аудио в ленте

4. **Просмотр в посте:**
   - [ ] Видеть все изображения
   - [ ] Кликнуть на фото → lightbox
   - [ ] Полный аудио плеер с seek
   - [ ] Mute/Unmute работает

5. **Кнопки:**
   - [ ] Ripple эффект при клике
   - [ ] Плавные анимации (0.5s)
   - [ ] Кнопки не двигаются (только внутренний эффект)

## ✨ Результат

**Готово!** Теперь ваш форум поддерживает:

✅ Множественные изображения (до 5)  
✅ Голосовые сообщения  
✅ Компактные превью в ленте  
✅ Полноразмерный просмотр в посте  
✅ Lightbox галерея с навигацией  
✅ Плавные ripple анимации  
✅ Минималистичный Threads-style дизайн  

## 🆘 Поддержка

Если возникли проблемы:
1. Проверьте, что миграция выполнена
2. Очистите кеш `.next`
3. Перезапустите dev server
4. Проверьте Supabase Storage bucket
5. Проверьте консоль браузера на ошибки

---

**Приятного использования!** 🎉
