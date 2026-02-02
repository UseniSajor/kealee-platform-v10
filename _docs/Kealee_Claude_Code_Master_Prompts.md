# KEALEE PLATFORM v10
# MASTER CLAUDE CODE PROMPTS
## For Build, Write, and Implementation

---

# HOW TO USE THESE PROMPTS

## Recommended Approach

1. **Copy the MASTER CONTEXT PROMPT first** (Section 1) - This establishes platform understanding
2. **Then copy the specific BUILD PROMPT** for what you're working on
3. **Reference the SOP Logic document** when Claude needs workflow details

## Prompt Order for Full Build

```
1. Master Context Prompt (always first)
2. Schema Verification Prompt
3. Module-Specific Build Prompts (in order):
   a. os-pm (execution engine)
   b. os-admin (control center)
   c. m-marketplace (central hub)
   d. m-project-owner
   e. m-ops-services
   f. m-finance-trust
   g. m-architect
   h. m-engineer
   i. m-permits-inspections
4. Command Center Build Prompts (15 apps)
5. UI/UX Implementation Prompts
```

---

# SECTION 1: MASTER CONTEXT PROMPT

**Copy this FIRST for every Claude Code session:**

```
# KEALEE PLATFORM v10 - MASTER CONTEXT

You are building the Kealee Platform v10, an end-to-end construction services and talent meetup online platform. Before writing any code, understand this critical architecture:

## PLATFORM IDENTITY

Kealee is a TWO-SIDED MARKETPLACE WITH MANAGED SERVICES that connects:
- Homeowners seeking renovation/construction services
- Contractors, GCs, and Builders seeking projects
- Architects providing design services
- Engineers providing structural/MEP services
- Project Managers executing service delivery

## CRITICAL MODULE CLASSIFICATION

### Client-Facing Modules (m-*) - ALL are PORTALS/DASHBOARDS for external users:

| Module | Purpose | Primary User |
|--------|---------|--------------|
| m-marketplace | CENTRAL HUB - Marketing, sales, pass-through to all services | All users |
| m-ops-services | Service subscription portal | GCs, Builders, Contractors |
| m-architect | Architecture/design services hub | Homeowners |
| m-engineer | Engineering services hub | Homeowners |
| m-project-owner | Full project management with AI design, find contractor, escrow | Homeowners |
| m-permits-inspections | Permit and inspection coordination | All stakeholders |
| m-finance-trust | Escrow, payments, transaction protection | All transacting users |
| m-inspector | Third-party inspection services | Inspectors |

### Operational Modules (os-*) - INTERNAL systems for Kealee staff:

| Module | Purpose | Primary User |
|--------|---------|--------------|
| os-pm | PM workspace - EXECUTES m-ops-services deliverables | Project Managers |
| os-admin | Platform administration - CONTROLS ALL modules | Kealee Admins |

## KEY RELATIONSHIP: os-pm IMPLEMENTS m-ops-services

- Client subscribes to Package A/B/C/D in m-ops-services
- PM executes deliverables in os-pm workspace
- Client sees results in m-ops-services portal
- os-admin monitors everything

## m-marketplace IS THE CENTRAL HUB

All traffic flows through m-marketplace first:
- "I'm a Homeowner" → routes to m-project-owner
- "I'm a Contractor" → routes to m-ops-services
- "I need Design" → routes to m-architect
- "I need Engineering" → routes to m-engineer
- "I need Permits" → routes to m-permits-inspections
- "Manage Payments" → routes to m-finance-trust

## SERVICE TIERS (Managed via Stripe)

| Package | Price | Hours/Week | Key Features |
|---------|-------|------------|--------------|
| A - Starter | $1,750/mo | 5-10 | Basic PM support |
| B - Professional | $3,750/mo | 15-20 | Contractor coordination |
| C - Premium | $9,500/mo | 30-40 | Permits, inspections, 0% marketplace fees |
| D - Enterprise | $16,500/mo | 40+ | White-glove, we handle everything |

## COMMAND CENTER - 15 AUTOMATION APPS

Background workers that automate PM tasks:
- APP-01: Bid Engine (contractor bidding)
- APP-02: Visit Scheduler (site visits)
- APP-03: Change Order (scope changes)
- APP-04: Report Generator (auto-reports)
- APP-05: Permit Tracker (permit status)
- APP-06: Inspection Coordinator (scheduling)
- APP-07: Budget Tracker (cost monitoring)
- APP-08: Communication Hub (messaging)
- APP-09: Task Queue Manager (PM tasks)
- APP-10: Document Generator (contracts)
- APP-11: Predictive Engine (risk AI)
- APP-12: Smart Scheduler (automation)
- APP-13: QA Inspector (photo AI)
- APP-14: Decision Support (approvals)
- APP-15: Estimation Tool (cost estimates) ⭐ NEW

## TECH STACK

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI
- Backend: Fastify, Prisma, BullMQ, Redis
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth
- Payments: Stripe
- Deployment: Vercel (frontend), Railway (backend)
- Monorepo: Turborepo with pnpm

## MONOREPO STRUCTURE

```
kealee-platform-v10/
├── apps/
│   ├── os-admin/          # Admin panel
│   ├── os-pm/             # PM workspace
│   ├── m-marketplace/     # Central hub
│   ├── m-project-owner/   # Homeowner portal
│   ├── m-ops-services/    # Contractor portal
│   ├── m-architect/       # Architect hub
│   ├── m-engineer/        # Engineer hub
│   ├── m-permits-inspections/
│   ├── m-finance-trust/   # Escrow/payments
│   └── m-inspector/       # Inspector portal
├── packages/
│   ├── database/          # Prisma schema
│   ├── ui/                # Shared components
│   ├── auth/              # Supabase auth
│   ├── events/            # Event bus
│   └── queue/             # BullMQ queues
└── services/
    └── command-center/    # 15 automation apps
```

Now I understand the platform. What would you like me to build?
```

---

# SECTION 2: SCHEMA VERIFICATION PROMPT

**Use this to verify/update the Prisma schema:**

```
# SCHEMA VERIFICATION & UPDATE

Reference the Kealee Platform SOP and ensure the Prisma schema includes all required models.

## Required Models Checklist

### Core Models
- [ ] User (with roles: ADMIN, PM, CLIENT, CONTRACTOR, ARCHITECT, ENGINEER, INSPECTOR)
- [ ] Organization
- [ ] Project (with phases, status, complexity)
- [ ] Property

### Service & Subscription Models
- [ ] Subscription (Package A/B/C/D)
- [ ] ServiceRequest
- [ ] PMAssignment

### Bid Engine Models (APP-01)
- [ ] Contractor (with queue position, rating, specialties)
- [ ] BidRequest
- [ ] BidInvitation
- [ ] BidSubmission
- [ ] BidAnalysis

### Visit Models (APP-02)
- [ ] SiteVisit
- [ ] VisitChecklist
- [ ] VisitPhoto

### Change Order Models (APP-03)
- [ ] ChangeOrder
- [ ] ChangeOrderLineItem

### Report Models (APP-04)
- [ ] Report
- [ ] ReportTemplate

### Permit Models (APP-05)
- [ ] Jurisdiction
- [ ] Permit
- [ ] PermitDocument

### Inspection Models (APP-06)
- [ ] Inspection
- [ ] InspectionChecklist
- [ ] InspectionResult

### Budget Models (APP-07)
- [ ] BudgetItem
- [ ] BudgetTransaction
- [ ] BudgetVariance

### Communication Models (APP-08)
- [ ] CommunicationLog
- [ ] CommunicationTemplate
- [ ] Notification

### Task Models (APP-09)
- [ ] AutomationTask (37 task types)
- [ ] TaskAssignment

### Document Models (APP-10)
- [ ] Document
- [ ] DocumentTemplate

### AI Models (APP-11-14)
- [ ] Prediction
- [ ] RiskAssessment
- [ ] QualityIssue
- [ ] DecisionLog
- [ ] AIConversation

### Estimation Models (APP-15) ⭐ NEW
- [ ] Estimate
- [ ] EstimateLineItem
- [ ] CostDatabase
- [ ] RegionalMultiplier
- [ ] TradeRate

### Finance/Escrow Models (m-finance-trust)
- [ ] Escrow
- [ ] EscrowMilestone
- [ ] Payment
- [ ] Invoice

### Command Center Models
- [ ] DashboardWidget
- [ ] ActivityLog
- [ ] WorkerStatus

## Task

1. Review the current schema at packages/database/prisma/schema.prisma
2. Identify any missing models from the checklist above
3. Add missing models with proper relations
4. Ensure all enums are defined
5. Add appropriate indexes for query performance

Show me the current schema and what needs to be added.
```

---

# SECTION 3: os-pm BUILD PROMPT

**The execution engine for managed services:**

```
# BUILD: os-pm (PM Workspace)

os-pm is the EXECUTION ENGINE where Project Managers do their daily work. It implements the deliverables for m-ops-services subscriptions.

## Key Understanding

- PMs log into os-pm to execute work
- Clients log into m-ops-services to see results
- os-pm is INTERNAL (Kealee staff only)
- m-ops-services is CLIENT-FACING

## Required Pages/Routes

```
apps/os-pm/app/
├── (auth)/
│   ├── login/
│   └── logout/
├── dashboard/                    # PM home - task queue, metrics
├── queue/                        # Prioritized work queue
│   ├── page.tsx                  # All tasks
│   └── [taskId]/                 # Task detail
├── clients/                      # Assigned clients
│   ├── page.tsx                  # Client list
│   └── [clientId]/
│       ├── page.tsx              # Client overview
│       ├── projects/             # Their projects
│       ├── requests/             # Service requests
│       └── communication/        # Messages
├── projects/                     # Project management
│   └── [projectId]/
│       ├── page.tsx              # Project dashboard
│       ├── scope/                # Scope & requirements
│       ├── schedule/             # Timeline & milestones
│       ├── budget/               # Budget tracking (APP-07)
│       ├── bids/                 # Bid management (APP-01)
│       ├── permits/              # Permit status (APP-05)
│       ├── inspections/          # Inspections (APP-06)
│       ├── documents/            # Document vault
│       ├── photos/               # Photo gallery
│       └── communication/        # Project messages
├── visits/                       # Site visits (APP-02)
│   ├── page.tsx                  # Visit calendar
│   ├── schedule/                 # Schedule new visit
│   └── [visitId]/                # Visit details & checklist
├── reports/                      # Report generation (APP-04)
│   ├── page.tsx                  # All reports
│   ├── generate/                 # Create report
│   └── [reportId]/               # Report detail
├── estimates/                    # Cost estimation (APP-15)
│   ├── page.tsx                  # All estimates
│   ├── create/                   # New estimate
│   └── [estimateId]/             # Estimate detail
├── sops/                         # SOP library
├── time-tracking/                # Time logging
└── settings/                     # PM preferences
```

## Dashboard Components

The os-pm dashboard should show:
1. **Task Queue** - Prioritized tasks with scores (from APP-09)
2. **Today's Schedule** - Visits, calls, deadlines
3. **Client Overview** - Assigned clients by package tier
4. **Alerts** - Overdue items, risk alerts, inspection failures
5. **Quick Actions** - Log time, complete task, generate report

## Key Features to Build

1. **Work Queue Integration**
   - Pull from APP-09 Task Queue Manager
   - Show priority scores
   - One-click complete/escalate

2. **Site Visit Tools**
   - Mobile-optimized checklists
   - GPS-tagged photo upload
   - Offline mode support
   - Auto-sync when connected

3. **Report Generator**
   - 80% auto-fill from project data
   - Template selection
   - Photo inclusion
   - One-click send to client

4. **Budget Tracking**
   - Real-time budget vs actual
   - Variance alerts
   - Change order impact visualization

## Build Instructions

1. Create the route structure above
2. Build the dashboard with task queue as primary view
3. Implement client/project nested routes
4. Add mobile-responsive layouts for field work
5. Integrate with Command Center APIs for automation data

Start by showing me the current os-pm structure and what needs to be added.
```

---

# SECTION 4: os-admin BUILD PROMPT

```
# BUILD: os-admin (Platform Administration)

os-admin CONTROLS AND MONITORS all modules in the platform. Only Kealee administrators have access.

## Key Understanding

- os-admin sees EVERYTHING
- Controls user management, financial oversight, system config
- Monitors all Command Center apps
- Views platform-wide metrics

## Required Pages/Routes

```
apps/os-admin/app/
├── (auth)/
├── dashboard/                    # Platform overview
├── users/                        # User management
│   ├── page.tsx                  # All users
│   ├── [userId]/                 # User detail
│   ├── pms/                      # PM management
│   ├── clients/                  # Client management
│   └── contractors/              # Contractor management
├── projects/                     # All projects platform-wide
├── subscriptions/                # Subscription management
│   ├── page.tsx                  # All subscriptions
│   └── [subscriptionId]/         # Subscription detail
├── financials/                   # Platform financials
│   ├── revenue/                  # MRR, ARR, trends
│   ├── transactions/             # All transactions
│   ├── escrow/                   # Escrow oversight
│   └── payouts/                  # Contractor payouts
├── command-center/               # 15 Mini-Apps control
│   ├── page.tsx                  # Overview dashboard
│   ├── jobs/                     # Queue monitoring
│   ├── workers/                  # Worker status
│   ├── events/                   # Event log
│   └── settings/                 # App configurations
├── marketplace/                  # Marketplace oversight
│   ├── contractors/              # Contractor queue
│   ├── bids/                     # All bids
│   └── analytics/                # Marketplace metrics
├── jurisdictions/                # Permit jurisdictions
├── analytics/                    # Platform analytics
│   ├── usage/                    # Feature usage
│   ├── performance/              # System performance
│   └── automation/               # Automation metrics
├── settings/                     # Platform settings
│   ├── integrations/             # Stripe, DocuSign, etc.
│   ├── notifications/            # Notification rules
│   └── billing/                  # Platform billing
└── audit-log/                    # All actions logged
```

## Dashboard Components

1. **Platform Health** - Uptime, error rate, response times
2. **Revenue Overview** - MRR, ARR, growth trends
3. **User Stats** - Active users by type, growth
4. **Command Center Status** - 15 app health indicators
5. **Recent Activity** - Platform-wide event stream
6. **Alerts** - System issues, failed jobs, anomalies

## Key Features

1. **User Management**
   - Create/edit/deactivate users
   - Role assignment
   - PM workload balancing
   - Contractor approval/rejection

2. **Financial Oversight**
   - Revenue dashboards
   - Escrow monitoring
   - Payout management
   - Stripe integration status

3. **Command Center Control**
   - Start/stop workers
   - View job queues
   - Retry failed jobs
   - Configure app settings

4. **Audit Trail**
   - All admin actions logged
   - User activity tracking
   - Financial transaction history
   - 7-year retention

Build the admin dashboard with real-time metrics and Command Center integration.
```

---

# SECTION 5: m-marketplace BUILD PROMPT

```
# BUILD: m-marketplace (Central Hub)

m-marketplace is the MAIN ENTRY POINT and CENTRAL HUB for the entire platform. All users start here before routing to specialized modules.

## Key Understanding

- Marketing-focused landing pages
- Sales conversion optimization
- Pass-through routing to other modules
- Fair bid rotation system for contractors

## URL: kealee.com (or marketplace.kealee.com)

## Required Pages/Routes

```
apps/m-marketplace/app/
├── (marketing)/
│   ├── page.tsx                  # Homepage
│   ├── about/                    # About Kealee
│   ├── how-it-works/             # Process explanation
│   ├── pricing/                  # Package tiers
│   └── contact/                  # Contact form
├── services/                     # Service categories
│   ├── page.tsx                  # All services
│   ├── project-management/       # PM packages
│   ├── architecture/             # Design services
│   ├── engineering/              # Engineering services
│   ├── permits/                  # Permit services
│   └── [category]/               # Dynamic category pages
├── contractors/                  # Contractor marketplace
│   ├── page.tsx                  # Browse contractors
│   ├── [contractorId]/           # Contractor profile
│   └── search/                   # Search/filter
├── projects/                     # Project posting
│   ├── post/                     # Post a project
│   └── browse/                   # Browse projects (contractors)
├── (auth)/
│   ├── login/
│   ├── register/
│   │   ├── homeowner/            # → m-project-owner
│   │   ├── contractor/           # → m-ops-services
│   │   ├── architect/            # → m-architect
│   │   └── engineer/             # → m-engineer
│   └── forgot-password/
├── consultation/                 # Book consultation
│   ├── tier-1/                   # Free virtual ($0)
│   ├── tier-2/                   # Site visit ($199-299)
│   └── tier-3/                   # Design package ($499-999)
└── dashboard/                    # Redirect based on role
```

## Homepage Sections

1. **Hero** - "Find Trusted Contractors" / "Find Quality Projects"
2. **How It Works** - 3-step process
3. **Service Categories** - Grid of services
4. **Featured Contractors** - Top-rated contractors
5. **Trust Signals** - Stats, ratings, certifications
6. **Pricing** - Package tier comparison
7. **Testimonials** - Client success stories
8. **CTA** - Get started buttons

## Routing Logic

After login/register, route users based on their role:
- role === 'HOMEOWNER' → redirect to m-project-owner
- role === 'CONTRACTOR' → redirect to m-ops-services
- role === 'ARCHITECT' → redirect to m-architect
- role === 'ENGINEER' → redirect to m-engineer
- role === 'PM' → redirect to os-pm
- role === 'ADMIN' → redirect to os-admin

## Key Features

1. **Contractor Search**
   - Filter by trade, location, rating
   - Show queue position (fair rotation)
   - Display response time, completion rate

2. **Project Posting**
   - Guided project creation wizard
   - AI-powered scope classification
   - Instant estimate (APP-15)

3. **Consultation Booking**
   - Tier selection
   - Calendar integration
   - Stripe checkout

4. **Fair Bid Rotation Display**
   - Show contractor queue position
   - Explain 3% bid-up rule
   - Transparency in matching

Build with marketing-optimized design and clear CTAs throughout.
```

---

# SECTION 6: m-finance-trust BUILD PROMPT

```
# BUILD: m-finance-trust (Escrow & Payments)

m-finance-trust handles all financial transactions, escrow management, and payment protection.

## Key Understanding

- Escrow accounts per project
- Milestone-based fund releases
- 3-party approval workflow
- Dispute resolution
- Stripe integration

## Required Pages/Routes

```
apps/m-finance-trust/app/
├── (auth)/
├── dashboard/                    # Financial overview
├── escrow/                       # Escrow management
│   ├── page.tsx                  # All escrow accounts
│   ├── create/                   # Create new escrow
│   └── [escrowId]/
│       ├── page.tsx              # Escrow detail
│       ├── milestones/           # Milestone management
│       ├── releases/             # Release history
│       └── disputes/             # Dispute handling
├── payments/                     # Payment management
│   ├── page.tsx                  # All payments
│   ├── pending/                  # Pending payments
│   ├── history/                  # Payment history
│   └── [paymentId]/              # Payment detail
├── invoices/                     # Invoice management
│   ├── page.tsx                  # All invoices
│   ├── create/                   # Create invoice
│   └── [invoiceId]/              # Invoice detail
├── wallet/                       # User wallet/balance
├── payouts/                      # Contractor payouts
│   ├── page.tsx                  # Payout history
│   └── schedule/                 # Scheduled payouts
├── disputes/                     # Dispute resolution
│   ├── page.tsx                  # All disputes
│   └── [disputeId]/              # Dispute detail
└── settings/
    ├── payment-methods/          # Add/manage cards/bank
    └── tax-documents/            # W-9, 1099, etc.
```

## Escrow Workflow

```
1. Project contract signed
   ↓
2. Client funds escrow (full or milestone-based)
   ↓
3. Escrow account created
   ↓
4. Work progresses
   ↓
5. Milestone completed
   ↓
6. PM verifies in os-pm
   ↓
7. Release request created
   ↓
8. Client approves (or auto-approve if enabled)
   ↓
9. Funds released to contractor
   ↓
10. Transaction logged
```

## Key Features

1. **Escrow Dashboard**
   - Active escrow accounts
   - Pending releases
   - Total funds held
   - Release timeline

2. **Milestone Management**
   - Create milestones from contract
   - Track completion status
   - Partial release support
   - Retainage handling

3. **Release Workflow**
   - PM initiates via os-pm
   - Client receives notification
   - One-click approve/reject
   - Auto-release rules (optional)

4. **Dispute Resolution**
   - Dispute filing
   - Evidence upload
   - Mediation workflow
   - Resolution tracking

5. **Stripe Integration**
   - Connect accounts for contractors
   - ACH and card payments
   - Automatic fee calculation
   - Payout scheduling

## Fee Structure

| Fee Type | Amount | Notes |
|----------|--------|-------|
| Escrow fee | 1% (max $500) | Standard |
| Escrow fee (C/D) | 0.5% (max $250) | Package discount |
| Payment processing | 2.9% + $0.30 | Stripe fees |
| Dispute resolution | $150 flat | If filed |

Build with emphasis on trust, transparency, and security.
```

---

# SECTION 7: COMMAND CENTER BUILD PROMPT (All 15 Apps)

```
# BUILD: Command Center (15 Automation Apps)

Build the complete Command Center with all 15 mini-apps as background workers.

## Directory Structure

```
services/command-center/
├── apps/
│   ├── APP-01-bid-engine/
│   ├── APP-02-visit-scheduler/
│   ├── APP-03-change-order/
│   ├── APP-04-report-generator/
│   ├── APP-05-permit-tracker/
│   ├── APP-06-inspection/
│   ├── APP-07-budget-tracker/
│   ├── APP-08-communication/
│   ├── APP-09-task-queue/
│   ├── APP-10-document-gen/
│   ├── APP-11-predictive/
│   ├── APP-12-smart-scheduler/
│   ├── APP-13-qa-inspector/
│   ├── APP-14-decision-support/
│   └── APP-15-estimation/        # ⭐ NEW
├── shared/
│   ├── integrations/
│   │   ├── stripe.ts
│   │   ├── docusign.ts
│   │   ├── sendgrid.ts
│   │   ├── twilio.ts
│   │   ├── mapbox.ts
│   │   ├── openweather.ts
│   │   └── anthropic.ts
│   ├── ai/
│   │   └── claude.ts
│   └── utils/
├── gateway/
│   └── src/
│       ├── server.ts
│       └── routes.ts
└── workers/
    └── src/
        └── main.ts
```

## Standard App Structure (Each of 15 apps)

```
APP-XX-name/
├── src/
│   ├── index.ts          # Exports
│   ├── worker.ts         # BullMQ worker
│   ├── routes.ts         # Fastify routes
│   ├── jobs/             # Job handlers
│   │   └── job-name.ts
│   ├── services/         # Business logic
│   │   └── service-name.ts
│   └── types.ts          # TypeScript types
├── tests/
└── package.json
```

## APP-15 Estimation Tool (New App)

```typescript
// APP-15-estimation/src/worker.ts

import { Worker, Job } from 'bullmq';
import { prisma } from '@kealee/database';
import { generateJSON } from '../../shared/ai/claude';

interface EstimateJobData {
  projectId: string;
  scope: string;
  squareFootage: number;
  location: string;
  projectType: string;
  qualityTier: 'standard' | 'premium' | 'luxury';
  specialRequirements?: string[];
}

const worker = new Worker('kealee:estimation', async (job: Job<EstimateJobData>) => {
  const { projectId, scope, squareFootage, location, projectType, qualityTier } = job.data;
  
  // 1. Load regional cost data
  const regionalData = await prisma.regionalMultiplier.findFirst({
    where: { region: location }
  });
  
  // 2. Load trade rates
  const tradeRates = await prisma.tradeRate.findMany({
    where: { region: location }
  });
  
  // 3. Generate line items using AI
  const lineItems = await generateJSON({
    system: "You are a construction cost estimator. Generate detailed line items.",
    prompt: `Create estimate for: ${projectType}, ${squareFootage} sqft, ${qualityTier} quality. Scope: ${scope}`,
    schema: EstimateLineItemsSchema
  });
  
  // 4. Apply regional multipliers
  const adjustedItems = lineItems.map(item => ({
    ...item,
    cost: item.cost * (regionalData?.multiplier || 1.0)
  }));
  
  // 5. Calculate totals
  const subtotal = adjustedItems.reduce((sum, item) => sum + item.cost, 0);
  const contingency = subtotal * 0.10; // 10% contingency
  const total = subtotal + contingency;
  
  // 6. Save estimate
  const estimate = await prisma.estimate.create({
    data: {
      projectId,
      status: 'DRAFT',
      lowRange: total * 0.9,
      midRange: total,
      highRange: total * 1.15,
      confidence: 0.85,
      lineItems: {
        create: adjustedItems
      }
    }
  });
  
  // 7. Emit event
  await eventBus.publish('estimate.generated', {
    estimateId: estimate.id,
    projectId,
    total
  });
  
  return estimate;
});

export default worker;
```

## Queue Names

```typescript
export const QUEUE_NAMES = {
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
  ESTIMATION: 'kealee:estimation'
};
```

Build all 15 workers with proper error handling, retry logic, and event emission.
```

---

# SECTION 8: UI/UX IMPLEMENTATION PROMPT

```
# BUILD: UI/UX Components & Design System

Implement the Kealee design system across all modules.

## Design Tokens

```typescript
// packages/ui/src/tokens.ts

export const colors = {
  // Brand
  primary: '#1E40AF',      // Kealee Blue
  secondary: '#F97316',    // Construction Orange
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // AI/Premium
  ai: '#7C3AED',
  
  // Module-specific
  modules: {
    marketplace: { primary: '#1E40AF', accent: '#F97316' },
    projectOwner: { primary: '#1E40AF', accent: '#10B981' },
    opsServices: { primary: '#1E40AF', accent: '#8B5CF6' },
    architect: { primary: '#6366F1', accent: '#F97316' },
    engineer: { primary: '#0891B2', accent: '#F97316' },
    permits: { primary: '#7C3AED', accent: '#10B981' },
    financeTrust: { primary: '#059669', accent: '#1E40AF' },
    osPm: { primary: '#1E40AF', accent: '#F97316' },
    osAdmin: { primary: '#111827', accent: '#F97316' }
  }
};

export const typography = {
  display: '"Plus Jakarta Sans", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace'
};
```

## Core Components to Build

```
packages/ui/src/components/
├── buttons/
│   ├── Button.tsx
│   ├── IconButton.tsx
│   └── ButtonGroup.tsx
├── forms/
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── Radio.tsx
│   ├── DatePicker.tsx
│   ├── FileUpload.tsx
│   └── FormField.tsx
├── cards/
│   ├── Card.tsx
│   ├── ProjectCard.tsx
│   ├── ContractorCard.tsx
│   ├── BidCard.tsx
│   ├── TaskCard.tsx
│   ├── EstimateCard.tsx        # NEW
│   └── VisitCard.tsx
├── tables/
│   ├── Table.tsx
│   ├── DataTable.tsx
│   └── TablePagination.tsx
├── charts/
│   ├── LineChart.tsx
│   ├── BarChart.tsx
│   ├── DonutChart.tsx
│   ├── GaugeChart.tsx
│   └── BudgetChart.tsx
├── navigation/
│   ├── Sidebar.tsx
│   ├── TopNav.tsx
│   ├── Breadcrumbs.tsx
│   └── TabNav.tsx
├── modals/
│   ├── Dialog.tsx
│   ├── Sheet.tsx
│   ├── Drawer.tsx
│   └── ConfirmDialog.tsx
├── feedback/
│   ├── Toast.tsx
│   ├── Alert.tsx
│   ├── Progress.tsx
│   ├── Skeleton.tsx
│   └── EmptyState.tsx
├── construction/                 # Domain-specific
│   ├── PermitStatus.tsx
│   ├── InspectionBadge.tsx
│   ├── BidComparison.tsx
│   ├── BudgetTracker.tsx
│   ├── TaskQueue.tsx
│   ├── VisitChecklist.tsx
│   ├── PhotoGallery.tsx
│   ├── EstimateBreakdown.tsx   # NEW
│   └── RiskGauge.tsx
└── layout/
    ├── PageLayout.tsx
    ├── DashboardLayout.tsx
    ├── MarketingLayout.tsx
    └── MobileLayout.tsx
```

## Mobile-First Responsive Breakpoints

```typescript
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};
```

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader labels
- Color contrast ratios
- Focus indicators

Build components with Tailwind CSS and Radix UI primitives.
```

---

# SECTION 9: QUICK REFERENCE - COPY/PASTE PROMPTS

## For Starting Any Session

```
I'm working on Kealee Platform v10. Before we start:

1. m-* modules are CLIENT-FACING portals
2. os-* modules are INTERNAL operations
3. os-pm EXECUTES what clients subscribe to in m-ops-services
4. os-admin CONTROLS all modules
5. m-marketplace is the CENTRAL HUB that routes to all other modules
6. m-finance-trust handles ESCROW and payments
7. Command Center has 15 automation apps (including APP-15 Estimation)

The tech stack is: Next.js 14, TypeScript, Tailwind, Fastify, Prisma, BullMQ, Supabase, Stripe.

Now let's work on [SPECIFIC MODULE/FEATURE].
```

## For Schema Updates

```
Update the Prisma schema to add the Estimation models for APP-15:

- Estimate (id, projectId, status, lowRange, midRange, highRange, confidence, createdAt)
- EstimateLineItem (id, estimateId, division, description, quantity, unit, unitCost, totalCost)
- CostDatabase (id, region, trade, category, unitCost, updatedAt)
- RegionalMultiplier (id, region, multiplier, updatedAt)
- TradeRate (id, region, trade, hourlyRate, updatedAt)

Include proper relations and indexes.
```

## For API Routes

```
Create Fastify API routes for [MODULE]:

Follow this pattern:
- GET /api/v1/[resource] - List all
- GET /api/v1/[resource]/:id - Get one
- POST /api/v1/[resource] - Create
- PUT /api/v1/[resource]/:id - Update
- DELETE /api/v1/[resource]/:id - Delete

Include authentication middleware and Zod validation.
```

---

**Document Version:** 1.0  
**Created:** January 30, 2026  
**Purpose:** Master prompts for Claude Code implementation of Kealee Platform v10  
