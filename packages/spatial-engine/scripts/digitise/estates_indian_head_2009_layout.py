"""
The 2009 approved house layout (DPW&T 9399-2009, sheet 1) -> fixed footprints
and side-load paving for the six lot plats.

    python3 estates_indian_head_2009_layout.py <project_dir>

Footprints were transcribed by hand off the 200-dpi scan (heavy outline, garage
included) in sheet pixels and are carried to State Plane through
source/stl-2009-georef.json (median residual 0.44 ft against the plat). The
garage door is the garage face OPPOSITE its dashed interior wall — every 2009
garage is side-loaded.

Paving is generated to the 2009 pattern, not traced (the scan's paving lines
are thin and overlap the grading):
  * a turning court in front of the garage door, door width + 2 ft, 24 ft deep;
  * a 12-ft drive from the court to the edge of pavement;
  * inside the R/W, an apron to DPW&T's rural (open-section) residential
    driveway: 12 ft at the R/W line flaring 5 ft each side at the pavement edge,
    crossing the roadside swale (culvert or swale driveway per DPW&T 600.02);
  * a 4-ft lead walk from the 2009 stoop to the drive, and the stoop itself.
"""
import json, math, os, sys
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union, nearest_points
from shapely.affinity import translate, rotate

proj = sys.argv[1]
J = lambda p: json.load(open(os.path.join(proj, p)))
g = J('source/stl-2009-georef.json')
rec = J('estates-indian-head.plat-record.json')
S, th = g['s'], g['th']; c, s_ = math.cos(th), math.sin(th)

def W(u, v):
    X = (c * (u - g['tx']) + s_ * (g['ty'] - v)) / S
    Y = (-s_ * (u - g['tx']) + c * (g['ty'] - v)) / S
    return (g['X0'] + X, g['Y0'] + Y)

# Sheet pixels at 200 dpi. house: outline incl. garage; garage: quad;
# door: index of the garage edge that is the door (edge k = garage[k] -> garage[k+1]);
# stoop: centre of the 2009 stoop.
L2009 = {
    1: dict(house=[(2480, 1110), (2550, 1152), (2640, 1013), (2670, 1008), (2850, 1130), (2798, 1215), (2850, 1248), (2723, 1435), (2512, 1307), (2400, 1237)],
            garage=[(2480, 1110), (2592, 1187), (2512, 1307), (2400, 1237)], door=3, stoop=(2617, 1372), ff=208.67),
    2: dict(house=[(3390, 1252), (3575, 1155), (3610, 1163), (3680, 1310), (3758, 1275), (3822, 1410), (3700, 1467), (3480, 1570), (3375, 1370), (3430, 1340)],
            garage=[(3640, 1335), (3758, 1275), (3822, 1410), (3700, 1467)], door=1, stoop=(3593, 1520), ff=212.67),
    3: dict(house=[(4558, 1370), (4682, 1295), (4730, 1365), (4872, 1278), (4902, 1283), (5012, 1465), (4928, 1514), (4962, 1570), (4768, 1690), (4633, 1487)],
            garage=[(4558, 1370), (4682, 1295), (4752, 1410), (4633, 1487)], door=0, stoop=(4697, 1592), ff=212.67,
            driveRoute='direct'),   # user: Lot 3 drive must connect to the house
    4: dict(house=[(4622, 2288), (4793, 1945), (4997, 2040), (4975, 2100), (5058, 2140), (4943, 2345), (4790, 2275), (4758, 2352)],
            garage=[(4678, 2162), (4812, 2230), (4758, 2352), (4622, 2288)], door=3, stoop=(4736, 2054), ff=212.67,
            frontLoad=True, scale=0.9),   # user 2026-09-30: Lot 4 front-load
    5: dict(house=[(3208, 2365), (3608, 2388), (3597, 2540), (3515, 2532), (3500, 2702), (3472, 2717), (3263, 2698), (3260, 2598), (3207, 2593)],
            garage=[(3472, 2375), (3608, 2388), (3597, 2540), (3463, 2525)], door=1, stoop=(3351, 2368), ff=212.17),
    6: dict(house=[(2410, 2320), (2452, 2172), (2808, 2300), (2747, 2518), (2683, 2505), (2655, 2595), (2438, 2530), (2485, 2340)],
            garage=[(2452, 2172), (2578, 2205), (2540, 2355), (2410, 2320)], door=3, stoop=(2695, 2257), ff=209.42,
            alignToStreet=True),   # owner 2026-10-02: square Lot 6's house to the street; narrow it if needed
}

st = rec['proposedStreets'][0]
row = Polygon(st['rowRings'][0])
pave = unary_union([Polygon(r) for r in st['pavementRings']])
DRIVE_W, COURT_D, FLARE = 12.0, 26.0, 5.0
# Owner 2026-10-02: driveways "like the 2009 plan with proper turn around space".
# The 2009 side-load courts run past both ends of the garage door face; a car
# backing out of either bay needs the full court depth and room beside the door
# to swing. Court = door face + COURT_EXT each side, COURT_D deep from the door.
COURT_EXT = 6.0
TURN_PAD = (10.0, 20.0)   # front-load turnaround pad beside the drive: width x length, ft
FRONT_DOOR_FACES = (2, 3)   # exterior faces of the 2009 Lot 4 garage (0 is the house wall)
LOT_TOWARD = {}          # lot -> neighbouring lot polygon to move toward (filled below)
EASEMENT_CLEAR = 5.0   # ft, dwelling to WSSC easement line (confirm with WSSC)

def unit(a, b):
    L = math.dist(a, b) or 1
    return ((b[0] - a[0]) / L, (b[1] - a[1]) / L)

def strip(a, b, w):
    u = unit(a, b); n = (-u[1] * w / 2, u[0] * w / 2)
    return Polygon([(a[0] + n[0], a[1] + n[1]), (b[0] + n[0], b[1] + n[1]), (b[0] - n[0], b[1] - n[1]), (a[0] - n[0], a[1] - n[1])])

COURT_EDGE_FT = 5.0   # a side-load court stays this far off every lot line


def court_of(gq, door_idx):
    A_, B_ = gq[door_idx], gq[(door_idx + 1) % 4]
    gc_ = Polygon(gq).centroid
    ue_ = unit(A_, B_); nm = (-ue_[1], ue_[0])
    mid_ = ((A_[0] + B_[0]) / 2, (A_[1] + B_[1]) / 2)
    if nm[0] * (mid_[0] - gc_.x) + nm[1] * (mid_[1] - gc_.y) < 0: nm = (-nm[0], -nm[1])
    A2_ = (A_[0] - ue_[0] * COURT_EXT, A_[1] - ue_[1] * COURT_EXT); B2_ = (B_[0] + ue_[0] * COURT_EXT, B_[1] + ue_[1] * COURT_EXT)
    return Polygon([A2_, B2_, (B2_[0] + nm[0] * COURT_D, B2_[1] + nm[1] * COURT_D), (A2_[0] + nm[0] * COURT_D, A2_[1] + nm[1] * COURT_D)])


report = {}
_pp = {f['attributes']['LOT']: f for f in J('source/pgatlas-parcels.json')['features']
       if f['attributes']['SUB_NAME'] == 'ESTATES AT INDIAN HEAD' and f['attributes']['LOT']}
LOT_TOWARD[4] = Polygon(_pp['5']['geometry']['rings'][0])   # user: Lot 4 house toward the Lot 5 line
# user: Lot 6 house closer to the WEST property line (N 14-55-29 W 200.72', against 15608 Indian Head Hwy)
_r6 = _pp['6']['geometry']['rings'][0]
LOT_TOWARD[6] = max((LineString([_r6[i], _r6[i + 1]]) for i in range(len(_r6) - 1)
                     if abs(math.degrees(math.atan2(_r6[i + 1][0] - _r6[i][0], _r6[i + 1][1] - _r6[i][1])) % 180 - 165.07) < 1.0),
                    key=lambda l: l.length)
for n, d in L2009.items():
    lotp = os.path.join(proj, f'estates-indian-head-lot{n}.plat.json')
    spec = json.load(open(lotp))
    # lot ring from the calls
    pts = [spec['pointOfBeginning']]
    for cl in spec['calls']:
        ns, dms, ew = cl['bearing'].split(); D, M, Sx = map(int, dms.split('-'))
        a = math.radians(D + M / 60 + Sx / 3600)
        pts.append([pts[-1][0] + (1 if ew == 'E' else -1) * math.sin(a) * cl['distanceFt'],
                    pts[-1][1] + (1 if ns == 'N' else -1) * math.cos(a) * cl['distanceFt']])
    lot = Polygon(pts)
    house = Polygon([W(*p) for p in d['house']]).buffer(0)
    gar = [W(*p) for p in d['garage']]
    if d.get('scale', 1.0) != 1.0:
        # a smaller model of the same plan, scaled about the GARAGE so the garage stays 2-car
        from shapely.affinity import scale as _scale
        gcen = Polygon(gar).centroid
        house = _scale(house, d['scale'], d['scale'], origin=gcen).union(Polygon(gar)).buffer(0)
    # Keep every dwelling EASEMENT_CLEAR ft off any WSSC easement, moving it the
    # least distance that does it while holding the RR setbacks (8 ft side,
    # 25 ft front from the R/W, 20 ft rear -> 8 ft from every other lot line is
    # checked; front from the R/W separately).
    esm = unary_union([Polygon(e['ring']) for e in rec.get('easementsOfRecord', [])])
    shift = (0.0, 0.0)
    if house.intersects(esm.buffer(EASEMENT_CLEAR)) or n in LOT_TOWARD:
        best = None
        # rear line = the lot edge farthest from the street; side toward = LOT_TOWARD[n]
        # rear = the subdivision's recorded S 68-24-27 W line (the tract's south line)
        def brg(a, b): return math.degrees(math.atan2(b[0] - a[0], b[1] - a[1])) % 180
        rear = unary_union([LineString([pts[i], pts[i + 1]]) for i in range(len(pts) - 1)
                            if math.dist(pts[i], pts[i + 1]) > 1 and abs(brg(pts[i], pts[i + 1]) - 68.41) < 1.0])
        allowed = lot.buffer(-8).difference(row.buffer(25)).difference(rear.buffer(20))
        toward = LOT_TOWARD.get(n)
        tline = (toward if isinstance(toward, LineString) else lot.boundary.intersection(toward.buffer(0.5))) if toward is not None else None
        keep = esm.buffer(EASEMENT_CLEAR)
        hc = house.centroid
        angles = list(range(0, 360, 5)) if d.get('frontLoad') else [0] + [a for k in range(5, 95, 5) for a in (k, -k)]
        if d.get('alignToStreet'):
            # Rotate so the FRONT WALL (the wall the door is in) is parallel to
            # the lot's frontage on the R/W where it faces the house; if that
            # will not fit the setbacks, narrow the footprint along the front
            # (about the garage, which keeps its 2-car size) in 5 % steps.
            from shapely.affinity import scale as _scale
            sp0 = W(*d['stoop'])
            hr0 = list(house.exterior.coords)
            fw = min(((hr0[i], hr0[i + 1]) for i in range(len(hr0) - 1) if math.dist(hr0[i], hr0[i + 1]) > 3),
                     key=lambda e: LineString(e).distance(Point(sp0)))
            front = lot.boundary.intersection(row.buffer(0.5))
            fsegs = [LineString([q0, q1]) for g_ in getattr(front, 'geoms', [front]) if g_.geom_type == 'LineString'
                     for q0, q1 in zip(list(g_.coords)[:-1], list(g_.coords)[1:]) if math.dist(q0, q1) > 2]
            near = min(fsegs, key=lambda l: l.distance(house))
            q0, q1 = near.coords[0], near.coords[-1]
            a_wall = math.degrees(math.atan2(fw[1][1] - fw[0][1], fw[1][0] - fw[0][0]))
            a_front = math.degrees(math.atan2(q1[1] - q0[1], q1[0] - q0[0]))
            ang_t = (a_front - a_wall + 90) % 180 - 90
            gcen = Polygon(gar).centroid
            def narrowed(fsc):
                if fsc == 1.0: return house
                hz = rotate(house, -a_wall, origin=gcen)
                hz = _scale(hz, fsc, 1.0, origin=gcen)
                return rotate(hz, a_wall, origin=gcen).union(Polygon(gar)).buffer(0)
            for fsc in (1.0, 0.95, 0.9, 0.85, 0.8, 0.75):
                hs = narrowed(fsc)
                hcs = hs.centroid
                hr_ = rotate(hs, ang_t, origin=hcs)
                gr_ = [rotate(Point(q), ang_t, origin=hcs) for q in gar]
                inner = lot.buffer(-COURT_EDGE_FT)
                def _fits(dx_, dy_):
                    h_ = translate(hr_, dx_, dy_)
                    if not allowed.contains(h_) or h_.intersects(keep): return False
                    gq_ = [(q.x + dx_, q.y + dy_) for q in gr_]
                    return inner.contains(court_of(gq_, d['door']))
                if any(_fits(dx_, dy_) for dx_ in range(-120, 121, 3) for dy_ in range(-120, 121, 3)):
                    house, hc = hs, hcs
                    break
            report[n] = {**report.get(n, {}), 'alignedToStreetDeg': round(ang_t, 1), 'widthFactor': fsc}
            if os.environ.get('LAYOUT_DEBUG'):
                print(f'lot {n}: wall {a_wall:.1f} front {a_front:.1f} -> rotate {ang_t:.1f}, width x{fsc}', file=sys.stderr)
            angles = [ang_t]
        for ang in angles:
            hr = rotate(house, ang, origin=hc)
            for dx in range(-120, 121, 3):
                for dy in range(-120, 121, 3):
                    h2 = translate(hr, dx, dy)
                    if not allowed.contains(h2) or h2.intersects(keep):
                        continue
                    cost = (h2.distance(tline) * 10 if tline is not None and not tline.is_empty else 0) + math.hypot(dx, dy) + min(abs(ang), 360 - abs(ang)) * 0.5
                    if d.get('frontLoad'):
                        # front-load: the drive leaves an EXTERIOR garage face straight to the street
                        # and must not cross the house
                        gq = [(lambda r: (r.x + dx, r.y + dy))(rotate(Point(q), ang, origin=hc)) for q in gar]
                        ok = None
                        for ei in FRONT_DOOR_FACES:
                            a_, b_ = gq[ei], gq[(ei + 1) % 4]
                            dm = ((a_[0] + b_[0]) / 2, (a_[1] + b_[1]) / 2)
                            _, pq = nearest_points(Point(dm), pave)
                            dr = strip(dm, (pq.x, pq.y), min(math.dist(a_, b_), 20.0))
                            if not dr.intersects(h2.buffer(-1.0)) and dr.length < 400:
                                ok = (dr.area, ei); break
                        if ok is None: continue
                        cost += ok[0] / 200
                    if not d.get('frontLoad'):
                        # the side-load COURT must fit too, COURT_EDGE_FT inside the lot
                        gq = [(lambda r: (r.x + dx, r.y + dy))(rotate(Point(q), ang, origin=hc)) for q in gar]
                        if not lot.buffer(-COURT_EDGE_FT).contains(court_of(gq, d['door'])):
                            if os.environ.get('LAYOUT_DEBUG'): _dbg_court = True
                            continue
                    if best is None or cost < best[0]: best = (cost, dx, dy, ang)
            if best and ang == 0: break
        if best:
            _, dx, dy, ang = best
            shift = (dx, dy)
            tf = lambda q: (lambda r: (r.x + dx, r.y + dy))(rotate(Point(q), ang, origin=hc))
            house = translate(rotate(house, ang, origin=hc), dx, dy)
            gar = [tf(q) for q in gar]
            d = {**d, 'stoop_world': tf(W(*d['stoop'])), 'rotationDeg': ang}
        else:
            report[n] = {'warning': f'no position clears the easement by {EASEMENT_CLEAR} ft'}
    if d.get('frontLoad'):
        k = min(FRONT_DOOR_FACES, key=lambda i: Point(((gar[i][0] + gar[(i + 1) % 4][0]) / 2, (gar[i][1] + gar[(i + 1) % 4][1]) / 2)).distance(pave))
    else:
        k = d['door']
    A, B = gar[k], gar[(k + 1) % 4]
    gc = Polygon(gar).centroid
    mid = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    out = unit((gc.x, gc.y), mid)
    # outward normal of the door edge
    ue = unit(A, B); nrm = (-ue[1], ue[0])
    if nrm[0] * out[0] + nrm[1] * out[1] < 0: nrm = (-nrm[0], -nrm[1])
    ext = COURT_EXT
    A2 = (A[0] - ue[0] * ext, A[1] - ue[1] * ext); B2 = (B[0] + ue[0] * ext, B[1] + ue[1] * ext)
    court = Polygon([A2, B2, (B2[0] + nrm[0] * COURT_D, B2[1] + nrm[1] * COURT_D), (A2[0] + nrm[0] * COURT_D, A2[1] + nrm[1] * COURT_D)])
    # drive: from the court edge nearest the street to the nearest point of the pavement,
    # started back inside the court so the two overlap
    # The drive leaves the court PARALLEL TO THE DOOR FACE — along the side of
    # the house, the way a side-load drive is built — until it reaches the R/W,
    # then crosses the R/W square to the pavement.
    cc = court.centroid
    _, pp0 = nearest_points(cc, pave)
    sgn = 1 if (ue[0] * (pp0.x - cc.x) + ue[1] * (pp0.y - cc.y)) > 0 else -1
    ud = (ue[0] * sgn, ue[1] * sgn)
    # court centreline offset so the drive rides the court's street-side half, clear of the garage
    base_pt = (cc.x + nrm[0] * (COURT_D / 2 - DRIVE_W / 2 - 2) * 0, cc.y)
    base_pt = (cc.x, cc.y)
    ray = LineString([base_pt, (base_pt[0] + ud[0] * 400, base_pt[1] + ud[1] * 400)])
    hit = ray.intersection(row.exterior)
    if hit.is_empty:
        _, pp = nearest_points(court, pave); end_row = (pp.x, pp.y)
    else:
        hp = min((hit.geoms if hasattr(hit, 'geoms') else [hit]), key=lambda q: Point(base_pt).distance(q))
        end_row = (hp.x, hp.y)
    _, pp = nearest_points(Point(end_row), pave)
    u2 = unit(end_row, (pp.x, pp.y))
    drive = unary_union([strip(base_pt, (end_row[0] + ud[0] * 1, end_row[1] + ud[1] * 1), DRIVE_W),
                         strip(end_row, (pp.x + u2[0], pp.y + u2[1]), DRIVE_W)]).buffer(0)
    if d.get('driveRoute') == 'direct':
        # straight from the court's street-side edge to the nearest pavement
        cp_, pp_ = nearest_points(court, pave)
        ud_ = unit((cp_.x, cp_.y), (pp_.x, pp_.y))
        st_ = (cp_.x - ud_[0] * (DRIVE_W / 2 + 1), cp_.y - ud_[1] * (DRIVE_W / 2 + 1))
        drive = strip(st_, (pp_.x + ud_[0], pp_.y + ud_[1]), DRIVE_W)
        pp = pp_
        # A drive that clips the dwelling is slid sideways (still inside the
        # court's width) by the least amount that clears the house by 1 ft.
        if drive.intersects(house.buffer(1.0)):
            nd_ = (-ud_[1], ud_[0])
            for off in sorted([k * 0.5 for k in range(-16, 17)], key=abs):
                dv = translate(drive, nd_[0] * off, nd_[1] * off)
                if not dv.intersects(house.buffer(1.0)) and dv.intersects(court):
                    drive, pp = dv, Point(pp_.x + nd_[0] * off, pp_.y + nd_[1] * off)
                    break
    if d.get('frontLoad'):
        # straight out of the door to the pavement, the door's width
        dm = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
        _, ppf = nearest_points(Point(dm[0] + nrm[0] * 5, dm[1] + nrm[1] * 5), pave)
        uf = unit(dm, (ppf.x, ppf.y))
        court = Polygon()
        drive = strip((dm[0] + uf[0] * 0.2, dm[1] + uf[1] * 0.2), (ppf.x + uf[0], ppf.y + uf[1]), min(math.dist(A, B), 20.0))
        pp = ppf
        # Turnaround pad beside the drive at the garage, on the side away from the
        # house, so a car backs into it and leaves forward (no backing onto the court).
        _w2 = min(math.dist(A, B), 20.0) / 2
        _ns = (-uf[1], uf[0])
        _hc2 = house.centroid
        if _ns[0] * (_hc2.x - dm[0]) + _ns[1] * (_hc2.y - dm[1]) > 0: _ns = (-_ns[0], -_ns[1])
        _pw, _pl = TURN_PAD
        _P = lambda t, o: (dm[0] + uf[0] * t + _ns[0] * o, dm[1] + uf[1] * t + _ns[1] * o)
        _pad = Polygon([_P(2, _w2 - 0.5), _P(2 + _pl, _w2 - 0.5), _P(2 + _pl, _w2 + _pw), _P(2, _w2 + _pw)])
        drive = unary_union([drive, _pad]).buffer(0)
    if drive.intersects(house.buffer(-0.5)):
        report[n] = {'warning': 'drive crosses the dwelling'}
    # paving stops at the wall: nothing drawn inside the footprint
    on_lot = unary_union([court, drive]).intersection(lot).difference(house).buffer(0)
    # apron: R/W line to pavement edge, 12 ft flaring to 22 ft
    rline = row.exterior
    q_row = drive.intersection(rline).centroid
    q_pav = Point(pp.x, pp.y)
    ua = unit((q_row.x, q_row.y), (q_pav.x, q_pav.y)); na = (-ua[1], ua[0])
    dw = min(math.dist(A, B), 20.0) if d.get('frontLoad') else DRIVE_W
    # The apron MEETS THE PAVEMENT EDGE IT ACTUALLY RUNS TO. A trapezoid with
    # its flare corners on the tangent at q_pav leaves open wedges against the
    # cul-de-sac's 42-ft arc. Instead: a throat the drive's width from the R/W
    # line into the pavement, CLOSED against the pavement with FLARE-radius
    # returns (morphological closing), then cut back to the pavement edge, so
    # the radius returns and the arc are the same line on a bend or a bulb.
    throat = strip((q_row.x - ua[0] * 1, q_row.y - ua[1] * 1), (q_pav.x + ua[0] * 8, q_pav.y + ua[1] * 8), dw)
    closed = unary_union([throat, pave]).buffer(FLARE, join_style=1).buffer(-FLARE, join_style=1)
    apron = closed.intersection(throat.buffer(FLARE + 1.0, cap_style=2)).difference(pave).intersection(row).buffer(0)
    # stoop and walk
    # Owner 2026-10-02: walks "all out of line". Everything is squared to the
    # FRONT WALL the door is in, not to the garage door or the house centroid:
    #   stoop  8 ft along the wall x 5 ft deep, against the wall at the door;
    #   walk   4 ft wide, PARALLEL to the front wall 5-9 ft out from it, from the
    #          stoop to the drive/court and 1 ft into it;
    #   else   (no parallel run reaches the drive) straight out from the stoop,
    #          square to the wall, then square across to the drive.
    sp = d.get('stoop_world') or W(*d['stoop'])
    _ring = list(house.exterior.coords)
    _edges = [(_ring[i], _ring[i + 1]) for i in range(len(_ring) - 1) if math.dist(_ring[i], _ring[i + 1]) > 3]
    wa, wb = min(_edges, key=lambda e: LineString(e).distance(Point(sp)))
    uf = unit(wa, wb)
    nf = (-uf[1], uf[0])
    _hc = house.centroid
    _fp = LineString((wa, wb)).interpolate(LineString((wa, wb)).project(Point(sp)))
    if (nf[0] * (_fp.x - _hc.x) + nf[1] * (_fp.y - _hc.y)) < 0: nf = (-nf[0], -nf[1])
    f0 = (_fp.x, _fp.y)
    at = lambda a_, o_: (f0[0] + uf[0] * a_ + nf[0] * o_, f0[1] + uf[1] * a_ + nf[1] * o_)
    stoop = Polygon([at(-4, 0), at(4, 0), at(4, 5), at(-4, 5)])
    walk = None
    best_w = None
    for sgn in (1, -1):
        ray = LineString([at(-4 * sgn, 7), at(150 * sgn, 7)])
        hit = ray.intersection(on_lot)
        if hit.is_empty: continue
        hp = min((hit.geoms if hasattr(hit, 'geoms') else [hit]), key=lambda g: Point(at(0, 7)).distance(g))
        q, _ = nearest_points(hp, Point(at(0, 7)))
        run = abs((q.x - f0[0]) * uf[0] + (q.y - f0[1]) * uf[1])
        w = strip(at(-4 * sgn, 7), at((run + 1.0) * sgn, 7), 4.0)
        if w.intersects(house.buffer(-0.5)): continue
        if best_w is None or run < best_w[0]: best_w = (run, w)
    if best_w:
        walk = unary_union([best_w[1], stoop.buffer(0.01)]).difference(stoop).difference(house).buffer(0)
    else:
        # straight out, square to the wall, to the line of the drive, then across
        _, dq = nearest_points(Point(at(0, 5)), on_lot)
        depth = max(7.0, (dq.x - f0[0]) * nf[0] + (dq.y - f0[1]) * nf[1])
        side = (dq.x - f0[0]) * uf[0] + (dq.y - f0[1]) * uf[1]
        walk = unary_union([strip(at(0, 5), at(0, depth + 2.0), 4.0),
                            strip(at(0, depth), at(side + (1.0 if side > 0 else -1.0), depth), 4.0)]).difference(house).buffer(0)
    geomlist = lambda gg: [list(p) for p in list((max(gg.geoms, key=lambda x: x.area) if hasattr(gg, 'geoms') else gg).exterior.coords)[:-1]]
    spec['fixedFootprint'] = [list(p) for p in list(house.exterior.coords)[:-1]]
    spec['fixedPaving'] = [
        {'kind': 'Driveway', 'label': "PROP. DRIVEWAY — FRONT-LOAD GARAGE" if d.get('frontLoad') else "PROP. DRIVEWAY & SIDE-LOAD COURT", 'ring': geomlist(on_lot),
         'note': ('Front-load garage; drive the width of the door straight to the street.' if d.get('frontLoad') else f'Side-load garage; {COURT_D:.0f}-ft turning court at the door, {DRIVE_W:.0f}-ft drive. Layout per DPW&T 9399-2009.')},
        {'kind': 'Apron', 'label': "DRIVEWAY APRON — DPW&T RURAL SWALE/CULVERT DRIVEWAY", 'ring': geomlist(apron),
         'note': f"Open section: {dw:.0f} ft at the R/W line, {FLARE:.0f}-ft radius returns to the edge of pavement (following the cul-de-sac arc where it fronts the bulb); 15-in culvert or swale driveway per DPW&T Std. 600.02 / 100-series."},
        {'kind': 'Stoop', 'label': 'STOOP', 'ring': [list(p) for p in list(stoop.exterior.coords)[:-1]]},
    ]
    if walk is not None and not walk.is_empty:
        spec['fixedPaving'].append({'kind': 'Walk', 'label': "4' LEAD WALK", 'ring': geomlist(walk)})
    spec['programme'] = {**spec.get('programme', {}), 'garage': 'attached_2_car', 'garageEntry': 'front' if d.get('frontLoad') else 'side',
                         'footprintSource': 'DPW&T 9399-2009 approved sheet, transcribed'}
    if n == 6:
        # user 2026-09-30: Lot 6's M-6 cell was in the far south-west corner —
        # bring it to the EAST side of the lot (the Lot 5 line), behind the house
        # where the roof leaders reach it. The engine takes the nearest spot that fits.
        # Aim at the Lot 5/6 line BEHIND the house (60 % of the way from the
        # street end), 25 ft in — never the front yard, where the cell would
        # sit between the house and the street mains.
        east = lot.boundary.intersection(Polygon(_pp['5']['geometry']['rings'][0]).buffer(0.5))
        el = max(east.geoms, key=lambda g: g.length) if hasattr(east, 'geoms') else east
        if Point(el.coords[0]).distance(row) > Point(el.coords[-1]).distance(row):
            el = LineString(list(el.coords)[::-1])
        qe = el.interpolate(0.6, normalized=True)
        ui = unit((qe.x, qe.y), (lot.centroid.x, lot.centroid.y))
        spec['swmPracticeNear'] = [qe.x + ui[0] * 25, qe.y + ui[1] * 25]
    spec['approvedLayout2009'] ={'finishedFloorElevFtWsscDatum': d['ff'], 'footprintSqFt': round(house.area)}
    # The approved plan's finished floor, on the plans' one vertical datum
    # (NAVD 88 = WSSC datum less 1.6 ft, as the spot grades). It is the floor the
    # 2009 grading was designed around, so it sits above every adjacent 2009
    # grade; the engine's street-plus-2-ft estimate did not and put Lots 2, 4
    # and 5 below their own yards.
    spec['finishedFloorElevFt'] = round(d['ff'] - 1.6, 2)
    spec['finishedFloorBasis'] = '2009 approved plan FF (WSSC datum) less 1.6 ft to NAVD 88'
    json.dump(spec, open(lotp, 'w'), indent=1)
    inside = lot.buffer(0.5).contains(house)
    report[n] = {**report.get(n, {}), 'footprintSqFt': round(house.area), 'garageDoorFaces': f'{math.degrees(math.atan2(nrm[0], nrm[1])) % 360:.0f} deg',
                 'onLot': inside, 'shiftFt': [round(shift[0], 1), round(shift[1], 1)], 'rotationDeg': d.get('rotationDeg', 0), 'clearOfEasementFt': round(house.distance(esm), 1), 'drivewaySqFt': round(on_lot.area), 'apronSqFt': round(apron.area)}
# the street is the 2009 rural open section
rec['openSection'] = {'shoulderFt': 4, 'swaleFt': 10,
                      'note': "Rural open section to current standards (DPW&T Std. 500.10 / 600.02 / 600.04): 24-ft pavement, 4-ft shoulders, roadside grass swales; driveways cross the swale on culverts."}
json.dump(rec, open(os.path.join(proj, 'estates-indian-head.plat-record.json'), 'w'), indent=1)
print(json.dumps(report, indent=1))
