# Supabase setup

This app uses Supabase for Postgres, email/password auth, and (once configured)
Google sign-in. Auth sessions are stored in cookies by `@supabase/ssr`, refreshed
in `proxy.ts`, and every server-side check uses `getClaims()`.

Project ref in use: `uweasnrlduvnobzhhrcx` (matches `.env.local`). The ref in
`NEXT_PUBLIC_SUPABASE_URL` is the source of truth — if you point the app at a
different project, update the OAuth callback URL and redirect allowlist below
to match.

## Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GEMINI_API_KEY=your-google-ai-studio-key
# optional, defaults to gemini-3.8-flash
GEMINI_MODEL=
```

`NEXT_PUBLIC_SITE_URL` is the public origin used to build auth redirects
(`/auth/callback`). Set it to the deployed origin in production. If it is unset,
`app/auth/actions.ts` falls back to the request host so preview deployments work.

`GEMINI_API_KEY` comes from [Google AI Studio](https://aistudio.google.com/apikey).
It is only read on the server (never exposed to the browser) and is required for
resume parsing. Without it, uploads are stored and marked `failed` with a clear
error, and the Resume page offers a retry.

Never commit `.env.local`. Only `.env.example` is tracked.

## Database

The schema lives in [`supabase/migrations/`](../supabase/migrations/), applied in
filename order:

| Migration                             | Purpose                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| `20261031000000_init.sql`             | Tables, RLS policies, grants, `updated_at` + new-user triggers |
| `20261101000000_backfill_profiles.sql` | Profiles for users created before the trigger existed      |
| `20261101000100_revoke_anon_grants.sql` | Removes the anon grants Supabase adds by default          |
| `20261102000000_resumes.sql`          | `resumes` table, profile JSONB sections, `resumes` bucket + storage policies |

| Table                | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `profiles`           | One row per auth user, created by the `handle_new_user` trigger |
| `job_applications`   | One row per tracked job application                            |
| `application_events` | Notes, interviews, and status changes for an application       |
| `resumes`            | Uploaded PDFs, their parse status, and Gemini's structured output |

All four tables:

- have row-level security enabled and owner-scoped policies (`auth.uid()`),
- are granted `select, insert, update, delete` to `authenticated` only,
- are **not** granted to `anon`; an anonymous request returns `401`, and a
  signed-in user only sees their own rows.

> Supabase's default privileges grant `anon` and `authenticated` the full set of
> table privileges on new tables in `public`, so a `grant ... to authenticated`
> alone does **not** keep anon out. `20261101000100_revoke_anon_grants.sql` is
> what enforces it — mirror that `revoke` when adding a table.

Apply the migrations to a fresh project one of these ways:

```bash
# Supabase CLI (installed globally)
supabase link --project-ref <project-ref>
supabase db push

# or over psql with the pooler connection string, in filename order
for f in supabase/migrations/*.sql; do
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$f" || break
done
```

The direct database host is IPv6-only on Supabase projects; use the Supavisor
pooler (Dashboard → **Connect**, session mode on port `5432`) if your network has
no IPv6. Running the migration is not optional: until it is applied the
`public` tables do not exist, `GET /rest/v1/profiles` returns `PGRST205`, and the
`handle_new_user` trigger that creates a profile on sign-up is absent — so a new
Google user appears in **Authentication → Users** but no `profiles` row is
written.

After the init migration, apply
[`20261101000000_backfill_profiles.sql`](../supabase/migrations/20261101000000_backfill_profiles.sql)
too: it creates profile rows for accounts that signed in before the trigger
existed (the trigger only fires on future inserts). It is idempotent.

If the tables exist but the Data API still reports `PGRST205`, reload the
PostgREST schema cache with `notify pgrst, 'reload schema';`.

Regenerate types after schema changes:

```bash
npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" > lib/supabase/types.ts
```

## Resume uploads and Gemini parsing

The resume flow touches three places:

1. **Storage** — the private `resumes` bucket (`10 MB`, `application/pdf` only).
   Objects live at `<user_id>/<resume_id>-<file name>`, and the four
   `storage.objects` policies from `20261102000000_resumes.sql` scope every
   operation to the first path segment, which is the owner's `auth.uid()`.
2. **`resumes` table** — one row per upload with `status`
   (`uploaded` → `parsing` → `parsed` / `failed`), `parsed_data` (JSONB), and
   `parse_error`. Owner-scoped RLS, same pattern as the other tables.
3. **`profiles`** — parsed fields are written as a *partial* patch, so a sparse
   resume never erases details the user already typed. The Profile form later
   writes a full update.

Parsing happens in `app/dashboard/resume/actions.ts`: the PDF bytes are sent to
Gemini (`lib/ai/gemini.ts`) through the Interactions API
(`ai.interactions.create`) with native PDF input, a JSON Schema in
`response_format`, and `store: false` so resumes are not retained in Google's
interaction history. The default model is `gemini-3.8-flash`; override it with
`GEMINI_MODEL`. The result is normalized by `lib/resume/data.ts` before storage.
If parsing fails, the uploaded row is kept as `failed` and the Resume page offers
**Retry parse** instead of forcing a re-upload.

Resumes are uploaded through a Server Action, so `next.config.ts` raises
`experimental.serverActions.bodySizeLimit` to `12mb` (the default is 1 MB).

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
`app/auth/actions.ts`). Google is **enabled** on the Supabase project
(`external.google: true`), and a successful sign-in creates the user in
**Authentication → Users** plus a `profiles` row via the `handle_new_user`
trigger.

The setup below is what that provider configuration requires — use it when
moving to a new project or recreating the OAuth client:

1. **Create a Google OAuth client** in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: **Web application**
   - Authorized JavaScript origin: `http://localhost:3000` (plus your production
     origin)
   - Authorized redirect URI:
     `https://uweasnrlduvnobzhhrcx.supabase.co/auth/v1/callback`
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

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Google/OAuth callback redirects to `/auth/error?message=Database error saving new user` (`error_code=unexpected_failure`) | The `on_auth_user_created` trigger raised. Almost always `public.profiles` is missing or was dropped while the trigger survived. | Re-run the migrations — `20261031000000_init.sql` is idempotent and recreates the table and the trigger. |
| REST returns `PGRST205` ("Could not find the table … in the schema cache") | Migration not applied, or the PostgREST schema cache is stale. | Run the migrations, then `notify pgrst, 'reload schema';`. |
| REST returns `401` with the publishable key | Expected: `anon` has no grants on these tables. | Sign in and send the user's access token. |
| A profile row is missing for an existing user | The user signed up before the trigger existed. | Run `20261101000000_backfill_profiles.sql`. |
| Resume upload says `GEMINI_API_KEY is not configured` | The key is missing from `.env.local` or the server was not restarted. | Add `GEMINI_API_KEY`, restart `npm run dev`, then retry the parse on `/dashboard/resume`. |
| Resume upload fails before reaching the action | The PDF is over the Server Action body limit. | `experimental.serverActions.bodySizeLimit` is `12mb` in `next.config.ts`; keep it above the bucket's 10 MB limit. |
| Storage returns `new row violates row-level security policy` | The object path does not start with the user's id. | Upload to `${user.id}/…`; the storage policies key off the first folder segment. |

Never drop the `public` tables while the `auth.users` trigger still exists: auth
inserts fail and nobody can sign up. Re-running `20261031000000_init.sql` always
repairs that state.
