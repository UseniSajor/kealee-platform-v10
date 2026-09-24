# Source URLs — Landscape Manual, Subtitle 25 and the tree canopy standard

Retrieved 2026-09-10 by local `curl`. `princegeorgescountymd.gov` returns HTTP 403
to Anthropic egress ranges; `pgplanning.org` and `mgaleg.maryland.gov` do not.
Checksums in `SHA256SUMS.txt`. Each PDF has a `.txt` beside it, extracted with
pdf.js, so the text is greppable without opening the file.

| Local file | URL |
|---|---|
| `landscape-manual-2010.pdf` | `https://pgplanning.org/wp-content/uploads/2023/11/Landscape_Manual_2010.pdf` |
| `environmental-tech-manual-2010.pdf` | `https://www.pgplanning.org/wp-content/uploads/2023/10/Environmental-Technical-Manual-September-22-2010-PDF.pdf` |
| `env-tech-manual-partD-tree-canopy-2018.pdf` | `https://www.pgplanning.org/wp-content/uploads/2023/11/05-Environmental-Tech-Manual-2018-Part-D.pdf` |
| `tree-canopy-coverage-schedule-25-128.xls` | `https://www.pgplanning.org/wp-content/uploads/2023/10/Tree-Canopy-Coverage-Schedule-for-Sec.-25-128-PDF.xls` |
| `cb-021-2024-subtitle-25-amendments.pdf` | `https://mgaleg.maryland.gov/pubs/LegisLegal/County-Legislation/2025-Prince-Georges-County-CB-021-2024.pdf` |

## READ THE BILL BEFORE THE MANUAL — the manual is out of date

Part D of the Environmental Technical Manual is dated 2018 and its Table D-1 is
**superseded**. It gives 15% on the R-80/R-55 residential class, 10% commercial,
and states the requirement is a percentage of the **gross** tract area. All three
were changed by **CB-021-2024**, which amends Sec. 25-128 and is reproduced here.
The bill's own text, at `cb-021-2024-subtitle-25-amendments.txt` line 208,
with `[brackets]` marking deletions:

> Tree canopy coverage requirements are based on the [gross] net tract area and
> must be met within the net tract area.

and Table 1 as amended:

| Zone | Minimum tree canopy coverage |
|---|---|
| ROS, AG, AR | Exempt |
| RE | [20%] **25%** |
| RR, **RSF-95**, RSF-65, RSF-A, RMF-12, RMF-20, RMF-48, RMH, R-PD | [15%] **20%** |
| CGO, CS, IH, IE, IE-PD, CN, NAC, TAC, LTO, RTO-L, RTO-H, NAC-PD, TAC-PD, LTO-PD, RTO-PD, MU-PD | [10%] **15%** |
| LCD, LMXC, LMUTC | Per CB-27-2010 for the prior zoning before legacy designation |

Part D also predates the 2018 zoning ordinance entirely — its table has no RSF
zones in it at all, only R-80, R-55 and the rest of the old names. A search that
lands on Part D will report 15% of gross for this project and be wrong twice.
`PG_TREE_CANOPY_COVERAGE` in `packages/spatial-engine/src/jurisdictions/
pg-subdivision-and-landscape.ts` carries the amended figures — 20% of net tract
area on RSF-95 — and is correct.

What Part D is still good for: the definition of tree canopy, the method for
measuring it, the rule that the requirement must be met **on-site** absent a
variance, and §3.0 — *"If the only application to be submitted is a grading
permit, then the tree canopy coverage notes must be placed on the grading plan."*

## Landscape Manual, Section 4.1(c)(1) — one-family detached

The per-lot planting requirement, by lot size. This is a different requirement
from the canopy coverage percentage and both apply.

| Lot size | Major shade trees | Ornamental or evergreen |
|---|---|---|
| 40,000 sf and over | 4 | 3 |
| 20,000 – 39,999 sf | 4 | 3 |
| 9,500 – 19,999 sf | 3 | 2 |
| under 9,500 sf | 2 | 2 |

Also required, per tier: at least one major shade tree on the south and/or west
side within 30 ft of the dwelling where feasible, and at least one required tree
in the front yard. An existing shade tree over 2.5 in dbh within 75 ft of the
dwelling may be counted if its dbh, genus, condition and location are shown.

## Not retrieved

- Subtitle 25 as codified. `library.municode.com` and `online.encodeplus.com`
  both serve a JavaScript shell to `curl` with no section text in it, and
  `princegeorges-md.elaws.us` timed out. CB-021-2024 carries the operative text
  for Division 3 and is here instead.
- Landscape Manual amendments after December 2010, if any.
