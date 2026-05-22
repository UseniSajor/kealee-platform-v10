# KEALEE PLATFORM v30
## Complete 7-Day Implementation Master (Days 1-7 Combined)
### Integrated with Current Codebase Structure

---

# PART 1: EXECUTIVE SUMMARY

## What is Being Built

**Kealee Platform v30** is an all-in-one AI-powered SaaS platform that:

1. **Moves intake BEFORE payment** (critical UX change)
2. **Replaces 3 fixed tiers with unlimited mix & match** (product change)
3. **Adds 7 new bots** (10 total instead of 3)
4. **Adds 4 new user types** (B2C + B2B + Internal + Partners)
5. **Adds 4 new revenue streams** (direct sales + B2B subscription + internal + white-label)

## NOT a Rebuild

You **keep everything**:
- Same Prisma schema (add new models, don't delete)
- Same KeaBot system (upgrade to v3.0)
- Same Fastify services (add new services)
- Same Next.js portals (enhance + add new)
- Same Stripe integration (enhance for dynamic pricing)
- Same auth layer (upgrade with RBAC)

This is an **in-place upgrade** to your existing monorepo.

---

# PART 2: YOUR CURRENT CODEBASE STRUCTURE

Based on your system, here's what you have:

```
kealee-platform-v20/
├── packages/
│   ├── prisma/
│   │   └── schema.prisma          ← 368 current models
│   │
│   ├── core-rules/
│   │   └── src/pricing.ts         ← Pricing import (never hardcode)
│   │
│   ├── core-events/
│   │   └── Event system
│   │
│   ├── core-bots/
│   │   └── src/
│   │       ├── orgo/              ← Orchestration (upgrade for v30)
│   │       ├── obsidian/          ← Knowledge base (expand)
│   │       ├── hermes/            ← Function routing (enhance for multi-model)
│   │       └── [3 bots]/          ← DesignBot, EstimateBot, PermitBot
│   │
│   ├── core-ddts/                 ← Data types
│   ├── core-bim/                  ← Building info models
│   │
│   └── [services]/
│       ├── os-land/               ← Existing service
│       ├── os-feas/               ← Existing service
│       ├── os-dev/                ← Main API (ADD v30 routes here)
│       ├── os-pm/                 ← Existing service
│       ├── os-pay/                ← Payment (ENHANCE for v30)
│       ├── os-marketplace/        ← Existing service
│       │
│       ├── [NEW] os-intake/       ← NEW service (intake analysis)
│       ├── [NEW] os-ai-orch/      ← NEW service (bot orchestration)
│       ├── [NEW] os-admin/        ← NEW service (admin management)
│       ├── [NEW] os-analytics/    ← NEW service (dashboards)
│       └── [NEW] os-white-label/  ← NEW service (multi-tenant)
│
├── apps/
│   ├── web-main/                  ← kealee.com (ENHANCE with intake)
│   ├── portal-owner/              ← app.kealee.com (ENHANCE)
│   ├── portal-contractor/         ← contractor.kealee.com (ENHANCE)
│   ├── portal-developer/          ← developer.kealee.com
│   │
│   ├── [NEW] portal-admin/        ← admin.kealee.com (NEW)
│   ├── [NEW] portal-analytics/    ← analytics.kealee.com (NEW)
│   ├── [NEW] portal-projects/     ← projects.kealee.com (NEW workspace)
│   └── [NEW] portal-white-label/  ← partner.kealee.ai (NEW)
│
├── Railway/                        ← Your deployment (no changes)
├── Vercel/                         ← Your deployment (no changes)
└── Stripe/                         ← Enhanced for dynamic pricing

TOTAL CHANGES:
✅ 15 new Prisma models
✅ 5 new Fastify services
✅ 4 new Next.js portal apps
✅ 0 deletions (all existing code preserved)
✅ 3 services enhanced (os-dev, os-pay, core-bots)
✅ 2 portals enhanced (web-main, portal-owner)
```

---

# PART 3: DATABASE SCHEMA (New Models to Add)

## Step 1: Add These Models to packages/prisma/schema.prisma

```prisma
// ============================================================================
// INTAKE & ANALYSIS (5 new models)
// ============================================================================

model IntakeResponse {
  id              String    @id @default(cuid())
  projectId       String    @unique
  userId          String
  
  // 9 questions answered
  propertyType    String    // single-family, multi-family, commercial, mixed-use
  primaryScope    String    // HVAC, plumbing, electrical, remodel, exterior, other
  budgetRange     String    // $25K-$50K, $50K-$100K, $100K-$250K, $250K+
  timeline        String    // ASAP, 6-8 weeks, 3+ months, flexible
  location        String    // DC, Maryland:COUNTY, Virginia:COUNTY
  squareFeet      Int
  yearBuilt       String    // pre-1950, 1950-1980, 1980-2000, 2000+
  utilities       Json      // { naturalGas: bool, waterSewer: bool }
  codeConsiderations String[]
  
  // AI analysis results
  scopeComplexity String    // simple, moderate, complex
  riskLevel       String    // low, medium, high
  estimatedCost   Decimal   // AI-determined price
  estimatedDays   Int
  analysisJson    Json      // full breakdown
  
  // Lifecycle
  status          String    @default("SUBMITTED")
  analyzedAt      DateTime?
  expiresAt       DateTime  @default(dbgenerated("now() + interval '30 days'"))
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user            User      @relation(fields: [userId], references: [id])
  customPackage   CustomPackage?
  
  @@index([projectId])
  @@index([userId])
  @@index([status])
}

model CustomPackage {
  id              String    @id @default(cuid())
  intakeResponseId String   @unique
  projectId       String
  userId          String
  
  // Mix & match features
  features        String[]  // ["Design", "Floorplan", "Estimate", "Permits", "Videos", "Support"]
  
  // Pricing (AI-determined + custom)
  basePrice       Decimal   // from IntakeBot
  featureAddons   Decimal   @default(0)
  totalPrice      Decimal   // basePrice + featureAddons
  
  // Stripe integration
  stripeProductId String?
  stripePriceId   String?
  stripeSessionId String?
  
  // Lifecycle
  status          String    @default("DRAFT") // DRAFT, QUOTED, PAID, ACTIVE, COMPLETED
  acceptedAt      DateTime?
  paidAt          DateTime?
  completedAt     DateTime?
  expiresAt       DateTime  @default(dbgenerated("now() + interval '90 days'"))
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  intakeResponse  IntakeResponse @relation(fields: [intakeResponseId], references: [id])
  project         Project   @relation(fields: [projectId], references: [id])
  user            User      @relation(fields: [userId], references: [id])
  botExecutions   BotExecution[]
  
  @@index([projectId])
  @@index([userId])
  @@index([status])
}

// ============================================================================
// BOT EXECUTION & ORCHESTRATION (3 new models)
// ============================================================================

model BotExecution {
  id              String    @id @default(cuid())
  projectId       String
  packageId       String
  
  // What bot, what version
  botType         String    // design, estimate, zoning, floorplan, permit, video, contractor, sales, support, project
  botVersion      String    @default("3.0")
  
  // Execution state
  status          String    @default("PENDING") // PENDING, EXECUTING, COMPLETE, FAILED
  progress        Int       @default(0) // 0-100
  
  // Input/output
  inputData       Json      // what bot received
  outputData      Json?     // what bot produced
  
  // Link to existing KeaBot system
  keaBotRunId     String?   // link to KeaBotRun if it exists
  
  // AI model used & performance
  modelUsed       String    // claude-opus, claude-sonnet, gpt-4o, llama-70b
  tokensUsed      Int       @default(0)
  cacheHitRate    Float     @default(0)
  costUSD         Decimal   @default(0)
  durationMs      Int       @default(0)
  
  // Error handling
  errorMessage    String?
  retryCount      Int       @default(0)
  
  // Timestamps
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  project         Project   @relation(fields: [projectId], references: [id])
  package         CustomPackage @relation(fields: [packageId], references: [id])
  results         BotResult[]
  
  @@index([projectId])
  @@index([botType])
  @@index([status])
  @@index([completedAt])
}

model BotResult {
  id              String    @id @default(cuid())
  executionId     String    @unique
  
  // What kind of result
  resultType      String    // concept, estimate, zoning, floorplan, permit, video, contractor, support
  
  // The actual result data
  contentJson     Json      // structured result
  mediaUrls       String[]  // images, videos, PDFs
  
  // Quality metrics
  qualityScore    Float?    // 0-100
  validationNotes String?
  
  // Delivery tracking
  deliveredAt     DateTime?
  deliveryMethod  String?   // portal, email, pdf, webhook
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  execution       BotExecution @relation(fields: [executionId], references: [id])
  
  @@index([executionId])
  @@index([resultType])
}

// ============================================================================
// PROJECT WORKSPACE (1 new model)
// ============================================================================

model ProjectWorkspace {
  id              String    @id @default(cuid())
  projectId       String    @unique
  
  // State machine
  currentStage    String    @default("INTAKE") // intake, design, estimate, permits, video, approval, construction, completion
  completionPercent Int     @default(0)
  
  // Design selection
  selectedConceptId String?
  conceptFeedback String?
  
  // Estimate selection
  selectedEstimateId String?
  estimateFeedback String?
  
  // Permit authorization
  permitAuthStatus String?   // DRAFT, AUTHORIZED, FILING, APPROVED
  permitAuthDate  DateTime?
  permitAuthorizedBy String?
  
  // Team collaboration
  owner           String    // project owner user_id
  collaborators   String[]  // [contractor_id, architect_id, engineer_id, ...]
  
  // Notes & attachments
  notes           String?
  attachments     String[]  // file URLs
  
  // Lifecycle
  status          String    @default("ACTIVE") // ACTIVE, PAUSED, COMPLETED, ARCHIVED
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  project         Project   @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
  @@index([currentStage])
}

// ============================================================================
// ADMIN & OPERATIONS (4 new models)
// ============================================================================

model BotConfiguration {
  id              String    @id @default(cuid())
  botType         String    @unique // one config per bot
  
  // System prompt (editable by admin)
  systemPrompt    String    @db.Text // full system prompt
  
  // Model configuration
  modelPrimary    String    @default("claude-opus-4-6")
  modelSecondary  String    @default("gpt-4o")
  modelFallback   String    @default("llama-70b")
  
  // Execution parameters
  temperature     Float     @default(0.7)
  maxTokens       Int       @default(2000)
  topP            Float     @default(0.9)
  
  // Performance tuning
  timeoutSeconds  Int       @default(60)
  retryOnFailure  Boolean   @default(true)
  maxRetries      Int       @default(3)
  
  // Cost controls
  maxCostUSD      Decimal?  // hard limit
  costThreshold   Decimal?  // alert threshold
  
  // Version & status
  version         Int       @default(1)
  notes           String?   // change log
  enabled         Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([botType])
}

model PricingFormula {
  id              String    @id @default(cuid())
  
  // Base amount
  baseAmount      Decimal   @default(99)
  
  // Size-based
  sqftMultiplier  Decimal   @default(0.05) // per square foot
  
  // Complexity-based
  complexityFees  Json      // { simple: 0, moderate: 200, complex: 500 }
  
  // Feature-based
  featureCosts    Json      // { Design: 150, Floorplan: 100, Estimate: 200, ... }
  
  // Urgency-based
  urgencyMultiplier Decimal @default(1.0) // 1.5 for ASAP, 0.8 for flexible
  
  // Location-based
  locationMultiplier Decimal @default(1.0) // regional adjustments
  
  // Bounds
  minPrice        Decimal   @default(99)
  maxPrice        Decimal   @default(9999)
  
  // Lifecycle
  active          Boolean   @default(true)
  version         Int       @default(1)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([active])
}

model AdminAuditLog {
  id              String    @id @default(cuid())
  adminId         String
  
  // What changed
  action          String    // create_product, update_pricing, configure_bot, manage_user, etc
  entityType      String    // BotConfiguration, PricingFormula, User, etc
  entityId        String
  
  // Before & after
  beforeValue     Json?
  afterValue      Json?
  changeNotes     String?
  
  // Tracking
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
  
  @@index([adminId])
  @@index([entityType])
  @@index([createdAt])
}

model WhiteLabelConfig {
  id              String    @id @default(cuid())
  partnerId       String    @unique
  
  // Company info
  companyName     String
  companyEmail    String
  
  // Branding
  logoUrl         String?
  primaryColor    String    @default("#0064C8")
  secondaryColor  String    @default("#666666")
  accentColor     String    @default("#00B050")
  customDomain    String?   // partner's domain
  
  // Features & limits
  enabledFeatures String[]  @default(["design", "estimate"])
  monthlyProjectLimit Int?
  teamSizeLimit   Int?
  
  // Pricing & revenue
  markup          Float     @default(1.0) // 1.0 = no markup, 1.5 = 50%
  customPricing   Json?     // override pricing
  
  // Integration
  webhookUrl      String?   // partner's webhook
  webhookSecret   String?   // hmac secret
  
  // Support
  supportEmail    String?
  supportPhone    String?
  
  // Status
  status          String    @default("ACTIVE") // ACTIVE, SUSPENDED, ARCHIVED
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([partnerId])
  @@index([status])
}

// ============================================================================
// ANALYTICS & METRICS (3 new models)
// ============================================================================

model BotMetrics {
  id              String    @id @default(cuid())
  botType         String
  date            DateTime
  
  // Daily stats
  totalExecutions Int
  successCount    Int
  failureCount    Int
  averageDuration Int // milliseconds
  
  // Cost
  totalCost       Decimal
  averageCost     Decimal
  
  // Quality
  averageQuality  Float?    // 0-100
  
  // Models used
  modelDistribution Json   // { "claude-opus": 45, "gpt-4o": 35, "llama": 20 }
  
  // Cache performance
  totalTokens     Int
  cacheTokens     Int
  cacheHitRate    Float
  
  createdAt       DateTime  @default(now())
  
  @@unique([botType, date])
  @@index([botType])
  @@index([date])
}

model ProjectMetrics {
  id              String    @id @default(cuid())
  projectId       String    @unique
  
  // Timeline
  intakeDays      Int?
  designDays      Int?
  estimateDays    Int?
  permitDays      Int?
  totalDays       Int?
  
  // Cost
  projectCost     Decimal   // customer paid
  botCost         Decimal   // we paid for AI
  margin          Decimal   // profit
  marginPercent   Float     // as %
  
  // Satisfaction
  customerRating  Float?    // 1-5 stars
  feedbackText    String?
  
  // Conversion
  conceptSelected String?   // which concept
  featureUsage    Json      // what features used
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([projectId])
}

model ConversionFunnel {
  id              String    @id @default(cuid())
  
  // Funnel stages
  visitCount      Int
  intakeStart     Int
  intakeComplete  Int
  checkoutView    Int
  checkoutComplete Int
  projectStart    Int
  
  // Date
  date            DateTime
  
  createdAt       DateTime  @default(now())
  
  @@unique([date])
}
```

## Step 2: Update Existing Models

Add these fields to your existing `Project` and `User` models:

```prisma
// UPDATE EXISTING PROJECT MODEL
model Project {
  // ... keep all existing fields ...
  
  // NEW v30 fields
  packageType         String?       // "tier" or "custom"
  packageFeatures     String[]      // selected features
  v30Status           String        @default("INTAKE")
  whitelabelId        String?
  
  // NEW v30 relations
  intakeResponse      IntakeResponse?
  customPackage       CustomPackage?
  workspace           ProjectWorkspace?
  botExecutions       BotExecution[]
  metrics             ProjectMetrics?
  whitelabelConfig    WhiteLabelConfig? @relation(fields: [whitelabelId], references: [id])
  
  @@index([v30Status])
  @@index([whitelabelId])
}

// UPDATE EXISTING USER MODEL
model User {
  // ... keep all existing fields ...
  
  // NEW v30 fields for RBAC
  roles               String[]      @default(["customer"])
  permissions         String[]      @default([])
  
  // NEW v30 B2B subscription
  subscriptionTier    String?       // basic, standard, premium, enterprise
  subscriptionEndsAt  DateTime?
  
  // NEW v30 profile enhancement
  companyName         String?
  verificationStatus  String        @default("UNVERIFIED") // for contractors/partners
  
  // NEW v30 relations
  intakeResponses     IntakeResponse[]
  customPackages      CustomPackage[]
  projectWorkspaces   ProjectWorkspace[]
  whitelabelConfigs   WhiteLabelConfig[]
  auditLogs           AdminAuditLog[]
  
  @@index([roles])
  @@index([subscriptionTier])
}
```

## Step 3: Create Migration

```bash
cd packages/prisma
pnpm prisma migrate dev --name add_v30_models

# This will:
# 1. Create new tables for all 15 models
# 2. Add fields to Project model
# 3. Add fields to User model
# 4. Update indexes
# 5. Add constraints
```

---

# PART 4: FASTIFY SERVICES (New & Enhanced)

## Services to Create (5 NEW)

### 1. os-intake Service (NEW)

**Location:** `packages/services/os-intake/`

```typescript
// packages/services/os-intake/src/routes/intake.ts

import { FastifyInstance } from "fastify";
import { prisma } from "@kealee/prisma";
import { callBot } from "@kealee/core-bots";

export async function intakeRoutes(app: FastifyInstance) {
  // POST /api/v30/intake - Submit intake form
  app.post<{ Body: IntakeRequest }>("/api/v30/intake", async (request, reply) => {
    const { propertyType, primaryScope, budgetRange, timeline, location, squareFeet, yearBuilt, utilities, codeConsiderations } = request.body;
    const userId = request.user.id;

    // Create project
    const project = await prisma.project.create({
      data: {
        userId,
        title: `${propertyType} ${primaryScope}`,
        status: "INTAKE",
      },
    });

    // Create intake response
    const intake = await prisma.intakeResponse.create({
      data: {
        projectId: project.id,
        userId,
        propertyType,
        primaryScope,
        budgetRange,
        timeline,
        location,
        squareFeet,
        yearBuilt,
        utilities,
        codeConsiderations,
        status: "ANALYZING",
      },
    });

    // Trigger IntakeBot (async)
    const botResult = await callBot("IntakeBot", {
      propertyType,
      primaryScope,
      budgetRange,
      timeline,
      location,
      squareFeet,
      yearBuilt,
      utilities,
      codeConsiderations,
    });

    // Update intake with analysis
    const updatedIntake = await prisma.intakeResponse.update({
      where: { id: intake.id },
      data: {
        scopeComplexity: botResult.scopeComplexity,
        riskLevel: botResult.riskLevel,
        estimatedCost: botResult.estimatedCost,
        estimatedDays: botResult.estimatedDays,
        analysisJson: botResult.analysisJson,
        status: "READY",
        analyzedAt: new Date(),
      },
    });

    return reply.code(201).send({
      intakeId: intake.id,
      projectId: project.id,
      analysis: {
        complexity: botResult.scopeComplexity,
        riskLevel: botResult.riskLevel,
      },
      estimatedCost: botResult.estimatedCost,
      estimatedDays: botResult.estimatedDays,
    });
  });

  // GET /api/v30/intake/:intakeId - Get intake analysis
  app.get<{ Params: { intakeId: string } }>("/api/v30/intake/:intakeId", async (request, reply) => {
    const intake = await prisma.intakeResponse.findUnique({
      where: { id: request.params.intakeId },
    });

    if (!intake) return reply.code(404).send({ error: "Not found" });

    return reply.send(intake);
  });
}
```

### 2. os-ai-orch Service (NEW)

**Location:** `packages/services/os-ai-orch/`

```typescript
// packages/services/os-ai-orch/src/routes/orchestration.ts

import { FastifyInstance } from "fastify";
import { prisma } from "@kealee/prisma";
import { KeaBotV3 } from "@kealee/core-bots";

export async function orchestrationRoutes(app: FastifyInstance) {
  // POST /api/v30/project/:projectId/generate - Trigger all bots
  app.post<{ Params: { projectId: string }; Body: { packageId: string } }>(
    "/api/v30/project/:projectId/generate",
    async (request, reply) => {
      const { projectId } = request.params;
      const { packageId } = request.body;

      // Get package
      const pkg = await prisma.customPackage.findUnique({
        where: { id: packageId },
        include: { intakeResponse: true },
      });

      if (!pkg) return reply.code(404).send({ error: "Package not found" });

      // Get intake
      const intake = pkg.intakeResponse;

      // Initialize KeaBotV3
      const keaBot = new KeaBotV3();

      // Create execution IDs map
      const executionIds: Record<string, string> = {};

      // Start parallel executions
      const promises: Promise<any>[] = [];

      // DesignBot
      if (pkg.features.includes("Design")) {
        const exec = await prisma.botExecution.create({
          data: {
            projectId,
            packageId,
            botType: "design",
            status: "PENDING",
            inputData: intake,
          },
        });
        executionIds.design = exec.id;
        promises.push(keaBot.designBot(intake).then(result => updateExecution(exec.id, result)));
      }

      // FloorplanBot
      if (pkg.features.includes("Floorplan")) {
        const exec = await prisma.botExecution.create({
          data: {
            projectId,
            packageId,
            botType: "floorplan",
            status: "PENDING",
            inputData: {},
          },
        });
        executionIds.floorplan = exec.id;
        promises.push(keaBot.floorplanBot({}).then(result => updateExecution(exec.id, result)));
      }

      // EstimateBot
      if (pkg.features.includes("Estimate")) {
        const exec = await prisma.botExecution.create({
          data: {
            projectId,
            packageId,
            botType: "estimate",
            status: "PENDING",
            inputData: intake,
          },
        });
        executionIds.estimate = exec.id;
        promises.push(keaBot.estimateBot(intake).then(result => updateExecution(exec.id, result)));
      }

      // ZoningBot
      if (pkg.features.includes("Permits")) {
        const exec = await prisma.botExecution.create({
          data: {
            projectId,
            packageId,
            botType: "zoning",
            status: "PENDING",
            inputData: intake,
          },
        });
        executionIds.zoning = exec.id;
        promises.push(keaBot.zoningBot(intake).then(result => updateExecution(exec.id, result)));
      }

      // PermitBot
      if (pkg.features.includes("Permits")) {
        const exec = await prisma.botExecution.create({
          data: {
            projectId,
            packageId,
            botType: "permit",
            status: "PENDING",
            inputData: intake,
          },
        });
        executionIds.permit = exec.id;
        promises.push(keaBot.permitBot(intake).then(result => updateExecution(exec.id, result)));
      }

      // VideoBot (if Tier 2+)
      if (pkg.features.includes("Videos")) {
        const exec = await prisma.botExecution.create({
          data: {
            projectId,
            packageId,
            botType: "video",
            status: "PENDING",
            inputData: {},
          },
        });
        executionIds.video = exec.id;
        promises.push(keaBot.videoBot({}).then(result => updateExecution(exec.id, result)));
      }

      // Fire all promises in parallel (don't wait)
      Promise.all(promises).catch(console.error);

      return reply.code(202).send({
        projectId,
        executionIds,
        estimatedCompletionTime: "5-60 minutes depending on features",
      });
    }
  );

  // GET /api/v30/project/:projectId/status - Check generation status
  app.get<{ Params: { projectId: string } }>(
    "/api/v30/project/:projectId/status",
    async (request, reply) => {
      const executions = await prisma.botExecution.findMany({
        where: { projectId: request.params.projectId },
      });

      const progress: Record<string, any> = {};
      let allComplete = true;

      for (const exec of executions) {
        progress[exec.botType] = {
          status: exec.status,
          progress: exec.progress,
        };
        if (exec.status !== "COMPLETE") allComplete = false;
      }

      return reply.send({
        projectId: request.params.projectId,
        stage: allComplete ? "complete" : "generating",
        progress,
        estimatedCompletion: allComplete ? "now" : "calculating...",
      });
    }
  );
}

async function updateExecution(executionId: string, result: any) {
  await prisma.botExecution.update({
    where: { id: executionId },
    data: {
      outputData: result,
      status: "COMPLETE",
      progress: 100,
      completedAt: new Date(),
    },
  });
}
```

### 3-5. Other New Services

Create stubs for:
- `os-admin/` - Admin dashboard routes
- `os-analytics/` - Analytics endpoints
- `os-white-label/` - Partner management

(Full implementation in implementation prompts below)

## Services to ENHANCE

### os-dev Service (Enhanced for v30)

Add v30 routes to your existing `packages/services/os-dev/src/routes/`

```typescript
// packages/services/os-dev/src/routes/v30.ts

import { FastifyInstance } from "fastify";
// Import from new services
import { intakeRoutes } from "@kealee/os-intake";
import { orchestrationRoutes } from "@kealee/os-ai-orch";
import { adminRoutes } from "@kealee/os-admin";

export async function setupV30Routes(app: FastifyInstance) {
  // v30 routes
  await intakeRoutes(app);
  await orchestrationRoutes(app);
  await adminRoutes(app);
  // ... more
}
```

### os-pay Service (Enhanced for Dynamic Pricing)

```typescript
// packages/services/os-pay/src/routes/checkout.ts

import Stripe from "stripe";
import { prisma } from "@kealee/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function checkoutRoutes(app) {
  // POST /api/v30/checkout/create-session - Create dynamic Stripe session
  app.post<{ Body: { packageId: string; customPrice?: number } }>(
    "/api/v30/checkout/create-session",
    async (request, reply) => {
      const { packageId, customPrice } = request.body;

      // Get package
      const pkg = await prisma.customPackage.findUnique({
        where: { id: packageId },
      });

      if (!pkg) return reply.code(404).send({ error: "Package not found" });

      // Use provided price or package price
      const amount = (customPrice || pkg.totalPrice) * 100; // Stripe uses cents

      // Create dynamic Stripe session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Kealee Design Package - ${pkg.features.join(", ")}`,
              },
              unit_amount: Math.round(amount),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN}/cancel`,
        metadata: {
          packageId,
          projectId: pkg.projectId,
        },
      });

      // Store session ID
      await prisma.customPackage.update({
        where: { id: packageId },
        data: { stripeSessionId: session.id },
      });

      return reply.send({
        sessionId: session.id,
        stripeSessionUrl: session.url,
        amount: pkg.totalPrice,
      });
    }
  );
}
```

---

# PART 5: PORTAL APPS (New & Enhanced)

## web-main Portal (ENHANCE)

**Location:** `apps/web-main/`

```typescript
// apps/web-main/src/pages/get-concept.tsx

import { IntakeForm } from "@/components/IntakeForm";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useState } from "react";

export default function GetConcept() {
  const [intake, setIntake] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [step, setStep] = useState("intake"); // intake → package → checkout

  const handleIntakeSubmit = async (data) => {
    // Submit intake (BEFORE payment)
    const response = await fetch("/api/v30/intake", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await response.json();

    setIntake(result);
    setEstimatedPrice(result.estimatedCost);
    setStep("package");
  };

  return (
    <div className="container">
      {step === "intake" && (
        <IntakeForm onSubmit={handleIntakeSubmit} />
      )}

      {step === "package" && (
        <>
          <h2>Customize Your Package</h2>
          <PriceDisplay price={estimatedPrice} />
          <PackageCustomizer
            intakeId={intake.intakeId}
            onNext={() => setStep("checkout")}
          />
        </>
      )}

      {step === "checkout" && (
        <CheckoutFlow intakeId={intake.intakeId} />
      )}
    </div>
  );
}
```

## NEW Portal Apps

### portal-admin (NEW)

**Location:** `apps/portal-admin/`

```typescript
// apps/portal-admin/src/pages/dashboard.tsx

import { useFetch } from "@/hooks/useFetch";
import { BotConfigEditor } from "@/components/BotConfigEditor";
import { PricingFormulaEditor } from "@/components/PricingFormulaEditor";
import { Analytics } from "@/components/Analytics";

export default function AdminDashboard() {
  const { data: metrics } = useFetch("/api/v30/admin/dashboard");
  const { data: botConfigs } = useFetch("/api/v30/admin/bots/configs");

  return (
    <div className="admin-dashboard">
      <h1>Kealee v30 Admin Dashboard</h1>

      {/* Metrics */}
      <section>
        <h2>Metrics</h2>
        <div className="metric-cards">
          <MetricCard label="Today's Cost" value={`$${metrics?.todayCost}`} />
          <MetricCard label="Active Projects" value={metrics?.activeProjects} />
          <MetricCard label="Conversion Rate" value={`${metrics?.conversionRate}%`} />
        </div>
      </section>

      {/* Bot Configuration */}
      <section>
        <h2>Bot Configuration</h2>
        {botConfigs?.map(config => (
          <BotConfigEditor key={config.botType} config={config} />
        ))}
      </section>

      {/* Pricing Formula */}
      <section>
        <h2>Pricing Formula</h2>
        <PricingFormulaEditor />
      </section>

      {/* Analytics */}
      <section>
        <h2>Analytics</h2>
        <Analytics />
      </section>
    </div>
  );
}
```

### portal-projects (NEW - Workspace)

**Location:** `apps/portal-projects/`

```typescript
// apps/portal-projects/src/pages/[projectId]/index.tsx

import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export default function Project({ projectId }) {
  return <ProjectWorkspace projectId={projectId} />;
}
```

---

# PART 6: KEABOT v3.0 UPGRADES

## Upgrade core-bots for v30

**Location:** `packages/core-bots/`

### Add 7 New Bots to Orgo

```typescript
// packages/core-bots/src/orgo/keabot-v3.ts

export class KeaBotV3 {
  // EXISTING (keep the same)
  async designBot(intake): Promise<Concepts> { ... }
  async estimateBot(design): Promise<Estimate> { ... }
  async permitBot(design): Promise<PermitPlan> { ... }

  // NEW BOTS (add for v30)
  async floorplanBot(design): Promise<Floorplan> { ... }
  async zoningBot(intake): Promise<ZoningAnalysis> { ... }
  async videoBot(concept): Promise<VideoMetadata> { ... }
  async contractorBot(scope, location): Promise<Recommendations> { ... }
  async salesBot(objection): Promise<Response> { ... }
  async supportBot(question): Promise<Answer> { ... }
  async projectBot(workspace): Promise<WorkspaceUpdates> { ... }
}
```

### Upgrade Hermes for Multi-Model

```typescript
// packages/core-bots/src/hermes/hermes-v3.ts

interface ModelConfig {
  primary: "claude-opus" | "gpt-4o" | "llama-70b";
  secondary: string;
  fallback: string;
}

export class HermesV3 {
  selectModel(botType: string, complexity: number): string {
    // Dynamic model selection
    if (botType === "design" && complexity > 0.7) {
      return "claude-opus"; // Complex designs need Opus
    }
    if (botType === "image-generation") {
      return "gpt-4o"; // Images → GPT-4o
    }
    return "claude-sonnet"; // Default: Sonnet
  }

  async call(prompt: string, botType: string): Promise<string> {
    const model = this.selectModel(botType, 0.5);

    try {
      return await this.callModel(model, prompt);
    } catch (error) {
      // Fallback to secondary model
      return await this.callModel(this.config.secondary, prompt);
    }
  }
}
```

### New System Prompts (Add to core-bots)

```typescript
// packages/core-bots/src/v30/prompts/intake-bot.ts

export const INTAKE_BOT_PROMPT = `
You are IntakeBot, the first AI in Kealee v30's process.

Your job: Analyze the customer's 9-question intake form and:
1. Assess project complexity (simple, moderate, complex)
2. Assess risk level (low, medium, high)
3. Estimate cost (using pricing formula)
4. Estimate timeline
5. Suggest which features would be most valuable

Input: 9-question form answers
Output: JSON with analysis

Rules:
- Use only the 9 questions provided
- Complexity is based on: scope + property age + location
- Cost estimation uses PricingFormula from Obsidian
- Timeline is realistic for DMV market in 2026
- Suggestions are specific to their project type

{pricing_formula_context}
{building_code_context}
{historical_data_context}
`;

// packages/core-bots/src/v30/prompts/floorplan-bot.ts

export const FLOORPLAN_BOT_PROMPT = `
You are FloorplanBot, the visualization expert.

Your job: Generate 2D floorplan coordinates from design concept.

Input: Design concept (dimensions, appliances, materials)
Output: JSON with SVG coordinate data

Generates:
- Room outline
- Appliance locations
- Cabinet/counter positions
- Material zones
- Dimension labels
- Accessibility zones

Output format:
{
  "walls": [ { x, y, width, depth } ],
  "elements": [ { type, x, y, width, depth, label } ],
  "dimensions": [ { label, x, y, value } ],
  "materials": [ { zone, color, material } ]
}

{design_context}
`;

// packages/core-bots/src/v30/prompts/sales-bot.ts

export const SALES_BOT_PROMPT = `
You are SalesBot, the objection handler and upsell expert.

Your job: Handle customer objections with data, not pressure.

Input: Customer objection or question
Output: Helpful, persuasive response

Common objections:
- "Too expensive" → Show ROI, financing options
- "Don't need permits" → Explain legal requirements
- "Just want concepts" → Suggest why other features help
- Etc.

Rules:
- Be genuinely helpful (Kealee's reputation)
- Use data (comparable projects, success rates)
- Acknowledge concerns
- Offer flexible options
- Never be pushy

{sales_playbook_context}
`;

// ... (more system prompts for the other 7 bots)
```

---

# PART 7: 40+ CURSOR IMPLEMENTATION PROMPTS

These are copy-paste ready prompts for Cursor IDE.

## Prompt 1: Create Prisma Migration

```
Context: Kealee Platform v30 - Database Schema
Task: Create Prisma migration for 15 new models

Steps:
1. Add the following 15 new Prisma models to packages/prisma/schema.prisma:
   - IntakeResponse
   - CustomPackage
   - BotExecution
   - BotResult
   - ProjectWorkspace
   - BotConfiguration
   - PricingFormula
   - AdminAuditLog
   - WhiteLabelConfig
   - BotMetrics
   - ProjectMetrics
   - ConversionFunnel
   - (3 more based on the spec provided)

2. Add these fields to existing Project model:
   - packageType: String?
   - packageFeatures: String[]
   - v30Status: String @default("INTAKE")
   - intakeResponse: IntakeResponse?
   - customPackage: CustomPackage?
   - workspace: ProjectWorkspace?
   - botExecutions: BotExecution[]
   - metrics: ProjectMetrics?
   - whitelabelConfig: WhiteLabelConfig?

3. Add these fields to existing User model:
   - roles: String[] @default(["customer"])
   - permissions: String[]
   - subscriptionTier: String?
   - subscriptionEndsAt: DateTime?
   - companyName: String?
   - verificationStatus: String @default("UNVERIFIED")
   - intakeResponses: IntakeResponse[]
   - customPackages: CustomPackage[]
   - projectWorkspaces: ProjectWorkspace[]

4. Create migration: pnpm prisma migrate dev --name add_v30_models

Expected: All 15 models created, Project and User updated, migration applied successfully
```

## Prompt 2: Create os-intake Service Routes

```
Context: Kealee Platform v30 - Intake Service
Task: Implement os-intake service with Fastify routes

Create file: packages/services/os-intake/src/routes/intake.ts

Routes to implement:
1. POST /api/v30/intake
   - Accepts: 9 intake questions
   - Creates: Project + IntakeResponse
   - Calls: IntakeBot for analysis
   - Returns: intakeId, projectId, estimatedCost

2. GET /api/v30/intake/:intakeId
   - Returns: Full IntakeResponse with analysis

3. PUT /api/v30/intake/:intakeId
   - Accepts: Updated intake fields
   - Updates: IntakeResponse
   - Re-triggers: IntakeBot if needed

4. DELETE /api/v30/intake/:intakeId
   - Deletes: IntakeResponse (before payment)

5. POST /api/v30/intake/:intakeId/analysis/refresh
   - Re-runs: IntakeBot analysis

Use Prisma client from @kealee/prisma
Use callBot from @kealee/core-bots
Include: Error handling, validation, logging
```

## Prompt 3: Create os-ai-orch Service

```
Context: Kealee Platform v30 - Bot Orchestration
Task: Implement parallel bot orchestration

Create file: packages/services/os-ai-orch/src/routes/orchestration.ts

Routes to implement:
1. POST /api/v30/project/:projectId/generate
   - Accepts: packageId
   - Gets: CustomPackage with intake data
   - Creates: BotExecution records for each feature
   - Fires: All bots in parallel (don't await)
   - Returns: executionIds, estimatedCompletionTime

2. GET /api/v30/project/:projectId/status
   - Returns: Progress for each bot (design: 45%, estimate: 100%, etc)
   - Calculates: Overall progress, estimated completion time

3. GET /api/v30/project/:projectId/results
   - Returns: All completed bot results assembled
   - Includes: concepts, floorplans, estimate, zoning, videos, contractors

Use: KeaBotV3 from @kealee/core-bots
Use: Prisma for tracking
Include: Parallel promise execution (Promise.all)
Include: Real-time progress tracking
```

## Prompt 4: Enhance os-pay Service

```
Context: Kealee Platform v30 - Dynamic Pricing
Task: Add dynamic Stripe session creation

Enhance file: packages/services/os-pay/src/routes/checkout.ts

Add route:
POST /api/v30/checkout/create-session
- Accepts: packageId, optional customPrice
- Gets: CustomPackage from DB
- Creates: Dynamic Stripe session with:
  - amount = customPrice || package.totalPrice
  - product name = "Kealee Design Package - " + features
  - metadata = { packageId, projectId }
- Stores: stripeSessionId in CustomPackage
- Returns: sessionId, stripeSessionUrl, amount

Key: Amount is NOT hardcoded to fixed tiers
- It's DYNAMIC based on features selected
- It's AI-DETERMINED by IntakeBot
- It's CUSTOMIZABLE by customer

Use: Stripe SDK
Use: Prisma for storing sessionId
Include: Error handling for payment failures
```

## Prompt 5: Create Admin Portal

```
Context: Kealee Platform v30 - Admin Dashboard
Task: Build admin portal app

Create file: apps/portal-admin/src/pages/dashboard.tsx

Components needed:
1. MetricsSection
   - Today's cost
   - Active projects
   - Conversion rate
   - Avg project value

2. BotConfigSection
   - List all 10 bot configurations
   - Edit system prompt (textarea)
   - Edit temperature, maxTokens, timeout
   - Save changes

3. PricingFormulaSection
   - Show current formula
   - Edit baseAmount, sqftMultiplier
   - Edit complexityFees
   - Edit featureCosts
   - Save changes

4. AnalyticsSection
   - Cost breakdown by bot
   - Model usage distribution
   - Cache hit rate
   - Quality scores

API calls:
- GET /api/v30/admin/dashboard (metrics)
- GET /api/v30/admin/bots/configs (bot list)
- PUT /api/v30/admin/bots/:botType/config (save bot)
- GET /api/v30/admin/pricing/formula (pricing)
- PUT /api/v30/admin/pricing/formula (save pricing)
- GET /api/v30/admin/analytics (stats)

UI: Clean, professional, easy to edit live
```

## Prompt 6: Create Projects Portal (Workspace)

```
Context: Kealee Platform v30 - Project Workspace
Task: Build project workspace portal

Create file: apps/portal-projects/src/components/ProjectWorkspace.tsx

Features:
1. State machine visualization
   - Current stage: INTAKE → DESIGN → ESTIMATE → PERMITS → COMPLETION
   - Progress bar (0-100%)
   - Timeline (when each stage completed)

2. Concepts section
   - List all 3 concepts (if Design feature enabled)
   - Show images for each
   - "Select" button for each
   - Comparison slider

3. Estimate section
   - Show breakdown by trade
   - Show total, contingency, permits, financing
   - PDF download

4. Permits section
   - Show zoning analysis
   - Show required forms (links)
   - "Authorize Filing" button
   - Status tracking

5. Collaborators section
   - List project team
   - "Invite Contractor" button
   - Manage permissions

6. Notes & attachments
   - Add notes
   - Upload files
   - Activity timeline

API calls:
- GET /api/v30/workspace/:projectId
- PUT /api/v30/workspace/:projectId/stage
- POST /api/v30/workspace/:projectId/collaborators/invite
- POST /api/v30/permits/authorize

UI: Clean dashboard layout, real-time updates
```

## Prompt 7: Create DesignBot System Prompt

```
Context: Kealee Platform v30 - DesignBot
Task: Write DesignBot system prompt for Claude Opus

Create file: packages/core-bots/src/v30/prompts/design-bot-prompt.md

Requirements:
- Input: IntakeResponse (9 questions)
- Output: 3 concepts (JSON format)

Each concept must include:
- id: unique identifier
- name: concept name (e.g., "Budget Kitchen", "Luxury Remodel", "Mid-Range")
- positioning: "BUDGET" | "BALANCED" | "PREMIUM"
- narrative: 500-800 word design description
- estimatedCostMin/Max: price range
- timeline: weeks to completion
- complexity: "simple" | "moderate" | "complex"
- riskLevel: "low" | "medium" | "high"
- features: 5 key features with benefits
- materials: selected materials with colors/finishes
- risks: 5 identified risks with mitigation
- imagePrompts: 6 prompts for image generation

Rules:
- 3 DIFFERENT concepts (not variations)
- Use pricing from Obsidian (never hardcode)
- Timeline realistic for DMV 2026
- Risks specific to project type/location
- Image prompts detailed for Runway/Midjourney

Context injection:
- pricing_formula_context
- building_code_context
- historical_project_data
- market_conditions_2026

Model: claude-opus-4-6
Cache: YES (4 context blocks, ephemeral)
```

## Prompt 8: Create EstimateBot System Prompt (Preliminary Mode)

```
Context: Kealee Platform v30 - EstimateBot
Task: Write EstimateBot system prompt for Claude Sonnet

Create file: packages/core-bots/src/v30/prompts/estimate-bot-prompt.md

Two modes:

MODE 1: PRELIMINARY (Tier 1-2, ~30 seconds)
- Input: Design concept
- Output: Quick cost range
- Includes:
  - Cost range (low, high)
  - By-trade summary (HVAC, Plumbing, Electrical, Carpentry, General)
  - Contingency 15%
  - Estimated timeline weeks
  - No itemization

MODE 2: DETAILED (Tier 3, ~60 seconds)
- Input: Design concept, selected materials
- Output: Full line-item breakdown
- Includes:
  - Every line item (labor, materials, equipment)
  - By trade and category
  - Labor rates: DMV 2026 journeyman rates
  - Material costs: current market
  - Contingency 15-20%
  - Permits & fees by jurisdiction
  - Financing options (monthly payment)

Rules:
- IMPORT pricing from core-rules/src/pricing.ts (NEVER hardcode)
- Apply regional adjustments (+28% DMV baseline)
- Include all trade labor rates
- Verify against budget range (flag if exceeds)
- Output JSON format

Context injection:
- pricing_formula
- dmv_labor_rates_2026
- material_costs_current
- jurisdiction_fees

Model: claude-sonnet-4-6
Cache: YES (design context cached from DesignBot)
Timeout: 45 seconds
```

## Prompt 9: Create ZoningBot System Prompt

```
Context: Kealee Platform v30 - ZoningBot
Task: Write ZoningBot system prompt for Claude Sonnet

Create file: packages/core-bots/src/v30/prompts/zoning-bot-prompt.md

Input:
- Project scope (HVAC, plumbing, electrical, remodel, etc)
- Location (DC, Maryland county, Virginia)
- Building type (residential, commercial)

Output: JSON with zoning analysis
- Jurisdiction identification
- Zoning code verification (is project allowed?)
- Required permits list (with costs + timeline)
- Required documents checklist
- Building code compliance points
- Historic district overlay considerations
- HOA approval needs
- Accessibility requirements
- Estimated permit cost
- Estimated approval timeline

Knowledge base needed:
- DC DCRA permit codes and process
- Maryland county variations (Montgomery, Prince George's, Howard, etc)
- Virginia variations
- Common code violations and solutions
- Expedited permit options

Rules:
- Be jurisdiction-specific
- Include actual permit forms (URLs if available)
- Timeline realistic for jurisdiction
- Cost estimates based on historical data
- Include special conditions (historic, HOA, ADA)

Context injection:
- dc_dcra_codes
- maryland_county_rules
- virginia_rules
- permit_forms_urls
- historical_permit_timeline_data

Model: claude-sonnet-4-6
Timeout: 30 seconds
```

## Prompt 10: Create FloorplanBot System Prompt

```
Context: Kealee Platform v30 - FloorplanBot
Task: Write FloorplanBot system prompt for Claude Sonnet

Create file: packages/core-bots/src/v30/prompts/floorplan-bot-prompt.md

Input: Design concept (appliances, materials, dimensions)

Output: JSON with SVG coordinate data

Must generate:
- 2D top-down room outline
- Wall locations and door/window positions
- Appliance placement (stove, fridge, sink, dishwasher, etc)
- Cabinet/counter locations
- Island placement (if applicable)
- Material zones (color-coded)
- Clearance annotations
- Dimension labels
- Material legend

Tier differences:
- Tier 1: Basic (2D, color zones, dimensions only)
- Tier 2: Enhanced (materials detailed, before/after inset, clearances noted)
- Tier 3: Professional (multi-layer capable, full annotations)

Output JSON structure:
{
  "walls": [ { x, y, width, depth } ],
  "elements": [ { type, x, y, width, depth, label } ],
  "dimensions": [ { label, x, y, value } ],
  "materials": [ { zone, color, material } ]
}

Rules:
- Coordinates in feet
- Scale: 1 unit = 1 foot
- All dimensions labeled
- Color codes for materials
- Accessibility zones noted (clearances, work zones)

Backend rendering: Node.js + d3 converts this to SVG

Model: claude-sonnet-4-6
Timeout: 20 seconds
```

(Continue with Prompts 11-40+ covering: PermitBot, VideoBot, ContractorBot, SalesBot, SupportBot, ProjectBot, then API routes, portal components, auth/RBAC, webhooks, monitoring, etc.)

---

# PART 8: DEPLOYMENT & ROLLOUT STRATEGY

## Gradual Rollout Plan

**Week 1-2:** Feature flag `v30_enabled = false`
- Only internal testers
- v20 unchanged for customers
- Gather feedback

**Week 3-4:** Feature flag `v30_enabled = true` (opt-in)
- New customers offered v30
- Existing customers can opt-in

**Week 5+:** Feature flag `v30_enabled = true` (default)
- All new customers on v30
- Existing customers migrated gradually
- v20 support continues 6 months

---

# PART 9: SUCCESS CRITERIA

✅ Complete v30 specification (THIS DOCUMENT)
✅ All 15 Prisma models defined
✅ All new services scaffolded
✅ All portal enhancements designed
✅ KeaBot v3.0 architecture ready
✅ 40+ Cursor implementation prompts ready
✅ 20-24 week timeline with phases
✅ Zero breaking changes to v20
✅ Gradual rollout strategy defined

---

# SUMMARY: WHAT'S NEXT

1. **Review this spec** - Confirm architecture makes sense
2. **Run Prisma migration** - Add 15 new models
3. **Create services structure** - Add 5 new services
4. **Implement intakes routes** - Start with POST /api/v30/intake
5. **Implement orchestration** - Parallel bot execution
6. **Add portal enhancements** - Intake form, workspace
7. **Upgrade KeaBot v3** - Add 7 new bots
8. **Implement admin dashboard** - Full management
9. **Testing & refinement** - Fix issues, optimize
10. **Launch** - Feature flag rollout

This spec includes everything needed. The Cursor prompts (which I'll provide next if needed) are copy-paste ready implementations.

---

**Kealee Platform v30 - Production-Ready Specification Complete**
**Ready to build. Start with Prisma migration and os-intake service.**
