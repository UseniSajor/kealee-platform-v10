"""
Paper space: the sheets. Units are inches on a 36 x 24 in (ARCH D) sheet.

Layout follows the County-approved Yocum Property technical plans
(15919-2020 / 15927-2020), left to right:
  left column   0.5 ..  3.5   ePlan stamp space 3 x 3 in at the top (kept blank),
                              legend and key map below it
  drawing area  3.75 .. 32.85 plan viewport over a band of tables / notes; the
                              band stops at 27.85 — under the viewport's right
                              end sit the PE certification and the 5 x 3 in
                              County approval block (ePlan 5-in right margin,
                              checklist A-3)
  title strip  33.1 .. 35.5   vertical title block: engineer, project, revisions,
                              sheet title, date / scale / sheet N OF M
"""
import math
import os
import textwrap
from ezdxf.enums import TextEntityAlignment

from .style import SHEET_LAYERS, LAYERS

W, H, M = 36.0, 24.0, 0.5
TS_W = 2.4                              # vertical title strip
TS_X = W - M - TS_W                     # 33.1
RC_W = 5.0                              # ePlan right margin: County approval block + PE certification
RC_X = TS_X - RC_W                      # 28.1
LC_W = 3.0                              # left column: ePlan stamp, legend, key map
STAMP = 3.0
DRAW_X0, DRAW_X1 = M + LC_W + 0.25, TS_X - 0.25
BAND_X1 = RC_X - 0.25                   # the band under the viewport stops short of the approval block
CW = 0.74                               # Arial caps average char width / height (with margin)

MISS_UTILITY_NOTE = (
    'Information concerning existing underground utilities was obtained from available records. The contractor must field verify '
    'the exact locations and elevations as required for applicable horizontal and vertical clearances by digging test pits by hand, '
    'well in advance of excavation. Contact "Miss Utility" at 1-800-257-7777 (811), 48 hours prior to the start of any excavation. '
    'Provide results of test pits to the design engineer and coordinate with the engineer, owner/developer and utility company before '
    'proceeding with construction to resolve any conflicts or clearances with other utilities, storm drains, grading or other improvements.')
STABILIZATION_NOTE = (
    'Stabilization practices on all projects must be in compliance with the requirements of COMAR 26.17.01.08 G. Following initial soil '
    'disturbance or re-disturbance, permanent or temporary stabilization must be completed within: three (3) calendar days as to the '
    'surface of all perimeter dikes, swales, ditches, perimeter slopes and all slopes steeper than 3 horizontal to 1 vertical (3:1); and '
    'seven (7) calendar days as to all other disturbed or graded areas on the project site not under active grading.')
CERTIFICATIONS = [
    ('GRADING CERTIFICATION',
     "I hereby certify that this plan conforms to the requirements of Subtitle 32, Division 2 of the Code of Prince George's County "
     '(Water Resources Protection and Grading Code), and that drainage flows from uphill properties onto this site, and from this site '
     'onto downhill properties, have been addressed in substantial accordance with applicable codes. Signed, sealed and dated by a '
     'professional engineer licensed in the State of Maryland.'),
    ('UTILITY CERTIFICATE',
     'I hereby certify, to the best of my professional knowledge, information and belief, that the existing and/or proposed underground '
     'utility information shown hereon has been correctly duplicated from utility company records. Furthermore, this project has been '
     'carefully coordinated with each involved utility and information relative to this plan has been solicited from them.'),
    ('CERTIFICATION OF COMPLIANCE',
     'I certify that these plans represent a practicable and workable plan based on my personal knowledge of the site, and that this '
     "plan was prepared in accordance with the requirements of the Prince George's County Design Manual and Standard Specifications "
     'and other jurisdictional federal and state permits.'),
]


def _txt(ps, s, x, y, h, bold=False, align=TextEntityAlignment.TOP_LEFT, layer='G-ANNO-TEXT', rot=0):
    t = ps.add_text(str(s), height=h, rotation=rot, dxfattribs={'layer': layer, 'style': 'KEALEE-B' if bold else 'KEALEE'})
    t.set_placement((x, y), align=align)
    return t


def _box(ps, x0, y0, x1, y1, layer='G-ANNO-TTLB', lw=None):
    kw = {'layer': layer}
    if lw is not None: kw['lineweight'] = lw
    ps.add_lwpolyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], close=True, dxfattribs=kw)


def _vtxt(ps, s, x, y, h, bold=False, align=TextEntityAlignment.MIDDLE_CENTER, layer='G-ANNO-TEXT'):
    """Text turned 90 degrees (reads bottom to top), as the title strip carries it."""
    return _txt(ps, s, x, y, h, bold=bold, align=align, layer=layer, rot=90)


def _line(ps, a, b, layer='G-ANNO-TABL', lw=None):
    kw = {'layer': layer}
    if lw is not None: kw['lineweight'] = lw
    ps.add_line(a, b, dxfattribs=kw)


def _wrap(s, width_in, h):
    n = max(8, int(width_in / (h * CW)))
    out = []
    for para in str(s).split('\n'):
        out += textwrap.wrap(para, n) or ['']
    return out


def paragraphs(ps, x, y, width, title, items, h=0.085, numbered=True):
    """Numbered notes, wrapped to the width. Returns the y below the block."""
    _txt(ps, title, x, y, h * 1.3, bold=True)
    y -= h * 2.0
    for i, it in enumerate(items, 1):
        lines = _wrap(it, width - 0.25, h)
        for k, ln in enumerate(lines):
            _txt(ps, (f'{i}.' if (k == 0 and numbered) else ''), x, y, h)
            _txt(ps, ln, x + 0.25, y, h)
            y -= h * 1.4
        y -= h * 0.4
    return y


def table(ps, x, y, title, columns, rows, h=0.08, max_col_in=None, max_width=None, bold_last=False, wrap_cols=None):
    """
    A drafted table sized to its content: every column as wide as its longest
    entry (capped, with wrapping), every row as tall as its wrapped lines.
    Returns (bottom y, width).
    """
    wrap_cols = wrap_cols or {}
    ncol = len(columns)
    pad = 0.06
    widths = []
    for c in range(ncol):
        cells = [str(r[c]) if c < len(r) else '' for r in rows]
        # headers are drawn bold, which runs ~30% wider than the body face
        w = max([len(s) * h * CW for s in cells] + [len(str(columns[c])) * h * 0.95 * CW * 1.3]) + 2 * pad
        cap = wrap_cols.get(c) or max_col_in
        if cap: w = min(w, cap)
        widths.append(max(w, 0.35))
    if max_width and sum(widths) > max_width:
        # shrink the widest wrapping columns first
        over = sum(widths) - max_width
        for c in sorted(range(ncol), key=lambda c: -widths[c]):
            take = min(over, widths[c] - 0.8)
            if take > 0: widths[c] -= take; over -= take
            if over <= 0: break
    total = sum(widths)
    if title:
        _txt(ps, title, x, y, h * 1.3, bold=True)
        y -= h * 1.9
    def cell_lines(s, c):
        return _wrap(s, widths[c] - 2 * pad, h)
    # header
    hl = [cell_lines(columns[c], c) for c in range(ncol)]
    hh = max(len(l) for l in hl) * h * 1.35 + pad
    top = y
    ps.add_lwpolyline([(x, y), (x + total, y), (x + total, y - hh), (x, y - hh)], close=True, dxfattribs={'layer': 'G-ANNO-TABL'})
    hatch = ps.add_hatch(dxfattribs={'layer': 'G-ANNO-TABL'})
    hatch.set_solid_fill(color=7); hatch.rgb = (225, 225, 225)
    hatch.paths.add_polyline_path([(x, y), (x + total, y), (x + total, y - hh), (x, y - hh)], is_closed=True)
    cx = x
    for c in range(ncol):
        for k, ln in enumerate(hl[c]):
            _txt(ps, ln, cx + pad, y - pad - k * h * 1.35, h * 0.95, bold=True)
        cx += widths[c]
    y -= hh
    for ri, r in enumerate(rows):
        ls = [cell_lines(r[c] if c < len(r) else '', c) for c in range(ncol)]
        rh = max(len(l) for l in ls) * h * 1.35 + pad
        cx = x
        for c in range(ncol):
            for k, ln in enumerate(ls[c]):
                _txt(ps, ln, cx + pad, y - pad - k * h * 1.35, h, bold=(bold_last and ri == len(rows) - 1))
            cx += widths[c]
        y -= rh
        _line(ps, (x, y), (x + total, y))
    cx = x
    for c in range(ncol + 1):
        _line(ps, (cx, top), (cx, y))
        if c < ncol: cx += widths[c]
    _box(ps, x, y, x + total, top, layer='G-ANNO-TABL', lw=35)
    return y, total


def bar_scale(ps, x, y, ft_per_in, total_ft):
    step = total_ft / 4
    for k in range(4):
        x0 = x + k * step / ft_per_in
        pts = [(x0, y), (x0 + step / ft_per_in, y), (x0 + step / ft_per_in, y + 0.07), (x0, y + 0.07)]
        ps.add_lwpolyline(pts, close=True, dxfattribs={'layer': 'G-ANNO-TEXT'})
        if k % 2 == 0:
            ps.add_hatch(color=7, dxfattribs={'layer': 'G-ANNO-TEXT'}).paths.add_polyline_path(pts, is_closed=True)
        _txt(ps, f'{int(k * step)}', x0, y - 0.04, 0.07, align=TextEntityAlignment.TOP_CENTER)
    _txt(ps, f'{int(total_ft)} FT', x + total_ft / ft_per_in, y - 0.04, 0.07, align=TextEntityAlignment.TOP_CENTER)
    _txt(ps, f'GRAPHIC SCALE  1" = {ft_per_in:,.0f}\'', x, y + 0.13, 0.09, bold=True, align=TextEntityAlignment.BOTTOM_LEFT)


class Sheets:
    def __init__(self, doc, sheetset, model):
        self.doc = doc
        self.s = sheetset
        self.m = model
        self.sheets = sheetset['sheets']
        tx = [p[0] for p in sheetset['tract']]; ty = [p[1] for p in sheetset['tract']]
        self.site_c = ((min(tx) + max(tx)) / 2, (min(ty) + max(ty)) / 2)
        # the plan view: the site plus MD 210's full width to the west and the
        # Jennifer Drive frontage to the north
        self.plan_c = ((min(tx) - 140 + max(tx) + 60) / 2, (min(ty) - 10 + max(ty) + 80) / 2)
        self.site_bb = (min(tx), min(ty), max(tx), max(ty))

    # ── frame, title strip, right and left columns ─────────────────────────
    def frame(self, ps, sheet, idx):
        _box(ps, M, M, W - M, H - M, lw=70)
        self.title_strip(ps, sheet, idx)
        self.right_column(ps)
        self.left_column(ps, sheet)

    def right_column(self, ps):
        """ePlan 5-in right margin: the County approval block (5 x 3 in, kept blank)
        and, above it, the professional certification with the seal."""
        p = self.s.get('project') or {}
        _box(ps, RC_X, M, TS_X, M + 3.0, lw=35)
        _txt(ps, "RESERVED FOR PRINCE GEORGE'S COUNTY DPIE APPROVAL", RC_X + RC_W / 2, M + 2.85, 0.09, bold=True,
             align=TextEntityAlignment.TOP_CENTER)
        _txt(ps, '5" x 3" — KEEP BLANK (ePLAN 5" RIGHT MARGIN, CHECKLIST A-3)', RC_X + RC_W / 2, M + 2.68, 0.065,
             align=TextEntityAlignment.TOP_CENTER)
        y0, y1 = M + 3.1, M + 4.5
        _box(ps, RC_X, y0, TS_X, y1, lw=35)
        cert = ('I hereby certify that these documents were prepared or approved by me, and that I am a duly licensed professional '
                'engineer under the laws of the State of Maryland. License No. ________  Expiration date: ________')
        y = y1 - 0.1
        for w_ in _wrap(cert, RC_W - 1.6, 0.065):
            _txt(ps, w_, RC_X + 0.1, y, 0.065); y -= 0.095
        _txt(ps, p.get('status', 'NOT SEALED — DRAFT'), RC_X + 0.1, y0 + 0.12, 0.075, bold=True, align=TextEntityAlignment.BOTTOM_LEFT)
        r = (y1 - y0) / 2 - 0.08
        ps.add_circle((TS_X - r - 0.12, (y0 + y1) / 2), r, dxfattribs={'layer': 'G-ANNO-TTLB'})
        _txt(ps, 'SEAL', TS_X - r - 0.12, (y0 + y1) / 2, 0.08, align=TextEntityAlignment.MIDDLE_CENTER)

    def left_column(self, ps, sheet):
        """ePlan stamp space at the top left (3 x 3 in, kept blank); key map and north arrow at the foot."""
        _box(ps, M, H - M - STAMP, M + STAMP, H - M, lw=35)
        _txt(ps, 'RESERVED FOR COUNTY ePLAN STAMP', M + STAMP / 2, H - M - 0.12, 0.075, bold=True, align=TextEntityAlignment.TOP_CENTER)
        _txt(ps, '3" x 3" — KEEP BLANK', M + STAMP / 2, H - M - 0.26, 0.065, align=TextEntityAlignment.TOP_CENTER)
        _line(ps, (M + LC_W, M), (M + LC_W, H - M - STAMP), layer='G-ANNO-TTLB')
        if sheet.get('kind') == 'cover':
            return
        x0 = M + 0.15
        _txt(ps, 'KEY MAP', x0, M + 2.25, 0.075, bold=True)
        self.key_map(ps, x0, M + 0.2, LC_W - 0.3 - 0.7, 1.9, sheet)
        ps.add_blockref('NORTH', (M + LC_W - 0.4, M + 1.0), dxfattribs={'layer': 'G-ANNO-TTLB'})

    def title_strip(self, ps, sheet, idx):
        """The vertical title block down the right edge, read with the sheet turned:
        engineer at the top, then the project, revisions, sheet title, and
        date / scale / sheet number at the foot."""
        p = self.s.get('project') or {}
        x0, x1 = TS_X, W - M
        _box(ps, x0, M, x1, H - M, lw=50)
        cuts = [M, M + 2.7, M + 7.3, M + 10.3, M + 16.9, H - M]
        for y in cuts[1:-1]:
            _line(ps, (x0, y), (x1, y), layer='G-ANNO-TTLB', lw=35)

        def stack(lines, ya, yb, x=None):
            """Rotated lines across the strip, left to right, centred along the segment."""
            seg = yb - ya - 0.3
            x = x if x is not None else x0 + 0.12
            for s_, h, bold in lines:
                for w_ in _wrap(s_, seg, h):
                    x += h * 0.75
                    _vtxt(ps, w_, x, (ya + yb) / 2, h, bold=bold)
                    x += h * 0.75
            return x

        # engineer
        eng = str(p.get('engineer', ''))
        firm, _, rest = eng.partition(' — ')
        stack([(firm or 'ENGINEER OF RECORD', 0.24, True), (rest, 0.1, False),
               (f"PREPARED WITH {p.get('preparedWith', 'KEALEE')}", 0.065, False)], cuts[4], cuts[5])
        # project
        name, _, lots = str(p.get('project', '')).partition(' — ')
        n = len(self.s['twin'].get('projectLots') or [])
        lots = f'LOTS 1 THRU {n}' if n else lots
        street = ((self.s.get('extras') or {}).get('proposedStreet') or {}).get('name', '')
        stack([(name, 0.3, True), (p.get('planType', 'SITE DEVELOPMENT CONCEPT PLAN'), 0.15, True),
               (f"{lots}{' & ' + street.upper() if street else ''}", 0.2, False),
               (p.get('districts', ''), 0.08, False), (p.get('location', ''), 0.08, False), (p.get('record', ''), 0.08, False),
               (f"OWNER: {p.get('owner', '')}", 0.065, False)], cuts[3], cuts[4])
        # revisions: one strip per row, DATE at the foot, DESCRIPTION above
        ya, yb = cuts[2], cuts[3]
        yd = ya + 0.9
        _vtxt(ps, 'REVISIONS', x0 + 0.2, (ya + yb) / 2, 0.13, bold=True)
        strips = [('DATE', 'DESCRIPTION', True), (p.get('date', ''), 'CONCEPT SUBMISSION 1', False), ('', '', False), ('', '', False), ('', '', False)]
        xs = x0 + 0.38
        wst = (x1 - xs) / len(strips)
        _line(ps, (xs, ya), (xs, yb), layer='G-ANNO-TTLB')
        _line(ps, (xs, yd), (x1, yd), layer='G-ANNO-TABL')
        for k, (d, desc, hdr) in enumerate(strips):
            cx = xs + wst * (k + 0.5)
            if d: _vtxt(ps, d, cx, (ya + yd) / 2, 0.075, bold=hdr)
            if desc: _vtxt(ps, desc, cx, (yd + yb) / 2, 0.075, bold=hdr)
            _line(ps, (xs + wst * (k + 1), ya), (xs + wst * (k + 1), yb), layer='G-ANNO-TABL')
        # sheet title + drawn / designed / checked
        ya, yb = cuts[1], cuts[2]
        _vtxt(ps, 'TITLE:', x0 + 0.1, yb - 0.1, 0.065, align=TextEntityAlignment.MIDDLE_RIGHT)
        xe = stack([(sheet['title'], 0.17, True)], ya, yb, x=x0 + 0.15)
        _vtxt(ps, sheet['id'], xe + 0.3, (ya + yb) / 2, 0.36, bold=True)
        xr = x1 - 0.75
        _line(ps, (xr, ya), (xr, yb), layer='G-ANNO-TTLB')
        for k, (lab, val) in enumerate((('DRAWN:', 'KEALEE CAD-PLOT'), ('DESIGNED:', p.get('designedBy', '')), ('CHECKED:', p.get('checkedBy', '')))):
            cx = xr + 0.125 + 0.25 * k
            _vtxt(ps, lab, cx, ya + 0.1, 0.06, align=TextEntityAlignment.MIDDLE_LEFT)
            _vtxt(ps, val, cx, ya + 0.85, 0.07, align=TextEntityAlignment.MIDDLE_LEFT)
            if k: _line(ps, (cx - 0.125, ya), (cx - 0.125, yb), layer='G-ANNO-TABL')
        # date / scale / sheet
        ya, yb = cuts[0], cuts[1]
        sc = sheet.get('scaleFtPerIn')
        cells = [('DATE:', p.get('date', '')), ('SCALE:', f'1" = {sc:.0f}\'' if sc else 'AS NOTED'), ('SHEET:', f'{idx + 1} OF {len(self.sheets)}')]
        wc = TS_W / 3
        for k, (lab, val) in enumerate(cells):
            cx = x0 + wc * (k + 0.5)
            _vtxt(ps, lab, cx - wc * 0.25, ya + 0.1, 0.065, align=TextEntityAlignment.MIDDLE_LEFT)
            _vtxt(ps, val, cx + 0.08, (ya + yb) / 2 + 0.2, 0.2, bold=True)
            if k: _line(ps, (x0 + wc * k, ya), (x0 + wc * k, yb), layer='G-ANNO-TABL')

    def key_map(self, ps, x, y, w, h, sheet):
        bx0, by0, bx1, by1 = self.site_bb
        s = min(w / (bx1 - bx0 + 80), h / (by1 - by0 + 80))
        ox = x + (w - (bx1 - bx0) * s) / 2; oy = y + (h - (by1 - by0) * s) / 2
        T = lambda p: (ox + (p[0] - bx0) * s, oy + (p[1] - by0) * s)
        for f in self.s['twin']['features']:
            if f.get('kind') == 'Parcel':
                r = (f.get('ring') or {}).get('coordinates') or []
                if len(r) > 2:
                    ps.add_lwpolyline([T(q) for q in r], close=True, dxfattribs={'layer': 'G-ANNO-TABL', 'lineweight': 13})
        ps.add_lwpolyline([T(q) for q in self.s['tract']], close=True, dxfattribs={'layer': 'G-ANNO-TTLB', 'lineweight': 35})
        _box(ps, x, y, x + w, y + h, layer='G-ANNO-TABL')

    # ── plan viewport ──────────────────────────────────────────────────────
    def viewport(self, ps, kind, x0, y0, x1, y1, scale, centre=None):
        cx, cy = centre or self.site_c
        vp = ps.add_viewport(center=((x0 + x1) / 2, (y0 + y1) / 2), size=(x1 - x0, y1 - y0),
                             view_center_point=(cx, cy), view_height=(y1 - y0) * scale, dxfattribs={'layer': 'G-VPRT'})
        keep = set(SHEET_LAYERS.get(kind, [])) if kind != 'vicinity' else {'V-VICN'}
        vp.frozen_layers = [n for n in LAYERS if n not in keep and not n.startswith('G-')]
        return vp

    def legend(self, ps, x, y, kind, h=0.095):
        entries = {
            'existing': [('V-PROP-BNDY', 'Boundary of record (plat PM 228 @ 83)'), ('V-PROP-LOTS', 'Lot line'),
                         ('V-PROP-ADJN', 'Adjoining property'), ('V-BLDG-E', 'Existing building (county 2023 footprint)'), ('C-TOPO-MAJR-E', 'Existing contour, 10-ft (NAVD 88)'),
                         ('C-TOPO-MINR-E', 'Existing contour, 2-ft'), ('C-ROAD-EDGE-E', 'Existing edge of road'),
                         ('C-ROAD-ROWL-E', 'Existing right-of-way'),
                         ('C-ENVR-SOIL-E', 'Soil boundary (USDA NRCS)'), ('C-ENVR-WOOD-E', 'Mapped woody vegetation (field verify)'), ('V-ESMT', 'Easement')],
            'layout': [('V-PROP-BNDY', 'Boundary of record'), ('C-ROAD-ROWL-N', 'Estates Ct right-of-way'),
                       ('C-ROAD-PVMT-N', 'Proposed pavement'), ('C-ROAD-SWAL-N', 'Roadside swale (flowline)'),
                       ('C-STRM-CULV-N', 'Driveway culvert, 15" RCP w/ end sections'), ('C-BLDG-FTPR-N', 'Proposed dwelling'),
                       ('V-PROP-BRL', 'Building restriction line'), ('C-TOPO-MAJR-N', 'Proposed contour'),
                       ('C-TOPO-MINR-E', 'Existing contour'), ('C-TOPO-SPOT-N', 'Spot elevation (NAVD 88)'),
                       ('C-ESC-LOD', 'Limit of disturbance'), ('C-ROAD-SIGHT-N', 'Jennifer Dr sight-distance line'),
                       ('E-LITE-N', 'Street light (LED)')],
            'utility': [('C-WATR-MAIN-N', 'Proposed 8" water main'), ('C-SSWR-MAIN-N', 'Proposed 8" sanitary sewer'),
                        ('C-WATR-SVCS-N', '1" water house connection (W.H.C.)'), ('C-SSWR-SVCS-N', '4" sewer house connection (S.H.C.)'),
                        ('V-ESMT', 'WSSC easement (recorded / proposed)'),
                        ('L-PLNT-TREE-N', 'Street tree — Red Maple'), ('E-LITE-N', 'Street light (LED)')],
            'swm': [('C-SWM-ESD-N', 'ESD practice — micro-bioretention (M-6)'), ('C-ROAD-SWAL-N', 'Roadside dry swale (M-8)'),
                    ('C-SWM-DRAN-N', 'Drainage area to practice'), ('C-SWM-OFFS', 'Off-site area draining onto site'),
                    ('C-SWM-FLOW', '100-yr overflow path'), ('C-SWM-POI', 'Point of investigation'),
                    ('C-STRM-CULV-N', 'Driveway culvert')],
            'esc': [('C-ESC-LOD', 'Limit of disturbance'), ('C-ESC-SILT', 'Super silt fence'),
                    ('C-ESC-SCE', 'Stabilized construction entrance'), ('C-TOPO-MAJR-N', 'Proposed contour'),
                    ('C-TOPO-MINR-E', 'Existing contour')],
        }.get(kind, [])
        _txt(ps, 'LEGEND', x, y, h * 1.3, bold=True); y -= h * 2
        for lay, lbl in entries:
            aci, lt, lw = LAYERS[lay]
            ps.add_line((x, y - h / 2), (x + 0.55, y - h / 2), dxfattribs={'layer': lay, 'lineweight': lw, 'linetype': lt,
                                                                          'ltscale': 1.0 / 12.0 * 0.4})
            for w_ in _wrap(lbl, LC_W - 0.95, h):
                _txt(ps, w_, x + 0.65, y, h)
                y -= h * 1.4
            y -= h * 0.3
        return y

    # ── the sheets ─────────────────────────────────────────────────────────
    def build(self):
        layouts = []
        for i, sh in enumerate(self.sheets):
            ps = self.doc.layouts.new(sh['id'])
            ps.page_setup(size=(W, H), margins=(0, 0, 0, 0), units='inch')
            self.frame(ps, sh, i)
            getattr(self, f"sheet_{sh['kind']}", self.sheet_plan)(ps, sh)
            layouts.append(ps)
        return layouts

    def band_top(self):
        return 5.1

    def plan_title(self, ps, sh):
        _txt(ps, f"{sh['title']}", DRAW_X0, H - M - 0.15, 0.2, bold=True)

    def sheet_plan(self, ps, sh):
        self.plan_title(ps, sh)
        sc = sh.get('scaleFtPerIn', 30)
        top = H - M - 0.55
        ctr = (self.plan_c[0], self.plan_c[1] + 40) if sh['kind'] == 'swm' else self.plan_c   # DA map: whole contributing area to the divide
        self.viewport(ps, sh['kind'], DRAW_X0, self.band_top(), DRAW_X1, top, sc, centre=ctr)
        _box(ps, DRAW_X0, self.band_top(), DRAW_X1, top, layer='G-ANNO-TABL')
        bar_scale(ps, DRAW_X0 + 0.15, self.band_top() + 0.25, sc, 200)
        self.legend(ps, M + 0.15, H - M - STAMP - 0.2, sh['kind'], h=0.08)
        # the band: sheet tables and notes, then the standard notes column
        y0 = self.band_top() - 0.15
        self.std_notes(ps, self.band_x1() + 0.3, y0, BAND_X1 - self.band_x1() - 0.3)
        return DRAW_X0, y0

    def band_x1(self):
        # right edge of the sheet's own band content; the standard notes take the rest
        return BAND_X1 - 4.6

    def std_notes(self, ps, x, y, w, owner=True):
        """The notes every approved sheet carries: Miss Utility, stabilization, owner/developer."""
        y = paragraphs(ps, x, y, w, 'MISS UTILITY NOTE', [MISS_UTILITY_NOTE], h=0.07, numbered=False)
        y = paragraphs(ps, x, y - 0.05, w, 'STABILIZATION NOTE', [STABILIZATION_NOTE], h=0.07, numbered=False)
        if owner:
            p = self.s.get('project') or {}
            lines = _wrap(p.get('owner', ''), w - 0.2, 0.08)
            top = y - 0.05
            _txt(ps, 'OWNER / DEVELOPER', x + 0.1, top - 0.08, 0.085, bold=True)
            yy = top - 0.26
            for ln in lines:
                _txt(ps, ln, x + 0.1, yy, 0.08); yy -= 0.12
            _box(ps, x, yy - 0.02, x + w, top, layer='G-ANNO-TABL', lw=35)
            y = yy - 0.1
        return y

    def sheet_existing(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        t = self.s['tables']['soils']
        _, w = table(ps, x, y0, t['title'], t['columns'], t['rows'], h=0.09, wrap_cols={1: 3.4})
        x += w + 0.3
        env = [[r['id'], r['status'], r['comment']] for r in self.s['checklist']['rows'] if r['id'].startswith('B-')]
        table(ps, x, y0, 'ENVIRONMENTAL FEATURES — DPIE CHECKLIST B', ['ITEM', 'C/X/O', 'FINDING'], env, h=0.075,
              wrap_cols={2: self.band_x1() - x - 1.2})

    def sheet_layout(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        t = self.s['tables']['buildings']
        yb, w = table(ps, x, y0, t['title'], t['columns'], t['rows'], h=0.095)
        z = self.s['tables'].get('zoningCompliance')
        if z:
            yb, wz = table(ps, x, yb - 0.18, z['title'], z['columns'], z['rows'], h=0.066)
            if z.get('note'):
                _txt(ps, z['note'], x, yb - 0.05, 0.052)
                yb -= 0.14
            w = max(w, wz)
        note = self.s['extras'].get('roadImprovementsNote')
        sd = (self.s.get('extras') or {}).get('sightDistance')
        if sd:
            yb, w2 = table(ps, x, yb - 0.2, f"INTERSECTION SIGHT DISTANCE AT {sd.get('road', 'JENNIFER DRIVE')} — DESIGN SPEED {sd['designSpeedMph']} MPH",
                           ['CASE (AASHTO 2018, 9.5.3)', 't_g (s)', 'ISD REQ. (FT)'],
                           [[l['case'], f"{l['tgS']}", f"{l['isdFt']:.0f}"] for l in sd['lines']] + [['STOPPING SIGHT DISTANCE (TABLE 3-1)', '—', f"{sd['ssdFt']:.0f}"]], h=0.075)
            _txt(ps, sd['note'], x, yb - 0.06, 0.06)
            w = max(w, w2)
        x2 = x + w + 0.3
        items = [n for n in (self.s['notes'].get('general') or [])[:5]]
        if note: items.append(note)
        paragraphs(ps, x2, y0, self.band_x1() - x2, 'SITE, ROAD AND GRADING NOTES', items, h=0.09)

    def sheet_utility(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        trees = sum(1 for f in self.s['twin']['features'] if f.get('kind') == 'Tree' and (f.get('attributes') or {}).get('streetTree'))
        light_feats = [f for f in self.s['twin']['features'] if f.get('kind') == 'ProposedFeature' and (f.get('attributes') or {}).get('type') == 'street light']
        lights = len(light_feats)
        # The fixture is the plan record's (LED), never a fixed string here.
        fixture = next(((f.get('attributes') or {}).get('fixture') for f in light_feats if (f.get('attributes') or {}).get('fixture')), 'LED POST-TOP PER SMECO / DPW&T 500.10')
        utility = next(((f.get('attributes') or {}).get('utility') for f in light_feats if (f.get('attributes') or {}).get('utility')), 'SMECO')
        yb, w = table(ps, x, y0, 'STREET TREE AND STREET LIGHT SCHEDULE',
                      ['SYMBOL', 'QTY', 'ITEM', 'SIZE / TYPE', 'STANDARD'],
                      [['TREE', trees, 'ACER RUBRUM — RED MAPLE', '2 1/2"–3" CAL., B&B', 'DPW&T 600.02 / 600.04'],
                       ['LIGHT', lights, f'STREET LIGHT ({utility})', fixture, 'DPW&T 500.10']],
                      h=0.095, wrap_cols={3: 3.0})
        x2 = x + w + 0.3
        paragraphs(ps, x2, y0, self.band_x1() - x2, 'UTILITY NOTES', [
            'Water and sewer by WSSC (W-3 / S-3). Mains from the existing WSSC mains in Henrietta Drive through the recorded 30\' WSSC easement (L.51799 F.399, Outlot A and Lot 20) and a 30\' WSSC easement to be granted across Lot 4 along the Lot 3/4 line.',
            'The 8" water and 8" sewer mains stop just past the Lot 1 east property line, at the Lot 6 tap (15 ft past the Lot 5 / Lot 6 front corner): water capped with a blow-off, sewer at a terminal manhole. No main runs on toward MD 210; Lot 1 connects at the end of the mains.',
            'Sizes and inverts of the Henrietta Drive mains per WSSC 200\' sheet 220SE01.',
            'Street lights and street trees per DPW&T Std. 500.10, 600.02 and 600.04; electric service by SMECO. Street lights are LED; wattage and lumen package per SMECO\'s LED post-top offering at technical design.',
            'Keep street trees 10 ft from water meters and storm structures and 15 ft from street lights (DPW&T 600.02).',
            *self._service_notes(),
            ], h=0.085)

    def _service_notes(self):
        svc = [f for f in self.s['twin']['features'] if f.get('kind') == 'Utility' and (f.get('attributes') or {}).get('routedClearOfPaving')]
        if not svc:
            return []
        common = sorted({(f.get('attributes') or {}).get('lotLabel') or str(f.get('id', '')).split('-')[0].upper().replace('L', 'LOT ')
                         for f in svc if (f.get('attributes') or {}).get('commonTrench')})
        out = ['House connections: 1" copper water service and 4" PVC sewer lateral per lot, each tapped on its own main and run to the dwelling '
               'clear of every driveway, apron, walk, stoop, culvert and ESD cell (3 ft min.), so no concrete or structure is removed to lay or repair them; '
               'water and sewer 10 ft apart (WSSC).']
        if common:
            out.append(f"{', '.join(common)}: water and sewer in a COMMON TRENCH (no 10-ft corridor clear of the paving) — water on a shelf 12 in above "
                       'the sewer, subject to WSSC approval at plumbing permit; otherwise relocate the lead walk.')
        return out

    def sheet_swm(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        rows = [[r['bmp'], r['mdeCode'], r['location'], r['poi'], f"{r['daSqFt']:,}", f"{r['percentImpervious']:.1f}", f"{r['peIn']:.1f}",
                 f"{r['esdvReqCf']:,}", f"{r['esdvProvCf']:,}"] for r in self.s['bmp']['rows']]
        yb, w = table(ps, x, y0, 'ESD PER PRACTICE (FULL TABLE ON C-000)', ['BMP', 'MDE', 'LOCATION', 'POI', 'DA SF', '%I', 'P_E', 'ESDv REQ', 'ESDv PROV'], rows, h=0.09)
        x2 = x + w + 0.3
        prow = [[p['id'], f"N {p['at'][1]:,.0f} E {p['at'][0]:,.0f}", f"{100 * p['share']:.0f}%",
                 f"{next((b['req'] for b in self.s['bmp']['byPoi'] if b['poi'] == p['id']), 0):,}",
                 f"{next((b['prov'] for b in self.s['bmp']['byPoi'] if b['poi'] == p['id']), 0):,}"] for p in self.s['poi']['pois']]
        yb2, w2 = table(ps, x2, y0, 'POINTS OF INVESTIGATION (C-9)', ['POI', 'LOCATION', 'SHARE', 'ESDv REQ', 'ESDv PROV'], prow, h=0.09)
        mx = self.band_x1() - 9.2                          # the M-6 section, beside the notes
        paragraphs(ps, x2, yb2 - 0.15, mx - 0.3 - x2, 'SWM NOTES', (self.s['notes'].get('swm') or []) + [self.s['poi']['method']], h=0.08)
        self.m6_section(ps, mx, y0)

    def sheet_swmreport(self, ps, sh):
        """C-410: the SWM concept narrative (checklist D-1, D-3, D-4) and the 100-yr computations (D-10)."""
        self.plan_title(ps, sh)
        r = self.s.get('swm')
        if not r: return
        top = H - M - 0.7
        col = (DRAW_X1 - DRAW_X0 - 0.6) / 3
        x1, x2, x3 = DRAW_X0, DRAW_X0 + col + 0.3, DRAW_X0 + 2 * (col + 0.3)
        h = 0.1
        y = paragraphs(ps, x1, top, col, 'D-1  SWM CONCEPT NARRATIVE', r['narrative']['D-1'], h=h)
        y = paragraphs(ps, x1, y - 0.2, col, 'D-3  OUTFALLS AND RECEIVING AREAS', r['narrative']['D-3'], h=h)
        paragraphs(ps, x1, y - 0.2, col, 'D-4  OUTFALL STABILIZATION', r['narrative']['D-4'], h=h)

        y = top
        for p in r['pois']:
            cov = [['Existing', f"{p['existing']['woodsSqFt']:,}", f"{p['existing']['openSqFt']:,}", f"{p['existing']['impSqFt']:,}", f"{p['existing']['cn']}", f"{p['tc']['existingHr']}"],
                   ['Proposed', f"{p['proposed']['woodsSqFt']:,}", f"{p['proposed']['openSqFt']:,}", f"{p['proposed']['impSqFt']:,}", f"{p['proposed']['cn']}", f"{p['tc']['proposedHr']}"]]
            y, _ = table(ps, x2, y, f"{p['poi']} — COVER, CURVE NUMBER AND Tc ({p['areaSqFt']:,} SF, HSG {r['hsg']})",
                         ['CONDITION', 'WOODS SF', 'OPEN SPACE SF', 'IMPERVIOUS SF', 'CN', 'Tc HR'], cov, h=h, max_width=col)
            segs = [[sg['label'], f"{sg['lengthFt']:,.0f}", f"{sg['slopeFtPerFt']:.4f}", f"{sg.get('velocityFps', 0):.2f}", f"{sg.get('travelTimeHr', 0):.3f}"] for sg in p['tc']['segments']]
            y, _ = table(ps, x2, y - 0.25, 'TIME OF CONCENTRATION — PROPOSED (TR-55)', ['SEGMENT', 'L FT', 'S FT/FT', 'V FPS', 'Tt HR'], segs, h=h, max_width=col)
            pk = [[f"{q['yr']}", f"{q['rainfallIn']:.2f}", f"{q['preCfs']:.2f}", f"{q['postCfs']:.2f}", f"{q['postCfs'] - q['preCfs']:+.2f}",
                   f"{q['preRunoffCf']:,}", f"{q['postRunoffCf']:,}"] for q in p['peaks']]
            y, _ = table(ps, x2, y - 0.25, f"{p['poi']} — PEAK DISCHARGE, EXISTING VS. PROPOSED (NO ESD CREDIT)",
                         ['STORM YR', 'P 24-HR IN', 'Q EXIST CFS', 'Q PROP CFS', 'CHANGE', 'RUNOFF EXIST CF', 'RUNOFF PROP CF'], pk, h=h, max_width=col)
            o = p['outfall']
            orow = [[o['section'], f"{o['slope']:.4f}", f"{o['q10Cfs']:.2f}", f"{o['v10Fps']:.2f}", f"{o['q100Cfs']:.2f}", f"{o['v100Fps']:.2f}", f"{o['d100Ft']:.2f}",
                     f"{o['permissibleFps']:.1f}"]]
            y, _ = table(ps, x2, y - 0.25, f"{p['poi']} — OUTFALL VELOCITY CHECK (MANNING, NORMAL DEPTH)",
                         ['SECTION', 'S FT/FT', 'Q10 CFS', 'V10 FPS', 'Q100 CFS', 'V100 FPS', 'd100 FT', 'V ALLOW FPS'], orow, h=h, max_width=col, wrap_cols={0: 1.6})
            y -= 0.35

        y = paragraphs(ps, x3, top, col, 'D-10  COMPUTATIONS', r['narrative']['D-10'], h=h)
        y = paragraphs(ps, x3, y - 0.2, col, 'OUTSTANDING FOR TECHNICAL DESIGN', r['outstanding'], h=h)
        paragraphs(ps, x3, y - 0.2, col, 'METHOD AND SOURCES', [r['method'], r['rainfall']['citation']], h=h, numbered=False)

    def sheet_esc(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        yb = paragraphs(ps, x, y0, 7.5, 'SEDIMENT AND EROSION CONTROL NOTES', self.s['notes'].get('esc') or [], h=0.09)
        paragraphs(ps, x + 7.8, y0, self.band_x1() - x - 7.8, 'SEQUENCE OF CONSTRUCTION', self.s['notes'].get('sequence') or [], h=0.09)

    def sheet_details(self, ps, sh):
        self.plan_title(ps, sh)
        x = DRAW_X0; top = H - M - 0.6
        # the county standards (DPW&T standard details)
        for d in self.s['details']:
            if not os.path.exists(d['file']): continue
            from PIL import Image
            with Image.open(d['file']) as im:
                iw, ih = im.size
            hgt = 10.8; wid = hgt * iw / ih
            idef = self.doc.add_image_def(filename=d['file'], size_in_pixel=(iw, ih))
            ps.add_image(idef, insert=(x, top - hgt), size_in_units=(wid, hgt), dxfattribs={'layer': 'G-ANNO-TEXT'})
            _box(ps, x - 0.05, top - hgt - 0.35, x + wid + 0.05, top + 0.05, layer='G-ANNO-TABL')
            _txt(ps, f"{d['title']} — {d['std']}", x, top - hgt - 0.1, 0.08, bold=True)
            x += wid + 0.35
        # drawn sections under them
        y = top - 11.6
        self.typical_section(ps, DRAW_X0, y)
        self.m6_section(ps, DRAW_X0 + 13.6, y)
        self.m8_section(ps, DRAW_X0 + 23.0, y)

    def typical_section(self, ps, x, y):
        """Estates Court typical section, rural open section, with the DPW&T pavement layers."""
        s = 0.2   # in per ft (1" = 5')
        _txt(ps, "ESTATES COURT — TYPICAL SECTION (RURAL OPEN SECTION, 60' R/W)   NTS", x, y, 0.1, bold=True)
        base = y - 2.0
        cx = x + 6.5
        prof = [(-30, 0.9), (-26, 0.9), (-22, 0.1), (-20, -0.4), (-18, 0.1), (-16, 0.55), (-12, 0.7), (0, 0.94), (12, 0.7),
                (16, 0.55), (18, 0.1), (20, -0.4), (22, 0.1), (26, 0.9), (30, 0.9)]
        ps.add_lwpolyline([(cx + a * s, base + b * s * 2) for a, b in prof], dxfattribs={'layer': 'G-ANNO-TTLB'})
        # pavement layers under the 24-ft travelway (exaggerated thickness for legibility)
        layers = [(0.06, 'FINAL SURFACE'), (0.06, 'INTERMEDIATE'), (0.10, 'HMA BASE'), (0.18, 'GASB')]
        off = 0.0
        for t, _ in layers:
            off += t
            ps.add_lwpolyline([(cx - 12 * s, base + 0.7 * s * 2 - off), (cx, base + 0.94 * s * 2 - off), (cx + 12 * s, base + 0.7 * s * 2 - off)],
                              dxfattribs={'layer': 'G-ANNO-TABL'})
        _line(ps, (cx - 12 * s, base + 0.7 * s * 2), (cx - 12 * s, base + 0.7 * s * 2 - off), layer='G-ANNO-TABL')
        _line(ps, (cx + 12 * s, base + 0.7 * s * 2), (cx + 12 * s, base + 0.7 * s * 2 - off), layer='G-ANNO-TABL')
        _txt(ps, 'PGL', cx, base + 0.94 * s * 2 + 0.12, 0.07, bold=True, align=TextEntityAlignment.BOTTOM_CENTER)
        _line(ps, (cx, base + 0.94 * s * 2), (cx, base + 0.94 * s * 2 + 0.1), layer='G-ANNO-TABL')
        for side in (-1, 1):
            _txt(ps, '2%', cx + side * 6 * s, base + 0.85 * s * 2 + 0.05, 0.065, align=TextEntityAlignment.BOTTOM_CENTER)
            _txt(ps, '4%', cx + side * 14 * s, base + 0.62 * s * 2 + 0.05, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
            _txt(ps, '3:1', cx + side * 17 * s, base + 0.25 * s * 2 + 0.05, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
            _txt(ps, '3:1', cx + side * 24 * s, base + 0.5 * s * 2 + 0.05, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
        for xf, lab in ((-30, 'R/W'), (30, 'R/W'), (0, 'C/L')):
            _line(ps, (cx + xf * s, base - 0.3), (cx + xf * s, base + 0.9), layer='G-ANNO-TABL')
            _txt(ps, lab, cx + xf * s, base + 0.95, 0.07, align=TextEntityAlignment.BOTTOM_CENTER)
        dims = [(-30, 30, "60' R/W"), (-12, 12, "24' PAVEMENT (2 @ 12')"), (-16, -12, "4' SHLD"), (12, 16, "4' SHLD"),
                (-22, -18, "SWALE"), (18, 22, "SWALE")]
        for i, (a, b, lab) in enumerate(dims):
            yy = base - 0.45 - 0.22 * (i // 2)
            _line(ps, (cx + a * s, yy), (cx + b * s, yy), layer='G-ANNO-TABL')
            for e in (a, b): _line(ps, (cx + e * s, yy - 0.04), (cx + e * s, yy + 0.04), layer='G-ANNO-TABL')
            _txt(ps, lab, cx + (a + b) / 2 * s, yy + 0.03, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
        yb, _ = table(ps, x, base - 1.2, 'PAVEMENT SECTION — PG DPW&T SPECIFICATIONS AND STANDARDS FOR ROADWAYS AND BRIDGES, SECTION III (RESIDENTIAL)',
                      ['LAYER', 'MATERIAL', 'THICKNESS'],
                      [['E  FINAL SURFACE COURSE', 'SUPERPAVE HMA SURFACE, 9.5 MM, PG 64-22', '1 1/2"'],
                       ['D  INTERMEDIATE SURFACE COURSE', 'SUPERPAVE HMA SURFACE, 9.5 MM, PG 64-22', '1 1/2"'],
                       ['C  BASE COURSE', 'SUPERPAVE HMA BASE, 19 MM, PG 64-22', '3"'],
                       ['B  SUBBASE', 'GRADED AGGREGATE SUBBASE (GASB)', '6"'],
                       ['A  SUBGRADE', 'TOP 12" OF IN-SITU SUBGRADE, CBR >= 7, COMPACTED', '12"'],
                       ['SHOULDERS', 'GASB 6", SEEDED TOPSOIL 3" OUTSIDE PAVED AREA', '4\' @ 4%']], h=0.07)
        notes = ['ALL UNPAVED AREAS IN THE R/W: 3" MIN. TOPSOIL AND SEED/SOD. SLOPES 2:1 MAX. (3:1 WHERE MOWED).',
                 'DRIVEWAYS CROSS THE SWALE ON 15" RCP CULVERTS WITH FLARED END SECTIONS OR AS SWALE DRIVEWAYS (DPW&T STD. 600.02).',
                 'SUBGRADE BELOW CBR 7: UNDERCUT AND REPLACE PER SECTION I, TABLES I-3 TO I-9, AS DIRECTED BY THE GEOTECHNICAL ENGINEER.']
        yy = yb - 0.12
        for n in notes:
            _txt(ps, n, x, yy, 0.06); yy -= 0.11

    def m6_section(self, ps, x, y):
        """Micro-bioretention (M-6) typical section, MDE Stormwater Design Manual Ch. 5 Sec. 5.4.3."""
        _txt(ps, 'MICRO-BIORETENTION (M-6) — TYPICAL SECTION   NTS', x, y, 0.1, bold=True)
        b = y - 3.2
        w = 5.6; L0, R0 = x + 0.9, x + w - 0.9         # bottom width of the cell
        g = b + 2.0                                       # existing / finished grade
        # side slopes 3:1 up to grade, berm crest
        ps.add_lwpolyline([(x, g), (L0 - 0.1, g), (L0, b + 1.45), (R0, b + 1.45), (R0 + 0.1, g), (x + w, g)], dxfattribs={'layer': 'G-ANNO-TTLB'})
        # layers inside the cell
        strata = [(1.45, 1.40, '3" SHREDDED HARDWOOD MULCH'), (1.40, 0.75, "2.5' BIORETENTION SOIL MEDIA (MDE APPX. B.4)"),
                  (0.75, 0.65, '3" PEA GRAVEL / CHOKER (NO FILTER FABRIC ON SIDES)'), (0.65, 0.20, '12" #57 WASHED STONE'),
                  (0.20, 0.0, 'UNCOMPACTED SUBGRADE — SCARIFY')]
        for top, bot, lab in strata:
            _line(ps, (L0, b + bot), (R0, b + bot), layer='G-ANNO-TABL')
            _txt(ps, lab, R0 + 0.15, b + (top + bot) / 2, 0.055, align=TextEntityAlignment.MIDDLE_LEFT)
            _line(ps, (R0 - 0.2, b + (top + bot) / 2), (R0 + 0.12, b + (top + bot) / 2), layer='G-ANNO-TEXT')
        _line(ps, (L0, b), (L0, b + 1.45), layer='G-ANNO-TABL'); _line(ps, (R0, b), (R0, b + 1.45), layer='G-ANNO-TABL')
        # ponding
        ps.add_lwpolyline([(L0 + 0.05, b + 1.45 + 0.35), (R0 - 0.05, b + 1.45 + 0.35)], dxfattribs={'layer': 'G-ANNO-TABL', 'linetype': 'DASHED', 'ltscale': 0.02})
        _txt(ps, "12\" MAX. PONDING (6\" TYP.)", (L0 + R0) / 2, b + 1.45 + 0.4, 0.055, align=TextEntityAlignment.BOTTOM_CENTER)
        # underdrain
        ps.add_circle(((L0 + R0) / 2, b + 0.35), 0.08, dxfattribs={'layer': 'G-ANNO-TTLB'})
        _txt(ps, '4" PERF. SCH. 40 PVC UNDERDRAIN @ 0.5% MIN., 3" STONE COVER', (L0 + R0) / 2, b - 0.12, 0.055, align=TextEntityAlignment.TOP_CENTER)
        # observation well / cleanout
        ow = L0 + 0.35
        _line(ps, (ow, b + 0.35), (ow, g + 0.25), layer='G-ANNO-TTLB'); _line(ps, (ow + 0.08, b + 0.35), (ow + 0.08, g + 0.25), layer='G-ANNO-TTLB')
        _txt(ps, '4" OBSERVATION WELL / CLEANOUT W/ CAP', ow - 0.05, g + 0.3, 0.05, align=TextEntityAlignment.BOTTOM_LEFT)
        # overflow
        ofx = R0 - 0.45
        _line(ps, (ofx, b + 0.35), (ofx, b + 1.45 + 0.35), layer='G-ANNO-TTLB'); _line(ps, (ofx + 0.16, b + 0.35), (ofx + 0.16, b + 1.45 + 0.35), layer='G-ANNO-TTLB')
        _txt(ps, 'OVERFLOW RISER, 12" DOMED GRATE @ PONDING EL.', ofx + 0.2, b + 2.05, 0.05, align=TextEntityAlignment.BOTTOM_LEFT)
        _txt(ps, '3:1 MAX.', L0 - 0.55, b + 1.75, 0.055)
        # notes
        notes = ['SIZED PER THE BMP SUMMARY TABLE (C-000): SURFACE AREA, ESDv; CELL BOTTOM >= 2 FT ABOVE SEASONAL HIGH GROUNDWATER.',
                 'UNDERDRAIN TO A STABLE OUTFALL; INFILTRATION CREDIT ONLY WHERE BORINGS SHOW >= 0.52 IN/HR (SEC. 32-131).',
                 'MEDIA PER MDE MANUAL APPENDIX B.4 (SAND/TOPSOIL/ORGANIC); PLANT PER APPENDIX A, TABLE A.4.',
                 'BUILD AFTER THE CONTRIBUTING AREA IS STABILIZED; PROTECT FROM CONSTRUCTION TRAFFIC AND SEDIMENT.',
                 'PRIVATE PRACTICE: MAINTENANCE AGREEMENT RECORDED BEFORE PERMIT. MDE DESIGN MANUAL CH. 5, SEC. 5.4.3 (M-6).']
        yy = b - 0.35
        for n in notes:
            _txt(ps, n, x, yy, 0.055); yy -= 0.1

    def m8_section(self, ps, x, y):
        _txt(ps, 'DRY SWALE (M-8) WITH CHECK DAM', x, y, 0.1, bold=True)
        b = y - 2.4
        ps.add_lwpolyline([(x, b + 1.4), (x + 1.2, b + 0.6), (x + 2.4, b + 0.6), (x + 3.6, b + 1.4)], dxfattribs={'layer': 'G-ANNO-TTLB'})
        _line(ps, (x + 1.2, b + 0.3), (x + 2.4, b + 0.3), layer='G-ANNO-TABL')
        _txt(ps, "4' BOTTOM", x + 1.8, b + 0.62, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
        _txt(ps, '2.5\' FILTER MEDIA', x + 1.8, b + 0.33, 0.055, align=TextEntityAlignment.BOTTOM_CENTER)
        _txt(ps, '3:1', x + 0.45, b + 1.05, 0.06); _txt(ps, '3:1', x + 2.9, b + 1.05, 0.06)
        _txt(ps, 'CHECK DAMS AT 6" MAX. HEAD; UNDERDRAIN IN HSG C SOILS', x, b - 0.2, 0.06)

    # ── cover (laid out as the approved Yocum Property cover) ─────────────
    # ── C-210: Estates Court plan and profile ──────────────────────────────
    def sheet_profile(self, ps, sh):
        self.plan_title(ps, sh)
        pr = self.s.get('profile')
        sc = sh.get('scaleFtPerIn', 30)
        top = H - M - 0.55
        split = 11.2                                      # plan above, profile below
        if pr:
            _z = [r['pgl'] for r in pr['stations']] + [r['existing'] for r in pr['stations'] if r['existing'] is not None]
            _h = (math.ceil((max(_z) + 3) / 2) * 2 - math.floor((min(_z) - 3) / 2) * 2) / 3.0
            split = min(11.2, M + 1.35 + _h + 1.3)        # profile grid height at 1" = 3', plus its title and PVI labels
        self.viewport(ps, 'profile', DRAW_X0, split, DRAW_X1, top, sc, centre=self.plan_c)
        _box(ps, DRAW_X0, split, DRAW_X1, top, layer='G-ANNO-TABL')
        bar_scale(ps, DRAW_X0 + 0.15, split + 0.25, sc, 200)
        self.legend(ps, M + 0.15, H - M - STAMP - 0.2, 'layout', h=0.08)
        if not pr:
            return
        vs = 3.0                                          # vertical: 1" = 3' (10x)
        st = pr['stations']
        zs = [s['pgl'] for s in st] + [s['existing'] for s in st if s['existing'] is not None]
        zmin = math.floor((min(zs) - 3) / 2) * 2; zmax = math.ceil((max(zs) + 3) / 2) * 2
        gx0 = DRAW_X0 + 0.9; gy0 = M + 1.35               # grid origin (sta 0, zmin)
        gx1 = gx0 + pr['lengthFt'] / sc; gy1 = gy0 + (zmax - zmin) / vs
        if gy1 > split - 0.6:
            vs = (zmax - zmin) / (split - 0.6 - gy0); gy1 = gy0 + (zmax - zmin) / vs
        X = lambda s: gx0 + s / sc
        Y = lambda z: gy0 + (z - zmin) / vs
        _txt(ps, f"PROFILE — ESTATES COURT CENTERLINE   HORIZ. 1\" = {sc:.0f}'   VERT. 1\" = {vs:.0f}'", gx0, gy1 + 0.35, 0.12, bold=True)
        # grid
        for z in range(int(zmin), int(zmax) + 1, 2):
            _line(ps, (gx0, Y(z)), (gx1, Y(z)), lw=(25 if z % 10 == 0 else 9))
            _txt(ps, f"{z}", gx0 - 0.08, Y(z), 0.07, align=TextEntityAlignment.MIDDLE_RIGHT)
            _txt(ps, f"{z}", gx1 + 0.08, Y(z), 0.07, align=TextEntityAlignment.MIDDLE_LEFT)
        s = 0.0
        while s <= pr['lengthFt'] + 0.01:
            major = abs(s % 100) < 1e-6
            _line(ps, (X(s), gy0), (X(s), gy1), lw=(25 if major else 9))
            if major:
                _txt(ps, f"{int(s // 100)}+00", X(s), gy0 - 0.08, 0.08, bold=True, align=TextEntityAlignment.TOP_CENTER)
            s += 25
        _box(ps, gx0, gy0, gx1, gy1, layer='G-ANNO-TABL', lw=35)
        # elevations along the bottom: existing / proposed every 25 ft
        for k, r in enumerate(st):
            x = X(r['sta'])
            if r['existing'] is not None:
                _txt(ps, f"{r['existing']:.2f}", x - 0.03, gy0 - 0.3, 0.055, rot=90, align=TextEntityAlignment.MIDDLE_RIGHT)
            _txt(ps, f"{r['pgl']:.2f}", x + 0.07, gy0 - 0.3, 0.055, bold=True, rot=90, align=TextEntityAlignment.MIDDLE_RIGHT)
        _txt(ps, 'EX. GRADE / PROP. PGL', gx0 - 0.85, gy0 - 0.3, 0.055, bold=True)
        # existing ground (dashed) and PGL (heavy)
        eg = [(X(r['sta']), Y(r['existing'])) for r in st if r['existing'] is not None]
        if len(eg) > 1:
            ps.add_lwpolyline(eg, dxfattribs={'layer': 'C-TOPO-MAJR-E', 'linetype': 'DASHED', 'ltscale': 0.03, 'lineweight': 35})
        fine = []
        s = 0.0
        from .profile_math import pgl_at
        while s <= pr['lengthFt']:
            fine.append((X(s), Y(pgl_at(pr['pvis'], s)))); s += 2.5
        fine.append((X(pr['lengthFt']), Y(pgl_at(pr['pvis'], pr['lengthFt']))))
        ps.add_lwpolyline(fine, dxfattribs={'layer': 'C-TOPO-MAJR-N', 'lineweight': 70})
        _txt(ps, 'EXISTING GROUND AT CENTERLINE', eg[len(eg) // 3][0], eg[len(eg) // 3][1] + 0.12, 0.07)
        _txt(ps, 'PROPOSED PROFILE GRADE LINE (PGL, CENTERLINE)', fine[len(fine) // 2][0], fine[len(fine) // 2][1] - 0.12, 0.07, bold=True,
             align=TextEntityAlignment.TOP_LEFT)
        # PVIs, vertical curves, grades
        pv = pr['pvis']
        for i, v in enumerate(pv):
            x, y = X(v['sta']), Y(v['elev'])
            ps.add_circle((x, y), 0.05, dxfattribs={'layer': 'G-ANNO-TEXT'})
            lab = [f"PVI STA {self._sta(v['sta'])}", f"ELEV {v['elev']:.2f}"]
            if v['vcLengthFt'] > 0:
                L = v['vcLengthFt']
                g1, g2 = v['gradeInPct'], v['gradeOutPct']
                for nm, s_ in (('PVC', v['sta'] - L / 2), ('PVT', v['sta'] + L / 2)):
                    z_ = pgl_at(pv, s_)
                    _line(ps, (X(s_), Y(z_) - 0.25), (X(s_), Y(z_) + 0.25), layer='G-ANNO-TEXT')
                    _txt(ps, f"{nm} {self._sta(s_)} EL {z_:.2f}", X(s_) - 0.04, Y(z_) + 0.3, 0.05, rot=90)
                lab.append(f"{L:.0f}' {'CREST' if v['type'] == 'crest' else 'SAG'} V.C.  K = {v['k']:.1f}")
                lab.append(f"A = {abs(g2 - g1):.2f}%")
            for j, t in enumerate(lab):
                _txt(ps, t, x + 0.05, gy1 - 0.12 - j * 0.1, 0.055, bold=(j == 0))
            _line(ps, (x, y), (x, gy1 - 0.08 - len(lab) * 0.1), layer='G-ANNO-TEXT')
            if i < len(pv) - 1:
                b = pv[i + 1]
                mx, my = (X(v['sta']) + X(b['sta'])) / 2, (Y(v['elev']) + Y(b['elev'])) / 2
                _txt(ps, f"{v['gradeOutPct']:+.2f}%", mx, my + 0.15, 0.08, bold=True, align=TextEntityAlignment.BOTTOM_CENTER,
                     rot=math.degrees(math.atan2(Y(b['elev']) - Y(v['elev']), X(b['sta']) - X(v['sta']))))
        for hl in pr.get('highLow') or []:
            _txt(ps, f"{'HIGH' if hl['kind'] == 'high' else 'LOW'} PT STA {self._sta(hl['sta'])} EL {hl['elev']:.2f}",
                 X(hl['sta']), Y(hl['elev']) - 0.18, 0.055, align=TextEntityAlignment.TOP_CENTER)
        # tables to the right of the grid
        tx = max(gx1 + 0.6, BAND_X1 - 6.4)
        rows = [[c['id'], f"{c['radiusFt']:.2f}'", f"{self._dms(c['deltaDeg'])}", f"{c['lengthFt']:.2f}'", f"{c['tangentFt']:.2f}'",
                 f"{c['chordFt']:.2f}'", c['chordBearing'], self._sta(c['staPC']), self._sta(c['staPT'])]
                for c in pr['alignment'] if c['kind'] == 'curve']
        y = split - 0.2
        if rows:
            y, _ = table(ps, tx, y, 'CURVE TABLE — ESTATES COURT CENTERLINE', ['CURVE', 'RADIUS', 'DELTA', 'LENGTH', 'TANGENT', 'CHORD', 'CHORD BRG', 'PC STA', 'PT STA'], rows, h=0.07)
        trows = [[self._sta(t['staStart']), self._sta(t['staEnd']), t['bearing'], f"{t['lengthFt']:.2f}'"] for t in pr['alignment'] if t['kind'] == 'tangent']
        y, _ = table(ps, tx, y - 0.2, 'TANGENT TABLE', ['FROM STA', 'TO STA', 'BEARING', 'LENGTH'], trows, h=0.07)
        c = pr['criteria']
        paragraphs(ps, tx, y - 0.2, BAND_X1 - tx, 'STREET DESIGN CRITERIA AND NOTES', [
            f"Design speed {c['designSpeedMph']} mph. Grades {c['minGradePct']:.1f}% min. (open section drainage) to {c['maxGradePct']:.0f}% max.; "
            f"landing at Jennifer Drive {c['landingMaxGradePct']:.0f}% max. for {c['landingLengthFt']:.0f} ft.",
            f"Vertical curves: crest K {c['kCrest']}, sag K {c['kSag']}, minimum {c['minVcFt']} ft; curves omitted where the grade break is under 1%.",
            f"Cross slope {c['crossSlopePct']:.0f}% from the centerline; EP = PGL - 0.24' (12-ft half pavement). Shoulders {c['shoulderSlopePct']:.0f}%; slopes 2:1 max.",
            f"Max. cut {pr['cutFill']['maxCutFt']:.2f} ft, max. fill {pr['cutFill']['maxFillFt']:.2f} ft at the centerline.",
            'Pavement per the typical section on C-600 (DPW&T Specifications and Standards for Roadways and Bridges, Section III).',
            c['citation'] + '.',
        ], h=0.07)

    @staticmethod
    def _sta(s):
        h = int(s // 100)
        return f"{h}+{s - h * 100:05.2f}"

    @staticmethod
    def _dms(d):
        a = abs(d); dd = int(a); mf = (a - dd) * 60; mm = int(mf); ss = round((mf - mm) * 60)
        if ss == 60: mm += 1; ss = 0
        if mm == 60: dd += 1; mm = 0
        return f"{dd:02d}°{mm:02d}'{ss:02d}\""

    def sheet_cover(self, ps, sh):
        s = self.s
        p = s.get('project') or {}
        name, _, _ = str(p.get('project', '')).partition(' — ')
        n = len(s['twin'].get('projectLots') or [])
        street = ((s.get('extras') or {}).get('proposedStreet') or {}).get('name', '')
        cx = (DRAW_X0 + RC_X) / 2
        y = H - M - 0.25
        for txt, h, bold in ((name, 0.62, True), (f'LOTS 1 THRU {n}' if n else '', 0.44, False),
                             (p.get('planType', 'SITE DEVELOPMENT CONCEPT PLAN'), 0.38, True),
                             (f"({street.upper() + ' — ' if street else ''}{p.get('location', '')})", 0.2, False)):
            if not txt: continue
            _txt(ps, txt, cx, y, h, bold=bold, align=TextEntityAlignment.TOP_CENTER)
            y -= h * 1.35
        _txt(ps, f"{p.get('record', '')}  ·  {p.get('districts', '')}", cx, y, 0.11, align=TextEntityAlignment.TOP_CENTER)
        y -= 0.3
        if p.get('basisNote'):
            _txt(ps, p['basisNote'], cx, y, 0.09, align=TextEntityAlignment.TOP_CENTER)
            y -= 0.25
        title_bottom = y

        # vicinity map, upper right
        vx0, vx1 = DRAW_X1 - 5.6, DRAW_X1
        vy1 = H - M - 0.2; vy0 = vy1 - 4.2
        self.viewport(ps, 'vicinity', vx0, vy0, vx1, vy1, 2000.0)
        _box(ps, vx0, vy0, vx1, vy1, layer='G-ANNO-TABL', lw=35)
        _txt(ps, 'VICINITY MAP   SCALE: 1" = 2,000\'', vx0 + 0.08, vy1 - 0.08, 0.09, bold=True)
        ps.add_blockref('NORTH', (vx1 - 0.35, vy1 - 0.75), dxfattribs={'layer': 'G-ANNO-TTLB'})
        bar_scale(ps, vx0 + 0.15, vy0 + 0.18, 2000.0, 4000)

        # County BMP summary table (checklist A-15: on the cover)
        rows = [[r['bmp'], r['practice'], r['mdeCode'], r['location'], r['ownership'], r['poi'], f"{r['daSqFt']:,}", f"{r['impSqFt']:,}",
                 f"{r['percentImpervious']:.1f}", r['hsg'], f"{r['peIn']:.1f}", f"{r['rv']:.3f}", f"{r['esdvReqCf']:,}", f"{r['esdvProvCf']:,}",
                 f"{r['revReqCf']:,}", f"{r['surfaceSqFt']:,}", f"N {r['at'][1]:,.0f}  E {r['at'][0]:,.0f}"] for r in s['bmp']['rows']]
        t = s['bmp']['totals']
        for b_ in s['bmp']['byPoi']:
            rows.append(['', f"SUBTOTAL {b_['poi']}", '', '', '', b_['poi'], '', '', '', '', '', '', f"{b_['req']:,}", f"{b_['prov']:,}", '', '', ''])
        rows.append(['TOTAL', f"{len(s['bmp']['rows'])} ESD practices", '', '', '', '', f"{t['daSqFt']:,}", f"{t['impSqFt']:,}", '', '', '', '',
                     f"{t['esdvReqCf']:,}", f"{t['esdvProvCf']:,}", f"{t['revReqCf']:,}", f"{t['surfaceSqFt']:,}", ''])
        ytab = min(title_bottom, H - M - STAMP - 0.1) - 0.1
        yb, _ = table(ps, DRAW_X0, ytab, "PRINCE GEORGE'S COUNTY BMP SUMMARY TABLE — ESD BY POINT OF INVESTIGATION (A-15, C-9)",
                      ['BMP', 'PRACTICE', 'MDE', 'LOCATION', 'OWNERSHIP / MAINT.', 'POI', 'DA SF', 'IMP SF', '%I', 'HSG', 'P_E IN', 'Rv',
                       'ESDv REQ CF', 'ESDv PROV CF', 'Rev REQ CF', 'SURFACE SF', 'COORDINATES (NAD 83)'],
                      rows, h=0.08, max_width=vx0 - DRAW_X0 - 0.3, bold_last=True, wrap_cols={4: 1.5, 1: 1.5})
        _txt(ps, f"P_E from {s['bmp']['citation']}; HSG {s['bmp']['rows'][0]['hsg'] if s['bmp']['rows'] else 'C'} governing. Rv = 0.05 + 0.009·I; "
             'ESDv = P_E·Rv·A/12; Rev = S·Rv·A/12 (S = 0.13 in, HSG C), met within ESDv. M-8 provided = 6 cf per ft (4-ft bottom, 6" ponding, 2.5\' media at n 0.40).',
             DRAW_X0, yb - 0.06, 0.06)
        if s['bmp'].get('note'):
            _txt(ps, s['bmp']['note'], DRAW_X0, yb - 0.16, 0.06)

        # four columns below: lot tables | legend | index + notes + owner | certifications
        top = min(yb - 0.35, vy0 - 0.35)
        xA, xB, xC, xD = DRAW_X0, DRAW_X0 + 6.7, DRAW_X0 + 12.6, DRAW_X0 + 19.0
        lc = s['tables'].get('lotCoverage')
        y = top
        if lc and lc['rows']:
            y, _ = table(ps, xA, y, lc['title'], lc['columns'], lc['rows'], h=0.085, wrap_cols={c: 1.0 for c in range(1, 6)})
            _txt(ps, 'LOT COVERAGE = DRIVEWAY, WALK AND STOOP + DWELLING FOOTPRINT, ON THE LOT.', xA, y - 0.06, 0.065)
            y -= 0.4
        ad = s['tables'].get('addresses')
        if ad and ad['rows']:
            y, _ = table(ps, xA, y, ad['title'], ad['columns'], ad['rows'], h=0.1)
        bottoms = [y]
        bottoms.append(self.cover_legend(ps, xB, top))
        y = top
        idx_rows = [[str(i + 1), x['id'], x['title']] for i, x in enumerate(self.sheets)]
        y, _ = table(ps, xC, y, 'INDEX OF DRAWINGS', ['NO.', 'SHEET', 'TITLE'], idx_rows, h=0.085, wrap_cols={2: 4.4})
        bottoms.append(self.std_notes(ps, xC, y - 0.3, 6.0))
        self._cover_record_view(ps, min(bottoms) - 0.35)
        y = top
        wD = DRAW_X1 - xD
        for title, body in CERTIFICATIONS:
            y0 = y
            y = paragraphs(ps, xD + 0.12, y - 0.12, wD - 0.24, title, [body], h=0.075, numbered=False)
            for lab in ('SIGNATURE: ______________________________   MD P.E. LICENSE NO. ________',
                        'PRINTED NAME: ___________________________   DATE: ____________'):
                _txt(ps, lab, xD + 0.12, y - 0.05, 0.075); y -= 0.2
            _box(ps, xD, y - 0.05, xD + wD, y0, layer='G-ANNO-TABL', lw=35)
            y -= 0.3
            if y < M + 4.8: break

    def _cover_record_view(self, ps, ytop):
        """The subdivision as it is of record — tract, lots, R/W, easements, adjoiners; no buildings or improvements."""
        x0, x1 = DRAW_X0, RC_X - 0.3
        y0 = M + 0.35
        if ytop - y0 < 2.5: return
        bx0, by0, bx1, by1 = self.site_bb
        need_w, need_h = (bx1 - bx0) + 120, (by1 - by0) + 120
        sc = next(v for v in (20, 30, 40, 50, 60, 80, 100, 150, 200) if need_w / v <= (x1 - x0) - 0.4 and need_h / v <= (ytop - y0) - 0.6)
        w = min(x1 - x0, need_w / sc + 0.4)
        vx0 = x0; vx1 = x0 + w
        vy1 = ytop - 0.3
        self.viewport(ps, 'record', vx0, y0, vx1, vy1, sc, centre=self.site_c)
        _box(ps, vx0, y0, vx1, vy1, layer='G-ANNO-TABL', lw=35)
        _txt(ps, 'EXISTING SUBDIVISION OF RECORD — LOTS 1-6, ESTATES AT INDIAN HEAD, PLAT BOOK PM 228 @ 83 (AS IS: NO DWELLINGS OR IMPROVEMENTS)',
             vx0, ytop - 0.05, 0.1, bold=True)
        bar_scale(ps, vx0 + 0.15, y0 + 0.2, float(sc), sc * 4)
        ps.add_blockref('NORTH', (vx1 - 0.35, vy1 - 0.75), dxfattribs={'layer': 'G-ANNO-TTLB'})

    def cover_legend(self, ps, x, y):
        """LEGEND with NEW and EXISTING columns, drawn from the same layers the plan uses."""
        rows = [('PROPERTY LINE', 'V-PROP-BNDY', 'V-PROP-ADJN'), ('LOT LINE', 'V-PROP-LOTS', None), ('BUILDING (EXISTING)', None, 'V-BLDG-E'),
                ('RIGHT-OF-WAY', 'C-ROAD-ROWL-N', 'C-ROAD-ROWL-E'), ('EDGE OF PAVEMENT', 'C-ROAD-PVMT-N', 'C-ROAD-EDGE-E'),
                ('CENTER LINE', 'C-ROAD-CNTR-N', 'C-ROAD-CNTR-E'), ('CONTOURS', 'C-TOPO-MAJR-N', 'C-TOPO-MAJR-E'),
                ('EASEMENT (WSSC)', 'V-ESMT', 'V-ESMT'), ('BUILDING', 'C-BLDG-FTPR-N', None),
                ('WATER MAIN', 'C-WATR-MAIN-N', None), ('SANITARY SEWER', 'C-SSWR-MAIN-N', None),
                ('WATER HOUSE CONNECTION', 'C-WATR-SVCS-N', None), ('SEWER HOUSE CONNECTION', 'C-SSWR-SVCS-N', None),
                ('ROADSIDE SWALE', 'C-ROAD-SWAL-N', None), ('DRIVEWAY CULVERT', 'C-STRM-CULV-N', None),
                ('ESD PRACTICE (M-6)', 'C-SWM-ESD-N', None), ('DRAINAGE AREA', 'C-SWM-DRAN-N', None),
                ('LIMITS OF DISTURBANCE', 'C-ESC-LOD', None), ('SILT FENCE', 'C-ESC-SILT', None),
                ('SOIL BOUNDARY', None, 'C-ENVR-SOIL-E'),
                ('STREET TREE', 'TREE', None), ('STREET LIGHT', 'LIGHT', None), ('SPOT ELEVATION', 'SPOT', None)]
        c0, c1, c2 = 2.6, 1.4, 1.4
        rh = 0.24
        _txt(ps, 'LEGEND', x + (c0 + c1 + c2) / 2, y, 0.13, bold=True, align=TextEntityAlignment.TOP_CENTER)
        y -= 0.3
        top = y
        for k, lab in enumerate(('ITEM', 'NEW', 'EXISTING')):
            _txt(ps, lab, x + [c0 / 2, c0 + c1 / 2, c0 + c1 + c2 / 2][k], y - rh / 2, 0.08, bold=True, align=TextEntityAlignment.MIDDLE_CENTER)
        y -= rh
        _line(ps, (x, y), (x + c0 + c1 + c2, y))
        for item, new, ex in rows:
            ym = y - rh / 2
            _txt(ps, item, x + 0.08, ym, 0.07, align=TextEntityAlignment.MIDDLE_LEFT)
            for lay, cxx in ((new, x + c0), (ex, x + c0 + c1)):
                if not lay: continue
                if lay in ('TREE', 'LIGHT', 'SPOT'):
                    blk = ps.add_blockref(lay, (cxx + c1 / 2, ym), dxfattribs={'layer': 'G-ANNO-TEXT'})
                    blk.dxf.xscale = blk.dxf.yscale = (1.0 / 90.0 if lay == 'TREE' else 1.0 / 30.0)
                    continue
                aci, lt, lw = LAYERS[lay]
                ps.add_line((cxx + 0.15, ym), (cxx + c1 - 0.15, ym),
                            dxfattribs={'layer': lay, 'lineweight': lw, 'linetype': lt, 'ltscale': 1.0 / 12.0 * 0.4})
            y -= rh
            _line(ps, (x, y), (x + c0 + c1 + c2, y))
        for xx in (x, x + c0, x + c0 + c1, x + c0 + c1 + c2):
            _line(ps, (xx, top), (xx, y))
        _box(ps, x, y, x + c0 + c1 + c2, top, layer='G-ANNO-TABL', lw=35)
        return y

    # ── C-001: general notes, site data, approvals and the DPIE checklist ──
    def sheet_notes(self, ps, sh):
        s = self.s
        self.plan_title(ps, sh)
        ytop = H - M - 0.75
        colw = (DRAW_X1 - DRAW_X0 - 0.6) / 3
        c1, c2 = DRAW_X0, DRAW_X0 + colw + 0.3
        c3 = DRAW_X0 + 2 * (colw + 0.3)
        y1, _ = table(ps, c1, ytop, 'SITE DATA', ['ITEM', 'DATA'], s['tables']['siteData']['rows'], h=0.085, wrap_cols={1: colw - 1.4}, max_width=colw)
        y1, _ = table(ps, c1, y1 - 0.25, 'APPROVALS OF RECORD', ['CASE', 'STATUS'], s['tables']['approvals']['rows'], h=0.085, max_width=colw)
        paragraphs(ps, c1, y1 - 0.25, colw, 'GENERAL NOTES', s['notes'].get('general') or [], h=0.085)
        rows = [[r['id'], r['text'], r['reference'], r['status'], r['comment'], r['sheet']] for r in s['checklist']['rows']]
        half = (len(rows) + 1) // 2
        split = next((i for i in range(half, len(rows)) if rows[i][0][0] != rows[i - 1][0][0]), half)
        table(ps, c2, ytop, 'DPIE CONCEPT PLAN DESIGN REVIEW CHECKLIST (08/25/2021) — C = SHOWN · X = N/A · O = OUTSTANDING',
              ['ITEM', 'REQUIREMENT', 'REF.', 'C/X/O', 'RESPONSE / WHERE SHOWN', 'SHEET'], rows[:split], h=0.075,
              wrap_cols={1: colw * 0.38, 4: colw * 0.36}, max_width=colw)
        table(ps, c3, ytop, 'CHECKLIST (CONT.)', ['ITEM', 'REQUIREMENT', 'REF.', 'C/X/O', 'RESPONSE / WHERE SHOWN', 'SHEET'], rows[split:], h=0.075,
              wrap_cols={1: colw * 0.38, 4: colw * 0.36}, max_width=colw)
