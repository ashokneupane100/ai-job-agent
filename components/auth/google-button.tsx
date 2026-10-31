"use client"

import { useFormStatus } from "react-dom"

import { signInWithGoogle } from "@/app/auth/actions"
import { GoogleIcon } from "@/components/auth/google-icon"
import { Button } from "@/components/ui/button"

function GoogleSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="outline"
      className="h-10 w-full gap-2.5 bg-card text-sm font-medium shadow-xs hover:border-foreground/20 hover:bg-muted/50 dark:bg-input/30 dark:hover:bg-input/50"
      disabled={pending}
    >
      <GoogleIcon className="size-[1.125rem]" />
      {pending ? "Connecting…" : "Login with Google"}
    </Button>
  )
}

export function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <GoogleSubmitButton />
    </form>
  )
}
