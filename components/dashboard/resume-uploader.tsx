"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CloudUploadIcon,
  File01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"

import { uploadResume } from "@/app/dashboard/resume/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { FormActionState } from "@/lib/auth"
import { cn } from "@/lib/utils"

export function ResumeUploader({
  redirectTo,
  onSuccess,
}: {
  redirectTo?: string
  onSuccess?: () => void
}) {
  const [state, setState] = useState<FormActionState>({})
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const next = await uploadResume({}, formData)
      setState(next)
      formRef.current?.reset()
      setFileName(null)

      if (!next.success) {
        // On the Resume page, refresh so the failed upload shows up in the
        // list (the error message survives because this component keeps its
        // state). Inside the onboarding dialog we deliberately do not refresh:
        // a refresh would close the gate and hide the error.
        if (!redirectTo) {
          router.refresh()
        }
        return
      }

      onSuccess?.()

      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="resume-file"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 px-4 py-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
          pending && "pointer-events-none opacity-60"
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-foreground">
          <HugeiconsIcon
            icon={fileName ? File01Icon : CloudUploadIcon}
            strokeWidth={2}
            className="size-5"
          />
        </span>

        <span className="max-w-full truncate text-sm font-medium">
          {fileName ?? "Choose a PDF resume"}
        </span>

        <span className="text-xs/relaxed text-muted-foreground">
          {fileName
            ? "Click to pick a different file."
            : "PDF only, up to 10 MB."}
        </span>

        <input
          id="resume-file"
          name="resume"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={pending}
          className="sr-only"
          onChange={(event) =>
            setFileName(event.target.files?.[0]?.name ?? null)
          }
        />
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs/relaxed text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-9 w-full text-sm"
        disabled={pending || !fileName}
      >
        {pending ? (
          <>
            <Spinner className="size-4" />
            Analyzing with Gemini…
          </>
        ) : (
          <>
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
            Upload &amp; parse resume
          </>
        )}
      </Button>

      {pending ? (
        <p className="text-center text-xs/relaxed text-muted-foreground">
          Reading your resume and filling in your profile. This usually takes
          10–30 seconds.
        </p>
      ) : null}
    </form>
  )
}
