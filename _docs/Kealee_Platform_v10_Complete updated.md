# KEALEE PLATFORM v10

## End-to-End Construction Management Platform

**Platform Description, Database Schema, Command Center & Code Implementation**

**Kealee** | Est. 2002 | DC-Baltimore Corridor

February 2026 | Version 10.0

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
   - 1.1 Core Value Proposition
   - 1.2 Technical Architecture (9-App Monorepo)
   - 1.3 Technology Stack
2. [Workflow & Services Offerings](#2-workflow--services-offerings)
   - 2.1 Marketplace Services (Discovery & Hiring)
   - 2.2 PM Management Software (For Contractors)
   - 2.3 Client Dashboards (For Non-Contractors)
   - 2.4 Specialized Service Portals
   - 2.5 Revenue Model (43 Stripe Products)
3. [Database Schema (Prisma)](#3-database-schema-prisma)
   - 3.1 Core Identity & Access
   - 3.2 Subscriptions & Billing
   - 3.3 Projects & Properties
   - 3.4 Marketplace Module
   - 3.5 Contracts & Escrow
   - 3.6 PM Operations (Tasks, Logs, RFIs)
   - 3.7 Permits & Inspections
   - 3.8 Design Projects
   - 3.9 Documents, Financials & Communications
   - 3.10 AI & Predictions
4. [Code Implementation Guide](#4-code-implementation-guide)
   - 4.1 Cursor Prompt: Generate Full Prisma Schema
   - 4.2 API Route: Marketplace Lead Distribution
   - 4.3 Cursor Prompt: Full API Routes
   - 4.4 Cursor Prompt: Client Dashboard
   - 4.5 Implementation Checklist
   - 4.6 Terminal Commands: Getting Started
5. [Command Center (15 Mini-Apps)](#5-command-center-15-mini-apps)
   - 5.1 Architecture Overview
   - 5.2 All 15 Apps: Descriptions & Functions
   - 5.3 Integration with os-admin & os-pm
   - 5.4 Event Bus & Queue Architecture
6. [Command Center Database Schema](#6-command-center-database-schema)
   - 6.1 Automation & Queue Models
   - 6.2 Bid Engine Models
   - 6.3 Visit & Inspection Models
   - 6.4 Budget & Financial Tracking Models
   - 6.5 Communication & Document Models
   - 6.6 AI/ML Models
7. [Command Center Code Implementation](#7-command-center-code-implementation)
   - 7.1 Shared Infrastructure (BullMQ + Event Bus)
   - 7.2 Cursor Prompt: Build All 15 Apps
   - 7.3 API Routes for Command Center
   - 7.4 Cursor Prompt: Command Center Dashboard UI
   - 7.5 Deployment (Railway + Vercel + GitHub)
   - 7.6 Full Implementation Checklist

---

## 1. Platform Overview

The Kealee Platform v10 is an end-to-end construction management platform that provides a comprehensive ecosystem connecting all stakeholders in the construction industry. The platform serves as both a contractor and professional design marketplace (for architects, engineers, and specialty trades) and a full-featured project management software suite.

The platform enables homeowners, real estate developers, business owners, property owners, and property managers to discover and hire vetted professionals for their construction projects, ongoing maintenance, and design needs. Simultaneously, it provides general contractors (GCs), builders, and subcontractors with a complete PM management software solution including scheduling, budgeting, document management, escrow payments, and client communication tools.

For non-contractor users (homeowners, property owners, developers), the platform offers intuitive dashboards and basic project management tools to track progress, approve milestones, manage budgets, and communicate with their project teams without the complexity of full contractor-grade software.

### 1.1 Core Value Proposition

**For Project Owners:** Find vetted contractors and design professionals, manage projects with intuitive dashboards, secure payments through escrow, and track every phase from permits to closeout.

**For Contractors & Builders:** Full PM software with scheduling, estimating (1,000+ assemblies), budgeting, document management, and a steady flow of pre-vetted, ready-to-build leads through the marketplace.

**For Architects & Engineers:** Dedicated portals for design project management, version control, client collaboration, stamp management, and marketplace visibility to attract new clients.

### 1.2 Technical Architecture

The platform is built as a 9-app monorepo using modern web technologies deployed across multiple domains for clean separation of concerns:

| App / Domain | Type | Purpose |
|---|---|---|
| kealee.com | Marketing | Main website, landing pages, SEO content, service discovery |
| app.kealee.com | Client Portal | m-project-owner: Homeowner/developer dashboards, project tracking, AI design |
| marketplace.kealee.com | Marketplace | m-marketplace: Contractor/professional discovery, bidding, leads, ecommerce hub |
| permits.kealee.com | Permits | m-permits: Permit applications, inspection scheduling, jurisdiction tracking |
| ops.kealee.com | Services | m-ops-services: GC/builder subscription portal, PM package management |
| architect.kealee.com | Design | m-architect: Architecture & engineering services, design version control |
| pm.kealee.com | PM Software | os-pm: Full contractor PM workspace, scheduling, estimating, field tools |
| admin.kealee.com | Admin | os-admin: Platform administration, analytics, user management, command center |
| api.kealee.com | API | Fastify API: REST endpoints, webhooks, BullMQ workers, command center backend |

### 1.3 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| **Backend API** | Fastify, Node.js, TypeScript, BullMQ job queues |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **Authentication** | Supabase Auth (JWT, RBAC, RLS) |
| **Payments** | Stripe Connect, Stripe Subscriptions, Escrow |
| **File Storage** | Supabase Storage / Cloudflare R2 |
| **AI/ML** | Anthropic Claude API (permit review, predictions, QA inspection, chat) |
| **Email/SMS** | Resend / SendGrid, Twilio |
| **Hosting** | Vercel (frontends), Railway (API + workers + command center) |
| **Monorepo** | Turborepo, pnpm workspaces |
| **Job Queues** | BullMQ + Redis (command center automation) |
| **E-Signatures** | DocuSign API |

---

## 2. Workflow & Services Offerings

The Kealee Platform operates on two parallel service paths that converge through the marketplace.

### 2.1 Marketplace Services (Discovery & Hiring)

The marketplace (m-marketplace) is the central commerce and discovery hub. It functions as a two-sided marketplace connecting those who need construction and design services with vetted professionals who deliver them.

**For Clients (Homeowners, Developers, Property Managers):**

- Browse and search vetted contractors, architects, and engineers by trade, specialty, location, rating, and availability
- Submit project requests with scope, budget, and timeline — receive matched bids from qualified professionals
- Review portfolios, verified credentials, insurance, licenses, and real project reviews
- Use built-in escrow for milestone-based secure payments with satisfaction guarantees
- Access basic project dashboards to track timelines, budgets, documents, and communications
- AI-powered design generation tools for visualizing renovations before hiring
- Maintenance request scheduling for property managers with recurring service contracts

**For Professionals (Contractors, Architects, Engineers):**

- Free pre-vetted leads distributed through fair rotation — winning bidders rotate to end of queue ensuring all vendors get opportunities
- Contractors can bid up to 3% above suggested retail price on construction jobs
- Professional profiles with portfolio galleries, certifications, insurance verification, and review management
- Tiered marketplace subscriptions: Basic ($49/mo), Professional ($149/mo), Premium ($299/mo)
- Kealee collects a platform fee on all signed, executed contracts through the marketplace
- Design professionals can offer consultations, sell plans, and manage design projects through dedicated portals
- Access to 1,000+ assembly library for accurate estimating and bidding

### 2.2 PM Management Software (For Contractors)

The os-pm workspace (pm.kealee.com) provides general contractors, builders, and subcontractors with a complete project management software suite:

- Project scheduling with Gantt charts, dependencies, critical path analysis, and milestone tracking
- Budget management with cost tracking, change orders, payment applications, and financial reporting
- Document management: contracts, RFIs, submittals, daily logs, punch lists, closeout packages
- Field tools: photo documentation, time tracking, safety checklists, inspection records
- Subcontractor management: bidding, contracts, scheduling, payment tracking
- Client communication portal with automated progress updates and approval workflows
- Estimating tools with 1,000+ assembly library for accurate takeoffs and proposals
- Receipt verification system with OCR-powered scanning and categorization

### 2.3 Client Dashboards (For Non-Contractors)

The m-project-owner portal (app.kealee.com) provides homeowners, developers, business owners, and property managers with accessible project oversight tools:

- Visual project timeline showing current phase, upcoming milestones, and completion percentage
- Budget overview with approved amounts, spent-to-date, change orders, and remaining balance
- Document access: view contracts, invoices, permits, photos, and inspection reports
- Milestone approval workflow: review completed work, approve payments from escrow
- Direct messaging with project team (PM, contractors, architects)
- AI-powered design tools for renovation visualization and planning
- Multi-project dashboard for developers and property managers with portfolio-level views

### 2.4 Specialized Service Portals

**Permits & Inspections (permits.kealee.com):** AI-powered permit pre-review, application generation, jurisdiction tracking, inspection scheduling, and correction management. Packages range from $495 (simple residential) to $7,500/month (enterprise).

**Architecture & Design (architect.kealee.com):** Design project management with version control, client collaboration, commenting, stamp management, and integration with the marketplace for lead generation. Packages from $2,500 to $35,000.

**PM Operations Services (ops.kealee.com):** Remote-only PM coordination services for contractors who need project management support without hiring full-time staff. PM packages from $1,750 to $16,500/month with dedicated project managers.

### 2.5 Revenue Model

| Revenue Stream | Range | Model |
|---|---|---|
| **PM Packages (A–D)** | $1,750 – $16,500/mo | Monthly subscription |
| **Architecture Packages** | $2,500 – $35,000 | Per-project |
| **Project Owner Packages** | $49 – $999/mo | Monthly subscription |
| **Permit Packages** | $495 – $7,500 | Per-permit / monthly |
| **Marketplace Subscriptions** | $49 – $299/mo | Monthly subscription |
| **Ops & Estimation Services** | $125 – $5,995 | Per-service |
| **Transaction/Platform Fees** | 2.9% – 5% | Per-contract execution |

Total: 43 Stripe products across all service tiers.

---

## 3. Database Schema (Prisma)

The following Prisma schema covers all 15 modules and supports the full marketplace, PM software, client dashboards, and specialized service portals. Command Center schema additions are in Section 6.

### 3.1 Core Identity & Access

```prisma
enum UserRole {
  HOMEOWNER DEVELOPER PROPERTY_MANAGER BUSINESS_OWNER
  CONTRACTOR SUBCONTRACTOR ARCHITECT ENGINEER PM INSPECTOR ADMIN
}

enum OrgType {
  GC_FIRM ARCHITECTURE_FIRM ENGINEERING_FIRM
  PROPERTY_MGMT DEVELOPMENT_CO INSPECTION_FIRM
}

enum SubscriptionStatus { ACTIVE TRIAL PAST_DUE CANCELED PAUSED }

model User {
  id                  String   @id @default(uuid())
  supabaseId          String   @unique
  email               String   @unique
  firstName           String
  lastName            String
  phone               String?
  role                UserRole
  avatarUrl           String?
  isVerified          Boolean  @default(false)
  stripeCustomerId    String?  @unique
  onboardingComplete  Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  orgMemberships      OrgMember[]
  projects            ProjectMembership[]
  marketplaceProfile  MarketplaceProfile?
  notifications       Notification[]
  @@index([role])
  @@index([email])
}

model Organization {
  id               String   @id @default(uuid())
  name             String
  type             OrgType
  taxId            String?
  license          String?
  insurance        Json?
  website          String?
  stripeAccountId  String?  @unique
  verified         Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  members          OrgMember[]
  subscription     Subscription?
  @@index([type])
}

model OrgMember {
  id     String @id @default(uuid())
  orgId  String
  userId String
  role   String
  org    Organization @relation(fields: [orgId], references: [id])
  user   User         @relation(fields: [userId], references: [id])
  @@unique([orgId, userId])
  @@index([orgId])
  @@index([userId])
}
```

### 3.2 Subscriptions & Billing

```prisma
model Subscription {
  id                    String             @id @default(uuid())
  orgId                 String             @unique
  stripeSubscriptionId  String             @unique
  stripePriceId         String
  tier                  String
  product               String
  status                SubscriptionStatus
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAt              DateTime?
  metadata              Json?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  org                   Organization       @relation(fields: [orgId], references: [id])
  @@index([status])
  @@index([product])
}
```

### 3.3 Projects & Properties

```prisma
enum ProjectStatus {
  DRAFT PLANNING PERMITTING ACTIVE IN_PROGRESS
  ON_HOLD COMPLETED CLOSED DISPUTED
}

enum ProjectType {
  NEW_CONSTRUCTION RENOVATION ADDITION MAINTENANCE
  TENANT_IMPROVEMENT COMMERCIAL_BUILDOUT DESIGN_ONLY
}

model Project {
  id              String        @id @default(uuid())
  name            String
  description     String?       @db.Text
  type            ProjectType
  status          ProjectStatus @default(DRAFT)
  propertyId      String
  budget          Decimal?      @db.Decimal(12, 2)
  actualCost      Decimal?      @db.Decimal(12, 2)
  startDate       DateTime?
  estimatedEnd    DateTime?
  actualEnd       DateTime?
  completionPct   Int           @default(0)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  property        Property             @relation(fields: [propertyId], references: [id])
  members         ProjectMembership[]
  milestones      Milestone[]
  tasks           Task[]
  contracts       ContractAgreement[]
  escrows         EscrowAgreement[]
  documents       Document[]
  permits         Permit[]
  inspections     Inspection[]
  changeOrders    ChangeOrder[]
  dailyLogs       DailyLog[]
  rfis            RFI[]
  communications  CommunicationLog[]
  predictions     Prediction[]
  financials      FinancialTransaction[]
  automationTasks AutomationTask[]
  bidEvaluations  BidEvaluation[]
  siteVisits      SiteVisit[]
  weeklyReports   WeeklyReport[]
  @@index([status])
  @@index([propertyId])
}

model Property {
  id        String   @id @default(uuid())
  address   String
  city      String
  state     String
  zip       String
  lat       Decimal? @db.Decimal(10, 7)
  lng       Decimal? @db.Decimal(10, 7)
  type      String
  sqft      Int?
  ownerId   String
  createdAt DateTime @default(now())
  projects  Project[]
  @@index([ownerId])
  @@index([city, state])
}

model ProjectMembership {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  role      String
  joinedAt  DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}
```

### 3.4 Marketplace Module

```prisma
enum LeadStatus { NEW MATCHED CONTACTED QUOTED ACCEPTED DECLINED EXPIRED }

model MarketplaceProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  displayName     String
  headline        String?
  bio             String?  @db.Text
  trades          String[]
  serviceArea     Json?
  hourlyRate      Decimal? @db.Decimal(8, 2)
  rating          Decimal  @default(0) @db.Decimal(3, 2)
  reviewCount     Int      @default(0)
  completedJobs   Int      @default(0)
  verified        Boolean  @default(false)
  featured        Boolean  @default(false)
  backgroundCheck Boolean  @default(false)
  bidRotationPos  Int      @default(0)
  lastWonBidAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User             @relation(fields: [userId], references: [id])
  portfolioItems  PortfolioItem[]
  leads           Lead[]
  quotes          Quote[]
  reviews         Review[]
  @@index([trades])
  @@index([rating])
  @@index([bidRotationPos])
}

model Lead {
  id             String      @id @default(uuid())
  title          String
  description    String      @db.Text
  projectType    ProjectType
  budgetMin      Decimal?    @db.Decimal(12, 2)
  budgetMax      Decimal?    @db.Decimal(12, 2)
  suggestedPrice Decimal?    @db.Decimal(12, 2)
  location       Json
  tradesNeeded   String[]
  status         LeadStatus  @default(NEW)
  clientId       String
  assignedToId   String?
  maxBidPercent  Decimal     @default(3) @db.Decimal(4, 2)
  expiresAt      DateTime
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  assignedTo     MarketplaceProfile? @relation(fields: [assignedToId], references: [id])
  quotes         Quote[]
  @@index([status])
  @@index([clientId])
  @@index([tradesNeeded])
}

model Quote {
  id            String   @id @default(uuid())
  leadId        String
  profileId     String
  amount        Decimal  @db.Decimal(12, 2)
  bidPercentage Decimal? @db.Decimal(4, 2)
  scope         String   @db.Text
  timeline      String?
  status        String   @default("pending")
  createdAt     DateTime @default(now())
  lead          Lead               @relation(fields: [leadId], references: [id])
  profile       MarketplaceProfile @relation(fields: [profileId], references: [id])
  @@index([leadId])
  @@index([profileId])
}

model Review {
  id         String   @id @default(uuid())
  profileId  String
  reviewerId String
  projectId  String?
  rating     Int
  title      String?
  body       String   @db.Text
  verified   Boolean  @default(false)
  createdAt  DateTime @default(now())
  profile    MarketplaceProfile @relation(fields: [profileId], references: [id])
  @@index([profileId])
  @@index([rating])
}

model PortfolioItem {
  id          String   @id @default(uuid())
  profileId   String
  title       String
  description String?
  imageUrls   String[]
  projectType String?
  budget      Decimal? @db.Decimal(12, 2)
  createdAt   DateTime @default(now())
  profile     MarketplaceProfile @relation(fields: [profileId], references: [id])
  @@index([profileId])
}
```

### 3.5 Contracts & Escrow

```prisma
enum EscrowStatus { PENDING FUNDED PARTIAL_RELEASE RELEASED DISPUTED REFUNDED }

model ContractAgreement {
  id          String   @id @default(uuid())
  projectId   String
  title       String
  type        String
  totalAmount Decimal  @db.Decimal(12, 2)
  status      String   @default("draft")
  platformFee Decimal? @db.Decimal(4, 2)
  docUrl      String?
  signedAt    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  project     Project        @relation(fields: [projectId], references: [id])
  parties     ContractParty[]
  escrow      EscrowAgreement?
  @@index([projectId])
  @@index([status])
}

model ContractParty {
  id         String   @id @default(uuid())
  contractId String
  userId     String
  role       String
  signed     Boolean  @default(false)
  signedAt   DateTime?
  contract   ContractAgreement @relation(fields: [contractId], references: [id])
  @@index([contractId])
}

model EscrowAgreement {
  id                    String       @id @default(uuid())
  contractId            String       @unique
  projectId             String
  totalAmount           Decimal      @db.Decimal(12, 2)
  fundedAmount          Decimal      @default(0) @db.Decimal(12, 2)
  releasedAmount        Decimal      @default(0) @db.Decimal(12, 2)
  status                EscrowStatus @default(PENDING)
  stripePaymentIntentId String?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
  contract              ContractAgreement @relation(fields: [contractId], references: [id])
  project               Project           @relation(fields: [projectId], references: [id])
  transactions          EscrowTransaction[]
  milestones            Milestone[]
  @@index([projectId])
  @@index([status])
}

model EscrowTransaction {
  id               String   @id @default(uuid())
  escrowId         String
  type             String
  amount           Decimal  @db.Decimal(12, 2)
  stripeTransferId String?
  milestoneId      String?
  note             String?
  createdAt        DateTime @default(now())
  escrow           EscrowAgreement @relation(fields: [escrowId], references: [id])
  @@index([escrowId])
}

model Milestone {
  id          String   @id @default(uuid())
  projectId   String
  escrowId    String?
  name        String
  description String?  @db.Text
  amount      Decimal? @db.Decimal(12, 2)
  dueDate     DateTime?
  completedAt DateTime?
  approvedAt  DateTime?
  approvedBy  String?
  status      String   @default("pending")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  project     Project          @relation(fields: [projectId], references: [id])
  escrow      EscrowAgreement? @relation(fields: [escrowId], references: [id])
  @@index([projectId])
  @@index([escrowId])
}
```

### 3.6 PM Operations (Tasks, Logs, RFIs)

```prisma
model Task {
  id          String   @id @default(uuid())
  projectId   String
  assigneeId  String?
  title       String
  description String?  @db.Text
  status      String   @default("todo")
  priority    String   @default("medium")
  dueDate     DateTime?
  completedAt DateTime?
  parentId    String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  project     Project  @relation(fields: [projectId], references: [id])
  parent      Task?    @relation("TaskSubtasks", fields: [parentId], references: [id])
  subtasks    Task[]   @relation("TaskSubtasks")
  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
}

model DailyLog {
  id         String   @id @default(uuid())
  projectId  String
  authorId   String
  date       DateTime
  weather    String?
  workforce  Json?
  activities String   @db.Text
  issues     String?  @db.Text
  photos     String[]
  createdAt  DateTime @default(now())
  project    Project  @relation(fields: [projectId], references: [id])
  @@index([projectId, date])
}

model RFI {
  id          String   @id @default(uuid())
  projectId   String
  number      Int
  subject     String
  question    String   @db.Text
  answer      String?  @db.Text
  status      String   @default("open")
  priority    String   @default("normal")
  requestedBy String
  assignedTo  String?
  dueDate     DateTime?
  answeredAt  DateTime?
  createdAt   DateTime @default(now())
  project     Project  @relation(fields: [projectId], references: [id])
  @@unique([projectId, number])
  @@index([projectId])
  @@index([status])
}

model ChangeOrder {
  id          String   @id @default(uuid())
  projectId   String
  number      Int
  title       String
  description String   @db.Text
  amount      Decimal  @db.Decimal(12, 2)
  status      String   @default("pending")
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
  project     Project  @relation(fields: [projectId], references: [id])
  @@unique([projectId, number])
  @@index([projectId])
}
```

### 3.7 Permits & Inspections

```prisma
model Permit {
  id             String   @id @default(uuid())
  projectId      String
  jurisdictionId String?
  type           String
  applicationNo  String?
  status         String   @default("draft")
  submittedAt    DateTime?
  approvedAt     DateTime?
  expiresAt      DateTime?
  fee            Decimal? @db.Decimal(10, 2)
  aiReviewScore  Decimal? @db.Decimal(5, 2)
  aiReviewNotes  String?  @db.Text
  documents      String[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  project        Project      @relation(fields: [projectId], references: [id])
  inspections    Inspection[]
  @@index([projectId])
  @@index([status])
  @@index([type])
}

model Inspection {
  id            String   @id @default(uuid())
  projectId     String
  permitId      String?
  type          String
  scheduledDate DateTime
  completedDate DateTime?
  inspectorId   String?
  result        String?
  notes         String?  @db.Text
  corrections   Json?
  photos        String[]
  createdAt     DateTime @default(now())
  project       Project  @relation(fields: [projectId], references: [id])
  permit        Permit?  @relation(fields: [permitId], references: [id])
  @@index([projectId])
  @@index([permitId])
  @@index([scheduledDate])
}
```

### 3.8 Design Projects

```prisma
model DesignProject {
  id          String   @id @default(uuid())
  projectId   String?
  clientId    String
  architectId String
  title       String
  description String?  @db.Text
  type        String
  status      String   @default("concept")
  budget      Decimal? @db.Decimal(12, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  versions    DesignVersion[]
  comments    DesignComment[]
  @@index([clientId])
  @@index([architectId])
  @@index([status])
}

model DesignVersion {
  id              String   @id @default(uuid())
  designProjectId String
  versionNumber   Int
  title           String
  fileUrls        String[]
  thumbnailUrl    String?
  notes           String?  @db.Text
  approved        Boolean  @default(false)
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  designProject   DesignProject @relation(fields: [designProjectId], references: [id])
  @@unique([designProjectId, versionNumber])
  @@index([designProjectId])
}

model DesignComment {
  id              String   @id @default(uuid())
  designProjectId String
  authorId        String
  content         String   @db.Text
  parentId        String?
  pinX            Decimal? @db.Decimal(5, 2)
  pinY            Decimal? @db.Decimal(5, 2)
  resolved        Boolean  @default(false)
  createdAt       DateTime @default(now())
  designProject   DesignProject @relation(fields: [designProjectId], references: [id])
  @@index([designProjectId])
}
```

### 3.9 Documents, Financials & Communications

```prisma
model Document {
  id         String   @id @default(uuid())
  projectId  String
  type       String
  name       String
  fileUrl    String
  mimeType   String?
  size       Int?
  uploadedBy String
  ocrData    Json?
  createdAt  DateTime @default(now())
  project    Project  @relation(fields: [projectId], references: [id])
  @@index([projectId])
  @@index([type])
}

model FinancialTransaction {
  id          String   @id @default(uuid())
  projectId   String
  type        String
  category    String
  amount      Decimal  @db.Decimal(12, 2)
  description String?
  date        DateTime
  receiptId   String?
  createdAt   DateTime @default(now())
  project     Project  @relation(fields: [projectId], references: [id])
  @@index([projectId])
  @@index([category])
  @@index([date])
}

model CommunicationLog {
  id          String   @id @default(uuid())
  projectId   String
  type        String
  senderId    String
  recipientId String?
  subject     String?
  body        String   @db.Text
  status      String   @default("sent")
  readAt      DateTime?
  createdAt   DateTime @default(now())
  project     Project  @relation(fields: [projectId], references: [id])
  @@index([projectId])
  @@index([senderId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String
  title     String
  body      String
  link      String?
  read      Boolean  @default(false)
  readAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId, read])
}
```

### 3.10 AI & Predictions

```prisma
model Prediction {
  id             String   @id @default(uuid())
  projectId      String
  type           String
  probability    Decimal  @db.Decimal(5, 4)
  impact         String
  description    String   @db.Text
  recommendation String?  @db.Text
  acknowledged   Boolean  @default(false)
  resolvedAt     DateTime?
  createdAt      DateTime @default(now())
  project        Project  @relation(fields: [projectId], references: [id])
  @@index([projectId])
  @@index([type])
}
```

---

## 4. Code Implementation Guide

Key implementation patterns for the core platform. Command Center implementation is in Section 7.

### 4.1 Cursor Prompt: Generate Full Prisma Schema

> **CURSOR PROMPT:**
> ```
> Create the complete Prisma schema for Kealee Platform v10.
> LOCATION: packages/database/prisma/schema.prisma
> DATASOURCE: PostgreSQL via Supabase (use env DATABASE_URL)
> Include ALL models from Sections 3 and 6 of the spec.
> 30+ core models + 10 command center models = 40+ total.
> Requirements: UUID IDs, @@index on FKs, enums for statuses,
> createdAt/updatedAt, proper onDelete rules.
> ```

### 4.2 API Route: Marketplace Lead Distribution

The fair-rotation lead distribution system — key endpoints:

```typescript
// apps/api/src/routes/marketplace/leads.ts

// POST /marketplace/leads
// - Create lead, calculate suggested retail price from assembly library
// - Match eligible contractors (verified, matching trades)
// - Order by bidRotationPos (fair rotation)
// - Send notifications to top 10 matched contractors

// POST /marketplace/leads/:id/quote
// - Submit bid (enforce max 3% above suggested retail price)
// - Calculate bid percentage for scoring

// POST /marketplace/leads/:id/accept
// - Accept winning bid
// - Rotate winner to end of bid queue (bidRotationPos = max + 1)
// - Auto-generate ContractAgreement + EscrowAgreement
// - Apply platform fee (3.5%)
// - Send notifications to all parties
```

### 4.3 Cursor Prompt: Full API Routes

> **CURSOR PROMPT:**
> ```
> Generate all Fastify API routes for Kealee Platform v10.
> LOCATION: apps/api/src/routes/
>
> Create route files for each module:
>   routes/auth/          - login, register, verify, refresh
>   routes/users/         - profile CRUD, avatar upload
>   routes/projects/      - full CRUD + members + dashboard stats
>   routes/marketplace/   - profiles, leads, quotes, reviews, rotation
>   routes/contracts/     - agreements, parties, signing
>   routes/escrow/        - fund, release, dispute, transactions
>   routes/tasks/         - CRUD + assign + subtasks
>   routes/permits/       - apply, track, AI review
>   routes/inspections/   - schedule, record results
>   routes/design/        - projects, versions, comments
>   routes/documents/     - upload, OCR, categorize
>   routes/financials/    - transactions, reports, receipts
>   routes/notifications/ - list, mark read
>   routes/subscriptions/ - Stripe checkout, manage, webhook
>
> PATTERNS: Use Prisma client, Zod validation, JWT auth middleware.
> Include pagination (cursor-based), filtering, and sorting.
> ```

### 4.4 Cursor Prompt: Client Dashboard

> **CURSOR PROMPT:**
> ```
> Create the Project Owner Dashboard for app.kealee.com.
> LOCATION: apps/m-project-owner/app/dashboard/page.tsx
>
> For homeowners/developers/property managers (NOT contractors).
>
> SECTIONS:
> 1. Active Projects summary cards (status, %, budget)
> 2. Timeline view - current phase + upcoming milestones
> 3. Budget overview - approved vs spent vs remaining
> 4. Recent Activity feed
> 5. Pending Actions - approvals, payments, document reviews
> 6. Quick Actions - message team, view docs, approve milestone
>
> TECH: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Recharts.
> ```

### 4.5 Implementation Checklist (Core Platform)

| # | Task | Files |
|---|---|---|
| 1 | Generate Prisma schema (all models) | `schema.prisma` |
| 2 | Run prisma generate + migrate | Terminal |
| 3 | Create auth middleware (JWT + Supabase) | `middleware/auth.ts` |
| 4 | Build marketplace routes | `routes/marketplace/` |
| 5 | Build project routes | `routes/projects/` |
| 6 | Build escrow routes | `routes/escrow/` |
| 7 | Build permit routes | `routes/permits/` |
| 8 | Build design routes | `routes/design/` |
| 9 | Stripe webhook handler | `routes/webhooks/stripe.ts` |
| 10 | Build m-project-owner dashboard | `m-project-owner/app/` |
| 11 | Build m-marketplace search + profiles | `m-marketplace/app/` |
| 12 | Build os-pm workspace | `os-pm/app/` |

### 4.6 Terminal Commands: Getting Started

```bash
cd kealee-platform-v10 && pnpm install
cd packages/database && npx prisma generate
npx prisma migrate dev --name init_v10
npx prisma db seed
cd ../.. && pnpm dev
```

---

## 5. Command Center (15 Mini-Apps)

The Command Center is a PM automation layer consisting of 15 independent mini-apps that power the operational backbone of the Kealee Platform. Each app runs as an independent BullMQ worker process, communicates via a shared Redis event bus, and can be deployed, scaled, and updated independently.

### 5.1 Architecture Overview

The Command Center sits between the client-facing modules (m-\*) and the operational modules (os-\*), automating the tasks that project managers execute manually in traditional construction management.

**Key Principles:**

- **Independence:** Each app has its own queue, worker, and deployment lifecycle
- **Loose Coupling:** Apps communicate via Redis pub/sub events, never direct imports
- **Shared Infrastructure:** Common database (Prisma), auth (Supabase JWT), and event bus (Redis)
- **Unified Experience:** All apps surface through os-admin (monitoring) and os-pm (execution)

### 5.2 All 15 Apps: Descriptions & Functions

| ID | App Name | Automation | Description |
|---|---|---|---|
| **APP-01** | **Bid Engine** | 85% | Scores bids on price (30%), timeline (25%), quality history (25%), proximity (10%), availability (10%). Fair rotation queue. AI recommendations. |
| **APP-02** | **Visit Scheduler** | 90% | Automates site visit scheduling. PM weekly visits, milestone inspections, client walkthroughs. Google Calendar integration. Route optimization. |
| **APP-03** | **Change Order Processor** | 75% | Detects scope changes, auto-generates CO documents with cost/timeline impact. Routes for approval. Updates budget and schedule. |
| **APP-04** | **Report Generator** | 95% | Auto-generates weekly progress reports, monthly financials, milestone reports, closeout packages. PDF export. Client and internal versions. |
| **APP-05** | **Permit Tracker** | 70% | Monitors permit status across jurisdictions. Expiration alerts. Review cycle tracking. AI pre-review scoring before submission. |
| **APP-06** | **Inspection Coordinator** | 75% | Schedules inspections based on milestone completion. Coordinates inspectors, contractors, code officials. Pass/fail with correction workflows. |
| **APP-07** | **Budget Tracker** | 85% | Real-time budget monitoring with variance analysis. Auto-categorizes expenses via OCR receipts. Overrun alerts. AI cost forecasting. |
| **APP-08** | **Communication Hub** | 80% | Centralized messaging: email, SMS (Twilio), in-app, WhatsApp. Auto-sends milestone updates. Template-based notifications. Delivery tracking. |
| **APP-09** | **Task Queue Manager** | 90% | Auto-assigns PM tasks by project phase, priority, and workload. Dependency management. Overdue escalation. Drives SOP workflow engine. |
| **APP-10** | **Document Generator** | 95% | Generates contracts, proposals, SOWs, letters, invoices, punch lists from templates. DocuSign e-signatures. Version control. |
| **APP-11** | **Predictive Engine** | AI | ML-driven risk prediction. Analyzes project data to predict delays, cost overruns, quality issues. Actionable recommendations. |
| **APP-12** | **Smart Scheduler** | AI | AI schedule optimization. Critical path analysis, resource leveling, weather-aware scheduling, automatic rescheduling on disruptions. |
| **APP-13** | **QA Inspector** | AI | AI photo analysis via Claude Vision. Detects construction defects, missing items, safety violations, quality issues. Auto-generates punch lists. |
| **APP-14** | **Decision Support** | AI | One-click approval dashboard with AI recommendations. Bid awards, change orders, payment releases, schedule changes with full context. |
| **APP-15** | **Dashboard** | — | Unified monitoring dashboard. Real-time health of all 14 apps, job metrics, success rates, alert feed, performance analytics. Surfaces in os-admin. |

### 5.3 Integration with os-admin & os-pm

**os-admin (admin.kealee.com) — Monitoring & Control:**

- APP-15 Dashboard renders at `/command-center` within os-admin
- Real-time health, job counts, success rates, error logs for all 14 apps
- Pause/resume individual app queues, retry failed jobs, adjust priorities
- System-wide alerts surface in the os-admin notification center
- Performance metrics (avg processing time, throughput, queue depth) per app

**os-pm (pm.kealee.com) — Execution & Workflow:**

- PMs interact with Command Center outputs through their normal os-pm workspace
- APP-01 Bid Engine results → os-pm bidding panel with AI recommendations
- APP-02 Visit Scheduler → os-pm calendar with auto-scheduled visits
- APP-03 Change Orders → os-pm change order queue for review/approval
- APP-04 Reports → auto-generate in PM reports section
- APP-09 Task Queue → drives PM task list, auto-assigned by project phase
- APP-14 Decision Support → one-click approval cards in PM dashboard
- PMs can trigger manual runs of any app

**Interaction Flow:**

```
CLIENT-FACING (m-*)              COMMAND CENTER              OPERATIONAL (os-*)
════════════════════              (15 Mini-Apps)              ═══════════════════

m-marketplace ─── new lead ────► APP-01 Bid Engine ────► os-pm (bid panel)
m-project-owner ─ approval ───► APP-14 Decision ──────► os-pm (approvals)
m-ops-services ── subscribe ──► APP-09 Task Queue ────► os-pm (task list)
m-permits ─────── application ► APP-05 Permit Track ──► os-pm (permits)
                                APP-15 Dashboard ─────► os-admin (monitoring)
```

### 5.4 Event Bus & Queue Architecture

```typescript
const QUEUE_NAMES = {
  BID_ENGINE:       'bid-engine',
  VISIT_SCHEDULER:  'visit-scheduler',
  CHANGE_ORDER:     'change-order',
  REPORT_GENERATOR: 'report-generator',
  PERMIT_TRACKER:   'permit-tracker',
  INSPECTION:       'inspection-coordinator',
  BUDGET_TRACKER:   'budget-tracker',
  COMMUNICATION:    'communication-hub',
  TASK_QUEUE:       'task-queue',
  DOCUMENT_GEN:     'document-generator',
  PREDICTIVE:       'predictive-engine',
  SMART_SCHEDULER:  'smart-scheduler',
  QA_INSPECTOR:     'qa-inspector',
  DECISION_SUPPORT: 'decision-support',
};

// Cross-app flow example (milestone completed):
// 1. PM marks milestone complete in os-pm
// 2. Event: 'project.milestone.completed'
// 3. APP-06 → schedules next inspection
// 4. APP-07 → updates financial projections
// 5. APP-04 → queues progress report
// 6. APP-08 → notifies client
// 7. APP-09 → assigns next phase tasks
```

---

## 6. Command Center Database Schema

These models extend the core schema (Section 3). Add to the same `schema.prisma` file.

### 6.1 Automation & Queue Models

```prisma
enum TaskStatus { PENDING QUEUED PROCESSING COMPLETED FAILED CANCELED }

model AutomationTask {
  id            String     @id @default(uuid())
  type          String
  status        TaskStatus @default(PENDING)
  priority      Int        @default(5)
  projectId     String?
  clientId      String?
  assignedPmId  String?
  sourceApp     String
  payload       Json?
  result        Json?
  error         String?    @db.Text
  attempts      Int        @default(0)
  maxAttempts   Int        @default(3)
  scheduledFor  DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  project       Project?   @relation(fields: [projectId], references: [id])
  @@index([status])
  @@index([type])
  @@index([projectId])
  @@index([sourceApp])
  @@index([assignedPmId])
  @@index([scheduledFor])
}

model AutomationEvent {
  id          String   @id @default(uuid())
  eventType   String
  sourceApp   String
  projectId   String?
  payload     Json
  processedBy String[]
  createdAt   DateTime @default(now())
  @@index([eventType])
  @@index([sourceApp])
  @@index([projectId])
  @@index([createdAt])
}
```

### 6.2 Bid Engine Models (APP-01)

```prisma
model BidEvaluation {
  id                  String   @id @default(uuid())
  projectId           String
  trade               String
  status              String   @default("collecting")
  weightPrice         Decimal  @default(0.30) @db.Decimal(3, 2)
  weightTimeline      Decimal  @default(0.25) @db.Decimal(3, 2)
  weightQuality       Decimal  @default(0.25) @db.Decimal(3, 2)
  weightProximity     Decimal  @default(0.10) @db.Decimal(3, 2)
  weightAvailability  Decimal  @default(0.10) @db.Decimal(3, 2)
  dueDate             DateTime
  selectedBidId       String?
  aiRecommendation    String?  @db.Text
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  project             Project  @relation(fields: [projectId], references: [id])
  bids                Bid[]
  @@index([projectId])
  @@index([status])
}

model Bid {
  id                String   @id @default(uuid())
  evaluationId      String
  contractorId      String
  amount            Decimal  @db.Decimal(12, 2)
  timeline          Int
  qualityScore      Decimal? @db.Decimal(5, 2)
  proximityScore    Decimal? @db.Decimal(5, 2)
  availabilityScore Decimal? @db.Decimal(5, 2)
  totalScore        Decimal? @db.Decimal(5, 2)
  rank              Int?
  notes             String?  @db.Text
  scope             String?  @db.Text
  status            String   @default("submitted")
  createdAt         DateTime @default(now())
  evaluation        BidEvaluation @relation(fields: [evaluationId], references: [id])
  @@index([evaluationId])
  @@index([contractorId])
  @@index([totalScore])
}
```

### 6.3 Visit & Inspection Models (APP-02, APP-06)

```prisma
model SiteVisit {
  id              String   @id @default(uuid())
  projectId       String
  pmId            String
  type            String
  scheduledDate   DateTime
  completedDate   DateTime?
  duration        Int?
  notes           String?  @db.Text
  photos          String[]
  checklist       Json?
  calendarEventId String?
  status          String   @default("scheduled")
  createdAt       DateTime @default(now())
  project         Project  @relation(fields: [projectId], references: [id])
  @@index([projectId])
  @@index([pmId])
  @@index([scheduledDate])
  @@index([status])
}
```

### 6.4 Budget & Financial Tracking (APP-07)

```prisma
model BudgetSnapshot {
  id            String   @id @default(uuid())
  projectId     String
  periodStart   DateTime
  periodEnd     DateTime
  budgetTotal   Decimal  @db.Decimal(12, 2)
  spentToDate   Decimal  @db.Decimal(12, 2)
  committed     Decimal  @db.Decimal(12, 2)
  forecastFinal Decimal? @db.Decimal(12, 2)
  variance      Decimal? @db.Decimal(12, 2)
  variancePct   Decimal? @db.Decimal(5, 2)
  alertLevel    String?
  breakdown     Json?
  createdAt     DateTime @default(now())
  @@index([projectId])
  @@index([periodEnd])
}
```

### 6.5 Communication & Document Models (APP-08, APP-10)

```prisma
model MessageTemplate {
  id           String   @id @default(uuid())
  name         String
  channel      String
  triggerEvent String
  subject      String?
  body         String   @db.Text
  audience     String
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  @@index([triggerEvent])
  @@index([channel])
}

model DocumentTemplate {
  id        String   @id @default(uuid())
  name      String
  type      String
  content   String   @db.Text
  variables Json
  version   Int      @default(1)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  @@index([type])
}

model GeneratedDocument {
  id                  String   @id @default(uuid())
  templateId          String
  projectId           String?
  type                String
  title               String
  content             String   @db.Text
  fileUrl             String?
  signatureStatus     String?
  docuSignEnvelopeId  String?
  signedAt            DateTime?
  createdAt           DateTime @default(now())
  @@index([projectId])
  @@index([templateId])
  @@index([type])
}
```

### 6.6 AI/ML Models (APP-11 through APP-15)

```prisma
model WeeklyReport {
  id           String   @id @default(uuid())
  projectId    String
  weekStart    DateTime
  weekEnd      DateTime
  summary      String   @db.Text
  metrics      Json
  risks        Json?
  photos       String[]
  fileUrl      String?
  sentToClient Boolean  @default(false)
  createdAt    DateTime @default(now())
  project      Project  @relation(fields: [projectId], references: [id])
  @@index([projectId])
  @@index([weekEnd])
}

model QAInspectionResult {
  id              String   @id @default(uuid())
  projectId       String
  siteVisitId     String?
  photoUrl        String
  analysisResult  Json
  issuesFound     Json?
  overallScore    Decimal? @db.Decimal(5, 2)
  reviewedByPm    Boolean  @default(false)
  createdAt       DateTime @default(now())
  @@index([projectId])
  @@index([siteVisitId])
}

model DecisionQueue {
  id               String   @id @default(uuid())
  projectId        String
  pmId             String
  type             String
  title            String
  context          Json
  aiRecommendation String?  @db.Text
  aiConfidence     Decimal? @db.Decimal(5, 4)
  options          Json
  decision         String?
  decidedAt        DateTime?
  decidedBy        String?
  reasoning        String?  @db.Text
  createdAt        DateTime @default(now())
  @@index([pmId])
  @@index([projectId])
  @@index([type])
  @@index([decision])
}

model AppHealthMetric {
  id          String   @id @default(uuid())
  appId       String
  timestamp   DateTime @default(now())
  jobsTotal   Int
  jobsSuccess Int
  jobsFailed  Int
  avgDuration Decimal  @db.Decimal(10, 2)
  queueDepth  Int
  errorRate   Decimal  @db.Decimal(5, 4)
  metadata    Json?
  @@index([appId])
  @@index([timestamp])
}
```

---

## 7. Command Center Code Implementation

### 7.1 Shared Infrastructure (BullMQ + Event Bus)

```typescript
// packages/automation/src/infrastructure/queues.ts
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

export function createQueue(name: string) {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    }
  });
}

export function createWorker(
  name: string,
  processor: (job: Job) => Promise<any>,
  concurrency = 5
) {
  return new Worker(name, processor, { connection, concurrency });
}
```

```typescript
// packages/automation/src/infrastructure/event-bus.ts
import Redis from 'ioredis';
import { prisma } from '@kealee/database';

const pub = new Redis(process.env.REDIS_URL!);
const sub = new Redis(process.env.REDIS_URL!);

export const eventBus = {
  async publish(event: string, data: any, source: string) {
    const payload = JSON.stringify({ event, data, source, ts: Date.now() });
    await pub.publish('kealee:events', payload);
    await prisma.automationEvent.create({
      data: { eventType: event, sourceApp: source, payload: data }
    });
  },
  subscribe(handler: (event: string, data: any, source: string) => void) {
    sub.subscribe('kealee:events');
    sub.on('message', (_, msg) => {
      const { event, data, source } = JSON.parse(msg);
      handler(event, data, source);
    });
  }
};
```

### 7.2 Cursor Prompt: Build All 15 Command Center Apps

> **CURSOR PROMPT:**
> ```
> Build the Kealee Command Center - 15 independent mini-apps for PM automation.
>
> LOCATION: packages/automation/
>
> STRUCTURE:
> packages/automation/
>   src/
>     infrastructure/
>       queues.ts          # BullMQ queue + worker factories
>       event-bus.ts       # Redis pub/sub event bus
>       ai.ts              # Claude API wrapper
>     apps/
>       bid-engine/        # APP-01
>       visit-scheduler/   # APP-02
>       change-order/      # APP-03
>       report-generator/  # APP-04
>       permit-tracker/    # APP-05
>       inspection-coord/  # APP-06
>       budget-tracker/    # APP-07
>       communication-hub/ # APP-08
>       task-queue/        # APP-09
>       document-gen/      # APP-10
>       predictive-engine/ # APP-11
>       smart-scheduler/   # APP-12
>       qa-inspector/      # APP-13
>       decision-support/  # APP-14
>       dashboard/         # APP-15
>     workers/
>       index.ts           # Starts all 14 workers
>
> EACH APP: index.ts + worker.ts + [name].ts
> TECH: TypeScript, BullMQ, Redis, Prisma, Anthropic Claude SDK
> DATABASE: Use models from Section 6
> EVENTS: All apps publish/subscribe via eventBus
> ```

### 7.3 API Routes for Command Center

```typescript
// apps/api/src/routes/command-center/

// GET  /api/v1/command-center/status           - All 15 app health
// GET  /api/v1/command-center/metrics           - Aggregate job metrics
// GET  /api/v1/command-center/alerts            - Active alerts
// POST /api/v1/command-center/:appId/trigger    - Manual trigger
// POST /api/v1/command-center/:appId/pause      - Pause queue
// POST /api/v1/command-center/:appId/resume     - Resume queue
// GET  /api/v1/command-center/:appId/jobs       - List jobs
// POST /api/v1/command-center/:appId/retry      - Retry failed

// Per-app routes:
// GET  /api/v1/bids/evaluations/:projectId
// GET  /api/v1/visits/schedule/:pmId
// POST /api/v1/reports/generate/:projectId
// GET  /api/v1/decisions/queue/:pmId
// POST /api/v1/decisions/:id/resolve
```

### 7.4 Cursor Prompt: Command Center Dashboard UI

> **CURSOR PROMPT:**
> ```
> Create the Command Center Dashboard for os-admin.
> LOCATION: apps/os-admin/app/(dashboard)/command-center/
>
> FILES:
>   page.tsx         - Main dashboard: 4 stat cards + 15-app grid
>   layout.tsx       - Sidebar nav listing all 15 apps
>   [appId]/page.tsx - Individual app detail view
>
> DASHBOARD: Stats row → App grid → Alerts feed
> APP VIEW: Queue status, job history, performance chart, controls
> TECH: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Recharts
> ```

### 7.5 Deployment (Railway + Vercel + GitHub)

| Component | Platform | Service | Trigger |
|---|---|---|---|
| **Worker processes** | Railway | `kealee-workers` | main → auto-deploy |
| **API** | Railway | `kealee-api` | main → auto-deploy |
| **os-admin** | Vercel | `kealee-admin` | main → auto-deploy |
| **os-pm** | Vercel | `kealee-pm` | main → auto-deploy |
| **Redis** | Railway | `kealee-redis` | Managed |
| **PostgreSQL** | Supabase | `kealee-db` | Managed |

```yaml
# .github/workflows/deploy-workers.yml
name: Deploy Command Center Workers
on:
  push:
    branches: [main]
    paths: ['packages/automation/**', 'packages/database/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install && pnpm --filter @kealee/automation build
      - uses: railwayapp/deploy@v1
        with: { service: kealee-workers }
        env: { RAILWAY_TOKEN: '${{ secrets.RAILWAY_TOKEN }}' }
```

```dockerfile
# Railway Worker Dockerfile
FROM node:20-slim AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/automation/ packages/automation/
COPY packages/database/ packages/database/
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @kealee/database generate
RUN pnpm --filter @kealee/automation build
CMD ["node", "packages/automation/dist/workers/index.js"]
```

### 7.6 Full Implementation Checklist

| # | Task | Location |
|---|---|---|
| 1 | Generate Prisma schema (Sec 3 + 6) | `schema.prisma` |
| 2 | Run prisma generate + migrate | Terminal |
| 3 | Auth middleware (JWT + Supabase) | `middleware/auth.ts` |
| 4 | Marketplace routes | `routes/marketplace/` |
| 5 | Project routes | `routes/projects/` |
| 6 | Escrow routes | `routes/escrow/` |
| 7 | Permit routes | `routes/permits/` |
| 8 | Design routes | `routes/design/` |
| 9 | Stripe webhooks | `routes/webhooks/stripe.ts` |
| 10 | m-project-owner dashboard | `apps/m-project-owner/` |
| 11 | m-marketplace | `apps/m-marketplace/` |
| 12 | os-pm workspace | `apps/os-pm/` |
| 13 | Redis + BullMQ infrastructure | `packages/automation/infra/` |
| 14 | APP-01 Bid Engine | `apps/bid-engine/` |
| 15 | APP-02 Visit Scheduler | `apps/visit-scheduler/` |
| 16 | APP-03 Change Order Processor | `apps/change-order/` |
| 17 | APP-04 Report Generator | `apps/report-generator/` |
| 18 | APP-05 Permit Tracker | `apps/permit-tracker/` |
| 19 | APP-06 Inspection Coordinator | `apps/inspection-coord/` |
| 20 | APP-07 Budget Tracker | `apps/budget-tracker/` |
| 21 | APP-08 Communication Hub | `apps/communication-hub/` |
| 22 | APP-09 Task Queue Manager | `apps/task-queue/` |
| 23 | APP-10 Document Generator | `apps/document-gen/` |
| 24 | APP-11 Predictive Engine (AI) | `apps/predictive-engine/` |
| 25 | APP-12 Smart Scheduler (AI) | `apps/smart-scheduler/` |
| 26 | APP-13 QA Inspector (AI) | `apps/qa-inspector/` |
| 27 | APP-14 Decision Support (AI) | `apps/decision-support/` |
| 28 | APP-15 Dashboard in os-admin | `os-admin/command-center/` |
| 29 | Command Center API routes | `routes/command-center/` |
| 30 | Worker startup script | `workers/index.ts` |
| 31 | Deploy frontends to Vercel | `vercel.json` per app |
| 32 | Deploy API + workers to Railway | `Dockerfile` + `railway.toml` |
| 33 | GitHub Actions CI/CD | `.github/workflows/` |
| 34 | End-to-end testing | `tests/` |

```bash
# Getting Started
cd kealee-platform-v10 && pnpm install
cd packages/database && npx prisma generate
npx prisma migrate dev --name full_platform_with_command_center
docker run -d --name kealee-redis -p 6379:6379 redis:7-alpine
cd packages/automation && pnpm dev   # start workers
cd ../.. && pnpm dev                 # start all apps
```
