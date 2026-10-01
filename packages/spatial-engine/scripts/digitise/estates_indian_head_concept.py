"""
Estates at Indian Head — DPIE Site Development (Stormwater) Concept sheets.

    python3 estates_indian_head_concept.py <project_dir> <scan.png> <out.pdf>

Draws what the DPIE Concept Plan Design Review Checklist (rev. 08/25/2021)
asks for and the engine set does not carry: the County BMP Summary Table
(A-15), points of investigation with ESD broken out per POI (C-9), drainage
areas to each device, off-site areas and site outfalls (C-11), the 100-year
overflow path (C-10), the environmental features (B-1..B-14), the vicinity
map at 1" = 2,000' (A-6), three grid ticks (A-8), datum (A-9) and a 5-inch
clear strip for County approval (A-3).

Inputs are the engine's twin (estates-indian-head.twin.json), the plat
record, the archived PGAtlas layers under source/, and the 2009 approved
Street Tree & Lighting sheet (DPW&T 9399-2009) rasterised at 200 dpi and
georeferenced by source/stl-2009-georef.json (fit to the plat, median 0.44 ft).
It is an UNDERLAY: 2005 field topography on WSSC datum, shown for reference.
"""
import json, math, sys, os
import numpy as np
from PIL import Image
from shapely.geometry import Polygon, LineString, Point, MultiPolygon, shape
from shapely.ops import unary_union
from scipy.interpolate import griddata
from scipy import ndimage
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Polygon as MPoly, Rectangle, FancyArrowPatch
from matplotlib.transforms import Affine2D

Image.MAX_IMAGE_PIXELS = None
proj, scan_png, out_pdf = sys.argv[1], sys.argv[2], sys.argv[3]
J = lambda p: json.load(open(os.path.join(proj, p)))
twin = J('estates-indian-head.twin.json')
rec = J('estates-indian-head.plat-record.json')
geo = J('estates-indian-head.geometry.json')
parcels = J('source/pgatlas-parcels.json')['features']
envd = lambda n: J(f'source/pgatlas-environmental/L{n}.json')['features']
georef = J('source/stl-2009-georef.json')

plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7, 'pdf.fonttype': 42})
INK, GREY, LIGHT = '#111111', '#777777', '#bbbbbb'

def rings(f):
    g = f.get('geometry') or {}
    return [r for r in g.get('rings', []) if len(r) > 2]

def poly_of(f):
    return unary_union([Polygon(r).buffer(0) for r in rings(f)])

# ── Site geometry ─────────────────────────────────────────────────────────────
tract = Polygon(geo['tract'])
row = Polygon(geo['row'])
lots = {}
outlot = None
for f in parcels:
    a = f['attributes']
    if a['SUB_NAME'] == 'ESTATES AT INDIAN HEAD':
        if a['OUT_LOT']: outlot = (poly_of(f), a)
        else: lots[int(a['LOT'])] = (poly_of(f), a)
adj = [(poly_of(f), f['attributes']) for f in parcels if f['attributes']['SUB_NAME'] != 'ESTATES AT INDIAN HEAD']

feats = twin['features']
def fr(f): return [tuple(p[:2]) for p in (f.get('ring') or {}).get('coordinates', [])]
def fl(f): return [tuple(p[:2]) for p in (f.get('line') or [])] if isinstance(f.get('line'), list) else \
    [tuple(p[:2]) for p in (f.get('line') or {}).get('coordinates', [])]
buildings = [f for f in feats if f['kind'] == 'Building']
pave = [f for f in feats if f['kind'] == 'Pavement']
swm = [f for f in feats if f['kind'] == 'SWMPractice']
das = [f for f in feats if f['kind'] == 'DrainageArea']
lods = [f for f in feats if f['kind'] == 'LimitOfDisturbance']
esmts = [f for f in feats if f['kind'] == 'Easement']
utils = [f for f in feats if f['kind'] == 'Utility']
contours = [f for f in feats if f['kind'] == 'Contour' and not (f.get('attributes') or {}).get('proposed')]

# ── Existing surface (M-NCPPC 2-ft contours, NAVD88) and D8 flow ─────────────
pts, zs = [], []
for c in contours:
    z = (c.get('attributes') or {}).get('elevationFt')
    ln = fl(c)
    if z is None or len(ln) < 2: continue
    L = LineString(ln)
    for s in np.arange(0, L.length, 4):
        q = L.interpolate(s); pts.append((q.x, q.y)); zs.append(z)
pts, zs = np.array(pts), np.array(zs)
minx, miny, maxx, maxy = tract.buffer(260).bounds
CELL = 5.0
gx = np.arange(minx, maxx, CELL); gy = np.arange(miny, maxy, CELL)
GX, GY = np.meshgrid(gx, gy)
Z = griddata(pts, zs, (GX, GY), method='linear')
Zn = griddata(pts, zs, (GX, GY), method='nearest')
Z = np.where(np.isnan(Z), Zn, Z)
Z = ndimage.gaussian_filter(Z, 1.2)
ny, nx = Z.shape
# D8 receivers
nbr = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
rec_i = -np.ones(Z.shape, int); rec_j = -np.ones(Z.shape, int)
best = np.zeros(Z.shape)
for di, dj in nbr:
    sh = np.full(Z.shape, np.nan)
    si = slice(max(0, -di), ny - max(0, di)); sj = slice(max(0, -dj), nx - max(0, dj))
    ti = slice(max(0, di), ny - max(0, -di)); tj = slice(max(0, dj), nx - max(0, -dj))
    sh[si, sj] = Z[ti, tj]
    drop = (Z - sh) / (CELL * math.hypot(di, dj))
    upd = np.nan_to_num(drop, nan=-1) > best
    best = np.where(upd, drop, best)
    II, JJ = np.indices(Z.shape)
    rec_i = np.where(upd, II + di, rec_i); rec_j = np.where(upd, JJ + dj, rec_j)
from matplotlib.path import Path as MPath
inside = MPath(np.array(tract.exterior.coords)).contains_points(np.c_[GX.ravel(), GY.ravel()]).reshape(Z.shape)

def trace(i, j, max_steps=2000):
    path = [(i, j)]
    for _ in range(max_steps):
        ri, rj = rec_i[i, j], rec_j[i, j]
        if ri < 0: break
        i, j = ri, rj; path.append((i, j))
    return path

def world(i, j): return (gx[j], gy[i])

# Where each on-site cell leaves the tract -> outfall clusters -> POIs
exit_pts = []
exits = {}
for i in range(0, ny, 2):
    for j in range(0, nx, 2):
        if not inside[i, j]: continue
        p = trace(i, j)
        for (a, b) in p:
            if not inside[a, b]:
                exits[(i, j)] = world(a, b); exit_pts.append(world(a, b)); break
        else:
            exits[(i, j)] = world(*p[-1]); exit_pts.append(world(*p[-1]))
E = np.array(exit_pts)
# cluster exit points along the boundary (120 ft linkage)
labels = -np.ones(len(E), int); k = 0
for n in range(len(E)):
    if labels[n] >= 0: continue
    stack = [n]; labels[n] = k
    while stack:
        m = stack.pop()
        d = np.hypot(E[:, 0] - E[m, 0], E[:, 1] - E[m, 1])
        for q in np.nonzero((d < 120) & (labels < 0))[0]:
            labels[q] = k; stack.append(q)
    k += 1
sizes = np.bincount(labels)
order = np.argsort(-sizes)
pois = []
for rank, c in enumerate(order):
    share = sizes[c] / len(E)
    if share < 0.04: continue
    P = E[labels == c]
    # the POI is where most of that flow crosses: the densest exit point
    cen = P[np.argmin([np.sum(np.hypot(P[:, 0] - x, P[:, 1] - y) < 25) * -1 for x, y in P])]
    pois.append({'id': f'POI-{len(pois) + 1}', 'xy': (float(cen[0]), float(cen[1])), 'share': float(share)})
tract_cells = inside.sum() * CELL * CELL

def poi_of(x, y):
    i = int(round((y - gy[0]) / CELL)); j = int(round((x - gx[0]) / CELL))
    i = min(max(i, 0), ny - 1); j = min(max(j, 0), nx - 1)
    for (a, b) in trace(i, j):
        if not inside[a, b]:
            w = world(a, b); break
    else: w = world(*trace(i, j)[-1])
    return min(pois, key=lambda p: math.hypot(p['xy'][0] - w[0], p['xy'][1] - w[1]))['id']

# Off-site area flowing onto the tract (C-11)
off = np.zeros(Z.shape, bool)
for i in range(0, ny, 2):
    for j in range(0, nx, 2):
        if inside[i, j]: continue
        for (a, b) in trace(i, j)[:400]:
            if inside[a, b]: off[i:i + 2, j:j + 2] = True; break
off_area = off.sum() * CELL * CELL

# ── ESD computations (MDE Design Manual Ch. 5, Table 5.3) ─────────────────────
def pe_target(I, hsg='C'):
    # Target P_E read from Table 5.3 (HSG C): first P_E whose RCN reaches woods (70)
    tbl = {'C': [(20, 1.0), (25, 1.2), (30, 1.4), (35, 1.6), (50, 1.6), (55, 1.8), (85, 1.8), (95, 2.0), (100, 2.2)],
           'D': [(20, 1.0), (30, 1.2), (35, 1.4), (40, 1.6), (85, 1.6), (90, 1.8), (100, 2.0)]}[hsg]
    for lim, pe in tbl:
        if I <= lim: return pe
    return tbl[-1][1]

S_REV = {'A': 0.38, 'B': 0.26, 'C': 0.13, 'D': 0.07}
rows = []
lot_da = {}
for f in das:
    pref = f['id'].split('-')[0]
    n = int(pref[1:])
    lot_da[n] = f
for n in sorted(lots):
    f = lot_da.get(n)
    da = Polygon(fr(f)).buffer(0) if f else lots[n][0]
    A = da.area
    imp = sum(Polygon(fr(b)).area for b in buildings if (b.get('attributes') or {}).get('lotLabel') == f'LOT {n}')
    imp += sum(Polygon(fr(p)).intersection(lots[n][0]).area for p in pave if fr(p) and Polygon(fr(p)).buffer(0).intersects(lots[n][0])
               and (p.get('attributes') or {}).get('improvement') not in ('street', 'curb-0', 'curb-1', 'sidewalk-0', 'sidewalk-1'))
    I = 100 * imp / A
    pe = pe_target(I); rv = 0.05 + 0.009 * I
    esdv = pe * rv * A / 12; rev = S_REV['C'] * rv * A / 12
    sp = [s for s in swm if s['id'].startswith(f'l{n}-')]
    s = sp[0] if sp else None
    sa = s['attributes'] if s else {}
    cen = Polygon(fr(s)).centroid if s else da.centroid
    prov = max(esdv, float(sa.get('requiredVolumeCf') or 0))
    rows.append({'bmp': f'ESD-{n}', 'type': 'Micro-bioretention (M-6)', 'where': f'Lot {n} ({lots[n][1]["HOUSE_NUMBER"].lstrip("0")} Estates Ct), private',
                 'A': A, 'imp': imp, 'I': I, 'pe': pe, 'rv': rv, 'esdv': esdv, 'prov': prov, 'rev': rev,
                 'area_sf': float(sa.get('footprintSqFt') or 0), 'xy': (cen.x, cen.y), 'poi': poi_of(cen.x, cen.y),
                 'ring': fr(s) if s else None, 'da': da})

# Estates Court: the R/W is its own drainage area; two M-6 cells at the entrance low point
st_imp = sum(Polygon(fr(p)).buffer(0).intersection(row).area for p in pave
             if (p.get('attributes') or {}).get('improvement') in ('street', 'Apron', 'curb-0', 'curb-1', 'sidewalk-0', 'sidewalk-1'))
A = row.area; I = 100 * st_imp / A; pe = pe_target(I); rv = 0.05 + 0.009 * I
esdv = pe * rv * A / 12; rev = S_REV['C'] * rv * A / 12
# low point of the R/W on the existing surface
cells = [(Z[i, j], gx[j], gy[i]) for i in range(ny) for j in range(nx)
         if row.buffer(-3).contains(Point(gx[j], gy[i]))]
lowz, lx, ly = min(cells)
lot6, lot1 = lots[6][0], lots[1][0]
def cell_near(lot, target, sqft):
    side = math.sqrt(sqft / 2.0)            # 2:1 cell
    best = None
    tgt = lot.exterior.interpolate(lot.exterior.project(Point(target)))
    target = (tgt.x, tgt.y)                 # the lot's nearest point to the street low point
    for dx in np.arange(-200, 201, 5):
        for dy in np.arange(-200, 201, 5):
            c = Point(target[0] + dx, target[1] + dy)
            r = Polygon([(c.x - side, c.y - side / 2), (c.x + side, c.y - side / 2), (c.x + side, c.y + side / 2), (c.x - side, c.y + side / 2)])
            if lot.buffer(-5).contains(r) and not any(Polygon(fr(b)).buffer(10).intersects(r) for b in buildings) \
                    and not any(Polygon(fr(e)).intersects(r) for e in esmts if fr(e)) \
                    and not any(Polygon(fr(p)).buffer(3).intersects(r) for p in pave if len(fr(p)) > 2) \
                    and not any(Polygon(q['ring']).buffer(5).intersects(r) for q in rows if q.get("ring")):
                d = c.distance(Point(target))
                if best is None or d < best[0]: best = (d, r)
    return best[1] if best else None
cell_sf = esdv / 2.0 / 2.0                  # two cells; 1.0 ft ponding + 2.5 ft media x 0.40
# OPEN SECTION (2009 rural section): Estates Court drains to roadside grass
# swales in the R/W — dry swales (M-8) with check dams — one each side of the
# centreline, outside the 4-ft shoulder and clear of the driveway aprons.
street_pave = unary_union([Polygon(fr(p)).buffer(0) for p in pave if (p.get('attributes') or {}).get('improvement') == 'street'])
aprons = unary_union([Polygon(fr(p)).buffer(1) for p in pave if (p.get('attributes') or {}).get('improvement') == 'Apron'])
swale_zone = row.buffer(-1).difference(street_pave.buffer(4)).difference(aprons).buffer(0)
clp = rec['proposedStreets'][0]['centreline']
cl_line = LineString(clp)
def side(pt):
    d = cl_line.project(pt); q = cl_line.interpolate(d); q2 = cl_line.interpolate(min(d + 1, cl_line.length))
    return (q2.x - q.x) * (pt.y - q.y) - (q2.y - q.y) * (pt.x - q.x) > 0
parts = list(swale_zone.geoms) if hasattr(swale_zone, 'geoms') else [swale_zone]
north = unary_union([g for g in parts if g.area > 50 and side(g.representative_point())])
south = unary_union([g for g in parts if g.area > 50 and not side(g.representative_point())])
for tag, sw, nm in (('ESD-S1', north, 'north'), ('ESD-S2', south, 'south')):
    c = sw.representative_point()
    geoms = list(sw.geoms) if hasattr(sw, 'geoms') else [sw]
    rows.append({'bmp': tag, 'type': 'Dry swale (M-8) w/ check dams — street', 'where': f'Estates Ct R/W, {nm} roadside (public, DPIE)',
                 'A': A / 2, 'imp': st_imp / 2, 'I': I, 'pe': pe, 'rv': rv, 'esdv': esdv / 2, 'prov': esdv / 2, 'rev': rev / 2,
                 'area_sf': sw.area, 'xy': (c.x, c.y), 'poi': poi_of(c.x, c.y),
                 'ring': None, 'rings': [list(g.exterior.coords)[:-1] for g in geoms], 'da': row})

tot = {k: sum(r[k] for r in rows) for k in ('A', 'imp', 'esdv', 'prov', 'rev', 'area_sf')}
tot_I = 100 * tot['imp'] / tract.area
lod = unary_union([Polygon(fr(f)).buffer(0) for f in lods] + [row] +
                  [Polygon(r['ring']).buffer(10) for r in rows if r['ring']] +
                  [Polygon(fr(e)).buffer(0) for e in esmts if fr(e) and 'PROP' in ((e.get('attributes') or {}).get('label') or '')])
lod_offsite = unary_union([Polygon(fr(e)).buffer(0) for e in esmts if fr(e)]).difference(tract)
lod = unary_union([lod, lod_offsite])

# ── Soils ────────────────────────────────────────────────────────────────────
# NO environmental features on this property (owner, 2026-09-30): no streams,
# wetlands, floodplain, PMA, steep slopes, woodland or highly erodible soils.
# Only the NRCS soils are carried, for the HSG the ESD sizing needs.
soils = [(poly_of(f), f['attributes']) for f in envd(14)]

summary = {
    'pois': pois, 'rows': [{k: v for k, v in r.items() if k not in ('da', 'ring')} for r in rows], 'totals': tot,
    'tractSqFt': tract.area, 'siteImpervPct': tot_I, 'lodSqFt': lod.area, 'lodOnSiteSqFt': lod.intersection(tract).area,
    'offsiteDrainageSqFt': off_area, 'streetLowPoint': [lx, ly, lowz],
    'soilsOnSite': [{'musym': a['SOIL_NAME_MUSYM'], 'name': a['MUNAME'], 'hsg': a['HYDROLGRP'], 'k': a['KFACTWS'],
                     'sqft': p.intersection(tract).area} for p, a in soils if p.intersection(tract).area > 1],
}
json.dump(summary, open(os.path.join(proj, 'estates-indian-head.concept-computations.json'), 'w'), indent=1, default=float)
print(f"POIs {[(p['id'], round(p['share'], 2)) for p in pois]}  site I {tot_I:.1f}%  ESDv req {tot['esdv']:.0f} cf  LOD {lod.area:,.0f} sf  offsite {off_area:,.0f} sf")

# ── Sheet furniture ───────────────────────────────────────────────────────────
W_IN, H_IN = 36, 24
APPROVAL_W = 5.0
TB_W = 3.2
PLAN_R = W_IN - APPROVAL_W - TB_W - 0.25

def frame(fig, sheet_no, title, scale_txt):
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W_IN); ax.set_ylim(0, H_IN); ax.axis('off')
    ax.add_patch(Rectangle((0.5, 0.5), W_IN - 1, H_IN - 1, fill=False, lw=1.6, ec=INK))
    # A-3: 5-inch full-height open area on the right for the County approval block
    x0 = W_IN - 0.5 - APPROVAL_W
    ax.add_patch(Rectangle((x0, 0.5), APPROVAL_W, H_IN - 1, fill=False, lw=0.8, ec=INK))
    ax.text(x0 + APPROVAL_W / 2, H_IN - 0.8, 'RESERVED FOR PRINCE GEORGE\'S COUNTY\nDPIE APPROVAL BLOCK — KEEP CLEAR',
            ha='center', va='top', fontsize=7, color=GREY)
    # title column
    tx = x0 - TB_W
    ax.add_patch(Rectangle((tx, 0.5), TB_W, H_IN - 1, fill=False, lw=0.8, ec=INK))
    y = H_IN - 0.8
    def put(lbl, val, size=7.5, bold=False, gap=0.42):
        nonlocal y
        ax.text(tx + 0.12, y, lbl, fontsize=5.5, color=GREY, va='top')
        ax.text(tx + 0.12, y - 0.13, val, fontsize=size, va='top', fontweight='bold' if bold else 'normal', wrap=True)
        y -= gap + 0.13 * val.count('\n')
    put('PLAN TYPE', 'SITE DEVELOPMENT\nCONCEPT PLAN', 10, True, 0.62)
    put('PROJECT', 'ESTATES AT INDIAN HEAD\nLOTS 1–6 AND ESTATES COURT', 8.5, True, 0.55)
    put('LOCATION', '200–205 ESTATES COURT, ACCOKEEK, MD 20607\nPLAT PM 228 @ 83 · TAX MAP 151 F-3\nWSSC 220SE01 · ELECTION DIST. 5\nCOUNCIL DIST. 9 · ZONE RR', 6.5, gap=0.75)
    put('OWNER / APPLICANT', 'GERALD WALDMAN REVOCABLE TRUST\n400 N. FLAGLER DR., WEST PALM BEACH, FL 33401\n(L.32062 F.043)', 6.5, gap=0.62)
    put('ENGINEER', 'W.L. MEEKINS, INC. — BILL MEEKINS, JR.\n3101 RITCHIE ROAD, FORESTVILLE, MD 20747\n301-736-7115 · info@meekins.net', 6.5, gap=0.62)
    put('PREPARED WITH', 'KEALEE SITE-PLAN ENGINE (DRAFT FOR PE REVIEW)', 6.5)
    put('SHEET TITLE', title, 8, True, 0.6)
    put('SCALE', scale_txt, 8)
    put('DATUM', 'HORIZ: MD STATE PLANE NAD 83 (EPSG 2248), US FT\nVERT: NAVD 88 (M-NCPPC 2-FT TOPOGRAPHY)\nDPIE PREFERS NGVD 29 — SEE NOTE V-1', 6.2, gap=0.62)
    put('DATE', '2026-09-30 · CONCEPT SUBMISSION 1', 7)
    # revisions
    ax.add_patch(Rectangle((tx + 0.1, 4.6), TB_W - 0.2, 1.2, fill=False, lw=0.5))
    ax.text(tx + 0.18, 5.72, 'REVISIONS', fontsize=6, fontweight='bold', va='top')
    for k in range(4): ax.plot([tx + 0.1, tx + TB_W - 0.1], [4.6 + 0.24 * k, 4.6 + 0.24 * k], lw=0.3, color=LIGHT)
    # PE certification
    ax.add_patch(Rectangle((tx + 0.1, 1.7), TB_W - 0.2, 2.75, fill=False, lw=0.5))
    ax.text(tx + 0.18, 4.38, 'PROFESSIONAL CERTIFICATION', fontsize=6, fontweight='bold', va='top')
    ax.text(tx + 0.18, 4.18, 'I hereby certify that these documents were prepared\nor approved by me, and that I am a duly licensed\nprofessional engineer under the laws of the State of\nMaryland. License No. ______  Expiration ______',
            fontsize=5.4, va='top')
    ax.text(tx + TB_W / 2, 2.4, '( SEAL )', ha='center', fontsize=7, color=LIGHT)
    ax.text(tx + 0.18, 1.85, 'NOT SEALED — DRAFT FOR PE REVIEW', fontsize=6, color='#b71c1c', fontweight='bold')
    ax.text(tx + 0.12, 1.45, 'SHEET', fontsize=5.5, color=GREY)
    ax.text(tx + 0.12, 0.72, sheet_no, fontsize=20, fontweight='bold')
    return ax, tx

def bar_scale(ax, x, y, ftin, total_ft=200, label=True):
    step = total_ft / 4
    for k in range(4):
        ax.add_patch(Rectangle((x + k * step / ftin, y), step / ftin, 0.08, fc=INK if k % 2 == 0 else 'white', ec=INK, lw=0.5))
        ax.text(x + k * step / ftin, y - 0.06, f'{int(k * step)}', fontsize=5.5, ha='center', va='top')
    ax.text(x + total_ft / ftin, y - 0.06, f'{int(total_ft)} FT', fontsize=5.5, ha='center', va='top')
    if label: ax.text(x, y + 0.14, f'GRAPHIC SCALE  1" = {int(ftin)}\'', fontsize=6.5, fontweight='bold')

def north_arrow(ax, x, y, s=0.45):
    ax.add_patch(MPoly([(x, y + s), (x - s * 0.28, y - s * 0.35), (x, y - s * 0.15)], closed=True, fc=INK, ec=INK))
    ax.add_patch(MPoly([(x, y + s), (x + s * 0.28, y - s * 0.35), (x, y - s * 0.15)], closed=True, fc='white', ec=INK, lw=0.6))
    ax.text(x, y + s + 0.08, 'N', ha='center', fontsize=9, fontweight='bold')
    ax.text(x, y - s * 0.55, 'NAD 83 MD GRID', ha='center', fontsize=4.5)

def table(ax, x, y, cols, data, widths, title=None, fs=5.6, rh=0.17, bold_last=False):
    if title:
        ax.text(x, y + 0.05, title, fontsize=7.5, fontweight='bold', va='bottom')
    W = sum(widths)
    ax.add_patch(Rectangle((x, y - rh * (len(data) + 1)), W, rh * (len(data) + 1), fill=False, lw=0.7))
    ax.add_patch(Rectangle((x, y - rh), W, rh, fc='#eeeeee', ec=INK, lw=0.5))
    cx = x
    for c, w in zip(cols, widths):
        ax.text(cx + 0.04, y - rh / 2, c, fontsize=fs - 0.4, va='center', fontweight='bold'); cx += w
        ax.plot([cx, cx], [y, y - rh * (len(data) + 1)], lw=0.3, color=GREY)
    for r_, rowv in enumerate(data):
        yy = y - rh * (r_ + 1.5)
        cx = x
        for v, w in zip(rowv, widths):
            ax.text(cx + 0.04, yy, str(v), fontsize=fs, va='center',
                    fontweight='bold' if (bold_last and r_ == len(data) - 1) else 'normal'); cx += w
        ax.plot([x, x + W], [y - rh * (r_ + 1), y - rh * (r_ + 1)], lw=0.25, color=LIGHT)
    return y - rh * (len(data) + 1)

def notes(ax, x, y, title, items, width_chars=95, fs=5.7, lh=0.108):
    ax.text(x, y, title, fontsize=7.5, fontweight='bold', va='top'); y -= 0.2
    import textwrap
    for n, it in enumerate(items, 1):
        lines = textwrap.wrap(it, width_chars)
        for k, ln in enumerate(lines):
            ax.text(x + (0 if k == 0 else 0.17), y, (f'{n}. ' if k == 0 else '') + ln, fontsize=fs, va='top'); y -= lh
        y -= 0.03
    return y

# ── Plan drawing helper ──────────────────────────────────────────────────────
def plan_axes(fig, box_in, center, ftin):
    x0, y0, w, h = box_in
    ax = fig.add_axes([x0 / W_IN, y0 / H_IN, w / W_IN, h / H_IN])
    cx, cy = center
    ax.set_xlim(cx - w * ftin / 2, cx + w * ftin / 2); ax.set_ylim(cy - h * ftin / 2, cy + h * ftin / 2)
    ax.set_aspect('equal'); ax.axis('off')
    return ax

def draw_poly(ax, g, **kw):
    if g.is_empty: return
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        if p.geom_type != 'Polygon': continue
        ax.add_patch(MPoly(np.array(p.exterior.coords), closed=True, **kw))

def draw_line(ax, g, **kw):
    if g.is_empty: return
    for l in (g.geoms if hasattr(g, 'geoms') else [g]):
        if l.geom_type == 'LineString':
            x, y = l.xy; ax.plot(x, y, **kw)
        elif l.geom_type == 'Polygon':
            x, y = l.exterior.xy; ax.plot(x, y, **kw)

def underlay(ax, alpha=0.30):
    im = Image.open(scan_png).convert('L')
    Wp, Hp = im.size
    ds = 2
    im = im.resize((Wp // ds, Hp // ds))
    a = np.asarray(im).astype(float) / 255.0
    g = georef; S, th = g['s'], g['th']; c, s_ = math.cos(th), math.sin(th)
    # pixel (u, v) at full res -> world (x, y)
    A = np.array([[c / S, -s_ / S], [-s_ / S, -c / S]]) * ds
    tx = g['X0'] + (-c * g['tx'] + s_ * g['ty']) / S
    ty = g['Y0'] + (s_ * g['tx'] + c * g['ty']) / S
    T = Affine2D(np.array([[A[0, 0], A[0, 1], tx], [A[1, 0], A[1, 1], ty], [0, 0, 1]]))
    rgba = np.zeros(a.shape + (4,)); rgba[..., :3] = 0.25; rgba[..., 3] = (1 - a) * alpha
    art = ax.imshow(rgba, origin='upper', extent=(0, a.shape[1], a.shape[0], 0), transform=T + ax.transData, interpolation='bilinear', zorder=0)
    clipg = tract.buffer(45)
    from matplotlib.patches import PathPatch
    pp = PathPatch(MPath(np.array(clipg.exterior.coords)), transform=ax.transData, fc='none', ec='none')
    ax.add_patch(pp); art.set_clip_path(pp)

def grid_ticks(ax):
    xs = [1311000, 1311200, 1311400]; ys = [367200, 367400]
    xl, yl = ax.get_xlim(), ax.get_ylim()
    for (x, y) in [(1311000, 367200), (1311400, 367400), (1311200, 367600)]:
        ax.plot([x - 8, x + 8], [y, y], color=INK, lw=0.8); ax.plot([x, x], [y - 8, y + 8], color=INK, lw=0.8)
        ax.text(x + 5, y + 5, f'N {y:,.0f}\nE {x:,.0f}', fontsize=4.8, va='bottom')

# ═════════════════════════════════ SHEET SDC-1 ════════════════════════════════
pdf = PdfPages(out_pdf)
fig = plt.figure(figsize=(W_IN, H_IN))
ax, tx = frame(fig, 'SDC-1', 'COVER SHEET, BMP SUMMARY\nTABLE, ESD COMPUTATIONS\nAND NOTES', 'AS NOTED')
ax.text(0.9, H_IN - 1.05, 'SITE DEVELOPMENT CONCEPT PLAN', fontsize=30, fontweight='bold', va='top')
ax.text(0.9, H_IN - 1.65, 'ESTATES AT INDIAN HEAD — LOTS 1–6 AND ESTATES COURT', fontsize=16, va='top')
ax.text(0.9, H_IN - 2.0, 'Plat Book PM 228 Plat 83 · 200–205 Estates Court, Accokeek, MD 20607 · Tax Map 151 Grid F-3 · Zone RR · Piscataway Election District 5 · Prince George\'s County, Maryland',
        fontsize=8.5, va='top')
ax.text(0.9, H_IN - 2.25, 'Stormwater management by Environmental Site Design to the Maximum Extent Practicable (MDE Design Manual Ch. 5; PGC Subtitle 32, Div. 3). New submittal; base layout from the prior 2009 Street Tree & Lighting Plan (DPW&T permit 9399-2009-00).',
        fontsize=7.5, va='top', color='#333333')

# vicinity map (A-6) — upper right of the drawing area
vx, vy, vw, vh = PLAN_R - 6.2, H_IN - 7.3, 6.0, 4.6
axv = fig.add_axes([vx / W_IN, vy / H_IN, vw / W_IN, vh / H_IN])
cxs, cys = tract.centroid.x, tract.centroid.y
axv.set_xlim(cxs - vw * 2000 / 2, cxs + vw * 2000 / 2); axv.set_ylim(cys - vh * 2000 / 2 + 400, cys + vh * 2000 / 2 + 400)
axv.set_aspect('equal'); axv.set_xticks([]); axv.set_yticks([])
vs = J('source/pgatlas-vicinity-streets.json')['features']
named = {}
for f in vs:
    fcc = f['attributes']['FCC'] or ''; nm = (f['attributes']['FULLNAME'] or '').strip()
    lw = 1.8 if fcc.startswith('A1') or fcc.startswith('A2') or fcc.startswith('A3') else 0.5
    for p in f['geometry']['paths']:
        x, y = zip(*p); axv.plot(x, y, color=INK if lw > 1 else GREY, lw=lw)
        if nm and lw > 1 or nm in ('JENNIFER DR', 'HENRIETTA DR', 'LIVINGSTON RD', 'FARMINGTON RD W', 'FARMINGTON RD E', 'BEALLE HILL RD', 'ACCOKEEK RD'):
            L = LineString(p)
            if L.length > 900 and nm not in named:
                q = L.interpolate(0.5, normalized=True); named[nm] = 1
                axv.text(q.x, q.y, nm, fontsize=5, ha='center', va='center', bbox=dict(fc='white', ec='none', pad=0.3))
draw_poly(axv, tract, fc='#b71c1c', ec='#b71c1c')
axv.annotate('SITE', (cxs, cys), (cxs + 1800, cys - 1500), fontsize=9, fontweight='bold', arrowprops=dict(arrowstyle='->', lw=0.8))
axv.set_title('VICINITY MAP   SCALE: 1" = 2,000\'', fontsize=8, fontweight='bold', loc='left')
bar_scale(ax, vx + 0.2, vy + 0.15, 2000, 4000, label=False)
north_arrow(ax, vx + vw - 0.45, vy + vh - 0.75, 0.35)

# BMP summary table (A-15, C-9)
y0 = H_IN - 2.75
cols = ['BMP', 'PRACTICE (MDE)', 'LOCATION / OWNERSHIP', 'POI', 'DA (SF)', 'IMP (SF)', '% I', 'P_E (IN)', 'Rv', 'ESDv REQ (CF)', 'ESDv PROV (CF)', 'Rev REQ (CF)', 'SURFACE (SF)', 'N (NAD83)', 'E (NAD83)']
wd = [0.55, 1.75, 2.6, 0.45, 0.62, 0.6, 0.42, 0.55, 0.45, 0.8, 0.85, 0.7, 0.72, 0.8, 0.85]
data = []
for r in sorted(rows, key=lambda r: (r['poi'], r['bmp'])):
    data.append([r['bmp'], r['type'], r['where'], r['poi'], f"{r['A']:,.0f}", f"{r['imp']:,.0f}", f"{r['I']:.1f}", f"{r['pe']:.1f}", f"{r['rv']:.3f}",
                 f"{r['esdv']:,.0f}", f"{r['prov']:,.0f}", f"{r['rev']:,.0f}", f"{r['area_sf']:,.0f}", f"{r['xy'][1]:,.0f}", f"{r['xy'][0]:,.0f}"])
for p in pois:
    sub = [r for r in rows if r['poi'] == p['id']]
    if sub:
        data.append(['', f"SUBTOTAL {p['id']}", '', p['id'], f"{sum(r['A'] for r in sub):,.0f}", f"{sum(r['imp'] for r in sub):,.0f}", '', '', '',
                     f"{sum(r['esdv'] for r in sub):,.0f}", f"{sum(r['prov'] for r in sub):,.0f}", f"{sum(r['rev'] for r in sub):,.0f}", '', '', ''])
data.append(['TOTAL', f'{len(rows)} ESD practices', 'ESDv provided ≥ required at every POI', '', f"{tot['A']:,.0f}", f"{tot['imp']:,.0f}", f"{tot_I:.1f}", '', '',
             f"{tot['esdv']:,.0f}", f"{tot['prov']:,.0f}", f"{tot['rev']:,.0f}", f"{tot['area_sf']:,.0f}", '', ''])
yb = table(ax, 0.9, y0, cols, data, wd, 'PRINCE GEORGE\'S COUNTY BMP SUMMARY TABLE  (ESD broken out by Point of Investigation — checklist A-15, C-9)', bold_last=True)
ax.text(0.9, yb - 0.12, 'P_E from MDE Design Manual Table 5.3, HSG C (governing on site). Rv = 0.05 + 0.009(I). ESDv = P_E·Rv·A/12. Rev = S·Rv·A/12, S = 0.13 in (HSG C); Rev is met within ESDv (percent-volume method). '
        'Micro-bioretention: 12 in max. ponding, 2.5 ft filter media (n = 0.40), underdrain to stable outfall; infiltration credit only where the Sec. 32-131 soil borings show ≥ 0.52 in/hr.',
        fontsize=5.5, va='top', color='#333333')

# Site data (application) and environmental features
yL = yb - 0.55
site = [
    ['Project name', 'Estates at Indian Head, Lots 1–6'],
    ['Geographic location', 'S. side of MD 210 (Indian Head Hwy), ±3,000 ft NE of MD 210 / MD 373 (Livingston Rd)'],
    ['Street address', '200, 201, 202, 203, 204, 205 Estates Court, Accokeek, MD 20607'],
    ['Companion cases', 'Prior (base work, not carrying this submittal): NRI-015-06, TCP1-018-06, TCP2-016-09, DPW&T 9399-2009-00 street tree & lighting. Of record: final plat 5-08238 (PM 228 @ 83)'],
    ['Lots / area', '6 lots + public R/W; 165,902 sf (3.809 ac) computed, 165,019 sf of record (plat 171,505 sf less Outlot A)'],
    ['Tax accounts', ', '.join(lots[n][1]['ACCOUNT'] for n in sorted(lots))],
    ['Tax map / WSSC 200\'', '151 F-3  /  220SE01'],
    ['Master plan', '2013 Approved Subregion 5 Master Plan & SMA (CR-80/81-2013); Planning Area 84, Piscataway & Vicinity'],
    ['Master plan road', 'MD 210 Indian Head Highway (frontage, SHA) — access by Estates Court only'],
    ['Council / election district', 'District 9  /  District 5 (Piscataway)'],
    ['Municipality', 'None (unincorporated) — PGAtlas Administrative/30'],
    ['Historic site / scenic road', 'None / None; Mount Vernon Viewshed Area of Primary Concern covers the site'],
    ['Zone (current / proposed)', 'RR / RR (no change) — Sec. 27-4202: 20,000 sf min., 25\' front, 8\' side, 20\' rear, 25% max. coverage'],
    ['MD 12-digit watershed', '021402030798 — Piscataway Creek (MD 8-digit 02140203); County watershed: Piscataway Creek'],
    ['Impaired / TMDL', 'Chesapeake Bay TMDL (N, P, sediment) applies; Piscataway Creek listings to be confirmed on MDE TMDL data center at submission'],
    ['Tier II / hotspot', 'No (no MDE Tier II catchment intersects) / No (single-family residential)'],
    ['Ex. site imp. area', '0 sf (vacant; DEVELOPED = N on all six accounts)'],
    ['New site imp. area', f"{tot['imp']:,.0f} sf ({tot_I:.1f}% of tract) — roofs, driveways, walks, Estates Court pavement, curb and sidewalk"],
    ['Est. disturbed area', f"{lod.area:,.0f} sf ({lod.area / 43560:.2f} ac), incl. {lod_offsite.area:,.0f} sf off-site in the WSSC easement (Outlot A, Lot 20)"],
    ['Marlboro clay / public project', 'No (PGAtlas Environmental/7: none within 100 ft) / No'],
    ['Road section', 'Open section (rural), per the 2009 base plan: Estates Court 60\' R/W, 24\' pavement, 4\' shoulders, roadside swales, cul-de-sac'],
    ['Water / sewer', 'W-3 / S-3 community systems (WSSC), Piscataway Creek sewer basin; mains from Henrietta Dr via 30\' WSSC esmt L.51799 F.399'],
]
yS = table(ax, 0.9, yL, ['APPLICATION DATA', ''], site, [2.1, 7.6], 'SITE DATA (DPIE Concept Application, rev. 07/28/2021)', fs=5.8, rh=0.165)

env = [
    ['B-1/B-2 Streams & buffers', 'None (prior NRI-015-06 as base work; updated NRI with this submittal).'],
    ['B-3 Wetlands', 'None.'],
    ['B-4 100-yr floodplain', 'None. FEMA Zone X (area of minimal flood hazard).'],
    ['B-5 Steep slopes', 'None.'],
    ['B-6 PMA', 'None.'],
    ['B-7 Woodland', 'None.'],
    ['B-8 Features within 100 ft', 'None on or within 100 ft of the property.'],
    ['B-9 Soils', '; '.join(f"{s['musym']} {s['name']} (HSG {s['hsg']}, K {s['k']}) {100 * s['sqft'] / tract.area:.0f}%" for s in summary['soilsOnSite'])],
    ['B-10 TMDL / Tier II', 'Chesapeake Bay TMDL watershed; not within a Tier II catchment; DNR Stronghold watershed (021402030798).'],
    ['B-11 Highly erodible', 'None.'],
    ['B-12/B-13 Springs, bedrock, Marlboro clay', 'None.'],
    ['B-14 Chesapeake Bay Critical Area', 'None — not in the CBCA overlay.'],
]
yE = table(ax, 11.1, yL, ['ENVIRONMENTAL FEATURE (CHECKLIST B)', 'FINDING AND SOURCE'], env, [2.2, 6.8], 'ENVIRONMENTAL FEATURES', fs=5.5, rh=0.19)

# POI table
pdata = []
for p in pois:
    sub = [r for r in rows if r['poi'] == p['id']]
    pdata.append([p['id'], f"N {p['xy'][1]:,.0f}  E {p['xy'][0]:,.0f}", f"{100 * p['share']:.0f}%", ', '.join(r['bmp'] for r in sub) or '—'])
yP = table(ax, 11.1, yE - 0.45, ['POI', 'LOCATION (NAD83)', 'SHARE OF SITE', 'ESD PRACTICES'], pdata, [0.6, 2.2, 1.0, 5.2],
           'POINTS OF INVESTIGATION (C-9) — from D8 flow routing on M-NCPPC 2-ft topography', fs=5.6)
ax.text(11.1, yP - 0.1, f"Off-site drainage onto the tract: {off_area:,.0f} sf ({off_area / 43560:.2f} ac), from the Treeview Estates rear yards to the north and east (C-11). "
        "It is passed through by sheet flow around the ESD cells; no off-site area is routed into a practice.", fontsize=5.5, va='top', color='#333333')

# Sheet index + checklist summary (bottom left)
idx = [['SDC-1', 'Site Development Concept Plan — Cover, BMP Summary Table, ESD Computations, Notes'],
       ['SDC-2', 'Site Development Concept Plan — Plan View, Drainage Area Map and Environmental Features, 1" = 40\''],
       ['C-000 – L-100', 'Site Development Plan set (11 sheets, companion): existing conditions, site/zoning, grading, utility, SWM, ESC, road, details, landscape']]
yI = table(ax, 0.9, yS - 0.4, ['SHEET', 'TITLE'], idx, [1.1, 8.6], 'INDEX OF SHEETS', fs=6, rh=0.2)

gn = [
    'Boundary: recorded plat PM 228 @ 83 (final plat 5-08238). Lot lines are the county parcel geometry, which reproduces the plat bearings to the second and distances to 0.02 ft; closure of every lot ≤ 0.04 ft.',
    'Topography: M-NCPPC 2-ft contours (NAVD 88), extended ≥100 ft beyond the property (A-13). The 2009 approved sheet (2005 Landesign field survey, WSSC datum) is georeferenced and shown faint on SDC-2 for reference. V-1: DPIE prefers NGVD 29.',
    'Outlot A (6,486 sf) was conveyed to M. & K. Doyal (L.51565 F.455) and is not part of this site. Water and sewer reach Estates Court through the recorded 30-ft WSSC easement across Outlot A and Lot 20, Treeview Estates (L.51799 F.399, Nov. 2025) and a 30-ft WSSC easement to be granted across Lot 4.',
    'Easement record discrepancies to resolve with WSSC before technical plans: Schedule A describes N 03°24\'09" W where the plat and Exhibit A show N 03°27\'26" W; the curve is written "N 043°07\'06" W"; the recited deed dates are inconsistent.',
    'Estates Court (60-ft R/W, 35,173 sf of record) is dedicated to public use on the plat and is not built. The entrance is on MD 210 (SHA): an SHA access permit and a sight-distance analysis (checklist item A.10) are required. The 30-ft R/W for use in common (L.10142 F.725) adjoins to the south-west and is not used.',
    'R-1: Estates Court keeps the 2009 rural open section (DPW&T Std. 500.10 / 600.02 / 600.04): 24-ft pavement, 4-ft shoulders and roadside dry swales (M-8). Driveways cross the swale on 15-in culverts or as swale driveways per DPW&T; aprons are 12 ft at the R/W with 5-ft flares at the edge of pavement. Confirm the section with DPIE/DPW&T for a rural residential cul-de-sac.',
    'All six lots are vacant (no existing impervious area, no structures to remove). No wells or septic systems are proposed; the existing well on Parcel 199 (15608 Indian Head Hwy) is ≥100 ft from the proposed mains.',
    'Stormwater management is ESD to the MEP: each lot drains to one micro-bioretention cell (M-6) sized for its own roof and paving; Estates Court sheet-flows off the shoulders into roadside dry swales (M-8) with check dams, north and south, draining west to the entrance. Rooftop and non-rooftop disconnection (N-1, N-2) are to be credited at technical design and will reduce the cells.',
    'Quantity: the site is < 1 ac of new impervious area on HSG C soils. The 10-yr and 100-yr (Qp10/Qf) analyses at each POI accompany this plan in the concept narrative; ESD storage is subtracted per MDE Ch. 5. Outfalls as tabulated; each discharges as sheet flow through a level spreader.',
    'NEW SUBMITTAL (2026). Prior approvals NRI-015-06, TCP1-018-06, TCP2-016-09 and DPW&T 9399-2009-00 are used as base work only and do not carry this submittal. Additional work: an updated/revised NRI (draft with this submission, approved copy before concept approval, Sec. 32-182(a)); a TCP2-016-09 revision or new TCP / letter of exemption as M-NCPPC Environmental Planning determines; street tree and lighting plan re-reviewed to current DPW&T/DPIE standards; SWM by ESD to the MEP under current Subtitle 32. Also still to be submitted: geotechnical report with Sec. 32-131 infiltration tests (E-1, E-2), soil borings, affidavit of the adjacent-owner notification (Sec. 32-182(g), mailed within 7 days of submittal), and the application fee ($500 + 5% technology fee).',
    'Contact Miss Utility (811) at least 48 hours before any excavation.',
]
notes(ax, 0.9, yI - 0.35, 'GENERAL NOTES', gn, width_chars=150, fs=5.6, lh=0.1)
pdf.savefig(fig); plt.close(fig)

# ═════════════════════════════════ SHEET SDC-2 ════════════════════════════════
FTIN = 40
fig = plt.figure(figsize=(W_IN, H_IN))
axF, tx = frame(fig, 'SDC-2', 'PLAN VIEW, DRAINAGE AREA\nMAP AND ENVIRONMENTAL\nFEATURES', '1" = 40\'')
box = (0.75, 0.75, PLAN_R - 0.9 - 4.2, H_IN - 1.5)
cx, cy = tract.centroid.x + 40, tract.centroid.y + 10
axp = plan_axes(fig, box, (cx, cy), FTIN)
underlay(axp, 0.45)
# existing contours (NAVD 88)
for c in contours:
    z = c['attributes']['elevationFt']; ln = fl(c)
    if len(ln) < 2: continue
    major = z % 10 == 0
    x, y = zip(*ln); axp.plot(x, y, color='#8d6e63', lw=0.55 if major else 0.3, ls=(0, (4, 2)) if not major else '-', zorder=1)
    if major:
        L = LineString(ln); q = L.interpolate(0.5, normalized=True)
        axp.text(q.x, q.y, f'{z:.0f}', fontsize=4.5, color='#6d4c41', ha='center', va='center', bbox=dict(fc='white', ec='none', pad=0.1), zorder=2)
# soils (NRCS)
for p, a in soils:
    g = p.intersection(tract.buffer(110))
    draw_line(axp, g.boundary if not g.is_empty else g, color='#9e9e9e', lw=0.5, ls=(0, (1, 2)), zorder=2)
    if g.area > 3000:
        rp = g.representative_point(); axp.text(rp.x, rp.y, a['SOIL_NAME_MUSYM'], fontsize=6, color='#616161', style='italic', zorder=2)
# adjoiners
for p, a in adj:
    if p.distance(tract) > 5: continue
    draw_line(axp, p.boundary, color=GREY, lw=0.4, zorder=3)
    rp = p.intersection(tract.buffer(140)).representative_point() if not p.intersection(tract.buffer(140)).is_empty else p.representative_point()
    who = (a['OWNER_NAME'] or '').strip()
    desc = f"LOT {a['LOT']}, BLK {a['BLOCK']}, {a['SUB_NAME']}" if a['SUB_NAME'] else 'ACREAGE'
    axp.text(rp.x, rp.y, f"N/F {who}\n{desc}\nL.{a['LIBER']} F.{a['FOLIO']} · ZONE {a['ZONE_CODE1']}", fontsize=4.2, color='#555555', ha='center', va='center', zorder=3)
if outlot:
    draw_line(axp, outlot[0].boundary, color=GREY, lw=0.6, zorder=3)
    axp.text(outlot[0].centroid.x, outlot[0].centroid.y + 50, 'OUTLOT A\nN/F DOYAL\nL.51565 F.455', fontsize=4.5, rotation=-87, ha='center', va='center', color='#555555')
# drainage areas (C-11)
colors = ['#fff59d', '#b3e5fc', '#c8e6c9', '#f8bbd0', '#d1c4e9', '#ffe0b2', '#dcedc8', '#b2dfdb']
for k, r in enumerate(rows):
    if r['bmp'] == 'ESD-S2': continue
    draw_poly(axp, r['da'], fc=colors[k % len(colors)], ec='#f57f17', lw=0.9, ls='-.', alpha=0.45, zorder=3)
    rp = r['da'].representative_point()
    lab = 'DA-ST (ESTATES CT R/W)\n→ ESD-S1, ESD-S2' if r['bmp'] == 'ESD-S1' else f"DA-{r['bmp'][4:]}\n→ {r['bmp']}"
    axp.text(rp.x, rp.y - 18, f"{lab}\n{r['A'] * (2 if r['bmp'] == 'ESD-S1' else 1) / 43560:.2f} AC, I = {r['I']:.0f}%", fontsize=5.2, color='#e65100', ha='center', fontweight='bold', zorder=6)
off_poly = []
for i in range(ny):
    for j in range(nx):
        if off[i, j]: off_poly.append(Point(gx[j], gy[i]).buffer(CELL * 0.75, cap_style=3))
if off_poly:
    og = unary_union(off_poly).simplify(3)
    draw_poly(axp, og, fc='none', ec='#6a1b9a', lw=1.0, ls=':', zorder=3)
    rp = max((og.geoms if hasattr(og, 'geoms') else [og]), key=lambda g: g.area).representative_point()
    axp.text(rp.x, rp.y, f'OFF-SITE DA\n{off_area / 43560:.2f} AC', fontsize=5, color='#6a1b9a', ha='center', zorder=6)
# site
draw_poly(axp, row, fc='none', ec=INK, lw=0.8, zorder=5)
for p in pave:
    r_ = fr(p)
    if len(r_) > 2: draw_poly(axp, Polygon(r_).buffer(0), fc='#cfd8dc', ec='#455a64', lw=0.4, zorder=4)
for b in buildings:
    draw_poly(axp, Polygon(fr(b)), fc='#ffffff', ec=INK, lw=1.0, hatch='////', zorder=6)
    a = b['attributes']; c = Polygon(fr(b)).centroid
    axp.text(c.x, c.y, f"{a.get('lotLabel', '')}\nFF {a.get('finishedFloorElevFt', 0):.1f}", fontsize=5, ha='center', va='center', zorder=7,
             bbox=dict(fc='white', ec='none', pad=0.2))
for n, (p, a) in lots.items():
    draw_line(axp, p.boundary, color=INK, lw=0.9, zorder=5)
    rp = p.representative_point()
    axp.text(rp.x, rp.y - 45, f"LOT {n}\n{a['LAND_AREA_SQFT']:,.0f} SF\n#{int(a['HOUSE_NUMBER'])}", fontsize=6.5, ha='center', fontweight='bold', zorder=7)
draw_line(axp, tract.boundary, color=INK, lw=2.2, zorder=6)
for e in esmts:
    r_ = fr(e)
    if len(r_) > 2:
        draw_poly(axp, Polygon(r_).buffer(0), fc='none', ec='#7b1fa2', lw=0.9, hatch='\\\\', zorder=5)
for u in utils:
    a = u.get('attributes') or {}
    if a.get('type') in ('Water main', 'Sanitary sewer main'):
        ln = fl(u)
        if len(ln) > 1:
            x, y = zip(*ln); axp.plot(x, y, color='#1565c0' if 'Water' in a['type'] else '#2e7d32', lw=1.1, ls='-' if 'Water' in a['type'] else '--', zorder=6)
# ESD practices
for r in rows:
    if r['ring']:
        draw_poly(axp, Polygon(r['ring']), fc='#81c784', ec='#1b5e20', lw=1.0, zorder=8)
    for rg in r.get('rings') or []:
        draw_poly(axp, Polygon(rg), fc='#c5e1a5', ec='#33691e', lw=0.6, hatch='..', zorder=4)
    axp.annotate(f"{r['bmp']}  {'M-8' if 'M-8' in r['type'] else 'M-6'}\nESDv {r['esdv']:,.0f} CF", r['xy'], (r['xy'][0] + 28, r['xy'][1] + 22), fontsize=5.4, color='#1b5e20', fontweight='bold',
                 arrowprops=dict(arrowstyle='-', lw=0.5, color='#1b5e20'), zorder=9, bbox=dict(fc='white', ec='#1b5e20', lw=0.4, pad=0.8))
# 100-yr overflow path (C-10): steepest descent from each practice to where it leaves the site
for r in rows:
    x, y = r['xy']
    i = int(round((y - gy[0]) / CELL)); j = int(round((x - gx[0]) / CELL))
    path = [world(a, b) for a, b in trace(i, j)]
    cut = []
    for pt in path:
        cut.append(pt)
        if not tract.contains(Point(pt)) and len(cut) > 3: break
    if len(cut) > 3:
        L = LineString(cut).simplify(4)
        xs, ys = L.xy
        axp.plot(xs, ys, color='#0d47a1', lw=0.9, ls=(0, (6, 3)), zorder=8)
        for s in np.arange(25, L.length, 70):
            a_ = L.interpolate(s - 6); b_ = L.interpolate(s)
            axp.annotate('', (b_.x, b_.y), (a_.x, a_.y), arrowprops=dict(arrowstyle='-|>', color='#0d47a1', lw=0.9, mutation_scale=8), zorder=8)
# POIs
for p in pois:
    axp.plot(*p['xy'], marker='o', ms=11, mfc='white', mec='#b71c1c', mew=1.6, zorder=10)
    axp.text(p['xy'][0] + 12, p['xy'][1] - 22, p['id'], fontsize=8, color='#b71c1c', fontweight='bold', zorder=10)
# LOD
draw_line(axp, lod.boundary, color='#e65100', lw=1.2, ls=(0, (8, 2, 2, 2)), zorder=9)
lb = lod.boundary
q = lb.interpolate(0.3, normalized=True) if not lb.is_empty else None
if q: axp.text(q.x, q.y + 6, 'LOD', fontsize=6, color='#e65100', fontweight='bold', zorder=9)
# labels
axp.text(row.centroid.x - 60, row.centroid.y + 12, 'ESTATES COURT\n60\' PUBLIC R/W (PLAT PM 228 @ 83)\nPROP. 24\' PAVEMENT, RURAL OPEN SECTION', fontsize=6, ha='center', rotation=-18, fontweight='bold', zorder=9)
axp.text(1310860, 367470, 'MD 210 — INDIAN HEAD HIGHWAY\nVARIABLE R/W (SHA, S.R.C. PLAT 47040)\nACCESS: ESTATES COURT ONLY — SHA ACCESS PERMIT', fontsize=5.5, rotation=50, ha='center', zorder=9)
axp.text(1311560, 367330, 'HENRIETTA DRIVE\n50\' R/W — EX. WSSC W & S\n(SIZES PER WSSC 220SE01, TO VERIFY)', fontsize=5, rotation=-80, ha='center', zorder=9)
grid_ticks(axp)
# legend + notes column (right of the plan)
lx0 = PLAN_R - 4.1
ly = H_IN - 0.9
axF.text(lx0, ly, 'LEGEND', fontsize=8, fontweight='bold', va='top'); ly -= 0.3
leg = [('line', INK, 2.2, '-', 'Site boundary (plat PM 228 @ 83)'), ('line', INK, 0.9, '-', 'Lot line / R/W line'),
       ('patch', '#cfd8dc', None, None, 'Proposed pavement, walk, driveway'), ('hatch', 'white', None, '////', 'Proposed dwelling (1,900 sf fp.)'),
       ('patch', '#81c784', None, None, 'ESD practice — micro-bioretention (M-6)'), ('hatch', '#c5e1a5', None, '..', 'ESD practice — roadside dry swale (M-8)'), ('line', '#f57f17', 0.9, '-.', 'Drainage area divide (to device)'),
       ('line', '#6a1b9a', 0.8, ':', 'Off-site drainage area onto site'), ('line', '#0d47a1', 0.9, (0, (6, 3)), '100-yr overflow path'),
       ('poi', '#b71c1c', None, None, 'Point of investigation'), ('line', '#e65100', 1.2, (0, (8, 2, 2, 2)), 'Limit of disturbance'),
       ('line', '#9e9e9e', 0.5, (0, (1, 2)), 'Soil boundary (NRCS)'), ('hatch', 'white', None, '\\\\', 'WSSC easement (recorded / proposed)'),
       ('line', '#1565c0', 1.1, '-', 'Prop. 8" water main'), ('line', '#2e7d32', 1.1, '--', 'Prop. 8" sewer main'),
       ('line', '#8d6e63', 0.55, '-', 'Ex. contour, 2 ft (NAVD 88)'), ('patch', '#bdbdbd', None, None, '2009 approved sheet (reference)')]
for kind, col, lw, ls, txt in leg:
    if kind == 'line': axF.plot([lx0, lx0 + 0.4], [ly, ly], color=col, lw=lw, ls=ls)
    elif kind == 'poi': axF.plot(lx0 + 0.2, ly, marker='o', ms=8, mfc='white', mec=col, mew=1.4)
    else: axF.add_patch(Rectangle((lx0, ly - 0.07), 0.4, 0.14, fc=col, ec=INK, lw=0.4, hatch=ls if kind == 'hatch' else None))
    axF.text(lx0 + 0.5, ly, txt, fontsize=6, va='center'); ly -= 0.24
ly -= 0.1
pn = [
    'Plan scale 1" = 40\' (≤ 1" = 50\', A-11); the whole property is on this sheet. Three grid ticks (A-8) are State Plane NAD 83.',
    'Drainage areas are the engine\'s per-lot catchments; POIs and the 100-yr overflow path are from D8 flow routing on the M-NCPPC 2-ft surface.',
    'Every lot drains to one M-6 cell; Estates Court drains to roadside dry swales ESD-S1/S2 (M-8), which discharge at the entrance low point (EL ±' + f"{lowz:.1f}" + ') to the MD 210 roadside ditch (SHA review).',
    'No environmental features on or within 100 ft of the property (streams, buffers, wetlands, floodplain, PMA, steep slopes, woodland).',
    'The faint underlay is the 2009 approved Street Tree & Lighting sheet (2005 field topography, WSSC datum), georeferenced to the plat (median residual 0.44 ft). Its houses, mains and street lights are superseded.',
    'Easements: 30\' WSSC L.51799 F.399 (Outlot A 906 sf; Lot 20 3,154 sf) recorded; 30\' WSSC across Lot 4 proposed. Private SWM easements over ESD-S1/S2 to be recorded with a maintenance agreement.',
]
notes(axF, lx0, ly, 'PLAN NOTES', pn, width_chars=62, fs=5.6, lh=0.1)
bar_scale(axF, 1.0, 1.05, FTIN, 200)
north_arrow(axF, PLAN_R - 4.6, H_IN - 1.4, 0.45)
axF.text(1.0, H_IN - 0.95, 'SITE DEVELOPMENT CONCEPT PLAN — PLAN VIEW / DRAINAGE AREA MAP', fontsize=13, fontweight='bold', va='top')
pdf.savefig(fig); plt.close(fig)
pdf.close()
print('wrote', out_pdf)
