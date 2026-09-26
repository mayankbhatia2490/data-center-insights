-- Normalizes the company names that have lived as plain text arrays on
-- data_centers (operators/partners/epcs/contractors/consultants) into a real
-- companies table plus a role-tagged join table. This is additive: the
-- legacy array columns on data_centers are left in place (the extraction
-- pipeline's fuzzy matching and the Stats page map both still read them), so
-- existing consumers keep working while new code migrates onto companies /
-- data_center_companies. Dropping the arrays is a follow-up once every
-- consumer has moved over - a standard expand-and-contract migration.

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- Stored (not just indexed) so PostgREST upsert can target it directly via
  -- onConflict, and so name collisions that only differ by case/whitespace
  -- (“Khazna Data Centers” vs “khazna data centers ”) resolve to one row.
  name_key TEXT GENERATED ALWAYS AS (lower(trim(name))) STORED,
  aliases TEXT[] NOT NULL DEFAULT '{}'::text[],
  website_url TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name_key)
);

CREATE TABLE IF NOT EXISTS public.data_center_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_center_id UUID NOT NULL REFERENCES public.data_centers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('operator', 'partner', 'epc', 'contractor', 'consultant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (data_center_id, company_id, role)
);
CREATE INDEX IF NOT EXISTS data_center_companies_company_idx ON public.data_center_companies(company_id);
CREATE INDEX IF NOT EXISTS data_center_companies_dc_idx ON public.data_center_companies(data_center_id);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_center_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view companies" ON public.companies;
CREATE POLICY "Public can view companies" ON public.companies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view data center companies" ON public.data_center_companies;
CREATE POLICY "Public can view data center companies" ON public.data_center_companies FOR SELECT USING (true);

-- Backfill companies from every existing text source across data_centers.
INSERT INTO public.companies (name)
SELECT DISTINCT trim(n)
FROM (
  SELECT unnest(operators) AS n FROM public.data_centers
  UNION ALL SELECT operator_name FROM public.data_centers WHERE operator_name IS NOT NULL
  UNION ALL SELECT unnest(partners) FROM public.data_centers
  UNION ALL SELECT unnest(epcs) FROM public.data_centers
  UNION ALL SELECT unnest(contractors) FROM public.data_centers
  UNION ALL SELECT unnest(consultants) FROM public.data_centers
) all_names
WHERE n IS NOT NULL AND trim(n) <> ''
ON CONFLICT DO NOTHING;

-- Backfill role links. operator_name is folded into the operator pass in
-- case it ever diverges from operators[] (it shouldn't - a prior migration
-- backfilled operators from operator_name - but this is a one-time backfill,
-- so it costs nothing to be defensive).
INSERT INTO public.data_center_companies (data_center_id, company_id, role)
SELECT dc.id, c.id, 'operator'
FROM public.data_centers dc
CROSS JOIN LATERAL unnest(
  CASE WHEN dc.operator_name IS NOT NULL THEN array_append(dc.operators, dc.operator_name) ELSE dc.operators END
) AS n
JOIN public.companies c ON c.name_key = lower(trim(n))
WHERE trim(n) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.data_center_companies (data_center_id, company_id, role)
SELECT dc.id, c.id, 'partner'
FROM public.data_centers dc CROSS JOIN LATERAL unnest(dc.partners) AS n
JOIN public.companies c ON c.name_key = lower(trim(n))
WHERE trim(n) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.data_center_companies (data_center_id, company_id, role)
SELECT dc.id, c.id, 'epc'
FROM public.data_centers dc CROSS JOIN LATERAL unnest(dc.epcs) AS n
JOIN public.companies c ON c.name_key = lower(trim(n))
WHERE trim(n) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.data_center_companies (data_center_id, company_id, role)
SELECT dc.id, c.id, 'contractor'
FROM public.data_centers dc CROSS JOIN LATERAL unnest(dc.contractors) AS n
JOIN public.companies c ON c.name_key = lower(trim(n))
WHERE trim(n) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.data_center_companies (data_center_id, company_id, role)
SELECT dc.id, c.id, 'consultant'
FROM public.data_centers dc CROSS JOIN LATERAL unnest(dc.consultants) AS n
JOIN public.companies c ON c.name_key = lower(trim(n))
WHERE trim(n) <> ''
ON CONFLICT DO NOTHING;
