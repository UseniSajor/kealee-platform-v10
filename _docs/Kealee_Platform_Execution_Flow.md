# Kealee Platform v10 — Execution & Automation Flow

## How the Platform Delivers After Signup

**From User Registration → Service Delivery → Ongoing Automation**

This document maps the complete execution lifecycle for every user type on the Kealee Platform. It covers what happens behind the scenes when a user signs up, orders a product, and how the Command Center's 15 mini-apps and AI agents automate the work.

---

## Table of Contents

1. [Signup & Onboarding Engine](#1-signup--onboarding-engine)
2. [Execution by User Type](#2-execution-by-user-type)
   - 2.1 Homeowner / Property Owner Signs Up
   - 2.2 Real Estate Developer Signs Up
   - 2.3 Property Manager Signs Up
   - 2.4 Contractor / GC / Builder Signs Up
   - 2.5 Architect / Engineer Signs Up
3. [Execution by Product Ordered](#3-execution-by-product-ordered)
   - 3.1 Marketplace Lead (Free for Contractors)
   - 3.2 Marketplace Subscription ($49–$299/mo)
   - 3.3 PM Package Subscription ($1,750–$16,500/mo)
   - 3.4 Architecture Package ($2,500–$35,000)
   - 3.5 Permit Package ($495–$7,500)
   - 3.6 Project Owner Package ($49–$999/mo)
   - 3.7 One-Time Services ($125–$5,995)
4. [Command Center Automation (15 Apps in Action)](#4-command-center-automation-15-apps-in-action)
   - 4.1 Event-Driven Trigger Map
   - 4.2 APP-01 through APP-15: When Each Fires
   - 4.3 Cross-App Chain Reactions
5. [AI Agent Automation Layer](#5-ai-agent-automation-layer)
   - 5.1 AI Agent Architecture
   - 5.2 Agent Roles & Responsibilities
   - 5.3 Human-in-the-Loop Checkpoints
6. [Complete Lifecycle Example: Kitchen Renovation](#6-complete-lifecycle-example-kitchen-renovation)
7. [Automation Coverage Summary](#7-automation-coverage-summary)

---

## 1. Signup & Onboarding Engine

Every user follows the same entry point but branches into role-specific onboarding flows. The platform begins automating immediately.

### Universal Signup Flow

```
User visits kealee.com or app.kealee.com
    ↓
Supabase Auth: Email/password or Google OAuth
    ↓
User record created in DB (User model)
    ↓
Role selection screen: "I am a..."
  → Homeowner / Property Owner
  → Real Estate Developer
  → Property Manager / Business Owner
  → Contractor / GC / Builder / Subcontractor
  → Architect / Engineer
    ↓
Role-specific onboarding wizard begins
    ↓
Stripe Customer created (stripeCustomerId)
    ↓
APP-08 Communication Hub → sends welcome email sequence
APP-09 Task Queue Manager → creates onboarding task checklist
```

### What Happens in the Database

```
1. User record created (role assigned)
2. If professional → Organization record created
3. If professional → OrgMember record (role: owner)
4. Stripe customer ID linked
5. Notification record: "Welcome to Kealee"
6. AutomationTask: type="onboarding", sourceApp="APP-09"
```

### Onboarding by Role

| Role | Onboarding Steps | Auto-Created |
|---|---|---|
| **Homeowner** | Add property address → describe project needs → set budget range → invite to browse marketplace | Property record, Project (DRAFT) |
| **Developer** | Company info → portfolio of properties → project pipeline → team invites | Organization, multiple Properties |
| **Property Manager** | Company info → managed properties list → maintenance needs → recurring service prefs | Organization, Properties[], maintenance Project templates |
| **Contractor/GC** | Company info → trades/specialties → license upload → insurance upload → service area → portfolio photos | Organization, MarketplaceProfile (bidRotationPos=0) |
| **Architect** | Firm info → portfolio → specialties → license/stamp info → service offerings | Organization, MarketplaceProfile, DesignProject templates |

**Key automation:** The moment a contractor completes onboarding, their `MarketplaceProfile` is created with `bidRotationPos = 0` (top of the fair rotation queue), meaning they immediately start receiving lead notifications.

---

## 2. Execution by User Type

### 2.1 Homeowner / Property Owner Signs Up

**What they want:** Find a contractor, get work done, track progress, pay securely.

**Immediate platform actions after signup:**

```
STEP 1: Onboarding Complete
  → Property record created with address, type, sqft
  → Draft Project created from their description
  → AI Design Agent analyzes project description

STEP 2: Lead Created (automatic)
  → APP-01 Bid Engine activates
  → Matches contractors by: trades needed + service area + availability
  → Orders matches by bidRotationPos (fair rotation)
  → Top 10 contractors receive push notification + email
  → Lead appears on marketplace.kealee.com for matched contractors

STEP 3: Bids Come In (within 24-48 hrs)
  → Each Quote is validated (max 3% above suggested price)
  → APP-01 scores each bid:
      Price (30%) + Timeline (25%) + Quality History (25%)
      + Proximity (10%) + Availability (10%)
  → APP-14 Decision Support creates recommendation card
  → Homeowner sees ranked bids with AI recommendation

STEP 4: Homeowner Accepts a Bid
  → APP-01 rotates winner to end of queue (bidRotationPos = max + 1)
  → ContractAgreement auto-generated by APP-10 Document Generator
  → EscrowAgreement created with milestone payment schedule
  → APP-08 sends contract to both parties
  → DocuSign envelope created for e-signatures

STEP 5: Contract Signed → Project Goes Active
  → Project status: DRAFT → ACTIVE
  → Escrow funded via Stripe (client pays into escrow)
  → APP-09 Task Queue creates project task list from template
  → APP-02 Visit Scheduler schedules first site visit
  → APP-05 Permit Tracker checks if permits needed
  → Homeowner dashboard (app.kealee.com) goes live with:
      Timeline, budget tracker, milestone approvals, messaging
```

**Ongoing automation for the homeowner:**

| What Happens | Which App | Frequency |
|---|---|---|
| Progress updates in dashboard | APP-04 Report Generator | Weekly |
| Milestone completion notification | APP-08 Communication Hub | Per milestone |
| "Approve & release payment" prompt | APP-14 Decision Support | Per milestone |
| Budget alerts if costs change | APP-07 Budget Tracker | Real-time |
| Inspection results shared | APP-06 Inspection Coordinator | Per inspection |
| AI quality check on site photos | APP-13 QA Inspector | Per site visit |

---

### 2.2 Real Estate Developer Signs Up

**What they want:** Manage multiple projects, hire teams at scale, track portfolio-level performance.

**Platform execution after signup:**

```
Onboarding → Organization created → Multiple Properties added
    ↓
For EACH property/project:
  → Same Lead → Bid → Contract → Escrow flow as homeowner
  → But with portfolio-level dashboard showing all projects
    ↓
Developer gets:
  → Multi-project dashboard (app.kealee.com)
  → Aggregated budget view across all properties
  → Bulk contractor hiring through marketplace
  → APP-12 Smart Scheduler optimizes across projects
  → APP-11 Predictive Engine flags portfolio-level risks
```

**What makes developers different:** The AI agents analyze cross-project patterns. If APP-11 sees that the same subcontractor is causing delays on 3 projects, it flags it. APP-12 can sequence projects to share resources efficiently.

---

### 2.3 Property Manager Signs Up

**What they want:** Recurring maintenance, vendor management, tenant coordination.

**Platform execution:**

```
Onboarding → Organization + managed Properties[] created
    ↓
Maintenance templates auto-created:
  → HVAC servicing (quarterly)
  → Plumbing inspection (annual)
  → Landscaping (weekly/monthly)
  → Emergency repairs (on-demand)
    ↓
APP-09 Task Queue creates recurring task schedules
APP-02 Visit Scheduler sets up inspection calendar
APP-08 Communication Hub configured for tenant notifications
    ↓
When maintenance request comes in:
  → Lead auto-created on marketplace
  → APP-01 matches to pre-approved vendor list
  → If pre-approved vendor available → auto-assigns (no bid needed)
  → If not → standard bid process with faster 24hr window
  → APP-07 tracks maintenance budget per property
```

---

### 2.4 Contractor / GC / Builder Signs Up

**What they want:** Get leads, manage projects, run their business.

**Platform execution:**

```
IMMEDIATE (free):
  → MarketplaceProfile created → bidRotationPos = 0
  → Starts receiving matched leads immediately
  → Can bid on jobs through marketplace
  → Basic profile visible to clients

IF they subscribe to Marketplace tier ($49-$299/mo):
  → Enhanced profile (featured, priority placement)
  → More lead notifications per day
  → Access to 1,000+ assembly library for estimating
  → Portfolio management tools

IF they subscribe to PM Package ($1,750-$16,500/mo):
  → Full os-pm workspace activates at pm.kealee.com
  → APP-09 creates their project management task templates
  → APP-10 loads their contract/SOW templates
  → Command Center begins automating their project operations:

    For EACH active project:
    ├── APP-02 schedules weekly site visits
    ├── APP-04 generates weekly reports (auto-sent to clients)
    ├── APP-07 tracks budgets with OCR receipt scanning
    ├── APP-09 manages daily task queue
    ├── APP-03 processes change orders
    ├── APP-06 coordinates inspections
    ├── APP-08 handles all client communications
    ├── APP-11 predicts risks before they happen
    ├── APP-12 optimizes schedule with weather awareness
    └── APP-13 does AI quality checks on site photos
```

**The key value:** A contractor on Package C ($8,500/mo) gets the equivalent of a full-time PM without hiring one. The Command Center apps ARE the PM.

---

### 2.5 Architect / Engineer Signs Up

**What they want:** Design project management, client collaboration, new business.

```
Onboarding → Organization + MarketplaceProfile created
    ↓
Marketplace presence:
  → Portfolio visible to clients browsing for design services
  → Receives design-specific leads (kitchens, additions, etc.)
  → Can offer consultation packages through marketplace

IF they subscribe to Architecture Package ($2,500-$35,000):
  → architect.kealee.com workspace activates
  → DesignProject management with version control
  → Client collaboration portal with commenting
  → Stamp management and approval workflows
  → APP-10 generates design contracts
  → APP-08 handles client communications
  → Integration with permit workflow (APP-05)
```

---

## 3. Execution by Product Ordered

### 3.1 Marketplace Lead (Free for Contractors)

**Trigger:** Client submits a project request.

```
CLIENT ACTION                    PLATFORM EXECUTION
═══════════════                  ══════════════════
Client describes project    →    Lead record created
                            →    AI calculates suggestedPrice from assembly library
                            →    APP-01 Bid Engine activates:
                                   1. Queries MarketplaceProfile WHERE trades match
                                   2. Filters by serviceArea (within radius)
                                   3. Orders by bidRotationPos ASC (fair rotation)
                                   4. Selects top 10 contractors
                                   5. Creates AutomationTask per contractor
                            →    APP-08 Communication Hub:
                                   1. Push notification to each contractor
                                   2. Email with lead summary
                                   3. SMS if enabled
                            →    Contractors see lead in their dashboard
                            →    Contractors submit Quotes (max 3% above suggested)
                            →    APP-01 scores all bids when deadline hits
                            →    APP-14 Decision Support creates recommendation
                            →    Client accepts → winner rotated to end of queue
```

**Revenue:** Platform fee (2.9-5%) on executed contract.

### 3.2 Marketplace Subscription ($49–$299/mo)

**Trigger:** Contractor selects a marketplace tier at checkout.

```
Stripe Checkout → subscription.created webhook
    ↓
Subscription record created (tier: basic/professional/premium)
    ↓
Tier benefits activate immediately:
  BASIC ($49/mo):
    → Enhanced profile badge
    → 1,000+ assembly library access
    → Up to 10 lead notifications/day
  PROFESSIONAL ($149/mo):
    → Featured profile placement
    → Up to 25 lead notifications/day
    → Priority in bid rotation
    → Portfolio management tools
  PREMIUM ($299/mo):
    → Top placement in search results
    → Unlimited lead notifications
    → Dedicated account support
    → Analytics dashboard
    ↓
APP-09 Task Queue adjusts lead distribution weights
APP-08 sends subscription confirmation + onboarding guide
Stripe handles recurring billing automatically
```

### 3.3 PM Package Subscription ($1,750–$16,500/mo)

**Trigger:** Contractor subscribes to PM operations services.

**This is the most automation-heavy product.** The Command Center essentially BECOMES the contractor's project manager.

```
Stripe Checkout → subscription.created webhook
    ↓
Subscription created (tier: package_a through package_d)
    ↓
IMMEDIATE ACTIVATION:
  1. os-pm workspace provisioned at pm.kealee.com
  2. ops.kealee.com dashboard configured
  3. All 14 Command Center apps enabled for their projects
    ↓
PACKAGE A ($1,750/mo) - 1-3 projects:
  → APP-09 creates task templates for each project
  → APP-04 generates weekly reports (auto-sent to clients)
  → APP-08 handles basic client communications
  → APP-07 tracks budgets
  → Remote PM coordination (email/phone support)

PACKAGE B ($4,500/mo) - 4-8 projects:
  → Everything in A, plus:
  → APP-02 schedules and manages all site visits
  → APP-03 processes change orders with cost impact analysis
  → APP-06 coordinates all inspections
  → APP-11 Predictive Engine active (risk monitoring)
  → Dedicated PM coordinator assigned

PACKAGE C ($8,500/mo) - 9-15 projects:
  → Everything in B, plus:
  → APP-12 Smart Scheduler optimizes across all projects
  → APP-13 QA Inspector reviews all site photos
  → APP-14 Decision Support dashboard (one-click approvals)
  → APP-10 generates all documents (contracts, SOWs, invoices)
  → Full PM team support

PACKAGE D ($16,500/mo) - 16+ projects:
  → Everything in C, plus:
  → Custom automation workflows
  → APP-05 manages all permits across jurisdictions
  → Portfolio-level AI analytics
  → Priority support + quarterly strategy reviews
    ↓
ONGOING EXECUTION (automated per project):
  Monday:    APP-09 generates weekly task list
  Daily:     APP-07 processes receipts (OCR), updates budgets
  Per visit: APP-02 schedules → APP-13 analyzes photos → APP-04 logs report
  Per milestone: APP-06 schedules inspection → APP-08 notifies client
                 → APP-14 queues payment approval
  Weekly:    APP-04 auto-generates + sends progress report to client
  Monthly:   APP-04 generates financial summary
  Always:    APP-11 monitors for risks, APP-12 watches schedule health
```

### 3.4 Architecture Package ($2,500–$35,000)

**Trigger:** Architect subscribes or client purchases design services.

```
Payment processed → DesignProject created
    ↓
architect.kealee.com workspace activates:
  → DesignProject with version control
  → Client collaboration portal
  → APP-10 generates design contract
  → APP-08 sends welcome packet to client
    ↓
EXECUTION CYCLE:
  Architect uploads designs → DesignVersion created
  → Client notified via APP-08
  → Client reviews + leaves DesignComments (with pin positions)
  → Architect revises → new DesignVersion
  → Client approves → version marked approved
  → If permits needed → APP-05 Permit Tracker activates
  → APP-10 generates final deliverable package
```

### 3.5 Permit Package ($495–$7,500)

**Trigger:** User purchases permit assistance.

```
Payment processed → Permit record created
    ↓
APP-05 Permit Tracker activates:
  1. AI reviews application documents
     → Claude analyzes plans against jurisdiction requirements
     → Generates aiReviewScore (0-100) + aiReviewNotes
     → Flags issues BEFORE submission to save time
  2. Application generated from templates (APP-10)
  3. Submitted to jurisdiction (tracked in system)
  4. Status monitoring begins:
     → APP-05 checks status daily
     → Sends updates to user via APP-08
     → If corrections needed → flags for review
     → If approved → triggers APP-06 for inspection scheduling
  5. Expiration tracking (alerts 30/60/90 days before expiry)
```

### 3.6 Project Owner Package ($49–$999/mo)

**Trigger:** Homeowner/developer subscribes for enhanced project tracking.

```
Stripe Checkout → subscription.created webhook
    ↓
BASIC ($49/mo):
  → Enhanced dashboard at app.kealee.com
  → Real-time project timeline
  → Budget tracking
  → Document access
  → Direct messaging with project team

PROFESSIONAL ($149/mo):
  → Everything in Basic, plus:
  → AI design visualization tools
  → Multi-project dashboard
  → Detailed financial reporting
  → Priority support

PREMIUM ($299/mo):
  → Everything in Professional, plus:
  → AI-powered project insights (APP-11 predictions visible)
  → Custom reporting
  → Dedicated account manager

ENTERPRISE ($999/mo):
  → Everything in Premium, plus:
  → Portfolio analytics across all properties
  → Custom integrations
  → White-label reporting
  → API access
```

### 3.7 One-Time Services ($125–$5,995)

**Trigger:** User purchases individual service from ops.kealee.com.

```
Service examples:
  → Cost Estimation ($125-$495): APP-01 + assembly library
  → Site Assessment ($295-$995): APP-02 schedules + APP-13 analyzes
  → Permit Review ($495-$1,495): APP-05 AI review
  → Project Audit ($995-$2,995): APP-11 full analysis
  → Closeout Package ($1,995-$5,995): APP-10 generates all docs

EXECUTION:
  Payment → AutomationTask created → assigned to relevant app(s)
  → APP processes the work
  → Human PM reviews output (quality check)
  → APP-10 generates deliverable document
  → APP-08 sends deliverable to client
  → Service marked complete
```

---

## 4. Command Center Automation (15 Apps in Action)

### 4.1 Event-Driven Trigger Map

The Command Center operates on events. When something happens on the platform, it triggers a chain of automated responses:

| Platform Event | Apps That Fire | What They Do |
|---|---|---|
| **User signs up** | APP-08, APP-09 | Welcome email, onboarding tasks |
| **Lead created** | APP-01, APP-08 | Match contractors, send notifications |
| **Bid submitted** | APP-01, APP-14 | Score bid, update recommendation |
| **Bid accepted** | APP-01, APP-10, APP-08 | Rotate queue, generate contract, notify parties |
| **Contract signed** | APP-09, APP-02, APP-07 | Create task list, schedule visits, init budget |
| **Project activated** | APP-05, APP-09, APP-12 | Check permits, create tasks, build schedule |
| **Milestone completed** | APP-06, APP-07, APP-04, APP-08, APP-09 | Schedule inspection, update budget, queue report, notify client, assign next tasks |
| **Inspection passed** | APP-08, APP-14, APP-09 | Notify client, queue payment release, assign next phase |
| **Inspection failed** | APP-08, APP-09, APP-03 | Notify contractor, create correction tasks, assess change order |
| **Receipt uploaded** | APP-07 | OCR scan, categorize, update budget |
| **Site photo uploaded** | APP-13, APP-04 | AI quality check, add to report |
| **Change order requested** | APP-03, APP-07, APP-12 | Generate CO document, recalculate budget, update schedule |
| **Payment released** | APP-07, APP-08 | Update financials, notify contractor |
| **Schedule disruption** | APP-12, APP-08, APP-11 | Reschedule, notify team, reassess risk |
| **Budget overrun detected** | APP-07, APP-11, APP-14, APP-08 | Alert, predict impact, queue decision, notify PM |
| **Project completed** | APP-04, APP-10, APP-08 | Generate closeout package, final documents, notify all |
| **Subscription renewed** | APP-08, APP-09 | Confirmation email, refresh task templates |
| **Subscription canceled** | APP-08, APP-09 | Offboarding email, archive tasks |

### 4.2 APP-01 through APP-15: When Each Fires

```
APP-01 BID ENGINE
  Fires when: Lead created, bid submitted, bid deadline reached
  Does: Matches contractors, scores bids, recommends winner
  Output: BidEvaluation with ranked Bids, AI recommendation

APP-02 VISIT SCHEDULER
  Fires when: Project activated, milestone completed, weekly cycle, manual trigger
  Does: Schedules site visits, optimizes routes for multi-site PMs
  Output: SiteVisit records, Google Calendar events

APP-03 CHANGE ORDER PROCESSOR
  Fires when: Scope change detected, CO requested, inspection fails
  Does: Generates CO document with cost/timeline impact
  Output: ChangeOrder record, updated budget/schedule projections

APP-04 REPORT GENERATOR
  Fires when: Weekly cycle (Friday), milestone completed, project completed, manual trigger
  Does: Compiles data from all sources into formatted report
  Output: WeeklyReport record, PDF file, sent to client

APP-05 PERMIT TRACKER
  Fires when: Project needs permits, application submitted, daily status check
  Does: AI pre-reviews applications, monitors status, tracks expiration
  Output: Permit records with aiReviewScore, status updates

APP-06 INSPECTION COORDINATOR
  Fires when: Milestone completed, permit approved, manual trigger
  Does: Schedules inspection, coordinates parties, tracks results
  Output: Inspection records, correction workflows if failed

APP-07 BUDGET TRACKER
  Fires when: Receipt uploaded, payment made, CO approved, daily cycle
  Does: OCR receipts, categorize expenses, variance analysis, AI forecast
  Output: BudgetSnapshot, financial alerts, FinancialTransaction records

APP-08 COMMUNICATION HUB
  Fires when: ANY event that requires notification (most frequent app)
  Does: Routes messages across email, SMS, in-app, WhatsApp
  Output: CommunicationLog records, Notification records

APP-09 TASK QUEUE MANAGER
  Fires when: Project phase change, daily cycle, overdue detected
  Does: Creates/assigns tasks based on project phase and PM workload
  Output: Task records assigned to PMs, escalation alerts

APP-10 DOCUMENT GENERATOR
  Fires when: Contract needed, CO approved, milestone complete, closeout
  Does: Generates documents from templates, sends for e-signature
  Output: GeneratedDocument records, DocuSign envelopes

APP-11 PREDICTIVE ENGINE (AI)
  Fires when: Daily analysis cycle, data threshold reached, manual trigger
  Does: Analyzes project data → predicts delays, cost overruns, quality issues
  Output: Prediction records with probability, impact, recommendations

APP-12 SMART SCHEDULER (AI)
  Fires when: Project activated, disruption detected, weather alert, weekly optimization
  Does: Critical path analysis, resource leveling, weather-aware scheduling
  Output: Optimized task schedule, rescheduling recommendations

APP-13 QA INSPECTOR (AI)
  Fires when: Site photos uploaded, site visit completed
  Does: Claude Vision analyzes photos for defects, safety, quality
  Output: QAInspectionResult with issues found, auto-generated punch list

APP-14 DECISION SUPPORT (AI)
  Fires when: Bid evaluation ready, CO needs approval, payment release pending
  Does: Compiles context, generates AI recommendation with confidence score
  Output: DecisionQueue record with options, recommendation, context

APP-15 DASHBOARD
  Fires when: Continuously (every 60 seconds health check)
  Does: Aggregates health metrics from all 14 apps
  Output: AppHealthMetric records, real-time status in os-admin
```

### 4.3 Cross-App Chain Reactions

When a single event occurs, multiple apps fire in sequence. Here are the most common chains:

**Chain 1: New Project Kickoff**
```
Contract signed
  → APP-10 generates project documents
  → APP-09 creates full task list from phase template
  → APP-02 schedules first site visit + weekly cadence
  → APP-05 checks permit requirements
  → APP-07 initializes budget tracking
  → APP-12 builds optimized schedule
  → APP-08 sends kickoff email to all parties
  → APP-11 creates baseline risk assessment
Total: 8 apps fire, ~15 automated actions, 0 human input needed
```

**Chain 2: Milestone Completion**
```
PM marks milestone complete in os-pm
  → APP-06 schedules inspection with code official
  → APP-07 updates budget (actual vs projected)
  → APP-04 generates milestone report
  → APP-08 notifies client: "Milestone complete, inspection scheduled"
  → APP-09 assigns next-phase tasks to PM
  → APP-14 queues payment release decision for client
  ↓
Inspection passes:
  → APP-08 notifies client: "Inspection passed, please approve payment"
  → APP-14 shows one-click approval in client dashboard
  → Client approves → Escrow releases payment to contractor
  → APP-07 records payment transaction
  → APP-08 notifies contractor: "Payment released"
Total: 7 apps, ~20 actions, 1 human input (client approval click)
```

**Chain 3: Problem Detection & Resolution**
```
APP-13 QA Inspector detects issue in site photo
  → QAInspectionResult created with severity: HIGH
  → APP-09 creates correction task, assigns to contractor
  → APP-08 notifies PM + contractor of issue
  → APP-03 evaluates if change order needed
  → APP-11 recalculates risk score for project
  → APP-14 queues decision: "Approve correction approach?"
  ↓
If change order needed:
  → APP-03 generates CO document with cost impact
  → APP-07 shows budget impact
  → APP-12 shows schedule impact
  → APP-14 presents full picture to PM for one-click decision
Total: 7 apps, ~12 actions, 1 human decision
```

---

## 5. AI Agent Automation Layer

### 5.1 AI Agent Architecture

The platform uses Claude (Anthropic) as the AI backbone across four specialized agent roles. Each agent is a configured Claude instance with specific system prompts, tools, and output schemas.

```
┌─────────────────────────────────────────────────────┐
│                 KEALEE AI LAYER                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐ │
│  │ PREDICT  │  │ SCHEDULE │  │ INSPECT  │  │DECIDE│ │
│  │ Agent    │  │ Agent    │  │ Agent    │  │Agent │ │
│  │ (APP-11) │  │ (APP-12) │  │ (APP-13) │  │(AP14)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬──┘ │
│       │              │              │            │    │
│  ┌────▼──────────────▼──────────────▼────────────▼──┐│
│  │           Claude API (Anthropic)                  ││
│  │  Models: claude-sonnet-4-5 (fast) / opus (deep)     ││
│  │  Tools: function calling, vision, JSON mode       ││
│  └───────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 5.2 Agent Roles & Responsibilities

**PREDICT Agent (APP-11 Predictive Engine)**

```
Role: Risk analyst that monitors all project data for warning signs

Inputs:
  - Project timeline (actual vs planned)
  - Budget data (spend rate, variance trends)
  - Task completion rates
  - Weather forecasts for project location
  - Historical data from similar projects
  - Contractor performance history

Processing:
  - Runs daily analysis cycle per active project
  - Claude analyzes patterns in structured project data
  - Compares against historical baselines
  - Identifies leading indicators of problems

Outputs:
  - Prediction records: { type, probability, impact, recommendation }
  - Types: "delay" | "cost_overrun" | "quality_issue" | "safety_risk"
  - Example: "85% probability of 2-week delay due to permit review 
    timeline. Recommend expedited review request to jurisdiction."

Action triggers:
  - probability > 0.7 → APP-08 alerts PM immediately
  - probability > 0.5 → APP-14 queues decision card
  - probability > 0.3 → logged for weekly report (APP-04)
```

**SCHEDULE Agent (APP-12 Smart Scheduler)**

```
Role: Schedule optimizer that manages timing across all project tasks

Inputs:
  - All Task records with dependencies
  - Resource availability (contractor schedules)
  - Weather forecasts (7-day and extended)
  - Permit/inspection timelines
  - Historical task duration data

Processing:
  - Critical path analysis (identifies tasks that can't slip)
  - Resource leveling (prevents over-allocation)
  - Weather-aware scheduling (no concrete pour in rain)
  - Automatic rescheduling when disruptions occur
  - Cross-project optimization for shared resources

Outputs:
  - Optimized task schedule with start/end dates
  - Critical path identification
  - Rescheduling recommendations with rationale
  - "What-if" scenario analysis

Example AI output:
  "Moving framing start from Tuesday to Thursday avoids forecasted 
   rain. This shifts drywall by 2 days but keeps electrical on 
   schedule since it's not on the critical path. Net impact: 0 days 
   to completion date."
```

**INSPECT Agent (APP-13 QA Inspector)**

```
Role: Visual quality inspector using Claude Vision

Inputs:
  - Site photos (uploaded by PM, contractor, or auto-captured)
  - Project specifications and plans
  - Building code requirements for jurisdiction
  - Punch list standards

Processing:
  - Claude Vision API analyzes each photo
  - Compares against expected conditions for current phase
  - Checks for: structural issues, finish quality, safety violations,
    code compliance, incomplete work, damage

Outputs:
  - QAInspectionResult per photo:
    { issuesFound: [{ type, severity, location, description }],
      overallScore: 0-100 }
  - Auto-generated punch list items from detected issues
  - Safety violation alerts (immediate notification)

Example AI output:
  "Photo analysis of kitchen framing (Phase 3):
   - Issue 1: [HIGH] Electrical box at 42" height, code requires 48"
     for countertop outlets. Location: south wall, 3rd outlet from left.
   - Issue 2: [LOW] Minor nail pop on header, cosmetic only.
   Overall score: 72/100. Recommend correction before inspection."
```

**DECIDE Agent (APP-14 Decision Support)**

```
Role: Decision facilitator that compiles context and recommends actions

Inputs:
  - Decision context (what needs to be decided)
  - All relevant project data
  - Financial impact analysis
  - Schedule impact analysis
  - Risk assessment from APP-11
  - Historical outcomes of similar decisions

Processing:
  - Compiles all relevant information into structured summary
  - Analyzes trade-offs between options
  - Generates recommendation with confidence score
  - Presents as one-click decision card

Outputs:
  - DecisionQueue record:
    { type, title, context, aiRecommendation, aiConfidence, options }
  - Rendered as approval card in PM dashboard or client dashboard

Example decision card:
  ┌─────────────────────────────────────────────┐
  │ 🔵 CHANGE ORDER APPROVAL                    │
  │                                              │
  │ CO #003: Additional waterproofing            │
  │ Cost impact: +$2,400 (1.8% of budget)       │
  │ Schedule impact: +0 days (parallel work)     │
  │                                              │
  │ AI Recommendation: APPROVE (confidence: 94%) │
  │ Reason: Prevents potential $15K water damage  │
  │ risk identified by APP-11. Cost is below 2%  │
  │ threshold. No schedule impact.               │
  │                                              │
  │    [✓ APPROVE]    [✗ REJECT]    [↻ DEFER]   │
  └─────────────────────────────────────────────┘
```

### 5.3 Human-in-the-Loop Checkpoints

The platform automates aggressively but always keeps humans in control of money and major decisions:

| Action | Automated? | Human Approval Required? |
|---|---|---|
| Lead matching & distribution | ✅ Fully automated | No |
| Bid scoring & ranking | ✅ Fully automated | No |
| Bid acceptance | ❌ | Yes — client must accept |
| Contract generation | ✅ Auto-generated | Yes — both parties sign |
| Escrow funding | ✅ Auto-charged | Yes — client authorizes payment |
| Task assignment | ✅ Fully automated | No (PM can override) |
| Site visit scheduling | ✅ Fully automated | No (PM can reschedule) |
| Report generation | ✅ Fully automated | No |
| Report delivery to client | ✅ Fully automated | No |
| Budget tracking | ✅ Fully automated | No |
| Permit application | ✅ AI pre-reviews | Yes — PM submits |
| Inspection scheduling | ✅ Fully automated | No |
| Change order creation | ✅ Auto-generated | Yes — PM/client approves |
| Payment release from escrow | ❌ | Yes — client must approve |
| QA issue detection | ✅ Fully automated | PM reviews findings |
| Risk predictions | ✅ Fully automated | PM decides action |
| Schedule changes | ✅ AI recommends | PM approves major changes |
| Project closeout | ✅ Auto-generated | Yes — final sign-off |

**Rule:** Money never moves without a human click. Everything else can be automated.

---

## 6. Complete Lifecycle Example: Kitchen Renovation

Here's a full walkthrough of a $45,000 kitchen renovation from signup to completion:

```
DAY 0: Sarah (homeowner) signs up at kealee.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO: User created, Property created, Draft Project created
  AUTO: APP-08 sends welcome email
  AUTO: APP-09 creates onboarding checklist

DAY 0: Sarah describes her kitchen renovation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO: Lead created with description, budget ($40K-$50K)
  AUTO: AI calculates suggestedPrice = $43,200 from assembly library
  AUTO: APP-01 matches 10 contractors (GCs with kitchen experience)
  AUTO: APP-08 sends lead notification to all 10

DAY 1-3: Three contractors submit bids
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO: APP-01 validates each bid (max 3% above $43,200 = $44,496)
  AUTO: APP-01 scores: Contractor A (87), Contractor B (82), Contractor C (71)
  AUTO: APP-14 generates recommendation: "Contractor A recommended"
  AUTO: Sarah sees ranked bids with AI explanation in her dashboard

DAY 4: Sarah accepts Contractor A's bid ($44,100)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HUMAN: Sarah clicks "Accept Bid"
  AUTO: APP-01 rotates Contractor A to end of bid queue
  AUTO: APP-10 generates contract (from kitchen renovation template)
  AUTO: APP-08 sends contract to both parties via DocuSign
  HUMAN: Both parties sign electronically
  AUTO: ContractAgreement status → "signed"
  AUTO: EscrowAgreement created with 5 milestones:
        1. Demo complete ($6,600)
        2. Rough-in complete ($11,000)
        3. Cabinets installed ($13,200)
        4. Countertops + tile ($8,800)
        5. Final punch list ($4,500)

DAY 5: Escrow funded, project goes active
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HUMAN: Sarah authorizes $44,100 escrow payment via Stripe
  AUTO: Project status → ACTIVE
  AUTO: APP-09 creates 47 tasks across 5 phases
  AUTO: APP-02 schedules weekly PM visits (every Tuesday)
  AUTO: APP-05 checks: building permit needed → flags for submission
  AUTO: APP-12 builds optimized schedule (6-week timeline)
  AUTO: APP-07 initializes budget tracking ($44,100 total)
  AUTO: APP-08 sends kickoff email to Sarah + Contractor A
  AUTO: APP-11 creates baseline risk assessment

DAY 5: Permit handling
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO: APP-05 AI reviews plans → aiReviewScore: 91/100
  AUTO: APP-05 flags: "Add GFI outlet specification to plan"
  HUMAN: Contractor updates plan
  AUTO: APP-05 re-reviews → score: 98/100 → ready to submit
  HUMAN: PM submits permit application
  AUTO: APP-05 begins daily status monitoring

WEEK 1-2: Demo phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO: APP-09 assigns demo tasks to contractor's team
  AUTO: APP-02 scheduled visit → PM takes photos
  AUTO: APP-13 analyzes photos: "Demo 90% complete, load-bearing 
        wall properly supported with temporary beam. Score: 95/100"
  AUTO: APP-07 processes receipt: "$1,200 dumpster rental" (OCR)
  AUTO: APP-04 generates Week 1 report → sent to Sarah
  Sarah sees in her dashboard: "Phase 1: 90% complete"

WEEK 2: Demo complete → Milestone 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HUMAN: PM marks Milestone 1 complete
  AUTO: APP-06 schedules rough inspection
  AUTO: APP-07 updates: spent $7,200 of $6,600 budget (+$600 variance)
  AUTO: APP-07 alert: "Demo phase 9% over budget"
  AUTO: APP-04 generates milestone report
  AUTO: APP-08 notifies Sarah: "Demo complete! Inspection scheduled."
  AUTO: APP-09 assigns rough-in phase tasks
  ↓
  Inspection passes
  AUTO: APP-14 shows in Sarah's dashboard:
        "Milestone 1 complete. Release $6,600 to contractor?"
  HUMAN: Sarah clicks [APPROVE]
  AUTO: Stripe releases $6,600 from escrow to contractor
  AUTO: APP-07 records payment
  AUTO: APP-08 notifies contractor: "Payment received"

WEEK 3: AI detects a risk
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO: APP-11 Predictive Engine daily analysis:
        "72% probability of 3-day delay. Plumbing rough-in behind 
         schedule based on task completion rate. Electrical can 
         proceed in parallel to recover time."
  AUTO: APP-12 generates revised schedule showing parallel work
  AUTO: APP-14 presents to PM: "Approve parallel scheduling?"
  HUMAN: PM approves
  AUTO: APP-09 reassigns tasks for parallel execution
  AUTO: APP-08 notifies contractor of updated schedule
  Result: Delay avoided through AI-driven schedule optimization

WEEK 4: QA issue detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTO: APP-13 analyzes Tuesday visit photos:
        "Issue: Cabinet face frame out of plumb by 3/8". 
         Severity: MEDIUM. Location: upper cabinets, east wall.
         Recommend correction before countertop templating."
  AUTO: APP-09 creates correction task assigned to contractor
  AUTO: APP-08 notifies PM and contractor
  HUMAN: Contractor corrects, uploads new photo
  AUTO: APP-13 re-analyzes: "Issue resolved. Score: 96/100"

WEEK 6: Project complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  All 5 milestones completed and paid
  AUTO: APP-10 generates closeout package:
        - Final inspection certificates
        - Warranty documents
        - As-built documentation
        - Complete photo record
        - Financial summary
  AUTO: APP-04 generates final project report
  AUTO: APP-08 sends closeout package to Sarah
  AUTO: Project status → COMPLETED
  AUTO: Sarah prompted to leave Review for contractor
  AUTO: Contractor's profile updated: completedJobs + 1

TOTAL AUTOMATION STATS:
  Automated actions: ~340
  Human decisions: 7 (bid accept, contract sign, escrow fund,
                      4 milestone payment approvals, 1 PM schedule approval)
  AI analyses: 12 (risk predictions, schedule optimizations, photo QA)
  Documents generated: 8 (contract, 5 milestone reports, closeout, final report)
  Communications sent: ~45 (emails, notifications, SMS)
```

---

## 7. Automation Coverage Summary

| Platform Function | Manual | Assisted | Fully Automated |
|---|---|---|---|
| User onboarding | | | ✅ |
| Lead matching & distribution | | | ✅ |
| Bid scoring & ranking | | | ✅ |
| Bid acceptance | ✅ (client) | | |
| Contract generation | | | ✅ |
| Contract signing | ✅ (both parties) | | |
| Escrow funding | ✅ (client) | | |
| Task creation & assignment | | | ✅ |
| Site visit scheduling | | | ✅ |
| Photo quality analysis | | | ✅ |
| Budget tracking & OCR | | | ✅ |
| Weekly report generation | | | ✅ |
| Report delivery | | | ✅ |
| Permit pre-review (AI) | | | ✅ |
| Permit submission | | ✅ (PM reviews) | |
| Inspection scheduling | | | ✅ |
| Change order generation | | ✅ (PM approves) | |
| Risk prediction | | | ✅ |
| Schedule optimization | | ✅ (PM approves major) | |
| Payment release | ✅ (client) | | |
| Client communications | | | ✅ |
| Document generation | | | ✅ |
| Closeout package | | | ✅ |

**Bottom line:** ~80% of all platform operations are fully automated. The remaining 20% are intentional human checkpoints — primarily around money movement and major project decisions. The Command Center + AI agents handle the equivalent of 3-5 full-time project managers per 15 active projects.
