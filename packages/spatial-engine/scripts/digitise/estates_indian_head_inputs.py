"""
Estates at Indian Head (Lots 1-6, Plat PM 228 @ 83) -> generate-subdivision.ts inputs.

    python3 estates_indian_head_inputs.py <parcels.json> <out_dir>

<parcels.json> is a PGAtlas Address/MapServer/15 query (outSR 2248, outFields=*)
over the tract and its neighbours. The recorded lots are in that layer with the
plat's own bearings to the second (N 03-27-28 W 90.53 vs plat N 03-27-26 W
90.53; S 68-24-27 W exact), i.e. digitised from the plat COGO, so the lot
rings are used as the boundary of record and every call is compared to the
2009 approved sheet (DPW&T 9399-2009) in the manifest.

Outlot A is NOT in the tract: it was conveyed to M. & K. Doyal (L.51565
F.455, 2025-12-29) in exchange for the 30' WSSC easement (L.51799 F.399).
"""
import json, math, sys
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union

parcels_path, out = sys.argv[1], sys.argv[2]
d = json.load(open(parcels_path))
feats = d['features']

lots, outlot, others = {}, None, []
for f in feats:
    a = f['attributes']
    if a['SUB_NAME'] == 'ESTATES AT INDIAN HEAD':
        if a['OUT_LOT']:
            outlot = f
        else:
            lots[int(a['LOT'])] = f
    else:
        others.append(f)
assert sorted(lots) == [1, 2, 3, 4, 5, 6], sorted(lots)

def ring_of(f):
    r = [tuple(p) for p in f['geometry']['rings'][0]]
    return r[:-1] if r[0] == r[-1] else r

def dms_bearing(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    az = math.degrees(math.atan2(dx, dy)) % 360
    if az <= 90: ns, ew, ang = 'N', 'E', az
    elif az <= 180: ns, ew, ang = 'S', 'E', 180 - az
    elif az <= 270: ns, ew, ang = 'S', 'W', az - 180
    else: ns, ew, ang = 'N', 'W', 360 - az
    D = int(ang); M = int((ang - D) * 60); S = round((ang - D - M / 60) * 3600)
    if S == 60: S = 0; M += 1
    if M == 60: M = 0; D += 1
    return f'{ns} {D:02d}-{M:02d}-{S:02d} {ew}', math.hypot(dx, dy)

def calls_of(ring, label):
    out = []
    n = len(ring)
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]
        br, L = dms_bearing(a, b)
        if L < 0.01: continue
        out.append({'kind': 'line', 'bearing': br, 'distanceFt': round(L, 2), 'label': f'{label} {i + 1}'})
    return out

# ── Estates Court dedication (the notch between the lots, closed at the highway) ──
L1, L6 = ring_of(lots[1]), ring_of(lots[6])
lot6_tip = max(L6, key=lambda p: p[1] - 0.2 * p[0])   # north-west tip on the R/W
lot6_tip = min(L6, key=lambda p: math.hypot(p[0] - 1310996.24, p[1] - 367385.52))
lot1_nw = min(L1, key=lambda p: math.hypot(p[0] - 1310951.36, p[1] - 367522.25))
b = math.radians(51 + 26 / 60 + 53 / 3600)             # plat: N 51-26-53 W 147.04'
P = (lot6_tip[0] - 147.04 * math.sin(b), lot6_tip[1] + 147.04 * math.cos(b))
u = unary_union([Polygon(ring_of(f)) for f in [*lots.values(), outlot]]).buffer(0.05).buffer(-0.05)
ex = list(u.exterior.coords)[:-1]
near = lambda q: min(range(len(ex)), key=lambda i: math.hypot(ex[i][0] - q[0], ex[i][1] - q[1]))
ia, ib = near(lot6_tip), near(lot1_nw)
path = [ex[i % len(ex)] for i in range(ia, ia + ((ib - ia) % len(ex)) + 1)]
row = Polygon(path + [P])
if row.area > 60000:
    path = [ex[i % len(ex)] for i in range(ib, ib + ((ia - ib) % len(ex)) + 1)]
    row = Polygon(path + [P])
row = row.buffer(0)
print(f'Estates Court dedication {row.area:,.0f} sf (plat 35,173 sf)')

tract = unary_union([Polygon(ring_of(f)) for f in lots.values()] + [row]).buffer(0.05).buffer(-0.05)
tract = tract.simplify(0.05)
print(f'tract {tract.area:,.0f} sf (plat 171,505 incl. Outlot A 6,486 -> 165,019)')

# ── Street geometry ──────────────────────────────────────────────────────────
streets = json.load(open(parcels_path.replace('parcels.json', 'streets.json')))
cl = None
for f in streets['features']:
    if f['attributes'].get('NAME') == 'ESTATES':
        cl = [tuple(p) for p in f['geometry']['paths'][0]]
C = (1311317.99, 367360.23)            # bulb centre, fitted to Lots 2-4 frontage arcs (R/W R = 61.3')
if math.hypot(cl[0][0] - C[0], cl[0][1] - C[1]) < math.hypot(cl[-1][0] - C[0], cl[-1][1] - C[1]):
    cl = cl[::-1]
# The county centreline is compiled and wanders across the R/W (it sits on the
# south line at Lot 5). The design centreline is the south R/W line — Lots 6
# and 5 frontage and the plat's N 51-26-53 W 147.04' call to the highway —
# offset 30 ft into the 60 ft R/W, ending at the bulb centre.
L5p, L6p = Polygon(ring_of(lots[5])).buffer(0.5), Polygon(ring_of(lots[6])).buffer(0.5)
south_pts = [q for q in path if (L5p.contains(Point(q)) or L6p.contains(Point(q)))
             and math.hypot(q[0] - C[0], q[1] - C[1]) > 64]
south = LineString([P] + south_pts) if math.dist(P, south_pts[0]) < math.dist(P, south_pts[-1]) \
    else LineString([P] + south_pts[::-1])
off = south.offset_curve(30.0)
if not row.buffer(-5).intersects(off.interpolate(0.5, normalized=True)):
    off = south.offset_curve(-30.0)
oc = list(off.coords)
if math.dist(oc[0], C) < math.dist(oc[-1], C): oc = oc[::-1]
oc = [q for q in oc if math.hypot(q[0] - C[0], q[1] - C[1]) > 20]
cl = [tuple(q) for q in LineString(oc + [C]).simplify(0.5).coords]
# start the centreline at the R/W mouth (highway right-of-way line)
mouth = LineString([lot1_nw, P])
cl_line = LineString(cl)
# MEASURED OFF THE 2009 APPROVED SHEET (source/stl-2009-georef.json):
#   24 ft pavement centred in the 60 ft R/W (edge-of-pavement lines at +/-12 ft),
#   shoulder/ditch line at +/-20 ft, cul-de-sac edge of pavement R = 42 ft
#   (R/W R = 60.5 ft as scaled, 60 ft of record), entrance returns R = 50 ft
#   (fitted 48.9 / 52.2 ft; both centres 62.4 / 62.9 ft off the centreline =
#   12 + 50, i.e. tangent to the pavement edges), meeting MD 210's edge of road
#   on a line S 38-29 W, found as the common tangent of the two returns.
PAVE_W, BULB_PAVE_R, RETURN_R = 24.0, 42.0, 50.0
EOR_A, EOR_B = (1310943.8, 367545.4), (1310865.8, 367447.3)     # MD 210 edge of road (2009 sheet)
pavement = unary_union([cl_line.buffer(PAVE_W / 2, cap_style=2), Point(C).buffer(BULB_PAVE_R, 64)]).intersection(row.buffer(-1))
# the entrance: returns tangent to the pavement edges and to the edge of road
_p0, _p1 = cl[0], cl[1]
_u = ((_p1[0] - _p0[0]) / math.dist(_p0, _p1), (_p1[1] - _p0[1]) / math.dist(_p0, _p1)); _n = (-_u[1], _u[0])
_eu = ((EOR_B[0] - EOR_A[0]) / math.dist(EOR_A, EOR_B), (EOR_B[1] - EOR_A[1]) / math.dist(EOR_A, EOR_B))
_en = (-_eu[1], _eu[0])
if (_p0[0] + _u[0] * 50 - EOR_A[0]) * _en[0] + (_p0[1] + _u[1] * 50 - EOR_A[1]) * _en[1] < 0: _en = (-_en[0], -_en[1])   # toward the site
def _return(side):
    off = side * (PAVE_W / 2 + RETURN_R)
    # centre = p0 + t*u + off*n with distance to the edge of road = R (site side)
    base = (_p0[0] + _n[0] * off, _p0[1] + _n[1] * off)
    d0 = (base[0] - EOR_A[0]) * _en[0] + (base[1] - EOR_A[1]) * _en[1]
    t = (RETURN_R - d0) / (_u[0] * _en[0] + _u[1] * _en[1])
    cc = (base[0] + _u[0] * t, base[1] + _u[1] * t)
    t_eop = (cc[0] - _n[0] * side * RETURN_R, cc[1] - _n[1] * side * RETURN_R)
    t_eor = (cc[0] - _en[0] * RETURN_R, cc[1] - _en[1] * RETURN_R)
    a0 = math.atan2(t_eop[1] - cc[1], t_eop[0] - cc[0]); a1 = math.atan2(t_eor[1] - cc[1], t_eor[0] - cc[0])
    da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
    arc = [(cc[0] + RETURN_R * math.cos(a0 + da * k / 24), cc[1] + RETURN_R * math.sin(a0 + da * k / 24)) for k in range(25)]
    return cc, arc
cN, arcN = _return(+1)
cS, arcS = _return(-1)
entrance = Polygon(arcN + arcS[::-1]).buffer(0)
entrance = unary_union([entrance, Polygon([arcN[0], arcS[0], (arcS[0][0] + _u[0] * 5, arcS[0][1] + _u[1] * 5), (arcN[0][0] + _u[0] * 5, arcN[0][1] + _u[1] * 5)])]).buffer(0)
pavement = unary_union([pavement, entrance]).buffer(0.05).buffer(-0.05).simplify(0.1)
ENTRANCE = {'returnRadiusFt': RETURN_R, 'northReturnCentre': cN, 'southReturnCentre': cS,
            'edgeOfRoad': [EOR_A, EOR_B], 'entranceSqFt': round(entrance.area)}
print(f"entrance: R {RETURN_R} returns, {entrance.area:,.0f} sf; bulb EOP R {BULB_PAVE_R}")

# ── WSSC easements ───────────────────────────────────────────────────────────
O = ring_of(outlot)
S0 = min(O, key=lambda p: math.hypot(p[0] - 1311492.9, p[1] - 367281.9))   # SW corner (on S 68-24-27 W)
N0 = min(O, key=lambda p: math.hypot(p[0] - 1311487.5, p[1] - 367372.3))   # Lot 3/4/Outlot corner
uw = ((N0[0] - S0[0]) / 90.53, (N0[1] - S0[1]) / 90.53)
az = math.radians(85 + 10 / 60 + 40 / 3600)                                 # N 85-10-40 E
e = (math.sin(az), math.cos(az))
add = lambda p, v, k: (p[0] + v[0] * k, p[1] + v[1] * k)
W1, W2 = add(S0, uw, 32.0), add(S0, uw, 62.0)
E1, E2 = add(W1, e, 30.25), add(W2, e, 30.21)
outlot_esmt = [W1, E1, E2, W2]
lot20_esmt = [E1, add(E1, e, 106.67), add(E2, e, 103.23), E2]
Wm = add(S0, uw, 47.0)
# THE LOT 4 EASEMENT HUGS THE LOT 3 / LOT 4 LINE. Run diagonally from the
# Outlot A square to the bulb it left Lot 4 a 30-ft sliver between the
# easement and the 20-ft rear yard, and the 2009 house could not be built.
# The main now jogs from the recorded square up to a line 15 ft south of the
# Lot 3/4 line and follows it to the cul-de-sac, so the 30-ft easement's north
# edge IS the lot line and the middle of Lot 4 is free.
J34a, J34b = N0, min(ring_of(lots[4]), key=lambda p: math.hypot(p[0] - 1311379.8, p[1] - 367364.8))
u34 = ((J34b[0] - J34a[0]) / math.dist(J34a, J34b), (J34b[1] - J34a[1]) / math.dist(J34a, J34b))
n34 = (u34[1], -u34[0])
L4poly = Polygon(ring_of(lots[4]))
if not L4poly.contains(Point(add(add(J34a, u34, 30), n34, 5))): n34 = (-n34[0], -n34[1])
A_ = add(add(J34a, n34, 15), u34, 22)       # 22 ft in from the outlot line, 15 ft off the Lot 3/4 line
B_ = add(J34b, n34, 15)
toC = (C[0] - B_[0], C[1] - B_[1]); Lc = math.hypot(*toC); vc = (toC[0] / Lc, toC[1] / Lc)
t_edge = 0.0
align = LineString([add(Wm, e, -1), A_, B_, add(B_, vc, 8)])
lot4_poly = align.buffer(15, cap_style=2, join_style=2).intersection(L4poly).buffer(0)
lot4_poly = max(lot4_poly.geoms, key=lambda g: g.area) if hasattr(lot4_poly, 'geoms') else lot4_poly
lot4_esmt = list(lot4_poly.exterior.coords)[:-1]
print(f'proposed Lot 4 WSSC easement {lot4_poly.area:,.0f} sf along the Lot 3/4 line')
Hm = add(add(Wm, e, 30.23), e, 104.95)                                        # Henrietta Dr R/W
route = [add(Hm, e, 10), add(Wm, e, 30.23), Wm, A_, B_, C] + cl[::-1][1:]
# stop the main 20 ft past the Lot 1 / Lot 6 frontage (no service beyond it)
r_line = LineString(route)
end_s = r_line.project(Point(lot6_tip)) + 20
cut = []
acc = 0
for i, p in enumerate(route):
    if i and acc + math.dist(route[i - 1], p) >= end_s:
        q = route[i - 1]; k = (end_s - acc) / math.dist(q, p)
        cut.append((q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k)); break
    if i: acc += math.dist(route[i - 1], p)
    cut.append(p)
route = cut

# ── Adjoiners from PGAtlas (owner of record) ─────────────────────────────────
tract_b = tract.buffer(6)
adjoiners = []
for f in others + [outlot]:
    a = f['attributes']
    g = Polygon(ring_of(f))
    if not g.intersects(tract_b) or g.intersection(tract_b).area < 20: continue
    desc = (f"OUTLOT A, ESTATES AT INDIAN HEAD" if a['OUT_LOT'] else
            f"LOT {a['LOT']}{', BLOCK ' + a['BLOCK'] if a['BLOCK'] else ''}, {a['SUB_NAME']}" if a['SUB_NAME'] else 'PARCEL (ACREAGE)')
    addr = f"{int(a['HOUSE_NUMBER'])} {a['STREET_NAME']}" if a['HOUSE_NUMBER'] and int(a['HOUSE_NUMBER']) else ''
    adjoiners.append({
        'boundary': 'adjoining', 'label': f"N/F {a['OWNER_NAME'].strip()}",
        'reference': f"{desc}; L.{a['LIBER']} F.{a['FOLIO']}; acct {a['ACCOUNT']}{'; ' + addr if addr else ''}",
        'centroid': [g.centroid.x, g.centroid.y],
    })
print(f'{len(adjoiners)} adjoiners')

SRC = ("Boundary of record: plat 'LOTS 1-6 AND OUTLOT A, ESTATES AT INDIAN HEAD', Plat Book PM 228 "
       "Plat 83. Lot geometry from the county parcel layer (PGAtlas Address/MapServer/15), which "
       "reproduces the plat's bearings to the second and its distances to 0.02 ft (checked against "
       "the 2009 approved sheet, DPW&T permit 9399-2009). Estates Court dedication = the tract less "
       "the lots, closed at the Indian Head Hwy R/W on the plat's N 51-26-53 W 147.04' call. "
       "A Maryland licensed surveyor must confirm before technical plans are sealed.")
common = {
    '_source': SRC, 'basisOfBearings': 'Maryland State Plane Coordinate System (NAD 83), per plat PM 228/83',
    'programme': {'totalFloorAreaSqFt': 2800, 'storeys': 2, 'hasBasement': True,
                  'garage': 'attached_2_car', 'coveredPorch': True},
    'foundation': 'basement', 'frontSetbackFt': 25, 'sideSetbackFt': 8, 'frontsOn': 'ESTATES COURT',
    'utilityMainLabel': 'PROP. 8" WATER & 8" SEWER IN ESTATES COURT',
    'frontDoorAboveStreetFt': 2.0,
}
ADDR = {1: 200, 2: 202, 3: 204, 4: 205, 5: 203, 6: 201}
os_ = __import__('os'); os_.makedirs(out, exist_ok=True)
stem = os_.path.join(out, 'estates-indian-head')
for n, f in sorted(lots.items()):
    a = f['attributes']; r = ring_of(f)
    spec = {**common, 'address': f'{ADDR[n]} ESTATES COURT',
            'reference': {'subdivisionName': 'ESTATES AT INDIAN HEAD', 'liber': 'PM 228', 'folio': '83',
                          'recordedIn': 'Plat Book PM 228 Plat 83', 'lot': str(n),
                          'account': a['ACCOUNT'], 'deed': f"L.{a['LIBER']} F.{a['FOLIO']}"},
            'pointOfBeginning': list(r[0]), 'recordedAreaSqFt': float(a['LAND_AREA_SQFT']),
            'calls': calls_of(r, f'lot {n} line')}
    json.dump(spec, open(f'{stem}-lot{n}.plat.json', 'w'), indent=1)

tr = list(tract.exterior.coords)[:-1]
json.dump({**common, 'address': '200 ESTATES COURT',
           'reference': {'subdivisionName': 'ESTATES AT INDIAN HEAD', 'liber': 'PM 228', 'folio': '83',
                         'recordedIn': 'Plat Book PM 228 Plat 83', 'lot': 'LOTS 1-6 AND ESTATES COURT DEDICATION'},
           'pointOfBeginning': list(tr[0]), 'recordedAreaSqFt': 165019,
           'calls': calls_of(tr, 'tract line')}, open(f'{stem}.plat.json', 'w'), indent=1)

rec = {
    'reference': "LOTS 1-6, ESTATES AT INDIAN HEAD — Plat Book PM 228 Plat 83 — Zone RR — Tax Map 151 Grid F-3 — WSSC 220SE01",
    'citation': 'PLAT BOOK PM 228 PLAT 83 (recorded 2010)',
    'ownerOfRecord': {'ownerName': 'WALDMAN GERALD REVOCABLE TRUST', 'liber': '32062', 'folio': '043',
                      'accounts': [lots[n]['attributes']['ACCOUNT'] for n in sorted(lots)]},
    'notes': [
        'Site: Lots 1-6, Estates at Indian Head, Plat Book PM 228 Plat 83; Tax Map 151 Grid F-3; WSSC 200-ft sheet 220SE01; Election District 5 (Piscataway); Zone RR (Residential, Rural — formerly R-R).',
        'Tract 165,019 sf (3.788 ac) = plat 171,505 sf less Outlot A (6,486 sf), which was conveyed to M. & K. Doyal (L.51565 F.455) and is no longer part of this site.',
        'Estates Court: 60-ft public right-of-way dedicated on the plat (35,173 sf) with a cul-de-sac; to be constructed with this development.',
        'Water and sewer: WSSC. The mains in Estates Court connect to the existing mains in Henrietta Drive through the 30-ft WSSC easement recorded at L.51799 F.399 (Outlot A 906 sf, Lot 20 3,154 sf) and a 30-ft WSSC easement to be granted across Lot 4.',
        'Approvals of record: NRI-015-06, TCP1-018-06, TCP2-016-09 (current); Street Tree and Lighting Plan, DPW&T permit 9399-2009-00 (approved 05/06/2009). This submission follows the 2009 layout and is prepared to the current DPIE Site Development Concept checklist (rev. 08/25/2021).',
    ],
    'adjoiners': adjoiners,
    'dedicationWidthFt': 0,
    'proposedStreets': [{
        'name': 'ESTATES COURT', 'rightOfWayFt': 60, 'pavementFt': PAVE_W,
        'bulbRightOfWayRadiusFt': 60.0, 'bulbPavementRadiusFt': BULB_PAVE_R,
        'entrance': {**ENTRANCE, 'basis': '2009 approved sheet (DPW&T 9399-2009), measured: 50-ft returns tangent to +/-12-ft pavement edges and the MD 210 edge of road'},
        'centreline': [list(p) for p in cl], 'bulbCentre': list(C),
        'rowRings': [[list(p) for p in list(row.exterior.coords)[:-1]]],
        'pavementRings': [[list(p) for p in list(g.exterior.coords)[:-1]] for g in (pavement.geoms if hasattr(pavement, 'geoms') else [pavement])],
        'rowSqFt': round(row.area),
        'basis': "60' R/W per plat PM 228/83; measured on the 2009 approved sheet: 24' pavement centred (EOP +/-12'), shoulder/ditch line +/-20', cul-de-sac EOP R 42', entrance returns R 50' to MD 210 (rural open section, DPW&T Std. 500.10/600.02/600.04)",
        'note': "Section to be confirmed against the current DPW&T/DPIE road standard for a rural residential cul-de-sac at technical review.",
        'utilities': {
            'water': {'sizeIn': 8, 'offsetFt': 6, 'label': 'PROP. 8" W', 'connectsTo': 'EX. WSSC WATER IN HENRIETTA DR'},
            'sewer': {'sizeIn': 8, 'offsetFt': -6, 'label': 'PROP. 8" S', 'connectsTo': 'EX. WSSC SEWER IN HENRIETTA DR'},
            'route': [list(p) for p in route],
            'note': 'Mains enter from Henrietta Drive through the recorded 30-ft WSSC easement (L.51799 F.399), cross Lot 4 in a proposed 30-ft WSSC easement and run west in Estates Court to Lots 1 and 6.',
        },
    }],
    'easementsOfRecord': [
        {'id': 'wssc-outlot-a', 'label': "30' WSSC ESMT (L.51799 F.399) — 906 SF", 'ring': [list(p) for p in outlot_esmt],
         'type': 'WSSC', 'beneficiary': 'Washington Suburban Sanitary Commission', 'recordReference': 'L.51799 F.399, Exhibit A (Outlot A)',
         'status': 'recorded', 'widthFt': 30},
        {'id': 'wssc-lot-20', 'label': "30' WSSC ESMT (L.51799 F.399) — 3,154 SF", 'ring': [list(p) for p in lot20_esmt],
         'type': 'WSSC', 'beneficiary': 'Washington Suburban Sanitary Commission', 'recordReference': 'L.51799 F.399, Schedule A (Lot 20, Treeview Estates)',
         'status': 'recorded', 'widthFt': 30},
        {'id': 'wssc-lot-4', 'label': "PROP. 30' WSSC ESMT (TO BE GRANTED)", 'ring': [list(p) for p in lot4_esmt],
         'type': 'WSSC', 'beneficiary': 'Washington Suburban Sanitary Commission', 'recordReference': 'PROPOSED — deed of easement or plat revision required',
         'status': 'proposed', 'widthFt': 30},
    ],
}
json.dump(rec, open(f'{stem}.plat-record.json', 'w'), indent=1)
json.dump({'row': list(row.exterior.coords), 'tract': tr, 'route': route, 'pavement_area': pavement.area,
           'lot4_esmt_sqft': lot4_poly.area}, open(f'{stem}.geometry.json', 'w'))
print('written', stem)
