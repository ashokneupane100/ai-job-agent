# Supabase setup

This app uses Supabase for Postgres, email/password auth, and (once configured)
Google sign-in. Auth sessions are stored in cookies by `@supabase/ssr`, refreshed
in `proxy.ts`, and every server-side check uses `getClaims()`.

Production project ref: `edmilhwaqnmbfmimoebm` (region `eu-west-1`).

## Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` is the public origin used to build auth redirects
(`/auth/callback`). Set it to the deployed origin in production. If it is unset,
`app/auth/actions.ts` falls back to the request host so preview deployments work.

Never commit `.env.local`. Only `.env.example` is tracked.

## Database

The schema lives in [`supabase/migrations/20261031000000_init.sql`](../supabase/migrations/20261031000000_init.sql).

| Table                | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `profiles`           | One row per auth user, created by the `handle_new_user` trigger |
| `job_applications`   | One row per tracked job application                            |
| `application_events` | Notes, interviews, and status changes for an application       |

All three tables:

- have row-level security enabled and owner-scoped policies (`auth.uid()`),
- are explicitly granted to `authenticated` (tables created after 2026-10-30 are
  not exposed to the Data API automatically),
- are **not** granted to `anon`, so an anonymous request returns no rows.

Apply the migration to a fresh project one of these ways:

```bash
# Supabase CLI (installed globally)
supabase link --project-ref <project-ref>
supabase db push

# or over psql with the pooler connection string
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20261031000000_init.sql
```

The direct database host is IPv6-only on this project; use the Supavisor pooler
(`aws-0-eu-west-1.pooler.supabase.com:5432`) if your network has no IPv6.

Regenerate types after schema changes:

```bash
npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" > lib/supabase/types.ts
```

## Email/password auth

Email sign-in is already enabled on the project. The app implements:

- `/auth/sign-up` — creates the user and redirects to `/auth/verify-email`
- `/auth/login` — password sign-in, honors a safe `next` parameter
- `/auth/forgot-password` — sends a reset link (always returns the same message)
- `/auth/update-password` — sets a new password for a verified recovery session
- `/auth/callback` and `/auth/confirm` — exchange PKCE `code` / `token_hash`
- `signOut()` — clears the session and returns to `/`

Email confirmation is **on** (`mailer_autoconfirm: false`), so new users must
click the link in the confirmation email before they can sign in. A `profiles`
row is created by a trigger at sign-up time, before confirmation.

> The project currently uses Supabase's built-in SMTP, which is rate-limited to
> a couple of messages per hour. Configure custom SMTP under
> **Authentication → Emails → SMTP Settings** before relying on sign-up or
> password reset in production.

### Redirect allowlist

Confirmation and recovery emails can only redirect to allowlisted URLs. In the
Supabase Dashboard go to **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**:
  - `http://localhost:3000/**`
  - `https://<your-production-domain>/**`

Without these entries, Supabase silently falls back to the Site URL and the
confirmation link will not reach `/auth/callback`.

## Google sign-in

The "Continue with Google" button is already implemented
(`components/auth/google-button.tsx` → `signInWithGoogle` in
`app/auth/actions.ts`). Google is **not enabled** on the Supabase project yet
(`external.google: false`), so clicking it currently returns an error message on
the sign-in screen.

To enable it:

1. **Create a Google OAuth client** in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: **Web application**
   - Authorized JavaScript origin: `http://localhost:3000` (plus your production
     origin)
   - Authorized redirect URI:
     `https://edmilhwaqnmbfmimoebm.supabase.co/auth/v1/callback`
   - Copy the client ID and client secret.
2. **Enable the provider** in the Supabase Dashboard under
   **Authentication → Providers → Google**:
   - Toggle it on.
   - Paste the client ID and secret.
   - Save.
3. **Add redirect URLs** as described above. The app sends Google through
   `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=...`, which exchanges the code
   for a cookie session.
4. Sign out of Supabase, then use **Continue with Google** on `/auth/login` or
   `/auth/sign-up`.

The Supabase callback above must be used exactly — it is the URL Google redirects
back to, and Supabase then forwards to the app's `/auth/callback`.

## Auth routes at a glance

| Route                   | Access        | Notes                                            |
| ----------------------- | ------------- | ------------------------------------------------ |
| `/`                     | Public        | Landing page                                     |
| `/auth/login`           | Signed out    | Signed-in users are redirected to `next`         |
| `/auth/sign-up`         | Signed out    | Creates user + profile, then verify-email screen |
| `/auth/forgot-password` | Public        | Sends a recovery link                            |
| `/auth/verify-email`    | Public        | "Check your inbox" screen                        |
| `/auth/callback`        | Public        | PKCE code exchange and provider errors           |
| `/auth/confirm`         | Public        | `token_hash` confirmation for custom templates   |
| `/auth/update-password` | Signed in     | Requires a recovery session                      |
| `/auth/error`           | Public        | Displays an auth error message                   |
| `/dashboard`            | Signed in     | RLS-scoped applications + add/delete form        |

`proxy.ts` refreshes the session on every request and redirects unauthenticated
requests for non-public routes to `/auth/login?next=...`. Static assets and
Next.js internals are excluded from the matcher.

## Checking RLS

With a signed-in user's access token:

```bash
curl "https://<project-ref>.supabase.co/rest/v1/job_applications?select=*" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

The response contains only that user's rows. An insert with another user's
`user_id` fails with `new row violates row-level security policy` (`42501`).
