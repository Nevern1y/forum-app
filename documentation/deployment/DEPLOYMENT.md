# Deployment Guide

## Требования

- Node.js 20.x или выше
- npm или yarn
- Supabase проект (production)
- Vercel аккаунт (рекомендуется) или другой хостинг

## Подготовка к deployment

### 1. Environment Variables

Создайте `.env.production` файл со следующими переменными:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Sentry (опционально, для error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Next.js
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Проверка перед deployment

Выполните следующие команды для проверки:

```bash
# Проверка TypeScript
npm run type-check

# Проверка ESLint
npm run lint

# Запуск тестов
npm run test:ci

# Сборка проекта
npm run build
```

Все команды должны завершиться успешно без ошибок.

## Deployment на Vercel (рекомендуется)

### Первый deployment

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Авторизуйтесь:
```bash
vercel login
```

3. Запустите deployment:
```bash
vercel
```

4. Настройте environment variables в Vercel Dashboard:
   - Перейдите в Project Settings
   - Добавьте все переменные из `.env.production`

### Continuous Deployment

1. Подключите GitHub репозиторий к Vercel
2. Настройте автоматический deployment:
   - main branch → production
   - develop branch → preview

## Deployment на другие платформы

### Docker

Создайте `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Соберите и запустите:

```bash
docker build -t forum-app .
docker run -p 3000:3000 forum-app
```

### Self-hosted

1. Соберите проект:
```bash
npm run build
```

2. Запустите production сервер:
```bash
npm start
```

3. Используйте PM2 для процесс-менеджмента:
```bash
npm install -g pm2
pm2 start npm --name "forum-app" -- start
pm2 save
pm2 startup
```

## Post-deployment checklist

- [ ] Проверьте работу аутентификации
- [ ] Проверьте загрузку медиа файлов
- [ ] Проверьте Realtime функциональность
- [ ] Проверьте работу на мобильных устройствах
- [ ] Настройте мониторинг (Sentry уже настроен)
- [ ] Настройте backup базы данных
- [ ] Настройте SSL сертификат
- [ ] Настройте CDN для статики
- [ ] Проверьте производительность (Lighthouse)
- [ ] Настройте rate limiting

## Мониторинг

### Sentry

Sentry автоматически отслеживает ошибки в production. Проверьте:
- https://sentry.io/organizations/your-org/issues/

### Vercel Analytics

Vercel Analytics показывает метрики производительности:
- Core Web Vitals
- Real User Monitoring
- Edge Function metrics

## Rollback

### Vercel

1. Перейдите в Deployments
2. Найдите предыдущий успешный deployment
3. Нажмите "Promote to Production"

### Self-hosted

```bash
# Откатитесь на предыдущий commit
git revert HEAD
npm run build
pm2 restart forum-app
```

## Troubleshooting

### Ошибки при сборке

1. Очистите кэш:
```bash
rm -rf .next node_modules
npm install
npm run build
```

2. Проверьте environment variables

### Проблемы с базой данных

1. Проверьте RLS policies в Supabase
2. Проверьте миграции
3. Проверьте connection string

### Проблемы с Realtime

1. Проверьте Supabase Realtime settings
2. Проверьте WebSocket connections
3. Проверьте CORS настройки

## Scaling

### Вертикальное

Увеличьте размер инстанса на Vercel или VPS

### Горизонтальное

1. Настройте load balancer
2. Используйте Redis для session storage
3. Настройте CDN для статики
4. Используйте Edge functions

## Security

### Production checklist

- [ ] HTTPS включен
- [ ] CSP (Content Security Policy) настроен
- [ ] CORS правильно настроен
- [ ] Rate limiting включен
- [ ] Secrets в environment variables
- [ ] SQL injection защита (Supabase RLS)
- [ ] XSS защита (React + sanitization)
- [ ] CSRF защита (Supabase Auth)

## Поддержка

При проблемах:
1. Проверьте Sentry для ошибок
2. Проверьте логи сервера
3. Проверьте GitHub Actions для CI/CD
4. Обратитесь к SECURITY_AUDIT.md
