ALTER TABLE public.data_centers
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS external_parent_id TEXT,
  ADD COLUMN IF NOT EXISTS company_id TEXT,
  ADD COLUMN IF NOT EXISTS profile_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS capacity_type TEXT,
  ADD COLUMN IF NOT EXISTS address_details TEXT,
  ADD COLUMN IF NOT EXISTS postal TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS total_building_size NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS ecosystem_stats JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS data_centers_external_id_idx
  ON public.data_centers(external_id)
  WHERE external_id IS NOT NULL;
