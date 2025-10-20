/**
 * Rate Limiting Utilities
 * Based on Supabase Context7 Best Practices
 */

interface RateLimitConfig {
  interval: number
  max: number
}

const rateLimitStore = new Map<string, number[]>()

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  AUTH_API: { interval: 15 * 60 * 1000, max: 10 }, // API auth endpoints only
  API_GENERAL: { interval: 60 * 1000, max: 100 },
  API_READ: { interval: 60 * 1000, max: 200 },
  PAGE: { interval: 60 * 1000, max: 500 }, // Very permissive for pages
}

export function getClientId(ip: string, userAgent: string | null): string {
  return `${ip}:${userAgent || 'unknown'}`
}

export function isRateLimited(clientId: string, config: RateLimitConfig) {
  const now = Date.now()
  const windowStart = now - config.interval
  const clientRequests = rateLimitStore.get(clientId) || []
  const recentRequests = clientRequests.filter(time => time > windowStart)
  const limited = recentRequests.length >= config.max
  const remaining = Math.max(0, config.max - recentRequests.length - 1)
  const resetAt = new Date(now + config.interval)

  if (!limited) {
    recentRequests.push(now)
    rateLimitStore.set(clientId, recentRequests)
  }

  return { limited, remaining, resetAt }
}

export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // API endpoints have stricter limits
  if (pathname.startsWith('/api/auth/')) return RATE_LIMITS.AUTH_API
  if (pathname.startsWith('/api/')) return RATE_LIMITS.API_GENERAL
  
  // Pages have very permissive limits (just to prevent DDoS)
  return RATE_LIMITS.PAGE
}

export function getRateLimitHeaders(config: RateLimitConfig, result: ReturnType<typeof isRateLimited>) {
  return {
    'X-RateLimit-Limit': config.max.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  }
}

export function createRateLimitResponse(result: ReturnType<typeof isRateLimited>): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      resetAt: result.resetAt.toISOString(),
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  )
}
