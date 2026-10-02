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
import json, math, os, sys
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
# The plat records the curve along Lots 6/5 as a run of equal chords. Offset as
# chords, the centreline kinks where the street curves (owner 2026-10-02: "C/L
# not inline with the curve of the street"). Fit the circle through the chord
# vertices and put the true arc back, so the centreline is concentric with the
# street.
def _true_arc(line, max_chord=40.0, min_run=3, max_resid=0.2):
    q = []
    for p_ in line.coords:
        if not q or math.dist(q[-1], p_) > 0.01: q.append(tuple(p_))
    L = [math.dist(q[i], q[i + 1]) for i in range(len(q) - 1)]
    best, i = None, 0
    while i < len(L):
        j = i
        while j < len(L) and L[j] < max_chord: j += 1
        if j - i >= min_run and (best is None or j - i > best[1] - best[0]): best = (i, j)
        i = j + 1
    if best is None: return line
    i, j = best                      # chords i .. j-1, vertices i .. j
    pts = q[i:j + 1]
    import numpy as _np
    A_ = _np.array([[2 * x, 2 * y, 1.0] for x, y in pts]); b_ = _np.array([x * x + y * y for x, y in pts])
    cx, cy, c0 = _np.linalg.lstsq(A_, b_, rcond=None)[0]
    R = math.sqrt(c0 + cx * cx + cy * cy)
    resid = max(abs(math.dist(p_, (cx, cy)) - R) for p_ in pts)
    if resid > max_resid:
        print(f'Estates Court south R/W: chord run does not fit one circle (resid {resid:.2f} ft); chords kept')
        return LineString(q)
    a0 = math.atan2(pts[0][1] - cy, pts[0][0] - cx); a1 = math.atan2(pts[-1][1] - cy, pts[-1][0] - cx)
    da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
    n = max(8, int(abs(da) * R / 2.0))
    arc = [(cx + R * math.cos(a0 + da * k / n), cy + R * math.sin(a0 + da * k / n)) for k in range(n + 1)]
    print(f'Estates Court south R/W: {j - i} chords -> arc R = {R:.2f} ft, delta {math.degrees(abs(da)):.2f} deg, max resid {resid:.3f} ft')
    return LineString(q[:i] + arc + q[j + 1:])
south = _true_arc(south)
off = south.offset_curve(30.0)
if not row.buffer(-5).intersects(off.interpolate(0.5, normalized=True)):
    off = south.offset_curve(-30.0)
oc = list(off.coords)
if math.dist(oc[0], C) < math.dist(oc[-1], C): oc = oc[::-1]
oc = [q for q in oc if math.hypot(q[0] - C[0], q[1] - C[1]) > 20]
cl = [tuple(q) for q in LineString(oc + [C]).simplify(0.05).coords]
# Round any remaining angle point (where the arc meets the run into the bulb)
# with a tangent curve, so the centreline has no kinks.
def _fillet(pts, R=150.0, min_deg=2.0):
    out = [pts[0]]
    for k in range(1, len(pts) - 1):
        a, b, c = out[-1], pts[k], pts[k + 1]
        u1 = ((b[0] - a[0]) / math.dist(a, b), (b[1] - a[1]) / math.dist(a, b))
        u2 = ((c[0] - b[0]) / math.dist(b, c), (c[1] - b[1]) / math.dist(b, c))
        th = math.acos(max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1])))
        if math.degrees(th) < min_deg:
            out.append(b); continue
        r = min(R, 0.45 * min(math.dist(a, b), math.dist(b, c)) / math.tan(th / 2))
        t = r * math.tan(th / 2)
        p1 = (b[0] - u1[0] * t, b[1] - u1[1] * t); p2 = (b[0] + u2[0] * t, b[1] + u2[1] * t)
        cross = u1[0] * u2[1] - u1[1] * u2[0]
        nrm = (-u1[1], u1[0]) if cross > 0 else (u1[1], -u1[0])
        cc = (p1[0] + nrm[0] * r, p1[1] + nrm[1] * r)
        a1 = math.atan2(p1[1] - cc[1], p1[0] - cc[0]); a2 = math.atan2(p2[1] - cc[1], p2[0] - cc[0])
        da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
        n = max(4, int(abs(da) * r / 2.0))
        out += [(cc[0] + r * math.cos(a1 + da * i / n), cc[1] + r * math.sin(a1 + da * i / n)) for i in range(n + 1)]
    return out + [pts[-1]]
def _blend(pts, t=45.0, min_deg=4.0):
    # angle points between a run and a long straight: replace +-t ft either side
    # of the joint with a cubic matching both directions (no corner)
    line = LineString(pts)
    for k in range(1, len(pts) - 1):
        a, b, c = pts[k - 1], pts[k], pts[k + 1]
        if math.dist(b, c) < 2 * t: continue                      # only where a long straight starts
        t1 = math.atan2(b[1] - a[1], b[0] - a[0]); t2 = math.atan2(c[1] - b[1], c[0] - b[0])
        if abs(math.degrees((t2 - t1 + math.pi) % (2 * math.pi) - math.pi)) < min_deg: continue
        sb = line.project(Point(b))
        s0, s1 = max(0.0, sb - t), min(line.length, sb + t)
        p0 = line.interpolate(s0); p1 = line.interpolate(s1)
        q0 = line.interpolate(max(0.0, s0 - 1)); q1 = line.interpolate(min(line.length, s1 + 1))
        d0 = ((p0.x - q0.x), (p0.y - q0.y)); d1 = ((q1.x - p1.x), (q1.y - p1.y))
        n0 = math.hypot(*d0) or 1; n1 = math.hypot(*d1) or 1
        m = math.dist((p0.x, p0.y), (p1.x, p1.y))
        T0 = (d0[0] / n0 * m, d0[1] / n0 * m); T1 = (d1[0] / n1 * m, d1[1] / n1 * m)
        curve = []
        for i in range(31):
            u = i / 30
            h00, h10, h01, h11 = 2*u**3 - 3*u**2 + 1, u**3 - 2*u**2 + u, -2*u**3 + 3*u**2, u**3 - u**2
            curve.append((h00 * p0.x + h10 * T0[0] + h01 * p1.x + h11 * T1[0], h00 * p0.y + h10 * T0[1] + h01 * p1.y + h11 * T1[1]))
        before = [q for q in pts if line.project(Point(q)) < s0 - 0.01]
        after = [q for q in pts if line.project(Point(q)) > s1 + 0.01]
        return before + curve + after
    return pts
cl = _blend(cl)
# Start the centreline at the recorded mouth on Jennifer Drive. Jennifer is
# the frontage road between this subdivision and MD 210.
mouth = LineString([lot1_nw, P])
cl_line = LineString(cl)
# MEASURED OFF THE 2009 APPROVED SHEET (source/stl-2009-georef.json):
#   24 ft pavement centred in the 60 ft R/W (edge-of-pavement lines at +/-12 ft),
#   shoulder/ditch line at +/-20 ft, cul-de-sac edge of pavement R = 42 ft
#   (R/W R = 60.5 ft as scaled, 60 ft of record), entrance returns R = 50 ft
#   (fitted 48.9 / 52.2 ft; both centres 62.4 / 62.9 ft off the centreline =
#   12 + 50, i.e. tangent to the pavement edges), meeting Jennifer Drive's
#   near edge of pavement on a line S 38-29 W.
PAVE_W, BULB_PAVE_R, RETURN_R = 24.0, 42.0, 50.0
EOR_A, EOR_B = (1310943.8, 367545.4), (1310865.8, 367447.3)     # Jennifer Drive near edge of pavement
pavement = unary_union([cl_line.buffer(PAVE_W / 2, cap_style=2), Point(C).buffer(BULB_PAVE_R, 64)]).intersection(row.buffer(-1))
# The cul-de-sac end is the approved layout's, not a circle (user, 2026-10-01:
# "use the 2009 plan exactly except the utility layout"). Its edge of pavement
# was traced off the approved sheet (source/estates-court-eop-trace.json): an
# offset bulb, the south edge running straight into it and the north edge
# sweeping in on a reverse curve. West of the trace's cut line the generated
# 24-ft section already matches the approved edges to within 0.3 ft.
_eop_file = os.path.join(out, 'source', 'estates-court-eop-trace.json')
if os.path.exists(_eop_file):
    _eop = json.load(open(_eop_file))
    _bulb_end = Polygon(_eop['ring']).buffer(0)
    _g = json.load(open(os.path.join(out, 'source', 'stl-2009-georef.json')))
    def _W(u, v):
        _c, _s = math.cos(_g['th']), math.sin(_g['th'])
        return (_g['X0'] + (_c * (u - _g['tx']) + _s * (_g['ty'] - v)) / _g['s'],
                _g['Y0'] + (-_s * (u - _g['tx']) + _c * (_g['ty'] - v)) / _g['s'])
    _cu = _eop['cutU']
    _west = Polygon([_W(_cu, 0), _W(0, 0), _W(0, 6000), _W(_cu, 6000)])        # sheet west of the cut
    pavement = unary_union([pavement.intersection(_west), _bulb_end]).buffer(0.01).buffer(-0.01).intersection(row.buffer(-1))
    pavement = max(pavement.geoms, key=lambda g: g.area) if hasattr(pavement, 'geoms') else pavement
    print(f'cul-de-sac end from the traced approved layout: {_bulb_end.area:,.0f} sf')
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
# Stop the mains 15 ft past the Lot 1 east property line (user, 2026-10-01:
# "do not extend water and sewer too far past the Lot 1 east property line").
# Lots 1 and 6 take their services from the end of the main.
r_line = LineString(route)
L2r = ring_of(lots[2])
l12 = [q for q in L1 if min(math.dist(q, w) for w in L2r) < 0.5]          # the Lot 1 / Lot 2 line
l12_front = min(l12, key=lambda q: r_line.distance(Point(q)))               # its street end
# Lot 6 cannot reach a main that stops short of its frontage without running
# under its own driveway or across Lot 5, so the mains run on only as far as
# Lot 6's first clear tap: 15 ft past the Lot 5 / Lot 6 front corner.
L5r = ring_of(lots[5])
l56 = [q for q in L6 if min(math.dist(q, w) for w in L5r) < 0.5]
l56_front = min(l56, key=lambda q: r_line.distance(Point(q)))
end_s = max(r_line.project(Point(l12_front)), r_line.project(Point(l56_front))) + 15
print(f'mains end {end_s - r_line.project(Point(l12_front)):.0f} ft past the Lot 1 east line, {end_s:.0f} ft from Henrietta Dr')
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
       "reproduces the plat's bearings to the second and its distances to 0.02 ft. Estates Court dedication = the tract less "
       "the lots, closed at Jennifer Drive on the plat's N 51-26-53 W 147.04' call. Jennifer Drive lies between the tract and MD 210.")
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
        'New submittal. Prior approvals NRI-015-06, TCP1-018-06 and TCP2-016-09 are base work only and do not carry this submittal; an updated NRI, a TCP2 revision or new TCP as M-NCPPC determines, and review of street trees and lighting to current DPW&T/DPIE standards are required. Prepared to the current DPIE Site Development Concept checklist (rev. 08/25/2021).',
    ],
    'adjoiners': adjoiners,
    'dedicationWidthFt': 0,
    'proposedStreets': [{
        'name': 'ESTATES COURT', 'rightOfWayFt': 60, 'pavementFt': PAVE_W,
        'bulbRightOfWayRadiusFt': 60.0, 'bulbPavementRadiusFt': BULB_PAVE_R,
        'entrance': {**ENTRANCE, 'basis': '2009 approved sheet (DPW&T 9399-2009), measured: 50-ft returns tangent to +/-12-ft pavement edges and the Jennifer Drive edge of road'},
        'centreline': [list(p) for p in cl], 'bulbCentre': list(C),
        'rowRings': [[list(p) for p in list(row.exterior.coords)[:-1]]],
        'pavementRings': [[list(p) for p in list(g.exterior.coords)[:-1]] for g in (pavement.geoms if hasattr(pavement, 'geoms') else [pavement])],
        'rowSqFt': round(row.area),
        'basis': "60' R/W per plat PM 228/83; measured on the 2009 approved sheet: 24' pavement centred (EOP +/-12'), shoulder/ditch line +/-20', cul-de-sac EOP R 42', entrance returns R 50' to Jennifer Drive (rural open section, DPW&T Std. 500.10/600.02/600.04)",
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
