-- Restrict strategic_insights the same way as market_signals/regional_outlook
-- (see 20260926140000_lock_market_signals_regional_outlook.sql): reuse
-- has_active_subscription(), lock the base table to entitled authenticated
-- readers, and expose a teaser view with the paywalled column nulled out.

drop policy if exists "Public read strategic_insights" on public.strategic_insights;
create policy "Premium members read strategic_insights"
  on public.strategic_insights
  for select
  to authenticated
  using (public.has_active_subscription());

-- strategic_insights has no separate headline column -- sector/region/horizon
-- act as the teaser, and the paywalled detail is the `insight` text itself.
create or replace view public.strategic_insights_public as
select
  id,
  sector,
  region,
  horizon,
  case when public.has_active_subscription() then insight else null end as insight,
  created_at,
  case when public.has_active_subscription() then source_article_ids else null end as source_article_ids,
  case when public.has_active_subscription() then confidence_tier else null end as confidence_tier,
  not public.has_active_subscription() as locked
from public.strategic_insights
order by created_at desc;

grant select on public.strategic_insights_public to anon, authenticated;
