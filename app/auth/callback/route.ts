import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { getRequestOrigin, safeNextPath } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const otpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])

/**
 * Handles the PKCE `code` returned by OAuth and email links, plus the
 * `token_hash` variant used by custom email templates.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = safeNextPath(searchParams.get("next"))
  const origin = getRequestOrigin(request)

  const providerError = searchParams.get("error_description") ?? searchParams.get("error")
  if (providerError) {
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(providerError)}`, origin)
    )
  }

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  if (tokenHash && type && otpTypes.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(
    new URL(
      `/auth/error?message=${encodeURIComponent(
        "That link is invalid or has expired. Request a new one and try again."
      )}`,
      origin
    )
  )
}
