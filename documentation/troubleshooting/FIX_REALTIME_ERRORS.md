# Исправление ошибок Realtime

## Проблема

В консоли браузера появляются ошибки:
```
[Realtime notifications] Status: CLOSED
[Realtime post_reactions] Status: CLOSED
Firefox не может установить соединение с сервером wss://...supabase.co/realtime/v1/websocket
```

## Причины

1. **Realtime не включен** для таблиц в Supabase Dashboard
2. **REPLICA IDENTITY** не установлен в FULL
3. **Неправильные RLS политики** блокируют доступ

---

## Решение: Проверка настроек Realtime в Supabase

### Шаг 1: Проверьте состояние всех таблиц

Выполните в **Supabase SQL Editor**:

```sql
-- Проверка REPLICA IDENTITY для всех важных таблиц
SELECT 
  c.relname as table_name,
  CASE c.relreplident 
    WHEN 'd' THEN '⚠️ default (нужно FULL)' 
    WHEN 'f' THEN '✅ FULL' 
    WHEN 'i' THEN '⚠️ index' 
    WHEN 'n' THEN '❌ nothing' 
  END as replica_identity,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables pt
    WHERE pt.tablename = c.relname 
    AND pt.pubname = 'supabase_realtime'
  ) THEN '✅ В publication'
  ELSE '❌ НЕ в publication'
  END as in_publication
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('notifications', 'post_reactions', 'direct_messages', 'posts')
ORDER BY c.relname;
```

### Шаг 2: Исправьте таблицы с проблемами

**Для таблиц с `⚠️ default`**, выполните:

```sql
-- Исправляем REPLICA IDENTITY
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE post_reactions REPLICA IDENTITY FULL;
ALTER TABLE direct_messages REPLICA IDENTITY FULL;
```

**Для таблиц с `❌ НЕ в publication`**, выполните:

```sql
-- Добавляем в realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
```

### Шаг 3: Проверьте настройки Realtime в Dashboard

1. Откройте **Supabase Dashboard** → ваш проект
2. Перейдите в **Database → Replication**
3. Убедитесь, что **Realtime** включен (зелёная галочка)
4. В списке таблиц должны быть:
   - ✅ `notifications`
   - ✅ `post_reactions` 
   - ✅ `direct_messages`
   - ✅ `posts` (опционально)

Если таблиц нет в списке:
- Нажмите кнопку **"Add table"** или **"Enable for table"**
- Выберите нужные таблицы
- Сохраните изменения

### Шаг 4: Проверьте RLS политики

Выполните в SQL Editor:

```sql
-- Проверка политик для notifications
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';

-- Проверка политик для post_reactions
SELECT * FROM pg_policies 
WHERE tablename = 'post_reactions';

-- Проверка политик для direct_messages
SELECT * FROM pg_policies 
WHERE tablename = 'direct_messages';
```

Должны быть политики для:
- ✅ SELECT (чтение)
- ✅ INSERT (добавление)
- ✅ UPDATE (обновление, для notifications и direct_messages)
- ✅ DELETE (удаление, опционально)

---

## Проверка после исправления

1. **Перезагрузите** страницу сайта (F5)
2. **Откройте** консоль браузера (F12)
3. Должны увидеть:
```
✅ [Realtime notifications] Successfully subscribed
✅ [Realtime post_reactions] Successfully subscribed
✅ [Realtime direct_messages] Successfully subscribed
```

4. **Протестируйте**:
   - Отправьте сообщение в чате → должно появиться мгновенно
   - Поставьте лайк/дизлайк → должно обновиться мгновенно
   - Получите уведомление → должно появиться в колокольчике

---

## Если проблема сохраняется

### 1. Проверьте лимиты Supabase

В бесплатном плане Supabase есть лимиты:
- **Realtime connections**: 200 одновременных подключений
- **Realtime messages**: 2 миллиона в месяц

Проверьте использование в **Dashboard → Settings → Usage**

### 2. Проверьте настройки безопасности

Если используется VPN или корпоративная сеть:
- Убедитесь, что WebSocket соединения (wss://) не блокируются
- Проверьте firewall настройки
- Попробуйте отключить VPN

### 3. Проверьте версию Supabase Client

Должна быть актуальная версия. Проверьте в `package.json`:

```json
"@supabase/supabase-js": "^2.47.x" // или выше
```

Если версия старая, обновите:
```bash
npm install @supabase/supabase-js@latest
```

### 4. Включите дебаг логи

Временно включите детальное логирование в `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

Перезапустите dev сервер и проверьте консоль браузера.

---

## Автоматическое переподключение

Код уже содержит автоматическое переподключение:
- Если соединение закрывается, система попытается переподключиться через 5 секунд
- В консоли увидите: `🔄 [Realtime notifications] Attempting to reconnect...`

---

## Поддержка

Если проблема не решена:
1. Скопируйте все сообщения из консоли браузера
2. Скопируйте результаты SQL запросов выше
3. Проверьте Supabase Dashboard → Logs для ошибок сервера
4. Откройте issue с подробным описанием
