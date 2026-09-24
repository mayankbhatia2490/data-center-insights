import json
from pathlib import Path
root=Path('/home/ubuntu/data-center-insights')
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
    sql="""WITH input(external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision) AS (VALUES\n"""+',\n'.join(batch)+"""\n), imported AS (\nINSERT INTO public.data_centers (external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,verification_status)\nSELECT external_id,canonical_name,operator_name,country,city,address,latitude,longitude,location_precision,'unverified' FROM input\nON CONFLICT (canonical_name,country) DO UPDATE SET external_id=EXCLUDED.external_id,operator_name=COALESCE(EXCLUDED.operator_name,public.data_centers.operator_name),address=COALESCE(EXCLUDED.address,public.data_centers.address),latitude=COALESCE(EXCLUDED.latitude,public.data_centers.latitude),longitude=COALESCE(EXCLUDED.longitude,public.data_centers.longitude),location_precision=CASE WHEN EXCLUDED.latitude IS NOT NULL THEN EXCLUDED.location_precision ELSE public.data_centers.location_precision END,updated_at=now()\nRETURNING id,canonical_name\n)\nINSERT INTO public.data_center_sources (data_center_id,source_url,source_name,source_type,source_title,evidence_excerpt,review_status)\nSELECT id,'https://github.com/Ringmast4r/Global-Data-Center-Map','ATLAS / Global Data Center Map','manual_research',canonical_name,'Imported from the licensed ATLAS dataset; coordinates are approximate where supplied and otherwise undisclosed.','pending' FROM imported WHERE NOT EXISTS (SELECT 1 FROM public.data_center_sources s WHERE s.data_center_id=imported.id AND s.source_name='ATLAS / Global Data Center Map');\n"""
    (out/f'batch-{b//25+1:02d}.sql').write_text(sql)
print('generated',len(rows),'rows')
