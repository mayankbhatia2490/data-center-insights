-- Registry-only update: keep public.news_sources in sync with the domains now
-- recognized by discover-news-gdelt's TRUSTED map (Tier 1 cloud/technology
-- providers and Middle East operators, plus the previously-inactive Tier 2
-- business media already seeded here). This table is documentation/audit,
-- not read at runtime by fetch-news or discover-news-gdelt — both hold their
-- own hardcoded lists that must be updated separately (see
-- docs/reliable-news-validation.md §13).

INSERT INTO public.news_sources
  (source_name, domain, feed_url, source_tier, source_type, reliability_score, is_primary_source, allowed_for_auto_publish, requires_corroboration)
VALUES
  ('Microsoft News Center', 'news.microsoft.com', NULL, 1, 'primary', 98, TRUE, TRUE, TRUE),
  ('AWS News', 'aws.amazon.com', NULL, 1, 'primary', 98, TRUE, TRUE, TRUE),
  ('Google Cloud News', 'cloud.google.com', NULL, 1, 'primary', 98, TRUE, TRUE, TRUE),
  ('Oracle Cloud Blog', 'blogs.oracle.com', NULL, 1, 'primary', 97, TRUE, TRUE, TRUE),
  ('Equinix', 'equinix.com', NULL, 1, 'primary', 95, TRUE, TRUE, TRUE),
  ('Digital Realty', 'digitalrealty.com', NULL, 1, 'primary', 95, TRUE, TRUE, TRUE),
  ('MEEZA', 'meeza.net', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE),
  ('Khazna', 'khazna.ae', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE),
  ('G42', 'g42.ai', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE),
  ('Center3', 'center3.com', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE),
  ('Core42', 'core42.ai', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE),
  ('e&', 'eand.com', NULL, 1, 'primary', 92, TRUE, TRUE, TRUE),
  ('DataVolt', 'data-volt.com', NULL, 1, 'primary', 88, TRUE, TRUE, TRUE),
  ('Moro Hub', 'morohub.com', NULL, 1, 'primary', 88, TRUE, TRUE, TRUE),
  ('Gulf Data Hub', 'gulfdatahub.ae', NULL, 1, 'primary', 85, TRUE, TRUE, TRUE),
  ('Gulf Bridge International', 'gbiinc.com', NULL, 1, 'primary', 82, TRUE, TRUE, TRUE),
  ('NTT Global Data Centers', 'global.ntt', NULL, 1, 'primary', 90, TRUE, TRUE, TRUE)
ON CONFLICT (domain) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_tier = EXCLUDED.source_tier,
  source_type = EXCLUDED.source_type,
  reliability_score = EXCLUDED.reliability_score,
  is_primary_source = EXCLUDED.is_primary_source,
  allowed_for_auto_publish = EXCLUDED.allowed_for_auto_publish,
  updated_at = now();

-- These five were seeded earlier as recognized Tier 2 sources but marked
-- allowed_for_auto_publish = FALSE because nothing polled them directly.
-- discover-news-gdelt's TRUSTED map now recognizes them too, so GDELT-
-- discovered candidates from these domains reach fetch-news's editorial gate
-- the same way any other Tier 2 source does.
UPDATE public.news_sources
SET allowed_for_auto_publish = TRUE, updated_at = now()
WHERE domain IN ('reuters.com', 'gulfbusiness.com', 'arabianbusiness.com', 'meed.com', 'zawya.com');
