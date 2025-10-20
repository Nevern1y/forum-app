# 📚 Documentation

Additional project documentation and resources.

---

## 📖 Main Documentation

The primary documentation is in the root:

- **[../README.md](../README.md)** - Main project documentation
- **[../QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Quick reference guide
- **[../CHANGELOG.md](../CHANGELOG.md)** - Version history
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - Contributing guidelines
- **[../PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md)** - Project summary

---

## 🗄️ SQL Scripts

SQL migration and utility scripts:

### Location
`docs/sql/` - Database scripts for Supabase

### Available Scripts
- `FIX_ALL_REALTIME_NOW.sql` - Fix realtime subscriptions
- `FIX_GET_OR_CREATE_CONVERSATION.sql` - Fix conversation creation
- `FIX_NOTIFICATIONS.sql` - Fix notifications
- `DEBUG_FRIENDS.sql` - Debug friends system
- `CHECK_*.sql` - Various diagnostic scripts

### Usage
1. Go to Supabase Dashboard → SQL Editor
2. Copy script content
3. Execute in SQL Editor

---

## 🚀 Quick Start

For quick setup instructions:

1. **Setup:** See [../README.md](../README.md) → Quick Start
2. **Database:** Run migrations from `supabase/migrations/`
3. **SQL Fixes:** Run scripts from `docs/sql/` if needed
4. **Troubleshooting:** See [../QUICK_REFERENCE.md](../QUICK_REFERENCE.md)

---

## 📁 Additional Resources

### Supabase Migrations
Location: `../supabase/migrations/`

Run these in order:
```
001_*.sql
002_*.sql
003_*.sql
...
```

### Scripts
Location: `../scripts/`

Maintenance and backup scripts.

---

## 🆘 Need Help?

1. Check main [README.md](../README.md)
2. See [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) for common issues
3. Review SQL scripts in `sql/` for database issues

---

**For full documentation, start with [../README.md](../README.md)**
