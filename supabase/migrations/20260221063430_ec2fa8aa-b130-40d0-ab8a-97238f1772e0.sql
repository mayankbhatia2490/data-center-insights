
-- Create articles table for storing aggregated news
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  source TEXT,
  source_url TEXT UNIQUE,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  read_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required for viewing news)
CREATE POLICY "Articles are publicly readable"
  ON public.articles
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (edge functions use service role)
-- No insert/update/delete policies for anon role = blocked by default

-- Index for faster queries
CREATE INDEX idx_articles_published_at ON public.articles (published_at DESC);
CREATE INDEX idx_articles_category ON public.articles (category);
