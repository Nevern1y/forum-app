# ✅ Pre-Deployment Checklist

Quick checklist before deploying to Vercel.

---

## 🔍 Step 1: Code Quality (5 min)

### Run All Checks
```bash
# TypeScript check
npm run type-check

# Linting
npm run lint

# Both together
npm run validate
```

### Expected Result
```
✅ No TypeScript errors
✅ No ESLint errors
✅ Tests pass (if any)
```

---

## 🏗️ Step 2: Build Test (5 min)

### Clean Build
```bash
# Clean cache
npm run clean

# Reinstall dependencies
npm install --legacy-peer-deps

# Build for production
npm run build
```

### Expected Output
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (x/x)
✓ Finalizing page optimization
✓ Collecting build traces

Route (app)                              Size
┌ ○ /                                    155 B
├ ○ /feed                                5.05 kB
├ ○ /messages                            8.23 kB
...
```

### If Build Fails
1. Read error message
2. Fix the error
3. Run `npm run build` again
4. Must succeed before deploying!

---

## 🔑 Step 3: Environment Variables (2 min)

### Required Variables (from Supabase Dashboard)
```bash
✅ NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
✅ SUPABASE_SERVICE_ROLE_KEY=eyJ... (SECRET!)
```

### Optional (Sentry)
```bash
□ SENTRY_DSN=https://...
□ SENTRY_ORG=...
□ SENTRY_PROJECT=...
□ SENTRY_AUTH_TOKEN=...
```

### Verify Locally
```bash
# Check .env.local exists
ls .env.local

# Test with dev server
npm run dev
```

---

## 🗄️ Step 4: Database Ready (10 min)

### A. Migrations Applied
```bash
✅ All migrations in supabase/migrations/ applied
✅ Check in Supabase Dashboard → Database → Migrations
```

### B. Realtime Enabled
```bash
✅ Database → Replication → Enabled for:
   - posts
   - comments  
   - notifications
   - direct_messages
```

### C. Storage Configured
```bash
✅ Storage → Buckets created:
   - avatars (Public)
   - post-images (Public)

✅ CORS configured for both buckets
```

### D. RLS Policies Active
```bash
✅ Database → Tables → Check RLS enabled for all tables
```

---

## 📦 Step 5: Git Ready (2 min)

### Commit All Changes
```bash
# Check status
git status

# Add all files
git add .

# Commit with meaningful message
git commit -m "feat: prepare for Vercel deployment

- Optimized build configuration
- Updated environment variables
- Fixed all TypeScript errors
- Ready for production"

# Push to GitHub
git push origin main
```

### Verify on GitHub
```bash
✅ All files pushed
✅ No merge conflicts
✅ Repository is up-to-date
```

---

## 🌐 Step 6: Vercel Account Ready (1 min)

### Account Setup
```bash
✅ Have Vercel account (vercel.com)
✅ GitHub connected to Vercel
✅ Can see repositories
```

### CLI (Optional)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

---

## 📋 Final Checklist

Before clicking "Deploy":

### Code
- [ ] ✅ `npm run build` succeeds
- [ ] ✅ `npm run type-check` passes
- [ ] ✅ `npm run lint` passes
- [ ] ✅ All changes committed
- [ ] ✅ Pushed to GitHub

### Database
- [ ] ✅ Migrations applied
- [ ] ✅ Realtime enabled
- [ ] ✅ Storage buckets public
- [ ] ✅ RLS policies active

### Configuration
- [ ] ✅ Environment variables ready
- [ ] ✅ Supabase URL and keys correct
- [ ] ✅ `.env.local.example` updated

### Vercel
- [ ] ✅ Vercel account ready
- [ ] ✅ GitHub connected
- [ ] ✅ Ready to import project

---

## 🚀 Ready to Deploy!

If all boxes are checked:

### Method 1: Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Add environment variables
4. Click "Deploy"

### Method 2: CLI
```bash
vercel --prod
```

---

## ⏱️ Estimated Timeline

| Step | Time | Can Skip? |
|------|------|-----------|
| Code Quality | 5 min | ❌ No |
| Build Test | 5 min | ❌ No |
| Environment Vars | 2 min | ❌ No |
| Database Setup | 10 min | ❌ No |
| Git Push | 2 min | ❌ No |
| Vercel Setup | 1 min | ❌ No |
| **Total** | **~25 min** | |
| Deploy Time | 3-5 min | Wait |

---

## 🆘 Common Issues

### Build Fails Locally
```bash
# Clean everything
npm run clean
rm -rf node_modules package-lock.json

# Reinstall
npm install --legacy-peer-deps

# Try again
npm run build
```

### Environment Variables Missing
```bash
# Copy example
cp .env.local.example .env.local

# Edit with your values
# Use Supabase Dashboard → Settings → API
```

### Git Push Fails
```bash
# Pull latest changes
git pull origin main

# Resolve conflicts
# Then push again
git push origin main
```

---

## ✅ Success Criteria

You're ready when:

1. ✅ Local build succeeds without errors
2. ✅ All code quality checks pass
3. ✅ Environment variables ready
4. ✅ Database fully configured
5. ✅ Code pushed to GitHub
6. ✅ Vercel account ready

---

## 📚 Detailed Instructions

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for:
- Complete step-by-step guide
- Troubleshooting
- Post-deployment verification
- Performance optimization

---

**Use this checklist every time before deploying!**

**Ready? Let's deploy! 🚀**
