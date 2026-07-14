#!/usr/bin/env python3
"""
ctc_extract.py — extract the Gordian CTC PDFs into structured JSON.

Two catalogs:
  COST       priced MasterFormat tasks   -> data/ctc/ctc-cost-tasks.json
  TECHNICAL  scope / inclusions per task -> data/ctc/ctc-technical.json

Uses PyMuPDF (fitz) for text extraction (no npm deps). The CTC unit price
bundles labor+material+equipment; we split it via per-division L/M/E ratios
(same ratios as scripts/parse-ctc-pdf.ts). Prices are the 2023 basis — the DB
loader applies the 2023->current escalation.

Usage:
  # 1) calibrate against the real layout (prints candidate lines):
  python3 scripts/ctc/ctc_extract.py inspect "<cost.pdf>"
  # 2) extract:
  python3 scripts/ctc/ctc_extract.py cost      "<cost.pdf>"
  python3 scripts/ctc/ctc_extract.py technical "<technical.pdf>"
"""
import sys, re, json, os

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF not installed: pip install --break-system-packages pymupdf")

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO, "data", "ctc")

# ── L/M/E split ratios by CSI division (from scripts/parse-ctc-pdf.ts) ───────
LME = {
    '01': (.60, .25, .15), '02': (.45, .10, .45), '03': (.40, .45, .15),
    '04': (.50, .42, .08), '05': (.40, .50, .10), '06': (.50, .42, .08),
    '07': (.45, .45, .10), '08': (.40, .55, .05), '09': (.55, .40, .05),
    '10': (.40, .55, .05), '11': (.30, .60, .10), '12': (.35, .60, .05),
    '13': (.40, .45, .15), '14': (.35, .40, .25), '21': (.45, .45, .10),
    '22': (.50, .40, .10), '23': (.45, .45, .10), '25': (.55, .40, .05),
    '26': (.55, .40, .05), '27': (.50, .45, .05), '28': (.50, .45, .05),
    '31': (.35, .15, .50), '32': (.40, .45, .15), '33': (.40, .40, .20),
}
# labor-hours: rough productivity — hours = labor$ / prevailing base rate.
BASE_LABOR_RATE = 75.0  # 2023 DMV blended $/hr baseline (matches seed-ctc)

# ── Task line regex (tunable). CTC format:  CSI-CODE  UOM  DESC ... UNIT [DEMO]
# e.g. "03 30 00-0100  SF  Cast-in-Place Concrete, Slab ... 14.13  9.50"
TASK_RE = re.compile(
    r'^(?P<code>\d{2}(?:\s\d{2}){1,3}[-\s]\d{3,4})\s+'
    r'(?P<uom>[A-Za-z]{1,4})\s+'
    r'(?P<desc>.+?)\s+'
    r'(?P<price>-?[\d,]+\.\d{2})'
    r'(?:\s+(?P<demo>-?[\d,]+\.\d{2}))?\s*\.?$'
)
# Modifier line:  "For <condition>, Add/Deduct  <amount>"
MOD_RE = re.compile(r'^(?P<desc>(?:For\b|Add\b|Deduct\b).+?)\s+(?P<kind>Add|Deduct|ADD|DEDUCT)?\s*(?P<amt>-?[\d,]+\.\d{2})\s*\.?$')
# Technical section header:  "03 30 00  Cast-in-Place Concrete"
SECTION_RE = re.compile(r'^(?P<code>\d{2}(?:\s\d{2}){1,3})\s+(?P<title>[A-Z][A-Za-z0-9 ,/&\-()]+)\s*$')

money = lambda s: float(s.replace(',', ''))


def pages(pdf):
    d = fitz.open(pdf)
    for i in range(d.page_count):
        yield i + 1, d[i].get_text()


def cmd_inspect(pdf):
    """Print candidate task/section lines so the regex can be calibrated."""
    hits = 0
    for pno, text in pages(pdf):
        for ln in text.splitlines():
            ln = ln.strip()
            if not ln:
                continue
            m = TASK_RE.match(ln)
            if m:
                hits += 1
                if hits <= 40:
                    print(f"[p{pno} TASK] {m.group('code')} | {m.group('uom')} | "
                          f"{m.group('desc')[:50]} | ${m.group('price')}")
        if pno >= 30 and hits >= 40:
            break
    print(f"\n{hits}+ task-like lines matched in first pages. "
          f"If 0, share 3-4 raw lines and I'll retune TASK_RE.")


def cmd_cost(pdf):
    tasks, cur_div = [], None
    for pno, text in pages(pdf):
        for ln in text.splitlines():
            ln = ln.strip()
            if not ln:
                continue
            sec = SECTION_RE.match(ln)
            if sec:
                cur_div = sec.group('code')[:2]
            m = TASK_RE.match(ln)
            if not m:
                continue
            code = re.sub(r'\s+', ' ', m.group('code')).replace(' -', '-')
            div = code[:2]
            price = money(m.group('price'))
            lr, mr, er = LME.get(div, (.45, .45, .10))
            labor = round(price * lr, 4)
            tasks.append({
                "taskNumber": code, "csiDivision": div,
                "csiCode": code.split('-')[0].strip() if '-' in code else None,
                "description": m.group('desc').strip(), "uom": m.group('uom').upper(),
                "unitPrice2023": price,
                "laborCost2023": labor,
                "materialCost2023": round(price * mr, 4),
                "equipmentCost2023": round(price * er, 4),
                "laborHours": round(labor / BASE_LABOR_RATE, 4),
                "demoCost2023": money(m.group('demo')) if m.group('demo') else None,
                "isModifier": False, "page": pno, "source": "CTC-2023",
            })
    os.makedirs(OUT, exist_ok=True)
    fn = os.path.join(OUT, "ctc-cost-tasks.json")
    json.dump({"meta": {"source": os.path.basename(pdf), "baseYear": 2023,
                        "count": len(tasks), "lmeSplit": "division ratios (parse-ctc-pdf.ts)"},
               "tasks": tasks}, open(fn, "w"), indent=2)
    print(f"cost: {len(tasks)} tasks -> {os.path.relpath(fn, REPO)}")


def cmd_technical(pdf):
    specs, cur = [], None
    for pno, text in pages(pdf):
        for ln in text.splitlines():
            s = ln.strip()
            if not s:
                continue
            sec = SECTION_RE.match(s)
            if sec:
                if cur:
                    specs.append(cur)
                cur = {"specNumber": re.sub(r'\s+', ' ', sec.group('code')),
                       "csiCode": re.sub(r'\s+', ' ', sec.group('code')),
                       "csiDivision": sec.group('code')[:2],
                       "title": sec.group('title').strip(), "body": "",
                       "page": pno, "source": "CTC-2023"}
            elif cur is not None:
                cur["body"] += (" " + s)
    if cur:
        specs.append(cur)
    for sp in specs:
        sp["body"] = sp["body"].strip()[:8000]
    os.makedirs(OUT, exist_ok=True)
    fn = os.path.join(OUT, "ctc-technical.json")
    json.dump({"meta": {"source": os.path.basename(pdf), "baseYear": 2023, "count": len(specs)},
               "specs": specs}, open(fn, "w"), indent=2)
    print(f"technical: {len(specs)} spec sections -> {os.path.relpath(fn, REPO)}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, pdf = sys.argv[1], sys.argv[2]
    if not os.path.exists(pdf):
        sys.exit(f"PDF not found: {pdf}")
    {"inspect": cmd_inspect, "cost": cmd_cost, "technical": cmd_technical}[cmd](pdf)
