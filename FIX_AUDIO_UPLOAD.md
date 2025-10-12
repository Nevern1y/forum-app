# 🔧 ИСПРАВЛЕНИЕ ОШИБКИ AUDIO UPLOAD

## ❌ Проблема

```
StorageApiError: mime type audio/webm is not supported
```

## ✅ Решение

### Выполните SQL в Supabase Dashboard:

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Скопируйте и выполните:

```sql
-- Обновить bucket для поддержки audio файлов
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'audio/webm',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg'
  ]::text[]
WHERE id = 'post-images';

-- Проверить результат
SELECT id, name, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'post-images';
```

### Что изменилось:

**До:**
```sql
allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
file_size_limit = 5242880  (5MB)
```

**После:**
```sql
allowed_mime_types = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
]
file_size_limit = 10485760  (10MB)
```

## 📊 Поддерживаемые форматы:

### Изображения:
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif)
- ✅ WebP (.webp)

### Аудио:
- ✅ WebM (.webm) - для записи через браузер
- ✅ MP3 (.mp3)
- ✅ MPEG (.mpeg)
- ✅ WAV (.wav)
- ✅ OGG (.ogg)

## 🔍 Проверка

После выполнения SQL:

1. Обновите страницу
2. Попробуйте записать голосовое сообщение
3. Должно загрузиться без ошибок

## 🚨 Если ошибка осталась:

Проверьте что bucket существует:
```sql
SELECT * FROM storage.buckets WHERE id = 'post-images';
```

Если bucket не существует, создайте его:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760,
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
  ]::text[]
);
```

## ✅ Готово!

После выполнения SQL голосовые сообщения будут загружаться успешно!
