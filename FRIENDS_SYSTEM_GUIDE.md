# Гайд по системе друзей и сообщений

## 🎯 Обзор системы

Полнофункциональная система для:
- ✅ Добавление в друзья (запросы/принятие/отклонение)
- ✅ Личные сообщения (текст + медиа + аудио)
- ✅ Sharing постов через ЛС
- ✅ Уведомления в реальном времени
- ✅ Счетчики непрочитанных

---

## 📊 Структура базы данных

### 1. **friendships** - Система друзей
```sql
id              UUID (PK)
user_id         UUID → profiles (кто отправил)
friend_id       UUID → profiles (кому отправил)
status          TEXT (pending/accepted/rejected/blocked)
created_at      TIMESTAMP
accepted_at     TIMESTAMP (когда принят)

UNIQUE(user_id, friend_id)
```

**Статусы:**
- `pending` - ожидает ответа
- `accepted` - друзья
- `rejected` - отклонен
- `blocked` - заблокирован

### 2. **conversations** - Беседы
```sql
id                    UUID (PK)
user1_id              UUID → profiles (меньший ID)
user2_id              UUID → profiles (больший ID)
last_message_at       TIMESTAMP
last_message_preview  TEXT (первые 100 символов)
unread_count_user1    INTEGER
unread_count_user2    INTEGER
created_at            TIMESTAMP

UNIQUE(user1_id, user2_id)
CONSTRAINT: user1_id < user2_id
```

**Логика:**
- ID всегда упорядочены (меньший = user1)
- Предотвращает дубликаты
- Счетчики непрочитанных для каждого

### 3. **direct_messages** - Сообщения
```sql
id               UUID (PK)
conversation_id  UUID → conversations
sender_id        UUID → profiles
receiver_id      UUID → profiles
content          TEXT (NOT NULL)
media_urls       TEXT[] (фото/видео)
audio_url        TEXT (голосовые)
shared_post_id   UUID → posts (для sharing)
is_read          BOOLEAN
read_at          TIMESTAMP
created_at       TIMESTAMP

CONSTRAINT: Хотя бы одно поле заполнено
```

### 4. **notifications** - Уведомления
```sql
id                  UUID (PK)
user_id             UUID → profiles
type                TEXT (friend_request/new_message/etc)
related_user_id     UUID → profiles
related_content_id  UUID (ID поста/сообщения)
title               TEXT
message             TEXT
link                TEXT (куда вести)
is_read             BOOLEAN
read_at             TIMESTAMP
created_at          TIMESTAMP
```

**Типы уведомлений:**
- `friend_request` - новый запрос в друзья
- `friend_accepted` - запрос принят
- `new_message` - новое сообщение
- `post_shared` - поделились постом
- `post_like` - лайк на пост
- `post_comment` - комментарий
- `comment_reply` - ответ на комментарий

---

## 🔐 RLS Политики

### **friendships**
- ✅ SELECT: только свои запросы
- ✅ INSERT: только от себя
- ✅ UPDATE: только где участвуешь
- ✅ DELETE: только свои

### **conversations**
- ✅ SELECT: только свои беседы
- ✅ INSERT: только со своим участием
- ✅ UPDATE: только свои

### **direct_messages**
- ✅ SELECT: только отправленные или полученные
- ✅ INSERT: только от себя
- ✅ UPDATE: только полученные (для пометки прочитанным)
- ✅ DELETE: только отправленные

### **notifications**
- ✅ SELECT: только свои
- ✅ INSERT: система (любой может создать)
- ✅ UPDATE: только свои
- ✅ DELETE: только свои

---

## ⚡ Вспомогательные функции

### 1. `are_friends(user1_id, user2_id) → BOOLEAN`
Проверяет дружат ли пользователи

```sql
SELECT are_friends(
  '123e4567-e89b-12d3-a456-426614174000',
  '223e4567-e89b-12d3-a456-426614174000'
);
```

### 2. `get_or_create_conversation(user1_id, user2_id) → UUID`
Получает существующую беседу или создает новую

```sql
SELECT get_or_create_conversation(
  auth.uid(),
  '223e4567-e89b-12d3-a456-426614174000'
);
```

### 3. `get_unread_messages_count(user_id) → INTEGER`
Возвращает количество непрочитанных сообщений

```sql
SELECT get_unread_messages_count(auth.uid());
```

### 4. `get_unread_notifications_count(user_id) → INTEGER`
Возвращает количество непрочитанных уведомлений

```sql
SELECT get_unread_notifications_count(auth.uid());
```

---

## 🔔 Автоматические триггеры

### 1. **update_conversation_on_message**
При отправке сообщения:
- Обновляет `last_message_at`
- Сохраняет превью
- Увеличивает счетчик непрочитанных для получателя

### 2. **reset_unread_count_on_read**
При пометке сообщения прочитанным:
- Уменьшает счетчик непрочитанных

### 3. **create_friend_request_notification**
При отправке запроса в друзья:
- Создает уведомление для получателя

### 4. **create_friend_accepted_notification**
При принятии запроса:
- Создает уведомление для отправителя

---

## 🚀 Применение миграции

### Вариант 1: Supabase Dashboard
1. Откройте https://supabase.com → ваш проект
2. SQL Editor → New Query
3. Скопируйте содержимое `011_add_friends_and_messages_system.sql`
4. Нажмите **Run**

### Вариант 2: Supabase CLI
```bash
supabase db push
```

---

## 📝 Примеры использования

### Отправить запрос в друзья
```typescript
const { data, error } = await supabase
  .from('friendships')
  .insert({
    user_id: currentUserId,
    friend_id: targetUserId,
    status: 'pending'
  })
```

### Принять запрос
```typescript
const { data, error } = await supabase
  .from('friendships')
  .update({ 
    status: 'accepted',
    accepted_at: new Date().toISOString()
  })
  .eq('user_id', requesterId)
  .eq('friend_id', currentUserId)
```

### Отправить сообщение
```typescript
// 1. Получить/создать беседу
const { data: conversationId } = await supabase
  .rpc('get_or_create_conversation', {
    user1_id: currentUserId,
    user2_id: friendId
  })

// 2. Отправить сообщение
const { data, error } = await supabase
  .from('direct_messages')
  .insert({
    conversation_id: conversationId,
    sender_id: currentUserId,
    receiver_id: friendId,
    content: 'Привет!'
  })
```

### Получить список друзей
```typescript
const { data, error } = await supabase
  .from('friendships')
  .select(`
    *,
    friend:friend_id (
      id,
      username,
      display_name,
      avatar_url
    )
  `)
  .eq('user_id', currentUserId)
  .eq('status', 'accepted')
```

### Получить беседы
```typescript
const { data, error } = await supabase
  .from('conversations')
  .select(`
    *,
    user1:user1_id (id, username, display_name, avatar_url),
    user2:user2_id (id, username, display_name, avatar_url)
  `)
  .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
  .order('last_message_at', { ascending: false })
```

---

## 🎨 Дизайн UI

### Цветовая схема
**Темная тема:**
- Карточки: `#181818`
- Фон: `#000000`

**Светлая тема:**
- Карточки: `bg-card`
- Фон: `bg-background`

### Компоненты (будут созданы)
1. `FriendRequestButton` - кнопка в профиле
2. `FriendsList` - страница `/friends`
3. `MessagesList` - список чатов `/messages`
4. `ChatWindow` - окно чата `/messages/[username]`
5. `NotificationBell` - колокольчик в header
6. `SharePostModal` - поделиться постом

---

## ⚠️ Важные замечания

1. **Безопасность:**
   - Все действия проверяются через RLS
   - Нельзя отправить сообщение не-другу (проверка на фронте)
   - Каждый видит только свои данные

2. **Производительность:**
   - Все индексы настроены
   - Запросы оптимизированы
   - Счетчики кэшируются в таблице conversations

3. **Масштабирование:**
   - Система готова к real-time через Supabase Realtime
   - Можно добавить rate limiting
   - Поддержка больших объемов сообщений

---

## 🔄 Следующие шаги

После применения миграции будем создавать:
1. ✅ API хелперы для работы с друзьями
2. ✅ Страницы и компоненты UI
3. ✅ Real-time обновления (опционально)
4. ✅ Интеграция в существующий дизайн

---

**Готово!** База данных настроена и готова к использованию 🎉
