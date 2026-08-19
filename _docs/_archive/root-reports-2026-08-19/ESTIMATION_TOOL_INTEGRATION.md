# 🔗 Estimation Tool Integration Architecture

**Date:** February 1, 2026  
**Status:** Backend Complete (85%), Frontend Pending  
**Location:** `packages/automation/apps/estimation-tool/`

---

## 📊 SYSTEM INTEGRATION OVERVIEW

The Estimation Tool (APP-06) is a **central hub** that connects cost data, project management, and financial tracking across the Kealee Platform.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ESTIMATION TOOL INTEGRATION MAP                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    ┌───────────────────────┐                       │
│                    │   m-estimation UI     │                       │
│                    │   (Frontend - TBD)    │                       │
│                    └───────────┬───────────┘                       │
│                                │                                    │
│                                ▼                                    │
│                    ┌───────────────────────┐                       │
│                    │    API Gateway        │                       │
│                    │   (REST Endpoints)    │                       │
│                    └───────────┬───────────┘                       │
│                                │                                    │
│                                ▼                                    │
│              ┌─────────────────────────────────────┐               │
│              │   ESTIMATION TOOL CORE ENGINE       │               │
│              │  (packages/automation/apps/         │               │
│              │   estimation-tool/)                 │               │
│              └─────────┬───────────────────────────┘               │
│                        │                                            │
│        ┌───────────────┼───────────────┐                          │
│        │               │               │                          │
│        ▼               ▼               ▼                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐                 │
│  │  Cost    │   │ Assemblies│   │   Takeoff    │                 │
│  │ Database │   │  Library  │   │   Manager    │                 │
│  └────┬─────┘   └────┬──────┘   └──────┬───────┘                 │
│       │              │                  │                          │
│       └──────────────┴──────────────────┘                         │
│                      │                                             │
│                      ▼                                             │
│            ┌─────────────────────┐                                │
│            │  Estimate Builder   │                                │
│            │   & Calculator      │                                │
│            └──────────┬──────────┘                                │
│                       │                                            │
│         ┌─────────────┼─────────────┐                            │
│         │             │             │                            │
│         ▼             ▼             ▼                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│   │ AI       │  │ Export   │  │ Revision │                     │
│   │ Analysis │  │Generator │  │ Manager  │                     │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│        │             │             │                            │
│        └─────────────┴─────────────┘                            │
│                      │                                           │
│         ┌────────────┴────────────┐                            │
│         │                         │                            │
│         ▼                         ▼                            │
│  ┌─────────────┐          ┌─────────────┐                     │
│  │  BullMQ     │          │  Database   │                     │
│  │  Worker     │◄────────►│  (Prisma)   │                     │
│  └─────────────┘          └─────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 INTEGRATION POINTS

### 1. APP-01: Bid Engine Integration ✅

**Sync Direction:** Bidirectional  
**Module:** `integrations/bid-engine-sync.ts`

#### Estimation → Bid Engine
```typescript
// Send estimate to bid request
estimateId → bidRequestId
  ├─ Transfer line items
  ├─ Set bid amount (total + markup)
  ├─ Attach cost breakdown
  └─ Set pricing confidence level
```

#### Bid Engine → Estimation
```typescript
// Create estimate from bid request
bidRequestId → estimateId
  ├─ Import scope of work
  ├─ Parse line items from description
  ├─ Suggest assemblies (AI)
  └─ Create draft estimate
```

#### Use Cases
1. **GC receives bid request** → Auto-create estimate from scope
2. **Estimator completes estimate** → Push to bid as proposal
3. **Bid accepted** → Estimate becomes project baseline

#### Event Flow
```
EVENT: BID_REQUEST_CREATED
  ↓
Estimation Tool: Create draft estimate
  ↓
AI Scope Analyzer: Parse work items
  ↓
Assembly Suggester: Recommend assemblies
  ↓
Estimator: Review and refine
  ↓
EVENT: ESTIMATE_COMPLETED
  ↓
Bid Engine: Update bid amount
```

---

### 2. APP-07: Budget Tracker Integration ✅

**Sync Direction:** One-way (Estimation → Budget)  
**Module:** `integrations/budget-tracker-sync.ts`

#### Estimation → Budget Tracker
```typescript
// Convert approved estimate to project budget
estimateId + projectId → budgetId
  ├─ Map sections to budget categories
  ├─ Create budget line items
  ├─ Set baseline amounts
  ├─ Configure variance thresholds
  └─ Enable real-time tracking
```

#### Mapping Logic
```
Estimate Section (CSI Division) → Budget Category
├─ 03 Concrete → Labor: Concrete
├─ 06 Wood/Plastics → Labor: Framing
├─ 09 Finishes → Labor: Finishing
└─ Material costs → Material categories
```

#### Use Cases
1. **Project kickoff** → Convert winning estimate to budget
2. **Budget updates** → Create revision from updated estimate
3. **Change orders** → Estimate delta, update budget

#### Event Flow
```
EVENT: PROJECT_AWARDED
  ↓
Estimation Tool: Mark estimate as baseline
  ↓
Budget Tracker Sync: Transfer to budget
  ↓
Budget Tracker: Create line items
  ↓
Budget Tracker: Set thresholds (90%, 100%, 110%)
  ↓
EVENT: BUDGET_CREATED
```

---

### 3. APP-04: Report Generator Integration ✅

**Sync Direction:** Estimation → Reports  
**Module:** Direct API calls

#### Estimate Reports
```typescript
// Generate estimate reports
estimateId → reportId
  ├─ Professional proposal PDF
  ├─ Detailed cost breakdown
  ├─ Comparative analysis
  └─ Executive summary
```

#### Report Types
1. **Client Proposal** - Professional, high-level
2. **Internal Breakdown** - Line-item detail
3. **Comparison Report** - Multiple estimates side-by-side
4. **Value Engineering** - Cost optimization suggestions

---

### 4. Claude AI Integration ✅

**Service:** Claude API (Anthropic)  
**Modules:** `ai/*.ts`

#### AI Features

##### 4.1 Scope Analyzer
```typescript
Input: Project description (text)
Output: Structured work items

Example:
"Build 2,000 sq ft single-family home with 3BR/2BA"
  ↓
AI Analysis:
  ├─ Foundation: 2,000 SF slab on grade
  ├─ Framing: Wood frame, 2x6 walls
  ├─ Roofing: Asphalt shingles, 2,500 SF
  ├─ Plumbing: 2 full baths
  └─ Electrical: 3BR standard load
```

##### 4.2 Cost Predictor
```typescript
Input: Project parameters + historical data
Output: Cost prediction with confidence

Features:
  ├─ Historical pattern analysis
  ├─ Market trend adjustment
  ├─ Regional cost factors
  └─ Risk premium calculation
```

##### 4.3 Value Engineer
```typescript
Input: Current estimate
Output: Cost reduction suggestions

Examples:
  ├─ "Use engineered lumber instead of solid (save 15%)"
  ├─ "Consider metal roof for longevity (higher upfront, lower lifecycle)"
  └─ "Bundle permits to save fees"
```

##### 4.4 Assembly Suggester
```typescript
Input: Project type + location
Output: Recommended assemblies

Logic:
  ├─ Match project type (residential, commercial, etc.)
  ├─ Consider climate zone
  ├─ Apply local code requirements
  └─ Suggest cost-effective options
```

---

### 5. RSMeans Integration ⚠️ 70%

**Status:** Import ready, credentials needed  
**Module:** `integrations/rsmeans-importer.ts`

#### Import Process
```typescript
1. Connect to RSMeans API
2. Select database (residential/commercial)
3. Import by:
   ├─ Division (CSI MasterFormat)
   ├─ Assembly codes
   └─ Material/labor/equipment items
4. Store with metadata:
   ├─ Source identifier
   ├─ Import date
   ├─ Version
   └─ Regional factors
5. Map to Kealee cost database
```

#### Data Structure
```
RSMeans Item → Kealee Cost Item
├─ Division: "03 23 13" → Division: "03"
├─ Description: "Concrete foundation" → Material
├─ Unit Cost → Base cost
├─ Labor Hours → Labor rate
└─ Location Factor → Regional adjustment
```

---

### 6. Database Integration ✅

**ORM:** Prisma  
**Database:** PostgreSQL

#### Key Models
```typescript
// Core Models
- Estimate (estimate data)
- EstimateSection (CSI divisions)
- EstimateLineItem (individual costs)
- EstimateRevision (version history)

// Cost Database
- CostDatabase (database metadata)
- MaterialCost (material pricing)
- LaborRate (trade rates by location)
- EquipmentRate (equipment pricing)

// Assemblies
- Assembly (pre-built cost groups)
- AssemblyComponent (assembly line items)

// Takeoff
- Takeoff (quantity data)
- TakeoffItem (measured quantities)
- Plan (uploaded plans)

// Integration
- BidRequest (from APP-01)
- Project (for budgets)
- Budget (to APP-07)
```

#### Data Flow
```
User Input → API → Estimation Tool
  ↓
Business Logic (calculations)
  ↓
Prisma ORM
  ↓
PostgreSQL Database
  ↓
Query Results → API → User
```

---

### 7. BullMQ Job Queue Integration ✅

**Queue:** `estimation-tool`  
**Module:** `worker.ts`

#### Job Types (14 types)
```typescript
1. PRICE_UPDATE
   - Update cost database from external sources
   - Run: Daily at 2 AM

2. PLAN_ANALYSIS
   - Analyze uploaded PDF/CAD plans
   - Extract quantities using AI
   - Async (long-running)

3. QUANTITY_EXTRACTION
   - OCR-based quantity reading
   - Async

4. ESTIMATE_CALCULATION
   - Recalculate all costs
   - Apply markup, overhead, tax
   - Async for large estimates

5. CREATE_REVISION
   - Snapshot current estimate
   - Store changes
   - Async

6. GENERATE_EXPORT
   - Create PDF, Excel, CSV
   - Async (resource-intensive)

7. SCOPE_ANALYSIS (AI)
   - Parse project description
   - Extract work items
   - Async (AI API call)

8. COST_PREDICTION (AI)
   - Forecast costs
   - Confidence scoring
   - Async

9. VALUE_ENGINEERING (AI)
   - Generate cost-saving suggestions
   - Async

10. ESTIMATE_COMPARISON
    - Compare multiple estimates
    - Side-by-side analysis
    - Async

11. AUTO_ASSIGN
    - Assign estimate to estimator
    - Load balancing
    - Sync

12. DELIVER_ESTIMATE
    - Send to client
    - Email + portal upload
    - Async

13. BID_SYNC
    - Sync with APP-01
    - Bidirectional
    - Async

14. BUDGET_TRANSFER
    - Push to APP-07
    - One-way
    - Async

15. RSMEANS_IMPORT
    - Bulk import from RSMeans
    - Run: Weekly
    - Async
```

#### Worker Configuration
```typescript
Concurrency: 5 workers
Retry: 3 attempts with exponential backoff
Priority: 1-10 (1 = highest)
Rate Limit: 100 jobs/min
Dead Letter Queue: Enabled
```

---

### 8. File Storage Integration ⚠️

**Status:** Pending configuration  
**Options:** AWS S3 / Cloudflare R2

#### Stored Files
```
/estimates/{estimateId}/
  ├─ plans/ (uploaded PDFs/CAD)
  ├─ exports/ (generated reports)
  ├─ photos/ (site photos for context)
  └─ attachments/ (supporting docs)
```

---

## 🔀 DATA FLOW DIAGRAMS

### Complete Estimate Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    ESTIMATE CREATION FLOW                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INPUT STAGE                                                  │
│  ───────────────                                                 │
│     New Project Request → API                                    │
│          ↓                                                       │
│     Estimator receives assignment                                │
│          ↓                                                       │
│  ┌─────────────────────────────────────────┐                    │
│  │ Create Estimate (manual or from bid)   │                    │
│  └────────────────┬────────────────────────┘                    │
│                   │                                              │
│                   ▼                                              │
│  2. SCOPE ANALYSIS (AI)                                         │
│  ────────────────────────                                       │
│  ┌────────────────────────────────────┐                         │
│  │ AI: Parse project description      │                         │
│  │  → Extract work items              │                         │
│  │  → Suggest assemblies              │                         │
│  └────────────────┬───────────────────┘                         │
│                   │                                              │
│                   ▼                                              │
│  3. COST BUILDUP                                                │
│  ───────────────                                                │
│  ┌────────────────────────────────────┐                         │
│  │ Estimator adds line items:         │                         │
│  │  • From assemblies                 │                         │
│  │  • From cost database              │                         │
│  │  • Custom entries                  │                         │
│  └────────────────┬───────────────────┘                         │
│                   │                                              │
│                   ▼                                              │
│  4. CALCULATION                                                 │
│  ───────────────                                                │
│  ┌────────────────────────────────────┐                         │
│  │ Calculate costs:                   │                         │
│  │  • Material: $50,000               │                         │
│  │  • Labor: $35,000                  │                         │
│  │  • Equipment: $5,000               │                         │
│  │  • Subtotal: $90,000               │                         │
│  │  • Overhead (15%): $13,500         │                         │
│  │  • Profit (10%): $10,350           │                         │
│  │  • Total: $113,850                 │                         │
│  └────────────────┬───────────────────┘                         │
│                   │                                              │
│                   ▼                                              │
│  5. VALUE ENGINEERING (AI)                                      │
│  ──────────────────────────                                     │
│  ┌────────────────────────────────────┐                         │
│  │ AI: Suggest cost savings           │                         │
│  │  → "Use engineered lumber (save    │                         │
│  │     $3,200 on framing)"            │                         │
│  └────────────────┬───────────────────┘                         │
│                   │                                              │
│                   ▼                                              │
│  6. EXPORT & DELIVERY                                           │
│  ─────────────────────                                          │
│  ┌────────────────────────────────────┐                         │
│  │ Generate:                          │                         │
│  │  • Client proposal (PDF)           │                         │
│  │  • Internal breakdown (Excel)      │                         │
│  │  • Budget export (CSV)             │                         │
│  └────────────────┬───────────────────┘                         │
│                   │                                              │
│                   ├─────────────┐                               │
│                   │             │                               │
│                   ▼             ▼                               │
│         ┌──────────────┐  ┌──────────────┐                     │
│         │ Send to      │  │ Sync to Bid  │                     │
│         │ Client       │  │ Engine       │                     │
│         └──────────────┘  └──────────────┘                     │
│                                                                  │
│  7. APPROVAL & BUDGET SYNC                                      │
│  ──────────────────────────                                     │
│         Client Approves                                         │
│              ↓                                                  │
│     ┌──────────────────┐                                       │
│     │ Transfer to      │                                       │
│     │ Budget Tracker   │                                       │
│     │ (APP-07)         │                                       │
│     └──────────────────┘                                       │
│              ↓                                                  │
│     Project Budget Created                                      │
│     Real-time tracking begins                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Bid-to-Budget Flow

```
┌──────────────────────────────────────────────────────────────────┐
│           BID REQUEST → ESTIMATE → PROJECT BUDGET                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  APP-01: BID ENGINE                                             │
│  ════════════════════                                           │
│    New Bid Request Created                                       │
│         │                                                        │
│         │ EVENT: BID_REQUEST_CREATED                            │
│         ▼                                                        │
│  ┌────────────────────────────┐                                 │
│  │ Bid Request Details:       │                                 │
│  │  • Project: "Home Addition"│                                 │
│  │  • Scope: 500 SF addition  │                                 │
│  │  • Deadline: 14 days       │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              │ Auto-trigger                                      │
│              ▼                                                   │
│  APP-06: ESTIMATION TOOL                                        │
│  ═════════════════════════                                      │
│  ┌────────────────────────────┐                                 │
│  │ 1. Create draft estimate   │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              ▼                                                   │
│  ┌────────────────────────────┐                                 │
│  │ 2. AI: Parse scope         │                                 │
│  │    Extract quantities      │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              ▼                                                   │
│  ┌────────────────────────────┐                                 │
│  │ 3. Suggest assemblies      │                                 │
│  │    • Foundation            │                                 │
│  │    • Framing               │                                 │
│  │    • Roof                  │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              ▼                                                   │
│  ┌────────────────────────────┐                                 │
│  │ 4. Estimator reviews       │                                 │
│  │    Adjusts quantities      │                                 │
│  │    Adds markup             │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              ▼                                                   │
│  ┌────────────────────────────┐                                 │
│  │ 5. Calculate: $75,000      │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              │ Sync back                                         │
│              ▼                                                   │
│  APP-01: BID ENGINE                                             │
│  ════════════════════                                           │
│  ┌────────────────────────────┐                                 │
│  │ Update bid submission:     │                                 │
│  │  • Amount: $75,000         │                                 │
│  │  • Breakdown: Attached     │                                 │
│  │  • Status: Ready           │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              │ Client accepts bid                                │
│              ▼                                                   │
│  ┌────────────────────────────┐                                 │
│  │ PROJECT AWARDED            │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              │ EVENT: PROJECT_AWARDED                            │
│              ▼                                                   │
│  APP-06: ESTIMATION TOOL                                        │
│  ═════════════════════════                                      │
│  ┌────────────────────────────┐                                 │
│  │ Mark estimate as baseline  │                                 │
│  └───────────┬────────────────┘                                 │
│              │                                                   │
│              │ Trigger sync                                      │
│              ▼                                                   │
│  APP-07: BUDGET TRACKER                                         │
│  ════════════════════════                                       │
│  ┌────────────────────────────┐                                 │
│  │ Create project budget:     │                                 │
│  │  • Total: $75,000          │                                 │
│  │  • Categories mapped       │                                 │
│  │  • Thresholds set          │                                 │
│  │  • Tracking: ACTIVE        │                                 │
│  └────────────────────────────┘                                 │
│              │                                                   │
│              ▼                                                   │
│    Real-time cost tracking begins                               │
│    Variance alerts enabled                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 INTEGRATION READINESS

| Integration | Status | Completeness | Blocker |
|-------------|--------|--------------|---------|
| **APP-01 Bid Engine** | ✅ Ready | 100% | None |
| **APP-07 Budget Tracker** | ✅ Ready | 100% | None |
| **APP-04 Report Generator** | ✅ Ready | 100% | None |
| **Claude AI** | ✅ Ready | 90% | API key needed |
| **RSMeans API** | ⚠️ Partial | 70% | Credentials needed |
| **BullMQ Worker** | ✅ Ready | 100% | Deploy worker |
| **Database (Prisma)** | ✅ Ready | 100% | None |
| **File Storage** | ⚠️ Pending | 0% | S3/R2 config |
| **Frontend UI** | ❌ Missing | 0% | Build m-estimation |

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend Ready ✅
- [x] Core logic implemented
- [x] API routes defined
- [x] Worker jobs configured
- [x] Database models created
- [x] AI integration complete
- [x] APP-01 sync ready
- [x] APP-07 sync ready

### Pending for Full Production ⚠️
- [ ] Deploy worker service to Railway
- [ ] Configure RSMeans credentials
- [ ] Set up file storage (S3/R2)
- [ ] Build frontend UI (m-estimation)
- [ ] End-to-end testing
- [ ] User acceptance testing

---

## 📈 BUSINESS IMPACT

### Without Frontend (Current)
- ✅ API access for developers
- ✅ Background sync with bids/budgets
- ❌ No estimator workflow
- ❌ Lost revenue opportunity

### With Frontend (Post m-estimation Build)
- ✅ Full estimator workflow
- ✅ Competitive differentiation
- ✅ Faster bid turnaround (15-20 hrs saved)
- ✅ Higher estimate accuracy (AI-powered)
- ✅ Seamless bid-to-budget flow
- ✅ Revenue opportunity: $50-200/estimate or bundled in packages

---

**Integration Status:** Backend 85% Ready, Frontend 0%  
**Next Step:** Build m-estimation UI (2-3 weeks)  
**Priority:** HIGH - Critical revenue feature
