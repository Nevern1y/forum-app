# 🏛️ Forum App - Modern Forum Platform

Production-ready forum application built with **Next.js 15**, **Supabase**, and **TypeScript**.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run database migrations
# Go to Supabase Dashboard → SQL Editor
# Run migrations from supabase/migrations/ in order

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Development](#-development)
- [Deployment](#-deployment)
- [Security](#-security)
- [Performance](#-performance)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Core Features
- 📝 **Posts & Comments** - Rich text posts with media support
- 💬 **Real-time Chat** - WebSocket-powered direct messaging
- 🔔 **Notifications** - Real-time notifications system
- 👤 **User Profiles** - Customizable profiles with avatars
- 👥 **Friends System** - Send/accept friend requests
- ⚡ **Real-time Updates** - Live post updates via Supabase Realtime
- 🔐 **Authentication** - Secure auth with Supabase Auth

### Advanced Features
- 🎨 **Dark Mode** - System/manual theme switching
- 🖼️ **Image Optimization** - Next.js Image with CDN
- 🔍 **Search** - Full-text search across posts
- 📱 **PWA** - Installable progressive web app
- 🌐 **i18n Ready** - Internationalization support (Russian/English)

### Technical Features
- 🔒 **CSP Security** - Content Security Policy with nonce
- 🚦 **Rate Limiting** - Protection against abuse
- 📊 **Analytics** - Vercel Analytics integration
- 🐛 **Error Tracking** - Sentry error monitoring
- ⚡ **Edge Runtime** - Optimized for global deployment

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Radix UI](https://www.radix-ui.com/)** - Accessible components
- **[Lucide Icons](https://lucide.dev/)** - Icon library

### Backend
- **[Supabase](https://supabase.com/)** - Backend platform
  - **PostgreSQL** - Database
  - **Row Level Security** - Authorization
  - **Storage** - File uploads
  - **Realtime** - WebSocket subscriptions
  - **Auth** - Authentication

### DevOps
- **[Vercel](https://vercel.com/)** - Deployment platform
- **[Sentry](https://sentry.io/)** - Error tracking
- **[PWA](https://web.dev/progressive-web-apps/)** - Progressive Web App

---

## 📁 Project Structure

```
forum-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── api/                 # API routes
│   │   └── image-proxy/    # Image proxy for CORS
│   ├── feed/               # Main feed page
│   ├── messages/           # Chat pages
│   ├── notifications/      # Notifications page
│   ├── post/               # Post pages
│   ├── profile/            # User profiles
│   └── search/             # Search page
│
├── components/              # React components
│   ├── feed/               # Feed components
│   ├── layout/             # Layout components
│   ├── messages/           # Chat components
│   ├── notifications/      # Notification components
│   ├── post/               # Post components
│   └── ui/                 # Reusable UI components
│
├── hooks/                   # Custom React hooks
│   ├── use-realtime.ts     # Generic realtime hook
│   ├── use-messages-realtime.ts
│   └── use-notifications-realtime.ts
│
├── lib/                     # Utilities and configurations
│   ├── api/                # API client functions
│   ├── security/           # Security utilities
│   │   ├── csp.ts         # Content Security Policy
│   │   ├── headers.ts     # Security headers
│   │   └── rate-limit.ts  # Rate limiting
│   ├── supabase/          # Supabase clients
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── middleware.ts  # Session middleware
│   └── utils.ts           # Utility functions
│
├── public/                  # Static files
├── scripts/                 # Maintenance scripts
├── styles/                  # Global styles
├── supabase/               # Supabase configuration
│   └── migrations/        # Database migrations
│
├── middleware.ts           # Next.js middleware (security, auth)
├── next.config.mjs        # Next.js configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

---

## 🔑 Environment Setup

### 1. Create Environment File

```bash
cp .env.local.example .env.local
```

### 2. Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Sentry (for error tracking)
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 3. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

---

## 🗄️ Database Setup

### 1. Run Migrations

Go to **Supabase Dashboard → SQL Editor** and run migrations in order:

```sql
-- 1. Core tables (users, posts, comments)
-- Run: supabase/migrations/001_*.sql

-- 2. RLS policies
-- Run: supabase/migrations/002_*.sql

-- 3. Functions and triggers
-- Run: supabase/migrations/003_*.sql

-- ... and so on
```

### 2. Enable Realtime

Go to **Database → Replication** and enable for:
- `posts`
- `comments`
- `notifications`
- `direct_messages`

### 3. Configure Storage

**Settings → Storage:**

1. Create buckets:
   - `avatars` (public)
   - `post-images` (public)

2. Set CORS:
```json
{
  "allowedOrigins": ["*"],
  "allowedMethods": ["GET", "HEAD"],
  "allowedHeaders": ["*"],
  "maxAgeSeconds": 3600
}
```

3. Make buckets public:
   - Bucket settings → Enable "Public bucket"

---

## 💻 Development

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables
   - Deploy!

3. **Set Environment Variables**
   - Add all variables from `.env.local`
   - Make sure to add `NEXT_PUBLIC_*` variables

### Environment Variables on Vercel

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
```

---

## 🔐 Security

### Implemented Security Features

1. **Content Security Policy (CSP)**
   - Nonce-based inline script security
   - Strict CSP in production
   - Configured in `lib/security/csp.ts`

2. **Security Headers**
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - Configured in `lib/security/headers.ts`

3. **Rate Limiting**
   - Per-route rate limits
   - Protection against brute force
   - Configured in `lib/security/rate-limit.ts`

4. **Row Level Security (RLS)**
   - All database tables protected
   - Users can only access their data
   - Configured in Supabase migrations

### Security Best Practices

✅ **Do:**
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use environment variables for secrets
- Never commit `.env.local` or `.env.development`
- Regularly update dependencies
- Review Supabase logs for suspicious activity

❌ **Don't:**
- Expose service role key in client code
- Disable RLS policies
- Trust client-side data
- Store secrets in code

---

## ⚡ Performance

### Optimizations Implemented

1. **Next.js Optimizations**
   - Image optimization with `next/image`
   - Font optimization with `next/font`
   - Bundle optimization with tree-shaking
   - Route prefetching

2. **Database Optimizations**
   - Indexed columns for fast queries
   - Explicit filters in all queries
   - Column selection (no `SELECT *`)
   - Safe pagination limits

3. **Caching**
   - API route caching
   - Static page generation
   - PWA offline support
   - Service worker caching

4. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting
   - Lazy loading images

### Performance Metrics

Target metrics:
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Cumulative Layout Shift (CLS):** < 0.1

---

## 🐛 Troubleshooting

### Common Issues

#### 1. WebSocket Errors
```
Error: WebSocket not available
```

**Solution:**
- Check CSP allows WebSocket URLs
- Verify Supabase Realtime is enabled
- See `lib/security/csp.ts` for WebSocket configuration

#### 2. Image Not Loading
```
Error: Cross-Origin-Resource-Policy blocked
```

**Solution:**
- Images from Supabase Storage proxied via `/api/image-proxy`
- Check `app/api/image-proxy/route.ts`
- Verify Storage bucket is public

#### 3. Notifications Not Working
```
Error: column does not exist
```

**Solution:**
- Run all database migrations
- Check `lib/api/notifications.ts` for column names
- Verify table schema in Supabase

#### 4. Build Errors
```
Error: Module not found
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Debug Mode

Enable debug logging:
```typescript
// In lib/supabase/client.ts
realtime: {
  params: {
    log_level: 'debug', // Shows detailed logs
    eventsPerSecond: 10,
  },
}
```

---

## 📚 Additional Documentation

### Key Files to Understand

1. **`middleware.ts`** - Security, auth, rate limiting
2. **`lib/security/`** - Security utilities (CSP, headers, rate limit)
3. **`lib/supabase/`** - Database client configuration
4. **`hooks/use-realtime.ts`** - Real-time subscriptions
5. **`app/api/image-proxy/`** - Image proxy for CORS issues

### Database Schema

Main tables:
- `profiles` - User profiles
- `posts` - Forum posts
- `comments` - Post comments
- `direct_messages` - Chat messages
- `notifications` - User notifications
- `friendships` - Friend relationships
- `subscriptions` - Post subscriptions

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - Amazing React framework
- [Supabase](https://supabase.com/) - Best backend platform
- [Vercel](https://vercel.com/) - Seamless deployment
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful components

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email:** your-email@example.com

---

**Built with ❤️ using Next.js and Supabase**
