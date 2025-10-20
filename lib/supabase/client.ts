import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/types"

/**
 * Creates an optimized Supabase browser client with best practices from Context7:
 * - Global singleton pattern for reuse
 * - Type-safe database schema
 * - Optimized for client-side queries with RLS
 * 
 * Best Practices:
 * - Always add explicit .eq() filters even when RLS exists
 * - Select only needed columns
 * - Use .limit() to prevent large datasets
 * 
 * @see https://supabase.com/docs/guides/database/postgres/row-level-security
 */

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'forum-app@1.0.0',
        },
      },
    }
  )

  return client
}
