# Инструкции по включению Realtime в Supabase Dashboard

## ⚠️ ВАЖНО: Двойная настройка Realtime

Для работы Realtime нужно **два шага**:

### ✅ Шаг 1: SQL (УЖЕ ВЫПОЛНЕНО)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### ⚙️ Шаг 2: Dashboard UI (НУЖНО СДЕЛАТЬ ВРУЧНУЮ)

1. **Откройте Supabase Dashboard**
2. **Перейдите: Database → Replication** (слева в боковом меню)
3. **Найдите таблицу `post_reactions`**
4. **Включите события:**
   - ✅ **INSERT** (галочку)
   - ✅ **UPDATE** (галочку)
   - ✅ **DELETE** (галочку)
5. **Нажмите "Save"** или аналогичную кнопку подтверждения
6. **Повторите для `notifications`:**
   - ✅ **INSERT**
   - ✅ **UPDATE**
   - ✅ **DELETE**
7. **Сохраните**

---

## 🔍 Проверка после настройки:

### 1. Проверьте публикацию:
```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('post_reactions', 'notifications');
```

**Ожидаемый результат:** 2 строки

### 2. Проверьте Replica Identity:
```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('post_reactions', 'notifications')
  AND indexname LIKE '%pkey%';
```

**Ожидаемый результат:** Обе таблицы должны иметь primary key

---

## 🐛 Troubleshooting

### Ошибка: "mismatch between server and client bindings"

**Причина:** События не включены в Dashboard → Replication

**Решение:**
1. Выключите все события для `post_reactions` в Dashboard
2. Сохраните
3. Снова включите INSERT, UPDATE, DELETE
4. Сохраните
5. Перезапустите `npm run dev`

### Ошибка: "Connection closed" / "Timed out"

**Причина:** Supabase Realtime может быть отключен на уровне проекта

**Решение:**
1. Project Settings → API
2. Убедитесь что Realtime URL доступен
3. Проверьте что в .env.local правильный `NEXT_PUBLIC_SUPABASE_URL`

### Ошибка: "Channel error"

**Причина:** RLS политики блокируют доступ к данным

**Решение:**
```sql
-- Проверьте что у post_reactions есть политика SELECT для всех
SELECT * FROM pg_policies WHERE tablename = 'post_reactions';
```

---

## ✅ Успешная подписка выглядит так:

```
[Realtime post_reactions] Status: SUBSCRIBED
✅ [Realtime post_reactions] Successfully subscribed
[Realtime post_reactions] Change received: INSERT
```

## ❌ Проблемная подписка:

```
[Realtime post_reactions] Status: CHANNEL_ERROR
❌ [Realtime post_reactions] Channel error: Error: mismatch...
```

---

## 📝 После настройки:

1. Перезапустите `npm run dev`
2. Откройте приложение в 2 вкладках браузера
3. Лайкните пост в одной вкладке
4. Счётчик должен **мгновенно** обновиться во второй вкладке
5. В консоли должно быть: `✅ [Realtime post_reactions] Successfully subscribed`
