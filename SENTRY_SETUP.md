# Настройка Sentry для мониторинга

## 🎯 Что это дает

Sentry автоматически отслеживает и отправляет вам уведомления о:
- ❌ Ошибках JavaScript
- ⚠️ Необработанных исключениях
- 🐛 Performance проблемах
- 📊 Метриках производительности
- 🎥 Session Replay (видео действий пользователя перед ошибкой)

**Бесплатно:** 5,000 ошибок/месяц

---

## 📝 Шаг 1: Создать аккаунт в Sentry

1. Перейдите на: **https://sentry.io/signup/**
2. Зарегистрируйтесь (можно через GitHub)
3. Подтвердите email

---

## 🔧 Шаг 2: Создать проект

1. После входа нажмите **"Create Project"**
2. Выберите платформу: **Next.js**
3. Назовите проект: `forum-app` (или как вам нравится)
4. Выберите команду или создайте новую
5. Нажмите **"Create Project"**

---

## 🔑 Шаг 3: Получить DSN ключ

После создания проекта вы увидите страницу с инструкциями.

**Найдите DSN** - выглядит примерно так:
```
https://examplePublicKey@o0.ingest.sentry.io/0
```

Или найдите его в:
- **Settings** → **Projects** → Ваш проект → **Client Keys (DSN)**

---

## ⚙️ Шаг 4: Добавить переменные окружения

Откройте файл `.env.local` и добавьте:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=forum-app
SENTRY_AUTH_TOKEN=your-auth-token-here
```

### Где найти значения:

#### `NEXT_PUBLIC_SENTRY_DSN`
- Settings → Projects → Ваш проект → Client Keys (DSN)
- Копируйте полный URL

#### `SENTRY_ORG`
- Settings → General → Organization Slug
- Обычно это ваш username или название организации

#### `SENTRY_PROJECT`
- Название вашего проекта (то что указали при создании)

#### `SENTRY_AUTH_TOKEN` (опционально, для source maps)
- Settings → Developer Settings → Auth Tokens
- Create New Token
- Выберите права: `project:releases` и `org:read`
- Сохраните токен (показывается только один раз!)

---

## 🚀 Шаг 5: Проверка работы

### Тестовая ошибка

Добавьте кнопку для теста где-нибудь в dev режиме:

```typescript
// Для теста (удалите после проверки)
<button onClick={() => {
  throw new Error("Sentry Test Error - всё работает! ✅")
}}>
  Test Sentry
</button>
```

### Или просто запустите:

```bash
npm run dev
```

Посетите страницу с ошибкой или вызовите тестовую ошибку.

### Проверьте Sentry Dashboard:

1. Откройте https://sentry.io/
2. Перейдите в ваш проект
3. Раздел **Issues**
4. Должна появиться тестовая ошибка за 1-2 минуты

---

## 📊 Что теперь доступно

### 1. Автоматическое отслеживание ошибок

Все необработанные ошибки автоматически отправляются в Sentry:
```typescript
// Эта ошибка автоматически попадет в Sentry
throw new Error("Something went wrong")
```

### 2. Ручная отправка ошибок

```typescript
import * as Sentry from "@sentry/nextjs"

try {
  // Ваш код
  dangerousOperation()
} catch (error) {
  // Отправить в Sentry с дополнительным контекстом
  Sentry.captureException(error, {
    extra: {
      userId: user.id,
      action: 'dangerous_operation'
    }
  })
}
```

### 3. Логирование событий

```typescript
import * as Sentry from "@sentry/nextjs"

// Отследить событие
Sentry.captureMessage("User completed signup", "info")

// С дополнительными данными
Sentry.captureMessage("Payment processed", {
  level: "info",
  extra: {
    amount: 100,
    currency: "USD"
  }
})
```

### 4. Добавление контекста пользователя

```typescript
import * as Sentry from "@sentry/nextjs"

// Установить информацию о пользователе
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
})

// Очистить при выходе
Sentry.setUser(null)
```

### 5. Session Replay

Автоматически записывает действия пользователя перед ошибкой:
- Клики
- Скроллинг  
- Ввод текста (замаскирован)
- Навигация

Можно воспроизвести сессию как видео в Sentry Dashboard.

---

## ⚙️ Production настройки

### В production рекомендуется изменить:

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Включить только в production
  enabled: process.env.NODE_ENV === 'production',
  
  // Sample rate для production (10% сессий)
  tracesSampleRate: 0.1,
  
  // Session replay только для ошибок
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  // Фильтр конфиденциальных данных
  beforeSend(event, hint) {
    // Не отправлять чувствительные данные
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers?.Authorization
    }
    return event
  },
  
  // Игнорировать известные ошибки
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
})
```

---

## 🔒 Безопасность

### Что отправляется в Sentry:

✅ **Отправляется:**
- Стек ошибок
- URL страницы
- Браузер и ОС
- Действия пользователя (replay)
- Хлебные крошки (breadcrumbs)

❌ **НЕ отправляется:**
- Пароли (автоматически замаскированы)
- Токены авторизации (если настроено beforeSend)
- Личные данные (если настроено)

### Рекомендации:

```typescript
// Маскировать конфиденциальные поля
integrations: [
  Sentry.replayIntegration({
    maskAllText: true,  // Замаскировать весь текст
    blockAllMedia: true, // Не записывать медиа
    // Или выборочно:
    maskTextSelector: '.sensitive, [data-sensitive]',
  }),
]
```

---

## 📈 Уведомления

### Настроить email/Slack уведомления:

1. **Settings** → **Alerts**
2. **Create Alert Rule**
3. Условия:
   - "New issue is created"
   - "Issue is seen more than 10 times"
4. Действия:
   - Send email to team
   - Send Slack notification

---

## 💰 Лимиты Free Tier

| Метрика | Free Plan |
|---------|-----------|
| **Ошибки** | 5,000/месяц |
| **Performance (transactions)** | 10,000/месяц |
| **Session Replays** | 50 sessions/месяц |
| **Хранение** | 30 дней |
| **Команда** | 1 пользователь |

### Если превысили лимит:

- Sentry перестанет принимать новые ошибки
- Старые данные сохранятся
- Можно увеличить лимиты или upgrade до Developer ($29/мес)

---

## 🎯 Best Practices

### 1. Группировка ошибок

```typescript
// Добавить fingerprint для группировки похожих ошибок
Sentry.captureException(error, {
  fingerprint: ['database-connection-error']
})
```

### 2. Приоритизация

```typescript
// Пометить критичные ошибки
Sentry.captureException(error, {
  level: 'fatal',
  tags: {
    priority: 'high',
    feature: 'payment'
  }
})
```

### 3. Breadcrumbs

```typescript
// Добавить хлебные крошки для отладки
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User attempted login',
  level: 'info',
})
```

---

## 🔧 Troubleshooting

### Ошибки не приходят?

1. **Проверьте DSN:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Проверьте что Sentry инициализирован:**
   ```typescript
   console.log(Sentry.isEnabled()) // должно быть true
   ```

3. **Проверьте Network в DevTools:**
   - Должны быть запросы к `sentry.io`

4. **Проверьте rate limits:**
   - Settings → Usage & Billing

### Source maps не загружаются?

1. Проверьте `SENTRY_AUTH_TOKEN`
2. Убедитесь что есть права `project:releases`
3. Проверьте `SENTRY_ORG` и `SENTRY_PROJECT`

---

## ✅ Готово!

Теперь все ошибки автоматически отслеживаются!

### Доступно в Sentry:

- 🐛 **Issues** - все ошибки
- 📊 **Performance** - метрики производительности
- 🎥 **Replays** - видео действий пользователя
- 📈 **Stats** - общая статистика
- ⚠️ **Alerts** - настройка уведомлений

### Следующие шаги:

1. Настройте уведомления в Slack/Email
2. Добавьте `Sentry.setUser()` после авторизации
3. Просмотрите и исправьте обнаруженные ошибки
4. Настройте rate limiting в production

---

**Полезные ссылки:**
- 📚 Документация: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- 🎓 Best Practices: https://docs.sentry.io/platforms/javascript/best-practices/
- 💬 Community: https://discord.gg/sentry
