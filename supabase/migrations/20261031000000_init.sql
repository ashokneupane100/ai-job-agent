-- Core schema for the AI job application agent.
--
-- Tables created after 2026-10-30 are not exposed to the Data API automatically,
-- so every table is granted explicitly to `authenticated` below. RLS is enabled
-- on all of them and policies are owner-scoped.

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  contact_email text,
  phone text,
  location text,
  website text,
  linkedin_url text,
  github_url text,
  summary text,
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Candidate profile, one row per auth user.';

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

grant select, insert, update, delete on table public.profiles to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger functions never need to be callable over the Data API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Re-running this migration must not fail on the trigger that already exists
-- (a stale trigger pointing at a dropped table breaks every sign-up).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- job_applications
-- ---------------------------------------------------------------------------
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null check (length(trim(company_name)) > 0),
  job_title text not null check (length(trim(job_title)) > 0),
  job_url text,
  location text,
  work_mode text check (work_mode in ('onsite', 'hybrid', 'remote')),
  employment_type text check (
    employment_type in (
      'full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance'
    )
  ),
  status text not null default 'saved' check (
    status in ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')
  ),
  source text,
  salary_min integer check (salary_min >= 0),
  salary_max integer check (salary_max >= 0),
  salary_currency text not null default 'USD' check (char_length(salary_currency) = 3),
  applied_at timestamptz,
  next_action_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets application_events enforce that an event's owner matches its application.
  unique (id, user_id),
  check (salary_max is null or salary_min is null or salary_max >= salary_min)
);

comment on table public.job_applications is 'One row per job application tracked by a user.';

create index if not exists job_applications_user_status_idx
  on public.job_applications (user_id, status);

create index if not exists job_applications_user_updated_idx
  on public.job_applications (user_id, updated_at desc);

create index if not exists job_applications_user_next_action_idx
  on public.job_applications (user_id, next_action_at)
  where next_action_at is not null;

alter table public.job_applications enable row level security;

drop policy if exists "Users can view their own applications" on public.job_applications;
create policy "Users can view their own applications"
  on public.job_applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own applications" on public.job_applications;
create policy "Users can insert their own applications"
  on public.job_applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own applications" on public.job_applications;
create policy "Users can update their own applications"
  on public.job_applications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own applications" on public.job_applications;
create policy "Users can delete their own applications"
  on public.job_applications for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.job_applications to authenticated;

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- application_events
-- ---------------------------------------------------------------------------
create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'note' check (
    kind in ('note', 'status_change', 'interview', 'email', 'follow_up', 'offer', 'rejection')
  ),
  from_status text,
  to_status text,
  title text,
  body text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (application_id, user_id)
    references public.job_applications (id, user_id)
    on delete cascade
);

comment on table public.application_events is 'Timeline of notes, interviews, and status changes for an application.';

create index if not exists application_events_user_occurred_idx
  on public.application_events (user_id, occurred_at desc);

create index if not exists application_events_application_occurred_idx
  on public.application_events (application_id, occurred_at desc);

alter table public.application_events enable row level security;

drop policy if exists "Users can view their own application events" on public.application_events;
create policy "Users can view their own application events"
  on public.application_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own application events" on public.application_events;
create policy "Users can insert their own application events"
  on public.application_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own application events" on public.application_events;
create policy "Users can update their own application events"
  on public.application_events for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own application events" on public.application_events;
create policy "Users can delete their own application events"
  on public.application_events for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.application_events to authenticated;
