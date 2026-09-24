from pathlib import Path
import json, urllib.request, concurrent.futures
from pyproj import Transformer

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / 'sources'
def get(url, name, payload=None):
    request = urllib.request.Request(url, data=json.dumps(payload).encode() if payload else None,
        headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            data = response.read()
        (SOURCES / name).write_bytes(data)
        print(name, len(data), flush=True)
    except Exception as exc:
        print(name, type(exc).__name__, str(exc), flush=True)

twin = json.loads((SOURCES / 'generated-baseline.twin.json').read_text())
ring = twin['features'][0]['ring']['coordinates']
convert = Transformer.from_crs(2248, 4326, always_xy=True)
coords = [convert.transform(*p[:2]) for p in ring]
wkt = 'POLYGON((' + ','.join(f'{x} {y}' for x,y in coords) + '))'
query = "SELECT mu.musym, mu.muname, c.hydricrating, c.hydgrp, c.drainagecl, " + \
    "(SELECT TOP 1 ch.kffact FROM chorizon ch WHERE ch.cokey=c.cokey ORDER BY ch.hzdept_r) AS kf " + \
    "FROM mapunit mu LEFT JOIN component c ON c.mukey=mu.mukey AND c.majcompflag='Yes' " + \
    "WHERE mu.mukey IN (SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('" + wkt + "'))"
jobs = [
    ('https://www.pgatlas.com/Documents/DAMS/SR_4-06111_2.pdf','Porter-4-06111-staff-report.pdf',None),
    ('https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest','porter-site-soils.json',{'format':'JSON','query':query}),
    ('https://online.encodeplus.com/regs/princegeorgescounty-md/doc-view.aspx?secid=634&print=1','zoning-residential.html',None),
    ('https://online.encodeplus.com/regs/princegeorgescounty-md/doc-view.aspx?secid=80&print=1','zoning-definitions.html',None),
]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(lambda args:get(*args), jobs))
(SOURCES/'retrieval.json').write_text(json.dumps({'date':'2026-09-09','jobs':jobs,'siteWkt':wkt},indent=2))
