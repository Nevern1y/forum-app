# Исправление ошибки деплоя на Vercel

## Ошибка
```
Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "supabase_url", which does not exist.
```

## Причина
Vercel не может найти переменные окружения, так как они существуют только локально в `.env.local`.

## Решение

### Вариант 1: Через Dashboard (Проще) ✅

1. **Откройте Vercel Dashboard**
   - Перейдите на https://vercel.com/dashboard
   - Выберите проект `forum-app`

2. **Добавьте переменные окружения**
   - Settings → Environment Variables
   - Добавьте каждую переменную:

   | Переменная | Значение |
   |------------|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://teftcesgqqwhqhdiornh.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (ваш ключ) |
   | `NEXT_PUBLIC_SENTRY_DSN` | `https://c03b4d66d22fdfbf1c743cb3416dd814@o4510176009715712...` |
   | `SENTRY_ORG` | `whity` |
   | `SENTRY_PROJECT` | `javascript-nextjs` |

3. **Для каждой переменной выберите:**
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

4. **Сохраните и передеплойте**
   - Нажмите **Save**
   - Deployments → выберите последний → **Redeploy**

### Вариант 2: Через CLI (Быстрее)

Если у вас установлен Vercel CLI:

```bash
# Установите Vercel CLI (если ещё нет)
npm i -g vercel

# Залогиньтесь
vercel login

# Свяжите проект
vercel link

# Добавьте переменные окружения
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
# Вставьте: https://teftcesgqqwhqhdiornh.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
# Вставьте ваш ANON KEY из .env.local

vercel env add NEXT_PUBLIC_SENTRY_DSN production preview development
# Вставьте ваш Sentry DSN

vercel env add SENTRY_ORG production preview development
# Вставьте: whity

vercel env add SENTRY_PROJECT production preview development
# Вставьте: javascript-nextjs

# Передеплой
vercel --prod
```

## Проверка

После добавления переменных:

1. **Проверьте в Settings → Environment Variables**
   - Должны отображаться все 5 переменных
   - Каждая должна быть включена для Production, Preview, Development

2. **Передеплойте проект**
   - Deployments → последний деплой → Redeploy
   - ИЛИ просто сделайте новый коммит и пуш

3. **Проверьте деплой**
   - Должно пройти успешно без ошибок
   - Откройте сайт и проверьте работу

## Безопасность ⚠️

**ВАЖНО:** Не коммитьте `.env.local` в Git!

Убедитесь, что `.env.local` в `.gitignore`:
```bash
# .gitignore
.env*
!.env.example
```

## Если всё равно ошибка

### Проблема: Vercel ищет "секрет" вместо переменной

Если вы случайно создали секрет вместо переменной:

1. Settings → Environment Variables
2. Найдите переменную с ошибкой
3. Удалите её
4. Создайте заново как обычную Environment Variable (не Secret)

### Проблема: Переменные не применяются

1. Убедитесь, что выбраны все окружения (Production, Preview, Development)
2. Сделайте полный редеплой (не просто Redeploy, а новый пуш)
3. Очистите кеш Vercel: Settings → Advanced → Clear Cache

## Автоматизация (опционально)

Создайте файл `vercel.json` для автоматической настройки:

```json
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_SENTRY_DSN": "@sentry-dsn",
    "SENTRY_ORG": "@sentry-org",
    "SENTRY_PROJECT": "@sentry-project"
  }
}
```

Затем создайте секреты:
```bash
vercel secrets add supabase-url "https://teftcesgqqwhqhdiornh.supabase.co"
vercel secrets add supabase-anon-key "ваш-ключ"
vercel secrets add sentry-dsn "ваш-dsn"
vercel secrets add sentry-org "whity"
vercel secrets add sentry-project "javascript-nextjs"
```

## Итого

✅ Добавьте 5 переменных окружения в Vercel Dashboard
✅ Выберите все окружения (Production, Preview, Development)
✅ Сохраните и сделайте Redeploy
✅ Проверьте успешный деплой

После этого приложение успешно задеплоится на Vercel! 🚀
