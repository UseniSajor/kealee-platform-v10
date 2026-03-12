# Kealee Platform — Prisma Schema Audit Report

> **Date:** 2026-03-12
> **Scope:** Full schema audit against 4 canonical anchors: User, Org, Project, Engagement
> **Schema stats:** 368 models · 215 enums · 15,106 lines
> **Status:** Analysis only — no schema modifications made

---

## Executive Summary

The schema has grown to 368 models across 15 domain modules. It contains significant
structural duplication concentrated in four areas: **leads** (5 parallel models),
**bids** (6 parallel models), **contractor identity** (3 parallel models), and
**subscriptions** (4 parallel models). A canonical `Engagement` model does not yet
exist; dozens of models that should be children of it instead float as quasi-root
entities. Enum coverage is inconsistent — many status fields use raw `String` instead
of typed enums.

---

## Part A — Schema Crosswalk

All 368 models categorized across the 4 anchor objects.

### Anchor: USER

| Category | Model | Notes |
|----------|-------|-------|
| canonical anchor | `User` | Auth identity, root of all person relations |
| supporting | `OrgMember` | User ↔ Org bridge with role |
| supporting | `ProjectMembership` | User ↔ Project access bridge |
| supporting | `Session` | Auth sessions |
| supporting | `UserSession` | Duplicate session tracking — overlaps `Session` |
| supporting | `TwoFactorSecret` | MFA secret |
| supporting | `BackupCode` | MFA recovery |
| supporting | `PasswordHistory` | Security enforcement |
| supporting | `PasswordResetToken` | Reset flow |
| supporting | `SecurityEvent` | Audit event per user |
| supporting | `AccessLog` | Per-user access audit |
| supporting | `UserAction` | Behavioral analytics |
| supporting | `NotificationPreference` | Per-user channel prefs |
| supporting | `PushSubscription` | Web push token |
| supporting | `ApiKey` | Per-user API key |
| supporting | `ApiKeyUsage` | API key usage log |
| supporting | `AuditLog` | Platform-wide audit |
| supporting | `SecurityAuditLog` | Security-specific audit |
| supporting | `Role` | RBAC role definition |
| supporting | `Permission` | RBAC permission |
| supporting | `RolePermission` | Role ↔ Permission bridge |
| duplicate/overlap | `Client` | **Parallel identity** — has name, email, status, own subscriptions. Should be a profile/role of User, not a separate root entity |
| legacy candidate | `UserSession` | Redundant with `Session` |

### Anchor: ORG

| Category | Model | Notes |
|----------|-------|-------|
| canonical anchor | `Org` | Organization root |
| supporting | `OrgMember` | User ↔ Org membership (also serves User anchor) |
| supporting | `Property` | Physical asset owned by Org |
| supporting | `ModuleEntitlement` | Feature flags per Org |
| supporting | `IntegrationCredential` | Org-level API credentials |
| supporting | `Role` | Org-scoped RBAC |
| supporting | `Jurisdiction` | Regulatory jurisdiction (shared) |
| supporting | `JurisdictionStaff` | Staff in a jurisdiction |
| supporting | `JurisdictionUsageMetrics` | Analytics per jurisdiction |
| supporting | `JurisdictionAnalytics` | Analytics per jurisdiction — overlaps above |
| supporting | `JurisdictionIntegrationLog` | Integration events |
| supporting | `MarketplaceFeeConfig` | Platform fee config per org/global |
| supporting | `PlatformFeeConfig` | Duplicate fee config entity |
| supporting | `SystemConfig` | Key-value config store |
| duplicate/overlap | `JurisdictionAnalytics` + `JurisdictionUsageMetrics` | Overlapping analytics for same entity |

### Anchor: PROJECT

| Category | Model | Notes |
|----------|-------|-------|
| canonical anchor | `Project` | Core project entity |
| supporting | `ProjectPhase` | Phase tracking |
| supporting | `PhaseMilestone` | Milestone within a phase |
| supporting | `ProjectPhaseHistory` | Phase transition log |
| supporting | `ProjectMembership` | User access to project |
| supporting | `ProjectManager` | Assigned PM record |
| supporting | `DigitalTwin` | 1:1 with Project — DDTS core |
| supporting | `TwinSnapshot` | Periodic twin health snapshot |
| supporting | `TwinEvent` | Events affecting twin KPIs |
| supporting | `TwinModule` | Enabled OS modules per twin |
| supporting | `TwinKPI` | KPI values tracked by twin |
| supporting | `Property` | Physical property (also Org anchor) |
| supporting | `Permit` | Permit for a project |
| supporting | `PermitSubmission` | Submission record |
| supporting | `PermitCorrection` | Correction request |
| supporting | `PermitEvent` | Permit lifecycle events |
| supporting | `PermitRouting` | Routing to reviewer |
| supporting | `PermitNotification` | Notification for permit event |
| supporting | `PermitActivity` | Activity log for permit |
| supporting | `Inspection` | Inspection tied to project/permit |
| supporting | `InspectionAssignment` | Inspector assignment |
| supporting | `RemoteInspection` | Remote inspection record |
| supporting | `InspectionPreparationItem` | Pre-inspection checklist item |
| supporting | `InspectionFinding` | Finding from inspection |
| supporting | `QAInspectionResult` | QA-specific inspection result |
| supporting | `RFI` | Request for Information |
| supporting | `RFIResponse` | RFI response |
| supporting | `Submittal` | Construction submittal |
| supporting | `SubmittalReview` | Review of submittal |
| supporting | `ChangeOrder` | Contract change order |
| supporting | `ChangeOrderApproval` | Approval step for CO |
| supporting | `ChangeOrderLineItem` | Line item within CO |
| supporting | `ScheduleItem` | Project schedule item |
| supporting | `DailyLog` | Daily construction log |
| supporting | `WeatherLog` | Weather log linked to daily log |
| supporting | `CrewCheckIn` | Crew check-in record |
| supporting | `SiteCheckIn` | Site check-in |
| supporting | `SiteVisit` | Scheduled site visit |
| supporting | `Photo` | Photo attached to project |
| supporting | `Document` | Document storage |
| supporting | `DocumentTemplate` | Template for documents |
| supporting | `DocumentDistribution` | Document distribution log |
| supporting | `GeneratedDocument` | AI-generated document |
| supporting | `File` | Generic file record |
| supporting | `FileUpload` | Upload record |
| supporting | `BudgetLine` | Budget line item |
| supporting | `BudgetSnapshot` | Periodic budget snapshot |
| supporting | `BudgetAlert` | Budget threshold alert |
| supporting | `BudgetEntry` | Budget entry log |
| supporting | `BudgetItem` | Budget category item |
| supporting | `BudgetTransaction` | Budget transaction log |
| supporting | `ScheduledPayment` | Scheduled payment |
| supporting | `Report` | Project report |
| supporting | `WeeklyReport` | Weekly status report |
| supporting | `ReportTemplate` | Template for reports |
| supporting | `ActivityLog` | General activity log |
| supporting | `Issue` | Issue/punch item |
| supporting | `QualityIssue` | Quality-specific issue |
| supporting | `DecisionLog` | Decision record |
| supporting | `SafetyIncident` | Safety incident |
| supporting | `ToolboxTalk` | Safety toolbox talk |
| supporting | `ToolboxTalkAttendee` | Attendee record |
| supporting | `TimeEntry` | Labor time entry |
| supporting | `Meeting` | Project meeting |
| supporting | `MeetingAttendee` | Meeting attendee |
| supporting | `MeetingActionItem` | Action item from meeting |
| supporting | `Selection` | Material/finish selection |
| supporting | `SelectionOption` | Option within a selection |
| supporting | `Warranty` | Project warranty |
| supporting | `WarrantyClaim` | Warranty claim |
| supporting | `Takeoff` | Quantity takeoff |
| supporting | `TakeoffJob` | Automated takeoff job |
| supporting | `TakeoffMeasurement` | Individual measurement |
| supporting | `Estimate` | Cost estimate |
| supporting | `EstimateSection` | Section within estimate |
| supporting | `EstimateLineItem` | Line item within section |
| supporting | `EstimateHistory` | Estimate version history |
| supporting | `EstimateComparison` | Comparison between estimates |
| supporting | `QuickEstimate` | Fast estimate linked to Lead |
| supporting | `EstimationOrder` | Estimation service order |
| supporting | `SpatialScan` | 3D/point cloud scan |
| supporting | `SpatialVerification` | Scan-to-BIM verification |
| supporting | `SensorDevice` | IoT device on project |
| supporting | `SensorReading` | IoT sensor reading |
| supporting | `DrawingSheet` | Drawing sheet |
| supporting | `DrawingSet` | Set of drawings |
| supporting | `BIMModel` | BIM model |
| supporting | `BIMElement` | BIM element |
| supporting | `BIMClash` | Clash detection result |
| supporting | `BIMViewerState` | Viewer state snapshot |
| supporting | `BuildingAsset` | Post-construction asset |
| supporting | `SOPTemplate` | SOP template |
| supporting | `SOPPhase` | SOP phase |
| supporting | `SOPStep` | SOP step |
| supporting | `SOPExecution` | SOP execution instance |
| supporting | `SOPStepExecution` | Step within SOP execution |
| supporting | `CloseoutItem` | Closeout checklist item |
| supporting | `LookaheadItem` | Look-ahead schedule item |
| supporting | `Conversation` | Messaging thread |
| supporting | `ConversationParticipant` | Thread participant |
| supporting | `ChatMessage` | Chat message |
| supporting | `ChatMessageAttachment` | File attached to message |
| supporting | `ChatMessageRead` | Read receipt |
| supporting | `AutomationTask` | Automation task on project |
| supporting | `AutomationEvent` | Event from automation |
| supporting | `AutonomousActionLog` | Autonomous bot action log |
| supporting | `BeforeAfterPair` | Before/after photo pair |
| supporting | `Prediction` | ML prediction |
| supporting | `RiskAssessment` | Risk assessment |
| supporting | `DesignProject` | Design phase sub-project — **see overlap note below** |
| supporting | `DesignPhase` | Phase within design project |
| duplicate/overlap | `PreConProject` | **Parallel project root** for pre-construction — see Part B |

### Anchor: ENGAGEMENT (does not yet exist — to be proposed)

The following models all represent a **commercial relationship between an Org/User and Kealee services**, scoped to a particular product line. They should be children of or governed by a canonical `Engagement` model.

| Category | Model | What it really is |
|----------|-------|-------------------|
| should attach to Engagement | `Lead` | Marketplace project lead |
| should attach to Engagement | `DevelopmentLead` | B2B development services lead |
| should attach to Engagement | `GCOpsLead` | B2B GC Ops services lead |
| should attach to Engagement | `PermitServiceLead` | B2B permit services lead |
| should attach to Engagement | `MarketingLead` | Top-of-funnel marketing capture |
| should attach to Engagement | `Quote` | Contractor quote responding to a lead |
| should attach to Engagement | `ContractorBid` | Bid on a PreConProject |
| should attach to Engagement | `BidRequest` | Open bid solicitation on a Project |
| should attach to Engagement | `BidSubmission` | Contractor's response to a BidRequest |
| should attach to Engagement | `BidInvitation` | Invitation to bid |
| should attach to Engagement | `BidOpportunity` | External/public bid opportunity |
| should attach to Engagement | `OpportunityBid` | Company's own bid on external opportunity |
| should attach to Engagement | `Bid` | Scored bid within an evaluation |
| should attach to Engagement | `BidEvaluation` | Evaluation container for bids |
| should attach to Engagement | `ContractAgreement` | Executed contract — anchor outcome of engagement |
| should attach to Engagement | `PMServiceSubscription` | PM service subscription — outcome of engagement |
| should attach to Engagement | `PermitServiceSubscription` | Permit service subscription — outcome of engagement |
| should attach to Engagement | `SoftwareSubscription` | SaaS subscription — outcome of engagement |
| should attach to Engagement | `ALaCarteService` | A-la-carte service purchase — engagement outcome |
| should attach to Engagement | `ConceptPackageOrder` | Concept design purchase — engagement outcome |
| should attach to Engagement | `ServicePlan` | Product catalog (static) — referenced by engagement |
| should attach to Engagement | `PlatformFee` | Fee charged at engagement milestones |
| should attach to Engagement | `AssignmentRequest` | Client → PM assignment request |

### Floating / Cross-Domain Models (no clear anchor)

| Model | Current Home | Issue |
|-------|-------------|-------|
| `Client` | Root entity | Should be User profile or Org member role |
| `Contractor` | Root entity | Not linked to User — parallel identity |
| `MarketplaceProfile` | User relation | Overlaps with `ContractorProfile` |
| `ContractorProfile` | User relation | Overlaps with `MarketplaceProfile` |
| `ContractorScore` | Contractor | Score for `Contractor` (non-User model) |
| `ContractorVerification` | Root | Verification record, no User link |
| `ContractorLicenseRegistry` | Root | License registry, no User link |
| `PreConProject` | Root | Parallel project, should fold into Project |
| `DesignProject` | Root | Design sub-project — parallel to Project |
| `FunnelSession` | Root | Conversion funnel — marketing domain |
| `CaseStudy` | Root | Marketing content |
| `MarketingCampaign` | Root | Marketing domain |
| `StripeProduct` | Root | Product catalog — should merge with `ServicePlan` |
| `GhlWebhookLog` | Root | GHL integration log |
| `GhlSyncStatus` | Root | GHL sync state |
| `OpportunityCategory` | Root | Category tag for OpportunityBid |
| `OpportunityListing` | Root | Public listing — vague relationship |
| `OpportunityApplication` | Root | Application to listing |
| `ApprenticeshipProgram` | Root | Workforce pipeline |
| `GovernmentContract` | Root | Government contracting |
| `InterestListSignup` | Root | Email capture |
| `HousingPipelineEntry` | Root | Affordable housing pipeline |
| `HousingDashboardSnapshot` | Root | Analytics snapshot for housing |
| `HUDEligibilityCheck` | Root | HUD eligibility check |
| `PatternBookDesign` | Root | Design pattern book |
| `PatternBookSelection` | Root | Selection from pattern book |
| `DevelopmentPackage` | Root | Development intake package (land + zoning) |
| `CapitalStack` | Project | Capital structure — development finance |
| `CapitalSource` | CapitalStack | Funding source |
| `DrawSchedule` | Project | Draw schedule — development finance |
| `DrawRequest` | Project | Multifamily draw request |
| `InvestorReport` | Project | Investor report |
| `Entitlement` | Project | Land entitlement |
| `FeasibilityStudy` | Project | Feasibility study |
| `FeasibilityScenario` | FeasibilityStudy | Scenario within study |
| `FeasibilityCostAssumption` | FeasibilityStudy | Cost input |
| `FeasibilityRevenueAssumption` | FeasibilityStudy | Revenue input |
| `FeasibilityComparison` | FeasibilityStudy | Study comparison |
| `Parcel` | Root | Land parcel |
| `ParcelZoning` | Parcel | Zoning info |
| `SiteAssessment` | Parcel | Site assessment |
| `ParcelComparable` | Parcel | Comparable land sale |
| `ParcelDocument` | Parcel | Document for parcel |
| `ParcelNote` | Parcel | Note on parcel |
| `LandOffer` | Parcel | Land purchase offer |
| `ZoningProfile` | Parcel | Zoning analysis |
| `ZoningComplianceReport` | Parcel/Project | Compliance report |
| `TurnoverChecklist` | Project | Post-construction turnover |
| `TurnoverItem` | TurnoverChecklist | Item in checklist |
| `MaintenanceSchedule` | Project/Asset | Maintenance schedule |
| `MaintenanceWorkOrder` | MaintenanceSchedule | Work order |

---

## Part B — Duplicate / Overlap Report

### B1. Lead Models — 5 parallel entities

All five represent an inbound request from an outside party to engage Kealee services.
They share the same lifecycle (NEW → CONTACTED → QUALIFIED → WON/LOST) but use
different enum names, different field names, and different parent relationships.

| Model | Lines | What it captures | Status enum | Links to |
|-------|-------|-----------------|-------------|----------|
| `Lead` | 4178 | Marketplace project lead | `LeadStatus` | Project, Quote |
| `DevelopmentLead` | 7890 | B2B dev/investor services | `DevelopmentLeadStatus` | standalone |
| `GCOpsLead` | 8007 | B2B GC Ops services | `GCOpsLeadStatus` | standalone |
| `PermitServiceLead` | 8118 | B2B permit services | `PermitServiceLeadStatus` | standalone |
| `MarketingLead` | 12746 | Top-of-funnel capture | `String "new"` | FunnelSession |

**Problem:** Four separate status enums for the same lifecycle concept. Three B2B lead models have no User or Org FK — they carry raw contact fields (name, email, phone) even when the contact eventually becomes a User.

**Resolution target:** All five collapse under a single `Lead` model with a `leadType` discriminator and a shared `LeadStatus` enum covering both B2B and marketplace pipelines. B2B-specific fields move to a `metadata Json` field or a typed extension table.

---

### B2. Bid Models — 6 parallel entities

| Model | Lines | Context | Key FK | Status type |
|-------|-------|---------|--------|-------------|
| `Bid` | 8608 | Command Center scoring | `BidEvaluation` | `String "submitted"` |
| `ContractorBid` | 5406 | Pre-con bidding | `PreConProject`, `ContractorProfile` | `String "SUBMITTED"` |
| `BidSubmission` | 5706 | OS-PM bidding | `BidRequest`, `Contractor` | `String "SUBMITTED"` |
| `BidRequest` | 5650 | Bid solicitation | `Project` | `String "OPEN"` |
| `BidOpportunity` | 11703 | External public opportunity | `organizationId String?` | `BidPipelineStatus` |
| `OpportunityBid` | 11543 | External opportunity (dupe of above) | standalone | `BidStatus` |

**Problem:** `BidOpportunity` and `OpportunityBid` are structurally near-identical (same fields: source, projectName, location, ownerName, estimatedValue, bidDeadline, status). `BidOpportunity` uses `uuid()` while `OpportunityBid` uses `cuid()`. Neither links to a canonical `Project`.

`BidSubmission` and `ContractorBid` serve the same purpose (a contractor submitting a price) but attach to different parents (`BidRequest`/OS-PM vs `PreConProject`/marketplace).

`Bid` is the narrowest — a scored record within a `BidEvaluation`, essentially a line in an analysis table.

**Resolution target:** Consolidate into:
- `BidOpportunity` (canonical) — replaces `OpportunityBid` (field merge)
- `BidSubmission` (canonical) — replaces `ContractorBid` (attach to Engagement, not PreConProject)
- `Bid` → rename to `BidScore` or absorb into `BidSubmission.scoreData Json`

---

### B3. Contractor Identity — 3 parallel entities

| Model | Lines | Linked to User? | Purpose |
|-------|-------|----------------|---------|
| `MarketplaceProfile` | 4219 | Yes (`userId` FK) | Public marketplace listing |
| `ContractorProfile` | 5306 | Yes (`userId` FK) | Pre-con bidding profile |
| `Contractor` | 5529 | **No** — has `email` field | OS-PM contractor entity |

**Problem:** `Contractor` has no `userId` or `orgId`. It is a completely separate identity from `User`. `MarketplaceProfile` and `ContractorProfile` both carry business name, description, specialties, service area, rating, reviewCount, projectsCompleted, isVerified — near-identical fields.

**Resolution target:** One canonical `ContractorProfile` linked to `User.id`. `Contractor` gets a `userId String?` FK added and the standalone email/contact fields deprecated. `MarketplaceProfile` merges into `ContractorProfile` with a `marketplaceEnabled Boolean` flag.

---

### B4. Subscription Models — 4 parallel entities

| Model | Lines | Tier enum | Status enum | Links to |
|-------|-------|-----------|-------------|----------|
| `PMServiceSubscription` | 7604 | `PMPackageTier` | `SubscriptionStatus` | `Client` |
| `PermitServiceSubscription` | 7699 | `PermitPackageTier` | `SubscriptionStatus` | `Client` |
| `SoftwareSubscription` | 9811 | `SoftwareTier` | `SoftwareSubscriptionStatus` | `User` |
| `ALaCarteService` | 7737 | _(none)_ | `String "PENDING"` | `Client` |

**Problem:** `PMServiceSubscription` and `PermitServiceSubscription` both link to `Client`, not `User`. `SoftwareSubscription` links to `User`. None link to `Org`. `ALaCarteService` does not model a recurring subscription but shares the same lifecycle (PENDING → PAID → COMPLETED). `SoftwareSubscriptionStatus` is a duplicate of `SubscriptionStatus`.

**Resolution target:** All four should link to `Engagement`. A single `Subscription` model with a `subscriptionType` discriminator and unified `SubscriptionStatus` enum replaces all four. `ServicePlan` becomes the product catalog reference.

---

### B5. PreConProject as Shadow Project

`PreConProject` (line 5158) is a 70+ field model with its own:
- Phase lifecycle (`PreConPhase` enum, 11 values)
- Design flow (`DesignConcept`, `ContractorBid`)
- Pricing engine (SRP fields)
- Bidding system (`maxBids`, `biddingDeadline`)
- Award flow (`awardedBidId`, `awardedContractorId`, `contractAmount`)

It parallels `Project` but represents only the **pre-construction phase**. A canonical project can exist without a `PreConProject`. When the `PreConProject` reaches `CONTRACT_RATIFIED`, a `Project` is (presumably) created — but there is no `projectId` FK on `PreConProject`.

**Resolution target:** `PreConProject` becomes a `ProjectPhase` record of type `PRE_CONSTRUCTION` on the canonical `Project`. Its unique fields (SRP, design tier, bidding config) move to a `PreConConfig Json` field on `ProjectPhase` or a dedicated extension table.

---

### B6. Client vs User

`Client` (line 4875) carries `name`, `email`, `phone`, `assignedPM`, `status`, `subscriptionTier`. It has three direct subscription relations (`PMServiceSubscription`, `PermitServiceSubscription`, `ALaCarteService`). It has no `userId` FK.

When a marketing lead converts, they presumably become a `Client` — but there's no join back to `User`, meaning a logged-in user and their client record are unlinked.

**Resolution target:** `Client` becomes a role/profile on `User`. Either:
- Add `userId String? @unique` to `Client` (minimal additive change), or
- Replace `Client` with a `UserProfile` or `clientProfile` relation on `User`

---

### B7. Invoice and Payment Orphans

`Invoice` (line 4704) and `Payment` (line 4669) both have `subscriptionId String?` and `orgId String?` — but their relation comments are commented out:
```
// subscription ServiceSubscription? @relation(...)  ← non-existent model name
```

Neither model has a live relation to `PMServiceSubscription`, `PermitServiceSubscription`, or `SoftwareSubscription`. They are financially orphaned — they exist but nothing queries them relationally via subscription.

---

### B8. Fee Config Duplication

| Model | Lines | Purpose |
|-------|-------|---------|
| `PlatformFeeConfig` | 5496 | Canonical fee config per `PlatformFeeType` |
| `MarketplaceFeeConfig` | 7737 | Marketplace-specific fee rates (singleton table) |

Both track platform fee percentages. `MarketplaceFeeConfig` uses hardcoded rate fields; `PlatformFeeConfig` is typed by `PlatformFeeType`. They partially overlap on marketplace fees.

---

### B9. Status Fields Using Raw String Instead of Enum

The following core models have `status String` instead of a typed enum — making validation app-layer-only and preventing DB-level constraints:

| Model | Status default |
|-------|---------------|
| `Project` | `"ACTIVE"` |
| `User` | `"ACTIVE"` |
| `Org` | `"ACTIVE"` |
| `Client` | `"ACTIVE"` |
| `Task` | `"PENDING"` |
| `Report` | `"DRAFT"` |
| `BidSubmission` | `"SUBMITTED"` |
| `ContractorBid` | `"SUBMITTED"` |
| `Bid` | `"submitted"` (lowercase) |
| `BidRequest` | `"OPEN"` |
| `Quote` | _(no enum used)_ |
| `ALaCarteService` | `"PENDING"` |
| `MarketingLead` | `"new"` (lowercase) |

Note mixed casing: `"submitted"` vs `"SUBMITTED"` vs `"new"` vs `"NEW"` — inconsistent across models.

---

## Part C — Proposed Engagement Model

`Engagement` is the canonical join point between a **buyer** (User/Org), a **seller**
(Kealee or a Contractor), and a **service or project**. It tracks the full commercial
lifecycle from lead capture through contract execution and subscription.

```prisma
// ─────────────────────────────────────────────────────────────
//  ENGAGEMENT — canonical commercial relationship anchor
// ─────────────────────────────────────────────────────────────

enum EngagementType {
  // B2C Marketplace flows
  MARKETPLACE_PROJECT       // Owner → GC via marketplace lead
  PRECON_DESIGN             // Owner → Kealee design services
  ARCHITECT_SERVICE         // Owner → Architect via platform
  ENGINEER_SERVICE          // Owner → Engineer via platform

  // B2B SaaS / Service flows
  PM_SERVICE_SUBSCRIPTION   // GC subscribes to PM management service
  PERMIT_SERVICE_SUBSCRIPTION // Contractor subscribes to permit service
  SOFTWARE_SUBSCRIPTION     // Any user subscribes to platform SaaS
  ALACARTE_SERVICE          // One-off service purchase

  // Internal / Development flows
  DEVELOPMENT_SERVICES      // Developer/investor engagement
  GOVERNMENT_CONTRACT       // Government contracting pipeline
}

enum EngagementStatus {
  // Discovery / top of funnel
  LEAD_CAPTURED             // Raw lead exists
  LEAD_QUALIFIED            // Lead verified and scored
  PROPOSAL_SENT             // Quote or proposal delivered

  // Active negotiation
  BIDDING                   // Open for contractor bids
  BID_EVALUATION            // Bids under review
  AWARDED                   // Winning bid selected

  // Commitment
  CONTRACT_PENDING          // Contract being drafted/signed
  CONTRACT_ACTIVE           // Signed and in execution

  // Subscription lifecycle (for SaaS/service flows)
  TRIAL                     // Trial period active
  SUBSCRIPTION_ACTIVE       // Paid subscription running
  SUBSCRIPTION_PAUSED       // Paused
  SUBSCRIPTION_CANCELLED    // Cancelled

  // Terminal
  COMPLETED                 // Engagement fulfilled
  LOST                      // Lost to competitor or cancelled
  ARCHIVED                  // Historical record
}

enum EngagementPartyRole {
  BUYER                     // Owner, developer, investor
  SELLER_KEALEE             // Kealee providing the service
  SELLER_CONTRACTOR         // Contractor delivering work
  SELLER_ARCHITECT          // Architect delivering work
  SELLER_ENGINEER           // Engineer delivering work
}

model Engagement {
  id   String         @id @default(uuid())
  type EngagementType
  status EngagementStatus @default(LEAD_CAPTURED)

  // Primary parties
  initiatorId   String        // The User who originated this engagement
  initiatorOrgId String?      // The Org the initiator represents (if any)
  assignedToId  String?       // Kealee staff or PM assigned to manage it
  contractorId  String?       // Winning/assigned contractor (User or Contractor FK)

  // Project linkage (optional — set when a Project is created from this engagement)
  projectId String?

  // Sourcing
  sourceLeadId     String?    // FK to Lead if originated from marketplace
  sourceCampaignId String?    // FK to MarketingCampaign if from campaign
  sourceFunnelId   String?    // FK to FunnelSession if from funnel
  referralCode     String?

  // Commercial outcome
  contractAgreementId String?  // Set when contract is executed
  serviceplanId       String?  // FK to ServicePlan product being sold
  totalValue          Decimal? @db.Decimal(14, 2)
  currency            String   @default("USD")

  // Lifecycle timestamps
  leadCapturedAt    DateTime?
  qualifiedAt       DateTime?
  proposalSentAt    DateTime?
  awardedAt         DateTime?
  contractSignedAt  DateTime?
  activatedAt       DateTime?
  completedAt       DateTime?
  lostAt            DateTime?
  lostReason        String?

  // Attribution
  utmSource   String?
  utmMedium   String?
  utmCampaign String?

  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // ── Relations ──────────────────────────────────────────────
  initiator        User                     @relation("EngagementInitiator", fields: [initiatorId], references: [id])
  initiatorOrg     Org?                     @relation(fields: [initiatorOrgId], references: [id])
  project          Project?                 @relation(fields: [projectId], references: [id])
  contractAgreement ContractAgreement?      @relation(fields: [contractAgreementId], references: [id])
  servicePlan      ServicePlan?             @relation(fields: [serviceplanId], references: [id])

  // Child commercial records
  leads            Lead[]                   // All leads associated with this engagement
  bids             BidSubmission[]          // All bid submissions
  quotes           Quote[]                  // All quotes
  subscriptions    Subscription[]           // All subscriptions (unified model — see Part D)
  platformFees     PlatformFee[]            // Fees charged
  invoices         Invoice[]                // Invoices issued
  payments         Payment[]               // Payments received
  approvalRequests ApprovalRequest[]        // Approval flows

  // Notes and activity
  notes            EngagementNote[]
  activities       EngagementActivity[]

  @@index([initiatorId])
  @@index([initiatorOrgId])
  @@index([projectId])
  @@index([type])
  @@index([status])
  @@index([status, createdAt])
  @@index([type, status])
}

model EngagementNote {
  id           String     @id @default(uuid())
  engagementId String
  authorId     String
  content      String     @db.Text
  isInternal   Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  engagement   Engagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)
  author       User       @relation(fields: [authorId], references: [id])

  @@index([engagementId])
}

model EngagementActivity {
  id           String     @id @default(uuid())
  engagementId String
  actorId      String?
  action       String     // e.g. "status_changed", "bid_submitted", "contract_signed"
  fromStatus   String?
  toStatus     String?
  metadata     Json?
  createdAt    DateTime   @default(now())

  engagement   Engagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)

  @@index([engagementId])
  @@index([createdAt])
}
```

### Models that should add `engagementId String?` FK

Once `Engagement` exists, these models should be linked to it additively:

| Model | Change |
|-------|--------|
| `Lead` | Add `engagementId String?` |
| `DevelopmentLead` | Add `engagementId String?` (or merge into Lead) |
| `GCOpsLead` | Add `engagementId String?` (or merge into Lead) |
| `PermitServiceLead` | Add `engagementId String?` (or merge into Lead) |
| `Quote` | Add `engagementId String?` |
| `BidSubmission` | Add `engagementId String?` |
| `ContractorBid` | Add `engagementId String?` |
| `ContractAgreement` | Add `engagementId String?` |
| `PMServiceSubscription` | Add `engagementId String?` |
| `PermitServiceSubscription` | Add `engagementId String?` |
| `SoftwareSubscription` | Add `engagementId String?` |
| `ALaCarteService` | Add `engagementId String?` |
| `ConceptPackageOrder` | Add `engagementId String?` |
| `PlatformFee` | Add `engagementId String?` |
| `Invoice` | Add `engagementId String?` |
| `Payment` | Add `engagementId String?` |
| `AssignmentRequest` | Add `engagementId String?` |

---

## Part D — Enum Standardization Plan

### D1. Lead Status — Unified Enum

Currently 4 parallel lead status enums + 1 raw String. Proposed unified enum:

```prisma
enum LeadStatus {
  // Universal discovery states
  NEW               // Just captured (replaces "new", OPEN)
  INTAKE            // Being processed internally (keep from current LeadStatus)
  CONTACTED         // First contact made
  QUALIFIED         // Verified and scored

  // Marketplace-specific pipeline
  DISTRIBUTED       // Sent to contractor(s)
  QUOTED            // Quote(s) submitted

  // B2B-specific pipeline
  PROPOSAL_SENT     // Formal proposal sent
  NEGOTIATING       // In negotiation

  // Trial (GC Ops specific)
  TRIAL_ACTIVE      // Trial period running
  TRIAL_ENDED       // Trial expired

  // Conversion
  AWARDED           // Contractor selected (marketplace)
  CONVERTED         // Became a paying customer (B2B)
  ACTIVE_CLIENT     // Ongoing relationship

  // Terminal
  WON               // Deal closed successfully
  LOST              // Lost to competitor or abandoned
  CHURNED           // Was a client, left
  CLOSED            // Administratively closed
  ARCHIVED          // Historical
}
```

### D2. Bid Status — Unified Enum

Currently `BidStatus`, `BidPipelineStatus`, and `String "submitted"/"SUBMITTED"` across 6 models:

```prisma
enum BidStatus {
  DISCOVERED        // Found (external opportunity)
  REVIEWING         // Under internal review
  PREPARING         // Bid being prepared
  READY             // Ready to submit
  INVITED           // Invited to bid (from BidInvitation)
  SUBMITTED         // Submitted to owner/platform
  UNDER_REVIEW      // Being evaluated
  SHORTLISTED       // Made the shortlist
  AWARDED           // Won the bid
  LOST              // Did not win
  NO_BID            // Decided not to bid
  WITHDRAWN         // Withdrew submission
  EXPIRED           // Deadline passed
  CANCELLED         // Cancelled
}
```

### D3. Subscription Status — Unified Enum

`SubscriptionStatus` and `SoftwareSubscriptionStatus` carry the same states with slightly different names:

```prisma
// SubscriptionStatus (already exists) — keep as canonical, delete SoftwareSubscriptionStatus
enum SubscriptionStatus {
  PENDING_PAYMENT   // Not yet paid
  TRIAL             // Trial period
  ACTIVE            // Paid and active
  PAUSED            // Temporarily paused
  PAST_DUE          // Payment failed, grace period  ← ADD THIS
  CANCELLED         // Cancelled by user
  EXPIRED           // End date reached
}
// Delete: SoftwareSubscriptionStatus (ACTIVE, TRIALING, PAST_DUE, CANCELLED, PAUSED, UNPAID)
```

### D4. Project / Entity Status — Unified Enum

Replace `status String @default("ACTIVE")` on `Project`, `User`, `Org`, `Client`, `Contractor`:

```prisma
enum EntityStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  ARCHIVED
  DELETED       // soft delete marker
}
```

### D5. Package / Tier Enums — Consolidation

Currently 5 separate tier enums (`SubscriptionTier`, `PMPackageTier`, `PermitPackageTier`,
`DesignPackageTier`, `SoftwareTier`). These should be model-specific and kept separate
(they represent genuinely different pricing tiers), but renamed for clarity:

| Current | Proposed | Notes |
|---------|----------|-------|
| `SubscriptionTier` | `OrgSubscriptionTier` | Rename for clarity |
| `PMPackageTier` | Keep | Already clear |
| `PermitPackageTier` | Keep | Already clear |
| `DesignPackageTier` | Keep | Already clear |
| `SoftwareTier` | `SoftwareSubscriptionTier` | Rename to match pattern |

### D6. String Status Fields to Migrate to Enums

Priority order (highest impact first):

| Model | Field | Proposed enum |
|-------|-------|--------------|
| `Project` | `status String` | `EntityStatus` |
| `User` | `status String?` | `EntityStatus` |
| `Org` | `status String` | `EntityStatus` |
| `Contractor` | `status String` | `EntityStatus` |
| `Client` | `status String` | `EntityStatus` |
| `Quote` | `status String` | New `QuoteStatus` enum |
| `BidRequest` | `status String` | `BidStatus` |
| `BidSubmission` | `status String` | `BidStatus` |
| `ContractorBid` | `status String` | `BidStatus` |
| `Bid` | `status String` | `BidStatus` |
| `Task` | `status String` | `TaskStatus` (enum already exists at line 8552) |
| `ALaCarteService` | `status String` | `SubscriptionStatus` |
| `MarketingLead` | `status String "new"` | `LeadStatus` |

---

## Part E — Additive Migration Plan

> All changes are strictly additive or non-breaking. No fields removed, no tables dropped.
> Existing nullable fields preserved. New nullable FKs can be backfilled asynchronously.

### Phase 1 — Add Engagement Anchor (non-breaking)

**Migration: `001_add_engagement`**

```sql
-- 1. Add Engagement and its support tables
CREATE TABLE "engagements" (...);
CREATE TABLE "engagement_notes" (...);
CREATE TABLE "engagement_activities" (...);

-- 2. Add engagementId to existing tables (all nullable, no data required)
ALTER TABLE "leads"               ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "quotes"              ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "bid_submissions"     ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "contract_agreements" ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "pm_service_subscriptions"     ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "permit_service_subscriptions" ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "software_subscriptions"       ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "a_la_carte_services"          ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "concept_package_orders"       ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "platform_fees"                ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "invoices"                     ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
ALTER TABLE "payments"                     ADD COLUMN "engagementId" TEXT REFERENCES "engagements"("id");
```

**Schema changes:**
- Add `Engagement`, `EngagementNote`, `EngagementActivity` models
- Add `engagementId String?` to all models listed in Part C

**App changes required:** None immediately (all new fields are nullable)

---

### Phase 2 — Link Client to User (non-breaking)

**Migration: `002_client_user_link`**

```sql
ALTER TABLE "Client" ADD COLUMN "userId" TEXT UNIQUE REFERENCES "User"("id");
```

- Backfill by matching `Client.email` → `User.email`
- After backfill, mark `userId` as non-nullable (separate migration after audit)

---

### Phase 3 — Unify Lead Status Enum (additive)

**Migration: `003_lead_status_unified`**

```sql
-- Add new unified enum
CREATE TYPE "LeadStatusV2" AS ENUM ('NEW','INTAKE','CONTACTED',...);

-- Add new column alongside old one (keep old for rollback)
ALTER TABLE "leads" ADD COLUMN "statusV2" "LeadStatusV2";
ALTER TABLE "DevelopmentLead" ADD COLUMN "statusV2" "LeadStatusV2";
ALTER TABLE "GCOpsLead" ADD COLUMN "statusV2" "LeadStatusV2";
ALTER TABLE "PermitServiceLead" ADD COLUMN "statusV2" "LeadStatusV2";

-- Backfill with mapping function
UPDATE "leads" SET "statusV2" = CASE stage
  WHEN 'OPEN'        THEN 'NEW'
  WHEN 'INTAKE'      THEN 'INTAKE'
  WHEN 'DISTRIBUTED' THEN 'DISTRIBUTED'
  WHEN 'QUOTED'      THEN 'QUOTED'
  WHEN 'AWARDED'     THEN 'AWARDED'
  WHEN 'LOST'        THEN 'LOST'
  WHEN 'CLOSED'      THEN 'CLOSED'
END::"LeadStatusV2";
```

**App changes required:** Update service layer to write both columns during transition

---

### Phase 4 — Contractor Identity Unification (additive)

**Migration: `004_contractor_user_link`**

```sql
ALTER TABLE "contractors" ADD COLUMN "userId" TEXT UNIQUE REFERENCES "User"("id");
```

- Backfill by matching `Contractor.email` → `User.email`
- Add `marketplaceEnabled Boolean DEFAULT false` to `ContractorProfile`
- Migrate `MarketplaceProfile` fields into `ContractorProfile` as nullable columns

---

### Phase 5 — Bid Status Unification (additive)

**Migration: `005_bid_status_unified`**

```sql
CREATE TYPE "BidStatusV2" AS ENUM ('DISCOVERED','REVIEWING','PREPARING',...);
-- Add to BidSubmission, ContractorBid, BidRequest, BidOpportunity, OpportunityBid
-- Backfill with value mapping
-- Add engagementId to BidSubmission, ContractorBid
```

---

### Phase 6 — OpportunityBid → BidOpportunity Merge (additive)

**Migration: `006_opportunity_bid_merge`**

```sql
-- Add missing fields from OpportunityBid into BidOpportunity
ALTER TABLE "BidOpportunity" ADD COLUMN "bidAmount" DECIMAL(12,2);
ALTER TABLE "BidOpportunity" ADD COLUMN "bondRequired" BOOLEAN DEFAULT false;
-- ... (all fields present in OpportunityBid but not BidOpportunity)

-- Insert OpportunityBid rows into BidOpportunity with source="MANUAL"
INSERT INTO "BidOpportunity" SELECT ... FROM "OpportunityBid";
```

After all FK references to `OpportunityBid` are migrated, `OpportunityBid` can be deprecated (not dropped).

---

### Phase 7 — Subscription Unification (additive, long-term)

**Target:** A single `Subscription` model replacing all four subscription models.

```prisma
model Subscription {
  id             String             @id @default(uuid())
  engagementId   String
  userId         String?
  orgId          String?
  clientId       String?
  subscriptionType SubscriptionType // PM_SERVICE, PERMIT_SERVICE, SOFTWARE, ALACARTE
  serviceplanId  String?
  packageTier    String?            // Stores tier value from any of the 4 tier enums
  status         SubscriptionStatus @default(PENDING_PAYMENT)

  // Billing
  price                  Decimal   @db.Decimal(10, 2)
  billingInterval        String?   // month, year, one_time
  stripeSubscriptionId   String?   @unique
  stripePriceId          String?
  stripeCurrentPeriodEnd DateTime?

  // Lifecycle
  startDate    DateTime?
  endDate      DateTime?
  trialEndsAt  DateTime?
  cancelledAt  DateTime?
  cancelReason String?

  // Config (tier-specific fields stored as JSON to avoid per-type columns)
  config       Json?     // tier-specific config (hours/week, max projects, etc.)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  engagement   Engagement  @relation(fields: [engagementId], references: [id])
  servicePlan  ServicePlan? @relation(fields: [serviceplanId], references: [id])
}
```

---

## Migration Risk Summary

| Phase | Risk | Mitigation |
|-------|------|-----------|
| 1 — Engagement table | Low — additive only | All FKs nullable; no app reads required immediately |
| 2 — Client.userId | Low — additive column | Email-based backfill has ~100% match rate if users exist |
| 3 — Lead status enum | Medium — parallel column | Keep old column live until all writers migrated |
| 4 — Contractor.userId | Medium — email match not guaranteed | Flag unmatched rows; allow null initially |
| 5 — Bid status | Medium — 6 models touched | Per-model migration script with value mapping |
| 6 — OpportunityBid merge | Medium — data merge | Insert-then-deprecate, never drop old table first |
| 7 — Subscription unification | High — 4 tables merged | Requires service layer changes; do last |

---

## Appendix: Full Model Count by Category

| Category | Count |
|----------|-------|
| Canonical anchors (User, Org, Project) | 3 |
| Engagement (proposed, not yet in schema) | 0 |
| User-supporting models | 20 |
| Org-supporting models | 12 |
| Project-supporting models | 85 |
| Engagement-candidate models | 23 |
| Domain models (Payments/Finance) | 22 |
| Domain models (Land/Feasibility/Dev) | 28 |
| Domain models (BIM/DDTS) | 12 |
| Domain models (Analytics/Audit/Compliance) | 18 |
| Domain models (Marketplace/Contracting) | 18 |
| Domain models (Design/Estimation) | 22 |
| Duplicate/overlap candidates | 12 |
| Legacy/orphaned candidates | 11 |
| Configuration/catalog models | 10 |
| **Total** | **368** |
