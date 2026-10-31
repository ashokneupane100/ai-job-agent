# AI Job Application Agent

Track job applications, interviews, and offers in one place, with Supabase
providing the database and authentication.

## Features

- Email/password sign-up, sign-in, email confirmation, and password reset
- "Continue with Google" sign-in (needs a Google OAuth client; see
  [`docs/supabase.md`](docs/supabase.md))
- Protected dashboard with per-user application tracking and row-level security
- Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create the first account at
`/auth/sign-up`; the confirmation email must be clicked before signing in.

### Environment

| Variable                             | Description                              |
| ------------------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key        |
| `NEXT_PUBLIC_SITE_URL`               | Public origin used for auth redirects    |

## Scripts

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
npx tsc --noEmit # type-check
```

## Supabase

The schema is in [`supabase/migrations/`](supabase/migrations), and the full
setup guide — including the Google provider steps and redirect allowlist — is in
[`docs/supabase.md`](docs/supabase.md).

## Project structure

```
app/auth/       sign-in, sign-up, reset, callback, confirm, error routes
app/dashboard/  protected applications page and server actions
components/     ui primitives plus auth and dashboard components
lib/supabase/   browser/server clients, proxy session helper, generated types
proxy.ts        Next.js 16 proxy: session refresh and auth gating
```
