#!/usr/bin/env python3
"""
Extract Prince George's County dimensional standards from the adopted ordinance.

Source: online.encodeplus.com — the county's publication of "Zoning Ordinance,
Subdivision Regulations & Landscape Manual (Effective 4/1/2022)".

Tables are parsed through a colspan/rowspan-aware grid expander because the
Transit-Oriented/Activity Center tables nest Core/Edge headers over use types,
and RTO-L and RTO-H share a single table. A flat parser mis-assigns those
columns, which would produce a wrong buildable envelope.

Output is machine-extracted and carries verifiedBy: null. It is a starting point
for a reviewer, not a signature.

Usage:  python3 extract-pg-dimensions.py > pg_dimensions.json
"""
import re, html, json, sys, time, urllib.request, datetime

BASE = "https://online.encodeplus.com/regs/princegeorgescounty-md/doc-view.aspx?secid="
SECTIONS = {
    633: "27-4201", 634: "27-4202", 635: "27-4203",
    636: "27-4204", 637: "27-4205", 638: "27-4300",
}
UA = {"User-Agent": "KealeePlatform/1.0 (contact@kealee.com)"}


def fetch(secid):
    req = urllib.request.Request(BASE + str(secid), headers=UA)
    return urllib.request.urlopen(req, timeout=90).read().decode("utf-8", "ignore")


def _txt(body):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", body))).replace("\xa0", " ").strip()


def parse_grid(table_html):
    """Expand a table into a rectangular grid, honouring colspan and rowspan."""
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_html, re.S)
    grid, pending = [], {}
    for r in rows:
        cells = re.findall(r"<(?:td|th)([^>]*)>(.*?)</(?:td|th)>", r, re.S)
        out, col = [], 0

        def drain():
            nonlocal col
            while col in pending:
                txt, left = pending[col]
                out.append(txt)
                if left - 1 > 0:
                    pending[col] = (txt, left - 1)
                else:
                    del pending[col]
                col += 1

        for attrs, body in cells:
            drain()
            cm = re.search(r'colspan="?(\d+)', attrs, re.I)
            rm = re.search(r'rowspan="?(\d+)', attrs, re.I)
            cspan = int(cm.group(1)) if cm else 1
            rspan = int(rm.group(1)) if rm else 1
            txt = _txt(body)
            for _ in range(cspan):
                out.append(txt)
                if rspan > 1:
                    pending[col] = (txt, rspan - 1)
                col += 1
        drain()
        grid.append(out)
    width = max((len(r) for r in grid), default=0)
    return [r + [""] * (width - len(r)) for r in grid]


def header_depth(grid):
    for i, row in enumerate(grid):
        if i == 0:
            continue
        if re.match(r"^[❶❷❸❹❺]", row[0]) or re.search(r",\s*(min|max)\.", row[0]):
            return i
    return 2


def compose_columns(grid, depth, skip):
    cols = []
    for c in range(skip, len(grid[0])):
        parts, seen = [], set()
        for r in range(1, depth):
            v = grid[r][c].strip()
            if v and v not in seen and not v.lower().startswith("standard"):
                seen.add(v)
                parts.append(v)
        cols.append(" / ".join(parts))
    return cols


ZONE_IN_HEADER = re.compile(r"\(([A-Z]{1,4}(?:-[A-Z0-9]{1,3}){0,3})\)")


# The 36 base zones of the 2022 ordinance, from the layer's coded-value domains.
# Column resolution is validated against this so the extractor can never invent a
# zone code: the Planned Development tables also carry Core/Edge columns, but
# LTO-PD-C is not a zone — LTO-PD is, and Core/Edge is part of the use context.
VALID_ZONES = {
    "AG","AR","ROS","RE","RR","RSF-A","RSF-65","RSF-95","RMF-12","RMF-20","RMF-48",
    "CN","CS","CGO","IE","IH","NAC","TAC-C","TAC-E","LTO-C","LTO-E",
    "RTO-L-C","RTO-L-E","RTO-H-C","RTO-H-E","RMH","LCD","LMXC","LMUTC",
    "R-PD","NAC-PD","TAC-PD","LTO-PD","RTO-PD","MU-PD","IE-PD",
}


def zone_for_column(col_label, table_zone):
    """
    Resolve a composed column header to a real zone code.

    Never returns a code outside VALID_ZONES. Where a Core/Edge split does not
    correspond to a distinct zone (the PD zones), the split is preserved in the
    use type instead of being fabricated into the zone code.
    """
    m = ZONE_IN_HEADER.search(col_label)
    base = m.group(1) if m else table_zone
    if not base:
        return None, col_label

    suffix = "-C" if "Core" in col_label else "-E" if "Edge" in col_label else ""
    if suffix and not base.endswith(("-C", "-E")):
        candidate = f"{base}{suffix}"
        if candidate in VALID_ZONES:
            marker = "Core /" if suffix == "-C" else "Edge /"
            use = col_label.split(marker)[-1].strip() if marker in col_label else col_label
            return candidate, use

    # Keep the base zone; the Core/Edge distinction stays in the use context.
    return (base if base in VALID_ZONES else None), col_label


def main():
    out, retrieved = {}, datetime.date.today().isoformat()
    for secid, section in SECTIONS.items():
        t = fetch(secid)
        time.sleep(1)
        zones, seen = [], set()
        for m in re.finditer(r"\(([A-Z]{1,4}(?:-[A-Z0-9]{1,3}){0,3})\)(?:\s|<[^>]+>)*Zone", t):
            code = m.group(1)
            if code in seen:
                continue
            seen.add(code)
            zones.append((m.start(), code))

        entries = []
        for tm in re.finditer(r"<table[^>]*>.*?</table>", t, re.S):
            tbl = tm.group(0)
            if "Intensity and Dimensional" not in tbl:
                continue
            table_zone = None
            for zpos, zcode in zones:
                if zpos < tm.start():
                    table_zone = zcode
            grid = parse_grid(tbl)
            depth = header_depth(grid)
            skip = 2 if len(grid[1]) > 1 and grid[1][0].lower().startswith("standard") and grid[1][1].lower().startswith("standard") else 1
            cols = compose_columns(grid, depth, skip)

            # Collapse adjacent duplicate columns produced by colspan.
            keep = [i for i in range(len(cols)) if i == 0 or cols[i] != cols[i - 1]]
            cols = [cols[i] for i in keep]

            resolved = [zone_for_column(c, table_zone) for c in cols]
            rows = []
            for row in grid[depth:]:
                label = re.sub(r"^[❶❷❸❹❺\s]*", "", row[0]).strip()
                if not label or label.startswith("NOTES"):
                    continue
                vals = [row[skip + i] for i in keep if skip + i < len(row)]
                if any(v for v in vals):
                    rows.append({"standard": label, "values": vals})
            notes = [" ".join(r) for r in grid if r and r[0].startswith("NOTES")]
            entries.append({
                "tableZone": table_zone,
                "columns": [{"zone": z, "useType": u, "label": c} for (z, u), c in zip(resolved, cols)],
                "rows": rows,
                "notes": notes,
                "section": section,
            })
        out[str(secid)] = {"section": section, "entries": entries}
        print(f"secid {secid} ({section}): {len(entries)} tables, "
              f"zones={sorted({c['zone'] for e in entries for c in e['columns'] if c['zone']})}",
              file=sys.stderr)

    out["_meta"] = {
        "source": "https://online.encodeplus.com/regs/princegeorgescounty-md/",
        "publication": "Prince George's County Zoning Ordinance, Subdivision Regulations & Landscape Manual (Effective 4/1/2022)",
        "effectiveDate": "2022-04-01",
        "retrievedAt": retrieved,
        "extraction": "machine",
    }
    json.dump(out, sys.stdout, indent=1)


if __name__ == "__main__":
    main()
