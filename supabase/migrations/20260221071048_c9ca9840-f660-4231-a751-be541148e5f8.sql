
-- Create events table for upcoming industry events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  date_text TEXT,
  start_date DATE,
  end_date DATE,
  source_url TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are publicly readable"
  ON public.events
  FOR SELECT
  USING (true);

CREATE INDEX idx_events_start_date ON public.events (start_date ASC);

-- Create market_tickers table for live stock data
CREATE TABLE public.market_tickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC,
  change_percent TEXT,
  status TEXT DEFAULT 'up',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_tickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tickers are publicly readable"
  ON public.market_tickers
  FOR SELECT
  USING (true);
