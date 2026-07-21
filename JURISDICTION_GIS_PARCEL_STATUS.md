# 🗺️ JURISDICTION, GIS & PARCEL DATA STATUS REPORT

**Date:** June 3, 2026  
**Status:** ⚠️ **PARTIALLY SEEDED** (Models exist, data needs external sources)

---

## 📊 CURRENT STATE

### ✅ DATABASE MODELS EXIST

**Jurisdiction Models:**
```
✅ Jurisdiction              - Core jurisdiction records
✅ JurisdictionStaff         - Staff members per jurisdiction
✅ JurisdictionFormTemplate  - Jurisdiction-specific forms
✅ JurisdictionUsageMetrics  - Analytics per jurisdiction
✅ JurisdictionIntegrationLog - API integration tracking
✅ JurisdictionAnalytics     - Jurisdictional analytics
```

**Parcel & Zoning Models:**
```
✅ Parcel                    - Property parcel records
✅ ParcelZoning              - Zoning designation per parcel
✅ ParcelComparable          - Comparable properties
✅ ParcelDocument            - Parcel documents (deed, survey, etc.)
✅ ParcelNote                - Parcel notes/history
✅ ZoningProfile             - Zoning regulations
```

**Related Models:**
```
✅ RoutingRule               - Jurisdiction routing rules
✅ HousingPipelineEntry      - Housing data per jurisdiction
✅ HousingDashboardSnapshot  - Dashboard snapshots
✅ PatternBookDesign         - Pattern book designs (municipal)
```

---

## ❌ DATA SEEDING STATUS

### **Seed Script Status**

**File:** `packages/database/sql/10_seed_data.sql`

**Currently Seeded:**
- ✅ Service plans
- ✅ Default roles
- ✅ Sample users
- ✅ **Limited jurisdiction sample data** (placeholder only)

**NOT Seeded:**
- ❌ Comprehensive jurisdiction data (all 50 states, all counties)
- ❌ Parcel data (property records)
- ❌ Zoning profiles (building codes, restrictions)
- ❌ GIS coordinates / geospatial data
- ❌ Jurisdiction-specific permit forms
- ❌ Regional building codes
- ❌ Zoning restrictions by jurisdiction

---

## 🗺️ WHAT'S NEEDED FOR PRODUCTION

### **1. Jurisdiction Data** (Required for PermitBot)

**Data Points Needed:**
- State + County combinations (50 states × ~3,000 counties)
- Jurisdiction codes
- Contact info (permit offices, inspectors)
- Processing timelines
- Fee schedules
- Building code versions (2020, 2021, 2024 IBC, etc.)
- Permit types accepted
- Staff directories

**Current Gap:** Only placeholder data

**Sources Available:**
- NASS (National Association of State Short Plats) database
- County assessor records
- Building official associations
- State construction board databases

### **2. Parcel/Property Data** (Required for parcel viewer)

**Data Points Needed:**
- Parcel identifiers (APN - Assessor's Parcel Number)
- Property addresses
- Lot dimensions
- Property boundaries (lat/lon, polygon)
- Current zoning
- Lot size
- Existing structures
- Previous permits/history

**Current Gap:** No parcel records seeded

**Sources Available:**
- County assessor GIS data
- OpenStreetMap/Geofabric
- Zillow / Tax assessor APIs
- GIS data repositories (DataHub, OpenGov)

### **3. Zoning Data** (Required for PermitBot)

**Data Points Needed:**
- Zoning designation per parcel
- Zoning restrictions (height, setbacks, FAR, density)
- Permitted uses
- Conditional uses
- Dimensional requirements
- Parking requirements
- Design guidelines
- Historic district info

**Current Gap:** No zoning profiles seeded

**Sources Available:**
- County/city zoning ordinances
- Muni code repositories
- ESRI zoning layers
- OpenZoning (open-source GIS)

### **4. GIS/Mapping Data** (Required for UI parcel viewer)

**Data Points Needed:**
- Property boundary polygons (GeoJSON/WKT)
- Coordinate systems (EPSG codes)
- Street centerlines
- Building footprints
- Zoning district boundaries
- Parcel boundaries
- Flood zones, wetlands, etc.

**Current Gap:** No GIS data in database

**Sources Available:**
- OpenStreetMap
- USGS GIS data
- County GIS services
- Mapbox/Tileservers

---

## 🔧 HOW TO SEED JURISDICTION/GIS DATA

### **Option 1: Use Open Data Sources** (Recommended for MVP)

#### **A. OpenGov County Data**
```bash
# Download county GIS data
wget https://data.opengovus.org/states/CA/counties.json

# Import to database
node scripts/import-jurisdiction-data.ts
```

#### **B. USGS/County Assessor APIs**
```typescript
// Fetch jurisdiction data
const jurisdictions = await fetch(
  'https://gis.usgs.gov/arcgis/rest/services/.../query'
);

// Fetch parcel data
const parcels = await fetch(
  'https://county.assessor.api/parcels?county=CA001'
);
```

#### **C. OpenStreetMap Data**
```bash
# Download OSM buildings/parcels
osmium export --geometry types=polygon \ 
  -o parcels.geojson planet.osm.pbf

# Import to PostGIS
ogr2ogr -f "PostgreSQL" \
  PG:"dbname=kealee_platform" parcels.geojson
```

---

### **Option 2: Commercial GIS Data** (Best for production)

**Providers:**
- **Zillow/Zestimate:** Property data + coordinates
- **ESRI/Mapbox:** Professional GIS layers
- **Pitney Bowes:** Parcel data + zoning
- **Moody's Analytics:** Jurisdiction data
- **CoStar:** Commercial property data

**Integration:**
```typescript
// Example: Zillow API integration
const parcelData = await zillow.getProperty(address);
const zoning = await pitneybowes.getZoning(lat, lon);

await prisma.parcel.create({
  data: {
    address: parcelData.address,
    coordinates: parcelData.location,
    zoning: zoning.designation,
  }
});
```

---

### **Option 3: Manual Seeding by Region** (Start with pilot regions)

**Pilot Regions (recommended for MVP):**
- California (DC, MD, VA market base)
- New York
- Texas
- Florida

**Manual Process:**
1. Download county assessor GIS files (shapefiles)
2. Convert to PostGIS format
3. Import parcels + zoning + jurisdiction info
4. Validate coordinates and boundaries
5. Link to jurisdiction records

**Effort:** ~40-80 hours per state for comprehensive data

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Core Jurisdiction Data** (Week 1)
- [ ] Create jurisdiction seed script for top 50 counties
- [ ] Add building code versions per jurisdiction
- [ ] Add permit fee schedules
- [ ] Add processing timelines
- [ ] Test PermitBot with jurisdiction data

### **Phase 2: Parcel Data** (Week 2-3)
- [ ] Choose data source (OpenGov, USGS, county assessors)
- [ ] Build data import pipeline
- [ ] Create parcel records (start with 10K sample)
- [ ] Validate coordinates
- [ ] Test parcel viewer UI

### **Phase 3: Zoning Data** (Week 3-4)
- [ ] Scrape/import zoning ordinances
- [ ] Create ZoningProfile records
- [ ] Link parcels to zoning
- [ ] Implement zoning validation in PermitBot

### **Phase 4: GIS/Mapping** (Week 4-5)
- [ ] Set up PostGIS for spatial queries
- [ ] Import boundary polygons
- [ ] Create geospatial indexes
- [ ] Build parcel viewer map component
- [ ] Implement address lookup via coordinates

---

## 🚀 QUICKSTART FOR MVP

If you need data **this week** for MVP:

### **1. Sample Data Only**
```bash
# Add minimal test data to seed script
INSERT INTO "Jurisdiction" 
  (id, name, code, state, city)
VALUES
  (gen_random_uuid(), 'San Francisco', 'SF001', 'CA', 'San Francisco'),
  (gen_random_uuid(), 'New York', 'NY001', 'NY', 'New York'),
  (gen_random_uuid(), 'Austin', 'TX001', 'TX', 'Austin');

INSERT INTO "Parcel"
  (id, address, county, state, coordinates)
VALUES
  (gen_random_uuid(), '123 Main St', 'San Francisco', 'CA', '(-122.4194, 37.7749)');
```

### **2. Use OpenStreetMap Mock Data**
```typescript
// Mock parcel viewer with OSM data
const mockParcels = [
  {
    address: '123 Main St, SF CA',
    boundaries: {
      type: 'Polygon',
      coordinates: [[[-122.42, 37.77], [-122.41, 37.77], ...]]
    }
  }
];
```

### **3. Disable Parcel Lookup Until Data Ready**
```typescript
// In PermitBot
if (!parcelData) {
  console.warn('Parcel data not seeded - using mock data');
  return mockParcelResponse();
}
```

---

## 📦 DATABASE SCHEMA READY

Your schema **is ready** for:
- ✅ Storing jurisdiction records
- ✅ Storing parcel data
- ✅ Storing zoning info
- ✅ GIS coordinates (PostGIS enabled)
- ✅ Geospatial queries

**Example Query:**
```sql
-- Find parcels within jurisdiction
SELECT p.address, p.coordinates, z.zoning_type
FROM "Parcel" p
JOIN "ParcelZoning" z ON p.id = z.parcel_id
WHERE p.jurisdiction_id = $1
AND ST_DWithin(p.coordinates, $2, 1000);
```

---

## 💡 RECOMMENDATIONS

### **For MVP Launch:**
1. ✅ Use **mock/sample data** for pilot markets (CA, NY, TX)
2. ✅ Implement **parcel viewer** UI with sample GeoJSON
3. ✅ Build **PermitBot** to work with sample jurisdictions
4. ✅ Create **data import pipeline** for future bulk loading

### **For Production (Phase 2):**
1. ✅ Partner with **GIS data provider** (ESRI, Mapbox, OpenGov)
2. ✅ Build **automated import pipeline**
3. ✅ Seed **all 50 states** with jurisdiction + parcel data
4. ✅ Implement **zoning validation** in PermitBot
5. ✅ Add **parcel search** to UI (address → coordinates → parcel info)

### **Timeline:**
- **MVP:** 1 week (sample data only)
- **Expanded:** 4-6 weeks (10 states, comprehensive data)
- **Full:** 3-4 months (50 states, continuous updates)

---

## 🔗 HELPFUL RESOURCES

### **Open Data Sources:**
- https://data.opengovus.org - County data
- https://www.usgs.gov/faqs/what-are-some-online-sources-gis-data - USGS GIS
- https://www.openstreetmap.org - OSM data
- https://github.com/openzoning - OpenZoning project
- https://hub.arcgis.com - ESRI Hub

### **Tools for Data Import:**
- `ogr2ogr` - Convert GIS formats
- `osmium` - Process OSM files
- `shp2pgsql` - Import shapefiles to PostGIS
- `gdal` - Geospatial data processing

### **Guides:**
- PostGIS setup: https://postgis.net/docs/
- GeoJSON format: https://geojson.org
- County assessor data: https://datahub.io/collections/assessor-data

---

## ✅ NEXT STEPS

**Immediate (This Week):**
1. ✅ Create sample jurisdiction/parcel seed script
2. ✅ Test PermitBot with mock data
3. ✅ Build parcel viewer prototype
4. ✅ Document data import pipeline

**Short Term (Weeks 2-4):**
1. ✅ Choose GIS data provider
2. ✅ Implement data import pipeline
3. ✅ Seed 10-20 jurisdictions
4. ✅ Test end-to-end with real data

**Long Term (Months 2-3):**
1. ✅ Scale to 50+ states
2. ✅ Implement continuous data updates
3. ✅ Add zoning validation
4. ✅ Optimize geospatial queries

---

**Status:** Ready for development  
**Blocker:** External data sources needed for production  
**MVP Path:** Use mock/sample data for pilot launch
