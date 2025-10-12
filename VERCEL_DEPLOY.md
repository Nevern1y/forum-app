# 🚀 Деплой на Vercel

Пошаговая инструкция по развертыванию форума на Vercel.

## Предварительные требования

- ✅ GitHub аккаунт
- ✅ Supabase проект с настроенной базой данных
- ✅ Репозиторий на GitHub с кодом

## Шаг 1: Подготовка Supabase

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **Settings → API**
3. Скопируйте:
   - `Project URL` (начинается с `https://`)
   - `anon public` ключ

## Шаг 2: Деплой на Vercel

### Вариант А: Через веб-интерфейс (рекомендуется)

1. Перейдите на [Vercel](https://vercel.com)
2. Войдите через GitHub
3. Нажмите **Add New... → Project**
4. Выберите репозиторий `Nevern1y/forum-app`
5. Нажмите **Import**

### Настройка Environment Variables

В разделе **Environment Variables** добавьте:

```bash
NEXT_PUBLIC_SUPABASE_URL=ваш_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key
```

> ⚠️ **Важно:** Не добавляйте кавычки вокруг значений!

### Настройки билда (должны определиться автоматически)

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

6. Нажмите **Deploy** и дождитесь завершения

### Вариант Б: Через CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Деплой
vercel

# Добавьте переменные окружения
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Production деплой
vercel --prod
```

## Шаг 3: Настройка Supabase для Vercel

После успешного деплоя вы получите URL типа `https://forum-app-xxx.vercel.app`

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **Authentication → URL Configuration**
3. Добавьте в **Site URL:**
   ```
   https://forum-app-xxx.vercel.app
   ```
4. Добавьте в **Redirect URLs:**
   ```
   https://forum-app-xxx.vercel.app/auth/callback
   https://forum-app-xxx.vercel.app/**
   ```
5. Нажмите **Save**

## Шаг 4: Миграции базы данных

Выполните все миграции в Supabase SQL Editor:

```sql
-- Запустите файл run_all_migrations.sql
-- Путь: supabase/migrations/run_all_migrations.sql
```

Или выполните каждую миграцию по порядку из папки `supabase/migrations/`.

## Шаг 5: Storage настройки

1. В Supabase Dashboard перейдите в **Storage**
2. Создайте бакеты (если они не созданы автоматически):
   - `avatars` (public)
   - `post-images` (public)
   - `post-audio` (public)
3. Настройте политики доступа согласно миграциям

## ✅ Проверка

1. Откройте `https://forum-app-xxx.vercel.app`
2. Попробуйте зарегистрироваться
3. Создайте пост
4. Проверьте чат

## 🔧 Troubleshooting

### Ошибка: "Supabase client is not configured"
- Проверьте, что переменные окружения добавлены правильно
- Убедитесь, что в Vercel нет лишних пробелов в значениях
- Передеплойте проект после изменения переменных

### Ошибка: "Invalid login credentials"
- Проверьте Site URL и Redirect URLs в Supabase
- Убедитесь, что включена Email аутентификация
- Проверьте, что миграции выполнены

### Ошибка 500 при билде
- Проверьте логи в Vercel Dashboard → Deployments → Build Logs
- Убедитесь, что все зависимости установлены
- Проверьте `package.json` на корректность

## 🔄 Автоматические деплои

Vercel автоматически деплоит при каждом push в `main` ветку:
- **Production:** Push в `main` → автодеплой на production URL
- **Preview:** Pull Request → автодеплой preview версии

## 📊 Мониторинг

- **Analytics:** Vercel Dashboard → Analytics
- **Logs:** Vercel Dashboard → Deployments → Function Logs
- **Errors:** Sentry (если настроен)

## 🎉 Готово!

Ваш форум теперь доступен онлайн на Vercel! 

**Production URL:** https://forum-app-xxx.vercel.app

---

**Полезные ссылки:**
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
