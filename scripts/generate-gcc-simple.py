import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
data=json.loads((root/'data/atlas-middle-east-gcc-subset.json').read_text())['gcc']
out=root/'data/atlas-simple-sql'; out.mkdir(exist_ok=True)
for p in out.glob('*.sql'): p.unlink()
def q(v):
    if v is None: return 'NULL'
    return "'"+str(v).replace("'","''")+"'"
seen=set()
rows=[]
for i,r in enumerate(data,1):
    name=r.get('name') or 'Unnamed facility'; country=r.get('country') or 'Unknown'; op=r.get('company')
    if (name,country) in seen: name=f"{name} — {op or 'Unknown operator'}"
    seen.add((name,country))
    c=r.get('city_coords') if isinstance(r.get('city_coords'),list) and len(r.get('city_coords'))==2 else None
    lat=q(c[0])+'::numeric' if c else 'NULL::numeric'; lon=q(c[1])+'::numeric' if c else 'NULL::numeric'
    vals=[q(f'atlas-{i}'),q(name),q(op),q(country),q(r.get('city')),q(r.get('address')),lat,lon,q('approximate' if c else 'undisclosed')]
    rows.append('('+','.join(vals)+')')
for b in range(0,len(rows),25):
    batch=rows[b:b+25]
    values=',\n'.join(batch)
    # operator_name travels through the `input` CTE only to seed
    # companies/data_center_companies below; it is not a data_centers column.
    facilities_sql="""WITH input(external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision) AS (VALUES\n"""+values+"""\n), imported AS (\nINSERT INTO public.data_centers (external_id,canonical_name,country,city,address,latitude,longitude,location_precision,verification_status)\nSELECT external_id,canonical_name,country,city,address,latitude,longitude,location_precision,'unverified' FROM input\nON CONFLICT (canonical_name,country) DO UPDATE SET external_id=EXCLUDED.external_id,address=COALESCE(EXCLUDED.address,public.data_centers.address),latitude=COALESCE(EXCLUDED.latitude,public.data_centers.latitude),longitude=COALESCE(EXCLUDED.longitude,public.data_centers.longitude),location_precision=CASE WHEN EXCLUDED.latitude IS NOT NULL THEN EXCLUDED.location_precision ELSE public.data_centers.location_precision END,updated_at=now()\nRETURNING id,canonical_name\n)\nINSERT INTO public.data_center_sources (data_center_id,source_url,source_name,source_type,source_title,evidence_excerpt,review_status)\nSELECT id,'https://github.com/Ringmast4r/Global-Data-Center-Map','ATLAS / Global Data Center Map','manual_research',canonical_name,'Imported from the licensed ATLAS dataset; coordinates are approximate where supplied and otherwise undisclosed.','pending' FROM imported WHERE NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id=imported.id AND s.source_name='ATLAS / Global Data Center Map');\n"""
    companies_sql="""\nWITH input(external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision) AS (VALUES\n"""+values+"""\n), company_upsert AS (\nINSERT INTO public.companies (name)\nSELECT DISTINCT operator_name FROM input WHERE operator_name IS NOT NULL\nON CONFLICT (name_key) DO UPDATE SET name = public.companies.name\nRETURNING id, name_key\n)\nINSERT INTO public.data_center_companies (data_center_id, company_id, role)\nSELECT dc.id, company_upsert.id, 'operator'\nFROM input\nJOIN public.data_centers dc ON dc.canonical_name = input.canonical_name AND dc.country = input.country\nJOIN company_upsert ON company_upsert.name_key = lower(trim(input.operator_name))\nWHERE input.operator_name IS NOT NULL\nON CONFLICT (data_center_id, company_id, role) DO NOTHING;\n"""
    (out/f'batch-{b//25+1:02d}.sql').write_text(facilities_sql+companies_sql)
print('generated',len(rows),'rows')
