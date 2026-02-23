# Kealee Platform v10 — Complete SOP & Business Logic

> **Kealee Construction LLC | February 2026 | CONFIDENTIAL**
> Standard Operating Procedures mapped to the 8-Claw architecture.
> All references use claw names and workers — no separate mini-app layer.

---

## Table of Contents

1. [Service Tier Structure](#1-service-tier-structure)
2. [Business Projections & PM Staffing](#2-business-projections)
3. [Project Lifecycle Overview](#3-project-lifecycle)
4. [Phase 1: Initiation SOPs](#4-phase-1-initiation)
5. [Phase 2: Planning SOPs](#5-phase-2-planning)
6. [Phase 3: Pre-Construction SOPs](#6-phase-3-pre-construction)
7. [Phase 4: Construction SOPs](#7-phase-4-construction)
8. [Phase 5: Closeout SOPs](#8-phase-5-closeout)
9. [Claw Automation Logic Per SOP](#9-claw-automation-logic)
10. [Automation Rule Engine](#10-automation-rules)
11. [SOP Automation Gaps & Integration Needs](#11-gaps)

---

## 1. Service Tier Structure

### PM Packages (Monthly Recurring)

| Package | Price | Hours/Week | Projects | Support | Site Visits |
|---------|-------|------------|----------|---------|-------------|
| **A — Starter** | $1,750/mo | 5-10 hrs | 1 | Email (48hr response) | 0 (remote only) |
| **B — Professional** | $4,500/mo | 15-20 hrs | 2-3 | Email + Phone (24hr) | 1-2/month |
| **C — Premium** ⭐ | $8,500/mo | 30-40 hrs | 3-5 | Priority (same-day) | 2-4/month |
| **D — White Glove** | $16,500/mo | 40+ hrs | Unlimited | 24/7 access | 4-8/month |

### Architecture Packages (One-Time)

| Package | Price | Scope |
|---------|-------|-------|
| A — Basic | $2,500 | Single room / minor renovation |
| B — Standard | $7,500 | Whole floor / multi-room |
| C — Premium | $15,000 | Whole house / major renovation |
| D — Enterprise | $35,000 | New construction / commercial |

### Project Owner Packages (Monthly Recurring)

| Package | Price | For |
|---------|-------|-----|
| A — Starter | $49/mo | Basic project dashboard |
| B — Professional | $149/mo | Full tracking + reports |
| C — Premium | $299/mo | AI predictions + decisions |
| D — Enterprise | $999/mo | White-label + API access |

### Permit Packages

| Package | Price | Scope |
|---------|-------|-------|
| A — DIY Review | $495 | 1 application, AI pre-review |
| B — Standard | $1,500 | Up to 3 permit types |
| C — Premium | $3,500 | Unlimited permits |
| D — Enterprise | $7,500 | Full compliance management |

### Operations Services (À La Carte)

| Service | Price |
|---------|-------|
| Pre-Construction Site Analysis | $295 |
| Schedule Development | $395 |
| Budget Development | $395 |
| Vendor Procurement | $295 |
| Quality Assurance Inspection | $195 |
| Safety Assessment | $195 |
| Project Recovery Assessment | $495 |
| Construction Monitoring | $595 |
| Closeout Management | $395 |
| Warranty Administration | $195 |
| Expert Consultation | $125/hr |

### Estimation Services

| Service | Price |
|---------|-------|
| Quick Budget Estimate | $195 |
| Basic Takeoff | $495 |
| Detailed Estimate | $1,295 |
| Estimate Review | $695 |
| Professional Bid Package | $2,495 |
| Enterprise Estimation | $5,995 |
| Monthly Estimation Support | $1,995/mo |

---

## 2. Business Projections

### Revenue Projections (25% monthly scaling after Month 3)

| Period | Pkg A | Pkg B | Pkg C | Pkg D | Total Clients | Monthly MRR |
|--------|-------|-------|-------|-------|---------------|-------------|
| Month 1-3 | 20 | 8 | 5 | 1 | 34 | $129,000 |
| Month 4-6 | 25 | 10 | 6 | 1 | 42 | $161,250 |
| Month 7-9 | 31 | 13 | 8 | 2 | 54 | $214,250 |
| Month 10-12 | 39 | 16 | 10 | 2 | 67 | $272,500 |

### PM Staffing Requirements

| Package | Hrs/Week Each | Month 1-3 Load | Month 10-12 Load |
|---------|--------------|----------------|-----------------|
| A (5-10 hrs avg) | 7.5 | 150 hrs | 293 hrs |
| B (15-20 hrs avg) | 17.5 | 140 hrs | 280 hrs |
| C (30-40 hrs avg) | 35 | 175 hrs | 350 hrs |
| D (40+ hrs avg) | 45 | 45 hrs | 90 hrs |
| **TOTAL** | | **510 hrs/wk** | **1,013 hrs/wk** |
| **FTE Required (40 hr/wk)** | | **13 PMs** | **25 PMs** |

> **With AI automation targeting 60% efficiency gains:** actual PM requirement reduces to 5-6 PMs for Month 1-3 and 10-12 PMs for Month 10-12.

---

## 3. Project Lifecycle Overview

| Phase | Duration | Key Activities | Deliverables | Primary Claws |
|-------|----------|---------------|-------------|---------------|
| 1. Initiation | Week 1 | Client intake, needs assessment, site visit | Project brief, initial estimate | A, F |
| 2. Planning | Weeks 2-4 | Design, engineering, permits, contractor selection | Plans, permits, contracts | A, B, E |
| 3. Pre-Construction | Weeks 4-6 | Mobilization, scheduling, materials | Schedule, material orders | C, D |
| 4. Construction | Weeks 6-24+ | Execution, monitoring, inspections | Progress reports, approvals | B, C, D, E, F, G |
| 5. Closeout | Final 2 weeks | Final inspection, punch list, handover | Certificate of occupancy | B, E, F |

---

## 4. Phase 1: Initiation

### SOP-001: Client Intake Process

**Purpose:** Capture complete project requirements within 48 hours of inquiry.
**Trigger:** New lead from marketplace, referral, or direct inquiry.
**Owner:** Assigned PM.
**Automation Level:** 60%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 1.1 | Receive notification of new client assignment | Immediate | Claw H → task-orchestrator |
| 1.2 | Review client submission (project type, budget, timeline) | 15 min | os-pm (data from m-ops-services) |
| 1.3 | Conduct initial phone consultation (30-60 min) | Within 24 hrs | os-pm Calendar |
| 1.4 | Complete Client Intake Form with all project details | During call | os-pm Form Generator |
| 1.5 | Upload photos/documents from client | Within 24 hrs | os-pm Document Vault |
| 1.6 | Classify project type and complexity | Auto | Claw A → estimation worker (AI) |
| 1.7 | Generate initial budget estimate range | Auto | Claw A → estimation worker |
| 1.8 | Send intake confirmation email with next steps | Auto | Claw F → comms-hub worker |
| 1.9 | Schedule discovery site visit (if Package C/D) | Within 48 hrs | Claw C → visits worker |
| 1.10 | Create project record in system | Auto | API / Prisma |

**AI Automation:**
- Auto-classifies project type from description
- Suggests planning tier based on budget
- Generates jurisdiction-specific checklist
- Recommends contractors by location/specialty

---

### SOP-002: Site Assessment Process

**Purpose:** Document existing conditions and validate project feasibility.
**Trigger:** Project requires in-person assessment (Package C/D or complex).
**Owner:** PM or designated assessor.
**Automation Level:** 45%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 2.1 | Confirm appointment with client | Day before | Claw F → comms-hub worker |
| 2.2 | Review project brief, prepare checklist | 30 min | os-pm Checklist Generator |
| 2.3 | Conduct on-site measurements | 1-2 hours | os-pm Mobile |
| 2.4 | Photograph all relevant areas (min 20 photos) | During visit | os-pm Photo Documentation |
| 2.5 | Complete site assessment form | During visit | os-pm Mobile Form |
| 2.6 | Identify issues, code concerns, access problems | During visit | os-pm Issue Tracker |
| 2.7 | Discuss timeline expectations with client | During visit | Verbal |
| 2.8 | Upload all documentation | Within 2 hrs | os-pm Document Vault |
| 2.9 | Generate site assessment report | Same day | Claw F → doc-generator worker |
| 2.10 | Send summary to client | Within 24 hrs | Claw F → comms-hub worker |

**Mobile Features:** GPS auto-tags photos, voice captions, offline mode with sync, 1-tap actions.

---

### SOP-003: Project Classification

**Purpose:** Categorize projects by type, complexity, and resource needs.
**Trigger:** After client intake (SOP-001) is complete.
**Owner:** System (AI) with PM review.
**Automation Level:** 85%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 3.1 | AI analyzes project scope, budget, and location | Auto | Claw A → estimation worker (AI) |
| 3.2 | Classify project type (residential, commercial, mixed) | Auto | Claw A (AI classification) |
| 3.3 | Assign complexity level (1-5) | Auto | Claw G → predictive-engine worker |
| 3.4 | Determine required permits by jurisdiction | Auto | Claw E → permit-tracker worker |
| 3.5 | Estimate trade requirements | Auto | Claw A → estimation worker |
| 3.6 | Recommend package tier if not selected | Auto | Claw G → decision-support worker |
| 3.7 | PM reviews and confirms classification | 15 min | os-pm |
| 3.8 | Publish project.classified event | Auto | Claw A |

---

## 5. Phase 2: Planning

### SOP-004: Design Coordination

**Purpose:** Manage the design process from concept through construction documents.
**Trigger:** Project requires design (new construction, major renovation).
**Owner:** PM coordinating with architect/engineer.
**Automation Level:** 35%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 4.1 | Determine design requirements based on scope | Day 1 | os-pm Scope Analysis |
| 4.2 | Match with appropriate design professional | Day 1-2 | m-architect marketplace |
| 4.3 | Facilitate design kickoff meeting | Day 3-5 | os-pm Calendar + Video |
| 4.4 | Review conceptual designs with client (2-3 options) | Week 2 | os-pm Design Review |
| 4.5 | Document client selections and preferences | Week 2 | os-pm Decision Log |
| 4.6 | Coordinate design development drawings | Weeks 2-3 | os-pm Design Tracking |
| 4.7 | Review drawings for code compliance | Week 3 | Claw E → permit-tracker worker (AI pre-review) |
| 4.8 | Coordinate engineering if required (structural, MEP) | Weeks 3-4 | m-architect Engineer Network |
| 4.9 | Facilitate client approval of final design | Week 4 | os-pm Approval Workflow |
| 4.10 | Obtain construction documents for permitting | Week 4 | os-pm Document Vault |

---

### SOP-005: Permit Management

**Purpose:** Navigate permit requirements and obtain all required approvals.
**Trigger:** Construction documents complete and ready for submission.
**Owner:** PM with Claw E automation.
**Automation Level:** 65%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 5.1 | Identify required permits by jurisdiction (DC/MD/VA) | Day 1 | Claw E → permit-tracker worker |
| 5.2 | AI pre-review plans for code issues | Auto | Claw E → qa-inspector worker (Vision AI) |
| 5.3 | Flag and apply auto-corrections | Auto | Claw E → qa-inspector worker (AI) |
| 5.4 | Compile permit application package | Days 2-3 | Claw F → doc-generator worker |
| 5.5 | Calculate permit fees | Auto | Claw E → permit-tracker worker |
| 5.6 | Submit permit application | Day 3-4 | m-permits-inspections portal |
| 5.7 | Track application status daily (automated polling) | Ongoing | Claw E → permit-tracker worker (cron 6AM) |
| 5.8 | Respond to plan review comments within 48 hrs | As needed | os-pm Response Tool |
| 5.9 | Coordinate revisions with design team | As needed | os-pm Revision Tracker |
| 5.10 | Notify client of approval/issues | Same day | Claw F → comms-hub worker |
| 5.11 | Download and store approved permits | On approval | os-pm Document Vault |
| 5.12 | Schedule required inspections | Day of approval | Claw C → inspections worker |

**AI Pre-Review Detection Rates:**
- Missing signatures: 90%
- Incomplete forms: 95%
- Code violations: 80%
- Setback errors: 85%
- Document incompleteness: 90%

**Goal:** 90% first-time approval rate (vs. 60% industry average)

---

### SOP-006: Contractor Selection (Bid Engine)

**Purpose:** Source and qualify contractors through competitive bidding.
**Trigger:** Scope defined, estimate approved, ready for contractor engagement.
**Owner:** PM with Claw A automation.
**Automation Level:** 75%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 6.1 | Define scope and bid requirements | Day 1 | os-pm Bid Package Builder |
| 6.2 | Generate estimate for SRP baseline | Day 1 | Claw A → estimation worker |
| 6.3 | AI identifies qualified contractors (min 3) | Day 1-2 | Claw A → bid-engine worker (matching) |
| 6.4 | Issue bid invitations with deadline | Day 2 | Claw A → bid-engine worker (invitations) |
| 6.5 | Conduct pre-bid site visit if needed | Day 3-5 | Claw C → visits worker |
| 6.6 | Collect and organize bid submissions | Deadline +1 | Claw A → bid-engine worker (collection) |
| 6.7 | AI scores bids (price, scope, timeline, rating) | Auto | Claw A → bid-engine worker (scoring) |
| 6.8 | Verify contractor credentials | Day 2-3 | Claw A (credential check) |
| 6.9 | Generate bid comparison report | Auto | Claw F → doc-generator worker |
| 6.10 | Present to client with AI recommendation | Day 3 | os-pm + Claw G → decision-support worker |
| 6.11 | Facilitate contractor interviews if requested | Days 4-5 | os-pm Calendar |
| 6.12 | Document client selection and rationale | Day 5-6 | os-pm Decision Log |

**Bid Scoring Algorithm:**
- Price vs SRP baseline: 40% weight
- Timeline alignment: 20% weight
- Contractor rating: 25% weight
- Trade fit / specialty match: 15% weight

**Fair Rotation:** 70% merit-based / 30% fairness rotation (tracks `bidRotationPos` per contractor)

---

### SOP-007: Contract Administration

**Purpose:** Execute binding agreements between all parties.
**Trigger:** Contractor selected, client approved.
**Owner:** PM with Claw B automation.
**Automation Level:** 55%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 7.1 | Generate contract from approved bid | Day 1 | Claw B → publishes contract.draft.created |
| 7.2 | Include scope, schedule, payment terms, warranties | Day 1 | Claw F → doc-generator worker |
| 7.3 | Review contract with client | Day 2 | os-pm Contract Review |
| 7.4 | Coordinate contract modifications if needed | Days 2-3 | os-pm Revision Tracker |
| 7.5 | Obtain client signature | Day 3-4 | E-Signature integration |
| 7.6 | Obtain contractor signature | Day 4-5 | E-Signature integration |
| 7.7 | Collect insurance certificates and verify | Day 5 | os-pm Insurance Verification |
| 7.8 | Process initial payment/deposit | Day 5-6 | Claw B → payments worker (Stripe) |
| 7.9 | Issue Notice to Proceed | Day 6 | Claw F → doc-generator worker |
| 7.10 | Store executed contract in document vault | Same day | os-pm Document Vault |

**Events Triggered:** `contract.executed` → cascades to Claw C (create schedule), Claw D (seed budget), Claw F (create project conversation in Kealee Messenger)

---

## 6. Phase 3: Pre-Construction

### SOP-008: Project Scheduling

**Purpose:** Create detailed project schedule with milestones and dependencies.
**Trigger:** Contract executed, Notice to Proceed issued.
**Owner:** PM with Claw C automation.
**Automation Level:** 70%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 8.1 | Define work breakdown structure (WBS) | Day 1 | os-pm WBS Builder |
| 8.2 | Identify all activities with durations | Day 1-2 | Claw C → scheduler worker |
| 8.3 | Establish predecessor/successor dependencies | Day 2 | Claw C → scheduler worker (CPM) |
| 8.4 | AI calculates critical path | Auto | Claw C → scheduler worker (AI) |
| 8.5 | Assign resources to activities | Day 2-3 | Claw C → scheduler worker (resource leveling) |
| 8.6 | Factor weather windows and seasonal constraints | Auto | Claw C → scheduler worker (weather API) |
| 8.7 | Set inspection milestones aligned with Claw E | Auto | Claw C + Claw E coordination via events |
| 8.8 | Create payment milestones aligned with schedule | Auto | Claw B + Claw D coordination |
| 8.9 | Review schedule with contractor | Day 3 | os-pm Schedule Review |
| 8.10 | Obtain client approval of schedule | Day 3-4 | os-pm Approval Workflow |
| 8.11 | Publish baseline schedule | Day 4 | Claw C publishes schedule.created |
| 8.12 | Generate 2-week look-ahead | Auto | Claw C → scheduler worker |

**Events Triggered:** `schedule.created` → Claw D (align budget timeline), Claw E (align inspection sequence), Claw H (create recurring monitoring tasks)

### SOP-009: Material Procurement (Package C/D Only)

**Purpose:** Coordinate material ordering for critical-path items.
**Trigger:** Schedule approved, long-lead items identified.
**Owner:** PM.
**Automation Level:** 40%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 9.1 | Identify long-lead materials from schedule | Day 1 | Claw C → scheduler worker |
| 9.2 | Obtain pricing from approved suppliers | Days 1-3 | os-pm Procurement |
| 9.3 | Verify against budget allocations | Auto | Claw D → budget-tracker worker |
| 9.4 | Issue purchase orders | Day 3-4 | os-pm + Claw B → payments worker |
| 9.5 | Track delivery dates and coordinate with schedule | Ongoing | Claw C → scheduler worker |
| 9.6 | Confirm receipt and quality | On delivery | os-pm + Claw E → qa-inspector (AI photos) |

---

## 7. Phase 4: Construction

### SOP-010: Daily Monitoring

**Purpose:** Maintain real-time awareness of project progress.
**Trigger:** Construction phase active.
**Owner:** PM (daily responsibility).
**Automation Level:** 50%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 10.1 | Review contractor daily log/report | Each morning | os-pm Daily Log Portal |
| 10.2 | Compare progress to schedule | Daily | Claw C → scheduler worker (variance) |
| 10.3 | Review site photos from contractor | Daily | Claw E → qa-inspector worker (AI photo review) |
| 10.4 | Flag any concerns or deviations | Immediate | Claw G → predictive-engine worker |
| 10.5 | Update project dashboard status | Daily | os-pm Dashboard (auto from events) |
| 10.6 | Respond to contractor RFIs within 24 hours | As needed | os-pm RFI Manager |
| 10.7 | Coordinate any required owner decisions | As needed | Claw G → decision-support worker |
| 10.8 | Document weather delays or force majeure | As occurs | Claw C → scheduler worker (weather log) |
| 10.9 | Monitor labor and equipment on site | Daily | os-pm Resource Tracker |
| 10.10 | Update forecast based on actual progress | Weekly | Claw D → budget-tracker worker (forecast) |

---

### SOP-011: Site Visit Protocol

**Purpose:** Conduct regular PM site inspections.
**Trigger:** Scheduled per package tier.
**Owner:** PM.
**Automation Level:** 45%

**Visit Frequency by Package:**
- Package A: 0 visits (remote only)
- Package B: 1-2 visits/month
- Package C: 2-4 visits/month
- Package D: 4-8 visits/month

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 11.1 | Schedule site visit based on package tier | Weekly | Claw C → visits worker |
| 11.2 | Notify contractor of planned visit | 24 hrs prior | Claw F → comms-hub worker |
| 11.3 | Prepare site visit checklist (AI-generated) | Day before | Claw C → visits worker (AI) |
| 11.4 | Conduct walkthrough with contractor | On site | os-pm Mobile Checklist |
| 11.5 | Document progress photos (min 10) | On site | os-pm Photo Documentation |
| 11.6 | Note quality concerns or code issues | On site | os-pm Issue Logger |
| 11.7 | Verify work matches approved plans | On site | os-pm Plan Comparison |
| 11.8 | Complete site visit report | Same day | Claw F → doc-generator worker |
| 11.9 | Send report to client | Within 24 hrs | Claw F → comms-hub worker |
| 11.10 | Follow up on open items | Within 48 hrs | Claw H → task-orchestrator worker |

**Events Triggered:** `sitevisit.completed` → Claw H (create follow-up tasks), Claw G (update risk assessment), Claw E (qa-inspector runs on uploaded photos)

---

### SOP-012: Inspection Coordination

**Purpose:** Schedule and manage all required inspections.
**Trigger:** Work reaches inspection-required milestone.
**Owner:** PM with Claw E + Claw C automation.
**Automation Level:** 65%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 12.1 | Identify all required inspections for project | Project start | Claw E → permit-tracker worker |
| 12.2 | Map inspections to project schedule | Day 1 | Claw C → inspections worker |
| 12.3 | AI generates readiness checklist per trade | Auto | Claw E → qa-inspector worker (AI) |
| 12.4 | PM conducts pre-inspection site visit | Day before | Claw C → visits worker |
| 12.5 | Contractor requests inspection (72 hr notice) | Per schedule | m-permits-inspections portal |
| 12.6 | Confirm inspection scheduled with AHJ | Same day | Claw E → permit-tracker worker |
| 12.7 | Notify all parties of pending inspection | 24 hrs prior | Claw F → comms-hub worker |
| 12.8 | Ensure site is ready (AI readiness check) | Day before | Claw E → qa-inspector worker (AI photos) |
| 12.9 | Document inspection result | Same day | Claw E → permit-tracker worker (pass/fail) |
| 12.10 | If failed: coordinate corrections | Within 24 hrs | Claw H → task-orchestrator (auto-creates task) |
| 12.11 | Schedule re-inspection if needed | Same day | Claw C → inspections worker |
| 12.12 | Update milestone status upon passing | Immediate | Claw C → scheduler worker |

**AI Readiness Checklist Example (Electrical Rough-In):**
- All boxes installed and secured
- All wire runs complete
- Proper wire gauge used
- Junction boxes accessible
- Main panel installed
- Grounding system complete
- AFCI/GFCI breakers installed
- Work area clean and accessible
- Plans available on site

**Goal:** 85% first-time pass rate (vs. 60% industry average)

**Events on Failure:** `inspection.failed.compliance` → Claw H (create re-inspect task), Claw G (update risk score), Claw F (notify contractor + client), Claw C (adjust schedule for re-inspection)

---

### SOP-013: Change Order Management

**Purpose:** Process scope changes with proper documentation and impact analysis.
**Trigger:** Change requested by client, contractor, or conditions.
**Owner:** PM with Claw B automation.
**Automation Level:** 70%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 13.1 | Receive change request | Day 0 | os-pm Change Portal |
| 13.2 | Document scope change in detail | Day 1 | os-pm Change Description |
| 13.3 | Request contractor pricing | Day 1 | Claw B → change-orders worker |
| 13.4 | Generate independent cost estimate for comparison | Day 1 | Claw A → estimation worker |
| 13.5 | Review contractor pricing (within 48 hrs) | Days 2-3 | os-pm Pricing Review |
| 13.6 | AI analyzes schedule impact | Auto | Claw B → change-orders worker (AI) |
| 13.7 | AI analyzes cost impact on budget | Auto | Claw B → change-orders worker (AI) |
| 13.8 | AI assigns risk level | Auto | Claw G → predictive-engine worker |
| 13.9 | Prepare change order document | Day 4 | Claw F → doc-generator worker |
| 13.10 | Present to client with AI recommendation | Day 4-5 | os-pm + Claw G → decision-support worker |
| 13.11 | Obtain client approval or rejection | Days 5-7 | os-pm Approval Workflow |
| 13.12 | Execute change order if approved | Day 7 | Claw B publishes changeorder.approved |
| 13.13 | Update budget, schedule, and contract | Same day | Auto-cascade via events to Claws D, C, B |

**AI Recommendation Logic:**
- Cost within 5% contingency → Recommend APPROVE
- No critical path impact → Recommend APPROVE
- Client previously expressed interest → Recommend APPROVE
- Cost > 10% contingency → Recommend REVIEW
- Schedule impact > 1 week → Recommend REVIEW
- Scope creep pattern detected → Recommend DECLINE

**Approval Routing Thresholds:**
- Under $5K → PM can approve
- $5K - $25K → Project owner approval required
- Over $25K → Written approval + sign-off required

**Events on Approval:** `changeorder.approved` → Claw D (recalculate budget), Claw C (adjust schedule), Claw F (generate CO letter + notify owner), Claw G (reassess risk), Claw H (create follow-up tasks)

---

### SOP-014: Progress Payments

**Purpose:** Process milestone-based payments accurately and on time.
**Trigger:** Contractor submits payment application at milestone.
**Owner:** PM with Claw B automation.
**Automation Level:** 60%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 14.1 | Receive payment request from contractor | At milestone | os-pm Payment Portal |
| 14.2 | Verify milestone completion against schedule | Day 1 | Claw C → scheduler worker (milestone check) |
| 14.3 | Review supporting documentation (photos, logs) | Day 1 | os-pm Document Review |
| 14.4 | Conduct site verification if required | Day 1-2 | Claw C → visits worker |
| 14.5 | Calculate payment amount per contract terms | Day 2 | Claw B → payments worker |
| 14.6 | Apply retainage per contract (typically 5-10%) | Day 2 | Claw B → payments worker (retainage calc) |
| 14.7 | Prepare payment recommendation report | Day 2 | Claw F → doc-generator worker |
| 14.8 | Send to client for approval | Day 2 | Claw F → comms-hub worker |
| 14.9 | Process approved payment via Stripe Connect | Day 3-5 | Claw B → payments worker (Stripe disbursement) |
| 14.10 | Generate and collect lien waiver | Same day | Claw F → doc-generator worker |
| 14.11 | Update budget with actual payment | Immediate | Claw D auto-updates via payment.disbursed event |
| 14.12 | Store all payment records | Same day | os-pm Document Vault |

**Events Triggered:** `payment.disbursed` → Claw D (record actual, check variance), Claw H (log activity)

---

## 8. Phase 5: Closeout

### SOP-015: Punch List Management

**Purpose:** Identify and track completion of all remaining items.
**Trigger:** Substantial completion reached.
**Owner:** PM.
**Automation Level:** 60%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 15.1 | Conduct thorough walkthrough of entire project | Day 1 | os-pm Mobile Checklist |
| 15.2 | AI analyzes photos for defects/incomplete items | Auto | Claw E → qa-inspector worker (Vision AI) |
| 15.3 | Generate categorized punch list | Day 1 | Claw F → doc-generator worker |
| 15.4 | Assign items to responsible contractors | Day 1 | Claw H → task-orchestrator worker |
| 15.5 | Set completion deadlines per item | Day 1 | Claw C → scheduler worker |
| 15.6 | Track completion status daily | Ongoing | os-pm Punch List Tracker |
| 15.7 | Re-inspect completed items | As completed | Claw C → visits worker |
| 15.8 | AI verifies fix quality from photos | Auto | Claw E → qa-inspector worker (Vision AI) |
| 15.9 | Mark items complete when verified | Ongoing | os-pm |
| 15.10 | Generate punch list completion report | On 100% | Claw F → doc-generator worker |

### SOP-016: Project Closeout

**Purpose:** Complete all administrative, financial, and regulatory requirements.
**Trigger:** All punch list items resolved.
**Owner:** PM with Claw B, E, F automation.
**Automation Level:** 55%

| Step | Action | Timeline | Claw / System |
|------|--------|----------|---------------|
| 16.1 | Schedule final inspection with AHJ | Day 1 | Claw E → permit-tracker worker |
| 16.2 | Prepare final inspection documentation | Day 1 | Claw F → doc-generator worker |
| 16.3 | Attend final inspection | Scheduled | PM on-site |
| 16.4 | Obtain Certificate of Occupancy | On pass | Claw E → permit-tracker worker |
| 16.5 | Calculate final retainage release amount | Day 1 | Claw B → payments worker |
| 16.6 | Collect final lien waivers from all contractors | Days 1-5 | Claw F → doc-generator + comms-hub workers |
| 16.7 | Process final payment and retainage release | Days 5-7 | Claw B → payments worker (Stripe) |
| 16.8 | Compile closeout document package | Day 7 | Claw F → doc-generator worker |
| 16.9 | Deliver warranty information to client | Day 7 | Claw F → comms-hub worker |
| 16.10 | Conduct client satisfaction survey | Week 2 | Claw F → comms-hub worker |
| 16.11 | Generate final project report | Week 2 | Claw F → doc-generator worker |
| 16.12 | Archive project and close in system | Week 2 | os-pm + Claw H (archive event) |

**Closeout Document Package Includes:**
- Certificate of Occupancy
- All approved permits
- All inspection reports (pass records)
- As-built drawings
- All warranties and manuals
- All lien waivers (unconditional final)
- Final payment ledger
- Project photo archive

---

## 9. Claw Automation Logic Per SOP

This maps every SOP to the specific claw workers that automate it.

| SOP | Claw A (Acq) | Claw B (Contract) | Claw C (Schedule) | Claw D (Budget) | Claw E (Permits) | Claw F (Docs) | Claw G (Risk) | Claw H (Command) |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 001 Client Intake | ✅ classify + estimate | | | | | ✅ comms | | ✅ task creation |
| 002 Site Assessment | | | | | | ✅ report + comms | | |
| 003 Classification | ✅ estimation | | | | ✅ jurisdiction | | ✅ complexity | |
| 004 Design Coord. | | | | | ✅ code review | | | |
| 005 Permits | | | | | ✅ tracking + QA | ✅ docs + comms | | |
| 006 Contractor Selection | ✅ bid engine | | ✅ pre-bid visit | | | ✅ bid report | ✅ recommendation | |
| 007 Contract Admin | | ✅ contracts + payments | | | | ✅ doc gen | | |
| 008 Scheduling | | | ✅ CPM + scheduler | ✅ align budget | ✅ align inspections | | | ✅ recurring tasks |
| 009 Procurement | | ✅ PO payments | ✅ delivery tracking | ✅ budget check | ✅ QA on delivery | | | |
| 010 Daily Monitoring | | | ✅ variance | ✅ forecast | ✅ photo QA | | ✅ flagging | |
| 011 Site Visits | | | ✅ visits worker | | | ✅ report + comms | ✅ risk update | ✅ follow-up tasks |
| 012 Inspections | | | ✅ timing | | ✅ pass/fail + QA | ✅ notification | ✅ risk on fail | ✅ re-inspect task |
| 013 Change Orders | ✅ independent est. | ✅ CO processing | | | | ✅ CO letter | ✅ risk + recommend | ✅ follow-up tasks |
| 014 Progress Payments | | ✅ payments worker | ✅ milestone verify | ✅ actuals tracking | | ✅ pay app + waiver | | |
| 015 Punch List | | | ✅ scheduling | | ✅ QA inspection | ✅ punch report | | ✅ task assignment |
| 016 Closeout | | ✅ final payment | | | ✅ final inspection | ✅ closeout package | | ✅ archive |

---

## 10. Automation Rule Engine

These rules run in Claw H (command-automation) → task-orchestrator worker. When an event matches, a task is auto-created and assigned.

| Trigger Event | Auto-Created Task | Assigned To | Priority |
|--------------|-------------------|-------------|----------|
| `inspection.failed.compliance` | Schedule re-inspection + coordinate corrections | PM | HIGH |
| `budget.alert.variance.high` | Review budget variance, identify root cause | PM + notify owner | HIGH |
| `permit.expiring` (30-day warning) | Renew permit before expiration | PM | URGENT |
| `sitevisit.completed` | Upload visit report within 24 hrs | PM | MEDIUM |
| `changeorder.approved` | Verify CO execution, update all systems | PM | HIGH |
| `payment.disbursed` | Collect lien waiver from contractor | PM | MEDIUM |
| `schedule.criticalpath.changed` | Review schedule impact, notify stakeholders | PM | HIGH |
| `prediction.created` (DELAY type) | Review delay prediction, take preventive action | PM | HIGH |
| `prediction.created` (COSTOVERRUN type) | Review cost projection, present options to owner | PM + owner | HIGH |
| `contract.executed` | Create project conversation in Kealee Messenger | System auto | AUTO |

### Cron Jobs (Claw H → job-scheduler worker)

| Time | Job | Triggers |
|------|-----|----------|
| 5:00 AM | Nightly risk assessment | Claw G → predictive-engine (all active projects) |
| 6:00 AM | Permit status check | Claw E → permit-tracker (poll AHJ portals) |
| 7:00 AM | Weather-based visit adjustments | Claw C → visits worker (check forecast) |
| 8:00 AM | Budget variance reports | Claw D → budget-tracker (daily variance check) |
| 6:00 PM | Daily summary generation | Claw F → doc-generator (project summaries) |
| Monday 9:00 AM | Weekly report generation | Claw F → doc-generator (weekly reports) |
| Hourly | Overdue task escalation | Claw H → task-orchestrator (flag overdue) |

---

## 11. SOP Automation Gaps & Integration Needs

### Current Automation Levels

| SOP | Current Level | Target | Gap |
|-----|--------------|--------|-----|
| 001 Client Intake | 60% | 85% | AI form fill, auto-classification |
| 002 Site Assessment | 45% | 70% | Photo AI analysis, checklist auto-gen |
| 003 Classification | 85% | 95% | More training data needed |
| 005 Permit Management | 65% | 85% | Jurisdiction API scraping |
| 006 Contractor Selection | 75% | 90% | Background check API, insurance verify |
| 011 Site Visit Protocol | 45% | 75% | GPS check-in, auto photo tagging |
| 013 Change Order | 70% | 85% | Better impact calculation |
| 015 Punch List | 60% | 80% | Photo defect detection accuracy |

### Required Third-Party Integrations

| Integration | SOP Reference | Status | Priority |
|-------------|---------------|--------|----------|
| Calendar Sync (Google/Outlook) | SOP-002, 008, 011 | ❌ Missing | HIGH |
| Accounting (QuickBooks) | SOP-007, 014 | ❌ Missing | MEDIUM |
| E-Signature (DocuSign) | SOP-007, 013 | 🟡 Partial | HIGH |
| Background Check API | SOP-006 | ❌ Missing | MEDIUM |
| Insurance Verification | SOP-007 | ❌ Missing | MEDIUM |
| Weather API | SOP-008, 010, 011 | ❌ Missing | HIGH |
| Project Import (Procore) | SOP-008 | ❌ Missing | LOW |

---

*© 2026 Kealee Construction LLC. All rights reserved.*
