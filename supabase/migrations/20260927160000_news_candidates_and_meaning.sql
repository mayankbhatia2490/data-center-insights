-- Candidate discovery and meaning/evidence fields for reliable news ingestion.

CREATE TABLE IF NOT EXISTS public.news_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_source TEXT NOT NULL,
  discovered_url TEXT NOT NULL,
  canonical_url TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  source_domain TEXT,
  source_tier SMALLINT,
  source_type TEXT,
  source_reliability_score SMALLINT,
  published_at TIMESTAMPTZ,
  candidate_status TEXT NOT NULL DEFAULT 'discovered',
  relevance_score SMALLINT,
  raw_payload JSONB,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  failure_reason TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_at TIMESTAMPTZ,
  UNIQUE (discovery_source, discovered_url)
);

ALTER TABLE public.news_candidates
  DROP CONSTRAINT IF EXISTS news_candidates_status_check;
ALTER TABLE public.news_candidates
  ADD CONSTRAINT news_candidates_status_check CHECK (candidate_status IN ('discovered', 'approved', 'published', 'pending_review', 'rejected', 'expired'));

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS meaning TEXT,
  ADD COLUMN IF NOT EXISTS impact_summary TEXT,
  ADD COLUMN IF NOT EXISTS claim_type TEXT,
  ADD COLUMN IF NOT EXISTS named_entities JSONB,
  ADD COLUMN IF NOT EXISTS importance_score SMALLINT,
  ADD COLUMN IF NOT EXISTS confidence_score SMALLINT,
  ADD COLUMN IF NOT EXISTS primary_source_count SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corroboration_urls JSONB;

CREATE INDEX IF NOT EXISTS news_candidates_status_date_idx
  ON public.news_candidates (candidate_status, discovered_at DESC);
CREATE INDEX IF NOT EXISTS news_candidates_canonical_url_idx
  ON public.news_candidates (canonical_url);
CREATE INDEX IF NOT EXISTS articles_importance_score_idx
  ON public.articles (importance_score DESC NULLS LAST, published_at DESC);

ALTER TABLE public.news_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read approved news candidates" ON public.news_candidates;
CREATE POLICY "Public can read approved news candidates"
  ON public.news_candidates FOR SELECT
  USING (candidate_status IN ('approved', 'published'));
