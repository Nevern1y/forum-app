import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types"

/**
 * Creates an optimized Supabase server client with best practices from Context7:
 * - Proper cookie handling for SSR
 * - Type-safe database schema
 * - Optimized for server-side data fetching
 * 
 * Best Practices for Server Components:
 * - Prefetch data for Client Components
 * - Always add explicit .eq() filters
 * - Select only needed columns
 * - Use with React Query for optimal caching
 * 
 * @see https://supabase.com/docs/guides/database/postgres/row-level-security
 */

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Not needed on server
      },
      global: {
        headers: {
          'X-Client-Info': 'forum-app-server@1.0.0',
        },
      },
    }
  )
}
