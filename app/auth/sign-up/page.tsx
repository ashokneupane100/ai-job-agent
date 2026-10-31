import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { safeNextPath } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Create account",
}

// Reads `searchParams` and the session cookie, so it must block.
export const instant = false

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
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
      title="Create your account"
      description="Start tracking applications and let AI handle the busywork."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/auth/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm next={next} />
    </AuthShell>
  )
}
