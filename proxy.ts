import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth"
import { updateSession } from "@/lib/supabase/middleware"

const signedOutRedirects = new Set([
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
])

function redirectWithSessionCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url)
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header)
    if (value) {
      redirect.headers.set(header, value)
    }
  }
  return redirect
}

export async function proxy(request: NextRequest) {
  const { claims, response } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (!claims) {
    // `/` is the public landing page and `/auth/*` holds the sign-in flows.
    if (pathname === "/" || pathname.startsWith("/auth")) {
      return response
    }

    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.search = ""
    url.searchParams.set("next", `${pathname}${search}`)
    return redirectWithSessionCookies(url, response)
  }

  // Signed-in users do not need the sign-in or sign-up screens.
  if (signedOutRedirects.has(pathname)) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"))
    const url = request.nextUrl.clone()
    // Never redirect back into a signed-out-only route (redirect loop).
    url.pathname = signedOutRedirects.has(next) ? "/dashboard" : next
    url.search = ""
    return redirectWithSessionCookies(url, response)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on every request except Next.js internals and static assets.
     * `_next/data` is intentionally not excluded; Next.js always runs the
     * proxy for it so a protected page's data route cannot be bypassed.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
}
