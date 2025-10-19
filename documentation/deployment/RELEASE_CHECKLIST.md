# Release Checklist

Используйте этот чеклист перед каждым production release.

## Pre-Release

### Code Quality
- [ ] Все TypeScript ошибки исправлены (`npm run type-check`)
- [ ] Все ESLint warnings исправлены (`npm run lint`)
- [ ] Code coverage >= 70% (`npm run test:coverage`)
- [ ] Все тесты проходят (`npm run test:ci`)

### Security
- [ ] Нет уязвимостей в зависимостях (`npm audit`)
- [ ] Secrets не хранятся в коде
- [ ] Environment variables правильно настроены
- [ ] CORS правильно настроен
- [ ] Rate limiting включен (если applicable)

### Performance
- [ ] Bundle size проверен (`npm run build`)
- [ ] Lighthouse score >= 90
- [ ] Images оптимизированы
- [ ] No memory leaks
- [ ] Database queries оптимизированы

### Functionality
- [ ] Аутентификация работает
- [ ] Регистрация работает
- [ ] Создание постов работает
- [ ] Комментарии работают
- [ ] Реакции работают
- [ ] Уведомления работают
- [ ] Сообщения работают
- [ ] Real-time работает
- [ ] Загрузка медиа работает
- [ ] PWA работает

### Mobile & Accessibility
- [ ] Responsive design проверен
- [ ] Тестировано на iOS
- [ ] Тестировано на Android
- [ ] Keyboard navigation работает
- [ ] Screen reader compatibility
- [ ] Color contrast соответствует WCAG 2.1 AA

### Documentation
- [ ] README обновлен
- [ ] CHANGELOG обновлен
- [ ] API документация актуальна
- [ ] Environment variables документированы

## Deployment

### Pre-Deployment
- [ ] Backup базы данных создан
- [ ] Rollback plan готов
- [ ] Maintenance window запланирован (если нужен)
- [ ] Team уведомлена

### Deployment Steps
- [ ] Environment variables настроены
- [ ] Database migrations выполнены
- [ ] Build успешно собран
- [ ] Deploy выполнен

### Post-Deployment
- [ ] Health check endpoints отвечают
- [ ] Smoke tests проходят
- [ ] Error rate в норме (Sentry)
- [ ] Performance metrics в норме
- [ ] Real-time connections работают
- [ ] Database connections стабильны

## Post-Release

### Monitoring (первые 24 часа)
- [ ] Sentry errors проверены
- [ ] Vercel Analytics проверен
- [ ] Database performance проверен
- [ ] API response times проверены
- [ ] User feedback собран

### Communication
- [ ] Release notes опубликованы
- [ ] Users уведомлены о новых фичах
- [ ] Team получила feedback
- [ ] Known issues документированы

## Rollback Plan

Если что-то пошло не так:

1. **Vercel**: Promote предыдущий deployment
2. **Self-hosted**: 
   ```bash
   git revert HEAD
   npm run build
   pm2 restart app
   ```
3. **Database**: Restore из backup
4. **Уведомить team и users**

## Version Naming

Используйте Semantic Versioning (semver):

- **MAJOR.MINOR.PATCH** (например, 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: Новые фичи (backwards compatible)
- **PATCH**: Bug fixes

## Release Types

### Hotfix
- Критические bug fixes
- Security patches
- Минимальное тестирование
- Immediate deployment

### Regular Release
- Новые фичи
- Bug fixes
- Полное тестирование
- Scheduled deployment

### Major Release
- Breaking changes
- Значительные новые фичи
- Extensive testing
- Coordinated deployment

## Contacts

- **DevOps**: [email]
- **Security**: [email]
- **Product**: [email]
- **Support**: [email]
