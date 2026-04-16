# Kealee Platform - Codebase Exploration Summary
**Date**: April 15, 2026  
**Workspace**: WSL Ubuntu `/home/tim_chamberlain/kealee-platform-v10`

---

## 1. EXISTING PRISMA MODELS

### Core Project & Concept Models

#### `PreConProject` (Location: schema.prisma:5253)
**Purpose**: Pre-construction/design phase project for marketplace listing  
**Key Fields**:
- `ownerId`, `orgId` - Project ownership
- `category` (KITCHEN, BATHROOM, ADDITION, etc), `complexity` (BASIC, STANDARD, PREMIUM, LUXURY)
- `phase` (INTAKE → DESIGN_STARTED → DESIGN_APPROVED → SRP_GENERATED → MARKETPLACE_READY → BIDDING_OPENED → AWARDED)
- `designPackageTier` (STANDARD, PREMIUM, WHITE_GLOVE)
- `suggestedRetailPrice`, `srpLaborCost`, `srpMaterialCost`, `srpBreakdown`, `srpConfidence` (0-100)
- `leadSaleEnabled`, `leadSalePrice`, `leadSoldAt` (B2B hidden feature)
- `allowBidding`, `minimumBid`, `biddingDeadline`, `maxBids`
- `projectId` (links to main Project after award)
- `estimateId` (links to estimation engine estimate)
- **Relations**: `designConcepts[]`, `bids[]`, `autoDesignSession`, `designQueueAssignments`, `designHandoffs`

#### `DesignConcept` (Location: schema.prisma:5352)
**Purpose**: Individual design concept created for PreConProject review  
**Key Fields**:
- `name`, `description`, `style` (design style category)
- `primaryImageUrl`, `designFiles` (JSON), `floorPlanUrl`, `renderingsUrls[]`, `specificationUrl`
- `estimatedCost`, `estimatedTimeline` (days), `estimatedLaborCost`, `estimatedMaterialCost`
- `features[]`, `materials` (JSON: [{name, quantity, unitCost}]), `finishes` (JSON)
- `isSelected`, `selectedAt`
- `ownerRating` (1-5), `ownerFeedback`, `ownerNotes`
- **Relations**: Belongs to `PreConProject`

### Estimation & Cost Models

#### `Estimate` (Location: schema.prisma:6773)
**Purpose**: Cost estimation with sections and line items  
**Key Fields**:
- `organizationId`, `projectId`, `clientId`, `bidRequestId`
- `name`, `description`
- `type` enum: QUICK_BUDGET, CONCEPTUAL, PRELIMINARY, DETAILED, BID_ESTIMATE, CHANGE_ORDER_ESTIMATE, VALUE_ENGINEERING, AS_BUILT
- `status` enum: DRAFT_ESTIMATE, IN_PROGRESS_ESTIMATE, UNDER_REVIEW_ESTIMATE, PENDING_APPROVAL_ESTIMATE, APPROVED_ESTIMATE, SENT_ESTIMATE, ACCEPTED_ESTIMATE, REJECTED_ESTIMATE
- **Cost Structure**:
  - `subtotalMaterial`, `subtotalLabor`, `subtotalEquipment`, `subtotalSubcontractor`, `subtotalOther`, `subtotalDirect`
  - `overhead` (with %), `profit` (with %), `contingency` (with %), `bondCost`, `permitFees`, `insuranceCost`, `salesTax`
  - `totalCost`, `costPerSqFt`
- `squareFootage`, `projectType`, `buildingType`, `stories`
- `aiGenerated`, `aiConfidence`, `aiNotes`, `aiComparisons` (JSON)
- `serviceType` (EstimationServiceType enum), `turnaroundHours`, `revisionsAllowed`, `revisionsUsed`
- `preparedById`, `reviewedById`, `approvedById`, `preparedAt`, `reviewedAt`, `approvedAt`, `sentAt`, `expiresAt`
- **Relations**: `sections[]`, `lineItems[]`, `comparisons`, `takeoffJobs`

#### `EstimateSection` (CSI MasterFormat aligned)
**Key Fields**:
- `estimateId`, `csiDivision`, `csiCode`
- `name`, `description`
- Subtotals for material/labor/equipment/subcontractor
- `sortOrder`, `isExpanded`

#### `EstimateLineItem`
**Key Fields**:
- `estimateId`, `sectionId`
- `csiCode`, `category`, `description`, `location`
- `quantity`, `unit`, `takeoffSource`, `takeoffNotes`
- `unitCost`, `totalCost`, `laborHours`, `laborCost`, `materialCostAmt`, `equipmentCostAmt`, `subcontractorCost`
- `wasteFactor`, `difficultyFactor`, `markup`, `discount`
- Flags: `isAlternate`, `isAllowance`, `isExcluded`, `isByOwner`

### Permit & Zoning Models

#### `Permit` (Location: schema.prisma:722)
**Purpose**: Jurisdiction permit application tracking  
**Key Fields**:
- `permitNumber`, `projectId`, `clientId`, `jurisdictionId`, `pmUserId`
- `permitType` enum: BUILDING, ELECTRICAL, PLUMBING, MECHANICAL, FIRE, GRADING, DEMOLITION, SIGN, FENCE, ROOFING, HVAC, SOLAR, POOL
- `status` enum: DRAFT, AI_PRE_REVIEW, READY_TO_SUBMIT, SUBMITTED, UNDER_REVIEW, CORRECTIONS_REQUESTED, RESUBMITTED, APPROVED, ISSUED, ACTIVE, INSPECTION_HOLD, EXPIRED, COMPLETED, CANCELLED, REJECTED
- `scope`, `valuation`, `squareFootage`, `units`, `stories`
- `applicantId`, `applicantType` (OWNER, CONTRACTOR, ARCHITECT, ENGINEER, DESIGN_BUILDER, DEVELOPER)
- `architectId`, `architectName`, `architectLicense`
- `engineerId`, `engineerName`, `engineerLicense`
- `contractorId`, `contractorName`, `contractorLicense`
- **AI Review** (Client-side pre-review):
  - `aiReviewScore` (0-100), `aiIssuesFound` (JSON), `autoCorrections` (JSON), `readyToSubmit`
- **Jurisdiction Tracking**:
  - `jurisdictionRefNumber`, `jurisdictionStatus`, `submittedVia`, `submittedAt`, `reviewStartedAt`, `approvedAt`, `issuedAt`, `expiresAt`, `completedAt`
- **Expedited Processing**:
  - `expedited`, `expeditedFee`, `expeditedGuaranteeDays`, `metGuarantee`, `refundIssued`
- **Documents**: `plans[]`, `calculations[]`, `reports[]`, `otherDocuments[]`
- **Relations**: `aiReviews`, `submissions`, `corrections`, `reviewAssignments`, `inspections`, `events`, `permitRoutings`, `activities`

#### `ParcelZoning` (Location: schema.prisma:14038)
**Purpose**: Zoning information for parcel/property  
**Key Fields**:
- `parcelId`, `parcel` relationship
- `zoningCode` (R-1, C-2, MU-3, etc.), `zoningDesc`, `overlay`, `jurisdiction`
- **Development Standards**:
  - `maxDensity` (units/acre), `maxHeight` (feet), `maxFAR`, `maxLotCoverage` (%), `minLotSize` (sqft)
- **Setbacks** (feet): `frontSetback`, `sideSetback`, `rearSetback`
- **Allowed Uses**: `allowedUses[]`, `conditionalUses[]`, `prohibitedUses[]`
- `parkingRatio`, `parkingNotes`
- **AI Analysis**: `aiAnalysis` (JSON), `complianceNotes`
- `sourceUrl`, `verifiedAt`, `verifiedBy`

#### `Jurisdiction` (Location: schema.prisma~350)
**Purpose**: Permit jurisdiction configuration  
**Key Fields**:
- `name`, `code` (unique), `state`, `county`, `city`
- **Dual-Side Extension**:
  - `subscriptionTier`, `monthlyFee`, `subscribedAt`, `subscriptionStatus`
- **Integration**:
  - `integrationType` (API_DIRECT, PORTAL_SCRAPE, MANUAL_ENTRY)
  - `apiProvider` (ACCELA, TYLER, GOVOS, CUSTOM)
  - `apiUrl`, `apiKey`, `portalUrl`
- **Requirements**: `requiredDocuments` (JSON), `feeSchedule` (JSON), `formTemplates` (JSON)
- **Performance Stats**: `avgReviewDays`, `firstTimeApprovalRate`, `totalPermitsProcessed`
- **Relations**: `permits[]`, `staff[]`, `templates[]`, `inspections[]`, `integrations[]`, `zoningProfiles[]`, `patternBookDesigns[]`

#### `Inspection` (Location: schema.prisma~935)
**Purpose**: Inspection scheduling & results  
**Key Fields**:
- `inspectionNumber`, `permitId`, `projectId`, `jurisdictionId`
- `inspectionType` enum: SITE, FOOTING, FOUNDATION, SLAB, ROUGH_FRAMING, etc., FINAL_BUILDING, CERTIFICATE_OF_OCCUPANCY
- `description`, `phaseRequired`
- **Preparation**: `checklistId`, `sitePhotos[]`, `pmPreInspection`, `readyToSchedule`, `notes`
- **Scheduling**: `requestedDate`, `requestedBy`, `scheduledDate`, `scheduledWindow`, `inspectorId`, `jurisdictionRefNumber`
- **Remote Inspection**: `isRemote`, `videoSessionId`, `videoRecordingUrl`, `liveStreamUrl`, `aiVideoAnalysis`
- **Results**: `result`, `inspectorNotes`, `deficiencies` (JSON), `passedItems`, `failedItems`, `totalItems`, `completedAt`
- `parentInspectionId`, `isReinspection`
- **Relations**: `permit`, `project`, `jurisdiction`, `inspector`, `remoteSession`, `preparationItems[]`, `findings[]`, `phaseMilestones[]`

#### `PermitSubmission` (Location: schema.prisma:855)
**Purpose**: Track individual permit submissions  
**Key Fields**:
- `permitId`
- `submissionType` (INITIAL, RESUBMITTAL, SUPPLEMENTAL)
- `submittedVia` (API, PORTAL, EMAIL, MANUAL, FAX)
- `submittedBy`, `submittedAt`, `documents` (JSON), `formData` (JSON), `notes`
- `confirmationNumber`, `jurisdictionResponse` (JSON), `submissionStatus`

#### `PermitCorrection` (Location: schema.prisma:881)
**Purpose**: Track correction requests from jurisdiction  
**Key Fields**:
- `permitId`
- `source` (JURISDICTION_EMAIL, PORTAL_COMMENT, PHONE_CALL, AI_DETECTION)
- `receivedAt`, `rawText`
- `parsedIssues` (JSON), `affectedSheets[]`, `severity` (MINOR, MAJOR, CRITICAL)
- `assignedTo` (ARCHITECT, ENGINEER, CONTRACTOR, OWNER), `assignedUserId`, `dueDate`, `status`, `resolvedAt`, `resolutionNotes`

---

## 2. EXISTING PUBLIC ROUTE HANDLERS

### Pattern: Authenticated + Public Endpoints
**Base Pattern**: All routes use FastifyInstance plugin model with Zod validation

### Location: `/estimation/intake` and `/permits/intake`

#### **Estimation Service Routes** (Location: `services/api/src/modules/estimation/public-estimation-intake.routes.ts`)

```typescript
// ENDPOINTS
POST   /estimation/intake          // Public, no auth required
POST   /estimation/checkout        // Public, Stripe session creation
GET    /estimation/{intakeId}/status // Check intake status

// PRICING TIERS
const ESTIMATION_PACKAGE_PRICES = {
  cost_estimate: { name: 'Detailed Cost Estimate', amount: 59500 ($595), turnaround: 3 days },
  certified_estimate: { name: 'Certified Cost Estimate', amount: 185000 ($1,850), turnaround: 5 days },
  bundle: { name: 'Estimate + Permit Bundle', amount: 110000 ($1,100+), turnaround: 5 days },
}

// INTAKE SCHEMA
EstimationIntakeSchema {
  contact: { name, email, phone },
  project: {
    projectScope: 'interior_remodel' | 'exterior_renovation' | 'addition' | 'mep_upgrade' | 'other',
    projectStage: 'ideation' | 'schematic' | 'design_development' | 'construction_documents' | 'bidding' | 'pricing',
    scopeDetail: 'sketch' | 'schematic_drawing' | 'design_drawing' | 'construction_documents',
    estimatedBudget?: number,
  },
  hasDesignDrawings: boolean,
  hasContractorFeedback?: boolean,
  requiresArchitecturalReview?: boolean,
  requiresEngineeringReview?: boolean,
  tierPreference?: 'cost_estimate' | 'certified_estimate' | 'bundle',
}

// RESPONSE
EstimationIntakeResponse {
  intakeId: string,
  leadScore: number (0-100),
  tier: string,
  route: 'immediate' | 'standard' | 'requires_followup',
  readinessState: 'NEEDS_MORE_INFO' | 'READY_FOR_ESTIMATE',
  flags: { requiresArchitect, requiresEngineer, complexityLevel, estimatedTurnaround },
  estimatedPrice: number (USD in cents),
  nextStep: string,
}
```

#### **Permit Service Routes** (Location: `services/api/src/modules/permits/public-permits-intake.routes.ts`)

```typescript
// ENDPOINTS
POST   /permits/intake          // Public, no auth required
POST   /permits/checkout        // Public, Stripe session creation
GET    /permits/{intakeId}/status // Check intake status

// PRICING TIERS
const PERMIT_PACKAGE_PRICES = {
  document_assembly: { name: 'Permit Document Assembly', amount: 49500 ($495), turnaround: 2 days },
  submission: { name: 'Permit Submission', amount: 79500 ($795), turnaround: 1 day },
  tracking: { name: 'Permit Tracking & Management', amount: 149500 ($1,495), turnaround: 3 days },
  inspection_coordination: { name: 'Full Inspection Coordination', amount: 249500 ($2,495), turnaround: 7 days },
}

// INTAKE SCHEMA
PermitIntakeSchema {
  contact: { name, email, phone },
  project: {
    jurisdiction: 'DC' | 'PG' | 'MC' | 'ARL' | 'ALX' | 'FFC' | 'BAL' (DMV_JURISDICTIONS),
    permitTypes: string[],
    projectCharacteristics: {
      isRenovation: boolean,
      isAddition: boolean,
      involvesStructuralChange?: boolean,
      involvesHistoricDistrict?: boolean,
      involvesWetlands?: boolean,
    },
  },
  hasDesignDocuments: boolean,
  hasContractorSelected: boolean,
  relatedEstimateId?: string,  // Links to estimation intake
}

// RESPONSE
PermitIntakeResponse {
  intakeId: string,
  jurisdiction: string,
  estimatedProcessingTime: number (days),
  permitTypesNeeded: string[],
  readinessState: 'NEEDS_ESTIMATE' | 'READY_FOR_PERMIT_PREP',
  flags: { requiresArchitecturalReview, requiresStructuralEngineer, jurisdictionSpecialRequirement },
  estimatedPrice: number (USD in cents),
  nextStep: string,
}
```

#### **Concept Service Routes** (Location: `services/api/src/modules/concepts/concept-intake.routes.ts`)
```typescript
// ENDPOINTS (Authenticated only)
POST   /concepts/intake         // Authenticated
POST   /concepts/checkout       // Authenticated, Stripe session
GET    /concepts/orders         // Authenticated
GET    /concepts/orders/:id     // Authenticated

// PRICING TIERS
const PACKAGE_PRICES = {
  essential: { amount: 58500 ($585) },
  professional: { amount: 77500 ($775 = $585 + $195 priority) },
  premium: { amount: 99900 ($999) },
  white_glove: { amount: 199900 ($1,999) },
}
```

### Storage Pattern
- **Redis** with 7-day TTL: `{service}_intake:{id}` stores full intake data + scoring
- **Keys**: `estimation_intake:{id}`, `permit_intake:{id}`, `concept_intake:{id}`
- **Metadata**: Includes funnelSessionId, leadScore, intakeData, createdAt

---

## 3. LEAD SCORING IMPLEMENTATION

### Scoring Framework

#### **Concept Lead Scoring** (In: `scoreIntakeLead()`, concept-intake.routes.ts)
```
Budget Score (10-30 pts):
  - under_10k: 10, 10k_25k: 18, 25k_50k: 25, 50k_100k: 28, 100k_plus: 30

Urgency/Timeline Score (4-30 pts):
  - asap: 30, 1_3_months: 24, 3_6_months: 18, 6_12_months: 10, planning: 4

Readiness Score (0-25 pts):
  - Photos: ≥3 photos: +10, 1-2 photos: +5, none: 0
  - Style Preferences: ≥2: +5
  - Goals: >0: +5
  - Contact Phone: +5

Complexity Penalty (-8 to 0):
  - exterior_refresh: 0, facade_redesign: -2, landscape: -2, driveway_hardscape: -3, 
    addition: -8, porch_deck: -5

Lead Flags:
  - multifamily, addition_requires_review, low_budget

TOTAL: Sum(budget + urgency + readiness + complexity), capped at 100
TIER: ≥70: "hot", ≥45: "warm", <45: "cold"
ROUTE: (hot + low_penalty): "fast_track", warm: "standard", cold: "nurture"
```

#### **Estimation Lead Scoring** (In: `scoreEstimationLead()`, public-estimation-intake.routes.ts)
```
Scope Completeness (0-30 pts):
  - construction_documents: 30, design_drawing: 25, schematic_drawing: 20, sketch: 10

Project Stage (0-20 pts):
  - construction_documents/bidding/pricing: 20, design_development: 15, schematic: 10

Contact Completeness (0-20 pts):
  - name+email+phone: 15, email only: 10

Project Characteristics (0-20 pts):
  - interior_remodel/exterior_renovation: 15, addition/mep_upgrade: 12

Budget Info (0-10 pts):
  - provided: 5

TOTAL: Sum of all scores (0-100)
READINESS_STATE:
  - ≥75: READY_FOR_ESTIMATE (tier: certified_estimate)
  - ≥50: READY_FOR_ESTIMATE (tier: cost_estimate)
  - <50: NEEDS_MORE_INFO

FLAGS:
  - requiresArchitecturalReview
  - requiresEngineeringReview
  - hasDesignDrawings
  - hasContractorFeedback
```

#### **Permit Lead Scoring** (In: `scorePermitLead()`, public-permits-intake.routes.ts)
```
Jurisdiction Complexity (0-20 pts):
  - Expedited available: 15, Standard only: 10

Contact Completeness (0-15 pts):
  - name+email+phone: 15, email only: 10

Project Clarity (0-30 pts):
  - has_design_documents: 20, has_contractor_selected: 10

Project Type Complexity (0-20 pts):
  - Single permit: 15, 2-3 permits: 10, 4+: 5
  - Penalties: structural_change: -5, historic_district: -5, wetlands: -10

TIER SELECTION:
  - ≤30: inspection_coordination ($2,495)
  - 31-45: tracking ($1,495)
  - 46-60: submission ($795)
  - 61+: document_assembly ($495)

READINESS_STATE:
  - if relatedEstimateId exists: READY_FOR_PERMIT_PREP
  - else: NEEDS_ESTIMATE

FLAGS:
  - requiresArchitecturalReview
  - requiresStructuralEngineer
  - jurisdictionSpecialRequirement (e.g., 'historic_district', 'wetlands_review')
```

### Routing Logic
- **Route**: Determines handling tier (fast_track, standard, nurture, immediate, requires_followup)
- **Readiness State**: Indicates if ready to proceed or needs more info
- **Flags**: Specific conditions requiring human attention or special handling

---

## 4. RECOMMENDED FILE STRUCTURE FOR NEW SERVICES

### DesignBot Service Placement

**Location**: `bots/keabot-design/src/`

**Structure** (Already exists, but below is organization):
```
bots/keabot-design/
├── src/
│   ├── bot.ts                    # Main KeaBotDesign class extending KeaBot
│   ├── design.types.ts           # Type definitions for design operations
│   ├── design.prompts.ts         # System prompts and prompt builders
│   ├── design.tools.ts           # Tool definitions and handlers
│   ├── scoring.ts                # Design concept scoring logic
│   └── index.ts                  # Export bootstrap()
├── tests/
│   └── design.test.ts
├── package.json
└── tsconfig.json
```

**Key Pattern**:
```typescript
export class KeaBotDesign extends KeaBot {
  constructor() {
    super(DESIGN_BOT_CONFIG: BotConfig);
  }
  async initialize(): Promise<void>;
  private _registerDesignTools(): void;
  // Tools: generate_design_concept, get_design_status
}

export async function bootstrap() {
  const bot = new KeaBotDesign();
  await bot.initialize();
  console.log(`[${bot.name}] Ready with ${bot.getToolDefinitions().length} tools`);
}
```

### ZoningBot Service Placement

**Recommended Location**: `bots/keabot-zoning/src/`

**Structure**:
```
bots/keabot-zoning/
├── src/
│   ├── bot.ts                    # Main KeaBotZoning class
│   ├── zoning.types.ts           # ZoningAnalysisResult, ComplianceCheck, etc.
│   ├── zoning.prompts.ts         # System prompt for zoning analysis
│   ├── zoning.tools.ts           # Tool definitions
│   ├── zoning.db.ts              # Zoning database queries (ParcelZoning, Jurisdiction)
│   ├── compliance-checker.ts     # Zoning compliance validation logic
│   └── index.ts                  # Export bootstrap()
├── tests/
│   └── zoning.test.ts
├── package.json
└── tsconfig.json
```

### Integration Service Endpoints

**For ZoningBot API** (Command Center integration):
```
Location: services/api/src/modules/zoning/

├── zoning.routes.ts             # Public/internal endpoints
│   ├── GET  /zoning/{parcelId}          # Get parcel zoning info
│   ├── POST /zoning/{parcelId}/analyze  # Request ZoningBot analysis
│   ├── GET  /zoning/{parcelId}/compliance # Check compliance
│   └── POST /zoning/batch/analyze       # Batch analysis
│
├── zoning.service.ts            # Business logic
├── zoning.validation.ts         # Zoning-specific validation
└── zoning.cache.ts              # Redis caching for zoning lookups
```

---

## 5. CURRENT CHAIN/ROUTING LOGIC

### Chain Gating Architecture

**Location**: `services/api/src/modules/gating/chain-gating.ts`

#### **Readiness State Enum** (Standardized across all bots)
```typescript
enum ReadinessState {
  NOT_READY
  NEEDS_MORE_INFO
  READY_FOR_ESTIMATE
  READY_FOR_PERMIT_REVIEW
  REQUIRES_DESIGN_HANDOFF
  REQUIRES_ARCHITECT
  REQUIRES_ENGINEER
  READY_FOR_CHECKOUT
}
```

#### **Gate Error Codes**
```typescript
enum GateErrorCode {
  MISSING_DESIGN_CONCEPT
  MISSING_ESTIMATE
  DESIGN_CONCEPT_NOT_READY
  ESTIMATE_NOT_READY
  INVALID_DESIGN_CONCEPT
  INVALID_ESTIMATE
  DESIGN_NEEDS_REVISION
  ESTIMATE_NEEDS_REVISION
}
```

#### **Execution Chain: DesignBot → EstimateBot → PermitBot**

```
1. DesignBot Execution (Initial)
   ├─ Input: Intake data (project type, dimensions, preferences)
   ├─ Output: DesignConceptId + readinessState
   ├─ State: APPROVED, READY_FOR_ESTIMATE, or DESIGN_NEEDS_REVISION
   └─ Next: Ready for EstimateBot if state is READY_FOR_ESTIMATE

2. EstimateBotGating (Function: gateEstimateOnDesign)
   ├─ Validates: designBotOutputId exists, hasDesignConcept=true
   ├─ Checks: designConceptState in [APPROVED, READY_FOR_ESTIMATE]
   ├─ Blocks: Returns GateResponse {
   │    blocked: true,
   │    code: MISSING_DESIGN_CONCEPT,
   │    nextSteps: ["Return to Design Generation", "Wait for design approval"],
   │    canRetry: true
   │  }
   └─ Allows: Returns AllowResponse { blocked: false }

3. EstimateBot Execution (Gated)
   ├─ Input: DesignConcept + project location/scope
   ├─ Output: EstimateId + readinessState + confidence_score
   ├─ State: APPROVED, READY_FOR_PERMIT, or ESTIMATE_NEEDS_REVISION
   └─ Next: Ready for PermitBot if state is READY_FOR_PERMIT

4. PermitBotGating (Function: gatePermitOnEstimate)
   ├─ Validates: estimateBotOutputId exists, hasEstimate=true
   ├─ Checks: estimateState in [APPROVED, READY_FOR_PERMIT]
   ├─ Validates: estimateConfidenceScore ≥ 60%
   ├─ Blocks: Returns GateResponse if conditions fail
   └─ Allows: Returns AllowResponse if all valid

5. PermitBot Execution (Gated)
   ├─ Input: Estimate + jurisdiction location
   ├─ Output: PermitGuidanceId + permittedUses + compliance_flags
   ├─ State: APPROVED, READY_FOR_SUBMISSION, or REVISION_NEEDED
   └─ Next: Ready for permit submission

Middleware Implementation:
├─ createGatingMiddleware(gateFn): Returns Fastify middleware
├─ HTTP 402 Payment Required: Used for gating blocks
├─ Response includes: reason, code, nextSteps, canRetry, retryAfterMs
└─ Applied to: /estimation/checkout, /permits/checkout
```

#### **Checkout Gating Example**
```typescript
// In /permits/checkout POST handler:
if (intake.scoring.readinessState === 'NEEDS_ESTIMATE' && !intake.relatedEstimateId) {
  return reply.code(400).send({
    error: 'BLOCKED_BY_GATE',
    message: 'Permit preparation requires a cost estimate. Please complete cost estimation first.',
    code: GateErrorCode.MISSING_ESTIMATE,
    nextSteps: ['Go back to Cost Estimation', 'Get cost estimate', 'Return to permit process'],
  });
}
```

### Current Interaction Patterns

**Pattern 1: Parallel Intakes (User-initiated)**
- User can submit estimation intake independently
- User can submit permit intake independently
- User links them via `relatedEstimateId`

**Pattern 2: Service Handoff (Sequential)**
- DesignBot → EstimateBot via `designConceptState` validation
- EstimateBot → PermitBot via `estimateConfidenceScore` + `estimateState` validation
- Each service validates predecessor output before execution

**Pattern 3: Readiness State Management**
- Each service returns `readinessState` in response
- Gating checks readiness state before allowing next service
- User/system checks state to determine next action

---

## 6. REPOSITORY STRUCTURE REFERENCE

### Services Layout
```
services/
├── api/                          # Main API service
│   ├── src/modules/
│   │   ├── concepts/             # Concept intake/operations
│   │   ├── estimation/           # Estimation service + public intake
│   │   ├── permits/              # Permit service + public intake
│   │   ├── gating/               # Chain gating middleware
│   │   ├── zoning/               # (Recommended for ZoningBot integration)
│   │   ├── design/               # Design operations
│   │   └── [40+ other modules]
│   ├── src/utils/
│   │   └── prisma-helper.ts      # Prisma client instance
│   └── src/middleware/
│       └── auth.middleware.ts    # Authentication handler
│
├── command-center/               # Admin/operations dashboard
│   ├── apps/
│   │   ├── APP-01-bid-engine/
│   │   ├── APP-02-cost-database/
│   │   ├── APP-05-permit-tracker/
│   │   ├── APP-06-inspection-coordinator/
│   │   ├── APP-15-command-center/
│   │   └── [10+ other apps]
│
└── [keacore, os-pay, marketplace, etc.]

packages/
├── database/
│   └── prisma/schema.prisma      # Single source of truth
│
├── intake/
│   ├── src/schemas/
│   │   ├── estimation-schemas.ts
│   │   ├── permit-schemas.ts
│   │   ├── intake-schemas.ts
│   │   └── form-fields-by-path.ts
│   ├── src/lib/
│   │   └── score-lead.ts
│   └── src/config/
│       ├── project-path-config.ts
│       ├── capture-zones.ts
│       └── jurisdictions.ts
│
└── [40+ other packages]

bots/
├── keabot-design/                # Design concept generation
│   ├── src/bot.ts
│   ├── src/design.types.ts
│   └── src/scoring.ts
│
├── keabot-estimate/              # Cost estimation (existing)
├── keabot-permit/                # Permit guidance (existing)
├── keabot-feasibility/
├── keabot-payments/
├── keabot-developer/
└── [10+ other KeaBots]

apps/
├── web-main/                     # Main marketing/public app
│   ├── app/estimate/
│   ├── app/permits/
│   ├── app/intake/estimation/
│   ├── app/intake/permits/
│   └── app/concept/
│
├── os-pm/                        # Project management
├── os-admin/                     # Admin portal
└── [15+ mini-apps]
```

---

## 7. KEY INTEGRATION POINTS & NEXT STEPS

### Immediate Tasks

1. **Register Routes** (Not yet integrated)
   - [ ] `public-estimation-intake.routes.ts` → `services/api/src/index.ts`
   - [ ] `public-permits-intake.routes.ts` → `services/api/src/index.ts`

2. **Export Schemas** (Already created, need exports)
   - [ ] `@kealee/intake/schemas` exports `EstimationIntakeSchema`, `PermitIntakeSchema`
   - [ ] Add to `packages/intake/src/index.ts`

3. **Wire Gating Middleware**
   - [ ] Connect `createGatingMiddleware` to `/estimation/checkout`
   - [ ] Connect `createGatingMiddleware` to `/permits/checkout`
   - [ ] Verify gating blocks on missing prerequisites

4. **Environment Variables** (Stripe)
   - [ ] Verify `STRIPE_SECRET_KEY` set
   - [ ] Create/configure Stripe price objects for tiers

### ZoningBot Implementation Roadmap

1. **Create Bot Structure** (Parallel to DesignBot)
   - Copy `bots/keabot-design/` → `bots/keabot-zoning/`
   - Define `ZoningAnalysisResult` type
   - Implement zoning lookup + compliance checking

2. **Integrate with Parcel System**
   - Link `ParcelZoning` model for data
   - Create `zoning.db.ts` for ParcelZoning + Jurisdiction queries
   - Build compliance checker against local zoning codes

3. **Add to Service Chain** (Optional)
   - Create `gateZoningOnPermit()` if needed
   - Wire into /permits flow for jurisdiction validation
   - Or keep as independent service accessible from DesignBot

4. **API Endpoints** (In `services/api/src/modules/zoning/`)
   - `GET /zoning/{parcelId}` - Fetch zoning info
   - `POST /zoning/{parcelId}/analyze` - Request ZoningBot analysis
   - `GET /zoning/{parcelId}/compliance` - Check specific compliance

---

## 8. SUMMARY TABLE: MODELS, ROUTES & READINESS

| **Model/Service** | **Location** | **Status** | **Key Fields** | **Readiness State** |
|---|---|---|---|---|
| **Concept** | PreConProject/DesignConcept | ✅ Active | name, style, estimatedCost, isSelected | N/A (manual) |
| **Estimation** | Estimate + EstimateSection/LineItem | ✅ Active | type, status, totalCost, aiConfidence | READY_FOR_ESTIMATE |
| **Permits** | Permit + PermitSubmission/Correction | ✅ Active | type, status, jurisdictionRefNumber | READY_FOR_PERMIT_PREP |
| **Zoning** | ParcelZoning | ✅ Active | zoningCode, allowedUses, compliance | ZONING_VERIFIED |
| **Concept Intake Route** | /concepts/intake | ✅ Active | Authenticated | Concept scoring |
| **Estimation Intake Route** | /estimation/intake | ✅ Active | Public, Redis | EstimationIntakeResponse |
| **Permit Intake Route** | /permits/intake | ✅ Active | Public, Redis | PermitIntakeResponse |
| **Estimation Checkout** | /estimation/checkout | ✅ Active (Gated) | Stripe session | READY_FOR_CHECKOUT |
| **Permit Checkout** | /permits/checkout | ✅ Active (Gated) | Stripe session | READY_FOR_CHECKOUT |
| **Chain Gating** | gating/chain-gating.ts | ✅ Active | ReadinessState enum | Enforced on checkout |
| **DesignBot** | bots/keabot-design/src | ✅ Active | Tool-based | Bot readiness |
| **ZoningBot** | ❌ Recommended location | 📋 To Build | See bot pattern | To define |

---

## FILES CREATED IN PREVIOUS SESSIONS

### Schemas (packages/intake/src/schemas/)
- `estimation-schemas.ts` - 180 lines
- `permit-schemas.ts` - 280 lines

### Routes (services/api/src/modules/)
- `estimation/public-estimation-intake.routes.ts` - 250+ lines
- `permits/public-permits-intake.routes.ts` - 300+ lines

### Gating (services/api/src/modules/gating/)
- `chain-gating.ts` - 230+ lines (ReadinessState, GateErrorCode, gating functions)

### Frontend (apps/web-main/app/)
- `app/estimation/review/page.tsx` - With Stripe checkout
- `app/permits/review/page.tsx` - With Stripe checkout
- `app/intake/estimation/page.tsx` - DynamicIntakeForm
- `app/intake/permits/page.tsx` - With jurisdiction selector

---

## NEXT ACTIONS FOR YOUR TEAM

1. **Verify Existing Code**: All routes and schemas exist in codebase
2. **Register Routes**: Wire routes into main API (services/api/src/index.ts)
3. **Test End-to-End**: Verify intake → checkout flow with gating
4. **Plan ZoningBot**: Use DesignBot pattern + ParcelZoning + Jurisdiction data
5. **Document Integration**: Link services in architecture docs

