# KEALEE PLATFORM v10
# COMMAND CENTER (14 MINI-APPS) INTEGRATION GUIDE
## Architecture, SOPs, Workflows & Migration Plan

---

# EXECUTIVE SUMMARY

This document provides the complete integration blueprint for deploying the 14 PM Automation Mini-Apps (Command Center) as an independent microservices layer within the Kealee Platform v10 monorepo ecosystem.

**Key Principles:**
- **Independence**: Each mini-app operates autonomously with its own deployment lifecycle
- **Loose Coupling**: Communication via events, queues, and APIs (not direct imports)
- **Shared Infrastructure**: Common database, auth, and event bus
- **Unified Experience**: Seamless UI integration within os-pm and os-admin

---

# TABLE OF CONTENTS

1. [Platform Architecture Overview](#architecture)
2. [Command Center Structure](#command-center)
3. [Integration Patterns](#integration-patterns)
4. [Interaction with os-admin & os-pm](#interactions)
5. [Standard Operating Procedures (SOPs)](#sops)
6. [Workflow Diagrams](#workflows)
7. [Migration Implementation Plan](#migration)
8. [GitHub + Railway + Vercel Deployment](#deployment)
9. [Configuration & Environment](#configuration)
10. [Testing & Validation](#testing)

---

# 1. PLATFORM ARCHITECTURE OVERVIEW {#architecture}

## 1.1 Kealee Platform v10 Monorepo Structure

```
kealee-platform-v10/
│
├── apps/                                    # Deployable Applications
│   │
│   ├── os-admin/                           # Admin Panel (Vercel)
│   │   ├── app/                            # Next.js App Router
│   │   │   ├── (dashboard)/
│   │   │   │   ├── users/
│   │   │   │   ├── projects/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── command-center/         # ← Mini-Apps Dashboard
│   │   │   │   │   ├── page.tsx            # Command Center Overview
│   │   │   │   │   ├── jobs/               # Queue Monitoring
│   │   │   │   │   ├── workers/            # Worker Status
│   │   │   │   │   ├── events/             # Event Log
│   │   │   │   │   └── settings/           # App Configurations
│   │   │   │   └── analytics/
│   │   │   └── api/
│   │   └── package.json
│   │
│   ├── os-pm/                              # PM Workspace (Vercel)
│   │   ├── app/
│   │   │   ├── (workspace)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── projects/
│   │   │   │   ├── bids/                   # ← APP-01 UI
│   │   │   │   ├── visits/                 # ← APP-02 UI
│   │   │   │   ├── permits/                # ← APP-05 UI
│   │   │   │   ├── inspections/            # ← APP-06 UI
│   │   │   │   ├── budget/                 # ← APP-07 UI
│   │   │   │   ├── reports/                # ← APP-04 UI
│   │   │   │   ├── tasks/                  # ← APP-09 UI
│   │   │   │   ├── documents/              # ← APP-10 UI
│   │   │   │   ├── ai/                     # ← APP-11-14 UI
│   │   │   │   │   ├── insights/
│   │   │   │   │   ├── predictions/
│   │   │   │   │   ├── qa/
│   │   │   │   │   └── assistant/
│   │   │   │   └── settings/
│   │   │   └── api/
│   │   └── package.json
│   │
│   ├── api/                                # Core API (Railway)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── projects.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── contractors.ts
│   │   │   │   └── command-center/         # ← Proxy routes to mini-apps
│   │   │   │       ├── bids.ts
│   │   │   │       ├── visits.ts
│   │   │   │       └── ...
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── marketplace/                        # Marketplace (Vercel)
│   ├── permits/                            # Permits Portal (Vercel)
│   ├── architect/                          # Architect Services (Vercel)
│   └── project-owner/                      # Project Owner Portal (Vercel)
│
├── packages/                               # Shared Packages
│   │
│   ├── database/                           # Prisma Schema & Client
│   │   ├── prisma/
│   │   │   ├── schema.prisma              # Unified schema
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts                   # Export prisma client
│   │   └── package.json
│   │
│   ├── ui/                                 # Shared Component Library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── auth/                               # Supabase Auth Utilities
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── hooks.ts
│   │   └── package.json
│   │
│   ├── events/                             # Event Bus (NEW)
│   │   ├── src/
│   │   │   ├── bus.ts                     # Redis Pub/Sub
│   │   │   ├── types.ts                   # Event type definitions
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── queue/                              # Queue Infrastructure (NEW)
│   │   ├── src/
│   │   │   ├── queues.ts                  # BullMQ queue definitions
│   │   │   ├── workers.ts                 # Worker factory
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                             # Shared Configuration
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── services/                               # COMMAND CENTER (Independent)
│   │
│   ├── command-center/                     # 14 Mini-Apps Service (Railway)
│   │   ├── apps/
│   │   │   ├── APP-01-bid-engine/
│   │   │   │   ├── src/
│   │   │   │   │   ├── worker.ts          # BullMQ Worker
│   │   │   │   │   ├── routes.ts          # Fastify Routes
│   │   │   │   │   ├── services/          # Business Logic
│   │   │   │   │   └── index.ts
│   │   │   │   └── package.json
│   │   │   │
│   │   │   ├── APP-02-visit-scheduler/
│   │   │   ├── APP-03-change-order/
│   │   │   ├── APP-04-report-generator/
│   │   │   ├── APP-05-permit-tracker/
│   │   │   ├── APP-06-inspection/
│   │   │   ├── APP-07-budget-tracker/
│   │   │   ├── APP-08-communication/
│   │   │   ├── APP-09-task-queue/
│   │   │   ├── APP-10-document-gen/
│   │   │   ├── APP-11-predictive/
│   │   │   ├── APP-12-smart-scheduler/
│   │   │   ├── APP-13-qa-inspector/
│   │   │   └── APP-14-decision-support/
│   │   │
│   │   ├── shared/                         # Shared utilities
│   │   │   ├── integrations/              # External APIs
│   │   │   ├── ai/                        # Claude API
│   │   │   └── utils/
│   │   │
│   │   ├── gateway/                        # API Gateway
│   │   │   ├── src/
│   │   │   │   ├── server.ts              # Fastify server
│   │   │   │   ├── routes.ts              # Route aggregation
│   │   │   │   └── middleware/
│   │   │   └── package.json
│   │   │
│   │   ├── workers/                        # Worker Orchestration
│   │   │   ├── src/
│   │   │   │   ├── main.ts                # Start all workers
│   │   │   │   └── health.ts              # Health checks
│   │   │   └── package.json
│   │   │
│   │   ├── docker-compose.yml             # Local development
│   │   ├── Dockerfile                     # Production container
│   │   ├── railway.toml                   # Railway config
│   │   └── package.json                   # Workspace root
│   │
│   └── scraper/                            # Permit Scraper Service (Railway)
│       ├── src/
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   └── scripts/
│       ├── deploy.sh
│       └── migrate.sh
│
├── turbo.json                              # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

## 1.2 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KEALEE PLATFORM v10 DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────────┐                               │
│                              │  Cloudflare │                               │
│                              │     DNS     │                               │
│                              └──────┬──────┘                               │
│                                     │                                       │
│    ┌────────────────────────────────┼────────────────────────────────┐     │
│    │                                │                                │     │
│    ▼                                ▼                                ▼     │
│                                                                             │
│  VERCEL (Frontend Apps)           RAILWAY (Backend Services)               │
│  ═══════════════════════         ═══════════════════════════              │
│                                                                             │
│  ┌───────────────────┐           ┌───────────────────────────┐            │
│  │   kealee.com      │           │      api.kealee.com       │            │
│  │   (marketplace)   │           │      (Core API)           │            │
│  └───────────────────┘           └─────────────┬─────────────┘            │
│                                                │                           │
│  ┌───────────────────┐                        │                           │
│  │  app.kealee.com   │           ┌────────────┴────────────┐              │
│  │    (os-pm)        │◄─────────▶│  command.kealee.com     │              │
│  └───────────────────┘           │  (Command Center API)   │              │
│                                  └────────────┬────────────┘              │
│  ┌───────────────────┐                        │                           │
│  │ admin.kealee.com  │                        │                           │
│  │   (os-admin)      │◄───────────────────────┤                           │
│  └───────────────────┘                        │                           │
│                                               │                           │
│  ┌───────────────────┐           ┌────────────┴────────────┐              │
│  │permits.kealee.com │           │   workers.kealee.com    │              │
│  │   (permits)       │           │   (14 Mini-App Workers) │              │
│  └───────────────────┘           └────────────┬────────────┘              │
│                                               │                           │
│                                  ┌────────────┴────────────┐              │
│                                  │   Shared Infrastructure │              │
│                                  ├─────────────────────────┤              │
│                                  │ • Supabase (PostgreSQL) │              │
│                                  │ • Redis (Upstash)       │              │
│                                  │ • BullMQ Queues         │              │
│                                  └─────────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. COMMAND CENTER STRUCTURE {#command-center}

## 2.1 Mini-App Independence Model

Each mini-app follows the **M-App Independence Pattern**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MINI-APP INDEPENDENCE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         MINI-APP BOUNDARY                           │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │   ┌─────────┐    ┌─────────┐    ┌─────────┐               │   │   │
│  │  │   │ Worker  │    │  API    │    │Services │               │   │   │
│  │  │   │(BullMQ) │    │(Routes) │    │ (Logic) │               │   │   │
│  │  │   └────┬────┘    └────┬────┘    └────┬────┘               │   │   │
│  │  │        │              │              │                     │   │   │
│  │  │        └──────────────┼──────────────┘                     │   │   │
│  │  │                       │                                     │   │   │
│  │  │              ┌────────┴────────┐                           │   │   │
│  │  │              │  Internal State │                           │   │   │
│  │  │              │   (In-Memory)   │                           │   │   │
│  │  │              └────────┬────────┘                           │   │   │
│  │  │                       │                                     │   │   │
│  │  └───────────────────────┼─────────────────────────────────────┘   │   │
│  │                          │                                         │   │
│  │  ════════════════════════╪═════════════════════════════════════   │   │
│  │           EXTERNAL INTERFACES (Loosely Coupled)                   │   │
│  │  ════════════════════════╪═════════════════════════════════════   │   │
│  │                          │                                         │   │
│  │  ┌───────────┐    ┌──────┴──────┐    ┌───────────┐               │   │
│  │  │  Event    │    │   Shared    │    │  Queue    │               │   │
│  │  │   Bus     │    │  Database   │    │  (Redis)  │               │   │
│  │  │ (Pub/Sub) │    │  (Prisma)   │    │  (BullMQ) │               │   │
│  │  └───────────┘    └─────────────┘    └───────────┘               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  INDEPENDENCE RULES:                                                       │
│  ✓ No direct imports between mini-apps                                     │
│  ✓ Communication only via events, queues, or API calls                     │
│  ✓ Each app can be deployed independently                                  │
│  ✓ Each app can be scaled independently                                    │
│  ✓ Failure in one app doesn't cascade to others                           │
│  ✓ Each app owns its queue(s) and worker(s)                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Mini-App Standard Structure

```
APP-01-bid-engine/
├── src/
│   ├── index.ts                 # App entry point & exports
│   ├── worker.ts                # BullMQ worker definition
│   ├── routes.ts                # Fastify route handlers
│   ├── jobs/                    # Job type definitions
│   │   ├── create-bid-request.ts
│   │   ├── find-contractors.ts
│   │   ├── send-invitations.ts
│   │   └── analyze-bids.ts
│   ├── services/                # Business logic
│   │   ├── contractor-matcher.ts
│   │   ├── bid-request-builder.ts
│   │   ├── invitation-sender.ts
│   │   └── bid-analyzer.ts
│   ├── events/                  # Event handlers
│   │   ├── handlers.ts
│   │   └── emitters.ts
│   └── types.ts                 # TypeScript types
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md
```

## 2.3 Inter-App Communication Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MINI-APP COMMUNICATION MATRIX                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ FROM ↓ / TO →   │ 01  02  03  04  05  06  07  08  09  10  11  12  13  14  │
│ ────────────────┼───────────────────────────────────────────────────────── │
│ 01 Bid Engine   │  -   E   .   .   .   .   E   E   Q   E   .   .   .   .  │
│ 02 Visit Sched  │  .   -   .   E   .   E   .   E   Q   .   E   Q   E   .  │
│ 03 Change Order │  .   .   -   E   .   .   E   E   Q   E   E   E   .   Q  │
│ 04 Report Gen   │  .   E   E   -   E   E   E   E   .   E   E   .   E   .  │
│ 05 Permit Track │  .   .   .   E   -   E   .   E   Q   E   E   E   .   .  │
│ 06 Inspection   │  .   E   .   E   E   -   .   E   Q   E   E   E   E   .  │
│ 07 Budget Track │  E   .   E   E   .   .   -   E   Q   E   E   .   .   Q  │
│ 08 Communicatn  │  .   .   .   .   .   .   .   -   .   .   .   .   .   .  │
│ 09 Task Queue   │  Q   Q   Q   Q   Q   Q   Q   Q   -   Q   Q   Q   Q   Q  │
│ 10 Document Gen │  .   .   E   E   E   E   .   E   .   -   .   .   .   .  │
│ 11 Predictive   │  .   E   E   E   E   E   E   E   Q   .   -   E   E   Q  │
│ 12 Smart Sched  │  .   E   .   .   E   E   .   E   Q   .   E   -   .   Q  │
│ 13 QA Inspector │  .   E   .   E   .   E   .   E   Q   .   E   .   -   Q  │
│ 14 Decision AI  │  .   .   .   .   .   .   .   E   .   .   Q   Q   Q   -  │
│                                                                             │
│ Legend: E = Event Bus, Q = Queue Job, . = No direct communication          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. INTEGRATION PATTERNS {#integration-patterns}

## 3.1 Event-Driven Integration

```typescript
// packages/events/src/types.ts
// ════════════════════════════════════════════════════════════════════════════

export const KEALEE_EVENTS = {
  // Project Lifecycle
  PROJECT_CREATED: 'kealee.project.created',
  PROJECT_PHASE_CHANGED: 'kealee.project.phase_changed',
  PROJECT_COMPLETED: 'kealee.project.completed',
  
  // Bid Events (APP-01)
  BID_REQUEST_CREATED: 'kealee.bid.request_created',
  BID_INVITATION_SENT: 'kealee.bid.invitation_sent',
  BID_SUBMITTED: 'kealee.bid.submitted',
  BID_ANALYSIS_COMPLETE: 'kealee.bid.analysis_complete',
  
  // Visit Events (APP-02)
  VISIT_SCHEDULED: 'kealee.visit.scheduled',
  VISIT_COMPLETED: 'kealee.visit.completed',
  VISIT_REPORT_GENERATED: 'kealee.visit.report_generated',
  
  // Change Order Events (APP-03)
  CHANGE_ORDER_CREATED: 'kealee.change_order.created',
  CHANGE_ORDER_APPROVED: 'kealee.change_order.approved',
  CHANGE_ORDER_REJECTED: 'kealee.change_order.rejected',
  
  // Permit Events (APP-05)
  PERMIT_STATUS_CHANGED: 'kealee.permit.status_changed',
  PERMIT_APPROVED: 'kealee.permit.approved',
  
  // Inspection Events (APP-06)
  INSPECTION_SCHEDULED: 'kealee.inspection.scheduled',
  INSPECTION_COMPLETED: 'kealee.inspection.completed',
  INSPECTION_FAILED: 'kealee.inspection.failed',
  
  // Budget Events (APP-07)
  BUDGET_THRESHOLD_EXCEEDED: 'kealee.budget.threshold_exceeded',
  BUDGET_VARIANCE_DETECTED: 'kealee.budget.variance_detected',
  
  // Task Events (APP-09)
  TASK_CREATED: 'kealee.task.created',
  TASK_COMPLETED: 'kealee.task.completed',
  TASK_OVERDUE: 'kealee.task.overdue',
  
  // AI Events (APP-11-14)
  PREDICTION_GENERATED: 'kealee.ai.prediction_generated',
  RISK_ALERT: 'kealee.ai.risk_alert',
  QA_ISSUE_DETECTED: 'kealee.ai.qa_issue_detected',
} as const;

export interface KealeeEvent<T = unknown> {
  id: string;
  type: keyof typeof KEALEE_EVENTS;
  source: string;                    // Which app emitted
  timestamp: string;
  correlationId?: string;            // For tracing
  data: T;
  metadata?: Record<string, unknown>;
}
```

```typescript
// packages/events/src/bus.ts
// ════════════════════════════════════════════════════════════════════════════

import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { KealeeEvent, KEALEE_EVENTS } from './types';
import { v4 as uuid } from 'uuid';

export class KealeeEventBus extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private readonly channel = 'kealee:events';
  private source: string;

  constructor(source: string) {
    super();
    this.source = source;
    this.publisher = new Redis(process.env.REDIS_URL!);
    this.subscriber = new Redis(process.env.REDIS_URL!);
    this.initializeSubscriber();
  }

  private initializeSubscriber() {
    this.subscriber.subscribe(this.channel);
    this.subscriber.on('message', (_, message) => {
      try {
        const event: KealeeEvent = JSON.parse(message);
        // Emit to local listeners
        this.emit(event.type, event);
        this.emit('*', event); // Wildcard listener
      } catch (error) {
        console.error('[EventBus] Parse error:', error);
      }
    });
  }

  async publish<T>(
    type: keyof typeof KEALEE_EVENTS,
    data: T,
    correlationId?: string
  ): Promise<string> {
    const event: KealeeEvent<T> = {
      id: uuid(),
      type,
      source: this.source,
      timestamp: new Date().toISOString(),
      correlationId,
      data,
    };

    await this.publisher.publish(this.channel, JSON.stringify(event));
    
    // Also store in event log for auditing
    await this.publisher.lpush(
      `kealee:event_log:${type}`,
      JSON.stringify(event)
    );
    await this.publisher.ltrim(`kealee:event_log:${type}`, 0, 999);

    return event.id;
  }

  subscribe<T>(
    type: keyof typeof KEALEE_EVENTS | '*',
    handler: (event: KealeeEvent<T>) => void | Promise<void>
  ): void {
    this.on(type, handler);
  }

  unsubscribe(type: string, handler: Function): void {
    this.off(type, handler as any);
  }

  async close(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}

// Singleton factory
let eventBus: KealeeEventBus | null = null;

export function getEventBus(source: string): KealeeEventBus {
  if (!eventBus) {
    eventBus = new KealeeEventBus(source);
  }
  return eventBus;
}
```

## 3.2 Queue-Based Integration

```typescript
// packages/queue/src/queues.ts
// ════════════════════════════════════════════════════════════════════════════

import { Queue, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

// Redis connection factory
const createConnection = () => new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue names for all 14 mini-apps
export const QUEUE_NAMES = {
  // Core Operations
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
  
  // AI Operations
  PREDICTIVE: 'kealee:predictive-engine',
  SMART_SCHEDULER: 'kealee:smart-scheduler',
  QA_INSPECTOR: 'kealee:qa-inspector',
  DECISION_SUPPORT: 'kealee:decision-support',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// Queue factory
const queues = new Map<string, Queue>();
const schedulers = new Map<string, QueueScheduler>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, { connection: createConnection() });
    queues.set(name, queue);
    
    // Create scheduler for delayed jobs
    const scheduler = new QueueScheduler(name, { connection: createConnection() });
    schedulers.set(name, scheduler);
  }
  return queues.get(name)!;
}

// Job options presets
export const JOB_OPTIONS = {
  DEFAULT: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 1000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800 },
  },
  HIGH_PRIORITY: {
    priority: 1,
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 500 },
  },
  LOW_PRIORITY: {
    priority: 10,
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 5000 },
  },
  SCHEDULED: {
    attempts: 3,
    backoff: { type: 'fixed' as const, delay: 5000 },
    removeOnComplete: { age: 3600 },
  },
} as const;
```

## 3.3 API Gateway Pattern

```typescript
// services/command-center/gateway/src/server.ts
// ════════════════════════════════════════════════════════════════════════════

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { verifySupabaseToken } from '@kealee/auth';

const server = Fastify({
  logger: true,
  trustProxy: true,
});

// Middleware
await server.register(cors, {
  origin: [
    'https://app.kealee.com',
    'https://admin.kealee.com',
    'https://api.kealee.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000',
  ].filter(Boolean),
  credentials: true,
});

await server.register(helmet);
await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Authentication middleware
server.addHook('preHandler', async (request, reply) => {
  // Skip health checks
  if (request.url === '/health') return;
  
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  try {
    const user = await verifySupabaseToken(token);
    request.user = user;
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
});

// Health check
server.get('/health', async () => ({ status: 'healthy', timestamp: new Date().toISOString() }));

// Register mini-app routes
import { bidEngineRoutes } from '../apps/APP-01-bid-engine/src/routes';
import { visitSchedulerRoutes } from '../apps/APP-02-visit-scheduler/src/routes';
import { changeOrderRoutes } from '../apps/APP-03-change-order/src/routes';
import { reportGeneratorRoutes } from '../apps/APP-04-report-generator/src/routes';
import { permitTrackerRoutes } from '../apps/APP-05-permit-tracker/src/routes';
import { inspectionRoutes } from '../apps/APP-06-inspection/src/routes';
import { budgetTrackerRoutes } from '../apps/APP-07-budget-tracker/src/routes';
import { communicationRoutes } from '../apps/APP-08-communication/src/routes';
import { taskQueueRoutes } from '../apps/APP-09-task-queue/src/routes';
import { documentRoutes } from '../apps/APP-10-document-gen/src/routes';
import { predictiveRoutes } from '../apps/APP-11-predictive/src/routes';
import { smartSchedulerRoutes } from '../apps/APP-12-smart-scheduler/src/routes';
import { qaInspectorRoutes } from '../apps/APP-13-qa-inspector/src/routes';
import { decisionSupportRoutes } from '../apps/APP-14-decision-support/src/routes';

// Mount routes with prefixes
server.register(bidEngineRoutes, { prefix: '/v1/bids' });
server.register(visitSchedulerRoutes, { prefix: '/v1/visits' });
server.register(changeOrderRoutes, { prefix: '/v1/change-orders' });
server.register(reportGeneratorRoutes, { prefix: '/v1/reports' });
server.register(permitTrackerRoutes, { prefix: '/v1/permits' });
server.register(inspectionRoutes, { prefix: '/v1/inspections' });
server.register(budgetTrackerRoutes, { prefix: '/v1/budget' });
server.register(communicationRoutes, { prefix: '/v1/communications' });
server.register(taskQueueRoutes, { prefix: '/v1/tasks' });
server.register(documentRoutes, { prefix: '/v1/documents' });
server.register(predictiveRoutes, { prefix: '/v1/ai/predict' });
server.register(smartSchedulerRoutes, { prefix: '/v1/ai/schedule' });
server.register(qaInspectorRoutes, { prefix: '/v1/ai/qa' });
server.register(decisionSupportRoutes, { prefix: '/v1/ai/decision' });

// Start server
const start = async () => {
  try {
    await server.listen({
      port: parseInt(process.env.PORT || '4000'),
      host: '0.0.0.0',
    });
    console.log(`🚀 Command Center Gateway running on port ${process.env.PORT || 4000}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

---

# 4. INTERACTION WITH os-admin & os-pm {#interactions}

## 4.1 os-pm ↔ Command Center Interaction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   os-pm ↔ COMMAND CENTER INTERACTION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           os-pm (Vercel)                            │   │
│  │                                                                     │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │Dashboard│  │ Bids UI │  │Visits UI│  │Budget UI│  │  AI UI  │  │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │   │
│  │       │            │            │            │            │        │   │
│  │       └────────────┴────────────┼────────────┴────────────┘        │   │
│  │                                 │                                   │   │
│  │                    ┌────────────┴────────────┐                     │   │
│  │                    │    API Client Layer     │                     │   │
│  │                    │   (TanStack Query)      │                     │   │
│  │                    └────────────┬────────────┘                     │   │
│  │                                 │                                   │   │
│  └─────────────────────────────────┼───────────────────────────────────┘   │
│                                    │                                       │
│                                    │ HTTPS + JWT                          │
│                                    │                                       │
│  ┌─────────────────────────────────┼───────────────────────────────────┐   │
│  │                                 ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                Command Center Gateway (Railway)              │   │   │
│  │  │                   command.kealee.com                         │   │   │
│  │  └───────────────────────────┬─────────────────────────────────┘   │   │
│  │                              │                                      │   │
│  │      ┌───────────────────────┼───────────────────────┐             │   │
│  │      │                       │                       │             │   │
│  │      ▼                       ▼                       ▼             │   │
│  │  ┌───────────┐         ┌───────────┐         ┌───────────┐        │   │
│  │  │  APP-01   │         │  APP-02   │         │  APP-11   │        │   │
│  │  │Bid Engine │         │  Visits   │         │Predictive │        │   │
│  │  └─────┬─────┘         └─────┬─────┘         └─────┬─────┘        │   │
│  │        │                     │                     │               │   │
│  │        └─────────────────────┼─────────────────────┘               │   │
│  │                              │                                      │   │
│  │                    ┌─────────┴─────────┐                           │   │
│  │                    │  Shared Database  │                           │   │
│  │                    │    (Supabase)     │                           │   │
│  │                    └───────────────────┘                           │   │
│  │                                                                     │   │
│  │                      COMMAND CENTER (Railway)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### os-pm API Client

```typescript
// apps/os-pm/lib/api/command-center.ts
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const COMMAND_CENTER_URL = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL!;

class CommandCenterClient {
  private baseUrl: string;
  private getToken: () => Promise<string>;

  constructor() {
    this.baseUrl = COMMAND_CENTER_URL;
    this.getToken = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || '';
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.getToken();
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BID ENGINE (APP-01)
  // ═══════════════════════════════════════════════════════════════════════
  
  bids = {
    createRequest: (data: CreateBidRequestInput) =>
      this.request<BidRequest>('POST', '/v1/bids/requests', data),
    
    getRequest: (id: string) =>
      this.request<BidRequest>('GET', `/v1/bids/requests/${id}`),
    
    findContractors: (criteria: MatchCriteria) =>
      this.request<ContractorMatch[]>('POST', '/v1/bids/match', criteria),
    
    analyzeBids: (requestId: string) =>
      this.request<BidAnalysis>('POST', `/v1/bids/requests/${requestId}/analyze`),
    
    getComparison: (requestId: string) =>
      this.request<BidComparison>('GET', `/v1/bids/requests/${requestId}/comparison`),
  };

  // ═══════════════════════════════════════════════════════════════════════
  // VISIT SCHEDULER (APP-02)
  // ═══════════════════════════════════════════════════════════════════════
  
  visits = {
    schedule: (data: ScheduleVisitInput) =>
      this.request<ScheduledVisit>('POST', '/v1/visits', data),
    
    getForPM: (pmId: string, params?: { start?: string; end?: string }) =>
      this.request<ScheduledVisit[]>('GET', `/v1/visits/pm/${pmId}`, params),
    
    getForProject: (projectId: string) =>
      this.request<ScheduledVisit[]>('GET', `/v1/visits/project/${projectId}`),
    
    optimizeRoute: (pmId: string, date: string) =>
      this.request<RouteOptimization>('POST', '/v1/visits/optimize-route', { pmId, date }),
    
    complete: (visitId: string, report: VisitReport) =>
      this.request<void>('POST', `/v1/visits/${visitId}/complete`, report),
    
    cancel: (visitId: string, reason: string) =>
      this.request<void>('POST', `/v1/visits/${visitId}/cancel`, { reason }),
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CHANGE ORDERS (APP-03)
  // ═══════════════════════════════════════════════════════════════════════
  
  changeOrders = {
    create: (data: CreateChangeOrderInput) =>
      this.request<ChangeOrder>('POST', '/v1/change-orders', data),
    
    get: (id: string) =>
      this.request<ChangeOrder>('GET', `/v1/change-orders/${id}`),
    
    analyze: (id: string) =>
      this.request<ChangeOrderImpact>('POST', `/v1/change-orders/${id}/analyze`),
    
    submit: (id: string) =>
      this.request<void>('POST', `/v1/change-orders/${id}/submit`),
    
    listForProject: (projectId: string) =>
      this.request<ChangeOrder[]>('GET', `/v1/change-orders/project/${projectId}`),
  };

  // ═══════════════════════════════════════════════════════════════════════
  // REPORTS (APP-04)
  // ═══════════════════════════════════════════════════════════════════════
  
  reports = {
    generate: (config: GenerateReportConfig) =>
      this.request<Report>('POST', '/v1/reports/generate', config),
    
    get: (id: string) =>
      this.request<Report>('GET', `/v1/reports/${id}`),
    
    send: (id: string, recipients: string[]) =>
      this.request<void>('POST', `/v1/reports/${id}/send`, { recipients }),
    
    listForProject: (projectId: string) =>
      this.request<Report[]>('GET', `/v1/reports/project/${projectId}`),
  };

  // ═══════════════════════════════════════════════════════════════════════
  // AI FEATURES (APP-11-14)
  // ═══════════════════════════════════════════════════════════════════════
  
  ai = {
    predictDelay: (projectId: string) =>
      this.request<DelayPrediction>('GET', `/v1/ai/predict/delay/${projectId}`),
    
    predictCostOverrun: (projectId: string) =>
      this.request<CostPrediction>('GET', `/v1/ai/predict/cost/${projectId}`),
    
    fullRiskAnalysis: (projectId: string) =>
      this.request<RiskAnalysis>('GET', `/v1/ai/predict/risk/${projectId}`),
    
    analyzePhoto: (projectId: string, photoUrl: string, type: string) =>
      this.request<PhotoAnalysis>('POST', '/v1/ai/qa/analyze', { projectId, photoUrl, type }),
    
    getQualityScore: (projectId: string) =>
      this.request<QualityScore>('GET', `/v1/ai/qa/score/${projectId}`),
    
    getRecommendation: (context: DecisionContext) =>
      this.request<AIRecommendation>('POST', '/v1/ai/decision/recommend', context),
    
    getInsights: (projectId: string) =>
      this.request<ProjectInsights>('GET', `/v1/ai/decision/insights/${projectId}`),
    
    chat: (projectId: string, message: string, history?: Message[]) =>
      this.request<ChatResponse>('POST', '/v1/ai/decision/chat', { projectId, message, history }),
  };

  // ... additional endpoints for other apps
}

export const commandCenter = new CommandCenterClient();
```

### os-pm React Query Hooks

```typescript
// apps/os-pm/lib/hooks/use-command-center.ts
// ════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commandCenter } from '../api/command-center';

// ═══════════════════════════════════════════════════════════════════════════
// BID ENGINE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useBidRequest(id: string) {
  return useQuery({
    queryKey: ['bid-request', id],
    queryFn: () => commandCenter.bids.getRequest(id),
    enabled: !!id,
  });
}

export function useCreateBidRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: commandCenter.bids.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-requests'] });
    },
  });
}

export function useContractorMatching() {
  return useMutation({
    mutationFn: commandCenter.bids.findContractors,
  });
}

export function useBidAnalysis(requestId: string) {
  return useMutation({
    mutationFn: () => commandCenter.bids.analyzeBids(requestId),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIT SCHEDULER HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function usePMVisits(pmId: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['pm-visits', pmId, dateRange],
    queryFn: () => commandCenter.visits.getForPM(pmId, dateRange),
    enabled: !!pmId,
  });
}

export function useScheduleVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: commandCenter.visits.schedule,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pm-visits'] });
      queryClient.invalidateQueries({ queryKey: ['project-visits', variables.projectId] });
    },
  });
}

export function useRouteOptimization() {
  return useMutation({
    mutationFn: ({ pmId, date }: { pmId: string; date: string }) =>
      commandCenter.visits.optimizeRoute(pmId, date),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AI HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useDelayPrediction(projectId: string) {
  return useQuery({
    queryKey: ['delay-prediction', projectId],
    queryFn: () => commandCenter.ai.predictDelay(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRiskAnalysis(projectId: string) {
  return useQuery({
    queryKey: ['risk-analysis', projectId],
    queryFn: () => commandCenter.ai.fullRiskAnalysis(projectId),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProjectInsights(projectId: string) {
  return useQuery({
    queryKey: ['project-insights', projectId],
    queryFn: () => commandCenter.ai.getInsights(projectId),
    enabled: !!projectId,
  });
}

export function useAIChat(projectId: string) {
  return useMutation({
    mutationFn: ({ message, history }: { message: string; history?: Message[] }) =>
      commandCenter.ai.chat(projectId, message, history),
  });
}

export function usePhotoAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: commandCenter.ai.analyzePhoto,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quality-score', variables.projectId] });
    },
  });
}
```

## 4.2 os-admin ↔ Command Center Interaction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  os-admin ↔ COMMAND CENTER INTERACTION                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         os-admin (Vercel)                           │   │
│  │                                                                     │   │
│  │  ADMIN VIEWS FOR COMMAND CENTER:                                   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  /command-center                                            │   │   │
│  │  │  ├── Overview Dashboard (all 14 apps status)               │   │   │
│  │  │  ├── /jobs (Queue monitoring - BullMQ Board)               │   │   │
│  │  │  ├── /workers (Worker health & scaling)                    │   │   │
│  │  │  ├── /events (Event log & replay)                          │   │   │
│  │  │  ├── /settings (App configurations)                        │   │   │
│  │  │  └── /analytics (Usage metrics)                            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ADMIN OPERATIONS:                                                 │   │
│  │  • View/retry failed jobs                                          │   │
│  │  • Pause/resume queues                                             │   │
│  │  • View worker status                                              │   │
│  │  • Configure app settings                                          │   │
│  │  • View event history                                              │   │
│  │  • Replay events                                                   │   │
│  │  • View usage analytics                                            │   │
│  │                                                                     │   │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│                                    │ Admin API Calls                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  Command Center Admin API                           │   │
│  │                                                                     │   │
│  │  POST /admin/queues/:name/pause                                    │   │
│  │  POST /admin/queues/:name/resume                                   │   │
│  │  POST /admin/jobs/:id/retry                                        │   │
│  │  DELETE /admin/jobs/:id                                            │   │
│  │  GET  /admin/workers                                               │   │
│  │  GET  /admin/events                                                │   │
│  │  POST /admin/events/:id/replay                                     │   │
│  │  GET  /admin/metrics                                               │   │
│  │  PUT  /admin/settings/:app                                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### os-admin Command Center Dashboard

```typescript
// apps/os-admin/app/(dashboard)/command-center/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kealee/ui';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { AppStatusGrid } from './components/app-status-grid';
import { QueueMetrics } from './components/queue-metrics';
import { RecentEvents } from './components/recent-events';
import { WorkerHealth } from './components/worker-health';

export default function CommandCenterPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Command Center</h1>
        <div className="flex gap-2">
          <Badge variant="success">14 Apps Active</Badge>
          <Badge variant="default">All Systems Operational</Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12% from last hour</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed (24h)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,842</div>
            <p className="text-xs text-muted-foreground">99.2% success rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31</div>
            <p className="text-xs text-muted-foreground">12 need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">p95: 3.4s</p>
          </CardContent>
        </Card>
      </div>

      {/* App Status Grid */}
      <Suspense fallback={<div>Loading apps...</div>}>
        <AppStatusGrid />
      </Suspense>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Queue Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <QueueMetrics />
            </Suspense>
          </CardContent>
        </Card>

        {/* Worker Health */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Health</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <WorkerHealth />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <RecentEvents />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# 5. STANDARD OPERATING PROCEDURES (SOPs) {#sops}

## SOP-001: Adding a New Mini-App

```markdown
# SOP-001: Adding a New Mini-App to Command Center
Version: 1.0
Last Updated: January 2026

## Purpose
Standardize the process for adding new automation apps to the Command Center.

## Prerequisites
- [ ] Business requirements documented
- [ ] API contract defined
- [ ] Database schema additions identified
- [ ] Integration points mapped

## Procedure

### Step 1: Create App Structure (30 min)
```bash
# From services/command-center directory
mkdir -p apps/APP-XX-{app-name}/src/{jobs,services,events}
touch apps/APP-XX-{app-name}/src/{index,worker,routes,types}.ts
touch apps/APP-XX-{app-name}/{package.json,tsconfig.json,README.md}
```

### Step 2: Define Package.json
```json
{
  "name": "@kealee/app-xx-{name}",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "@kealee/database": "workspace:*",
    "@kealee/events": "workspace:*",
    "@kealee/queue": "workspace:*"
  }
}
```

### Step 3: Implement Worker
```typescript
// src/worker.ts
import { createWorker } from '@kealee/queue';
import { QUEUE_NAMES } from '@kealee/queue';

export const worker = createWorker(
  QUEUE_NAMES.{QUEUE_NAME},
  async (job) => {
    switch (job.data.type) {
      case 'JOB_TYPE_1':
        return await handleJobType1(job.data);
      // ... other job types
    }
  },
  { concurrency: 5 }
);
```

### Step 4: Implement Routes
```typescript
// src/routes.ts
import { FastifyPluginAsync } from 'fastify';

export const routes: FastifyPluginAsync = async (server) => {
  server.post('/', async (request, reply) => {
    // Implementation
  });
  
  server.get('/:id', async (request, reply) => {
    // Implementation
  });
};
```

### Step 5: Register with Gateway
```typescript
// gateway/src/server.ts
import { routes as appXXRoutes } from '../apps/APP-XX-{name}/src/routes';
server.register(appXXRoutes, { prefix: '/v1/{resource}' });
```

### Step 6: Add to Worker Orchestration
```typescript
// workers/src/main.ts
import { worker as appXXWorker } from '../apps/APP-XX-{name}/src/worker';
workers.push({ name: 'APP-XX', worker: appXXWorker });
```

### Step 7: Update Database Schema
```prisma
// packages/database/prisma/schema.prisma
// Add new models as needed
```

### Step 8: Create Tests
- Unit tests for services
- Integration tests for routes
- Worker job tests

### Step 9: Documentation
- Update README.md
- Add API documentation
- Update architecture diagrams

## Verification Checklist
- [ ] Worker starts without errors
- [ ] Routes respond correctly
- [ ] Events emit and receive
- [ ] Database operations work
- [ ] Tests pass
- [ ] Documentation complete

## Rollback Procedure
1. Revert code changes
2. Remove queue from BullMQ
3. Run database rollback if needed
```

## SOP-002: Deploying Command Center Updates

```markdown
# SOP-002: Deploying Command Center Updates
Version: 1.0
Last Updated: January 2026

## Purpose
Standardize the deployment process for Command Center updates.

## Deployment Environments
- Development: `dev-command.kealee.com`
- Staging: `staging-command.kealee.com`
- Production: `command.kealee.com`

## Procedure

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Rollback plan documented

### Step 1: Merge to Main Branch
```bash
# Ensure all CI checks pass
git checkout main
git pull origin main
git merge feature/your-feature
git push origin main
```

### Step 2: Railway Auto-Deploy (Triggered)
Railway automatically deploys on push to main:
1. Build triggered via GitHub webhook
2. Docker image built
3. Health check performed
4. Traffic gradually shifted

### Step 3: Monitor Deployment
```bash
# Check Railway deployment status
railway status

# View logs
railway logs -f
```

### Step 4: Verify Health
```bash
# Health check
curl https://command.kealee.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-26T12:00:00Z",
  "version": "1.2.3",
  "workers": {
    "bid-engine": "running",
    "visit-scheduler": "running",
    ...
  }
}
```

### Step 5: Verify Queues
1. Open os-admin → Command Center → Jobs
2. Confirm queues processing normally
3. Check for any stuck jobs

### Step 6: Smoke Tests
- [ ] Create test bid request
- [ ] Schedule test visit
- [ ] Generate test report
- [ ] Run AI prediction

## Rollback Procedure

### Immediate Rollback (< 5 min)
```bash
# Railway rollback to previous deployment
railway rollback
```

### Database Rollback (if needed)
```bash
# Run down migration
pnpm prisma migrate resolve --rolled-back {migration_name}
```

## Post-Deployment
- [ ] Update changelog
- [ ] Notify team in Slack
- [ ] Monitor error rates for 1 hour
- [ ] Close deployment ticket
```

## SOP-003: Handling Failed Jobs

```markdown
# SOP-003: Handling Failed Jobs
Version: 1.0
Last Updated: January 2026

## Purpose
Standardize the process for investigating and resolving failed jobs.

## Alert Triggers
- Job failure rate > 5% in 1 hour
- Critical job type fails
- Same job fails 3+ times

## Procedure

### Step 1: Identify Failed Job
1. Open os-admin → Command Center → Jobs
2. Filter by status: "Failed"
3. Note job ID, type, and error message

### Step 2: Investigate
```bash
# View job details via API
curl -H "Authorization: Bearer $TOKEN" \
  https://command.kealee.com/admin/jobs/{job_id}
```

Check:
- Error message and stack trace
- Job payload
- Attempt history
- Related events

### Step 3: Categorize Failure

| Category | Action | Example |
|----------|--------|---------|
| Transient | Auto-retry | Network timeout |
| Data Error | Fix data, retry | Invalid project ID |
| Bug | Fix code, retry | Null reference |
| External | Wait, retry | Third-party API down |
| Permanent | Remove job | Deleted resource |

### Step 4: Resolution

#### For Transient Failures:
```bash
# Retry job
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://command.kealee.com/admin/jobs/{job_id}/retry
```

#### For Data Errors:
1. Fix the underlying data issue
2. Retry the job
3. Document the root cause

#### For Bugs:
1. Create bug ticket
2. Fix code and deploy
3. Retry affected jobs

#### For Permanent Failures:
```bash
# Remove job from queue
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://command.kealee.com/admin/jobs/{job_id}
```

### Step 5: Document
- Update incident log
- Create follow-up tickets if needed
- Update monitoring thresholds if needed
```

## SOP-004: Database Migration

```markdown
# SOP-004: Database Schema Migration
Version: 1.0
Last Updated: January 2026

## Purpose
Standardize database schema changes that affect Command Center.

## Prerequisites
- [ ] Migration script created
- [ ] Migration tested locally
- [ ] Migration tested on staging
- [ ] Rollback script prepared
- [ ] Team notified

## Procedure

### Step 1: Create Migration
```bash
cd packages/database
pnpm prisma migrate dev --name {migration_name}
```

### Step 2: Review Migration SQL
```bash
cat prisma/migrations/{timestamp}_{name}/migration.sql
```

Verify:
- No data loss
- Indexes added where needed
- Default values for new required fields
- No breaking changes to existing queries

### Step 3: Test Migration
```bash
# On local database
pnpm prisma migrate deploy

# Verify
pnpm prisma db pull
```

### Step 4: Deploy to Staging
```bash
# Set DATABASE_URL to staging
export DATABASE_URL="{staging_url}"
pnpm prisma migrate deploy
```

### Step 5: Verify on Staging
1. Run Command Center tests against staging
2. Verify all apps functioning
3. Check query performance

### Step 6: Deploy to Production
```bash
# During maintenance window
export DATABASE_URL="{production_url}"
pnpm prisma migrate deploy
```

### Step 7: Verify Production
- [ ] All migrations applied
- [ ] No query errors
- [ ] Performance acceptable
- [ ] Command Center apps running

## Rollback Procedure
```bash
# Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back {migration_name}

# Apply rollback SQL manually if needed
psql $DATABASE_URL < rollback.sql
```
```

---

# 6. WORKFLOW DIAGRAMS {#workflows}

## 6.1 Request Flow: os-pm → Command Center → Response

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW: CREATE BID REQUEST                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PM USER                     os-pm                    COMMAND CENTER        │
│  ════════                    ═════                    ══════════════        │
│                                                                             │
│     │                          │                           │                │
│     │  1. Click "Create Bid"   │                           │                │
│     │─────────────────────────▶│                           │                │
│     │                          │                           │                │
│     │                          │  2. POST /v1/bids/requests│                │
│     │                          │   { projectId, trades,    │                │
│     │                          │     scope, deadline }     │                │
│     │                          │──────────────────────────▶│                │
│     │                          │                           │                │
│     │                          │                           │  3. Validate   │
│     │                          │                           │     request    │
│     │                          │                           │                │
│     │                          │                           │  4. Create     │
│     │                          │                           │     BidRequest │
│     │                          │                           │     in DB      │
│     │                          │                           │                │
│     │                          │                           │  5. Queue job: │
│     │                          │                           │   FIND_CONTRACTORS
│     │                          │                           │                │
│     │                          │                           │  6. Emit event:│
│     │                          │                           │   BID_REQUEST_ │
│     │                          │                           │     CREATED    │
│     │                          │                           │                │
│     │                          │  7. Return:               │                │
│     │                          │   { id, status: 'OPEN' }  │                │
│     │                          │◀──────────────────────────│                │
│     │                          │                           │                │
│     │  8. Show confirmation    │                           │                │
│     │     + redirect to        │                           │                │
│     │     contractor matching  │                           │                │
│     │◀─────────────────────────│                           │                │
│     │                          │                           │                │
│                                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                     BACKGROUND (Async via Worker)                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                             │
│                              BID ENGINE WORKER                              │
│                              ════════════════                              │
│                                                                             │
│                                    │                                        │
│                                    │  9. Process FIND_CONTRACTORS job      │
│                                    │                                        │
│                                    │  10. Query contractors by:            │
│                                    │      - Location (within 50mi)         │
│                                    │      - Trades (matching)              │
│                                    │      - Rating (≥3.5★)                 │
│                                    │      - Credentials (valid)            │
│                                    │                                        │
│                                    │  11. Score & rank contractors         │
│                                    │                                        │
│                                    │  12. Store matches in DB              │
│                                    │                                        │
│                                    │  13. Emit event:                      │
│                                    │      CONTRACTORS_MATCHED              │
│                                    │                                        │
│                                    ▼                                        │
│                                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                        REAL-TIME UPDATE (Optional)                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                             │
│     │                          │                           │                │
│     │                          │  14. WebSocket push:      │                │
│     │                          │◀─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                │
│     │                          │  { type: 'CONTRACTORS_    │                │
│     │                          │    MATCHED', count: 8 }   │                │
│     │                          │                           │                │
│     │  15. Update UI with      │                           │                │
│     │      matching contractors│                           │                │
│     │◀─────────────────────────│                           │                │
│     │                          │                           │                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Event Flow: Cross-App Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT FLOW: INSPECTION COMPLETED                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           APP-06 INSPECTION                                 │
│                                  │                                          │
│                                  │ 1. Inspection marked PASSED              │
│                                  │                                          │
│                                  ▼                                          │
│                     ┌────────────────────────┐                             │
│                     │   EMIT EVENT:          │                             │
│                     │   INSPECTION_COMPLETED │                             │
│                     │   {                    │                             │
│                     │     projectId: "...",  │                             │
│                     │     type: "FRAMING",   │                             │
│                     │     result: "PASSED",  │                             │
│                     │     permitId: "..."    │                             │
│                     │   }                    │                             │
│                     └───────────┬────────────┘                             │
│                                 │                                          │
│                                 │                                          │
│    ┌────────────────────────────┼────────────────────────────┐            │
│    │                            │                            │            │
│    │         EVENT BUS (Redis Pub/Sub)                      │            │
│    │                            │                            │            │
│    └────────────────────────────┼────────────────────────────┘            │
│                                 │                                          │
│         ┌───────────────────────┼───────────────────────┐                 │
│         │                       │                       │                 │
│         ▼                       ▼                       ▼                 │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │  APP-05         │    │  APP-04         │    │  APP-09         │        │
│  │  Permit Tracker │    │  Report Gen     │    │  Task Queue     │        │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│           │                      │                      │                  │
│           ▼                      ▼                      ▼                  │
│                                                                             │
│  2. Update permit      3. Add to next       4. Complete related            │
│     status:               project report:      inspection task:            │
│     "FRAMING_PASSED"      - Milestone          - Mark COMPLETED            │
│                           - Inspection         - Trigger next task         │
│                             result                                         │
│           │                      │                      │                  │
│           ▼                      ▼                      ▼                  │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │  EMIT EVENT:    │    │  No event       │    │  EMIT EVENT:    │        │
│  │  PERMIT_STATUS_ │    │  (internal)     │    │  TASK_COMPLETED │        │
│  │  CHANGED        │    │                 │    │                 │        │
│  └────────┬────────┘    └─────────────────┘    └────────┬────────┘        │
│           │                                             │                  │
│           │                                             │                  │
│           └──────────────────┬──────────────────────────┘                  │
│                              │                                             │
│                              ▼                                             │
│                                                                             │
│                    ┌─────────────────────┐                                 │
│                    │  APP-11 Predictive  │                                 │
│                    │  Engine             │                                 │
│                    └──────────┬──────────┘                                 │
│                               │                                            │
│                               ▼                                            │
│                                                                             │
│                    5. Recalculate project                                  │
│                       risk score:                                          │
│                       - Lower delay risk                                   │
│                       - Update confidence                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.3 Daily Automation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DAILY AUTOMATION WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TIME        CRON JOB                    ACTION                            │
│  ════        ════════                    ══════                            │
│                                                                             │
│  5:00 AM  ┌──────────────────────────────────────────────────────────────┐ │
│           │  PREDICTIVE_ANALYSIS                                         │ │
│           │  └─ Run delay predictions for all active projects           │ │
│           │  └─ Run cost overrun predictions                            │ │
│           │  └─ Generate risk alerts for high-probability items         │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  6:00 AM  ┌──────────────────────────────────────────────────────────────┐ │
│           │  MORNING_BRIEFING                                            │ │
│           │  └─ For each PM:                                             │ │
│           │      └─ Compile today's visits                               │ │
│           │      └─ Optimize route                                       │ │
│           │      └─ Get weather forecast                                 │ │
│           │      └─ List priority tasks                                  │ │
│           │      └─ Include AI alerts                                    │ │
│           │      └─ Send via email + SMS                                 │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Every    ┌──────────────────────────────────────────────────────────────┐ │
│  4 Hours  │  PERMIT_MONITORING                                           │ │
│           │  └─ Check all pending permits for status changes            │ │
│           │  └─ Scrape jurisdiction websites                            │ │
│           │  └─ Update permit records                                   │ │
│           │  └─ Send alerts for status changes                          │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Every    ┌──────────────────────────────────────────────────────────────┐ │
│  2 Hours  │  WORKLOAD_REBALANCING                                        │ │
│           │  └─ Calculate PM workloads                                   │ │
│           │  └─ Identify overloaded PMs                                  │ │
│           │  └─ Reassign low-priority tasks                             │ │
│           │  └─ Notify affected PMs                                      │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  5:00 PM  ┌──────────────────────────────────────────────────────────────┐ │
│           │  VISIT_REMINDERS                                             │ │
│           │  └─ Send tomorrow's visit reminders to PMs                  │ │
│           │  └─ Send client notifications (if opted in)                 │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  6:00 PM  ┌──────────────────────────────────────────────────────────────┐ │
│           │  OVERDUE_TASK_CHECK                                          │ │
│           │  └─ Find overdue tasks                                       │ │
│           │  └─ Emit TASK_OVERDUE events                                │ │
│           │  └─ Send notifications to assigned PMs                      │ │
│           │  └─ Escalate critical items                                 │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Sunday   ┌──────────────────────────────────────────────────────────────┐ │
│  8:00 PM  │  SCHEDULE_WEEKLY_REPORTS                                     │ │
│           │  └─ For each active project:                                 │ │
│           │      └─ Queue report generation based on package tier       │ │
│           │      └─ Package A: Skip (monthly)                           │ │
│           │      └─ Package B: Biweekly check                           │ │
│           │      └─ Package C/D: Generate weekly report                 │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  1st of   ┌──────────────────────────────────────────────────────────────┐ │
│  Month    │  AUTO_SCHEDULE_VISITS                                        │ │
│  12:00 AM │  └─ For each active project:                                 │ │
│           │      └─ Determine required visits for month                  │ │
│           │      └─ Schedule visits based on package tier               │ │
│           │      └─ Consider existing schedules                         │ │
│           │      └─ Notify PMs of scheduled visits                      │ │
│           └──────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. MIGRATION IMPLEMENTATION PLAN {#migration}

## 7.1 Migration Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MIGRATION IMPLEMENTATION PLAN                            │
│                         8-Week Timeline                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CURRENT STATE                           TARGET STATE                       │
│  ═════════════                           ════════════                       │
│                                                                             │
│  ┌─────────────────┐                     ┌─────────────────┐               │
│  │ Monolith API    │                     │ Core API        │               │
│  │ (All PM logic   │        ───▶         │ (Projects,      │               │
│  │  in one place)  │                     │  Users, Auth)   │               │
│  └─────────────────┘                     └────────┬────────┘               │
│                                                   │                         │
│                                                   │                         │
│                                          ┌───────┴───────┐                 │
│                                          │               │                 │
│                                          ▼               ▼                 │
│                                   ┌─────────────┐ ┌─────────────┐          │
│                                   │ Command     │ │ Scraper     │          │
│                                   │ Center      │ │ Service     │          │
│                                   │ (14 Apps)   │ │             │          │
│                                   └─────────────┘ └─────────────┘          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Week 1-2: INFRASTRUCTURE SETUP                                            │
│  ─────────────────────────────────────────────────────────────────────────│
│  □ Set up services/command-center directory structure                      │
│  □ Configure packages/events and packages/queue                            │
│  □ Set up Redis (Upstash) for queues and events                           │
│  □ Create Railway project for Command Center                               │
│  □ Configure GitHub Actions for CI/CD                                      │
│  □ Set up monitoring and logging                                          │
│                                                                             │
│  Week 3-4: CORE APPS MIGRATION                                             │
│  ─────────────────────────────────────────────────────────────────────────│
│  □ Migrate APP-01: Bid Engine                                              │
│  □ Migrate APP-02: Visit Scheduler                                         │
│  □ Migrate APP-09: Task Queue                                              │
│  □ Migrate APP-08: Communication Hub                                       │
│  □ Integrate with os-pm UI                                                 │
│  □ Test end-to-end flows                                                   │
│                                                                             │
│  Week 5-6: SECONDARY APPS MIGRATION                                        │
│  ─────────────────────────────────────────────────────────────────────────│
│  □ Migrate APP-03: Change Order                                            │
│  □ Migrate APP-04: Report Generator                                        │
│  □ Migrate APP-05: Permit Tracker                                          │
│  □ Migrate APP-06: Inspection Coordinator                                  │
│  □ Migrate APP-07: Budget Tracker                                          │
│  □ Migrate APP-10: Document Generator                                      │
│                                                                             │
│  Week 7: AI APPS MIGRATION                                                 │
│  ─────────────────────────────────────────────────────────────────────────│
│  □ Migrate APP-11: Predictive Engine                                       │
│  □ Migrate APP-12: Smart Scheduler                                         │
│  □ Migrate APP-13: QA Inspector                                            │
│  □ Migrate APP-14: Decision Support                                        │
│  □ Integrate AI dashboard in os-pm                                         │
│                                                                             │
│  Week 8: ADMIN & FINALIZATION                                              │
│  ─────────────────────────────────────────────────────────────────────────│
│  □ Build os-admin Command Center dashboard                                 │
│  □ Set up BullMQ Board for job monitoring                                  │
│  □ Configure alerting and on-call                                          │
│  □ Documentation and training                                              │
│  □ Production deployment                                                   │
│  □ Deprecate old PM endpoints                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Week-by-Week Implementation Tasks

### Week 1: Infrastructure Foundation

```bash
# Day 1-2: Create directory structure
cd kealee-platform-v10

# Create services directory
mkdir -p services/command-center/{apps,shared,gateway,workers}

# Create each app directory
for i in 01 02 03 04 05 06 07 08 09 10 11 12 13 14; do
  mkdir -p services/command-center/apps/APP-${i}/src/{jobs,services,events}
done

# Create shared packages
mkdir -p packages/{events,queue}/src
```

```bash
# Day 3: Set up shared packages

# packages/events/package.json
cat > packages/events/package.json << 'EOF'
{
  "name": "@kealee/events",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "ioredis": "^5.3.2",
    "uuid": "^9.0.0"
  }
}
EOF

# packages/queue/package.json
cat > packages/queue/package.json << 'EOF'
{
  "name": "@kealee/queue",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "bullmq": "^5.1.0",
    "ioredis": "^5.3.2"
  }
}
EOF
```

```bash
# Day 4: Configure Railway project
railway init command-center
railway add --database redis

# Set environment variables
railway variables set NODE_ENV=production
railway variables set REDIS_URL=$(railway variables get REDIS_URL)
railway variables set DATABASE_URL=<supabase_url>
```

```bash
# Day 5: GitHub Actions CI/CD
mkdir -p .github/workflows

cat > .github/workflows/command-center.yml << 'EOF'
name: Command Center CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'services/command-center/**'
      - 'packages/events/**'
      - 'packages/queue/**'
  pull_request:
    branches: [main]
    paths:
      - 'services/command-center/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter @kealee/events build
      - run: pnpm --filter @kealee/queue build
      - run: pnpm --filter "./services/command-center/**" build
      - run: pnpm --filter "./services/command-center/**" test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: railwayapp/railway-github-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: command-center
EOF
```

### Week 2: Gateway & Worker Setup

```typescript
// services/command-center/gateway/src/server.ts
// Complete gateway implementation (as shown earlier)

// services/command-center/workers/src/main.ts
import { Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

// Import all workers
import { bidEngineWorker } from '../../apps/APP-01/src/worker';
import { visitSchedulerWorker } from '../../apps/APP-02/src/worker';
// ... import all 14 workers

const workers: { name: string; worker: Worker }[] = [
  { name: 'Bid Engine', worker: bidEngineWorker },
  { name: 'Visit Scheduler', worker: visitSchedulerWorker },
  // ... all 14 workers
];

// Set up event handlers
workers.forEach(({ name, worker }) => {
  worker.on('completed', (job) => {
    console.log(`✓ [${name}] Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`✗ [${name}] Job ${job?.id} failed:`, err.message);
  });
});

console.log(`🚀 Command Center Workers Started (${workers.length} workers)`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await Promise.all(workers.map(({ worker }) => worker.close()));
  await connection.quit();
  process.exit(0);
});
```

### Week 3-4: Core Apps Migration

```typescript
// Migration script for APP-01: Bid Engine
// scripts/migrate-bid-engine.ts

import { prisma } from '@kealee/database';
import { getQueue, QUEUE_NAMES } from '@kealee/queue';

async function migrateBidEngine() {
  console.log('Starting Bid Engine migration...');
  
  // Step 1: Verify database schema
  const bidRequestCount = await prisma.bidRequest.count();
  console.log(`Found ${bidRequestCount} existing bid requests`);
  
  // Step 2: Migrate any pending jobs
  const pendingRequests = await prisma.bidRequest.findMany({
    where: { status: 'PENDING_MATCH' },
  });
  
  const queue = getQueue(QUEUE_NAMES.BID_ENGINE);
  
  for (const request of pendingRequests) {
    await queue.add('find-contractors', {
      type: 'FIND_CONTRACTORS',
      bidRequestId: request.id,
    });
    console.log(`Queued job for bid request ${request.id}`);
  }
  
  // Step 3: Update status
  console.log('Bid Engine migration complete');
}

migrateBidEngine().catch(console.error);
```

### Week 5-6: Secondary Apps

```bash
# Parallel migration of apps 03-10
# Each app follows the same pattern:
# 1. Copy business logic from monolith
# 2. Wrap in worker/routes structure
# 3. Add event emissions
# 4. Update os-pm to call Command Center
# 5. Test integration
```

### Week 7: AI Apps

```typescript
// AI apps require special handling for model integration
// services/command-center/shared/ai/claude.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateText(
  prompt: string,
  options?: { maxTokens?: number; systemPrompt?: string }
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options?.maxTokens || 4096,
    system: options?.systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(b => b.type === 'text');
  return (textBlock as any)?.text || '';
}
```

### Week 8: Admin Dashboard & Go-Live

```typescript
// apps/os-admin/app/(dashboard)/command-center/jobs/page.tsx
// BullMQ Board integration for job monitoring

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { getQueue, QUEUE_NAMES } from '@kealee/queue';

// Create board with all queues
const serverAdapter = new FastifyAdapter();

createBullBoard({
  queues: Object.values(QUEUE_NAMES).map(
    name => new BullMQAdapter(getQueue(name))
  ),
  serverAdapter,
});

// Mount at /admin/queues
serverAdapter.setBasePath('/admin/queues');
```

---

# 8. GITHUB + RAILWAY + VERCEL DEPLOYMENT {#deployment}

## 8.1 Repository Structure

```
kealee-platform-v10/
├── .github/
│   └── workflows/
│       ├── command-center.yml      # Command Center CI/CD
│       ├── os-pm.yml               # os-pm CI/CD
│       ├── os-admin.yml            # os-admin CI/CD
│       └── api.yml                 # Core API CI/CD
│
├── apps/
│   ├── os-pm/                      # → Vercel (app.kealee.com)
│   ├── os-admin/                   # → Vercel (admin.kealee.com)
│   └── api/                        # → Railway (api.kealee.com)
│
├── services/
│   └── command-center/             # → Railway (command.kealee.com)
│
├── vercel.json                     # Vercel monorepo config
├── railway.toml                    # Railway config
└── turbo.json                      # Turborepo config
```

## 8.2 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm turbo build --filter=os-pm...",
  "outputDirectory": "apps/os-pm/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_COMMAND_CENTER_URL": "@command_center_url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

```yaml
# .github/workflows/os-pm.yml
name: os-pm CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'apps/os-pm/**'
      - 'packages/ui/**'
      - 'packages/database/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PM_PROJECT_ID }}
          working-directory: ./
          vercel-args: '--prod'
```

## 8.3 Railway Configuration

```toml
# services/command-center/railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node dist/workers/src/main.js"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[service]
internalPort = 4000
```

```dockerfile
# services/command-center/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY services/command-center/ ./services/command-center/

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Build
RUN pnpm turbo build --filter=@kealee/command-center...

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/command-center/dist ./services/command-center/dist
COPY --from=builder /app/services/command-center/package.json ./services/command-center/

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "services/command-center/dist/workers/src/main.js"]
```

```yaml
# .github/workflows/command-center.yml
name: Command Center CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'services/command-center/**'
      - 'packages/events/**'
      - 'packages/queue/**'
      - 'packages/database/**'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm turbo build --filter=@kealee/command-center...
      - run: pnpm turbo test --filter=@kealee/command-center...
        env:
          REDIS_URL: redis://localhost:6379
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy Gateway
        run: railway up --service command-center-gateway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Deploy Workers
        run: railway up --service command-center-workers
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Health Check
        run: |
          sleep 30
          curl -f https://command.kealee.com/health || exit 1
```

## 8.4 Environment Variables

```bash
# Railway Environment Variables (command-center)
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://...@supabase.co:5432/postgres

# Redis
REDIS_URL=redis://...@upstash.io:6379

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Third-party integrations
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
DOCUSIGN_INTEGRATION_KEY=xxx
GOOGLE_MAPS_API_KEY=xxx
OPENWEATHER_API_KEY=xxx

# Internal
APP_URL=https://app.kealee.com
ADMIN_URL=https://admin.kealee.com
API_URL=https://api.kealee.com
```

```bash
# Vercel Environment Variables (os-pm)
NEXT_PUBLIC_COMMAND_CENTER_URL=https://command.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://api.kealee.com
```

---

# 9. CONFIGURATION & ENVIRONMENT {#configuration}

## 9.1 Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "tests/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "deploy": {
      "dependsOn": ["build", "test"]
    }
  }
}
```

## 9.2 pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'services/*'
  - 'services/command-center/apps/*'
```

## 9.3 TypeScript Configuration

```json
// services/command-center/tsconfig.json
{
  "extends": "../../packages/config/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@kealee/database": ["../../packages/database/src"],
      "@kealee/events": ["../../packages/events/src"],
      "@kealee/queue": ["../../packages/queue/src"]
    }
  },
  "include": [
    "apps/**/*.ts",
    "shared/**/*.ts",
    "gateway/**/*.ts",
    "workers/**/*.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
```

---

# 10. TESTING & VALIDATION {#testing}

## 10.1 Test Strategy

```typescript
// services/command-center/apps/APP-01/tests/bid-engine.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

describe('APP-01: Bid Engine', () => {
  let redis: Redis;
  let queue: Queue;

  beforeAll(async () => {
    redis = new Redis(process.env.REDIS_URL!);
    queue = new Queue('test:bid-engine', { connection: redis });
  });

  afterAll(async () => {
    await queue.close();
    await redis.quit();
  });

  describe('ContractorMatcher', () => {
    it('should find contractors within distance', async () => {
      const matcher = new ContractorMatcher();
      const results = await matcher.findMatches({
        projectId: 'test-project',
        trades: ['Electrical', 'Plumbing'],
        location: { lat: 38.9, lng: -77.0 },
        budgetRange: { min: 10000, max: 50000 },
        timeline: { start: new Date(), end: addDays(new Date(), 90) },
      });

      expect(results).toBeInstanceOf(Array);
      expect(results.every(r => r.distance <= 50)).toBe(true);
    });

    it('should score contractors correctly', async () => {
      // Test scoring logic
    });
  });

  describe('Worker', () => {
    it('should process FIND_CONTRACTORS job', async () => {
      const job = await queue.add('test-job', {
        type: 'FIND_CONTRACTORS',
        bidRequestId: 'test-request',
        criteria: {
          projectId: 'test-project',
          trades: ['Electrical'],
          location: { lat: 38.9, lng: -77.0 },
          budgetRange: { min: 10000, max: 50000 },
          timeline: { start: new Date(), end: addDays(new Date(), 90) },
        },
      });

      const result = await job.waitUntilFinished(undefined, 30000);
      expect(result).toHaveProperty('matchCount');
    });
  });

  describe('API Routes', () => {
    it('POST /v1/bids/requests should create bid request', async () => {
      const response = await fetch('http://localhost:4000/v1/bids/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          projectId: 'test-project',
          trades: ['Electrical'],
          scope: { description: 'Test scope' },
          deadline: addDays(new Date(), 14).toISOString(),
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
    });
  });
});
```

## 10.2 Integration Test Suite

```typescript
// services/command-center/tests/integration/full-flow.test.ts

describe('Full Bid-to-Contract Flow', () => {
  it('should complete entire bid workflow', async () => {
    // 1. Create bid request
    const bidRequest = await commandCenter.bids.createRequest({
      projectId: testProjectId,
      trades: ['Electrical'],
      scope: { description: 'Electrical rough-in' },
      deadline: addDays(new Date(), 14),
    });
    expect(bidRequest.status).toBe('OPEN');

    // 2. Wait for contractor matching
    await waitForEvent('CONTRACTORS_MATCHED', { bidRequestId: bidRequest.id });

    // 3. Verify matches created
    const matches = await prisma.bidInvitation.findMany({
      where: { bidRequestId: bidRequest.id },
    });
    expect(matches.length).toBeGreaterThan(0);

    // 4. Simulate bid submissions
    for (const match of matches.slice(0, 3)) {
      await prisma.bidSubmission.create({
        data: {
          bidRequestId: bidRequest.id,
          contractorId: match.contractorId,
          amount: 10000 + Math.random() * 5000,
          timeline: { totalDays: 30 },
          scope: { inclusions: ['Labor', 'Materials'] },
        },
      });
    }

    // 5. Analyze bids
    const analysis = await commandCenter.bids.analyzeBids(bidRequest.id);
    expect(analysis.analyses.length).toBe(3);
    expect(analysis.summary.recommendedContractor).toBeDefined();

    // 6. Verify events emitted
    const events = await redis.lrange(`kealee:event_log:BID_ANALYSIS_COMPLETE`, 0, -1);
    expect(events.length).toBeGreaterThan(0);
  });
});
```

## 10.3 Validation Checklist

```markdown
# Pre-Production Validation Checklist

## Infrastructure
- [ ] Redis connection stable
- [ ] Database migrations applied
- [ ] All environment variables set
- [ ] Health endpoints responding

## Each Mini-App (×14)
- [ ] Worker starts without errors
- [ ] Routes respond correctly (200/201/400/401)
- [ ] Events emit correctly
- [ ] Events receive and process
- [ ] Database operations complete
- [ ] Error handling works

## Integration
- [ ] os-pm can call all Command Center endpoints
- [ ] os-admin can view queue status
- [ ] Events flow between apps correctly
- [ ] Auth tokens validate correctly

## Performance
- [ ] API response time < 200ms (p95)
- [ ] Worker job processing < 5s (p95)
- [ ] No memory leaks under load
- [ ] Queue doesn't back up

## Monitoring
- [ ] Logs aggregating correctly
- [ ] Metrics collecting
- [ ] Alerts configured
- [ ] Error tracking working
```

---

# APPENDIX A: QUICK REFERENCE

## API Endpoints Summary

```
COMMAND CENTER API: https://command.kealee.com

APP-01 Bids:
  POST   /v1/bids/requests              Create bid request
  GET    /v1/bids/requests/:id          Get bid request
  POST   /v1/bids/requests/:id/analyze  Analyze submitted bids
  POST   /v1/bids/match                 Find matching contractors

APP-02 Visits:
  POST   /v1/visits                     Schedule visit
  GET    /v1/visits/pm/:pmId            Get PM's visits
  POST   /v1/visits/optimize-route      Optimize day route
  POST   /v1/visits/:id/complete        Complete visit

APP-03 Change Orders:
  POST   /v1/change-orders              Create change order
  GET    /v1/change-orders/:id          Get change order
  POST   /v1/change-orders/:id/analyze  Analyze impact
  POST   /v1/change-orders/:id/submit   Submit for approval

APP-04 Reports:
  POST   /v1/reports/generate           Generate report
  GET    /v1/reports/:id                Get report
  POST   /v1/reports/:id/send           Send report

... (remaining apps follow same pattern)

AI Features:
  GET    /v1/ai/predict/delay/:projectId     Delay prediction
  GET    /v1/ai/predict/cost/:projectId      Cost prediction
  GET    /v1/ai/predict/risk/:projectId      Full risk analysis
  POST   /v1/ai/qa/analyze                   Analyze photo
  POST   /v1/ai/decision/recommend           Get recommendation
  POST   /v1/ai/decision/chat                AI chat
```

## Event Types Summary

```typescript
// Core Events
'kealee.project.created'
'kealee.project.phase_changed'
'kealee.project.completed'

// Bid Events
'kealee.bid.request_created'
'kealee.bid.invitation_sent'
'kealee.bid.submitted'
'kealee.bid.analysis_complete'

// Visit Events
'kealee.visit.scheduled'
'kealee.visit.completed'
'kealee.visit.report_generated'

// (... see full list in packages/events/src/types.ts)
```

## Queue Names

```typescript
'kealee:bid-engine'
'kealee:visit-scheduler'
'kealee:change-order'
'kealee:report-generator'
'kealee:permit-tracker'
'kealee:inspection'
'kealee:budget-tracker'
'kealee:communication'
'kealee:task-queue'
'kealee:document-generator'
'kealee:predictive-engine'
'kealee:smart-scheduler'
'kealee:qa-inspector'
'kealee:decision-support'
```

---

**Document Version:** 1.0
**Created:** January 26, 2026
**Author:** Kealee Development Team
**Status:** Ready for Implementation

---

*This document is proprietary to Kealee Construction LLC. All rights reserved.*
