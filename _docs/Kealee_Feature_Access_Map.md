# Kealee Platform v10 — Feature Access Map

## Who Sees What Across All 45 Prompts

---

## The Core Problem This Document Solves

The 45 prompts build THREE different products under one roof:

```
PRODUCT 1: KEALEE MARKETPLACE (Free / Low-Cost)
  WHO: Homeowners, developers, property managers posting projects
       Contractors, GCs, builders receiving and bidding on leads
  WHAT: Lead matching, bidding, contractor profiles, basic project tracking
  REVENUE: Marketplace subscription fees + per-transaction fees

PRODUCT 2: KEALEE PM SOFTWARE (Subscription Packages)
  WHO: GCs, builders, contractors subscribing to PM packages ($1,750-$16,500/mo)
  WHAT: Full project management automation, Command Center, AI agents
  THIS IS THE PREMIUM PRODUCT
  REVENUE: Monthly PM package subscriptions

PRODUCT 3: KEALEE INTERNAL OPERATIONS
  WHO: Kealee staff PMs and admins
  WHAT: Admin tools, system monitoring, command center controls
  NOT CLIENT-FACING
  REVENUE: None directly — this is operational infrastructure
```

Most of the 45 prompts build Product 3 (internal ops) and Product 1 (marketplace). The contractor/GC who subscribes to a PM package gets a SUBSET — the parts that help THEM manage THEIR projects.

---

## Feature-by-Feature Access Map

### Legend

| Symbol | Meaning |
|---|---|
| ✅ | Full access — core feature for this user |
| 👁️ | View only — can see but not control |
| 🔒 | PM Package required — only with subscription |
| ⚙️ | Internal only — Kealee staff |
| ❌ | No access |
| 🆓 | Free / included with marketplace |

### Users

| Code | User |
|---|---|
| **HO** | Homeowner / Project Owner (client) |
| **DEV** | Real Estate Developer (client) |
| **PM-M** | Property Manager (client) |
| **GC** | General Contractor / Builder (using PM software) |
| **SUB** | Subcontractor (receiving leads, working on projects) |
| **K-PM** | Kealee Internal PM (staff) |
| **K-ADM** | Kealee Admin (staff) |

---

## PROMPTS 01-04: Shared Infrastructure

These are backend systems. No user directly interacts with them. They power everything.

| Prompt | Feature | HO | DEV | PM-M | GC | SUB | K-PM | K-ADM |
|---|---|---|---|---|---|---|---|---|
| 01 | Prisma Schema | — | — | — | — | — | — | — |
| 02 | BullMQ Workers | — | — | — | — | — | — | — |
| 03 | Event Bus | — | — | — | — | — | — | — |
| 04 | Claude AI Wrapper | — | — | — | — | — | — | — |

*Backend infrastructure. Invisible to all users. Powers everything below.*

---

## PROMPTS 05-15: Command Center Apps

This is where the big question lives. These 15 apps are the automation engine. Currently they're designed to be operated by Kealee's internal PMs. But a GC subscribing to a PM package wants many of these same capabilities for their OWN projects.

| Prompt | App | HO | DEV | PM-M | GC | SUB | K-PM | K-ADM |
|---|---|---|---|---|---|---|---|---|
| 05 | APP-01: Bid Engine | 👁️ sees bids | 👁️ sees bids | 👁️ sees bids | 🔒 manages bids for their projects | 🆓 submits bids | ⚙️ full control | ⚙️ full control |
| 06 | APP-02: Visit Scheduler | 👁️ sees schedule | 👁️ sees schedule | 👁️ sees schedule | 🔒 schedules visits for their projects | 👁️ sees their visits | ⚙️ full control | ⚙️ full control |
| 06 | APP-06: Inspection Coordinator | 👁️ sees results | 👁️ sees results | 👁️ sees results | 🔒 manages inspections | 👁️ sees results | ⚙️ full control | ⚙️ full control |
| 07 | APP-03: Change Order Processor | ✅ approves COs | ✅ approves COs | ✅ approves COs | 🔒 creates/manages COs | 👁️ sees COs | ⚙️ full control | ⚙️ full control |
| 07 | APP-07: Budget Tracker | 👁️ sees budget | 👁️ sees budget | 👁️ sees budget | 🔒 full budget tracking | ❌ | ⚙️ full control | ⚙️ full control |
| 08 | APP-04: Report Generator | 👁️ receives reports | 👁️ receives reports | 👁️ receives reports | 🔒 generates reports for their clients | ❌ | ⚙️ full control | ⚙️ full control |
| 08 | APP-05: Permit Tracker | 👁️ sees status | 👁️ sees status | 👁️ sees status | 🔒 full permit tracking | ❌ | ⚙️ full control | ⚙️ full control |
| 09 | APP-08: Communication Hub | ✅ receives notifs | ✅ receives notifs | ✅ receives notifs | 🔒 manages all comms | 🆓 receives notifs | ⚙️ full control | ⚙️ full control |
| 10 | APP-09: Task Queue Manager | ❌ | ❌ | ❌ | 🔒 manages tasks + assigns subs | 👁️ sees their tasks | ⚙️ full control | ⚙️ full control |
| 11 | APP-10: Document Generator | 👁️ receives docs | 👁️ receives docs | 👁️ receives docs | 🔒 generates contracts, invoices, SOWs | 👁️ receives docs | ⚙️ full control | ⚙️ full control |
| 12 | APP-11: Predictive Engine | ❌ | ❌ | ❌ | 🔒 sees predictions for their projects | ❌ | ⚙️ full control | ⚙️ full control |
| 13 | APP-12: Smart Scheduler | ❌ | ❌ | ❌ | 🔒 AI scheduling for their projects | ❌ | ⚙️ full control | ⚙️ full control |
| 14 | APP-13: QA Inspector | ❌ | ❌ | ❌ | 🔒 QA on their project photos | ❌ | ⚙️ full control | ⚙️ full control |
| 15 | APP-14: Decision Support | ❌ | ❌ | ❌ | 🔒 AI decision cards for their projects | ❌ | ⚙️ full control | ⚙️ full control |

### Key Insight

**Right now, the Command Center apps only have ONE operator path: Kealee's internal PM.**

A GC subscribing to Package B ($4,500/mo) expects to operate APP-01 through APP-14 on their OWN projects — managing their own subs, their own clients, their own budgets. They're essentially becoming their own PM using Kealee's tools.

**This is a gap.** The prompts build the engine but the GC-facing dashboard to operate that engine doesn't fully exist yet. The PM dashboard (Prompt 22) was designed for Kealee's internal PMs, not for external GC subscribers.

---

## PROMPTS 16-18: Dashboard, Events, Cron

| Prompt | Feature | HO | DEV | PM-M | GC | SUB | K-PM | K-ADM |
|---|---|---|---|---|---|---|---|---|
| 16 | APP-15: System Dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚙️ admin only |
| 16 | Command Center UI | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚙️ admin only |
| 17 | Event Router | — | — | — | — | — | — | — |
| 18 | Cron Scheduler | — | — | — | — | — | — | — |

*System internals. Only Kealee admin sees the Command Center controls.*

---

## PROMPTS 19-25: Lifecycle, API, Deploy

| Prompt | Feature | HO | DEV | PM-M | GC | SUB | K-PM | K-ADM |
|---|---|---|---|---|---|---|---|---|
| 19 | Onboarding flows | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| 20 | Command Center API | ❌ | ❌ | ❌ | ❌ | ❌ | ⚙️ | ⚙️ |
| 21 | Feature API routes | ✅ relevant routes | ✅ | ✅ | ✅ relevant routes | 🆓 relevant routes | ⚙️ all | ⚙️ all |
| 22 | PM Decision Dashboard | ❌ | ❌ | ❌ | 🔒 their own version | ❌ | ⚙️ | ❌ |
| 23 | Client Approval Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 24 | Master Worker | — | — | — | — | — | — | — |
| 25 | Deployment Config | — | — | — | — | — | — | — |

---

## PROMPTS 26-33: Production Gaps

| Prompt | Feature | HO | DEV | PM-M | GC | SUB | K-PM | K-ADM |
|---|---|---|---|---|---|---|---|---|
| 26 | Auth / RBAC / RLS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 27 | Stripe + Escrow + Connect | ✅ pays | ✅ pays | ✅ pays | ✅ Connect (receives $) | ✅ Connect (receives $) | ❌ | ⚙️ manages |
| 28 | Communications (email/SMS) | ✅ receives | ✅ receives | ✅ receives | ✅ receives + 🔒 sends to clients | ✅ receives | ⚙️ | ⚙️ |
| 29 | File Uploads | ✅ project photos | ✅ project photos | ✅ issue photos | ✅ site photos + receipts | 🆓 site photos | ⚙️ all | ⚙️ all |
| 30 | Assembly Library + Estimating | 👁️ sees estimate | 👁️ sees estimate | 👁️ sees estimate | 🔒 full library + custom estimates | ❌ | ⚙️ | ⚙️ |
| 31 | Message + Doc Templates | 👁️ receives | 👁️ receives | 👁️ receives | 🔒 generates docs | 👁️ receives | ⚙️ | ⚙️ |
| 32 | Error Handling + Alerting | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚙️ |
| 33 | Marketing Site + Signup | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## PROMPTS 34-45: Competitive Edge

| Prompt | Feature | HO | DEV | PM-M | GC | SUB | K-PM | K-ADM |
|---|---|---|---|---|---|---|---|---|
| 34 | Real-Time WebSockets | ✅ live updates | ✅ live updates | ✅ live updates | ✅ live updates | 🆓 live updates | ✅ | ✅ |
| 35 | Natural Language Chat | ✅ ask about project | ✅ ask about projects | ✅ ask about properties | 🔒 full PM chat | ❌ | ⚙️ full | ❌ |
| 36 | Level 2 Autonomous AI | 👁️ sees results | 👁️ sees results | 👁️ sees results | 🔒 configurable per project | ❌ | ⚙️ configurable | ⚙️ |
| 37 | Contractor Reliability Scoring | 👁️ sees badges | 👁️ sees badges | 👁️ sees badges | 🔒 sees full scores for their subs | 🆓 sees own score | ⚙️ full data | ⚙️ full data |
| 38 | Advanced Photo Intelligence | ✅ visual timeline + before/after | ✅ | ✅ | 🔒 progress analysis | ❌ | ⚙️ | ⚙️ |
| 39 | Observability + Tracing | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚙️ |
| 40 | Weather Scheduling + GPS | 👁️ sees weather on dashboard | 👁️ | 👁️ | 🔒 auto-reschedule + crew tracking | 🆓 GPS check-in | ⚙️ | ⚙️ |
| 41 | Audit Trail | 👁️ project activity log | 👁️ project activity | 👁️ property activity | 🔒 full audit trail | ❌ | ⚙️ | ⚙️ |
| 42 | Client Analytics + Benchmarks | ✅ project analytics | ✅ portfolio analytics | ✅ property analytics | 🔒 project + business analytics | ❌ | ⚙️ all | ⚙️ all |
| 43 | Remote Video Inspection | 👁️ sees results | 👁️ sees results | 👁️ sees results | 🔒 conducts remote inspections | 🆓 participates in calls | ⚙️ conducts | ⚙️ |
| 44 | Data Warehouse | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚙️ |
| 45 | Multi-Tenant Architecture | ❌ | ❌ | ❌ | 🔒 white-label branding | ❌ | ❌ | ⚙️ |

---

## THE GAP: GC/Builder PM Dashboard

### What a GC Subscribing to PM Package Actually Needs

When a GC subscribes to Package B ($4,500/mo), they expect a dashboard where THEY are the PM. They're not hiring Kealee's PM — they're using Kealee's SOFTWARE to run their own projects.

**Currently missing: A dedicated GC/Builder operator dashboard.**

The existing dashboards are:
- `os-pm` (Prompt 22) → designed for Kealee's internal PMs
- `m-project-owner` (Prompt 23) → designed for homeowner/developer clients
- `os-admin` (Prompt 16) → designed for Kealee system admins

**None of these are designed for a GC running their own business on the platform.**

### What the GC Dashboard Needs

```
APP: apps/gc-pm (new app: gc.kealee.com or pm.kealee.com for subscribers)

This is essentially a copy of os-pm BUT:
- Scoped to the GC's organization and projects only
- No access to Kealee's internal operations
- No access to other GC's data
- Branded for their company (via multi-tenant, Prompt 45)
- Feature-gated by their PM package tier

PAGES NEEDED:

1. DASHBOARD (HOME)
   - Active projects overview (cards with health indicators)
   - Today's tasks and decisions
   - AI insights panel
   - Notifications feed
   - Quick actions: create project, schedule visit, generate report

2. PROJECTS LIST
   - All their projects with status, progress, budget, timeline
   - Filter by status, client, location
   - "New Project" button → creates project + onboards their client

3. PROJECT DETAIL (per project)
   - Status overview + health indicators
   - Task board (assign to their subs)
   - Budget tracker (live)
   - Schedule (Gantt-style or timeline)
   - Photos gallery + visual timeline
   - Documents (contracts, COs, reports, invoices)
   - Communication log
   - Decision cards from AI
   - Inspection history
   - Audit trail / activity log

4. BID MANAGEMENT
   - For GCs who use the marketplace to find subs:
     Post scope of work → match subs → receive sub-bids → award
   - Uses APP-01 Bid Engine but the GC is the one posting, not Kealee

5. SUBCONTRACTOR MANAGEMENT
   - List of their subs with reliability scores
   - Performance tracking
   - Availability calendar
   - Payment history

6. CLIENT MANAGEMENT
   - List of their clients (homeowners, developers they work for)
   - Per-client: projects, payment status, communication history
   - Client portal link (gives their client a branded view)

7. SCHEDULING
   - Calendar view across all projects
   - Weather overlay
   - Crew assignments
   - GPS check-in log
   - Route planning for multi-site days

8. REPORTS
   - Generate weekly reports for any project
   - Generate client-facing reports (branded with their company)
   - Financial reports: revenue, costs, margins by project
   - Export to PDF

9. FINANCIAL OVERVIEW
   - Revenue tracking (what clients owe, what subs are owed)
   - Escrow status across all projects
   - Payment processing
   - Invoicing (generate + send to their clients)
   - Stripe Connect dashboard embed

10. AI COMMAND CENTER (their version)
    - Autonomous action log
    - AI predictions across their projects
    - Configure autonomy level per project
    - Chat interface (Prompt 35)

11. SETTINGS
    - Company profile + branding (logo, colors)
    - Team management (invite employees, set permissions)
    - Notification preferences
    - Subscription management (upgrade/downgrade package)
    - Integrations (calendar sync, accounting software)
```

---

## How PM Packages Map to Features

### What Each Tier Gets

| Feature | Package A ($1,750/mo) | Package B ($4,500/mo) | Package C ($8,500/mo) | Package D ($16,500/mo) |
|---|---|---|---|---|
| **Active Projects** | Up to 5 | Up to 15 | Up to 30 | Unlimited |
| **APP-01: Bid Engine** | ✅ basic matching | ✅ + AI ranking | ✅ + AI ranking | ✅ + AI ranking + priority |
| **APP-02: Visit Scheduler** | ✅ manual scheduling | ✅ + route optimization | ✅ + route optimization | ✅ + route + auto-schedule |
| **APP-03: Change Orders** | ✅ create + track | ✅ + auto-calc impact | ✅ + auto-calc impact | ✅ + auto-calc + templates |
| **APP-04: Reports** | ✅ basic weekly | ✅ AI-generated weekly | ✅ AI + milestone + custom | ✅ + client-branded reports |
| **APP-05: Permit Tracker** | ✅ manual tracking | ✅ + AI pre-review | ✅ + AI pre-review + alerts | ✅ + full permit management |
| **APP-06: Inspections** | ✅ log results | ✅ + scheduling | ✅ + scheduling + remote | ✅ + remote + auto-schedule |
| **APP-07: Budget Tracker** | ✅ basic tracking | ✅ + receipt OCR | ✅ + OCR + forecasting | ✅ + OCR + forecast + alerts |
| **APP-08: Communications** | ✅ email only | ✅ email + SMS | ✅ email + SMS + templates | ✅ all channels + branded |
| **APP-09: Task Manager** | ✅ basic tasks | ✅ + phase templates | ✅ + templates + auto-assign | ✅ + templates + auto + SOP |
| **APP-10: Documents** | ✅ basic contracts | ✅ + SOW + invoices | ✅ + all doc types | ✅ + custom templates |
| **APP-11: Predictions** | ❌ | ✅ basic risk flags | ✅ + detailed predictions | ✅ + predictions + auto-act |
| **APP-12: Smart Scheduler** | ❌ | ✅ weather awareness | ✅ + critical path + optimize | ✅ + full AI scheduling |
| **APP-13: QA Inspector** | ❌ | ❌ | ✅ photo QA analysis | ✅ + progress tracking + comparison |
| **APP-14: Decision Support** | ❌ | ✅ basic recommendations | ✅ + confidence scores | ✅ + Level 2 autonomy |
| **AI Chat (Prompt 35)** | ❌ | ✅ read-only queries | ✅ + action commands | ✅ + full autonomous |
| **Autonomy Level** | Level 1 only | Level 1-2 | Level 1-2 | Level 1-3 |
| **Analytics (Prompt 42)** | Basic project stats | ✅ + benchmarks | ✅ + portfolio analytics | ✅ + full BI dashboard |
| **Remote Inspection (43)** | ❌ | ❌ | ✅ | ✅ |
| **Visual Timeline (38)** | ❌ | ✅ basic | ✅ + before/after | ✅ + full progress tracking |
| **Contractor Scoring (37)** | 👁️ view only | ✅ scores for their subs | ✅ + trend analysis | ✅ + full analytics |
| **White-Label (45)** | ❌ | ❌ | ❌ | ✅ custom branding |
| **Data Export** | PDF only | PDF + CSV | PDF + CSV + API | Full API access |
| **Team Members** | 1 user | Up to 3 | Up to 8 | Unlimited |
| **Storage** | 5 GB | 25 GB | 100 GB | Unlimited |
| **Support** | Email | Email + chat | Priority + phone | Dedicated account manager |

---

## What Clients (Homeowners/Developers) See FOR FREE

When a GC uses the PM software, their clients get a portal automatically:

```
CLIENT PORTAL (m-project-owner / app.kealee.com)
Included FREE when their GC uses Kealee PM:

✅ Project dashboard (live status, progress, budget overview)
✅ Real-time notifications (milestone complete, payment needed)
✅ Visual timeline with photos
✅ Before/after photo comparisons
✅ Weekly progress reports (auto-delivered)
✅ Milestone payment approval (one-click)
✅ Change order review + approval
✅ Document access (contracts, invoices, reports)
✅ Activity log
✅ AI chat: "How's my project?"
✅ Weather forecast for their project
✅ Contractor on-site indicator

The client portal is the GC's selling point:
"Hire us and you get a real-time dashboard for your project."
It makes the GC look more professional.
It's free because it drives GC subscriptions.
```

---

## What Subs (Subcontractors) See FOR FREE

When a GC uses the PM software and assigns subs:

```
SUB PORTAL (Accessed via app.kealee.com with SUB role)
Free for all subs working on Kealee-managed projects:

✅ See their assigned tasks
✅ Mark tasks complete
✅ Upload site photos
✅ GPS check-in / check-out
✅ Receive notifications (schedule changes, inspections)
✅ View project schedule (their portions)
✅ Submit bids on sub-work posted by GCs
✅ See their own reliability score
✅ Receive payments via Stripe Connect
✅ View payment history

The sub portal is lightweight by design.
Subs don't manage — they execute and upload.
```

---

## What's on the Marketplace (No Subscription Needed)

```
MARKETPLACE (marketplace.kealee.com)
Free to post, free to bid, transaction fee on close:

FOR PROJECT OWNERS (Homeowners, Devs, PMs):
🆓 Post a project
🆓 Get instant estimate
🆓 Receive matched contractor bids
🆓 View contractor profiles + reliability badges
🆓 Accept a bid
🆓 Basic project tracking (milestones, payments)
🆓 Escrow payment processing (platform takes %)

FOR CONTRACTORS:
🆓 Create profile + portfolio
🆓 Receive matched leads
🆓 Submit bids
🆓 Digital contract signing
🆓 Receive escrow payments
🆓 Basic project view

The marketplace is FREE to attract volume.
Revenue comes from transaction fees (3.5-5%) and PM package upsells.
The marketplace is the funnel → PM software is the product.
```

---

## Revised Architecture: Three Dashboards

```
DASHBOARD 1: CLIENT PORTAL (app.kealee.com / m-project-owner)
  For: Homeowners, developers, property managers
  Shows: Their projects, approvals, reports, payments, AI chat
  Cost: Free (included when their GC uses Kealee)

DASHBOARD 2: GC/BUILDER DASHBOARD (gc.kealee.com / NEW)  ← THIS NEEDS TO BE BUILT
  For: GCs, builders, contractors with PM packages
  Shows: All 15 Command Center apps (feature-gated by tier)
  Cost: $1,750 - $16,500/mo
  This is the REVENUE ENGINE

DASHBOARD 3: KEALEE OPERATIONS (admin.kealee.com + pm.kealee.com)
  For: Kealee's internal staff only
  Shows: System admin, all projects, monitoring, analytics
  Cost: Internal (not client-facing)
```

---

## THE MISSING PROMPT

### PROMPT 46 — GC/Builder PM Dashboard

This is the prompt that needs to exist to make the PM software a real product for external GC/builder subscribers. Without it, all 45 prompts build an incredible engine that only Kealee staff can operate.

```
Build the GC/Builder PM Dashboard at gc.kealee.com.

This is the PRIMARY REVENUE PRODUCT — the dashboard that GCs, builders,
and contractors subscribe to at $1,750-$16,500/month.

It gives them access to the Command Center apps (feature-gated by tier)
to manage their OWN projects, their OWN clients, and their OWN subs.

DESIGN PRINCIPLES:
  1. The GC feels like THEY own the platform (not like they're using Kealee's tool)
  2. Clean, professional, construction-industry appropriate
  3. Mobile-first (GCs are on job sites, not at desks)
  4. Feature gates are invisible — locked features simply don't appear
  5. Upgrade prompts are subtle, not annoying

APP: apps/gc-pm (new Next.js app in monorepo)
DOMAIN: gc.kealee.com (or pm.kealee.com — decide based on branding)

PAGES:

1. /dashboard (Home)
   - Project cards: name, address, progress %, budget status, next action
   - Today's agenda: site visits, inspections, decisions needed
   - AI insights: top 3 risks across all projects
   - Weather bar: next 7 days for their region
   - Quick actions: + New Project, + Schedule Visit, + Generate Report
   - Notification bell (real-time, Prompt 34)

2. /projects (List)
   - Table/card view toggle
   - Columns: name, client, status, progress, budget, timeline, health
   - Sort by any column
   - Filter: status, client, date range
   - Search
   - Bulk actions: export, generate reports

3. /projects/[id] (Project Detail — tabbed layout)

   TAB: Overview
   - Health card (green/yellow/red)
   - Key metrics: progress, budget, schedule, QA pass rate
   - Recent activity feed (live, Prompt 34)
   - Benchmark comparison (Prompt 42)
   - AI risk assessment + recommendation

   TAB: Tasks
   - Kanban or list view
   - Columns: To Do, In Progress, Done
   - Drag to reassign / reorder
   - Create task, assign to sub, set due date
   - Phase grouping (preconstruction, rough-in, finishes, closeout)

   TAB: Schedule
   - Timeline / Gantt view
   - Weather overlay (Prompt 40)
   - Milestones highlighted
   - Critical path shown
   - Drag to reschedule (checks dependencies)
   - AI suggestions: "Move painting after drywall cures (3 days)"

   TAB: Budget
   - Live budget tracker (Prompt 34 real-time)
   - Spent vs budget chart
   - Expense breakdown by category
   - Recent receipts (OCR processed)
   - Upload receipt button (camera on mobile)
   - Forecast: projected final cost
   - Change order history with $ impact

   TAB: Photos
   - Visual timeline (Prompt 38)
   - Before/after slider (Prompt 38)
   - Gallery view: all photos, filter by date/visit
   - Upload photos button (multi-select on mobile)
   - AI QA results on each photo (if Package C/D)

   TAB: Documents
   - List: contracts, change orders, invoices, reports, permits
   - Generate new document (from templates, Prompt 31)
   - DocuSign status
   - Download / share

   TAB: Communication
   - Message thread with client
   - Message thread with subs
   - Notification history
   - Send message button

   TAB: Inspections
   - Inspection schedule
   - Results history (pass/fail/conditional)
   - QA findings with photos
   - Correction task tracking
   - Start remote inspection (Prompt 43)

   TAB: AI
   - Decision cards waiting
   - Predictions for this project
   - Autonomous action log (Prompt 36)
   - Configure autonomy level (if Package C/D)
   - Chat with AI about this project (Prompt 35)

4. /subcontractors (Sub Management)
   - List of subs with reliability scores (Prompt 37)
   - Performance metrics per sub
   - Availability calendar
   - Invite new sub (email)
   - Post sub-bid opportunity

5. /clients (Client Management)
   - List of their clients
   - Per client: projects, payment status, satisfaction
   - Client portal link (shareable)
   - Communication history

6. /schedule (Global Calendar)
   - Calendar view across ALL projects
   - Color-coded by project
   - Weather overlay (7-day)
   - Crew check-in status (who's where)
   - Route optimization for multi-site days

7. /financials (Financial Overview)
   - Revenue: invoiced, received, outstanding
   - Costs: materials, labor, subs, overhead
   - Margins by project
   - Escrow balances
   - Upcoming payouts
   - Export to CSV / connect to QuickBooks (future)

8. /reports (Report Center)
   - Generate report for any project
   - Report templates: weekly, milestone, closeout, financial
   - Branded with their company (Package D, Prompt 45)
   - Schedule recurring reports
   - Download history

9. /analytics (Business Intelligence — Prompt 42)
   - Project portfolio health
   - Revenue trends
   - Cost trends
   - Contractor performance
   - Client satisfaction
   - Benchmarks vs industry
   - Time-to-complete trends

10. /ai-chat (AI Assistant — Prompt 35)
    - Full-page chat interface
    - "What's the status of the Johnson project?"
    - "Schedule a visit for Friday at the Smith house"
    - "Generate a progress report for all active projects"
    - "Which projects are at risk of going over budget?"

11. /settings
    - Company profile (logo, name, contact)
    - Team management (invite, remove, set permissions)
    - Notification preferences
    - Subscription: current plan, usage, upgrade
    - Branding (Package D): colors, logo for client portal
    - Integrations (future): Google Calendar, QuickBooks

MOBILE OPTIMIZATION:
  Every page must work on phone. Key mobile workflows:
  - Upload photos from camera (tap → shoot → auto-upload with GPS)
  - Upload receipt from camera
  - Mark task complete
  - GPS check-in at site
  - Quick view of today's schedule
  - Approve/reject decision cards
  - Chat with AI

FEATURE GATING:
  Use the TenantConfig + subscription tier to show/hide features:
  - If feature not in their tier → page/tab doesn't appear in navigation
  - No "upgrade to unlock" popups on every page
  - Subtle upgrade prompts only in Settings > Subscription
  - One annual "Feature Spotlight" email showing what higher tiers offer

AUTH:
  - Same Supabase auth as all other apps
  - Role: CONTRACTOR with PM subscription
  - RLS: only see their org's data
  - Team members: invite via email, assign sub-roles (admin, PM, field, viewer)
```

---

## Updated Prompt Count: 46

```
Prompts 01-04:  Infrastructure
Prompts 05-18:  Command Center (15 apps + wiring)
Prompts 19-25:  Lifecycle, API, Deploy
Prompts 26-33:  Production Gaps
Prompts 34-45:  Competitive Edge
Prompt 46:      GC/Builder PM Dashboard ← THE PRODUCT ITSELF

Without Prompt 46, you've built an incredible engine with no steering wheel
for the people who are paying $4,500/month to drive it.
```

---

## Revenue Model Clarity

```
FREE TIER (marketplace):
  Homeowner posts project → GC bids → platform takes 3.5-5% of project value
  No monthly fee. Revenue = transaction volume.

SUBSCRIPTION TIER (PM software):
  GC subscribes to Package A-D → gets gc.kealee.com dashboard
  Monthly fee: $1,750 - $16,500
  Their clients get free portal (app.kealee.com)
  Their subs get free portal (lite view)

  Key metric: A GC with 15 active projects on Package B = $4,500/mo = $54K/yr
  10 GC subscribers at Package B = $540K ARR

ARCHITECTURE + PERMITS (one-time):
  Sold through marketplace or direct
  $495 - $35,000 per project

OPS SERVICES (one-time):
  $125 - $595 per service

The GC/Builder dashboard (Prompt 46) is what makes the subscription
worth $4,500/month. Everything else supports it.
```
