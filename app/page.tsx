import Link from "next/link"

import { Button } from "@/components/ui/button"

const features = [
  {
    title: "One place for every role",
    description:
      "Track saved jobs, applications, interviews, and offers without another spreadsheet.",
  },
  {
    title: "A timeline that makes sense",
    description:
      "Every status change and note lives with the application it belongs to.",
  },
  {
    title: "Your data, locked down",
    description:
      "Row-level security keeps every application visible only to the account that owns it.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[0.5625rem] font-semibold text-primary-foreground">
              AI
            </span>
            Job Agent
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/auth/login" />}
            >
              Sign in
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/auth/sign-up" />}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-start gap-5 px-4 py-20 sm:py-28">
          <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[0.625rem] font-medium text-muted-foreground">
            An AI-assisted job search, organised
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Apply smarter, not more.
          </h1>
          <p className="max-w-xl text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
            Keep every posting, application, and follow-up in one place — then
            let AI help you move each one forward.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-9 px-4 text-sm"
              nativeButton={false}
              render={<Link href="/auth/sign-up" />}
            >
              Create an account
            </Button>
            <Button
              variant="outline"
              className="h-9 px-4 text-sm"
              nativeButton={false}
              render={<Link href="/auth/login" />}
            >
              Sign in
            </Button>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-12 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-background p-4"
              >
                <h2 className="text-sm font-medium">{feature.title}</h2>
                <p className="mt-1.5 text-xs/relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 text-[0.625rem] text-muted-foreground">
          <span>AI Job Application Agent</span>
          <span>Built with Next.js and Supabase</span>
        </div>
      </footer>
    </div>
  )
}
