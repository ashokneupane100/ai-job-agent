"use client"

import Link from "next/link"
import { useActionState } from "react"

import { login } from "@/app/auth/actions"
import { GoogleButton } from "@/components/auth/google-button"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import type { AuthState } from "@/lib/auth"

export function LoginForm({
  next,
  initialError,
}: {
  next: string
  initialError?: string
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    initialError ? { error: initialError } : {}
  )

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <FieldGroup className="gap-3">
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
            <div className="flex w-full items-center justify-between gap-2">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/auth/forgot-password"
                className="text-[0.625rem] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
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

        <Button type="submit" className="h-10 w-full text-sm" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <FieldSeparator>or</FieldSeparator>

      <GoogleButton next={next} />
    </div>
  )
}
