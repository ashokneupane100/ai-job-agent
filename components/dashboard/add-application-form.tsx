"use client"

import { useActionState, useEffect, useRef } from "react"

import { createApplication } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import type { FormActionState } from "@/lib/auth"

const statuses = [
  ["saved", "Saved"],
  ["applied", "Applied"],
  ["interviewing", "Interviewing"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
  ["withdrawn", "Withdrawn"],
] as const

export function AddApplicationForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    createApplication,
    {}
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <FieldGroup className="gap-3 sm:grid sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="company_name">Company</FieldLabel>
          <Input
            id="company_name"
            name="company_name"
            placeholder="Acme Inc."
            className="h-9 text-sm"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="job_title">Job title</FieldLabel>
          <Input
            id="job_title"
            name="job_title"
            placeholder="Software Engineer"
            className="h-9 text-sm"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="job_url">Job URL</FieldLabel>
          <Input
            id="job_url"
            name="job_url"
            type="url"
            placeholder="https://…"
            className="h-9 text-sm"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <Input
            id="location"
            name="location"
            placeholder="Remote / Berlin"
            className="h-9 text-sm"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <NativeSelect id="status" name="status" defaultValue="saved" className="w-full">
            {statuses.map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
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

      {state.success ? (
        <p
          role="status"
          className="text-xs/relaxed text-muted-foreground"
        >
          Application added.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" className="h-8 text-sm" disabled={pending}>
          {pending ? "Adding…" : "Add application"}
        </Button>
      </div>
    </form>
  )
}
