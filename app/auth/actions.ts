"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { safeNextPath, type AuthState } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

/**
 * Resolve the public origin for auth redirects. Falls back to the request
 * headers so preview deployments work without extra configuration.
 */
async function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) {
    return configured.replace(/\/$/, "")
  }

  const headerStore = await headers()
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000"
  const protocol =
    headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")

  return `${protocol}://${host}`
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  }
}

export async function login(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData)
  const next = safeNextPath(String(formData.get("next") ?? ""))

  if (!email || !password) {
    return { error: "Enter your email and password." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      return {
        error:
          "Confirm your email before signing in. Check your inbox for the confirmation link.",
      }
    }

    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect(next)
}

export async function signUp(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData)
  const fullName = String(formData.get("full_name") ?? "").trim()

  if (!fullName) {
    return { error: "Enter your name." }
  }

  if (!email.includes("@")) {
    return { error: "Enter a valid email address." }
  }

  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters." }
  }

  const siteUrl = await getSiteUrl()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Email enumeration protection: an existing confirmed account comes back
  // with no identities instead of an error.
  if (data.user && data.user.identities?.length === 0) {
    return {
      error:
        "An account with this email already exists. Sign in instead, or reset your password.",
    }
  }

  // With email confirmation enabled there is no session yet.
  if (!data.session) {
    redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`)
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? ""))
  const siteUrl = await getSiteUrl()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error) {
    redirect(
      `/auth/login?error=${encodeURIComponent(
        /provider is not enabled/i.test(error.message)
          ? "Google sign-in is not configured yet. Enable the Google provider in your Supabase project first."
          : error.message
      )}`
    )
  }

  redirect(data.url)
}

export async function requestPasswordReset(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email } = readCredentials(formData)

  if (!email) {
    return { error: "Enter the email address for your account." }
  }

  const siteUrl = await getSiteUrl()
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  // Always return the same message to avoid revealing whether an account exists.
  return {
    message: "If an account exists for that email, we sent a password reset link.",
  }
}

export async function updatePassword(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "")
  const confirmation = String(formData.get("password_confirmation") ?? "")

  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters." }
  }

  if (password !== confirmation) {
    return { error: "The passwords do not match." }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect("/auth/login?next=/auth/update-password")
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard/application-status?message=password-updated")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
