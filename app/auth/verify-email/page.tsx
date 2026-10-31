import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Confirm your email",
}

// The whole page depends on `searchParams`, so it must block.
export const instant = false

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <AuthShell
      title="Check your inbox"
      description={
        email
          ? `We sent a confirmation link to ${email}. Open it to finish creating your account.`
          : "We sent you a confirmation link. Open it to finish creating your account."
      }
      footer={
        <>
          Wrong address?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Start over
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-xs/relaxed text-muted-foreground">
        <p>
          The link expires after a while. If it does, sign up again with the same
          email to receive a fresh one.
        </p>
        <Button
          variant="outline"
          className="h-9 w-full text-sm"
          nativeButton={false}
          render={<Link href="/auth/login" />}
        >
          Back to sign in
        </Button>
      </div>
    </AuthShell>
  )
}
