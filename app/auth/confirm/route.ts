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
 * Confirmation endpoint for email templates that send `token_hash` and `type`
 * instead of a PKCE `code`. Point `emailRedirectTo`/`redirect_to` here if you
 * customize the confirmation template.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = safeNextPath(searchParams.get("next"))
  const origin = getRequestOrigin(request)

  if (!tokenHash || !type || !otpTypes.has(type as EmailOtpType)) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Missing%20or%20invalid%20confirmation%20token.", origin)
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  })

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(
          "That link is invalid or has expired. Request a new one and try again."
        )}`,
        origin
      )
    )
  }

  return NextResponse.redirect(new URL(next, origin))
}
