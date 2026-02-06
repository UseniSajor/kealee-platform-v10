# KEALEE PLATFORM v10 - COMMAND CENTER BUILD SPECIFICATION
## Complete Prisma Schema & Claude Code Execution Prompt

---

# PART 1: COMPREHENSIVE PRISMA SCHEMA

This schema supports all 15 Command Center mini-apps and their collective functionality. Copy this entire schema to your `packages/database/prisma/schema.prisma` file.

```prisma
// =============================================================================
// KEALEE PLATFORM v10 - COMPLETE COMMAND CENTER PRISMA SCHEMA
// =============================================================================
// Supports: 14 Automation Apps + Command Center Dashboard (15th app)
// Generated: January 2026
// =============================================================================

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// =============================================================================
// SECTION 1: CORE ENTITIES
// =============================================================================

model Organization {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  type            OrganizationType @default(GENERAL_CONTRACTOR)
  logo            String?
  website         String?
  phone           String?
  email           String?
  address         String?
  city            String?
  state           String?
  zipCode         String?
  country         String   @default("US")
  timezone        String   @default("America/New_York")
  settings        Json?
  stripeCustomerId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  users           User[]
  clients         Client[]
  projects        Project[]
  contractors     Contractor[]
  subscriptions   Subscription[]
  documents       Document[]
  jurisdictions   Jurisdiction[]

  @@map("organizations")
}

enum OrganizationType {
  GENERAL_CONTRACTOR
  CONSTRUCTION_MANAGER
  OWNER_REP
  DEVELOPER
}

model User {
  id                String    @id @default(uuid())
  organizationId    String
  email             String    @unique
  firstName         String
  lastName          String
  phone             String?
  avatar            String?
  role              UserRole  @default(PM)
  status            UserStatus @default(ACTIVE)
  calendarId        String?
  googleRefreshToken String?
  preferences       Json?
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  organization      Organization @relation(fields: [organizationId], references: [id])
  assignedProjects  Project[]    @relation("AssignedPm")
  siteVisits        SiteVisit[]
  tasks             AutomationTask[] @relation("AssignedPm")
  notifications     Notification[]
  activityLogs      ActivityLog[]
  communicationLogs CommunicationLog[] @relation("SentBy")

  @@index([organizationId])
  @@index([email])
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  PM
  COORDINATOR
  VIEWER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  PENDING
  SUSPENDED
}

model Client {
  id              String   @id @default(uuid())
  organizationId  String
  name            String
  email           String
  phone           String?
  company         String?
  address         String?
  city            String?
  state           String?
  zipCode         String?
  type            ClientType @default(RESIDENTIAL)
  source          String?
  notes           String?
  preferredContactMethod PreferredContact @default(EMAIL)
  communicationPrefs Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  projects        Project[]
  tasks           AutomationTask[]
  communicationLogs CommunicationLog[]

  @@index([organizationId])
  @@index([email])
  @@map("clients")
}

enum ClientType {
  RESIDENTIAL
  COMMERCIAL
  INDUSTRIAL
  INSTITUTIONAL
  GOVERNMENT
}

enum PreferredContact {
  EMAIL
  PHONE
  SMS
  WHATSAPP
}

// =============================================================================
// SECTION 2: PROJECT MANAGEMENT
// =============================================================================

model Project {
  id                String   @id @default(uuid())
  organizationId    String
  clientId          String
  assignedPmId      String?
  name              String
  description       String?
  address           String
  city              String?
  state             String?
  zipCode           String?
  latitude          Decimal?
  longitude         Decimal?
  type              ProjectType @default(RENOVATION)
  status            ProjectStatus @default(LEAD)
  phase             ProjectPhase @default(INITIATION)
  budget            Decimal?
  estimatedCost     Decimal?
  contractValue     Decimal?
  percentComplete   Int      @default(0)
  startDate         DateTime?
  targetEndDate     DateTime?
  actualEndDate     DateTime?
  packageTier       PackageTier @default(A)
  settings          Json?
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  organization      Organization @relation(fields: [organizationId], references: [id])
  client            Client       @relation(fields: [clientId], references: [id])
  assignedPm        User?        @relation("AssignedPm", fields: [assignedPmId], references: [id])
  subscription      Subscription?

  // Related entities from Command Center apps
  milestones        Milestone[]
  bidRequests       BidRequest[]
  siteVisits        SiteVisit[]
  permits           Permit[]
  changeOrders      ChangeOrder[]
  reports           Report[]
  predictions       Prediction[]
  tasks             AutomationTask[]
  budgetItems       BudgetItem[]
  budgetTransactions BudgetTransaction[]
  documents         Document[]
  contracts         Contract[]
  communicationLogs CommunicationLog[]
  activityLogs      ActivityLog[]
  scheduleItems     ScheduleItem[]
  weatherLogs       WeatherLog[]
  riskAssessments   RiskAssessment[]
  qualityIssues     QualityIssue[]

  @@index([organizationId])
  @@index([clientId])
  @@index([assignedPmId])
  @@index([status])
  @@index([phase])
  @@map("projects")
}

enum ProjectType {
  NEW_CONSTRUCTION
  RENOVATION
  ADDITION
  TENANT_IMPROVEMENT
  RESTORATION
  COMMERCIAL_BUILDOUT
}

enum ProjectStatus {
  LEAD
  PROPOSAL
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
  ARCHIVED
}

enum ProjectPhase {
  INITIATION
  PLANNING
  DESIGN
  PERMITTING
  PRE_CONSTRUCTION
  CONSTRUCTION
  CLOSEOUT
  WARRANTY
}

enum PackageTier {
  A
  B
  C
  D
}

model Milestone {
  id              String   @id @default(uuid())
  projectId       String
  name            String
  description     String?
  phase           ProjectPhase?
  status          MilestoneStatus @default(PENDING)
  dueDate         DateTime
  completedDate   DateTime?
  percentComplete Int      @default(0)
  dependencies    String[] @default([])
  sequence        Int      @default(0)
  isCriticalPath  Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  tasks           AutomationTask[]

  @@index([projectId])
  @@index([status])
  @@index([dueDate])
  @@map("milestones")
}

enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  DELAYED
  AT_RISK
  CANCELLED
}

model Subscription {
  id              String   @id @default(uuid())
  organizationId  String
  projectId       String   @unique
  tier            PackageTier @default(A)
  status          SubscriptionStatus @default(ACTIVE)
  stripeSubscriptionId String?
  stripePriceId   String?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAt        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  project         Project      @relation(fields: [projectId], references: [id])

  @@index([organizationId])
  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  PAUSED
}

// =============================================================================
// SECTION 3: APP-01 - CONTRACTOR BID ENGINE
// =============================================================================

model Contractor {
  id              String   @id @default(uuid())
  organizationId  String
  companyName     String
  contactName     String
  email           String
  phone           String?
  address         String?
  city            String?
  state           String?
  zipCode         String?
  latitude        Decimal?
  longitude       Decimal?
  status          ContractorStatus @default(ACTIVE)
  trades          String[] @default([])
  rating          Decimal  @default(0)
  totalProjects   Int      @default(0)
  yearsInBusiness Int?
  employeeCount   Int?
  bondingCapacity Decimal?
  website         String?
  notes           String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  credentials     ContractorCredential[]
  projects        ContractorProject[]
  reviews         ContractorReview[]
  bidInvitations  BidInvitation[]
  bidSubmissions  BidSubmission[]
  contracts       Contract[]

  @@index([organizationId])
  @@index([status])
  @@index([trades])
  @@index([rating])
  @@map("contractors")
}

enum ContractorStatus {
  ACTIVE
  INACTIVE
  PENDING_VERIFICATION
  SUSPENDED
  BLACKLISTED
}

model ContractorCredential {
  id              String   @id @default(uuid())
  contractorId    String
  type            CredentialType
  number          String?
  issuedBy        String?
  issuedAt        DateTime?
  expiresAt       DateTime?
  verifiedAt      DateTime?
  verificationMethod String?
  documentUrl     String?
  status          CredentialStatus @default(PENDING)
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  contractor      Contractor @relation(fields: [contractorId], references: [id])

  @@index([contractorId])
  @@index([type])
  @@index([expiresAt])
  @@map("contractor_credentials")
}

enum CredentialType {
  LICENSE
  GENERAL_LIABILITY
  WORKERS_COMP
  BOND
  CERTIFICATION
  INSURANCE_COI
  REGISTRATION
  PERMIT
}

enum CredentialStatus {
  PENDING
  VALID
  EXPIRED
  REVOKED
  NOT_VERIFIED
}

model ContractorProject {
  id              String   @id @default(uuid())
  contractorId    String
  projectName     String
  clientName      String?
  description     String?
  location        String?
  contractValue   Decimal?
  startDate       DateTime?
  completedAt     DateTime?
  status          String   @default("COMPLETED")
  reference       String?
  referencePhone  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  contractor      Contractor @relation(fields: [contractorId], references: [id])

  @@index([contractorId])
  @@map("contractor_projects")
}

model ContractorReview {
  id              String   @id @default(uuid())
  contractorId    String
  projectId       String?
  reviewerId      String?
  rating          Int      // 1-5 stars
  qualityScore    Int?
  timelinessScore Int?
  communicationScore Int?
  comment         String?
  isPublic        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  contractor      Contractor @relation(fields: [contractorId], references: [id])

  @@index([contractorId])
  @@index([rating])
  @@map("contractor_reviews")
}

model BidRequest {
  id              String   @id @default(uuid())
  projectId       String
  title           String?
  scope           Json
  requirements    Json
  trades          String[] @default([])
  budgetMin       Decimal?
  budgetMax       Decimal?
  deadline        DateTime
  status          BidStatus @default(OPEN)
  evaluationCriteria Json?
  attachments     Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  invitations     BidInvitation[]
  submissions     BidSubmission[]

  @@index([projectId])
  @@index([status])
  @@index([deadline])
  @@map("bid_requests")
}

enum BidStatus {
  DRAFT
  OPEN
  CLOSED
  EVALUATING
  AWARDED
  CANCELLED
}

model BidInvitation {
  id              String   @id @default(uuid())
  bidRequestId    String
  contractorId    String
  sentAt          DateTime @default(now())
  viewedAt        DateTime?
  respondedAt     DateTime?
  status          InvitationStatus @default(SENT)
  remindersSent   Int      @default(0)
  lastReminderAt  DateTime?
  declineReason   String?
  metadata        Json?

  bidRequest      BidRequest @relation(fields: [bidRequestId], references: [id])
  contractor      Contractor @relation(fields: [contractorId], references: [id])

  @@unique([bidRequestId, contractorId])
  @@index([bidRequestId])
  @@index([contractorId])
  @@index([status])
  @@map("bid_invitations")
}

enum InvitationStatus {
  SENT
  VIEWED
  SUBMITTED
  DECLINED
  EXPIRED
}

model BidSubmission {
  id              String   @id @default(uuid())
  bidRequestId    String
  contractorId    String
  amount          Decimal
  timeline        Json
  scope           Json
  inclusions      String[] @default([])
  exclusions      String[] @default([])
  clarifications  String?
  attachments     Json?
  submittedAt     DateTime @default(now())
  score           Decimal?
  priceScore      Decimal?
  timelineScore   Decimal?
  scopeScore      Decimal?
  qualificationScore Decimal?
  recommendation  BidRecommendation?
  rank            Int?
  analysisNotes   String?
  metadata        Json?

  bidRequest      BidRequest @relation(fields: [bidRequestId], references: [id])
  contractor      Contractor @relation(fields: [contractorId], references: [id])

  @@unique([bidRequestId, contractorId])
  @@index([bidRequestId])
  @@index([score])
  @@map("bid_submissions")
}

enum BidRecommendation {
  HIGHLY_RECOMMENDED
  RECOMMENDED
  ACCEPTABLE
  NOT_RECOMMENDED
}

// =============================================================================
// SECTION 4: APP-02 - SITE VISIT SCHEDULER
// =============================================================================

model SiteVisit {
  id              String   @id @default(uuid())
  projectId       String
  pmId            String
  scheduledAt     DateTime
  endAt           DateTime?
  completedAt     DateTime?
  status          VisitStatus @default(SCHEDULED)
  type            VisitType
  priority        VisitPriority @default(NORMAL)
  checklistId     String?
  notes           String?
  findings        Json?
  photos          Json?
  reportId        String?
  weatherConditions Json?
  travelTime      Int?     // minutes
  remindersSent   Int      @default(0)
  confirmedAt     DateTime?
  cancelReason    String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  pm              User     @relation(fields: [pmId], references: [id])
  checklist       VisitChecklist? @relation(fields: [checklistId], references: [id])

  @@index([projectId])
  @@index([pmId])
  @@index([scheduledAt])
  @@index([status])
  @@map("site_visits")
}

enum VisitStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  RESCHEDULED
  NO_SHOW
}

enum VisitType {
  ASSESSMENT
  PROGRESS
  INSPECTION_PREP
  PUNCH_LIST
  FINAL
  CLIENT_WALKTHROUGH
  CONTRACTOR_MEETING
  EMERGENCY
}

enum VisitPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model VisitChecklist {
  id              String   @id @default(uuid())
  name            String
  visitType       VisitType
  items           Json     // Array of checklist items
  isTemplate      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  siteVisits      SiteVisit[]

  @@map("visit_checklists")
}

// =============================================================================
// SECTION 5: APP-03 - CHANGE ORDER PROCESSOR
// =============================================================================

model ChangeOrder {
  id              String   @id @default(uuid())
  projectId       String
  contractId      String?
  number          Int
  title           String
  description     String
  reason          ChangeOrderReason
  requestedBy     RequestedBy
  requesterId     String?
  amount          Decimal
  originalAmount  Decimal?
  scheduleImpact  Int?     // days added/removed
  status          ChangeOrderStatus @default(DRAFT)
  priority        ChangeOrderPriority @default(NORMAL)
  impactAnalysis  Json?
  attachments     Json?
  requestedAt     DateTime @default(now())
  pricingRequestedAt DateTime?
  pricingReceivedAt  DateTime?
  submittedAt     DateTime?
  approvedAt      DateTime?
  approvedBy      String?
  rejectedAt      DateTime?
  rejectedBy      String?
  rejectionReason String?
  executedAt      DateTime?
  signatureUrl    String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  contract        Contract? @relation(fields: [contractId], references: [id])
  lineItems       ChangeOrderLineItem[]

  @@unique([projectId, number])
  @@index([projectId])
  @@index([status])
  @@map("change_orders")
}

enum ChangeOrderReason {
  CLIENT_REQUEST
  UNFORESEEN_CONDITIONS
  DESIGN_ERROR
  CODE_COMPLIANCE
  VALUE_ENGINEERING
  SCOPE_CLARIFICATION
  MATERIAL_SUBSTITUTION
  SCHEDULE_ACCELERATION
  OTHER
}

enum RequestedBy {
  CLIENT
  CONTRACTOR
  PM
  ARCHITECT
  ENGINEER
}

enum ChangeOrderStatus {
  DRAFT
  PRICING_REQUESTED
  PRICING_RECEIVED
  PENDING_APPROVAL
  APPROVED
  REJECTED
  EXECUTED
  CANCELLED
}

enum ChangeOrderPriority {
  LOW
  NORMAL
  HIGH
  CRITICAL
}

model ChangeOrderLineItem {
  id              String   @id @default(uuid())
  changeOrderId   String
  description     String
  quantity        Decimal?
  unit            String?
  unitCost        Decimal?
  totalCost       Decimal
  laborHours      Decimal?
  laborCost       Decimal?
  materialCost    Decimal?
  equipmentCost   Decimal?
  markup          Decimal?
  createdAt       DateTime @default(now())

  changeOrder     ChangeOrder @relation(fields: [changeOrderId], references: [id], onDelete: Cascade)

  @@index([changeOrderId])
  @@map("change_order_line_items")
}

// =============================================================================
// SECTION 6: APP-04 - REPORT GENERATOR
// =============================================================================

model Report {
  id              String   @id @default(uuid())
  projectId       String
  type            ReportType
  title           String?
  periodStart     DateTime
  periodEnd       DateTime
  content         Json
  narrative       String?
  photos          Json?
  metrics         Json?
  format          ReportFormat @default(PDF)
  status          ReportStatus @default(DRAFT)
  generatedAt     DateTime @default(now())
  sentAt          DateTime?
  sentTo          String[] @default([])
  viewedAt        DateTime?
  scheduledFor    DateTime?
  isRecurring     Boolean  @default(false)
  recurringSchedule Json?
  templateId      String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  template        ReportTemplate? @relation(fields: [templateId], references: [id])

  @@index([projectId])
  @@index([type])
  @@index([generatedAt])
  @@map("reports")
}

enum ReportType {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  MILESTONE
  FINAL
  INCIDENT
  INSPECTION
  BUDGET
  CUSTOM
}

enum ReportFormat {
  PDF
  DOCX
  HTML
}

enum ReportStatus {
  DRAFT
  GENERATING
  READY
  SENT
  FAILED
}

model ReportTemplate {
  id              String   @id @default(uuid())
  name            String
  type            ReportType
  sections        Json     // Array of section definitions
  styling         Json?
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  reports         Report[]

  @@map("report_templates")
}

// =============================================================================
// SECTION 7: APP-05 - PERMIT TRACKER
// =============================================================================

model Jurisdiction {
  id              String   @id @default(uuid())
  organizationId  String?
  name            String
  type            JurisdictionType
  state           String
  county          String?
  city            String?
  website         String?
  portalUrl       String?
  phone           String?
  email           String?
  address         String?
  avgReviewDays   Int?
  inspectionLead  Int?     // days notice required
  fees            Json?
  requirements    Json?
  contacts        Json?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization? @relation(fields: [organizationId], references: [id])
  permits         Permit[]

  @@index([state])
  @@index([city])
  @@map("jurisdictions")
}

enum JurisdictionType {
  CITY
  COUNTY
  STATE
  FEDERAL
  SPECIAL_DISTRICT
}

model Permit {
  id              String   @id @default(uuid())
  projectId       String
  jurisdictionId  String
  type            PermitType
  applicationNo   String?
  referenceNo     String?
  description     String?
  status          PermitStatus @default(PREPARING)
  priority        PermitPriority @default(NORMAL)
  fees            Decimal?
  feesPaid        Boolean  @default(false)
  feesPaidAt      DateTime?
  documents       Json?
  comments        Json?    // plan review comments
  revisions       Json?    // revision history
  conditions      Json?    // permit conditions
  preparedAt      DateTime?
  submittedAt     DateTime?
  underReviewAt   DateTime?
  revisionsRequestedAt DateTime?
  approvedAt      DateTime?
  issuedAt        DateTime?
  expiresAt       DateTime?
  finaledAt       DateTime?
  portalCredentials Json?
  lastCheckedAt   DateTime?
  nextCheckAt     DateTime?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  jurisdiction    Jurisdiction @relation(fields: [jurisdictionId], references: [id])
  inspections     Inspection[]

  @@index([projectId])
  @@index([jurisdictionId])
  @@index([status])
  @@index([applicationNo])
  @@map("permits")
}

enum PermitType {
  BUILDING
  ELECTRICAL
  PLUMBING
  MECHANICAL
  FIRE
  DEMOLITION
  GRADING
  ZONING
  SPECIAL_USE
  SIGN
  FENCE
  POOL
}

enum PermitStatus {
  PREPARING
  READY_TO_SUBMIT
  SUBMITTED
  IN_REVIEW
  REVISIONS_REQUIRED
  APPROVED
  ISSUED
  EXPIRED
  REJECTED
  CANCELLED
  FINALED
}

enum PermitPriority {
  LOW
  NORMAL
  HIGH
  CRITICAL
}

// =============================================================================
// SECTION 8: APP-06 - INSPECTION COORDINATOR
// =============================================================================

model Inspection {
  id              String   @id @default(uuid())
  permitId        String
  type            InspectionType
  status          InspectionStatus @default(PENDING)
  scheduledAt     DateTime?
  confirmedAt     DateTime?
  completedAt     DateTime?
  inspectorName   String?
  inspectorPhone  String?
  result          InspectionResult?
  notes           String?
  corrections     Json?
  photos          Json?
  prepChecklist   Json?
  prepCompleted   Boolean  @default(false)
  remindersSent   Int      @default(0)
  reinspectionOf  String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  permit          Permit   @relation(fields: [permitId], references: [id])
  reinspection    Inspection? @relation("Reinspection", fields: [reinspectionOf], references: [id])
  reinspections   Inspection[] @relation("Reinspection")

  @@index([permitId])
  @@index([scheduledAt])
  @@index([status])
  @@map("inspections")
}

enum InspectionType {
  FOUNDATION
  SLAB
  UNDERGROUND
  ROUGH_FRAMING
  SHEAR
  ROOF_SHEATHING
  MEP_ROUGH
  INSULATION
  DRYWALL
  FINAL_FRAMING
  FINAL_ELECTRICAL
  FINAL_PLUMBING
  FINAL_MECHANICAL
  FINAL_FIRE
  FINAL
  CERTIFICATE_OF_OCCUPANCY
  OTHER
}

enum InspectionStatus {
  PENDING
  REQUESTED
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  RESCHEDULED
}

enum InspectionResult {
  PASS
  FAIL
  PARTIAL
  CORRECTION_REQUIRED
  CONDITIONAL
  NOT_READY
}

// =============================================================================
// SECTION 9: APP-07 - BUDGET TRACKER
// =============================================================================

model BudgetItem {
  id              String   @id @default(uuid())
  projectId       String
  category        BudgetCategory
  subcategory     String?
  description     String
  estimatedAmount Decimal
  budgetedAmount  Decimal
  actualAmount    Decimal  @default(0)
  variance        Decimal  @default(0)
  variancePercent Decimal  @default(0)
  status          BudgetItemStatus @default(ACTIVE)
  notes           String?
  csiCode         String?  // CSI MasterFormat code
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  transactions    BudgetTransaction[]

  @@index([projectId])
  @@index([category])
  @@map("budget_items")
}

enum BudgetCategory {
  GENERAL_CONDITIONS
  SITE_WORK
  CONCRETE
  MASONRY
  METALS
  WOOD_PLASTICS
  THERMAL_MOISTURE
  DOORS_WINDOWS
  FINISHES
  SPECIALTIES
  EQUIPMENT
  FURNISHINGS
  SPECIAL_CONSTRUCTION
  CONVEYING
  MECHANICAL
  ELECTRICAL
  CONTINGENCY
  OVERHEAD
  PROFIT
  PERMITS_FEES
  DESIGN_ENGINEERING
  OTHER
}

enum BudgetItemStatus {
  ACTIVE
  COMPLETED
  ON_HOLD
  CANCELLED
}

model BudgetTransaction {
  id              String   @id @default(uuid())
  projectId       String
  budgetItemId    String?
  type            TransactionType
  category        String?
  description     String
  amount          Decimal
  date            DateTime @default(now())
  vendor          String?
  invoiceNumber   String?
  poNumber        String?
  paymentMethod   String?
  status          TransactionStatus @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  attachments     Json?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  budgetItem      BudgetItem? @relation(fields: [budgetItemId], references: [id])

  @@index([projectId])
  @@index([budgetItemId])
  @@index([type])
  @@index([date])
  @@map("budget_transactions")
}

enum TransactionType {
  EXPENSE
  PAYMENT
  INVOICE
  CREDIT
  DEPOSIT
  RETAINAGE
  CHANGE_ORDER
  ALLOWANCE
}

enum TransactionStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
  DISPUTED
}

// =============================================================================
// SECTION 10: APP-08 - COMMUNICATION HUB
// =============================================================================

model CommunicationLog {
  id              String   @id @default(uuid())
  projectId       String?
  clientId        String?
  sentById        String?
  type            CommunicationType
  channel         CommunicationChannel
  recipientId     String?
  recipientEmail  String?
  recipientPhone  String?
  subject         String?
  body            String
  templateId      String?
  status          CommunicationStatus @default(PENDING)
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  bouncedAt       DateTime?
  errorMessage    String?
  externalId      String?  // Twilio/SendGrid message ID
  attachments     Json?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project? @relation(fields: [projectId], references: [id])
  client          Client?  @relation(fields: [clientId], references: [id])
  sentBy          User?    @relation("SentBy", fields: [sentById], references: [id])

  @@index([projectId])
  @@index([clientId])
  @@index([type])
  @@index([status])
  @@index([sentAt])
  @@map("communication_logs")
}

enum CommunicationType {
  NOTIFICATION
  UPDATE
  REMINDER
  ALERT
  REPORT
  INVITATION
  CONFIRMATION
  FOLLOW_UP
  MARKETING
}

enum CommunicationChannel {
  EMAIL
  SMS
  WHATSAPP
  IN_APP
  PUSH
  PHONE
}

enum CommunicationStatus {
  PENDING
  QUEUED
  SENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
  CANCELLED
}

model CommunicationTemplate {
  id              String   @id @default(uuid())
  name            String
  type            CommunicationType
  channel         CommunicationChannel
  subject         String?
  body            String
  variables       String[] @default([])
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("communication_templates")
}

// =============================================================================
// SECTION 11: APP-09 - TASK QUEUE MANAGER
// =============================================================================

model AutomationTask {
  id              String   @id @default(uuid())
  type            TaskType
  status          TaskStatus @default(PENDING)
  priority        Int      @default(5) // 1 = highest, 10 = lowest
  projectId       String?
  clientId        String?
  milestoneId     String?
  assignedPmId    String?
  title           String?
  description     String?
  payload         Json
  result          Json?
  error           String?
  retryCount      Int      @default(0)
  maxRetries      Int      @default(3)
  scheduledAt     DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  dueAt           DateTime?
  estimatedMinutes Int?
  actualMinutes   Int?
  parentTaskId    String?
  dependsOn       String[] @default([])
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project?   @relation(fields: [projectId], references: [id])
  client          Client?    @relation(fields: [clientId], references: [id])
  milestone       Milestone? @relation(fields: [milestoneId], references: [id])
  assignedPm      User?      @relation("AssignedPm", fields: [assignedPmId], references: [id])
  parentTask      AutomationTask? @relation("SubTasks", fields: [parentTaskId], references: [id])
  subTasks        AutomationTask[] @relation("SubTasks")

  @@index([status, priority])
  @@index([assignedPmId, status])
  @@index([projectId])
  @@index([scheduledAt])
  @@index([dueAt])
  @@map("automation_tasks")
}

enum TaskType {
  // Bid Engine Tasks
  BID_REQUEST_CREATE
  CONTRACTOR_MATCH
  BID_INVITATION_SEND
  BID_ANALYSIS
  CREDENTIAL_VERIFY

  // Visit Scheduler Tasks
  VISIT_SCHEDULE
  VISIT_CONFIRM
  VISIT_REMINDER
  VISIT_REPORT

  // Change Order Tasks
  CHANGE_ORDER_ANALYZE
  CHANGE_ORDER_PRICING
  CHANGE_ORDER_APPROVE

  // Report Tasks
  REPORT_GENERATE
  REPORT_SEND
  REPORT_SCHEDULE

  // Permit Tasks
  PERMIT_STATUS_CHECK
  PERMIT_SUBMIT
  PERMIT_DOCUMENT_PREPARE

  // Inspection Tasks
  INSPECTION_SCHEDULE
  INSPECTION_PREP
  INSPECTION_FOLLOWUP

  // Budget Tasks
  BUDGET_UPDATE
  BUDGET_ALERT
  INVOICE_PROCESS

  // Communication Tasks
  EMAIL_SEND
  SMS_SEND
  NOTIFICATION_SEND

  // Document Tasks
  DOCUMENT_GENERATE
  DOCUMENT_SIGN
  DOCUMENT_ARCHIVE

  // AI Tasks
  DELAY_PREDICT
  RISK_ASSESS
  QA_ANALYZE
  DECISION_RECOMMEND

  // General Tasks
  DATA_SYNC
  CLEANUP
  CUSTOM
}

enum TaskStatus {
  PENDING
  SCHEDULED
  QUEUED
  IN_PROGRESS
  WAITING
  COMPLETED
  FAILED
  CANCELLED
  SKIPPED
}

// =============================================================================
// SECTION 12: APP-10 - DOCUMENT GENERATOR
// =============================================================================

model Document {
  id              String   @id @default(uuid())
  organizationId  String?
  projectId       String?
  type            DocumentType
  category        DocumentCategory
  name            String
  description     String?
  content         String?
  templateId      String?
  format          DocumentFormat @default(PDF)
  status          DocumentStatus @default(DRAFT)
  version         Int      @default(1)
  fileUrl         String?
  fileSize        Int?
  mimeType        String?
  checksum        String?
  variables       Json?
  signatureStatus SignatureStatus?
  signedAt        DateTime?
  signedBy        Json?
  expiresAt       DateTime?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization? @relation(fields: [organizationId], references: [id])
  project         Project?      @relation(fields: [projectId], references: [id])
  template        DocumentTemplate? @relation(fields: [templateId], references: [id])

  @@index([projectId])
  @@index([type])
  @@index([status])
  @@map("documents")
}

enum DocumentType {
  PROPOSAL
  CONTRACT
  CHANGE_ORDER
  INVOICE
  PURCHASE_ORDER
  WORK_ORDER
  CERTIFICATE
  PERMIT_APPLICATION
  INSPECTION_REPORT
  SITE_REPORT
  MEETING_MINUTES
  SUBMITTAL
  RFI
  WARRANTY
  CLOSEOUT
  LIEN_WAIVER
  NOTICE_TO_PROCEED
  CERTIFICATE_OF_COMPLETION
  PUNCH_LIST
  SAFETY_PLAN
  CUSTOM
}

enum DocumentCategory {
  CONTRACTS
  FINANCIAL
  PERMITS
  REPORTS
  CORRESPONDENCE
  DRAWINGS
  SPECIFICATIONS
  SUBMITTALS
  CLOSEOUT
  SAFETY
  ADMINISTRATIVE
}

enum DocumentFormat {
  PDF
  DOCX
  XLSX
  HTML
  IMAGE
}

enum DocumentStatus {
  DRAFT
  GENERATING
  REVIEW
  PENDING_SIGNATURE
  SIGNED
  FINAL
  ARCHIVED
  CANCELLED
}

enum SignatureStatus {
  PENDING
  SENT
  VIEWED
  SIGNED
  DECLINED
  EXPIRED
  VOIDED
}

model DocumentTemplate {
  id              String   @id @default(uuid())
  name            String
  type            DocumentType
  category        DocumentCategory
  content         String
  variables       String[] @default([])
  styling         Json?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  documents       Document[]

  @@map("document_templates")
}

// =============================================================================
// SECTION 13: APP-11 - PREDICTIVE ISSUE ENGINE
// =============================================================================

model Prediction {
  id              String   @id @default(uuid())
  projectId       String
  type            PredictionType
  probability     Decimal  // 0.0 to 1.0
  confidence      Decimal  // 0.0 to 1.0
  impact          ImpactLevel
  description     String
  factors         Json     // Array of contributing factors
  recommendedAction String?
  aiExplanation   String?
  expectedValue   Decimal? // e.g., expected delay days, cost overrun
  acknowledged    Boolean  @default(false)
  acknowledgedAt  DateTime?
  acknowledgedBy  String?
  dismissed       Boolean  @default(false)
  dismissedAt     DateTime?
  dismissedBy     String?
  dismissReason   String?
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?
  actualOutcome   Json?
  modelVersion    String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([type])
  @@index([acknowledged])
  @@index([probability])
  @@map("predictions")
}

enum PredictionType {
  DELAY
  COST_OVERRUN
  QUALITY_ISSUE
  SAFETY_RISK
  RESOURCE_SHORTAGE
  WEATHER_IMPACT
  PERMIT_DELAY
  INSPECTION_FAILURE
  SCOPE_CREEP
  COMMUNICATION_GAP
}

enum ImpactLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model RiskAssessment {
  id              String   @id @default(uuid())
  projectId       String
  assessedAt      DateTime @default(now())
  overallScore    Decimal  // 0-100
  scheduleRisk    Decimal
  budgetRisk      Decimal
  qualityRisk     Decimal
  safetyRisk      Decimal
  factors         Json
  recommendations Json
  aiSummary       String?
  createdAt       DateTime @default(now())

  project         Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([assessedAt])
  @@map("risk_assessments")
}

// =============================================================================
// SECTION 14: APP-12 - SMART SCHEDULER
// =============================================================================

model ScheduleItem {
  id              String   @id @default(uuid())
  projectId       String
  type            ScheduleItemType
  title           String
  description     String?
  startDate       DateTime
  endDate         DateTime
  duration        Int      // in days
  percentComplete Int      @default(0)
  status          ScheduleItemStatus @default(NOT_STARTED)
  priority        Int      @default(5)
  isMilestone     Boolean  @default(false)
  isCriticalPath  Boolean  @default(false)
  dependencies    String[] @default([]) // Array of ScheduleItem IDs
  predecessors    Json?
  successors      Json?
  assignedTo      String[] @default([])
  resourceIds     String[] @default([])
  plannedStart    DateTime?
  plannedEnd      DateTime?
  actualStart     DateTime?
  actualEnd       DateTime?
  baselineStart   DateTime?
  baselineEnd     DateTime?
  variance        Int?     // days
  float           Int?     // days of float/slack
  constraints     Json?
  weatherSensitive Boolean @default(false)
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([startDate])
  @@index([status])
  @@map("schedule_items")
}

enum ScheduleItemType {
  TASK
  MILESTONE
  PHASE
  SUMMARY
  INSPECTION
  DELIVERY
  MEETING
  WEATHER_HOLD
}

enum ScheduleItemStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  DELAYED
  ON_HOLD
  CANCELLED
}

model WeatherLog {
  id              String   @id @default(uuid())
  projectId       String
  date            DateTime
  conditions      String
  tempHigh        Decimal?
  tempLow         Decimal?
  precipitation   Decimal?
  wind            Decimal?
  humidity        Decimal?
  isWorkable      Boolean
  impactedWork    String?
  notes           String?
  source          String?  // API source
  createdAt       DateTime @default(now())

  project         Project  @relation(fields: [projectId], references: [id])

  @@unique([projectId, date])
  @@index([projectId])
  @@index([date])
  @@map("weather_logs")
}

// =============================================================================
// SECTION 15: APP-13 - AUTOMATED QA INSPECTOR
// =============================================================================

model QualityIssue {
  id              String   @id @default(uuid())
  projectId       String
  type            QualityIssueType
  severity        IssueSeverity
  status          QualityIssueStatus @default(OPEN)
  title           String
  description     String
  location        String?
  detectedBy      DetectionMethod
  detectedAt      DateTime @default(now())
  photos          Json?
  aiAnalysis      Json?
  aiConfidence    Decimal?
  assignedTo      String?
  dueDate         DateTime?
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?
  verifiedAt      DateTime?
  verifiedBy      String?
  rootCause       String?
  correctiveAction String?
  preventiveAction String?
  costImpact      Decimal?
  scheduleImpact  Int?     // days
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([status])
  @@index([severity])
  @@index([type])
  @@map("quality_issues")
}

enum QualityIssueType {
  WORKMANSHIP
  MATERIAL_DEFECT
  SPECIFICATION_DEVIATION
  CODE_VIOLATION
  SAFETY_HAZARD
  INCOMPLETE_WORK
  DAMAGE
  ALIGNMENT
  FINISH_QUALITY
  STRUCTURAL
  MEP
  OTHER
}

enum IssueSeverity {
  MINOR
  MODERATE
  MAJOR
  CRITICAL
}

enum QualityIssueStatus {
  OPEN
  IN_PROGRESS
  PENDING_VERIFICATION
  RESOLVED
  CLOSED
  DEFERRED
  WONT_FIX
}

enum DetectionMethod {
  AI_PHOTO_ANALYSIS
  SITE_VISIT
  INSPECTION
  CONTRACTOR_REPORT
  CLIENT_REPORT
  PM_OBSERVATION
  AUTOMATED_CHECK
}

// =============================================================================
// SECTION 16: APP-14 - DECISION SUPPORT AI
// =============================================================================

model DecisionLog {
  id              String   @id @default(uuid())
  projectId       String
  type            DecisionType
  question        String
  context         Json
  recommendation  String
  confidence      Decimal
  reasoning       Json     // Array of reasoning steps
  alternatives    Json?    // Alternative recommendations
  risks           Json?    // Associated risks
  dataPoints      Json?    // Data that informed the decision
  accepted        Boolean?
  acceptedAt      DateTime?
  acceptedBy      String?
  outcome         String?
  outcomeAt       DateTime?
  feedback        String?
  feedbackRating  Int?     // 1-5
  modelVersion    String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([type])
  @@index([createdAt])
  @@map("decision_logs")
}

enum DecisionType {
  CONTRACTOR_SELECTION
  CHANGE_ORDER_APPROVAL
  SCHEDULE_CHANGE
  BUDGET_REALLOCATION
  RISK_MITIGATION
  RESOURCE_ALLOCATION
  SCOPE_DECISION
  PERMIT_STRATEGY
  INSPECTION_TIMING
  COMMUNICATION_PRIORITY
  GENERAL
}

model AIConversation {
  id              String   @id @default(uuid())
  projectId       String
  userId          String
  messages        Json     // Array of conversation messages
  context         Json?
  summary         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
  @@index([userId])
  @@map("ai_conversations")
}

// =============================================================================
// SECTION 17: COMMAND CENTER DASHBOARD (APP-15)
// =============================================================================

model DashboardWidget {
  id              String   @id @default(uuid())
  userId          String
  type            WidgetType
  title           String
  position        Json     // { x, y, width, height }
  config          Json?
  refreshInterval Int?     // seconds
  isVisible       Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@map("dashboard_widgets")
}

enum WidgetType {
  PROJECT_SUMMARY
  TASK_LIST
  CALENDAR
  BUDGET_OVERVIEW
  SCHEDULE_TIMELINE
  RISK_ALERTS
  PREDICTIONS
  RECENT_ACTIVITY
  METRICS_CHART
  PERMIT_STATUS
  INSPECTION_CALENDAR
  COMMUNICATION_FEED
  WEATHER_FORECAST
  AI_INSIGHTS
  CUSTOM
}

model Notification {
  id              String   @id @default(uuid())
  userId          String
  type            NotificationType
  title           String
  message         String
  link            String?
  projectId       String?
  priority        NotificationPriority @default(NORMAL)
  isRead          Boolean  @default(false)
  readAt          DateTime?
  isDismissed     Boolean  @default(false)
  dismissedAt     DateTime?
  expiresAt       DateTime?
  metadata        Json?
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
  TASK
  REMINDER
  ALERT
  SYSTEM
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model ActivityLog {
  id              String   @id @default(uuid())
  userId          String?
  projectId       String?
  action          String
  entityType      String
  entityId        String?
  changes         Json?
  metadata        Json?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())

  user            User?    @relation(fields: [userId], references: [id])
  project         Project? @relation(fields: [projectId], references: [id])

  @@index([userId])
  @@index([projectId])
  @@index([entityType])
  @@index([createdAt])
  @@map("activity_logs")
}

// =============================================================================
// SECTION 18: CONTRACTS & SUPPORTING ENTITIES
// =============================================================================

model Contract {
  id              String   @id @default(uuid())
  projectId       String
  contractorId    String?
  type            ContractType
  number          String?
  title           String
  description     String?
  originalValue   Decimal
  currentValue    Decimal
  status          ContractStatus @default(DRAFT)
  startDate       DateTime?
  endDate         DateTime?
  signedAt        DateTime?
  signedBy        Json?
  terms           Json?
  retainagePercent Decimal @default(0)
  insuranceRequired Json?
  bondRequired    Boolean  @default(false)
  documentUrl     String?
  docusignEnvelopeId String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  contractor      Contractor? @relation(fields: [contractorId], references: [id])
  changeOrders    ChangeOrder[]

  @@index([projectId])
  @@index([contractorId])
  @@index([status])
  @@map("contracts")
}

enum ContractType {
  PRIME
  SUBCONTRACT
  PURCHASE_ORDER
  SERVICE_AGREEMENT
  DESIGN
  CONSULTING
}

enum ContractStatus {
  DRAFT
  PENDING_SIGNATURE
  ACTIVE
  COMPLETED
  TERMINATED
  SUSPENDED
}

// =============================================================================
// SECTION 19: JOB QUEUE TRACKING
// =============================================================================

model JobQueue {
  id              String   @id @default(uuid())
  queueName       String
  jobId           String
  jobName         String?
  status          JobStatus @default(WAITING)
  priority        Int      @default(0)
  data            Json
  result          Json?
  error           String?
  attempts        Int      @default(0)
  maxAttempts     Int      @default(3)
  delay           Int?     // ms
  createdAt       DateTime @default(now())
  processedAt     DateTime?
  completedAt     DateTime?
  failedAt        DateTime?

  @@unique([queueName, jobId])
  @@index([queueName])
  @@index([status])
  @@index([createdAt])
  @@map("job_queue")
}

enum JobStatus {
  WAITING
  ACTIVE
  COMPLETED
  FAILED
  DELAYED
  PAUSED
}

model JobSchedule {
  id              String   @id @default(uuid())
  name            String
  queueName       String
  cronExpression  String
  jobData         Json
  timezone        String   @default("America/New_York")
  isActive        Boolean  @default(true)
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([isActive])
  @@index([nextRunAt])
  @@map("job_schedules")
}

// =============================================================================
// SECTION 20: SYSTEM CONFIGURATION
// =============================================================================

model SystemConfig {
  id              String   @id @default(uuid())
  key             String   @unique
  value           Json
  description     String?
  category        String?
  isPublic        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([category])
  @@map("system_config")
}

model IntegrationCredential {
  id              String   @id @default(uuid())
  organizationId  String?
  service         IntegrationService
  credentials     Json     // Encrypted
  status          IntegrationStatus @default(ACTIVE)
  lastUsedAt      DateTime?
  expiresAt       DateTime?
  refreshToken    String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, service])
  @@index([service])
  @@map("integration_credentials")
}

enum IntegrationService {
  GOOGLE_CALENDAR
  GOOGLE_DRIVE
  DOCUSIGN
  SENDGRID
  TWILIO
  STRIPE
  GOHIGHLEVEL
  OPENWEATHER
  ANTHROPIC
  GOOGLE_VISION
}

enum IntegrationStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  ERROR
}
```

---

# PART 2: CLAUDE CODE BUILD PROMPT

Copy the following prompt to Claude Code to build out the complete Command Center:

---

## CLAUDE CODE PROMPT: KEALEE COMMAND CENTER BUILD

```
You are building the Command Center for the Kealee Platform v10 monorepo. The Command Center is a collection of 15 mini-apps that provide construction project management automation.

## PROJECT CONTEXT

The Kealee Platform v10 is a construction management SaaS platform with the following structure:
- Monorepo using pnpm workspaces
- Frontend: Next.js 14+ with App Router
- Backend: Fastify API
- Database: PostgreSQL with Prisma ORM
- Queue: BullMQ with Redis
- Real-time: Redis Pub/Sub
- AI: Anthropic Claude API

## YOUR TASK

Build out the complete Command Center located at `packages/automation/` with all 15 mini-apps. The schema has been applied - your job is to create the application code that uses these models.

## DIRECTORY STRUCTURE TO CREATE

```
packages/automation/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main exports
│   └── shared/
│       ├── queue/
│       │   ├── index.ts
│       │   ├── setup.ts           # BullMQ queue setup
│       │   └── workers.ts         # Worker registration
│       ├── events/
│       │   ├── index.ts
│       │   ├── event-bus.ts       # Redis Pub/Sub
│       │   └── event-types.ts     # Event constants
│       ├── ai/
│       │   ├── index.ts
│       │   ├── claude.ts          # Claude API wrapper
│       │   └── prompts.ts         # AI prompt templates
│       ├── integrations/
│       │   ├── index.ts
│       │   ├── sendgrid.ts        # Email
│       │   ├── twilio.ts          # SMS/WhatsApp
│       │   ├── docusign.ts        # E-signatures
│       │   ├── google-calendar.ts # Calendar
│       │   ├── google-maps.ts     # Geocoding/routing
│       │   ├── weather.ts         # Weather API
│       │   └── gohighlevel.ts     # CRM
│       └── utils/
│           ├── index.ts
│           ├── dates.ts           # Date utilities
│           ├── currency.ts        # Currency formatting
│           └── retry.ts           # Retry logic
├── apps/
│   ├── bid-engine/                # APP-01
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── contractor-matcher.ts
│   │   │   ├── bid-request-builder.ts
│   │   │   ├── invitation-sender.ts
│   │   │   ├── bid-analyzer.ts
│   │   │   ├── credential-verifier.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── visit-scheduler/           # APP-02
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── smart-scheduler.ts
│   │   │   ├── availability-finder.ts
│   │   │   ├── weather-checker.ts
│   │   │   ├── route-optimizer.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── change-order/              # APP-03
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── impact-analyzer.ts
│   │   │   ├── pricing-calculator.ts
│   │   │   ├── approval-workflow.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── report-generator/          # APP-04
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── report-builder.ts
│   │   │   ├── narrative-generator.ts
│   │   │   ├── pdf-renderer.ts
│   │   │   ├── scheduler.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── permit-tracker/            # APP-05
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── status-checker.ts
│   │   │   ├── portal-scraper.ts
│   │   │   ├── document-preparer.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── inspection-coordinator/    # APP-06
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── scheduler.ts
│   │   │   ├── prep-checklist.ts
│   │   │   ├── result-processor.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── budget-tracker/            # APP-07
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── summary-calculator.ts
│   │   │   ├── variance-analyzer.ts
│   │   │   ├── forecast-engine.ts
│   │   │   ├── alert-manager.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── communication-hub/         # APP-08
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── router.ts
│   │   │   ├── template-engine.ts
│   │   │   ├── batch-sender.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── task-queue/                # APP-09
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── task-manager.ts
│   │   │   ├── assignment-engine.ts
│   │   │   ├── priority-calculator.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── document-generator/        # APP-10
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── generator.ts
│   │   │   ├── template-renderer.ts
│   │   │   ├── signature-handler.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── predictive-engine/         # APP-11
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── delay-predictor.ts
│   │   │   ├── cost-predictor.ts
│   │   │   ├── feature-extractor.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── smart-scheduler/           # APP-12
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── optimizer.ts
│   │   │   ├── critical-path.ts
│   │   │   ├── resource-leveler.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── qa-inspector/              # APP-13
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── photo-analyzer.ts
│   │   │   ├── issue-detector.ts
│   │   │   ├── checklist-validator.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   ├── decision-support/          # APP-14
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── recommendation-engine.ts
│   │   │   ├── context-gatherer.ts
│   │   │   ├── chat-handler.ts
│   │   │   └── worker.ts
│   │   └── package.json
│   └── command-center/            # APP-15 (Dashboard)
│       ├── src/
│       │   ├── index.ts
│       │   ├── dashboard.ts
│       │   ├── metrics.ts
│       │   ├── alerts.ts
│       │   └── api-routes.ts
│       └── package.json
└── workers/
    └── index.ts                   # Combined worker startup
```

## KEY IMPLEMENTATION REQUIREMENTS

### 1. Database Access
All apps must use the shared Prisma client:
```typescript
import { prisma } from '@kealee/database';
```

### 2. Queue Configuration
Each app has its own BullMQ queue with standardized options:
```typescript
const QUEUE_NAMES = {
  BID_ENGINE: 'bid-engine',
  VISIT_SCHEDULER: 'visit-scheduler',
  CHANGE_ORDER: 'change-order',
  REPORT_GENERATOR: 'report-generator',
  PERMIT_TRACKER: 'permit-tracker',
  INSPECTION: 'inspection-coordinator',
  BUDGET_TRACKER: 'budget-tracker',
  COMMUNICATION: 'communication-hub',
  TASK_QUEUE: 'task-queue',
  DOCUMENT_GENERATOR: 'document-generator',
  PREDICTIVE: 'predictive-engine',
  SMART_SCHEDULER: 'smart-scheduler',
  QA_INSPECTOR: 'qa-inspector',
  DECISION_SUPPORT: 'decision-support',
};
```

### 3. Event Bus
All apps must publish events for cross-app communication:
```typescript
await eventBus.publish('project.milestone.completed', {
  projectId,
  milestoneId,
  completedAt: new Date(),
}, 'source-app');
```

### 4. AI Integration
Use Claude for AI-powered features:
```typescript
import { generateText, generateJSON } from '../shared/ai/claude';
```

### 5. Error Handling
Implement proper error handling with retry logic:
```typescript
import { retry } from '../shared/utils/retry';
```

## CRITICAL PRISMA QUERIES TO IMPLEMENT

### APP-01: Bid Engine
```typescript
// Find matching contractors
const contractors = await prisma.contractor.findMany({
  where: {
    status: 'ACTIVE',
    trades: { hasSome: criteria.trades },
    rating: { gte: minRating },
  },
  include: {
    credentials: { where: { expiresAt: { gt: new Date() } } },
    projects: { take: 10, orderBy: { completedAt: 'desc' } },
    reviews: { take: 20, orderBy: { createdAt: 'desc' } },
  },
});

// Create bid request
const bidRequest = await prisma.bidRequest.create({
  data: {
    projectId,
    scope,
    requirements,
    deadline,
    status: 'OPEN',
  },
});
```

### APP-02: Visit Scheduler
```typescript
// Get project with subscription
const project = await prisma.project.findUniqueOrThrow({
  where: { id: projectId },
  include: { 
    client: true, 
    subscription: true,
    assignedPm: true,
  },
});

// Create site visit
const visit = await prisma.siteVisit.create({
  data: {
    projectId,
    pmId,
    scheduledAt,
    type: visitType,
    status: 'SCHEDULED',
  },
});
```

### APP-03: Change Order
```typescript
// Get change order with project
const changeOrder = await prisma.changeOrder.findUniqueOrThrow({
  where: { id: changeOrderId },
  include: {
    project: { include: { client: true, milestones: true } },
    contract: true,
    lineItems: true,
  },
});
```

### APP-04: Report Generator
```typescript
// Get project data for report
const project = await prisma.project.findUniqueOrThrow({
  where: { id: projectId },
  include: {
    client: true,
    assignedPm: true,
    milestones: { orderBy: { dueDate: 'asc' } },
    changeOrders: { where: { status: 'APPROVED' } },
    budgetItems: true,
    budgetTransactions: true,
  },
});

// Create report
const report = await prisma.report.create({
  data: {
    projectId,
    type: reportType,
    periodStart,
    periodEnd,
    content: reportContent,
    narrative,
    status: 'READY',
  },
});
```

### APP-05: Permit Tracker
```typescript
// Get permit with jurisdiction
const permit = await prisma.permit.findUniqueOrThrow({
  where: { id: permitId },
  include: { 
    jurisdiction: true,
    inspections: true,
    project: true,
  },
});
```

### APP-06: Inspection Coordinator
```typescript
// Create inspection
const inspection = await prisma.inspection.create({
  data: {
    permitId,
    type: inspectionType,
    status: 'SCHEDULED',
    scheduledAt,
  },
});
```

### APP-07: Budget Tracker
```typescript
// Get budget summary
const project = await prisma.project.findUniqueOrThrow({
  where: { id: projectId },
  include: {
    budgetItems: true,
    budgetTransactions: true,
    changeOrders: { where: { status: 'APPROVED' } },
  },
});
```

### APP-08: Communication Hub
```typescript
// Log communication
const log = await prisma.communicationLog.create({
  data: {
    projectId,
    clientId,
    type: 'NOTIFICATION',
    channel: 'EMAIL',
    recipientEmail,
    subject,
    body,
    status: 'SENT',
    sentAt: new Date(),
  },
});
```

### APP-09: Task Manager
```typescript
// Create task
const task = await prisma.automationTask.create({
  data: {
    type: taskType,
    status: 'PENDING',
    priority,
    projectId,
    assignedPmId,
    payload,
    dueAt,
    scheduledAt: new Date(),
  },
});
```

### APP-10: Document Generator
```typescript
// Create document
const document = await prisma.document.create({
  data: {
    projectId,
    type: documentType,
    category: 'CONTRACTS',
    name: documentName,
    content,
    format: 'PDF',
    status: 'DRAFT',
  },
});
```

### APP-11: Predictive Engine
```typescript
// Create prediction
const prediction = await prisma.prediction.create({
  data: {
    projectId,
    type: 'DELAY',
    probability,
    confidence,
    impact: 'HIGH',
    description,
    factors,
    recommendedAction,
  },
});
```

### APP-12: Smart Scheduler
```typescript
// Get schedule items
const scheduleItems = await prisma.scheduleItem.findMany({
  where: { projectId },
  orderBy: { startDate: 'asc' },
});

// Get weather logs
const weatherLogs = await prisma.weatherLog.findMany({
  where: {
    projectId,
    date: { gte: startDate, lte: endDate },
  },
});
```

### APP-13: QA Inspector
```typescript
// Create quality issue
const issue = await prisma.qualityIssue.create({
  data: {
    projectId,
    type: 'WORKMANSHIP',
    severity: 'MODERATE',
    status: 'OPEN',
    title,
    description,
    location,
    detectedBy: 'AI_PHOTO_ANALYSIS',
    photos,
    aiAnalysis,
    aiConfidence,
  },
});
```

### APP-14: Decision Support
```typescript
// Get project context
const project = await prisma.project.findUniqueOrThrow({
  where: { id: projectId },
  include: {
    client: true,
    milestones: true,
    predictions: { where: { acknowledged: false } },
    riskAssessments: { orderBy: { assessedAt: 'desc' }, take: 1 },
  },
});

// Log decision
const decision = await prisma.decisionLog.create({
  data: {
    projectId,
    type: decisionType,
    question,
    context,
    recommendation,
    confidence,
    reasoning,
    alternatives,
    risks,
    dataPoints,
  },
});
```

## BUILD ORDER

1. First, create the shared infrastructure (`src/shared/`)
2. Then build apps in this order:
   - APP-09: Task Queue (foundational)
   - APP-08: Communication Hub (used by all apps)
   - APP-01: Bid Engine (complex, core feature)
   - APP-02: Visit Scheduler
   - APP-05: Permit Tracker
   - APP-06: Inspection Coordinator
   - APP-03: Change Order
   - APP-07: Budget Tracker
   - APP-04: Report Generator
   - APP-10: Document Generator
   - APP-11: Predictive Engine
   - APP-12: Smart Scheduler
   - APP-13: QA Inspector
   - APP-14: Decision Support
   - APP-15: Command Center Dashboard

## WORKER STARTUP

Create a combined worker startup file that registers all workers:
```typescript
// packages/automation/workers/index.ts
import { bidEngineWorker } from '../apps/bid-engine/src/worker';
import { visitSchedulerWorker } from '../apps/visit-scheduler/src/worker';
// ... import all workers

const workers = [
  { name: 'Bid Engine', worker: bidEngineWorker },
  { name: 'Visit Scheduler', worker: visitSchedulerWorker },
  // ... all workers
];

// Setup event handlers
for (const { name, worker } of workers) {
  worker.on('completed', (job) => console.log(`✓ [${name}] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`✗ [${name}] Job ${job?.id} failed:`, err.message));
}

console.log(`🚀 Kealee Command Center Started - ${workers.length} workers running`);
```

## ENVIRONMENT VARIABLES REQUIRED

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# AI
ANTHROPIC_API_KEY=sk-...

# Integrations
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@kealee.com
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
DOCUSIGN_INTEGRATION_KEY=...
DOCUSIGN_USER_ID=...
DOCUSIGN_ACCOUNT_ID=...
DOCUSIGN_PRIVATE_KEY=...
GOOGLE_MAPS_API_KEY=...
GOHIGHLEVEL_API_KEY=...
OPENWEATHER_API_KEY=...

# App
APP_URL=https://app.kealee.com
```

Now proceed to build out the complete Command Center following this specification. Start with the shared infrastructure, then build each app in order.
```

---

# PART 3: QUICK REFERENCE

## Schema Summary

| Model | App | Purpose |
|-------|-----|---------|
| Organization, User, Client | Core | Platform users |
| Project, Milestone, Subscription | Core | Project management |
| Contractor, ContractorCredential, ContractorProject, ContractorReview | APP-01 | Contractor database |
| BidRequest, BidInvitation, BidSubmission | APP-01 | Bid workflow |
| SiteVisit, VisitChecklist | APP-02 | Site visits |
| ChangeOrder, ChangeOrderLineItem | APP-03 | Change orders |
| Report, ReportTemplate | APP-04 | Reports |
| Jurisdiction, Permit | APP-05 | Permits |
| Inspection | APP-06 | Inspections |
| BudgetItem, BudgetTransaction | APP-07 | Budget tracking |
| CommunicationLog, CommunicationTemplate | APP-08 | Communications |
| AutomationTask | APP-09 | Task queue |
| Document, DocumentTemplate | APP-10 | Documents |
| Prediction, RiskAssessment | APP-11 | Predictions |
| ScheduleItem, WeatherLog | APP-12 | Scheduling |
| QualityIssue | APP-13 | QA |
| DecisionLog, AIConversation | APP-14 | AI decisions |
| DashboardWidget, Notification, ActivityLog | APP-15 | Dashboard |
| Contract | Shared | Contracts |
| JobQueue, JobSchedule | Shared | Background jobs |
| SystemConfig, IntegrationCredential | Shared | Configuration |

## Total Models: 45
## Total Enums: 68
## Total Apps: 15

---

**Document Version:** 1.0
**Created:** January 29, 2026
**For:** Kealee Platform v10
