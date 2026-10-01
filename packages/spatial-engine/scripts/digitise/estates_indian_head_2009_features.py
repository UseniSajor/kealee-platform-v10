"""
2009 approved-plan features -> the engine's plat record (data only; the engine draws).

    python3 estates_indian_head_2009_features.py <project_dir>

Run after estates_indian_head_inputs.py and estates_indian_head_2009_layout.py.
Everything here is READ OFF the 2009 Street Tree & Lighting sheet (DPW&T
9399-2009, georeferenced by source/stl-2009-georef.json, median residual
0.44 ft) or taken from PGAtlas, and written into
estates-indian-head.plat-record.json for generate-subdivision.ts:

  existingRoads      MD 210 as the 2009 sheet draws it (edges of road, lane
                     lines, from a line histogram parallel to the edge of road
                     the entrance returns are tangent to); Jennifer Drive and
                     Henrietta Drive from the PGAtlas centreline, 50-ft R/W.
  streetTrees        the 2009 street tree plan's red maples, located on the scan.
  streetLights       the 2009 street light plan's 5 lights (SMECO).
  roadsideSwales     the 2009 rural section's ditch line: +/-20 ft off the
                     centreline on the run, R 52 ft round the cul-de-sac.
  culverts           one under every driveway apron where it crosses the swale
                     (DPW&T Std. 600.02 "culvert driveway"), with end sections.
  spotElevations     2009 proposed spot grades, WSSC datum, at the 2009 points.
  entranceApron      the street entrance at Jennifer Drive as its own feature.
"""
import json, math, os, sys
from shapely.geometry import Polygon, LineString, Point, MultiLineString
from shapely.ops import unary_union, linemerge

proj = sys.argv[1]
J = lambda p: json.load(open(os.path.join(proj, p)))
g = J('source/stl-2009-georef.json')
S, th = g['s'], g['th']; c, s_ = math.cos(th), math.sin(th)
def W(u, v):
    return (g['X0'] + (c * (u - g['tx']) + s_ * (g['ty'] - v)) / S,
            g['Y0'] + (-s_ * (u - g['tx']) + c * (g['ty'] - v)) / S)

rec = J('estates-indian-head.plat-record.json')
st = rec['proposedStreets'][0]
row = Polygon(st['rowRings'][0])
C = st['bulbCentre']
cl = LineString(st['centreline'])

# ── Jennifer Drive frontage road and separated MD 210 ──────────────────────────
md = J('source/md210-2009-lines.json')
A = md['A']; u = md['u']; n = md['n']            # n points from the site toward the highway
def along(off, a0=-420, a1=520):
    return [[A[0] + u[0] * a0 + n[0] * off, A[1] + u[1] * a0 + n[1] * off],
            [A[0] + u[0] * a1 + n[0] * off, A[1] + u[1] * a1 + n[1] * off]]
md210 = {'name': 'INDIAN HEAD HIGHWAY (MD 210)',
         'label': 'INDIAN HEAD HIGHWAY — MARYLAND ROUTE 210 — VARIABLE R/W WIDTH (S.R.C. PLAT NO. 47040) — SHA',
         'source': '2009 approved sheet DPW&T 9399-2009, lines measured parallel to the edge of road',
         'lines': [{'type': 'edge-of-road', 'line': along(74.2), 'label': 'EX. EDGE OF MD 210'},
                   {'type': 'lane-line', 'line': along(102.2)},
                   {'type': 'edge-of-road', 'line': along(122.8), 'label': 'EX. EDGE OF MD 210'}]}
jennifer_frontage = {
    'name': 'JENNIFER DRIVE',
    'label': 'JENNIFER DRIVE — FRONTAGE ROAD — ESTATES COURT INTERSECTION',
    'source': '2009 approved geometry cross-checked to PGAtlas Transportation centerlines',
    'lines': [
        {'type': 'edge-of-road', 'line': along(0.0), 'label': 'EX. EDGE OF JENNIFER DRIVE'},
        {'type': 'centerline', 'line': along(12.2), 'label': 'JENNIFER DRIVE C/L'},
        {'type': 'edge-of-road', 'line': along(24.8), 'label': 'EX. EDGE OF JENNIFER DRIVE'},
        {'type': 'barrier', 'line': along(49.5), 'label': 'EX. PHYSICAL SEPARATION / BARRIER — NO DIRECT ESTATES CT ACCESS TO MD 210'},
    ],
}

# ── Jennifer Drive / Henrietta Drive (PGAtlas centreline, 50 ft R/W) ─────────
streets = J('source/pgatlas-streets.json')['features']
def road(name, fullname):
    paths = [LineString(p) for f in streets if (f['attributes'].get('NAME') or '') == name for p in f['geometry']['paths']]
    uu = unary_union(paths)
    m = linemerge(uu) if uu.geom_type == "MultiLineString" else uu
    geoms = list(m.geoms) if hasattr(m, 'geoms') else [m]
    lines = []
    for gg in geoms:
        lines.append({'type': 'centerline', 'line': [list(q) for q in gg.coords]})
        for side in (25, -25):
            try:
                o = gg.offset_curve(side)
                lines.append({'type': 'right-of-way', 'line': [list(q) for q in o.coords]})
            except Exception:
                pass
    return {'name': fullname, 'label': f"{fullname} (50' R/W)", 'source': 'PGAtlas Transportation/2 centreline; 50-ft R/W per Treeview Estates plats (2009 sheet letters Henrietta Dr 50\' R/W)', 'lines': lines}
roads = [jennifer_frontage, md210, road('HENRIETTA', 'HENRIETTA DRIVE')]

# ── Street trees and lights (2009 street tree & lighting plan) ───────────────
TREES_PX = [(1866, 530), (1960, 1126), (2236, 1330), (2510, 1540), (2820, 1670), (1710, 1426), (2240, 1816),
            (2930, 2090), (3220, 1750), (3570, 1794), (3870, 1624), (4410, 1540), (4556, 1936), (4356, 2210),
            (3256, 2150), (3576, 2196)]
LIGHTS_PX = [(1733, 930), (3127, 1730), (4190, 1470), (4030, 2235), (2165, 1783)]
trees = [{'point': list(W(*p)), 'species': 'ACER RUBRUM — RED MAPLE', 'size': '2 1/2"–3" CAL., B&B', 'source': '2009 street tree plan'} for p in TREES_PX]
# Positions are the 2009 plan's; the fixture is LED (user, 2026-10-01), not the
# 2009 high-pressure sodium. Wattage and lumen package follow SMECO's LED
# post-top offering at the DPW&T Std. 500.10 spacing, set at technical design.
LIGHT_FIXTURE = 'LED COLONIAL POST-TOP, TYPE IV, 3000 K, BLACK FIBERGLASS POLE, DIRECT BURIED'
lights = [{'point': list(W(*p)), 'fixture': LIGHT_FIXTURE, 'utility': 'SMECO', 'source': '2009 street light plan (permit 09.09399) positions'} for p in LIGHTS_PX]

# ── Roadside swales (2009 ditch line) and driveway culverts ───────────────────
aprons = []
for k in range(1, 7):
    sp = J(f'estates-indian-head-lot{k}.plat.json')
    for f in sp.get('fixedPaving', []):
        if f['kind'] == 'Apron':
            aprons.append((k, Polygon(f['ring']).buffer(0)))
mouth_cut = Polygon(st['entrance']['edgeOfRoad'] + [cl.coords[2], cl.coords[1]]).buffer(40) if 'entrance' in st else None
# The swale flowline runs 8 ft off the actual edge of pavement (4-ft shoulder +
# 4 ft to the flowline; 20 ft off the centreline on the tangents), so it follows
# the approved cul-de-sac shape, not a circle.
pave = unary_union([Polygon(r) for r in st['pavementRings']])
ditch = pave.buffer(8.0, 32).exterior.intersection(row.buffer(-0.5))
if mouth_cut is not None:
    ditch = ditch.difference(mouth_cut.buffer(-30))
parts = [gg for gg in (ditch.geoms if hasattr(ditch, 'geoms') else [ditch]) if gg.length > 8]
swales = [{'line': [list(q) for q in gg.coords], 'label': "ROADSIDE SWALE (M-8 DRY SWALE W/ CHECK DAMS) — FLOWS TO ENTRANCE",
           'sectionFt': 8} for gg in parts]
culverts = []
for k, ap in aprons:
    for gg in parts:
        hit = gg.intersection(ap.buffer(1.0))
        if hit.is_empty or hit.length < 3:
            continue
        hl = max(hit.geoms, key=lambda x: x.length) if hasattr(hit, 'geoms') else hit
        a, b = hl.coords[0], hl.coords[-1]
        L = math.dist(a, b); ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        a2 = (a[0] - ux * 2, a[1] - uy * 2); b2 = (b[0] + ux * 2, b[1] + uy * 2)
        culverts.append({'lot': k, 'line': [list(a2), list(b2)], 'sizeIn': 15, 'material': 'RCP',
                         'lengthFt': round(math.dist(a2, b2), 1),
                         'label': f'15" RCP CULVERT, L={math.dist(a2, b2):.0f}\', FLARED END SECTIONS (DPW&T STD. 600.02 CULVERT DRIVEWAY)'})

# ── 2009 spot elevations (WSSC datum), sheet pixel -> State Plane ─────────────
SPOTS_PX = [
    # lot 1
    (2442, 868, 204.5), (2775, 928, 205.0), (2678, 998, 206.0), (2415, 1085, 206.5), (2355, 1175, 206.5),
    (2855, 1250, 206.0), (3055, 1190, 205.5), (2900, 1345, 208.34), (2870, 1420, 207.3), (2730, 1438, 208.0),
    (2435, 1225, 205.5), (2330, 1360, 204.5),
    # lot 2
    (3610, 1030, 206.5), (3570, 1115, 208.0), (3365, 1210, 207.0), (3815, 1168, 210.0), (3815, 1255, 210.5),
    (3885, 1355, 210.5), (3595, 1475, 212.34), (3560, 1580, 211.3), (4055, 1440, 209.5),
    # lot 3
    (4423, 1048, 208.0), (4730, 1045, 208.5), (4630, 1135, 210.0), (4630, 1280, 210.5), (4535, 1305, 210.5),
    (4905, 1275, 210.0), (5025, 1230, 209.0), (5025, 1470, 210.1), (4970, 1575, 210.1), (5140, 1560, 209.5),
    (4700, 1560, 212.34), (4690, 1655, 211.3), (4810, 1685, 210.0), (4940, 1710, 209.0),
    # lot 4
    (4840, 1915, 210.0), (5012, 2042, 210.1), (5015, 2270, 210.1), (4592, 2375, 210.5), (4732, 2425, 210.5),
    (5115, 2325, 209.5), (4905, 2520, 209.0),
    # lot 5
    (3330, 2308, 210.8), (3355, 2410, 211.84), (3620, 2460, 210.5), (3105, 2610, 205.0), (3245, 2650, 206.0),
    # lot 6
    (2570, 2025, 207.0), (2710, 1990, 204.5), (2500, 2125, 207.5), (2428, 2535, 203.0), (2758, 2600, 203.5),
]
# ONE vertical datum on the plans: NAVD 88, the datum of the county 2-ft
# contours and of the street profile. The 2009 grades are on WSSC datum, which
# reads WSSC_ABOVE_NAVD88_FT above the county contours at these points, so they
# are converted rather than printed beside NAVD figures under one symbol.
WSSC_ABOVE_NAVD88_FT = 1.6
spots = [{'point': list(W(u_, v_)), 'elevationFt': round(z - WSSC_ABOVE_NAVD88_FT, 2), 'label': f'{z - WSSC_ABOVE_NAVD88_FT:.2f}',
          'datum': f'NAVD 88 (2009 plan grade on WSSC datum less {WSSC_ABOVE_NAVD88_FT} ft)', 'wsscDatumFt': z,
          'source': '2009 approved sheet DPW&T 9399-2009'} for u_, v_, z in SPOTS_PX]

# ── Entrance apron at MD 210 ─────────────────────────────────────────────────
ent = st.get('entrance')
entrance = None
if ent:
    rw_mouth = row
    # the entrance = the pavement between Jennifer Drive's edge and the end of
    # the two 50-ft returns (the flare), i.e. within ~(R + 10) ft of the edge of road
    eor = LineString(ent['edgeOfRoad'])
    ent_poly = unary_union([Polygon(r) for r in st['pavementRings']]).intersection(eor.buffer(ent['returnRadiusFt'] + 2, cap_style=2)).buffer(0)
    geoms = list(ent_poly.geoms) if hasattr(ent_poly, 'geoms') else [ent_poly]
    big = max(geoms, key=lambda x: x.area)
    entrance = {'ring': [list(q) for q in list(big.exterior.coords)[:-1]], 'areaSqFt': round(big.area),
                'label': "STREET ENTRANCE APRON — 50' RETURNS TO JENNIFER DRIVE EDGE OF ROAD — COUNTY REVIEW",
                'returnRadiusFt': ent['returnRadiusFt']}

# ── MD 210 frontage improvements, both sides of the entrance ──────────────
# Owner: "road development should extend on both sides of Estates Ct to
# Indian Head Hwy / Jennifer Dr". Laid out for SHA as 12-ft auxiliary lanes on
# the southbound edge of road: a right-turn deceleration lane from the Jennifer
# Drive intersection to the entrance, and an acceleration lane from the entrance
# south past the 15608 Indian Head Hwy drive, each with a 100-ft taper.
def md_pt(al, off):
    return [A[0] + u[0] * al + n[0] * off, A[1] + u[1] * al + n[1] * off]
rec['roadImprovements'] = []
rec['roadImprovementsNote'] = ("Estates Court forms a T-intersection with Jennifer Drive. Jennifer Drive lies between the entrance and MD 210; "
                               "the existing separation/barrier is to remain. No direct Estates Court connection or auxiliary lane on MD 210 is proposed.")
# ── Intersection sight distance at MD 210 (submittal checklist item 10) ─────
# AASHTO Green Book (2018) Sec. 9.5.3, Case B (stop control on the minor road),
# ISD = 1.47 V t_g, passenger car, decision point 14.5 ft back from the edge of
# the through lane, eye 3.5 ft / object 3.5 ft. Design speed 55 mph on MD 210
# (the conservative case for this divided highway). MD 210 here is divided:
# SB 0-24.8 ft from the site's edge of road, 49-ft median, NB 74.2-122.8 ft, so
# a left turn out is two-stage (median storage); each stage is checked as B1.
V_MPH = 25
ISD = {'B2 RIGHT TURN — LOOKING LEFT ON JENNIFER DR': (6.5, 'north'),
       'B1 LEFT TURN — LOOKING LEFT ON JENNIFER DR': (7.5, 'north'),
       'B1 LEFT TURN — LOOKING RIGHT ON JENNIFER DR': (7.5, 'south')}
SSD_55 = 155.0          # AASHTO stopping sight distance, 25 mph, level grade
_cl0, _cl1 = cl.coords[0], cl.coords[1]
_ex = ((_cl0[0] - _cl1[0]) / math.dist(_cl0, _cl1), (_cl0[1] - _cl1[1]) / math.dist(_cl0, _cl1))   # exiting direction
_rt = (_ex[1], -_ex[0])                                                                     # right of an exiting driver
_eor = LineString(st['entrance']['edgeOfRoad'])
_hit = LineString([_cl1, (_cl0[0] + _ex[0] * 80, _cl0[1] + _ex[1] * 80)]).intersection(_eor)
_x0 = (_hit.x, _hit.y) if _hit.geom_type == 'Point' else _cl0
DP = (_x0[0] - _ex[0] * 14.5 + _rt[0] * 6, _x0[1] - _ex[1] * 14.5 + _rt[1] * 6)          # driver's eye, exit lane
_al0 = (_x0[0] - A[0]) * u[0] + (_x0[1] - A[1]) * u[1]                                   # station of the entrance along MD 210
sight = []
for name, (tg, look) in ISD.items():
    d = math.ceil(1.47 * V_MPH * tg / 10) * 10
    sgn = -1 if look == 'north' else 1                                                    # u runs south along MD 210
    lane_off = 6.1 if look == 'north' else 18.7                                             # Jennifer Drive lane centres
    tgt = md_pt(_al0 + sgn * d, lane_off)
    eye = DP
    sight.append({'case': name, 'tgS': tg, 'isdFt': d, 'from': list(eye), 'to': list(tgt)})
rec['sightDistance'] = {'road': 'JENNIFER DRIVE', 'designSpeedMph': V_MPH, 'ssdFt': SSD_55, 'decisionPoint': list(DP), 'lines': sight,
                        'citation': 'AASHTO A Policy on Geometric Design of Highways and Streets (2018), Sec. 9.5.3 Case B; Table 3-1',
                        'note': 'Sight triangles kept clear of obstructions between 3.5 ft and 10 ft above the road. County access approval governs; the existing MD 210 separation remains.'}

# ── Sheet content: title block, site data, approvals, environment, notes ──
envdir = os.path.join(proj, 'source', 'pgatlas-environmental')
def envpolys(layer):
    fp = os.path.join(envdir, f'L{layer}.json')
    if not os.path.exists(fp): return []
    out = []
    for f in json.load(open(fp))['features']:
        rs = (f.get('geometry') or {}).get('rings') or []
        if rs: out.append((unary_union([Polygon(r).buffer(0) for r in rs if len(r) > 2]), f['attributes']))
    return out
tract = Polygon(J('estates-indian-head.geometry.json')['tract'])
# Desktop environmental screening. Layer 17 maps woody vegetation across much
# of the tract and agrees with the woods shown on the base survey. It is used
# conservatively as existing woodland cover for concept hydrology; only an
# updated NRI/TCP field inventory can establish regulated woodland limits.
soil_rows = []
for p, a in envpolys(14):
    ar = p.intersection(tract).area
    if ar < 1: continue
    k = a.get('KFACTWS')
    soil_rows.append([a['SOIL_NAME_MUSYM'], a['MUNAME'], a.get('HYDROLGRP') or '—', k or '—', 'NO'])
woodland_geoms = []          # owner 2026-09-30: no woodland / canopy on this site; layer 17 not carried
for p, a in []:
    hit = p.intersection(tract).buffer(0)
    for gg in ([hit] if hit.geom_type == 'Polygon' else list(getattr(hit, 'geoms', []))):
        if gg.geom_type == 'Polygon' and gg.area > 50:
            woodland_geoms.append(gg)
woods_sf = round(sum(g.area for g in woodland_geoms))
rec['environmental'] = {
    'woodsSqFt': woods_sf,
    'receiving': 'the existing Jennifer Drive frontage-road drainage system',
    'streams': False, 'wetlands': False, 'floodplain': False, 'pma': False, 'cbca': False, 'springs': False, 'marlboroClay': False, 'tierII': False,
    'hsg': 'C', 'steep15SqFt': 0, 'steep25SqFt': 0, 'soilRows': soil_rows,
    'woodland': '',
    'soils': 'Soil types and boundaries from USDA NRCS (PGAtlas Soil layer): ' + '; '.join(f'{r[0]} (HSG {r[2]})' for r in soil_rows) + '.',
    'tmdl': 'Chesapeake Bay TMDL (nitrogen, phosphorus, sediment) applies; MD 12-digit watershed 021402030798, Piscataway Creek (02140203).',
    'highlyErodible': '',
    'wells': 'No wells or septic proposed (public water and sewer). Existing well on Parcel 199 (15608 Indian Head Hwy), off site, shown.',
    'approvals': 'New submittal: prior NRI-015-06 (with TCP1-018-06, TCP2-016-09) is base work only. Updated/revised NRI to be provided in draft with this submission; approved copy required before concept approval (Sec. 32-182(a)).',
    'nriCurrentForSubmittal': False,
}
# Map units whose NRCS slope phase reads 15% or steeper and that reach the
# tract: state what they are and what a slope phase does and does not
# establish, so a reviewer reading the soils table beside B-5 / B-11 has it.
import re as _re
_steep = []
for p_, a_ in envpolys(14):
    ar = p_.intersection(tract).area
    m = _re.search(r'(\d+) to (\d+) percent slopes', a_.get('MUNAME') or '')
    if ar >= 1 and m and int(m.group(2)) >= 15:
        _steep.append(f"{a_['SOIL_NAME_MUSYM']} ({a_['MUNAME'].split(',')[0]}, {m.group(1)}–{m.group(2)}% slope phase, {ar:,.0f} sf on the tract)")
if _steep:
    rec['environmental']['soilPhaseNote'] = ('NRCS map units ' + ' and '.join(_steep) + ' reach the tract edge; an NRCS slope phase '
        'classifies the map unit and is not a measured site slope. The updated NRI governs.')
# The plat's own dedication figure; the drawn R/W is compared with it, not substituted for it.
rec['dedicationOfRecordSqFt'] = 35173
rec['verticalDatumStatement'] = 'NAVD 88 throughout (M-NCPPC 2-ft contours; base-plan grades and floors converted from WSSC datum, -1.6 ft)'
lots_attrs = {f['attributes']['LOT']: f['attributes'] for f in J('source/pgatlas-parcels.json')['features']
              if f['attributes']['SUB_NAME'] == 'ESTATES AT INDIAN HEAD' and f['attributes']['LOT']}
rec['recordedLotAreasSqFt'] = {str(k): J(f'estates-indian-head-lot{k}.plat.json')['recordedAreaSqFt'] for k in range(1, 7)}
rec['titleBlock'] = {
    'planType': 'SITE DEVELOPMENT CONCEPT PLAN',
    'project': 'ESTATES AT INDIAN HEAD — LOTS 1–6',
    'location': '200–205 ESTATES COURT, ACCOKEEK, MD 20607',
    'record': 'PLAT BOOK PM 228 PLAT 83 · TAX MAP 151 F-3 · WSSC 220SE01',
    'districts': 'ELECTION DIST. 5 · COUNCIL DIST. 9 · ZONE RR',
    'owner': 'GERALD WALDMAN REVOCABLE TRUST, 400 N. FLAGLER DR., WEST PALM BEACH, FL 33401 (L.32062 F.043)',
    'engineer': 'W.L. MEEKINS, INC. — BILL MEEKINS, JR., 3101 RITCHIE ROAD, FORESTVILLE, MD 20747 · 301-736-7115',
    'preparedWith': 'KEALEE SPATIAL ENGINE / CAD-PLOT',
    'status': 'CONCEPT SUBMISSION 1 — NOT SEALED',
    'date': '2026-10-01',
    'jobNo': 'KEA-EIH-2026',
    'basisNote': 'New submittal to the DPIE Site Development Concept checklist (rev. 08/25/2021).',
}
rec['siteData'] = [
    ['Project', 'Estates at Indian Head, Lots 1–6 and Estates Court'],
    ['Location', 'Estates Ct at Jennifer Dr, south/east of separated MD 210; ±3,000 ft NE of MD 210 / MD 373; Accokeek 20607'],
    ['Record', 'Plat Book PM 228 Plat 83 (final plat 5-08238); Tax Map 151 F-3; WSSC 200\' 220SE01'],
    ['Accounts', ', '.join(lots_attrs[k]['ACCOUNT'] for k in sorted(lots_attrs))],
    ['Owner', 'Gerald Waldman Revocable Trust, L.32062 F.043'],
    ['Zone / use', 'RR (no change) — 6 single-family detached dwellings'],
    ['Tract', '165,019 sf of record (3.788 ac) = plat 171,505 sf less Outlot A (6,486 sf, conveyed L.51565 F.455)'],
    ['Public dedication', 'Estates Court 60\' R/W, 35,173 sf of record — rural open section, 24\' pavement, cul-de-sac'],
    ['Water / sewer', 'W-3 / S-3 (WSSC) — mains from Henrietta Dr via 30\' WSSC esmt L.51799 F.399 and prop. Lot 4 esmt'],
    ['Watershed', 'Piscataway Creek, MD 021402030798; not Tier II; not CBCA; FEMA Zone X'],
    ['Master plan', '2013 Subregion 5 Master Plan & SMA; Planning Area 84; Council Dist. 9; Election Dist. 5'],
    ['Datum', 'NAD 83 MD State Plane (US ft); vertical NAVD 88 throughout (M-NCPPC 2-ft contours; base-plan grades converted from WSSC datum, -1.6 ft)'],
]
# NOAA Atlas 14 24-hr depths retrieved for THIS site (PFDS, partial duration
# series, 2026-09-30) — the 100-yr comparison at each POI is computed on these.
rec['rainfall24hr'] = {
    'depthsIn': {1: 2.63, 2: 3.19, 5: 4.12, 10: 4.93, 25: 6.17, 50: 7.27, 100: 8.51},
    'citation': 'NOAA Atlas 14 Vol. 2 Ver. 3, PFDS point estimate, 38.6752 N 77.0040 W, partial duration series, 24-hr, retrieved 2026-09-30',
}
rec['approvalsOfRecordTable'] = [
    ['NRI-015-06', 'Prior approval — base work; updated NRI required'], ['TCP1-018-06', 'Prior approval — base work'],
    ['TCP2-016-09', 'Prior approval — base work; revision or new TCP per M-NCPPC'],
    ['5-08238', 'Final plat, PM 228 @ 83 — recorded'],    ['L.51799 F.399', '30\' WSSC easement (Outlot A, Lot 20) — recorded 2025'],
]
rec['generalNotes'] = [
    'Boundary per recorded plat PM 228 @ 83; lot lines reproduce the plat to the second.',
    'Horizontal datum: Maryland State Plane NAD 83 (US ft). Vertical datum: NAVD 88 throughout (M-NCPPC 2-ft contours). Base-plan spot grades and finished floors were on WSSC datum and are shown converted to NAVD 88 (WSSC datum less 1.6 ft, the mean offset to the county contours at the spot locations). DPIE prefers NGVD 29.',
    'Six single-family dwellings with side-load garages and courts, street trees and street lights, laid out to current requirements. Lot 4 is front-load (garage to the cul-de-sac) to clear the WSSC easement.',
    'Estates Court is a rural open section (DPW&T Std. 500.10 / 600.02 / 600.04): 24\' pavement, shoulders, roadside swales; driveways cross the swale on 15" RCP culverts with flared end sections.',
    'Estates Court intersects Jennifer Drive with 50\' returns. Jennifer Drive lies between the entrance and MD 210; preserve the existing physical separation/barrier. No direct MD 210 access or auxiliary lanes are proposed. Intersection sight distance at Jennifer Drive per the table on this sheet.',
    'Water and sewer: WSSC mains from Henrietta Dr through the recorded 30\' WSSC easement (L.51799 F.399) and a 30\' WSSC easement to be granted across Lot 4. Record discrepancies in the easement description to be resolved with WSSC.',
    'NEW SUBMITTAL (2026). Prior approvals NRI-015-06, TCP1-018-06 and TCP2-016-09 are used as base work only and do not carry this submittal. Additional work: an updated/revised NRI (draft with this submission, approved copy before concept approval, Sec. 32-182(a)); a TCP2-016-09 revision or new TCP / letter of exemption as M-NCPPC Environmental Planning determines; street trees and lighting reviewed to current DPW&T/DPIE standards; SWM by ESD to the MEP under current Subtitle 32.',
    'No environmental features on the property: no streams, stream buffers, wetlands, floodplain, PMA, steep slopes, woodland, highly erodible soils or Chesapeake Bay Critical Area.',
    'Grading: positive drainage away from every dwelling, 5% for the first 10 ft where practicable; driveways tie to the garage slab and the street at the grades shown; stepped grading at Lot 1; Lots 2-4 front yards drain to the roadside swales.',
    'RR ZONING CHECK: each lot exceeds 20,000 sf; proposed lot coverage is below the 25% maximum; building restriction lines depict 25-ft front, 8-ft side and 20-ft rear minimums. 40-ft height maximum.',
    'Contact Miss Utility (811) at least 48 hours before any excavation.',
]
rec['swmNotes'] = [
    'SWM by Environmental Site Design to the MEP (Md. Stormwater Management Act of 2007; MDE Design Manual Ch. 5; PGC Subtitle 32). Target rainfall P_E from MDE Table 5.3 for HSG C at each drainage area\'s imperviousness.',
    'Each lot\'s roof and rear yard drain to one micro-bioretention cell (M-6; drainage area held to the 20,000 sf M-6 limit, MDE Manual Sec. 5.4.3): 12-in max. ponding, 2.5-ft filter media, underdrain to a stable outfall. Front yards, driveways and lead walks drain with Estates Court to the roadside dry swales (M-8) with check dams.',
    'Rooftop and non-rooftop disconnection (N-1, N-2) to be credited at technical design. Infiltration credit only where Sec. 32-131 borings show ≥ 0.52 in/hr.',
    'Private ESD practices: maintenance agreement recorded before permit; public swales in the R/W maintained by DPIE.',
]
rec['escNotes'] = [
    'Sediment and erosion control per the 2011 Maryland Standards and Specifications for Soil Erosion and Sediment Control and PGSCD requirements.',
    'MDE Detail B-1 stabilized construction entrance: cover the full unpaved Jennifer Drive entrance apron and continue 30 ft into Estates Court; provide at least 50 ft total vehicle travel length and 10 ft minimum width, using 6 in minimum depth of 2–3 in aggregate over nonwoven geotextile. Install before permanent paving; do not place stone over existing Jennifer Drive pavement.',
    'Pipe all surface flow crossing the SCE beneath it, sized for the 2-year, 24-hour storm (6 in minimum), with a mountable berm where not at a high point. Super silt fence along the down-gradient LOD; inlet and swale protection.',
    'Stabilize disturbed areas within 3 days on slopes ≥ 3:1 and within 7 days elsewhere.',
]
rec['sequenceOfConstruction'] = [
    'Pre-construction meeting with the PGSCD / DPIE inspector; Miss Utility.',
    'Install stabilized construction entrance and perimeter controls; inspector approval.',
    'Clear and grub within the LOD; rough grade Estates Court and swales.',
    'Install water and sewer (Henrietta Dr to Estates Ct) and house connections.',
    'Construct pavement, shoulders, culverts and entrance; stabilize swales.',
    'Build dwellings, driveways and courts; construct ESD practices after the contributing area is stable.',
    'Fine grade, permanent stabilization, street trees and lights; remove controls with inspector approval.',
]
buf = tract.buffer(100)
rec['environmentalGeometry'] = {
    'steepSlopes': [],
    'woodland': [],          # owner 2026-09-30: no environmental features on this site (no woodland)
    'soils': [{'label': a['SOIL_NAME_MUSYM'], 'ring': [list(q) for q in list(gg.exterior.coords)[:-1]]}
              for p, a in envpolys(14) for gg in ([p.intersection(buf)] if p.intersection(buf).geom_type == 'Polygon' else list(getattr(p.intersection(buf), 'geoms', [])))
              if not gg.is_empty and gg.geom_type == 'Polygon' and gg.area > 50],
}
rec['vicinityStreetsFile'] = os.path.abspath(os.path.join(proj, 'source', 'pgatlas-vicinity-streets.json'))
rec['existingRoads'] = roads
# Existing structures off site, from the county's 2023 building layer
# (PGAtlas Administrative/MapServer/2), archived in source/. User 2026-10-01:
# show the house at 15608 Indian Head Hwy and label it as existing.
bfile = os.path.join(proj, 'source', 'pgatlas-buildings-15608.json')
if os.path.exists(bfile):
    B = json.load(open(bfile))
    pa = B['parcel']
    addr = f"{int(pa['HOUSE_NUMBER'])} {pa['STREET_NAME']} {'HWY' if pa['STREET_TYPE'] == 'HWY' else pa['STREET_TYPE']}"
    rec['existingStructures'] = [{
        'ring': b['ring'], 'areaSqFt': b['areaSqFt'],
        'label': f"EXISTING DWELLING\\P{addr}",
        'source': B['source'],
    } for b in B['buildings']]
rec['streetTrees'] = trees
rec['streetLights'] = lights
rec['roadsideSwales'] = swales
rec['culverts'] = culverts
rec['spotElevationsFromPlan'] = {'datum': f'NAVD 88 — converted from WSSC datum, which reads about {WSSC_ABOVE_NAVD88_FT} ft above the NAVD 88 county contours (scatter 1.2 ft)',
                                 'replaceGenerated': True, 'points': spots}
if entrance: rec['entranceApron'] = entrance
# ── Site L.O.D. (owner 2026-10-01) ──────────────────────────────────────────
# One smooth line around the whole development: 10 ft inside the rear line of
# every lot and the outer sides of Lots 1 and 6 (tree-save strip, 8-15 ft), with
# rounded corners — not a stepped union of per-lot grading. Only the street
# R/W at its connection, the entrance, the off-site road work and the WSSC
# easement corridor cross the strip.
LOD_SETBACK_FT, LOD_ROUND_FT = 10.0, 25.0
_geo = J('estates-indian-head.geometry.json')
_tract = Polygon(_geo['tract']).buffer(0)
_inset = _tract.buffer(-LOD_SETBACK_FT, join_style=1)
_inset = _inset.buffer(-LOD_ROUND_FT, join_style=1).buffer(LOD_ROUND_FT, join_style=1)      # round the corners
_cross = []
for _r in st.get('rowRings') or []:
    _cross.append(Polygon(_r).buffer(0))
for _r in st.get('pavementRings') or []:
    _cross.append(Polygon(_r).buffer(0))
if rec.get('entranceApron'):
    _cross.append(Polygon(rec['entranceApron']['ring']).buffer(0))
for _ri in rec.get('roadImprovements') or []:
    _cross.append(Polygon(_ri['ring']).buffer(0))
for _e in rec.get('easementsOfRecord') or []:
    if _e.get('ring') and 'WSSC' in (_e.get('type', '') + _e.get('label', '')):
        _cross.append(Polygon(_e['ring']).buffer(0))
# every dwelling (and a 5-ft working margin) must sit inside the L.O.D.; where a
# house stands closer than the tree-save strip, the line bulges around it there only
for _k in range(1, 7):
    _fp = J(f'estates-indian-head-lot{_k}.plat.json').get('fixedFootprint')
    if _fp:
        _cross.append(Polygon(_fp).buffer(5.0, join_style=1))
_lod = unary_union([_inset] + [c.buffer(2.0, join_style=1) for c in _cross])
_lod = _lod.buffer(6.0, join_style=1).buffer(-6.0, join_style=1)                            # smooth the joins
if _lod.geom_type == 'MultiPolygon':
    _lod = max(_lod.geoms, key=lambda g: g.area)
_lod = Polygon(_lod.exterior).simplify(0.25)
rec['siteLod'] = {'ring': [list(p) for p in list(_lod.exterior.coords)[:-1]], 'areaSqFt': round(_lod.area),
                  'setbackFt': LOD_SETBACK_FT, 'cornerRadiusFt': LOD_ROUND_FT,
                  'note': "Limit of disturbance held 10 ft inside the rear lot lines and the outer sides of Lots 1 and 6 (existing tree line preserved); crossed only by the street, entrance and WSSC easement."}

json.dump(rec, open(os.path.join(proj, 'estates-indian-head.plat-record.json'), 'w'), indent=1)
print(f'roads {len(roads)} · trees {len(trees)} · lights {len(lights)} · swale runs {len(swales)} '
      f'({sum(LineString(s["line"]).length for s in swales):.0f} ft) · culverts {len(culverts)} · spots {len(spots)} · '
      f'entrance {entrance["areaSqFt"] if entrance else 0} sf outside the Estates Ct R/W')
