"""
python -m cad_plot <sheetset.json> <out.dxf> <out.pdf>

Authors the DXF (model space + paper-space sheets) from the engine's sheet-set
specification and plots every sheet to one PDF.
"""
import json
import sys
import ezdxf

from .model import setup, Model
from .paper import Sheets
from .plot import plot


def main(argv):
    if len(argv) != 3:
        print(__doc__); return 2
    spec, out_dxf, out_pdf = argv
    s = json.load(open(spec))
    doc = ezdxf.new('R2018', setup=True, units=2)
    setup(doc)
    m = Model(doc, s)
    m.build()
    sheets = Sheets(doc, s, m)
    layouts = sheets.build()
    # the default 'Layout1' is not a sheet
    try:
        doc.layouts.delete('Layout1')
    except Exception:
        pass
    doc.saveas(out_dxf)
    n = plot(doc, [l.name for l in layouts], out_pdf)
    ents = len(doc.modelspace())
    print(f'cad-plot: {out_dxf} ({ents} model-space entities, {len(layouts)} sheets) -> {out_pdf} ({n} pages)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
