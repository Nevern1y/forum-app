# 🔴 Включение Realtime в Supabase

Для работы realtime обновлений нужно включить Realtime в Supabase.

## ✅ Шаги настройки

### 1. Откройте Supabase Dashboard

Перейдите на https://app.supabase.com и выберите ваш проект.

### 2. Включите Realtime для таблиц

**Database → Replication**

Включите Realtime для следующих таблиц:

```
☑ posts                  - для постов
☑ comments               - для комментариев  
☑ post_reactions         - для лайков/реакций
☑ direct_messages        - для чата (ВАЖНО!)
☑ conversations          - для списка чатов
☑ notifications          - для уведомлений
☑ friend_requests        - для заявок в друзья
```

**Как включить:**
1. Database → Replication
2. Найдите таблицу в списке
3. Нажмите на переключатель справа
4. Убедитесь что галочка стоит

### 3. Проверьте настройки

**Settings → API → Realtime**

Убедитесь что:
- ✅ Enable Realtime = ON
- ✅ Max connections = достаточно (100+)

### 4. RLS Политики

Для работы Realtime нужны правильные RLS политики.

**Проверьте SELECT политики:**

```sql
-- Для direct_messages
CREATE POLICY "Users can view their own messages"
ON direct_messages FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Для conversations
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = user1_id OR 
  auth.uid() = user2_id
);
```

## 🧪 Проверка работы

### Консоль браузера

Откройте консоль (F12) и проверьте:

```javascript
// Должны быть сообщения типа:
[Realtime] Connected to channel: conversation:xxx
[Realtime] Subscribed to postgres_changes
```

### Тест вручную

1. Откройте два браузера (или инкогнито)
2. Залогиньтесь разными пользователями
3. Откройте чат между ними
4. Отправьте сообщение
5. Оно должно появиться МГНОВЕННО у второго пользователя

## ❌ Troubleshooting

### Проблема: Сообщения не появляются

**Причины:**
1. Realtime не включен для таблицы
2. RLS политики блокируют SELECT
3. WebSocket подключение заблокировано файрволом

**Решение:**
```sql
-- Проверьте RLS политики
SELECT * FROM pg_policies WHERE tablename = 'direct_messages';

-- Временно отключите RLS для теста
ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;
-- Отправьте сообщение - если работает, проблема в RLS
-- ВАЖНО: включите обратно!
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
```

### Проблема: "Channel already exists"

**Решение:**
```typescript
// Убедитесь что канал отписывается при unmount
useEffect(() => {
  const channel = supabase.channel('unique-name')
  // ...
  return () => {
    supabase.removeChannel(channel) // ОБЯЗАТЕЛЬНО
  }
}, [])
```

### Проблема: Задержка 1-2 секунды

**Причины:**
- Медленный интернет
- Сервер Supabase далеко
- Много подписок (>50 каналов)

**Решение:**
- Используйте фильтры в подписках
- Закрывайте неиспользуемые каналы
- Оптимизируйте количество подписок

### Проблема: Дублирование сообщений

**Причины:**
- Множественные подписки на один канал
- Не отписываетесь при unmount
- Добавляете сообщение локально + через realtime

**Решение:**
```typescript
// ❌ ПЛОХО
await sendMessage(...)
setMessages(prev => [...prev, newMsg]) // Добавили локально
// Realtime тоже добавит - дубль!

// ✅ ХОРОШО
await sendMessage(...)
// Ждём realtime - он добавит автоматически
```

## 📊 Мониторинг

### Проверка активных подключений

```sql
-- В Supabase SQL Editor
SELECT * FROM pg_stat_activity 
WHERE application_name LIKE '%realtime%';
```

### Лимиты

**Free Plan:**
- 200 concurrent connections
- 2GB Realtime data transfer/month

**Pro Plan:**
- 500 concurrent connections
- Unlimited data transfer

## 🔗 Полезные ссылки

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Troubleshooting Guide](https://supabase.com/docs/guides/realtime/troubleshooting)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

**После включения Realtime все изменения появляются мгновенно!**

Версия: 1.0.0
