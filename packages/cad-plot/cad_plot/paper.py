"""
Paper space: the sheets. Units are inches on a 36 x 24 in (ARCH D) sheet.

Layout, left to right:
  drawing area  0.5 .. 27.5   (plan viewport over a band of legend / tables / notes)
  title column 27.5 .. 30.5   (compact: every block sized to its content)
  DPIE strip   30.5 .. 35.5   (5-in full-height area kept open for the County
                               approval block — checklist A-3)
"""
import math
import os
import textwrap
from ezdxf.enums import TextEntityAlignment

from .style import SHEET_LAYERS, LAYERS

W, H, M = 36.0, 24.0, 0.5
STRIP_W = 5.0
TB_W = 3.0
TB_X = W - M - STRIP_W - TB_W          # 27.5
DRAW_X0, DRAW_X1 = M + 0.25, TB_X - 0.25
CW = 0.68                               # Arial caps average char width / height (with margin)


def _txt(ps, s, x, y, h, bold=False, align=TextEntityAlignment.TOP_LEFT, layer='G-ANNO-TEXT', rot=0):
    t = ps.add_text(str(s), height=h, rotation=rot, dxfattribs={'layer': layer, 'style': 'KEALEE-B' if bold else 'KEALEE'})
    t.set_placement((x, y), align=align)
    return t


def _box(ps, x0, y0, x1, y1, layer='G-ANNO-TTLB', lw=None):
    kw = {'layer': layer}
    if lw is not None: kw['lineweight'] = lw
    ps.add_lwpolyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], close=True, dxfattribs=kw)


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
        cells = [str(columns[c])] + [str(r[c]) if c < len(r) else '' for r in rows]
        w = max(len(s) for s in cells) * h * CW + 2 * pad
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
        # Jennifer Drive frontage to the north, as the 2009 sheet frames it
        self.plan_c = ((min(tx) - 140 + max(tx) + 20) / 2, (min(ty) - 10 + max(ty) + 80) / 2)
        self.site_bb = (min(tx), min(ty), max(tx), max(ty))

    # ── frame and title column ─────────────────────────────────────────────
    def frame(self, ps, sheet, idx):
        _box(ps, M, M, W - M, H - M, lw=70)
        _box(ps, W - M - STRIP_W, M, W - M, H - M, lw=35)
        _txt(ps, 'RESERVED FOR PRINCE GEORGE\'S COUNTY DPIE APPROVAL BLOCK', W - M - STRIP_W / 2, H - M - 0.2, 0.09,
             align=TextEntityAlignment.TOP_CENTER, bold=True)
        _txt(ps, '(5-IN FULL-HEIGHT AREA KEPT OPEN — CHECKLIST A-3)', W - M - STRIP_W / 2, H - M - 0.36, 0.07,
             align=TextEntityAlignment.TOP_CENTER)
        self.title_column(ps, sheet, idx)

    def title_column(self, ps, sheet, idx):
        p = self.s.get('project') or {}
        x0, x1 = TB_X, TB_X + TB_W
        _box(ps, x0, M, x1, H - M, lw=50)
        y = H - M - 0.12
        pad = 0.1
        def block(label, lines, h=0.085, bold=False, gap=0.08):
            nonlocal y
            _txt(ps, label, x0 + pad, y, 0.055, layer='G-ANNO-TTLB')
            y -= 0.1
            for ln in lines:
                for w_ in _wrap(ln, TB_W - 2 * pad, h):
                    _txt(ps, w_, x0 + pad, y, h, bold=bold)
                    y -= h * 1.35
            y -= gap
            _line(ps, (x0, y + gap / 2), (x1, y + gap / 2), layer='G-ANNO-TTLB')
        block('PLAN TYPE', [p.get('planType', 'SITE DEVELOPMENT CONCEPT PLAN')], h=0.12, bold=True)
        block('PROJECT', [p.get('project', ''), p.get('location', ''), p.get('record', ''), p.get('districts', '')], h=0.075)
        block('OWNER / APPLICANT', [p.get('owner', '')], h=0.07)
        block('ENGINEER OF RECORD', [p.get('engineer', '')], h=0.07)
        block('SHEET TITLE', [sheet['title']], h=0.11, bold=True)
        # key map
        _txt(ps, 'KEY MAP', x0 + pad, y, 0.055, layer='G-ANNO-TTLB'); y -= 0.1
        km_h = 1.35
        self.key_map(ps, x0 + pad, y - km_h, TB_W - 2 * pad, km_h, sheet)
        y -= km_h + 0.1
        _line(ps, (x0, y + 0.04), (x1, y + 0.04), layer='G-ANNO-TTLB')
        # scale + north
        sc = sheet.get('scaleFtPerIn')
        _txt(ps, 'SCALE', x0 + pad, y, 0.055, layer='G-ANNO-TTLB')
        _txt(ps, f'1" = {sc:.0f}\'' if sc else 'AS NOTED', x0 + pad, y - 0.1, 0.11, bold=True)
        ps.add_blockref('NORTH', (x1 - 0.45, y - 0.35), dxfattribs={'layer': 'G-ANNO-TTLB'})
        _txt(ps, 'DATUM: NAD 83 MD STATE PLANE (US FT) / NAVD 88', x0 + pad, y - 0.32, 0.055)
        y -= 0.75
        _line(ps, (x0, y + 0.04), (x1, y + 0.04), layer='G-ANNO-TTLB')
        # revisions
        _txt(ps, 'REVISIONS', x0 + pad, y, 0.055, layer='G-ANNO-TTLB'); y -= 0.1
        cols = [0.35, 0.65, TB_W - 2 * pad - 1.0]
        rowsr = [('NO.', 'DATE', 'DESCRIPTION'), ('0', p.get('date', ''), 'CONCEPT SUBMISSION 1'), ('', '', ''), ('', '', '')]
        for r_ in rowsr:
            cx = x0 + pad
            for c, w_ in zip(r_, cols):
                _txt(ps, c, cx + 0.03, y - 0.02, 0.06, bold=(r_[0] == 'NO.'))
                cx += w_
            y -= 0.13
            _line(ps, (x0 + pad, y + 0.02), (x1 - pad, y + 0.02), layer='G-ANNO-TABL')
        y -= 0.08
        _line(ps, (x0, y + 0.04), (x1, y + 0.04), layer='G-ANNO-TTLB')
        # professional certification + seal
        _txt(ps, 'PROFESSIONAL CERTIFICATION', x0 + pad, y, 0.055, layer='G-ANNO-TTLB'); y -= 0.1
        cert = ('I hereby certify that these documents were prepared or approved by me, and that I am a duly licensed '
                'professional engineer under the laws of the State of Maryland. License No. ______  Exp. ______')
        for w_ in _wrap(cert, TB_W - 2 * pad, 0.058):
            _txt(ps, w_, x0 + pad, y, 0.058); y -= 0.08
        seal = 1.25
        ps.add_circle((x0 + TB_W / 2, y - seal / 2 - 0.05), seal / 2 - 0.05, dxfattribs={'layer': 'G-ANNO-TTLB'})
        _txt(ps, 'SEAL', x0 + TB_W / 2, y - seal / 2 - 0.05, 0.08, align=TextEntityAlignment.MIDDLE_CENTER)
        y -= seal + 0.08
        _txt(ps, p.get('status', 'NOT SEALED — DRAFT'), x0 + pad, y, 0.075, bold=True); y -= 0.14
        _txt(ps, f"DATE {p.get('date', '')}   ·   JOB {p.get('jobNo', '')}", x0 + pad, y, 0.065); y -= 0.12
        _txt(ps, f"PREPARED WITH {p.get('preparedWith', 'KEALEE')}", x0 + pad, y, 0.055); y -= 0.12
        _line(ps, (x0, y + 0.04), (x1, y + 0.04), layer='G-ANNO-TTLB')
        # sheet number at the foot
        foot = M + 0.95
        _line(ps, (x0, foot), (x1, foot), layer='G-ANNO-TTLB')
        _txt(ps, 'SHEET', x0 + pad, foot - 0.08, 0.055, layer='G-ANNO-TTLB')
        _txt(ps, sheet['id'], x0 + pad, foot - 0.2, 0.36, bold=True)
        _txt(ps, f'{idx + 1} OF {len(self.sheets)}', x1 - pad, foot - 0.25, 0.12, bold=True, align=TextEntityAlignment.TOP_RIGHT)
        # the rest of the column: the sheet index (no empty block)
        avail = y - foot - 0.1
        if avail > 0.4:
            _txt(ps, 'SHEET INDEX', x0 + pad, y, 0.055, layer='G-ANNO-TTLB'); y -= 0.12
            for s in self.sheets:
                if y - 0.12 < foot: break
                mark = '►' if s['id'] == sheet['id'] else ' '
                for k, w_ in enumerate(_wrap(f"{s['id']}  {s['title']}", TB_W - 2 * pad - 0.1, 0.06)):
                    _txt(ps, (mark if k == 0 else ' ') + ' ' + w_, x0 + pad, y, 0.06, bold=s['id'] == sheet['id'])
                    y -= 0.085

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
                         ('V-PROP-ADJN', 'Adjoining property'), ('C-TOPO-MAJR-E', 'Existing contour, 10-ft (NAVD 88)'),
                         ('C-TOPO-MINR-E', 'Existing contour, 2-ft'), ('C-ROAD-EDGE-E', 'Existing edge of road'),
                         ('C-ROAD-ROWL-E', 'Existing right-of-way'),
                         ('C-ENVR-SOIL-E', 'Soil boundary (USDA NRCS)'), ('V-ESMT', 'Easement')],
            'layout': [('V-PROP-BNDY', 'Boundary of record'), ('C-ROAD-ROWL-N', 'Estates Ct right-of-way'),
                       ('C-ROAD-PVMT-N', 'Proposed pavement'), ('C-ROAD-SWAL-N', 'Roadside swale (flowline)'),
                       ('C-STRM-CULV-N', 'Driveway culvert, 15" RCP w/ end sections'), ('C-BLDG-FTPR-N', 'Proposed dwelling'),
                       ('V-PROP-BRL', 'Building restriction line'), ('C-TOPO-MAJR-N', 'Proposed contour'),
                       ('C-TOPO-MINR-E', 'Existing contour'), ('C-TOPO-SPOT-N', 'Spot elevation (2009 plan, WSSC datum)'),
                       ('C-ESC-LOD', 'Limit of disturbance'), ('C-ROAD-IMPR-N', 'MD 210 auxiliary lane (SHA)')],
            'utility': [('C-WATR-MAIN-N', 'Proposed 8" water main'), ('C-SSWR-MAIN-N', 'Proposed 8" sanitary sewer'),
                        ('C-UTIL-SVCS-N', 'House connection'), ('V-ESMT', 'WSSC easement (recorded / proposed)'),
                        ('L-PLNT-TREE-N', 'Street tree — Red Maple (2009 plan)'), ('E-LITE-N', 'Street light (2009 plan)')],
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
            _txt(ps, lbl, x + 0.65, y, h)
            y -= h * 1.6
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
        self.viewport(ps, sh['kind'], DRAW_X0, self.band_top(), DRAW_X1, top, sc, centre=self.plan_c)
        _box(ps, DRAW_X0, self.band_top(), DRAW_X1, top, layer='G-ANNO-TABL')
        bar_scale(ps, DRAW_X0 + 0.15, self.band_top() + 0.25, sc, 200)
        # the band
        y0 = self.band_top() - 0.15
        x = DRAW_X0
        yl = self.legend(ps, x, y0, sh['kind'])
        x += 3.2
        return x, y0

    def sheet_existing(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        t = self.s['tables']['soils']
        _, w = table(ps, x, y0, t['title'], t['columns'], t['rows'], h=0.09, wrap_cols={1: 3.4})
        x += w + 0.3
        env = [[r['id'], r['status'], r['comment']] for r in self.s['checklist']['rows'] if r['id'].startswith('B-')]
        table(ps, x, y0, 'ENVIRONMENTAL FEATURES — DPIE CHECKLIST B', ['ITEM', 'C/X/O', 'FINDING'], env, h=0.075,
              wrap_cols={2: DRAW_X1 - x - 1.2})

    def sheet_layout(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        t = self.s['tables']['buildings']
        yb, w = table(ps, x, y0, t['title'], t['columns'], t['rows'], h=0.095)
        note = self.s['extras'].get('roadImprovementsNote')
        x2 = x + w + 0.3
        items = [n for n in (self.s['notes'].get('general') or [])[:5]]
        if note: items.append(note)
        paragraphs(ps, x2, y0, DRAW_X1 - x2, 'SITE, ROAD AND GRADING NOTES', items, h=0.1)

    def sheet_utility(self, ps, sh):
        x, y0 = self.sheet_plan(ps, sh)
        trees = sum(1 for f in self.s['twin']['features'] if f.get('kind') == 'Tree' and (f.get('attributes') or {}).get('streetTree'))
        lights = sum(1 for f in self.s['twin']['features'] if f.get('kind') == 'ProposedFeature' and (f.get('attributes') or {}).get('type') == 'street light')
        yb, w = table(ps, x, y0, 'STREET TREE AND STREET LIGHT SCHEDULE (2009 PLAN)',
                      ['SYMBOL', 'QTY', 'ITEM', 'SIZE / TYPE', 'STANDARD'],
                      [['TREE', trees, 'ACER RUBRUM — RED MAPLE', '2 1/2"–3" CAL., B&B', 'DPW&T 600.02 / 600.04'],
                       ['LIGHT', lights, 'STREET LIGHT (SMECO)', '100 W HPS COLONIAL POST-TOP, TYPE IV, BLACK FIBERGLASS', 'DPW&T 500.10']],
                      h=0.095, wrap_cols={3: 3.0})
        x2 = x + w + 0.3
        paragraphs(ps, x2, y0, DRAW_X1 - x2, 'UTILITY NOTES', [
            'Water and sewer by WSSC (W-3 / S-3). Mains from the existing WSSC mains in Henrietta Drive through the recorded 30\' WSSC easement (L.51799 F.399, Outlot A and Lot 20) and a 30\' WSSC easement to be granted across Lot 4 along the Lot 3/4 line.',
            'Sizes and inverts of the Henrietta Drive mains to be verified on WSSC 200\' sheet 220SE01 before technical design.',
            'Street lights and street trees follow the approved 2009 Street Tree & Lighting Plan (DPW&T 9399-2009; light permit 09.09399); electric service by SMECO.',
            'Keep street trees 10 ft from water meters and storm structures and 15 ft from street lights (DPW&T 600.02).',
            *self._service_notes(),
            'Contact Miss Utility (811) at least 48 hours before excavation.'], h=0.1)

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
        paragraphs(ps, x2, yb2 - 0.15, DRAW_X1 - x2, 'SWM NOTES', (self.s['notes'].get('swm') or []) + [self.s['poi']['method']], h=0.09)

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
        yb = paragraphs(ps, x, y0, 7.5, 'SEDIMENT AND EROSION CONTROL NOTES', self.s['notes'].get('esc') or [], h=0.1)
        paragraphs(ps, x + 7.8, y0, DRAW_X1 - x - 7.8, 'SEQUENCE OF CONSTRUCTION', self.s['notes'].get('sequence') or [], h=0.1)

    def sheet_details(self, ps, sh):
        self.plan_title(ps, sh)
        x = DRAW_X0; top = H - M - 0.6
        # the county standards, reproduced from the approved 2009 sheet
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
        self.m8_section(ps, DRAW_X0 + 20.2, y)

    def typical_section(self, ps, x, y):
        s = 0.2   # in per ft (1" = 5')
        _txt(ps, 'ESTATES COURT — TYPICAL SECTION (RURAL OPEN SECTION, 60\' R/W)', x, y, 0.1, bold=True)
        base = y - 2.2
        # R/W to R/W 60 ft centred
        cx = x + 6.5
        pts = []
        prof = [(-30, 0.9), (-26, 0.9), (-22, 0.1), (-20, -0.4), (-18, 0.1), (-16, 0.55), (-12, 0.7), (0, 0.94), (12, 0.7),
                (16, 0.55), (18, 0.1), (20, -0.4), (22, 0.1), (26, 0.9), (30, 0.9)]
        ps.add_lwpolyline([(cx + a * s, base + b * s * 2) for a, b in prof], dxfattribs={'layer': 'G-ANNO-TTLB'})
        ps.add_lwpolyline([(cx - 12 * s, base + 0.7 * s * 2 - 0.05), (cx, base + 0.94 * s * 2 - 0.05), (cx + 12 * s, base + 0.7 * s * 2 - 0.05)],
                          dxfattribs={'layer': 'G-ANNO-TABL'})
        for xf, lab in ((-30, 'R/W'), (30, 'R/W')):
            _line(ps, (cx + xf * s, base - 0.3), (cx + xf * s, base + 0.9), layer='G-ANNO-TABL')
            _txt(ps, lab, cx + xf * s, base + 0.95, 0.07, align=TextEntityAlignment.BOTTOM_CENTER)
        dims = [(-30, 30, "60' R/W"), (-12, 12, "24' PAVEMENT"), (-16, -12, "4' SHLD"), (12, 16, "4' SHLD"), (-22, -18, 'SWALE'), (18, 22, 'SWALE')]
        for i, (a, b, lab) in enumerate(dims):
            yy = base - 0.45 - (0.22 if i == 0 else 0.0) * 0
            yy = base - 0.45 - 0.22 * (i // 2)
            _line(ps, (cx + a * s, yy), (cx + b * s, yy), layer='G-ANNO-TABL')
            _txt(ps, lab, cx + (a + b) / 2 * s, yy + 0.03, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
        notes = ['1 1/2" SURFACE + 2 1/2" BASE BIT. CONC. ON 6" GAB (DPW&T PAVEMENT SCHEDULE FOR RURAL RESIDENTIAL — CONFIRM)',
                 'CROSS SLOPE 2%; 4-FT STABILIZED SHOULDERS; SWALE FLOWLINE 20 FT OFF CENTRELINE, 3:1 SIDE SLOPES',
                 'DRIVEWAYS CROSS THE SWALE ON 15" RCP CULVERTS WITH FLARED END SECTIONS (DPW&T STD. 600.02)']
        yy = base - 1.3
        for n in notes:
            _txt(ps, n, x, yy, 0.065); yy -= 0.12

    def m6_section(self, ps, x, y):
        _txt(ps, 'MICRO-BIORETENTION (M-6) — TYPICAL SECTION', x, y, 0.1, bold=True)
        b = y - 2.4
        w = 5.2
        ps.add_lwpolyline([(x, b + 1.6), (x + 0.8, b + 1.0), (x + w - 0.8, b + 1.0), (x + w, b + 1.6)], dxfattribs={'layer': 'G-ANNO-TTLB'})
        for yy, lab in ((1.0, '12" MAX. PONDING'), (0.55, '3" MULCH / 2.5\' FILTER MEDIA (n = 0.40)'), (0.2, '12" #57 STONE WITH 4" PVC UNDERDRAIN')):
            _line(ps, (x + 0.8, b + yy), (x + w - 0.8, b + yy), layer='G-ANNO-TABL')
            _txt(ps, lab, x + w / 2, b + yy + 0.03, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
        ps.add_circle((x + w / 2, b + 0.1), 0.06, dxfattribs={'layer': 'G-ANNO-TABL'})
        _txt(ps, 'MDE DESIGN MANUAL CH. 5, SEC. 5.4.3 (M-6); SIZED PER THE BMP SUMMARY TABLE', x, b - 0.2, 0.06)

    def m8_section(self, ps, x, y):
        _txt(ps, 'DRY SWALE (M-8) WITH CHECK DAM', x, y, 0.1, bold=True)
        b = y - 2.4
        ps.add_lwpolyline([(x, b + 1.4), (x + 1.2, b + 0.6), (x + 2.4, b + 0.6), (x + 3.6, b + 1.4)], dxfattribs={'layer': 'G-ANNO-TTLB'})
        _line(ps, (x + 1.2, b + 0.3), (x + 2.4, b + 0.3), layer='G-ANNO-TABL')
        _txt(ps, "4' BOTTOM", x + 1.8, b + 0.62, 0.06, align=TextEntityAlignment.BOTTOM_CENTER)
        _txt(ps, '2.5\' FILTER MEDIA', x + 1.8, b + 0.33, 0.055, align=TextEntityAlignment.BOTTOM_CENTER)
        _txt(ps, '3:1', x + 0.45, b + 1.05, 0.06); _txt(ps, '3:1', x + 2.9, b + 1.05, 0.06)
        _txt(ps, 'CHECK DAMS AT 6" MAX. HEAD; UNDERDRAIN IN HSG C SOILS', x, b - 0.2, 0.06)

    def sheet_cover(self, ps, sh):
        s = self.s
        p = s.get('project') or {}
        _txt(ps, p.get('planType', 'SITE DEVELOPMENT CONCEPT PLAN'), DRAW_X0, H - M - 0.2, 0.42, bold=True)
        _txt(ps, p.get('project', ''), DRAW_X0, H - M - 0.78, 0.22)
        _txt(ps, f"{p.get('location', '')}  ·  {p.get('record', '')}  ·  {p.get('districts', '')}", DRAW_X0, H - M - 1.1, 0.1)
        _txt(ps, 'Stormwater management by Environmental Site Design to the Maximum Extent Practicable (MDE Design Manual Ch. 5; PGC Subtitle 32). '
             'Layout per the approved 2009 Street Tree & Lighting Plan, DPW&T 9399-2009-00.', DRAW_X0, H - M - 1.28, 0.085)
        # vicinity map, upper right
        vx0, vx1 = DRAW_X1 - 6.4, DRAW_X1
        vy1 = H - M - 0.2; vy0 = vy1 - 4.3
        self.viewport(ps, 'vicinity', vx0, vy0, vx1, vy1, 2000.0)
        _box(ps, vx0, vy0, vx1, vy1, layer='G-ANNO-TABL', lw=35)
        _txt(ps, 'VICINITY MAP   SCALE: 1" = 2,000\'', vx0 + 0.08, vy1 - 0.08, 0.09, bold=True)
        ps.add_blockref('NORTH', (vx1 - 0.35, vy1 - 0.75), dxfattribs={'layer': 'G-ANNO-TTLB'})
        bar_scale(ps, vx0 + 0.15, vy0 + 0.18, 2000.0, 4000)
        # BMP summary, full width under the title (left of the vicinity map)
        y = H - M - 1.6
        rows = [[r['bmp'], r['practice'], r['mdeCode'], r['location'], r['ownership'], r['poi'], f"{r['daSqFt']:,}", f"{r['impSqFt']:,}",
                 f"{r['percentImpervious']:.1f}", r['hsg'], f"{r['peIn']:.1f}", f"{r['rv']:.3f}", f"{r['esdvReqCf']:,}", f"{r['esdvProvCf']:,}",
                 f"{r['revReqCf']:,}", f"{r['surfaceSqFt']:,}", f"N {r['at'][1]:,.0f}  E {r['at'][0]:,.0f}"] for r in s['bmp']['rows']]
        t = s['bmp']['totals']
        for b_ in s['bmp']['byPoi']:
            rows.append(['', f"SUBTOTAL {b_['poi']}", '', '', '', b_['poi'], '', '', '', '', '', '', f"{b_['req']:,}", f"{b_['prov']:,}", '', '', ''])
        rows.append(['TOTAL', f"{len(s['bmp']['rows'])} ESD practices", '', '', '', '', f"{t['daSqFt']:,}", f"{t['impSqFt']:,}", '', '', '', '',
                     f"{t['esdvReqCf']:,}", f"{t['esdvProvCf']:,}", f"{t['revReqCf']:,}", f"{t['surfaceSqFt']:,}", ''])
        yb, w = table(ps, DRAW_X0, y, "PRINCE GEORGE'S COUNTY BMP SUMMARY TABLE — ESD BY POINT OF INVESTIGATION (A-15, C-9)",
                      ['BMP', 'PRACTICE', 'MDE', 'LOCATION', 'OWNERSHIP / MAINT.', 'POI', 'DA SF', 'IMP SF', '%I', 'HSG', 'P_E IN', 'Rv',
                       'ESDv REQ CF', 'ESDv PROV CF', 'Rev REQ CF', 'SURFACE SF', 'COORDINATES (NAD 83)'],
                      rows, h=0.085, max_width=vx0 - DRAW_X0 - 0.3, bold_last=True, wrap_cols={4: 1.6, 1: 1.5})
        _txt(ps, f"P_E from {s['bmp']['citation']}; HSG {s['bmp']['rows'][0]['hsg'] if s['bmp']['rows'] else 'C'} governing. Rv = 0.05 + 0.009·I; ESDv = P_E·Rv·A/12; "
             'Rev = S·Rv·A/12 (S = 0.13 in, HSG C), met within ESDv. M-8 provided = 6 cf per ft (4-ft bottom, 6" ponding, 2.5\' media at n 0.40).',
             DRAW_X0, yb - 0.06, 0.06)
        # three columns below
        ytop = min(yb, vy0) - 0.35
        colw = (DRAW_X1 - DRAW_X0 - 0.6) / 3
        c1, c2 = DRAW_X0, DRAW_X0 + colw + 0.3
        c3 = DRAW_X0 + 2 * (colw + 0.3)
        # col 1: site data, approvals, general notes
        y1, _ = table(ps, c1, ytop, 'SITE DATA', ['ITEM', 'DATA'], s['tables']['siteData']['rows'], h=0.085, wrap_cols={1: colw - 1.4}, max_width=colw)
        y1, _ = table(ps, c1, y1 - 0.25, 'APPROVALS OF RECORD', ['CASE', 'STATUS'], s['tables']['approvals']['rows'], h=0.085, max_width=colw)
        paragraphs(ps, c1, y1 - 0.25, colw, 'GENERAL NOTES', s['notes'].get('general') or [], h=0.085)
        # cols 2-3: the DPIE checklist, answered line by line
        rows = [[r['id'], r['text'], r['reference'], r['status'], r['comment'], r['sheet']] for r in s['checklist']['rows']]
        half = (len(rows) + 1) // 2
        split = next((i for i in range(half, len(rows)) if rows[i][0][0] != rows[i - 1][0][0]), half)
        yl, _ = table(ps, c2, ytop, 'DPIE CONCEPT PLAN DESIGN REVIEW CHECKLIST (08/25/2021) — C = SHOWN · X = N/A · O = OUTSTANDING',
                      ['ITEM', 'REQUIREMENT', 'REF.', 'C/X/O', 'RESPONSE / WHERE SHOWN', 'SHEET'], rows[:split], h=0.075,
                      wrap_cols={1: colw * 0.38, 4: colw * 0.36}, max_width=colw)
        table(ps, c3, ytop, 'CHECKLIST (CONT.)', ['ITEM', 'REQUIREMENT', 'REF.', 'C/X/O', 'RESPONSE / WHERE SHOWN', 'SHEET'], rows[split:], h=0.075,
              wrap_cols={1: colw * 0.38, 4: colw * 0.36}, max_width=colw)
