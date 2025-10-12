# Supabase Setup Instructions

Следуйте этим инструкциям для настройки базы данных Supabase для вашего форума.

## 📋 Шаг 1: Применить миграции

### Вариант A: Через Supabase Dashboard (Рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (иконка с базой данных в левом меню)
4. Создайте **New Query**
5. Скопируйте содержимое файла `migrations/run_all_migrations.sql`
6. Вставьте в редактор и нажмите **Run**
7. Дождитесь успешного выполнения ✅

### Вариант B: Через Supabase CLI

```bash
# Установите Supabase CLI (если еще не установлен)
npm install -g supabase

# Войдите в аккаунт
supabase login

# Свяжите проект
supabase link --project-ref YOUR_PROJECT_REF

# Примените миграции
supabase db push
```

## 🔐 Шаг 2: Проверка .env.local

Убедитесь, что ваш файл `.env.local` содержит правильные данные:

```env
NEXT_PUBLIC_SUPABASE_URL=https://teftcesgqqwhqhdiornh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## ✅ Шаг 3: Проверка миграций

После применения миграций проверьте, что все таблицы созданы:

### В Supabase Dashboard:

1. Перейдите в **Table Editor**
2. Убедитесь, что существуют таблицы:
   - ✅ `profiles` (с новыми полями: location, website, privacy settings)
   - ✅ `posts` (с полем `is_pinned`)
   - ✅ `reports` (новая таблица)
   - ✅ `blocked_users` (новая таблица)

3. Перейдите в **Storage**
4. Убедитесь, что созданы buckets:
   - ✅ `avatars` (public, 2MB limit)
   - ✅ `post-images` (public, 5MB limit)

## 🧪 Шаг 4: Тестирование функций

Запустите приложение и протестируйте:

### 1. Профили
```
✅ Загрузка аватара
✅ Изменение location и website
✅ Просмотр подписчиков/подписок (модальное окно)
✅ Статистика пользователя
```

### 2. Посты
```
✅ Создание поста с markdown
✅ Редактирование своего поста
✅ Закрепление поста (для автора)
✅ Черновики (автосохранение)
```

### 3. Модерация
```
✅ Жалоба на пост/комментарий
✅ Блокировка пользователя
✅ Emoji реакции на посты
```

### 4. Приватность
```
✅ Изменение видимости профиля
✅ Настройки отображения активности
✅ Разрешения на сообщения
```

## 🔧 Устранение проблем

### Ошибка: "permission denied for table profiles"

**Решение:** Проверьте RLS (Row Level Security) политики:

```sql
-- Проверка политик для profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Ошибка: "bucket already exists"

**Решение:** Миграции используют `ON CONFLICT DO UPDATE`, ошибка должна быть проигнорирована.

### Ошибка: "function gen_random_uuid() does not exist"

**Решение:** Включите расширение pgcrypto:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Storage политики не работают

**Решение:** Убедитесь, что storage политики применены:

```sql
-- Просмотр storage политик
SELECT * FROM storage.objects_policies;
```

## 📊 Структура базы данных

После миграций ваша база данных будет иметь:

### Таблицы:
- `profiles` - Профили пользователей (расширенные)
- `posts` - Посты (с is_pinned, updated_at)
- `comments` - Комментарии (с updated_at)
- `tags` - Теги
- `post_tags` - Связь постов и тегов
- `subscriptions` - Подписки
- `post_reactions` - Реакции (лайки + эмодзи)
- `reports` - Жалобы ⭐ НОВАЯ
- `blocked_users` - Блокировки ⭐ НОВАЯ

### Storage Buckets:
- `avatars` - Аватары пользователей (2MB, images only)
- `post-images` - Изображения в постах (5MB, images only)

### Функции:
- `update_updated_at_column()` - Триггер для автообновления updated_at

### Индексы:
- Оптимизированы для быстрых запросов по:
  - Закрепленным постам
  - Отчетам модерации
  - Блокировкам пользователей
  - Реакциям

## 🎯 Следующие шаги

1. ✅ Примените миграции
2. ✅ Проверьте создание таблиц
3. ✅ Протестируйте загрузку аватара
4. ✅ Создайте тестовый пост
5. ✅ Проверьте все новые функции

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи в Supabase Dashboard → Logs
2. Убедитесь, что все миграции выполнены
3. Проверьте .env.local файл
4. Проверьте, что используете последнюю версию Supabase клиента

---

**Готово!** 🎉 Ваш форум теперь имеет полный набор функций с профессиональной базой данных!
