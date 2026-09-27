-- Reliable news-source governance and validation metadata.

CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  feed_url TEXT,
  source_tier SMALLINT NOT NULL CHECK (source_tier IN (1, 2)),
  source_type TEXT NOT NULL CHECK (source_type IN ('primary', 'specialist_media', 'established_business_media')),
  reliability_score SMALLINT NOT NULL CHECK (reliability_score BETWEEN 1 AND 100),
  is_primary_source BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_for_auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
  requires_corroboration BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  last_http_status INTEGER,
  last_feed_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS source_tier SMALLINT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_reliability_score SMALLINT,
  ADD COLUMN IF NOT EXISTS is_primary_source BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'legacy_unvalidated',
  ADD COLUMN IF NOT EXISTS validation_score SMALLINT,
  ADD COLUMN IF NOT EXISTS corroboration_count SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validation_notes TEXT;

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_source_tier_check;
ALTER TABLE public.articles
  ADD CONSTRAINT articles_source_tier_check CHECK (source_tier IS NULL OR source_tier IN (1, 2));

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_publication_status_check;
ALTER TABLE public.articles
  ADD CONSTRAINT articles_publication_status_check CHECK (publication_status IN ('published', 'pending_review', 'rejected', 'archived'));

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_validation_status_check;
ALTER TABLE public.articles
  ADD CONSTRAINT articles_validation_status_check CHECK (validation_status IN ('validated_primary', 'validated_specialist', 'needs_corroboration', 'pending_review', 'rejected', 'legacy_unvalidated'));

CREATE INDEX IF NOT EXISTS articles_publication_status_published_at_idx
  ON public.articles (publication_status, published_at DESC);
CREATE INDEX IF NOT EXISTS articles_source_domain_idx
  ON public.articles (source_domain);

INSERT INTO public.news_sources
  (source_name, domain, feed_url, source_tier, source_type, reliability_score, is_primary_source, allowed_for_auto_publish, requires_corroboration)
VALUES
  ('Data Center Dynamics', 'datacenterdynamics.com', 'https://www.datacenterdynamics.com/en/rss/', 2, 'specialist_media', 92, FALSE, TRUE, TRUE),
  ('Data Center Knowledge', 'datacenterknowledge.com', 'https://www.datacenterknowledge.com/rss.xml', 2, 'specialist_media', 90, FALSE, TRUE, TRUE),
  ('Capacity Media', 'capacitymedia.com', 'https://www.capacitymedia.com/feed', 2, 'specialist_media', 88, FALSE, TRUE, TRUE),
  ('Blocks & Files', 'blocksandfiles.com', 'https://blocksandfiles.com/feed/', 2, 'specialist_media', 82, FALSE, TRUE, TRUE),
  ('ServeTheHome', 'servethehome.com', 'https://www.servethehome.com/feed/', 2, 'specialist_media', 80, FALSE, TRUE, TRUE),
  ('The Register', 'theregister.com', 'https://www.theregister.com/data_centre/headlines.atom', 2, 'established_business_media', 86, FALSE, TRUE, TRUE),
  ('Reuters', 'reuters.com', NULL, 2, 'established_business_media', 96, FALSE, FALSE, TRUE),
  ('Gulf Business', 'gulfbusiness.com', NULL, 2, 'established_business_media', 82, FALSE, FALSE, TRUE),
  ('Arabian Business', 'arabianbusiness.com', NULL, 2, 'established_business_media', 82, FALSE, FALSE, TRUE),
  ('MEED', 'meed.com', NULL, 2, 'established_business_media', 88, FALSE, FALSE, TRUE),
  ('Zawya', 'zawya.com', NULL, 2, 'established_business_media', 84, FALSE, FALSE, TRUE)
ON CONFLICT (domain) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  feed_url = EXCLUDED.feed_url,
  source_tier = EXCLUDED.source_tier,
  source_type = EXCLUDED.source_type,
  reliability_score = EXCLUDED.reliability_score,
  allowed_for_auto_publish = EXCLUDED.allowed_for_auto_publish,
  updated_at = now();

-- Existing articles were collected before source governance existed. Keep them visible,
-- but mark them so they are not confused with newly validated reporting.
UPDATE public.articles
SET validation_status = 'legacy_unvalidated'
WHERE validation_status IS NULL OR validation_status = 'pending_review';

ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active news sources" ON public.news_sources;
CREATE POLICY "Public can read active news sources"
  ON public.news_sources FOR SELECT
  USING (is_active = TRUE);
