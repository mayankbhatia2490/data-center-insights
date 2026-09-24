WITH input(external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision) AS (VALUES
('atlas-51','Riyadh — Nashirnet National Computer Systems Co.','Nashirnet National Computer Systems Co.','Saudi Arabia','Riyadh','Olaya Street 11372 Riyadh Saudi Arabia','24.6704006'::numeric,'46.6984073'::numeric,'approximate'),
('atlas-52','Riyadh — Integrated Telecom Company Ltd.','Integrated Telecom Company Ltd.','Saudi Arabia','Riyadh','Daba street 8732-11492 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-53','Riyadh — Cisco','Cisco','Saudi Arabia','Riyadh','tbc Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-54','Riyadh 1','Saudi Telecom Company (STC)','Saudi Arabia','Riyadh','Imam Saud Bin Abdulaziz Bin Mohammed Rd Riyadh Saudi Arabia','24.8132204'::numeric,'46.7018784'::numeric,'approximate'),
('atlas-55','Riyahd','Gateway Gulf','Saudi Arabia','Riyadh','tbc 3199 Riyadh Saudi Arabia','24.6941861'::numeric,'46.6793722'::numeric,'approximate'),
('atlas-56','Royal Saudi Air Force','Saudi Royal Air Force','Saudi Arabia','Riyadh','Al Kharj Road 14334 Riyadh Saudi Arabia','24.538131'::numeric,'46.9348223'::numeric,'approximate'),
('atlas-57','SABB','Saudi British Bank','Saudi Arabia','Riyadh','6685 الامير عبدالعزيز بن مساعد بن جلوي 12628 Riyadh Saudi Arabia','24.6555128'::numeric,'46.7114581'::numeric,'approximate'),
('atlas-58','SAIB DR Al-Kharj','The Saudi Investment Bank','Saudi Arabia','Kharj','King Fahd Rd Al Kharj Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-59','SAMA Data Center at KAFD','Saudi Arabian Monetary Authority','Saudi Arabia','Riyadh','King Fahd Rd Riyadh Saudi Arabia','24.6145776'::numeric,'46.7068844'::numeric,'approximate'),
('atlas-60','Saudi Basic Industries Corp.','Saudi Basic Industries Corp. (SABIC)','Saudi Arabia','Al','9393 Al Lulu Rd 35811 Al Jubail Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-61','Shabakah Net','Shabakah Integrated Technology (Shabakah Net)','Saudi Arabia','الرياض','Al Wurud, Olaya Street, Andalus Mall 12215 الرياض Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-62','SIMAH-DC','Simah','Saudi Arabia','Riyadh','Jazirah Zinjabar 13241 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-63','Tadawul Group','Tadawul Group','Saudi Arabia','Riyadh','King Fahd Branch Rd 12211 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-64','Zajil Telecom','Zajil Telecom','Kuwait','City','MOC Shuwaikh Exchange, Kaifan Kuwait City Kuwait',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-65','National Commercial Bank','National Commercial Bank','Saudi Arabia','','','22.4486944'::numeric,'39.133554900000036'::numeric,'approximate'),
('atlas-66','Unayzah','Etihad Etisalat (Mobily)','Saudi Arabia','','','26.1259733'::numeric,'43.983971'::numeric,'approximate'),
('atlas-67','King Faisal University','King Faisal University','Saudi Arabia','','','25.3405347'::numeric,'49.59991100000002'::numeric,'approximate'),
('atlas-68','Yasref IT Main Datacenter','Yasref Company Ltd.','Saudi Arabia','','','23.9969888'::numeric,'38.19393450000007'::numeric,'approximate'),
('atlas-69','Disaster Recovery Datacenter','Banque Saudi Fransi','Saudi Arabia','','','21.2854067'::numeric,'39.23755070000004'::numeric,'approximate'),
('atlas-70','National Center for Digital Certification','Ministry of Communications and Information Technology','Saudi Arabia','','','24.7480328'::numeric,'46.68753719999995'::numeric,'approximate'),
('atlas-71','Al Rajhi Bank','Al Rajhi Bank','Saudi Arabia','','','24.7349947'::numeric,'46.664694199999985'::numeric,'approximate'),
('atlas-72','Riyadh Municipality','Riyadh Municipality','Saudi Arabia','','','24.6286689'::numeric,'46.71048410000003'::numeric,'approximate'),
('atlas-73','Disaster Recovery','Alinma Bank','Saudi Arabia','','','24.7066911'::numeric,'46.67524070000002'::numeric,'approximate'),
('atlas-74','Information Technology and Communications Complex Project','Al Ra’idah Investment Company','Saudi Arabia','','','24.741072374661762'::numeric,'46.63584837141116'::numeric,'approximate'),
('atlas-75','Riyadh 2','Saudi Telecom Company (STC)','Saudi Arabia','','','24.7135517'::numeric,'46.67529569999999'::numeric,'approximate')
), imported AS (
INSERT INTO public.data_centers (external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,verification_status)
SELECT external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,'unverified' FROM input
ON CONFLICT (canonical_name,country) DO UPDATE SET external_id=EXCLUDED.external_id,operator_name=COALESCE(EXCLUDED.operator_name,public.data_centers.operator_name),address=COALESCE(EXCLUDED.address,public.data_centers.address),latitude=COALESCE(EXCLUDED.latitude,public.data_centers.latitude),longitude=COALESCE(EXCLUDED.longitude,public.data_centers.longitude),location_precision=CASE WHEN EXCLUDED.latitude IS NOT NULL THEN EXCLUDED.location_precision ELSE public.data_centers.location_precision END,updated_at=now()
RETURNING id,canonical_name
)
INSERT INTO public.data_center_sources (data_center_id,source_url,source_name,source_type,source_title,evidence_excerpt,review_status)
SELECT id,'https://github.com/Ringmast4r/Global-Data-Center-Map','ATLAS / Global Data Center Map','manual_research',canonical_name,'Imported from the licensed ATLAS dataset; coordinates are approximate where supplied and otherwise undisclosed.','pending' FROM imported WHERE NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id=imported.id AND s.source_name='ATLAS / Global Data Center Map');
