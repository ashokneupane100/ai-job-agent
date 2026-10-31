import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Authentication error",
}

// The whole page depends on `searchParams`, so it must block instead of
// producing a static shell.
export const instant = false

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <AuthShell
      title="We couldn't sign you in"
      description={
        message ?? "Something went wrong while completing authentication."
      }
    >
      <div className="flex flex-col gap-3">
        <Button
          className="h-9 w-full text-sm"
          nativeButton={false}
          render={<Link href="/auth/login" />}
        >
          Try again
        </Button>
        <Button
          variant="ghost"
          className="h-9 w-full text-sm"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Back to home
        </Button>
      </div>
    </AuthShell>
  )
}
