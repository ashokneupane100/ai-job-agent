import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { ProfileForm } from "@/components/dashboard/profile-form"
import {
  hasProfileContent,
  normalizeResumeData,
  profileToResumeData,
} from "@/lib/resume/data"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Profile",
}

// Auth-gated data is request-time only, so this route blocks by design.
export const instant = false

export default async function ProfilePage() {
  // Auth-gated data is request-time only, so never prerender a static shell.
  await connection()

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub

  if (!userId) {
    redirect("/auth/login?next=/dashboard/profile")
  }

  const [{ data: profile }, { data: latestResume }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("resumes")
      .select("file_name, parsed_data")
      .eq("user_id", userId)
      .eq("status", "parsed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profileData = profileToResumeData(profile)

  // A parsed resume is the source of truth until the user edits the profile;
  // after that, the saved profile wins.
  const initial =
    hasProfileContent(profileData) || !latestResume?.parsed_data
      ? profileData
      : normalizeResumeData(latestResume.parsed_data)

  return <ProfileForm initial={initial} />
}
