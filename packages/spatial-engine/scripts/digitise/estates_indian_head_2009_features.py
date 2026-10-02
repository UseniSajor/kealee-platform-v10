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
  existingTrees      retained-tree symbols read from the same 2009 base plan;
                     these are existing conditions, not proposed plantings.
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
# Drawn from the County's 2023 planimetrics (PGAtlas Transportation/8 pavement,
# Transportation/2 centrelines), archived in source/. Owner 2026-10-02: label and
# draw Indian Head Highway, its medians and Jennifer Drive accurately for the
# reviewer. Each pavement feature's first ring is its outline and any later ring
# inside it is a hole -- MD 210's hole is its centre median. Carriageway names
# follow right-hand traffic: MD 210 runs SW-NE and the site lies on its SE side,
# so the carriageway nearer the site is NORTHBOUND.
_tract_fp = Polygon(J('estates-indian-head.geometry.json')['tract'])
VIEW = _tract_fp.buffer(400)
def _pave_polys(feature):
    rings = [Polygon(r).buffer(0) for r in feature['geometry']['rings'] if len(r) > 2]
    rings.sort(key=lambda g: -g.area)
    outs = []
    for g in rings:
        host = next((o for o in outs if o.contains(g.representative_point())), None)
        if host is None: outs.append(g)
        else: outs[outs.index(host)] = host.difference(g)
    return outs
_pave = J('source/pgatlas-pavement-2023.json')['features']
_cls = J('source/pgatlas-centerlines.json')['features']
def _named(name):
    return [LineString(p_) for f in _cls if (f['attributes'].get('FULLNAME') or '').strip() == name for p_ in f['geometry']['paths']]
def _road_polys(name):
    cls_ = _named(name)
    out = []
    for f in _pave:
        if f['attributes']['FEATURE_CODE'] != 1201: continue
        for g in _pave_polys(f):
            if any(g.intersection(c).length > 50 for c in cls_): out.append(g)
    return out
def _edges(polys):
    lines = []
    for g in polys:
        for ring in [g.exterior, *g.interiors]:
            cut = LineString(ring.coords).intersection(VIEW)
            for seg in getattr(cut, 'geoms', [cut]):
                if seg.geom_type == 'LineString' and seg.length > 5:
                    lines.append([list(q) for q in seg.coords])
    return lines
def _clip_lines(ls_):
    out = []
    for l in ls_:
        cut = l.intersection(VIEW)
        for seg in getattr(cut, 'geoms', [cut]):
            if seg.geom_type == 'LineString' and seg.length > 5: out.append([list(q) for q in seg.coords])
    return out
md_polys, jen_polys = _road_polys('INDIAN HEAD HWY'), _road_polys('JENNIFER DR')
# The two MD 210 centrelines: the one nearer the site is the northbound roadway.
_md_cl = sorted(_named('INDIAN HEAD HWY'), key=lambda c: c.distance(_tract_fp))
_nb = [c for c in _md_cl if abs(c.distance(_tract_fp) - _md_cl[0].distance(_tract_fp)) < 30]
_sb = [c for c in _md_cl if c not in _nb]
# Medians, read on a section square to the highway clear of the entrance.
def _section(a_=-100):
    base = (A[0] + u[0] * a_, A[1] + u[1] * a_)
    tr = LineString([(base[0] - n[0] * 40, base[1] - n[1] * 40), (base[0] + n[0] * 300, base[1] + n[1] * 300)])
    spans = []
    for g in md_polys + jen_polys:
        I = tr.intersection(g)
        for seg in getattr(I, 'geoms', [I]):
            if seg.geom_type == 'LineString' and not seg.is_empty:
                o = sorted((q[0] - base[0]) * n[0] + (q[1] - base[1]) * n[1] for q in seg.coords)
                spans.append((o[0], o[-1]))
    spans.sort()
    return spans
_spans = _section()
_gaps = [(_spans[i][1], _spans[i + 1][0]) for i in range(len(_spans) - 1) if _spans[i + 1][0] - _spans[i][1] > 5]
# carriageway centres on the section: Jennifer, MD 210 NB, MD 210 SB (site outward)
_mid = [(a_ + b_) / 2 for a_, b_ in _spans]
# The window the plan sheets show (1" = 30' viewports centred on the site),
# inset 5 ft. A band's label goes in the middle of the band's run inside it.
# At 1" = 30' the window reaches Jennifer Drive, the separation median and the
# northbound roadway; the MD 210 centre median and southbound roadway lie
# beyond it, so the highway's name rides the northbound band.
_bx = _tract_fp.bounds
_cx, _cy = (_bx[0] + _bx[2]) / 2, (_bx[1] + _bx[3]) / 2
VISIBLE = Polygon([(_cx - 436.5 + 5, _cy - 267.75 + 5), (_cx + 436.5 - 5, _cy - 267.75 + 5),
                   (_cx + 436.5 - 5, _cy + 267.75 - 5), (_cx - 436.5 + 5, _cy + 267.75 - 5)])
def band_label(off, t0=0.15, t1=0.85):
    seen = LineString(along(off, -1500, 1500)).intersection(VISIBLE)
    seg = max(getattr(seen, 'geoms', [seen]), key=lambda g: g.length) if not seen.is_empty else None
    if seg is None or seg.length < 30: return None
    return [list(seg.interpolate(t0, normalized=True).coords[0]), list(seg.interpolate(t1, normalized=True).coords[0])]
_sep, _mdmed = (_gaps + [None, None])[:2]
md210 = {'name': 'INDIAN HEAD HIGHWAY (MD 210)',
         'label': 'INDIAN HEAD HWY — MD 210 — MASTER PLAN FREEWAY F-11 (SHA)',
         'source': 'PGAtlas Transportation/8 pavement (2023) and Transportation/2 centrelines; Transportation/6 Master Plan R/W (F-11)',
         'lines': [{'type': 'edge-of-road', 'line': l} for l in _edges(md_polys)]
                  + [{'type': 'centerline', 'line': l} for l in _clip_lines(_nb)]
                  + [{'type': 'centerline', 'line': l} for l in _clip_lines(_sb)]
}
# Same road name as md210, so the plan letters the highway once, on this band.
md210_nb = {'name': 'INDIAN HEAD HIGHWAY (MD 210)', 'label': 'MD 210 NORTHBOUND', 'source': md210['source'],
            'lines': [{'type': 'label', 'line': band_label(_mid[1]), 'label': 'C/L INDIAN HEAD HWY (MD 210) NORTHBOUND — FREEWAY F-11'}] if len(_mid) > 1 and band_label(_mid[1]) else []}
md210_sb = {'name': 'MD 210 SOUTHBOUND', 'label': 'MD 210 SOUTHBOUND', 'source': md210['source'],
            'lines': []}
_medians = []
if _sep:
    _medians.append({'type': 'median', 'line': band_label((_sep[0] + _sep[1]) / 2) or along((_sep[0] + _sep[1]) / 2, -260, -40),
                     'label': f'EX. MEDIAN (UNPAVED, ±{_sep[1] - _sep[0]:.0f} FT) — JENNIFER DR / MD 210'})
if _mdmed:
    _medians.append({'type': 'median', 'line': band_label((_mdmed[0] + _mdmed[1]) / 2) or along((_mdmed[0] + _mdmed[1]) / 2, -260, -40),
                     'label': f'EX. MD 210 MEDIAN (±{_mdmed[1] - _mdmed[0]:.0f} FT)'})
jennifer_frontage = {
    'name': 'JENNIFER DRIVE',
    'label': 'JENNIFER DRIVE — FRONTAGE ROAD',
    'source': 'PGAtlas Transportation/8 pavement (2023) and Transportation/2 centreline',
    'lines': [{'type': 'edge-of-road', 'line': l} for l in _edges(jen_polys)]
             + [{'type': 'centerline', 'line': l} for l in _clip_lines(_named('JENNIFER DR'))]
             # named on its centreline inside the plan window (the auto-placed name fell outside it)
             + ([{'type': 'label', 'line': band_label(_mid[0], 0.05, 0.45), 'label': 'C/L JENNIFER DRIVE — FRONTAGE ROAD'}] if _mid and band_label(_mid[0], 0.05, 0.45) else [])
             + [{'type': 'barrier', 'line': along(49.5), 'label': 'EX. PHYSICAL SEPARATION / BARRIER — NO DIRECT ESTATES CT ACCESS TO MD 210'}]
             + _medians,
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
roads = [jennifer_frontage, md210, md210_nb, md210_sb, road('HENRIETTA', 'HENRIETTA DRIVE')]

# ── Existing utilities along the frontage (2005 field survey on the base sheet) ──
# Owner 2026-10-02: show the current telephone poles, and the current water and
# sewer in Jennifer Drive at the locations the base sheet draws them. Poles are
# the surveyed C&P poles (pixel positions on the georeferenced sheet); the
# overhead line runs pole to pole along the frontage R/W and crosses MD 210 at
# pole 8. The 8-in water and 8-in sewer lie in the Jennifer Drive roadway at the
# offsets the sheet measures from its site-side edge of road (water 18.8 ft,
# sewer 4.2 ft), from the north end of the drawing to the Estates Court mouth.
POLES_PX = {'C&P 8': (1402, 1098), 'C&P 7 1/2': (885, 1778)}
# A pole inside the proposed entrance pavement has to move; say so on the pole.
_entr = unary_union([Polygon(r_).buffer(0) for r_ in st['pavementRings']])
poles = []
for k, p_ in POLES_PX.items():
    pt = W(*p_)
    hit = _entr.buffer(2).contains(Point(pt))
    poles.append({'point': list(pt), 'owner': 'C&P (Verizon)', 'inProposedPavement': hit,
                  'label': f'EX. TELEPHONE POLE ({k})' + (' — IN PROPOSED ENTRANCE, TO BE RELOCATED (VERIZON)' if hit else '')})
overhead = [
    {'line': [list(W(760, 1940)), list(W(885, 1778)), list(W(1402, 1098)), list(W(2060, 280))], 'label': 'EX. OVERHEAD WIRES'},
    {'line': [list(W(1402, 1098)), list(W(360, 744))], 'label': 'EX. OVERHEAD WIRES ACROSS MD 210'},
]
_turn = W(1410, 1150)
_a_turn = (_turn[0] - A[0]) * u[0] + (_turn[1] - A[1]) * u[1]
existing_mains = [
    {'type': 'water', 'line': along(18.8, -420, _a_turn), 'label': 'EX. 8" WATER (WSSC) — JENNIFER DR'},
    {'type': 'sewer', 'line': along(4.2, -420, _a_turn), 'label': 'EX. 8" SEWER (WSSC) — JENNIFER DR'},
]

# ── Street trees and lights (2009 street tree & lighting plan) ───────────────
TREES_PX = [(1866, 530), (1960, 1126), (2236, 1330), (2510, 1540), (2820, 1670), (1710, 1426), (2240, 1816),
            (2930, 2090), (3220, 1750), (3570, 1794), (3870, 1624), (4410, 1540), (4556, 1936), (4356, 2210),
            (3256, 2150), (3576, 2196)]
# Light-line canopy symbols with a solid trunk dot on the 2009 base.  Keep
# these separate from TREES_PX: the heavy, centre-cross symbol above is the
# proposed Red Maple.  The scan does not report species, trunk diameter or a
# current disposition, so those fields must come from the updated NRI/field
# survey.  Pixel locations are intentionally retained here as auditable source
# data and transformed with the same 0.44-ft-residual georeference as the plan.
EXISTING_TREES_PX = [
    # Lots 1-3 / north side
    (2740, 1395), (2885, 1405),
    (3075, 1040), (3095, 1260), (3505, 1485), (3670, 1530),
    (3940, 955), (3955, 1160), (4200, 735), (4385, 775),
    (4435, 1515), (4585, 1540), (4780, 1480),
    # Lots 4-5 / south and east side
    (4190, 1635), (4380, 1660), (4560, 1625),
    (3980, 2080), (4005, 2260), (4580, 2700), (4750, 2690), (5000, 2635),
    (2865, 1930), (2960, 2070), (3050, 2240), (3170, 2470),
    (3250, 2680), (3410, 2760), (3665, 2590), (3780, 2390),
    # Lot 6 / west tree line and yard
    (2425, 2050), (2445, 2220), (2470, 2390), (2490, 2550),
    (2520, 2730), (2550, 2900), (2900, 2070), (3020, 2200),
    (3120, 2400), (3150, 2590), (3010, 2790),
]
LIGHTS_PX = [(1733, 930), (3127, 1730), (4190, 1470), (4030, 2235), (2165, 1783)]
trees = [{'point': list(W(*p)), 'species': 'ACER RUBRUM — RED MAPLE', 'size': '2 1/2"–3" CAL., B&B', 'source': '2009 street tree plan'} for p in TREES_PX]
existing_trees = [{'point': list(W(*p)), 'canopyRadiusFt': 6.0,
                   'source': '2009 Street Tree & Lighting Plan base tree symbol; verify by updated NRI and field survey'}
                  for p in EXISTING_TREES_PX]
# The house/driveway layout and WSSC services changed after the base street-tree
# approval. Relocate conflicts to the 1-ft-inside-R/W planting corridor using
# DPW&T Std. 600.02: shade-tree spacing 50 ft (+/-5 ft), 10 ft minimum from a
# residential driveway entrance/culvert, and 15 ft from a streetlight/utility
# pole. The coordinates below are the nearest feasible points after testing all
# 16 trunks against current aprons, driveways, culverts, lights and utilities.
TREE_RELOCATIONS = {
    0: (1310911.43, 367454.39),   # remove obsolete/off-R/W entrance location
    1: (1310986.42, 367466.45),   # restore 50 ft nominal spacing to south-side run
    2: (1310991.19, 367390.82),   # clear Lot 1 driveway and apron
    6: (1311032.13, 367362.20),   # 15.6 ft clear of streetlight
    8: (1311175.91, 367386.86),   # 15.0 ft clear of streetlight; 6.7 ft clear of utility route
    9: (1311226.67, 367371.03),   # 5.2 ft clear of water-service corridor
    11: (1311361.97, 367401.55),  # 10.6 ft clear of Lot 3 driveway/apron; <=55 ft spacing
    14: (1311181.89, 367315.22),  # 5.2 ft clear of the Lot 5 service route after the 2026-10-02 court resize
}
for i, point in TREE_RELOCATIONS.items():
    trees[i]['point'] = list(point)
    trees[i]['source'] += '; relocated for current paving/utility clearance per DPW&T Std. 600.02'
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
# Steep slopes: the county's own steep-slope layer (PGAtlas layer 13; RANGE 25 =
# 15-25 %, RANGE 90 = over 25 %), owner 2026-10-01 "use county slopes". On-tract
# areas go to checklist B-5; the polygons are drawn 100 ft beyond (B-8).
SLOPE_RANGE = {25: '15-25%', 90: '>25%'}
def _polys(g):
    return [g] if g.geom_type == 'Polygon' else [x for x in getattr(g, 'geoms', []) if x.geom_type == 'Polygon']
# Owner check against the existing elevations (2026-10-02): the layer's
# slivers on Lots 2, 4 and 5, the Lot 6 frontage and the street are not
# slopes; on the property only the rear of Lot 6 is. So on the tract the layer
# is kept only on Lot 6 more than 100 ft behind the R/W; off the property it is
# shown as the County maps it (B-8).
_lot6 = next(Polygon(f['geometry']['rings'][0]).buffer(0) for f in J('source/pgatlas-parcels.json')['features']
             if f['attributes']['SUB_NAME'] == 'ESTATES AT INDIAN HEAD' and str(f['attributes']['LOT']) == '6')
slope_keep = tract.buffer(100).difference(tract).union(_lot6.difference(row.buffer(100)))
steep_on = {'15-25%': 0.0, '>25%': 0.0}
steep_draw = []
for p, a in envpolys(13):
    rng = SLOPE_RANGE.get(int(a.get('RANGE') or 0))
    if not rng: continue
    p = p.intersection(slope_keep)
    steep_on[rng] += p.intersection(tract).area
    for gg in _polys(p.intersection(tract.buffer(100)).buffer(0)):
        if gg.area > 10:
            steep_draw.append({'range': rng, 'ring': [list(q) for q in list(gg.exterior.coords)[:-1]]})
steep15_sf, steep25_sf = round(steep_on['15-25%']), round(steep_on['>25%'])
rec['environmental'] = {
    'woodsSqFt': woods_sf,
    'receiving': 'the existing Jennifer Drive frontage-road drainage system',
    'streams': False, 'wetlands': False, 'floodplain': False, 'pma': False, 'cbca': False, 'springs': False, 'marlboroClay': False, 'tierII': False,
    'hsg': 'C', 'steep15SqFt': steep15_sf, 'steep25SqFt': steep25_sf, 'soilRows': soil_rows,
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
    'No streams, stream buffers, wetlands, floodplain, PMA, woodland or Chesapeake Bay Critical Area on the property.',
    f'Steep slopes per the County slope layer (PGAtlas Environmental layer 13, 2023) and the existing elevations: on the property only at the rear of Lot 6 ({steep15_sf:,} sf at 15-25%, {steep25_sf:,} sf over 25%); slopes within 100 ft of the property shown on C-100.',
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
    'steepSlopes': steep_draw,
    'woodland': [],          # owner 2026-09-30: no environmental features on this site (no woodland)
    'soils': [{'label': a['SOIL_NAME_MUSYM'], 'ring': [list(q) for q in list(gg.exterior.coords)[:-1]]}
              for p, a in envpolys(14) for gg in ([p.intersection(buf)] if p.intersection(buf).geom_type == 'Polygon' else list(getattr(p.intersection(buf), 'geoms', [])))
              if not gg.is_empty and gg.geom_type == 'Polygon' and gg.area > 50],
}
rec['vicinityStreetsFile'] = os.path.abspath(os.path.join(proj, 'source', 'pgatlas-vicinity-streets.json'))
rec['existingRoads'] = roads
rec['existingUtilities'] = {'poles': poles, 'overhead': overhead, 'mains': existing_mains}
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
# Existing driveway and walk at the 15608 Indian Head Hwy house (owner 2026-10-02),
# from the County's 2023 planimetrics (pavement driveway / walk features within
# 150 ft of the house). Surface as the County records it.
# Owner 2026-10-02: show the existing house at 15603 Henrietta Dr (Treeview
# Estates Lot 20, Doyal; L.51799 F.399 WSSC easement) for easement reference.
# Buildings from the 2023 building layer archived in source/doyal/, kept where
# they lie on that parcel (account 2744829).
_doyal_par = next((Polygon(f['geometry']['rings'][0]).buffer(0) for f in J('source/pgatlas-parcels.json')['features']
                   if f['attributes'].get('ACCOUNT') == '2744829'), None)
_doyal_bldgs = []
if _doyal_par is not None and os.path.exists(os.path.join(proj, 'source', 'doyal', 'pgatlas-buildings-2023.json')):
    for f in J('source/doyal/pgatlas-buildings-2023.json')['features']:
        if f['attributes']['FEATURE_CODE'] != 2201: continue
        g = Polygon(f['geometry']['rings'][0]).buffer(0)
        if g.intersection(_doyal_par).area / g.area < 0.5: continue
        _doyal_bldgs.append(g)
        rec.setdefault('existingStructures', []).append({
            'ring': [list(q) for q in list(g.exterior.coords)[:-1]], 'areaSqFt': round(g.area),
            'label': 'EXISTING DWELLING\\P15603 HENRIETTA DR' if g.area > 600 else 'EX. SHED',
            'source': 'PGAtlas Administrative/MapServer/2 (Building 2023), archived source/doyal/'})
existing_paving = []
_paving_for = []
if os.path.exists(bfile):
    _paving_for.append((unary_union([Polygon(b['ring']).buffer(0) for b in B['buildings']]), addr, 150, None))
_dh = [g for g in _doyal_bldgs if g.area > 600]
if _dh:
    _paving_for.append((_dh[0], '15603 HENRIETTA DR', 100, _doyal_par))
for _house, addr, _reach, _par in _paving_for:
    for f in J('source/pgatlas-pavement-2023.json')['features']:
        a_ = f['attributes']
        kind = {1205: 'DRIVEWAY', 1208: 'WALK'}.get(a_['FEATURE_CODE'])
        if not kind: continue
        for g in _pave_polys(f):
            if g.distance(_house) > _reach or g.area < 20: continue
            if _par is not None and not g.intersects(_par.buffer(5)): continue
            surf = {'Unpaved': 'GRAVEL', 'Paved': 'PAVED', 'Concrete': 'CONCRETE', 'Asphalt': 'ASPHALT'}.get(a_['SURFACE'], '')
            for gg in ([g] if g.geom_type == 'Polygon' else list(g.geoms)):
                existing_paving.append({'ring': [list(q) for q in list(gg.exterior.coords)[:-1]], 'kind': kind, 'surface': a_['SURFACE'],
                                        'label': f'EX. {surf} {kind}'.replace('  ', ' ') + (f' ({addr})' if kind == 'DRIVEWAY' else ''),
                                        'source': 'PGAtlas Transportation/8 pavement, captured 2023' if a_['SOURCE_CODE'] == 9 else 'PGAtlas Transportation/8 pavement'})
rec['existingPaving'] = existing_paving
rec['streetTrees'] = trees
rec['existingTrees'] = existing_trees
rec['streetLights'] = lights
rec['roadsideSwales'] = swales
rec['culverts'] = culverts
rec['spotElevationsFromPlan'] = {'datum': f'NAVD 88 — converted from WSSC datum, which reads about {WSSC_ABOVE_NAVD88_FT} ft above the NAVD 88 county contours (scatter 1.2 ft)',
                                 'replaceGenerated': True, 'points': spots}
if entrance: rec['entranceApron'] = entrance
# ── Site L.O.D. (owner 2026-10-01) ──────────────────────────────────────────
# Straight runs parallel to the property lines, 10 ft inside the rear lot lines
# and the outer sides of Lots 1 and 6 (tree-save strip, 8-15 ft), with only an
# 8-ft fillet at the corners — no swerves or bulges. Where a dwelling stands
# closer than 15 ft to a line, that line's offset is reduced to keep a 5-ft
# working margin around the house (Lot 6 west line: house at 8.0 ft -> 3 ft).
# Crossings: the street grading limit (pavement + 14 ft, through the swale side
# slopes), one straight-sided entrance zone at Jennifer Drive, and the WSSC
# easement corridor to Henrietta Drive.
from shapely.geometry import LineString as _LS
LOD_SETBACK_FT, LOD_FILLET_FT, LOD_HOUSE_MARGIN_FT = 10.0, 8.0, 5.0
_geo = J('estates-indian-head.geometry.json')
_tract = Polygon(_geo['tract']).buffer(0)
_houses = [Polygon(J(f'estates-indian-head-lot{_k}.plat.json')['fixedFootprint']).buffer(0)
           for _k in range(1, 7) if J(f'estates-indian-head-lot{_k}.plat.json').get('fixedFootprint')]
_tc = list(_tract.exterior.coords)
_strips, _edge_offsets = [], []
for _i in range(len(_tc) - 1):
    _e = _LS([_tc[_i], _tc[_i + 1]])
    if _e.length < 0.5: continue
    _d = LOD_SETBACK_FT
    for _h in _houses:
        _hd = _h.distance(_e)
        if _hd < LOD_SETBACK_FT + LOD_HOUSE_MARGIN_FT:
            _d = min(_d, max(2.0, _hd - LOD_HOUSE_MARGIN_FT))
    _edge_offsets.append(round(_d, 1))
    _strips.append(_e.buffer(_d, cap_style=1))
_inset = _tract.difference(unary_union(_strips)).buffer(0)
if _inset.geom_type == 'MultiPolygon':
    _inset = max(_inset.geoms, key=lambda g: g.area)
_inset = _inset.buffer(-LOD_FILLET_FT, join_style=1).buffer(LOD_FILLET_FT, join_style=1)   # 8-ft corner fillets only
_pave = unary_union([Polygon(_r).buffer(0) for _r in st.get('pavementRings') or []])
_cross = [_pave.buffer(14.0, join_style=2).intersection(_tract.buffer(0.5))]
if rec.get('entranceApron'):
    _ap = Polygon(rec['entranceApron']['ring']).buffer(0)
    _cross.append(_ap.buffer(3.0, join_style=2))      # the entrance apron as built, 3-ft edge
for _e in rec.get('easementsOfRecord') or []:
    if _e.get('ring') and 'WSSC' in (_e.get('type', '') + _e.get('label', '')):
        _cross.append(Polygon(_e['ring']).buffer(0))
_lod = unary_union([_inset] + _cross).buffer(1.0, join_style=2).buffer(-1.0, join_style=2)
if _lod.geom_type == 'MultiPolygon':
    _lod = max(_lod.geoms, key=lambda g: g.area)
_lod = Polygon(_lod.exterior).simplify(0.3)
assert all(_lod.buffer(0.1).contains(_h) for _h in _houses), 'a dwelling falls outside the L.O.D.'
rec['siteLod'] = {'ring': [list(p) for p in list(_lod.exterior.coords)[:-1]], 'areaSqFt': round(_lod.area),
                  'setbackFt': LOD_SETBACK_FT, 'edgeOffsetsFt': _edge_offsets,
                  'note': "Limit of disturbance 10 ft inside the rear lot lines and the outer sides of Lots 1 and 6 (existing tree line preserved; 3 ft along the Lot 6 west line, where the dwelling stands 8 ft from the line); crossed only by the street, the Jennifer Drive entrance and the WSSC easement."}

# Existing frontage utilities, stated once in the general notes.
_moved = [p_['label'].split(' — ')[0].replace('EX. TELEPHONE POLE ', 'pole ') for p_ in poles if p_['inProposedPavement']]
rec['generalNotes'].insert(5, 'Existing frontage utilities: 8" WSSC water and 8" WSSC sewer in Jennifer Drive, telephone poles and overhead wires along the frontage R/W, as shown.'
    + (f' Telephone {", ".join(_moved)} lies within the proposed Estates Court entrance and is to be relocated; coordinate with Verizon.' if _moved else ''))
json.dump(rec, open(os.path.join(proj, 'estates-indian-head.plat-record.json'), 'w'), indent=1)
print(f'roads {len(roads)} · trees {len(trees)} · lights {len(lights)} · swale runs {len(swales)} '
      f'({sum(LineString(s["line"]).length for s in swales):.0f} ft) · culverts {len(culverts)} · spots {len(spots)} · '
      f'entrance {entrance["areaSqFt"] if entrance else 0} sf outside the Estates Ct R/W')
