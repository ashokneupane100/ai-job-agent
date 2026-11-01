"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { parseResumePdf } from "@/lib/ai/gemini"
import type { FormActionState } from "@/lib/auth"
import { resumeDataToProfilePatch, type ResumeData } from "@/lib/resume/data"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/types"

const BUCKET = "resumes"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error"
}

async function applyParsedResume(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  resumeId: string,
  data: ResumeData
) {
  const { error: resumeError } = await supabase
    .from("resumes")
    .update({
      status: "parsed",
      parsed_data: data as unknown as Json,
      parsed_at: new Date().toISOString(),
      parse_error: null,
    })
    .eq("id", resumeId)

  if (resumeError) {
    throw new Error(resumeError.message)
  }

  // Partial patch: a sparse resume never erases fields the user already has.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, ...resumeDataToProfilePatch(data) },
      { onConflict: "id" }
    )

  if (profileError) {
    throw new Error(profileError.message)
  }
}

export async function uploadResume(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub

  if (!userId) {
    redirect("/auth/login?next=/dashboard/resume")
  }

  const file = formData.get("resume")

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF resume to upload." }
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

  if (!isPdf) {
    return { error: "Only PDF resumes are supported right now." }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      error: "That file is larger than 10 MB. Please upload a smaller PDF.",
    }
  }

  const id = crypto.randomUUID()
  const safeName =
    file.name
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(-80) || "resume.pdf"
  const filePath = `${userId}/${id}-${safeName}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    })

  if (uploadError) {
    return { error: `Could not upload the resume: ${uploadError.message}` }
  }

  const { error: insertError } = await supabase.from("resumes").insert({
    id,
    user_id: userId,
    file_name: file.name,
    file_path: filePath,
    mime_type: "application/pdf",
    file_size: file.size,
    status: "parsing",
  })

  if (insertError) {
    // Do not leave an orphaned object behind.
    await supabase.storage.from(BUCKET).remove([filePath])
    return { error: `Could not save the resume: ${insertError.message}` }
  }

  try {
    const parsed = await parseResumePdf(bytes)
    await applyParsedResume(supabase, userId, id, parsed)
  } catch (error) {
    const message = errorMessage(error).slice(0, 500)

    // The upload is kept so the Resume page can offer a retry. No revalidation
    // here on purpose: the onboarding dialog stays open with the error visible.
    await supabase
      .from("resumes")
      .update({ status: "failed", parse_error: message })
      .eq("id", id)

    return { error: message }
  }

  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard/resume")
  revalidatePath("/dashboard/profile")

  return { success: true }
}

export async function retryResumeParse(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub

  if (!userId) {
    redirect("/auth/login?next=/dashboard/resume")
  }

  const id = String(formData.get("id") ?? "")
  if (!id) {
    redirect("/dashboard/resume")
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, file_path")
    .eq("id", id)
    .maybeSingle()

  if (!resume) {
    redirect("/dashboard/resume?parse_error=Resume+not+found")
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(resume.file_path)

  if (downloadError || !file) {
    redirect(
      `/dashboard/resume?parse_error=${encodeURIComponent(
        "Could not download the resume file."
      )}`
    )
  }

  await supabase
    .from("resumes")
    .update({ status: "parsing", parse_error: null })
    .eq("id", id)

  try {
    const parsed = await parseResumePdf(
      new Uint8Array(await file.arrayBuffer())
    )
    await applyParsedResume(supabase, userId, id, parsed)
  } catch (error) {
    const message = errorMessage(error).slice(0, 500)

    await supabase
      .from("resumes")
      .update({ status: "failed", parse_error: message })
      .eq("id", id)

    redirect(`/dashboard/resume?parse_error=${encodeURIComponent(message)}`)
  }

  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard/resume")
  revalidatePath("/dashboard/profile")

  redirect("/dashboard/resume?message=parsed")
}
