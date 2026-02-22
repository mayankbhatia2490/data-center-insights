-- Table for donut/pie chart segment data (market model, regional split, AI workload, MENA breakdown)
CREATE TABLE public.dc_market_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_key TEXT NOT NULL,
  chart_title TEXT NOT NULL,
  chart_subtitle TEXT,
  segment_name TEXT NOT NULL,
  segment_value NUMERIC NOT NULL,
  segment_color TEXT,
  sort_order INTEGER DEFAULT 0,
  last_updated DATE DEFAULT CURRENT_DATE,
  source TEXT
);

ALTER TABLE public.dc_market_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read dc_market_segments"
  ON public.dc_market_segments FOR SELECT
  USING (true);

-- Index for fast chart lookups
CREATE INDEX idx_dc_market_segments_chart_key ON public.dc_market_segments (chart_key, sort_order);

-- Populate: Hyperscale vs Colocation
INSERT INTO public.dc_market_segments (chart_key, chart_title, chart_subtitle, segment_name, segment_value, segment_color, sort_order, source) VALUES
('hyperscale_vs_colocation', 'Hyperscale vs Colocation', 'Global capacity share by model', 'Hyperscale', 44, 'hsl(var(--primary))', 1, 'AI Analysis'),
('hyperscale_vs_colocation', 'Hyperscale vs Colocation', 'Global capacity share by model', 'Colocation', 22, 'hsl(210 80% 55%)', 2, 'AI Analysis'),
('hyperscale_vs_colocation', 'Hyperscale vs Colocation', 'Global capacity share by model', 'On-Premise', 34, 'hsl(var(--muted))', 3, 'AI Analysis');

-- Populate: Regional Capacity Split (with MENA as separate)
INSERT INTO public.dc_market_segments (chart_key, chart_title, chart_subtitle, segment_name, segment_value, segment_color, sort_order, source) VALUES
('regional_capacity', 'Regional Capacity Split', 'Global power distribution by region', 'United States', 48, 'hsl(var(--primary))', 1, 'AI Analysis'),
('regional_capacity', 'Regional Capacity Split', 'Global power distribution by region', 'MENA', 12, 'hsl(25 80% 50%)', 2, 'AI Analysis'),
('regional_capacity', 'Regional Capacity Split', 'Global power distribution by region', 'China', 15, 'hsl(47 90% 50%)', 3, 'AI Analysis'),
('regional_capacity', 'Regional Capacity Split', 'Global power distribution by region', 'Europe', 14, 'hsl(210 80% 55%)', 4, 'AI Analysis'),
('regional_capacity', 'Regional Capacity Split', 'Global power distribution by region', 'Rest of World', 11, 'hsl(var(--muted))', 5, 'AI Analysis');

-- Populate: AI Workload Power
INSERT INTO public.dc_market_segments (chart_key, chart_title, chart_subtitle, segment_name, segment_value, segment_color, sort_order, source) VALUES
('ai_workload', 'AI Workload Power', 'Projected AI share of total DC load', 'AI Workloads', 38, 'hsl(280 55% 55%)', 1, 'AI Analysis'),
('ai_workload', 'AI Workload Power', 'Projected AI share of total DC load', 'Standard', 62, 'hsl(var(--muted))', 2, 'AI Analysis');

-- Populate: MENA Capacity Breakdown
INSERT INTO public.dc_market_segments (chart_key, chart_title, chart_subtitle, segment_name, segment_value, segment_color, sort_order, source) VALUES
('mena_breakdown', 'MENA Capacity Breakdown', 'Regional split across the Middle East', 'UAE', 35, 'hsl(25 80% 50%)', 1, 'AI Analysis'),
('mena_breakdown', 'MENA Capacity Breakdown', 'Regional split across the Middle East', 'Saudi Arabia', 28, 'hsl(142 60% 40%)', 2, 'AI Analysis'),
('mena_breakdown', 'MENA Capacity Breakdown', 'Regional split across the Middle East', 'Qatar', 12, 'hsl(210 80% 55%)', 3, 'AI Analysis'),
('mena_breakdown', 'MENA Capacity Breakdown', 'Regional split across the Middle East', 'Bahrain', 9, 'hsl(340 55% 50%)', 4, 'AI Analysis'),
('mena_breakdown', 'MENA Capacity Breakdown', 'Regional split across the Middle East', 'Oman', 9, 'hsl(47 90% 50%)', 5, 'AI Analysis'),
('mena_breakdown', 'MENA Capacity Breakdown', 'Regional split across the Middle East', 'Kuwait', 7, 'hsl(280 55% 55%)', 6, 'AI Analysis');

-- Also add MENA regional rows to dc_capacity_stats
INSERT INTO public.dc_capacity_stats (region, total_capacity_gw, growth_rate_pct, last_updated, source) VALUES
('MENA', 5.4, 28, '2026-02-22', 'AI Analysis'),
('UAE', 2.3, 32, '2026-02-22', 'AI Analysis'),
('Saudi Arabia', 1.5, 25, '2026-02-22', 'AI Analysis'),
('Qatar', 0.6, 20, '2026-02-22', 'AI Analysis'),
('Bahrain', 0.5, 18, '2026-02-22', 'AI Analysis'),
('Oman', 0.3, 15, '2026-02-22', 'AI Analysis'),
('Kuwait', 0.2, 12, '2026-02-22', 'AI Analysis');