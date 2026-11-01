import type { Metadata } from "next"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon } from "@hugeicons/core-free-icons"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = {
  title: "Profile",
}

export default function ProfilePage() {
  return (
    <PagePlaceholder
      title="Profile"
      description="Your headline, links, skills, and the story you tell recruiters."
      icon={
        <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-5" />
      }
    />
  )
}
