"""
Digitise the environmental constraints of "Argona Hills Residential Site.pdf"
(existing site plans/) into EPSG:2248 polygons for propose-townhomes --keepout.

  python3 aragona_constraints.py "<pdf>" <out keepout.json>

Steps (all vector, no raster):
  1. Every drawing segment on the sheet is bucketed by its optional-content
     layer (PyMuPDF `page.get_drawings()` → `layer`).
  2. Georeference: the 16 "Tax Acc.: NNNNNNN" labels are matched to the PGAtlas
     lot polygons (Address/MapServer/15, ACCOUNT) by centroid for a first
     similarity fit; then ICP of the sheet's EX_SUB_BND lot lines against the
     PGAtlas lot rings, scale locked at 1 in = 42.857 ft (a 1"=50' drawing
     printed 42 in → 36 in). Residual ~10 ft rms on the lot lines — the county
     parcel layer is not a survey.
  3. Hatch layers become polygons by buffering their segments and eroding:
     EX_PMA_HATCH is a dot field (buffer 4.2 pt, erode 3.4), the slope hatches
     dense glyphs (buffer 2, erode 0.8), WETLAND-HATCH sparse symbols (buffer
     26, erode 16). The PMA outline dashes and the ESMT-FC lines are kept as
     lines for the record.
Requires: pymupdf, shapely, numpy, scipy.
"""
import sys, re, json, urllib.request, urllib.parse
import numpy as np, pymupdf
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union, linemerge
from shapely.affinity import affine_transform

PGATLAS = "https://gis.pgatlas.com/pgatlas/rest/services/Address/MapServer/15/query?"
SCALE_FT_PER_PT = 50 * 36 / 42 / 72

def layer_segments(page, doc):
    segs = {}
    for d in page.get_drawings():
        key = d.get('layer') or '(none)'
        for it in d['items']:
            if it[0] == 'l': segs.setdefault(key, []).append([[it[1].x, it[1].y], [it[2].x, it[2].y]])
            elif it[0] == 're':
                r = it[1]; pts = [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]]
                for i in range(4): segs.setdefault(key, []).append([pts[i], pts[(i + 1) % 4]])
    return segs

def pgatlas_ring(acct):
    q = urllib.parse.urlencode({'where': f"ACCOUNT='{acct}'", 'outFields': 'ACCOUNT', 'returnGeometry': 'true', 'outSR': '2248', 'f': 'json'})
    d = json.load(urllib.request.urlopen(PGATLAS + q, timeout=60))
    return d['features'][0]['geometry']['rings'][0] if d.get('features') else None

def fit_rigid(A, B, s):
    ca, cb = A.mean(0), B.mean(0); H = (A - ca).T @ (B - cb); U, S_, Vt = np.linalg.svd(H); D = np.eye(2)
    if np.linalg.det(Vt.T @ U.T) < 0: D[1, 1] = -1
    R = Vt.T @ D @ U.T; return R, cb - s * (R @ ca)

def georef(page, segs):
    words = page.get_text('words'); labs = {}
    for i, w in enumerate(words):
        if re.fullmatch(r'400\d{4}', w[4]) and i > 1 and words[i - 1][4].startswith('Acc'):
            tw = words[i - 2]; labs[w[4]] = ((tw[0] + w[2]) / 2, (tw[1] + w[3]) / 2)
    rings = {a: pgatlas_ring(a) for a in labs}; rings = {a: r for a, r in rings.items() if r}
    P = np.array([labs[a] for a in rings]) * [1, -1]; Q = np.array([[Polygon(rings[a]).centroid.x, Polygon(rings[a]).centroid.y] for a in rings])
    s = SCALE_FT_PER_PT; R, t = fit_rigid(P, Q, s)
    target = unary_union([Polygon(r).exterior for r in rings.values()])
    pts = []
    for k in [k for k in segs if k.endswith('|EX_SUB_BND')]:
        for a, b in segs[k]:
            n = max(2, int(np.hypot(b[0] - a[0], b[1] - a[1]) / 4))
            for u in np.linspace(0, 1, n): pts.append((a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])))
    P = np.array(pts) * [1, -1]
    for _ in range(25):
        X = (s * (R @ P.T)).T + t
        nn = np.array([[q.x, q.y] for q in (target.interpolate(target.project(Point(x))) for x in X)])
        d = np.hypot(*(X - nn).T); m = d < max(8, np.percentile(d, 70)); R, t = fit_rigid(P[m], nn[m], s)
    X = (s * (R @ P.T)).T + t; d = np.hypot(*(X - nn).T)
    print(f'georef: 1 in = {s*72:.3f} ft, rotation {np.degrees(np.arctan2(R[1,0],R[0,0])):.2f} deg, rms {np.sqrt((d[m]**2).mean()):.1f} ft on {m.sum()} lot-line samples')
    M = [s * R[0, 0], -s * R[0, 1], s * R[1, 0], -s * R[1, 1], t[0], t[1]]
    return M, {'s': s, 'R': R.tolist(), 't': t.tolist()}

def hatch(segs, keys, r, erode, M, only_dots=False):
    ls = []
    for k in keys:
        for a, b in segs.get(k, []):
            if a == b: ls.append(Point(a).buffer(r))
            elif not only_dots: ls.append(LineString([a, b]).buffer(r))
    if not ls: return []
    g = affine_transform(unary_union(ls).buffer(-erode).buffer(0.3), M)
    return [p for p in getattr(g, 'geoms', [g]) if p.area >= 300]

def rings_of(g):
    out = []
    for p in getattr(g, 'geoms', [g]):
        p = p.simplify(1.0, preserve_topology=True)
        for q in getattr(p, 'geoms', [p]):
            if q.is_empty or q.area < 300: continue
            out.append({'ring': [[round(x, 1), round(y, 1)] for x, y in q.exterior.coords[:-1]], 'holes': [[[round(x, 1), round(y, 1)] for x, y in h.coords[:-1]] for h in q.interiors]})
    return out

def lines_of(segs, keys, M):
    u = unary_union([LineString([a, b]) for k in keys for a, b in segs.get(k, []) if a != b])
    m = linemerge(u)
    return [[[round(x, 1), round(y, 1)] for x, y in affine_transform(l, M).simplify(0.5).coords] for l in getattr(m, 'geoms', [m])]

def main(pdf, out):
    doc = pymupdf.open(pdf); page = doc[0]
    segs = layer_segments(page, doc)
    M, f = georef(page, segs)
    E = 'Aragona_Exist_Base2|'
    pma = unary_union(hatch(segs, [E + 'EX_PMA_HATCH'], 4.2, 3.4, M, only_dots=True))
    wet = unary_union(hatch(segs, [E + 'WETLAND-HATCH', 'Aragona_Existing_Commercial_SDC_Base2|WETLAND-HATCH'], 26, 16, M))
    s25 = unary_union(hatch(segs, [E + 'SS-HATCHING-25&ABOVE'], 2.0, 0.8, M))
    s15 = unary_union(hatch(segs, [E + 'SS-HATCHING-15-25'], 2.0, 0.8, M))
    ko = {
        'source': 'Digitised from "Argona Hills Residential Site.pdf" (existing site plans/), sheet layers EX_PMA_HATCH, WETLAND-HATCH, SS-HATCHING-25&ABOVE, SS-HATCHING-15-25, ESMT-FC; georeferenced to PGAtlas lot polygons (16 lots, similarity fit, scale 1 in = 42.86 ft, rms ~10 ft on lot lines).',
        'crs': 'EPSG:2248 (ft)', 'georef': f,
        'subtract': {
            'Primary Management Area (approved plan)': rings_of(pma),
            'Wetlands (approved plan)': rings_of(wet),
            'Wetland buffer 25 ft (CsE)': rings_of(wet.buffer(25).difference(wet)),
            'Slopes ≥ 25% (approved plan)': rings_of(s25),
        },
        'show': {'Slopes 15–25% (approved plan)': rings_of(s15)},
        'lines': {
            'Forest conservation easement (approved TCP2)': lines_of(segs, ['Aragona_Proposed_Base2|ESMT-FC', E + 'X-ESMT-FC'], M),
            'PMA boundary (approved plan)': lines_of(segs, [E + 'EX_PMA_HATCH'], M),
        },
    }
    for k, v in ko['subtract'].items(): print(f'  {k}: {sum(Polygon(r["ring"], r["holes"]).area for r in v) / 43560:.2f} ac')
    json.dump(ko, open(out, 'w'))

if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
