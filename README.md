# Forum App

Современное форум-приложение на Next.js с Supabase.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.local.example .env.local
# Заполните .env.local своими ключами Supabase

# Запуск в режиме разработки
npm run dev
```

## 📦 Технологии

- **Next.js 14** - React фреймворк
- **Supabase** - Backend as a Service (PostgreSQL + Storage + Auth + Realtime)
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **Sentry** - Мониторинг ошибок

## 🔑 Настройка

1. Создайте проект в [Supabase](https://supabase.com)
2. Скопируйте `.env.local.example` в `.env.local`
3. Заполните переменные окружения:
   - `NEXT_PUBLIC_SUPABASE_URL` - URL вашего проекта
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon ключ
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role ключ

## 📚 Документация

Вся документация находится в папке **[docs/](docs/)**:

- 📖 **[START_HERE.md](docs/START_HERE.md)** - Начните отсюда
- 🔧 **[WINDOWS_QUICKSTART.md](docs/WINDOWS_QUICKSTART.md)** - Быстрый старт для Windows
- 🗄️ **[BACKUP_AND_CLEANUP_GUIDE.md](docs/BACKUP_AND_CLEANUP_GUIDE.md)** - Бэкап и очистка данных
- 📊 **[DATABASE_MIGRATION_GUIDE.md](docs/DATABASE_MIGRATION_GUIDE.md)** - Миграции БД
- ⚡ **[PERFORMANCE_OPTIMIZATIONS.md](docs/PERFORMANCE_OPTIMIZATIONS.md)** - Оптимизация производительности
- 🚀 **[DEPLOY_NOW.md](docs/DEPLOY_NOW.md)** - Деплой на Vercel
- 🧪 **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Тестирование

### SQL скрипты

SQL скрипты находятся в **[docs/sql/](docs/sql/)**

### Утилиты

Скрипты для бэкапа и обслуживания находятся в **[scripts/](scripts/)**

## 🛠️ Скрипты

```bash
# Разработка
npm run dev              # Запуск dev сервера

# Сборка
npm run build            # Production сборка
npm start                # Запуск production сервера

# Бэкап и очистка
npm run backup:storage   # Бэкап Storage
npm run cleanup:storage  # Очистка Storage
```

## 📁 Структура проекта

```
forum-app/
├── app/              # Next.js App Router
├── components/       # React компоненты
├── hooks/            # Custom hooks
├── lib/              # Утилиты и конфиги
├── public/           # Статические файлы
├── scripts/          # Скрипты для обслуживания
├── styles/           # Глобальные стили
├── supabase/         # Конфиги Supabase
└── docs/             # Документация
    └── sql/          # SQL скрипты
```

## 🔐 Безопасность

- ❌ Никогда не коммитьте `.env.local` или `.env.development`
- ✅ Используйте `.env.*.example` для шаблонов
- ✅ Service role ключи только на сервере

## 📈 Производительность

Приложение оптимизировано для максимальной производительности:
- ⚡ Lazy loading компонентов
- 🎯 Оптимизированные запросы к БД
- 🚀 Edge functions для скорости
- 📦 Минимизированный bundle

## 🆘 Помощь

- Проблемы с запуском? → [WINDOWS_QUICKSTART.md](docs/WINDOWS_QUICKSTART.md)
- Проблемы с деплоем? → [DEPLOY_NOW.md](docs/DEPLOY_NOW.md)
- Другие проблемы? → [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## 📝 Лицензия

MIT
