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
    'C-ROAD-SWAL-N': (94, 'DASHDOT', 30),
    'C-ROAD-ANNO-N': (7, 'CONTINUOUS', 18),
    'C-STRM-CULV-N': (5, 'CONTINUOUS', 40),
    # site
    'C-BLDG-FTPR-N': (7, 'CONTINUOUS', 50),
    'C-BLDG-ANNO-N': (7, 'CONTINUOUS', 18),
    'C-PVMT-DRWY-N': (7, 'CONTINUOUS', 25),
    'C-PVMT-ANNO-N': (7, 'CONTINUOUS', 18),
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
    'C-ENVR-ANNO': (8, 'CONTINUOUS', 13),
    # utilities
    'C-WATR-MAIN-N': (5, 'CONTINUOUS', 40),
    'C-SSWR-MAIN-N': (94, 'DASHED', 40),
    'C-UTIL-SVCS-N': (8, 'DASHED', 18),
    'C-UTIL-ANNO-N': (7, 'CONTINUOUS', 18),
    'E-LITE-N': (7, 'CONTINUOUS', 25),
    'L-PLNT-TREE-N': (7, 'CONTINUOUS', 25),
    # stormwater
    'C-SWM-ESD-N': (94, 'CONTINUOUS', 35),
    'C-SWM-DRAN-N': (7, 'DASHDOT', 25),
    'C-SWM-POI': (1, 'CONTINUOUS', 40),
    'C-SWM-FLOW': (5, 'DASHED', 25),
    'C-SWM-OFFS': (7, 'DOT', 18),
    'C-SWM-ANNO': (7, 'CONTINUOUS', 18),
    # sediment control
    'C-ESC-LOD': (30, 'PHANTOM2', 35),
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
        'C-ROAD-ROWL-N', 'C-ROAD-PVMT-N', 'C-ROAD-ANNO-N', 'C-BLDG-FTPR-N', 'C-PVMT-DRWY-N', 'V-ESMT']
SHEET_LAYERS = {
    'existing': BASE[:9] + ['C-TOPO-MAJR-E', 'C-TOPO-MINR-E', 'C-TOPO-ANNO', 'C-ENVR-SLOP-E', 'C-ENVR-SOIL-E', 'C-ENVR-ANNO',
                            'V-ESMT', 'V-ESMT-ANNO'],
    'layout': BASE + ['C-ROAD-CNTR-N', 'C-ROAD-IMPR-N', 'C-ROAD-SWAL-N', 'C-STRM-CULV-N', 'V-PROP-BRL', 'C-BLDG-ANNO-N',
                      'C-PVMT-ANNO-N', 'C-TOPO-MAJR-E', 'C-TOPO-MINR-E', 'C-TOPO-MAJR-N', 'C-TOPO-MINR-N', 'C-TOPO-ANNO',
                      'C-TOPO-SPOT-N', 'C-ESC-LOD'],
    'utility': BASE + ['C-ROAD-CNTR-N', 'C-WATR-MAIN-N', 'C-SSWR-MAIN-N', 'C-UTIL-SVCS-N', 'C-UTIL-ANNO-N', 'V-ESMT-ANNO',
                       'E-LITE-N', 'L-PLNT-TREE-N', 'C-BLDG-ANNO-N'],
    'swm': BASE + ['C-ROAD-SWAL-N', 'C-STRM-CULV-N', 'C-SWM-ESD-N', 'C-SWM-DRAN-N', 'C-SWM-POI', 'C-SWM-FLOW', 'C-SWM-OFFS',
                   'C-SWM-ANNO', 'C-TOPO-MAJR-E', 'C-TOPO-MINR-E', 'C-TOPO-ANNO'],
    'esc': BASE + ['C-ESC-LOD', 'C-ESC-SILT', 'C-ESC-SCE', 'C-ESC-ANNO', 'C-ROAD-SWAL-N', 'C-STRM-CULV-N',
                   'C-TOPO-MAJR-E', 'C-TOPO-MINR-E', 'C-TOPO-MAJR-N', 'C-TOPO-MINR-N', 'C-TOPO-ANNO'],
}

TEXT_FONT = 'Arial'
TEXT_FONT_BOLD = 'Arial Bold'
