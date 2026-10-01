# Decision: the DXF is the master drawing — `packages/cad-plot`

**Date:** 2026-09-30 · **Status:** approved by the owner ("yes go ahead with dxf based cad-plot … complete the full dxf based cad"; "do not be concerned about licensing")

## Context

The spatial engine designs a site into a `SiteTwin` and drafts sheets with its own PDFKit renderer
(`src/sheets/render-pdf.ts`). The CAD it hands a consulting engineer is a separate, thinner product:

- On the subdivision path, the DXF is R12 (AC1009): polylines and points only.
- It has no text, no sheets and no title block.
- A reviewer's PDF and the engineer's CAD file are therefore two different drawings.

Plotting that DXF with a DXF→PDF plotter produced bare linework (tested 2026-09-30, Estates at Indian Head).

## Decision

1. **The engine keeps the design and all computation** (TypeScript, `packages/spatial-engine`):
   - geometry and grading
   - drainage
   - ESD to the MEP (`site-plan/esd-mep.ts`, MDE Table 5.3)
   - points of investigation
   - the DPIE checklist evaluation
2. **The engine emits a sheet-set specification** (`*.sheetset.json`). It carries the twin plus everything a sheet shows that is not geometry: tables, notes, checklist rows, title-block fields and sheet list.
3. **`packages/cad-plot` (Python, ezdxf) authors the DXF from that specification:**
   - model space on NCS layers, with linetypes, lineweights and blocks for symbols
   - paper-space sheet layouts, each with a scaled viewport, frame, title block, tables, notes and detail images
4. **`cad-plot` plots every paper-space layout to PDF** with ezdxf's drawing add-on (PyMuPDF backend) and binds them into the set.
   - The PDF a reviewer stamps is a plot of the DXF the engineer opens.

## Why ezdxf

- **Capability:** it is the most complete open DXF library. It reads, writes and plots paper space, viewports, blocks with attributes, MTEXT, hatches and images.
- **Longevity:** it has been maintained since 2010.
- **Licence and access:** MIT licence; offline, with no account needed.
- **Why not the existing writer:** `@tarikjabiri/dxf` writes DXF but cannot plot it. It remains in the engine for the NCS model-space export until `cad-plot` supersedes it.

## Consequences

- There is a Python runtime in the monorepo:
  - `packages/cad-plot/requirements.txt` is pinned.
  - `packages/cad-plot/setup.sh` creates `.venv`, which is git-ignored.
- `generate-subdivision.ts` writes `SHEETSET_JSON=…` and, with `CAD_PLOT=1`, calls `cad-plot`.
- PDFKit remains until `cad-plot` covers every sheet type the paid path uses. Retiring it is a separate decision.
- Symbol and detail content lives once, as DXF blocks and images in `packages/cad-plot/cad_plot/`. It is not duplicated into PDFKit.
