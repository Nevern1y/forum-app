# 🔑 Быстрая настройка переменных окружения

## ❌ Ошибка при запуске?

```
Error: Your project's URL and Key are required to create a Supabase client!
```

**Решение:** Заполните `.env.local` своими ключами Supabase.

---

## ✅ Пошаговая инструкция (2 минуты)

### Шаг 1: Откройте Supabase Dashboard

1. Перейдите на: https://supabase.com/dashboard
2. Войдите в аккаунт
3. Выберите ваш проект (или создайте новый)

### Шаг 2: Получите ключи

1. В левом меню нажмите: **⚙️ Settings** (Настройки)
2. Выберите: **🔑 API**
3. Вы увидите страницу с ключами

### Шаг 3: Скопируйте 3 значения

На странице API вы найдёте:

#### 1️⃣ Project URL
```
Раздел: Configuration
Название: Project URL
Значение: https://xxxxx.supabase.co
```
➡️ Скопируйте это значение

#### 2️⃣ Anon Key (Public)
```
Раздел: Project API keys
Название: anon / public
Кнопка: [Copy]
```
➡️ Нажмите кнопку Copy

#### 3️⃣ Service Role Key (Secret)
```
Раздел: Project API keys
Название: service_role
Кнопка: [Reveal] → [Copy]
```
⚠️ **ВНИМАНИЕ**: Это секретный ключ! Никогда не делитесь им!

➡️ Нажмите Reveal, затем Copy

### Шаг 4: Вставьте в .env.local

1. Откройте файл `.env.local` в Notepad или VS Code
2. Вставьте скопированные значения:

```env
# Вставьте Project URL
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co

# Вставьте Anon Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Вставьте Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Сохраните файл: **Ctrl+S**

### Шаг 5: Перезапустите сервер

1. Остановите dev сервер: **Ctrl+C** в терминале
2. Запустите заново:

```bash
npm run dev
```

---

## ✅ Готово!

Теперь сервер должен запуститься без ошибок:

```
✓ Ready in 4.3s
Local: http://localhost:3000
```

Откройте браузер: http://localhost:3000

---

## 🆘 Всё ещё не работает?

### Ошибка: "Invalid API key"
- Проверьте, что скопировали **service_role** key, а не anon key
- Убедитесь, что нет лишних пробелов в начале/конце значений

### Ошибка: "Network error"
- Проверьте Project URL (должен начинаться с `https://`)
- Убедитесь, что проект активен в Supabase Dashboard

### Ошибка: "Project not found"
- Убедитесь, что используете правильный Project URL
- Проверьте, что проект не был удалён или приостановлен

---

## 📸 Скриншот страницы API

Вот как выглядит страница с ключами:

```
Supabase Dashboard
└── Settings
    └── API
        ├── Configuration
        │   └── Project URL: https://xxxxx.supabase.co
        │
        └── Project API keys
            ├── anon / public: eyJhbGci... [Copy]
            └── service_role: •••••••••• [Reveal] [Copy]
```

---

## 🔐 Безопасность

✅ **Можно коммитить в git:**
- `.env.local.example` (шаблон)
- `.env.development.example` (шаблон)

❌ **НЕ коммитить в git:**
- `.env.local` (ваши настоящие ключи)
- `.env.development` (если содержит ключи)

`.gitignore` уже настроен правильно! ✅

---

## 📝 Примечание

- **anon key** - безопасен для клиента (браузера)
- **service_role key** - секретный, только для сервера
- Не используйте service_role key в клиентском коде!

---

**Удачи! 🚀**
