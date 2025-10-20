/**
 * Enhanced Middleware with Security & Performance
 * Based on Context7 Best Practices (Trust Score: 10)
 * 
 * Features:
 * - Content Security Policy (CSP)
 * - Security Headers
 * - Rate Limiting
 * - Supabase Session Management
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { updateSession } from "@/lib/supabase/middleware"
import { generateCSPHeader } from "@/lib/security/csp"
import { getSecurityHeaders } from "@/lib/security/headers"
import {
  getClientId,
  getRateLimitConfig,
  isRateLimited,
  getRateLimitHeaders,
  createRateLimitResponse,
} from "@/lib/security/rate-limit"
import { NextResponse, type NextRequest } from "next/server"

const isDev = process.env.NODE_ENV === 'development'
const isVercel = !!process.env.VERCEL
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true' || isVercel

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Rate Limiting (skip in development, Vercel, or if disabled)
  // Note: Vercel has its own DDoS protection, and our in-memory store doesn't work in serverless
  if (!isDev && !disableRateLimit && !pathname.startsWith('/_next')) {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent')
    const clientId = getClientId(ip, userAgent)
    const config = getRateLimitConfig(pathname)
    const rateLimitResult = isRateLimited(clientId, config)

    if (rateLimitResult.limited) {
      console.warn(`[Rate Limit] Client ${clientId} exceeded limit on ${pathname}`)
      return createRateLimitResponse(rateLimitResult)
    }
  }

  // 2. Update Supabase Session
  let response = await updateSession(request)

  // 3. Generate CSP with nonce
  const { nonce, cspHeader } = generateCSPHeader(isDev)

  // 4. Add Security Headers
  const securityHeaders = getSecurityHeaders(cspHeader)
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // 5. Add nonce to response headers for use in components
  response.headers.set('x-nonce', nonce)

  // 6. Add Rate Limit Headers (if not limited and rate limiting is enabled)
  if (!isDev && !disableRateLimit && !pathname.startsWith('/_next')) {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent')
    const clientId = getClientId(ip, userAgent)
    const config = getRateLimitConfig(pathname)
    const rateLimitResult = isRateLimited(clientId, config)
    const rateLimitHeaders = getRateLimitHeaders(config, rateLimitResult)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - prefetch requests
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
