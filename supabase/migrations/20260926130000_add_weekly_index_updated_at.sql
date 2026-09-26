-- generate-weekly-index upserts onto the same week_start row all week
-- (now that it runs daily, not just Mondays). created_at is set once by
-- Postgres on the first insert and isn't in the upsert's column list, so
-- it never advances after day one -- which would make a freshness check
-- against created_at report "stale" every week from day 2 onward even
-- though the pipeline is running correctly. Add a real updated_at.
alter table public.weekly_index add column if not exists updated_at timestamptz not null default now();
