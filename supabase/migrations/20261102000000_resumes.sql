-- Resume uploads, AI parsing, and the richer profile fields that parsing fills.
--
-- Idempotent on purpose: this migration is also the repair path for a database
-- whose public tables were dropped while the auth trigger survived.

-- ---------------------------------------------------------------------------
-- profiles: structured resume sections
-- ---------------------------------------------------------------------------
-- Scalar fields (headline, summary, skills, links, …) already exist in
-- 20261031000000_init.sql. These columns hold the repeatable sections. JSONB is
-- used because each section is a document-like list that is always read and
-- written as a whole by the Profile form.
alter table public.profiles
  add column if not exists experience jsonb not null default '[]'::jsonb,
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists projects jsonb not null default '[]'::jsonb,
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists links jsonb not null default '[]'::jsonb,
  add column if not exists languages text[] not null default '{}',
  add column if not exists achievements text[] not null default '{}';

comment on column public.profiles.experience is
  'Work experience entries extracted from the resume (company, title, dates, highlights).';
comment on column public.profiles.education is
  'Education entries extracted from the resume.';
comment on column public.profiles.projects is
  'Projects extracted from the resume.';
comment on column public.profiles.certifications is
  'Certifications extracted from the resume.';
comment on column public.profiles.links is
  'Additional links extracted from the resume.';

-- ---------------------------------------------------------------------------
-- resumes
-- ---------------------------------------------------------------------------
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  mime_type text not null default 'application/pdf',
  file_size bigint,
  status text not null default 'uploaded' check (
    status in ('uploaded', 'parsing', 'parsed', 'failed')
  ),
  parsed_data jsonb,
  parse_error text,
  parsed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.resumes is
  'Uploaded resumes and the structured data Gemini extracted from each one.';

create index if not exists resumes_user_created_idx
  on public.resumes (user_id, created_at desc);

create index if not exists resumes_user_status_idx
  on public.resumes (user_id, status);

alter table public.resumes enable row level security;

drop policy if exists "Users can view their own resumes" on public.resumes;
create policy "Users can view their own resumes"
  on public.resumes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own resumes" on public.resumes;
create policy "Users can insert their own resumes"
  on public.resumes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own resumes" on public.resumes;
create policy "Users can update their own resumes"
  on public.resumes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own resumes" on public.resumes;
create policy "Users can delete their own resumes"
  on public.resumes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Supabase's default privileges give `anon` full rights on new public tables.
revoke all on table public.resumes from anon;
grant select, insert, update, delete on table public.resumes to authenticated;

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage: private "resumes" bucket, one folder per user
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MB, mirrors the app-side limit
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored at "<user_id>/<resume_id>-<file name>", so the first path
-- segment is the owner.
drop policy if exists "Users can read their own resume files" on storage.objects;
create policy "Users can read their own resume files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload their own resume files" on storage.objects;
create policy "Users can upload their own resume files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can update their own resume files" on storage.objects;
create policy "Users can update their own resume files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own resume files" on storage.objects;
create policy "Users can delete their own resume files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

notify pgrst, 'reload schema';
