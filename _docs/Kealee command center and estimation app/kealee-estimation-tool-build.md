# KEALEE PLATFORM v10 - APP-15: ESTIMATION TOOL
## Complete Prisma Schema & Claude Code Build Prompt

---

# OVERVIEW

The Estimation Tool (APP-15) is a critical component that powers:
- **Bid Engine (APP-01)** - Provides cost data for contractor bid analysis
- **Budget Tracker (APP-07)** - Seeds initial project budgets
- **Report Generator (APP-04)** - Cost breakdowns in reports
- **Decision Support (APP-14)** - Cost-based recommendations

## Service Tiers (from Stripe Products)
| Service | Price | Turnaround |
|---------|-------|------------|
| Quick Budget | $195 | 24 hours |
| Basic Takeoff | $495 | 48 hours |
| Detailed Estimate | $1,295 | 72 hours |
| Estimate Review | $695 | 48 hours |
| Professional Bid Package | $2,495 | 5 days |
| Enterprise Estimation | $5,995 | Custom |
| Monthly Support | $1,995/mo | Ongoing |

---

# PART 1: PRISMA SCHEMA ADDITIONS

Add these models to your existing `schema.prisma` file after the other Command Center models:

```prisma
// =============================================================================
// SECTION 21: APP-15 - ESTIMATION TOOL
// =============================================================================

// -----------------------------------------------------------------------------
// COST DATABASE - Regional pricing data for materials, labor, equipment
// -----------------------------------------------------------------------------

model CostDatabase {
  id              String   @id @default(uuid())
  organizationId  String?
  name            String
  description     String?
  region          String   // e.g., "DC-Baltimore", "National"
  type            CostDatabaseType @default(CUSTOM)
  version         String   @default("1.0")
  effectiveDate   DateTime @default(now())
  expirationDate  DateTime?
  source          String?  // e.g., "RSMeans", "Internal", "AI-Generated"
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  materials       MaterialCost[]
  laborRates      LaborRate[]
  equipmentRates  EquipmentRate[]
  assemblies      Assembly[]
  estimates       Estimate[]

  @@index([organizationId])
  @@index([region])
  @@index([isActive])
  @@map("cost_databases")
}

enum CostDatabaseType {
  NATIONAL
  REGIONAL
  LOCAL
  CUSTOM
  IMPORTED
}

model MaterialCost {
  id              String   @id @default(uuid())
  costDatabaseId  String
  csiCode         String?  // CSI MasterFormat code (e.g., "03 30 00")
  csiDivision     Int?     // Division number 1-49
  category        MaterialCategory
  subcategory     String?
  name            String
  description     String?
  unit            String   // e.g., "SF", "LF", "EA", "CY"
  unitCost        Decimal
  minCost         Decimal?
  maxCost         Decimal?
  wasteFactor     Decimal  @default(1.05) // 5% default waste
  supplier        String?
  sku             String?
  leadTimeDays    Int?
  isActive        Boolean  @default(true)
  lastUpdated     DateTime @default(now())
  priceHistory    Json?    // Array of {date, price} for trending
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  costDatabase    CostDatabase @relation(fields: [costDatabaseId], references: [id])
  assemblyItems   AssemblyItem[]
  lineItems       EstimateLineItem[]

  @@index([costDatabaseId])
  @@index([csiCode])
  @@index([category])
  @@index([name])
  @@map("material_costs")
}

enum MaterialCategory {
  CONCRETE
  MASONRY
  METALS
  WOOD_PLASTICS_COMPOSITES
  THERMAL_MOISTURE
  OPENINGS
  FINISHES
  SPECIALTIES
  EQUIPMENT
  FURNISHINGS
  SPECIAL_CONSTRUCTION
  CONVEYING
  FIRE_SUPPRESSION
  PLUMBING
  HVAC
  ELECTRICAL
  COMMUNICATIONS
  ELECTRONIC_SAFETY
  EARTHWORK
  EXTERIOR_IMPROVEMENTS
  UTILITIES
  GENERAL_CONDITIONS
  OTHER
}

model LaborRate {
  id              String   @id @default(uuid())
  costDatabaseId  String
  trade           LaborTrade
  classification  String?  // e.g., "Journeyman", "Apprentice", "Foreman"
  description     String?
  baseRate        Decimal  // Hourly base rate
  burdenRate      Decimal? // Benefits, taxes, insurance
  totalRate       Decimal  // Base + burden
  overtimeMultiplier Decimal @default(1.5)
  prevailingWage  Boolean  @default(false)
  unionRate       Boolean  @default(false)
  productivityFactor Decimal @default(1.0)
  region          String?
  effectiveDate   DateTime @default(now())
  expirationDate  DateTime?
  isActive        Boolean  @default(true)
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  costDatabase    CostDatabase @relation(fields: [costDatabaseId], references: [id])
  assemblyItems   AssemblyItem[]
  lineItems       EstimateLineItem[]

  @@index([costDatabaseId])
  @@index([trade])
  @@index([region])
  @@map("labor_rates")
}

enum LaborTrade {
  GENERAL_LABOR
  CARPENTER
  ELECTRICIAN
  PLUMBER
  HVAC_TECHNICIAN
  PAINTER
  DRYWALL_FINISHER
  TILE_SETTER
  ROOFER
  MASON
  CONCRETE_FINISHER
  IRONWORKER
  SHEET_METAL_WORKER
  INSULATOR
  GLAZIER
  FLOORING_INSTALLER
  CABINET_MAKER
  DEMOLITION
  EXCAVATOR_OPERATOR
  CRANE_OPERATOR
  FOREMAN
  SUPERINTENDENT
  PROJECT_MANAGER
  SAFETY_OFFICER
  OTHER
}

model EquipmentRate {
  id              String   @id @default(uuid())
  costDatabaseId  String
  category        EquipmentCategory
  name            String
  description     String?
  dailyRate       Decimal
  weeklyRate      Decimal?
  monthlyRate     Decimal?
  operatorRequired Boolean @default(false)
  operatorRate    Decimal?
  fuelCostPerHour Decimal?
  mobilizationCost Decimal?
  demobilizationCost Decimal?
  minRentalDays   Int      @default(1)
  isActive        Boolean  @default(true)
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  costDatabase    CostDatabase @relation(fields: [costDatabaseId], references: [id])
  assemblyItems   AssemblyItem[]
  lineItems       EstimateLineItem[]

  @@index([costDatabaseId])
  @@index([category])
  @@map("equipment_rates")
}

enum EquipmentCategory {
  EXCAVATION
  LIFTING
  CONCRETE
  COMPACTION
  HAULING
  SCAFFOLDING
  POWER_TOOLS
  SAFETY
  TEMPORARY_FACILITIES
  SURVEYING
  TESTING
  CLEANING
  OTHER
}

// -----------------------------------------------------------------------------
// ASSEMBLIES - Pre-built unit costs for common construction tasks
// -----------------------------------------------------------------------------

model Assembly {
  id              String   @id @default(uuid())
  costDatabaseId  String
  csiCode         String?
  category        AssemblyCategory
  subcategory     String?
  name            String
  description     String?
  unit            String   // e.g., "SF", "LF", "EA"
  unitCost        Decimal  // Calculated total
  laborCost       Decimal
  materialCost    Decimal
  equipmentCost   Decimal  @default(0)
  laborHours      Decimal
  productionRate  Decimal? // Units per day
  crewSize        Decimal? // Number of workers
  complexity      AssemblyComplexity @default(STANDARD)
  isActive        Boolean  @default(true)
  isTemplate      Boolean  @default(false)
  tags            String[] @default([])
  notes           String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  costDatabase    CostDatabase @relation(fields: [costDatabaseId], references: [id])
  items           AssemblyItem[]
  lineItems       EstimateLineItem[]

  @@index([costDatabaseId])
  @@index([csiCode])
  @@index([category])
  @@index([name])
  @@map("assemblies")
}

enum AssemblyCategory {
  SITEWORK
  FOUNDATIONS
  CONCRETE_FLATWORK
  FRAMING
  ROOFING
  EXTERIOR_FINISHES
  INTERIOR_FINISHES
  DRYWALL
  PAINTING
  FLOORING
  TILE
  CABINETRY
  COUNTERTOPS
  DOORS_HARDWARE
  WINDOWS
  PLUMBING_ROUGH
  PLUMBING_FINISH
  ELECTRICAL_ROUGH
  ELECTRICAL_FINISH
  HVAC_ROUGH
  HVAC_FINISH
  INSULATION
  DEMOLITION
  CLEANUP
  PERMITS_FEES
  GENERAL_CONDITIONS
  OTHER
}

enum AssemblyComplexity {
  SIMPLE
  STANDARD
  COMPLEX
  CUSTOM
}

model AssemblyItem {
  id              String   @id @default(uuid())
  assemblyId      String
  itemType        AssemblyItemType
  materialId      String?
  laborRateId     String?
  equipmentId     String?
  description     String?
  quantity        Decimal
  unit            String
  unitCost        Decimal
  totalCost       Decimal
  laborHours      Decimal?
  sortOrder       Int      @default(0)
  notes           String?
  createdAt       DateTime @default(now())

  assembly        Assembly       @relation(fields: [assemblyId], references: [id], onDelete: Cascade)
  material        MaterialCost?  @relation(fields: [materialId], references: [id])
  laborRate       LaborRate?     @relation(fields: [laborRateId], references: [id])
  equipment       EquipmentRate? @relation(fields: [equipmentId], references: [id])

  @@index([assemblyId])
  @@map("assembly_items")
}

enum AssemblyItemType {
  MATERIAL
  LABOR
  EQUIPMENT
  SUBCONTRACTOR
  OTHER
}

// -----------------------------------------------------------------------------
// ESTIMATES - Project cost estimates
// -----------------------------------------------------------------------------

model Estimate {
  id              String   @id @default(uuid())
  organizationId  String
  projectId       String?
  clientId        String?
  costDatabaseId  String?
  bidRequestId    String?  // Link to Bid Engine
  name            String
  description     String?
  type            EstimateType
  status          EstimateStatus @default(DRAFT)
  version         Int      @default(1)
  parentEstimateId String? // For revisions
  
  // Project Details
  projectName     String?
  projectAddress  String?
  projectCity     String?
  projectState    String?
  projectZip      String?
  squareFootage   Decimal?
  projectType     String?
  buildingType    String?
  stories         Int?
  
  // Cost Summary (calculated)
  subtotalMaterial  Decimal @default(0)
  subtotalLabor     Decimal @default(0)
  subtotalEquipment Decimal @default(0)
  subtotalSubcontractor Decimal @default(0)
  subtotalOther     Decimal @default(0)
  subtotalDirect    Decimal @default(0)
  
  // Markups & Adjustments
  overhead          Decimal @default(0)
  overheadPercent   Decimal @default(10)
  profit            Decimal @default(0)
  profitPercent     Decimal @default(10)
  contingency       Decimal @default(0)
  contingencyPercent Decimal @default(5)
  bondCost          Decimal @default(0)
  bondPercent       Decimal?
  permitFees        Decimal @default(0)
  insuranceCost     Decimal @default(0)
  taxRate           Decimal @default(0)
  salesTax          Decimal @default(0)
  
  // Totals
  totalCost         Decimal @default(0)
  costPerSqFt       Decimal?
  
  // Timeline
  estimatedDuration Int?     // Days
  startDate         DateTime?
  endDate           DateTime?
  
  // AI Analysis
  aiGenerated       Boolean  @default(false)
  aiConfidence      Decimal?
  aiNotes           String?
  aiComparisons     Json?    // Similar project comparisons
  
  // Workflow
  preparedById      String?
  reviewedById      String?
  approvedById      String?
  preparedAt        DateTime?
  reviewedAt        DateTime?
  approvedAt        DateTime?
  sentAt            DateTime?
  sentTo            String[] @default([])
  expiresAt         DateTime?
  
  // Service Info
  serviceType       EstimationServiceType?
  turnaroundHours   Int?
  revisionsAllowed  Int      @default(1)
  revisionsUsed     Int      @default(0)
  
  notes             String?
  internalNotes     String?
  assumptions       Json?    // Array of assumptions
  exclusions        Json?    // Array of exclusions
  clarifications    Json?    // Array of clarifications
  attachments       Json?
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  costDatabase      CostDatabase? @relation(fields: [costDatabaseId], references: [id])
  parentEstimate    Estimate?     @relation("EstimateRevisions", fields: [parentEstimateId], references: [id])
  revisions         Estimate[]    @relation("EstimateRevisions")
  sections          EstimateSection[]
  lineItems         EstimateLineItem[]
  comparisons       EstimateComparison[] @relation("EstimateComparisons")
  comparedTo        EstimateComparison[] @relation("ComparedEstimates")

  @@index([organizationId])
  @@index([projectId])
  @@index([clientId])
  @@index([status])
  @@index([type])
  @@map("estimates")
}

enum EstimateType {
  QUICK_BUDGET
  CONCEPTUAL
  PRELIMINARY
  DETAILED
  BID
  CHANGE_ORDER
  VALUE_ENGINEERING
  AS_BUILT
}

enum EstimateStatus {
  DRAFT
  IN_PROGRESS
  UNDER_REVIEW
  PENDING_APPROVAL
  APPROVED
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
  SUPERSEDED
  ARCHIVED
}

enum EstimationServiceType {
  QUICK_BUDGET
  BASIC_TAKEOFF
  DETAILED_ESTIMATE
  ESTIMATE_REVIEW
  PROFESSIONAL_BID
  ENTERPRISE
  MONTHLY_SUPPORT
}

model EstimateSection {
  id              String   @id @default(uuid())
  estimateId      String
  csiDivision     Int?
  csiCode         String?
  name            String
  description     String?
  subtotalMaterial  Decimal @default(0)
  subtotalLabor     Decimal @default(0)
  subtotalEquipment Decimal @default(0)
  subtotalSubcontractor Decimal @default(0)
  subtotalOther     Decimal @default(0)
  total             Decimal @default(0)
  sortOrder       Int      @default(0)
  isExpanded      Boolean  @default(true)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  estimate        Estimate @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  lineItems       EstimateLineItem[]

  @@index([estimateId])
  @@map("estimate_sections")
}

model EstimateLineItem {
  id              String   @id @default(uuid())
  estimateId      String
  sectionId       String?
  itemType        LineItemType
  
  // Source references
  materialId      String?
  laborRateId     String?
  equipmentId     String?
  assemblyId      String?
  
  // Item details
  csiCode         String?
  category        String?
  description     String
  location        String?  // Where in the building
  
  // Quantities
  quantity        Decimal
  unit            String
  takeoffSource   TakeoffSource @default(MANUAL)
  takeoffNotes    String?
  
  // Costs
  unitCost        Decimal
  totalCost       Decimal
  laborHours      Decimal?
  laborCost       Decimal?
  materialCost    Decimal?
  equipmentCost   Decimal?
  subcontractorCost Decimal?
  
  // Adjustments
  wasteFactor     Decimal  @default(1.0)
  difficultyFactor Decimal @default(1.0)
  markup          Decimal  @default(0)
  discount        Decimal  @default(0)
  
  // Flags
  isAlternate     Boolean  @default(false)
  isAllowance     Boolean  @default(false)
  isExcluded      Boolean  @default(false)
  isByOwner       Boolean  @default(false) // Owner-furnished
  
  sortOrder       Int      @default(0)
  notes           String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  estimate        Estimate       @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  section         EstimateSection? @relation(fields: [sectionId], references: [id])
  material        MaterialCost?  @relation(fields: [materialId], references: [id])
  laborRate       LaborRate?     @relation(fields: [laborRateId], references: [id])
  equipment       EquipmentRate? @relation(fields: [equipmentId], references: [id])
  assembly        Assembly?      @relation(fields: [assemblyId], references: [id])

  @@index([estimateId])
  @@index([sectionId])
  @@index([itemType])
  @@map("estimate_line_items")
}

enum LineItemType {
  MATERIAL
  LABOR
  EQUIPMENT
  ASSEMBLY
  SUBCONTRACTOR
  ALLOWANCE
  FEE
  OTHER
}

enum TakeoffSource {
  MANUAL
  PLAN_MEASUREMENT
  AI_EXTRACTED
  IMPORTED
  ASSEMBLY_CALC
}

// -----------------------------------------------------------------------------
// ESTIMATE COMPARISONS & HISTORY
// -----------------------------------------------------------------------------

model EstimateComparison {
  id              String   @id @default(uuid())
  estimateId      String
  comparedToId    String?  // Another estimate, or null for historical
  type            ComparisonType
  name            String?
  
  // Comparison data
  baseCost        Decimal
  comparedCost    Decimal
  variance        Decimal
  variancePercent Decimal
  
  // Breakdown
  materialVariance Decimal?
  laborVariance   Decimal?
  equipmentVariance Decimal?
  
  // Analysis
  factors         Json?    // What drove the difference
  recommendations Json?
  aiAnalysis      String?
  
  createdAt       DateTime @default(now())

  estimate        Estimate  @relation("EstimateComparisons", fields: [estimateId], references: [id], onDelete: Cascade)
  comparedTo      Estimate? @relation("ComparedEstimates", fields: [comparedToId], references: [id])

  @@index([estimateId])
  @@map("estimate_comparisons")
}

enum ComparisonType {
  REVISION
  SIMILAR_PROJECT
  MARKET_RATE
  HISTORICAL
  CONTRACTOR_BID
}

model EstimateHistory {
  id              String   @id @default(uuid())
  estimateId      String
  action          EstimateAction
  userId          String?
  previousStatus  EstimateStatus?
  newStatus       EstimateStatus?
  changes         Json?
  notes           String?
  createdAt       DateTime @default(now())

  @@index([estimateId])
  @@index([createdAt])
  @@map("estimate_history")
}

enum EstimateAction {
  CREATED
  UPDATED
  STATUS_CHANGED
  SUBMITTED
  REVIEWED
  APPROVED
  REJECTED
  SENT
  REVISED
  EXPORTED
  ARCHIVED
}

// -----------------------------------------------------------------------------
// TAKEOFF TOOLS - Plan-based quantity extraction
// -----------------------------------------------------------------------------

model Takeoff {
  id              String   @id @default(uuid())
  estimateId      String?
  projectId       String?
  name            String
  description     String?
  type            TakeoffType
  status          TakeoffStatus @default(IN_PROGRESS)
  
  // Source documents
  documentUrls    Json?    // Array of plan URLs
  pageCount       Int?
  scale           String?  // e.g., "1/4 inch = 1 foot"
  
  // Totals
  totalItems      Int      @default(0)
  totalArea       Decimal? // Total SF
  totalLinear     Decimal? // Total LF
  totalCount      Int?     // Total EA
  
  // AI processing
  aiProcessed     Boolean  @default(false)
  aiConfidence    Decimal?
  aiNotes         String?
  
  completedAt     DateTime?
  completedById   String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  measurements    TakeoffMeasurement[]

  @@index([estimateId])
  @@index([projectId])
  @@map("takeoffs")
}

enum TakeoffType {
  GENERAL
  SITEWORK
  STRUCTURAL
  ARCHITECTURAL
  MECHANICAL
  ELECTRICAL
  PLUMBING
  FIRE_PROTECTION
}

enum TakeoffStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  VERIFIED
}

model TakeoffMeasurement {
  id              String   @id @default(uuid())
  takeoffId       String
  category        String
  subcategory     String?
  description     String
  location        String?  // Room/area name
  floor           String?  // Floor level
  
  // Measurement data
  measurementType MeasurementType
  length          Decimal?
  width           Decimal?
  height          Decimal?
  depth           Decimal?
  area            Decimal?
  volume          Decimal?
  count           Int?
  
  unit            String
  quantity        Decimal
  
  // Source
  pageNumber      Int?
  coordinates     Json?    // {x, y, width, height} on the page
  sourceMethod    TakeoffSource @default(MANUAL)
  confidence      Decimal?
  
  // Linking
  linkedToLineItem String?
  
  notes           String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  takeoff         Takeoff  @relation(fields: [takeoffId], references: [id], onDelete: Cascade)

  @@index([takeoffId])
  @@index([category])
  @@map("takeoff_measurements")
}

enum MeasurementType {
  LINEAR
  AREA
  VOLUME
  COUNT
  WEIGHT
}

// -----------------------------------------------------------------------------
// ESTIMATION REQUESTS & ORDERS
// -----------------------------------------------------------------------------

model EstimationOrder {
  id              String   @id @default(uuid())
  organizationId  String?
  clientId        String?
  projectId       String?
  
  // Order details
  orderNumber     String   @unique
  serviceType     EstimationServiceType
  status          EstimationOrderStatus @default(PENDING)
  priority        OrderPriority @default(NORMAL)
  
  // Pricing
  price           Decimal
  discount        Decimal  @default(0)
  total           Decimal
  paidAt          DateTime?
  stripePaymentId String?
  
  // Project info
  projectName     String
  projectAddress  String?
  projectType     String?
  squareFootage   Decimal?
  scopeDescription String?
  
  // Documents
  uploadedDocs    Json?    // Array of uploaded document URLs
  
  // Timeline
  requestedTurnaround Int?  // Hours
  dueAt           DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  deliveredAt     DateTime?
  
  // Assignment
  assignedToId    String?
  reviewedById    String?
  
  // Output
  estimateId      String?  // Generated estimate
  deliverables    Json?    // URLs to output files
  
  // Communication
  notes           String?
  internalNotes   String?
  clientFeedback  String?
  feedbackRating  Int?
  
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId])
  @@index([clientId])
  @@index([status])
  @@index([orderNumber])
  @@map("estimation_orders")
}

enum EstimationOrderStatus {
  PENDING
  PAID
  ASSIGNED
  IN_PROGRESS
  UNDER_REVIEW
  COMPLETED
  DELIVERED
  REVISION_REQUESTED
  CANCELLED
  REFUNDED
}

enum OrderPriority {
  LOW
  NORMAL
  HIGH
  RUSH
}

// -----------------------------------------------------------------------------
// REGIONAL & HISTORICAL DATA
// -----------------------------------------------------------------------------

model RegionalCostIndex {
  id              String   @id @default(uuid())
  region          String
  city            String?
  state           String
  indexValue      Decimal  // Relative to national average (1.0)
  laborIndex      Decimal?
  materialIndex   Decimal?
  equipmentIndex  Decimal?
  effectiveDate   DateTime
  source          String?
  createdAt       DateTime @default(now())

  @@unique([region, effectiveDate])
  @@index([region])
  @@index([state])
  @@map("regional_cost_indices")
}

model HistoricalProjectCost {
  id              String   @id @default(uuid())
  organizationId  String?
  projectType     String
  buildingType    String?
  region          String
  city            String?
  state           String?
  squareFootage   Decimal
  totalCost       Decimal
  costPerSqFt     Decimal
  
  // Breakdown
  laborPercent    Decimal?
  materialPercent Decimal?
  equipmentPercent Decimal?
  
  // Context
  complexity      AssemblyComplexity?
  quality         QualityLevel?
  year            Int
  quarter         Int?
  
  // Flags
  isVerified      Boolean  @default(false)
  source          String?  // "Internal", "RS Means", etc.
  
  notes           String?
  metadata        Json?
  createdAt       DateTime @default(now())

  @@index([projectType])
  @@index([region])
  @@index([year])
  @@map("historical_project_costs")
}

enum QualityLevel {
  ECONOMY
  STANDARD
  PREMIUM
  LUXURY
  CUSTOM
}

// -----------------------------------------------------------------------------
// AI ESTIMATION FEATURES
// -----------------------------------------------------------------------------

model AIEstimationSession {
  id              String   @id @default(uuid())
  estimateId      String?
  userId          String
  sessionType     AISessionType
  status          AISessionStatus @default(ACTIVE)
  
  // Input
  inputType       String   // "plans", "description", "photos", "voice"
  inputData       Json
  
  // Processing
  processingSteps Json?    // Array of processing steps
  extractedData   Json?    // Extracted quantities/scope
  
  // Output
  generatedItems  Json?    // Generated line items
  confidence      Decimal?
  warnings        Json?    // Array of warnings/flags
  
  // Feedback
  accepted        Boolean?
  feedbackNotes   String?
  
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  metadata        Json?

  @@index([estimateId])
  @@index([userId])
  @@index([sessionType])
  @@map("ai_estimation_sessions")
}

enum AISessionType {
  PLAN_ANALYSIS
  SCOPE_EXTRACTION
  COST_PREDICTION
  ASSEMBLY_SUGGESTION
  VALUE_ENGINEERING
  RISK_ASSESSMENT
}

enum AISessionStatus {
  ACTIVE
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

# PART 2: CLAUDE CODE BUILD PROMPT

Copy this prompt to Claude Code to build the Estimation Tool:

```
You are building APP-15: Estimation Tool for the Kealee Platform v10 monorepo. This is a comprehensive construction cost estimation system that provides:

1. Cost databases with regional pricing
2. Assembly/unit cost libraries
3. Project takeoffs and quantity extraction
4. AI-powered estimation
5. Integration with Bid Engine, Budget Tracker, and other apps

## PROJECT CONTEXT

The Estimation Tool supports these service tiers:
- Quick Budget ($195) - 24hr turnaround, rough SF pricing
- Basic Takeoff ($495) - 48hr, material quantities by CSI division
- Detailed Estimate ($1,295) - 72hr, full line-item breakdown
- Estimate Review ($695) - 48hr, review existing estimates
- Professional Bid Package ($2,495) - 5 days, bid-ready documents
- Enterprise ($5,995) - Custom, complex projects
- Monthly Support ($1,995/mo) - Ongoing estimation support

## DIRECTORY STRUCTURE

```
packages/automation/apps/estimation-tool/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main exports
│   │
│   ├── cost-database/
│   │   ├── index.ts
│   │   ├── database-manager.ts     # CRUD for cost databases
│   │   ├── material-costs.ts       # Material pricing operations
│   │   ├── labor-rates.ts          # Labor rate management
│   │   ├── equipment-rates.ts      # Equipment cost management
│   │   ├── regional-adjustment.ts  # Regional cost indices
│   │   └── price-updater.ts        # Automated price updates
│   │
│   ├── assemblies/
│   │   ├── index.ts
│   │   ├── assembly-builder.ts     # Create/edit assemblies
│   │   ├── assembly-calculator.ts  # Calculate assembly costs
│   │   ├── assembly-library.ts     # Pre-built assembly templates
│   │   └── assembly-importer.ts    # Import from external sources
│   │
│   ├── takeoff/
│   │   ├── index.ts
│   │   ├── takeoff-manager.ts      # Manage takeoff sessions
│   │   ├── measurement-tools.ts    # Measurement calculations
│   │   ├── plan-analyzer.ts        # AI plan analysis
│   │   └── quantity-extractor.ts   # Extract quantities from plans
│   │
│   ├── estimates/
│   │   ├── index.ts
│   │   ├── estimate-builder.ts     # Create/edit estimates
│   │   ├── estimate-calculator.ts  # Calculate totals/markups
│   │   ├── section-manager.ts      # Manage CSI sections
│   │   ├── line-item-manager.ts    # CRUD for line items
│   │   ├── revision-manager.ts     # Handle revisions
│   │   └── export-generator.ts     # PDF/Excel export
│   │
│   ├── ai/
│   │   ├── index.ts
│   │   ├── scope-analyzer.ts       # AI scope extraction
│   │   ├── cost-predictor.ts       # ML cost prediction
│   │   ├── assembly-suggester.ts   # AI assembly recommendations
│   │   ├── value-engineer.ts       # AI value engineering
│   │   └── comparison-analyzer.ts  # Compare estimates
│   │
│   ├── orders/
│   │   ├── index.ts
│   │   ├── order-manager.ts        # Estimation order workflow
│   │   ├── assignment-engine.ts    # Assign estimators
│   │   └── delivery-handler.ts     # Deliver completed estimates
│   │
│   ├── integrations/
│   │   ├── index.ts
│   │   ├── bid-engine-sync.ts      # Sync with APP-01
│   │   ├── budget-tracker-sync.ts  # Sync with APP-07
│   │   └── rsmeans-importer.ts     # Import RS Means data
│   │
│   ├── api/
│   │   └── routes.ts               # API endpoints
│   │
│   └── worker.ts                   # Background job processor
│
└── tests/
    └── estimation.test.ts
```

## KEY PRISMA QUERIES TO IMPLEMENT

### Cost Database Operations

```typescript
// Get cost database with all pricing
const costDatabase = await prisma.costDatabase.findFirst({
  where: {
    isDefault: true,
    isActive: true,
    region: 'DC-Baltimore',
  },
  include: {
    materials: { where: { isActive: true } },
    laborRates: { where: { isActive: true } },
    equipmentRates: { where: { isActive: true } },
    assemblies: { where: { isActive: true } },
  },
});

// Search materials by CSI code or name
const materials = await prisma.materialCost.findMany({
  where: {
    costDatabaseId,
    OR: [
      { csiCode: { startsWith: searchTerm } },
      { name: { contains: searchTerm, mode: 'insensitive' } },
    ],
    isActive: true,
  },
  orderBy: { name: 'asc' },
  take: 50,
});

// Get labor rates by trade
const laborRates = await prisma.laborRate.findMany({
  where: {
    costDatabaseId,
    trade: { in: ['CARPENTER', 'ELECTRICIAN', 'PLUMBER'] },
    isActive: true,
  },
});
```

### Assembly Operations

```typescript
// Get assembly with all components
const assembly = await prisma.assembly.findUniqueOrThrow({
  where: { id: assemblyId },
  include: {
    items: {
      include: {
        material: true,
        laborRate: true,
        equipment: true,
      },
      orderBy: { sortOrder: 'asc' },
    },
  },
});

// Create assembly with items
const newAssembly = await prisma.assembly.create({
  data: {
    costDatabaseId,
    name: 'Standard Interior Door Installation',
    category: 'DOORS_HARDWARE',
    unit: 'EA',
    unitCost: 485,
    laborCost: 185,
    materialCost: 300,
    equipmentCost: 0,
    laborHours: 2.5,
    items: {
      create: [
        {
          itemType: 'MATERIAL',
          materialId: doorMaterialId,
          quantity: 1,
          unit: 'EA',
          unitCost: 250,
          totalCost: 250,
        },
        {
          itemType: 'MATERIAL',
          materialId: hardwareMaterialId,
          quantity: 1,
          unit: 'SET',
          unitCost: 50,
          totalCost: 50,
        },
        {
          itemType: 'LABOR',
          laborRateId: carpenterRateId,
          quantity: 2.5,
          unit: 'HR',
          unitCost: 74,
          totalCost: 185,
          laborHours: 2.5,
        },
      ],
    },
  },
  include: { items: true },
});
```

### Estimate Operations

```typescript
// Create new estimate
const estimate = await prisma.estimate.create({
  data: {
    organizationId,
    projectId,
    costDatabaseId,
    name: `${projectName} - Detailed Estimate`,
    type: 'DETAILED',
    status: 'DRAFT',
    projectName,
    projectAddress,
    squareFootage,
    overheadPercent: 10,
    profitPercent: 10,
    contingencyPercent: 5,
  },
});

// Get estimate with full breakdown
const fullEstimate = await prisma.estimate.findUniqueOrThrow({
  where: { id: estimateId },
  include: {
    costDatabase: true,
    sections: {
      include: {
        lineItems: {
          include: {
            material: true,
            laborRate: true,
            equipment: true,
            assembly: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    },
    lineItems: {
      where: { sectionId: null }, // Unsectioned items
      orderBy: { sortOrder: 'asc' },
    },
    revisions: { orderBy: { version: 'desc' } },
  },
});

// Add line item to estimate
const lineItem = await prisma.estimateLineItem.create({
  data: {
    estimateId,
    sectionId,
    itemType: 'ASSEMBLY',
    assemblyId,
    description: 'Interior Door Installation - Standard',
    quantity: 12,
    unit: 'EA',
    unitCost: 485,
    totalCost: 5820,
    laborHours: 30,
    laborCost: 2220,
    materialCost: 3600,
    takeoffSource: 'PLAN_MEASUREMENT',
  },
});

// Update estimate totals (transaction)
await prisma.$transaction(async (tx) => {
  // Get all line items
  const lineItems = await tx.estimateLineItem.findMany({
    where: { estimateId, isExcluded: false },
  });

  // Calculate subtotals
  const subtotalMaterial = lineItems.reduce((sum, li) => 
    sum + Number(li.materialCost || 0), 0);
  const subtotalLabor = lineItems.reduce((sum, li) => 
    sum + Number(li.laborCost || 0), 0);
  const subtotalEquipment = lineItems.reduce((sum, li) => 
    sum + Number(li.equipmentCost || 0), 0);
  const subtotalSubcontractor = lineItems.reduce((sum, li) => 
    sum + Number(li.subcontractorCost || 0), 0);
  
  const subtotalDirect = subtotalMaterial + subtotalLabor + 
    subtotalEquipment + subtotalSubcontractor;

  // Get estimate for markup percentages
  const estimate = await tx.estimate.findUniqueOrThrow({
    where: { id: estimateId },
  });

  const overhead = subtotalDirect * (Number(estimate.overheadPercent) / 100);
  const profit = (subtotalDirect + overhead) * (Number(estimate.profitPercent) / 100);
  const subtotalWithMarkup = subtotalDirect + overhead + profit;
  const contingency = subtotalWithMarkup * (Number(estimate.contingencyPercent) / 100);
  const totalCost = subtotalWithMarkup + contingency + 
    Number(estimate.permitFees) + Number(estimate.bondCost);
  
  const costPerSqFt = estimate.squareFootage 
    ? totalCost / Number(estimate.squareFootage) 
    : null;

  // Update estimate
  await tx.estimate.update({
    where: { id: estimateId },
    data: {
      subtotalMaterial,
      subtotalLabor,
      subtotalEquipment,
      subtotalSubcontractor,
      subtotalDirect,
      overhead,
      profit,
      contingency,
      totalCost,
      costPerSqFt,
    },
  });

  // Update section totals
  for (const section of await tx.estimateSection.findMany({ where: { estimateId } })) {
    const sectionItems = lineItems.filter(li => li.sectionId === section.id);
    await tx.estimateSection.update({
      where: { id: section.id },
      data: {
        subtotalMaterial: sectionItems.reduce((sum, li) => sum + Number(li.materialCost || 0), 0),
        subtotalLabor: sectionItems.reduce((sum, li) => sum + Number(li.laborCost || 0), 0),
        subtotalEquipment: sectionItems.reduce((sum, li) => sum + Number(li.equipmentCost || 0), 0),
        subtotalSubcontractor: sectionItems.reduce((sum, li) => sum + Number(li.subcontractorCost || 0), 0),
        total: sectionItems.reduce((sum, li) => sum + Number(li.totalCost), 0),
      },
    });
  }
});
```

### Takeoff Operations

```typescript
// Create takeoff session
const takeoff = await prisma.takeoff.create({
  data: {
    estimateId,
    projectId,
    name: 'Architectural Takeoff',
    type: 'ARCHITECTURAL',
    status: 'IN_PROGRESS',
    documentUrls: uploadedPlanUrls,
    pageCount: 24,
    scale: '1/4" = 1\'-0"',
  },
});

// Add measurement
const measurement = await prisma.takeoffMeasurement.create({
  data: {
    takeoffId,
    category: 'WALLS',
    subcategory: 'Interior Partitions',
    description: '2x4 Stud Wall @ 16" OC',
    location: 'First Floor',
    floor: '1',
    measurementType: 'LINEAR',
    length: 245.5,
    unit: 'LF',
    quantity: 245.5,
    pageNumber: 3,
    sourceMethod: 'PLAN_MEASUREMENT',
  },
});
```

### Order Management

```typescript
// Create estimation order
const order = await prisma.estimationOrder.create({
  data: {
    orderNumber: generateOrderNumber(),
    organizationId,
    clientId,
    serviceType: 'DETAILED_ESTIMATE',
    status: 'PAID',
    priority: 'NORMAL',
    price: 1295,
    discount: 0,
    total: 1295,
    stripePaymentId,
    projectName,
    projectAddress,
    projectType: 'Kitchen Remodel',
    squareFootage: 250,
    scopeDescription: 'Full kitchen renovation including...',
    uploadedDocs: documentUrls,
    requestedTurnaround: 72,
    dueAt: addHours(new Date(), 72),
  },
});

// Assign to estimator
await prisma.estimationOrder.update({
  where: { id: orderId },
  data: {
    status: 'ASSIGNED',
    assignedToId: estimatorUserId,
    startedAt: new Date(),
  },
});
```

### AI Integration

```typescript
// Create AI estimation session
const aiSession = await prisma.aIEstimationSession.create({
  data: {
    estimateId,
    userId,
    sessionType: 'PLAN_ANALYSIS',
    status: 'PROCESSING',
    inputType: 'plans',
    inputData: { documentUrls, pageNumbers: [1, 2, 3] },
  },
});

// Update with results
await prisma.aIEstimationSession.update({
  where: { id: aiSession.id },
  data: {
    status: 'COMPLETED',
    extractedData: {
      rooms: [...],
      areas: {...},
      openings: [...],
    },
    generatedItems: [
      { description: '2x4 Framing', quantity: 450, unit: 'LF' },
      { description: 'Drywall', quantity: 1200, unit: 'SF' },
    ],
    confidence: 0.87,
    warnings: ['Scale may be incorrect on page 2'],
    completedAt: new Date(),
  },
});
```

### Historical & Regional Data

```typescript
// Get regional cost index
const regionIndex = await prisma.regionalCostIndex.findFirst({
  where: {
    region: 'DC-Baltimore',
    effectiveDate: { lte: new Date() },
  },
  orderBy: { effectiveDate: 'desc' },
});

// Adjust costs by region
const adjustedCost = baseCost * Number(regionIndex.indexValue);

// Get historical comparables
const comparables = await prisma.historicalProjectCost.findMany({
  where: {
    projectType: 'Kitchen Remodel',
    region: 'DC-Baltimore',
    squareFootage: { gte: sfMin, lte: sfMax },
    year: { gte: currentYear - 3 },
  },
  orderBy: { costPerSqFt: 'asc' },
  take: 10,
});
```

## INTEGRATION WITH OTHER APPS

### Bid Engine Integration (APP-01)

```typescript
// Export estimate to bid request
export async function exportToBidRequest(estimateId: string): Promise<string> {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: estimateId },
    include: { sections: { include: { lineItems: true } } },
  });

  // Create bid request with estimate data
  const bidRequest = await prisma.bidRequest.create({
    data: {
      projectId: estimate.projectId!,
      title: `Bid Request - ${estimate.name}`,
      scope: {
        description: estimate.description,
        sections: estimate.sections.map(s => ({
          name: s.name,
          items: s.lineItems.map(li => li.description),
        })),
        squareFootage: Number(estimate.squareFootage),
      },
      requirements: {
        estimatedBudget: Number(estimate.totalCost),
        estimatedDuration: estimate.estimatedDuration,
      },
      budgetMin: Number(estimate.totalCost) * 0.9,
      budgetMax: Number(estimate.totalCost) * 1.1,
      deadline: addDays(new Date(), 14),
      status: 'OPEN',
    },
  });

  // Link estimate to bid request
  await prisma.estimate.update({
    where: { id: estimateId },
    data: { bidRequestId: bidRequest.id },
  });

  return bidRequest.id;
}
```

### Budget Tracker Integration (APP-07)

```typescript
// Seed budget from approved estimate
export async function seedBudgetFromEstimate(
  estimateId: string, 
  projectId: string
): Promise<void> {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: estimateId },
    include: { sections: true },
  });

  // Create budget items from estimate sections
  for (const section of estimate.sections) {
    await prisma.budgetItem.create({
      data: {
        projectId,
        category: mapCsiToCategory(section.csiDivision),
        subcategory: section.name,
        description: section.description || section.name,
        estimatedAmount: section.total,
        budgetedAmount: section.total,
        csiCode: section.csiCode,
        sortOrder: section.sortOrder,
      },
    });
  }

  // Update project budget
  await prisma.project.update({
    where: { id: projectId },
    data: {
      budget: estimate.totalCost,
      estimatedCost: estimate.subtotalDirect,
    },
  });
}
```

## QUEUE CONFIGURATION

```typescript
export const ESTIMATION_QUEUE = 'estimation-tool';

export const ESTIMATION_JOB_TYPES = {
  // Cost database jobs
  UPDATE_PRICES: 'UPDATE_PRICES',
  IMPORT_COST_DATA: 'IMPORT_COST_DATA',
  
  // Estimate jobs
  CALCULATE_ESTIMATE: 'CALCULATE_ESTIMATE',
  GENERATE_PDF: 'GENERATE_PDF',
  GENERATE_EXCEL: 'GENERATE_EXCEL',
  SEND_ESTIMATE: 'SEND_ESTIMATE',
  
  // AI jobs
  ANALYZE_PLANS: 'ANALYZE_PLANS',
  EXTRACT_QUANTITIES: 'EXTRACT_QUANTITIES',
  PREDICT_COSTS: 'PREDICT_COSTS',
  SUGGEST_ASSEMBLIES: 'SUGGEST_ASSEMBLIES',
  VALUE_ENGINEER: 'VALUE_ENGINEER',
  
  // Order jobs
  PROCESS_ORDER: 'PROCESS_ORDER',
  ASSIGN_ESTIMATOR: 'ASSIGN_ESTIMATOR',
  SEND_DELIVERY: 'SEND_DELIVERY',
  
  // Integration jobs
  SYNC_TO_BID_ENGINE: 'SYNC_TO_BID_ENGINE',
  SYNC_TO_BUDGET: 'SYNC_TO_BUDGET',
};
```

## WORKER IMPLEMENTATION

```typescript
// packages/automation/apps/estimation-tool/src/worker.ts

import { createWorker, QUEUE_NAMES, JOB_OPTIONS } from '../../../src/shared/queue';
import { EstimateBuilder } from './estimates/estimate-builder';
import { EstimateCalculator } from './estimates/estimate-calculator';
import { PlanAnalyzer } from './ai/plan-analyzer';
import { CostPredictor } from './ai/cost-predictor';
import { ExportGenerator } from './estimates/export-generator';
import { OrderManager } from './orders/order-manager';

const estimateBuilder = new EstimateBuilder();
const estimateCalculator = new EstimateCalculator();
const planAnalyzer = new PlanAnalyzer();
const costPredictor = new CostPredictor();
const exportGenerator = new ExportGenerator();
const orderManager = new OrderManager();

export const estimationWorker = createWorker(
  'estimation-tool',
  async (job) => {
    console.log(`Processing estimation job: ${job.data.type}`);

    switch (job.data.type) {
      // Estimate calculations
      case 'CALCULATE_ESTIMATE':
        return await estimateCalculator.recalculate(job.data.estimateId);

      case 'GENERATE_PDF':
        return await exportGenerator.generatePDF(job.data.estimateId, job.data.options);

      case 'GENERATE_EXCEL':
        return await exportGenerator.generateExcel(job.data.estimateId, job.data.options);

      case 'SEND_ESTIMATE':
        return await estimateBuilder.sendEstimate(job.data.estimateId, job.data.recipients);

      // AI processing
      case 'ANALYZE_PLANS':
        return await planAnalyzer.analyzePlans(job.data.takeoffId, job.data.documentUrls);

      case 'EXTRACT_QUANTITIES':
        return await planAnalyzer.extractQuantities(job.data.aiSessionId);

      case 'PREDICT_COSTS':
        return await costPredictor.predictCosts(job.data.estimateId);

      case 'SUGGEST_ASSEMBLIES':
        return await costPredictor.suggestAssemblies(job.data.estimateId, job.data.scope);

      case 'VALUE_ENGINEER':
        return await costPredictor.valueEngineer(job.data.estimateId, job.data.targetReduction);

      // Order processing
      case 'PROCESS_ORDER':
        return await orderManager.processOrder(job.data.orderId);

      case 'ASSIGN_ESTIMATOR':
        return await orderManager.assignEstimator(job.data.orderId);

      case 'SEND_DELIVERY':
        return await orderManager.deliverEstimate(job.data.orderId);

      // Integration jobs
      case 'SYNC_TO_BID_ENGINE':
        const { exportToBidRequest } = await import('./integrations/bid-engine-sync');
        return await exportToBidRequest(job.data.estimateId);

      case 'SYNC_TO_BUDGET':
        const { seedBudgetFromEstimate } = await import('./integrations/budget-tracker-sync');
        return await seedBudgetFromEstimate(job.data.estimateId, job.data.projectId);

      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  },
  3 // concurrency
);

// Event handlers
estimationWorker.on('completed', (job) => {
  console.log(`✓ [Estimation Tool] Job ${job.id} completed`);
});

estimationWorker.on('failed', (job, err) => {
  console.error(`✗ [Estimation Tool] Job ${job?.id} failed:`, err.message);
});
```

## API ROUTES

```typescript
// packages/automation/apps/estimation-tool/src/api/routes.ts

import { FastifyInstance } from 'fastify';
import { prisma } from '@kealee/database';
import { queues, JOB_OPTIONS } from '../../../../src/shared/queue';

export async function estimationRoutes(fastify: FastifyInstance) {
  // Cost Database routes
  fastify.get('/cost-databases', async (request, reply) => {
    const databases = await prisma.costDatabase.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return databases;
  });

  fastify.get('/materials/search', async (request, reply) => {
    const { q, databaseId, category, limit = 50 } = request.query as any;
    const materials = await prisma.materialCost.findMany({
      where: {
        costDatabaseId: databaseId,
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { csiCode: { startsWith: q } },
        ],
        ...(category ? { category } : {}),
      },
      take: Number(limit),
    });
    return materials;
  });

  // Assembly routes
  fastify.get('/assemblies', async (request, reply) => {
    const { databaseId, category } = request.query as any;
    const assemblies = await prisma.assembly.findMany({
      where: {
        costDatabaseId: databaseId,
        isActive: true,
        ...(category ? { category } : {}),
      },
      include: { items: true },
    });
    return assemblies;
  });

  // Estimate routes
  fastify.post('/estimates', async (request, reply) => {
    const estimate = await prisma.estimate.create({
      data: request.body as any,
    });
    return estimate;
  });

  fastify.get('/estimates/:id', async (request, reply) => {
    const { id } = request.params as any;
    const estimate = await prisma.estimate.findUniqueOrThrow({
      where: { id },
      include: {
        sections: {
          include: { lineItems: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return estimate;
  });

  fastify.post('/estimates/:id/calculate', async (request, reply) => {
    const { id } = request.params as any;
    const job = await queues.ESTIMATION.add('calculate', {
      type: 'CALCULATE_ESTIMATE',
      estimateId: id,
    }, JOB_OPTIONS.HIGH_PRIORITY);
    return { jobId: job.id };
  });

  fastify.post('/estimates/:id/export/pdf', async (request, reply) => {
    const { id } = request.params as any;
    const job = await queues.ESTIMATION.add('export-pdf', {
      type: 'GENERATE_PDF',
      estimateId: id,
      options: request.body,
    }, JOB_OPTIONS.DEFAULT);
    return { jobId: job.id };
  });

  // Takeoff routes
  fastify.post('/takeoffs', async (request, reply) => {
    const takeoff = await prisma.takeoff.create({
      data: request.body as any,
    });
    return takeoff;
  });

  fastify.post('/takeoffs/:id/analyze', async (request, reply) => {
    const { id } = request.params as any;
    const job = await queues.ESTIMATION.add('analyze-plans', {
      type: 'ANALYZE_PLANS',
      takeoffId: id,
      documentUrls: request.body.documentUrls,
    }, JOB_OPTIONS.DEFAULT);
    return { jobId: job.id };
  });

  // Order routes
  fastify.post('/orders', async (request, reply) => {
    const order = await prisma.estimationOrder.create({
      data: {
        ...request.body as any,
        orderNumber: `EST-${Date.now()}`,
      },
    });
    return order;
  });

  fastify.get('/orders/:orderNumber', async (request, reply) => {
    const { orderNumber } = request.params as any;
    const order = await prisma.estimationOrder.findUniqueOrThrow({
      where: { orderNumber },
    });
    return order;
  });

  // AI routes
  fastify.post('/ai/predict-cost', async (request, reply) => {
    const job = await queues.ESTIMATION.add('predict-cost', {
      type: 'PREDICT_COSTS',
      ...request.body,
    }, JOB_OPTIONS.DEFAULT);
    return { jobId: job.id };
  });

  fastify.post('/ai/value-engineer', async (request, reply) => {
    const job = await queues.ESTIMATION.add('value-engineer', {
      type: 'VALUE_ENGINEER',
      ...request.body,
    }, JOB_OPTIONS.DEFAULT);
    return { jobId: job.id };
  });
}
```

## ENVIRONMENT VARIABLES

Add these to your environment:

```env
# Estimation Tool
RSMEANS_API_KEY=           # If using RS Means data
ESTIMATION_DEFAULT_REGION=DC-Baltimore
ESTIMATION_DEFAULT_OVERHEAD_PCT=10
ESTIMATION_DEFAULT_PROFIT_PCT=10
ESTIMATION_DEFAULT_CONTINGENCY_PCT=5
```

Now build the complete Estimation Tool following this specification. Start with the cost database module, then assemblies, then estimates, then AI features.
```

---

# PART 3: QUICK REFERENCE

## Models Added for APP-15

| Model | Purpose |
|-------|---------|
| CostDatabase | Regional pricing databases |
| MaterialCost | Material unit prices |
| LaborRate | Labor hourly rates by trade |
| EquipmentRate | Equipment rental rates |
| Assembly | Pre-built unit costs |
| AssemblyItem | Components of assemblies |
| Estimate | Project cost estimates |
| EstimateSection | CSI division sections |
| EstimateLineItem | Individual cost items |
| EstimateComparison | Compare estimates |
| EstimateHistory | Audit trail |
| Takeoff | Quantity extraction sessions |
| TakeoffMeasurement | Individual measurements |
| EstimationOrder | Service orders |
| RegionalCostIndex | Regional cost adjustments |
| HistoricalProjectCost | Historical comparables |
| AIEstimationSession | AI processing sessions |

## New Enums Added

| Enum | Values |
|------|--------|
| CostDatabaseType | NATIONAL, REGIONAL, LOCAL, CUSTOM, IMPORTED |
| MaterialCategory | CONCRETE, MASONRY, METALS, etc. (22 categories) |
| LaborTrade | CARPENTER, ELECTRICIAN, PLUMBER, etc. (25 trades) |
| EquipmentCategory | EXCAVATION, LIFTING, CONCRETE, etc. (13 categories) |
| AssemblyCategory | SITEWORK, FOUNDATIONS, FRAMING, etc. (26 categories) |
| AssemblyComplexity | SIMPLE, STANDARD, COMPLEX, CUSTOM |
| AssemblyItemType | MATERIAL, LABOR, EQUIPMENT, SUBCONTRACTOR, OTHER |
| EstimateType | QUICK_BUDGET, CONCEPTUAL, PRELIMINARY, DETAILED, BID, etc. |
| EstimateStatus | DRAFT, IN_PROGRESS, UNDER_REVIEW, APPROVED, etc. |
| EstimationServiceType | QUICK_BUDGET, BASIC_TAKEOFF, DETAILED_ESTIMATE, etc. |
| LineItemType | MATERIAL, LABOR, EQUIPMENT, ASSEMBLY, etc. |
| TakeoffSource | MANUAL, PLAN_MEASUREMENT, AI_EXTRACTED, etc. |
| TakeoffType | GENERAL, SITEWORK, STRUCTURAL, etc. |
| TakeoffStatus | NOT_STARTED, IN_PROGRESS, COMPLETED, VERIFIED |
| MeasurementType | LINEAR, AREA, VOLUME, COUNT, WEIGHT |
| ComparisonType | REVISION, SIMILAR_PROJECT, MARKET_RATE, etc. |
| EstimateAction | CREATED, UPDATED, STATUS_CHANGED, etc. |
| EstimationOrderStatus | PENDING, PAID, ASSIGNED, IN_PROGRESS, etc. |
| OrderPriority | LOW, NORMAL, HIGH, RUSH |
| QualityLevel | ECONOMY, STANDARD, PREMIUM, LUXURY, CUSTOM |
| AISessionType | PLAN_ANALYSIS, SCOPE_EXTRACTION, COST_PREDICTION, etc. |
| AISessionStatus | ACTIVE, PROCESSING, COMPLETED, FAILED, CANCELLED |

## Total New Models: 17
## Total New Enums: 22

---

**Document Version:** 1.0
**Created:** January 29, 2026
**For:** Kealee Platform v10 - APP-15 Estimation Tool
