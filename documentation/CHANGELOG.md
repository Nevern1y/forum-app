# Changelog

## [Unreleased] - 2025-01-19

### 🔐 Security

- **CRITICAL**: Обновлен Next.js с 15.2.4 до 15.5.6 для устранения 3 уязвимостей
  - Cache Key Confusion for Image Optimization API Routes
  - Content Injection Vulnerability for Image Optimization  
  - Improper Middleware Redirect Handling Leads to SSRF
- Проведен полный аудит безопасности (см. SECURITY_AUDIT.md)
- Проверена защита от SQL injection, XSS, CSRF

### ✅ Fixed

- Исправлено 22+ ошибок TypeScript
- Убрано игнорирование ошибок TypeScript и ESLint в next.config.mjs
- Исправлены несоответствия типов в компонентах:
  - app/liked-posts/page.tsx
  - app/post/[id]/page.tsx
  - app/profile/[username]/page.tsx
  - components/feed/infinite-post-list.tsx
  - components/messages/whatsapp-style-messages.tsx
  - components/search/search-results.tsx
  - components/lazy-components.tsx
  - components/ui/markdown-viewer.tsx

### ✨ Added

- Настроен ESLint v9 (eslint.config.mjs)
- Добавлена конфигурация Jest для unit тестов
- Созданы примеры тестов:
  - `__tests__/components/ui/button.test.tsx`
  - `__tests__/lib/utils.test.ts`
  - `__tests__/lib/utils/reading-time.test.ts`
- Настроен GitHub Actions CI/CD:
  - `.github/workflows/ci.yml` - основной workflow
  - `.github/workflows/security.yml` - еженедельный security audit
- Добавлены npm scripts:
  - `lint:fix` - автоматическое исправление ESLint ошибок
  - `type-check` - проверка TypeScript без сборки
  - `test` - запуск тестов в watch mode
  - `test:ci` - запуск тестов в CI
  - `test:coverage` - отчет о покрытии тестами
  - `validate` - полная проверка (lint + type-check + tests)
- Документация:
  - SECURITY_AUDIT.md - отчет о безопасности
  - DEPLOYMENT.md - руководство по развертыванию
  - CONTRIBUTING.md - руководство для контрибьюторов

### 🔧 Changed

- Обновлены зависимости:
  - next: 15.2.4 → 15.5.6
  - @eslint/eslintrc: добавлен
  - jest: добавлен
  - @testing-library/*: добавлены

### 📝 Documentation

- Добавлен comprehensive security audit report
- Добавлен deployment guide с примерами для Vercel, Docker, self-hosted
- Добавлен contributing guide с code style guidelines
- Обновлен README с новыми скриптами

### 🎯 Performance

- Уже оптимизировано:
  - Code splitting через dynamic imports
  - Ленивая загрузка компонентов
  - Виртуализация списков (@tanstack/react-virtual)
  - PWA с эффективным кэшированием
  - Оптимизация изображений
  - Realtime оптимизации

## [0.1.0] - Previous

### Initial Release

- Next.js 15 с App Router
- Supabase для backend и real-time
- Аутентификация пользователей
- Посты с markdown, медиа, аудио
- Комментарии и реакции
- Real-time уведомления
- Личные сообщения
- Система друзей
- PWA поддержка
- Dark mode
- Адаптивный дизайн
