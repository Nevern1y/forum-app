# Быстрая настройка Sentry (2 минуты)

## ✅ Что уже готово:

У вас уже настроено:
- ✅ `@sentry/nextjs` установлен
- ✅ `sentry.client.config.ts` создан
- ✅ `sentry.server.config.ts` создан
- ✅ `sentry.edge.config.ts` создан
- ✅ `next.config.mjs` обновлён

**Осталось только добавить DSN ключ!**

---

## 🔑 Шаг 1: Получить DSN

Вы уже в проекте Sentry! Нужно найти DSN:

### Вариант A: На текущей странице
Прокрутите вниз на странице Sentry, должен быть блок "DSN" или "Client Keys"

### Вариант B: В настройках
1. Перейдите: **Settings** (шестеренка слева)
2. **Projects** → `javascript-nextjs`
3. **Client Keys (DSN)**
4. Скопируйте DSN (выглядит как `https://xxx@o123.ingest.sentry.io/456`)

---

## ⚙️ Шаг 2: Добавить в .env.local

Откройте файл `.env.local` и **раскомментируйте** строки Sentry:

### Найдите эти строки:
```env
# Sentry Monitoring (опционально - см. SENTRY_SETUP.md)
# Раскомментируйте и заполните после настройки Sentry:
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_ORG=
# SENTRY_PROJECT=forum-app
# SENTRY_AUTH_TOKEN=
```

### Замените на (уберите #):
```env
# Sentry Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://ваш-dsn@o123.ingest.sentry.io/456
SENTRY_ORG=whity
SENTRY_PROJECT=javascript-nextjs
# SENTRY_AUTH_TOKEN= (опционально, пока не нужен)
```

---

## 🚀 Шаг 3: Перезапустить сервер

```bash
# Остановите текущий сервер (Ctrl+C)
# Запустите заново
npm run dev
```

---

## ✅ Шаг 4: Протестировать

### Вариант A: Кнопка на странице (если есть)
Перейдите на `/sentry-example-page` и нажмите кнопку

### Вариант B: Создать тестовую ошибку

Откройте любую страницу и добавьте в консоль браузера (F12):

```javascript
myUndefinedFunction()
```

Или добавьте временно в код:

```typescript
// components/feed/post-card.tsx - добавьте в начало функции
export function PostCard({ post }: PostCardProps) {
  // ТЕСТ SENTRY - удалите после проверки!
  if (Math.random() > 0.9) {
    throw new Error("Sentry Test - всё работает! ✅")
  }
  
  // ... остальной код
}
```

---

## 🎯 Проверка

1. Откройте Sentry Dashboard: https://sentry.io/
2. Перейдите в проект `javascript-nextjs`
3. Раздел **Issues**
4. Должна появиться ошибка за 10-30 секунд

### Если появилась - поздравляю! 🎉
Sentry настроен и отслеживает все ошибки!

### Если не появилась:
1. Проверьте что DSN правильный (скопирован полностью)
2. Перезапустите `npm run dev`
3. Откройте Network в DevTools (F12) - должны быть запросы к sentry.io
4. Проверьте что ошибка действительно произошла

---

## 🔧 Упрощенная версия (без auth token)

Если не хотите возиться с SENTRY_AUTH_TOKEN - не проблема!

### Минимальный .env.local:
```env
NEXT_PUBLIC_SENTRY_DSN=https://ваш-dsn@sentry.io/123
```

Этого достаточно! Auth token нужен только для:
- Загрузки source maps (stack traces будут менее читабельны)
- Release tracking

Для начала вам это не критично.

---

## 🎊 Готово!

Теперь все ошибки автоматически попадают в Sentry!

**Что дальше:**
- Настройте уведомления (Settings → Alerts)
- Посмотрите Session Replays (видео действий пользователя)
- Изучите Performance метрики

---

## 📋 Краткая памятка

```env
# В .env.local нужно МИНИМУМ это:
NEXT_PUBLIC_SENTRY_DSN=ваш-dsn-от-sentry
```

Остальное опционально!
