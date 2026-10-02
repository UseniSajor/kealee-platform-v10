"""
Civil and site plan symbol library — DXF blocks for cad-plot.

Every symbol is a DXF block, defined once per drawing and INSERTed wherever it
is used, so the DXF a receiving engineer opens carries real symbols, not loose
circles. Conventions follow the US National CAD Standard (NCS) symbology as
civil sheets in Prince George's County draw it:

* Geometry is in MODEL FEET at a size that reads at 1" = 30' (a 3-ft
  manhole plots at 0.1"). Paper-space symbols (north arrow) are in inches.
* Block entities sit on layer 0 with colour and lineweight BYBLOCK, so a
  symbol takes the layer, colour and lineweight of the INSERT -- the same
  hydrant block is existing (screened) or proposed (heavy) by its layer.
  The original cad-plot blocks (TREE, TREE_EXIST, LIGHT, SPOT, POI, NORTH)
  keep their names and their own layers so existing drawings are unchanged.
* Callouts carry ATTDEFs (tags) so the number and sheet are real block
  attributes.

Use: ``define(doc)`` once, then ``msp.add_blockref(name, at, dxfattribs=...)``
(or ``add_auto_blockref`` for the callouts). ``SYMBOLS`` lists every block with
its category and description; ``catalog(path)`` writes a symbol sheet (DXF and
PDF) to review the set.
"""
import math

from ezdxf.enums import TextEntityAlignment

# name -> (category, description, default layer for an INSERT)
SYMBOLS = {
    # ── utilities ────────────────────────────────────────────────────────
    'HYDRANT': ('Utilities', 'Fire hydrant', 'C-WATR-HYDR'),
    'WATER_VALVE': ('Utilities', 'Water valve', 'C-WATR-VALV'),
    'WATER_METER': ('Utilities', 'Water meter', 'C-WATR-METR'),
    'BLOWOFF': ('Utilities', 'Blow-off / end of water main', 'C-WATR-VALV'),
    'SAN_MH': ('Utilities', 'Sanitary sewer manhole', 'C-SSWR-STRC'),
    'CLEANOUT': ('Utilities', 'Sewer cleanout', 'C-SSWR-STRC'),
    'STORM_MH': ('Utilities', 'Storm drain manhole', 'C-STRM-STRC'),
    'INLET': ('Utilities', 'Storm inlet (curb / grate)', 'C-STRM-STRC'),
    'ENDWALL': ('Utilities', 'Flared end section / endwall', 'C-STRM-STRC'),
    'UTIL_POLE': ('Utilities', 'Utility pole (power / telephone)', 'V-UTIL-POLE'),
    'GUY_ANCHOR': ('Utilities', 'Guy anchor', 'V-UTIL-POLE'),
    'LIGHT': ('Utilities', 'Street light', 'E-LITE-N'),
    'GAS_VALVE': ('Utilities', 'Gas valve', 'C-NGAS-VALV'),
    'TELE_PED': ('Utilities', 'Telephone / CATV pedestal', 'C-COMM-STRC'),
    'ELEC_BOX': ('Utilities', 'Electric transformer / box', 'E-POWR-STRC'),
    # ── survey control and property ─────────────────────────────────────
    'IPF': ('Survey', 'Iron pipe / pin found', 'V-SURV-MONU'),
    'IPS': ('Survey', 'Iron pin set', 'V-SURV-MONU'),
    'MONUMENT': ('Survey', 'Concrete monument', 'V-SURV-MONU'),
    'BENCHMARK': ('Survey', 'Benchmark / traverse point', 'V-SURV-CTRL'),
    'SPOT': ('Survey', 'Spot elevation', 'C-TOPO-SPOT-N'),
    # ── planting ────────────────────────────────────────────────────────
    'TREE': ('Planting', 'Proposed deciduous shade tree', 'L-PLNT-TREE-N'),
    'TREE_EVERGREEN': ('Planting', 'Proposed evergreen tree', 'L-PLNT-TREE-N'),
    'TREE_ORNAMENTAL': ('Planting', 'Proposed ornamental tree', 'L-PLNT-TREE-N'),
    'SHRUB': ('Planting', 'Proposed shrub', 'L-PLNT-SHRB-N'),
    'TREE_EXIST': ('Planting', 'Existing tree', 'V-VEGT-TREE-E'),
    # ── site features ───────────────────────────────────────────────────
    'SIGN': ('Site', 'Sign', 'C-SITE-SIGN'),
    'MAILBOX': ('Site', 'Mailbox', 'C-SITE-FURN'),
    'BOLLARD': ('Site', 'Bollard', 'C-SITE-FURN'),
    'FLOW_ARROW': ('Site', 'Drainage flow direction', 'C-SWM-FLOW'),
    'POI': ('Site', 'Stormwater point of investigation', 'C-SWM-POI'),
    # ── erosion and sediment control ────────────────────────────────────
    'INLET_PROT': ('Sediment control', 'Inlet protection', 'C-ESC-ANNO'),
    'CHECK_DAM': ('Sediment control', 'Rock check dam', 'C-ESC-ANNO'),
    'STOCKPILE': ('Sediment control', 'Stockpile area', 'C-ESC-ANNO'),
    # ── drafting (paper space or model) ─────────────────────────────────
    'NORTH': ('Drafting', 'North arrow (paper inches)', 'G-ANNO-TTLB'),
    'DETAIL_CALLOUT': ('Drafting', 'Detail callout (number / sheet)', 'G-ANNO-SYMB'),
    'SECTION_CALLOUT': ('Drafting', 'Section cut (number / sheet)', 'G-ANNO-SYMB'),
    'MATCH_LINE': ('Drafting', 'Match line end tick', 'G-ANNO-SYMB'),
}

B = {'layer': '0', 'color': 0, 'lineweight': -2}      # BYBLOCK colour and lineweight


def _circle_pts(r, n=24, a0=0.0):
    return [(r * math.cos(a0 + 2 * math.pi * k / n), r * math.sin(a0 + 2 * math.pi * k / n)) for k in range(n)]


def _fill(b, pts, attrs=B):
    h = b.add_hatch(color=0, dxfattribs=attrs)
    h.paths.add_polyline_path(pts, is_closed=True)


def _txt(b, s, h, at=(0, 0), attrs=B):
    b.add_text(s, height=h, dxfattribs={**attrs, 'style': 'KEALEE-B'}).set_placement(at, align=TextEntityAlignment.MIDDLE_CENTER)


def _legacy(doc):
    """The original cad-plot blocks, unchanged (names and layers kept)."""
    if 'TREE' not in doc.blocks:
        b = doc.blocks.new('TREE')
        L = {'layer': 'L-PLNT-TREE-N'}
        b.add_circle((0, 0), 7.5, dxfattribs=L)
        n = 10
        pts = [(7.5 * math.cos(2 * math.pi * k / n) * (1 if k % 2 else 0.82), 7.5 * math.sin(2 * math.pi * k / n) * (1 if k % 2 else 0.82)) for k in range(n)]
        b.add_lwpolyline(pts, close=True, dxfattribs=L)
        b.add_line((-1.5, 0), (1.5, 0), dxfattribs=L); b.add_line((0, -1.5), (0, 1.5), dxfattribs=L)
    if 'TREE_EXIST' not in doc.blocks:
        b = doc.blocks.new('TREE_EXIST')
        L = {'layer': 'V-VEGT-TREE-E'}
        n = 16
        pts = [(6.0 * math.cos(2 * math.pi * k / n) * (0.88 if k % 2 == 0 else 1.0),
                6.0 * math.sin(2 * math.pi * k / n) * (0.88 if k % 2 == 0 else 1.0)) for k in range(n)]
        b.add_lwpolyline(pts, close=True, dxfattribs=L)
        b.add_circle((0, 0), 0.65, dxfattribs=L)
        h = b.add_hatch(color=8, dxfattribs=L)
        h.paths.add_polyline_path([(0.65 * math.cos(t / 12 * 2 * math.pi), 0.65 * math.sin(t / 12 * 2 * math.pi)) for t in range(12)], is_closed=True)
    if 'LIGHT' not in doc.blocks:
        b = doc.blocks.new('LIGHT')
        L = {'layer': 'E-LITE-N'}
        b.add_circle((0, 0), 1.6, dxfattribs=L)
        b.add_hatch(color=7, dxfattribs=L).paths.add_polyline_path([(1.6 * math.cos(t / 12 * 2 * math.pi), 1.6 * math.sin(t / 12 * 2 * math.pi)) for t in range(12)], is_closed=True)
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2
            b.add_line((2.2 * math.cos(a), 2.2 * math.sin(a)), (4.2 * math.cos(a), 4.2 * math.sin(a)), dxfattribs=L)
    if 'SPOT' not in doc.blocks:
        b = doc.blocks.new('SPOT')
        L = {'layer': 'C-TOPO-SPOT-N'}
        b.add_line((-0.9, -0.9), (0.9, 0.9), dxfattribs=L); b.add_line((-0.9, 0.9), (0.9, -0.9), dxfattribs=L)
    if 'POI' not in doc.blocks:
        b = doc.blocks.new('POI')
        L = {'layer': 'C-SWM-POI'}
        b.add_circle((0, 0), 5.0, dxfattribs=L); b.add_circle((0, 0), 3.2, dxfattribs=L)
    if 'NORTH' not in doc.blocks:
        b = doc.blocks.new('NORTH')   # paper units (inches)
        b.add_lwpolyline([(0, 0.55), (-0.16, -0.25), (0, -0.1)], close=True)
        h = b.add_hatch(color=7); h.paths.add_polyline_path([(0, 0.55), (-0.16, -0.25), (0, -0.1)], is_closed=True)
        b.add_lwpolyline([(0, 0.55), (0.16, -0.25), (0, -0.1)], close=True)
        b.add_text('N', height=0.16, dxfattribs={'style': 'KEALEE-B'}).set_placement((0, 0.62), align=TextEntityAlignment.BOTTOM_CENTER)


def _new(doc, name):
    return None if name in doc.blocks else doc.blocks.new(name)


def define(doc):
    """Define every symbol block in `doc` (idempotent)."""
    if 'KEALEE-B' not in doc.styles:
        doc.styles.add('KEALEE-B', font='arialbd.ttf')
    _legacy(doc)

    # utilities ─────────────────────────────────────────────────────────
    if (b := _new(doc, 'HYDRANT')) is not None:            # body circle, two nozzles, filled core
        b.add_circle((0, 0), 1.5, dxfattribs=B)
        b.add_line((-2.6, 0), (-1.5, 0), dxfattribs=B); b.add_line((1.5, 0), (2.6, 0), dxfattribs=B)
        b.add_line((-2.6, -0.6), (-2.6, 0.6), dxfattribs=B); b.add_line((2.6, -0.6), (2.6, 0.6), dxfattribs=B)
        _fill(b, _circle_pts(0.7, 12))
    if (b := _new(doc, 'WATER_VALVE')) is not None:        # bow-tie in a square box
        b.add_lwpolyline([(-1.2, -1.2), (1.2, -1.2), (1.2, 1.2), (-1.2, 1.2)], close=True, dxfattribs=B)
        _fill(b, [(-1.0, -0.8), (0, 0), (-1.0, 0.8)]); _fill(b, [(1.0, -0.8), (0, 0), (1.0, 0.8)])
    if (b := _new(doc, 'WATER_METER')) is not None:
        b.add_lwpolyline([(-1.4, -1.0), (1.4, -1.0), (1.4, 1.0), (-1.4, 1.0)], close=True, dxfattribs=B)
        _txt(b, 'M', 1.2)
    if (b := _new(doc, 'BLOWOFF')) is not None:            # capped end with a riser
        b.add_line((0, -1.6), (0, 1.6), dxfattribs=B)
        b.add_circle((1.2, 0), 1.0, dxfattribs=B); _txt(b, 'BO', 0.7, (1.2, 0))
    if (b := _new(doc, 'SAN_MH')) is not None:
        b.add_circle((0, 0), 2.0, dxfattribs=B); _txt(b, 'S', 1.6)
    if (b := _new(doc, 'CLEANOUT')) is not None:
        b.add_circle((0, 0), 0.9, dxfattribs=B); _fill(b, _circle_pts(0.35, 10))
    if (b := _new(doc, 'STORM_MH')) is not None:
        b.add_circle((0, 0), 2.0, dxfattribs=B); _txt(b, 'D', 1.6)
    if (b := _new(doc, 'INLET')) is not None:              # 4 x 2.5 box, grate hatch
        b.add_lwpolyline([(-2.0, -1.25), (2.0, -1.25), (2.0, 1.25), (-2.0, 1.25)], close=True, dxfattribs=B)
        for x in (-1.2, -0.4, 0.4, 1.2):
            b.add_line((x, -1.25), (x, 1.25), dxfattribs=B)
    if (b := _new(doc, 'ENDWALL')) is not None:            # flared end section, pipe enters from -x
        b.add_lwpolyline([(-1.0, -0.9), (1.6, -2.0), (1.6, 2.0), (-1.0, 0.9)], close=True, dxfattribs=B)
    if (b := _new(doc, 'UTIL_POLE')) is not None:          # circle with a cross through it
        b.add_circle((0, 0), 1.2, dxfattribs=B)
        b.add_line((-2.0, 0), (2.0, 0), dxfattribs=B); b.add_line((0, -2.0), (0, 2.0), dxfattribs=B)
    if (b := _new(doc, 'GUY_ANCHOR')) is not None:         # arrow to the anchor
        b.add_line((0, 0), (3.0, 0), dxfattribs=B)
        _fill(b, [(3.0, 0), (2.0, 0.6), (2.0, -0.6)])
    if (b := _new(doc, 'GAS_VALVE')) is not None:
        b.add_lwpolyline([(-1.2, -1.2), (1.2, -1.2), (1.2, 1.2), (-1.2, 1.2)], close=True, dxfattribs=B)
        _txt(b, 'G', 1.2)
    if (b := _new(doc, 'TELE_PED')) is not None:
        b.add_lwpolyline([(-1.0, -1.0), (1.0, -1.0), (1.0, 1.0), (-1.0, 1.0)], close=True, dxfattribs=B)
        _txt(b, 'T', 1.1)
    if (b := _new(doc, 'ELEC_BOX')) is not None:
        b.add_lwpolyline([(-1.6, -1.2), (1.6, -1.2), (1.6, 1.2), (-1.6, 1.2)], close=True, dxfattribs=B)
        _txt(b, 'E', 1.2)

    # survey ────────────────────────────────────────────────────────────
    if (b := _new(doc, 'IPF')) is not None:                # found: filled circle
        _fill(b, _circle_pts(0.9, 16)); b.add_circle((0, 0), 0.9, dxfattribs=B)
    if (b := _new(doc, 'IPS')) is not None:                # set: open circle with centre dot
        b.add_circle((0, 0), 0.9, dxfattribs=B); _fill(b, _circle_pts(0.25, 8))
    if (b := _new(doc, 'MONUMENT')) is not None:           # concrete monument: filled square
        sq = [(-0.9, -0.9), (0.9, -0.9), (0.9, 0.9), (-0.9, 0.9)]
        b.add_lwpolyline(sq, close=True, dxfattribs=B); _fill(b, sq)
    if (b := _new(doc, 'BENCHMARK')) is not None:          # triangle with centre dot
        tri = [(0, 1.6), (-1.4, -0.8), (1.4, -0.8)]
        b.add_lwpolyline(tri, close=True, dxfattribs=B); _fill(b, _circle_pts(0.3, 8))

    # planting ──────────────────────────────────────────────────────────
    if (b := _new(doc, 'TREE_EVERGREEN')) is not None:     # star of 12 points
        n = 24
        pts = [((6.0 if k % 2 == 0 else 4.2) * math.cos(2 * math.pi * k / n), (6.0 if k % 2 == 0 else 4.2) * math.sin(2 * math.pi * k / n)) for k in range(n)]
        b.add_lwpolyline(pts, close=True, dxfattribs=B)
        b.add_line((-1.2, 0), (1.2, 0), dxfattribs=B); b.add_line((0, -1.2), (0, 1.2), dxfattribs=B)
    if (b := _new(doc, 'TREE_ORNAMENTAL')) is not None:    # scalloped 4-ft radius
        n = 8
        for k in range(n):
            a = 2 * math.pi * k / n
            b.add_arc((3.2 * math.cos(a), 3.2 * math.sin(a)), 1.3, math.degrees(a) - 70, math.degrees(a) + 70, dxfattribs=B)
        _fill(b, _circle_pts(0.35, 8))
    if (b := _new(doc, 'SHRUB')) is not None:
        n = 6
        for k in range(n):
            a = 2 * math.pi * k / n
            b.add_arc((1.6 * math.cos(a), 1.6 * math.sin(a)), 0.8, math.degrees(a) - 75, math.degrees(a) + 75, dxfattribs=B)

    # site ──────────────────────────────────────────────────────────────
    if (b := _new(doc, 'SIGN')) is not None:               # post and plate
        b.add_line((0, 0), (0, 1.6), dxfattribs=B)
        b.add_lwpolyline([(-1.2, 1.6), (1.2, 1.6), (1.2, 2.6), (-1.2, 2.6)], close=True, dxfattribs=B)
        _fill(b, _circle_pts(0.25, 8))
    if (b := _new(doc, 'MAILBOX')) is not None:
        b.add_lwpolyline([(-1.0, -0.6), (1.0, -0.6), (1.0, 0.6), (-1.0, 0.6)], close=True, dxfattribs=B)
        _txt(b, 'MB', 0.6)
    if (b := _new(doc, 'BOLLARD')) is not None:
        b.add_circle((0, 0), 0.6, dxfattribs=B); _fill(b, _circle_pts(0.6, 12))
    if (b := _new(doc, 'FLOW_ARROW')) is not None:         # 8-ft arrow, points +x
        b.add_line((-4.0, 0), (2.5, 0), dxfattribs=B)
        _fill(b, [(4.0, 0), (2.0, 0.8), (2.0, -0.8)])

    # sediment control ──────────────────────────────────────────────────
    if (b := _new(doc, 'INLET_PROT')) is not None:         # inlet box ringed by filter fabric
        b.add_lwpolyline([(-2.0, -1.25), (2.0, -1.25), (2.0, 1.25), (-2.0, 1.25)], close=True, dxfattribs=B)
        b.add_lwpolyline([(-3.0, -2.25), (3.0, -2.25), (3.0, 2.25), (-3.0, 2.25)], close=True, dxfattribs={**B, 'linetype': 'DASHED'})
    if (b := _new(doc, 'CHECK_DAM')) is not None:          # stone across a channel, 6 ft
        for k in range(6):
            b.add_circle((-2.5 + k, 0), 0.5, dxfattribs=B)
        b.add_line((-3.0, -0.9), (3.0, -0.9), dxfattribs=B); b.add_line((-3.0, 0.9), (3.0, 0.9), dxfattribs=B)
    if (b := _new(doc, 'STOCKPILE')) is not None:          # mound outline and S
        b.add_lwpolyline(_circle_pts(5.0, 24), close=True, dxfattribs={**B, 'linetype': 'DASHED'})
        _txt(b, 'STOCKPILE', 1.0)

    # drafting ──────────────────────────────────────────────────────────
    if (b := _new(doc, 'DETAIL_CALLOUT')) is not None:     # bubble: number over sheet
        b.add_circle((0, 0), 3.0, dxfattribs=B); b.add_line((-3.0, 0), (3.0, 0), dxfattribs=B)
        b.add_attdef('NUM', (0, 1.4), dxfattribs={**B, 'height': 1.6, 'style': 'KEALEE-B'}).set_placement((0, 1.4), align=TextEntityAlignment.MIDDLE_CENTER)
        b.add_attdef('SHEET', (0, -1.4), dxfattribs={**B, 'height': 1.3, 'style': 'KEALEE-B'}).set_placement((0, -1.4), align=TextEntityAlignment.MIDDLE_CENTER)
    if (b := _new(doc, 'SECTION_CALLOUT')) is not None:    # bubble with a direction flag
        b.add_circle((0, 0), 3.0, dxfattribs=B); b.add_line((-3.0, 0), (3.0, 0), dxfattribs=B)
        _fill(b, [(3.0, 0), (0, 3.0), (5.0, 3.0)])
        b.add_attdef('NUM', (0, 1.4), dxfattribs={**B, 'height': 1.6, 'style': 'KEALEE-B'}).set_placement((0, 1.4), align=TextEntityAlignment.MIDDLE_CENTER)
        b.add_attdef('SHEET', (0, -1.4), dxfattribs={**B, 'height': 1.3, 'style': 'KEALEE-B'}).set_placement((0, -1.4), align=TextEntityAlignment.MIDDLE_CENTER)
    if (b := _new(doc, 'MATCH_LINE')) is not None:
        b.add_line((0, -2.0), (0, 2.0), dxfattribs=B)
        _fill(b, [(0, 2.0), (1.4, 1.0), (0, 0.6)])


def catalog(out_base):
    """Write a symbol sheet: `<out_base>.dxf` and `<out_base>.pdf` (ARCH B, 18 x 12)."""
    import ezdxf
    from .plot import plot
    doc = ezdxf.new('R2018', setup=True)
    define(doc)
    for lt in ('DASHED',):
        if lt not in doc.linetypes:
            doc.linetypes.add(lt, pattern=[0.5, 0.25, -0.25])
    # the layers the symbols are inserted on, so BYBLOCK geometry plots at a real weight
    for _n, (_c, _d, _lay) in SYMBOLS.items():
        if _lay not in doc.layers:
            doc.layers.add(_lay, color=7, lineweight=25)
    for _lay in ('L-PLNT-TREE-N', 'V-VEGT-TREE-E', 'E-LITE-N', 'C-TOPO-SPOT-N', 'C-SWM-POI'):
        if _lay not in doc.layers:
            doc.layers.add(_lay, color=7, lineweight=25)
    ps = doc.layouts.new('SYMBOLS')
    ps.page_setup(size=(18, 12), margins=(0, 0, 0, 0), units='inch')
    ps.add_text('KEALEE CAD-PLOT — CIVIL / SITE PLAN SYMBOL LIBRARY', height=0.22, dxfattribs={'style': 'KEALEE-B'}).set_placement((0.6, 11.4))
    ps.add_text('Model-space symbols shown at 1" = 30\' (block units: feet). Drafting symbols in paper inches.', height=0.11).set_placement((0.6, 11.1))
    cats = []
    for name, (cat, desc, lay) in SYMBOLS.items():
        if cat not in cats: cats.append(cat)
    col_w, row_h = 4.3, 0.55
    x0, y = 0.6, 10.6
    col = 0
    for cat in cats:
        items = [(n, d, l) for n, (c, d, l) in SYMBOLS.items() if c == cat]
        need = (len(items) + 1) * row_h
        if y - need < 0.5:
            col += 1; y = 10.6
        x = x0 + col * col_w
        ps.add_text(cat.upper(), height=0.14, dxfattribs={'style': 'KEALEE-B'}).set_placement((x, y)); y -= row_h * 0.8
        for name, desc, lay in items:
            s = 0.45 if name == 'NORTH' else 1.0 / 30.0
            if name in ('DETAIL_CALLOUT', 'SECTION_CALLOUT'):
                ps.add_auto_blockref(name, (x + 0.35, y + 0.06), {'NUM': '1', 'SHEET': 'C-600'}, dxfattribs={'xscale': s, 'yscale': s, 'layer': lay})
            else:
                ps.add_blockref(name, (x + 0.35, y + 0.06), dxfattribs={'xscale': s, 'yscale': s, 'layer': lay})
            ps.add_text(f'{name} — {desc}', height=0.1).set_placement((x + 0.8, y))
            ps.add_text(f'layer {lay}', height=0.075, dxfattribs={'color': 8}).set_placement((x + 0.8, y - 0.14))
            y -= row_h
        y -= row_h * 0.3
    doc.saveas(out_base + '.dxf')
    plot(doc, ['SYMBOLS'], out_base + '.pdf', size_in=(18, 12))
    return out_base + '.dxf', out_base + '.pdf'


if __name__ == '__main__':
    import sys
    print(catalog(sys.argv[1] if len(sys.argv) > 1 else 'cad-plot-symbols'))
