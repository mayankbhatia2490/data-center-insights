
CREATE TABLE public.daily_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  digest_date DATE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Digests are publicly readable"
  ON public.daily_digests
  FOR SELECT
  USING (true);

CREATE INDEX idx_digests_date ON public.daily_digests (digest_date DESC);
