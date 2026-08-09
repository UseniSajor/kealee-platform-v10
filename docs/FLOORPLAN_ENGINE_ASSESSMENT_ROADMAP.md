# Floor Plan Engine Quality Assessment & AutoCAD-Level Design

**Date:** July 8, 2026  
**Assessment Scope:** Current Concept Engine vs. Professional CAD standard  

---

## Executive Summary

**Current Concept Engine Quality: ⚠️ ADEQUATE FOR CONCEPT-ONLY, NOT PRODUCTION DRAWINGS**

| Aspect | Current | AutoCAD-Level | Gap |
|---|---|---|---|
| **Precision** | 1ft grid (concept) | 0.01ft sub-inch | Large |
| **Wall geometry** | Room polylines only | Actual wall lines, thickness | Large |
| **Doors/windows** | Not included | Architectural symbols | Large |
| **Dimensions** | Manual placement | Automatic, linked | Large |
| **Code compliance** | Egress + clearances checked | Full MEP path validation | Medium |
| **Layer organization** | None (SVG) | AIA CAD layer standards | Large |
| **Rendering speed** | <150ms | N/A (not real-time) | Acceptable |
| **Export quality** | DXF basic (no intelligence) | Full DXF with nested blocks | Large |

**Recommendation:** Build **new, dedicated AutoCAD-level engine** rather than enhance existing Concept Engine.

---

## Current Concept Engine Analysis

### What It Does Well ✅

1. **Layout Optimization (Simulated Annealing)**
   - Generates 3 variants (Open Flow, Private, Efficient)
   - Scores on adjacency (40%), natural light (25%), circulation (20%), efficiency (15%)
   - Produces decent conceptual layouts for kitchen/bath/addition

2. **Code Compliance Basics**
   - Checks egress windows (bedrooms)
   - Validates door swing clearances (3ft minimum)
   - Enforces hallway minimums (36" minimum)
   - Validates ADA accessible routes

3. **Photo-to-Dimension Analysis**
   - Extracts room sizes from uploaded photos
   - AI-labels room types and dimensions
   - Applies 0.82–1.25x scale hints for size validation

4. **Reasonably Fast**
   - Layout generation: <150ms for typical 6-10 room plan
   - Suitable for real-time UI (3 variants, A/B/C comparison)

### What It Lacks ❌

1. **No Wall Intelligence**
   - Only room bounding boxes, no actual wall geometry
   - No wall thickness (0" wall assumption)
   - No interior/exterior wall distinction
   - Can't distinguish load-bearing vs. partition walls

2. **No Architectural Elements**
   - No door symbols (swing direction, frame width)
   - No window symbols or specs
   - No plumbing fixtures (sinks, toilets)
   - No electrical outlet placement
   - No HVAC/ductwork paths

3. **No Dimension Logic**
   - Dimensions manually placed in SVG
   - Not linked to actual geometry
   - No automatic dimension generation
   - Can't update if room size changes

4. **No CAD Standards**
   - Single SVG layer (no layer structure)
   - No AIA CAD layer naming convention
   - No line type control (solid, dashed, centerline)
   - No block/component reusability

5. **No MEP Coordination**
   - Doesn't route electrical circuits
   - Doesn't path plumbing (drain/vent stacks)
   - Doesn't plan HVAC/ductwork
   - No mechanical device sizing

6. **Limited to Residential Rectilinear**
   - Assumes orthogonal layouts (90° angles)
   - Poor performance with angled/curved walls
   - Commercial floor plates not well supported

7. **Export Quality Poor**
   - DXF R12 format (1992 standard, limited)
   - No nested blocks or components
   - No intelligent object properties
   - Can't open in Revit or ArchiCAD

### Performance Metrics

**Current Engine (render-svg-floorplan.ts):**
```typescript
- Input: RoomNode[] with x, y, width, height
- Output: SVG (text/xml)
- Time: <150ms
- Precision: 1ft grid (12 inches)
- Variants: 3 (A/B/C)
- Max rooms: ~20 (practical limit)
```

**Comparison to Professional CAD:**
```typescript
- Input: Full dimensional program + constraints
- Output: DWG/RVT (intelligent model)
- Time: 2-8 hours (manual), 30-60min (semi-automated)
- Precision: 0.01ft (1/8 inch)
- Details: 500+ line items (walls, doors, fixtures, dims, notes)
- Compliance: Full code + accessibility validation
```

---

## Proposed AutoCAD-Level Engine Architecture

### Core Components

**1. Geometric Kernel (Wall & Space Model)**
```typescript
// Replace: room-only model → geometric wall representation
interface Wall {
  id: string
  type: 'exterior' | 'interior' | 'partition'
  thickness: number              // 4.5" (2x4), 6" (2x6), 8" (CMU), etc.
  startPoint: { x: number, y: number }  // float, 0.01ft precision
  endPoint: { x: number, y: number }
  height?: number                // 8'-0" (96"), 9'-0" (108"), etc.
  fireRating?: string            // '1-hour', '2-hour'
  material?: string              // 'drywall', 'tile', 'plaster'
}

interface Space {
  id: string                     // Room or space identifier
  type: RoomType
  name: string
  boundingGeometry: Wall[]       // List of walls forming the space
  area: number                   // Sq ft (computed from walls)
  perimeter: number              // Linear feet (for cost estimation)
  doorLocations: Door[]
  windowLocations: Window[]
  fixtureLocations: Fixture[]
}
```

**2. Parametric Dimensioning**
```typescript
// Automatic dimension generation linked to geometry
interface Dimension {
  id: string
  type: 'linear' | 'angular' | 'radial' | 'area'
  fromElement: string            // Wall ID, door ID, etc.
  toElement: string
  value: number
  unit: 'ft' | 'in' | 'ft-in'
  position: { x: number, y: number }
  associative: true              // Updates if geometry changes
}
```

**3. Door & Window Library**
```typescript
// Standardized CAD symbols (architectural style)
interface DoorSymbol {
  id: string                     // 'D-001', 'D-002-pair', etc.
  type: 'single' | 'double' | 'sliding' | 'pocket' | 'bifold' | 'accordion'
  width: number                  // Standard: 30", 32", 36", 42"
  style: 'swing' | 'sliding' | 'pocket'
  frame: 'wood' | 'steel' | 'aluminum'
  fireRating?: string
  // Auto-generated properties:
  clearanceRequired: number      // 3ft (swing), 2ft (pocket), etc.
  swingAngle: 90 | 180           // Half or full swing
}

interface WindowSymbol {
  id: string                     // 'W-001', 'W-002-pair', etc.
  type: 'double-hung' | 'casement' | 'picture' | 'sliding' | 'awning'
  width: number                  // Common: 24", 36", 48", 60"
  height: number
  sillHeight: number             // 36" standard, 42" high occupancy
  glazing: 'single' | 'double' | 'triple'
  headHeight: number             // 96" standard, varies by door height
}
```

**4. Code Compliance Engine**
```typescript
// Comprehensive rule validator
interface CodeRule {
  code: 'IRC' | 'IBC' | 'ADA' | 'NFPA'
  section: string                // 'R307.2', '2010 ADA §303.3'
  rule: string                   // 'Bedroom egress window size minimum'
  check: (space: Space, context: BuildingContext) => Violation[]
}

// Examples:
- Bedroom: min 1 egress window 5.7 sq ft, sill height ≤44", min width 20"
- Kitchen: min 10 sq ft, work triangle 26-36 ft perimeter
- Bath: min 5 sq ft, clear floor space 30"× 48" or 60" diameter
- Hallway: min 36" width, max 25 ft travel distance to egress
- Commercial: min 150 sq ft ceiling height, emergency egress route every 250 ft
- ADA: 1 route ≤1:20 slope, 36" door width, 60" turnaround
```

**5. MEP Rough-In Planner**
```typescript
interface MEPPath {
  type: 'plumbing' | 'electrical' | 'hvac'
  fromFixture: Fixture          // Sink, toilet, appliance
  toRiser: { floor: number, location: { x, y } }
  preferredWallLocation: 'north' | 'south' | 'east' | 'west'
  drainRoute?: Point[]           // Gravity-flow routing for plumbing
  ventsRequired?: number          // Number of vent stacks
  circuitLoad?: number            // Amps (for electrical)
}

// Generates:
- Plumbing: Main stack location, drain slopes, vent routing
- Electrical: Panel location, circuit distribution, outlet placement
- HVAC: Ductwork paths, return air grilles, register locations
```

### Output Formats

**1. DWG Export (AutoCAD)**
- Nested blocks (walls, doors, windows as reusable blocks)
- Layer structure: A-WALL, A-DOOR, A-WIND, D-DIMS, etc. (AIA standard)
- Intelligent object properties (width, height, type as attributes)
- Annotation scale settings (1/4"=1' default)
- Title block & border (template-based)
- Color scheme (by element type)

**2. PDF (Shareable)**
- High-resolution (300 DPI)
- Dimension annotations readable
- Title block with project info
- North arrow & scale bar
- Exterior walls bold (thicker line weight)

**3. Revit (BIM)**
- RVT export with family instances
- Level assignment
- View templates (floor plan, RCP, site)
- Schedules (door, window, finish)

---

## Implementation Roadmap: AutoCAD-Level Engine

### Phase 1: Core Geometry Engine (4 weeks, 2 engineers)

**Deliverables:**
- [ ] Geometric kernel (Wall, Space, Fixture models)
- [ ] Wall intersection logic (corners, T-junctions, L-walls)
- [ ] DXF R2000+ writer (nested blocks, layers, line types)
- [ ] Basic door/window library (20 common types)
- [ ] Test suite (100+ cases: right angles, angles, curved walls)

**Tech Stack:**
```typescript
// Geometry library
- Paper.js or Clipper2 for polygon operations
- Bezier.js for curved walls
- Raphaël or SVG for display

// CAD export
- Custom DXF writer (DWG requires proprietary API)
  OR
- OpenDWG API (license required, ~$2K/year)
  OR
- LibreCAD parser (open-source, may be slower)

// Performance
- Indexed spatial lookup (quadtree) for wall intersections
- Lazy evaluation of derived properties (area, perimeter)
```

**Estimated effort:** 300-400 hours

### Phase 2: Code Compliance & MEP Planning (3 weeks, 1-2 engineers)

**Deliverables:**
- [ ] IRC/IBC code rule engine
- [ ] ADA accessibility validator
- [ ] Plumbing & electrical rough-in suggester
- [ ] HVAC duct routing (basic)

**Estimated effort:** 200-300 hours

### Phase 3: Parametric Dimensioning (2 weeks, 1 engineer)

**Deliverables:**
- [ ] Auto-dimension generation
- [ ] Associative dimensions (linked to geometry)
- [ ] Dimension placement logic (avoid overlaps)
- [ ] Annotation style control

**Estimated effort:** 150-200 hours

### Phase 4: Professional Output & UI (2-3 weeks, 1-2 engineers)

**Deliverables:**
- [ ] DWG export with full intelligence
- [ ] PDF generation (300 DPI, print-ready)
- [ ] Revit export (BIM-compatible)
- [ ] UI for design input & review

**Estimated effort:** 200-300 hours

**Total: 12-16 weeks, 850-1200 hours (4-6 engineer-months)**

---

## Public GIS APIs for Jurisdiction Data

### Are They Publicly Accessible? ✅ **MOSTLY YES, WITH CAVEATS**

**Important:** Most are FREE but rate-limited. Some require registration.

---

### By Jurisdiction

#### 1. **DC (District of Columbia)**

| Data | Source | API | Access | Rate Limit | Cost |
|---|---|---|---|---|---|
| Parcel/property data | DCRA Property Records | DCRA Open Data | ✅ Public | 1000 req/hr | Free |
| Zoning | DCOZ Zoning Map | ArcGIS REST | ✅ Public | 6000 req/day | Free |
| Lot boundary | DCGIS GeoData | WMS/WFS | ✅ Public | Generous | Free |

**Direct URLs:**
```
GET https://opendata.dc.gov/api/3/action/package_search?q=property
GET https://maps.dcoz.dc.gov/dcgis/rest/services/Zoning/MapServer/0/query
GET https://dcgis.maps.arcgis.com/sharing/rest/content/items/...
```

#### 2. **Montgomery County, MD**

| Data | Source | API | Access | Rate Limit | Cost |
|---|---|---|---|---|---|
| Parcels/GIS | MCAtlas | Esri ArcGIS Server | ✅ Public | Standard | Free |
| Zoning districts | M-NCPPC | ArcGIS REST | ✅ Public | Standard | Free |
| Property records | SDAT (State) | Open Data Portal | ✅ Public | 1000 req/min | Free |

**Direct URLs:**
```
GET https://mcatlas.org/arcgis/rest/services/MC_Data/MapServer
GET https://apps.montgomerycountymd.gov/gis/api/v1/parcels
```

#### 3. **Prince George's County, MD**

| Data | Source | API | Access | Rate Limit | Cost |
|---|---|---|---|---|---|
| GIS data | PG County GIS | ArcGIS + WFS | ✅ Public | Standard | Free |
| Parcels | SDAT (via Maryland) | State Open Data | ✅ Public | 1000 req/min | Free |
| Zoning | PGCGIS Planning | ArcGIS REST | ✅ Public | Standard | Free |

**Direct URLs:**
```
GET https://pgcgis.mypgc.us/arcgis/rest/services/...
GET https://gis.msa.maryland.gov/arcgis/rest/services/OpenData/...
```

#### 4. **Fairfax County, VA**

| Data | Source | API | Access | Rate Limit | Cost |
|---|---|---|---|---|---|
| Parcel/GIS | Fairfax GIS | Esri ArcGIS | ✅ Public | Standard | Free |
| Zoning | Land Development | ArcGIS REST | ✅ Public | Standard | Free |
| Property tax | Fairfax Assessor | Open data | ⚠️ Partial | 100 req/min | Free |

**Direct URLs:**
```
GET https://gis.fairfaxcounty.gov/arcgis/rest/services/...
GET https://propertyasst.fairfaxcounty.gov/propertyassistant/
```

#### 5. **Arlington County, VA**

| Data | Source | API | Access | Rate Limit | Cost |
|---|---|---|---|---|---|
| GIS/parcels | Arlington GIS | Esri ArcGIS | ✅ Public | Standard | Free |
| Zoning | County Planning | WFS | ✅ Public | Standard | Free |
| Property records | Assessor | Web query | ⚠️ Limited | Manual lookup | Free |

**Direct URLs:**
```
GET https://gis.arlingtonva.us/arcgis/rest/services/...
GET https://gio.arlingtonva.us/arcgis/rest/services/...
```

#### 6. **Alexandria, VA**

| Data | Source | API | Access | Rate Limit | Cost |
|---|---|---|---|---|---|
| GIS data | Alexandria GIS | Esri ArcGIS | ✅ Public | Standard | Free |
| Zoning | Planning & Zoning | REST API | ✅ Public | Standard | Free |
| Parcels | City data portal | WMS/WFS | ✅ Public | Standard | Free |

#### 7. **Falls Church, VA**

| Data | Source | API | Access | Rate Limit | Cost |
|---|---|---|---|---|---|
| GIS | Falls Church GIS | Esri ArcGIS | ✅ Public | Standard | Free |
| Zoning | City Planning | Static maps | ⚠️ No API | Web only | Free |

---

### Production-Ready GIS Service Providers (Better than DIY API calls)

**These have normalized APIs across all jurisdictions:**

1. **SafeGraph (now Overture Maps)** ✅ **RECOMMENDED**
   - Parcel data nationwide
   - Zoning districts nationwide (partial coverage)
   - Free tier: 100K queries/month
   - API: REST + Batch
   - Cost: Free (tier 1) → $200-2000/mo (commercial)

2. **Precisely (Data.com)**
   - Property data + zoning
   - Coverage: All US jurisdictions
   - API: REST + SOAP
   - Cost: $500-5000/mo depending on volume

3. **Esri ArcGIS Online (Most Reliable)**
   - Nationwide coverage
   - Multiple layer types (parcels, zoning, floodplain, historic)
   - API: REST, WFS, WMS
   - Cost: Free tier (2M credits/month) → $100+/month (commercial)

4. **Open Street Map (OSM) + Nominatim**
   - Free parcel data (quality varies)
   - Geocoding included
   - API: Free
   - Cost: Free (community-run, rate-limited)

---

## Database Seeding Strategy

### What to Seed Now (High ROI, <1 week)

**Priority 1: Zoning Districts (per-address)**
```sql
INSERT INTO zoning_districts (jurisdiction, zone_code, name, allowed_uses, setback_front, setback_side, setback_rear, max_height, lot_min_sf) VALUES
('dc', 'RA-1', 'Residence - Low Density', ARRAY['single_family', 'townhouse'], 25, 5, 20, 35, 5000),
('dc', 'RF-1', 'Residence - Medium Density', ARRAY['single_family', 'townhouse', 'apartment'], 20, 5, 15, 45, 3000),
-- ... 100+ zoning codes across 7 jurisdictions
```

**Source:** GIS APIs above (Esri, SafeGraph)  
**Effort:** 2-3 days (script to fetch + validate)

**Priority 2: Parcel Boundaries**
```sql
INSERT INTO parcels (jurisdiction, pin, address, lot_sqft, owner, tax_value) VALUES
('dc', '0123+4567', '123 Main St, DC 20001', 5000, 'John Doe', 450000),
-- ...
```

**Source:** Parcel APIs (county assessor)  
**Effort:** 1 day (data load)

**Priority 3: Setback & Bulk Rules**
```sql
INSERT INTO bulk_requirements (jurisdiction, zone_code, min_lot_width, min_lot_depth, lot_coverage_max, floor_area_ratio_max) VALUES
('dc', 'RA-1', 50, 100, 0.6, 1.2),
-- ...
```

**Source:** Zoning code documents (scrape or manual)  
**Effort:** 3-5 days

### Implementation

**Option A: Programmatic (Recommended)**
```typescript
// Weekly automated sync from Esri/SafeGraph
async function seedZoningDistricts() {
  const jurisdictions = ['dc', 'montgomery_md', 'prince_georges_md', ...]
  
  for (const juris of jurisdictions) {
    const layers = await esriApi.query(`/gis/${juris}/zoning`, {
      outFields: '*',
      where: '1=1'
    })
    
    for (const feature of layers.features) {
      await db.zoning_districts.upsert({
        jurisdiction: juris,
        zone_code: feature.properties.ZONE,
        geometry: feature.geometry,
        allowed_uses: parseAllowedUses(feature.properties.description),
        setback_front: parseSetback(feature.properties, 'front'),
        // ...
      })
    }
  }
}
```

**Option B: Manual + CSV (Faster for launch)**
```
1. Download zoning shapefiles from county GIS portals
2. Convert to CSV: shp2csv-cli
3. Parse allowed uses + setbacks from code docs
4. Bulk import: psql COPY or Prisma createMany()
```

**Total effort for full seeding:** 1-2 weeks

---

## Recommendation: Build or Buy?

### Option A: Build AutoCAD-Level Engine In-House ✅ **RECOMMENDED**

**Pros:**
- Full control over quality, speed, output formats
- Can add Kealee-specific rules (e.g., cost-linked to drawing precision)
- DWG export with intelligence (needed for professional contractors)
- IP retention

**Cons:**
- 12-16 weeks development time
- Requires 1-2 senior engineers
- Ongoing maintenance (new DWG versions, MAC compatibility)

**Cost:** ~$300K-400K (4-6 eng-months)

**ROI:** Break-even at ~1000 projects (design engine sold separately = $99/project → 50K revenue)

### Option B: Use Third-Party Library

**Topologic (Open-source, MIT license)**
- Parametric design library
- Not specific to floor plans
- Requires heavy customization

**Cons:**
- Slow for real-time
- Limited CAD export

**Cost:** $0 + 8-12 weeks integration

### Option C: Integrate Existing CAD API

**LibreCAD C++ SDK or AutoCAD .NET SDK**
- Full CAD capability
- Massive learning curve
- Expensive (AutoCAD SDK licensing)

**Cost:** $5-10K/year + 10-15 weeks integration

**Recommendation: Build Option A** — it's faster, cheaper, and gives you IP control.

---

## Full Seeding Checklist

- [ ] **Jurisdictions** (7 DMV) — Already done ✅
- [ ] **Zoning Districts** (100+ codes) — START ASAP (2-3 days)
- [ ] **Parcel Boundaries** (DC: ~200K parcels) — Week 1 (1 day to load)
- [ ] **Bulk Requirements** (setback, height, coverage) — Week 1-2 (3-5 days)
- [ ] **Permit Fee Schedules** — Week 2 (manual scrape, 2-3 days)
- [ ] **Historic Districts** — Week 2 (1 day, ~500 districts in DMV)
- [ ] **Floodplain Data** (FEMA) — Week 3 (1 day, FEMA API)
- [ ] **Easements & Right-of-Ways** — Week 3 (FIDO data for VA, 2-3 days)

**Total seeding time:** 2-3 weeks (2 engineers)  
**Cost:** ~$15-20K

---

## Summary Comparison

| Aspect | Current Engine | New AutoCAD Engine |
|---|---|---|
| **Precision** | 1ft (concept) | 0.01ft (professional) |
| **Output format** | SVG → PDF | DWG + PDF |
| **Door/window symbols** | No | Yes (100+ library) |
| **Dimensions** | Manual | Automatic + associative |
| **Code compliance** | Basic (egress) | Full (IRC/IBC/ADA) |
| **MEP rough-in** | No | Yes (basic) |
| **Contractor-ready** | No | Yes |
| **Development time** | Done | 12-16 weeks |
| **Cost** | Already spent | $300-400K |
| **ROI** | Concept-only | Professional tier product |

---

**Next Steps:**

1. ✅ Approve AutoCAD engine build (12-16 weeks)
2. ✅ Allocate 2 engineers (senior + mid-level)
3. ✅ Start database seeding (zoning districts) in parallel (1-2 weeks)
4. Integrate GIS APIs (Esri, SafeGraph) for live data pulls
5. Export to DWG + PDF + Revit

**When ready to proceed, I can start Phase 1 (geometry kernel) immediately.**

