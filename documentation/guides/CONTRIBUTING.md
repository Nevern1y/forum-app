# Contributing Guide

## Начало работы

### 1. Fork и Clone

```bash
git clone https://github.com/your-username/forum-app.git
cd forum-app
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

Создайте `.env.local` файл из примера:

```bash
cp .env.local.example .env.local
```

Заполните переменные окружения.

### 4. Запуск dev сервера

```bash
npm run dev
```

## Стандарты кодирования

### TypeScript

- Используйте строгую типизацию
- Избегайте `any` типов
- Экспортируйте типы из `@/lib/types`

### React

- Используйте functional components
- Используйте hooks для state management
- Мемоизируйте тяжелые компоненты с `memo()`

### Именование

- **Компоненты**: PascalCase (`PostCard`, `UserProfile`)
- **Функции**: camelCase (`calculateReadingTime`, `formatDate`)
- **Константы**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_URL`)
- **Файлы компонентов**: kebab-case (`post-card.tsx`, `user-profile.tsx`)

### Структура файлов

```
app/              # Next.js App Router pages
components/       # React компоненты
  ui/            # UI компоненты (shadcn/ui)
  feed/          # Feed-специфичные компоненты
  ...
hooks/           # Custom React hooks
lib/             # Утилиты и библиотеки
  api/          # API клиенты
  supabase/     # Supabase конфиг
  utils/        # Утилитные функции
__tests__/       # Тесты
```

## Git Workflow

### Branches

- `main` - production
- `develop` - development
- `feature/feature-name` - новые фичи
- `fix/bug-name` - исправления багов
- `refactor/description` - рефакторинг

### Commit Messages

Следуйте Conventional Commits:

```
feat: Add user profile page
fix: Fix memory leak in realtime subscription
docs: Update deployment guide
refactor: Simplify post card logic
test: Add tests for Button component
chore: Update dependencies
```

Типы:
- `feat`: Новая функциональность
- `fix`: Исправление бага
- `docs`: Документация
- `style`: Форматирование кода
- `refactor`: Рефакторинг
- `test`: Тесты
- `chore`: Обновление зависимостей, настройки

### Pull Requests

1. Создайте feature branch:
```bash
git checkout -b feature/my-feature
```

2. Сделайте изменения и коммиты

3. Проверьте код:
```bash
npm run validate  # lint + type-check + tests
```

4. Push в ваш fork:
```bash
git push origin feature/my-feature
```

5. Создайте Pull Request в GitHub

#### PR Template

```markdown
## Описание
Краткое описание изменений

## Тип изменений
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Код проходит lint
- [ ] Код проходит type-check
- [ ] Добавлены тесты
- [ ] Тесты проходят
- [ ] Документация обновлена
- [ ] Нет breaking changes
```

## Тестирование

### Unit Tests

```bash
# Запуск в watch mode
npm test

# Запуск с coverage
npm run test:coverage
```

Создавайте тесты в `__tests__/` директории:

```typescript
// __tests__/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Integration Tests

Используйте Playwright или Cypress (требуется настройка).

## Code Review

### Что проверять

- [ ] Код следует стандартам проекта
- [ ] Нет TypeScript ошибок
- [ ] Тесты написаны и проходят
- [ ] Нет console.log в production коде
- [ ] Нет хардкода секретов/URL
- [ ] Производительность оптимизирована
- [ ] Доступность (a11y) учтена
- [ ] Мобильная адаптация работает

### Комментарии

Используйте конструктивные комментарии:

✅ **Хорошо:**
```
Предлагаю использовать useMemo здесь для оптимизации:
```jsx
const sortedItems = useMemo(() => items.sort(), [items])
```
```

❌ **Плохо:**
```
Это медленно, исправь
```

## Дизайн-система

### UI Components

Используйте компоненты из `@/components/ui/`:
- Button
- Card
- Dialog
- Input
- etc.

### Tailwind CSS

Используйте utility-first подход:

```tsx
<div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
  {/* content */}
</div>
```

### Dark Mode

Все компоненты должны поддерживать dark mode:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* content */}
</div>
```

## Performance

### Оптимизация

- Используйте `dynamic()` для ленивой загрузки
- Используйте `memo()` для мемоизации
- Используйте виртуализацию для длинных списков
- Оптимизируйте изображения через Next.js Image

### Bundle Size

Проверяйте размер бандла:

```bash
npm run build
```

Избегайте больших библиотек. Используйте tree-shaking.

## Accessibility

### Требования

- Все интерактивные элементы доступны с клавиатуры
- ARIA labels для screen readers
- Контраст цветов соответствует WCAG 2.1 AA
- Focus indicators видимы

### Пример

```tsx
<button
  aria-label="Close dialog"
  onClick={onClose}
  className="focus:ring-2 focus:ring-primary"
>
  <X aria-hidden="true" />
</button>
```

## Вопросы?

- Создайте issue в GitHub
- Проверьте существующие issues
- Прочитайте документацию в `/docs`

## Лицензия

MIT License - смотрите LICENSE файл
