"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { FormActionState } from "@/lib/auth"
import {
  normalizeResumeData,
  resumeDataToProfileUpdate,
} from "@/lib/resume/data"
import { createClient } from "@/lib/supabase/server"

export async function saveProfile(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub

  if (!userId) {
    redirect("/auth/login?next=/dashboard/profile")
  }

  const raw = formData.get("payload")

  if (typeof raw !== "string" || raw.length === 0) {
    return { error: "Nothing to save." }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: "Could not read the form data. Please try again." }
  }

  // Re-normalizing protects the database from unexpected payload shapes.
  const data = normalizeResumeData(parsed)

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, ...resumeDataToProfileUpdate(data) },
      { onConflict: "id" }
    )

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard", "layout")

  return { success: true }
}
