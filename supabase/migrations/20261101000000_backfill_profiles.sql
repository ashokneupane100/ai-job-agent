-- Backfill `public.profiles` for auth users that were created before the
-- `on_auth_user_created` trigger existed (or while it was missing).
--
-- `handle_new_user` only fires on future inserts into `auth.users`, so an
-- account that signed in with Google before the trigger was installed has no
-- profile row until this runs. Safe to re-run: existing rows are left alone.

insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  )
from auth.users u
on conflict (id) do nothing;
