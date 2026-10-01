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
  entranceApron      the street entrance at MD 210 as its own feature.
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

# ── MD 210 (2009 sheet) ──────────────────────────────────────────────────────
md = J('source/md210-2009-lines.json')
A = md['A']; u = md['u']; n = md['n']            # n points from the site toward the highway
def along(off, a0=-420, a1=520):
    return [[A[0] + u[0] * a0 + n[0] * off, A[1] + u[1] * a0 + n[1] * off],
            [A[0] + u[0] * a1 + n[0] * off, A[1] + u[1] * a1 + n[1] * off]]
md210 = {'name': 'INDIAN HEAD HIGHWAY (MD 210)',
         'label': 'INDIAN HEAD HIGHWAY — MARYLAND ROUTE 210 — VARIABLE R/W WIDTH (S.R.C. PLAT NO. 47040) — SHA',
         'source': '2009 approved sheet DPW&T 9399-2009, lines measured parallel to the edge of road',
         'lines': [{'type': 'edge-of-road', 'line': along(0.0), 'label': 'EX. EDGE OF ROAD'},
                   {'type': 'lane-line', 'line': along(12.2)},
                   {'type': 'edge-of-road', 'line': along(24.8), 'label': 'EX. EDGE OF ROAD'},
                   {'type': 'edge-of-road', 'line': along(74.2), 'label': 'EX. EDGE OF ROAD'},
                   {'type': 'lane-line', 'line': along(102.2)},
                   {'type': 'edge-of-road', 'line': along(122.8), 'label': 'EX. EDGE OF ROAD'}]}

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
roads = [md210, road('JENNIFER', 'JENNIFER DRIVE'), road('HENRIETTA', 'HENRIETTA DRIVE')]

# ── Street trees and lights (2009 street tree & lighting plan) ───────────────
TREES_PX = [(1866, 530), (1960, 1126), (2236, 1330), (2510, 1540), (2820, 1670), (1710, 1426), (2240, 1816),
            (2930, 2090), (3220, 1750), (3570, 1794), (3870, 1624), (4410, 1540), (4556, 1936), (4356, 2210),
            (3256, 2150), (3576, 2196)]
LIGHTS_PX = [(1733, 930), (3127, 1730), (4190, 1470), (4030, 2235), (2165, 1783)]
trees = [{'point': list(W(*p)), 'species': 'ACER RUBRUM — RED MAPLE', 'size': '2 1/2"–3" CAL., B&B', 'source': '2009 street tree plan'} for p in TREES_PX]
lights = [{'point': list(W(*p)), 'fixture': '100 W HPS COLONIAL POST-TOP, TYPE IV, BLACK FIBERGLASS, DIRECT BURIED', 'utility': 'SMECO', 'source': '2009 street light plan (permit 09.09399)'} for p in LIGHTS_PX]

# ── Roadside swales (2009 ditch line) and driveway culverts ───────────────────
aprons = []
for k in range(1, 7):
    sp = J(f'estates-indian-head-lot{k}.plat.json')
    for f in sp.get('fixedPaving', []):
        if f['kind'] == 'Apron':
            aprons.append((k, Polygon(f['ring']).buffer(0)))
mouth_cut = Polygon(st['entrance']['edgeOfRoad'] + [cl.coords[2], cl.coords[1]]).buffer(40) if 'entrance' in st else None
ditch_run = []
for side in (20, -20):
    o = cl.offset_curve(side)
    ditch_run.append(o)
bulb_ring = Point(C).buffer(52, 128).exterior
ditch = unary_union(ditch_run + [bulb_ring])
ditch = ditch.intersection(row.buffer(-0.5))
# keep only the pieces outside the pavement (the stem offsets run into the bulb pavement)
pave = unary_union([Polygon(r) for r in st['pavementRings']])
ditch = ditch.difference(pave.buffer(6))
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
spots = [{'point': list(W(u_, v_)), 'elevationFt': z, 'label': f'{z:.2f}'.rstrip('0').rstrip('.') if z % 1 else f'{z:.1f}',
          'datum': 'WSSC datum (2009 plan)', 'source': '2009 approved sheet DPW&T 9399-2009'} for u_, v_, z in SPOTS_PX]

# ── Entrance apron at MD 210 ─────────────────────────────────────────────────
ent = st.get('entrance')
entrance = None
if ent:
    rw_mouth = row
    # the entrance = the pavement between MD 210's edge of road and the end of
    # the two 50-ft returns (the flare), i.e. within ~(R + 10) ft of the edge of road
    eor = LineString(ent['edgeOfRoad'])
    ent_poly = unary_union([Polygon(r) for r in st['pavementRings']]).intersection(eor.buffer(ent['returnRadiusFt'] + 2, cap_style=2)).buffer(0)
    geoms = list(ent_poly.geoms) if hasattr(ent_poly, 'geoms') else [ent_poly]
    big = max(geoms, key=lambda x: x.area)
    entrance = {'ring': [list(q) for q in list(big.exterior.coords)[:-1]], 'areaSqFt': round(big.area),
                'label': "STREET ENTRANCE APRON — 50' RETURNS TO MD 210 EDGE OF ROAD (2009 PLAN) — SHA ACCESS PERMIT",
                'returnRadiusFt': ent['returnRadiusFt']}

# ── MD 210 frontage improvements, both sides of the entrance ──────────────
# Owner: "road development should extend on both sides of Estates Ct to
# Indian Head Hwy / Jennifer Dr". Laid out for SHA as 12-ft auxiliary lanes on
# the southbound edge of road: a right-turn deceleration lane from the Jennifer
# Drive intersection to the entrance, and an acceleration lane from the entrance
# south past the 15608 Indian Head Hwy drive, each with a 100-ft taper.
def md_pt(al, off):
    return [A[0] + u[0] * al + n[0] * off, A[1] + u[1] * al + n[1] * off]
AUX = -12.0            # toward the site (n points toward the highway)
JENNIFER_AL, N_RETURN_AL, S_RETURN_AL, SOUTH_END_AL, TAPER = -177.0, 0.0, 124.0, 300.0, 100.0
decel = [md_pt(JENNIFER_AL, 0), md_pt(JENNIFER_AL + TAPER, AUX), md_pt(N_RETURN_AL, AUX), md_pt(N_RETURN_AL, 0)]
accel = [md_pt(S_RETURN_AL, 0), md_pt(S_RETURN_AL, AUX), md_pt(SOUTH_END_AL - TAPER, AUX), md_pt(SOUTH_END_AL, 0)]
rec['roadImprovements'] = [
    {'id': 'md210-decel', 'ring': decel, 'label': "PROP. 12' RIGHT-TURN DECELERATION LANE, SB MD 210 — JENNIFER DR TO ESTATES CT (100' TAPER) — SHA DESIGN / ACCESS PERMIT",
     'lengthFt': N_RETURN_AL - JENNIFER_AL},
    {'id': 'md210-accel', 'ring': accel, 'label': "PROP. 12' ACCELERATION LANE, SB MD 210 — ESTATES CT TO 15608 INDIAN HEAD HWY DRIVE (100' TAPER) — SHA",
     'lengthFt': SOUTH_END_AL - S_RETURN_AL},
]
rec['roadImprovementsNote'] = ("MD 210 frontage improvements are shown for SHA review. At the entrance the MD 210 R/W line lies about 6 ft "
                               "off the edge of road (2009 sheet), so a 12-ft lane needs R/W dedication along Lots 1 and 6 or SHA agreement. "
                               "Lane lengths and tapers are set by SHA's access-permit review and traffic study.")
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
steep15 = sum(p.intersection(tract).area for p, a in envpolys(13) if a.get('RANGE') == 25)
steep25 = sum(p.intersection(tract).area for p, a in envpolys(13) if a.get('RANGE') == 90)
soil_rows = []
for p, a in envpolys(14):
    ar = p.intersection(tract).area
    if ar < 1: continue
    k = a.get('KFACTWS'); he = 'YES (on slopes >= 15%)' if k and float(k) >= 0.35 else 'NO'
    soil_rows.append([a['SOIL_NAME_MUSYM'], a['MUNAME'], a.get('HYDROLGRP') or '—', k or '—', he])
rec['environmental'] = {
    'streams': False, 'wetlands': False, 'floodplain': False, 'pma': False, 'cbca': False, 'springs': False, 'marlboroClay': False, 'tierII': False,
    'hsg': 'C', 'steep15SqFt': round(steep15), 'steep25SqFt': round(steep25), 'soilRows': soil_rows,
    'woodland': 'No woodland conservation shown on this concept. Prior NRI-015-06 / TCP2-016-09 are base work only; woodland per the updated NRI, with a TCP2 revision or new TCP / letter of exemption as M-NCPPC determines.',
    'soils': 'Soil types and boundaries from USDA NRCS (PGAtlas Soil layer): ' + '; '.join(f'{r[0]} (HSG {r[2]})' for r in soil_rows) + '.',
    'tmdl': 'Chesapeake Bay TMDL (nitrogen, phosphorus, sediment) applies; MD 12-digit watershed 021402030798, Piscataway Creek (02140203).',
    'highlyErodible': 'Beltsville silt loam (K 0.37) is highly erodible where slopes are 15% or more; those areas are stabilized within 3 days.',
    'wells': 'No wells or septic proposed (public water and sewer). Existing well on Parcel 199 (15608 Indian Head Hwy), off site, shown.',
    'approvals': 'New submittal: prior NRI-015-06 (with TCP1-018-06, TCP2-016-09) is base work only. Updated/revised NRI to be provided in draft with this submission; approved copy required before concept approval (Sec. 32-182(a)).',
    'nriCurrentForSubmittal': False,
}
lots_attrs = {f['attributes']['LOT']: f['attributes'] for f in J('source/pgatlas-parcels.json')['features']
              if f['attributes']['SUB_NAME'] == 'ESTATES AT INDIAN HEAD' and f['attributes']['LOT']}
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
    'date': '2026-09-30',
    'jobNo': 'KEA-EIH-2026',
}
rec['siteData'] = [
    ['Project', 'Estates at Indian Head, Lots 1–6 and Estates Court'],
    ['Location', 'S. side of MD 210, ±3,000 ft NE of MD 210 / MD 373; 200–205 Estates Ct, Accokeek 20607'],
    ['Record', 'Plat Book PM 228 Plat 83 (final plat 5-08238); Tax Map 151 F-3; WSSC 200\' 220SE01'],
    ['Accounts', ', '.join(lots_attrs[k]['ACCOUNT'] for k in sorted(lots_attrs))],
    ['Owner', 'Gerald Waldman Revocable Trust, L.32062 F.043'],
    ['Zone / use', 'RR (no change) — 6 single-family detached dwellings'],
    ['Tract', '165,019 sf of record (3.788 ac) = plat 171,505 sf less Outlot A (6,486 sf, conveyed L.51565 F.455)'],
    ['Public dedication', 'Estates Court 60\' R/W, 35,173 sf of record — rural open section, 24\' pavement, cul-de-sac'],
    ['Water / sewer', 'W-3 / S-3 (WSSC) — mains from Henrietta Dr via 30\' WSSC esmt L.51799 F.399 and prop. Lot 4 esmt'],
    ['Watershed', 'Piscataway Creek, MD 021402030798; not Tier II; not CBCA; FEMA Zone X'],
    ['Master plan', '2013 Subregion 5 Master Plan & SMA; Planning Area 84; Council Dist. 9; Election Dist. 5'],
    ['Datum', 'NAD 83 MD State Plane (US ft); NAVD 88 (M-NCPPC 2-ft); 2009 spot grades on WSSC datum'],
]
rec['approvalsOfRecordTable'] = [
    ['NRI-015-06', 'Prior approval — base work; updated NRI required'], ['TCP1-018-06', 'Prior approval — base work'],
    ['TCP2-016-09', 'Prior approval — base work; revision or new TCP per M-NCPPC'],
    ['5-08238', 'Final plat, PM 228 @ 83 — recorded'], ['DPW&T 9399-2009-00', 'Street tree & lighting plan (2009) — base layout; re-review to current standards'],
    ['L.51799 F.399', '30\' WSSC easement (Outlot A, Lot 20) — recorded 2025'],
]
rec['generalNotes'] = [
    'Boundary per recorded plat PM 228 @ 83; lot lines reproduce the plat to the second. A Maryland licensed surveyor shall confirm the boundary and the MD 210 R/W before technical plans.',
    'Horizontal datum: Maryland State Plane NAD 83 (US ft). Vertical datum: NAVD 88 (M-NCPPC 2-ft contours). 2009 spot grades are on WSSC datum (≈ NAVD 88 + 1.6 ft, to be confirmed by the field-run survey). DPIE prefers NGVD 29 — the survey shall state the conversion.',
    'The base layout is the 2009 Street Tree & Lighting Plan (DPW&T 9399-2009-00), resubmitted for review under current requirements: dwellings, side-load garages and courts, street trees and street lights. Lot 4 is front-load (garage to the cul-de-sac) to clear the WSSC easement.',
    'Estates Court is a rural open section (DPW&T Std. 500.10 / 600.02 / 600.04): 24\' pavement, shoulders, roadside swales; driveways cross the swale on 15" RCP culverts with flared end sections.',
    'Entrance to MD 210 (SHA) with 50\' returns as the 2009 plan; SHA access permit and sight-distance analysis required. MD 210 auxiliary lanes shown for SHA review; R/W dedication may be required.',
    'Water and sewer: WSSC mains from Henrietta Dr through the recorded 30\' WSSC easement (L.51799 F.399) and a 30\' WSSC easement to be granted across Lot 4. Record discrepancies in the easement description to be resolved with WSSC.',
    'NEW SUBMITTAL (2026). Prior approvals NRI-015-06, TCP1-018-06, TCP2-016-09 and DPW&T 9399-2009-00 are used as base work only and do not carry this submittal. Additional work: an updated/revised NRI (draft with this submission, approved copy before concept approval, Sec. 32-182(a)); a TCP2-016-09 revision or new TCP / letter of exemption as M-NCPPC Environmental Planning determines; street tree and lighting plan re-reviewed to current DPW&T/DPIE standards; SWM by ESD to the MEP under current Subtitle 32.',
    'No streams, wetlands, floodplain, PMA or Chesapeake Bay Critical Area on the property (prior NRI-015-06; updated NRI required).',
    'Contact Miss Utility (811) at least 48 hours before any excavation.',
]
rec['swmNotes'] = [
    'SWM by Environmental Site Design to the MEP (Md. Stormwater Management Act of 2007; MDE Design Manual Ch. 5; PGC Subtitle 32). Target rainfall P_E from MDE Table 5.3 for HSG C at each drainage area\'s imperviousness.',
    'Each lot drains to one micro-bioretention cell (M-6): 12-in max. ponding, 2.5-ft filter media, underdrain to a stable outfall. Estates Court drains to roadside dry swales (M-8) with check dams.',
    'Rooftop and non-rooftop disconnection (N-1, N-2) to be credited at technical design. Infiltration credit only where Sec. 32-131 borings show ≥ 0.52 in/hr.',
    'Private ESD practices: maintenance agreement recorded before permit; public swales in the R/W maintained by DPIE.',
]
rec['escNotes'] = [
    'Sediment and erosion control per the 2011 Maryland Standards and Specifications for Soil Erosion and Sediment Control and PGSCD requirements.',
    'Stabilized construction entrance at the Estates Court entrance; super silt fence along the down-gradient limit of disturbance; inlet and swale protection.',
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
    'steepSlopes': [{'range': '15-25%' if a.get('RANGE') == 25 else '>25%', 'ring': [list(q) for q in list(gg.exterior.coords)[:-1]]}
                    for p, a in envpolys(13) for gg in ([p.intersection(buf)] if p.intersection(buf).geom_type == 'Polygon' else list(getattr(p.intersection(buf), 'geoms', [])))
                    if not gg.is_empty and gg.geom_type == 'Polygon' and gg.area > 20],
    'soils': [{'label': a['SOIL_NAME_MUSYM'], 'ring': [list(q) for q in list(gg.exterior.coords)[:-1]]}
              for p, a in envpolys(14) for gg in ([p.intersection(buf)] if p.intersection(buf).geom_type == 'Polygon' else list(getattr(p.intersection(buf), 'geoms', [])))
              if not gg.is_empty and gg.geom_type == 'Polygon' and gg.area > 50],
}
rec['vicinityStreetsFile'] = os.path.abspath(os.path.join(proj, 'source', 'pgatlas-vicinity-streets.json'))
rec['existingRoads'] = roads
rec['streetTrees'] = trees
rec['streetLights'] = lights
rec['roadsideSwales'] = swales
rec['culverts'] = culverts
rec['spotElevationsFromPlan'] = {'datum': 'WSSC datum (2009 plan); reads about 1.6 ft above NAVD 88 county contours (scatter 1.2 ft) — reset by field survey',
                                 'replaceGenerated': True, 'points': spots}
if entrance: rec['entranceApron'] = entrance
json.dump(rec, open(os.path.join(proj, 'estates-indian-head.plat-record.json'), 'w'), indent=1)
print(f'roads {len(roads)} · trees {len(trees)} · lights {len(lights)} · swale runs {len(swales)} '
      f'({sum(LineString(s["line"]).length for s in swales):.0f} ft) · culverts {len(culverts)} · spots {len(spots)} · '
      f'entrance {entrance["areaSqFt"] if entrance else 0} sf outside the Estates Ct R/W')
