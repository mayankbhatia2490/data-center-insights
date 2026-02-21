-- ============================================================
-- Data Center Pulse — Full Database Schema Export
-- Generated: 2026-02-21
-- Target: PostgreSQL 15+ (Supabase-compatible)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Articles (core news content)
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  source TEXT,
  source_url TEXT,
  image_url TEXT,
  read_time TEXT,
  sentiment TEXT,           -- Bullish | Bearish | Neutral
  insight TEXT,             -- AI-generated "Why it matters"
  source_excerpt TEXT,      -- Key quote from article
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- People (extracted industry leaders from articles)
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  organization TEXT,
  region TEXT,
  bio TEXT,
  image_url TEXT,
  known_as TEXT,
  roles JSONB DEFAULT '[]'::jsonb,
  mention_count INTEGER DEFAULT 0,
  importance_score INTEGER DEFAULT 0,
  first_mentioned TIMESTAMPTZ,
  last_mentioned TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Article ↔ People junction table
CREATE TABLE public.article_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  role_in_article TEXT,
  context_excerpt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- People Leaders (standalone leadership directory)
CREATE TABLE public.people_leaders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  role TEXT,
  company TEXT,
  region TEXT,
  country TEXT,
  bio TEXT,
  source_url TEXT,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- People Lists (curated lists of leaders)
CREATE TABLE public.people_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  role_filter TEXT,
  region TEXT,
  is_curated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- People Lists Items (members of a curated list)
CREATE TABLE public.people_lists_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.people_lists(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  rank INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscribers (newsletter)
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT true,
  preferences JSONB DEFAULT '{"categories": ["all"]}'::jsonb,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily Digests (AI-generated morning briefings)
CREATE TABLE public.daily_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  digest_date DATE NOT NULL,
  content TEXT NOT NULL,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Market Tickers (stock prices)
CREATE TABLE public.market_tickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC,
  change_percent TEXT,
  status TEXT DEFAULT 'up',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events (industry conferences)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  date_text TEXT,
  start_date DATE,
  end_date DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Market Signals (AI-detected trends/risks/opportunities)
CREATE TABLE public.market_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT,               -- trend | risk | opportunity
  title TEXT,
  region TEXT,
  reason TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Strategic Insights (actionable business insights)
CREATE TABLE public.strategic_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight TEXT,
  sector TEXT,
  region TEXT,
  horizon TEXT,            -- short-term | medium-term | long-term
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Regional Outlook (per-region market analysis)
CREATE TABLE public.regional_outlook (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT,
  outlook TEXT,
  demand_score INTEGER,
  risk_score INTEGER,
  opportunity_score INTEGER,
  updated_at TIMESTAMPTZ
);

-- Weekly Index (Data Center Pulse Index)
CREATE TABLE public.weekly_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  score INTEGER,           -- -100 to +100
  drivers JSONB,           -- top 3 positive drivers
  risks JSONB,             -- top 3 risks
  outlook TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Word Cloud (AI-extracted trending keywords)
CREATE TABLE public.word_cloud (
  word TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ
);

-- Company Capacity (data center capacity by company)
CREATE TABLE public.company_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT,
  city TEXT,
  country TEXT,
  region TEXT,
  capacity_mw NUMERIC,
  source_url TEXT,
  last_updated DATE
);

-- DC Capacity Stats (global/regional capacity)
CREATE TABLE public.dc_capacity_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT,
  total_capacity_gw NUMERIC,
  growth_rate_pct NUMERIC,
  last_updated DATE,
  source TEXT
);

-- DC Company Capacity Stats (top companies by capacity)
CREATE TABLE public.dc_company_capacity_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT,
  total_capacity_gw NUMERIC,
  region TEXT,
  rank INTEGER,
  last_updated DATE,
  source TEXT
);

-- DC Energy Usage
CREATE TABLE public.dc_energy_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT,
  consumption_twh NUMERIC,
  percent_of_electricity NUMERIC,
  last_updated DATE,
  source TEXT
);

-- DC Investment Stats
CREATE TABLE public.dc_investment_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER,
  total_investment_usd NUMERIC,
  growth_pct NUMERIC,
  source TEXT
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles are publicly readable" ON public.articles FOR SELECT USING (true);

ALTER TABLE public.article_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Article people are publicly readable" ON public.article_people FOR SELECT USING (true);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "People are publicly readable" ON public.people FOR SELECT USING (true);

ALTER TABLE public.people_leaders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read people_leaders" ON public.people_leaders FOR SELECT USING (true);

ALTER TABLE public.people_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "People lists are publicly readable" ON public.people_lists FOR SELECT USING (true);

ALTER TABLE public.people_lists_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "People list items are publicly readable" ON public.people_lists_items FOR SELECT USING (true);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "No public reads" ON public.subscribers FOR SELECT USING (false);

ALTER TABLE public.daily_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Digests are publicly readable" ON public.daily_digests FOR SELECT USING (true);

ALTER TABLE public.market_tickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tickers are publicly readable" ON public.market_tickers FOR SELECT USING (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are publicly readable" ON public.events FOR SELECT USING (true);

ALTER TABLE public.market_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read market_signals" ON public.market_signals FOR SELECT USING (true);

ALTER TABLE public.strategic_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read strategic_insights" ON public.strategic_insights FOR SELECT USING (true);

ALTER TABLE public.regional_outlook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read regional_outlook" ON public.regional_outlook FOR SELECT USING (true);

ALTER TABLE public.weekly_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly index is publicly readable" ON public.weekly_index FOR SELECT USING (true);

ALTER TABLE public.word_cloud ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read word_cloud" ON public.word_cloud FOR SELECT USING (true);

ALTER TABLE public.company_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read company_capacity" ON public.company_capacity FOR SELECT USING (true);

ALTER TABLE public.dc_capacity_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dc_capacity_stats" ON public.dc_capacity_stats FOR SELECT USING (true);

ALTER TABLE public.dc_company_capacity_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dc_company_capacity_stats" ON public.dc_company_capacity_stats FOR SELECT USING (true);

ALTER TABLE public.dc_energy_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dc_energy_usage" ON public.dc_energy_usage FOR SELECT USING (true);

ALTER TABLE public.dc_investment_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dc_investment_stats" ON public.dc_investment_stats FOR SELECT USING (true);


-- ============================================================
-- pg_cron SCHEDULED JOBS
-- Replace YOUR_SUPABASE_URL and YOUR_ANON_KEY with your values
-- ============================================================

-- fetch-news: every 2 hours
SELECT cron.schedule(
  'fetch-news-every-2h',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/fetch-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- fetch-stocks: every 4 hours
SELECT cron.schedule(
  'fetch-stocks-every-4h',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/fetch-stocks',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- fetch-events: daily at 06:00 UTC
SELECT cron.schedule(
  'fetch-events-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/fetch-events',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- generate-digest: daily at 04:00 UTC
SELECT cron.schedule(
  'generate-digest-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/generate-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- send-newsletter: daily at 04:30 UTC
SELECT cron.schedule(
  'send-daily-newsletter',
  '30 4 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/send-newsletter',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- extract-people: daily at 03:00 UTC
SELECT cron.schedule(
  'extract-people-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/extract-people',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- extract-capacity: daily at 04:00 UTC
SELECT cron.schedule(
  'extract-capacity-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/extract-capacity',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- market-signals: daily at 05:00 UTC
SELECT cron.schedule(
  'market-signals-daily',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/market-signals',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- regional-outlook: weekly on Monday at 06:00 UTC
SELECT cron.schedule(
  'regional-outlook-weekly',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/regional-outlook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- strategic-insights: weekly on Monday at 07:00 UTC
SELECT cron.schedule(
  'strategic-insights-weekly',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/strategic-insights',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- word-cloud: daily at 01:00 UTC
SELECT cron.schedule(
  'word-cloud-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/word-cloud',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- fetch-stats: monthly on 1st at 05:00 UTC
SELECT cron.schedule(
  'fetch-stats-monthly',
  '0 5 1 * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/fetch-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- generate-weekly-index: weekly on Monday at 08:00 UTC
SELECT cron.schedule(
  'generate-weekly-index',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/generate-weekly-index',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
