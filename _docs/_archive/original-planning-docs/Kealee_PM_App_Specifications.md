# KEALEE PM MODULE - AUTOMATION APP SPECIFICATIONS
## Complete Technical Blueprint for 14 Micro-Applications

---

# TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Priority 1 Apps](#2-priority-1-apps-build-first)
3. [Priority 2 Apps](#3-priority-2-apps-build-second)
4. [Priority 3 Apps](#4-priority-3-apps-core-features)
5. [Priority 4 Apps](#5-priority-4-apps-ai-layer)
6. [Shared Infrastructure](#6-shared-infrastructure)
7. [Deployment Guide](#7-deployment-guide)

---

# 1. ARCHITECTURE OVERVIEW

## 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KEALEE PLATFORM v10                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   os-pm (FE)    │  │  os-admin (FE)  │  │  m-* apps (FE)  │     │
│  │   PM Dashboard  │  │   Admin Panel   │  │   Client Apps   │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                    │
│                    ┌───────────▼───────────┐                       │
│                    │      API Gateway      │                       │
│                    │       (Fastify)       │                       │
│                    └───────────┬───────────┘                       │
│                                │                                    │
│  ┌─────────────────────────────┼─────────────────────────────────┐ │
│  │              AUTOMATION LAYER (NEW)                            │ │
│  │                                                                │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│ │
│  │  │  BullMQ     │ │  Temporal   │ │   Redis     │ │  Cron    ││ │
│  │  │  Job Queue  │ │  Workflows  │ │  Pub/Sub    │ │ Scheduler││ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │                   14 AUTOMATION APPS                     │ │ │
│  │  │  APP-01 Bid Engine    │ APP-08 Communication Hub       │ │ │
│  │  │  APP-02 Visit Sched   │ APP-09 Task Queue Manager      │ │ │
│  │  │  APP-03 Change Order  │ APP-10 Document Generator      │ │ │
│  │  │  APP-04 Report Gen    │ APP-11 Predictive Engine       │ │ │
│  │  │  APP-05 Permit Track  │ APP-12 Smart Scheduler         │ │ │
│  │  │  APP-06 Inspection    │ APP-13 QA Inspector            │ │ │
│  │  │  APP-07 Budget Track  │ APP-14 Decision Support        │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                │                                    │
│                    ┌───────────▼───────────┐                       │
│                    │     Data Layer        │                       │
│                    │  Supabase + Prisma    │                       │
│                    └───────────────────────┘                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.2 Directory Structure

```
packages/
└── automation/
    ├── apps/
    │   ├── bid-engine/              # APP-01
    │   ├── visit-scheduler/         # APP-02
    │   ├── change-order/            # APP-03
    │   ├── report-generator/        # APP-04
    │   ├── permit-tracker/          # APP-05
    │   ├── inspection-coordinator/  # APP-06
    │   ├── budget-tracker/          # APP-07
    │   ├── communication-hub/       # APP-08
    │   ├── task-queue/              # APP-09
    │   ├── document-generator/      # APP-10
    │   ├── predictive-engine/       # APP-11
    │   ├── smart-scheduler/         # APP-12
    │   ├── qa-inspector/            # APP-13
    │   └── decision-support/        # APP-14
    │
    ├── shared/
    │   ├── queue/                   # BullMQ setup
    │   ├── workflows/               # Temporal workflows
    │   ├── events/                  # Event bus
    │   ├── ai/                      # AI/ML utilities
    │   └── integrations/            # Third-party APIs
    │
    └── workers/                     # Background workers
```

## 1.3 Database Schema Additions

```prisma
// Add to existing schema.prisma

// Task Management
model AutomationTask {
  id            String   @id @default(uuid())
  type          String   // bid_collection, site_visit, report, etc.
  status        TaskStatus @default(PENDING)
  priority      Int      @default(5)
  projectId     String?
  clientId      String?
  assignedPmId  String?
  payload       Json
  result        Json?
  scheduledAt   DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  dueAt         DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  project       Project? @relation(fields: [projectId], references: [id])
  client        Client?  @relation(fields: [clientId], references: [id])
  assignedPm    User?    @relation(fields: [assignedPmId], references: [id])
  
  @@index([status, priority])
  @@index([assignedPmId, status])
  @@index([projectId])
  @@index([scheduledAt])
}

enum TaskStatus {
  PENDING
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}

// Bid Management
model BidRequest {
  id              String   @id @default(uuid())
  projectId       String
  scope           Json
  requirements    Json
  deadline        DateTime
  status          BidStatus @default(OPEN)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  project         Project  @relation(fields: [projectId], references: [id])
  invitations     BidInvitation[]
  submissions     BidSubmission[]
  
  @@index([projectId])
  @@index([status])
}

model BidInvitation {
  id              String   @id @default(uuid())
  bidRequestId    String
  contractorId    String
  sentAt          DateTime @default(now())
  viewedAt        DateTime?
  respondedAt     DateTime?
  status          InvitationStatus @default(SENT)
  
  bidRequest      BidRequest @relation(fields: [bidRequestId], references: [id])
  contractor      Contractor @relation(fields: [contractorId], references: [id])
  
  @@index([bidRequestId])
  @@index([contractorId])
}

model BidSubmission {
  id              String   @id @default(uuid())
  bidRequestId    String
  contractorId    String
  amount          Decimal
  timeline        Json
  scope           Json
  attachments     Json?
  submittedAt     DateTime @default(now())
  score           Decimal?
  recommendation  String?
  
  bidRequest      BidRequest @relation(fields: [bidRequestId], references: [id])
  contractor      Contractor @relation(fields: [contractorId], references: [id])
  
  @@index([bidRequestId])
}

// Site Visits
model SiteVisit {
  id              String   @id @default(uuid())
  projectId       String
  pmId            String
  scheduledAt     DateTime
  completedAt     DateTime?
  status          VisitStatus @default(SCHEDULED)
  type            String   // assessment, progress, inspection, final
  checklistId     String?
  notes           String?
  photos          Json?
  reportId        String?
  
  project         Project  @relation(fields: [projectId], references: [id])
  pm              User     @relation(fields: [pmId], references: [id])
  
  @@index([projectId])
  @@index([pmId, scheduledAt])
}

// Permits
model Permit {
  id              String   @id @default(uuid())
  projectId       String
  jurisdictionId  String
  type            String   // building, electrical, plumbing, etc.
  applicationNo   String?
  status          PermitStatus @default(PREPARING)
  submittedAt     DateTime?
  approvedAt      DateTime?
  expiresAt       DateTime?
  fees            Decimal?
  documents       Json?
  comments        Json?    // plan review comments
  
  project         Project  @relation(fields: [projectId], references: [id])
  jurisdiction    Jurisdiction @relation(fields: [jurisdictionId], references: [id])
  inspections     Inspection[]
  
  @@index([projectId])
  @@index([status])
}

model Inspection {
  id              String   @id @default(uuid())
  permitId        String
  type            String   // foundation, framing, electrical, final, etc.
  scheduledAt     DateTime?
  completedAt     DateTime?
  status          InspectionStatus @default(PENDING)
  result          String?  // PASS, FAIL, PARTIAL
  notes           String?
  corrections     Json?
  
  permit          Permit   @relation(fields: [permitId], references: [id])
  
  @@index([permitId])
  @@index([scheduledAt])
}

// Change Orders
model ChangeOrder {
  id              String   @id @default(uuid())
  projectId       String
  contractId      String
  number          Int
  description     String
  reason          String
  requestedBy     String   // client, contractor, pm
  amount          Decimal
  scheduleImpact  Int?     // days
  status          ChangeOrderStatus @default(DRAFT)
  approvedAt      DateTime?
  approvedBy      String?
  
  project         Project  @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
  @@index([status])
}

// Reports
model Report {
  id              String   @id @default(uuid())
  projectId       String
  type            String   // daily, weekly, biweekly, monthly, final
  periodStart     DateTime
  periodEnd       DateTime
  content         Json
  photos          Json?
  generatedAt     DateTime @default(now())
  sentAt          DateTime?
  
  project         Project  @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
  @@index([type, generatedAt])
}

// Predictions (AI)
model Prediction {
  id              String   @id @default(uuid())
  projectId       String
  type            String   // delay, cost_overrun, quality_issue
  probability     Decimal
  impact          String   // low, medium, high, critical
  description     String
  recommendedAction String?
  acknowledged    Boolean  @default(false)
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())
  
  project         Project  @relation(fields: [projectId], references: [id])
  
  @@index([projectId, type])
  @@index([acknowledged])
}

enum BidStatus {
  OPEN
  CLOSED
  EVALUATING
  AWARDED
  CANCELLED
}

enum InvitationStatus {
  SENT
  VIEWED
  SUBMITTED
  DECLINED
  EXPIRED
}

enum VisitStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  RESCHEDULED
}

enum PermitStatus {
  PREPARING
  SUBMITTED
  IN_REVIEW
  REVISIONS_REQUIRED
  APPROVED
  EXPIRED
  REJECTED
}

enum InspectionStatus {
  PENDING
  SCHEDULED
  PASSED
  FAILED
  CORRECTION_REQUIRED
  REINSPECTION_SCHEDULED
}

enum ChangeOrderStatus {
  DRAFT
  PRICING_REQUESTED
  PRICING_RECEIVED
  PENDING_APPROVAL
  APPROVED
  REJECTED
  EXECUTED
}
```

---

# 2. PRIORITY 1 APPS (BUILD FIRST)

## APP-01: Contractor Bid Engine

### Purpose
Automate the complete contractor selection process from sourcing to recommendation.

### File Structure
```
packages/automation/apps/bid-engine/
├── src/
│   ├── index.ts                 # Main exports
│   ├── matching/
│   │   ├── contractor-matcher.ts
│   │   └── scoring-algorithm.ts
│   ├── collection/
│   │   ├── bid-request-builder.ts
│   │   ├── invitation-sender.ts
│   │   └── submission-collector.ts
│   ├── analysis/
│   │   ├── bid-analyzer.ts
│   │   ├── comparison-generator.ts
│   │   └── recommendation-engine.ts
│   ├── verification/
│   │   ├── license-verifier.ts
│   │   ├── insurance-verifier.ts
│   │   └── reference-checker.ts
│   ├── workflows/
│   │   └── bid-workflow.ts       # Temporal workflow
│   └── api/
│       └── routes.ts
├── tests/
└── package.json
```

### Core Implementation

```typescript
// packages/automation/apps/bid-engine/src/matching/contractor-matcher.ts

import { prisma } from '@kealee/database';
import { Project, Contractor } from '@prisma/client';

interface MatchCriteria {
  projectId: string;
  trades: string[];
  location: { lat: number; lng: number };
  budgetRange: { min: number; max: number };
  timeline: { start: Date; end: Date };
  minRating?: number;
}

interface MatchResult {
  contractor: Contractor;
  score: number;
  matchReasons: string[];
  distance: number;
  availability: boolean;
}

export class ContractorMatcher {
  private readonly MAX_DISTANCE_MILES = 50;
  private readonly MIN_RATING = 4.0;

  async findMatches(criteria: MatchCriteria): Promise<MatchResult[]> {
    // Get contractors matching basic criteria
    const contractors = await prisma.contractor.findMany({
      where: {
        status: 'ACTIVE',
        trades: { hasSome: criteria.trades },
        rating: { gte: criteria.minRating || this.MIN_RATING },
      },
      include: {
        credentials: true,
        recentProjects: { take: 5 },
        reviews: { take: 10 },
      },
    });

    // Score and filter contractors
    const matches = contractors
      .map(contractor => this.scoreContractor(contractor, criteria))
      .filter(match => match.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 matches

    return matches;
  }

  private scoreContractor(contractor: any, criteria: MatchCriteria): MatchResult {
    let score = 0;
    const matchReasons: string[] = [];

    // Distance score (0-25 points)
    const distance = this.calculateDistance(
      criteria.location,
      { lat: contractor.latitude, lng: contractor.longitude }
    );
    if (distance <= this.MAX_DISTANCE_MILES) {
      score += 25 * (1 - distance / this.MAX_DISTANCE_MILES);
      matchReasons.push(`${Math.round(distance)} miles away`);
    }

    // Trade match score (0-25 points)
    const tradeOverlap = contractor.trades.filter((t: string) => 
      criteria.trades.includes(t)
    ).length;
    score += (tradeOverlap / criteria.trades.length) * 25;
    matchReasons.push(`${tradeOverlap}/${criteria.trades.length} trades matched`);

    // Rating score (0-20 points)
    score += (contractor.rating / 5) * 20;
    matchReasons.push(`${contractor.rating} star rating`);

    // Project history score (0-15 points)
    const similarProjects = contractor.recentProjects.filter(
      (p: any) => p.budget >= criteria.budgetRange.min * 0.5 &&
                  p.budget <= criteria.budgetRange.max * 1.5
    ).length;
    score += (similarProjects / 5) * 15;
    if (similarProjects > 0) {
      matchReasons.push(`${similarProjects} similar projects completed`);
    }

    // Credential score (0-15 points)
    const validCredentials = contractor.credentials.filter(
      (c: any) => c.expiresAt > new Date()
    ).length;
    score += (validCredentials / 3) * 15;
    matchReasons.push(`${validCredentials} valid credentials`);

    return {
      contractor,
      score: score / 100,
      matchReasons,
      distance,
      availability: true, // TODO: Check calendar
    };
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    // Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
```

```typescript
// packages/automation/apps/bid-engine/src/analysis/bid-analyzer.ts

import { BidSubmission } from '@prisma/client';

interface BidAnalysis {
  submission: BidSubmission;
  priceScore: number;
  timelineScore: number;
  scopeScore: number;
  qualificationScore: number;
  overallScore: number;
  strengths: string[];
  concerns: string[];
  recommendation: 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
}

interface AnalysisWeights {
  price: number;
  timeline: number;
  scope: number;
  qualifications: number;
}

export class BidAnalyzer {
  private readonly DEFAULT_WEIGHTS: AnalysisWeights = {
    price: 0.35,
    timeline: 0.25,
    scope: 0.25,
    qualifications: 0.15,
  };

  async analyzeBids(
    submissions: BidSubmission[],
    projectBudget: number,
    projectTimeline: number,
    weights?: Partial<AnalysisWeights>
  ): Promise<BidAnalysis[]> {
    const effectiveWeights = { ...this.DEFAULT_WEIGHTS, ...weights };
    
    // Calculate baselines
    const avgPrice = submissions.reduce((sum, s) => sum + Number(s.amount), 0) / submissions.length;
    const avgTimeline = submissions.reduce((sum, s) => {
      const timeline = s.timeline as { totalDays: number };
      return sum + timeline.totalDays;
    }, 0) / submissions.length;

    // Analyze each submission
    const analyses = submissions.map(submission => 
      this.analyzeSubmission(submission, {
        avgPrice,
        avgTimeline,
        projectBudget,
        projectTimeline,
        weights: effectiveWeights,
      })
    );

    // Sort by overall score
    return analyses.sort((a, b) => b.overallScore - a.overallScore);
  }

  private analyzeSubmission(
    submission: BidSubmission,
    context: {
      avgPrice: number;
      avgTimeline: number;
      projectBudget: number;
      projectTimeline: number;
      weights: AnalysisWeights;
    }
  ): BidAnalysis {
    const strengths: string[] = [];
    const concerns: string[] = [];
    
    // Price Score (lower is better, but not too low)
    const price = Number(submission.amount);
    let priceScore = 0;
    if (price < context.avgPrice * 0.7) {
      priceScore = 0.6; // Suspiciously low
      concerns.push('Price significantly below average - verify scope understanding');
    } else if (price <= context.avgPrice) {
      priceScore = 1 - ((context.avgPrice - price) / context.avgPrice) * 0.3;
      priceScore = Math.min(priceScore, 1);
      strengths.push('Competitive pricing');
    } else if (price <= context.projectBudget) {
      priceScore = 0.8 - ((price - context.avgPrice) / context.avgPrice) * 0.3;
      priceScore = Math.max(priceScore, 0.5);
    } else {
      priceScore = 0.3;
      concerns.push('Price exceeds project budget');
    }

    // Timeline Score
    const timeline = (submission.timeline as { totalDays: number }).totalDays;
    let timelineScore = 0;
    if (timeline <= context.projectTimeline * 0.8) {
      timelineScore = 0.9;
      strengths.push('Faster than required timeline');
    } else if (timeline <= context.projectTimeline) {
      timelineScore = 1;
      strengths.push('Meets timeline requirements');
    } else if (timeline <= context.projectTimeline * 1.2) {
      timelineScore = 0.7;
      concerns.push('Slightly longer than desired timeline');
    } else {
      timelineScore = 0.4;
      concerns.push('Timeline significantly exceeds requirements');
    }

    // Scope Score (check completeness)
    const scope = submission.scope as { items: string[]; exclusions: string[] };
    const scopeCompleteness = this.evaluateScopeCompleteness(scope);
    const scopeScore = scopeCompleteness;
    if (scopeCompleteness > 0.9) {
      strengths.push('Comprehensive scope coverage');
    } else if (scopeCompleteness < 0.7) {
      concerns.push('Incomplete scope - clarification needed');
    }

    // Qualification Score (from contractor data)
    const qualificationScore = submission.score ? Number(submission.score) : 0.8;

    // Calculate overall score
    const overallScore = 
      priceScore * context.weights.price +
      timelineScore * context.weights.timeline +
      scopeScore * context.weights.scope +
      qualificationScore * context.weights.qualifications;

    // Determine recommendation
    let recommendation: 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
    if (overallScore >= 0.8 && concerns.length <= 1) {
      recommendation = 'RECOMMENDED';
    } else if (overallScore >= 0.6) {
      recommendation = 'ACCEPTABLE';
    } else {
      recommendation = 'NOT_RECOMMENDED';
    }

    return {
      submission,
      priceScore,
      timelineScore,
      scopeScore,
      qualificationScore,
      overallScore,
      strengths,
      concerns,
      recommendation,
    };
  }

  private evaluateScopeCompleteness(scope: { items: string[]; exclusions: string[] }): number {
    // This would be more sophisticated in production
    // checking against required scope items
    const itemCount = scope.items?.length || 0;
    const hasExclusions = scope.exclusions?.length > 0;
    
    let score = Math.min(itemCount / 10, 1) * 0.8;
    if (hasExclusions) {
      score += 0.2; // Clear exclusions is good
    }
    
    return score;
  }
}
```

```typescript
// packages/automation/apps/bid-engine/src/workflows/bid-workflow.ts

import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

const {
  createBidRequest,
  findMatchingContractors,
  sendBidInvitations,
  checkBidDeadline,
  collectSubmissions,
  analyzeBids,
  generateComparison,
  notifyPM,
  notifyClient,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export interface BidWorkflowInput {
  projectId: string;
  scope: Record<string, any>;
  deadline: Date;
  pmId: string;
  clientId: string;
}

export async function bidCollectionWorkflow(input: BidWorkflowInput): Promise<void> {
  // Step 1: Create bid request
  const bidRequest = await createBidRequest({
    projectId: input.projectId,
    scope: input.scope,
    deadline: input.deadline,
  });

  // Step 2: Find matching contractors (AI-powered)
  const matches = await findMatchingContractors({
    projectId: input.projectId,
    bidRequestId: bidRequest.id,
  });

  // Step 3: Send invitations to top matches
  await sendBidInvitations({
    bidRequestId: bidRequest.id,
    contractorIds: matches.slice(0, 5).map(m => m.contractorId),
  });

  // Notify PM that invitations sent
  await notifyPM({
    pmId: input.pmId,
    type: 'BID_INVITATIONS_SENT',
    data: { bidRequestId: bidRequest.id, count: matches.length },
  });

  // Step 4: Wait for deadline (with periodic checks)
  const deadlineMs = new Date(input.deadline).getTime() - Date.now();
  const checkInterval = 24 * 60 * 60 * 1000; // Daily
  
  let remainingTime = deadlineMs;
  while (remainingTime > 0) {
    const waitTime = Math.min(checkInterval, remainingTime);
    await sleep(waitTime);
    remainingTime -= waitTime;

    // Check if all invitees have responded
    const status = await checkBidDeadline({ bidRequestId: bidRequest.id });
    if (status.allResponded) {
      break; // Early completion
    }
  }

  // Step 5: Collect and analyze submissions
  const submissions = await collectSubmissions({ bidRequestId: bidRequest.id });
  
  if (submissions.length === 0) {
    // No bids received - notify PM
    await notifyPM({
      pmId: input.pmId,
      type: 'NO_BIDS_RECEIVED',
      data: { bidRequestId: bidRequest.id },
    });
    return;
  }

  // Step 6: Analyze bids (AI-powered)
  const analysis = await analyzeBids({
    bidRequestId: bidRequest.id,
    submissionIds: submissions.map(s => s.id),
  });

  // Step 7: Generate comparison report
  const comparison = await generateComparison({
    bidRequestId: bidRequest.id,
    analysis,
  });

  // Step 8: Notify PM and optionally client
  await notifyPM({
    pmId: input.pmId,
    type: 'BID_ANALYSIS_COMPLETE',
    data: {
      bidRequestId: bidRequest.id,
      comparisonUrl: comparison.url,
      recommendedContractorId: analysis[0]?.contractorId,
    },
  });
}
```

### API Endpoints

```typescript
// packages/automation/apps/bid-engine/src/api/routes.ts

import { FastifyInstance } from 'fastify';
import { ContractorMatcher } from '../matching/contractor-matcher';
import { BidAnalyzer } from '../analysis/bid-analyzer';
import { temporalClient } from '@kealee/temporal';

export async function bidEngineRoutes(fastify: FastifyInstance) {
  const matcher = new ContractorMatcher();
  const analyzer = new BidAnalyzer();

  // Start bid collection workflow
  fastify.post('/api/bids/start', async (request, reply) => {
    const { projectId, scope, deadline, pmId, clientId } = request.body as any;
    
    const handle = await temporalClient.workflow.start('bidCollectionWorkflow', {
      taskQueue: 'bid-engine',
      workflowId: `bid-${projectId}-${Date.now()}`,
      args: [{ projectId, scope, deadline, pmId, clientId }],
    });

    return { workflowId: handle.workflowId };
  });

  // Get contractor matches (preview before starting workflow)
  fastify.post('/api/bids/preview-matches', async (request, reply) => {
    const criteria = request.body as any;
    const matches = await matcher.findMatches(criteria);
    return { matches };
  });

  // Get bid analysis
  fastify.get('/api/bids/:bidRequestId/analysis', async (request, reply) => {
    const { bidRequestId } = request.params as any;
    // ... implementation
  });

  // Manual bid comparison
  fastify.post('/api/bids/:bidRequestId/analyze', async (request, reply) => {
    const { bidRequestId } = request.params as any;
    const { projectBudget, projectTimeline, weights } = request.body as any;
    // ... implementation
  });
}
```

---

## APP-09: Task Queue Manager

### Purpose
Intelligent work queue management for PMs with automatic task generation, prioritization, and assignment.

### File Structure
```
packages/automation/apps/task-queue/
├── src/
│   ├── index.ts
│   ├── generation/
│   │   ├── task-generator.ts
│   │   ├── trigger-handlers.ts
│   │   └── sop-mapper.ts
│   ├── prioritization/
│   │   ├── priority-engine.ts
│   │   └── urgency-calculator.ts
│   ├── assignment/
│   │   ├── pm-assigner.ts
│   │   └── load-balancer.ts
│   ├── tracking/
│   │   ├── deadline-tracker.ts
│   │   └── escalation-handler.ts
│   ├── analytics/
│   │   └── performance-tracker.ts
│   ├── workers/
│   │   ├── task-processor.ts
│   │   └── escalation-worker.ts
│   └── api/
│       └── routes.ts
├── tests/
└── package.json
```

### Core Implementation

```typescript
// packages/automation/apps/task-queue/src/generation/task-generator.ts

import { prisma } from '@kealee/database';
import { EventEmitter } from 'events';

export interface TaskTemplate {
  type: string;
  title: string;
  description: string;
  defaultPriority: number;
  estimatedMinutes: number;
  dueOffsetDays?: number;
  dependencies?: string[];
  automationLevel: number; // 0-100
}

// SOP-based task templates
const TASK_TEMPLATES: Record<string, TaskTemplate[]> = {
  PROJECT_CREATED: [
    {
      type: 'intake_call',
      title: 'Conduct initial phone consultation',
      description: 'Schedule and conduct discovery call with new client',
      defaultPriority: 1,
      estimatedMinutes: 45,
      dueOffsetDays: 1,
      automationLevel: 0,
    },
    {
      type: 'intake_form',
      title: 'Complete client intake form',
      description: 'Document all project requirements from intake call',
      defaultPriority: 2,
      estimatedMinutes: 30,
      dependencies: ['intake_call'],
      automationLevel: 60,
    },
    {
      type: 'classify_project',
      title: 'Classify project type and complexity',
      description: 'Categorize project for proper routing',
      defaultPriority: 2,
      estimatedMinutes: 15,
      dependencies: ['intake_form'],
      automationLevel: 95,
    },
  ],
  DESIGN_APPROVED: [
    {
      type: 'compile_permit_package',
      title: 'Compile permit application package',
      description: 'Assemble all required documents for permit submission',
      defaultPriority: 1,
      estimatedMinutes: 60,
      dueOffsetDays: 3,
      automationLevel: 80,
    },
  ],
  MILESTONE_DUE: [
    {
      type: 'verify_milestone',
      title: 'Verify milestone completion',
      description: 'Confirm work is complete for payment release',
      defaultPriority: 1,
      estimatedMinutes: 30,
      dueOffsetDays: 0,
      automationLevel: 70,
    },
  ],
  INSPECTION_SCHEDULED: [
    {
      type: 'verify_inspection_ready',
      title: 'Verify site inspection readiness',
      description: 'Ensure site is ready for scheduled inspection',
      defaultPriority: 1,
      estimatedMinutes: 15,
      dueOffsetDays: -1, // Day before
      automationLevel: 75,
    },
  ],
  // ... more triggers
};

export class TaskGenerator {
  private eventBus: EventEmitter;

  constructor(eventBus: EventEmitter) {
    this.eventBus = eventBus;
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for all triggering events
    Object.keys(TASK_TEMPLATES).forEach(trigger => {
      this.eventBus.on(trigger, (data) => this.handleTrigger(trigger, data));
    });
  }

  private async handleTrigger(trigger: string, data: any) {
    const templates = TASK_TEMPLATES[trigger];
    if (!templates) return;

    const tasks = templates.map(template => ({
      type: template.type,
      status: 'PENDING',
      priority: template.defaultPriority,
      projectId: data.projectId,
      clientId: data.clientId,
      payload: {
        ...template,
        triggerData: data,
      },
      dueAt: template.dueOffsetDays !== undefined
        ? this.calculateDueDate(template.dueOffsetDays)
        : null,
    }));

    // Create tasks in database
    await prisma.automationTask.createMany({ data: tasks });

    // Trigger assignment
    this.eventBus.emit('TASKS_CREATED', { 
      taskIds: tasks.map(t => t.type),
      projectId: data.projectId,
    });
  }

  private calculateDueDate(offsetDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    // Set to end of business day
    date.setHours(17, 0, 0, 0);
    return date;
  }

  // Manual task creation
  async createTask(params: {
    type: string;
    projectId: string;
    clientId?: string;
    assignedPmId?: string;
    priority?: number;
    dueAt?: Date;
    payload?: Record<string, any>;
  }) {
    return prisma.automationTask.create({
      data: {
        type: params.type,
        status: 'PENDING',
        priority: params.priority || 5,
        projectId: params.projectId,
        clientId: params.clientId,
        assignedPmId: params.assignedPmId,
        payload: params.payload || {},
        dueAt: params.dueAt,
      },
    });
  }
}
```

```typescript
// packages/automation/apps/task-queue/src/prioritization/priority-engine.ts

import { prisma } from '@kealee/database';
import { AutomationTask } from '@prisma/client';

interface PriorityFactors {
  deadline: number;       // 0-30 points
  clientTier: number;     // 0-20 points
  projectValue: number;   // 0-15 points
  taskType: number;       // 0-15 points
  waitTime: number;       // 0-10 points
  dependencies: number;   // 0-10 points
}

export class PriorityEngine {
  private readonly TIER_WEIGHTS = {
    A: 5,
    B: 10,
    C: 15,
    D: 20,
  };

  private readonly CRITICAL_TASK_TYPES = [
    'inspection_coordination',
    'permit_revision',
    'client_escalation',
    'payment_approval',
  ];

  async calculatePriority(task: AutomationTask): Promise<number> {
    const factors = await this.getFactors(task);
    
    const score = 
      factors.deadline +
      factors.clientTier +
      factors.projectValue +
      factors.taskType +
      factors.waitTime +
      factors.dependencies;

    // Convert to 1-10 scale (1 = highest priority)
    return Math.max(1, Math.min(10, Math.ceil(10 - (score / 10))));
  }

  private async getFactors(task: AutomationTask): Promise<PriorityFactors> {
    // Get related data
    const project = task.projectId 
      ? await prisma.project.findUnique({ 
          where: { id: task.projectId },
          include: { client: true },
        })
      : null;

    // Deadline factor
    let deadline = 0;
    if (task.dueAt) {
      const hoursUntilDue = (task.dueAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDue < 0) deadline = 30; // Overdue
      else if (hoursUntilDue < 4) deadline = 25;
      else if (hoursUntilDue < 24) deadline = 20;
      else if (hoursUntilDue < 48) deadline = 15;
      else if (hoursUntilDue < 168) deadline = 10; // 1 week
      else deadline = 5;
    }

    // Client tier factor
    const tier = project?.client?.packageTier || 'A';
    const clientTier = this.TIER_WEIGHTS[tier as keyof typeof this.TIER_WEIGHTS] || 5;

    // Project value factor
    const projectValue = project?.budget
      ? Math.min(15, Math.floor(Number(project.budget) / 50000) * 3)
      : 5;

    // Task type factor
    const taskType = this.CRITICAL_TASK_TYPES.includes(task.type) ? 15 : 5;

    // Wait time factor (how long has task been waiting)
    const waitHours = (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60);
    const waitTime = Math.min(10, Math.floor(waitHours / 24) * 2);

    // Dependencies factor (are other tasks waiting on this?)
    const dependentCount = await prisma.automationTask.count({
      where: {
        status: 'PENDING',
        payload: {
          path: ['dependencies'],
          array_contains: task.type,
        },
      },
    });
    const dependencies = Math.min(10, dependentCount * 3);

    return { deadline, clientTier, projectValue, taskType, waitTime, dependencies };
  }

  async reprioritizeQueue(pmId?: string): Promise<void> {
    const tasks = await prisma.automationTask.findMany({
      where: {
        status: { in: ['PENDING', 'SCHEDULED'] },
        ...(pmId && { assignedPmId: pmId }),
      },
    });

    for (const task of tasks) {
      const newPriority = await this.calculatePriority(task);
      if (task.priority !== newPriority) {
        await prisma.automationTask.update({
          where: { id: task.id },
          data: { priority: newPriority },
        });
      }
    }
  }
}
```

```typescript
// packages/automation/apps/task-queue/src/assignment/load-balancer.ts

import { prisma } from '@kealee/database';

interface PMWorkload {
  pmId: string;
  currentTasks: number;
  currentHours: number;
  maxHours: number;
  specializations: string[];
  activeProjects: string[];
}

export class LoadBalancer {
  private readonly MAX_WEEKLY_HOURS = 40;
  private readonly TASK_HOUR_ESTIMATES: Record<string, number> = {
    intake_call: 0.75,
    intake_form: 0.5,
    site_visit: 2,
    weekly_report: 0.75,
    permit_tracking: 0.25,
    inspection_coordination: 0.5,
    change_order: 1,
    // ... more estimates
  };

  async getOptimalAssignment(taskType: string, projectId: string): Promise<string | null> {
    const workloads = await this.getPMWorkloads();
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    // Filter PMs who can take more work
    const availablePMs = workloads.filter(pm => 
      pm.currentHours + this.getTaskHours(taskType) <= pm.maxHours
    );

    if (availablePMs.length === 0) return null;

    // Scoring for assignment
    const scores = availablePMs.map(pm => {
      let score = 0;

      // Prefer PM already assigned to this project
      if (pm.activeProjects.includes(projectId)) {
        score += 50;
      }

      // Prefer PM with capacity
      const capacityRatio = 1 - (pm.currentHours / pm.maxHours);
      score += capacityRatio * 30;

      // Prefer PM with relevant specialization
      if (pm.specializations.some(s => taskType.includes(s))) {
        score += 20;
      }

      return { pm, score };
    });

    // Sort by score and return best match
    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.pm.pmId || null;
  }

  private async getPMWorkloads(): Promise<PMWorkload[]> {
    const pms = await prisma.user.findMany({
      where: { role: 'PM', status: 'ACTIVE' },
      include: {
        assignedTasks: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        },
        assignedProjects: true,
      },
    });

    return pms.map(pm => ({
      pmId: pm.id,
      currentTasks: pm.assignedTasks.length,
      currentHours: pm.assignedTasks.reduce((sum, task) => 
        sum + this.getTaskHours(task.type), 0
      ),
      maxHours: this.MAX_WEEKLY_HOURS,
      specializations: (pm.metadata as any)?.specializations || [],
      activeProjects: pm.assignedProjects.map(p => p.id),
    }));
  }

  private getTaskHours(taskType: string): number {
    return this.TASK_HOUR_ESTIMATES[taskType] || 0.5;
  }
}
```

---

# 3. PRIORITY 2 APPS (BUILD SECOND)

## APP-02: Site Visit Scheduler

### Core Features
- Smart scheduling based on package tier (2x/month for B, 4x/month for C/D)
- Route optimization for multi-site days
- Weather integration for outdoor assessments
- Automated notifications to contractors and clients

### Key Implementation

```typescript
// packages/automation/apps/visit-scheduler/src/scheduler/smart-scheduler.ts

import { prisma } from '@kealee/database';
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns';

interface ScheduleRule {
  packageTier: string;
  visitsPerMonth: number;
  preferredDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  minDaysBetween: number;
}

const SCHEDULE_RULES: ScheduleRule[] = [
  { packageTier: 'A', visitsPerMonth: 0, preferredDays: [], minDaysBetween: 0 },
  { packageTier: 'B', visitsPerMonth: 2, preferredDays: [2, 4], minDaysBetween: 10 },
  { packageTier: 'C', visitsPerMonth: 4, preferredDays: [1, 2, 3, 4], minDaysBetween: 5 },
  { packageTier: 'D', visitsPerMonth: 4, preferredDays: [1, 2, 3, 4, 5], minDaysBetween: 5 },
];

export class SmartScheduler {
  async scheduleVisitsForPeriod(
    pmId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    // Get all active projects for this PM
    const projects = await prisma.project.findMany({
      where: {
        assignedPmId: pmId,
        status: 'IN_PROGRESS',
      },
      include: {
        client: true,
        siteVisits: {
          where: {
            scheduledAt: { gte: startDate },
          },
        },
      },
    });

    for (const project of projects) {
      const rule = SCHEDULE_RULES.find(r => r.packageTier === project.client.packageTier);
      if (!rule || rule.visitsPerMonth === 0) continue;

      // Calculate visits needed
      const existingVisits = project.siteVisits.length;
      const visitsNeeded = rule.visitsPerMonth - existingVisits;

      if (visitsNeeded <= 0) continue;

      // Find optimal slots
      const slots = await this.findOptimalSlots(
        pmId,
        project.id,
        visitsNeeded,
        startDate,
        endDate,
        rule
      );

      // Create visits
      for (const slot of slots) {
        await prisma.siteVisit.create({
          data: {
            projectId: project.id,
            pmId,
            scheduledAt: slot,
            status: 'SCHEDULED',
            type: 'progress',
          },
        });
      }
    }
  }

  private async findOptimalSlots(
    pmId: string,
    projectId: string,
    count: number,
    startDate: Date,
    endDate: Date,
    rule: ScheduleRule
  ): Promise<Date[]> {
    // Get PM's existing schedule
    const existingVisits = await prisma.siteVisit.findMany({
      where: {
        pmId,
        scheduledAt: { gte: startDate, lte: endDate },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const slots: Date[] = [];
    let currentDate = new Date(startDate);

    while (slots.length < count && currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if preferred day
      if (!rule.preferredDays.includes(dayOfWeek)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Check if PM has capacity this day (max 4 visits/day)
      const visitsThisDay = existingVisits.filter(v => 
        format(v.scheduledAt, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      ).length;

      if (visitsThisDay < 4) {
        // Check minimum days since last visit to this project
        const lastVisit = slots.length > 0 
          ? slots[slots.length - 1]
          : await this.getLastProjectVisit(projectId);

        if (!lastVisit || this.daysBetween(lastVisit, currentDate) >= rule.minDaysBetween) {
          // Set time based on existing visits (spread throughout day)
          const visitHour = 9 + (visitsThisDay * 2); // 9am, 11am, 1pm, 3pm
          const slot = new Date(currentDate);
          slot.setHours(visitHour, 0, 0, 0);
          slots.push(slot);
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    return slots;
  }

  private async getLastProjectVisit(projectId: string): Promise<Date | null> {
    const lastVisit = await prisma.siteVisit.findFirst({
      where: { projectId },
      orderBy: { scheduledAt: 'desc' },
    });
    return lastVisit?.scheduledAt || null;
  }

  private daysBetween(date1: Date, date2: Date): number {
    return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

---

## APP-03: Change Order Processor

### Core Features
- Multi-source request intake (client, contractor, PM)
- Automatic impact analysis (cost + schedule)
- Document generation with AI
- Approval workflow with e-signature

### Key Implementation

```typescript
// packages/automation/apps/change-order/src/processor/impact-analyzer.ts

import { prisma } from '@kealee/database';
import { ChangeOrder, Project } from '@prisma/client';

interface ImpactAnalysis {
  costImpact: {
    directCost: number;
    indirectCost: number;
    contingency: number;
    total: number;
    percentOfBudget: number;
  };
  scheduleImpact: {
    directDays: number;
    cascadeDays: number;
    totalDays: number;
    newEndDate: Date;
    criticalPathAffected: boolean;
  };
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
  recommendation: string;
}

export class ImpactAnalyzer {
  async analyzeChange(
    projectId: string,
    changeDescription: string,
    contractorEstimate: number,
    contractorTimeline: number
  ): Promise<ImpactAnalysis> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        changeOrders: { where: { status: 'APPROVED' } },
      },
    });

    if (!project) throw new Error('Project not found');

    // Cost impact
    const directCost = contractorEstimate;
    const indirectCost = directCost * 0.1; // 10% overhead
    const contingency = directCost * 0.05; // 5% contingency
    const totalCost = directCost + indirectCost + contingency;
    
    const currentBudget = Number(project.budget) + 
      project.changeOrders.reduce((sum, co) => sum + Number(co.amount), 0);
    const percentOfBudget = (totalCost / currentBudget) * 100;

    // Schedule impact
    const directDays = contractorTimeline;
    const cascadeDays = await this.calculateCascadeImpact(project, contractorTimeline);
    const totalDays = directDays + cascadeDays;
    
    const currentEndDate = project.estimatedEndDate || new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + totalDays);

    // Risk assessment
    const riskFactors: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (percentOfBudget > 10) {
      riskFactors.push('Significant budget impact (>10%)');
      riskLevel = 'HIGH';
    } else if (percentOfBudget > 5) {
      riskFactors.push('Moderate budget impact (5-10%)');
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
    }

    if (totalDays > 14) {
      riskFactors.push('Significant schedule delay (>2 weeks)');
      riskLevel = 'HIGH';
    } else if (totalDays > 7) {
      riskFactors.push('Moderate schedule delay (1-2 weeks)');
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
    }

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      percentOfBudget,
      totalDays,
      riskLevel
    );

    return {
      costImpact: {
        directCost,
        indirectCost,
        contingency,
        total: totalCost,
        percentOfBudget,
      },
      scheduleImpact: {
        directDays,
        cascadeDays,
        totalDays,
        newEndDate,
        criticalPathAffected: cascadeDays > 0,
      },
      riskAssessment: {
        level: riskLevel,
        factors: riskFactors,
      },
      recommendation,
    };
  }

  private async calculateCascadeImpact(project: any, directDays: number): Promise<number> {
    // Check if change affects critical path activities
    const upcomingMilestones = project.milestones.filter(
      (m: any) => m.status === 'PENDING' && new Date(m.dueDate) > new Date()
    );

    // Simplified cascade calculation
    // In production, this would analyze task dependencies
    if (directDays > 7 && upcomingMilestones.length > 2) {
      return Math.ceil(directDays * 0.5); // 50% cascade for significant delays
    }
    return 0;
  }

  private generateRecommendation(
    percentOfBudget: number,
    totalDays: number,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): string {
    if (riskLevel === 'LOW') {
      return 'RECOMMEND APPROVAL: Change has minimal impact on project budget and schedule.';
    } else if (riskLevel === 'MEDIUM') {
      return 'CONDITIONAL APPROVAL: Consider negotiating cost or timeline. Document justification for change.';
    } else {
      return 'REQUIRES REVIEW: Significant impact to project. Recommend discussion with client before approval.';
    }
  }
}
```

---

# 4. PRIORITY 3 APPS (CORE FEATURES)

## APP-04: Report Generator

### Core Features
- Auto-generate all report types (daily, weekly, bi-weekly, monthly, final)
- Photo integration with AI-generated captions
- Narrative generation from data points
- Schedule-based auto-send

```typescript
// packages/automation/apps/report-generator/src/generators/weekly-report.ts

import { prisma } from '@kealee/database';
import { generateText } from '@kealee/ai';

interface WeeklyReportData {
  project: any;
  period: { start: Date; end: Date };
  progress: {
    completedTasks: number;
    totalTasks: number;
    percentComplete: number;
  };
  schedule: {
    onTrack: boolean;
    variance: number;
    milestonesCompleted: string[];
    upcomingMilestones: string[];
  };
  budget: {
    spent: number;
    committed: number;
    remaining: number;
    variance: number;
  };
  siteVisits: any[];
  issues: any[];
  changeOrders: any[];
  photos: any[];
}

export class WeeklyReportGenerator {
  async generate(projectId: string, periodEnd: Date): Promise<any> {
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 7);

    // Gather all data
    const data = await this.gatherReportData(projectId, periodStart, periodEnd);

    // Generate narrative
    const narrative = await this.generateNarrative(data);

    // Create report record
    const report = await prisma.report.create({
      data: {
        projectId,
        type: 'weekly',
        periodStart,
        periodEnd,
        content: {
          ...data,
          narrative,
        },
        photos: data.photos.map(p => p.url),
      },
    });

    return report;
  }

  private async gatherReportData(
    projectId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<WeeklyReportData> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        siteVisits: {
          where: {
            completedAt: { gte: periodStart, lte: periodEnd },
          },
          include: { photos: true },
        },
        changeOrders: {
          where: {
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        },
        issues: {
          where: {
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        },
      },
    });

    if (!project) throw new Error('Project not found');

    // Calculate progress
    const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED');
    const progress = {
      completedTasks: completedMilestones.length,
      totalTasks: project.milestones.length,
      percentComplete: Math.round((completedMilestones.length / project.milestones.length) * 100),
    };

    // Calculate schedule status
    const schedule = {
      onTrack: project.scheduleVariance <= 0,
      variance: project.scheduleVariance || 0,
      milestonesCompleted: project.milestones
        .filter(m => m.completedAt && m.completedAt >= periodStart && m.completedAt <= periodEnd)
        .map(m => m.name),
      upcomingMilestones: project.milestones
        .filter(m => m.status === 'PENDING')
        .slice(0, 3)
        .map(m => `${m.name} (due ${m.dueDate.toLocaleDateString()})`),
    };

    // Calculate budget status
    const spent = Number(project.spentAmount || 0);
    const committed = Number(project.committedAmount || 0);
    const budget = {
      spent,
      committed,
      remaining: Number(project.budget) - spent - committed,
      variance: spent - Number(project.budgetBaseline || project.budget),
    };

    // Collect photos from site visits
    const photos = project.siteVisits.flatMap(v => v.photos || []);

    return {
      project,
      period: { start: periodStart, end: periodEnd },
      progress,
      schedule,
      budget,
      siteVisits: project.siteVisits,
      issues: project.issues,
      changeOrders: project.changeOrders,
      photos,
    };
  }

  private async generateNarrative(data: WeeklyReportData): Promise<string> {
    const prompt = `Generate a professional weekly construction progress report narrative based on the following data:

Project: ${data.project.name}
Period: ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}

Progress: ${data.progress.percentComplete}% complete (${data.progress.completedTasks}/${data.progress.totalTasks} milestones)
Schedule Status: ${data.schedule.onTrack ? 'On Track' : `${Math.abs(data.schedule.variance)} days ${data.schedule.variance > 0 ? 'behind' : 'ahead'}`}
Budget Status: $${data.budget.spent.toLocaleString()} spent, $${data.budget.remaining.toLocaleString()} remaining

Milestones completed this week: ${data.schedule.milestonesCompleted.join(', ') || 'None'}
Site visits conducted: ${data.siteVisits.length}
Open issues: ${data.issues.filter(i => i.status === 'OPEN').length}
Change orders this week: ${data.changeOrders.length}

Write a concise 2-3 paragraph summary suitable for a homeowner client. Be professional but approachable. Highlight accomplishments and address any concerns proactively.`;

    const narrative = await generateText(prompt);
    return narrative;
  }
}
```

---

# 5. PRIORITY 4 APPS (AI LAYER)

## APP-11: Predictive Issue Engine

### Core Features
- Delay prediction from early signals
- Cost overrun prediction from spending patterns
- Quality issue prediction from inspection patterns
- Intervention timing recommendations

```typescript
// packages/automation/apps/predictive-engine/src/predictors/delay-predictor.ts

import { prisma } from '@kealee/database';
import * as tf from '@tensorflow/tfjs-node';

interface DelayPrediction {
  probability: number;
  expectedDays: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  recommendation: string;
}

export class DelayPredictor {
  private model: tf.LayersModel | null = null;

  async predict(projectId: string): Promise<DelayPrediction> {
    const features = await this.extractFeatures(projectId);
    
    // Use trained model or rule-based fallback
    if (this.model) {
      return this.modelPredict(features);
    } else {
      return this.ruleBasedPredict(features);
    }
  }

  private async extractFeatures(projectId: string): Promise<Record<string, number>> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        siteVisits: { orderBy: { scheduledAt: 'desc' }, take: 5 },
        inspections: { orderBy: { scheduledAt: 'desc' }, take: 5 },
        dailyLogs: { orderBy: { date: 'desc' }, take: 14 },
        changeOrders: true,
      },
    });

    if (!project) throw new Error('Project not found');

    // Extract predictive features
    const features: Record<string, number> = {};

    // Schedule variance trend
    const recentMilestones = project.milestones
      .filter(m => m.completedAt)
      .slice(-3);
    features.avgMilestoneVariance = recentMilestones.length > 0
      ? recentMilestones.reduce((sum, m) => {
          const planned = m.dueDate.getTime();
          const actual = m.completedAt!.getTime();
          return sum + (actual - planned) / (1000 * 60 * 60 * 24);
        }, 0) / recentMilestones.length
      : 0;

    // Weather delay days (last 2 weeks)
    const weatherDelays = project.dailyLogs.filter(
      log => (log.metadata as any)?.weatherDelay
    ).length;
    features.weatherDelayDays = weatherDelays;

    // RFI response time trend
    features.avgRfiResponseDays = 2; // Would calculate from actual RFI data

    // Inspection failure rate
    const recentInspections = project.inspections.slice(0, 5);
    const failedInspections = recentInspections.filter(i => i.result === 'FAILED');
    features.inspectionFailureRate = recentInspections.length > 0
      ? failedInspections.length / recentInspections.length
      : 0;

    // Change order frequency
    const recentChangeOrders = project.changeOrders.filter(co => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return co.createdAt >= thirtyDaysAgo;
    });
    features.changeOrdersLast30Days = recentChangeOrders.length;

    // Resource availability (from daily logs)
    const laborShortages = project.dailyLogs.filter(
      log => (log.metadata as any)?.laborShortage
    ).length;
    features.laborShortageEvents = laborShortages;

    // Material delivery issues
    features.materialDelayEvents = project.dailyLogs.filter(
      log => (log.metadata as any)?.materialDelay
    ).length;

    return features;
  }

  private ruleBasedPredict(features: Record<string, number>): DelayPrediction {
    const factors: DelayPrediction['factors'] = [];
    let riskScore = 0;

    // Analyze each factor
    if (features.avgMilestoneVariance > 3) {
      factors.push({
        name: 'Milestone Delays',
        impact: 0.3,
        description: `Recent milestones averaging ${features.avgMilestoneVariance.toFixed(1)} days late`,
      });
      riskScore += 0.3;
    }

    if (features.weatherDelayDays > 3) {
      factors.push({
        name: 'Weather Delays',
        impact: 0.2,
        description: `${features.weatherDelayDays} weather delay days in past 2 weeks`,
      });
      riskScore += 0.2;
    }

    if (features.inspectionFailureRate > 0.3) {
      factors.push({
        name: 'Inspection Issues',
        impact: 0.25,
        description: `${Math.round(features.inspectionFailureRate * 100)}% inspection failure rate`,
      });
      riskScore += 0.25;
    }

    if (features.changeOrdersLast30Days > 2) {
      factors.push({
        name: 'Scope Changes',
        impact: 0.15,
        description: `${features.changeOrdersLast30Days} change orders in past 30 days`,
      });
      riskScore += 0.15;
    }

    if (features.laborShortageEvents > 2) {
      factors.push({
        name: 'Labor Issues',
        impact: 0.1,
        description: `${features.laborShortageEvents} labor shortage events recorded`,
      });
      riskScore += 0.1;
    }

    // Calculate prediction
    const probability = Math.min(riskScore, 1);
    const expectedDays = Math.ceil(probability * 14); // Max 2 weeks predicted delay

    // Generate recommendation
    let recommendation: string;
    if (probability < 0.3) {
      recommendation = 'Project appears on track. Continue standard monitoring.';
    } else if (probability < 0.6) {
      recommendation = 'Moderate delay risk detected. Recommend increased site visits and proactive contractor communication.';
    } else {
      recommendation = 'High delay risk. Recommend immediate schedule review meeting with contractor and development of recovery plan.';
    }

    return {
      probability,
      expectedDays,
      confidence: 0.75, // Rule-based confidence
      factors,
      recommendation,
    };
  }

  private async modelPredict(features: Record<string, number>): Promise<DelayPrediction> {
    // ML model prediction
    // Would use trained model here
    return this.ruleBasedPredict(features);
  }
}
```

---

# 6. SHARED INFRASTRUCTURE

## 6.1 Event Bus Setup

```typescript
// packages/automation/shared/events/event-bus.ts

import Redis from 'ioredis';
import { EventEmitter } from 'events';

export class EventBus extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private channel = 'kealee:events';

  constructor(redisUrl: string) {
    super();
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.setupSubscriber();
  }

  private setupSubscriber() {
    this.subscriber.subscribe(this.channel);
    this.subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message);
        this.emit(event.type, event.data);
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    });
  }

  async publish(type: string, data: any): Promise<void> {
    const event = { type, data, timestamp: new Date().toISOString() };
    await this.publisher.publish(this.channel, JSON.stringify(event));
  }
}

// Singleton instance
let eventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBus) {
    eventBus = new EventBus(process.env.REDIS_URL!);
  }
  return eventBus;
}
```

## 6.2 BullMQ Setup

```typescript
// packages/automation/shared/queue/setup.ts

import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Create queues for each app
export const queues = {
  bidEngine: new Queue('bid-engine', { connection }),
  visitScheduler: new Queue('visit-scheduler', { connection }),
  reportGenerator: new Queue('report-generator', { connection }),
  taskQueue: new Queue('task-queue', { connection }),
  // ... more queues
};

// Queue schedulers (for delayed jobs)
export const schedulers = {
  bidEngine: new QueueScheduler('bid-engine', { connection }),
  visitScheduler: new QueueScheduler('visit-scheduler', { connection }),
  reportGenerator: new QueueScheduler('report-generator', { connection }),
  taskQueue: new QueueScheduler('task-queue', { connection }),
};
```

---

# 7. DEPLOYMENT GUIDE

## 7.1 Environment Variables

```bash
# .env.production

# Core Platform
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
STRIPE_SECRET_KEY="sk_live_..."

# Automation Layer
REDIS_URL="redis://..."
TEMPORAL_ADDRESS="..."
TEMPORAL_NAMESPACE="kealee-production"

# AI/ML
ANTHROPIC_API_KEY="..."
GOOGLE_CLOUD_VISION_API_KEY="..."
OPENWEATHER_API_KEY="..."

# Integrations
DOCUSIGN_INTEGRATION_KEY="..."
SENDGRID_API_KEY="..."
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
GOOGLE_MAPS_API_KEY="..."
GOHIGHLEVEL_API_KEY="..."
```

## 7.2 Railway Deployment

```yaml
# railway.toml

[build]
builder = "nixpacks"

[deploy]
startCommand = "pnpm start:automation"
healthcheckPath = "/health"
healthcheckTimeout = 300

[deploy.resources]
memory = 2048
cpu = 2
```

## 7.3 Monitoring

```typescript
// packages/automation/shared/monitoring/metrics.ts

import { createMetricRegistry, Histogram, Counter, Gauge } from 'prom-client';

export const metrics = {
  taskProcessingTime: new Histogram({
    name: 'task_processing_seconds',
    help: 'Time to process automation tasks',
    labelNames: ['task_type', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  }),
  
  tasksProcessed: new Counter({
    name: 'tasks_processed_total',
    help: 'Total tasks processed',
    labelNames: ['task_type', 'status'],
  }),
  
  queueDepth: new Gauge({
    name: 'queue_depth',
    help: 'Current queue depth',
    labelNames: ['queue_name'],
  }),
  
  aiLatency: new Histogram({
    name: 'ai_request_seconds',
    help: 'AI API request latency',
    labelNames: ['model', 'task_type'],
    buckets: [0.5, 1, 2, 5, 10, 30],
  }),
};
```

---

## Summary

This specification provides the complete blueprint for building 14 automation apps for the Kealee PM Module. Key points:

1. **Start with APP-01 (Bid Engine) and APP-09 (Task Queue Manager)** - these are foundational
2. **Use Temporal.io for complex workflows** - bid collection, change orders, report generation
3. **Use BullMQ for simple job processing** - task assignment, notifications, document generation
4. **Build incrementally** - each app can be deployed independently
5. **Focus on automation levels** - target 60%+ automation for PM efficiency gains

Estimated total development time: **24-30 weeks** with a 2-3 person team working in parallel.
