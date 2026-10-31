import { formatDistanceToNow } from "date-fns"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { deleteApplication } from "@/app/dashboard/actions"
import { AddApplicationForm } from "@/components/dashboard/add-application-form"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard",
}

// Auth-gated data is request-time only, so this route blocks by design.
export const instant = false

const statusStyles: Record<string, string> = {
  saved: "border-border bg-muted/50 text-muted-foreground",
  applied: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  interviewing:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  offer:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejected: "border-destructive/20 bg-destructive/10 text-destructive",
  withdrawn: "border-border bg-transparent text-muted-foreground",
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()

  if (!auth?.claims?.sub) {
    redirect("/auth/login?next=/dashboard")
  }

  const [{ data: profile }, { data: applications, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, headline")
      .eq("id", auth.claims.sub)
      .maybeSingle(),
    supabase
      .from("job_applications")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50),
  ])

  const { message } = await searchParams
  const rows = applications ?? []
  const active = rows.filter((row) =>
    ["applied", "interviewing"].includes(row.status)
  ).length
  const offers = rows.filter((row) => row.status === "offer").length
  const email =
    typeof auth.claims.email === "string" ? auth.claims.email : undefined
  const name = profile?.full_name ?? email?.split("@")[0] ?? "there"

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[0.5625rem] font-semibold text-primary-foreground">
              AI
            </span>
            Job Agent
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="text-xs/relaxed text-muted-foreground">
            Track every application from first save to signed offer.
          </p>
        </div>

        {message === "password-updated" ? (
          <p
            role="status"
            className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs/relaxed text-emerald-700 dark:text-emerald-400"
          >
            Password updated.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Total", rows.length],
            ["Active", active],
            ["Offers", offers],
          ].map(([label, value]) => (
            <Card key={label} size="sm">
              <CardContent className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xl font-semibold tabular-nums">{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add an application</CardTitle>
            <CardDescription>
              Capture the role now — you can add notes and events later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddApplicationForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your applications</CardTitle>
            <CardDescription>
              {rows.length === 0
                ? "Nothing here yet."
                : `${rows.length} tracked application${rows.length === 1 ? "" : "s"}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-xs/relaxed text-destructive">
                Could not load applications: {error.message}
              </p>
            ) : rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
                <p className="text-sm font-medium">No applications yet</p>
                <p className="mt-1 text-xs/relaxed text-muted-foreground">
                  Add your first role using the form above.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {rows.map((application) => (
                  <li
                    key={application.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {application.job_title}
                        </span>
                        <Badge
                          variant="outline"
                          className={statusStyles[application.status]}
                        >
                          {statusLabel(application.status)}
                        </Badge>
                      </div>
                      <p className="truncate text-xs/relaxed text-muted-foreground">
                        {application.company_name}
                        {application.location ? ` · ${application.location}` : ""}
                        {" · updated "}
                        {formatDistanceToNow(new Date(application.updated_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {application.job_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={
                            <a
                              href={application.job_url}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          View posting
                        </Button>
                      ) : null}
                      <form action={deleteApplication}>
                        <input type="hidden" name="id" value={application.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
