# Production Checklist - Готовность к запуску

## 🔴 Критично (исправить перед запуском)

### 1. Убрать alert() - заменить на toast уведомления
**Где**: `components/feed/post-card.tsx:84`
```typescript
// Плохо (сейчас):
alert('Войдите, чтобы лайкать посты')

// Хорошо (нужно):
toast.error('Войдите, чтобы лайкать посты')
```

**Решение**: Установить `sonner` или использовать shadcn toast:
```bash
npm install sonner
```

### 2. Лимиты Supabase Free Tier
- ⚠️ **500 MB database** - может закончиться быстро
- ⚠️ **1 GB file storage** - хватит на ~200-500 изображений
- ⚠️ **50,000 Monthly Active Users** - достаточно на старте
- ⚠️ **2 GB bandwidth** - может закончиться при большой нагрузке

**Решение**: Следите за метриками в Supabase Dashboard. При росте нужен Pro план ($25/мес).

### 3. Rate Limiting для лайков
Сейчас пользователь может спамить лайками. Нужно ограничение.

**Решение**: Добавить проверку на клиенте + RLS политику с временным ограничением.

### 4. Error Handling
Детальные ошибки в консоли видны всем. Нужно скрыть в production.

**Решение**: 
```typescript
if (process.env.NODE_ENV === 'production') {
  console.error('Error occurred'); // Общее сообщение
} else {
  console.error('Detailed error:', error); // Детали только в dev
}
```

## 🟡 Важно (рекомендуется)

### 5. Аналитика
Установить Google Analytics или Plausible для отслеживания пользователей.

### 6. Мониторинг ошибок
Установить Sentry для отслеживания ошибок в production:
```bash
npm install @sentry/nextjs
```

### 7. CDN для изображений
Supabase Storage работает, но для глобальной аудитории лучше использовать CDN.

**Опции**:
- Cloudflare Images
- ImageKit
- Vercel Image Optimization (встроен в Next.js)

### 8. Кэширование
Добавить кэширование постов с помощью:
- React Query / TanStack Query
- SWR
- Next.js ISR (Incremental Static Regeneration)

### 9. SEO оптимизация
- Meta tags для постов
- Open Graph теги для превью в соцсетях
- Sitemap.xml
- robots.txt

### 10. Безопасность Headers
В `next.config.mjs` добавить:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      ],
    },
  ]
}
```

## 🟢 Желательно (можно добавить позже)

### 11. Email уведомления
Настроить email уведомления через Supabase для:
- Новых комментариев
- Лайков на посты
- Упоминаний

### 12. Модерация контента
Добавить систему репортов (уже есть таблица `reports`, нужен UI).

### 13. Backup базы данных
Настроить автоматические бэкапы в Supabase.

### 14. Performance мониторинг
- Vercel Analytics
- Core Web Vitals отслеживание
- Lighthouse CI

### 15. Защита от спама
- reCAPTCHA при регистрации
- Rate limiting на создание постов/комментариев
- Автоматическая модерация контента

## 📊 Рекомендуемые сервисы для production

### Хостинг
- ✅ **Vercel** (рекомендуется для Next.js) - Hobby план бесплатный
- Netlify
- Railway

### База данных
- ✅ **Supabase** (уже используется)
  - Free tier для старта
  - Pro ($25/мес) при росте

### Мониторинг
- **Sentry** - отслеживание ошибок (бесплатно до 5k ошибок/мес)
- **Vercel Analytics** - производительность (бесплатно)

### Email
- **Resend** - для email уведомлений (бесплатно до 3k писем/мес)
- SendGrid

### Аналитика
- **Plausible** - privacy-friendly (€9/мес)
- **Google Analytics** - бесплатно

## 🚀 Минимальный план запуска

Для MVP можно запустить с:

1. ✅ Vercel Free tier
2. ✅ Supabase Free tier  
3. ⚠️ Убрать `alert()`, заменить на toast
4. ⚠️ Скрыть детальные ошибки в production
5. ⚠️ Добавить basic rate limiting на лайки
6. ✅ Настроить SEO meta tags

**Стоимость**: $0/месяц до ~1000 активных пользователей

## 📈 При росте (1000+ пользователей)

1. Upgrade Supabase до Pro - $25/мес
2. Добавить Sentry - $26/мес (Team)
3. Добавить CDN для изображений - $10-20/мес
4. Vercel Pro (если нужно) - $20/мес

**Стоимость**: ~$60-80/месяц

## ✅ Быстрая проверка перед запуском

Запустите эти команды:

```bash
# 1. Проверка TypeScript ошибок
npm run build

# 2. Проверка линтера
npm run lint

# 3. Тесты (если есть)
npm run test

# 4. Проверка security vulnerabilities
npm audit

# 5. Lighthouse audit
npx lighthouse https://your-site.com --view
```

## 🎯 Рекомендация

**Можно запускать сейчас** на Free tier для тестирования с небольшой аудиторией (до 100-500 пользователей).

Но **перед массовым запуском** обязательно:
1. Убрать alert()
2. Добавить мониторинг (Sentry)
3. Настроить rate limiting
4. Подготовить план апгрейда Supabase

Нужна помощь с реализацией любого пункта?
