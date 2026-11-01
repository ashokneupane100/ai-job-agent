import type { Metadata } from "next"
import { HugeiconsIcon } from "@hugeicons/react"
import { Briefcase01Icon } from "@hugeicons/core-free-icons"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = {
  title: "Jobs",
}

export default function JobsPage() {
  return (
    <PagePlaceholder
      title="Jobs"
      description="Roles you want to apply to, saved and scored by AI."
      icon={
        <HugeiconsIcon
          icon={Briefcase01Icon}
          strokeWidth={2}
          className="size-5"
        />
      }
    />
  )
}
