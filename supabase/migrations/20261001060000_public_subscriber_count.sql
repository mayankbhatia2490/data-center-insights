-- Public, count-only view of confirmed subscribers.
-- The subscribers table is (rightly) not readable by anon, so the homepage count always read 0.
-- This returns a single integer and exposes no rows or emails.
create or replace function public.get_public_subscriber_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.subscribers where confirmed = true;
$$;

revoke all on function public.get_public_subscriber_count() from public;
grant execute on function public.get_public_subscriber_count() to anon, authenticated;

comment on function public.get_public_subscriber_count() is
  'Number of confirmed subscribers. Count only; used by the public site. No row-level data is exposed.';
