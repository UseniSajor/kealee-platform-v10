# Kealee v20 System Map

## Architecture Overview

```
                              KEALEE PLATFORM v20
    ┌─────────────────────────────────────────────────────────────────┐
    │                        PORTAL LAYER                             │
    │  ┌──────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐│
    │  │  portal-  │ │   portal-    │ │   portal-   │ │  command-   ││
    │  │  owner    │ │  contractor  │ │  developer  │ │  center     ││
    │  │          │ │              │ │             │ │             ││
    │  │ Projects │ │ Bids/Leads  │ │ Pipeline    │ │ Twins       ││
    │  │ Payments │ │ Projects    │ │ Feasibility │ │ Analytics   ││
    │  │ Documents│ │ Payments    │ │ Capital     │ │ Bots        ││
    │  │ Messages │ │ Credentials │ │ Portfolio   │ │ Events      ││
    │  │ Twin View│ │ Schedule    │ │ Reports     │ │ Integrations││
    │  └────┬─────┘ └──────┬─────┘ └──────┬──────┘ └──────┬──────┘│
    │       │              │              │               │        │
    │  ┌────┴──────────────┴──────────────┴───────────────┴──────┐ │
    │  │              web-main (Marketing + Landing)              │ │
    │  │  Landing | Features | Pricing | About | Contact | Blog  │ │
    │  └─────────────────────────────────────────────────────────┘ │
    └──────────────────────────────┬──────────────────────────────┘
                                   │ HTTPS / REST API
    ┌──────────────────────────────▼──────────────────────────────┐
    │                       API GATEWAY                            │
    │                    services/api (Fastify)                    │
    │  ┌─────────────────────────────────────────────────────────┐│
    │  │  Auth Middleware → Route Modules → Service Layer → DB   ││
    │  │  /api/v1/auth/*     88+ route modules                   ││
    │  │  /api/v1/twins/*    DDTS routes                         ││
    │  │  /api/v1/land/*     OS-Land routes                      ││
    │  │  /api/v1/feas/*     OS-Feas routes                      ││
    │  │  /api/v1/dev/*      OS-Dev routes                       ││
    │  │  /api/v1/pm/*       OS-PM routes (55 modules)           ││
    │  │  /api/v1/pay/*      OS-Pay routes                       ││
    │  │  /api/v1/ops/*      OS-Ops routes                       ││
    │  │  /api/v1/market/*   Marketplace routes                  ││
    │  │  /api/v1/bots/*     KeaBot routes                       ││
    │  └─────────────────────────────────────────────────────────┘│
    └──────────┬──────────────────────────────┬──────────────────┘
               │                              │
    ┌──────────▼──────────┐    ┌──────────────▼──────────────────┐
    │    SERVICE LAYER     │    │        EVENT BUS                 │
    │   (OS Modules)       │    │    (Redis Streams)               │
    │                      │    │                                  │
    │  ┌────────────────┐  │    │  stream.twin.*                   │
    │  │   OS-Land      │──┼───▶│  stream.land.*                   │
    │  │  Parcels       │  │    │  stream.feas.*                   │
    │  │  Zoning        │  │    │  stream.pm.*                     │
    │  │  Assessments   │  │    │  stream.pay.*                    │
    │  │  Offers        │  │    │  stream.ops.*                    │
    │  └────────────────┘  │    │  stream.market.*                 │
    │  ┌────────────────┐  │    │  stream.bot.*                    │
    │  │   OS-Feas      │──┼───▶│                                  │
    │  │  Studies       │  │    │  ┌──────────┐ ┌──────────────┐  │
    │  │  Scenarios     │  │    │  │ Consumer │ │ Dead Letter  │  │
    │  │  Proformas     │  │    │  │ Groups   │ │ Queue        │  │
    │  └────────────────┘  │    │  └──────────┘ └──────────────┘  │
    │  ┌────────────────┐  │    │  ┌──────────────────────────┐   │
    │  │   OS-Dev       │──┼───▶│  │   Saga Coordinator       │   │
    │  │  Capital Stacks│  │    │  │   (Distributed Txns)      │   │
    │  │  Draw Tracking │  │    │  └──────────────────────────┘   │
    │  │  Investor Rpts │  │    └──────────────┬──────────────────┘
    │  └────────────────┘  │                   │
    │  ┌────────────────┐  │                   │ Events
    │  │   OS-PM        │──┼───▶    ┌──────────▼──────────────┐
    │  │  55 modules    │  │        │     DDTS CORE            │
    │  │  Scheduling    │  │        │  (Digital Twin System)   │
    │  │  Permits       │  │        │                          │
    │  │  Inspections   │  │        │  TwinManager             │
    │  │  RFIs          │  │        │  ├─ createTwin()         │
    │  │  Change Orders │  │        │  ├─ transitionPhase()    │
    │  │  BIM/Drawings  │  │        │  ├─ recordEvent()        │
    │  │  Estimation    │  │        │  ├─ updateKPIs()         │
    │  │  Takeoffs      │  │        │  ├─ createSnapshot()     │
    │  └────────────────┘  │        │  └─ recalculateHealth()  │
    │  ┌────────────────┐  │        │                          │
    │  │   OS-Pay       │──┼───▶    │  StateMachine            │
    │  │  Milestones    │  │        │  9 phases, validated     │
    │  │  Escrow        │  │        │  transitions             │
    │  │  Stripe Connect│  │        │                          │
    │  │  Reconciliation│  │        │  HealthCalculator        │
    │  └────────────────┘  │        │  5 categories, weighted  │
    │  ┌────────────────┐  │        │  scoring (0-100)         │
    │  │   OS-Ops       │──┼───▶    │                          │
    │  │  Turnover      │  │        │  ┌────────────────────┐  │
    │  │  Warranty      │  │        │  │ DigitalTwin (L1-L3)│  │
    │  │  Maintenance   │  │        │  │ TwinSnapshot       │  │
    │  └────────────────┘  │        │  │ TwinEvent          │  │
    │  ┌────────────────┐  │        │  │ TwinModule         │  │
    │  │  Marketplace   │──┼───▶    │  │ TwinKPI            │  │
    │  │  Contractors   │  │        │  └────────────────────┘  │
    │  │  Bidding       │  │        └──────────────────────────┘
    │  │  Listings      │  │
    │  └────────────────┘  │
    └──────────────────────┘
```

## DDTS — Central Nervous System

Every project gets a Digital Twin at creation. The twin is the single source of truth.

```
                         PROJECT LIFECYCLE
    ┌──────────────────────────────────────────────────────┐
    │                                                      │
    │  INTAKE ──▶ LAND ──▶ FEASIBILITY ──▶ ENTITLEMENT    │
    │    │                                     │           │
    │    │         (skip for homeowners)        ▼           │
    │    └──────────────────────────▶ PRE_CONSTRUCTION     │
    │                                     │                │
    │                                     ▼                │
    │                               CONSTRUCTION           │
    │                                     │                │
    │                                     ▼                │
    │                                 CLOSEOUT             │
    │                                     │                │
    │                                     ▼                │
    │                                OPERATIONS            │
    │                                     │                │
    │                                     ▼                │
    │                                 ARCHIVED             │
    └──────────────────────────────────────────────────────┘

    Twin Tiers:
    ┌─────────────────────────────────────────────────────┐
    │ L1 (Light)    │ 3 KPIs  │ Budget, Schedule, %      │
    │ L2 (Standard) │ 6 KPIs  │ + Risk, Quality, Issues  │
    │ L3 (Premium)  │ 10 KPIs │ + Safety, CPI, RFI, CO   │
    └─────────────────────────────────────────────────────┘
```

## 13 KeaBots — AI Automation Layer

Every bot calls OS service APIs via HTTP. Never direct DB access.

```
    ┌─────────────────────────────────────────────────────────┐
    │                    KEABOT LAYER                          │
    │                                                         │
    │  ┌─────────────────────────────────────────────────┐    │
    │  │         KeaBot Command (Master Orchestrator)     │    │
    │  │  Routes queries, manages handoffs, escalates     │    │
    │  └──────────┬──────────────────────────┬───────────┘    │
    │             │                          │                 │
    │  ┌─────────▼─────────┐  ┌─────────────▼────────────┐   │
    │  │  OWNER-FACING      │  │  CONTRACTOR-FACING        │   │
    │  │                    │  │                            │   │
    │  │  KeaBot Owner      │  │  KeaBot GC                │   │
    │  │  - Project status  │  │  - Bid management         │   │
    │  │  - Payment Q&A     │  │  - Sub coordination       │   │
    │  │  - Schedule updates│  │  - Compliance tracking     │   │
    │  │                    │  │                            │   │
    │  │  KeaBot Payments   │  │  KeaBot Construction      │   │
    │  │  - Escrow status   │  │  - Progress tracking      │   │
    │  │  - Draw requests   │  │  - Schedule deps          │   │
    │  │  - Reconciliation  │  │  - Inspection readiness   │   │
    │  └────────────────────┘  └────────────────────────────┘  │
    │                                                         │
    │  ┌─────────────────────────────────────────────────┐    │
    │  │  DOMAIN-SPECIALIST BOTS                          │    │
    │  │                                                  │    │
    │  │  KeaBot Land         KeaBot Feasibility          │    │
    │  │  - Parcel analysis   - Scenario modeling          │    │
    │  │  - Zoning lookup     - Proforma generation        │    │
    │  │  - Site assessment   - Go/no-go analysis          │    │
    │  │                                                  │    │
    │  │  KeaBot Finance      KeaBot Developer             │    │
    │  │  - Capital stacks    - Pipeline management        │    │
    │  │  - Draw processing   - Investor reporting         │    │
    │  │  - HUD eligibility   - Entitlement tracking       │    │
    │  │                                                  │    │
    │  │  KeaBot Permit       KeaBot Estimate              │    │
    │  │  - AI plan review    - Cost estimation            │    │
    │  │  - Submission prep   - Takeoff assistance         │    │
    │  │  - Status tracking   - Value engineering          │    │
    │  │                                                  │    │
    │  │  KeaBot Marketplace  KeaBot Operations            │    │
    │  │  - Matchmaking       - Warranty management        │    │
    │  │  - Bid comparison    - Maintenance scheduling     │    │
    │  │  - Rating analysis   - Turnover coordination      │    │
    │  └──────────────────────────────────────────────────┘   │
    └──────────────────────────────┬──────────────────────────┘
                                   │ HTTP API Calls
    ┌──────────────────────────────▼──────────────────────────┐
    │                  OS SERVICE APIS                          │
    │  (Bots call services, services own data)                 │
    └──────────────────────────────────────────────────────────┘
```

## Data Flow — Project Creation to Construction

```
    Owner creates project in portal-owner
         │
         ▼
    API: POST /api/v1/projects
         │
         ├──▶ Project record created in PostgreSQL
         │
         ├──▶ DDTS: DigitalTwin created (auto, L1/L2/L3 based on plan)
         │         TwinKPIs seeded (3-10 based on tier)
         │         TwinModules activated (os-pm, os-pay minimum)
         │
         ├──▶ Event Bus: stream.twin.created
         │         │
         │         ├──▶ KeaBot Owner receives welcome context
         │         ├──▶ KeaBot Command registers project
         │         └──▶ Command Center dashboard updated
         │
         ▼
    Phase: INTAKE → PRE_CONSTRUCTION
         │
         ├──▶ Design team assigned (OS-PM)
         │         Event: stream.pm.design.assigned
         │
         ├──▶ BIM model uploaded (OS-PM drawings)
         │         Event: stream.pm.bim.uploaded
         │         Twin: TwinEvent recorded
         │
         ├──▶ Estimate generated (OS-PM estimation)
         │         Event: stream.pm.estimate.created
         │         Twin: KPI budget_variance initialized
         │
         ├──▶ Permit submitted (OS-PM permits)
         │         Event: stream.pm.permit.submitted
         │         Twin: TwinEvent recorded, phase may transition
         │
         ▼
    Phase: PRE_CONSTRUCTION → CONSTRUCTION
         │
         ├──▶ Schedule created (OS-PM schedule)
         │         Event: stream.pm.schedule.created
         │         Twin: KPI schedule_spi initialized
         │
         ├──▶ Contractors bid (Marketplace)
         │         Event: stream.market.bid.received
         │
         ├──▶ Milestones set (OS-Pay)
         │         Event: stream.pay.milestone.created
         │
         ├──▶ Construction begins
         │         Twin: Phase transition to CONSTRUCTION
         │         Event: stream.twin.phase.changed
         │         All KPIs now actively tracked
         │
         ▼
    Active Construction Loop:
         │
         ├──▶ Daily logs (OS-PM)
         ├──▶ Inspections (OS-PM permits)
         ├──▶ Payment requests (OS-Pay)
         ├──▶ Change orders (OS-PM)
         ├──▶ Schedule updates (OS-PM)
         │
         │    Each action:
         │    1. Service processes request
         │    2. Emits event to Redis Stream
         │    3. DDTS consumer updates twin KPIs
         │    4. Health recalculated
         │    5. If breached → alert event
         │    6. Bots monitor and assist
         │
         ▼
    Phase: CONSTRUCTION → CLOSEOUT → OPERATIONS → ARCHIVED
```

## Event Architecture

```
    ┌─────────────────────────────────────────────────────────┐
    │                    EVENT ENVELOPE                         │
    │                                                         │
    │  {                                                      │
    │    id: "evt_abc123",                                    │
    │    type: "pm.permit.submitted",                         │
    │    source: "os-pm",                                     │
    │    projectId: "proj_xyz",                               │
    │    orgId: "org_456",                                    │
    │    severity: "INFO",                                    │
    │    payload: { permitId, permitType, jurisdiction },     │
    │    metadata: {                                          │
    │      correlationId: "corr_789",                         │
    │      initiatorType: "USER",                             │
    │      initiatorId: "user_abc",                           │
    │      version: "1.0",                                    │
    │      timestamp: "2026-03-10T..."                        │
    │    }                                                    │
    │  }                                                      │
    └─────────────────────────────────────────────────────────┘

    Event Categories:
    ┌──────────────┬──────────────────────────────────────────┐
    │ twin.*       │ created, updated, phase.changed,         │
    │              │ health.changed, health.critical,         │
    │              │ snapshot.created, module.activated,       │
    │              │ module.deactivated, kpi.updated,         │
    │              │ kpi.breached                             │
    ├──────────────┼──────────────────────────────────────────┤
    │ land.*       │ parcel.created, zoning.analyzed,         │
    │              │ assessment.completed, offer.made,        │
    │              │ parcel.converted                         │
    ├──────────────┼──────────────────────────────────────────┤
    │ feas.*       │ study.created, scenario.modeled,         │
    │              │ proforma.generated, decision.made        │
    ├──────────────┼──────────────────────────────────────────┤
    │ dev.*        │ capital.structured, draw.requested,      │
    │              │ draw.approved, investor.reported,        │
    │              │ entitlement.filed                        │
    ├──────────────┼──────────────────────────────────────────┤
    │ pm.*         │ design.assigned, bim.uploaded,           │
    │              │ estimate.created, permit.submitted,      │
    │              │ permit.approved, schedule.updated,       │
    │              │ inspection.passed, rfi.created,          │
    │              │ change_order.approved, daily_log.filed   │
    ├──────────────┼──────────────────────────────────────────┤
    │ pay.*        │ milestone.created, payment.requested,    │
    │              │ payment.approved, escrow.funded,         │
    │              │ draw.disbursed, reconciliation.completed │
    ├──────────────┼──────────────────────────────────────────┤
    │ ops.*        │ turnover.started, turnover.completed,    │
    │              │ warranty.claimed, maintenance.scheduled,  │
    │              │ work_order.created                       │
    ├──────────────┼──────────────────────────────────────────┤
    │ market.*     │ listing.posted, bid.received,            │
    │              │ bid.accepted, contractor.rated           │
    ├──────────────┼──────────────────────────────────────────┤
    │ bot.*        │ action.started, action.completed,        │
    │              │ handoff.requested, handoff.completed,    │
    │              │ escalation.triggered                     │
    └──────────────┴──────────────────────────────────────────┘
```

## Database Schema Map — 364+ Models

```
    ┌───────────────────────────────────────────────────────────┐
    │                    SCHEMA DOMAINS                          │
    │                                                           │
    │  DDTS (5 models)           Foundation (35+ models)        │
    │  ─────────────             ──────────────────────         │
    │  DigitalTwin               User, Org, Project,            │
    │  TwinSnapshot              Client, Role, Permission,      │
    │  TwinEvent                 Property, Lead, Contact,       │
    │  TwinModule                Notification, Audit...         │
    │  TwinKPI                                                  │
    │                            Identity (5 models)            │
    │  Land (7 models)           ─────────────────              │
    │  ─────────────             OAuthConnection,               │
    │  Parcel                    UserSession, APIKey...         │
    │  ParcelZoning                                             │
    │  SiteAssessment            Analytics (5+ models)          │
    │  ParcelComparable          ──────────────────             │
    │  ParcelDocument            PageView, EventTrack,          │
    │  ParcelNote                FunnelSession...               │
    │  LandOffer                                                │
    │                            Documents (3 models)           │
    │  Feasibility (5 models)    ─────────────────              │
    │  ────────────────────      Document, DocTemplate,         │
    │  FeasibilityStudy          DocVersion                     │
    │  FeasibilityScenario                                      │
    │  FeasibilityCostAssump.    Workflow (5 models)            │
    │  FeasibilityRevenueAs.     ────────────────               │
    │  FeasibilityComparison     WorkflowDef, WorkflowInst,    │
    │                            WorkflowStep...                │
    │  Development (5 models)                                   │
    │  ──────────────────────    Integrations (8 models)        │
    │  CapitalStack              ───────────────────            │
    │  CapitalSource             GHLContact, GHLOpp,           │
    │  DrawSchedule              APIIntegration,               │
    │  InvestorReport            IntegrationCredential...      │
    │  Entitlement                                              │
    │                            Marketplace (10+ models)       │
    │  PM (100+ models)          ─────────────────────          │
    │  ────────────────          ContractorProfile,             │
    │  Permits (25+ models)      ContractorListing,            │
    │  Estimation (20+ models)   OpportunityBid,               │
    │  Schedule (5 models)       ContractorReview...           │
    │  Drawings (3 models)                                      │
    │  BIM (1 model)             Payments (15+ models)          │
    │  Inspections (10 models)   ─────────────────              │
    │  RFIs (5 models)           EscrowAccount, Milestone,     │
    │  Change Orders (5 models)  PaymentRequest, DrawReq,      │
    │  Daily Logs (3 models)     ReconciliationSnap...         │
    │  Budget (5 models)                                        │
    │  Safety (3 models)         Operations (4 models)          │
    │  Procurement (5 models)    ─────────────────              │
    │  Closeout (3 models)       TurnoverChecklist,            │
    │  Design (5 models)         TurnoverItem,                 │
    │  Warranty (3 models)       MaintenanceSchedule,          │
    │                            MaintenanceWorkOrder          │
    └───────────────────────────────────────────────────────────┘
```

## Integration Points (KXL Layer)

```
    ┌───────────────────────────────────────────────────────────┐
    │                   KXL INTEGRATION LAYER                    │
    │                                                           │
    │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐│
    │  │   Stripe     │  │  GoHighLevel  │  │    Supabase      ││
    │  │   Connect    │  │  (GHL/CRM)    │  │    Auth          ││
    │  │             │  │              │  │                  ││
    │  │  Payments   │  │  Contacts    │  │  JWT tokens      ││
    │  │  Escrow     │  │  Pipelines   │  │  Sessions        ││
    │  │  Invoices   │  │  Webhooks    │  │  RBAC            ││
    │  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘│
    │         │               │                    │           │
    │  ┌──────▼───────────────▼────────────────────▼─────────┐│
    │  │            Adapter Framework (core-integrations)     ││
    │  │                                                      ││
    │  │  BaseAdapter → authenticate(), sync(), webhook()     ││
    │  │  StripeAdapter, GHLAdapter, SupabaseAdapter          ││
    │  │  Future: ProcoreAdapter, GISAdapter, AccelaAdapter   ││
    │  └──────────────────────────────────────────────────────┘│
    │                                                           │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
    │  │   Resend     │  │   Twilio      │  │   AWS S3     │   │
    │  │   (Email)    │  │   (SMS)       │  │   (Storage)  │   │
    │  └──────────────┘  └──────────────┘  └──────────────┘   │
    │                                                           │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
    │  │  Anthropic   │  │   OpenAI      │  │  Mapbox GL   │   │
    │  │  (Claude AI) │  │  (Fallback)   │  │  (GIS/Maps)  │   │
    │  └──────────────┘  └──────────────┘  └──────────────┘   │
    └───────────────────────────────────────────────────────────┘
```

## User Flow Map

### Homeowner Flow
```
    Sign Up → Create Project → AI Concept → Design → Permits → Bid → Build → Pay → Move In
       │           │              │           │         │        │      │      │
       ▼           ▼              ▼           ▼         ▼        ▼      ▼      ▼
    Supabase   DigitalTwin    KeaBot      OS-PM     OS-PM    Market  OS-PM   OS-Pay
    Auth       (L1 created)   Estimate    Design    Permits  Bids    Sched.  Escrow
```

### Contractor Flow
```
    Sign Up → Browse Listings → Submit Bid → Win Contract → Schedule → Build → Get Paid
       │           │                │            │             │         │        │
       ▼           ▼                ▼            ▼             ▼         ▼        ▼
    Supabase   Marketplace    KeaBot GC     OS-PM          OS-PM     OS-PM    OS-Pay
    Auth       Listings       Bid Assist    Contract       Schedule  DailyLog Milestone
```

### Developer Flow
```
    Sign Up → Find Land → Feasibility → Capital → Design → Permits → Build → Report → Close
       │          │           │           │         │         │        │        │        │
       ▼          ▼           ▼           ▼         ▼         ▼        ▼        ▼        ▼
    Supabase  OS-Land     OS-Feas     OS-Dev    OS-PM     OS-PM    OS-PM    OS-Dev   OS-Ops
    Auth      Parcels     Studies     Capital   Design    Permits  Constr.  Reports  Turnover
```

### Staff / Command Center Flow
```
    Login → Dashboard → Monitor Twins → Manage Events → Coordinate Bots → Reports
       │        │            │               │                │              │
       ▼        ▼            ▼               ▼                ▼              ▼
    Supabase  DDTS KPIs   Twin Health    Event Bus       KeaBot Command  Analytics
    Auth      Overview    Drill-down     Stream View     Bot Registry    Aggregation
```

## BIM / 3D Twin Visualization Stack

```
    ┌───────────────────────────────────────────────────────────┐
    │                3D TWIN VIEWER (Browser)                    │
    │                                                           │
    │  ┌─────────────────────────────────────────────────────┐ │
    │  │              React Three Fiber Canvas                │ │
    │  │                                                     │ │
    │  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │ │
    │  │  │ IFC Loader │  │ glTF Model │  │ Point Cloud  │  │ │
    │  │  │ (web-ifc)  │  │ (Three.js) │  │ (Potree)     │  │ │
    │  │  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  │ │
    │  │        │               │                │           │ │
    │  │        └───────────────┼────────────────┘           │ │
    │  │                        ▼                            │ │
    │  │            ┌───────────────────────┐                │ │
    │  │            │    Scene Graph         │                │ │
    │  │            │  - Building elements   │                │ │
    │  │            │  - Permit overlays     │                │ │
    │  │            │  - Schedule colors     │                │ │
    │  │            │  - Cost heatmap        │                │ │
    │  │            │  - Health indicators   │                │ │
    │  │            └───────────────────────┘                │ │
    │  └─────────────────────────────────────────────────────┘ │
    │                                                           │
    │  Visualization Layers:                                    │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
    │  │  Land    │ │  Design  │ │ Permit   │ │Construction│  │
    │  │  Mapbox  │ │  BIM 3D  │ │ Status   │ │ Progress   │  │
    │  │  Parcels │ │  IFC     │ │ Timeline │ │ Schedule   │  │
    │  │  Zoning  │ │  Sheets  │ │ Reviews  │ │ Daily Logs │  │
    │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
    │  ┌──────────┐ ┌──────────┐                               │
    │  │Financial │ │Operations│                               │
    │  │ Budget   │ │ Warranty │                               │
    │  │ Payments │ │ Maint.   │                               │
    │  │ Draws    │ │ Assets   │                               │
    │  └──────────┘ └──────────┘                               │
    └───────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
    ┌──────────────────────────────────────────┐
    │              VERCEL (Frontend)             │
    │                                          │
    │  web-main          portal-owner          │
    │  portal-contractor portal-developer      │
    │  command-center    admin-console          │
    │                                          │
    │  CDN + Edge Functions                    │
    │  Automatic HTTPS                         │
    └──────────────────┬───────────────────────┘
                       │ API Calls
    ┌──────────────────▼───────────────────────┐
    │              RAILWAY (Backend)             │
    │                                          │
    │  ┌────────────┐  ┌────────────────────┐  │
    │  │ API Service │  │ Command Center     │  │
    │  │ (Fastify)   │  │ (Worker + Queues)  │  │
    │  └──────┬──────┘  └────────┬───────────┘  │
    │         │                  │               │
    │  ┌──────▼──────────────────▼────────────┐ │
    │  │         PostgreSQL (Railway)          │ │
    │  │         364+ models, 50+ enums        │ │
    │  └──────────────────────────────────────┘ │
    │  ┌──────────────────────────────────────┐ │
    │  │         Redis (Railway)               │ │
    │  │         Streams, Queues, Cache        │ │
    │  └──────────────────────────────────────┘ │
    └──────────────────────────────────────────┘
```

## Housing Act Alignment

```
    ┌────────────────────────────────────────────────────────────┐
    │          REBUILD AMERICA'S HOUSING ACT MAPPING              │
    │                                                            │
    │  Sec 201: Reduce Regulatory Barriers                       │
    │  └──▶ OS-Land (AI zoning analysis, pattern book compliance)│
    │                                                            │
    │  Sec 203: Speed Housing Approvals                          │
    │  └──▶ OS-PM Permits (AI pre-review, automated submission)  │
    │                                                            │
    │  Sec 205: Reusable Design Workflows                        │
    │  └──▶ OS-PM Design (pattern book library, pre-approved)    │
    │                                                            │
    │  Sec 207: Stronger Housing Finance                         │
    │  └──▶ OS-Dev + OS-Feas (HUD eligibility, capital stacks)  │
    │                                                            │
    │  Sec 209: Local Capacity Building                          │
    │  └──▶ Analytics + Command Center (municipal dashboards)    │
    │                                                            │
    │  Sec 211: Land-to-Delivery Pipeline                        │
    │  └──▶ DDTS (full lifecycle: LAND → OPS, every phase)       │
    └────────────────────────────────────────────────────────────┘
```
