# 🚀 Quick Reference Guide

Quick access to common tasks and important information.

---

## ⚡ Quick Commands

```bash
# Development
npm run dev                 # Start dev server

# Build
npm run build              # Production build
npm start                  # Start production server

# Code Quality
npm run lint              # Run ESLint
npm run type-check        # TypeScript check

# Clean cache
rm -rf .next node_modules
npm install
```

---

## 🔑 Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # ⚠️ Keep secret!
```

### Optional
```env
SENTRY_DSN=xxx                # Error tracking
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxx
```

---

## 🗄️ Database Quick Tasks

### Enable Realtime (Supabase Dashboard)
```
Database → Replication → Enable for:
- posts
- comments
- notifications  
- direct_messages
```

### Create Storage Buckets
```
Storage → Create Bucket:
- avatars (public)
- post-images (public)
```

### Run Migrations
```sql
-- Go to SQL Editor in Supabase Dashboard
-- Run files from supabase/migrations/ in order:
-- 001_*.sql, 002_*.sql, etc.
```

---

## 🐛 Common Issues & Quick Fixes

### WebSocket Errors
```typescript
// Already fixed in lib/security/csp.ts
// WebSocket URLs allowed in CSP
```

### Images Not Loading
```typescript
// Already fixed with /api/image-proxy
// Proxies Supabase Storage images
```

### Notifications Error
```typescript
// Already fixed in lib/api/notifications.ts
// Uses correct column names
```

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 📁 Key Files Reference

### Security
- `middleware.ts` - Security, auth, rate limiting
- `lib/security/csp.ts` - Content Security Policy
- `lib/security/headers.ts` - Security headers
- `lib/security/rate-limit.ts` - Rate limiting

### Database
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `lib/supabase/middleware.ts` - Session middleware

### API
- `lib/api/` - API client functions
- `app/api/image-proxy/` - Image proxy route

### Real-time
- `hooks/use-realtime.ts` - Generic realtime hook
- `hooks/use-notifications-realtime.ts` - Notifications
- `hooks/use-messages-realtime.ts` - Messages

---

## 🚀 Deployment Checklist

### Before Deploy
- [ ] Run `npm run build` locally
- [ ] Check all environment variables
- [ ] Test key features work
- [ ] Run Supabase migrations
- [ ] Enable Realtime for tables
- [ ] Make Storage buckets public

### Vercel Deployment
- [ ] Push to GitHub
- [ ] Import project to Vercel
- [ ] Add environment variables
- [ ] Deploy
- [ ] Test production URL

### Post-Deploy
- [ ] Check error logs in Sentry
- [ ] Test authentication flow
- [ ] Test real-time features
- [ ] Verify images load
- [ ] Check CSP headers

---

## 🔐 Security Checklist

- [ ] Never commit `.env.local`
- [ ] Never expose `SUPABASE_SERVICE_ROLE_KEY` in client
- [ ] RLS enabled on all tables
- [ ] CSP headers configured
- [ ] Rate limiting active
- [ ] Security headers set

---

## 📊 Performance Tips

### Database
```typescript
// ✅ Good - Explicit filter + limited columns
.select('id, title, created_at')
.eq('user_id', userId)
.limit(20)

// ❌ Bad - No filter, all columns
.select('*')
```

### Images
```tsx
// ✅ Good - Next.js Image
<Image src={url} alt="..." fill sizes="..." />

// ❌ Bad - Regular img
<img src={url} alt="..." />
```

### Real-time
```typescript
// ✅ Good - Cleanup subscriptions
useEffect(() => {
  const channel = supabase.channel('...')
  return () => supabase.removeChannel(channel)
}, [])
```

---

## 🆘 Getting Help

### Documentation
- Full docs: `README.md`
- Changes: `CHANGELOG.md`
- Contributing: `CONTRIBUTING.md`

### Common Locations
- Code: `app/`, `components/`, `lib/`
- Migrations: `supabase/migrations/`
- Config: `next.config.mjs`, `tsconfig.json`

### Debug Mode
```typescript
// Enable in lib/supabase/client.ts
realtime: {
  params: {
    log_level: 'debug',
    eventsPerSecond: 10,
  },
}
```

---

## 📈 Monitoring

### Supabase Dashboard
- Logs: Track API calls and errors
- Database: Query performance
- Storage: Usage stats
- Auth: User activity

### Vercel Analytics
- Performance metrics
- Real User Monitoring (RUM)
- Core Web Vitals

### Sentry
- Error tracking
- Performance monitoring
- Release tracking

---

**For full documentation, see [README.md](./README.md)**
