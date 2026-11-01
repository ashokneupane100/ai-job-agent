import { connection } from "next/server"

import { OnboardingDialog } from "@/components/dashboard/onboarding-dialog"
import {
  hasProfileContent,
  profileToResumeData,
} from "@/lib/resume/data"
import { createClient } from "@/lib/supabase/server"

/**
 * Server-side gate: a user needs onboarding until they have at least one
 * uploaded resume or have filled in real profile content themselves.
 */
export async function OnboardingGate() {
  // Auth reads are request-time only. Declaring that explicitly keeps the
  // dashboard shell prerenderable (Supabase's JWT check reads the clock).
  await connection()

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub

  if (!userId) {
    return null
  }

  const [{ count }, { data: profile }] = await Promise.all([
    supabase.from("resumes").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
  ])

  if ((count ?? 0) > 0 || hasProfileContent(profileToResumeData(profile))) {
    return null
  }

  return <OnboardingDialog />
}
