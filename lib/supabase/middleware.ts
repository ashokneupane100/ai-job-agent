import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "./types"

/**
 * Refreshes the Supabase session for a request and returns the verified claims.
 * The proxy is responsible for turning the returned response into a redirect
 * when needed (copying cookies and cache headers across in the process).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          // Prevent a CDN or reverse proxy from caching a response that
          // carries another user's session cookie.
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getClaims(). Use
  // getClaims() rather than getSession(): the cookie can be forged, so server
  // code must verify the token's signature.
  const { data } = await supabase.auth.getClaims()

  return {
    claims: data?.claims ?? null,
    response: supabaseResponse,
  }
}
