-- Restrict market_signals and regional_outlook to active premium subscribers.
-- Anonymous/free readers get a teaser view with sensitive columns nulled out.

-- 1. Entitlement check, single source of truth for RLS + teaser views.
-- No uid parameter on purpose: it can only ever answer "is the calling session
-- premium", never probe an arbitrary user id via the exposed RPC endpoint.
create or replace function public.has_active_subscription()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscribers
    where user_id = auth.uid()
      and subscription_tier = 'premium'
  );
$$;

revoke all on function public.has_active_subscription() from public;
grant execute on function public.has_active_subscription() to anon, authenticated;

-- 2. Lock down the base tables: no anon access, authenticated only when entitled.
drop policy if exists "Public read market_signals" on public.market_signals;
create policy "Premium members read market_signals"
  on public.market_signals
  for select
  to authenticated
  using (public.has_active_subscription());

drop policy if exists "Public read regional_outlook" on public.regional_outlook;
create policy "Premium members read regional_outlook"
  on public.regional_outlook
  for select
  to authenticated
  using (public.has_active_subscription());

-- 3. Teaser views: full rows for entitled readers, headline-only + locked flag otherwise.
-- Owned by the migration role (same owner as the base tables), so they read the base
-- tables with the owner's privileges (bypassing the policies above) and apply the
-- tiering logic themselves -- the standard Supabase pattern for a public "preview"
-- over a row-level-secured table. This intentionally trips the `security_definer_view`
-- advisor lint; that is the point of the design, not an oversight.
create or replace view public.market_signals_public as
select
  id,
  type,
  title,
  region,
  case when public.has_active_subscription() then reason else null end as reason,
  case when public.has_active_subscription() then confidence else null end as confidence,
  created_at,
  case when public.has_active_subscription() then source_article_ids else null end as source_article_ids,
  case when public.has_active_subscription() then confidence_tier else null end as confidence_tier,
  not public.has_active_subscription() as locked
from public.market_signals
order by created_at desc;

create or replace view public.regional_outlook_public as
select
  id,
  region,
  case when public.has_active_subscription() then outlook else null end as outlook,
  case when public.has_active_subscription() then demand_score else null end as demand_score,
  case when public.has_active_subscription() then risk_score else null end as risk_score,
  case when public.has_active_subscription() then opportunity_score else null end as opportunity_score,
  updated_at,
  case when public.has_active_subscription() then source_article_ids else null end as source_article_ids,
  case when public.has_active_subscription() then confidence_tier else null end as confidence_tier,
  not public.has_active_subscription() as locked
from public.regional_outlook
order by region;

grant select on public.market_signals_public to anon, authenticated;
grant select on public.regional_outlook_public to anon, authenticated;
