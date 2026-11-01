-- Supabase's default privileges grant `anon` and `authenticated` the full set of
-- table privileges on every new table in `public`, which silently overrides the
-- narrow `grant ... to authenticated` in 20261031000000_init.sql. RLS still
-- blocks anon requests (there are no anon policies), but the tables should not
-- be reachable by anon at all, and `authenticated` should not hold TRUNCATE
-- (which RLS does not police) or REFERENCES/TRIGGER.
--
-- Revoke the defaults, then re-grant only what the app actually uses.

revoke all on table
  public.profiles,
  public.job_applications,
  public.application_events
from anon;

revoke all on table
  public.profiles,
  public.job_applications,
  public.application_events
from authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.job_applications,
  public.application_events
to authenticated;
