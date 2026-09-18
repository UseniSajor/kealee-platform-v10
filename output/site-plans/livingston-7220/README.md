# 7220 Livingston Rd, Fort Washington (Parcel 049, 18.07 ac, RMF-20) — attached-housing study and preliminary set

Generated 2026-09-17 by `propose-townhomes.ts --accounts 1293448 --frontage LIVINGSTON --mix townhouse,twoOverTwo,townhouse,twoFamily` and `generate-attached-set.ts`. Owner of record EVERGREEN VENTURES LLC, L.49319 F.213, unplatted; zone RMF-20 (townhouse 20 du/ac, two-family 40; yards 15/8/20; coverage 40/35%; height 50 ft). No hypothetical rezoning — RMF-20 lists these uses.

## Constraints (county layers, on the parcel)
- Stream corridor: 1,495 ft of stream with the Table 24-4303(c) 100-ft regulated buffer — **8.25 ac** taken out (the buffer subtraction is now robust: built path by path, simplified, subtracted piece by piece).
- Slopes > 25% in bodies 1.54 ac taken out (1.97 ac of graded banks regraded; 2.24 ac at 15–25% built with grading).
- Approved TCP1-007-00 over the parcel; woodland conservation area 0.02 ac; FEMA Zone X; no wetlands. Master plan R/W C-726 (Livingston Rd, 80 ft): 15,341 sf dedication.
- No platted easements on the parcel (see the 2026-09-17 check below). **Developable 9.19 ac** in 2 pieces.

## Layout
- Streets along the developable ground's long axis (a spine with rows both sides), private 26-ft pavement in 40-ft strips, walks at every front, driveways to 1-car (TH) and 2-car (duplex, two-over-two) garages, BRLs per stick (front 20 / side 8 at stick ends / rear 20), no street on the property line. Dead ends carry 45-ft turnarounds where no connector fits. **The entrance from Livingston Rd must cross the stream buffer** (the only frontage) — a road crossing permitted under Sec. 24-4303 with a DSP/variance finding; it is not drawn.
- **87 dwelling units**: 37 townhouses (15.0 du/ac vs cap 20), 46 two-over-twos (23 bays), 4 duplexes. Parking 208 vs 151 required at the assumed ratios. ESD 24,942 sf reserved vs 18,478 sf needed. Open space 43,713 sf vs 39,118 (Sec. 24-134, 5%).
- The alternative with streets perpendicular to Livingston (`--access LIVINGSTON --access-row-ft 80`) gave 95 du on 13 short streets with 6 turnarounds — more units, worse network; not kept.

## Files
`livingston-7220-yield-study.pdf` (study sheet with existing 2-ft contours), `livingston-7220-building-elevations.pdf`, `livingston-7220-dsp-set.pdf` (11 sheets, ARCH E) + `.dxf` + `.landxml.xml` + `.manifest.json`, `livingston-7220.yield.json`.

---

## Easement and constraint check (2026-09-17)

Source: PGAtlas (geocoder score 100 → Address/Property/15, Easement/MapServer 0–6, Environmental/MapServer 1/3/13/14/18/19/25/26/31, Transportation/MapServer 2/6). Queried against the county parcel polygon; not a title search.

- Parcel 049, account 1293448, **EVERGREEN VENTURES LLC**, 18.07 ac assessed (17.96 ac GIS), L.49319 F.213, no recorded plat (unplatted parcel, "ADMIN # 19800"), tax map 105B2, WSSC grid 210SE02. Zone **RMF-20**. Frontage/adjoining county streets: Livingston Rd, Hough Ln, Lindsay Rd, Muir Dr, White Oak Dr.
- **Platted easements on the parcel: none** in any of the six PGAtlas easement layers. Nearest: a public utility easement on the Hough's Park plat 193-061, off the parcel. Deed easements (WSSC, PEPCO, access) are not in PGAtlas — a title report is required.
- Master plan right-of-way C-726 (Livingston Rd, 80 ft): 15,341 sf of the parcel — a dedication at subdivision (Sec. 24-123(a)(1)).
- Streams: 1,495 ft of single-line stream plus a 153-ft drainage connector and a headwall — PMA with the 100-ft regulated buffer.
- Slopes: 3.52 ac over 25%, 2.25 ac 15–25%. TCP1-007-00 over the whole parcel; TCP2-198-92 touches the edge. FEMA Zone X; no DPIE floodplain study; no DNR wetlands. Soils: CwD 7.76 ac, UdrF 4.51, GgB 2.81, GgC 1.60, CwE 0.99, BuB 0.30.
