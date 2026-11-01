import { formatDistanceToNow } from "date-fns"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Download01Icon,
  File01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"

import { retryResumeParse } from "@/app/dashboard/resume/actions"
import { ResumeUploader } from "@/components/dashboard/resume-uploader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Resume",
}

// Auth-gated data is request-time only, so this route blocks by design.
export const instant = false

const statusStyles: Record<string, string> = {
  uploaded: "border-border bg-muted/50 text-muted-foreground",
  parsing: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  parsed:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
}

const statusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  parsing: "Parsing",
  parsed: "Parsed",
  failed: "Failed",
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; parse_error?: string }>
}) {
  // Relative timestamps ("uploaded 2 hours ago") read the clock, so this page
  // must render at request time instead of prerendering a static shell.
  await connection()

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub

  if (!userId) {
    redirect("/auth/login?next=/dashboard/resume")
  }

  const { data: resumes, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const { message, parse_error: parseError } = await searchParams
  const rows = resumes ?? []

  // Private bucket: hand the browser a short-lived signed URL per file.
  const signedUrls = await Promise.all(
    rows.map(async (resume) => {
      const { data } = await supabase.storage
        .from("resumes")
        .createSignedUrl(resume.file_path, 60 * 60)

      return [resume.id, data?.signedUrl ?? null] as const
    })
  )
  const signedUrlById = new Map(signedUrls)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Resume</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          Every resume you upload is stored privately, parsed with Gemini, and
          used to fill in your profile.
        </p>
      </div>

      {message === "parsed" ? (
        <p
          role="status"
          className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs/relaxed text-emerald-700 dark:text-emerald-400"
        >
          Resume parsed and your profile was updated.
        </p>
      ) : null}

      {parseError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs/relaxed text-destructive"
        >
          {parseError}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Upload a resume</CardTitle>
          <CardDescription>
            PDF only, up to 10 MB. Uploading a new resume adds a new entry — your
            previous versions stay here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUploader />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your resumes</CardTitle>
          <CardDescription>
            {rows.length === 0
              ? "Nothing uploaded yet."
              : `${rows.length} resume${rows.length === 1 ? "" : "s"} on file.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-xs/relaxed text-destructive">
              Could not load resumes: {error.message}
            </p>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm font-medium">No resumes yet</p>
              <p className="mt-1 text-xs/relaxed text-muted-foreground">
                Upload your first PDF using the form above.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((resume) => {
                const signedUrl = signedUrlById.get(resume.id)

                return (
                  <li
                    key={resume.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                          <HugeiconsIcon
                            icon={File01Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </span>

                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {resume.file_name}
                            </span>
                            <Badge
                              variant="outline"
                              className={statusStyles[resume.status]}
                            >
                              {statusLabels[resume.status] ?? resume.status}
                            </Badge>
                          </div>
                          <p className="text-xs/relaxed text-muted-foreground">
                            {formatFileSize(resume.file_size)}
                            {" · uploaded "}
                            {formatDistanceToNow(new Date(resume.created_at), {
                              addSuffix: true,
                            })}
                            {resume.parsed_at
                              ? ` · parsed ${formatDistanceToNow(
                                  new Date(resume.parsed_at),
                                  { addSuffix: true }
                                )}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {signedUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={
                              <a
                                href={signedUrl}
                                target="_blank"
                                rel="noreferrer"
                              />
                            }
                          >
                            <HugeiconsIcon
                              icon={Download01Icon}
                              strokeWidth={2}
                            />
                            View
                          </Button>
                        ) : null}

                        {resume.status === "failed" ? (
                          <form action={retryResumeParse}>
                            <input
                              type="hidden"
                              name="id"
                              value={resume.id}
                            />
                            <Button type="submit" variant="outline" size="sm">
                              <HugeiconsIcon
                                icon={RefreshIcon}
                                strokeWidth={2}
                              />
                              Retry parse
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    {resume.status === "failed" && resume.parse_error ? (
                      <p className="flex items-start gap-1.5 rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs/relaxed text-destructive">
                        <HugeiconsIcon
                          icon={Alert02Icon}
                          strokeWidth={2}
                          className="mt-0.5 size-3.5 shrink-0"
                        />
                        {resume.parse_error}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
