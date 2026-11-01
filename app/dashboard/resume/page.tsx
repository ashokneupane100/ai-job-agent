import type { Metadata } from "next"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon } from "@hugeicons/core-free-icons"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = {
  title: "Resume",
}

export default function ResumePage() {
  return (
    <PagePlaceholder
      title="Resume"
      description="Keep your resume versions and tailoring history in one place."
      icon={
        <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-5" />
      }
    />
  )
}
