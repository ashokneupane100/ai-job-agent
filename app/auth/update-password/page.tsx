import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Choose a new password",
}

// Reads the session cookie to gate the form, so it must block.
export const instant = false

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect("/auth/login?next=/auth/update-password")
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Your reset link is verified. Pick a password you haven't used before."
    >
      <UpdatePasswordForm />
    </AuthShell>
  )
}
