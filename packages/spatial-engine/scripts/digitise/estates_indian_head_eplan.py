"""Create individual ePlan sheet PDFs and validate critical Estates geometry."""
import hashlib
import json
import os
import sys
import pymupdf
from shapely.geometry import Polygon
from shapely.ops import unary_union

if len(sys.argv) != 4:
    raise SystemExit("usage: estates_indian_head_eplan.py <plan.pdf> <sheetset.json> <package-dir>")

plan_path, spec_path, out = sys.argv[1:]
s = json.load(open(spec_path, encoding="utf-8"))
os.makedirs(out, exist_ok=True)
doc = pymupdf.open(plan_path)
if len(doc) != len(s["sheets"]):
    raise SystemExit(f"page/sheet mismatch: PDF {len(doc)}, spec {len(s['sheets'])}")

files = []
for i, sh in enumerate(s["sheets"]):
    name = f"{sh['id']}.pdf"
    if len(name) > 25:
        raise SystemExit(f"ePlan filename too long: {name}")
    one = pymupdf.open()
    one.insert_pdf(doc, from_page=i, to_page=i)
    path = os.path.join(out, name)
    one.save(path, garbage=4, deflate=True)
    data = open(path, "rb").read()
    files.append({"sheet": sh["id"], "title": sh["title"], "file": name,
                  "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})

lod = unary_union([Polygon(r).buffer(0) for r in s["extras"]["siteLod"]])
errors = []
checked = 0
for f in s["twin"]["features"]:
    if f.get("kind") != "Building":
        continue
    ring = (f.get("ring") or {}).get("coordinates") or []
    if len(ring) < 3:
        continue
    checked += 1
    b = Polygon(ring).buffer(0)
    if not lod.covers(b):
        errors.append(f"{f.get('id')}: {b.difference(lod).area:.2f} sf outside LOD")
    if lod.boundary.crosses(b):
        errors.append(f"{f.get('id')}: LOD boundary crosses building")

apron = next((f for f in s["twin"]["features"] if f.get("id") == "entrance-apron"), None)
sce = Polygon(s["extras"]["constructionEntrance"]).buffer(0)
if apron:
    ap = Polygon(apron["ring"]["coordinates"]).buffer(0)
    if not sce.covers(ap):
        errors.append(f"SCE does not cover {ap.difference(sce).area:.2f} sf of entrance apron")

manifest = {
    "project": "Estates at Indian Head",
    "sourcePdf": os.path.basename(plan_path),
    "sheetCount": len(files),
    "files": files,
    "geometryValidation": {
        "buildingsChecked": checked,
        "lodCrossesBuilding": False if not any("crosses building" in e for e in errors) else True,
        "allBuildingsInsideLod": not any("outside LOD" in e for e in errors),
        "sceCoversFullApron": not any("SCE does not cover" in e for e in errors),
        "errors": errors,
    },
    "submissionStatus": "DRAFT - PE/LS seals, signatures, updated NRI/TCP, geotechnical field work, "
                        "downstream drainage verification, WSSC records/easement, and applicant upload remain.",
}
with open(os.path.join(out, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
if errors:
    raise SystemExit("ePlan validation failed: " + "; ".join(errors))
print(f"ePlan: {len(files)} individual sheets; {checked} buildings inside LOD; full apron inside SCE -> {out}")
