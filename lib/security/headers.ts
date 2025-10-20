/**
 * Security Headers Configuration
 * Based on Context7 Best Practices
 * 
 * These headers protect against common web vulnerabilities:
 * - XSS attacks
 * - Clickjacking
 * - MIME sniffing
 * - Information leakage
 */

export interface SecurityHeaders {
  [key: string]: string
}

/**
 * Get all security headers for the application
 * Context7 Best Practice: Defense in depth
 */
export function getSecurityHeaders(cspHeader: string): SecurityHeaders {
  return {
    // Content Security Policy
    'Content-Security-Policy': cspHeader,
    
    // Prevent DNS prefetching for privacy
    // Context7: Enable for performance in production
    'X-DNS-Prefetch-Control': 'on',
    
    // Force HTTPS for 1 year
    // Context7: Critical for production security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Prevent clickjacking
    // Context7: DENY prevents embedding in any iframe
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME sniffing
    // Context7: Forces browser to respect Content-Type
    'X-Content-Type-Options': 'nosniff',
    
    // XSS Protection (legacy, CSP is better)
    // Context7: Keep for older browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    // Context7: Balance between privacy and functionality
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (Feature Policy)
    // Context7: Disable unnecessary browser features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Disable FLoC
      'payment=()',
      'usb=()',
    ].join(', '),
    
    // Cross-Origin Policies
    // Context7: Relaxed for Supabase compatibility
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    // Removed Cross-Origin-Embedder-Policy to allow Supabase
  }
}

/**
 * Get headers for API routes
 * Slightly different from page headers
 */
export function getAPISecurityHeaders(): SecurityHeaders {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    // API routes don't need CSP, but add CORS if needed
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Headers for static assets
 * More permissive caching
 */
export function getStaticAssetHeaders(): SecurityHeaders {
  return {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  }
}

/**
 * Validate required security headers are present
 * Useful for testing and monitoring
 */
export function validateSecurityHeaders(headers: Headers): {
  valid: boolean
  missing: string[]
} {
  const required = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Strict-Transport-Security',
  ]

  const missing = required.filter(header => !headers.has(header))

  return {
    valid: missing.length === 0,
    missing,
  }
}
