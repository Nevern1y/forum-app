# 🚀 Vercel Deployment Guide

Complete step-by-step guide to deploy your forum app to Vercel without errors.

---

## ✅ Pre-Deployment Checklist

### 1. Local Build Test
```bash
# Clean build
npm run clean
npm install --legacy-peer-deps

# Test build (MUST pass without errors!)
npm run build

# Test production server
npm start
```

**If build fails:**
- Check error messages
- Fix TypeScript errors: `npm run type-check`
- Fix ESLint errors: `npm run lint:fix`
- Ensure all imports are correct

### 2. Environment Variables Ready
Have these ready from Supabase Dashboard:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRET!)

Optional (Sentry):
- `SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

### 3. Git Repository
```bash
# Check git status
git status

# Commit all changes
git add .
git commit -m "feat: prepare for Vercel deployment"

# Push to GitHub
git push origin main
```

---

## 🔧 Step 1: Prepare Supabase

### A. Enable Realtime
1. Go to **Supabase Dashboard → Database → Replication**
2. Enable Realtime for tables:
   - ✅ `posts`
   - ✅ `comments`
   - ✅ `notifications`
   - ✅ `direct_messages`

### B. Configure Storage
1. **Storage → Create Buckets:**
   - `avatars` (Public)
   - `post-images` (Public)

2. **Make buckets public:**
   - Go to bucket settings
   - Enable "Public bucket"

3. **Configure CORS:**
```json
{
  "allowedOrigins": ["*"],
  "allowedMethods": ["GET", "HEAD"],
  "allowedHeaders": ["*"],
  "maxAgeSeconds": 3600
}
```

### C. Run Migrations
Go to **SQL Editor** and run migrations in order:
```
supabase/migrations/001_*.sql
supabase/migrations/002_*.sql
...
supabase/migrations/036_*.sql
```

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

#### 1. Import Project
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. **Import Git Repository**
   - Connect GitHub if not connected
   - Select your forum-app repository
4. Click **"Import"**

#### 2. Configure Project
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (leave default)
- **Build Command:** `npm run build` (auto-detected)
- **Install Command:** `npm install --legacy-peer-deps`

#### 3. Add Environment Variables
Click **"Environment Variables"** and add:

```bash
# Required (Production)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional (Sentry)
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_token
```

**Important:**
- ✅ Select **"Production"** environment
- ✅ Also add to **"Preview"** and **"Development"** if needed
- ⚠️ Never commit these to git!

#### 4. Deploy
1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. If build succeeds → ✅ Done!
4. If build fails → See [Troubleshooting](#troubleshooting)

---

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? Select your account
# - Link to existing project? N (for first time)
# - Project name? forum-app (or custom)
# - Directory? ./ (press enter)
# - Override settings? N

# Deploy to production
vercel --prod
```

---

## ⚙️ Step 3: Configure Vercel Project Settings

After successful deployment:

### A. Domain Settings
1. Go to **Project Settings → Domains**
2. Add custom domain (optional)
3. Configure DNS records

### B. Environment Variables
1. **Settings → Environment Variables**
2. Verify all variables are set
3. For sensitive keys, click "Hide" option

### C. Build & Development Settings
- **Framework:** Next.js
- **Node.js Version:** 20.x (latest LTS)
- **Install Command:** `npm install --legacy-peer-deps`
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (default)

### D. Functions Configuration
- **Region:** Washington, D.C., USA (iad1) - closest to Supabase
- **Runtime:** Node.js 20.x
- **Max Duration:** 10s (free tier) / 60s (pro)

---

## 🔍 Step 4: Verify Deployment

### A. Check Build Logs
1. Go to **Deployments**
2. Click on latest deployment
3. View **Build Logs** - should show:
   ```
   ✓ Compiled successfully
   ✓ Linting and checking validity of types
   ✓ Collecting page data
   ✓ Generating static pages
   ✓ Finalizing page optimization
   ```

### B. Test Production Site
Visit your Vercel URL and test:

1. **Home Page** (`/`)
   - ✅ Loads without errors
   - ✅ Images display correctly

2. **Authentication** (`/login`, `/sign-up`)
   - ✅ Can create account
   - ✅ Can login
   - ✅ Redirects work

3. **Core Features**
   - ✅ Feed loads posts
   - ✅ Can create post
   - ✅ Comments work
   - ✅ Notifications work
   - ✅ Messages work

4. **Real-time**
   - ✅ New notifications appear
   - ✅ New messages appear
   - ✅ WebSocket connects

### C. Check Browser Console
- ❌ No errors in console
- ❌ No CSP violations
- ❌ No network errors

---

## 🐛 Troubleshooting

### Build Fails: TypeScript Errors
```bash
# Check locally
npm run type-check

# Fix errors, then commit and push
git add .
git commit -m "fix: TypeScript errors"
git push origin main
```

### Build Fails: ESLint Errors
```bash
# Fix linting errors
npm run lint:fix

# Commit and push
git add .
git commit -m "fix: linting errors"
git push origin main
```

### Build Fails: Module Not Found
```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Test build
npm run build

# If works, commit and push
git add package-lock.json
git commit -m "fix: update dependencies"
git push origin main
```

### Runtime Error: Environment Variables Missing
1. Go to **Vercel → Settings → Environment Variables**
2. Check all required variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy: **Deployments → ... → Redeploy**

### Runtime Error: Database Errors
1. Check Supabase Dashboard → Logs
2. Verify RLS policies are correct
3. Verify migrations ran successfully
4. Check that realtime is enabled

### Images Not Loading
1. Check Supabase Storage buckets are public
2. Check CORS configuration
3. Verify image URLs in database
4. Check `/api/image-proxy` route works

### WebSocket Errors
1. Check CSP allows WebSocket URLs
2. Verify realtime is enabled in Supabase
3. Check browser console for CSP violations

---

## 🔄 Redeployment

### Automatic Redeployment
Vercel automatically redeploys when you push to `main`:

```bash
git add .
git commit -m "feat: new feature"
git push origin main
# Vercel will auto-deploy
```

### Manual Redeployment
1. Go to **Deployments**
2. Find deployment
3. Click **"..."** → **"Redeploy"**

### Rollback
If deployment breaks:
1. Go to **Deployments**
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

---

## 📊 Post-Deployment Monitoring

### A. Vercel Analytics
1. **Analytics** tab shows:
   - Page views
   - Unique visitors
   - Performance metrics
   - Core Web Vitals

### B. Error Tracking (Sentry)
1. Check Sentry dashboard
2. Monitor error rates
3. Set up alerts

### C. Supabase Monitoring
1. **Supabase Dashboard → Logs**
2. Monitor:
   - API requests
   - Database queries
   - Storage usage
   - Auth events

---

## ⚡ Performance Optimization

### A. Edge Caching
Already configured in middleware and API routes.

### B. Image Optimization
- Uses Next.js Image component
- Automatic WebP/AVIF conversion
- Lazy loading enabled

### C. Bundle Size
Check in build logs:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    155 B           101 kB
├ ○ /feed                                5.05 kB         158 kB
└ ○ /messages                            8.23 kB         156 kB
```

---

## 🔐 Security Checklist

After deployment, verify:

### Headers
```bash
# Check security headers
curl -I https://your-app.vercel.app

# Should include:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: ...
```

### Environment Variables
- ✅ All secrets in Vercel dashboard
- ❌ No secrets in code or git
- ✅ `.env.local` in `.gitignore`

### API Protection
- ✅ Rate limiting active
- ✅ RLS policies enabled
- ✅ Authentication required

---

## 📝 Quick Reference

### Vercel CLI Commands
```bash
vercel                  # Deploy to preview
vercel --prod          # Deploy to production
vercel domains         # List domains
vercel env ls          # List environment variables
vercel logs            # View logs
vercel inspect         # Inspect deployment
```

### Useful URLs
- **Dashboard:** https://vercel.com/dashboard
- **Docs:** https://vercel.com/docs
- **Status:** https://www.vercel-status.com/
- **Support:** https://vercel.com/support

---

## 🆘 Getting Help

### Build Fails?
1. Read error message carefully
2. Check build logs in Vercel
3. Test build locally first
4. Search error in documentation

### Runtime Errors?
1. Check Vercel logs: `vercel logs`
2. Check browser console
3. Check Sentry (if configured)
4. Check Supabase logs

### Still Stuck?
- Check [Vercel Discord](https://vercel.com/discord)
- Check [Supabase Discord](https://discord.supabase.com/)
- Check [Next.js Discussions](https://github.com/vercel/next.js/discussions)

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Build completes without errors  
✅ Site loads at Vercel URL  
✅ Authentication works  
✅ Can create posts/comments  
✅ Real-time features work  
✅ Images display correctly  
✅ No console errors  
✅ Performance is good (< 3s load time)  

---

**Congratulations! Your forum app is now live on Vercel! 🚀**

For ongoing maintenance, see [README.md](./README.md) and [QUICK_REFERENCE.md](./QUICK_REFERENCE.md).
