# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-01-20

### 🔐 Security Enhancements
- Added Content Security Policy (CSP) with nonce-based inline script protection
- Implemented security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Added rate limiting per route to prevent abuse
- Enhanced Row Level Security (RLS) policies

### ⚡ Performance Optimizations  
- Optimized database queries with explicit filters and column selection
- Added proper indexes for frequently queried columns
- Implemented Next.js Image optimization for all images
- Added image proxy API route to fix CORS issues
- Optimized bundle size with tree-shaking and code splitting

### 🔄 Real-time Features
- Fixed WebSocket support in Content Security Policy
- Improved real-time hooks with proper cleanup
- Fixed React Hooks violations (conditional hook calling)
- Added automatic reconnection with exponential backoff
- Enhanced error handling for Realtime subscriptions

### 🖼️ Media & Images
- Created `/api/image-proxy` route for Supabase Storage images
- Fixed Cross-Origin-Resource-Policy (CORP) issues
- Optimized image loading with Next.js Image component
- Added proper error handling for failed image loads

### 🐛 Bug Fixes
- Fixed notifications API column errors
- Fixed Edge Runtime compatibility (replaced Node.js crypto with Web Crypto API)
- Fixed duplicate image paths in storage URLs
- Improved error messages with detailed logging
- Fixed React Hooks order violations

### 📝 Code Quality
- Migrated to TypeScript strict mode
- Added comprehensive error handling
- Improved code organization and structure
- Added proper TypeScript types throughout

### 🛠️ Developer Experience
- Created comprehensive README with setup instructions
- Cleaned up project documentation
- Organized SQL migrations properly
- Added troubleshooting guides in README

---

## [1.0.0] - 2025-10-13

### Initial Release
- Basic forum functionality
- User authentication
- Posts and comments
- Direct messaging
- Notifications
- Friend system
