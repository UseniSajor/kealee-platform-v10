# Kealee Platform v10 — User Responsibilities Guide

## What Every User Must Provide, Upload, and Do

**Platform rule:** The platform automates ~80% of operations. The remaining 20% are intentional user responsibilities — things only humans should decide, provide, or verify.

---

## Table of Contents

1. [Responsibility Matrix (All Roles)](#1-responsibility-matrix-all-roles)
2. [Homeowner / Property Owner](#2-homeowner--property-owner)
3. [Real Estate Developer](#3-real-estate-developer)
4. [Property Manager / Business Owner](#4-property-manager--business-owner)
5. [Contractor / GC / Builder / Subcontractor](#5-contractor--gc--builder--subcontractor)
6. [Architect / Engineer](#6-architect--engineer)
7. [Kealee PM (Internal Staff)](#7-kealee-pm-internal-staff)
8. [Kealee Admin (Internal Staff)](#8-kealee-admin-internal-staff)
9. [What the Platform Handles (Zero User Input)](#9-what-the-platform-handles-zero-user-input)
10. [File Upload Requirements by Type](#10-file-upload-requirements-by-type)

---

## 1. Responsibility Matrix (All Roles)

| Action | Homeowner | Developer | Prop Mgr | Contractor | Architect | Kealee PM | Platform |
|---|---|---|---|---|---|---|---|
| **ACCOUNT & ONBOARDING** | | | | | | | |
| Create account (email/password) | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Select role | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Provide company info | — | ✅ | ✅ | ✅ | ✅ | — | — |
| Upload license | — | — | — | ✅ | ✅ | — | — |
| Upload insurance certificate | — | — | — | ✅ | — | — | — |
| Set service area | — | — | — | ✅ | ✅ | — | — |
| Upload portfolio photos | — | — | — | ✅ | ✅ | — | — |
| Add property address(es) | ✅ | ✅ | ✅ | — | — | — | — |
| **PROJECTS & LEADS** | | | | | | | |
| Describe project / scope | ✅ | ✅ | ✅ | — | — | — | — |
| Set budget range | ✅ | ✅ | ✅ | — | — | — | — |
| Set desired timeline | ✅ | ✅ | ✅ | — | — | — | — |
| Upload project photos (existing condition) | ✅ | ✅ | ✅ | — | — | — | — |
| Upload floor plans / drawings | ✅ | ✅ | — | — | ✅ | — | — |
| Submit bid | — | — | — | ✅ | — | — | — |
| Accept bid | ✅ | ✅ | ✅ | — | — | — | — |
| Sign contract | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Fund escrow | ✅ | ✅ | ✅ | — | — | — | — |
| **DURING PROJECT** | | | | | | | |
| Upload site photos | — | — | — | ✅ | — | ✅ | — |
| Upload receipts | — | — | — | ✅ | — | ✅ | — |
| Complete daily log | — | — | — | ✅ | — | ✅ | — |
| Mark tasks complete | — | — | — | ✅ | — | ✅ | — |
| Mark milestones complete | — | — | — | — | — | ✅ | — |
| Upload inspection results | — | — | — | — | — | ✅ | — |
| Approve milestone payments | ✅ | ✅ | ✅ | — | — | — | — |
| Approve change orders | ✅ | ✅ | ✅ | — | — | — | — |
| Respond to messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Upload permit documents | — | — | — | ✅ | ✅ | ✅ | — |
| Submit permit application | — | — | — | — | — | ✅ | — |
| Approve schedule changes | — | — | — | — | — | ✅ | — |
| Make QA corrections | — | — | — | ✅ | — | — | — |
| Leave project review | ✅ | ✅ | ✅ | — | — | — | — |
| **DESIGN (ARCHITECTURE)** | | | | | | | |
| Upload design files | — | — | — | — | ✅ | — | — |
| Review + comment on designs | ✅ | ✅ | — | — | — | — | — |
| Approve design versions | ✅ | ✅ | — | — | — | — | — |
| Provide stamp / seal | — | — | — | — | ✅ | — | — |
| **BILLING** | | | | | | | |
| Add payment method | ✅ | ✅ | ✅ | — | — | — | — |
| Complete Stripe Connect setup | — | — | — | ✅ | — | — | — |
| Update failed payment method | ✅ | ✅ | ✅ | — | — | — | — |
| Choose subscription plan | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |

---

## 2. Homeowner / Property Owner

### What They Must Provide

**At Signup (one-time):**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Name, email, password | Text | Required | User record, Supabase Auth |
| Property address | Text (autocomplete) | Required | Property record |
| Property type | Select (single-family, condo, townhouse, multi-family) | Required | Property record |
| Approximate square footage | Number | Optional | Property record, used for estimates |

**When Posting a Project:**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Project description | Text (free form, 50-500 words) | Required | Lead record, shown to contractors |
| Project type | Select (kitchen, bathroom, roof, etc.) | Required | Lead record, drives contractor matching |
| Budget range | Select or custom ($5K-$10K, $10K-$25K, etc.) | Required | Lead record, shown to contractors |
| Desired start date | Date picker | Optional | Lead record |
| Desired timeline | Select (2 weeks, 1 month, 2-3 months, 6+ months) | Optional | Lead record |
| Existing condition photos | Image files (JPG/PNG, max 20MB each, up to 10) | Recommended | Document records, shown to contractors with lead |
| Floor plans or drawings | PDF/Image (if available) | Optional | Document records |
| Special requirements | Text | Optional | Lead description |

**During the Project (ongoing):**

| Action | When | How |
|---|---|---|
| Review and accept a bid | After bids come in (1-3 days) | Click "Accept" on recommended bid in dashboard |
| Review and sign contract | After bid accepted | DocuSign e-signature (email link or in-dashboard) |
| Fund escrow | After contract signed | Enter payment method, authorize charge via Stripe |
| Review weekly reports | Every Friday (auto-delivered) | Read email or view in dashboard |
| Approve milestone payments | After each milestone + inspection pass | Click "Approve Payment" in dashboard (one-click) |
| Approve or decline change orders | When change orders are submitted | Click "Approve" or "Decline" in dashboard |
| Review design versions (if applicable) | When architect uploads new version | View designs, leave pin-point comments, approve |
| Respond to messages | As needed | In-app messaging or email reply |
| Leave a review | After project completion | Star rating + text review in dashboard |

**What they DON'T do:**
- They never upload site photos during construction (contractor/PM does that)
- They never upload receipts
- They never schedule inspections
- They never write reports
- They never manage tasks or timelines
- They never coordinate with subcontractors

**Total files a homeowner might upload:** 0-15 (all at project posting time, none during construction)

---

## 3. Real Estate Developer

### Everything a Homeowner Does, Plus:

**At Signup (one-time):**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Company name | Text | Required | Organization record |
| Company address | Text | Optional | Organization record |
| Multiple property addresses | Text (multiple entries) | Required | Property records (array) |
| Project pipeline count | Number | Optional | Used for PM package recommendation |
| Team members to invite | Email addresses | Optional | OrgMember invitations |

**Per Project:**

Same as homeowner but repeated across multiple properties. Developers typically manage 5-50+ simultaneous projects.

**Unique Developer Actions:**

| Action | When | How |
|---|---|---|
| Manage portfolio dashboard | Ongoing | View aggregated metrics across all projects |
| Invite team members | As needed | Enter email, assign role (viewer, manager, admin) |
| Set organization-level budgets | Project start | Input budget ceilings per project or portfolio-wide |
| Approve bulk change orders | When multiple COs come in | Review in portfolio dashboard, batch approve |
| Download portfolio reports | Monthly/quarterly | Export from dashboard (PDF or CSV) |

**Total files a developer might upload:** 5-50+ (per project, primarily photos and plans at posting)

---

## 4. Property Manager / Business Owner

### What They Must Provide

**At Signup (one-time):**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Company name | Text | Required | Organization record |
| Managed property addresses | Text (multiple) | Required | Property records |
| Property types + unit counts | Select + number | Required | Property records |
| Preferred vendors (optional) | Contractor names/contacts | Optional | Pre-approved vendor list |
| Recurring maintenance schedule | Select (HVAC quarterly, plumbing annual, etc.) | Optional | Maintenance templates |

**For Maintenance Requests:**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Issue description | Text | Required | Lead / maintenance request |
| Urgency level | Select (emergency, urgent, routine, scheduled) | Required | Priority setting |
| Affected property + unit | Select from their properties | Required | Project/Lead record |
| Photos of issue | Image (JPG/PNG, up to 5) | Recommended | Document records, shown to vendor |
| Tenant contact info (if applicable) | Text | Optional | Project notes |
| Budget authorization limit | Dollar amount | Optional | Auto-approve threshold |

**Ongoing Actions:**

| Action | When | How |
|---|---|---|
| Submit maintenance requests | As issues arise | Form in dashboard or quick-entry |
| Approve vendor selection | When bids come in (or auto-approved if pre-approved vendor) | Click approve or let auto-assign |
| Approve payments | Per completion | One-click in dashboard |
| Review property maintenance reports | Monthly | Auto-generated, view in dashboard |
| Update property info | When units change, tenants move | Edit in property settings |

**Total files:** 2-10 per maintenance request (photos of the issue)

---

## 5. Contractor / GC / Builder / Subcontractor

### What They Must Provide

**At Signup (one-time):**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Company name | Text | Required | Organization record |
| Trade specialties | Multi-select (plumbing, electrical, HVAC, carpentry, roofing, painting, general, concrete, masonry, tile, flooring, drywall, demolition, landscaping, windows/doors, siding, gutters, insulation) | Required | MarketplaceProfile.trades |
| State contractor license number | Text | Required | MarketplaceProfile.licenseNumber |
| License document | PDF/Image (scan of license) | Required | Document record, verified by admin |
| General liability insurance certificate | PDF/Image | Required | Document record, must show $1M+ coverage |
| Workers comp certificate | PDF/Image | Required (if employees) | Document record |
| Service area | Zip code + radius OR city multi-select | Required | MarketplaceProfile.serviceArea |
| Years in business | Number | Required | MarketplaceProfile |
| Portfolio photos | Images (JPG/PNG, up to 20, min 3 recommended) | Recommended | Document records, shown on profile |
| Company logo | Image (PNG/SVG, max 5MB) | Optional | Organization record |
| Company description / bio | Text (100-500 words) | Recommended | MarketplaceProfile.bio |
| Bank account (Stripe Connect) | Banking details via Stripe | Required (to receive payments) | Stripe Connect account |
| W-9 / Tax ID | Provided through Stripe Connect onboarding | Required | Stripe |

**When Bidding on a Project:**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Bid amount | Dollar value | Required | Bid.amount (max 3% above suggested price) |
| Estimated timeline | Number of days/weeks | Required | Bid.timeline |
| Scope of work description | Text (what's included, approach) | Required | Bid.scope |
| Additional notes | Text | Optional | Bid.notes |

**During a Project (THIS IS THE HEAVY LIFTING):**

| Item | Format | Frequency | Where It Goes |
|---|---|---|---|
| Site photos | Images (JPG/PNG, 5-20 per visit) | Every site visit (1-3x/week) | Document records → APP-13 QA analysis |
| Receipts for materials/expenses | Images or PDF (photo of receipt) | As purchases happen (daily-weekly) | Document records → APP-07 OCR + budget tracking |
| Daily log entries | Text (what was done, crew count, hours, weather) | Daily on active work days | DailyLog records |
| Task completion updates | Toggle/checkbox | As tasks are completed | Task.status → triggers milestone checks |
| Subcontractor invoices | PDF | As received | Document records → budget tracking |
| Permit documents | PDF/Image (application, corrections, approvals) | As obtained from jurisdiction | Permit records |
| Change order supporting docs | PDF/Image (quotes from subs, material costs) | When requesting a change order | ChangeOrder attachments |
| Inspection correction photos | Images | After fixing QA/inspection issues | Document records → re-analysis by APP-13 |
| Warranty documents | PDF | At project closeout | Document records → closeout package |
| As-built documentation | PDF/drawings | At project closeout | Document records → closeout package |
| Lien waivers | PDF (signed) | Per payment milestone | Document records |

**Summary of Contractor File Uploads Per Project:**

| File Type | Quantity | Frequency |
|---|---|---|
| Site photos | 50-200+ | 5-20 per visit, multiple visits |
| Receipts | 20-100+ | Every material purchase |
| Permit docs | 2-10 | As obtained |
| Subcontractor invoices | 5-20 | Per sub, per milestone |
| Change order docs | 0-10 | As needed |
| Warranty docs | 3-10 | At closeout |
| As-builts | 1-5 | At closeout |
| Lien waivers | 3-8 | Per milestone |
| **TOTAL PER PROJECT** | **~100-350 files** | |

**The contractor is the platform's #1 content contributor.** The entire automation system (QA, budget tracking, reporting, predictions) runs on what the contractor uploads.

**Ongoing Account Actions:**

| Action | When | How |
|---|---|---|
| Review and bid on leads | As notified (daily) | View lead, submit bid in dashboard |
| Sign contracts | After bid accepted | DocuSign e-signature |
| Upload daily content (photos, receipts, logs) | Every active work day | Mobile app upload or dashboard |
| Address QA issues | When flagged by APP-13 | Fix issue, upload correction photos |
| Address inspection failures | When inspection fails | Complete corrections, notify PM |
| Respond to messages | As needed | In-app or email |
| Update profile | Quarterly or as needed | Update portfolio, insurance (annual renewal) |
| Renew insurance certificate | Annually | Upload new cert |
| Maintain Stripe Connect | If bank changes | Update via Stripe portal |

---

## 6. Architect / Engineer

### What They Must Provide

**At Signup (one-time):**

| Item | Format | Required? | Where It Goes |
|---|---|---|---|
| Firm name | Text | Required | Organization record |
| Specialties | Multi-select (residential, commercial, interior, landscape, structural, MEP) | Required | MarketplaceProfile |
| License number + state | Text | Required | MarketplaceProfile |
| License document | PDF/Image | Required | Document record |
| Professional stamp/seal | Image (PNG, high-res) | Required (for stamping docs) | Organization record |
| Portfolio images | Images (10-30 high-quality project photos) | Recommended | Document records, profile |
| Firm bio | Text | Recommended | MarketplaceProfile.bio |
| Service area | Multi-select | Required | MarketplaceProfile |

**Per Design Project:**

| Item | Format | Frequency | Where It Goes |
|---|---|---|---|
| Design files / drawings | PDF, DWG, or high-res images | Per design version (3-10 versions typical) | DesignVersion records |
| Concept sketches | Image/PDF | Early phase | DesignVersion |
| 3D renderings | Image (JPG/PNG) | Mid phase | DesignVersion |
| Construction drawings (plans, elevations, sections) | PDF (multi-page) | Final phase | DesignVersion |
| Specifications document | PDF/DOCX | With final drawings | Document records |
| Stamped/sealed drawings | PDF with digital stamp | For permit submission | Document records → APP-05 |
| Design revision notes | Text | Per version | DesignVersion.notes |
| Client meeting notes | Text | Per meeting | Project notes |

**Summary of Architect File Uploads Per Project:**

| File Type | Quantity |
|---|---|
| Design versions (PDF sets) | 3-10 sets, each 5-30 pages |
| Renderings | 5-15 images |
| Specifications | 1-3 documents |
| Stamped drawings | 1-2 final sets |
| **TOTAL PER PROJECT** | **~20-60 files** |

---

## 7. Kealee PM (Internal Staff)

The Kealee PM is the human bridge between automation and execution. They handle what the AI agents prepare but can't finalize.

### What the PM Must Do

**Daily:**

| Action | What They Provide | Trigger |
|---|---|---|
| Review AI decision cards | Approve/reject/defer decisions | APP-14 queues decisions |
| Review QA inspection flags | Verify AI findings, escalate real issues | APP-13 flags issues |
| Upload site visit photos | 5-20 photos per visit (JPG/PNG) | After each site visit |
| Write site visit notes | Text summary of visit observations | After each site visit |
| Complete site visit checklist | Toggle checkpoints (safety, progress, quality) | During site visit |
| Upload receipts on behalf of contractor | Image/PDF if contractor doesn't upload | As received |
| Respond to client/contractor messages | Text | As received |

**Weekly:**

| Action | What They Provide | Trigger |
|---|---|---|
| Review weekly reports before send | Verify AI-generated report accuracy | APP-04 generates Friday |
| Review risk predictions | Acknowledge, act on, or dismiss AI predictions | APP-11 generates daily |
| Review schedule optimization suggestions | Approve or modify AI recommendations | APP-12 generates weekly |
| Update task statuses | Mark tasks in progress/complete | Ongoing |
| Mark milestones complete | Confirm milestone is done | When milestone criteria met |

**Per Milestone:**

| Action | What They Provide |
|---|---|
| Verify milestone completion | Confirmation + supporting photos |
| Submit permit applications | Review AI pre-check, submit to jurisdiction |
| Record inspection results | Pass/fail + notes + correction list if failed |
| Coordinate with inspection officials | Schedule, confirm, attend |

**Per Project Lifecycle:**

| Action | When |
|---|---|
| Review auto-generated contract | Before sending to parties for signature |
| Review auto-generated change orders | Before sending for approval |
| Verify contractor license/insurance | At project start (admin may handle) |
| Conduct final walkthrough | Before project closeout |
| Review closeout package | Before sending to client |

**PM File Uploads Per Project:**

| File Type | Quantity |
|---|---|
| Site visit photos | 50-150+ (across all visits) |
| Inspection documents | 5-15 |
| Miscellaneous receipts/docs | 10-30 |
| **TOTAL PER PROJECT** | **~65-200 files** |

---

## 8. Kealee Admin (Internal Staff)

### What the Admin Must Do

**Account Management:**

| Action | Trigger |
|---|---|
| Verify contractor licenses | New contractor signup → review uploaded license |
| Verify insurance certificates | New contractor signup → review uploaded cert |
| Approve/reject contractor profiles | After verification |
| Handle user support tickets | User contacts support |
| Process refund requests | Dispute or cancellation |
| Manage subscription issues | Payment failures, plan changes |

**Platform Operations:**

| Action | Trigger |
|---|---|
| Monitor Command Center dashboard | Daily check (APP-15) |
| Acknowledge alerts | When alerts fire (APP-32 alerting) |
| Retry dead letter jobs | When jobs fail permanently |
| Pause/resume app workers | During issues or maintenance |
| Review platform metrics | Weekly |
| Update assembly library pricing | Quarterly (market rate changes) |
| Update document templates | As needed (legal changes, improvements) |
| Update message templates | As needed |
| Manage Stripe products/pricing | When pricing changes |
| Seed new assembly data | When expanding to new trades/regions |

**Admin File Uploads:**

| File Type | When |
|---|---|
| Updated document templates | When revising contract/SOW templates |
| Platform marketing assets | For marketing site updates |
| Assembly library data | CSV imports for bulk pricing updates |

---

## 9. What the Platform Handles (Zero User Input)

These operations happen with ZERO human involvement:

| Operation | Handled By |
|---|---|
| Contractor matching to leads | APP-01 Bid Engine |
| Bid scoring and ranking | APP-01 Bid Engine |
| Bid rotation (fair queue) | APP-01 Bid Engine |
| AI bid recommendation | APP-01 + APP-14 |
| Suggested price calculation | Estimating Engine + Assembly Library |
| Contract generation from template | APP-10 Document Generator |
| Escrow milestone schedule creation | APP-10 |
| Site visit scheduling (weekly cadence) | APP-02 Visit Scheduler |
| Route optimization for multi-site PMs | APP-02 |
| Change order cost/schedule impact calculation | APP-03 |
| Weekly report writing (AI-generated) | APP-04 Report Generator |
| Report PDF creation and delivery | APP-04 + APP-08 |
| Permit application AI pre-review | APP-05 Permit Tracker |
| Permit status monitoring | APP-05 |
| Permit expiration alerts | APP-05 |
| Inspection scheduling | APP-06 Inspection Coordinator |
| Inspection reminders | APP-06 + APP-08 |
| Receipt OCR (vendor, amount, category) | APP-07 Budget Tracker |
| Budget variance calculation | APP-07 |
| Budget alert generation | APP-07 |
| Budget forecasting | APP-07 + APP-11 |
| All email/SMS/notification delivery | APP-08 Communication Hub |
| Welcome email sequences | APP-08 |
| Task creation from project templates | APP-09 Task Queue |
| Task assignment based on PM workload | APP-09 |
| Overdue task detection and escalation | APP-09 |
| Phase advancement | APP-09 |
| Invoice generation | APP-10 |
| Punch list generation from QA | APP-10 |
| Closeout package assembly | APP-10 |
| Risk prediction (delays, cost overruns) | APP-11 Predictive Engine |
| Schedule optimization | APP-12 Smart Scheduler |
| Critical path calculation | APP-12 |
| Weather-aware rescheduling | APP-12 |
| Photo quality analysis (defects, safety, code) | APP-13 QA Inspector |
| Auto-generated punch list from photos | APP-13 + APP-10 |
| Decision card creation with AI recommendation | APP-14 Decision Support |
| System health monitoring | APP-15 Dashboard |
| Stripe subscription lifecycle | Webhook handlers |
| Escrow fund tracking | Stripe + FinancialTransaction |
| Contractor payout processing | Stripe Connect |
| Platform fee collection | Stripe |
| Onboarding task checklists | APP-09 |
| Cross-app chain reactions | Event Router |
| Cron job execution | BullMQ |
| Error handling and dead letter management | Error Handler |
| Circuit breaker management | Circuit Breaker |

---

## 10. File Upload Requirements by Type

### Photo Requirements

| Photo Type | Format | Max Size | Min Resolution | Quantity Limit |
|---|---|---|---|---|
| Site visit photos | JPG, PNG, HEIC | 20MB per file | 1000x1000 px | 20 per visit |
| Portfolio photos | JPG, PNG | 10MB per file | 1200x800 px | 30 per profile |
| Existing condition (client) | JPG, PNG | 20MB per file | Any | 10 per project |
| Receipt photos | JPG, PNG | 10MB per file | Readable text | No limit |
| Profile photo / logo | JPG, PNG, SVG | 5MB | 200x200 px | 1 |
| Inspection correction photos | JPG, PNG | 20MB per file | 1000x1000 px | 10 per issue |
| Design renderings | JPG, PNG | 30MB per file | 2000x1500 px | 15 per version |

### Document Requirements

| Document Type | Format | Max Size | Who Uploads |
|---|---|---|---|
| Contractor license | PDF, JPG, PNG | 10MB | Contractor |
| Insurance certificate | PDF | 10MB | Contractor |
| W-9 / Tax forms | Via Stripe Connect | — | Contractor |
| Floor plans / drawings | PDF | 50MB | Client, Architect |
| Design files | PDF, DWG | 100MB | Architect |
| Stamped drawings | PDF | 50MB | Architect |
| Specifications | PDF, DOCX | 25MB | Architect |
| Permit applications | PDF | 25MB | Contractor, PM |
| Permit approvals | PDF | 10MB | PM |
| Subcontractor invoices | PDF | 10MB | Contractor |
| Lien waivers | PDF | 5MB | Contractor |
| Warranty documents | PDF | 10MB | Contractor |
| As-built documentation | PDF | 50MB | Contractor |
| Receipts | JPG, PNG, PDF | 10MB | Contractor, PM |

### Estimated Total Platform Storage Per Project

| Project Size | Photos | Documents | Total Storage |
|---|---|---|---|
| Small ($5K-$15K) | ~50 photos (~200MB) | ~30 docs (~100MB) | ~300MB |
| Medium ($15K-$50K) | ~150 photos (~600MB) | ~75 docs (~250MB) | ~850MB |
| Large ($50K-$150K) | ~300 photos (~1.2GB) | ~150 docs (~500MB) | ~1.7GB |
| Major ($150K+) | ~500+ photos (~2GB) | ~250+ docs (~800MB) | ~2.8GB+ |

---

## Quick Reference: "Who Does What" Per Phase

### Pre-Construction Phase

| Task | Client | Contractor | Architect | PM | Platform |
|---|---|---|---|---|---|
| Describe project | ✅ writes | — | — | — | — |
| Upload existing photos | ✅ uploads | — | — | — | — |
| Calculate estimate | — | — | — | — | ✅ auto |
| Match contractors | — | — | — | — | ✅ auto |
| Send lead notifications | — | — | — | — | ✅ auto |
| Submit bid | — | ✅ writes | — | — | — |
| Score bids | — | — | — | — | ✅ auto |
| Accept bid | ✅ clicks | — | — | — | — |
| Generate contract | — | — | — | — | ✅ auto |
| Sign contract | ✅ signs | ✅ signs | — | — | — |
| Fund escrow | ✅ pays | — | — | — | — |
| Create task list | — | — | — | — | ✅ auto |
| Schedule first visit | — | — | — | — | ✅ auto |
| Check permit needs | — | — | — | — | ✅ auto |

### Construction Phase (Per Milestone)

| Task | Client | Contractor | Architect | PM | Platform |
|---|---|---|---|---|---|
| Do the construction work | — | ✅ builds | — | — | — |
| Upload daily photos | — | ✅ uploads | — | ✅ uploads | — |
| Upload receipts | — | ✅ uploads | — | — | — |
| Write daily log | — | ✅ writes | — | — | — |
| Mark tasks complete | — | ✅ updates | — | ✅ updates | — |
| Analyze photos for QA | — | — | — | — | ✅ auto (AI) |
| Track budget | — | — | — | — | ✅ auto |
| OCR receipts | — | — | — | — | ✅ auto (AI) |
| Predict risks | — | — | — | — | ✅ auto (AI) |
| Optimize schedule | — | — | — | — | ✅ auto (AI) |
| Generate weekly report | — | — | — | — | ✅ auto (AI) |
| Send report to client | — | — | — | — | ✅ auto |
| Mark milestone complete | — | — | — | ✅ confirms | — |
| Schedule inspection | — | — | — | — | ✅ auto |
| Record inspection result | — | — | — | ✅ records | — |
| Create decision card | — | — | — | — | ✅ auto (AI) |
| Approve payment | ✅ clicks | — | — | — | — |
| Release escrow payment | — | — | — | — | ✅ auto |
| Notify contractor of payment | — | — | — | — | ✅ auto |

### Post-Construction Phase

| Task | Client | Contractor | Architect | PM | Platform |
|---|---|---|---|---|---|
| Final walkthrough | ✅ attends | ✅ attends | — | ✅ leads | — |
| Upload warranty docs | — | ✅ uploads | — | — | — |
| Upload as-builts | — | ✅ uploads | ✅ uploads | — | — |
| Upload lien waivers | — | ✅ uploads | — | — | — |
| Generate closeout package | — | — | — | — | ✅ auto |
| Send closeout to client | — | — | — | — | ✅ auto |
| Leave review | ✅ writes | — | — | — | — |
| Release final payment | ✅ clicks | — | — | — | — |
| Process final payout | — | — | — | — | ✅ auto |
| Archive project | — | — | — | — | ✅ auto |

---

## Bottom Line

**The contractor carries the heaviest upload burden** — they're producing 100-350 files per project (photos, receipts, logs, docs). This is intentional because their uploads fuel the entire automation engine.

**The client's job is simple** — describe the project, pick a contractor, and click "approve" a few times. Total clicks for a typical project: ~10-15 decisions.

**The PM's job is verification** — they confirm what the AI generates, mark milestones, and handle inspections. The Command Center does 80% of their traditional workload.

**The platform does everything else** — matching, scoring, scheduling, tracking, reporting, predicting, communicating, documenting, and paying.
