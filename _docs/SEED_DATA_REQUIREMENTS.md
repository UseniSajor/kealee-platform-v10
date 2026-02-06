# Seed Data Requirements - Kealee Platform v10

**Last Updated:** February 6, 2026
**Purpose:** Comprehensive list of all seed/reference data needed per app for full functionality

---

## 1. PLATFORM CONFIGURATION (Required Before Launch)

### Roles & Permissions
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `Role` | Platform-defined | 6 roles: ADMIN, PM, CLIENT, CONTRACTOR, ARCHITECT, ENGINEER | Critical |
| `Permission` | Platform-defined | ~50 permissions (CRUD per resource) | Critical |
| `RolePermission` | Platform-defined | Role-permission mappings | Critical |

### Service Plans & Pricing (from SOP v2)
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `ServicePlan` | SOP v2 pricing | 4 PM packages (A=$1,750, B=$3,750, C=$9,500, D=$16,500/mo) | Critical |
| `ServicePlan` | SOP v2 pricing | 4 Permit packages (A=$495, B=$1,295, C=$2,995, D=$7,500/mo) | Critical |
| `PlatformFeeConfig` | SOP v2 fees | Platform fee configs (3% standard, 0% Package C/D, 1% escrow) | Critical |
| `MarketplaceFeeConfig` | SOP v2 fees | Marketplace fee tiers and lead distribution rules | Critical |
| `ALaCarteService` | SOP v2 pricing | 7+ services ($195-$995 each) | High |

### Stripe Products (Must Match ServicePlan Records)
| Stripe Product | Price ID Pattern | Amount |
|----------------|-----------------|--------|
| PM Package A | price_package_a_monthly | $1,750/mo |
| PM Package B | price_package_b_monthly | $3,750/mo |
| PM Package C | price_package_c_monthly | $9,500/mo |
| PM Package D | price_package_d_monthly | $16,500/mo |
| Permit Package A | price_permit_a | $495 one-time |
| Permit Package B | price_permit_b | $1,295 one-time |
| Permit Package C | price_permit_c | $2,995 one-time |
| Permit Package D | price_permit_d_monthly | $7,500/mo |
| A La Carte: Permit Assist | price_permit_assist | $495 |
| A La Carte: Inspection Coord | price_inspection_coord | $295 |
| A La Carte: Contractor Coord | price_contractor_coord_weekly | $395/week |
| A La Carte: Change Order Mgmt | price_change_order_mgmt | $195 |
| A La Carte: Site Visit | price_site_visit | $250 |
| A La Carte: Budget Setup | price_budget_setup | $495 |
| A La Carte: Estimate (Simple) | price_estimate_simple | $195 |
| A La Carte: Estimate (Standard) | price_estimate_standard | $495 |
| A La Carte: Estimate (Complex) | price_estimate_complex | $995 |

### System Configuration
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `SystemConfig` | Platform-defined | Default configs (rate limits, feature flags, etc.) | High |
| `MessageTemplate` | Platform-defined | Email templates (welcome, reset, invoice, notification) | High |
| `DocumentTemplate` | Platform-defined | Contract templates, report templates, letter templates | High |

---

## 2. ESTIMATION TOOL (APP-15) - 3rd Party Data

### Cost Database (RSMeans / Open Source)
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `CostDatabase` | Platform-defined | At least 1 default database per region (e.g., "DC Metro 2026") | Critical |
| `MaterialCost` | **RSMeans** or open source | 500-2,000 material cost records per CSI division | Critical |
| `LaborRate` | **BLS Prevailing Wage** / open source | 50-100 labor rates per trade per region | Critical |
| `EquipmentRate` | **Equipment Watch** or open source | 100-200 equipment rental rates | High |
| `Assembly` | Platform-defined | 50-100 pre-built assemblies (e.g., "8-inch CMU Wall") | High |
| `AssemblyItem` | Platform-defined | 5-20 items per assembly | High |

### 3rd Party Data Sources for Estimation

| Data Type | Source | Cost | Open Source Alternative |
|-----------|--------|------|----------------------|
| **Material Costs** | RSMeans (Gordian) | $1,000-5,000/yr | Open-source construction cost databases, HomeAdvisor data |
| **Labor Rates** | Bureau of Labor Statistics (BLS) | Free | BLS.gov API - prevailing wage data by metro area |
| **Equipment Rates** | Equipment Watch | $500-2,000/yr | AED Blue Book rates (partial), manual entry |
| **CSI MasterFormat Codes** | Construction Specifications Institute | $500/yr | CSI division structure is public domain (16 divisions) |
| **Regional Multipliers** | RSMeans City Cost Index | Included in RSMeans | Custom multipliers based on BLS regional data |
| **Inflation Indices** | BLS CPI | Free | BLS.gov API - Consumer Price Index data |

### CSI MasterFormat Divisions (Public Domain)
```
01 - General Requirements
02 - Existing Conditions
03 - Concrete
04 - Masonry
05 - Metals
06 - Wood, Plastics, Composites
07 - Thermal & Moisture Protection
08 - Openings
09 - Finishes
10 - Specialties
11 - Equipment
12 - Furnishings
13 - Special Construction
14 - Conveying Equipment
21 - Fire Suppression
22 - Plumbing
23 - HVAC
25 - Integrated Automation
26 - Electrical
27 - Communications
28 - Electronic Safety & Security
31 - Earthwork
32 - Exterior Improvements
33 - Utilities
```

---

## 3. PERMITS & INSPECTIONS (APP-05, APP-06)

### Jurisdiction Data
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `Jurisdiction` | Manual / government APIs | Initial set: 10-20 target jurisdictions (DC, MD, VA counties) | High |
| `PermitTemplate` | Per jurisdiction | 5-10 permit types per jurisdiction | High |
| `JurisdictionFormTemplate` | Per jurisdiction | Application forms per permit type | Medium |
| `ExpeditedPermitService` | Per jurisdiction | Expedited processing options and fees | Medium |
| `JurisdictionStaff` | Manual | Staff records for initial jurisdictions | Medium |

### 3rd Party Data Sources for Permits

| Data Type | Source | Cost | Notes |
|-----------|--------|------|-------|
| **Jurisdiction databases** | County/city government websites | Free | Manual data entry required initially |
| **Permit fee schedules** | Local government fee tables | Free | Varies by jurisdiction, updated annually |
| **Building codes** | ICC (International Code Council) | $500-2,000/yr | Or use UpCodes API |
| **Zoning data** | GIS services (ArcGIS, Google Maps) | $200+/mo | For parcel lookup and zoning verification |
| **Flood zone data** | FEMA NFHL | Free | FEMA API for flood zone determination |

---

## 4. MARKETPLACE (m-marketplace)

### Initial Marketplace Data
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `MarketplaceProfile` | User-generated | N/A (created by contractors) | N/A |
| Trade categories | Platform-defined | ~20 trade categories (Electrical, Plumbing, HVAC, etc.) | High |
| Service area definitions | Platform-defined | Geographic service areas (zip codes, counties) | High |

---

## 5. ARCHITECT HUB (m-architect)

### Template Library
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `DesignTemplate` | Platform-defined | 10-20 design templates (residential, commercial) | Medium |
| `StandardDetail` | Industry standard | 20-50 standard construction details | Medium |
| `ArchitectOnboarding` | Platform-defined | Onboarding checklist items | Medium |

---

## 6. ADMIN & OPERATIONS

### Admin Seed Data
| Model | Data Source | Records Needed | Priority |
|-------|------------|----------------|----------|
| `User` (admin) | Platform-defined | 1 super admin user | Critical |
| `Org` (platform org) | Platform-defined | 1 platform organization | Critical |
| `OrgMember` | Platform-defined | Admin user linked to platform org | Critical |

---

## IMPLEMENTATION PLAN

### Phase 1: Critical Seed Data (Before Launch)
1. Create seed script: `packages/database/prisma/seed.ts`
2. Seed Roles & Permissions (6 roles, 50+ permissions)
3. Seed ServicePlan records (8 plans matching Stripe products)
4. Seed PlatformFeeConfig and MarketplaceFeeConfig
5. Seed SystemConfig defaults
6. Create admin user and platform org
7. Seed MessageTemplate records (email templates)

### Phase 2: Estimation Data (Before Estimation Tool Launch)
1. Create CostDatabase records per region
2. Import BLS prevailing wage data -> LaborRate table
3. Import material costs (manual or RSMeans) -> MaterialCost table
4. Create initial Assembly records for common construction types
5. Seed CSI division structure

### Phase 3: Jurisdiction Data (Before Permits Launch)
1. Seed initial Jurisdiction records (target markets)
2. Create PermitTemplate records per jurisdiction
3. Import permit fee schedules
4. Set up JurisdictionFormTemplate records

### Phase 4: Templates & Documents
1. Create DocumentTemplate records (contracts, letters, reports)
2. Create MessageTemplate records (all notification types)
3. Create DesignTemplate records for architect hub

---

## FREE / OPEN SOURCE DATA SOURCES

| Source | URL | Data Type | Cost |
|--------|-----|-----------|------|
| BLS Prevailing Wage | https://www.bls.gov/oes/ | Labor rates by trade and metro area | Free |
| BLS CPI | https://www.bls.gov/cpi/ | Inflation indices | Free |
| FEMA NFHL | https://msc.fema.gov/portal | Flood zone data | Free |
| Census ACS | https://www.census.gov/programs-surveys/acs | Demographic/economic data | Free |
| OSHA Standards | https://www.osha.gov/laws-regs | Safety compliance data | Free |
| ICC Codes | https://codes.iccsafe.org/ | Building code references | Free (view) |
| CSI Divisions | Public domain | 49 divisions/sub-divisions | Free |
| OpenWeatherMap | https://openweathermap.org/api | Weather data for scheduling | Free tier |

---

**Note:** The seed script should be idempotent (safe to run multiple times) and use upsert operations to avoid duplicate records.
