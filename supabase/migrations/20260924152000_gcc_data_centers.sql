-- GCC / Middle East data-center inventory.
-- Seed rows are intentionally marked needs_review: they provide a useful map
-- starting point without pretending that a public directory is a complete census.

CREATE TABLE IF NOT EXISTS public.data_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  operator_name TEXT,
  listing_type TEXT NOT NULL DEFAULT 'facility'
    CHECK (listing_type IN ('land', 'campus', 'multi_tenant_building', 'facility', 'portfolio')),
  parent_id UUID REFERENCES public.data_centers(id) ON DELETE SET NULL,
  lifecycle_stage TEXT NOT NULL DEFAULT 'unknown'
    CHECK (lifecycle_stage IN ('land_banked', 'planned', 'under_construction', 'operational', 'decommissioned', 'unknown')),
  service_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  country TEXT NOT NULL,
  market TEXT,
  city TEXT,
  address TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  location_precision TEXT NOT NULL DEFAULT 'city_centroid'
    CHECK (location_precision IN ('exact', 'approximate', 'city_centroid', 'market', 'restricted', 'undisclosed')),
  capacity_mw NUMERIC(10,2),
  capacity_basis TEXT
    CHECK (capacity_basis IN ('it_load', 'fully_built_out_power', 'design_capacity', 'announced', 'estimated', 'unknown')),
  capacity_status TEXT NOT NULL DEFAULT 'not_disclosed'
    CHECK (capacity_status IN ('reported', 'announced', 'estimated', 'not_disclosed')),
  whitespace_sqm NUMERIC(12,2),
  year_operational INTEGER,
  pue NUMERIC(5,3),
  tier_design TEXT,
  site_code TEXT,
  verification_status TEXT NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified', 'needs_review', 'rejected', 'unverified')),
  verification_score INTEGER NOT NULL DEFAULT 0 CHECK (verification_score BETWEEN 0 AND 100),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (canonical_name, country)
);

CREATE TABLE IF NOT EXISTS public.data_center_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_center_id UUID NOT NULL REFERENCES public.data_centers(id) ON DELETE CASCADE,
  source_url TEXT,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('operator', 'government', 'regulatory', 'industry', 'user_submitted', 'manual_research')),
  source_title TEXT,
  evidence_excerpt TEXT,
  observed_capacity_mw NUMERIC(10,2),
  observed_lifecycle_stage TEXT,
  checked_at TIMESTAMPTZ,
  automated_score INTEGER NOT NULL DEFAULT 0 CHECK (automated_score BETWEEN 0 AND 100),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_center_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_center_id UUID NOT NULL REFERENCES public.data_centers(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.data_center_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'dismissed')),
  reason TEXT,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS data_center_queue_dc_source_idx
  ON public.data_center_review_queue(data_center_id, source_id);
CREATE INDEX IF NOT EXISTS data_centers_geo_idx ON public.data_centers(country, city, lifecycle_stage);
CREATE INDEX IF NOT EXISTS data_centers_capacity_idx ON public.data_centers(capacity_mw DESC NULLS LAST);

ALTER TABLE public.data_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_center_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_center_review_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view data centers" ON public.data_centers;
CREATE POLICY "Public can view data centers" ON public.data_centers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view data center sources" ON public.data_center_sources;
CREATE POLICY "Public can view data center sources" ON public.data_center_sources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can view data center queue" ON public.data_center_review_queue;
CREATE POLICY "Admins can view data center queue" ON public.data_center_review_queue FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can update data center queue" ON public.data_center_review_queue;
CREATE POLICY "Admins can update data center queue" ON public.data_center_review_queue FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Initial curated GCC index. Coordinates are city-centroid or market-level
-- unless a later source confirms an exact site. Capacity is null unless a
-- source directly supports a facility-level number.
INSERT INTO public.data_centers
  (canonical_name, operator_name, country, market, city, latitude, longitude, location_precision, service_types, lifecycle_stage, capacity_status, verification_status)
VALUES
  ('Khazna AUH1', 'Khazna Data Centers', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['colocation','hyperscale'], 'operational', 'not_disclosed', 'needs_review'),
  ('Khazna AUH2', 'Khazna Data Centers', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['colocation','hyperscale'], 'operational', 'not_disclosed', 'needs_review'),
  ('Khazna AUH3', 'Khazna Data Centers', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['colocation','hyperscale'], 'operational', 'not_disclosed', 'needs_review'),
  ('Khazna AUH4', 'Khazna Data Centers', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['colocation','hyperscale','ai'], 'under_construction', 'announced', 'needs_review'),
  ('Khazna AUH8', 'Khazna Data Centers', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['hyperscale','ai'], 'under_construction', 'announced', 'needs_review'),
  ('Equinix AD1', 'Equinix', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['colocation','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('Gulf Data Hub KIZAD 1', 'Gulf Data Hub', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['colocation','hyperscale'], 'operational', 'not_disclosed', 'needs_review'),
  ('Injazat Data Center', 'Core42', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['cloud','government','ai'], 'operational', 'not_disclosed', 'needs_review'),
  ('PureDC Abu Dhabi', 'Pure Data Centres Group', 'United Arab Emirates', 'Abu Dhabi', 'Yas Island', 24.453900, 54.377300, 'city_centroid', ARRAY['colocation','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('Etisalat Abu Dhabi', 'e&', 'United Arab Emirates', 'Abu Dhabi', 'Abu Dhabi', 24.453900, 54.377300, 'city_centroid', ARRAY['telecom','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('DETASAD Gornatha', 'Detecon Al Saudia', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['colocation','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('NourNET Riyadh Data Center', 'NourNet', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['colocation','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('Sahara Net Riyadh Data Center', 'Sahara Net', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['colocation','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('Mobily Malga 1', 'Mobily', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['telecom','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('Mobily Malga 2', 'Mobily', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['telecom','cloud'], 'operational', 'not_disclosed', 'needs_review'),
  ('Center3 Riyadh102', 'Center3', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['colocation','cloud','connectivity'], 'operational', 'not_disclosed', 'needs_review'),
  ('DataVolt Riyadh East DC', 'DataVolt', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['hyperscale','ai'], 'under_construction', 'announced', 'needs_review'),
  ('Sahayeb Data Park Riyadh DC1', 'Sahayab Datacenters', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['colocation','cloud'], 'under_construction', 'announced', 'needs_review'),
  ('Center3 Khurais Riyadh', 'Center3', 'Saudi Arabia', 'Riyadh', 'Riyadh', 24.713600, 46.675300, 'city_centroid', ARRAY['colocation','cloud','connectivity'], 'operational', 'reported', 'needs_review'),
  ('Ooredoo Data Center Doha', 'Ooredoo', 'Qatar', 'Doha', 'Doha', 25.285400, 51.531000, 'city_centroid', ARRAY['telecom','cloud','colocation'], 'operational', 'not_disclosed', 'needs_review'),
  ('Oman Data Park Muscat', 'Oman Data Park', 'Oman', 'Muscat', 'Muscat', 23.588000, 58.382900, 'city_centroid', ARRAY['cloud','colocation'], 'operational', 'not_disclosed', 'needs_review'),
  ('Ooredoo Salalah Data Center', 'Ooredoo', 'Oman', 'Salalah', 'Salalah', 17.019000, 54.089700, 'city_centroid', ARRAY['telecom','cloud','connectivity'], 'operational', 'not_disclosed', 'needs_review'),
  ('Batelco Data Center Manama', 'Batelco', 'Bahrain', 'Manama', 'Manama', 26.223500, 50.587600, 'city_centroid', ARRAY['telecom','cloud','colocation'], 'operational', 'not_disclosed', 'needs_review'),
  ('Zain Data Center Kuwait City', 'Zain', 'Kuwait', 'Kuwait City', 'Kuwait City', 29.375900, 47.977400, 'city_centroid', ARRAY['telecom','cloud','colocation'], 'operational', 'not_disclosed', 'needs_review')
ON CONFLICT (canonical_name, country) DO NOTHING;

-- Facility-level capacity from a public industry report; kept separate from
-- announced portfolio capacity so statistics do not overstate live supply.
INSERT INTO public.data_center_sources (data_center_id, source_name, source_type, source_url, source_title, observed_capacity_mw, evidence_excerpt, automated_score, review_status)
SELECT id, 'Data Center Dynamics', 'industry', 'https://www.datacenterdynamics.com/en/news/datavolt-and-center3-partner-for-saudi-arabian-data-center-operations/', 'DataVolt and Center3 partner for Saudi Arabian data center operations', 9.6, 'Center3 expanded its Khurais Riyadh facility with an additional 9.6MW of capacity.', 70, 'pending'
FROM public.data_centers WHERE canonical_name = 'Center3 Khurais Riyadh' AND country = 'Saudi Arabia'
  AND NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id = public.data_centers.id AND s.source_url LIKE '%datacenterdynamics.com%');

UPDATE public.data_centers dc SET capacity_mw = 9.6, capacity_basis = 'it_load', capacity_status = 'reported', verification_score = 70
WHERE dc.canonical_name = 'Center3 Khurais Riyadh' AND dc.country = 'Saudi Arabia';
