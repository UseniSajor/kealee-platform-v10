# KEALEE PLATFORM v10
# COMPLETE SOP & BUSINESS LOGIC
## Master Operating Procedures Across All Modules
### UPDATED VERSION 2.0

---

# EXECUTIVE SUMMARY

This document consolidates all Standard Operating Procedures (SOPs) and business logic across the entire Kealee Platform v10, compiled from extensive development sessions and industry best practices.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEALEE PLATFORM OVERVIEW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MISSION: Turn construction project management into an autopilot system    │
│  where PMs review and approve instead of doing everything manually.        │
│                                                                             │
│  PLATFORM COMPONENTS:                                                       │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  CUSTOMER-FACING APPS (m-*)                                                │
│  ├── m-marketplace        → Central hub, marketing, sales, routing         │
│  ├── m-project-owner      → Homeowner project dashboard                    │
│  ├── m-ops-services       → GC/Builder/Contractor service portal           │
│  ├── m-permits-inspections→ Permit tracking & acceleration                 │
│  ├── m-architect          → Architect/design services hub                  │
│  ├── m-engineer           → Engineering services hub                       │
│  ├── m-finance-trust      → Escrow & payment protection                    │
│  └── m-inspector          → Third-party inspection services                │
│                                                                             │
│  INTERNAL OPERATIONS (os-*)                                                │
│  ├── os-pm                → PM daily workspace (executes services)         │
│  └── os-admin             → Platform administration (controls all)         │
│                                                                             │
│  AUTOMATION LAYER (Command Center)                                         │
│  └── 15 Mini-Apps         → Background automation workers                  │
│                                                                             │
│  CORE SERVICES                                                             │
│  ├── API Gateway          → Fastify backend                                │
│  └── Database             → PostgreSQL via Supabase + Prisma               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PLATFORM IDENTITY & PURPOSE

## What is Kealee Platform v10?

**Kealee is an end-to-end construction services and talent meetup online platform** that provides real-time services for users/clients. It connects:

- **Homeowners** seeking renovation/construction services
- **Contractors, GCs, and Builders** seeking projects and leads
- **Architects** providing design services
- **Engineers** providing structural/MEP services
- **Project Managers** executing service delivery

## Platform Philosophy

The platform operates as a **two-sided marketplace with managed services**:

1. **Self-Service Path**: Clients use portals directly (find contractors, manage projects)
2. **Managed Service Path**: Clients subscribe to PM packages (A/B/C/D) for full support

## Monorepo Structure

All applications live in **kealee-platform-v10** monorepo for code sharing and consistency.

---

# MODULE CLASSIFICATION

## Client-Facing Modules (m-*)

**All m-* prefixed apps are CLIENT-FACING PORTALS/DASHBOARDS:**

| Module | Purpose | Primary User |
|--------|---------|--------------|
| **m-marketplace** | Main marketing, sales, and pass-through hub to all services | All users |
| **m-ops-services** | Service subscription portal for GCs/builders/contractors | GCs, Builders, Contractors |
| **m-architect** | Architecture and design services hub | Homeowners, Project Owners |
| **m-engineer** | Engineering services hub | Homeowners, Project Owners |
| **m-project-owner** | Full project management portal with AI design, find contractor, escrow | Homeowners |
| **m-permits-inspections** | Permit and inspection coordination portal | All project stakeholders |
| **m-finance-trust** | Financial services, escrow, payment protection | All users with transactions |
| **m-inspector** | Third-party inspection services | Inspectors, Project Owners |

## Operational Modules (os-*)

**All os-* prefixed apps are INTERNAL OPERATIONAL SYSTEMS:**

| Module | Purpose | Primary User |
|--------|---------|--------------|
| **os-pm** | PM workspace for executing services (implements m-ops-services) | Project Managers |
| **os-admin** | Platform administration and monitoring (controls ALL modules) | Kealee Admins |

## Module Relationship Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE RELATIONSHIP MAP                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT-FACING (m-*)              OPERATIONAL (os-*)                       │
│  ═══════════════════              ══════════════════                       │
│                                                                             │
│  m-marketplace ◄───────────────────────────────────────┐                   │
│  (Central Hub)                                         │                   │
│       │                                                │                   │
│       ├───► m-ops-services ◄─────────────► os-pm      │                   │
│       │     (GC/Builder Portal)    (Executes services) │                   │
│       │                                    │           │                   │
│       ├───► m-architect ◄──────────────────┤           │                   │
│       │     (Design Portal)                │           │                   │
│       │                                    │           │                   │
│       ├───► m-engineer ◄───────────────────┤           │                   │
│       │     (Engineering Portal)           │           │                   │
│       │                                    │           │                   │
│       ├───► m-project-owner ◄──────────────┤           │                   │
│       │     (Homeowner Portal)             │           │                   │
│       │                                    │           │                   │
│       ├───► m-permits-inspections ◄────────┤           │                   │
│       │     (Permit Portal)                │           │                   │
│       │                                    │           │                   │
│       ├───► m-finance-trust ◄──────────────┤           │                   │
│       │     (Escrow/Payments)              │           │                   │
│       │                                    ▼           │                   │
│       │                              os-admin ─────────┘                   │
│       │                        (Controls ALL modules)                      │
│       │                                                                    │
└───────┴────────────────────────────────────────────────────────────────────┘
```

## os-pm Executes m-ops-services

The **os-pm module is the execution engine** for m-ops-services subscriptions:

- **m-ops-services**: Client subscribes to Package A/B/C/D
- **os-pm**: PM logs in and executes the deliverables for that package
- **Result**: Client sees results in m-ops-services portal, PM does work in os-pm

---

# m-marketplace - THE CENTRAL HUB

m-marketplace is the **main entry point** for all users and the **pass-through hub** to all services:

```
┌─────────────────────────────────────────────────────────────────┐
│                         m-marketplace                           │
│                      (marketplace.kealee.com)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MARKETING FUNCTIONS:                                           │
│  ├── Landing pages for all services                            │
│  ├── SEO-optimized content                                     │
│  ├── Service category browsing                                 │
│  ├── Contractor profiles and reviews                           │
│  └── Pricing transparency                                      │
│                                                                 │
│  SALES FUNCTIONS:                                               │
│  ├── Lead capture forms                                        │
│  ├── Package tier presentation (A/B/C/D)                       │
│  ├── Quote requests                                            │
│  ├── Consultation booking                                      │
│  └── Subscription sign-up                                      │
│                                                                 │
│  PASS-THROUGH ROUTING:                                          │
│  ├── "I'm a Homeowner" → m-project-owner                       │
│  ├── "I'm a Contractor" → m-ops-services                       │
│  ├── "I need Design" → m-architect                             │
│  ├── "I need Engineering" → m-engineer                         │
│  ├── "I need Permits" → m-permits-inspections                  │
│  └── "Manage Payments" → m-finance-trust                       │
│                                                                 │
│  UNIQUE FEATURES:                                               │
│  ├── Fair Bid Rotation system                                  │
│  ├── 3% Bid-Up (max contractor can exceed SRP)                │
│  ├── Pre-Vetted Lead Marketplace                               │
│  ├── Contractor queue position display                         │
│  └── Transparent pricing (SRP visible)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# m-finance-trust MODULE

**PURPOSE**: Financial services hub including escrow, payments, and transaction protection

```
FEATURES:
├── Escrow Management
│   ├── Create escrow accounts per project
│   ├── Milestone-based fund releases
│   ├── 3-party approval workflow
│   ├── Dispute resolution holding
│   └── Automatic release triggers
│
├── Payment Processing
│   ├── Stripe integration
│   ├── ACH transfers
│   ├── Credit card payments
│   ├── Payment scheduling
│   └── Automatic invoicing
│
├── Financial Dashboard
│   ├── Transaction history
│   ├── Pending releases
│   ├── Escrow balances
│   ├── Fee summary
│   └── Tax documents
│
└── Protection Features
    ├── Payment protection guarantee
    ├── Contractor payment assurance
    ├── Dispute mediation
    └── Insurance verification

FEE STRUCTURE:
├── Escrow fee: 1% (max $500)
├── Payment processing: 2.9% + $0.30
├── Package C/D: 0.5% escrow (reduced)
└── Dispute resolution: $150 flat fee
```

---

# PART 1: SERVICE TIER STRUCTURE

## 1.1 PM Managed Service Packages

### Package A - Starter ($1,750/month)
```
HOURS: 5-10 hours/week
PROJECTS: 1 concurrent
SUPPORT: Email (48hr response)

DELIVERABLES:
├── Weekly progress reports
├── Basic task tracking
├── Contractor coordination
├── Budget monitoring
├── Document organization
└── Monthly check-in call (30 min)

PM TOOLS NEEDED: Basic communication, reporting (os-pm)
AUTOMATION LEVEL: 40%
```

### Package B - Professional ($3,750/month)
```
HOURS: 15-20 hours/week
PROJECTS: Up to 3 concurrent
SUPPORT: Priority email & phone (24hr response)

DELIVERABLES:
├── Everything in Package A
├── Bi-weekly progress reports
├── Advanced project tracking
├── Full contractor coordination
├── Budget optimization
├── Risk management
└── Weekly check-in calls

PM TOOLS NEEDED: Reports, schedule tracking, contractor coordination (os-pm)
AUTOMATION LEVEL: 50%
```

### Package C - Premium ($9,500/month) ⭐ MOST POPULAR
```
HOURS: 30-40 hours/week
PROJECTS: Unlimited
SUPPORT: 24/7 priority support

DELIVERABLES:
├── Everything in Package B
├── Daily progress reports with photos
├── Dedicated PM assigned
├── Full contractor management
├── Budget optimization & forecasting
├── Advanced risk management
├── Quality control inspections
├── **PERMIT MANAGEMENT** ⭐
├── **INSPECTION COORDINATION** ⭐
├── Owner representation at meetings
├── Site visits (2-4 per month)
├── Change order management
├── Payment approval recommendations
└── **0% MARKETPLACE FEES** ⭐

PM TOOLS NEEDED: Full suite (os-pm)
AUTOMATION LEVEL: 60%
```

### Package D - Enterprise ($16,500/month)
```
HOURS: 40+ hours/week
PROJECTS: Portfolio management
SUPPORT: Dedicated account manager + 24/7

DELIVERABLES:
├── Everything in Package C
├── We hire contractors for you
├── We handle all payments
├── Daily updates
├── Custom reporting & analytics
├── Strategic planning support
├── Multi-project coordination
├── Executive-level insights
├── White-glove concierge service
├── Custom integrations
├── On-site visits included
├── Design coordination
├── Warranty management
└── Complete hands-off experience

PM TOOLS NEEDED: Full suite + advanced integrations (os-pm)
AUTOMATION LEVEL: 70%
```

---

## 1.2 Permit Service Packages

### Permit Package A - Basic ($495)
```
TYPE: One-time
PERMITS: 1 application

INCLUDES:
├── Application review & preparation
├── Document compilation
├── Jurisdiction submissions
├── Follow-up communications
├── Resubmittal support
└── Status tracking

TURNAROUND: 2-3 business days
```

### Permit Package B - Full Service ($1,295) ⭐
```
TYPE: One-time
PERMITS: Up to 3 types

INCLUDES:
├── AI document review
├── Complete application prep
├── Expedited processing
├── Jurisdiction coordination
├── 1 resubmittal included
├── Inspection scheduling
├── Approval guarantee
└── Priority support

TURNAROUND: 1-2 business days
```

### Permit Package C - Premium ($2,995)
```
TYPE: One-time
PERMITS: Unlimited types

INCLUDES:
├── Full AI analysis
├── Architect/engineer coordination
├── Complete jurisdiction liaison
├── Unlimited resubmittals
├── All inspection scheduling
├── On-site inspection support
├── Correction coordination
├── Certificate of occupancy
└── Dedicated coordinator

TURNAROUND: Same-day processing
```

### Permit Package D - Enterprise ($7,500/month)
```
TYPE: Monthly subscription
PERMITS: Unlimited

INCLUDES:
├── Dedicated permit team
├── Multi-jurisdiction expertise
├── Portfolio dashboard
├── Bulk processing
├── Compliance monitoring
├── Relationship management
├── Approval guarantees
├── Monthly reporting
└── Strategic planning
```

---

## 1.3 Marketplace Fee Structure

```
TRANSACTION FEES:
├── Standard users:     3% platform fee
├── Package C/D users:  0% platform fee ⭐
├── Contractor listing: Free (basic)
└── Premium listing:    $99/month

LEAD DISTRIBUTION:
├── Fair Rotation Algorithm
├── 70% merit-based scoring
├── 30% fair distribution
└── Queue position visible to contractors

ESCROW FEES (m-finance-trust):
├── Standard: 1% (max $500)
├── Package C/D: 0.5% (max $250)
└── Enterprise: Custom pricing
```

---

# PART 2: PROJECT LIFECYCLE SOPs

## 2.1 Phase 1: Project Initiation

### SOP-001: Client Intake Process
```
PURPOSE: Capture complete project requirements within 48 hours
TRIGGER: New lead from marketplace, referral, or direct inquiry
OWNER: Assigned PM
AUTOMATION: 60% (AI classification, auto-forms)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│1.1 │ Receive notification of new client       │ Immediate │ os-pm Queue             │
│1.2 │ Review client submission                 │ 15 min    │ os-pm (from m-ops-svc)  │
│1.3 │ Conduct initial phone consultation       │ Within 24h│ os-pm Calendar          │
│1.4 │ Complete Client Intake Form              │ During    │ os-pm Form Generator    │
│1.5 │ Upload photos/documents from client      │ Within 24h│ os-pm Document Vault    │
│1.6 │ Classify project type and complexity     │ Auto      │ os-pm AI Engine         │
│1.7 │ Generate initial budget estimate         │ Auto      │ APP-15 Estimation       │
│1.8 │ Send intake confirmation email           │ Auto      │ APP-08 Communication    │
│1.9 │ Schedule discovery site visit (C/D)      │ Within 48h│ APP-02 Visit Scheduler  │
│1.10│ Create project record in system          │ Auto      │ os-pm Database          │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘

AI AUTOMATION:
├── Auto-classifies project type from description
├── Suggests planning tier based on budget
├── Generates jurisdiction-specific checklist
└── Recommends contractors by location/specialty
```

### SOP-002: Site Assessment Process
```
PURPOSE: Document existing conditions and validate project feasibility
TRIGGER: Project requires in-person assessment (Package C/D or complex)
OWNER: PM or designated assessor
AUTOMATION: 45% (checklist generation, photo tagging)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│2.1 │ Confirm appointment with client          │ Day before│ APP-08 Communication    │
│2.2 │ Review project brief, prepare checklist  │ 30 min    │ os-pm Checklist Gen     │
│2.3 │ Conduct on-site measurements             │ 1-2 hours │ os-pm Mobile App        │
│2.4 │ Photograph all relevant areas (min 20)   │ During    │ os-pm Photo Doc         │
│2.5 │ Complete site assessment form            │ During    │ os-pm Mobile Form       │
│2.6 │ Identify issues, code concerns, access   │ During    │ os-pm Issue Tracker     │
│2.7 │ Discuss timeline expectations            │ During    │ Verbal                  │
│2.8 │ Upload all documentation                 │ Within 2h │ os-pm Document Vault    │
│2.9 │ Generate site assessment report          │ Same day  │ APP-04 Report Generator │
│2.10│ Send summary to client                   │ Within 24h│ APP-08 Communication    │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

### SOP-003: Project Classification
```
PURPOSE: Categorize projects for proper resource allocation

CLASSIFICATION MATRIX:
┌─────────────┬───────────────┬───────────┬─────────────────┬───────────────────┐
│Classification│ Budget Range  │ Duration  │ Permits Required│ Examples          │
├─────────────┼───────────────┼───────────┼─────────────────┼───────────────────┤
│ Simple      │ $5K-$25K      │ 1-4 weeks │ None/Minor      │ Paint, flooring   │
│ Standard    │ $25K-$100K    │ 4-12 weeks│ Standard        │ Kitchen/bath      │
│ Complex     │ $100K-$500K   │ 12-24 wks │ Multiple        │ Additions         │
│ Major       │ $500K+        │ 24+ weeks │ Extensive       │ New construction  │
└─────────────┴───────────────┴───────────┴─────────────────┴───────────────────┘

AUTOMATION RULES:
├── Budget > $100K → Flag as Complex
├── Multiple trades → Increase complexity tier
├── Historic district → Add review requirements
└── Multi-family → Require Package C minimum
```

---

## 2.2 Phase 2: Planning

### SOP-004: Design Coordination
```
PURPOSE: Manage design development from concept through construction docs
AUTOMATION: 40% (matching, notifications)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│4.1 │ Determine design requirements            │ Day 1     │ os-pm Scope Analysis    │
│4.2 │ Match with design professional           │ Day 1-2   │ m-architect Marketplace │
│4.3 │ Facilitate design kickoff meeting        │ Day 3-5   │ os-pm Calendar + Video  │
│4.4 │ Review conceptual designs (2-3 options)  │ Week 2    │ os-pm Design Review     │
│4.5 │ Document client selections               │ Week 2    │ os-pm Decision Log      │
│4.6 │ Coordinate design development drawings   │ Weeks 2-3 │ os-pm Design Tracking   │
│4.7 │ Review drawings for code compliance      │ Week 3    │ os-pm AI Compliance     │
│4.8 │ Coordinate engineering if required       │ Weeks 3-4 │ m-engineer Network      │
│4.9 │ Facilitate client approval               │ Week 4    │ os-pm Approval Flow     │
│4.10│ Obtain construction documents            │ Week 4    │ os-pm Document Vault    │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

### SOP-005: Permit Management
```
PURPOSE: Navigate permit requirements and obtain approvals
AUTOMATION: 65% (AI pre-review, form generation, tracking)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│5.1 │ Identify required permits by jurisdiction│ Day 1     │ APP-05 Permit DB        │
│5.2 │ AI pre-review plans for issues           │ Auto      │ APP-05 AI Review Engine │
│5.3 │ Apply auto-corrections                   │ Auto      │ APP-05 AI Corrections   │
│5.4 │ Compile permit application package       │ Days 2-3  │ APP-05 Package Builder  │
│5.5 │ Calculate permit fees                    │ Auto      │ APP-05 Fee Calculator   │
│5.6 │ Submit permit application                │ Day 3-4   │ m-permits-inspections   │
│5.7 │ Track application status daily           │ Ongoing   │ APP-05 Permit Tracker   │
│5.8 │ Respond to plan review comments <48hrs   │ As needed │ os-pm Response Tool     │
│5.9 │ Coordinate revisions with design team    │ As needed │ os-pm Revision Tracker  │
│5.10│ Notify client of approval/issues         │ Same day  │ APP-08 Auto Notification│
│5.11│ Download and store approved permits      │ On approval│os-pm Document Vault    │
│5.12│ Schedule required inspections            │ Day of    │ APP-06 Inspection Sched │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘

AI PRE-REVIEW CATCHES:
├── Missing signatures (90% detection)
├── Incomplete forms (95% detection)
├── Code violations (80% detection)
├── Setback errors (85% detection)
└── Document incompleteness (90% detection)

GOAL: 90% first-time approval rate (vs. 60% industry average)
```

### SOP-006: Contractor Selection (Bid Engine)
```
PURPOSE: Source and qualify contractors through competitive bidding
AUTOMATION: 75% (matching, scoring, analysis)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│6.1 │ Define scope and bid requirements        │ Day 1     │ os-pm Bid Package       │
│6.2 │ Generate estimate for SRP baseline       │ Day 1     │ APP-15 Estimation       │
│6.3 │ AI identifies qualified contractors      │ Auto      │ APP-01 Matching Engine  │
│6.4 │ Apply fair rotation algorithm            │ Auto      │ APP-01 Queue Manager    │
│6.5 │ Issue bid invitations (min 3)            │ Day 2     │ APP-01 Invitation Engine│
│6.6 │ Conduct pre-bid site visit if needed     │ Day 3-5   │ APP-02 Visit Scheduler  │
│6.7 │ Collect and organize bid submissions     │ Deadline+1│ APP-01 Bid Portal       │
│6.8 │ AI analyzes bids (price, scope, timeline)│ Auto      │ APP-01 Analysis Engine  │
│6.9 │ Verify contractor credentials            │ Day 2-3   │ APP-01 Credential API   │
│6.10│ Present bid comparison to client         │ Day 3     │ APP-04 Report Generator │
│6.11│ Facilitate contractor interviews         │ Days 4-5  │ os-pm Video/Calendar    │
│6.12│ Document client selection                │ Day 5-6   │ os-pm Decision Log      │
│6.13│ Update contractor queue position         │ Auto      │ APP-01 Queue Manager    │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘

FAIR ROTATION ALGORITHM:
┌─────────────────────────────────────────────────────────────────┐
│ MATCHING CRITERIA (Weighted):                                   │
│ ├── Geographic proximity:    25%                                │
│ ├── Specialty alignment:     25%                                │
│ ├── Availability status:     20%                                │
│ ├── Performance rating:      15%                                │
│ └── Fair rotation score:     15%                                │
│                                                                 │
│ RESULT: Every qualified contractor gets opportunities           │
│ RULE: Winner rotates to back of queue                          │
│ LIMIT: Contractors can bid up to 3% over SRP                   │
└─────────────────────────────────────────────────────────────────┘
```

### SOP-007: Contract Administration
```
PURPOSE: Execute binding agreements between parties
AUTOMATION: 70% (generation, routing, e-signature)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│7.1 │ Generate contract from approved bid      │ Day 1     │ APP-10 Contract Gen     │
│7.2 │ Include scope, schedule, payment, warr.  │ Day 1     │ APP-10 Templates        │
│7.3 │ Review contract with client              │ Day 2     │ os-pm Review Tool       │
│7.4 │ Coordinate contract modifications        │ Days 2-3  │ os-pm Revision Track    │
│7.5 │ Obtain client signature                  │ Day 3-4   │ DocuSign Integration    │
│7.6 │ Obtain contractor signature              │ Day 4-5   │ DocuSign Integration    │
│7.7 │ Collect insurance certificates           │ Day 5     │ os-pm Insurance API     │
│7.8 │ Process initial payment/deposit          │ Day 5-6   │ m-finance-trust Escrow  │
│7.9 │ Issue Notice to Proceed                  │ Day 6     │ APP-10 NTP Generator    │
│7.10│ Store executed contract                  │ Same day  │ os-pm Document Vault    │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

---

## 2.3 Phase 3: Pre-Construction

### SOP-008: Project Scheduling
```
PURPOSE: Create detailed project schedule with milestones
AUTOMATION: 55% (baseline comparison, alerts)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│8.1 │ Receive contractor baseline schedule     │ Week 1    │ os-pm Schedule Import   │
│8.2 │ Review schedule logic and duration       │ Day 1-2   │ os-pm Review Tool       │
│8.3 │ Verify milestone alignment with contract │ Day 2     │ os-pm Milestone Mapper  │
│8.4 │ Identify critical path activities        │ Day 2     │ APP-12 Critical Path    │
│8.5 │ Add inspection and approval milestones   │ Day 3     │ os-pm Schedule Builder  │
│8.6 │ Coordinate material lead times           │ Day 3-4   │ os-pm Lead Time Track   │
│8.7 │ Present schedule to client for approval  │ Day 5     │ os-pm Presentation      │
│8.8 │ Baseline approved schedule               │ Day 5     │ os-pm Schedule Lock     │
│8.9 │ Set up automated milestone reminders     │ Day 5     │ APP-12 Reminder Engine  │
│8.10│ Publish schedule to all stakeholders     │ Day 5     │ APP-08 Schedule Publish │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

---

## 2.4 Phase 4: Construction Management

### SOP-010: Daily Monitoring
```
PURPOSE: Maintain visibility into project progress
AUTOMATION: 60% (variance detection, alerts)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│10.1│ Review contractor daily log/report       │ Each AM   │ os-pm Daily Log Portal  │
│10.2│ Compare progress to schedule             │ Daily     │ os-pm Variance Tool     │
│10.3│ Review site photos from contractor       │ Daily     │ APP-13 Photo Review     │
│10.4│ Flag any concerns or deviations          │ Immediate │ os-pm Issue Tracker     │
│10.5│ Update project dashboard status          │ Daily     │ os-pm Dashboard         │
│10.6│ Respond to contractor RFIs <24 hours     │ As needed │ os-pm RFI Manager       │
│10.7│ Coordinate any required owner decisions  │ As needed │ APP-14 Decision Request │
│10.8│ Document weather delays or force majeure │ As occurs │ os-pm Delay Log         │
│10.9│ Monitor labor and equipment on site      │ Daily     │ os-pm Resource Track    │
│10.10│Update forecast based on actual progress │ Weekly    │ APP-11 Forecast Tool    │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

### SOP-011: Site Visit Protocol
```
PURPOSE: Conduct regular site inspections
AUTOMATION: 45% (checklist gen, report auto-fill)

VISIT FREQUENCY BY PACKAGE:
├── Package A: 0 visits (remote only)
├── Package B: 1-2 visits/month
├── Package C: 2-4 visits/month
└── Package D: 4-8 visits/month

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│11.1│ Schedule site visit based on package     │ Weekly    │ APP-02 Visit Scheduler  │
│11.2│ Notify contractor of planned visit       │ 24h prior │ APP-08 Notification     │
│11.3│ Prepare site visit checklist             │ Day before│ os-pm Checklist Gen     │
│11.4│ Conduct walkthrough with contractor      │ On site   │ os-pm Mobile Checklist  │
│11.5│ Document progress photos (min 10)        │ On site   │ os-pm Photo Doc         │
│11.6│ Note quality concerns or code issues     │ On site   │ APP-13 Issue Logger     │
│11.7│ Verify work matches approved plans       │ On site   │ os-pm Plan Comparison   │
│11.8│ Complete site visit report               │ Same day  │ APP-04 Report Gen       │
│11.9│ Send report to client                    │ Within 24h│ APP-08 Email Engine     │
│11.10│Follow up on open items                  │ Within 48h│ APP-09 Task Manager     │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

### SOP-012: Inspection Coordination
```
PURPOSE: Schedule and manage required inspections
AUTOMATION: 65% (scheduling, tracking, AI prep)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│12.1│ Identify all required inspections        │ Proj start│ APP-06 Inspection Matrix│
│12.2│ Map inspections to project schedule      │ Day 1     │ APP-06 Schedule Integ   │
│12.3│ AI generates readiness checklist         │ Auto      │ APP-06 AI Checklist     │
│12.4│ PM conducts pre-inspection site visit    │ Day before│ APP-02 Site Visit       │
│12.5│ Contractor requests inspection (72h)     │ Per sched │ m-permits-inspections   │
│12.6│ Confirm inspection scheduled             │ Same day  │ APP-06 Confirm Tracker  │
│12.7│ Notify client of pending inspection      │ 24h prior │ APP-08 Notification     │
│12.8│ Ensure site is ready for inspection      │ Day before│ os-pm Readiness Check   │
│12.9│ Document inspection result               │ Same day  │ APP-06 Inspection Log   │
│12.10│If failed, coordinate corrections        │ Within 24h│ APP-06 Correction Track │
│12.11│Schedule re-inspection if needed         │ Same day  │ m-permits-inspections   │
│12.12│Update milestone status upon passing     │ Immediate │ os-pm Milestone Track   │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘

GOAL: 85% first-time pass rate (vs. 60% industry average)
```

### SOP-013: Change Order Management
```
PURPOSE: Process scope changes with proper documentation
AUTOMATION: 70% (impact analysis, routing, tracking)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│13.1│ Receive change request                   │ Day 0     │ os-pm Change Portal     │
│13.2│ Document scope change in detail          │ Day 1     │ os-pm Change Descript   │
│13.3│ Request contractor pricing               │ Day 1     │ APP-03 CO Pricing Req   │
│13.4│ Generate cost estimate for comparison    │ Day 1     │ APP-15 Estimation       │
│13.5│ Review contractor pricing <48 hours      │ Days 2-3  │ os-pm Pricing Review    │
│13.6│ AI analyzes schedule impact              │ Auto      │ APP-03 Impact Tool      │
│13.7│ AI analyzes cost impact                  │ Auto      │ APP-03 Cost Analysis    │
│13.8│ Assign risk level                        │ Auto      │ APP-11 Risk Assessment  │
│13.9│ Prepare change order document            │ Day 4     │ APP-10 CO Generator     │
│13.10│Present to client with recommendation    │ Day 4-5   │ APP-14 CO Presentation  │
│13.11│Obtain client approval/rejection         │ Days 5-7  │ APP-14 Approval Flow    │
│13.12│Execute change order if approved         │ Day 7     │ os-pm CO Execution      │
│13.13│Update budget, schedule, contract        │ Same day  │ APP-07 Project Update   │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

### SOP-014: Progress Payments
```
PURPOSE: Process milestone-based payments accurately
AUTOMATION: 60% (verification, calculation, routing)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│14.1│ Receive payment request from contractor  │ Milestone │ os-pm Payment Portal    │
│14.2│ Verify milestone completion              │ Day 1     │ os-pm Milestone Verify  │
│14.3│ Review supporting documentation          │ Day 1     │ os-pm Document Review   │
│14.4│ Conduct site verification if required    │ Day 1-2   │ APP-02 Site Verify      │
│14.5│ Calculate payment amount per contract    │ Day 2     │ os-pm Payment Calc      │
│14.6│ Apply any retainage per contract         │ Day 2     │ os-pm Retainage Track   │
│14.7│ Prepare payment recommendation           │ Day 2     │ APP-14 Payment Report   │
│14.8│ Send to client for approval              │ Day 2     │ APP-14 Approval Flow    │
│14.9│ Process payment upon approval            │ Day 3     │ m-finance-trust Release │
│14.10│Document payment in project records      │ Same day  │ APP-07 Payment Log      │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

---

## 2.5 Phase 5: Project Closeout

### SOP-015: Punch List Management
```
PURPOSE: Document and track completion of all outstanding items
AUTOMATION: 55% (AI photo analysis, tracking)

STEPS:
┌────┬──────────────────────────────────────────┬───────────┬─────────────────────────┐
│Step│ Action                                   │ Timeline  │ Tool/System             │
├────┼──────────────────────────────────────────┼───────────┼─────────────────────────┤
│15.1│ Schedule pre-final walkthrough           │ 2 wks end │ os-pm Calendar          │
│15.2│ Conduct walkthrough, document items      │ Scheduled │ os-pm Punch List App    │
│15.3│ AI analyzes photos for defects           │ Auto      │ APP-13 QA Inspector     │
│15.4│ Photograph each punch list item          │ During    │ os-pm Photo Doc         │
│15.5│ Assign priority and responsible party    │ Same day  │ os-pm Punch Manager     │
│15.6│ Send punch list to contractor            │ Same day  │ APP-08 Contractor Port  │
│15.7│ Set completion deadline (typically 2 wks)│ Same day  │ os-pm Deadline Track    │
│15.8│ Track daily progress on items            │ Daily     │ APP-09 Progress Track   │
│15.9│ Conduct verification walkthrough         │ On compl  │ APP-02 Verify Visit     │
│15.10│Close items or add new items found       │ Same day  │ os-pm Punch Update      │
│15.11│Repeat until all items complete          │ As needed │ os-pm Iteration Track   │
└────┴──────────────────────────────────────────┴───────────┴─────────────────────────┘
```

---

# PART 3: COMMAND CENTER AUTOMATION LOGIC

## 3.1 15 Mini-Apps Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMMAND CENTER - 15 APPS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRIORITY 1 (Foundation)                                                   │
│  ├── APP-01 Bid Engine         → Contractor bidding automation            │
│  ├── APP-02 Visit Scheduler    → Site visit optimization                  │
│  └── APP-09 Task Queue Manager → PM task prioritization                   │
│                                                                             │
│  PRIORITY 2 (Core Workflows)                                               │
│  ├── APP-03 Change Order       → Change order processing                  │
│  ├── APP-04 Report Generator   → Auto-generate reports                    │
│  ├── APP-05 Permit Tracker     → Permit status monitoring                 │
│  └── APP-06 Inspection Coord   → Inspection scheduling                    │
│                                                                             │
│  PRIORITY 3 (Operations)                                                   │
│  ├── APP-07 Budget Tracker     → Budget monitoring & alerts               │
│  ├── APP-08 Communication Hub  → Centralized messaging                    │
│  └── APP-10 Document Generator → Contract/letter generation               │
│                                                                             │
│  PRIORITY 4 (AI Layer)                                                     │
│  ├── APP-11 Predictive Engine  → Risk forecasting                         │
│  ├── APP-12 Smart Scheduler    → Automation orchestration                 │
│  ├── APP-13 QA Inspector       → Photo AI analysis                        │
│  └── APP-14 Decision Support   → One-click approvals                      │
│                                                                             │
│  PRIORITY 5 (Estimation) ⭐ NEW                                            │
│  └── APP-15 Estimation Tool    → Cost estimation & takeoffs               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 APP-01: Bid Engine Logic

```typescript
// Bid Engine Workflow

TRIGGER: PM creates bid request
  ↓
STEP 1: Generate Estimate (NEW - uses APP-15)
  - Create SRP (Suggested Retail Price) baseline
  - Define acceptable bid range (SRP to SRP+3%)
  ↓
STEP 2: Find Contractors
  - Query contractors by trade + location
  - Apply fair rotation algorithm
  - Calculate match scores
  ↓
STEP 3: Send Invitations
  - Send email/SMS to top 5-10 contractors
  - Set deadline (typically 5-7 days)
  - Track views and responses
  ↓
STEP 4: Collect Bids
  - Receive bid submissions
  - Validate completeness
  - Check bid against SRP (max 3% over)
  - Store in database
  ↓
STEP 5: Analyze Bids
  - AI scores each bid (0-100)
  - Factors: price vs SRP, timeline, quality, fit
  - Identify strengths/considerations
  ↓
STEP 6: Generate Comparison
  - Create side-by-side comparison
  - Highlight AI recommendation
  - Include reasoning
  ↓
STEP 7: Award Contract
  - Client approves selection
  - Generate contract via APP-10
  - Update contractor queue position (winner to back)

SCORING ALGORITHM:
├── Price vs SRP:        30% weight
├── Timeline:            20% weight
├── Contractor Rating:   20% weight
├── Past Performance:    15% weight
├── Availability:        10% weight
└── Response Quality:     5% weight
```

## 3.3 APP-02: Visit Scheduler Logic

```typescript
// Visit Scheduler Workflow

DAILY TRIGGER: 6:00 AM
  ↓
STEP 1: Get Today's Projects
  - Query all active projects
  - Filter by package tier (C/D = priority)
  - Check visit frequency requirements
  ↓
STEP 2: Check PM Capacity
  - Query each PM's calendar
  - Calculate available hours
  - Balance workloads
  ↓
STEP 3: Route Optimization
  - Get project locations
  - Use Mapbox routing API
  - Minimize travel time
  ↓
STEP 4: Weather Check
  - Query OpenWeather API
  - Flag outdoor work concerns
  - Suggest rescheduling if needed
  ↓
STEP 5: Generate Schedule
  - Create optimized daily schedule
  - Assign PMs to visits
  - Generate checklists per visit type
  ↓
STEP 6: Notify Stakeholders
  - Send PM calendar invites
  - Notify contractors
  - Alert clients (optional)
```

## 3.4 APP-09: Task Queue Logic

```typescript
// Task Queue Manager Workflow

TRIGGERS:
├── New project created
├── Milestone reached
├── Inspection scheduled
├── Change order submitted
├── Alert generated
└── Manual task creation

PRIORITIZATION ALGORITHM:
┌─────────────────────────────────────────────────────────────────┐
│ Priority Score = Base + Modifiers                               │
│                                                                 │
│ BASE SCORES:                                                    │
│ ├── Urgent (red):     1000                                     │
│ ├── High (orange):     500                                     │
│ ├── Medium (yellow):   100                                     │
│ └── Low (gray):         10                                     │
│                                                                 │
│ MODIFIERS:                                                      │
│ ├── Package D client:  +200                                    │
│ ├── Package C client:  +100                                    │
│ ├── Project value >$500K: +150                                 │
│ ├── Overdue:           +500                                    │
│ ├── Due today:         +300                                    │
│ ├── Due this week:     +100                                    │
│ ├── Has dependencies:  +50 per blocked task                    │
│ └── Inspection related:+200                                    │
│                                                                 │
│ FINAL: Sorted by Priority Score DESC                           │
└─────────────────────────────────────────────────────────────────┘

AUTO-ASSIGNMENT RULES:
├── Match PM to assigned project
├── Balance workload across PMs
├── Respect PM specializations
├── Consider geographic proximity
└── Escalate if unassigned >24 hours
```

## 3.5 APP-11: Predictive Engine Logic

```typescript
// Predictive Engine - Delay Risk Model

INPUT FEATURES:
├── avgMilestoneVariance    // Days late on average
├── weatherDelayDays        // Weather delays in past 2 weeks
├── inspectionFailureRate   // % of inspections failed
├── changeOrdersLast30Days  // Count of change orders
├── laborShortageEvents     // Labor issues recorded
├── budgetVariance          // % over/under budget
├── permitDelayDays         // Permit processing delays
└── rfiResponseTime         // Avg RFI turnaround

RULE-BASED PREDICTION:

if (avgMilestoneVariance > 3 days) {
  riskScore += 0.30
  factors.push("Milestone Delays")
}

if (weatherDelayDays > 3) {
  riskScore += 0.20
  factors.push("Weather Delays")
}

if (inspectionFailureRate > 0.3) {
  riskScore += 0.25
  factors.push("Inspection Issues")
}

if (changeOrdersLast30Days > 2) {
  riskScore += 0.15
  factors.push("Scope Changes")
}

if (laborShortageEvents > 2) {
  riskScore += 0.10
  factors.push("Labor Issues")
}

OUTPUT:
├── probability:      0-100% risk score
├── expectedDays:     Predicted delay (0-14 days)
├── confidence:       Model confidence level
├── factors:          Contributing factors
└── recommendations:  AI-suggested actions

RECOMMENDATION THRESHOLDS:
├── <30%:  "Project on track. Continue monitoring."
├── 30-60%: "Moderate risk. Increase site visits."
└── >60%:  "High risk. Schedule recovery meeting."
```

## 3.6 APP-14: Decision Support Logic

```typescript
// Decision Support - One-Click Approvals

DECISION TYPES:
├── Change Order Approval
├── Bid Award
├── Payment Release
├── Milestone Sign-off
├── Inspection Scheduling
└── Risk Mitigation Actions

APPROVAL ROUTING:
┌─────────────────────────────────────────────────────────────────┐
│ Decision Type        │ Auto-Approve If    │ Requires Review    │
├──────────────────────┼────────────────────┼────────────────────┤
│ Change Order <$1K    │ Within contingency │ Always             │
│ Change Order >$1K    │ Never              │ Always             │
│ Bid Award <$10K      │ Top AI recommend   │ If close scores    │
│ Bid Award >$10K      │ Never              │ Always             │
│ Payment <$5K         │ Milestone verified │ If issues flagged  │
│ Payment >$5K         │ Never              │ Always             │
│ Inspection Schedule  │ PM capacity OK     │ If conflicts       │
│ Risk Mitigation      │ Low risk score     │ If medium/high     │
└──────────────────────┴────────────────────┴────────────────────┘

AI RECOMMENDATION FORMAT:
{
  decision_type: "CHANGE_ORDER_APPROVAL",
  recommendation: "APPROVE",
  confidence: 0.92,
  reasoning: "Cost within 5% contingency. Client previously 
              expressed interest. No critical path impact.",
  alternatives: ["Request more info", "Counter-offer"],
  risk_assessment: "LOW"
}
```

## 3.7 APP-15: Estimation Tool Logic ⭐ NEW

```typescript
// Estimation Tool Workflow

PURPOSE: Generate accurate cost estimates for construction projects

TRIGGERS:
├── New project created
├── Scope change requested
├── Bid package preparation (SRP baseline)
├── Budget initialization
└── Manual estimate request

ESTIMATION WORKFLOW:
┌─────────────────────────────────────────────────────────────────┐
│ INPUT                                                           │
│ ├── Project scope (from intake)                                │
│ ├── Square footage                                             │
│ ├── Location (jurisdiction)                                    │
│ ├── Project type (kitchen, bath, addition, etc.)              │
│ ├── Quality tier (standard, premium, luxury)                   │
│ └── Special requirements                                       │
│                                                                 │
│ PROCESSING                                                      │
│ ├── 1. Load cost database for location                         │
│ ├── 2. Apply trade-specific unit costs                         │
│ ├── 3. Calculate material quantities (AI takeoff)              │
│ ├── 4. Add labor hours by trade                                │
│ ├── 5. Apply overhead and profit margins                       │
│ ├── 6. Include permit fees (from jurisdiction DB)              │
│ ├── 7. Add contingency (5-15% based on complexity)            │
│ └── 8. Generate range (low/mid/high)                          │
│                                                                 │
│ OUTPUT                                                          │
│ ├── Estimate summary (total range)                             │
│ ├── Line-item breakdown by CSI division                        │
│ ├── Trade-by-trade costs                                       │
│ ├── Material vs labor split                                    │
│ ├── Timeline estimate                                          │
│ └── Confidence score                                           │
└─────────────────────────────────────────────────────────────────┘

COST DATABASE STRUCTURE:
├── Regional multipliers (DC, Baltimore, etc.)
├── Trade rates (electrical, plumbing, HVAC, etc.)
├── Material costs (updated quarterly)
├── Permit fee schedules by jurisdiction
├── Historical project actuals
└── Inflation adjustments

ESTIMATION ACCURACY TARGETS:
├── Simple projects: ±10%
├── Standard projects: ±15%
├── Complex projects: ±20%
└── Historical accuracy tracked per estimator

INTEGRATION WITH OTHER APPS:
├── APP-01 Bid Engine: Provides SRP (Suggested Retail Price)
├── APP-07 Budget Tracker: Initializes project budget
├── APP-03 Change Order: Calculates change impact
├── APP-11 Predictive: Uses estimates for cost overrun prediction
└── APP-04 Report Generator: Includes estimates in proposals

JOB TYPES:
├── estimate.generate: Create new estimate
├── estimate.revise: Update existing estimate
├── estimate.compare: Compare estimate vs actual
└── estimate.batch: Generate multiple estimates
```

---

# PART 4: INTEGRATION ARCHITECTURE

## 4.1 Module Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE INTEGRATION MAP                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT APPS                    API GATEWAY                 INTERNAL APPS  │
│  ═══════════                    ═══════════                 ═════════════  │
│                                                                             │
│  m-marketplace ────────┐                           ┌────── os-pm           │
│  m-project-owner ──────┤                           │       (Executes svc)  │
│  m-ops-services ───────┤        ┌─────────┐        ├────── os-admin        │
│  m-architect ──────────┼───────►│ Fastify │◄───────┤       (Controls all)  │
│  m-engineer ───────────┤        │   API   │        │                       │
│  m-permits-inspections─┤        └────┬────┘        │                       │
│  m-finance-trust ──────┤             │             │                       │
│  m-inspector ──────────┘             │             │                       │
│                                      │             │                       │
│                                      ▼             │                       │
│                              ┌──────────────┐      │                       │
│                              │   Database   │      │                       │
│                              │  (Supabase)  │      │                       │
│                              └──────┬───────┘      │                       │
│                                     │              │                       │
│                                     ▼              │                       │
│                              ┌──────────────┐      │                       │
│                              │   Command    │◄─────┘                       │
│                              │   Center     │                              │
│                              │  (15 Apps)   │                              │
│                              └──────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Complete Data Flow

### User Journey: Homeowner to Project Completion

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOMEOWNER JOURNEY                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. DISCOVERY                                                               │
│    m-marketplace → Browse services → View contractors                       │
│         │                                                                   │
│         ▼                                                                   │
│ 2. ENGAGEMENT                                                              │
│    m-marketplace → Request quote → Book consultation                        │
│         │                                                                   │
│         ▼                                                                   │
│ 3. SUBSCRIPTION                                                            │
│    m-ops-services → Select Package (A/B/C/D) → Stripe payment              │
│         │                                                                   │
│         ▼                                                                   │
│ 4. PROJECT SETUP                                                           │
│    m-project-owner → Create project → Upload docs                          │
│         │                                                                   │
│         ├──────────────────────────────────────────────────┐               │
│         ▼                                                  ▼               │
│ 5. DESIGN (Optional)                              6. ESTIMATION            │
│    m-architect → AI Design → Architect review     APP-15 → Generate SRP    │
│         │                                              │                   │
│         └──────────────────────┬───────────────────────┘                   │
│                                ▼                                            │
│ 7. BIDDING                                                                 │
│    APP-01 Bid Engine → Fair rotation → Contractor bids (max SRP+3%)        │
│         │                                                                   │
│         ▼                                                                   │
│ 8. CONTRACT & ESCROW                                                       │
│    APP-10 Document Gen → Contract → m-finance-trust (escrow funded)        │
│         │                                                                   │
│         ▼                                                                   │
│ 9. PERMITTING                                                              │
│    APP-05 Permit Tracker → m-permits-inspections → Jurisdiction            │
│         │                                                                   │
│         ▼                                                                   │
│ 10. CONSTRUCTION                                                           │
│    os-pm → Site visits → APP-13 QA → APP-04 Reports                        │
│         │                                                                   │
│         ▼                                                                   │
│ 11. INSPECTIONS                                                            │
│    APP-06 → m-permits-inspections → Pass/Fail → Corrections                │
│         │                                                                   │
│         ▼                                                                   │
│ 12. PAYMENTS                                                               │
│    APP-07 Budget → os-pm milestone → m-finance-trust release              │
│         │                                                                   │
│         ▼                                                                   │
│ 13. CLOSEOUT                                                               │
│    APP-13 Punch list → Final inspection → Certificate of Occupancy        │
│         │                                                                   │
│         ▼                                                                   │
│ 14. COMPLETION                                                             │
│    m-project-owner → Final report → Review contractor → Done!              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Execution Flow: os-pm Implements m-ops-services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVICE EXECUTION FLOW                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT SIDE                    OPERATIONAL SIDE                            │
│  ═══════════                    ════════════════                            │
│                                                                             │
│  m-ops-services                      os-pm                                  │
│  ┌─────────────────┐           ┌─────────────────┐                         │
│  │ Client Portal   │           │ PM Workspace    │                         │
│  │                 │           │                 │                         │
│  │ - View package  │ ────────► │ - Task queue    │                         │
│  │ - See progress  │           │ - Execute tasks │                         │
│  │ - Upload docs   │ ◄──────── │ - Generate rpts │                         │
│  │ - View reports  │           │ - Track time    │                         │
│  │ - Communicate   │ ◄───────► │ - Communicate   │                         │
│  │                 │           │                 │                         │
│  └────────┬────────┘           └────────┬────────┘                         │
│           │                             │                                   │
│           │         COMMAND CENTER      │                                   │
│           │         (15 Mini-Apps)      │                                   │
│           │              │              │                                   │
│           └──────────────┼──────────────┘                                   │
│                          ▼                                                  │
│           ┌─────────────────────────────┐                                  │
│           │ APP-09 Task Queue Manager   │                                  │
│           │ - Auto-creates tasks        │                                  │
│           │ - Assigns to PMs            │                                  │
│           │ - Tracks completion         │                                  │
│           └─────────────────────────────┘                                  │
│                          │                                                  │
│                          ▼                                                  │
│           ┌─────────────────────────────┐                                  │
│           │ os-admin (Monitors All)     │                                  │
│           │ - Platform metrics          │                                  │
│           │ - User management           │                                  │
│           │ - Financial oversight       │                                  │
│           └─────────────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.3 Event-Driven Architecture

```typescript
// Event Bus Configuration

KEALEE_EVENTS = {
  // Project Events
  PROJECT_CREATED: 'project.created',
  PROJECT_STARTED: 'project.started',
  PROJECT_COMPLETED: 'project.completed',
  
  // Bid Events
  BID_REQUEST_CREATED: 'bid.request.created',
  CONTRACTORS_MATCHED: 'bid.contractors.matched',
  BID_SUBMITTED: 'bid.submitted',
  BID_ANALYSIS_COMPLETE: 'bid.analysis.complete',
  BID_AWARDED: 'bid.awarded',
  
  // Visit Events
  VISIT_SCHEDULED: 'visit.scheduled',
  VISIT_COMPLETED: 'visit.completed',
  
  // Permit Events
  PERMIT_SUBMITTED: 'permit.submitted',
  PERMIT_APPROVED: 'permit.approved',
  PERMIT_CORRECTIONS_NEEDED: 'permit.corrections',
  
  // Inspection Events
  INSPECTION_SCHEDULED: 'inspection.scheduled',
  INSPECTION_PASSED: 'inspection.passed',
  INSPECTION_FAILED: 'inspection.failed',
  
  // Financial Events
  PAYMENT_REQUESTED: 'payment.requested',
  PAYMENT_APPROVED: 'payment.approved',
  PAYMENT_RELEASED: 'payment.released',
  
  // Risk Events
  RISK_ALERT_HIGH: 'risk.alert.high',
  RISK_ALERT_MEDIUM: 'risk.alert.medium',
  
  // Task Events
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_OVERDUE: 'task.overdue',
  
  // Estimation Events ⭐ NEW
  ESTIMATE_REQUESTED: 'estimate.requested',
  ESTIMATE_GENERATED: 'estimate.generated',
  ESTIMATE_APPROVED: 'estimate.approved',
  ESTIMATE_REVISED: 'estimate.revised'
}
```

## 4.4 Queue Configuration

```typescript
// BullMQ Queue Setup

QUEUE_NAMES = {
  BID_ENGINE: 'kealee:bid-engine',
  VISIT_SCHEDULER: 'kealee:visit-scheduler',
  CHANGE_ORDER: 'kealee:change-order',
  REPORT_GENERATOR: 'kealee:report-generator',
  PERMIT_TRACKER: 'kealee:permit-tracker',
  INSPECTION: 'kealee:inspection',
  BUDGET_TRACKER: 'kealee:budget-tracker',
  COMMUNICATION: 'kealee:communication',
  TASK_QUEUE: 'kealee:task-queue',
  DOCUMENT_GENERATOR: 'kealee:document-generator',
  PREDICTIVE: 'kealee:predictive',
  SCHEDULER: 'kealee:scheduler',
  QA_INSPECTOR: 'kealee:qa-inspector',
  DECISION_SUPPORT: 'kealee:decision-support',
  ESTIMATION: 'kealee:estimation'  // ⭐ NEW
}

// Default Job Options
defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000
  },
  removeOnComplete: 100,
  removeOnFail: 50
}

// Priority Levels
PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4
}
```

---

# PART 5: METRICS & KPIs

## 5.1 Platform Metrics

```
ACQUISITION METRICS:
├── New users (by type)
├── Traffic sources
├── Sign-up conversion rate
├── CAC by channel

ENGAGEMENT METRICS:
├── DAU/MAU ratio
├── Projects posted
├── Bids submitted
├── Messages sent
├── Time on platform

CONVERSION METRICS:
├── Lead-to-contract rate
├── Average contract value
├── Win rate by vendor tier
├── Quote-to-close time

REVENUE METRICS:
├── MRR/ARR
├── GMV (Gross Merchandise Value)
├── ARPU (Average Revenue Per User)
├── LTV (Lifetime Value)
├── Churn rate

AUTOMATION METRICS:
├── Task automation rate: Target >60%
├── First-time permit approval: Target 90%
├── First-time inspection pass: Target 85%
├── Report auto-fill rate: Target 80%
├── AI recommendation accuracy: Target 85%
├── Estimation accuracy: Target ±15%  ⭐ NEW
```

## 5.2 PM Performance Metrics

```
EFFICIENCY METRICS:
├── Tasks completed per week
├── Average task completion time
├── Client satisfaction score
├── On-time delivery rate

QUALITY METRICS:
├── First-time permit approval %
├── First-time inspection pass %
├── Client complaint rate
├── Escalation rate

CAPACITY METRICS:
├── Hours logged vs package hours
├── Projects managed concurrently
├── Workload balance score
└── Overtime hours
```

---

# PART 6: REVENUE MODEL

## 6.1 Revenue Streams

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REVENUE STREAMS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RECURRING REVENUE (MRR)                                                   │
│  ═══════════════════════════════════════════════════════════════════════   │
│  PM Packages:                                                              │
│  ├── Package A: $1,750/month                                              │
│  ├── Package B: $3,750/month                                              │
│  ├── Package C: $9,500/month                                              │
│  └── Package D: $16,500/month                                             │
│                                                                             │
│  TRANSACTIONAL REVENUE                                                     │
│  ═══════════════════════════════════════════════════════════════════════   │
│  Marketplace Fees:                                                         │
│  ├── Platform fee: 3% (0% for Package C/D)                                │
│  ├── Escrow fee: 1% (max $500) via m-finance-trust                        │
│  └── Payment processing: 2.9% + $0.30                                     │
│                                                                             │
│  ONE-TIME SERVICES                                                         │
│  ═══════════════════════════════════════════════════════════════════════   │
│  Permits:                                                                  │
│  ├── Package A: $495                                                      │
│  ├── Package B: $1,295                                                    │
│  ├── Package C: $2,995                                                    │
│  └── Package D: $7,500/month (enterprise)                                 │
│                                                                             │
│  À La Carte Services:                                                      │
│  ├── Permit assistance: $495                                              │
│  ├── Inspection coordination: $295                                        │
│  ├── Contractor coordination: $395/week                                   │
│  ├── Change order management: $195                                        │
│  ├── Site visit: $250                                                     │
│  ├── Budget tracking setup: $495                                          │
│  └── Cost estimate: $195-$995 (by complexity) ⭐ NEW                      │
│                                                                             │
│  EXPEDITED SERVICES (Markup)                                               │
│  ═══════════════════════════════════════════════════════════════════════   │
│  Permit expediting: 15-25% markup on jurisdiction fees                    │
│  Example: $500 expedite fee → Charge $625 → Profit $125                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 7: SECURITY & COMPLIANCE

## 7.1 Access Control

```
ROLE-BASED ACCESS CONTROL (RBAC):

ADMIN (os-admin):
├── Full platform access
├── User management
├── Financial reporting
├── System configuration
└── All project visibility

PM (os-pm):
├── Assigned clients only
├── Project management tools
├── Report generation
├── Document access
└── No financial admin

CLIENT (m-project-owner, m-ops-services):
├── Own projects only
├── View-only for most data
├── Approve decisions
├── Communication with PM
└── Payment authorization

CONTRACTOR (m-marketplace, m-ops-services):
├── Bid on projects
├── Own profile management
├── Job communication
└── Payment receipt

ARCHITECT/ENGINEER (m-architect, m-engineer):
├── Assigned projects
├── Document upload
├── Design collaboration
└── Review tracking
```

## 7.2 Data Protection

```
ENCRYPTION:
├── Data at rest: AES-256 (Supabase default)
├── Data in transit: TLS 1.3
├── Secrets: Environment variables (never committed)
└── Sensitive fields: Additional encryption layer

AUDIT LOGGING:
├── All user actions logged
├── Login/logout tracking
├── Data access logging
├── Admin action logging
└── Retention: 7 years

BACKUP & RECOVERY:
├── Database: Daily automated backups
├── Files: Redundant storage (S3/R2)
├── RTO: <4 hours
└── RPO: <24 hours
```

---

# PART 8: UI/UX DESIGN SPECIFICATIONS

## 8.1 Design System

### Color Palette by Module

| Module | Primary Color | Accent | Purpose |
|--------|---------------|--------|---------|
| m-marketplace | #1E40AF (Blue) | #F97316 (Orange) | Trust + Action |
| m-project-owner | #1E40AF | #10B981 (Green) | Trust + Progress |
| m-ops-services | #1E40AF | #8B5CF6 (Purple) | Trust + Premium |
| m-architect | #6366F1 (Indigo) | #F97316 | Creative + Action |
| m-engineer | #0891B2 (Cyan) | #F97316 | Technical + Action |
| m-permits-inspections | #7C3AED (Violet) | #10B981 | Authority + Success |
| m-finance-trust | #059669 (Emerald) | #1E40AF | Money + Trust |
| os-pm | #1E40AF | #F97316 | Operations |
| os-admin | #111827 (Dark) | #F97316 | Control |

### Typography

```
Display: Plus Jakarta Sans (headings, marketing)
Body: Inter (UI text, forms)
Mono: JetBrains Mono (code, IDs, technical)
```

### Component Library

```
80+ shared components in packages/ui:
├── Buttons (Primary, Secondary, Ghost, Destructive)
├── Forms (Input, Select, Checkbox, Radio, DatePicker)
├── Cards (Project, Contractor, Bid, Task, Estimate)
├── Tables (Sortable, Filterable, Paginated)
├── Charts (Line, Bar, Donut, Gauge)
├── Navigation (Sidebar, TopNav, Breadcrumbs)
├── Modals (Dialog, Sheet, Drawer)
├── Feedback (Toast, Alert, Progress)
└── Construction-Specific (BidCard, VisitCard, PermitStatus, EstimateCard)
```

## 8.2 Page Layouts by Module

### m-marketplace Layout
- Marketing-focused with large hero sections
- Card grids for service categories
- Prominent CTAs ("Find Work" / "Hire Pros")
- Trust signals (ratings, badges, stats)
- Mobile-first responsive design

### m-project-owner Layout
- Dashboard-centric with project cards
- Progress trackers and timelines
- Document galleries
- Communication panels
- Financial summaries

### m-ops-services / os-pm Layout
- Work queue as primary view
- Kanban boards for tasks
- Calendar integration
- Quick action buttons
- Mobile-optimized for field work

### os-admin Layout
- Dense information display
- Multi-panel dashboards
- Real-time metrics
- System monitoring
- User management tables

---

# APPENDIX A: STRIPE PRODUCT IDS

```
PM PACKAGES:
├── price_package_a_monthly: $1,750/month
├── price_package_b_monthly: $3,750/month
├── price_package_c_monthly: $9,500/month
└── price_package_d_monthly: $16,500/month

PERMIT PACKAGES:
├── price_permit_a: $495 one-time
├── price_permit_b: $1,295 one-time
├── price_permit_c: $2,995 one-time
└── price_permit_d_monthly: $7,500/month

OPS SERVICES:
├── price_permit_assist: $495
├── price_inspection_coord: $295
├── price_contractor_coord_weekly: $395/week
├── price_change_order_mgmt: $195
├── price_site_visit: $250
├── price_budget_setup: $495
├── price_estimate_simple: $195
├── price_estimate_standard: $495
└── price_estimate_complex: $995
```

---

# APPENDIX B: API ENDPOINTS

```
/api/v1/projects          → Project CRUD
/api/v1/bids              → Bid management
/api/v1/visits            → Site visit scheduling
/api/v1/permits           → Permit tracking
/api/v1/inspections       → Inspection coordination
/api/v1/contractors       → Contractor management
/api/v1/users             → User management
/api/v1/payments          → Payment processing
/api/v1/escrow            → Escrow management (m-finance-trust)
/api/v1/documents         → Document management
/api/v1/reports           → Report generation
/api/v1/tasks             → Task management
/api/v1/estimates         → Cost estimation (APP-15)
/api/v1/command-center    → Automation control
/api/webhooks/stripe      → Stripe webhooks
/api/webhooks/docusign    → DocuSign webhooks
```

---

**Document Version:** 2.1
**Created:** January 30, 2026
**Last Updated:** February 6, 2026
**Sources:** All chat sessions, PM Execution Framework, Production Build Plan, PM App Specifications
**Status:** Updated with implementation status and corrections

---

# ADDENDUM: IMPLEMENTATION STATUS (February 2026)

## Current Build State

### Frontend Apps (12 apps in apps/)

| App | Purpose | Status | Completeness |
|-----|---------|--------|-------------|
| os-admin | Platform administration | Functional | 70% |
| os-pm | PM workspace | Functional | 60% |
| m-marketplace | Central hub, marketing, sales | Partial | 40% |
| m-project-owner | Homeowner project dashboard | Functional | 50% |
| m-ops-services | GC/Builder service portal | Partial | 30% |
| m-architect | Design services hub | Functional | 50% |
| m-engineer | Engineering services hub | Stub | 10% - needs full hub UI |
| m-permits-inspections | Permit tracking & acceleration | Partial | 40% |
| m-finance-trust | Escrow & payment protection | Functional | 55% |
| m-estimation | Cost estimation tool | Functional | 65% |
| m-inspector | Third-party inspection portal | Empty | 0% - needs full build |
| web | Marketing landing page | Empty | 0% - needs full build |

### Backend API (services/api)

**Complete:** Auth, Users, Orgs, RBAC, Events, Audit, Entitlements, PM, Disputes, Properties, Billing, Projects, Readiness, Contracts (full suite), Milestones, DocuSign, Handoff, Closeout, Payments, Accounting, Marketplace, Leads, Architect (11 modules)

**Partial:** Escrow release workflow, Permit application workflow, Inspection scheduling

**Not Started:** Engineer Hub API, ML/Automation API (Stage 9)

### Command Center (15 Mini-Apps)

All 15 apps have database models in the Prisma schema. APP-15 (Estimation Tool) has a dedicated package. The remaining 14 apps are implemented as API route modules with basic CRUD operations. Full automation logic (BullMQ workers, AI processing, scheduling) is pending for most apps.

### Database (Prisma Schema)

~140 models covering all platform features. Schema is comprehensive and matches this SOP document. Key additions since v2.0:
- SOP v2 service subscription models (PMServiceSubscription, PermitServiceSubscription, ALaCarteService)
- Platform fee configuration (PlatformFeeConfig, MarketplaceFeeConfig)
- Service plans (ServicePlan)
- Roles and permissions (Role, Permission, RolePermission)
- Command Center infrastructure (DashboardWidget, JobQueue, JobSchedule, SystemConfig)
- Integration credentials (IntegrationCredential, AIConversation)

### Security & Production Hardening (Completed Feb 2026)

- Graceful shutdown handler (SIGTERM/SIGINT)
- Test routes gated in production
- CORS tightened with explicit origins
- Error handler hardened (no stack traces in production)
- Request ID traceability
- Unhandled rejection/exception handlers
- Environment validation (fatal exit on missing required vars)
- Connection pool configured
- Webhook signature verification

### Seed Data Requirements

See `SEED_DATA_REQUIREMENTS.md` for complete list of data needed per app, including:
- Roles & Permissions (6 roles, 50+ permissions)
- Service Plans (8 plans matching Stripe products)
- Platform fee configs
- Estimation data (materials, labor, equipment from BLS/RSMeans)
- Jurisdiction data for permits
- Document and message templates

### Deployment Architecture

- **Backend:** Railway (Fastify API + PostgreSQL + Redis)
- **Frontend:** Vercel (all Next.js apps, auto-deploy disabled for manual control)
- **Database:** PostgreSQL via Railway (Prisma ORM)
- **Auth:** Supabase (JWT + 2FA/TOTP)
- **Payments:** Stripe Connect (test mode, 36 products created)
- **Monitoring:** Sentry (error tracking), structured request logging

## Changes from SOP v2.0

1. **m-inspector** added as a separate app (third-party inspection services portal)
2. **m-estimation** built as a full wizard-flow app with project creation through export
3. **web** app added for marketing landing page (not yet built)
4. **Security hardening** completed for production deployment
5. **Vercel auto-deploy disabled** - manual deployment control via Railway
6. **4 previously disabled modules re-enabled:** Audit routes, Accounting routes, Compliance Gates, Stripe Webhooks
7. **Production readiness at ~75%** - See PRODUCTION_READINESS_CHECKLIST.md

---

*This document is proprietary to Kealee Construction LLC.*
