# Troubleshooting Guide

## Ошибка: "Error creating friend request: {}"

### Причина
Таблица `friendships` не существует в базе данных или есть проблема с RLS политиками.

### Решение

#### 1. Проверить существование таблиц
Откройте Supabase Dashboard → SQL Editor и выполните:

```sql
-- Проверить все таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('friendships', 'conversations', 'direct_messages', 'notifications');
```

**Ожидаемый результат:** Должны быть 4 таблицы:
- friendships
- conversations
- direct_messages
- notifications

#### 2. Если таблиц нет - применить миграцию
Скопируйте весь файл `supabase/migrations/011_add_friends_and_messages_system.sql` и выполните в SQL Editor.

#### 3. Проверить RLS политики
```sql
-- Проверить политики для friendships
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'friendships';
```

**Ожидаемый результат:** 4 политики:
- Users can view their friendships
- Users can send friend requests
- Users can update their friendships
- Users can delete friendships

#### 4. Проверить триггеры
```sql
-- Проверить триггеры
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('friendships', 'direct_messages');
```

**Ожидаемый результат:** 4 триггера:
- trigger_friend_request_notification
- trigger_friend_accepted_notification
- trigger_update_conversation
- trigger_reset_unread

---

## Ошибка: "Запрос уже отправлен" при первом клике

### Причина
Функция `getFriendshipStatus` возвращает существующий запрос.

### Решение
Это нормальное поведение. Если запрос уже существует, система предотвращает дубликаты.

---

## Ошибка: Real-time не работает

### Проверить настройки Realtime в Supabase

1. Settings → API → Realtime должен быть включен
2. Database → Replication → Включить для таблиц:
   - direct_messages
   - notifications
   - friendships

### Проверить подключение
```typescript
const channel = supabase.channel('test')
channel.subscribe((status) => {
  console.log('Realtime status:', status)
})
```

---

## Ошибка: Уведомления не приходят

### Проверить триггеры
```sql
-- Проверить что триггеры существуют
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%notification%';
```

### Проверить функции
```sql
-- Проверить функции
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';
```

---

## Ошибка: Онлайн-статус не работает

### Причина
Supabase Presence API требует активной подписки.

### Решение
Убедитесь что `PresenceProvider` добавлен в `layout.tsx`:

```tsx
{user && (
  <>
    <PresenceProvider />
    <NavigationSidebar />
  </>
)}
```

---

## Общие проблемы

### Проблема: Страница не загружается

**Решение:**
1. Проверить console в DevTools (F12)
2. Проверить Network tab на ошибки API
3. Проверить Supabase Dashboard → Logs

### Проблема: Ошибка 401 Unauthorized

**Решение:**
1. Проверить что пользователь авторизован
2. Проверить `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Проблема: Ошибка 403 Forbidden

**Решение:**
1. Проверить RLS политики
2. Проверить что `auth.uid()` возвращает правильный ID:
```sql
SELECT auth.uid();
```

---

## Полезные SQL запросы

### Очистить все данные (для тестирования)
```sql
-- ОСТОРОЖНО! Удаляет все данные
DELETE FROM direct_messages;
DELETE FROM conversations;
DELETE FROM friendships;
DELETE FROM notifications;
```

### Посмотреть все запросы в друзья
```sql
SELECT 
  f.*,
  u1.username as requester,
  u2.username as friend
FROM friendships f
JOIN profiles u1 ON f.user_id = u1.id
JOIN profiles u2 ON f.friend_id = u2.id
ORDER BY f.created_at DESC;
```

### Посмотреть все сообщения
```sql
SELECT 
  dm.*,
  sender.username as sender_name,
  receiver.username as receiver_name
FROM direct_messages dm
JOIN profiles sender ON dm.sender_id = sender.id
JOIN profiles receiver ON dm.receiver_id = receiver.id
ORDER BY dm.created_at DESC
LIMIT 20;
```

### Посмотреть все уведомления
```sql
SELECT 
  n.*,
  u.username as user_name,
  ru.username as related_user_name
FROM notifications n
JOIN profiles u ON n.user_id = u.id
LEFT JOIN profiles ru ON n.related_user_id = ru.id
ORDER BY n.created_at DESC
LIMIT 20;
```

---

## Контакты поддержки

Если проблема не решена:
1. Проверьте логи в браузере (F12 → Console)
2. Проверьте логи Supabase (Dashboard → Logs)
3. Создайте issue с полным описанием ошибки

---

**Последнее обновление:** 2024
