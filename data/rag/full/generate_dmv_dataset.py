#!/usr/bin/env python3
"""
generate_dmv_dataset.py
Generates a comprehensive 1000-1500 record JSONL RAG dataset for the
DMV (DC-Maryland-Virginia) + Baltimore construction/permitting domain.
"""
import json
import random
import itertools
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "dmv_full_dataset.jsonl")

# ── Seed data ─────────────────────────────────────────────────────────────────

JURISDICTIONS = [
    "District of Columbia",
    "Arlington County",
    "Alexandria",
    "Fairfax County",
    "Fairfax City",
    "Falls Church",
    "Montgomery County",
    "Prince George's County",
    "Howard County",
    "Anne Arundel County",
    "Baltimore City",
    "Baltimore County",
    "Frederick County",
    "Loudoun County",
    "Prince William County",
    "Stafford County",
]

PROJECT_TYPES = [
    "single-family", "adu", "townhouse", "duplex", "multifamily",
    "commercial", "office", "retail", "industrial", "mixed-use",
    "renovation", "addition", "historic-renovation", "infill",
]

ZONES_BY_JURISDICTION = {
    "District of Columbia":       ["R-1-A","R-1-B","R-2","R-3","R-4","R-5-A","R-5-B","RF-1","C-2-A","C-2-B","MU-4"],
    "Arlington County":           ["R-6","R-5","R-2-7","R-2-5","C-1","C-2","C-3","M-1","RA6-15","RA7-16","RA8-18"],
    "Alexandria":                 ["R-20","R-8","R-5","RM","CL","CD","OCM-100","I"],
    "Fairfax County":             ["R-1","R-2","R-3","R-4","R-8","R-12","PDH-4","C-3","C-4","I-1","I-2","PTC"],
    "Fairfax City":               ["R-1","R-2","C-1","C-2","I-1","PD-M"],
    "Falls Church":               ["R-1A","R-1B","R-2","B-1","B-2","I"],
    "Montgomery County":          ["RE-2","RE-1","R-200","R-90","R-60","R-40","TLD","CRN","CR","EOF","IL"],
    "Prince George's County":     ["R-A","R-E","R-R","R-55","R-35","R-20","R-18","C-S-C","C-M","M-1","M-2"],
    "Howard County":              ["R-ED","R-A","R-12","R-SA-8","CAC","GC","OC","EC","I-1","I-2"],
    "Anne Arundel County":        ["RA","RLD","R1","R2","R5","R10","R15","R22","B1","B2","B3","I1","I2"],
    "Baltimore City":             ["R-1","R-2","R-3","R-4","R-5","R-6","R-7","R-8","C-1","C-2","M-1","M-2"],
    "Baltimore County":           ["DR-1","DR-2","DR-3.5","DR-5.5","DR-10.5","BR","BM","BL","BX","M-A-T"],
    "Frederick County":           ["A","AG","R","RP","RC","B1","B2","B3","I1","I2","PUD"],
    "Loudoun County":             ["AR-1","AR-2","JLMA-1","JLMA-2","JLMA-3","TR-10","TR-5","TC","CC","I-1"],
    "Prince William County":      ["A-1","SR-1","SR-2","SR-3","R-2","R-4","R-6","B-1","B-2","M-1","M-2"],
    "Stafford County":            ["A-1","A-2","R-1","R-2","RBC","B-1","B-2","B-3","I-1","I-2","PUD"],
}

WORKFLOW_STAGES = [
    "site-selection", "land-analysis", "due-diligence", "feasibility",
    "pre-design", "design", "permitting", "bidding",
    "construction", "inspections", "closeout",
]

PERMIT_TYPES = {
    "single-family":        "Residential Building Permit",
    "adu":                  "Accessory Dwelling Unit Permit",
    "townhouse":            "Townhouse Building Permit",
    "duplex":               "Two-Family Dwelling Permit",
    "multifamily":          "Multi-Family Building Permit",
    "commercial":           "Commercial Building Permit",
    "office":               "Commercial Office Permit",
    "retail":               "Commercial Retail Permit",
    "industrial":           "Industrial Building Permit",
    "mixed-use":            "Mixed-Use Development Permit",
    "renovation":           "Renovation/Alteration Permit",
    "addition":             "Residential Addition Permit",
    "historic-renovation":  "Historic Alteration Certificate",
    "infill":               "Infill Residential Permit",
}

COST_PER_SQFT = {
    "single-family": (220, 320),
    "adu":           (300, 420),
    "townhouse":     (200, 280),
    "duplex":        (210, 290),
    "multifamily":   (180, 270),
    "commercial":    (160, 260),
    "office":        (175, 280),
    "retail":        (150, 240),
    "industrial":    (100, 160),
    "mixed-use":     (190, 310),
    "renovation":    (130, 220),
    "addition":      (240, 360),
    "historic-renovation": (280, 450),
    "infill":        (220, 330),
}

AVG_SIZE_SQFT = {
    "single-family": 2400, "adu": 600, "townhouse": 1800, "duplex": 2600,
    "multifamily": 8000, "commercial": 12000, "office": 15000,
    "retail": 5000, "industrial": 30000, "mixed-use": 20000,
    "renovation": 1200, "addition": 550, "historic-renovation": 1000,
    "infill": 2000,
}

PERMIT_REQUIREMENTS = {
    "single-family": ["Site plan", "Architectural drawings", "Structural calculations",
                      "Energy compliance report (REScheck)", "Contractor license"],
    "adu":           ["Site plan", "ADU floor plan", "Setback compliance letter",
                      "Parking plan", "Owner-occupancy affidavit"],
    "commercial":    ["Site plan", "Architectural drawings", "MEP drawings",
                      "Traffic impact study", "ADA compliance report",
                      "Environmental assessment", "Fire protection plan"],
    "renovation":    ["As-built drawings", "Scope of work narrative",
                      "Historic review (if applicable)", "Contractor license"],
    "multifamily":   ["Site plan", "Grading plan", "Stormwater management",
                      "Architectural + MEP drawings", "Fire suppression plan",
                      "Elevator compliance", "Accessibility report"],
}

COMMON_ISSUES = {
    "District of Columbia": ["Alley setback violations", "Historic district conflicts",
                              "Green area ratio non-compliance", "Matter of right vs special exception"],
    "Arlington County":     ["Site plan amendment required for additions > 20%",
                              "Form-based code non-compliance", "Tree canopy requirements"],
    "Alexandria":           ["Historic district design review delays",
                              "Waterfront development restrictions", "Parking minimums waiver needed"],
    "Fairfax County":       ["Impervious surface limits in RPA", "Well and septic setbacks",
                              "Floodplain encroachment", "Cluster development rules"],
    "Montgomery County":    ["Forest conservation plan required > 40,000 sqft",
                              "Adequate public facilities test", "Critical area buffers",
                              "Tree canopy credits needed"],
    "Prince George's County": ["Chesapeake Bay Critical Area restrictions",
                                "Forest stand delineation required", "SWM pond sizing"],
    "Baltimore City":       ["Lead paint clearance required pre-1978 buildings",
                              "Historic preservation conflicts", "Vacant building permits needed"],
}

WORKFLOW_STEPS = {
    "site-selection":  ["Market analysis", "Parcel search", "Zoning check", "Title search", "LOI submission"],
    "land-analysis":   ["Survey order", "Soil testing", "Environmental Phase I", "Utility locate", "Zoning letter"],
    "due-diligence":   ["Title insurance", "Survey review", "Environmental Phase II if needed",
                        "Geotechnical report", "Entitlement risk assessment"],
    "feasibility":     ["Pro forma analysis", "Cost estimation", "Market rent study",
                        "Zoning variance assessment", "Financial underwriting"],
    "pre-design":      ["Program development", "Site analysis", "Preliminary massing", "Concept renderings"],
    "design":          ["Schematic design", "Design development", "Construction documents",
                        "MEP coordination", "Structural engineering"],
    "permitting":      ["Application submission", "Plan review", "Comment response",
                        "Resubmission", "Permit issuance"],
    "bidding":         ["Bid package prep", "GC solicitation", "Bid leveling",
                        "Contract negotiation", "Notice to proceed"],
    "construction":    ["Site mobilization", "Foundation", "Structural framing", "MEP rough-in",
                        "Inspections", "Finishes", "Punch list"],
    "inspections":     ["Footing inspection", "Framing inspection", "Mechanical rough",
                        "Electrical rough", "Insulation inspection", "Final inspection"],
    "closeout":        ["Certificate of Occupancy", "As-built drawings", "O&M manuals",
                        "Final lien waivers", "Warranty documentation"],
}

WORKFLOW_DAYS = {
    "site-selection": 14, "land-analysis": 7, "due-diligence": 21,
    "feasibility": 14, "pre-design": 10, "design": 30,
    "permitting": 45, "bidding": 14, "construction": 180,
    "inspections": 3, "closeout": 14,
}

NEXT_STAGE = {
    "site-selection": "land-analysis", "land-analysis": "due-diligence",
    "due-diligence": "feasibility", "feasibility": "pre-design",
    "pre-design": "design", "design": "permitting",
    "permitting": "bidding", "bidding": "construction",
    "construction": "inspections", "inspections": "closeout",
    "closeout": None,
}

# ── Generators ────────────────────────────────────────────────────────────────

def make_permit(jurisdiction, project_type, variant=0):
    req_key = project_type if project_type in PERMIT_REQUIREMENTS else "single-family"
    issue_key = jurisdiction if jurisdiction in COMMON_ISSUES else random.choice(list(COMMON_ISSUES.keys()))
    base_days = random.randint(20, 75)
    base_fee = random.randint(200, 2500)
    return {
        "type": "permit",
        "jurisdiction": jurisdiction,
        "project_types": [project_type],
        "permit_type": PERMIT_TYPES.get(project_type, "Building Permit"),
        "processing_days": base_days,
        "requirements": PERMIT_REQUIREMENTS.get(req_key, ["Site plan", "Architectural drawings"]),
        "common_issues": random.sample(COMMON_ISSUES.get(issue_key, ["Missing documents"]), k=min(3, len(COMMON_ISSUES.get(issue_key, ["Missing documents"])))),
        "fee_base": base_fee,
        "fee_per_sqft": round(random.uniform(0.5, 4.0), 2),
        "plan_review_rounds_avg": random.randint(1, 4),
        "expedited_available": random.choice([True, False]),
        "online_submission": random.choice([True, False]),
    }

def make_zoning(jurisdiction, zone):
    coverage = random.randint(30, 85)
    front = random.randint(10, 50)
    side = random.randint(3, 20)
    rear = random.randint(15, 40)
    height = random.choice([25, 35, 45, 55, 65, 80, 110])
    adu = random.choice([True, True, False])
    return {
        "type": "zoning",
        "jurisdiction": jurisdiction,
        "zone": zone,
        "max_lot_coverage": coverage,
        "min_lot_size_sqft": random.choice([1500, 2000, 3000, 5000, 6000, 7500, 10000, 20000, 43560]),
        "setback_front": front,
        "setback_side": side,
        "setback_rear": rear,
        "max_height_ft": height,
        "max_stories": height // 12,
        "adu_allowed": adu,
        "min_adu_sqft": random.randint(300, 600) if adu else None,
        "max_adu_sqft": random.randint(700, 1200) if adu else None,
        "parking_spaces_required": random.choice([1, 2, 2, 2]),
        "open_space_required_pct": random.randint(10, 40),
        "by_right": random.choice([True, False]),
        "special_exception_uses": random.sample(
            ["daycare", "place of worship", "school", "medical office", "short-term rental"],
            k=random.randint(0, 3)
        ),
    }

def make_cost(project_type, jurisdiction):
    lo, hi = COST_PER_SQFT.get(project_type, (180, 280))
    cost_per_sqft = round(random.uniform(lo, hi), 0)
    avg_size = AVG_SIZE_SQFT.get(project_type, 2000)
    duration = random.randint(3, 24)
    soft_pct = round(random.uniform(8, 22), 1)
    cont_pct = round(random.uniform(5, 15), 1)
    return {
        "type": "cost",
        "project_type": project_type,
        "jurisdiction": jurisdiction,
        "cost_per_sqft": int(cost_per_sqft),
        "avg_size_sqft": avg_size,
        "total_hard_cost_est": int(cost_per_sqft * avg_size),
        "soft_costs_percent": soft_pct,
        "contingency_percent": cont_pct,
        "typical_duration_months": duration,
        "primary_expense_categories": random.sample(
            ["foundation", "framing", "roofing", "MEP", "electrical",
             "plumbing", "HVAC", "finishes", "site work", "demolition",
             "windows/doors", "insulation", "exterior cladding"],
            k=4
        ),
        "land_cost_pct_of_total": round(random.uniform(15, 45), 1),
        "permit_fee_est": random.randint(300, 5000),
        "design_fee_est": int(cost_per_sqft * avg_size * soft_pct / 100),
    }

def make_workflow(stage, project_type, jurisdiction):
    steps = WORKFLOW_STEPS.get(stage, ["Plan", "Execute", "Review"])
    return {
        "type": "workflow",
        "stage": stage,
        "project_type": project_type,
        "jurisdiction": jurisdiction,
        "key_steps": steps,
        "estimated_days": WORKFLOW_DAYS.get(stage, 14) + random.randint(-5, 10),
        "deliverables": [f"{s} deliverable" for s in steps[:3]],
        "next_stage": NEXT_STAGE.get(stage),
        "required_professionals": random.sample(
            ["Architect", "Civil Engineer", "Structural Engineer", "MEP Engineer",
             "Land Surveyor", "Environmental Consultant", "Geotechnical Engineer",
             "General Contractor", "Attorney", "Title Company"],
            k=random.randint(2, 5)
        ),
        "common_blockers": random.sample(
            ["Incomplete documents", "Jurisdiction backlog", "Comment resolution delays",
             "Funding not in place", "Contractor availability", "Weather delays",
             "Material lead times", "Utility conflicts"],
            k=random.randint(2, 4)
        ),
    }

# ── Build dataset ─────────────────────────────────────────────────────────────

records = []

# 1. Permit records: all jurisdictions × all project types → ~224 records
for jur, ptype in itertools.product(JURISDICTIONS, PROJECT_TYPES):
    records.append(make_permit(jur, ptype))

# 2. Zoning records: all jurisdictions × their zones → ~120+ records
for jur, zones in ZONES_BY_JURISDICTION.items():
    for zone in zones:
        records.append(make_zoning(jur, zone))

# 3. Cost records: all project types × all jurisdictions → ~224 records
for ptype, jur in itertools.product(PROJECT_TYPES, JURISDICTIONS):
    records.append(make_cost(ptype, jur))

# 4. Workflow records: all stages × all project types × sample of jurisdictions
for stage, ptype in itertools.product(WORKFLOW_STAGES, PROJECT_TYPES):
    jur = random.choice(JURISDICTIONS)
    records.append(make_workflow(stage, ptype, jur))

# 5. Extra permit variants for high-demand jurisdictions
HIGH_DEMAND = ["District of Columbia", "Fairfax County", "Montgomery County",
               "Baltimore City", "Arlington County"]
for jur in HIGH_DEMAND:
    for ptype in PROJECT_TYPES:
        for _ in range(3):
            records.append(make_permit(jur, ptype, variant=1))

# 6. Extra zoning detail rows for DC and major counties
for jur in HIGH_DEMAND:
    zones = ZONES_BY_JURISDICTION.get(jur, ["R-1"])
    for zone in zones:
        for _ in range(2):
            records.append(make_zoning(jur, zone))

# Shuffle so types are interleaved
random.shuffle(records)

# Write
with open(OUTPUT, "w") as f:
    for r in records:
        f.write(json.dumps(r) + "\n")

total = len(records)
by_type = {}
for r in records:
    by_type[r["type"]] = by_type.get(r["type"], 0) + 1

print(f"Generated {total} records → {OUTPUT}")
for t, c in sorted(by_type.items()):
    print(f"  {t}: {c}")
