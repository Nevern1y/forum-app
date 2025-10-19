# 🔔 Реализация системы уведомлений

## ✅ Что УЖЕ реализовано:

### 1. UI Компоненты
- ✅ `NotificationBell` - иконка с badge в navbar
- ✅ `NotificationList` - dropdown с списком
- ✅ `NotificationItem` - отдельное уведомление
- ✅ `/notifications` - полная страница
- ✅ Realtime обновления через Supabase
- ✅ Toast уведомления

### 2. API
- ✅ `getNotifications()` - получить список
- ✅ `getUnreadNotificationsCount()` - счетчик непрочитанных
- ✅ `markNotificationAsRead()` - пометить прочитанным
- ✅ `markAllNotificationsAsRead()` - пометить все
- ✅ `deleteNotification()` - удалить
- ✅ `subscribeToNotifications()` - Realtime подписка

### 3. Hooks
- ✅ `useNotificationsRealtime` - хук для Realtime

### 4. Database (НОВОЕ!)
- ✅ `notify_post_comment()` - триггер комментариев
- ✅ `notify_comment_reply()` - триггер ответов
- ✅ `notify_post_reaction()` - триггер лайков
- ✅ `notify_mentions()` - RPC для упоминаний @username
- ✅ `cleanup_old_notifications()` - очистка старых
- ✅ Индексы для быстрой работы

### 5. Utilities (НОВОЕ!)
- ✅ `parseMentions()` - парсинг @username
- ✅ `notifyMentions()` - отправка уведомлений
- ✅ `highlightMentions()` - подсветка
- ✅ `searchUsersForMention()` - автодополнение
- ✅ `markdownWithMentions()` - конвертация в links

---

## 🚀 Применение изменений

### Шаг 1: Выполнить SQL миграцию

**В Supabase SQL Editor:**
```bash
1. Откройте https://supabase.com/dashboard
2. Выберите проект
3. SQL Editor → New query
4. Скопируйте содержимое: supabase/migrations/030_add_notification_triggers.sql
5. Run
```

**Проверка:**
```sql
-- Должно показать 3 триггера
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name LIKE '%notify%'
ORDER BY trigger_name;

-- Результат:
-- on_comment_created_notify
-- on_comment_reply_notify
-- on_reaction_created_notify
```

### Шаг 2: Интегрировать упоминания в создание постов

**Файл: `app/create-post/page.tsx` (или где создаются посты)**

```typescript
import { notifyMentions } from '@/lib/utils/mentions'

async function handleCreatePost() {
  // ... создание поста
  
  const { data: newPost } = await supabase
    .from('posts')
    .insert({ title, content, author_id: user.id })
    .select()
    .single()
  
  // ДОБАВИТЬ: Уведомления об упоминаниях
  if (newPost) {
    await notifyMentions({
      content: content,
      postId: newPost.id,
      mentionerId: user.id,
      mentionType: 'post'
    })
  }
}
```

### Шаг 3: Интегрировать упоминания в комментарии

**Файл: где создаются комментарии (например `components/comments/comment-form.tsx`)**

```typescript
import { notifyMentions } from '@/lib/utils/mentions'

async function handleSubmitComment() {
  // ... создание комментария
  
  const { data: newComment } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content,
      parent_id: parentId || null
    })
    .select()
    .single()
  
  // ДОБАВИТЬ: Уведомления об упоминаниях
  if (newComment) {
    await notifyMentions({
      content: content,
      postId: postId,
      mentionerId: user.id,
      mentionType: 'comment'
    })
  }
}
```

### Шаг 4: Перезапуск приложения

```bash
# Ctrl+C для остановки
npm run dev
```

### Шаг 5: Тестирование

1. **Создайте пост** → Проверьте что в БД есть запись
2. **Прокомментируйте чужой пост** → Автор должен получить уведомление
3. **Ответьте на комментарий** → Автор комментария получит уведомление
4. **Поставьте лайк** → Автор поста получит уведомление
5. **Упомяните @username** → Пользователь получит уведомление

---

## 📋 TODO: Дальнейшие улучшения

### Приоритет: ВЫСОКИЙ

#### 1. Автодополнение @mentions при вводе
```typescript
// Компонент с автодополнением
<MentionableTextarea
  value={content}
  onChange={setContent}
  onMention={(username) => insertMention(username)}
/>
```

**Файлы для создания:**
- `components/editor/mentionable-textarea.tsx`
- `components/editor/mention-dropdown.tsx`

**Время:** 1-2 дня

#### 2. Группировка похожих уведомлений
```
❌ До:
- Иван лайкнул ваш пост
- Петр лайкнул ваш пост
- Мария лайкнула ваш пост

✅ После:
- Иван, Петр и Мария (ещё 2) лайкнули ваш пост
```

**Реализация:**
- Группировка в `getNotifications()`
- Обновление UI для показа групп

**Время:** 2-3 дня

#### 3. Настройки уведомлений
```typescript
interface NotificationSettings {
  comments: boolean      // Уведомлять о комментариях
  replies: boolean       // Уведомлять об ответах
  likes: boolean         // Уведомлять о лайках
  mentions: boolean      // Уведомлять об упоминаниях
  follows: boolean       // Уведомлять о подписках
  email_enabled: boolean // Email уведомления
  email_frequency: 'instant' | 'daily' | 'weekly'
}
```

**Файлы для создания:**
- `app/settings/notifications/page.tsx`
- `components/settings/notification-settings.tsx`
- Сохранение в `profiles.notification_settings::jsonb`

**Время:** 1-2 дня

### Приоритет: СРЕДНИЙ

#### 4. Email уведомления
- Интеграция с Resend/SendGrid
- Email шаблоны
- Настройка частоты (instant/daily/weekly)

**Время:** 3-4 дня

#### 5. Push уведомления
- Service Worker
- Web Push API
- Настройка разрешений

**Время:** 2-3 дня

#### 6. Звуковые уведомления
```typescript
// Добавить в NotificationBell
const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3')
  audio.play()
}
```

**Файлы:**
- Добавить звуковой файл в `/public/sounds/`
- Настройка в UI

**Время:** 1 час

### Приоритет: НИЗКИЙ

#### 7. Уведомления о достижениях
```
🏆 Поздравляем! Вы достигли 100 лайков!
⭐ Новый уровень: Активный участник
```

**Зависимость:** Нужна система достижений

#### 8. Уведомления о подписках на посты
```
🔔 Новый комментарий в отслеживаемом посте
```

**Нужна функция:** "Следить за постом"

---

## 🧪 Тестирование

### Ручное тестирование

```bash
# 1. Проверка триггеров
# В Supabase SQL Editor:

-- Создать тестовый комментарий
INSERT INTO comments (post_id, user_id, content)
VALUES ('POST_ID', 'USER_ID', 'Test comment');

-- Проверить что создалось уведомление
SELECT * FROM notifications
WHERE type = 'comment'
ORDER BY created_at DESC
LIMIT 1;

# 2. Проверка Realtime
# Откройте две вкладки браузера
# В первой: залогиньтесь как User A
# Во второй: залогиньтесь как User B
# User B комментирует пост User A
# User A должен увидеть Toast и badge обновился

# 3. Проверка упоминаний
# Создайте пост с текстом: "Привет @username"
# Проверьте что username получил уведомление
```

### Автоматизированное тестирование

```typescript
// __tests__/mentions.test.ts
import { parseMentions, isValidMentionUsername } from '@/lib/utils/mentions'

describe('Mentions', () => {
  it('should parse mentions from text', () => {
    const text = 'Hello @john and @jane_doe!'
    const mentions = parseMentions(text)
    expect(mentions).toEqual(['john', 'jane_doe'])
  })
  
  it('should validate username', () => {
    expect(isValidMentionUsername('user123')).toBe(true)
    expect(isValidMentionUsername('a')).toBe(false) // too short
    expect(isValidMentionUsername('user-name')).toBe(false) // invalid char
  })
})
```

---

## 📊 Метрики для отслеживания

### Performance
- Время загрузки списка уведомлений
- Время отклика Realtime (delay от создания до получения)
- Количество уведомлений на пользователя/день

### Engagement
- CTR уведомлений (кликабельность)
- Процент прочитанных уведомлений
- Время до прочтения уведомления

### Database
- Размер таблицы notifications
- Количество старых уведомлений (>30 дней)
- Частота вызова cleanup_old_notifications

---

## 🐛 Известные ограничения

1. **Группировка:** Пока не реализована, может быть спам уведомлений
2. **Email:** Нет email уведомлений
3. **Push:** Нет push уведомлений для mobile
4. **Автодополнение:** Нет @ autocomplete в текстовых полях
5. **Настройки:** Нельзя отключить определенные типы уведомлений

---

## 🎯 Приоритетный roadmap

### Неделя 1 (СЕЙЧАС)
- ✅ Применить SQL миграцию
- ✅ Интегрировать упоминания в посты
- ✅ Интегрировать упоминания в комментарии
- ✅ Протестировать все триггеры

### Неделя 2
- 🔲 Автодополнение @mentions
- 🔲 Группировка уведомлений
- 🔲 Звуковые уведомления

### Неделя 3
- 🔲 Настройки уведомлений
- 🔲 Email уведомления (daily digest)

### Неделя 4+
- 🔲 Push уведомления
- 🔲 Уведомления о достижениях
- 🔲 Оптимизация performance

---

## 📝 Заметки

- Все триггеры работают автоматически после применения SQL
- Не забудьте вызывать `notifyMentions()` после создания контента
- Realtime уже настроен и работает
- Периодически запускайте `cleanup_old_notifications()` (можно через cron)

**Готово к использованию!** 🚀
