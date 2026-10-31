"use client"

import { useActionState } from "react"

import { signUp } from "@/app/auth/actions"
import { GoogleButton } from "@/components/auth/google-button"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import type { AuthState } from "@/lib/auth"

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    {}
  )

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="full_name">Full name</FieldLabel>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              className="h-10 text-sm"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-10 text-sm"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
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
        </FieldGroup>

        {state.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs/relaxed text-destructive"
          >
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="h-10 w-full text-sm" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <FieldSeparator>or</FieldSeparator>

      <GoogleButton next={next} />
    </div>
  )
}
