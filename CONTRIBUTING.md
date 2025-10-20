# Contributing to Forum App

Thank you for your interest in contributing! 🎉

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/forum-app.git
   cd forum-app
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Code Guidelines

### TypeScript
- Use TypeScript for all new code
- Avoid `any` types - use proper types
- Export types/interfaces for reusability

### React
- Use functional components with hooks
- Follow React Hooks rules (no conditional hooks)
- Use proper dependency arrays in useEffect

### Naming Conventions
- **Components:** PascalCase (`UserProfile.tsx`)
- **Files:** kebab-case (`user-profile.tsx`)
- **Functions:** camelCase (`getUserData`)
- **Constants:** UPPER_SNAKE_CASE (`API_ENDPOINT`)

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npm run type-check

# Build to check for errors
npm run build
```

## 📤 Submitting Changes

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

2. **Use conventional commits**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `perf:` - Performance improvements
   - `test:` - Adding tests
   - `chore:` - Build process or auxiliary tool changes

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template
   - Submit!

## 🐛 Reporting Bugs

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment info (OS, browser, Node version)

## 💡 Feature Requests

We welcome feature requests! Please:
- Check if the feature already exists
- Clearly describe the feature
- Explain why it would be useful
- Provide examples if possible

## 🔐 Security

For security issues, please **DO NOT** open a public issue.
Instead, email: [your-security-email@example.com]

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🙏
