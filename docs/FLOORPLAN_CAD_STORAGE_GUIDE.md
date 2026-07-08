# Floor Plan & CAD Generation, Database Seeding, and Deliverables Storage

**Date:** July 8, 2026  
**Status:** Production Ready  

---

## 1. Floor Plan Generation Tool & Accuracy

### Tool Stack

**Primary Tool:** **Proprietary Concept Engine** (in-house)
- **Location:** `packages/concept-engine/src/floorplan/`
- **Language:** TypeScript
- **Architecture:** Rule-based layout generation + variant optimization

### How It Works

#### Step 1: Room Graph Construction
```typescript
// packages/concept-engine/src/floorplan/build-room-graph.ts
buildRoomGraph(intakeInput)
  → Extracts from intake form:
    - Project type (kitchen, bathroom, addition, whole-home, etc.)
    - Room sizes from photos/descriptions (AI-analyzed)
    - Room count and types
    - Adjacency preferences (kitchen-dining-living proximity)
    - Circulation requirements (hallway flow)
```

**Inputs analyzed:**
- Photo upload analysis (AI-tagged room dimensions)
- Voice note transcriptions (spatial descriptions)
- Capture zone data (spatial intelligence from photo/video)
- Form fields (sqft, room preferences, style)
- Room size hints (derived from images at 0.82 - 1.25x scale)

#### Step 2: Layout Variant Generation
```typescript
// packages/concept-engine/src/floorplan/build-layout-json.ts
buildLayoutVariants(graph, input, detailLevel)
  → Generates 3 layout alternatives (A, B, C):
    - Variant A: Open concept (flow-optimized)
    - Variant B: Balanced (adjacency + traditional)
    - Variant C: Formal (symmetrical, ceremonial spaces)
```

**Optimization factors (scored):**
- **Adjacency Score** (40%): Kitchen-dining-living proximity, wet spaces grouped
- **Natural Light Score** (25%): Window placement, perimeter rooms
- **Circulation Score** (20%): Hallway efficiency, traffic patterns
- **Space Efficiency** (15%): Wasted circulation, wall placement
- **Code Compliance** (hard constraint): Egress, accessible routes, door swings

#### Step 3: SVG Rendering (Concept-Only)
```typescript
// packages/concept-engine/src/floorplan/render-svg-floorplan.ts
renderSvgFloorplan(layout, detailLevel)
  → Outputs SVG XML based on tier:
```

| Detail Level | Tier | What's Included | Use Case |
|---|---|---|---|
| **schematic** | Basic (T1) | Coloured room boxes, concept labels, no dimensions | Concept preview in portal |
| **permit** | Premium (T2) | Walls, door swings, overall dims, north arrow, title block | Permit submittal prep |
| **permit-full** | Premium+ (T3) | All of above + window symbols, interior dims, plumbing, area schedule | Contractor handoff |

### Accuracy Validation

**How accuracy is ensured:**

1. **Photo Analysis Calibration**
   - AI-labeled room dimensions cross-checked against form inputs
   - Photo-to-measurement variance flagged if >15%
   - User can override with manual dimensions

2. **Code Compliance Checks**
   ```typescript
   // Hard-coded rules per project type
   kitchen: { minWidth: 8, minWorkTriangle: 26 }
   bathroom: { minClearance: 30 } // inches
   bedroom: { minArea: 70 } // sqft, egress window required
   hallway: { minWidth: 36 } // inches
   ```

3. **Variant Scoring**
   - All 3 variants scored on same criteria
   - Recommended variant is highest-scoring
   - User can manually select alternative
   - Variance in score provides confidence metric

4. **Dimensional Consistency**
   - SVG generated at fixed scale (1/4" = 1' default)
   - All dimensions calculated from coordinate system
   - No manual placement = no drift

5. **Architect Review (Premium+ Tier)**
   - Exports to CAD for professional review
   - Contractor feedback loop available via portal
   - Revisions tracked in version history

### Limitations (Disclosed to Users)

- **Not survey-accurate:** Concept layout only, not field-verified
- **Based on photos:** Accuracy depends on photo quality and coverage
- **AI-labeled dimensions:** Not professionally measured
- **2D only:** No 3D/volume validation at Tier 1-2
- **Concept baseline:** Refinement required for construction documents

**Disclaimer in all tier packages:**
> "Concept layout only — not survey-grade or permit-stamped. Import into professional CAD for refinement."

---

## 2. CAD Generation: Same Tool or Different?

### Answer: **Different Tools**

| Deliverable | Tool | Format | Tier | Use |
|---|---|---|---|---|
| **Floor Plan** | Concept Engine (SVG → PDF) | SVG or PDF | 1, 2, 3 | Portal view, sharing |
| **CAD Export** | CAD Export Module (custom DXF) | DXF R12 | 2, 3 only | AutoCAD, SketchUp import |

### CAD Export Details

**Location:** `packages/kealee-agent-stack/src/v30/cad-export.ts`

**Technology:**
- **Format:** DXF R12 (AutoCAD 1992 format - universal compatibility)
- **Generation:** Programmatic ASCII DXF generation (no external libraries)
- **Content:** Walls, site edges, room polylines, site features

**Export Includes:**

```typescript
interface V30CadExportInput {
  floorplan: {
    id: string
    walls: V30CadWallSegment[]    // Wall segments with coordinates
    rooms: Array<{                // Room boxes
      id, label, x, y, width, height
    }>
    siteFeatures: Array<{         // Lot boundary, driveway, etc.
      type, label, polygon: [{ x, y }]
    }>
  }
  projectPath: string
  lotContext: { lat, lng, address }
}
```

**Output:**
```dxf
0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
KEALEE_LAYOUT
70
0
62
7
6
CONTINUOUS
...
[LINE entities for walls and site features]
...
0
ENDSEC
0
EOF
```

### Compatible CAD Software

✅ AutoCAD (Windows, Mac, Web)  
✅ SketchUp (import + georeferencing)  
✅ Vectorworks  
✅ BricsCAD  
✅ LibreCAD  
✅ GIS tools (via GeoJSON + DXF bundle)  

### CAD + GIS Bundle

Premium+ includes **JSON bundle** with:
- DXF geometry (walls, rooms, site)
- GeoJSON with project lat/lng
- Coordinates for GIS integration
- Disclaimer & compatible apps list
- Filename: `{projectId}-layout.dxf`

### Accuracy of CAD vs. Floor Plan

| Aspect | Floor Plan (SVG) | CAD (DXF) |
|--------|---|---|
| **Accuracy** | Concept (1/4" scale) | Same as source SVG |
| **Precision** | Floating-point pixels | Decimal feet/inches |
| **Use** | Visualization | Contractor refinement |
| **Edition** | Same in all tiers | Premium+ only |
| **Import path** | PDF download | DXF download + software import |

**Important:** CAD export is **not** stamped or permit-ready. It's a starting point for contractor refinement and professional CAD development.

---

## 3. Database Seeding: Permit & Zoning Data Coverage

### Current Coverage: **7 Jurisdictions (DMV Region Only)**

**Locations:** `packages/seeds/src/jurisdictions/dmv.jurisdictions.seed.ts`

### Jurisdictions Seeded (Verified 2026-03-24)

| Jurisdiction | Code | Portal | Zoning Map | Parcel Lookup | Status |
|---|---|---|---|---|---|
| **DC** | `dc` | permitsdc.dc.gov | maps.dcoz.dc.gov | scout.dcra.dc.gov | ✅ Active |
| **Montgomery Co., MD** | `montgomery_md` | permittingservices.montgomerycountymd.gov | montgomerplanning.org | mcatlas.org | ✅ Active |
| **Prince George's Co., MD** | `prince_georges_md` | dpie.mypgc.us | pgcgis.mypgc.us | pgcgis.mypgc.us | ✅ Active |
| **Fairfax Co., VA** | `fairfax_va` | permit.fairfaxcounty.gov | gis.fairfaxcounty.gov | gis.fairfaxcounty.gov | ✅ Active |
| **Arlington Co., VA** | `arlington_va` | permit.arlingtonva.us | gis.arlingtonva.us | gis.arlingtonva.us | ✅ Active |
| **Alexandria, VA** | `alexandria_va` | alexandria.gov/permits | alexandria.gov/zoning | gis.alexandriava.gov | ✅ Active |
| **Falls Church, VA** | `falls_church_va` | fallschurchva.gov | fallschurchva.gov/zoning | gis.fallschurchva.gov | ✅ Active |

### What's Seeded Per Jurisdiction

**Permit Authority Info:**
```typescript
interface JurisdictionSeed {
  code: string                        // dc, montgomery_md, etc.
  name: string                        // "District of Columbia"
  state: string                       // "DC", "MD", "VA"
  permitAuthority: string             // "DC Department of Buildings (DOB)"
  zoningAuthority: string             // "DC Office of Zoning (DCOZ)"
  permitPortalUrl: string             // https://permitsdc.dc.gov
  zoningMapUrl: string                // https://maps.dcoz.dc.gov/zr16/
  propertyLookupUrl: string           // https://scout.dcra.dc.gov/
  supportedProjectTypes: string[]     // ["renovation", "addition", ...]
  commonPermitTypes: string[]         // ["building", "trade", ...]
  commonRiskFlags: string[]           // ["historic_review_possible", ...]
  requiredIntakeFields: string[]      // ["address", "scopeSummary"]
  reviewModel: string                 // "mixed" (some fast-track, some full review)
  notesForKeaCore: string[]           // Implementation guidance
}
```

**Example: DC Seeded Data**
```
Name: District of Columbia
Permit Portal: DC Self Service Portal (Accela) at permitsdc.dc.gov
Plan Upload: ProjectDox (eplans.dc.gov)
Zoning Map: https://maps.dcoz.dc.gov/zr16/
Property Lookup: Scout (scout.dcra.dc.gov)
Inspection: permitsdc.dc.gov

Common Permits: building, trade, demolition, COO, revision
Risk Flags: historic_review_possible, zoning_relief_possible, occupancy_change_check
Review Timeline: 30-90+ days for new construction, faster for OTC
```

### What's NOT Seeded

❌ **County/city zoning districts** (per-address zoning codes)  
❌ **Parcel boundaries** (lot lines, tax assessment)  
❌ **Historic district data** (per-address flags)  
❌ **HOA information** (community association details)  
❌ **Setback/bulk requirements** (detailed zoning specs)  
❌ **Fee schedules** (exact permit costs)  
❌ **Inspection appointment data** (real-time availability)  

### How Zoning/Permit Data is Retrieved at Runtime

**When a user submits intake for address "123 Main St, DC":**

```typescript
// 1. Identify jurisdiction from address
jurisdiction = getJurisdictionFromZipCode("20001") → "dc"

// 2. Look up seeded jurisdiction data
jurisdictionData = seeds.find(j => j.code === "dc")

// 3. Populate permit fields
permitBot.execute({
  likelyPermits: jurisdictionData.commonPermitTypes,
  estimatedTimeline: "4-8 weeks", // per DC data
  permitPortalUrl: jurisdictionData.permitPortalUrl,
  riskFlags: assessRiskFlags(input, jurisdictionData.commonRiskFlags)
})

// 4. For deeper zoning analysis, call external API:
// (Future: integrate zoning APIs like SafeGraph, Precisely, or Esri)
```

### Data Freshness

**Last verified:** March 24, 2026  
**Maintenance plan:**
- Annual verification of permit portal URLs
- Quarterly check of permit types and timelines
- Ad-hoc updates when agencies rebrand

**To update:**
```bash
# Edit jurisdiction seed
vim packages/seeds/src/jurisdictions/dmv.jurisdictions.seed.ts

# Re-seed database
pnpm run seed:jurisdictions
```

### Future Expansion

**To add more jurisdictions:**

1. Add seed entry to `dmv.jurisdictions.seed.ts`
2. Verify permit portal, zoning map, property lookup URLs
3. Document common permit types and risk flags
4. Run `pnpm run seed:jurisdictions`

**To add detailed zoning/parcel data:**

1. Integrate with GIS API (e.g., Esri ArcGIS)
2. Add parcel lookup service
3. Cache zoning codes for common addresses
4. Implement setback/bulk requirement checker

---

## 4. Where Generated Packages & Deliverables Are Stored

### Storage Architecture

```
User submits intake
    ↓
DesignBot generates floorplan + renderings
    ↓
EstimateBot generates BOM + cost
    ↓
PermitBot generates permit guidance
    ↓
Uploader converts to PDF/video/CAD
    ↓
Upload to Supabase Storage (S3-compatible)
    ↓
URLs stored in database (ProjectOutput table)
    ↓
Portal fetches from CDN + serves to homeowner
```

### Database Tables

**Primary table: `ProjectOutput`**
```typescript
{
  id: string,
  projectId: string,
  botType: "design" | "estimate" | "permit",
  outputType: "render" | "video" | "floorplan" | "pdf" | "cad" | "bom",
  storageUrl: string,  // CDN URL or signed S3 URL
  metadata: {
    filename: string,
    mimeType: string,
    sizeBytes: number,
    resolution?: string,
    duration?: number
  },
  createdAt: timestamp,
  expiresAt: timestamp  // For temporary files (videos pending processing)
}
```

**Secondary table: `ConceptPackage`**
```typescript
{
  id: string,
  projectId: string,
  tier: 1 | 2 | 3,
  packageJson: {  // Serialized HomeownerDeliverables
    visuals: { 
      renders: [ URL, URL, URL ],  // Links to ProjectOutput
      video?: URL,                 // Link to ProjectOutput
      svgUrl?: URL                 // Embedded SVG or S3 URL
    },
    permit: { /* guidance */ },
    cost: { /* BOM */ },
    zoning: { /* analysis */ },
    floorPlan: { svgUrl?: string, cadUrl?: string },
    pdfs: [ URL ]  // PDF report(s)
  },
  createdAt: timestamp
}
```

### Storage Locations by File Type

| Deliverable | Tool | Storage | Access | Expiry | Tier |
|---|---|---|---|---|---|
| **Renderings** | Replicate AI | Supabase Storage (S3) | CDN (signed URL) | Never | 1,2,3 |
| **Floor Plan SVG** | Concept Engine | Database JSONB OR S3 | Direct or CDN | Never | 1,2,3 |
| **Floor Plan PDF** | SVG → Sharp | Supabase Storage | CDN | 90 days | 1,2,3 |
| **CAD (DXF)** | CAD Export | Supabase Storage | Download (signed URL) | 30 days | 2,3 |
| **BOM (XLSX)** | EstimateBot | Supabase Storage | Download (signed URL) | Never | 1,2,3 |
| **Video (MP4)** | Runway AI or Replicate | Supabase Storage OR CDN | Stream + Download | 7 days (temp), Forever (final) | 2,3 |
| **PDF Report** | Puppeteer + Sharp | Supabase Storage | Download + share link | 90 days | 1,2,3 |

### Access Flow in Portal

**Portal-owner app flow:**

```typescript
// apps/portal-owner/app/deliverables/page.tsx

1. User navigates to portal dashboard
2. App fetches ConceptPackage by projectId
3. For each deliverable in packageJson:
   - Renders thumbnail (local image resize)
   - Provides download link (signed S3 URL)
   - Shows metadata (resolution, size, created date)
4. User can download or share:
   - PDF report
   - Individual renderings
   - Floor plan SVG or DXF
   - Video (streaming or download)
   - BOM spreadsheet
```

**URL example:**
```
GET /api/projects/{projectId}/deliverables
  → Returns:
  {
    renders: [
      { 
        url: "https://cdn.supabase.com/storage/.../render-01.jpg",
        format: "JPEG",
        resolution: "2560×1440",
        label: "Kitchen - Design Concept"
      },
      ...
    ],
    floorPlan: {
      svgUrl: "https://cdn.supabase.com/.../floorplan.svg",
      pdfUrl: "https://cdn.supabase.com/.../floorplan.pdf",
      cadUrl: "https://cdn.supabase.com/.../layout.dxf" (Premium+ only)
    },
    video: {
      url: "https://cdn.supabase.com/video/...",
      duration: 60,
      formats: {
        "60s": url,
        "30s": url,
        "15s": url,
        "10s": url
      } // Premium+ only
    },
    ...
  }
```

### Deliverables by Tier at Delivery Time

**When concept package is "Ready":**

**Tier 1 (Basic - $199):**
- ✅ 3 renderings (JPG, 1920×1080)
- ✅ Floor plan (SVG + PDF)
- ✅ BOM (XLSX read-only)
- ✅ Permit scope brief (PDF)
- ✅ Zoning snapshot (PDF)
- ✅ Design report (PDF)
- ✅ Portal access (lifetime)
- 📁 Storage: ~45 MB

**Tier 2 (Premium - $499):**
- ✅ 5 renderings (JPG, 2560×1440)
- ✅ Floor plan (SVG + PDF, to-scale)
- ✅ BOM (XLSX editable)
- ✅ Video (MP4, 1 format, 60s, 1920×1080)
- ✅ Permit-ready scope pack (PDF)
- ✅ Zoning deep-dive (PDF)
- ✅ Design report (PDF)
- ✅ Portal access (lifetime)
- 📁 Storage: ~85 MB

**Tier 3 (Premium+ - $899):**
- ✅ 8 renderings (JPG, 4K UHD)
- ✅ Floor plan (SVG + PDF, to-scale)
- ✅ CAD (DXF + DWG)
- ✅ BOM (XLSX editable, premium)
- ✅ Video (MP4, 4 formats: 60s/30s/15s/10s, 4K)
- ✅ Full permit guidance (PDF)
- ✅ Zoning deep-dive + entitlements (PDF)
- ✅ Design report (PDF)
- ✅ Portal access (lifetime)
- 📁 Storage: ~250 MB

### Live Example Locations

**Portal URLs (after concept delivery):**
```
https://portal-owner.kealee.com/projects/{projectId}/deliverables
https://portal-owner.kealee.com/concepts/{conceptId}/download
```

**API Endpoints:**
```
GET /api/projects/{projectId}/deliverables      → Full package metadata
GET /api/projects/{projectId}/concept-pdf       → PDF download (303 redirect to S3)
GET /api/projects/{projectId}/renders           → All renderings with URLs
GET /api/projects/{projectId}/cad               → CAD files (Premium+ only)
```

**Share Links (homeowner can send to contractors):**
```
https://portal-owner.kealee.com/share/{shareToken}
  → Time-limited access (default 30 days)
  → Read-only view of renderings + floorplan
  → No edit/delete permissions
```

### Retention Policy

| File Type | Retention | Reason |
|---|---|---|
| Renderings | Forever (Tier 1-3) | Legal/portfolio, homeowner archive |
| Floor plans (SVG/PDF) | Forever (Tier 1-3) | Construction reference |
| CAD files (DXF) | 30 days default, renewable | Contractor handoff, reduces storage |
| Videos | Forever (final upload) | Marketing, homeowner shares |
| Temp files (processing) | 7 days | Clean up intermediate renders |
| Share links | 30 days default | Revocable, owner can extend |

### Bandwidth & CDN Strategy

**Using:** Supabase Storage (built on AWS S3)
- ✅ Auto-serves via Cloudflare CDN
- ✅ Signed URLs (secure, time-limited)
- ✅ Direct S3 bandwidth for API, CDN for portal views
- ✅ Compression enabled (WebP variants for images)

**Expected monthly costs at 500/day volume:**
- Renderings: ~250 GB/mo (3-8 per project × 500) → ~$12/mo S3
- Videos: ~150 GB/mo (1-4 formats, 60-120s each) → ~$7/mo
- PDFs/CAD: ~30 GB/mo → ~$1.50/mo
- **Total:** ~$20/mo storage + $30/mo CDN bandwidth

---

## Summary

| Question | Answer |
|---|---|
| **Floor plan tool?** | Proprietary Concept Engine (TypeScript, rule-based) |
| **Accuracy?** | Concept-level (1/4" scale), AI-validated dimensions, not survey-accurate |
| **CAD generation?** | Different tool (DXF R12 export from CAD Export module), Premium+ only |
| **Database seeded?** | 7 DMV jurisdictions (DC, Montgomery, PG, Fairfax, Arlington, Alexandria, Falls Church), verified March 2026 |
| **Detailed zoning data?** | NOT seeded (URLs + permit types only); deep zoning lookup requires external GIS API |
| **Permit data seeded?** | Portal URLs, common permit types, risk flags, timelines — all seeded; fee schedules NOT included |
| **Where delivered?** | Supabase Storage (S3) → CDN → Portal dashboard + shareable links |
| **Access?** | Portal (portal-owner.kealee.com), API (/api/projects/.../deliverables), Downloads via signed S3 URLs |
| **Live now?** | ✅ Yes, all 3 tiers generating and delivering |

---

**Next Steps:**

1. **Expand jurisdiction coverage** → Add more states (NY, CA, TX, etc.)
2. **Integrate zoning APIs** → SafeGraph, Precisely, or Esri for parcel data
3. **Automate accuracy checks** → Compare AI-measured dimensions vs. parcel records
4. **CAD refinement workflow** → Contractor feedback loop integrated with Portal
5. **Storage optimization** → Archive old renders to Glacier, keep recent in hot storage

---

**Maintained by:** Kealee Engineering  
**Last verified:** July 8, 2026  
