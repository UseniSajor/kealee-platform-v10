# Kealee Command Center - Service Ticket & Job Use Cases

## Complete Workflow Documentation

This document outlines 5 comprehensive use cases showing the full sequence of operations from intake/onboarding through completion/closeout. Each use case demonstrates how the 15 mini-apps work together to automate construction project management workflows.

---

## Use Case 1: New Residential Construction Project

**Ticket Type:** `NEW_PROJECT_INTAKE`
**Duration:** 4-6 months typical
**Complexity:** High

### Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROJECT INTAKE PHASE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 1: Client Submission (Status: INTAKE)                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets                                   │ │
│  │ Body: { type: "NEW_PROJECT_INTAKE", clientName: "Smith Family",        │ │
│  │        projectType: "RESIDENTIAL_NEW", description: "4BR 3BA home",    │ │
│  │        squareFootage: 3200, projectScope: [...], siteAddress: {...} }  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-08 (Communication Hub): Send intake confirmation email to client       │
│  APP-15 (Estimation): Create ticket record, assign ticket ID                │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ESTIMATION PHASE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Generate Full Estimate (Status: ESTIMATION)                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "ESTIMATION", assignedTo: "est-001" }               │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/estimate                                  │ │
│  │ Body: { projectType: "RESIDENTIAL_NEW", squareFootage: 3200,           │ │
│  │        location: {...}, customRequirements: [...] }                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-15 (Estimation): Calculate labor ($480,000), materials ($285,000)      │
│  APP-15 (Estimation): Generate timeline phases (8 phases, 180 days)         │
│  APP-11 (Predictive): Analyze historical data for accuracy adjustment       │
│  APP-01 (Bid Engine): Request contractor bids for each trade                │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BID COLLECTION PHASE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Contractor Bidding                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/bids/requests                                        │ │
│  │ Body: { projectId: "proj-001", trades: ["FOUNDATION", "FRAMING",       │ │
│  │        "ELECTRICAL", "PLUMBING", "HVAC", "ROOFING", "DRYWALL"],       │ │
│  │        dueDate: "2026-02-15", scope: {...} }                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-01 (Bid Engine): Distribute RFQs to preferred contractors              │
│  APP-08 (Communication): Send bid invitations via email                     │
│  APP-01 (Bid Engine): Collect and score bids (price, quality, availability) │
│  APP-14 (Decision Support): AI recommendation on contractor selection       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APPROVAL PHASE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Client Approval (Status: APPROVAL)                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "APPROVAL" }                                        │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/documents/generate                                   │ │
│  │ Body: { type: "CONTRACT", projectId: "proj-001",                       │ │
│  │        includeEstimate: true, requireSignature: true }                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-10 (Document Gen): Generate contract with estimate breakdown           │
│  APP-08 (Communication): Send proposal package to client                    │
│  APP-10 (Document Gen): Track DocuSign signature status                     │
│  APP-15 (Estimation): Update ticket with approved estimate                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SCHEDULING PHASE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Project Scheduling (Status: SCHEDULING)                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "SCHEDULING" }                                      │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/scheduler/optimize                                   │ │
│  │ Body: { projectId: "proj-001", phases: [...], constraints: {...} }     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-12 (Smart Scheduler): AI-optimized schedule generation                 │
│  APP-02 (Visit Scheduler): Schedule site visits and inspections             │
│  APP-05 (Permit Tracker): Submit permit applications                        │
│  APP-12 (Smart Scheduler): Weather-aware scheduling adjustments             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONSTRUCTION PHASE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Active Construction (Status: IN_PROGRESS)                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "IN_PROGRESS" }                                     │ │
│  │                                                                         │ │
│  │ Recurring: Daily progress tracking, budget monitoring                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-09 (Task Queue): Manage daily task assignments                         │
│  APP-07 (Budget Tracker): Track costs vs. estimate                          │
│  APP-06 (Inspection): Schedule required inspections per phase               │
│  APP-04 (Report Generator): Weekly progress reports                         │
│  APP-03 (Change Order): Process any scope changes                           │
│  APP-08 (Communication): Client updates and notifications                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      QUALITY CHECK PHASE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 7: Quality Inspection (Status: QUALITY_CHECK)                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "QUALITY_CHECK" }                                   │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/qa/analyze                                           │ │
│  │ Body: { projectId: "proj-001", images: [...], checklistId: "..." }     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-13 (QA Inspector): AI photo analysis of completed work                 │
│  APP-13 (QA Inspector): Generate punch list from inspection                 │
│  APP-06 (Inspection): Final inspection scheduling                           │
│  APP-09 (Task Queue): Create tasks for punch list items                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOSEOUT PHASE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 8: Project Closeout (Status: CLOSEOUT)                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "CLOSEOUT" }                                        │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/documents/generate                                   │ │
│  │ Body: { type: "CLOSEOUT_PACKAGE", projectId: "proj-001" }              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-10 (Document Gen): Generate closeout package                           │
│  APP-10 (Document Gen): Compile warranties and manuals                      │
│  APP-07 (Budget Tracker): Final cost reconciliation                         │
│  APP-04 (Report Generator): Final project summary report                    │
│  APP-08 (Communication): Client satisfaction survey                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMPLETION                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 9: Mark Complete (Status: COMPLETED)                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "COMPLETED", completedAt: "2026-07-15T16:00:00Z" }  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-15 (Estimation): Archive ticket with final metrics                     │
│  APP-11 (Predictive): Feed data for future estimation accuracy              │
│  APP-08 (Communication): Send completion notice and review request          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Case 2: Emergency Repair Service Ticket

**Ticket Type:** `EMERGENCY_REPAIR`
**Duration:** 1-3 days
**Complexity:** Medium-High (time-critical)

### Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EMERGENCY INTAKE (Status: INTAKE)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 1: Emergency Request Received                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets                                   │ │
│  │ Body: { type: "EMERGENCY_REPAIR", priority: "CRITICAL",                │ │
│  │        clientName: "Johnson Property Management",                       │ │
│  │        description: "Water main burst - flooding basement unit",        │ │
│  │        siteAddress: {...}, requiresAfterHours: true }                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-15 (Estimation): Create CRITICAL priority ticket                       │
│  APP-08 (Communication): SMS alert to on-call team                          │
│  APP-08 (Communication): Auto-call to emergency plumber roster              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RAPID ESTIMATION (Status: ESTIMATION)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Quick Scope Assessment                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/labor                                     │ │
│  │ Body: { projectType: "REPAIR", trades: ["PLUMBING", "DRYWALL"],        │ │
│  │        duration: "16 hours", afterHoursRate: true }                    │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "ESTIMATION" }                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-15 (Estimation): Emergency rate calculation (1.5x standard)            │
│  APP-15 (Estimation): Estimate: Labor $2,400 + Materials $800 = $3,200      │
│  APP-14 (Decision Support): Recommend nearest available contractors         │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VERBAL APPROVAL (Status: APPROVAL)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Client Authorization                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "APPROVAL", verbalApproval: true,                   │ │
│  │        approvedBy: "Mike Johnson", approvedAt: "2026-01-27T22:15:00Z" }│ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-08 (Communication): Send estimate via SMS for quick review             │
│  APP-08 (Communication): Record verbal approval timestamp                   │
│  APP-10 (Document Gen): Queue formal authorization for signature            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     IMMEDIATE DISPATCH (Status: SCHEDULING)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Crew Dispatch                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/visits/schedule                                      │ │
│  │ Body: { projectId: "emerg-001", type: "EMERGENCY",                     │ │
│  │        scheduledStart: "ASAP", assignedCrew: "crew-plumb-oncall" }     │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "SCHEDULING" }                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-02 (Visit Scheduler): Dispatch nearest available crew                  │
│  APP-02 (Visit Scheduler): ETA calculation and notification                 │
│  APP-08 (Communication): Client notified of crew dispatch                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REPAIR EXECUTION (Status: IN_PROGRESS)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 5: On-Site Work                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "IN_PROGRESS", startedAt: "2026-01-27T23:00:00Z" }  │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/tasks                                                │ │
│  │ Body: { projectId: "emerg-001", tasks: [                               │ │
│  │   { name: "Shut off water main", priority: 1 },                        │ │
│  │   { name: "Extract standing water", priority: 2 },                     │ │
│  │   { name: "Repair burst pipe", priority: 3 },                          │ │
│  │   { name: "Test water pressure", priority: 4 } ] }                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-09 (Task Queue): Track repair progress in real-time                    │
│  APP-07 (Budget Tracker): Log material purchases (receipts)                 │
│  APP-08 (Communication): Hourly status updates to property manager          │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VERIFICATION (Status: QUALITY_CHECK)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Repair Verification                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "QUALITY_CHECK" }                                   │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/qa/analyze                                           │ │
│  │ Body: { images: [before_photos, after_photos], checkType: "REPAIR" }   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-13 (QA Inspector): Photo documentation of repair                       │
│  APP-13 (QA Inspector): Verify repair meets standards                       │
│  APP-06 (Inspection): Log successful pressure test results                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLOSEOUT (Status: CLOSEOUT → COMPLETED)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 7: Ticket Closure                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "CLOSEOUT" }                                        │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/documents/generate                                   │ │
│  │ Body: { type: "SERVICE_REPORT", ticketId: "emerg-001" }                │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "COMPLETED" }                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-10 (Document Gen): Service report with photos                          │
│  APP-07 (Budget Tracker): Final invoice generation                          │
│  APP-08 (Communication): Invoice and report sent to client                  │
│  APP-15 (Estimation): Ticket archived - Total time: 8 hours                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Case 3: Change Order Processing

**Ticket Type:** `CHANGE_ORDER`
**Duration:** 3-10 days
**Complexity:** Medium

### Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CHANGE REQUEST INTAKE (Status: INTAKE)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 1: Change Order Request                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets                                   │ │
│  │ Body: { type: "CHANGE_ORDER", parentProjectId: "proj-001",             │ │
│  │        description: "Client requests upgraded kitchen appliances and   │ │
│  │        addition of butler's pantry", requestedBy: "client",            │ │
│  │        impactAreas: ["KITCHEN", "CABINETRY", "ELECTRICAL"] }           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-15 (Estimation): Create change order ticket linked to parent project   │
│  APP-03 (Change Order): Log change request with impact assessment           │
│  APP-08 (Communication): Acknowledge receipt to client                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     IMPACT ANALYSIS (Status: ESTIMATION)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Scope & Cost Analysis                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/change-orders/analyze                                │ │
│  │ Body: { changeOrderId: "co-001", originalScope: {...},                 │ │
│  │        requestedChanges: {...} }                                       │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/estimate                                  │ │
│  │ Body: { projectType: "CHANGE_ORDER", scope: "Butler's pantry +         │ │
│  │        appliance upgrade", linkedProject: "proj-001" }                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-03 (Change Order): Analyze schedule impact (+5 days)                   │
│  APP-03 (Change Order): Identify affected work already completed            │ │
│  APP-15 (Estimation): Additional cost estimate: +$28,500                    │
│  APP-12 (Smart Scheduler): Calculate revised timeline                       │
│  APP-14 (Decision Support): Risk assessment of change                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLIENT APPROVAL (Status: APPROVAL)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Change Order Approval                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/change-orders/{coId}/submit-for-approval             │ │
│  │ Body: { estimate: {...}, scheduleImpact: {...}, requiresSignature: true}│ │
│  │                                                                         │ │
│  │ API: POST /api/v1/documents/generate                                   │ │
│  │ Body: { type: "CHANGE_ORDER_DOCUMENT", changeOrderId: "co-001" }       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-10 (Document Gen): Generate formal change order document               │
│  APP-08 (Communication): Send for client review with cost breakdown         │
│  APP-10 (Document Gen): DocuSign integration for signatures                 │
│  APP-03 (Change Order): Track approval status                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SCHEDULE INTEGRATION (Status: SCHEDULING)                │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Incorporate into Project Schedule                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/scheduler/reoptimize                                 │ │
│  │ Body: { projectId: "proj-001", changeOrder: "co-001",                  │ │
│  │        newTasks: [...], constraints: {...} }                           │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "SCHEDULING" }                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-12 (Smart Scheduler): Insert new tasks into schedule                   │
│  APP-12 (Smart Scheduler): Adjust dependent tasks                           │
│  APP-02 (Visit Scheduler): Update inspection schedule                       │
│  APP-01 (Bid Engine): Get updated contractor pricing if needed              │
│  APP-07 (Budget Tracker): Update budget with approved change                │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXECUTION (Status: IN_PROGRESS)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Execute Change Order Work                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "IN_PROGRESS" }                                     │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/tasks                                                │ │
│  │ Body: { projectId: "proj-001", changeOrderId: "co-001",                │ │
│  │        tasks: [{ name: "Install butler's pantry framing" }, ...] }     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-09 (Task Queue): Create and assign change order tasks                  │
│  APP-07 (Budget Tracker): Track CO-specific costs separately                │
│  APP-04 (Report Generator): Include CO progress in weekly reports           │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     COMPLETION (Status: QUALITY_CHECK → COMPLETED)           │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Change Order Closeout                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/qa/analyze                                           │ │
│  │ Body: { changeOrderId: "co-001", verifyScope: true }                   │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "COMPLETED" }                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-13 (QA Inspector): Verify change order scope completed                 │
│  APP-03 (Change Order): Mark CO complete, update project totals             │
│  APP-07 (Budget Tracker): Reconcile CO budget vs actual                     │
│  APP-10 (Document Gen): Generate CO completion certificate                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Case 4: Warranty Claim Handling

**Ticket Type:** `WARRANTY_CLAIM`
**Duration:** 5-14 days
**Complexity:** Medium

### Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WARRANTY CLAIM INTAKE (Status: INTAKE)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 1: Claim Submission                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets                                   │ │
│  │ Body: { type: "WARRANTY_CLAIM", originalProjectId: "proj-001",         │ │
│  │        clientName: "Smith Family", claimDescription: "Roof leak in     │ │
│  │        master bedroom - appears at flashing around chimney",            │ │
│  │        originalCompletionDate: "2025-07-15", warrantyType: "1-YEAR" }  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-15 (Estimation): Create warranty ticket, verify warranty active        │
│  APP-15 (Estimation): Link to original project records                      │
│  APP-08 (Communication): Acknowledge claim, schedule assessment             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WARRANTY ASSESSMENT (Status: ESTIMATION)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Site Assessment & Determination                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/visits/schedule                                      │ │
│  │ Body: { ticketId: "wc-001", type: "WARRANTY_ASSESSMENT",               │ │
│  │        requiredTrade: "ROOFING" }                                      │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/qa/analyze                                           │ │
│  │ Body: { images: [...], originalWorkPhotos: [...],                      │ │
│  │        assessmentType: "WARRANTY_DEFECT" }                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-02 (Visit Scheduler): Schedule warranty inspection visit               │
│  APP-13 (QA Inspector): AI analysis - compare to original work photos       │
│  APP-14 (Decision Support): Determine warranty validity                     │
│  APP-14 (Decision Support): Recommendation: VALID - installation defect     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTRACTOR NOTIFICATION (Status: APPROVAL)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Original Contractor Engagement                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/communications/send                                  │ │
│  │ Body: { to: "roofing-contractor@example.com", template: "WARRANTY_CLAIM",│ │
│  │        data: { claimId: "wc-001", defectDescription: "...",            │ │
│  │        remediation: "Re-flash chimney connection", deadline: "..." } } │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-08 (Communication): Notify original roofing contractor                 │
│  APP-08 (Communication): Include defect photos and required remediation     │
│  APP-03 (Change Order): Track warranty work (zero cost to client)           │
│  APP-15 (Estimation): Internal cost tracking for contractor back-charge     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REPAIR SCHEDULING (Status: SCHEDULING)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Schedule Warranty Repair                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/visits/schedule                                      │ │
│  │ Body: { ticketId: "wc-001", type: "WARRANTY_REPAIR",                   │ │
│  │        contractor: "original-roofer-001", clientPreference: "morning" }│ │
│  │                                                                         │ │
│  │ API: POST /api/v1/scheduler/check-weather                              │ │
│  │ Body: { location: {...}, trade: "ROOFING", dateRange: [...] }          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-12 (Smart Scheduler): Weather-optimized scheduling for roofing         │
│  APP-02 (Visit Scheduler): Coordinate with client availability              │
│  APP-08 (Communication): Confirmation to client with date/time              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WARRANTY REPAIR (Status: IN_PROGRESS)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Execute Repair                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "IN_PROGRESS" }                                     │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/tasks                                                │ │
│  │ Body: { ticketId: "wc-001", tasks: [                                   │ │
│  │   { name: "Remove existing flashing", assigned: "roofer-001" },        │ │
│  │   { name: "Install new step flashing", assigned: "roofer-001" },       │ │
│  │   { name: "Apply sealant", assigned: "roofer-001" },                   │ │
│  │   { name: "Water test", assigned: "roofer-001" } ] }                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-09 (Task Queue): Track warranty repair tasks                           │
│  APP-07 (Budget Tracker): Log contractor back-charge ($0 to client)         │
│  APP-13 (QA Inspector): Document before/after condition                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VERIFICATION & CLOSEOUT (Status: QUALITY_CHECK → COMPLETED)│
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Verify Repair & Close Claim                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/qa/analyze                                           │ │
│  │ Body: { ticketId: "wc-001", images: [repair_photos],                   │ │
│  │        waterTestResult: "PASS" }                                       │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "COMPLETED", resolution: "WARRANTY_HONORED" }       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-13 (QA Inspector): Verify repair quality                               │
│  APP-10 (Document Gen): Generate warranty repair certificate                │
│  APP-08 (Communication): Send completion notice to homeowner                │
│  APP-08 (Communication): Follow-up satisfaction survey in 7 days            │
│  APP-11 (Predictive): Update contractor quality scoring                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Case 5: Punch List & Final Walkthrough

**Ticket Type:** `PUNCH_LIST`
**Duration:** 1-5 days
**Complexity:** Low-Medium

### Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WALKTHROUGH SCHEDULING (Status: INTAKE)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 1: Schedule Final Walkthrough                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/estimation/tickets                                   │ │
│  │ Body: { type: "PUNCH_LIST", parentProjectId: "proj-001",               │ │
│  │        description: "Final walkthrough and punch list creation",        │ │
│  │        scheduledWalkthrough: "2026-02-01T10:00:00Z" }                  │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/visits/schedule                                      │ │
│  │ Body: { projectId: "proj-001", type: "FINAL_WALKTHROUGH",              │ │
│  │        attendees: ["PM", "Client", "Superintendent"] }                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-15 (Estimation): Create punch list ticket                              │
│  APP-02 (Visit Scheduler): Schedule walkthrough with all parties            │
│  APP-08 (Communication): Send walkthrough invitation with agenda            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WALKTHROUGH & PUNCH LIST CREATION (Status: ESTIMATION)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Conduct Walkthrough                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/qa/templates/checklist/FINAL_WALKTHROUGH             │ │
│  │ Response: { checklist: [...all areas to inspect...] }                  │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/qa/analyze                                           │ │
│  │ Body: { projectId: "proj-001", type: "FINAL_WALKTHROUGH",              │ │
│  │        images: [...room_by_room_photos...],                            │ │
│  │        clientComments: [...] }                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-13 (QA Inspector): Provide digital checklist for walkthrough           │
│  APP-13 (QA Inspector): AI analysis of photos for defects                   │
│  APP-13 (QA Inspector): Generate punch list items automatically             │
│  APP-10 (Document Gen): Create punch list document                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PUNCH LIST AGREEMENT (Status: APPROVAL)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Client Sign-off on Punch List                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/documents/generate                                   │ │
│  │ Body: { type: "PUNCH_LIST", projectId: "proj-001",                     │ │
│  │        items: [...], requiresSignature: true }                         │ │
│  │                                                                         │ │
│  │ Punch List Items Generated:                                            │ │
│  │  1. Touch up paint - living room corner (COSMETIC)                     │ │
│  │  2. Adjust cabinet door alignment - kitchen (MINOR)                    │ │
│  │  3. Grout repair - master bath floor (MINOR)                           │ │
│  │  4. HVAC register not secured - bedroom 2 (FUNCTIONAL)                 │ │
│  │  5. Garage door sensor alignment (FUNCTIONAL)                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-10 (Document Gen): Generate punch list with photos                     │
│  APP-10 (Document Gen): Client signature via DocuSign                       │
│  APP-15 (Estimation): Time estimate for punch list: 6 hours                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PUNCH LIST SCHEDULING (Status: SCHEDULING)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Schedule Punch List Work                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/scheduler/optimize                                   │ │
│  │ Body: { ticketId: "punch-001", items: [...],                           │ │
│  │        preferSingleVisit: true, clientAvailability: [...] }            │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/visits/schedule                                      │ │
│  │ Body: { ticketId: "punch-001", type: "PUNCH_LIST_REPAIR",              │ │
│  │        crews: ["painter", "carpenter", "hvac-tech"] }                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-12 (Smart Scheduler): Optimize to minimize visits                      │
│  APP-02 (Visit Scheduler): Coordinate multiple trades                       │
│  APP-08 (Communication): Send schedule to client and crews                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PUNCH LIST EXECUTION (Status: IN_PROGRESS)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Complete Punch List Items                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/tasks                                                │ │
│  │ Body: { ticketId: "punch-001", tasks: [                                │ │
│  │   { id: 1, name: "Touch up paint", assignee: "painter-01", status: "pending" },│ │
│  │   { id: 2, name: "Cabinet adjustment", assignee: "carpenter-01" },     │ │
│  │   ... ] }                                                              │ │
│  │                                                                         │ │
│  │ As each item completed:                                                │ │
│  │ API: PATCH /api/v1/tasks/{taskId}                                      │ │
│  │ Body: { status: "completed", completedPhoto: "..." }                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-09 (Task Queue): Track each punch list item                            │
│  APP-13 (QA Inspector): Photo verification of completed items               │
│  APP-08 (Communication): Real-time updates to PM dashboard                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLIENT VERIFICATION (Status: QUALITY_CHECK)              │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Client Re-Inspection                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/visits/schedule                                      │ │
│  │ Body: { ticketId: "punch-001", type: "PUNCH_LIST_VERIFICATION",        │ │
│  │        attendees: ["Client", "PM"] }                                   │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/qa/verify-punch-list                                 │ │
│  │ Body: { ticketId: "punch-001", clientApproval: true,                   │ │
│  │        verifiedItems: [1, 2, 3, 4, 5], rejectedItems: [] }             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-02 (Visit Scheduler): Schedule final verification visit                │
│  APP-13 (QA Inspector): Compare before/after photos                         │
│  APP-13 (QA Inspector): Client signs off on each item                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PROJECT CLOSEOUT (Status: CLOSEOUT → COMPLETED)          │
├─────────────────────────────────────────────────────────────────────────────┤
│  STEP 7: Final Closeout                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API: POST /api/v1/documents/generate                                   │ │
│  │ Body: { type: "CLOSEOUT_PACKAGE", projectId: "proj-001",               │ │
│  │        includes: ["certificate_of_completion", "warranties",           │ │
│  │        "maintenance_manuals", "as_built_drawings", "final_photos"] }   │ │
│  │                                                                         │ │
│  │ API: POST /api/v1/estimation/tickets/{ticketId}/transition             │ │
│  │ Body: { newStatus: "COMPLETED" }                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  APP-10 (Document Gen): Compile complete closeout package                   │
│  APP-10 (Document Gen): Certificate of completion for signature             │
│  APP-07 (Budget Tracker): Release final payment/retention                   │
│  APP-08 (Communication): Deliver closeout package to client                 │
│  APP-08 (Communication): Schedule 30-day follow-up call                     │
│  APP-11 (Predictive): Archive project data for future estimates             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Quick Reference

### Service Ticket Status Transitions

```
INTAKE → ESTIMATION → APPROVAL → SCHEDULING → IN_PROGRESS → QUALITY_CHECK → CLOSEOUT → COMPLETED
                                                    ↑              ↓
                                                    └──────────────┘
                                                    (if QC fails)
```

### Key Endpoints by Phase

| Phase | Primary Endpoints |
|-------|------------------|
| **Intake** | `POST /api/v1/estimation/tickets` |
| **Estimation** | `POST /api/v1/estimation/estimate`, `/labor`, `/materials`, `/timeline` |
| **Approval** | `POST /api/v1/documents/generate`, `PATCH /tickets/{id}/transition` |
| **Scheduling** | `POST /api/v1/scheduler/optimize`, `/visits/schedule` |
| **In Progress** | `POST /api/v1/tasks`, `PATCH /tasks/{id}`, `/budget/track` |
| **Quality Check** | `POST /api/v1/qa/analyze`, `/inspections/schedule` |
| **Closeout** | `POST /api/v1/documents/generate` (type: CLOSEOUT_PACKAGE) |

### Event Bus Integration

All status transitions emit events that other apps can subscribe to:

```javascript
// Example: Communication Hub subscribes to ticket events
eventBus.subscribe('estimation:ticket:status_changed', async (data) => {
  if (data.newStatus === 'APPROVAL') {
    // Auto-send estimate for review
    await sendEstimateEmail(data.ticketId);
  }
});
```

---

## Integration with OS-PM Services (kealee-pm)

The Command Center integrates with the main Kealee PM application through:

1. **Shared Database**: Both systems use the same Prisma schema via `@kealee/database`
2. **Event Bus**: Real-time sync via Redis pub/sub
3. **API Gateway**: Command Center exposes automation endpoints consumed by kealee-pm UI
4. **Queue System**: Background jobs coordinated through BullMQ

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   kealee-pm     │────▶│ Command Center  │────▶│   Workers       │
│   (Frontend)    │     │   (Gateway)     │     │   (BullMQ)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shared PostgreSQL (Prisma)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
