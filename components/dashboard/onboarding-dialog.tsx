"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BrainIcon,
  File01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"

import { ResumeUploader } from "@/components/dashboard/resume-uploader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const steps = [
  {
    icon: File01Icon,
    title: "Upload your resume",
    body: "A PDF up to 10 MB. It is stored privately in your account.",
  },
  {
    icon: BrainIcon,
    title: "Gemini reads it",
    body: "We extract your summary, skills, experience, education, and links.",
  },
  {
    icon: PencilEdit02Icon,
    title: "Review your profile",
    body: "Everything is editable, so you can fix or add details afterwards.",
  },
] as const

export function OnboardingDialog() {
  // Safety net: unmount as soon as the upload succeeds, even if the layout has
  // not re-rendered with the new resume yet. A controlled `open={false}` would
  // be cancelled by the handler below, so unmounting is the reliable path.
  const [completed, setCompleted] = useState(false)

  if (completed) {
    return null
  }

  return (
    <Dialog
      open
      disablePointerDismissal
      onOpenChange={(next, details) => {
        // Controlled + cancelled: Escape and outside presses cannot close it.
        if (!next) {
          details.cancel()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-base">
            Upload your resume to get started
          </DialogTitle>
          <DialogDescription>
            JobBuddy uses Google Gemini to read your resume once and fill in your
            profile automatically. Upload a resume to unlock the dashboard.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-3">
          {steps.map((step) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <HugeiconsIcon
                  icon={step.icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">{step.title}</span>
                <span className="text-xs/relaxed text-muted-foreground">
                  {step.body}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <ResumeUploader
          redirectTo="/dashboard/profile"
          onSuccess={() => setCompleted(true)}
        />

        <p className="text-center text-[0.6875rem]/relaxed text-muted-foreground">
          This dialog closes automatically once your resume has been parsed.
        </p>
      </DialogContent>
    </Dialog>
  )
}
