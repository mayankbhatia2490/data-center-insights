-- Streamline news ingestion around public.news_sources as the single source of truth.

CREATE TABLE IF NOT EXISTS public.news_candidate_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_source TEXT NOT NULL,
  discovered_url TEXT NOT NULL,
  source_domain TEXT,
  title TEXT,
  published_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  raw_payload JSONB,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discovery_source, discovered_url)
);

ALTER TABLE public.news_candidate_quarantine ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read quarantined candidates" ON public.news_candidate_quarantine;
CREATE POLICY "Admins can read quarantined candidates"
  ON public.news_candidate_quarantine FOR SELECT
  USING (false);

CREATE INDEX IF NOT EXISTS news_candidate_quarantine_date_idx
  ON public.news_candidate_quarantine (discovered_at DESC);

ALTER TABLE public.news_sources
  ADD COLUMN IF NOT EXISTS last_item_count INTEGER,
  ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0;

-- Prevent old low-trust direct-feed rows from being used by the registry-driven poller.
UPDATE public.news_sources
SET direct_monitor = FALSE,
    is_active = FALSE,
    updated_at = now()
WHERE domain IN ('blocksandfiles.com', 'servethehome.com');

-- Enable approved specialist feeds that already have registered feed URLs.
UPDATE public.news_sources
SET direct_monitor = TRUE,
    updated_at = now()
WHERE domain IN ('datacenterdynamics.com', 'datacenterknowledge.com', 'capacitymedia.com', 'theregister.com')
  AND is_active = TRUE
  AND feed_url IS NOT NULL;

-- These endpoints currently reject automated XML polling; retain the sources
-- for GDELT/discovery and official-page validation instead of retrying noise.
UPDATE public.news_sources
SET direct_monitor = FALSE,
    discovery_only_reason = 'Direct endpoint currently returns 403/404; use discovery or an approved official-page adapter.',
    updated_at = now()
WHERE domain IN ('datacenterdynamics.com', 'theregister.com');

-- Existing unknown GDELT noise is retained for audit but marked rejected so it
-- cannot be promoted or published by downstream jobs.
UPDATE public.news_candidates
SET candidate_status = 'rejected',
    failure_reason = COALESCE(failure_reason, 'Unknown discovery domain quarantined by source policy'),
    validated_at = COALESCE(validated_at, now())
WHERE discovery_source = 'gdelt'
  AND source_tier IS NULL
  AND candidate_status IN ('discovered', 'pending_review');
