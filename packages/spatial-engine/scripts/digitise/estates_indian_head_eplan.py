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

# Street-tree placement audit. STD. 600.02 measures from the trunk: 10 ft from
# residential driveway entrances/culverts, 15 ft from streetlights/poles, and
# 50 ft (+/-5 ft) nominal shade-tree spacing. A 5-ft utility-line screen is a
# conservative model check pending field utility marking and vertical-clearance
# confirmation; the standard's specific box/meter/hydrant offsets still apply.
trees = []
existing_trees = []
lot_parcels = []
paving = []
lights = []
culverts = []
utilities = []
for f in s["twin"]["features"]:
    a = f.get("attributes") or {}
    if f.get("kind") == "Tree":
        tree_shape = Polygon(f["ring"]["coordinates"]).buffer(0)
        if a.get("existing"):
            existing_trees.append((f.get("id"), tree_shape, a))
        else:
            trees.append((f.get("id"), tree_shape, a, f.get("designation") or ""))
    elif f.get("kind") == "Parcel" and str(f.get("id", "")).startswith("l"):
        lot_parcels.append((f.get("id").split("-")[0].upper(), Polygon(f["ring"]["coordinates"]).buffer(0)))
    elif f.get("kind") == "Pavement" and a.get("improvement") in {"Driveway", "Apron", "entrance"}:
        paving.append((f.get("id"), Polygon(f["ring"]["coordinates"])))
    elif f.get("kind") == "ProposedFeature" and a.get("type") == "street light":
        from shapely.geometry import Point
        lights.append((f.get("id"), Point(f["point"])))
    elif f.get("kind") == "ProposedFeature" and a.get("type") == "culvert":
        from shapely.geometry import LineString
        culverts.append((f.get("id"), LineString(f["line"])))
    elif f.get("kind") == "Utility" and f.get("line"):
        from shapely.geometry import LineString
        utilities.append((f.get("id"), LineString(f["line"])))

tree_rows = []
lot_tree_counts = {lot: 0 for lot, _ in lot_parcels}
lot_tree_counts["R/W OR COMMON AREA"] = 0
street_trees = [(tid, shape.centroid) for tid, shape, a, _ in trees if a.get("streetTree")]
for tid, shape, a, designation in trees:
    p = shape.centroid
    is_street = bool(a.get("streetTree"))
    lots_here = [lot for lot, parcel in lot_parcels if parcel.covers(p)]
    location = lots_here[0] if lots_here else "R/W OR COMMON AREA"
    lot_tree_counts[location] += 1
    drive = min((p.distance(g) for _, g in paving), default=999)
    light = min((p.distance(g) for _, g in lights), default=999)
    culvert = min((p.distance(g) for _, g in culverts), default=999)
    utility = min((p.distance(g) for _, g in utilities), default=999)
    nearest = min((p.distance(q) for oid, q in street_trees if oid != tid), default=999) if is_street else None
    # The lot-tree generator uses a 6-ft symbol radius plus an 8-ft working
    # clearance from structures and paving. Mapped street trees use the public
    # works trunk offsets. In either case the drawn canopy must not overlap an
    # apron or driveway.
    paving_clearance = 10 if is_street else 14
    spacing_ok = (45 <= nearest <= 55) if is_street else True
    ok = (drive >= paving_clearance and light >= 15 and culvert >= 10 and utility >= 5
          and spacing_ok and not any(shape.intersects(g) for _, g in paving))
    tree_rows.append({"tree": tid, "class": "mapped street tree" if is_street else "lot shade tree",
                      "lot": location, "drivewayApronFt": round(drive, 1), "streetlightFt": round(light, 1),
                      "culvertFt": round(culvert, 1), "utilityLineFt": round(utility, 1),
                      "nearestStreetTreeFt": round(nearest, 1) if nearest is not None else None, "pass": ok})
    if not ok:
        errors.append(f"{tid}: tree placement clearance/spacing failed ({tree_rows[-1]})")

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
        "treesChecked": len(trees),
        "existingTreesShownFrom2009Base": len(existing_trees),
        "streetTreesChecked": len(street_trees),
        "mappedStreetTreesChecked": len(street_trees),
        "lotShadeTreesChecked": len(trees) - len(street_trees),
        "treeQuantityByLot": lot_tree_counts,
        "streetTreePlacementPass": not any("tree placement clearance/spacing failed" in e for e in errors),
        "streetTreeRows": tree_rows,
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
