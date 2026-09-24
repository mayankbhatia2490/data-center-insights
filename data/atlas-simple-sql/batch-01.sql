WITH input(external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision) AS (VALUES
('atlas-1','National Bank of Kuwait','National Bank of Kuwait (NBK)','Kuwait','Farwaniya','Block 1، Fifth Ring road Farwaniya Kuwait','29.2971097'::numeric,'47.9119937'::numeric,'approximate'),
('atlas-2','Qatar National Bank','Qatar National Bank (QNB)','Qatar','Doha','Arab League St Doha Qatar',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-3','Abu Dhabi','CenterServ','United Arab Emirates','Emirates','Airport Road, Rashid Al Maktoum Street 2 Abu Dhabi United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-4','Abu Dhabi — Etisalat','Etisalat','United Arab Emirates','Emirates','tbc Abu Dhabi United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-5','Al Samoud','Kuwait National Guard','Kuwait','City','Al-Asima Governorate Kuwait City Kuwait','29.3733968'::numeric,'47.9674446'::numeric,'approximate'),
('atlas-6','Al-Waab','Ooredoo Global Services (OGS)','Qatar','Doha','Al Waab St PO Box 217 Doha Qatar',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-7','Buraidah','Etihad Etisalat (Mobily)','Saudi Arabia','Buraidah','tbc Buraidah Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-8','Cloud4C','Cloud4C','United Arab Emirates','Dubai','G 05 , Ground floor, Building no 11, Dubai Internet city 500471 Dubai United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-9','Corporate Data Center','Saudi Aramco','Saudi Arabia','Dhahran','Midra Access Rd 34481 Dhahran Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-10','Dammam','CenterServ','Saudi Arabia','Dammam','King Fahd Road 32232 Dammam Saudi Arabia','26.4017427'::numeric,'50.1431493'::numeric,'approximate'),
('atlas-11','Dammam — NourNet','NourNet','Saudi Arabia','Dammam','King faisal Street 9531 Dammam Saudi Arabia','26.4431851'::numeric,'50.1078622'::numeric,'approximate'),
('atlas-12','Doha','CenterServ','Qatar','Doha','Bank Street، Swords Signal Doha Qatar',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-13','Dubai','Equinix','United Arab Emirates','Emirates','International Media Production Zone (IMPZ), Units F90, F91, F92, Sheikh Mohammed Bin Zayed Road Dubai United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-14','Dubai — Datamena','Datamena','United Arab Emirates','Emirates','Warehouese F90-F92, International Media Production Zone Dubai United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-15','Dubai — Penta Hosting','Penta Hosting','United Arab Emirates','Emirates','Dubai International Financial Center, Gate Building, ER4 Dubai United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-16','Dubai 1 & 2','Gulf Data Hub (GDH)','United Arab Emirates','Emirates','Dubai Silicon Oasis Dubai United Arab Emirates','25.1205792'::numeric,'55.3886553'::numeric,'approximate'),
('atlas-17','Dubai Silicon Oasis Data Center','Dubai Silicon Oasis Authority','United Arab Emirates','Dubai','Nad Al Sheba 6009 Dubai United Arab Emirates','25.151424'::numeric,'55.3753271'::numeric,'approximate'),
('atlas-18','Duqm Data Centre SAOC','Ooredoo Global Services (OGS)','Oman','Oman','Computer Room Level-2, Samail Industrial Estate, Samail Oman',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-19','eHosting Datafort','eHosting Datafort','United Arab Emirates','Emirates','DIC Building 4, 3rd Floor Dubai United Arab Emirates',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-20','Federal Network (FedNet)','UAE Telecommunications Regulatory Authority (TRA)','United Arab Emirates','Emirates','Al Salam St Dubai United Arab Emirates','25.203685'::numeric,'55.2637834'::numeric,'approximate'),
('atlas-21','Gateway Gulf (KSA)','Gateway Gulf','Saudi Arabia','Damman','Al Khobar, P.O. Box 180 Damman Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-22','Gateway Gulf DC','Gateway Gulf','Bahrain','Manama','Complex #312, Property #88000071, Road 1202 18029 Manama Bahrain',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-23','Hail','CenterServ','Saudi Arabia','حائل','Ash Shaikh Abdul Aziz Ibn Baz Road, Near STC حائل Saudi Arabia',NULL::numeric,NULL::numeric,'undisclosed'),
('atlas-24','Imam Abdulrahman Bin Faisal University','Imam Abdulrahman Bin Faisal University','Saudi Arabia','Dammam','2835 King Faisal Road 34212 Dammam Saudi Arabia','26.4128613'::numeric,'50.174052'::numeric,'approximate'),
('atlas-25','Injazat Data Center','Injazat Data Systems','United Arab Emirates','Mohammed','8230 Mohammed Bin Zayed City Abu Dhabi United Arab Emirates','24.3339589'::numeric,'54.5535564'::numeric,'approximate')
), imported AS (
INSERT INTO public.data_centers (external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,verification_status)
SELECT external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,'unverified' FROM input
ON CONFLICT (canonical_name,country) DO UPDATE SET external_id=EXCLUDED.external_id,operator_name=COALESCE(EXCLUDED.operator_name,public.data_centers.operator_name),address=COALESCE(EXCLUDED.address,public.data_centers.address),latitude=COALESCE(EXCLUDED.latitude,public.data_centers.latitude),longitude=COALESCE(EXCLUDED.longitude,public.data_centers.longitude),location_precision=CASE WHEN EXCLUDED.latitude IS NOT NULL THEN EXCLUDED.location_precision ELSE public.data_centers.location_precision END,updated_at=now()
RETURNING id,canonical_name
)
INSERT INTO public.data_center_sources (data_center_id,source_url,source_name,source_type,source_title,evidence_excerpt,review_status)
SELECT id,'https://github.com/Ringmast4r/Global-Data-Center-Map','ATLAS / Global Data Center Map','manual_research',canonical_name,'Imported from the licensed ATLAS dataset; coordinates are approximate where supplied and otherwise undisclosed.','pending' FROM imported WHERE NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id=imported.id AND s.source_name='ATLAS / Global Data Center Map');
