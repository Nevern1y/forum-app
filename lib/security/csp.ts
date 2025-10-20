/**
 * Content Security Policy Configuration
 * Based on Next.js Context7 Best Practices (Trust Score: 10)
 * 
 * Uses Web Crypto API for Edge Runtime compatibility
 * 
 * @see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */

export interface CSPDirectives {
  'default-src'?: string[]
  'script-src'?: string[]
  'style-src'?: string[]
  'img-src'?: string[]
  'font-src'?: string[]
  'connect-src'?: string[]
  'media-src'?: string[]
  'object-src'?: string[]
  'frame-src'?: string[]
  'base-uri'?: string[]
  'form-action'?: string[]
  'frame-ancestors'?: string[]
  'upgrade-insecure-requests'?: boolean
}

/**
 * Generate a cryptographic nonce for CSP
 * Uses Web Crypto API (Edge Runtime compatible)
 */
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

/**
 * Get CSP directives for the application
 * Context7 Best Practice: Strict CSP with nonces
 */
export function getCSPDirectives(nonce: string, isDev: boolean = false): CSPDirectives {
  // Development has relaxed CSP for Hot Module Replacement
  if (isDev) {
    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Required for Next.js dev
        "'unsafe-inline'", // Required for Next.js dev
      ],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'blob:', 'data:', 'https:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': [
        "'self'",
        'https://teftcesgqqwhqhdiornh.supabase.co', // Supabase API
        'https://*.supabase.co', // Supabase Storage
        'wss://teftcesgqqwhqhdiornh.supabase.co', // WebSocket for Realtime
        'ws://localhost:*', // Local WebSocket for dev
      ],
      'media-src': ["'self'", 'blob:', 'https:'],
      'object-src': ["'none'"],
      'frame-src': ["'self'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
    }
  }

  // Production: Strict CSP with Supabase compatibility
  return {
    'default-src': ["'self'"],
    // Context7: nonce + strict-dynamic allows only nonce-tagged scripts
    // unsafe-inline added as fallback for browsers without nonce support
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "'unsafe-inline'", // Fallback for older browsers
      'https://vercel.live', // Vercel Analytics
      'https://va.vercel-scripts.com', // Vercel Analytics
    ],
    // Context7: nonce for inline styles + unsafe-inline as fallback
    // unsafe-inline is needed for Next.js inline styles and won't be used if nonce is supported
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-inline'", // Fallback for browsers without nonce support
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'blob:',
      'data:',
      'https:', // Allow external images (avatars, media)
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://teftcesgqqwhqhdiornh.supabase.co', // Supabase API
      'https://*.supabase.co', // Supabase Storage
      'https://vercel.live', // Vercel Analytics
      'https://va.vercel-scripts.com',
      'wss://teftcesgqqwhqhdiornh.supabase.co', // Realtime WebSocket
    ],
    'media-src': [
      "'self'",
      'blob:',
      'https://*.supabase.co', // Supabase Storage for audio/video
    ],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"], // Prevent clickjacking
    'upgrade-insecure-requests': true,
  }
}

/**
 * Convert CSP directives to header string
 */
export function cspDirectivesToString(directives: CSPDirectives): string {
  return Object.entries(directives)
    .map(([key, value]) => {
      if (key === 'upgrade-insecure-requests') {
        return value ? 'upgrade-insecure-requests' : ''
      }
      if (Array.isArray(value)) {
        return `${key} ${value.join(' ')}`
      }
      return ''
    })
    .filter(Boolean)
    .join('; ')
}

/**
 * Generate complete CSP header
 * Context7 Best Practice: Nonce-based CSP
 */
export function generateCSPHeader(isDev: boolean = false): {
  nonce: string
  cspHeader: string
} {
  const nonce = generateNonce()
  const directives = getCSPDirectives(nonce, isDev)
  const cspHeader = cspDirectivesToString(directives)

  return { nonce, cspHeader }
}

/**
 * CSP Reporting (optional, for monitoring violations)
 * Uncomment to enable CSP reporting
 */
export function addCSPReporting(csp: string, reportUri?: string): string {
  if (!reportUri) return csp
  return `${csp}; report-uri ${reportUri}`
}
