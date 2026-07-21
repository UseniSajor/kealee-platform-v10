# PERMITS & INSPECTIONS HUB - COMPLETE SPECIFICATION
## New Profit Center #7

**Version:** 2.0.0  
**Date:** January 13, 2026  
**Module:** m-permits-inspections  
**Stage:** 7.5 (Between Architect and Engineer)  
**Build Week:** 19-20

---

## 📋 OVERVIEW

### **What It Is**

A dedicated hub for managing the complete permit and inspection lifecycle from application through final approval, serving jurisdictions, contractors, architects, engineers, and property owners.

### **Who Uses It**

**Primary Users:**
- Building departments (jurisdiction staff)
- Contractors (applying for permits)
- Architects (submitting design permits)
- Engineers (submitting structural/MEP permits)
- Property owners (tracking status)
- Inspectors (scheduling and conducting inspections)

### **Revenue Model**

**Multiple Revenue Streams:**

1. **Jurisdiction Licensing Fees** ($500-2,000/month per jurisdiction)
   - Software-as-a-Service for building departments
   - Replaces legacy permit management systems
   - Includes citizen portal integration

2. **Expedited Processing Fees** (15-25% of permit cost)
   - Fast-track application review (48-72 hour guarantee)
   - Priority scheduling for inspections
   - Dedicated permit coordinator

3. **Document Preparation Services** ($150-500 per submittal)
   - Professional permit package assembly
   - Code compliance verification
   - Submittal coordination
   - Resubmission management

4. **Platform Fees** (3% of permit value for private transactions)
   - When permits processed outside jurisdiction
   - Private inspection coordination
   - Third-party plan review services

5. **Integration Fees** ($50-200/month per contractor)
   - API access for contractors/architects/engineers
   - Automated submittal from design software
   - Real-time status updates

**Year 1 Revenue Target:** $800K-1.2M
- 20 jurisdictions × $1,000/month avg = $240K
- 150 expedited permits × $1,500 avg = $225K
- 400 document prep services × $300 avg = $120K
- Platform fees: $200K
- Integration fees: 200 users × $100/month × 12 = $240K

---

## 🏗️ COMPLETE FOLDER STRUCTURE

```
apps/m-permits-inspections/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── logout/page.tsx
│   │
│   ├── (public)/                          # Citizen portal
│   │   ├── page.tsx                       # Public permit search
│   │   ├── search/page.tsx                # Search by address/permit #
│   │   └── permit/[id]/page.tsx           # Public permit details
│   │
│   ├── dashboard/
│   │   └── page.tsx                       # Role-based dashboard
│   │
│   ├── permits/                           # Permit management
│   │   ├── page.tsx                       # Permit list (role-filtered)
│   │   ├── new/
│   │   │   └── page.tsx                   # New permit application
│   │   └── [id]/
│   │       ├── page.tsx                   # Permit details
│   │       ├── application/
│   │       │   └── page.tsx               # Application form
│   │       ├── documents/
│   │       │   └── page.tsx               # Uploaded plans/docs
│   │       ├── review/
│   │       │   └── page.tsx               # Plan review interface (jurisdiction)
│   │       ├── corrections/
│   │       │   └── page.tsx               # Correction requests
│   │       ├── payment/
│   │       │   └── page.tsx               # Fee payment
│   │       ├── approval/
│   │       │   └── page.tsx               # Approval/issuance
│   │       ├── inspections/
│   │       │   └── page.tsx               # Associated inspections
│   │       └── history/
│   │           └── page.tsx               # Permit history/audit
│   │
│   ├── inspections/                       # Inspection management
│   │   ├── page.tsx                       # Inspection list
│   │   ├── schedule/
│   │   │   └── page.tsx                   # Schedule inspection
│   │   ├── calendar/
│   │   │   └── page.tsx                   # Inspector calendar view
│   │   └── [id]/
│   │       ├── page.tsx                   # Inspection details
│   │       ├── checklist/
│   │       │   └── page.tsx               # Inspection checklist
│   │       ├── photos/
│   │       │   └── page.tsx               # Inspection photos
│   │       ├── report/
│   │       │   └── page.tsx               # Inspection report
│   │       ├── corrections/
│   │       │   └── page.tsx               # Required corrections
│   │       └── reinspection/
│   │           └── page.tsx               # Schedule reinspection
│   │
│   ├── reviews/                           # Plan review workflows
│   │   ├── queue/
│   │   │   └── page.tsx                   # Review queue (jurisdiction)
│   │   ├── [id]/
│   │   │   ├── page.tsx                   # Review interface
│   │   │   ├── markup/
│   │   │   │   └── page.tsx               # PDF markup tools
│   │   │   ├── comments/
│   │   │   │   └── page.tsx               # Review comments
│   │   │   └── approve/
│   │   │       └── page.tsx               # Approve/reject
│   │   └── assignments/
│   │       └── page.tsx                   # Assign reviewers
│   │
│   ├── jurisdictions/                     # Multi-jurisdiction management
│   │   ├── page.tsx                       # Jurisdiction list
│   │   ├── [id]/
│   │   │   ├── page.tsx                   # Jurisdiction profile
│   │   │   ├── settings/
│   │   │   │   └── page.tsx               # Jurisdiction settings
│   │   │   ├── fee-schedule/
│   │   │   │   └── page.tsx               # Fee schedules
│   │   │   ├── checklists/
│   │   │   │   └── page.tsx               # Inspection checklists
│   │   │   └── staff/
│   │   │       └── page.tsx               # Jurisdiction staff
│   │   └── coverage/
│   │       └── page.tsx                   # Service area coverage map
│   │
│   ├── contractors/                       # Contractor management
│   │   ├── page.tsx                       # Contractor directory
│   │   ├── [id]/
│   │   │   ├── page.tsx                   # Contractor profile
│   │   │   ├── licenses/
│   │   │   │   └── page.tsx               # License verification
│   │   │   ├── permits/
│   │   │   │   └── page.tsx               # Permit history
│   │   │   └── performance/
│   │   │       └── page.tsx               # Performance metrics
│   │   └── verification/
│   │       └── page.tsx                   # License verification queue
│   │
│   ├── templates/                         # Document templates
│   │   ├── page.tsx                       # Template library
│   │   ├── [id]/
│   │   │   ├── page.tsx                   # Template editor
│   │   │   └── versions/
│   │   │       └── page.tsx               # Template versions
│   │   └── categories/
│   │       └── page.tsx                   # Template categories
│   │
│   ├── reports/                           # Reporting & analytics
│   │   ├── page.tsx                       # Report dashboard
│   │   ├── permits/
│   │   │   └── page.tsx                   # Permit reports
│   │   ├── inspections/
│   │   │   └── page.tsx                   # Inspection reports
│   │   ├── revenue/
│   │   │   └── page.tsx                   # Revenue reports
│   │   └── compliance/
│   │       └── page.tsx                   # Compliance reports
│   │
│   ├── integrations/                      # External integrations
│   │   ├── page.tsx                       # Integration dashboard
│   │   ├── gis/
│   │   │   └── page.tsx                   # GIS integration
│   │   ├── accela/
│   │   │   └── page.tsx                   # Accela sync
│   │   └── api/
│   │       └── page.tsx                   # API credentials
│   │
│   └── api/
│       ├── webhooks/
│       │   ├── docusign/route.ts          # DocuSign webhooks
│       │   └── stripe/route.ts            # Payment webhooks
│       └── public/
│           ├── permits/[id]/route.ts      # Public permit API
│           └── inspections/[id]/route.ts  # Public inspection API
│
├── components/
│   ├── permits/
│   │   ├── permit-card.tsx
│   │   ├── permit-status-badge.tsx
│   │   ├── permit-timeline.tsx
│   │   └── permit-form.tsx
│   ├── inspections/
│   │   ├── inspection-card.tsx
│   │   ├── inspection-calendar.tsx
│   │   ├── inspection-checklist.tsx
│   │   └── photo-uploader.tsx
│   ├── reviews/
│   │   ├── pdf-markup-tool.tsx
│   │   ├── comment-thread.tsx
│   │   └── review-status.tsx
│   └── shared/
│       ├── address-autocomplete.tsx
│       ├── parcel-lookup.tsx
│       └── fee-calculator.tsx
│
├── lib/
│   ├── api-client.ts
│   ├── permit-rules.ts                    # Jurisdiction-specific rules
│   ├── fee-calculator.ts                  # Fee calculation logic
│   └── utils.ts
│
└── package.json
```

---

## 📊 DATA MODELS

### **Core Models**

```prisma
// ============================================================================
// PERMITS & INSPECTIONS MODULE
// ============================================================================

model Jurisdiction {
  id              String   @id @default(uuid())
  name            String   // "Prince George's County, MD"
  code            String   @unique  // "PGC-MD"
  state           String
  county          String?
  city            String?
  serviceArea     Json     // GeoJSON polygon
  contactEmail    String
  contactPhone    String
  websiteUrl      String?
  status          JurisdictionStatus @default(ACTIVE)
  
  // Settings
  settings        Json     // Custom fields, requirements
  feeSchedule     Json     // Fee calculation rules
  
  // Licensing
  licenseKey      String?  // API key for jurisdiction
  subscriptionTier String? // BASIC, PRO, ENTERPRISE
  monthlyFee      Decimal?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relationships
  permits         Permit[]
  inspections     Inspection[]
  staff           JurisdictionStaff[]
  templates       PermitTemplate[]
  
  @@index([code])
  @@index([status])
}

enum JurisdictionStatus {
  ACTIVE
  INACTIVE
  PENDING_SETUP
}

model JurisdictionStaff {
  id              String   @id @default(uuid())
  jurisdictionId  String
  userId          String
  role            StaffRole
  active          Boolean  @default(true)
  
  jurisdiction    Jurisdiction @relation(fields: [jurisdictionId], references: [id])
  user            User @relation(fields: [userId], references: [id])
  
  @@unique([jurisdictionId, userId])
  @@index([userId])
}

enum StaffRole {
  PLAN_REVIEWER
  INSPECTOR
  PERMIT_COORDINATOR
  ADMINISTRATOR
}

model Permit {
  id              String   @id @default(uuid())
  permitNumber    String   @unique  // Auto-generated or custom
  
  // Jurisdiction
  jurisdictionId  String
  jurisdiction    Jurisdiction @relation(fields: [jurisdictionId], references: [id])
  
  // Property
  propertyId      String
  property        Property @relation(fields: [propertyId], references: [id])
  parcelNumber    String?
  
  // Permit details
  type            PermitType
  subtype         String?  // "Kitchen Remodel", "New Deck", etc.
  description     String
  valuation       Decimal  // Project valuation for fee calculation
  
  // Applicant
  applicantId     String   // Contractor, architect, or owner
  applicant       User @relation("PermitApplicant", fields: [applicantId], references: [id])
  applicantType   ApplicantType
  
  // Professional of record
  architectId     String?
  architect       User? @relation("PermitArchitect", fields: [architectId], references: [id])
  engineerId      String?
  engineer        User? @relation("PermitEngineer", fields: [engineerId], references: [id])
  
  // Status tracking
  status          PermitStatus @default(DRAFT)
  submittedAt     DateTime?
  reviewStartedAt DateTime?
  approvedAt      DateTime?
  issuedAt        DateTime?
  expiresAt       DateTime?
  completedAt     DateTime?
  
  // Fees
  feeAmount       Decimal?
  feePaid         Boolean  @default(false)
  feePaidAt       DateTime?
  
  // Expedited processing
  expedited       Boolean  @default(false)
  expeditedFee    Decimal?
  
  // Documents
  documents       PermitDocument[]
  
  // Review
  reviews         PermitReview[]
  corrections     PermitCorrection[]
  
  // Inspections
  inspections     Inspection[]
  
  // Audit
  events          PermitEvent[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([jurisdictionId])
  @@index([propertyId])
  @@index([applicantId])
  @@index([status])
  @@index([permitNumber])
}

enum PermitType {
  BUILDING
  ELECTRICAL
  PLUMBING
  MECHANICAL
  DEMOLITION
  SIGN
  GRADING
  FENCE
}

enum ApplicantType {
  OWNER
  CONTRACTOR
  ARCHITECT
  ENGINEER
}

enum PermitStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  CORRECTIONS_REQUIRED
  RESUBMITTED
  APPROVED
  ISSUED
  ACTIVE
  INSPECTION_HOLD
  EXPIRED
  COMPLETED
  CANCELLED
}

model PermitDocument {
  id              String   @id @default(uuid())
  permitId        String
  permit          Permit @relation(fields: [permitId], references: [id], onDelete: Cascade)
  
  type            DocumentType
  name            String
  description     String?
  fileUrl         String   // S3 URL
  fileSize        Int      // bytes
  mimeType        String
  
  uploadedBy      String
  uploadedAt      DateTime @default(now())
  
  // Review tracking
  reviewed        Boolean  @default(false)
  reviewedBy      String?
  reviewedAt      DateTime?
  
  @@index([permitId])
  @@index([type])
}

enum DocumentType {
  SITE_PLAN
  FLOOR_PLAN
  ELEVATION
  STRUCTURAL_CALCS
  ENERGY_CALCS
  SURVEY
  PROOF_OF_OWNERSHIP
  HOA_APPROVAL
  ENGINEERING_STAMP
  ARCHITECTURAL_STAMP
  OTHER
}

model PermitReview {
  id              String   @id @default(uuid())
  permitId        String
  permit          Permit @relation(fields: [permitId], references: [id], onDelete: Cascade)
  
  reviewerId      String   // Jurisdiction staff
  reviewer        User @relation(fields: [reviewerId], references: [id])
  
  discipline      ReviewDiscipline
  status          ReviewStatus @default(IN_PROGRESS)
  
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  
  // Comments
  comments        ReviewComment[]
  
  @@index([permitId])
  @@index([reviewerId])
  @@index([status])
}

enum ReviewDiscipline {
  ZONING
  BUILDING
  ELECTRICAL
  PLUMBING
  MECHANICAL
  STRUCTURAL
  FIRE
  ENVIRONMENTAL
}

enum ReviewStatus {
  ASSIGNED
  IN_PROGRESS
  COMPLETED_APPROVED
  COMPLETED_CORRECTIONS_REQUIRED
}

model ReviewComment {
  id              String   @id @default(uuid())
  reviewId        String
  review          PermitReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  
  pageNumber      Int?     // PDF page number
  coordinateX     Float?   // Markup position
  coordinateY     Float?
  
  comment         String
  severity        CommentSeverity
  
  createdBy       String
  createdAt       DateTime @default(now())
  
  // Response
  response        String?
  respondedBy     String?
  respondedAt     DateTime?
  resolved        Boolean  @default(false)
  
  @@index([reviewId])
}

enum CommentSeverity {
  MINOR
  MAJOR
  CRITICAL
}

model PermitCorrection {
  id              String   @id @default(uuid())
  permitId        String
  permit          Permit @relation(fields: [permitId], references: [id], onDelete: Cascade)
  
  description     String
  category        String   // "Zoning", "Structural", etc.
  priority        CorrectionPriority
  
  issuedAt        DateTime @default(now())
  dueDate         DateTime?
  
  // Resolution
  resolved        Boolean  @default(false)
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?
  
  @@index([permitId])
  @@index([resolved])
}

enum CorrectionPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Inspection {
  id              String   @id @default(uuid())
  inspectionNumber String  @unique
  
  // Permit
  permitId        String
  permit          Permit @relation(fields: [permitId], references: [id])
  
  // Jurisdiction
  jurisdictionId  String
  jurisdiction    Jurisdiction @relation(fields: [jurisdictionId], references: [id])
  
  // Type
  type            InspectionType
  description     String?
  
  // Scheduling
  requestedBy     String
  requestedAt     DateTime @default(now())
  
  scheduledDate   DateTime?
  scheduledTime   String?  // "9:00 AM - 12:00 PM"
  
  inspectorId     String?
  inspector       User? @relation(fields: [inspectorId], references: [id])
  
  // Status
  status          InspectionStatus @default(REQUESTED)
  
  // Results
  result          InspectionResult?
  completedAt     DateTime?
  
  // Report
  notes           String?
  photos          InspectionPhoto[]
  checklistItems  InspectionChecklistItem[]
  
  // Corrections
  corrections     InspectionCorrection[]
  
  // Reinspection
  parentInspectionId String?
  parentInspection   Inspection? @relation("Reinspections", fields: [parentInspectionId], references: [id])
  reinspections      Inspection[] @relation("Reinspections")
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([permitId])
  @@index([jurisdictionId])
  @@index([inspectorId])
  @@index([status])
  @@index([scheduledDate])
}

enum InspectionType {
  FOOTING
  FOUNDATION
  SLAB
  ROUGH_FRAMING
  ROUGH_ELECTRICAL
  ROUGH_PLUMBING
  ROUGH_MECHANICAL
  INSULATION
  DRYWALL
  FINAL_ELECTRICAL
  FINAL_PLUMBING
  FINAL_MECHANICAL
  FINAL_BUILDING
  FINAL_CERTIFICATE_OF_OCCUPANCY
}

enum InspectionStatus {
  REQUESTED
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum InspectionResult {
  PASS
  PASS_WITH_COMMENTS
  FAIL
  PARTIAL_PASS
}

model InspectionPhoto {
  id              String   @id @default(uuid())
  inspectionId    String
  inspection      Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  fileUrl         String
  caption         String?
  location        String?  // "Kitchen - North Wall"
  
  uploadedAt      DateTime @default(now())
  
  @@index([inspectionId])
}

model InspectionChecklistItem {
  id              String   @id @default(uuid())
  inspectionId    String
  inspection      Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  category        String   // "Structural", "Electrical", etc.
  item            String   // "Proper nailing pattern"
  
  status          ChecklistStatus
  notes           String?
  
  @@index([inspectionId])
}

enum ChecklistStatus {
  PASS
  FAIL
  NOT_APPLICABLE
  NOT_READY
}

model InspectionCorrection {
  id              String   @id @default(uuid())
  inspectionId    String
  inspection      Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  description     String
  location        String?
  category        String
  severity        CorrectionSeverity
  
  mustFixBefore   String?  // "Next inspection type required"
  
  resolved        Boolean  @default(false)
  resolvedAt      DateTime?
  
  @@index([inspectionId])
  @@index([resolved])
}

enum CorrectionSeverity {
  MINOR
  MAJOR
  CRITICAL
}

model PermitTemplate {
  id              String   @id @default(uuid())
  jurisdictionId  String?  // null = global template
  jurisdiction    Jurisdiction? @relation(fields: [jurisdictionId], references: [id])
  
  name            String
  type            PermitType
  description     String?
  
  // Template content
  requiredDocuments Json  // List of required doc types
  applicationForm   Json  // Form fields
  checklist         Json  // Inspection checklist
  
  // Versioning
  version         Int      @default(1)
  active          Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([jurisdictionId])
  @@index([type])
  @@index([active])
}

model PermitEvent {
  id              String   @id @default(uuid())
  permitId        String
  permit          Permit @relation(fields: [permitId], references: [id], onDelete: Cascade)
  
  type            String   // "SUBMITTED", "APPROVED", "INSPECTION_SCHEDULED"
  userId          String?  // Who triggered event
  description     String
  metadata        Json?
  
  occurredAt      DateTime @default(now())
  
  @@index([permitId])
  @@index([occurredAt])
}
```

---

## 🔄 WORKFLOWS

### **Permit Application Workflow**

```
1. DRAFT
   ├─ User starts application
   ├─ Selects permit type
   ├─ Enters property info
   └─ Saves draft

2. SUBMITTED
   ├─ User uploads required documents
   ├─ Pays application fee
   ├─ Submits for review
   └─ Permit number assigned

3. UNDER_REVIEW
   ├─ Assigned to reviewers by discipline
   ├─ Plan reviewers markup documents
   ├─ Comments added
   └─ Decision: Approve or Corrections Required

4a. CORRECTIONS_REQUIRED
   ├─ Applicant notified
   ├─ Corrections uploaded
   ├─ Resubmitted
   └─ Back to UNDER_REVIEW

4b. APPROVED
   ├─ All disciplines approved
   ├─ Permit fees calculated
   └─ Ready for issuance

5. ISSUED
   ├─ Fees paid
   ├─ Permit issued
   ├─ Expiration date set
   └─ Ready for inspections

6. ACTIVE
   ├─ Construction begins
   ├─ Inspections scheduled
   └─ Progress tracked

7. COMPLETED
   ├─ Final inspection passed
   ├─ Certificate of Occupancy issued (if applicable)
   └─ Permit closed
```

### **Inspection Workflow**

```
1. REQUESTED
   ├─ Contractor requests inspection
   ├─ Selects inspection type
   └─ Provides ready-for-inspection details

2. SCHEDULED
   ├─ Inspector assigned
   ├─ Date/time selected
   └─ Notification sent

3. IN_PROGRESS
   ├─ Inspector arrives on site
   ├─ Completes checklist
   ├─ Takes photos
   └─ Records findings

4a. PASS
   ├─ Inspection complete
   ├─ Next inspection type available
   └─ Progress tracked

4b. FAIL
   ├─ Corrections issued
   ├─ Reinspection required
   └─ Work cannot proceed

5. REINSPECTION
   ├─ Corrections completed
   ├─ Reinspection scheduled
   └─ Repeat process
```

---

## 💰 PRICING TIERS

### **For Jurisdictions (SaaS Licensing)**

**Basic Tier ($500/month)**
- Up to 100 permits/month
- Up to 3 staff users
- Basic reporting
- Email support

**Pro Tier ($1,000/month)**
- Up to 500 permits/month
- Up to 10 staff users
- Advanced reporting
- Custom fee schedules
- Phone support

**Enterprise Tier ($2,000/month)**
- Unlimited permits
- Unlimited staff users
- Custom integrations
- GIS integration
- White-label options
- Dedicated account manager

### **For Contractors/Professionals**

**Integration Tier ($50-200/month)**
- API access
- Automated submittals
- Real-time status updates
- Bulk operations
- Priority support

### **Expedited Services (Per Permit)**

**Standard Review:** Included in permit fees (10-15 business days)

**Expedited Review:** 15-25% of standard permit cost
- 48-72 hour review guarantee
- Priority assignment
- Dedicated coordinator

### **Document Preparation (Per Submittal)**

- **Basic Package:** $150 (document organization + checklist review)
- **Standard Package:** $300 (+ code compliance check)
- **Premium Package:** $500 (+ professional consultation + resubmission management)

---

## 📱 KEY FEATURES

### **1. Public Permit Search**
- Search by address, permit number, parcel
- View permit status without login
- Download approved documents
- Transparency for citizens

### **2. Digital Plan Review**
- PDF markup tools
- Comment threads
- Discipline-specific reviews
- Parallel review workflows

### **3. Inspection Scheduling**
- Calendar view for inspectors
- Automated routing
- SMS/email notifications
- Real-time status updates

### **4. Mobile Inspector App**
- Offline checklists
- Photo capture with GPS
- Voice-to-text notes
- Instant report generation

### **5. Fee Calculation Engine**
- Jurisdiction-specific rules
- Valuation-based fees
- Automated invoicing
- Online payment (Stripe)

### **6. Compliance Tracking**
- Expiration alerts
- Renewal workflows
- Violation tracking
- Code enforcement integration

### **7. GIS Integration**
- Parcel lookup
- Zoning verification
- Setback calculations
- Flood zone checks

### **8. Reporting & Analytics**
- Permit volume trends
- Revenue reporting
- Inspection metrics
- Review turnaround times

---

## 🎯 INTEGRATION POINTS

### **Kealee Platform Integrations**

**m-project-owner:**
- Link permits to projects
- Automatic permit tracking
- Gate: Cannot start construction until permits issued

**m-architect:**
- Submit design permits directly
- Attach stamped drawings
- Track design approval

**m-engineer:**
- Submit structural/MEP permits
- Attach PE-stamped calcs
- Coordinate with architectural permits

**m-ops-services (kealee-pm-staffing):**
- PM tracks permit status
- Handles permit submissions for clients
- Coordinates inspections

**m-finance-trust:**
- Cannot release funds if permit expired
- Hold releases pending inspection pass

---

## 🚀 BUILD TIMELINE

**Stage 7.5: Weeks 19-20**

**Week 19:**
- Day 1-2: Database models + API endpoints
- Day 3-4: Permit application workflow
- Day 5: Document upload & management

**Week 20:**
- Day 1-2: Inspection scheduling
- Day 3-4: Plan review interface
- Day 5: Testing & deployment

---

**END OF PERMITS & INSPECTIONS HUB SPECIFICATION**

This adds a powerful new profit center focused on one of the biggest pain points in construction: permitting delays and inspection coordination.

