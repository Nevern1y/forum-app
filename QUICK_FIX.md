# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ - 2 минуты

## Что нужно сделать:

### 1️⃣ Откройте Supabase Dashboard
👉 https://supabase.com/dashboard → ваш проект → **SQL Editor**

### 2️⃣ Скопируйте и выполните:
Откройте файл `FIX_ALL_REALTIME_NOW.sql` → скопируйте ВСЁ → вставьте в SQL Editor → нажмите **Run**

### 3️⃣ Проверьте результат:
Все 5 таблиц должны показать ✅:
```
✅ comments
✅ direct_messages  
✅ notifications
✅ post_reactions
✅ posts
```

### 4️⃣ Перезапустите dev сервер:
```bash
Ctrl+C  (остановить)
npm run dev  (запустить)
```

### ✅ Готово!
Ошибка Realtime исправлена. Обновите страницу в браузере.

---

**Что это исправляет?**
- ❌ `Error: mismatch between server and client bindings`
- ❌ `Check if realtime is enabled for post_reactions`

**Почему это работает?**
SQL скрипт настраивает правильные параметры Realtime для всех таблиц на стороне Supabase.
