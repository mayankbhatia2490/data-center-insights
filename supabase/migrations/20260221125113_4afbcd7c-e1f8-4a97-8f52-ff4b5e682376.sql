
-- =========================
-- PEOPLE / LEADERS
-- =========================
CREATE TABLE IF NOT EXISTS people_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  role text,
  company text,
  region text,
  country text,
  bio text,
  source_url text,
  last_seen timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =========================
-- COMPANY CAPACITY (MW)
-- =========================
CREATE TABLE IF NOT EXISTS company_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text,
  city text,
  country text,
  region text,
  capacity_mw numeric,
  source_url text,
  last_updated date
);

-- =========================
-- MARKET SIGNALS
-- =========================
CREATE TABLE IF NOT EXISTS market_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  title text,
  region text,
  reason text,
  confidence numeric,
  created_at timestamptz DEFAULT now()
);

-- =========================
-- REGIONAL OUTLOOK
-- =========================
CREATE TABLE IF NOT EXISTS regional_outlook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text,
  outlook text,
  demand_score int,
  risk_score int,
  opportunity_score int,
  updated_at timestamptz
);

-- =========================
-- STRATEGIC INSIGHTS
-- =========================
CREATE TABLE IF NOT EXISTS strategic_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight text,
  sector text,
  region text,
  horizon text,
  created_at timestamptz DEFAULT now()
);

-- =========================
-- WORD CLOUD (24H)
-- =========================
CREATE TABLE IF NOT EXISTS word_cloud (
  word text PRIMARY KEY,
  count int,
  last_updated timestamptz
);

-- =========================
-- STATISTICS TABLES
-- =========================
CREATE TABLE IF NOT EXISTS dc_capacity_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text,
  total_capacity_gw numeric,
  growth_rate_pct numeric,
  last_updated date,
  source text
);

CREATE TABLE IF NOT EXISTS dc_company_capacity_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text,
  total_capacity_gw numeric,
  region text,
  rank integer,
  last_updated date,
  source text
);

CREATE TABLE IF NOT EXISTS dc_energy_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text,
  consumption_twh numeric,
  percent_of_electricity numeric,
  last_updated date,
  source text
);

CREATE TABLE IF NOT EXISTS dc_investment_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer,
  total_investment_usd numeric,
  growth_pct numeric,
  source text
);

-- =========================
-- ENABLE RLS ON ALL NEW TABLES
-- =========================
ALTER TABLE people_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_outlook ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_cloud ENABLE ROW LEVEL SECURITY;
ALTER TABLE dc_capacity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE dc_company_capacity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE dc_energy_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE dc_investment_stats ENABLE ROW LEVEL SECURITY;

-- =========================
-- PUBLIC READ POLICIES (data written via edge functions only)
-- =========================
CREATE POLICY "Public read people_leaders" ON people_leaders FOR SELECT USING (true);
CREATE POLICY "Public read company_capacity" ON company_capacity FOR SELECT USING (true);
CREATE POLICY "Public read market_signals" ON market_signals FOR SELECT USING (true);
CREATE POLICY "Public read regional_outlook" ON regional_outlook FOR SELECT USING (true);
CREATE POLICY "Public read strategic_insights" ON strategic_insights FOR SELECT USING (true);
CREATE POLICY "Public read word_cloud" ON word_cloud FOR SELECT USING (true);
CREATE POLICY "Public read dc_capacity_stats" ON dc_capacity_stats FOR SELECT USING (true);
CREATE POLICY "Public read dc_company_capacity_stats" ON dc_company_capacity_stats FOR SELECT USING (true);
CREATE POLICY "Public read dc_energy_usage" ON dc_energy_usage FOR SELECT USING (true);
CREATE POLICY "Public read dc_investment_stats" ON dc_investment_stats FOR SELECT USING (true);
