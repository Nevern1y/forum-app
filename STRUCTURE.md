# 📁 Project Structure

Clean and organized project structure.

---

## 🗂️ Root Structure

```
forum-app/
├── 📁 app/                     # Next.js App Router (main application)
├── 📁 components/              # React components
├── 📁 docs/                    # Documentation & SQL scripts
├── 📁 hooks/                   # Custom React hooks
├── 📁 lib/                     # Core libraries & utilities
├── 📁 public/                  # Static assets
├── 📁 scripts/                 # Maintenance scripts
├── 📁 styles/                  # Global styles
├── 📁 supabase/                # Supabase configuration
├── 📁 __tests__/               # Test files
│
├── 📄 .editorconfig            # Editor configuration
├── 📄 .env.local.example       # Environment variables template
├── 📄 .gitignore              # Git ignore rules
├── 📄 .prettierrc             # Code formatting rules
├── 📄 middleware.ts           # Next.js middleware (security, auth)
├── 📄 next.config.mjs         # Next.js configuration
├── 📄 package.json            # Dependencies
├── 📄 tsconfig.json           # TypeScript configuration
│
├── 📘 README.md               # Main documentation
├── 📘 QUICK_REFERENCE.md      # Quick reference guide
├── 📘 CHANGELOG.md            # Version history
├── 📘 CONTRIBUTING.md         # Contributing guidelines
├── 📘 PROJECT_SUMMARY.md      # Project overview
└── 📘 STRUCTURE.md            # This file
```

---

## 📱 App Directory (`app/`)

```
app/
├── (auth)/                     # Authentication pages
│   ├── login/                 # Login page
│   └── sign-up/               # Sign up page
│
├── api/                       # API routes
│   └── image-proxy/          # Image proxy for CORS
│
├── feed/                      # Main feed page
├── messages/                  # Chat/messaging
│   └── [username]/           # User chat page
├── notifications/             # Notifications page
├── post/                      # Post pages
│   └── [id]/                 # Individual post
├── profile/                   # User profiles
│   └── [username]/           # User profile page
├── search/                    # Search page
├── settings/                  # Settings pages
│
├── layout.tsx                # Root layout
├── page.tsx                  # Home page
└── global-error.tsx          # Global error handler
```

---

## 🧩 Components (`components/`)

```
components/
├── feed/                      # Feed components
│   ├── infinite-post-list.tsx
│   ├── post-card.tsx
│   └── ...
│
├── layout/                    # Layout components
│   ├── header.tsx
│   ├── navigation-sidebar.tsx
│   ├── mobile-navigation.tsx
│   └── ...
│
├── messages/                  # Chat components
│   ├── chat-window.tsx
│   ├── messages-content.tsx
│   └── ...
│
├── notifications/             # Notification components
│   ├── notification-bell.tsx
│   ├── notification-list.tsx
│   └── ...
│
├── post/                      # Post components
│   ├── post-form.tsx
│   ├── comment-list.tsx
│   └── ...
│
├── ui/                        # Reusable UI components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ... (shadcn/ui components)
│
├── media/                     # Media components
│   ├── image-uploader.tsx
│   ├── audio-player.tsx
│   └── ...
│
└── presence/                  # Presence indicators
    └── online-indicator.tsx
```

---

## 🪝 Hooks (`hooks/`)

```
hooks/
├── use-realtime.ts            # Generic realtime hook
├── use-notifications-realtime.ts
├── use-messages-realtime.ts
└── ... (other custom hooks)
```

---

## 📚 Library (`lib/`)

```
lib/
├── api/                       # API client functions
│   ├── comments.ts
│   ├── friends.ts
│   ├── messages.ts
│   ├── notifications.ts
│   ├── posts.ts
│   ├── search.ts
│   └── subscriptions.ts
│
├── security/                  # Security utilities
│   ├── csp.ts                # Content Security Policy
│   ├── headers.ts            # Security headers
│   └── rate-limit.ts         # Rate limiting
│
├── supabase/                  # Supabase clients
│   ├── client.ts             # Browser client
│   ├── server.ts             # Server client
│   ├── middleware.ts         # Session middleware
│   └── query-helpers.ts      # Query utilities
│
├── types/                     # TypeScript types
│   └── database.types.ts
│
└── utils.ts                   # Utility functions
```

---

## 🗄️ Database (`supabase/`)

```
supabase/
├── migrations/                # SQL migrations
│   ├── 001_*.sql
│   ├── 002_*.sql
│   ├── ...
│   └── 036_*.sql
│
├── config.toml               # Supabase config
└── seed.sql                  # Seed data (if any)
```

---

## 📖 Documentation (`docs/`)

```
docs/
├── sql/                       # SQL utility scripts
│   ├── FIX_ALL_REALTIME_NOW.sql
│   ├── FIX_NOTIFICATIONS.sql
│   ├── DEBUG_FRIENDS.sql
│   └── CHECK_*.sql
│
└── README.md                  # Documentation index
```

---

## 🧪 Tests (`__tests__/`)

```
__tests__/
├── components/                # Component tests
├── hooks/                     # Hook tests
├── lib/                       # Library tests
└── ... (test files)
```

---

## 🎨 Styles (`styles/`)

```
styles/
└── globals.css               # Global CSS
```

---

## 📦 Public (`public/`)

```
public/
├── icons/                     # App icons
├── images/                    # Static images
└── ... (static assets)
```

---

## 🔧 Scripts (`scripts/`)

```
scripts/
└── ... (maintenance scripts)
```

---

## 🔑 Key Files Explained

### Configuration Files
- **`.editorconfig`** - Editor settings (spacing, formatting)
- **`.prettierrc`** - Code formatting rules
- **`.env.local.example`** - Template for environment variables
- **`tsconfig.json`** - TypeScript compiler options
- **`next.config.mjs`** - Next.js configuration (images, security)
- **`components.json`** - shadcn/ui configuration
- **`jest.config.js`** - Testing configuration

### Security Files
- **`middleware.ts`** - Next.js middleware
  - Content Security Policy (CSP)
  - Security headers
  - Rate limiting
  - Session management

### Core Files
- **`instrumentation.ts`** - Sentry initialization
- **`sentry.*.config.ts`** - Sentry configurations

### Documentation Files (Root)
- **`README.md`** - Main documentation (START HERE)
- **`QUICK_REFERENCE.md`** - Quick commands & troubleshooting
- **`CHANGELOG.md`** - Version history & changes
- **`CONTRIBUTING.md`** - How to contribute
- **`PROJECT_SUMMARY.md`** - Project overview
- **`STRUCTURE.md`** - This file

---

## 📊 Statistics

### Total Structure
- **Directories:** ~30 main folders
- **Components:** ~80+ React components
- **Hooks:** ~10+ custom hooks
- **API Functions:** ~20+ functions
- **Migrations:** ~36 SQL migrations
- **Documentation:** 5 main docs + SQL scripts

### Code Organization
- ✅ Clear separation of concerns
- ✅ Modular architecture
- ✅ Type-safe with TypeScript
- ✅ Well-documented code
- ✅ Consistent naming conventions

---

## 🎯 Best Practices Implemented

### Code Organization
- ✅ Feature-based folder structure
- ✅ Reusable components in `ui/`
- ✅ Centralized API calls in `lib/api/`
- ✅ Custom hooks for logic reuse
- ✅ Type definitions in `lib/types/`

### Security
- ✅ Security utilities in `lib/security/`
- ✅ Middleware for auth and protection
- ✅ Environment variable examples
- ✅ `.gitignore` configured properly

### Documentation
- ✅ Main docs in root (easy to find)
- ✅ Technical docs in `docs/`
- ✅ SQL scripts organized
- ✅ Inline code comments

### Development
- ✅ Testing setup ready
- ✅ Code formatting configured
- ✅ Editor config for consistency
- ✅ Scripts for maintenance

---

## 🚀 Quick Navigation

### For Developers
1. **Start:** `README.md`
2. **Setup:** `README.md` → Quick Start
3. **Structure:** This file (`STRUCTURE.md`)
4. **Code:** `app/`, `components/`, `lib/`

### For Database
1. **Migrations:** `supabase/migrations/`
2. **SQL Scripts:** `docs/sql/`
3. **Types:** `lib/types/database.types.ts`

### For Security
1. **Middleware:** `middleware.ts`
2. **Security Utils:** `lib/security/`
3. **Config:** `next.config.mjs`

---

**Clean, organized, and production-ready structure! 🎉**
