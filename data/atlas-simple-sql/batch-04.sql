WITH input(external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision) AS (VALUES
('atlas-76','DC Vault','DC Vault','United Arab Emirates','','','24.191144'::numeric,'54.47055499999999'::numeric,'approximate'),
('atlas-77','Dubai 1','Zenlayer','United Arab Emirates','','','25.0282605'::numeric,'55.1856957'::numeric,'approximate'),
('atlas-78','M-VAULT 3','Meeza','Qatar','','','25.5510651'::numeric,'51.43938000000003'::numeric,'approximate'),
('atlas-79','Public Cloud Data Centre','SAP','Saudi Arabia','','','24.7135517'::numeric,'46.67529569999999'::numeric,'approximate'),
('atlas-80','PDO Telecom','Petroleum Development Oman (PDO)','Oman','','','23.6238638'::numeric,'58.51829049999992'::numeric,'approximate'),
('atlas-81','Sulay','Etihad Etisalat (Mobily)','Saudi Arabia','','','24.6615689'::numeric,'46.83602300000007'::numeric,'approximate'),
('atlas-82','Qualitynet Data Center','Qualitynet','Kuwait','','','29.375915'::numeric,'47.993056000000024'::numeric,'approximate'),
('atlas-83','AWS BAH Askar Road 5156','Amazon','Bahrain','','','26.07105508386889'::numeric,'50.61172573337402'::numeric,'approximate'),
('atlas-84','AWS BAH 1440 Road 1429','Amazon','Bahrain','','','26.2057094'::numeric,'50.4831545'::numeric,'approximate'),
('atlas-85','AWS BAH Zallaq','Amazon','Bahrain','','','26.04336368350832'::numeric,'50.532455543188476'::numeric,'approximate')
), imported AS (
INSERT INTO public.data_centers (external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,verification_status)
SELECT external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,'unverified' FROM input
ON CONFLICT (canonical_name,country) DO UPDATE SET external_id=EXCLUDED.external_id,operator_name=COALESCE(EXCLUDED.operator_name,public.data_centers.operator_name),address=COALESCE(EXCLUDED.address,public.data_centers.address),latitude=COALESCE(EXCLUDED.latitude,public.data_centers.latitude),longitude=COALESCE(EXCLUDED.longitude,public.data_centers.longitude),location_precision=CASE WHEN EXCLUDED.latitude IS NOT NULL THEN EXCLUDED.location_precision ELSE public.data_centers.location_precision END,updated_at=now()
RETURNING id,canonical_name
)
INSERT INTO public.data_center_sources (data_center_id,source_url,source_name,source_type,source_title,evidence_excerpt,review_status)
SELECT id,'https://github.com/Ringmast4r/Global-Data-Center-Map','ATLAS / Global Data Center Map','manual_research',canonical_name,'Imported from the licensed ATLAS dataset; coordinates are approximate where supplied and otherwise undisclosed.','pending' FROM imported WHERE NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id=imported.id AND s.source_name='ATLAS / Global Data Center Map');
