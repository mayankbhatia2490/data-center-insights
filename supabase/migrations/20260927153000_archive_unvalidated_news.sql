-- Remove low-trust and legacy-unvalidated stories from the public feed without deleting history.
UPDATE public.articles
SET publication_status = 'archived',
    validation_status = 'rejected',
    validation_notes = 'Archived by reliable-source policy: source was not an allowlisted Tier 1/2 auto-publish feed.'
WHERE publication_status = 'published'
  AND NOT (
    source_url ILIKE '%datacenterdynamics.com/%'
    OR source_url ILIKE '%datacenterknowledge.com/%'
    OR source_url ILIKE '%capacitymedia.com/%'
    OR source_url ILIKE '%blocksandfiles.com/%'
    OR source_url ILIKE '%servethehome.com/%'
    OR source_url ILIKE '%theregister.com/%'
  );

UPDATE public.articles
SET source_domain = CASE
      WHEN source_url ILIKE '%datacenterdynamics.com/%' THEN 'datacenterdynamics.com'
      WHEN source_url ILIKE '%datacenterknowledge.com/%' THEN 'datacenterknowledge.com'
      WHEN source_url ILIKE '%capacitymedia.com/%' THEN 'capacitymedia.com'
      WHEN source_url ILIKE '%blocksandfiles.com/%' THEN 'blocksandfiles.com'
      WHEN source_url ILIKE '%servethehome.com/%' THEN 'servethehome.com'
      WHEN source_url ILIKE '%theregister.com/%' THEN 'theregister.com'
      ELSE source_domain
    END,
    source_tier = CASE
      WHEN source_url ILIKE '%datacenterdynamics.com/%' THEN 2
      WHEN source_url ILIKE '%datacenterknowledge.com/%' THEN 2
      WHEN source_url ILIKE '%capacitymedia.com/%' THEN 2
      WHEN source_url ILIKE '%blocksandfiles.com/%' THEN 2
      WHEN source_url ILIKE '%servethehome.com/%' THEN 2
      WHEN source_url ILIKE '%theregister.com/%' THEN 2
      ELSE source_tier
    END,
    source_type = CASE
      WHEN source_url ILIKE '%theregister.com/%' THEN 'established_business_media'
      WHEN source_url ILIKE '%datacenterdynamics.com/%' OR source_url ILIKE '%datacenterknowledge.com/%' OR source_url ILIKE '%capacitymedia.com/%' OR source_url ILIKE '%blocksandfiles.com/%' OR source_url ILIKE '%servethehome.com/%' THEN 'specialist_media'
      ELSE source_type
    END
WHERE source_url IS NOT NULL;
