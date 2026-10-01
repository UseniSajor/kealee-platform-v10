"""Plot every paper-space layout of the DXF to one PDF (ezdxf drawing add-on, PyMuPDF backend)."""
import pymupdf
from ezdxf.addons.drawing import Frontend, RenderContext, pymupdf as pmb, layout, config


def plot(doc, layout_names, out_pdf, size_in=(36, 24)):
    cfg = config.Configuration(
        background_policy=config.BackgroundPolicy.WHITE,
        color_policy=config.ColorPolicy.COLOR,
        lineweight_policy=config.LineweightPolicy.ABSOLUTE,
        lineweight_scaling=1.0,
        hatch_policy=config.HatchPolicy.NORMAL,
    )
    book = pymupdf.open()
    for name in layout_names:
        ctx = RenderContext(doc)
        be = pmb.PyMuPdfBackend()
        Frontend(ctx, be, config=cfg).draw_layout(doc.layouts.get(name), finalize=True)
        page = layout.Page(size_in[0], size_in[1], layout.Units.inch)
        one = pymupdf.open('pdf', be.get_pdf_bytes(page, settings=layout.Settings(fit_page=False, scale=25.4)))
        book.insert_pdf(one)
    book.save(out_pdf, garbage=3, deflate=True)
    return book.page_count
