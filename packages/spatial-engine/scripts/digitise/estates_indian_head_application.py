"""Fill the DPIE Concept Plan application from the generated Estates sheet set."""
import json
import os
import sys
import pymupdf

if len(sys.argv) != 4:
    raise SystemExit("usage: estates_indian_head_application.py <blank.pdf> <sheetset.json> <output.pdf>")

blank, spec_path, output = sys.argv[1:]
s = json.load(open(spec_path, encoding="utf-8"))
totals = s["bmp"]["totals"]
lod_ac = float(s["extras"]["siteLodSqFt"]) / 43560

values = {
    "Name of Company": "Gerald Waldman Revocable Trust (owner)",
    "Name of Contact Person": "Gerald Waldman, Trustee",
    "Address": "400 N. Flagler Drive\nWest Palm Beach, FL 33401",
    "PROJECT NAME": "Estates at Indian Head, Lots 1-6",
    "Geographic Location related to or near major intersection": "Estates Ct at Jennifer Dr; Jennifer frontage road is separated from MD 210",
    "Street Address if available": "200-205 Estates Court, Accokeek, MD 20607",
    "Companion Cases": "5-08238; TCP1-018-06; TCP2-016-09; NRI-015-06; DPW&T 9399-2009",
    "Total Number of Lots or Parcels": "6 lots",
    "Total Area acres": "3.788 acres (record)",
    "Tax Account Numbers": "3987666, 3987674, 3987682, 3987690, 3987708, 3987716",
    "Tax MapGrid": "151 / F-3",
    "WSSC 200 Grid": "220SE01",
    "Master Plan Name": "2013 Subregion 5 MP & SMA",
    "Master Plan Road": "Jennifer Dr frontage road; MD 210 separated; no direct access",
    "Councilmanic District": "9",
    "County Election District": "5",
    "Municipalityies": "None",
    "Historic Site": "No",
    "Historic Site Number": "N/A",
    "Scenic or Historic Road": "No",
    "Current Zone": "RR",
    "Proposed Zone": "RR",
    "MD 12 Digit Watershed": "021402030798",
    "County Watershed": "Piscataway Creek",
    "Impaired watershed": "Yes - Chesapeake Bay TMDL",
    "Type of Impairment": "Nitrogen, phosphorus, sediment",
    "Tier II Watershed": "No",
    "HotSpot": "No",
    "HotSpot Type": "N/A",
    "Ex Site Imp Area": "0 sf",
    "Ex Site Imp Area in LOD": "0 sf",
    "Ex Site Imp Area to be Removed": "0 sf",
    "Ex Site Imp Area Prev Treated": "0 sf",
    "New Site Imp Area": f'{round(totals["impSqFt"]):,} sf',
    "Estimated Disturbed Area acres": f"{lod_ac:.2f}",
    "Marlboro Clay": "Not mapped; geotech verification pending",
    "Public Project": "No",
    "Closed Section Road": "No",
    "Open Section Road": "Yes - Estates Court",
    "Specific Proposed Use of Property Proposed Activity andor Request":
        "Six detached dwellings on recorded lots; construct open-section Estates Court at Jennifer Drive; "
        "WSSC mains from Henrietta Drive; ESD to MEP. No direct MD 210 access.",
    "List and provide copies of resolutions of previously approved applications affecting the subject property or state not applicable":
        "Final plat 5-08238 (PM 228/83); NRI-015-06; TCP1-018-06; TCP2-016-09; "
        "DPW&T 9399-2009-00 base plan; WSSC easement L.51799 F.399.",
}

doc = pymupdf.open(blank)
for page in doc:
    for widget in page.widgets() or []:
        if widget.field_name in values:
            widget.field_value = values[widget.field_name]
            widget.text_fontsize = 6
            widget.update()
        elif widget.field_type_string == "CheckBox":
            widget.field_value = "Off"
            widget.update()

# Preserve the same form selections as the verified prior draft: new
# development and no floodplain. The applicant/engineer must confirm them.
for page in doc:
    for widget in page.widgets() or []:
        if widget.field_name in {"Check Box1.0.1.0", "Check Box1.0.1.4.0.1"}:
            widget.field_value = "Yes"
            widget.update()

os.makedirs(os.path.dirname(output), exist_ok=True)
doc.save(output, garbage=4, deflate=True)
print(f"application: impervious {values['New Site Imp Area']} · LOD {lod_ac:.2f} ac -> {output}")
