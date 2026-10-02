"""
Model space: the site, drawn once, on NCS layers, in State Plane feet.

Every sheet is a paper-space viewport onto this one drawing; what a sheet
shows is decided by which layers its viewport freezes (style.SHEET_LAYERS).
"""
import json
import math
from ezdxf.enums import TextEntityAlignment
from . import symbols as _symbols
from ezdxf import colors

from .style import LAYERS

SCALE = 30.0  # ft per plotted inch on the plan sheets
# Hatch patterns are defined in inch-like units (ANSI31 spacing 0.125). In a
# model drawn in FEET they must be scaled up, or a 1/8" hatch becomes one line
# every 0.125 ft — millions of lines, re-plotted in every viewport.
PAT = SCALE * 0.9


def th(inches):
    """Model-space text height (ft) for a plotted height in inches."""
    return inches * SCALE


def _ring(f):
    r = (f.get('ring') or {}).get('coordinates') or []
    return [(p[0], p[1]) for p in r]


def _line(f):
    ln = f.get('line')
    if isinstance(ln, dict):
        ln = ln.get('coordinates')
    return [(p[0], p[1]) for p in (ln or [])]


def _centroid(pts):
    n = len(pts) or 1
    return (sum(p[0] for p in pts) / n, sum(p[1] for p in pts) / n)


def _area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def _bearing(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    az = math.degrees(math.atan2(dx, dy)) % 360
    if az <= 90: ns, ew, ang = 'N', 'E', az
    elif az <= 180: ns, ew, ang = 'S', 'E', 180 - az
    elif az <= 270: ns, ew, ang = 'S', 'W', az - 180
    else: ns, ew, ang = 'N', 'W', 360 - az
    D = int(ang); M = int((ang - D) * 60); S = round((ang - D - M / 60) * 3600)
    if S == 60: S, M = 0, M + 1
    if M == 60: M, D = 0, D + 1
    return f"{ns} {D:02d}°{M:02d}'{S:02d}\" {ew}"


def _text_angle(a, b):
    ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
    if ang > 90: ang -= 180
    if ang < -90: ang += 180
    return ang


def setup(doc):
    doc.header['$INSUNITS'] = 2          # feet
    doc.header['$LTSCALE'] = 12.0
    doc.header['$PSLTSCALE'] = 0
    for name in ('DASHED2', 'PHANTOM2', 'LOD', 'CL'):
        if name not in doc.linetypes:
            # LOD: 12-ft dash / 6-ft gap in model space at $LTSCALE 12 (0.4" / 0.2" plotted at 1" = 30')
            # CL (street centrelines, owner 2026-10-02 "dashed/dotted"): 7.2-ft dash,
            # gap, 0.6-ft dot, gap -> plotted 0.24" dash . 0.02" dot at 1" = 30'
            base = {'DASHED2': [0.6, 0.4, -0.2], 'PHANTOM2': [1.25, 1.0, -0.12, 0.06, -0.12], 'LOD': [1.5, 1.0, -0.5],
                    'CL': [1.25, 0.6, -0.3, 0.05, -0.3]}[name]
            doc.linetypes.add(name, pattern=base, description=name)
    for name, (aci, lt, lw) in LAYERS.items():
        if name not in doc.layers:
            doc.layers.add(name, color=aci, linetype=lt if lt in doc.linetypes or lt == 'CONTINUOUS' else 'CONTINUOUS', lineweight=lw)
    if 'KEALEE' not in doc.styles:
        doc.styles.add('KEALEE', font='arial.ttf')
    if 'KEALEE-B' not in doc.styles:
        doc.styles.add('KEALEE-B', font='arialbd.ttf')
    _blocks(doc)


def _blocks(doc):
    """Symbol library (cad_plot.symbols) — drawn once as blocks, inserted everywhere."""
    _symbols.define(doc)


class Model:
    def __init__(self, doc, sheetset):
        self.doc = doc
        self.msp = doc.modelspace()
        self.s = sheetset
        self.twin = sheetset['twin']
        self.feats = self.twin['features']

    # ── helpers ────────────────────────────────────────────────────────────
    def pl(self, pts, layer, close=False, **kw):
        if len(pts) < 2: return None
        return self.msp.add_lwpolyline(pts, close=close, dxfattribs={'layer': layer, **kw})

    def fill(self, pts, layer, rgb=None, pattern=None, scale=1.0, transparency=None):
        if len(pts) < 3: return None
        h = self.msp.add_hatch(dxfattribs={'layer': layer})
        if pattern:
            h.set_pattern_fill(pattern, scale=scale)
        else:
            h.set_solid_fill(color=7)
            if rgb: h.rgb = rgb
        if transparency is not None:
            h.transparency = transparency
        h.paths.add_polyline_path(pts, is_closed=True)
        return h

    # ── label placement: no overprinting; moved labels get a leader ────────
    def _sheets_of(self, layer):
        from .style import SHEET_LAYERS
        if not hasattr(self, '_lay_sheets'):
            self._lay_sheets = {}
            for k, lays in SHEET_LAYERS.items():
                for l in lays: self._lay_sheets.setdefault(l, set()).add(k)
        return self._lay_sheets.get(layer, {'*'})

    def _box(self, s, at, H, angle, align, lines=None):
        from shapely.geometry import Polygon as _P
        rows = lines or [s]
        w = max(len(r) for r in rows) * H * 0.62 + H * 0.3
        h = H * (1.45 * len(rows)) + H * 0.2
        name = getattr(align, 'name', str(align))
        dx = 0 if 'LEFT' in name else (-w if 'RIGHT' in name else -w / 2)
        dy = (-h if 'TOP' in name else (0 if 'BOTTOM' in name or 'BASELINE' in name else -h / 2))
        a = math.radians(angle); c, s_ = math.cos(a), math.sin(a)
        pts = [(dx, dy), (dx + w, dy), (dx + w, dy + h), (dx, dy + h)]
        return _P([(at[0] + x * c - y * s_, at[1] + x * s_ + y * c) for x, y in pts])

    def _free(self, poly, sheets):
        for q, qs in self._occ:
            if (sheets & qs or '*' in qs or '*' in sheets) and poly.intersects(q):
                return False
        return True

    def _place(self, s, at, H, angle, align, layer, lines=None, fixed=False):
        """Return a clear insertion point for this label (and whether it moved)."""
        if not hasattr(self, '_occ'):
            self._occ = []
            from shapely.geometry import Polygon as _P
            for f in self.feats:
                if f.get('kind') == 'Building' and len(_ring(f)) > 2:
                    self._occ.append((_P(_ring(f)).buffer(0), {'*'}))
        sheets = self._sheets_of(layer)
        box = self._box(s, at, H, angle, align, lines)
        if fixed or self._free(box, sheets):
            self._occ.append((box, sheets)); return at, False
        a = math.radians(angle); ux, uy = math.cos(a), math.sin(a); nx, ny = -uy, ux
        cands = []
        for k in range(1, 9):
            for sg in (1, -1):
                cands.append((nx * sg * k * H * 1.25, ny * sg * k * H * 1.25))
        for k in range(1, 6):
            for sg in (1, -1):
                for j in (0, 1, -1, 2, -2):
                    cands.append((ux * sg * k * H * 3 + nx * j * H * 1.25, uy * sg * k * H * 3 + ny * j * H * 1.25))
        for r in (6, 10, 15, 20, 28, 36):
            for t in range(0, 360, 30):
                cands.append((r * math.cos(math.radians(t)), r * math.sin(math.radians(t))))
        for dx, dy in cands:
            p = (at[0] + dx, at[1] + dy)
            b = self._box(s, p, H, angle, align, lines)
            if self._free(b, sheets):
                self._occ.append((b, sheets))
                if math.hypot(dx, dy) > 1.5 * H:
                    # leader from the anchor to the nearest point of the moved label
                    from shapely.ops import nearest_points as _np
                    from shapely.geometry import Point as _Pt
                    q = _np(b, _Pt(at))[0]
                    self.msp.add_lwpolyline([at, (q.x, q.y)], dxfattribs={'layer': layer, 'lineweight': 13})
                    self.msp.add_circle(at, H * 0.18, dxfattribs={'layer': layer})
                return p, True
        self._occ.append((box, sheets))
        return at, False

    def text(self, s, at, h_in, layer, angle=0, align=TextEntityAlignment.MIDDLE_CENTER, bold=False, fixed=False):
        at = (at[0], at[1])
        at, _ = self._place(str(s), at, th(h_in), angle, align, layer, fixed=fixed)
        t = self.msp.add_text(s, height=th(h_in), rotation=angle,
                              dxfattribs={'layer': layer, 'style': 'KEALEE-B' if bold else 'KEALEE'})
        t.set_placement(at, align=align)
        return t

    def mtext(self, s, at, h_in, layer, width_in=None, attach=5, bold=False, fixed=False):
        at = (at[0], at[1])
        lines = str(s).split('\\P')
        if width_in:
            import textwrap as _tw
            n = max(8, int(width_in / (h_in * 0.62)))
            lines = [w for ln in lines for w in (_tw.wrap(ln, n) or [''])]
        at, _ = self._place(str(s), at, th(h_in), 0, TextEntityAlignment.MIDDLE_CENTER, layer, lines=lines, fixed=fixed)
        m = self.msp.add_mtext(s, dxfattribs={'layer': layer, 'char_height': th(h_in), 'attachment_point': attach,
                                              'style': 'KEALEE-B' if bold else 'KEALEE'})
        m.set_location(at)
        if width_in: m.dxf.width = th(width_in)
        return m

    def of(self, kind, **match):
        out = []
        for f in self.feats:
            if f.get('kind') != kind: continue
            a = f.get('attributes') or {}
            if all((a.get(k) == v) if not callable(v) else v(a.get(k)) for k, v in match.items()):
                out.append(f)
        return out

    # ── authoring ──────────────────────────────────────────────────────────
    def build(self):
        self.property()
        self.adjoiners()
        self.existing_structures()
        self.roads()
        self.street()
        self.site()
        self.topo()
        self.environment()
        self.utilities()
        self.existing_utilities()      # after the paving fills, so a pole in the entrance stays visible
        self.street_geometry()
        self.sight_lines()
        self.stormwater()
        self.sediment()
        self.grid()
        self.vicinity()

    def property(self):
        self._label_blocks = []
        tract = [(p[0], p[1]) for p in self.s['tract']]
        self.pl(tract, 'V-PROP-BNDY', close=True)
        for f in self.of('Parcel'):
            r = _ring(f)
            if len(r) < 3: continue
            self.pl(r, 'V-PROP-LOTS', close=True)
            a = f.get('attributes') or {}
            c = _centroid(r)
            lbl = str(f.get('id', '')).upper()
            area = _area(r)
            name = a.get('label') or a.get('name') or lbl
            # lot bearings and distances along each edge > 25 ft
            for i in range(len(r) - 1):
                p, q = r[i], r[i + 1]
                L = math.dist(p, q)
                if L < 25: continue
                mid = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
                ang = _text_angle(p, q)
                nx, ny = -(q[1] - p[1]) / L, (q[0] - p[0]) / L
                inward = (c[0] - mid[0]) * nx + (c[1] - mid[1]) * ny > 0
                off = 2.6 if inward else -2.6
                self.text(f"{_bearing(p, q)}  {L:.2f}'", (mid[0] + nx * off, mid[1] + ny * off), 0.065, 'V-PROP-ANNO', angle=ang)
        for lp in self.twin.get('projectLots') or []:
            pass
        # lot numbers and areas from the project lots
        from shapely.geometry import Polygon as _P
        from shapely.ops import unary_union as _U
        occupied = _U([_P(_ring(g)).buffer(8) for g in self.feats if g.get('kind') in ('Building', 'Pavement', 'SWMPractice') and len(_ring(g)) > 2]
                      # yard trees (7.5-ft canopy symbol): the lot/area block never sits on a tree
                      + [_P([(t['point'][0] + 11 * math.cos(k * math.pi / 8), t['point'][1] + 11 * math.sin(k * math.pi / 8)) for k in range(16)])
                         for t in (self.s.get('extras') or {}).get('yardTrees') or []])
        for f in self.of('Parcel'):
            r = _ring(f)
            if len(r) < 3: continue
            free = _P(r).buffer(-6).difference(occupied)
            if not free.is_empty:
                big = max(free.geoms, key=lambda g: g.area) if hasattr(free, 'geoms') else free
                c = self._pole(list(big.exterior.coords)) if big.geom_type == 'Polygon' else self._pole(r)
            else:
                c = self._pole(r)
            lotno = None
            for lp in self.twin.get('projectLots') or []:
                if str(f.get('id', '')).startswith(lp.get('featurePrefix', '~')):
                    lotno = lp['label']; addr = lp.get('address', '')
            if lotno:
                # boxed lot number and area, address beneath (the approved-plan convention)
                l1, l2 = str(lotno).upper(), f"{_area(r):,.0f} SF"
                h1, h2 = th(0.14), th(0.1)
                w = max(len(l1) * h1, len(l2) * h2) * 0.72 + th(0.12)
                top, bot = c[1] + h1 * 1.25, c[1] - h2 * 1.6
                self.text(l1, (c[0], c[1] + h1 * 0.5), 0.14, 'V-PROP-ANNO', bold=True, fixed=True)
                self.text(l2, (c[0], c[1] - h2 * 0.6), 0.1, 'V-PROP-ANNO', fixed=True)
                self.pl([(c[0] - w / 2, bot), (c[0] + w / 2, bot), (c[0] + w / 2, top), (c[0] - w / 2, top)], 'V-PROP-ANNO', close=True)
                if addr: self.text(str(addr).upper(), (c[0], bot - th(0.11)), 0.075, 'V-PROP-ANNO')
                # the whole block (box + address line) is kept clear of tree symbols
                self._label_blocks.append((_P([(c[0] - w / 2 - 1, bot - th(0.2)), (c[0] + w / 2 + 1, bot - th(0.2)),
                                               (c[0] + w / 2 + 1, top + 1), (c[0] - w / 2 - 1, top + 1)]), _P(r)))

    def _pole(self, r):
        # a point well inside the ring (grid search for the point farthest from the edges)
        xs = [p[0] for p in r]; ys = [p[1] for p in r]
        best, bd = _centroid(r), -1
        from shapely.geometry import Polygon, Point
        poly = Polygon(r)
        for i in range(12):
            for j in range(12):
                pt = (min(xs) + (max(xs) - min(xs)) * (i + 0.5) / 12, min(ys) + (max(ys) - min(ys)) * (j + 0.5) / 12)
                P = Point(pt)
                if poly.contains(P):
                    d = poly.exterior.distance(P)
                    if d > bd: bd, best = d, pt
        return best

    def existing_structures(self):
        # existing buildings off site, drawn screened with a light hatch and labelled EXISTING
        for st in (self.s.get('extras') or {}).get('existingStructures') or []:
            r = [(p[0], p[1]) for p in st.get('ring') or []]
            if len(r) < 3: continue
            # EXISTING reads differently from PROPOSED at a glance (owner 2026-10-02):
            # proposed = heavy solid outline + diagonal hatch; existing = grey
            # dashed outline + light dot screen, labelled EX.
            self.fill(r, 'V-BLDG-E', pattern='DOTS', scale=PAT * 0.6)
            self.pl(r, 'V-BLDG-E', close=True)
            self.mtext(str(st.get('label', 'EXISTING DWELLING')).replace('EXISTING DWELLING', 'EX. DWELLING'), _centroid(r), 0.08, 'V-BLDG-ANNO-E', width_in=1.6, bold=True)
        # existing driveways and walks off site, outlined light and labelled EX.
        for pv in (self.s.get('extras') or {}).get('existingPaving') or []:
            r = [(p[0], p[1]) for p in pv.get('ring') or []]
            if len(r) < 3: continue
            self.pl(r, 'V-PVMT-E', close=True)
            if pv.get('kind') == 'DRIVEWAY' and _area(r) > 300:
                self.text(pv.get('label', 'EX. DRIVEWAY'), self._pole(r), 0.06, 'V-BLDG-ANNO-E')

    def adjoiners(self):
        from shapely.geometry import Polygon
        tract = Polygon(self.s['tract']).buffer(0)
        reach = tract.buffer(180)
        for ap in self.twin.get('adjacentParcels') or []:
            r = [(p[0], p[1]) for p in (ap.get('ring') or {}).get('coordinates') or []]
            if len(r) < 3: continue
            poly = Polygon(r).buffer(0)
            if poly.representative_point().within(tract): continue
            clip = poly.intersection(reach)
            if clip.is_empty: continue
            for g in (clip.geoms if hasattr(clip, 'geoms') else [clip]):
                if g.geom_type != 'Polygon': continue
                self.pl(list(g.exterior.coords), 'V-PROP-ADJN', close=True)
            rec = ap.get('record') or {}
            if rec.get('ownerName'):
                vis = clip if clip.geom_type == 'Polygon' else max(clip.geoms, key=lambda x: x.area)
                pt = vis.representative_point()
                lines = [f"N/F {rec['ownerName']}"]
                if rec.get('subdivision'):
                    lines.append(f"LOT {rec.get('lot') or ''} {rec['subdivision']}".strip())
                if rec.get('liber'):
                    lines.append(f"L.{rec['liber']} F.{rec.get('folio') or ''}")
                self.mtext('\\P'.join(lines), (pt.x, pt.y), 0.06, 'V-PROP-ANNO')

    def roads(self):
        named = set()
        labelled = {f['attributes'].get('road', '') for f in self.of('ExistingFeature', roadLine=lambda v: v == 'label')
                    if f['attributes'].get('label', '').upper().replace('C/L ', '').startswith(('INDIAN HEAD', 'JENNIFER'))}
        for f in self.of('ExistingFeature', roadLine=lambda v: bool(v)):
            a = f['attributes']
            ln = _line(f)
            if a['roadLine'] in ('median', 'label'):
                # label-only lines: a median or a carriageway name, lettered along
                # the line; the pavement edges already bound them
                if a.get('label') and len(ln) >= 2:
                    p, q = ln[0], ln[-1]
                    at = (p[0] + (q[0] - p[0]) * 0.5, p[1] + (q[1] - p[1]) * 0.5)
                    self.text(a['label'], at, 0.075 if a['roadLine'] == 'median' else 0.1, 'C-ROAD-ANNO-E',
                              angle=_text_angle(p, q), bold=a['roadLine'] == 'label')
                continue
            lay = {'edge-of-road': 'C-ROAD-EDGE-E', 'lane-line': 'C-ROAD-CNTR-E', 'centerline': 'C-ROAD-CNTR-E',
                   'right-of-way': 'C-ROAD-ROWL-E', 'barrier': 'C-ROAD-ROWL-E'}.get(a['roadLine'], 'C-ROAD-EDGE-E')
            self.pl(ln, lay)
            if a['roadLine'] == 'barrier' and a.get('label') and len(ln) >= 2:
                p, q = ln[0], ln[-1]
                at = (p[0] + (q[0] - p[0]) * 0.43, p[1] + (q[1] - p[1]) * 0.43)
                self.text(a['label'], at, 0.055, 'C-ROAD-ANNO-E', angle=_text_angle(p, q), bold=True)
            road = a.get('road', '')
            if road in labelled:      # the record places this road's name itself
                continue
            if road not in named and a['roadLine'] in ('centerline', 'lane-line') and len(ln) >= 2:
                named.add(road)
                i = len(ln) // 2
                p, q = (ln[i - 1], ln[i]) if len(ln) > 2 else (ln[0], ln[1])
                mid = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
                if len(ln) == 2:
                    mid = (p[0] + (q[0] - p[0]) * 0.28, p[1] + (q[1] - p[1]) * 0.28)
                label = a.get('roadLabel', road)
                if 'INDIAN HEAD' in str(label).upper() or '210' in str(label):
                    # beside the site, inside the plan view: the point on the highway
                    # nearest the tract, 150 ft along it clear of the entrance
                    from shapely.geometry import LineString as _L, Point as _Pt
                    hw = _L(ln)
                    tx = [t[0] for t in self.s['tract']]; ty = [t[1] for t in self.s['tract']]
                    s0 = hw.project(_Pt((sum(tx) / len(tx), sum(ty) / len(ty))))
                    s1 = s0 + 150 if s0 + 150 < hw.length else s0 - 150
                    m = hw.interpolate(s1); m2 = hw.interpolate(min(hw.length, s1 + 5))
                    mid, p, q = (m.x, m.y), (m.x, m.y), (m2.x, m2.y)
                    label = a.get('roadLabel') if 'MASTER PLAN' in str(a.get('roadLabel', '')) else "INDIAN HEAD HIGHWAY — MD ROUTE 210 (SHA, VARIABLE WIDTH R/W)"
                self.text(label, mid, 0.13, 'C-ROAD-ANNO-E', angle=_text_angle(p, q), bold=True)

    def existing_utilities(self):
        """Existing poles, overhead wires and mains outside the tract, from the plan record."""
        eu = self.s['extras'].get('existingUtilities') or {}
        for m in eu.get('mains') or []:
            ln = [(p[0], p[1]) for p in m['line']]
            if len(ln) < 2: continue
            lay = 'C-WATR-MAIN-E' if m.get('type') == 'water' else 'C-SSWR-MAIN-E'
            self.pl(ln, lay)
            p, q = ln[0], ln[-1]
            t = 0.3 if m.get('type') == 'water' else 0.45
            self.text(m.get('label', ''), (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t), 0.06, 'V-UTIL-ANNO-E', angle=_text_angle(p, q))
        for o in eu.get('overhead') or []:
            ln = [(p[0], p[1]) for p in o['line']]
            if len(ln) < 2: continue
            self.pl(ln, 'V-UTIL-OVHD')
            p, q = ln[-2], ln[-1]
            self.text(o.get('label', ''), (p[0] + (q[0] - p[0]) * 0.55, p[1] + (q[1] - p[1]) * 0.55), 0.055, 'V-UTIL-ANNO-E', angle=_text_angle(p, q))
        for pole in eu.get('poles') or []:
            x, y = pole['point'][0], pole['point'][1]
            self.msp.add_blockref('UTIL_POLE', (x, y), dxfattribs={'layer': 'V-UTIL-POLE'})
            self.text(pole.get('label', ''), (x - 3.0, y + 3.0), 0.055, 'V-UTIL-ANNO-E', align=TextEntityAlignment.BOTTOM_RIGHT)

    def street(self):
        ps = self.s['extras'].get('proposedStreet') or {}
        for f in self.of('ProposedFeature', type='right-of-way'):
            self.pl(_ring(f), 'C-ROAD-ROWL-N', close=True)
        for f in self.of('Pavement'):
            a = f.get('attributes') or {}
            r = _ring(f)
            imp = a.get('improvement')
            if imp in ('street', 'entrance'):
                self.pl(r, 'C-ROAD-PVMT-N', close=True)
                self.fill(r, 'C-ROAD-PVMT-N', rgb=(214, 214, 214))
            elif imp == 'road-widening':
                self.pl(r, 'C-ROAD-IMPR-N', close=True)
                self.fill(r, 'C-ROAD-IMPR-N', pattern='ANSI37', scale=PAT)
                c = _centroid(r)
                self.mtext(a.get('label', ''), (c[0] - 40, c[1] + 25), 0.07, 'C-ROAD-ANNO-N', width_in=2.6)
        cl = ps.get('centreline') or []
        if len(cl) > 3:
            p, q = cl[len(cl) // 2 - 1], cl[len(cl) // 2]
            mid = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
            self.text(f"{ps.get('name', 'ESTATES COURT')} — {ps.get('rightOfWayFt', 60)}' PUBLIC R/W (PLAT PM 228 @ 83)",
                      mid, 0.12, 'C-ROAD-ANNO-N', angle=_text_angle(p, q), bold=True)
            self.text(f"PROP. {ps.get('pavementFt', 24)}' BIT. PAVEMENT — RURAL OPEN SECTION", (mid[0], mid[1] - th(0.2)), 0.08,
                      'C-ROAD-ANNO-N', angle=_text_angle(p, q))
        if ps.get('bulbCentre'):
            c = ps['bulbCentre']
            self.mtext(f"CUL-DE-SAC\\PR/W R={ps.get('bulbRightOfWayRadiusFt', 60):.0f}'\\PPAVEMENT R={ps.get('bulbPavementRadiusFt', 42):.0f}'",
                       (c[0], c[1]), 0.085, 'C-ROAD-ANNO-N')
        ent = ps.get('entrance') or None
        if ent:
            n, s_ = ent['northReturnCentre'], ent['southReturnCentre']
            mid = ((n[0] + s_[0]) / 2, (n[1] + s_[1]) / 2)
            self.mtext(f"ESTATES CT / JENNIFER DR ENTRANCE — R={ent['returnRadiusFt']:.0f}' RETURNS\\PCOUNTY REVIEW — EXISTING MD 210 SEPARATION TO REMAIN", (mid[0] - 30, mid[1] + 55), 0.065, 'C-ROAD-ANNO-N', width_in=2.4)
        for f in self.of('ProposedFeature', type='roadside swale'):
            self.pl(_line(f), 'C-ROAD-SWAL-N')
        sw = self.of('ProposedFeature', type='roadside swale')
        if sw:
            ln = _line(sw[0]); i = len(ln) // 2
            self.text('ROADSIDE SWALE (M-8) — FLOW TO ENTRANCE', ln[i], 0.07, 'C-SWM-ANNO', angle=_text_angle(ln[max(0, i - 1)], ln[min(len(ln) - 1, i + 1)]))
        for f in self.of('ProposedFeature', type='culvert'):
            ln = _line(f)
            if len(ln) < 2: continue
            a, b = ln[0], ln[-1]
            L = math.dist(a, b); ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L; nx, ny = -uy, ux
            hw = (f['attributes'].get('sizeIn', 15) / 12) / 2
            for sgn in (1, -1):
                self.pl([(a[0] + nx * hw * sgn, a[1] + ny * hw * sgn), (b[0] + nx * hw * sgn, b[1] + ny * hw * sgn)], 'C-STRM-CULV-N')
            for e, d in ((a, -1), (b, 1)):
                # flared end section from the symbol library, flaring away from the pipe
                ang = math.degrees(math.atan2(uy * d, ux * d))
                self.msp.add_blockref('ENDWALL', (e[0], e[1]), dxfattribs={'layer': 'C-STRM-CULV-N', 'rotation': ang})
            m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            at = f['attributes']
            self.text(f"{at.get('sizeIn', 15)}\" {at.get('material', 'RCP')} CULV. L={at.get('lengthFt') or L:.0f}'", (m[0] + nx * 5, m[1] + ny * 5), 0.06, 'C-SWM-ANNO', angle=_text_angle(a, b))

    def site(self):
        for f in self.of('Building'):
            r = _ring(f)
            self.pl(r, 'C-BLDG-FTPR-N', close=True)
            self.fill(r, 'C-BLDG-FTPR-N', pattern='ANSI31', scale=PAT)
            a = f.get('attributes') or {}
            c = self._pole(r)
            ff = a.get('finishedFloorElevFt')
            if ff: self.mtext(f"FF {ff:.2f}", c, 0.075, 'C-BLDG-ANNO-N', bold=True, fixed=True)
        for f in self.of('Pavement'):
            a = f.get('attributes') or {}
            imp = a.get('improvement')
            if imp in ('Driveway', 'Apron'):
                r = _ring(f)
                self.pl(r, 'C-PVMT-DRWY-N', close=True)
                self.fill(r, 'C-PVMT-DRWY-N', rgb=(232, 232, 232))
            elif imp in ('Walk', 'Stoop'):
                # concrete: heavier outline and a stipple, so a 4-ft walk reads at 1" = 30'
                r = _ring(f)
                self.fill(r, 'C-PVMT-WALK-N', pattern='AR-CONC', scale=PAT * 0.25)
                self.pl(r, 'C-PVMT-WALK-N', close=True)
                if imp == 'Walk' and len(r) > 2:
                    from shapely.geometry import Polygon as _Pw
                    mrr = _Pw(r).minimum_rotated_rectangle.exterior.coords
                    e = max(((mrr[i], mrr[i + 1]) for i in range(4)), key=lambda q: math.dist(*q))
                    if math.dist(*e) > 8:
                        c = _centroid(r)
                        self.text("4' CONC. WALK", (c[0], c[1]), 0.05, 'C-PVMT-ANNO-N', angle=_text_angle(*e))
        for f in self.of('ProposedFeature'):
            gid = str(f.get('id', ''))
            if gid.endswith('buildable-envelope') and _ring(f):
                self.pl(_ring(f), 'V-PROP-BRL', close=True)

    def street_geometry(self):
        """Stationing, tangent bearings, curve labels and EOP spot grades on Estates Court."""
        # Centreline AFTER the pavement fill, so it reads on top of it, and named.
        for f in self.of('ProposedFeature', type='centerline'):
            ln = _line(f)
            self.pl(ln, 'C-ROAD-CNTR-N')
            if len(ln) >= 2:
                i = max(1, int(len(ln) * 0.62))
                p, q = ln[i - 1], ln[i]
                nx, ny = -(q[1] - p[1]), (q[0] - p[0]); L = math.hypot(nx, ny) or 1
                self.text('C/L ESTATES COURT', (p[0] + nx / L * 3.5, p[1] + ny / L * 3.5), 0.07, 'C-ROAD-ANNO-N', angle=_text_angle(p, q), bold=True)
        pr = self.s.get('profile')
        if not pr: return
        lay, ann = 'C-ROAD-STA-N', 'C-ROAD-STA-N'
        sts = pr['stations']
        cl = [tuple(st['at']) for st in sts]
        for k, st in enumerate(sts):
            s = st['sta']
            p = st['at']
            q = sts[min(k + 1, len(sts) - 1)]['at'] if k + 1 < len(sts) else st['at']
            r = sts[max(k - 1, 0)]['at']
            dx, dy = q[0] - r[0], q[1] - r[1]
            L = math.hypot(dx, dy) or 1
            ux, uy = dx / L, dy / L; nx, ny = -uy, ux
            major = abs(s / 100 - round(s / 100)) < 1e-6
            tick = 3.0 if major else 1.5
            self.msp.add_line((p[0] - nx * tick, p[1] - ny * tick), (p[0] + nx * tick, p[1] + ny * tick), dxfattribs={'layer': lay})
            if major:
                h = int(round(s / 100))
                self.text(f"{h}+00", (p[0] + nx * 6.5, p[1] + ny * 6.5), 0.065, ann, angle=_text_angle((0, 0), (ux, uy)), bold=True)
            if abs(s / 50 - round(s / 50)) < 1e-6:
                # EOP elevations both sides, 2% cross slope
                for side in (1, -1):
                    e = (p[0] + nx * 12 * side, p[1] + ny * 12 * side)
                    self.msp.add_blockref('SPOT', e, dxfattribs={'layer': 'C-TOPO-SPOT-N'})
                    self.text(f"EP {st['eopLeft']:.2f}", (e[0] + nx * 3.5 * side, e[1] + ny * 3.5 * side), 0.045, 'C-TOPO-SPOT-N',
                              angle=_text_angle((0, 0), (ux, uy)))
        # end station
        self.text(f"END STA {self._sta(pr['lengthFt'])}", (cl[-1][0], cl[-1][1] - 6), 0.06, ann, bold=True)
        self.text("STA 0+00 — EX. EDGE OF ROAD, JENNIFER DRIVE", (cl[0][0], cl[0][1] + 8), 0.06, ann, bold=True)
        for el in pr['alignment']:
            if el['kind'] == 'tangent' and el['lengthFt'] > 40:
                a, b = el['start'], el['end']
                m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
                ux, uy = (b[0] - a[0]) / el['lengthFt'], (b[1] - a[1]) / el['lengthFt']
                self.text(f"{el['bearing']}  {el['lengthFt']:.2f}'", (m[0] + uy * 2.5, m[1] - ux * 2.5), 0.06, ann,
                          angle=_text_angle(a, b))
            elif el['kind'] == 'curve':
                for nm, pt in (('PC', el['pc']), ('PT', el['pt'])):
                    self.msp.add_circle(tuple(pt), 0.9, dxfattribs={'layer': lay})
                    self.text(f"{nm} {self._sta(el['staPC'] if nm == 'PC' else el['staPT'])}", (pt[0], pt[1] + 4), 0.05, ann)
                mid = ((el['pc'][0] + el['pt'][0]) / 2, (el['pc'][1] + el['pt'][1]) / 2)
                self.text(el['id'], mid, 0.08, ann, bold=True)

    def sight_lines(self):
        sd = (self.s.get('extras') or {}).get('sightDistance')
        if not sd: return
        for ln in sd['lines']:
            a, b = tuple(ln['from']), tuple(ln['to'])
            self.pl([a, b], 'C-ROAD-SIGHT-N')
            self.msp.add_circle(b, 1.5, dxfattribs={'layer': 'C-ROAD-SIGHT-N'})
            m = (a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55)
            self.text(f"ISD {ln['isdFt']:.0f}' ({ln['tgS']} s)", m, 0.06, 'C-ROAD-SIGHT-N', angle=_text_angle(a, b), bold=True)
        dp = sd['decisionPoint']
        self.msp.add_circle((dp[0], dp[1]), 1.2, dxfattribs={'layer': 'C-ROAD-SIGHT-N'})
        self.text("DECISION PT. 14.5' FROM EDGE OF ROAD", (dp[0], dp[1] - 4), 0.05, 'C-ROAD-SIGHT-N')

    @staticmethod
    def _sta(s):
        h = int(s // 100)
        return f"{h}+{s - h * 100:05.2f}"

    def topo(self):
        for f in self.of('Contour'):
            a = f.get('attributes') or {}
            if a.get('hidden'): continue
            ln = _line(f)
            if len(ln) < 2: continue
            z = a.get('elevationFt')
            prop = a.get('proposed') is True
            major = z is not None and round(z) % 10 == 0
            lay = ('C-TOPO-MAJR-N' if major else 'C-TOPO-MINR-N') if prop else ('C-TOPO-MAJR-E' if major else 'C-TOPO-MINR-E')
            self.pl(ln, lay)
            if major and len(ln) > 6:
                i = len(ln) // 2
                self.text(f"{z:.0f}", ln[i], 0.07, 'C-TOPO-ANNO', angle=_text_angle(ln[i - 1], ln[i + 1]))
        for f in self.of('SpotElevation'):
            p = f.get('point')
            if not p: continue
            a = f.get('attributes') or {}
            self.msp.add_blockref('SPOT', (p[0], p[1]), dxfattribs={'layer': 'C-TOPO-SPOT-N'})
            self.text(str(a.get('label', '')), (p[0] + 1.5, p[1] + 1.2), 0.055, 'C-TOPO-SPOT-N', align=TextEntityAlignment.BOTTOM_LEFT)

    def environment(self):
        eg = self.s['extras'].get('environmentalGeometry') or {}
        for sl in eg.get('steepSlopes') or []:
            r = [(p[0], p[1]) for p in sl['ring']]
            self.fill(r, 'C-ENVR-SLOP-E', pattern='DOTS' if sl['range'] == '15-25%' else 'ANSI37', scale=PAT)
            self.pl(r, 'C-ENVR-SLOP-E', close=True)
        for wo in eg.get('woodland') or []:
            r = [(p[0], p[1]) for p in wo['ring']]
            self.fill(r, 'C-ENVR-WOOD-E', pattern='ANSI31', scale=PAT * 1.8, transparency=65)
            self.pl(r, 'C-ENVR-WOOD-E', close=True)
            self.text(wo['label'], self._pole(r), 0.065, 'C-ENVR-ANNO', bold=True)
        for so in eg.get('soils') or []:
            r = [(p[0], p[1]) for p in so['ring']]
            self.pl(r, 'C-ENVR-SOIL-E', close=True)
            c = self._pole(r)
            self.text(so['label'], c, 0.1, 'C-ENVR-ANNO', bold=True)

    def utilities(self):
        for f in self.of('Utility'):
            a = f.get('attributes') or {}
            ln = _line(f)
            ty = str(a.get('type', ''))
            tyl = ty.lower()
            if ty == 'Water main': lay = 'C-WATR-MAIN-N'
            elif ty == 'Sanitary sewer main': lay = 'C-SSWR-MAIN-N'
            elif 'water service' in tyl: lay = 'C-WATR-SVCS-N'
            elif 'sanitary lateral' in tyl or 'sewer' in tyl: lay = 'C-SSWR-SVCS-N'
            else: lay = 'C-UTIL-SVCS-N'
            if len(ln) < 2: continue
            self.pl(ln, lay)
            if lay in ('C-WATR-MAIN-N', 'C-SSWR-MAIN-N') and len(ln) > 3:
                # The route is stored connection-end first. Show that proposed
                # tie-in explicitly, rather than allowing the off-site main and
                # the recorded easement route to disappear at the viewport
                # edge. Water and sewer callouts are thrown to opposite sides.
                conn = str(a.get('sizeAtMain', '')).strip()
                if conn:
                    q0, q1 = ln[0], ln[1]
                    self.msp.add_circle(q0, 2.0, dxfattribs={'layer': lay, 'lineweight': 50})
                    L0 = math.dist(q0, q1) or 1
                    ux0, uy0 = (q1[0] - q0[0]) / L0, (q1[1] - q0[1]) / L0
                    water0 = lay == 'C-WATR-MAIN-N'
                    side0 = 1 if water0 else -1
                    # Pull the note back into the easement corridor and right-
                    # justify it. The tie point is near the east viewport edge;
                    # throwing the leader beyond the connection clipped the
                    # very Henrietta callout this symbol exists to show.
                    at0 = (q0[0] + ux0 * 18 - uy0 * 22 * side0,
                           q0[1] + uy0 * 18 + ux0 * 22 * side0)
                    self.pl([q0, at0], 'C-UTIL-ANNO-N')
                    self.text(f"PROP. CONNECTION — {conn} VIA REC. 30' WSSC ESMT (L.51799 F.399)",
                              at0, 0.065, 'C-UTIL-ANNO-N',
                              align=TextEntityAlignment.BOTTOM_RIGHT if water0 else TextEntityAlignment.TOP_RIGHT)
                i = len(ln) // 3
                self.text(f"{a.get('label', ty)} — {a.get('sizeAtMain', '')}", ln[i], 0.065, 'C-UTIL-ANNO-N', angle=_text_angle(ln[i - 1], ln[i + 1]))
                # the end of the main: capped and called out — no main past the last service
                e0, e1 = ln[-2], ln[-1]
                water = lay == 'C-WATR-MAIN-N'
                L = math.dist(e0, e1) or 1
                ux, uy = (e1[0] - e0[0]) / L, (e1[1] - e0[1]) / L
                # library symbols: blow-off on the water main, manhole on the sewer
                self.msp.add_blockref('BLOWOFF' if water else 'SAN_MH', e1,
                                      dxfattribs={'layer': lay, 'rotation': math.degrees(math.atan2(uy, ux)) if water else 0})
                # captioned off the R/W on a leader, water to one side and sewer to the
                # other, so neither sits on the street name or the pavement
                side = 1 if water else -1
                off = 44 if water else 30
                at = (e1[0] + ux * 8 - uy * off * side, e1[1] + uy * 8 + ux * off * side)
                self.pl([e1, at], 'C-UTIL-ANNO-N')
                self.text(f"END {str(a.get('label', ty)).replace('PROP. ', '')} — {'CAP & BLOW-OFF' if water else 'TERMINAL MANHOLE'}",
                          at, 0.06, 'C-UTIL-ANNO-N', align=TextEntityAlignment.BOTTOM_LEFT if water else TextEntityAlignment.TOP_LEFT)
            elif lay in ('C-WATR-SVCS-N', 'C-SSWR-SVCS-N'):
                # every lot's connection, tapped at the main and labelled
                lot = str(a.get('lotLabel') or '')
                lab = (lot.upper() + ' — ' if lot else '') + ('1" W.H.C.' if lay == 'C-WATR-SVCS-N' else '4" S.H.C.')
                k = max(1, len(ln) // 2)
                self.text(lab, ln[k], 0.055, 'C-UTIL-ANNO-N', angle=_text_angle(ln[k - 1], ln[min(k + 1, len(ln) - 1)]))
                self.msp.add_circle(ln[0], 0.8, dxfattribs={'layer': lay})
        for f in self.of('Easement'):
            r = _ring(f)
            if len(r) < 3: continue
            self.pl(r, 'V-ESMT', close=True)
            a = f.get('attributes') or {}
            lbl = a.get('label') or f.get('recordReference') or ''
            if lbl and _area(r) > 400:
                c = _centroid(r)
                self.mtext(lbl, c, 0.06, 'V-ESMT-ANNO', width_in=1.6)
        for f in self.of('Tree'):
            r = _ring(f)
            if not r: continue
            c = _centroid(r)
            existing = bool((f.get('attributes') or {}).get('existing'))
            self.msp.add_blockref('TREE_EXIST' if existing else 'TREE', c,
                                  dxfattribs={'layer': 'V-VEGT-TREE-E' if existing else 'L-PLNT-TREE-N'})
        # proposed shade trees in the yards (owner 2026-10-02)
        from shapely.geometry import Point as _Pt
        for t in (self.s.get('extras') or {}).get('yardTrees') or []:
            at = _Pt(t['point'][0], t['point'][1])
            # owner 2026-10-02: no tree on a lot number / area block -- slide the
            # tree straight away from the block, staying on its lot, until clear
            for blk, lotp in getattr(self, '_label_blocks', []):
                if not lotp.contains(at) or at.buffer(7.5).disjoint(blk): continue
                bc = blk.centroid
                ux, uy = at.x - bc.x, at.y - bc.y
                L = math.hypot(ux, uy) or 1.0
                ux, uy = ux / L, uy / L
                for step in range(1, 40):
                    q = _Pt(at.x + ux * step, at.y + uy * step)
                    if q.buffer(7.5).disjoint(blk) and lotp.buffer(-4).contains(q):
                        at = q; break
            self.msp.add_blockref('TREE', (at.x, at.y), dxfattribs={'layer': 'L-PLNT-TREE-N'})
        for f in self.of('ProposedFeature', type='street light'):
            p = f.get('point')
            if p: self.msp.add_blockref('LIGHT', (p[0], p[1]), dxfattribs={'layer': 'E-LITE-N'})

    def stormwater(self):
        for f in self.of('DrainageArea'):
            self.pl(_ring(f), 'C-SWM-DRAN-N', close=True)
        for f in self.of('SWMPractice'):
            r = _ring(f)
            self.pl(r, 'C-SWM-ESD-N', close=True)
            self.fill(r, 'C-SWM-ESD-N', pattern='GRASS', scale=PAT * 0.5)
        for row in self.s['bmp']['rows']:
            p = row['at']
            self.mtext(f"{row['bmp']} ({row['mdeCode']})\\PESDv {row['esdvReqCf']:,} CF REQ / {row['esdvProvCf']:,} PROV\\P→ {row['poi']}",
                       (p[0] + 14, p[1] + 10), 0.06, 'C-SWM-ANNO', attach=7)
        poi = self.s['poi']
        for p in poi['pois']:
            self.msp.add_blockref('POI', tuple(p['at']), dxfattribs={'layer': 'C-SWM-POI'})
            self.text(p['id'], (p['at'][0] + 8, p['at'][1] - 8), 0.1, 'C-SWM-POI', align=TextEntityAlignment.TOP_LEFT, bold=True)
        for o in poi['overflow']:
            ln = [(q[0], q[1]) for q in o['line']]
            # simplify the staircase of cell centres
            from shapely.geometry import LineString
            ls = LineString(ln).simplify(4.0)
            pts = list(ls.coords)
            self.pl(pts, 'C-SWM-FLOW')
            if len(pts) >= 2:
                a, b = pts[-2], pts[-1]
                L = math.dist(a, b) or 1; ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
                self.pl([(b[0] - ux * 5 - uy * 2, b[1] - uy * 5 + ux * 2), b, (b[0] - ux * 5 + uy * 2, b[1] - uy * 5 - ux * 2)], 'C-SWM-FLOW')
        cells = poi.get('offsiteCells') or []
        if cells:
            from shapely.geometry import Point
            from shapely.ops import unary_union
            cf = poi.get('cellFt', 5)
            g = unary_union([Point(c).buffer(cf * 0.72, cap_style=3) for c in cells]).simplify(3)
            for pg in (g.geoms if hasattr(g, 'geoms') else [g]):
                if pg.geom_type == 'Polygon' and pg.area > 400:
                    self.pl(list(pg.exterior.coords), 'C-SWM-OFFS', close=True)
            big = max((g.geoms if hasattr(g, 'geoms') else [g]), key=lambda x: x.area)
            rp = big.representative_point()
            self.mtext(f"OFF-SITE DRAINAGE AREA\\P{poi['offsiteAreaSqFt'] / 43560:.2f} AC", (rp.x, rp.y), 0.07, 'C-SWM-ANNO')

    def sediment(self):
        ex = self.s.get('extras') or {}
        site_lod = ex.get('siteLod') or []
        if site_lod:
            # one L.O.D. around the whole development: bold black dashed, 'LOD' lettered
            # in gaps left in the line every ~90 ft (Yocum convention). The line is
            # broken at each label rather than masked: the PDF plotter ignores masks.
            GAP = th(0.10) * 3 * 0.9 + 3.0               # label width (3 chars) + clearance, ft
            for r in site_lod:
                r = [(p[0], p[1]) for p in r]
                ring = r + [r[0]]
                cum = [0.0]
                for i in range(1, len(ring)): cum.append(cum[-1] + math.dist(ring[i - 1], ring[i]))
                total = cum[-1]

                def at(s):
                    i = 0
                    while i < len(ring) - 2 and cum[i + 1] < s: i += 1
                    L = (cum[i + 1] - cum[i]) or 1
                    t = (s - cum[i]) / L
                    p, q = ring[i], ring[i + 1]
                    return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t), (p, q)

                labels = [s for s in [45.0 + 90.0 * k for k in range(int(total // 90.0) + 1)] if s < total - GAP]
                cuts, s0 = [], 0.0
                for s in labels:
                    cuts.append((s0, s - GAP / 2)); s0 = s + GAP / 2
                cuts.append((s0, total))
                # dashes drawn as geometry (12-ft dash / 6-ft gap = 0.4" / 0.2" at 1" = 30'):
                # the PDF plotter does not apply linetypes inside viewports
                DASH, SKIP = 12.0, 6.0
                for a, b in cuts:
                    if b - a < 1: continue
                    s = a
                    while s < b:
                        e = min(b, s + DASH)
                        pts = [at(s)[0]] + [ring[i] for i in range(len(ring)) if s < cum[i] < e] + [at(e)[0]]
                        self.pl(pts, 'C-ESC-LOD', linetype='CONTINUOUS')
                        s = e + SKIP
                for s in labels:
                    pt, (p, q) = at(s)
                    self.text('LOD', pt, 0.10, 'C-ESC-ANNO', angle=_text_angle(p, q), bold=True, fixed=True)
            area = ex.get('siteLodSqFt')
            if area:
                c = _centroid([(p[0], p[1]) for p in max(site_lod, key=len)])
        else:
            for f in self.of('LimitOfDisturbance'):
                self.pl(_ring(f), 'C-ESC-LOD', close=True)
        # super silt fence on the down-gradient side of the L.O.D.
        for run in ex.get('siltFence') or []:
            run = [(p[0], p[1]) for p in run]
            self.pl(run, 'C-ESC-SILT')
            for i in range(0, len(run) - 1, max(1, len(run) // 4)):
                p, q = run[i], run[i + 1]
                if math.dist(p, q) > 25:
                    nx, ny = -(q[1] - p[1]) / math.dist(p, q), (q[0] - p[0]) / math.dist(p, q)
                    self.text('SSF', ((p[0] + q[0]) / 2 + nx * 3, (p[1] + q[1]) / 2 + ny * 3), 0.055, 'C-ESC-ANNO', angle=_text_angle(p, q), bold=True)
        sce = ex.get('constructionEntrance')
        if sce:
            r = [(p[0], p[1]) for p in sce]
            self.pl(r, 'C-ESC-SCE', close=True)
            self.fill(r, 'C-ESC-SCE', pattern='GRAVEL', scale=PAT * 0.5)
            self.mtext("STABILIZED CONSTRUCTION ENTRANCE (MDE B-1)\\PFULL JENNIFER DR APRON + 30' INTO ESTATES CT; 50' MIN. TOTAL TRAVEL LENGTH\\P6\" MIN. 2\"-3\" AGGREGATE ON NONWOVEN GEOTEXTILE; INSTALL BEFORE PERMANENT PAVING\\PTEMP. PIPE UNDER SCE WHERE FLOW CROSSES; SIZE FOR 2-YR STORM, 6\" MIN.", _centroid(r), 0.052, 'C-ESC-ANNO', width_in=2.2, bold=True)
        for f in self.of('ProposedFeature'):
            a = f.get('attributes') or {}
            ty = str(a.get('type', ''))
            if 'silt fence' in ty.lower():
                r = _ring(f) or _line(f)
                self.pl(r, 'C-ESC-SILT', close=bool(_ring(f)))
            elif 'construction entrance' in ty.lower() and not sce:
                r = _ring(f)
                self.pl(r, 'C-ESC-SCE', close=True)
                self.fill(r, 'C-ESC-SCE', pattern='GRAVEL', scale=PAT * 0.5)
                c = _centroid(r)
                self.text('S.C.E.', c, 0.08, 'C-ESC-ANNO', bold=True)

    def grid(self):
        tx = [p[0] for p in self.s['tract']]; ty = [p[1] for p in self.s['tract']]
        pts = []
        for x in range(int(min(tx) // 200 * 200), int(max(tx)) + 200, 200):
            for y in range(int(min(ty) // 200 * 200), int(max(ty)) + 200, 200):
                pts.append((x, y))
        from shapely.geometry import Polygon, Point
        t = Polygon(self.s['tract']).buffer(40)
        chosen = [p for p in pts if t.contains(Point(p))][:3] or pts[:3]
        for x, y in chosen:
            self.pl([(x - 6, y), (x + 6, y)], 'V-GRID'); self.pl([(x, y - 6), (x, y + 6)], 'V-GRID')
            self.mtext(f"N {y:,.0f}\\PE {x:,.0f}", (x + 3, y + 3), 0.055, 'V-GRID', attach=7)
        self.grid_pts = chosen

    def vicinity(self):
        path = self.s['extras'].get('vicinityStreetsFile')
        if not path: return
        try:
            v = json.load(open(path))
        except Exception:
            return
        named = set()
        for f in v.get('features', []):
            a = f.get('attributes') or {}
            fcc = a.get('FCC') or ''
            major = fcc[:2] in ('A1', 'A2', 'A3')
            nm = (a.get('FULLNAME') or '').strip()
            for p in (f.get('geometry') or {}).get('paths', []):
                pts = [(q[0], q[1]) for q in p]
                e = self.msp.add_lwpolyline(pts, dxfattribs={'layer': 'V-VICN', 'lineweight': 50 if major else 13})
                if nm and major and nm not in named and len(pts) > 2:
                    L = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
                    if L > 1500:
                        named.add(nm)
                        i = len(pts) // 2
                        t = self.msp.add_text(nm, height=180, rotation=_text_angle(pts[i - 1], pts[i]),
                                              dxfattribs={'layer': 'V-VICN', 'style': 'KEALEE-B'})
                        t.set_placement(pts[i], align=TextEntityAlignment.BOTTOM_CENTER)
        tract = [(p[0], p[1]) for p in self.s['tract']]
        h = self.msp.add_hatch(color=1, dxfattribs={'layer': 'V-VICN'})
        h.paths.add_polyline_path(tract, is_closed=True)
