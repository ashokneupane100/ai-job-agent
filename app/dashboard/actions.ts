"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { FormActionState } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const statuses = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
] as const

type Status = (typeof statuses)[number]

function parseStatus(value: FormDataEntryValue | null): Status {
  return statuses.includes(value as Status) ? (value as Status) : "saved"
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim()
  return text.length > 0 ? text : null
}

export async function createApplication(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims?.sub) {
    redirect("/auth/login?next=/dashboard/application-status")
  }

  const companyName = String(formData.get("company_name") ?? "").trim()
  const jobTitle = String(formData.get("job_title") ?? "").trim()

  if (!companyName || !jobTitle) {
    return { error: "Company and job title are required." }
  }

  const { error } = await supabase.from("job_applications").insert({
    user_id: data.claims.sub,
    company_name: companyName,
    job_title: jobTitle,
    status: parseStatus(formData.get("status")),
    job_url: optionalText(formData.get("job_url")),
    location: optionalText(formData.get("location")),
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/application-status")
  return { success: true }
}

export async function deleteApplication(formData: FormData) {
  const id = String(formData.get("id") ?? "")

  if (!id) {
    return
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims?.sub) {
    redirect("/auth/login?next=/dashboard/application-status")
  }

  // RLS scopes the delete to the signed-in user.
  await supabase.from("job_applications").delete().eq("id", id)
  revalidatePath("/dashboard/application-status")
}
