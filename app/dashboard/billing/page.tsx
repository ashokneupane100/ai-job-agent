import type { Metadata } from "next"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = {
  title: "Billing / Credits",
}

export default function BillingPage() {
  return (
    <PagePlaceholder
      title="Billing / Credits"
      description="Manage your plan, top up AI credits, and review invoices."
      icon={
        <HugeiconsIcon
          icon={CreditCardIcon}
          strokeWidth={2}
          className="size-5"
        />
      }
    />
  )
}
