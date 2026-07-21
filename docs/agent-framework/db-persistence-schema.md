# Database Persistence Schema for Agentic Bots

## Overview

This document defines the Prisma schema extensions needed to persist agentic bot execution history, tool calls, and audit logs for compliance, observability, and debugging.

## Prisma Schema Extensions

Add these models to `packages/database/prisma/schema.prisma`:

```prisma
// ─── Agentic Bot Execution History ─────────────────────────────────────

model AgenticJobExecution {
  id                    String   @id @default(cuid())
  requestId             String   @unique
  botId                 String
  sessionId             String
  userId                String?
  orgId                 String?
  projectId             String?

  // Execution metadata
  systemPrompt          String   @db.Text
  userMessage           String   @db.Text
  finalOutput           String   @db.Text
  
  // Status & metrics
  status                String   // 'completed' | 'failed' | 'max_iterations_reached'
  success               Boolean
  totalIterations       Int
  durationMs            Int
  error                 String?

  // Tool execution history (JSON array of ToolExecutionRecord)
  toolHistory           Json     @default("[]")
  toolMetrics           Json     // { successful, failed, byName: {} }

  // Audit & security
  warnings              String[] // Suspicious activity flags
  browserAuditLog       Json?    // Browser security audit log
  llmSource             String?  // 'claude' | 'internal' | 'gpt'

  // Timestamps
  createdAt             DateTime @default(now())
  completedAt           DateTime?
  
  // Relationships
  org                   Org?     @relation(fields: [orgId], references: [id], onDelete: SetNull)
  user                  User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([requestId])
  @@index([sessionId])
  @@index([userId])
  @@index([orgId])
  @@index([createdAt])
  @@index([status])
}

model ToolExecutionLog {
  id                    String   @id @default(cuid())
  agenticJobId          String
  toolName              String
  input                 Json
  output                Json?
  success               Boolean
  error                 String?
  
  startedAt             DateTime
  completedAt           DateTime?
  durationMs            Int?

  agenticJob            AgenticJobExecution @relation(fields: [agenticJobId], references: [id], onDelete: Cascade)

  @@index([agenticJobId])
  @@index([toolName])
  @@index([success])
}

model BrowserAuditEvent {
  id                    String   @id @default(cuid())
  agenticJobId          String?
  sessionId             String
  
  action                String   // 'navigate' | 'click' | 'input' | 'extract' | 'screenshot'
  url                   String?
  selector              String?
  success               Boolean
  risk                  String?  // 'safe' | 'warning' | 'blocked'
  
  timestamp             DateTime @default(now())

  agenticJob            AgenticJobExecution? @relation(fields: [agenticJobId], references: [id], onDelete: SetNull)

  @@index([sessionId])
  @@index([agenticJobId])
  @@index([risk])
  @@index([timestamp])
}

model AgenticSessionMemory {
  id                    String   @id @default(cuid())
  sessionId             String   @unique
  userId                String?
  orgId                 String?
  
  // Memory layers
  userIntent            String?
  normalizedIntent      String?
  facts                 Json     @default("{}")
  constraints           Json     @default("{}")
  riskFlags             String[] @default([])
  agentNotes            String[] @default([])
  
  // Outputs & decisions
  outputs               Json     @default("{}")
  decisions             Json     @default("[]") // DecisionRecord[]
  
  // Metadata
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lastAccessedAt        DateTime @updatedAt

  user                  User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  org                   Org?     @relation(fields: [orgId], references: [id], onDelete: SetNull)

  @@index([sessionId])
  @@index([userId])
  @@index([orgId])
}
```

## Data Structures (JSON Fields)

### ToolExecutionRecord (stored in AgenticJobExecution.toolHistory)

```typescript
{
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  success: boolean;
  startedAt: string; // ISO timestamp
  completedAt?: string;
  error?: string;
}
```

### ToolMetrics (stored in AgenticJobExecution.toolMetrics)

```typescript
{
  successful: number;
  failed: number;
  byName: Record<string, { count: number; successRate: number }>;
  averageDurationMs: number;
}
```

### BrowserAuditLog (stored in AgenticJobExecution.browserAuditLog)

```typescript
{
  timestamp: string;
  action: string;
  url?: string;
  selector?: string;
  success: boolean;
  risk?: string;
}[]
```

### DecisionRecord (stored in AgenticSessionMemory.decisions)

```typescript
{
  at: string; // ISO timestamp
  reason: string;
  chosen: string;
  alternatives?: string[];
}[]
```

## Queries

### Find Recent Agentic Executions

```typescript
// Get last 10 executions for user
const executions = await prisma.agenticJobExecution.findMany({
  where: { userId: 'user_123' },
  orderBy: { createdAt: 'desc' },
  take: 10,
  include: { toolMetrics: true },
});
```

### Find Failed Jobs

```typescript
// Get failures in last 24h
const failures = await prisma.agenticJobExecution.findMany({
  where: {
    success: false,
    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  },
  orderBy: { createdAt: 'desc' },
});
```

### Find Suspicious Activity

```typescript
// Get jobs with warnings
const suspicious = await prisma.agenticJobExecution.findMany({
  where: { warnings: { hasSome: [] } }, // Has any warnings
  orderBy: { createdAt: 'desc' },
});

// Get blocked URL attempts
const blockedUrls = await prisma.browserAuditEvent.findMany({
  where: {
    risk: 'blocked',
    timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
  orderBy: { timestamp: 'desc' },
});
```

### Tool Usage Statistics

```typescript
// Get tool call breakdown
const stats = await prisma.toolExecutionLog.findMany({
  where: {
    agenticJob: {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  },
  select: { toolName: true, success: true },
});

const breakdown = stats.reduce((acc, log) => {
  const key = `${log.toolName}:${log.success ? 'ok' : 'fail'}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

## Data Retention Policy

- **Active:** Keep in memory while session is open
- **Recent (0-30 days):** Keep in DB with full tool history
- **Archive (30-90 days):** Compress tool history, keep summary + warnings
- **Deletion (>90 days):** Archive to immutable log, then delete from main DB

```typescript
// Cleanup old executions
async function archiveOldExecutions(daysOld: number = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const toArchive = await prisma.agenticJobExecution.findMany({
    where: { createdAt: { lt: cutoffDate } },
    select: { id: true, toolHistory: true, warnings: true },
  });

  // Archive to immutable log
  for (const job of toArchive) {
    await archiveLog.write({
      jobId: job.id,
      summary: { toolCount: (job.toolHistory as any[]).length, warnings: job.warnings },
      timestamp: new Date(),
    });
  }

  // Delete from main DB
  await prisma.agenticJobExecution.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });
}
```

## Observability Queries

### Session Performance

```typescript
async function getSessionPerformance(sessionId: string) {
  const executions = await prisma.agenticJobExecution.findMany({
    where: { sessionId },
    select: { durationMs: true, totalIterations: true, success: true, toolMetrics: true },
  });

  return {
    total: executions.length,
    successful: executions.filter(e => e.success).length,
    averageDurationMs: executions.reduce((sum, e) => sum + e.durationMs, 0) / executions.length,
    totalToolCalls: executions.reduce((sum, e) => sum + ((e.toolMetrics as any).successful || 0), 0),
  };
}
```

### Tool Reliability

```typescript
async function getToolReliability() {
  const logs = await prisma.toolExecutionLog.findMany({
    select: { toolName: true, success: true },
  });

  const breakdown = logs.reduce((acc, log) => {
    if (!acc[log.toolName]) acc[log.toolName] = { ok: 0, fail: 0 };
    acc[log.toolName][log.success ? 'ok' : 'fail']++;
    return acc;
  }, {} as Record<string, { ok: number; fail: number }>);

  return Object.entries(breakdown).map(([tool, counts]) => ({
    tool,
    successRate: counts.ok / (counts.ok + counts.fail),
    total: counts.ok + counts.fail,
  }));
}
```

## Migration

Run after adding schema:

```bash
npx prisma migrate dev --name add-agentic-persistence
npx prisma generate
```

Then update `packages/core-agents` to include new types:

```typescript
import { PrismaClient } from '@kealee/database';

export { AgenticJobExecution, ToolExecutionLog, BrowserAuditEvent, AgenticSessionMemory } from '@kealee/database';
```
