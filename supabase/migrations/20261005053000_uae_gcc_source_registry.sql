-- UAE/GCC source registry for the evidence-first ingestion pipeline.
-- This migration changes configuration only; it does not publish articles.

ALTER TABLE public.news_sources
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'MENA',
  ADD COLUMN IF NOT EXISTS direct_monitor BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS discovery_only_reason TEXT;

INSERT INTO public.news_sources
  (source_name, domain, feed_url, source_tier, source_type, reliability_score,
   is_primary_source, allowed_for_auto_publish, requires_corroboration, region,
   direct_monitor, discovery_only_reason)
VALUES
  ('Khazna Data Centers', 'khaznadatacenters.com', 'https://khaznadatacenters.com/feed/', 1, 'primary', 94, TRUE, TRUE, TRUE, 'UAE', TRUE, NULL),
  ('MEEZA', 'meeza.net', 'https://www.meeza.net/category/news-and-press-releases/feed/', 1, 'primary', 92, TRUE, TRUE, TRUE, 'GCC', TRUE, NULL),
  ('G42', 'g42.ai', NULL, 1, 'primary', 92, TRUE, TRUE, TRUE, 'UAE', FALSE, 'Official announcements are discovered through GDELT until a stable public feed or sitemap adapter is added.'),
  ('Core42', 'core42.ai', NULL, 1, 'primary', 92, TRUE, TRUE, TRUE, 'UAE', FALSE, 'Official announcements are discovered through GDELT until a stable public feed or sitemap adapter is added.'),
  ('DataVolt', 'data-volt.com', NULL, 1, 'primary', 88, TRUE, TRUE, TRUE, 'GCC', FALSE, 'Official announcements are discovered through GDELT until a stable public feed or sitemap adapter is added.'),
  ('Center3', 'center3.com', NULL, 1, 'primary', 92, TRUE, TRUE, TRUE, 'GCC', FALSE, 'Official announcements are discovered through GDELT until a stable public feed or sitemap adapter is added.'),
  ('e&', 'eand.com', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE, 'UAE', FALSE, 'Official announcements are discovered through GDELT until a stable public feed or sitemap adapter is added.'),
  ('Moro Hub', 'morohub.com', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE, 'UAE', FALSE, 'Official announcements are discovered through GDELT until a stable public feed or sitemap adapter is added.'),
  ('Gulf Data Hub', 'gulfdatahub.ae', NULL, 1, 'primary', 88, TRUE, TRUE, TRUE, 'UAE', FALSE, 'Official announcements are discovered through GDELT until a stable public feed or sitemap adapter is added.'),
  ('Reuters', 'reuters.com', NULL, 2, 'established_business_media', 96, FALSE, FALSE, TRUE, 'MENA', FALSE, 'Discovery-only because no licensed direct feed is configured.'),
  ('MEED', 'meed.com', NULL, 2, 'established_business_media', 90, FALSE, FALSE, TRUE, 'GCC', FALSE, 'Discovery-only because no licensed direct feed is configured.'),
  ('Gulf Business', 'gulfbusiness.com', NULL, 2, 'established_business_media', 84, FALSE, FALSE, TRUE, 'GCC', FALSE, 'Discovery-only because no licensed direct feed is configured.'),
  ('Arabian Business', 'arabianbusiness.com', NULL, 2, 'established_business_media', 84, FALSE, FALSE, TRUE, 'GCC', FALSE, 'Discovery-only because no licensed direct feed is configured.'),
  ('Zawya', 'zawya.com', NULL, 2, 'established_business_media', 84, FALSE, FALSE, TRUE, 'MENA', FALSE, 'Discovery-only because no licensed direct feed is configured.')
ON CONFLICT (domain) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  feed_url = EXCLUDED.feed_url,
  source_tier = EXCLUDED.source_tier,
  source_type = EXCLUDED.source_type,
  reliability_score = EXCLUDED.reliability_score,
  is_primary_source = EXCLUDED.is_primary_source,
  allowed_for_auto_publish = EXCLUDED.allowed_for_auto_publish,
  requires_corroboration = EXCLUDED.requires_corroboration,
  region = EXCLUDED.region,
  direct_monitor = EXCLUDED.direct_monitor,
  discovery_only_reason = EXCLUDED.discovery_only_reason,
  is_active = TRUE,
  updated_at = now();

-- Retire previously polled sources removed from the low-noise policy.
UPDATE public.news_sources
SET is_active = FALSE, direct_monitor = FALSE, updated_at = now()
WHERE domain IN ('blocksandfiles.com', 'servethehome.com');

CREATE INDEX IF NOT EXISTS news_sources_region_active_idx
  ON public.news_sources (region, is_active, source_tier);
