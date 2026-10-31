import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { safeNextPath } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Sign in",
}

// Reads `searchParams` and the session cookie, so it must block.
export const instant = false

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const next = safeNextPath(params.next)

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) {
    redirect(next)
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue tracking your applications."
      footer={
        <>
          New here?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} initialError={params.error} />
    </AuthShell>
  )
}
