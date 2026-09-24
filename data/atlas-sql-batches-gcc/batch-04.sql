WITH input(external_id, external_parent_id, canonical_name, operator_name, listing_type, lifecycle_stage, service_types, country, market, city, address, latitude, longitude, location_precision, capacity_mw, capacity_basis, capacity_status, whitespace_sqm, year_operational, pue, tier_design, site_code, verification_status, verification_score) AS (
VALUES
  ('atlas-76',NULL,'DC Vault','DC Vault','facility','unknown',ARRAY[]::text[],'United Arab Emirates','','','','24.191144'::numeric,'54.47055499999999'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-77',NULL,'Dubai 1','Zenlayer','facility','unknown',ARRAY[]::text[],'United Arab Emirates','','','','25.0282605'::numeric,'55.1856957'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-78',NULL,'M-VAULT 3','Meeza','facility','unknown',ARRAY[]::text[],'Qatar','','','','25.5510651'::numeric,'51.43938000000003'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-79',NULL,'Public Cloud Data Centre','SAP','facility','unknown',ARRAY[]::text[],'Saudi Arabia','','','','24.7135517'::numeric,'46.67529569999999'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-80',NULL,'PDO Telecom','Petroleum Development Oman (PDO)','facility','unknown',ARRAY[]::text[],'Oman','','','','23.6238638'::numeric,'58.51829049999992'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-81',NULL,'Sulay','Etihad Etisalat (Mobily)','facility','unknown',ARRAY[]::text[],'Saudi Arabia','','','','24.6615689'::numeric,'46.83602300000007'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-82',NULL,'Qualitynet Data Center','Qualitynet','facility','unknown',ARRAY[]::text[],'Kuwait','','','','29.375915'::numeric,'47.993056000000024'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-83',NULL,'AWS BAH Askar Road 5156','Amazon','facility','unknown',ARRAY[]::text[],'Bahrain','','','','26.07105508386889'::numeric,'50.61172573337402'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-84',NULL,'AWS BAH 1440 Road 1429','Amazon','facility','unknown',ARRAY[]::text[],'Bahrain','','','','26.2057094'::numeric,'50.4831545'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0),
  ('atlas-85',NULL,'AWS BAH Zallaq','Amazon','facility','unknown',ARRAY[]::text[],'Bahrain','','','','26.04336368350832'::numeric,'50.532455543188476'::numeric,'approximate',NULL::numeric,'unknown','not_disclosed',NULL::numeric,NULL::integer,NULL::numeric,NULL,NULL,'unverified',0)
), imported AS (
  INSERT INTO public.data_centers (external_id, external_parent_id, canonical_name, operator_name, listing_type, lifecycle_stage, service_types, country, market, city, address, latitude, longitude, location_precision, capacity_mw, capacity_basis, capacity_status, whitespace_sqm, year_operational, pue, tier_design, site_code, verification_status, verification_score)
  SELECT * FROM input
  ON CONFLICT (canonical_name, country) DO UPDATE SET
    external_id = EXCLUDED.external_id, operator_name = COALESCE(EXCLUDED.operator_name, public.data_centers.operator_name),
    address = COALESCE(EXCLUDED.address, public.data_centers.address), latitude = COALESCE(EXCLUDED.latitude, public.data_centers.latitude),
    longitude = COALESCE(EXCLUDED.longitude, public.data_centers.longitude), location_precision = CASE WHEN EXCLUDED.latitude IS NOT NULL THEN EXCLUDED.location_precision ELSE public.data_centers.location_precision END,
    updated_at = now()
  RETURNING id, canonical_name, country
)
INSERT INTO public.data_center_sources (data_center_id, source_url, source_name, source_type, source_title, evidence_excerpt, automated_score, review_status)
SELECT imported.id, 'https://github.com/Ringmast4r/Global-Data-Center-Map', 'ATLAS / Global Data Center Map', 'manual_research', imported.canonical_name, 'Imported from the licensed ATLAS dataset; coordinates are city-level where supplied by ATLAS and otherwise left undisclosed.', 0, 'pending'
FROM imported
WHERE NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id = imported.id AND s.source_name = 'ATLAS / Global Data Center Map');
