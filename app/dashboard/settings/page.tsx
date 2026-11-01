import type { Metadata } from "next"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon } from "@hugeicons/core-free-icons"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = {
  title: "Profile Settings",
}

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Profile Settings"
      description="Account details, notification preferences, and security."
      icon={
        <HugeiconsIcon
          icon={Settings01Icon}
          strokeWidth={2}
          className="size-5"
        />
      }
    />
  )
}
