# 🔧 Финальный Checklist для исправления Realtime

## ❌ Текущая проблема:
```
[Realtime post_reactions] Channel error: mismatch between server and client bindings
```

## ✅ Что уже сделано:

1. ✅ **SQL publication** - Таблицы добавлены в `supabase_realtime`
2. ✅ **RLS policies** - Политики оптимизированы  
3. ✅ **Функция increment_post_views** - Работает
4. ✅ **Код хука** - Упрощена конфигурация

---

## 📋 Checklist для решения проблемы:

### 1️⃣ Проверьте Replica Identity

**Выполните в Supabase SQL Editor:**
```sql
SELECT 
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'default (primary key)'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('post_reactions', 'notifications')
  AND c.relkind = 'r';
```

**Ожидаемый результат:** `default (primary key)`

**Если NOT default, исправьте:**
```sql
ALTER TABLE post_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE notifications REPLICA IDENTITY DEFAULT;
```

---

### 2️⃣ Включите Realtime в Dashboard UI

**⚠️ КРИТИЧЕСКИ ВАЖНО - Без этого не работает!**

1. **Откройте:** https://supabase.com/dashboard/project/YOUR_PROJECT/database/replication
2. **Найдите таблицу `post_reactions`**
3. **Включите ТОЧНО эти события:**
   - ☑️ **INSERT**
   - ☑️ **UPDATE**
   - ☑️ **DELETE**
4. **Нажмите "Save"** (или "Enable")
5. **Повторите для `notifications`**

**Скриншот того, что должно быть:**
```
Source: post_reactions
Events: [✓] Insert  [✓] Update  [✓] Delete
Status: Active
```

---

### 3️⃣ Проверьте Primary Keys

**Выполните:**
```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('post_reactions', 'notifications')
  AND indexname LIKE '%pkey%';
```

**Ожидаемый результат:** 2 строки с primary keys

---

### 4️⃣ Перезапустите приложение

```bash
# Остановите (Ctrl+C)
npm run dev
```

---

### 5️⃣ Проверьте логи браузера

**✅ Успешная подписка:**
```
[Realtime post_reactions] Status: SUBSCRIBED
✅ [Realtime post_reactions] Successfully subscribed
```

**❌ Всё ещё ошибка:**
```
❌ [Realtime post_reactions] Channel error: mismatch...
```

---

## 🐛 Если всё ещё не работает:

### Вариант A: Пересоздайте публикацию

```sql
-- 1. Удалите таблицы из публикации
ALTER PUBLICATION supabase_realtime DROP TABLE post_reactions;
ALTER PUBLICATION supabase_realtime DROP TABLE notifications;

-- 2. Выключите Realtime в Dashboard UI для обеих таблиц

-- 3. Подождите 10 секунд

-- 4. Снова добавьте в публикацию
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Включите Realtime в Dashboard UI (INSERT, UPDATE, DELETE)

-- 6. Перезапустите npm run dev
```

### Вариант B: Проверьте .env.local

Убедитесь что URL правильные:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Вариант C: Проверьте версию @supabase/supabase-js

```bash
npm list @supabase/supabase-js
```

Должна быть >= 2.39.0

---

## 🎯 Финальная проверка:

1. **Откройте 2 вкладки браузера** с приложением
2. **В одной вкладке:** Лайкните пост
3. **Во второй вкладке:** Счётчик должен обновиться **мгновенно** (без перезагрузки страницы)
4. **В консоли должно быть:**
   ```
   [Realtime post_reactions] Change received: INSERT
   ```

---

## 📝 Полезные команды для диагностики:

```sql
-- Все таблицы в публикации
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Все RLS политики для post_reactions
SELECT * FROM pg_policies WHERE tablename = 'post_reactions';

-- Проверка структуры post_reactions
\d post_reactions
```

---

## ✅ После успешного запуска:

Вы должны увидеть:
- ✅ Notifications работают
- ✅ Post reactions работают
- ✅ Счётчики лайков обновляются в реальном времени
- ✅ increment_post_views работает
- ✅ Нет предупреждений производительности

**Всё готово!** 🎉
