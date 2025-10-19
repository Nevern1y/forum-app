# Деплой через Vercel CLI - Пошаговая инструкция

## ✅ Vercel CLI уже установлен!

## Шаг 1: Логин в Vercel

Откройте терминал и выполните:

```bash
cd "C:\Users\cynok\OneDrive\Документы\forum-app"
vercel login
```

Появится браузер для авторизации:
1. Нажмите "Continue with GitHub" или другой способ входа
2. Авторизуйтесь
3. Вернитесь в терминал

## Шаг 2: Связать проект (первый раз)

```bash
vercel link
```

Ответьте на вопросы:
- Set up and deploy? → **Y** (yes)
- Which scope? → выберите свой аккаунт
- Link to existing project? → **Y** (yes)
- What's the name of your existing project? → **forum-app**

## Шаг 3: Добавить переменные окружения

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```
Вставьте: `https://teftcesgqqwhqhdiornh.supabase.co`

```bash
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```
Вставьте: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnRjZXNncXF3aHFoZGlvcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODMxNjYsImV4cCI6MjA3NTc1OTE2Nn0.4j03MFTcS8pFCOrz1z1U0JXZA2UxNn7mrqtL1WYIk0Q`

```bash
vercel env add NEXT_PUBLIC_SENTRY_DSN production
```
Вставьте: `https://c03b4d66d22fdfbf1c743cb3416dd814@o4510176009715712.ingest.de.sentry.io/4510176014893136`

```bash
vercel env add SENTRY_ORG production
```
Вставьте: `whity`

```bash
vercel env add SENTRY_PROJECT production
```
Вставьте: `javascript-nextjs`

## Шаг 4: Деплой!

```bash
vercel --prod
```

Подождите 2-3 минуты. По завершении получите URL вашего сайта!

## 🎉 Готово!

Ваш сайт задеплоен с последними оптимизациями!

---

## Альтернатива: Быстрый деплой без переменных

Если переменные уже добавлены в Dashboard:

```bash
vercel --prod
```

И всё! ⚡

---

## Проверка после деплоя

1. Откройте URL из терминала
2. Проверьте что сайт работает быстро
3. Проверьте что лайки работают
4. Проверьте что лента загружается мгновенно

---

## Если ошибка

### Error: No existing credentials found

Выполните снова:
```bash
vercel login
```

### Error: Missing required env vars

Добавьте переменные через Vercel Dashboard:
- https://vercel.com/dashboard
- Settings → Environment Variables

### Build failed

Проверьте логи:
```bash
vercel logs
```

И отправьте мне текст ошибки!
