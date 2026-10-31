import Link from "next/link"
import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="relative flex min-h-svh flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-muted),transparent)]"
      />

      <Link
        href="/"
        className="mb-6 flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[0.625rem] font-semibold text-primary-foreground">
          AI
        </span>
        Job Agent
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      {footer ? (
        <div className="mt-4 text-center text-xs/relaxed text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </main>
  )
}
