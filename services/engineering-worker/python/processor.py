import json
import os
import sys
import tempfile
import urllib.request
import urllib.parse
import base64
import io

import numpy as np
from scipy.spatial import Delaunay
from pyproj import Transformer
import ezdxf
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, ARCH_D

TOOL_VERSION = "kealee-engineering-python-1.0.0"

def source_file(data):
    url = data.get("sourceUrl")
    if not url:
        raise ValueError("sourceUrl is required for document processing")
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("sourceUrl must be an HTTPS object-storage URL")
    allowed_hosts = [host.strip().lower() for host in
                     os.environ.get("ENGINEERING_STORAGE_HOSTS", "").split(",") if host.strip()]
    if allowed_hosts and parsed.hostname.lower() not in allowed_hosts:
        raise ValueError("sourceUrl host is not an approved engineering storage host")
    suffix = os.path.splitext(url.split("?")[0])[1][:10]
    target = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    target.close()
    urllib.request.urlretrieve(url, target.name)
    return target.name

def survey_ocr(data):
    path = source_file(data)
    try:
        tokens = []
        provider = "paddleocr"
        try:
            from paddleocr import PaddleOCR
            ocr = PaddleOCR(use_doc_orientation_classify=True, use_doc_unwarping=True,
                            use_textline_orientation=True, lang="en")
            prediction = ocr.predict(path)
            for page, item in enumerate(prediction, start=1):
                payload = item.json() if callable(getattr(item, "json", None)) else getattr(item, "json", {})
                result = payload.get("res", payload)
                texts = result.get("rec_texts", [])
                scores = result.get("rec_scores", [])
                boxes = result.get("rec_boxes", [])
                for index, text in enumerate(texts):
                    box = boxes[index] if index < len(boxes) else [0, 0, 0, 0]
                    tokens.append({"rawText": text,
                        "confidence": float(scores[index]) if index < len(scores) else 0,
                        "page": page, "boundingBox": [float(value) for value in box]})
        except Exception as paddle_error:
            from PIL import Image
            import pytesseract
            if not path.lower().endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff")):
                raise RuntimeError(f"PaddleOCR failed and Tesseract fallback cannot rasterize this input: {paddle_error}")
            provider = "tesseract"
            rows = pytesseract.image_to_data(Image.open(path), output_type=pytesseract.Output.DICT)
            for index, text in enumerate(rows.get("text", [])):
                if not text.strip():
                    continue
                confidence = max(0, float(rows["conf"][index])) / 100
                left, top = float(rows["left"][index]), float(rows["top"][index])
                width, height = float(rows["width"][index]), float(rows["height"][index])
                tokens.append({"rawText": text, "confidence": confidence, "page": 1,
                    "boundingBox": [left, top, left + width, top + height]})
        return {"tokens": tokens, "warnings": [
            "OCR values are EXTRACTED and require side-by-side human verification before authoritative geometry."
        ], "confidence": min([token["confidence"] for token in tokens], default=0),
            "automaticPercent": 70, "estimatedCostUsd": 0.25, "toolVersion": TOOL_VERSION}
    finally:
        os.unlink(path)

def transform_coordinates(data):
    options = data["options"]
    transformer = Transformer.from_crs(options["sourceCrs"], options["targetCrs"], always_xy=True)
    points = [{"x": x, "y": y, **({"z": point["z"]} if "z" in point else {})}
              for point in options["points"]
              for x, y in [transformer.transform(point["x"], point["y"])]]
    return {"points": points, "warnings": [], "confidence": 1, "automaticPercent": 100,
            "estimatedCostUsd": 0.01, "toolVersion": TOOL_VERSION}

def generate_surface(data):
    points = data["options"]["points"]
    if len(points) < 3:
        raise ValueError("At least three verified points are required")
    coords = np.array([[point["x"], point["y"]] for point in points])
    triangulation = Delaunay(coords)
    triangles = triangulation.simplices.tolist()
    return {"points": points, "triangles": triangles,
            "sourcePointIds": [point.get("sourcePointId") for point in points],
            "warnings": ["Generated surface remains preliminary until engineer-approved."],
            "confidence": 0.9, "automaticPercent": 90, "estimatedCostUsd": 0.10,
            "toolVersion": TOOL_VERSION}

def generate_contours(data):
    points = data["options"]["points"]
    interval = float(data["options"].get("interval", 1))
    if len(points) < 3 or interval <= 0:
        raise ValueError("Contours require three points and a positive interval")
    coords = np.array([[point["x"], point["y"]] for point in points])
    triangles = Delaunay(coords).simplices
    z_min = min(point["z"] for point in points)
    z_max = max(point["z"] for point in points)
    levels = np.arange(np.ceil(z_min / interval) * interval, z_max, interval)
    contours = []
    for level in levels:
        segments = []
        for triangle in triangles:
            vertices = [points[int(index)] for index in triangle]
            crossings = []
            for index in range(3):
                a, b = vertices[index], vertices[(index + 1) % 3]
                if (a["z"] - level) * (b["z"] - level) <= 0 and a["z"] != b["z"]:
                    ratio = (level - a["z"]) / (b["z"] - a["z"])
                    if 0 <= ratio <= 1:
                        crossings.append({"x": a["x"] + ratio * (b["x"] - a["x"]),
                                          "y": a["y"] + ratio * (b["y"] - a["y"])})
            if len(crossings) >= 2:
                segments.append(crossings[:2])
        contours.append({"elevation": float(level), "segments": segments})
    return {"contours": contours, "interval": interval,
            "warnings": ["Contours are preliminary and depend on verified source elevations."],
            "confidence": .9, "automaticPercent": 95, "estimatedCostUsd": .10,
            "toolVersion": TOOL_VERSION}

def calculate_cut_fill(data):
    options = data["options"]
    existing, proposed = options["existing"], options["proposed"]
    if len(existing) != len(proposed) or not existing:
        raise ValueError("Matched existing and proposed elevation samples are required")
    cell_area = float(options["cellAreaSqFt"])
    cut = sum(max(0, a["z"] - b["z"]) * cell_area for a, b in zip(existing, proposed)) / 27
    fill = sum(max(0, b["z"] - a["z"]) * cell_area for a, b in zip(existing, proposed)) / 27
    return {"cutCubicYards": cut, "fillCubicYards": fill, "netCubicYards": fill-cut,
            "warnings": ["Preliminary sample-cell cut/fill requires engineer verification."],
            "confidence": .85, "automaticPercent": 95, "estimatedCostUsd": .05,
            "toolVersion": TOOL_VERSION}

def analyze_drainage(data):
    options = data["options"]
    area_acres = float(options["areaSqFt"]) / 43560
    coefficient = float(options["runoffCoefficient"])
    intensity = float(options["rainfallIntensityInPerHour"])
    peak = coefficient * intensity * area_acres
    return {"formula": "Q = C × i × A", "areaAcres": area_acres, "peakRunoffCfs": peak,
            "rainfallSource": options.get("rainfallSource"), "ruleVersion": options.get("ruleVersion"),
            "warnings": ["Preliminary runoff screening requires engineer verification."],
            "confidence": .9, "automaticPercent": 95, "estimatedCostUsd": .05,
            "toolVersion": TOOL_VERSION}

def drawing_artifacts(data):
    options = data["options"]
    geometries = options.get("geometry", [])
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 2 if options.get("units", "FEET") == "FEET" else 6
    model = doc.modelspace()
    layer_map = options.get("layerMap", {})
    for item in geometries:
        layer = layer_map.get(item["layer"], item["layer"])
        if layer not in doc.layers:
            doc.layers.add(layer)
        points = [(point["x"], point["y"]) for point in item["vertices"]]
        model.add_lwpolyline(points, close=bool(item.get("closed")), dxfattribs={"layer": layer})
    dxf_buffer = io.StringIO()
    doc.write(dxf_buffer)
    svg_lines = []
    for item in geometries:
        points = " ".join(f'{p["x"]},{-p["y"]}' for p in item["vertices"])
        svg_lines.append(f'<polyline points="{points}" fill="none" stroke="black" stroke-width=".5"/>')
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -120 160 160">'
           + "".join(svg_lines) + "</svg>")
    pdf_buffer = io.BytesIO()
    pdf = canvas.Canvas(pdf_buffer, pagesize=landscape(ARCH_D))
    pdf.setTitle(options.get("name", "Kealee Infill Site Plan"))
    pdf.drawString(36, 36, "PRELIMINARY — NOT FOR CONSTRUCTION — PROFESSIONAL REVIEW REQUIRED")
    for item in geometries:
        pts = item["vertices"]
        if len(pts) < 2:
            continue
        path = pdf.beginPath()
        path.moveTo(80 + pts[0]["x"], 120 + pts[0]["y"])
        for point in pts[1:]:
            path.lineTo(80 + point["x"], 120 + point["y"])
        if item.get("closed"):
            path.close()
        pdf.drawPath(path)
    pdf.save()
    report_buffer = io.BytesIO()
    report = canvas.Canvas(report_buffer, pagesize=landscape(ARCH_D))
    report.setTitle("Kealee Preliminary Civil Calculation Report")
    report.drawString(36, 560, "PRELIMINARY CIVIL CALCULATION REPORT — PROFESSIONAL REVIEW REQUIRED")
    report.drawString(36, 535, f'Coordinate system: {options.get("crs", "UNKNOWN")}')
    report.drawString(36, 515, f'Units: {options.get("units", "UNKNOWN")}')
    report.drawString(36, 495, f'Geometry layers: {len(geometries)}')
    report.drawString(36, 455, "This report is not final engineering and is not sealed.")
    report.save()
    manifest = {"crs": options.get("crs"), "units": options.get("units"), "revision": options.get("revision", 1),
                "layers": sorted(set(item["layer"] for item in geometries)),
                "notes": ["NOT A BOUNDARY SURVEY", "PRELIMINARY — PROFESSIONAL REVIEW REQUIRED"]}
    return {"artifacts": [
        {"kind": "DXF", "filename": "site-plan.dxf",
         "base64": base64.b64encode(dxf_buffer.getvalue().encode()).decode()},
        {"kind": "PREVIEW", "filename": "site-plan.svg",
         "base64": base64.b64encode(svg.encode()).decode()},
        {"kind": "PDF", "filename": "site-plan.pdf",
         "base64": base64.b64encode(pdf_buffer.getvalue()).decode()},
        {"kind": "REPORT", "filename": "civil-calculation-report.pdf",
         "base64": base64.b64encode(report_buffer.getvalue()).decode()},
    ], "manifest": manifest, "validationReport": {"valid": bool(geometries), "warnings": []},
        "warnings": ["Drawing package is preliminary and unsealed."], "confidence": .9,
        "automaticPercent": 90, "estimatedCostUsd": .25, "toolVersion": TOOL_VERSION}

def compliance_audit(data):
    options = data["options"]
    required = options.get("requiredInputs", [])
    missing = [name for name in required if options.get("inputs", {}).get(name) is None]
    return {"outcome": "MISSING_DATA" if missing else "NEEDS_PROFESSIONAL_REVIEW",
            "missingInputs": missing, "ruleVersion": options.get("ruleVersion"),
            "warnings": ["Compliance output is a deterministic screening, not agency approval."],
            "confidence": 1 if not missing else 0, "automaticPercent": 100,
            "estimatedCostUsd": .02, "toolVersion": TOOL_VERSION}

PROCESSORS = {
    "SURVEY_OCR": survey_ocr,
    "TRANSFORM_COORDINATES": transform_coordinates,
    "GENERATE_SURFACE": generate_surface,
    "GENERATE_CONTOURS": generate_contours,
    "CALCULATE_CUT_FILL": calculate_cut_fill,
    "ANALYZE_DRAINAGE": analyze_drainage,
    "GENERATE_DXF": drawing_artifacts,
    "GENERATE_VECTOR_PDF": drawing_artifacts,
    "GENERATE_REPORT": drawing_artifacts,
    "RUN_COMPLIANCE_AUDIT": compliance_audit,
}

def main():
    data = json.load(sys.stdin)
    processor = PROCESSORS.get(data.get("type"))
    if not processor:
        raise ValueError(f"Unsupported engineering job type: {data.get('type')}")
    json.dump(processor(data), sys.stdout)

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
