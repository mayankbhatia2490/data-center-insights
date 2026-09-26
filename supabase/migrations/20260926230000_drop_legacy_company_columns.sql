-- Contract step of the companies-table migration: every consumer (discover-
-- data-centers, verify-data-centers, enrich-data-center-coordinates, the
-- Stats page map, the /data-centers and /companies pages, and the import
-- scripts under scripts/) now reads and writes company names through
-- companies/data_center_companies instead of these columns. operator_name is
-- dropped alongside the arrays even though it isn't itself an array: it was
-- always just the "operator" role by another name, and nothing has written
-- to it since the previous migration, so keeping it would only let it rot
-- into stale data rather than serve any remaining reader.
ALTER TABLE public.data_centers
  DROP COLUMN IF EXISTS operator_name,
  DROP COLUMN IF EXISTS operators,
  DROP COLUMN IF EXISTS partners,
  DROP COLUMN IF EXISTS epcs,
  DROP COLUMN IF EXISTS contractors,
  DROP COLUMN IF EXISTS consultants;
