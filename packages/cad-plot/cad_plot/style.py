"""
Layers, linetypes, text styles and pens — the drafting standard for cad-plot.

Layer names follow the US National CAD Standard (NCS / AIA CAD Layer
Guidelines), <discipline>-<major>-<minor>[-<status>], status E = existing,
N = new. Colours are chosen for a monochrome-first civil set: the plot is black
on white; colour is kept in the DXF so a receiving engineer can tell layers
apart on screen.

Lineweights are in 1/100 mm (DXF convention). Model units are US survey feet
(State Plane); paper units are inches. Text heights in model space are given in
feet for the plan scale (1" = 30' -> 0.1" plotted = 3 ft).
"""

# name: (aci colour, linetype, lineweight)
LAYERS = {
    # survey / property
    'V-PROP-BNDY': (7, 'CONTINUOUS', 70),     # tract boundary of record — heaviest
    'V-PROP-LOTS': (7, 'CONTINUOUS', 50),
    'V-PROP-BRL': (8, 'DASHED', 18),
    'V-PROP-ADJN': (8, 'CONTINUOUS', 13),
    'V-PROP-ANNO': (7, 'CONTINUOUS', 18),
    'V-ESMT': (7, 'DASHED2', 25),
    'V-ESMT-ANNO': (7, 'CONTINUOUS', 18),
    'V-GRID': (7, 'CONTINUOUS', 18),
    'V-VICN': (8, 'CONTINUOUS', 25),
    # existing roads
    'C-ROAD-EDGE-E': (8, 'CONTINUOUS', 25),
    'C-ROAD-CNTR-E': (8, 'CENTER', 18),
    'C-ROAD-ROWL-E': (8, 'PHANTOM', 25),
    'C-ROAD-ANNO-E': (8, 'CONTINUOUS', 18),
    # proposed street
    'C-ROAD-ROWL-N': (7, 'PHANTOM', 35),
    'C-ROAD-CNTR-N': (7, 'CENTER', 18),
    'C-ROAD-PVMT-N': (7, 'CONTINUOUS', 35),
    'C-ROAD-IMPR-N': (7, 'CONTINUOUS', 35),
    'C-ROAD-SWAL-N': (4, 'DASHDOT', 30),      # storm: cyan (never water blue / sewer green)
    'C-ROAD-ANNO-N': (7, 'CONTINUOUS', 18),
    'C-ROAD-STA-N': (7, 'CONTINUOUS', 18),
    'C-ROAD-SIGHT-N': (1, 'DASHED', 25),      # intersection sight lines     # stationing, bearings, curve data
    'C-STRM-CULV-N': (4, 'CONTINUOUS', 40),
    # site
    'C-BLDG-FTPR-N': (7, 'CONTINUOUS', 50),
    'C-BLDG-ANNO-N': (7, 'CONTINUOUS', 18),
    'V-BLDG-E': (8, 'CONTINUOUS', 35),      # existing building (county 2023 footprint)
    'V-BLDG-ANNO-E': (8, 'CONTINUOUS', 18),
    'C-PVMT-DRWY-N': (7, 'CONTINUOUS', 25),
    'C-PVMT-ANNO-N': (7, 'CONTINUOUS', 18),
    'C-PVMT-WALK-N': (7, 'CONTINUOUS', 35),   # concrete lead walks and stoops
    # topography
    'C-TOPO-MAJR-E': (8, 'DASHED', 25),
    'C-TOPO-MINR-E': (8, 'DASHED', 13),
    'C-TOPO-MAJR-N': (7, 'CONTINUOUS', 40),
    'C-TOPO-MINR-N': (7, 'CONTINUOUS', 25),
    'C-TOPO-ANNO': (8, 'CONTINUOUS', 13),
    'C-TOPO-SPOT-N': (7, 'CONTINUOUS', 18),
    # environment
    'C-ENVR-SLOP-E': (1, 'CONTINUOUS', 13),
    'C-ENVR-SOIL-E': (8, 'DOT', 13),
    'C-ENVR-WOOD-E': (3, 'DASHED', 18),
    'C-ENVR-ANNO': (8, 'CONTINUOUS', 13),
    # utilities
    'C-WATR-MAIN-N': (5, 'CONTINUOUS', 40),
    'C-SSWR-MAIN-N': (94, 'DASHED', 40),
    'C-UTIL-SVCS-N': (8, 'DASHED', 18),
    'C-WATR-SVCS-N': (5, 'CONTINUOUS', 30),   # 1" water service, main to dwelling
    'C-SSWR-SVCS-N': (94, 'DASHED', 30),      # 4" sewer lateral, main to dwelling
    'C-UTIL-ANNO-N': (7, 'CONTINUOUS', 18),
    'E-LITE-N': (7, 'CONTINUOUS', 25),
    'L-PLNT-TREE-N': (7, 'CONTINUOUS', 25),
    # stormwater
    'C-SWM-ESD-N': (6, 'CONTINUOUS', 35),      # ESD cells: magenta
    'C-SWM-DRAN-N': (7, 'DASHDOT', 25),
    'C-SWM-POI': (1, 'CONTINUOUS', 40),
    'C-SWM-FLOW': (4, 'DASHED', 25),
    'C-SWM-OFFS': (7, 'DOT', 18),
    'C-SWM-ANNO': (7, 'CONTINUOUS', 18),
    # sediment control
    'C-ESC-LOD': (7, 'DASHED', 70),          # L.O.D.: heavy black long dash, 'LOD' inline (Yocum approved plans)
    'C-ESC-SILT': (7, 'DASHED', 25),
    'C-ESC-SCE': (7, 'CONTINUOUS', 25),
    'C-ESC-ANNO': (7, 'CONTINUOUS', 18),
    # paper space
    'G-ANNO-TTLB': (7, 'CONTINUOUS', 35),
    'G-ANNO-TABL': (7, 'CONTINUOUS', 18),
    'G-ANNO-TEXT': (7, 'CONTINUOUS', 18),
    'G-VPRT': (8, 'CONTINUOUS', 13),
}

# Layers each plan sheet shows (everything else frozen in its viewport).
BASE = ['V-PROP-BNDY', 'V-PROP-LOTS', 'V-PROP-ADJN', 'V-PROP-ANNO', 'V-GRID',
        'C-ROAD-EDGE-E', 'C-ROAD-CNTR-E', 'C-ROAD-ROWL-E', 'C-ROAD-ANNO-E',
        'C-ROAD-ROWL-N', 'C-ROAD-PVMT-N', 'C-ROAD-ANNO-N', 'C-BLDG-FTPR-N', 'C-PVMT-DRWY-N', 'C-PVMT-WALK-N', 'V-ESMT',
        'V-BLDG-E', 'V-BLDG-ANNO-E']
# Every plan sheet carries the same construction base (user, 2026-10-01: existing
# and proposed contours on all sheets; L.O.D. around the full site; nothing a
# contractor needs on one sheet missing from another). Each sheet then adds its
# own trade.
TOPO = ['C-TOPO-MAJR-E', 'C-TOPO-MINR-E', 'C-TOPO-MAJR-N', 'C-TOPO-MINR-N', 'C-TOPO-ANNO']
CONSTRUCTION = BASE + TOPO + ['C-ROAD-CNTR-N', 'C-ROAD-SWAL-N', 'C-STRM-CULV-N', 'C-ESC-LOD', 'V-ESMT-ANNO', 'C-BLDG-ANNO-N',
                              'C-WATR-MAIN-N', 'C-SSWR-MAIN-N', 'C-WATR-SVCS-N', 'C-SSWR-SVCS-N']
SHEET_LAYERS = {
    # the subdivision as it is of record (cover): boundary, lots, R/W, easements, adjoiners only
    'record': ['V-PROP-BNDY', 'V-PROP-LOTS', 'V-PROP-ADJN', 'V-PROP-ANNO', 'C-ROAD-EDGE-E', 'C-ROAD-CNTR-E', 'C-ROAD-ROWL-E',
               'C-ROAD-ANNO-E', 'C-ROAD-ROWL-N', 'V-ESMT', 'V-ESMT-ANNO', 'C-TOPO-MAJR-E', 'C-TOPO-ANNO'],
    'existing': BASE + TOPO + ['C-ENVR-SLOP-E', 'C-ENVR-SOIL-E', 'C-ENVR-WOOD-E', 'C-ENVR-ANNO', 'V-ESMT-ANNO', 'C-ESC-LOD'],
    'layout': CONSTRUCTION + ['C-ROAD-IMPR-N', 'V-PROP-BRL', 'C-PVMT-ANNO-N', 'C-TOPO-SPOT-N', 'C-ROAD-STA-N', 'C-ROAD-SIGHT-N'],
    'profile': BASE + TOPO + ['C-ROAD-CNTR-N', 'C-ROAD-SWAL-N', 'C-STRM-CULV-N', 'C-ROAD-STA-N', 'C-TOPO-SPOT-N', 'C-ESC-LOD', 'C-ROAD-IMPR-N', 'C-ROAD-SIGHT-N'],
    'utility': CONSTRUCTION + ['C-UTIL-SVCS-N', 'C-UTIL-ANNO-N', 'E-LITE-N', 'L-PLNT-TREE-N'],
    'swm': [l for l in CONSTRUCTION if l not in ('C-WATR-MAIN-N', 'C-SSWR-MAIN-N', 'C-WATR-SVCS-N', 'C-SSWR-SVCS-N')] + ['C-SWM-ESD-N', 'C-SWM-DRAN-N', 'C-SWM-POI', 'C-SWM-FLOW', 'C-SWM-OFFS', 'C-SWM-ANNO'],
    'esc': CONSTRUCTION + ['C-ESC-SILT', 'C-ESC-SCE', 'C-ESC-ANNO'],
}

TEXT_FONT = 'Arial'
TEXT_FONT_BOLD = 'Arial Bold'
