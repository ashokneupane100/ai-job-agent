import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "./types"

/**
 * Creates a per-request Supabase client for Server Components, Server Actions,
 * and Route Handlers. Never cache this client in a module-level variable.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component. This can be ignored because the
            // proxy refreshes the session and writes the cookies instead.
          }
        },
      },
    }
  )
}
