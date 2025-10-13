# Real-time Features Guide

## 🚀 Реализованные функции

### 1. **Уведомления в header** 🔔
- Колокольчик с badge непрочитанных
- Всплывающая панель с списком уведомлений
- Real-time обновления (мгновенное появление новых)
- Пометка как прочитанное/удаление
- Toast уведомления при новых событиях

**Компоненты:**
- `components/notifications/notification-bell.tsx`
- `components/notifications/notification-list.tsx`
- `lib/api/notifications.ts`

**Типы уведомлений:**
- `friend_request` - новый запрос в друзья
- `friend_accepted` - запрос принят
- `new_message` - новое сообщение
- `post_shared` - поделились постом
- `post_like` - лайк на пост
- `post_comment` - комментарий
- `comment_reply` - ответ на комментарий

### 2. **Real-time сообщения** 💬
- Мгновенная доставка сообщений
- Автоматическая пометка как прочитанное
- Обновление без перезагрузки страницы
- Подписка на канал беседы через Supabase Realtime

**Как работает:**
```typescript
// Подписка на новые сообщения в беседе
supabase
  .channel(`conversation:${conversationId}`)
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "direct_messages",
    filter: `conversation_id=eq.${conversationId}`,
  }, async (payload) => {
    // Обработка нового сообщения
  })
  .subscribe()
```

### 3. **Онлайн-статус пользователей** 🟢
- Зеленая точка рядом с аватаром
- Отображается в:
  - Списке друзей
  - Списке сообщений
  - Окне чата
- Автоматическое обновление каждые 30 секунд
- Работает через Supabase Presence API

**Компоненты:**
- `components/presence/online-indicator.tsx`
- `components/presence/presence-provider.tsx`
- `lib/api/presence.ts`

**Как работает:**
```typescript
// Транслирование своего присутствия
const channel = supabase.channel("online-users")
await channel.track({
  user_id: user.id,
  online_at: new Date().toISOString(),
})
```

### 4. **Typing indicators** ⌨️
- "Печатает..." с анимированными точками
- Показывается в реальном времени
- Автоматически исчезает через 3 секунды
- Работает через Supabase Broadcast

**Компоненты:**
- `components/messages/typing-indicator.tsx`

**Как работает:**
```typescript
// Отправка события печатания
channel.send({
  type: "broadcast",
  event: "typing",
  payload: { user_id: currentUserId },
})
```

---

## 🔧 Настройка Supabase Realtime

### 1. **Включить Realtime в Supabase Dashboard**
1. Перейти в Settings → API
2. Проверить что Realtime включен
3. В Database → Replication включить для таблиц:
   - `direct_messages`
   - `notifications`
   - `friendships`

### 2. **Лимиты**
**Бесплатный план:**
- 200 одновременных подключений
- 2GB bandwidth/месяц

**Pro план ($25/мес):**
- 500 одновременных подключений
- 10GB bandwidth/месяц

---

## 📊 Производительность

### **Optimizations:**

1. **Подписки**
   - ✅ Автоматическая отписка при unmount
   - ✅ Один канал на компонент
   - ✅ Фильтры на стороне БД

2. **Broadcast**
   - ✅ Debounce для typing indicators
   - ✅ Throttle для presence updates (30 сек)
   - ✅ Минимальный payload

3. **Кэширование**
   - ✅ Локальное состояние для счетчиков
   - ✅ Оптимистичные обновления
   - ✅ Batch операции

---

## 🧪 Тестирование

### **1. Уведомления**
```bash
# Откройте два браузера
1. Пользователь A отправляет запрос в друзья
2. У пользователя B появляется уведомление в колокольчике
3. Клик на уведомление → переход на /friends
```

### **2. Real-time сообщения**
```bash
# Откройте два браузера
1. Пользователь A пишет сообщение
2. У пользователя B сообщение появляется мгновенно
3. Автоматически помечается как прочитанное
```

### **3. Онлайн-статус**
```bash
# Откройте два браузера
1. Пользователь A заходит на сайт
2. У пользователя B появляется зеленая точка рядом с A
3. Пользователь A закрывает вкладку
4. Зеленая точка исчезает через ~30 сек
```

### **4. Typing indicator**
```bash
# Откройте два браузера в чате
1. Пользователь A начинает печатать
2. У пользователя B появляется "печатает..."
3. Пользователь A останавливается
4. Надпись исчезает через 3 секунды
```

---

## 🐛 Troubleshooting

### **Уведомления не приходят**
```typescript
// Проверить подписку
console.log("Channel status:", channel.state)

// Проверить триггеры в БД
SELECT * FROM pg_trigger WHERE tgname LIKE '%notification%'
```

### **Онлайн-статус не обновляется**
```typescript
// Проверить Presence API
const state = channel.presenceState()
console.log("Online users:", state)
```

### **Typing indicator не работает**
```typescript
// Проверить Broadcast
channel.on("broadcast", { event: "typing" }, (payload) => {
  console.log("Typing event:", payload)
})
```

---

## 📦 Зависимости

```json
{
  "@supabase/supabase-js": "^2.x.x"
}
```

**Встроенные модули:**
- ✅ Postgres Changes (INSERT/UPDATE/DELETE)
- ✅ Presence (онлайн-статус)
- ✅ Broadcast (typing indicators)

---

## 🚀 Будущие улучшения

**Опционально:**
- [ ] Реакции на сообщения (эмодзи)
- [ ] "Видел в..." (last seen)
- [ ] Групповые чаты
- [ ] Видео/аудио звонки
- [ ] Screen sharing
- [ ] Редактирование сообщений
- [ ] Пересылка сообщений
- [ ] Закрепленные сообщения

---

## 💡 Best Practices

1. **Всегда отписывайтесь от каналов**
```typescript
useEffect(() => {
  const unsubscribe = subscribeToChannel()
  return unsubscribe
}, [])
```

2. **Используйте фильтры на стороне БД**
```typescript
filter: `user_id=eq.${userId}` // ✅ Быстро
// vs
.filter(msg => msg.user_id === userId) // ❌ Медленно
```

3. **Batch обновления**
```typescript
// ✅ Хорошо
setMessages(prev => [...prev, newMessage])

// ❌ Плохо (лишние re-renders)
setMessages([...messages, newMessage])
```

4. **Debounce expensive операции**
```typescript
const debouncedTyping = useMemo(
  () => debounce(broadcastTyping, 300),
  []
)
```

---

**Готово!** Real-time функции работают и готовы к production. 🎉
