"use client"

import { useActionState } from "react"

import { requestPasswordReset } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { AuthState } from "@/lib/auth"

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {}
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-9 text-sm"
            required
          />
        </Field>
      </FieldGroup>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs/relaxed text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p
          role="status"
          className="rounded-md border border-border bg-muted/50 px-2.5 py-2 text-xs/relaxed text-muted-foreground"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="h-9 w-full text-sm" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  )
}
