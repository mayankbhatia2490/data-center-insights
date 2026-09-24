WITH input(external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision) AS (VALUES
('atlas-26','Jeddah','Integrated Telecom Company Ltd.','Saudi Arabia','Jeddah','Corneesh street 8732/ 1149 Jeddah Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-27','Jeddah — Etihad Etisalat (Mobily)','Etihad Etisalat (Mobily)','Saudi Arabia','Jeddah','Al Faiha District Jeddah Saudi Arabia','21.4904847'::numeric,'39.2307769'::numeric,'approximate'),
('atlas-28','Jeddah — HostGee.Com','HostGee.Com','Saudi Arabia','Jeddah','Abo Bakr Al Sedeeq street, Saudi Business Center, 9th Floor, Office # 909 22135 Jeddah Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-29','Jubail','CenterServ','Saudi Arabia','Al','Al - Shati 35811 Al Jubail Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-30','Khobar CLS','Integrated Telecom Company Ltd.','Saudi Arabia','Al','Corneesh road 31952 Al Khobar Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-31','King Abdullah Financial District','Al Ra’idah Investment Company','Saudi Arabia','Riyadh','King Fahd Rd Riyadh Saudi Arabia','24.6145776'::numeric,'46.7068844'::numeric,'approximate'),
('atlas-32','M-VAULT 1','Meeza','Qatar','Doha','Qatar Science & Technology Park, Al Gharaffa St. 5825 Doha Qatar',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-33','M-VAULT 2','Meeza','Qatar','Ar-Rayyan','Al Luqta St 5825 Ar-Rayyan Qatar','25.3202471'::numeric,'51.4601797'::numeric,'approximate'),
('atlas-34','Maddinah','Etihad Etisalat (Mobily)','Saudi Arabia','Medina','Abo Bakr Al Siddiq 42331 Medina Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-35','Maksab-PNU','Saudi Maksab Holdings','Saudi Arabia','Riyadh','Imam Abdullah Ibn Saud Ibn Abdulaziz Rd Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-36','Malga 1','Etihad Etisalat (Mobily)','Saudi Arabia','Riyadh','9390 Al Awsat Valley St Al Olaya Riyadh 12214 2293 Al Awsat Valley St 12214 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-37','Manama','Batelco (Bahrain Telecommunications Company)','Bahrain','Bahrain','Sh Salman Hwy Manama Bahrain',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-38','Melgha II','Etihad Etisalat (Mobily)','Saudi Arabia','Riyadh','tbc Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-39','Mesaimeer','Ooredoo Global Services (OGS)','Qatar','Doha','Mesaimeer Doha Qatar','25.2380038'::numeric,'51.5285194'::numeric,'approximate'),
('atlas-40','Ministry of the National Guard','Ministry of National Guard','Saudi Arabia','الرياض','Makkah Al Mukarramah Branch Road, Ar Rabwah 12822 الرياض Saudi Arabia','24.6951638'::numeric,'46.7317864'::numeric,'approximate'),
('atlas-41','Moro Hub Data Center','Moro Hub','United Arab Emirates','Emirates','Garn Al Sabkha St Dubai United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-42','National Data Centre','Oman Information Technology Authority (ITA)','Oman','Muscat','Office Complex 2010 Muscat Oman',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-43','Oman','Oman Telecommunication Company','Oman','Oman','Ruwi, Telecommunication Tower Bldng (TCC). P.O.BOX:789, P.CODE:112 Oman Oman',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-44','Oman Data Park','Oman Data Park','Oman','Oman','Al Wuttayah Al Wuttayah Oman',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-45','Primary Data Center','Riyad Bank','Saudi Arabia','Riyadh','7401 Wag Valley 13521 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-46','Public Pension Agency','Public Pension Agency','Saudi Arabia','Riyadh','Al Washm Street 12613 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-47','Riyadh','Detasad','Saudi Arabia','Riyadh','Imam Saud Bin Abdulaziz Road 22135 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-48','Riyadh — NourNet','NourNet','Saudi Arabia','Riyadh','Ibn Al Haitham 13222 Riyadh Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-49','Riyadh — HostGee.Com','HostGee.Com','Saudi Arabia','Riyadh','Olaya Street 11372 Riyadh Saudi Arabia','24.6704006'::numeric,'46.6984073'::numeric,'approximate'),
('atlas-50','Riyadh — GO (Etihad Atheeb Telecom)','GO (Etihad Atheeb Telecom)','Saudi Arabia','Riyadh','King Abdulaziz road 12432-6799 Riyadh Saudi Arabia','25.890169'::numeric,'45.3543399'::numeric,'approximate')
), imported AS (
INSERT INTO public.data_centers (external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,verification_status)
SELECT external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,'unverified' FROM input
ON CONFLICT (canonical_name,country) DO UPDATE SET external_id=EXCLUDED.external_id,operator_name=COALESCE(EXCLUDED.operator_name,public.data_centers.operator_name),address=COALESCE(EXCLUDED.address,public.data_centers.address),latitude=COALESCE(EXCLUDED.latitude,public.data_centers.latitude),longitude=COALESCE(EXCLUDED.longitude,public.data_centers.longitude),location_precision=CASE WHEN EXCLUDED.latitude IS NOT NULL THEN EXCLUDED.location_precision ELSE public.data_centers.location_precision END,updated_at=now()
RETURNING id,canonical_name
)
INSERT INTO public.data_center_sources (data_center_id,source_url,source_name,source_type,source_title,evidence_excerpt,review_status)
SELECT id,'https://github.com/Ringmast4r/Global-Data-Center-Map','ATLAS / Global Data Center Map','manual_research',canonical_name,'Imported from the licensed ATLAS dataset; coordinates are approximate where supplied and otherwise undisclosed.','pending' FROM imported WHERE NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id=imported.id AND s.source_name='ATLAS / Global Data Center Map');
