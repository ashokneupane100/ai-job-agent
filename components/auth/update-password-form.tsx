"use client"

import { useActionState } from "react"

import { updatePassword } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { PasswordInput } from "@/components/ui/password-input"
import type { AuthState } from "@/lib/auth"

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {}
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            className="h-10 text-sm"
            required
          />
          <FieldDescription>At least 8 characters.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="password_confirmation">Confirm password</FieldLabel>
          <PasswordInput
            id="password_confirmation"
            name="password_confirmation"
            autoComplete="new-password"
            minLength={8}
            className="h-10 text-sm"
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

      <Button type="submit" className="h-9 w-full text-sm" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  )
}
