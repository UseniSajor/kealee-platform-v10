#!/usr/bin/env python3
"""
Extract District of Columbia dimensional standards from the 2016 Zoning Regulations.

Source: DC Office of Zoning, "Zoning Regulations of 2016 — unofficial version",
        ZR16_unoff_export_<date>.pdf, linked from
        https://dcoz.dc.gov/page/zoning-regulations-2016-unofficial-version

WHY THIS IS NOT THE PRINCE GEORGE'S EXTRACTOR

PG publishes one "Intensity and Dimensional Standards" table per zone: read the
row, get the envelope. DC does not. A single DC zone's envelope is assembled
from separate numbered tables in separate sections — lot dimensions in
D § 202.1, height in D § 203.2, lot occupancy in D § 304.1, rear yard in
D § 305.1, and so on — each of which lists every zone as a row. So the unit of
extraction here is the TABLE, not the zone, and assembling a zone's envelope is
a second step that has to know which table answers which question.

THE TRAPS THIS HANDLES

1.  Rowspan. A zone label that covers two structure-type rows is drawn once,
    vertically centred. Text-order extraction puts "R-2" BETWEEN its two data
    rows, so a naive reader hands R-2's semi-detached numbers to whatever came
    before it. Cells are read with `strategy="lines_strict"`, which uses the
    ruled cell boundaries, and a blank leading cell is forward-filled from the
    row above.

2.  Tables that span a page break. A continuation carries no "TABLE X § n:"
    heading, so a heading-driven reader drops it without saying anything.
    TABLE E § 210.1 loses seven of its eight rows that way — including every
    RF-4 and RF-5 row — and the survivor still looks like a complete table.
    The first table on a page is therefore treated as a continuation of the
    previous page's table when its column count matches, and `pages` records
    every page a table was assembled from.

3.  A heading whose body starts on the next page. TABLE D § 211.1 (pervious
    surface) prints its heading and column header at the foot of one page and
    every data row on the next. Discarding the header-only fragment hands that
    body to the table BEFORE it — D § 210.1, lot occupancy — whose column count
    happens to match, and R-1 then reads as 50% lot occupancy when the
    regulation says 40%. A header-only table is therefore kept as the pending
    owner of the next page's headless body, and its header is aligned to the
    body's columns by x-position, because the two pages are ruled differently.

4.  A heading REPRINTED at the top of the continuation page. TABLE G § 210.1
    does this, and a reader that de-duplicates headings (to skip tables of
    contents) drops MU-4 through MU-15 without a word. A repeated heading on
    the very next page with the same columns is appended, not skipped.

5.  Column fragmentation. The ruling-line detector splits a header like
    "Minimum Lot Width (ft.)" across several narrow columns while the data row
    below occupies only the first of them. Logical columns are therefore
    derived from where the DATA sits, and header fragments are folded into the
    column whose span contains them. Deriving columns from the header instead
    produces more columns than values and silently shifts every number one
    place to the left.

Output is machine-extracted and carries verifiedBy: null. It is a starting
point for a reviewer, not a signature. No number from here may be drawn as a
setback until a person has checked it against the published table.

Usage:
    python3 extract-dc-dimensions.py --pdf ZR16.pdf --json dc_dimensions.json
    python3 extract-dc-dimensions.py --pdf ZR16.pdf --inventory
    python3 extract-dc-dimensions.py --pdf ZR16.pdf --verify-text zr16.txt
"""
import argparse, json, re, sys, datetime, warnings

warnings.filterwarnings("ignore")

TABLE_HEADING = re.compile(
    r"^TABLE\s+([A-Z])\s*§\s*([0-9]+(?:\.[0-9]+)*)\s*:\s*(.+)$", re.S
)

# Subtitles worth extracting for a residential or mixed-use site plan. Page
# ranges are found from the running header, not hardcoded, so a new export of
# the regulations does not shift them silently.
SUBTITLES_OF_INTEREST = ("D", "E", "F", "G", "H", "K")

SUBTITLE_NAMES = {
    "D": "Residential House",
    "E": "Residential Flats",
    "F": "Residential Apartment",
    "G": "Mixed Use",
    "H": "Neighborhood Mixed-Use",
    "K": "Special Purpose Zones",
}


def clean(s):
    if s is None:
        return None
    s = re.sub(r"\s+", " ", s).replace("\xa0", " ").strip()
    return s or None


def logical_columns(rows):
    """Column start indices, derived from where the DATA sits.

    Returns the sorted set of column indices at which any data row (every row
    after the header) holds a value. Header fragments are folded into whichever
    of these spans contains them.
    """
    used = set()
    for r in rows[1:]:
        for i, c in enumerate(r):
            if clean(c):
                used.add(i)
    if not used:
        used = {i for i, c in enumerate(rows[0] if rows else []) if clean(c)}
    return sorted(used)


def fold(row, starts):
    """Fold a raw row onto the logical columns, joining fragments."""
    out = []
    for n, s in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(row)
        parts = [clean(row[i]) for i in range(s, min(end, len(row)))]
        parts = [p for p in parts if p]
        out.append(" ".join(parts) if parts else None)
    return out


def fill_down(rows, carried=None):
    """Forward-fill a blank leading cell: that is a rowspan, not an empty zone."""
    out = []
    for r in rows:
        if not any(r):
            continue
        if r[0] is None and carried is not None:
            r = [carried] + list(r[1:])
        elif r[0] is not None:
            carried = r[0]
        out.append(r)
    return out, carried


# Two bare numbers in one cell, optionally with a parenthetical between or
# after them: "75 80 (IZ)", "4.0 4.8 (IZ)". This is the DC analogue of Prince
# George's "45 (4)" — a base standard and an Inclusionary Zoning standard drawn
# as two lines of one cell and collapsed into one string by extraction. Coerce
# it to a number and you get 75, silently, for a lot entitled to 80.
COLLAPSED = re.compile(r"^\s*\d[\d,.]*\s*(?:\([^)]*\))?\s+\d[\d,.]*\b")
# A number qualified by prose: "20 ft. and 2 stories", "12 ft., except 15 ft.".
# Legible to a reader, still not a number.
QUALIFIED = re.compile(r"^\s*\d[\d,.]*\s+\S")


def anomalies_in(rec):
    """Things a reviewer must look at before any of this is drawn."""
    flags = []
    for r in rec["rows"]:
        for i, c in enumerate(r):
            if not c or i == 0:
                continue
            col = rec["columns"][i] if i < len(rec["columns"]) else f"column {i}"
            if COLLAPSED.match(c):
                flags.append(f"collapsed_values: row {r[0]!r} / {col!r} = {c!r}")
            elif QUALIFIED.match(c):
                flags.append(f"qualified_value: row {r[0]!r} / {col!r} = {c!r}")
    if len(rec.get("pages", [])) > 1:
        flags.append(f'page_span: assembled across pages {rec["pages"]}')
    return flags


def split_embedded(raw):
    """Split one detected grid at any row that is itself a table heading.

    The ruling detector can merge two tables that sit close together into one
    grid, with the second heading spread across several cells: E § 4904.1
    (height for public schools) arrived as three rows of E § 4903.1 (lot
    width). Each heading row starts a new chunk.
    """
    chunks, cur = [], []
    for r in raw:
        joined = clean(" ".join(c for c in r if c))
        if joined and TABLE_HEADING.match(joined):
            # Also when it is the FIRST row: page 299 opens with E § 4904.1's
            # heading spread over three cells, and "TABLE E" alone is not a
            # heading, so the grid passed for a continuation of E § 4903.1.
            if cur:
                chunks.append(cur)
            cur = [[joined] + [None] * (len(r) - 1)]
        else:
            cur.append(r)
    if cur:
        chunks.append(cur)
    return chunks


def parse_heading(raw):
    if not raw or not raw[0]:
        return None
    heading = clean(raw[0][0])
    if not heading:
        return None
    return TABLE_HEADING.match(heading.replace("\n", " "))


def column_x0s(table):
    """Left edge of every ruled grid column, index-aligned with extract()."""
    xs = sorted({round(c[0], 1) for c in table.cells if c})
    return xs


def parse_table(raw, page, xs=None):
    """Turn one pymupdf table extraction into a structured record, or None."""
    m = parse_heading(raw)
    if not m:
        return None
    subtitle, section, title = m.group(1), m.group(2), clean(m.group(3))

    body = raw[1:]
    if not body:
        return None
    if len(body) == 1 and xs:
        # Heading and column header only; the rows are on the next page.
        header_cells = [
            (xs[i] if i < len(xs) else None, clean(c))
            for i, c in enumerate(body[0]) if clean(c)
        ]
        return {
            "table": f"{subtitle} § {section}",
            "subtitle": subtitle,
            "subtitleName": SUBTITLE_NAMES.get(subtitle, subtitle),
            "section": section,
            "title": title,
            "columns": [],
            "rows": [],
            "pages": [page],
            "_carried": None,
            "_awaiting_body": header_cells,
        }
    starts = logical_columns(body)
    if len(starts) < 2:
        return None

    folded = [fold(r, starts) for r in body]
    header, data = folded[0], folded[1:]
    filled, carried = fill_down(data)
    if not filled:
        return None
    return {
        "table": f"{subtitle} § {section}",
        "subtitle": subtitle,
        "subtitleName": SUBTITLE_NAMES.get(subtitle, subtitle),
        "section": section,
        "title": title,
        "columns": header,
        "rows": filled,
        "pages": [page],
        "_carried": carried,
    }


def parse_continuation(raw, prev, page, xs=None):
    """Append a headless table at the top of a page to the table before it.

    Only ever applied to the FIRST table on a page, only when the previous
    table was on the previous page, and only when the column count matches.
    Anything else is a different table that happens to have no heading.

    When the previous table is a header-only fragment, this body IS its data:
    columns come from where the body's values sit, and each header fragment
    joins the body column whose x-range contains it.
    """
    if prev is None or page != prev["pages"][-1] + 1:
        return False
    if parse_heading(raw) is not None:
        return False
    starts = logical_columns(raw)
    if prev.get("_awaiting_body") is not None:
        if len(starts) < 2 or not xs:
            return False
        edges = [xs[s] if s < len(xs) else float("inf") for s in starts] + [float("inf")]
        names = [[] for _ in starts]
        for x, text in prev["_awaiting_body"]:
            if x is None:
                continue
            for k in range(len(starts)):
                lo = edges[k] - 2 if k > 0 else float("-inf")
                if lo <= x < edges[k + 1] - 2:
                    names[k].append(text)
                    break
        prev["columns"] = [" ".join(n) if n else None for n in names]
        folded = [fold(r, starts) for r in raw]
        filled, carried = fill_down(folded)
        if not filled:
            return False
        prev["rows"] = filled
        prev["pages"].append(page)
        prev["_carried"] = carried
        prev.pop("_awaiting_body")
        return True
    if len(starts) != len(prev["columns"]):
        return False
    folded = [fold(r, starts) for r in raw]
    filled, carried = fill_down(folded, prev.get("_carried"))
    if not filled:
        return False
    prev["rows"].extend(filled)
    prev["pages"].append(page)
    prev["_carried"] = carried
    return True


def extract(pdf_path):
    import pymupdf

    doc = pymupdf.open(pdf_path)
    tables, seen = [], set()

    def add(rec, pno):
        key = (rec["table"], rec["title"])
        if key in seen:
            prev = tables[-1] if tables else None
            if (prev is not None and (prev["table"], prev["title"]) == key
                    and pno + 1 == prev["pages"][-1] + 1
                    and len(rec["columns"]) == len(prev["columns"])):
                # Heading REPRINTED at the top of the next page: the same
                # table continuing. G § 210.1 lost MU-4 through MU-15 when
                # this was treated as a duplicate.
                filled, carried = fill_down(
                    [list(r) for r in rec["rows"]], prev.get("_carried"))
                prev["rows"].extend(filled)
                prev["pages"].append(pno + 1)
                prev["_carried"] = carried
            return  # otherwise: the same table reprinted in a list of tables
        seen.add(key)
        tables.append(rec)

    for pno in range(doc.page_count):
        page = doc[pno]
        text = page.get_text()
        sub = re.search(r"SUBTITLE\s+([A-Z])\b", text)
        if not sub or sub.group(1) not in SUBTITLES_OF_INTEREST:
            continue
        try:
            found = page.find_tables(strategy="lines_strict")
        except Exception as e:  # a malformed page must not kill the run
            print(f"  page {pno + 1}: table detection failed: {e}", file=sys.stderr)
            continue
        for n, t in enumerate(found.tables):
            xs = column_x0s(t)
            for k, raw in enumerate(split_embedded(t.extract())):
                if n == 0 and k == 0 and tables and parse_continuation(raw, tables[-1], pno + 1, xs):
                    continue
                rec = parse_table(raw, pno + 1, xs)
                if not rec:
                    continue
                add(rec, pno)


    orphans = [t["table"] for t in tables if "_awaiting_body" in t]
    for o in orphans:
        print(f"  {o}: heading found, body never found — omitted", file=sys.stderr)
    tables = [t for t in tables if "_awaiting_body" not in t]
    for rec in tables:
        rec.pop("_carried", None)
        rec["anomalies"] = anomalies_in(rec)
    return tables


TS_HEADER = '''/**
 * District of Columbia — dimensional standards from the 2016 Zoning Regulations.
 *
 * SOURCE   DC Office of Zoning, "Zoning Regulations of 2016 (Title 11 DCMR)",
 *          unofficial consolidated export of {exportDate}.
 * METHOD   Machine-extracted from the ruled cell boundaries of every dimensional
 *          table in Subtitles D, E, F, G, H and K.
 * STATUS   MACHINE-EXTRACTED, NOT VERIFIED BY A REVIEWER.
 *
 * HOW DC DIFFERS FROM PRINCE GEORGE'S, WHICH MATTERS MORE THAN IT SOUNDS
 *
 * Prince George's publishes one "Intensity and Dimensional Standards" table per
 * zone: read the row, get the envelope. DC does not. A DC zone's envelope is
 * assembled from separate tables in separate sections, each listing every zone
 * as a row — lot dimensions in D § 202.1, height in D § 203.2, rear yard in
 * D § 207.1, lot occupancy in D § 210.1. So the unit here is the TABLE, and
 * `dc-zoning.ts` does the assembly.
 *
 * AND TWO OF THE NUMBERS A SITE PLAN NEEDS ARE NOT IN ANY TABLE:
 *
 *   · SIDE YARD is prose, keyed on structure type rather than zone
 *     (D § 208.2–208.5). Transcribed by hand in `dc-zoning.ts` with citations.
 *   · FRONT SETBACK IS CONTEXTUAL. D § 206.2 requires it to fall "within the
 *     range of existing front setbacks of all residential buildings on the same
 *     side of the street in the block". There is no number to look up. It has
 *     to be measured from the block face, and a plan that puts a number there
 *     without measuring has invented it.
 *
 * Before using a value from here:
 *
 * 1. Standards vary BY STRUCTURE TYPE within a zone — detached, semi-detached
 *    and row are different rows. `columns` names the fields; `rows` is
 *    positional against it.
 * 2. `anomalies` is not decoration. `collapsed_values` means one cell holds a
 *    base standard AND an Inclusionary Zoning standard that the PDF drew as two
 *    lines — "75 80 (IZ)" is not the number 75. `qualified_value` means a
 *    number carrying prose that changes it. Never coerce either to a number.
 * 3. `page_span` means the table was assembled across a page break. A reader
 *    dropping continuations loses seven of the eight rows of E § 210.1 and the
 *    survivor still looks like a whole table.
 *
 * Regenerate with scripts/extract-dc-dimensions.py; do not hand-edit.
 */

export interface DcDimensionalTable {{
  /** e.g. "D § 202.1" */
  table: string
  subtitle: string
  subtitleName: string
  section: string
  title: string
  /** Column headings, in order. */
  columns: (string | null)[]
  /** Rows, positional against `columns`. Column 0 is the zone or row label. */
  rows: (string | null)[][]
  /** Pages of the source export this table was assembled from. */
  pages: number[]
  /** Reviewer flags: collapsed_values, qualified_value, page_span. */
  anomalies: string[]
}}

export const DC_ZONING_SOURCE = {{
  publication: {publication},
  url: {url},
  exportDate: {exportDate_q},
  retrievedAt: {retrievedAt},
  extraction: 'machine' as const,
  verifiedBy: null as string | null,
  verifiedAt: null as string | null,
}}

export const DC_DIMENSIONAL_TABLES: readonly DcDimensionalTable[] = [
'''

TS_FOOTER = r''']

/** Look one table up by its citation, e.g. "D § 207.1". */
export function dcTable(citation: string): DcDimensionalTable | null {
  return DC_DIMENSIONAL_TABLES.find((t) => t.table === citation) ?? null
}

/**
 * Rows of a table whose label column names this zone.
 *
 * A label may cover several zones — "R-1 R-2", "NMU-4/H-H NMU-4/H-A" — so this
 * matches on the whitespace-separated tokens rather than on equality. Equality
 * silently returns nothing for every multi-zone row, which reads as "this zone
 * has no standard" rather than "the lookup was wrong".
 */
export function dcRowsForZone(
  table: DcDimensionalTable,
  zone: string,
): (string | null)[][] {
  const wanted = zone.trim().toUpperCase()
  return table.rows.filter((r) => {
    const label = (r[0] ?? '').toUpperCase()
    if (!label) return false
    return label.split(/[\s,/]+/).some((tok) => tok === wanted) || label === wanted
  })
}
'''


ZONE_TOKEN = re.compile(
    r"\b(?:R|RF|RA|MU|NMU|NC|D|PDR|CG|SEFC|WR|StE|HE|ARTS|BF|USN)-\d+[A-Z]?\b")


def verify_against_text(tables, text_path):
    """Cross-check the extraction against a plain-text dump of the same PDF.

    Every zone code printed under a table heading in the text must appear in
    that table's rows. A MISSING code is a lost row until a person shows it is
    a column header. Also lists headings the text has and the extraction lacks.
    Produce the text with `pdftotext -layout` or pymupdf's get_text().
    """
    lines = open(text_path, encoding="utf-8", errors="replace").read().split("\n")
    problems = 0
    have = set()
    for t in tables:
        have.add(t["table"])
        rows_text = " ".join(c for r in t["rows"] for c in r if c)
        found = set()
        for h, l in enumerate(lines):
            if not l.startswith(f"TABLE {t['table']}:"):
                continue
            for body in lines[h + 1:h + 140]:
                if re.match(r"^\d{3,4}\.\d+$", body.strip()):
                    break
                if body.startswith("TABLE ") and not body.startswith(f"TABLE {t['table']}:"):
                    break
                found |= set(ZONE_TOKEN.findall(body))
        missing = sorted(found - set(ZONE_TOKEN.findall(rows_text)))
        if missing:
            problems += 1
            print(f"  {t['table']:12s} MISSING {missing}")
        if "TABLE " in rows_text:
            problems += 1
            print(f"  {t['table']:12s} carries another table's heading in its rows")
    in_text = {
        m.group(1) for l in lines
        for m in [re.match(r"^TABLE ([" + "".join(SUBTITLES_OF_INTEREST) + r"] § [0-9.]+):", l)] if m
    }
    for t in sorted(in_text - have):
        problems += 1
        print(f"  {t:12s} heading in the text, no table extracted")
    print(f"{len(tables)} tables checked, {problems} to review", file=sys.stderr)


def ts_str(v):
    if v is None:
        return "null"
    return json.dumps(v)


def render_ts(payload):
    src = payload["source"]
    out = [
        TS_HEADER.format(
            exportDate=src["exportDate"],
            publication=ts_str(src["publication"]),
            url=ts_str(src["url"]),
            exportDate_q=ts_str(src["exportDate"]),
            retrievedAt=ts_str(src["retrievedAt"]),
        )
    ]
    for t in payload["tables"]:
        out.append("  {")
        out.append(f"    table: {ts_str(t['table'])}, subtitle: {ts_str(t['subtitle'])},")
        out.append(f"    subtitleName: {ts_str(t['subtitleName'])}, section: {ts_str(t['section'])},")
        out.append(f"    title: {ts_str(t['title'])},")
        out.append(f"    columns: [{', '.join(ts_str(c) for c in t['columns'])}],")
        out.append("    rows: [")
        for r in t["rows"]:
            out.append(f"      [{', '.join(ts_str(c) for c in r)}],")
        out.append("    ],")
        out.append(f"    pages: [{', '.join(str(p) for p in t['pages'])}],")
        if t["anomalies"]:
            out.append("    anomalies: [")
            for a in t["anomalies"]:
                out.append(f"      {ts_str(a)},")
            out.append("    ],")
        else:
            out.append("    anomalies: [],")
        out.append("  },")
    out.append(TS_FOOTER)
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--json")
    ap.add_argument("--ts")
    ap.add_argument("--inventory", action="store_true")
    ap.add_argument("--verify-text", help="plain-text dump of the same PDF to cross-check against")
    ap.add_argument("--source-url", default="https://dcoz.dc.gov/page/zoning-regulations-2016-unofficial-version")
    ap.add_argument("--export-date", default="2025-10-01")
    args = ap.parse_args()

    tables = extract(args.pdf)
    payload = {
        "source": {
            "publication": "District of Columbia Zoning Regulations of 2016 (Title 11 DCMR), unofficial version",
            "url": args.source_url,
            "exportDate": args.export_date,
            "retrievedAt": datetime.date.today().isoformat(),
            "extraction": "machine",
            "verifiedBy": None,
            "verifiedAt": None,
        },
        "tables": tables,
    }

    if args.verify_text:
        verify_against_text(tables, args.verify_text)
        return

    if args.inventory:
        for t in tables:
            pages = ",".join(str(p) for p in t["pages"])
            print(f"{t['table']:14s} p{pages:<9s} {len(t['rows']):3d} rows  {t['title'][:60]}")
            print(f"{'':14s} cols={t['columns']}")
            for a in t["anomalies"]:
                print(f"{'':14s} ANOMALY: {a}")
        print(f"\n{len(tables)} tables", file=sys.stderr)
        return

    if args.ts:
        open(args.ts, "w").write(render_ts(payload))
        print(f"{len(tables)} tables -> {args.ts}", file=sys.stderr)
        return

    out = json.dumps(payload, indent=1)
    if args.json:
        open(args.json, "w").write(out)
        print(f"{len(tables)} tables -> {args.json}", file=sys.stderr)
    else:
        print(out)


if __name__ == "__main__":
    main()
