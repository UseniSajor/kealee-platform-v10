-- Canonical provider-neutral autonomous runtime ledger.
-- Ownership: Kealee server-side runtime workers. These internal execution
-- tables are not browser APIs; service-role/database workers mutate them.

CREATE TYPE "AutonomousGoalStatus" AS ENUM ('DRAFT','READY','ACTIVE','PAUSED','BLOCKED','COMPLETE','CANCELLED','FAILED');
CREATE TYPE "AutonomousRunStatus" AS ENUM ('QUEUED','PLANNING','RUNNING','AWAITING_INPUT','AWAITING_APPROVAL','RETRYING','BLOCKED','COMPLETE','PARTIAL','FAILED','CANCELLED');
CREATE TYPE "AutonomousStepStatus" AS ENUM ('PENDING','READY','RUNNING','AWAITING_INPUT','AWAITING_APPROVAL','RETRYING','COMPLETE','SKIPPED','BLOCKED','FAILED','CANCELLED');
CREATE TYPE "AutonomousInvocationStatus" AS ENUM ('REQUESTED','RUNNING','SUCCEEDED','RETRYABLE_FAILURE','FATAL_FAILURE','CANCELLED');
CREATE TYPE "AutonomousApprovalStatus" AS ENUM ('PENDING','APPROVED','REJECTED','EXPIRED','CANCELLED');

CREATE TABLE "autonomous_goals" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT, "projectId" TEXT, "intakeId" TEXT, "parentGoalId" TEXT,
  "objective" TEXT NOT NULL, "successCriteria" JSONB NOT NULL, "constraints" JSONB, "priority" INTEGER NOT NULL DEFAULT 50,
  "status" "AutonomousGoalStatus" NOT NULL DEFAULT 'DRAFT', "requestedBy" TEXT, "dueAt" TIMESTAMP(3),
  "tokenBudget" INTEGER, "costBudgetCents" INTEGER, "timeBudgetMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "completedAt" TIMESTAMP(3)
);
CREATE TABLE "autonomous_agent_definitions" (
  "id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1, "displayName" TEXT NOT NULL,
  "runtimeKind" TEXT NOT NULL, "description" TEXT, "systemPrompt" TEXT, "capabilities" TEXT[] NOT NULL,
  "allowedTools" TEXT[] NOT NULL, "modelPolicy" JSONB, "authorityPolicy" JSONB, "budgetPolicy" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "autonomous_runs" (
  "id" TEXT PRIMARY KEY, "goalId" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "runtimeKind" TEXT NOT NULL DEFAULT 'supervisor',
  "status" "AutonomousRunStatus" NOT NULL DEFAULT 'QUEUED', "plan" JSONB, "context" JSONB, "result" JSONB,
  "errorCode" TEXT, "errorMessage" TEXT, "currentStepKey" TEXT, "attempt" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3, "tokensUsed" INTEGER NOT NULL DEFAULT 0, "costCents" INTEGER NOT NULL DEFAULT 0,
  "elapsedMs" INTEGER NOT NULL DEFAULT 0, "leaseOwner" TEXT, "leaseExpiresAt" TIMESTAMP(3), "heartbeatAt" TIMESTAMP(3),
  "externalWorkflowId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3)
);
CREATE TABLE "autonomous_steps" (
  "id" TEXT PRIMARY KEY, "runId" TEXT NOT NULL, "stepKey" TEXT NOT NULL, "sequence" INTEGER NOT NULL,
  "agentDefinitionId" TEXT, "capability" TEXT NOT NULL, "title" TEXT NOT NULL,
  "status" "AutonomousStepStatus" NOT NULL DEFAULT 'PENDING', "dependsOn" TEXT[] NOT NULL, "input" JSONB, "output" JSONB,
  "completionCriteria" JSONB, "retryPolicy" JSONB, "approvalPolicy" JSONB, "attempt" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3, "tokensUsed" INTEGER NOT NULL DEFAULT 0, "costCents" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT, "errorMessage" TEXT, "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "autonomous_tool_invocations" (
  "id" TEXT PRIMARY KEY, "stepId" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "toolName" TEXT NOT NULL,
  "status" "AutonomousInvocationStatus" NOT NULL DEFAULT 'REQUESTED', "input" JSONB, "output" JSONB, "errorCode" TEXT,
  "errorMessage" TEXT, "attempt" INTEGER NOT NULL DEFAULT 0, "durationMs" INTEGER, "tokensUsed" INTEGER NOT NULL DEFAULT 0,
  "costCents" INTEGER NOT NULL DEFAULT 0, "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "autonomous_approvals" (
  "id" TEXT PRIMARY KEY, "runId" TEXT NOT NULL, "stepId" TEXT, "approvalType" TEXT NOT NULL,
  "status" "AutonomousApprovalStatus" NOT NULL DEFAULT 'PENDING', "requestedRole" TEXT, "requestedUserId" TEXT,
  "tokenHash" TEXT NOT NULL, "request" JSONB, "response" JSONB, "expiresAt" TIMESTAMP(3), "decidedBy" TEXT,
  "decidedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "autonomous_memories" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT, "projectId" TEXT, "intakeId" TEXT, "agentSlug" TEXT, "scope" TEXT NOT NULL,
  "memoryKey" TEXT NOT NULL, "content" JSONB NOT NULL, "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "sourceRunId" TEXT, "expiresAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "autonomous_evidence" (
  "id" TEXT PRIMARY KEY, "runId" TEXT NOT NULL, "stepId" TEXT, "evidenceType" TEXT NOT NULL, "sourceUri" TEXT,
  "sourceTitle" TEXT, "contentHash" TEXT, "excerpt" TEXT, "payload" JSONB, "confidence" DOUBLE PRECISION,
  "verifiedAt" TIMESTAMP(3), "validUntil" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "autonomous_events" (
  "id" TEXT PRIMARY KEY, "runId" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "eventType" TEXT NOT NULL,
  "actorType" TEXT NOT NULL, "actorId" TEXT, "payload" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "autonomous_agent_definitions_slug_version_key" ON "autonomous_agent_definitions"("slug","version");
CREATE UNIQUE INDEX "autonomous_runs_idempotencyKey_key" ON "autonomous_runs"("idempotencyKey");
CREATE UNIQUE INDEX "autonomous_steps_runId_stepKey_key" ON "autonomous_steps"("runId","stepKey");
CREATE UNIQUE INDEX "autonomous_steps_runId_sequence_key" ON "autonomous_steps"("runId","sequence");
CREATE UNIQUE INDEX "autonomous_tool_invocations_idempotencyKey_key" ON "autonomous_tool_invocations"("idempotencyKey");
CREATE UNIQUE INDEX "autonomous_approvals_tokenHash_key" ON "autonomous_approvals"("tokenHash");
CREATE UNIQUE INDEX "autonomous_memories_scope_memoryKey_projectId_intakeId_agentSlug_key" ON "autonomous_memories"("scope","memoryKey","projectId","intakeId","agentSlug");
CREATE UNIQUE INDEX "autonomous_events_runId_sequence_key" ON "autonomous_events"("runId","sequence");
CREATE INDEX "autonomous_goals_tenant_status_priority_idx" ON "autonomous_goals"("tenantId","status","priority");
CREATE INDEX "autonomous_goals_project_status_idx" ON "autonomous_goals"("projectId","status");
CREATE INDEX "autonomous_goals_intake_status_idx" ON "autonomous_goals"("intakeId","status");
CREATE INDEX "autonomous_goals_parent_idx" ON "autonomous_goals"("parentGoalId");
CREATE INDEX "autonomous_runs_claim_idx" ON "autonomous_runs"("status","leaseExpiresAt","createdAt");
CREATE INDEX "autonomous_runs_goal_status_idx" ON "autonomous_runs"("goalId","status");
CREATE INDEX "autonomous_runs_external_idx" ON "autonomous_runs"("externalWorkflowId");
CREATE INDEX "autonomous_steps_pending_idx" ON "autonomous_steps"("runId","status","availableAt");
CREATE INDEX "autonomous_steps_capability_idx" ON "autonomous_steps"("capability","status","availableAt");
CREATE INDEX "autonomous_tool_invocations_step_status_idx" ON "autonomous_tool_invocations"("stepId","status");
CREATE INDEX "autonomous_approvals_pending_idx" ON "autonomous_approvals"("status","expiresAt","requestedUserId");
CREATE INDEX "autonomous_memories_project_scope_idx" ON "autonomous_memories"("projectId","scope");
CREATE INDEX "autonomous_memories_intake_scope_idx" ON "autonomous_memories"("intakeId","scope");
CREATE INDEX "autonomous_memories_expiry_idx" ON "autonomous_memories"("expiresAt");
CREATE INDEX "autonomous_evidence_run_type_idx" ON "autonomous_evidence"("runId","evidenceType");
CREATE INDEX "autonomous_evidence_step_idx" ON "autonomous_evidence"("stepId");
CREATE INDEX "autonomous_evidence_expiry_idx" ON "autonomous_evidence"("validUntil");
CREATE INDEX "autonomous_events_type_created_idx" ON "autonomous_events"("eventType","createdAt");

ALTER TABLE "autonomous_goals" ADD CONSTRAINT "autonomous_goals_parentGoalId_fkey" FOREIGN KEY ("parentGoalId") REFERENCES "autonomous_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "autonomous_runs" ADD CONSTRAINT "autonomous_runs_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "autonomous_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autonomous_steps" ADD CONSTRAINT "autonomous_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autonomous_steps" ADD CONSTRAINT "autonomous_steps_agentDefinitionId_fkey" FOREIGN KEY ("agentDefinitionId") REFERENCES "autonomous_agent_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "autonomous_tool_invocations" ADD CONSTRAINT "autonomous_tool_invocations_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "autonomous_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autonomous_approvals" ADD CONSTRAINT "autonomous_approvals_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autonomous_approvals" ADD CONSTRAINT "autonomous_approvals_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "autonomous_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autonomous_evidence" ADD CONSTRAINT "autonomous_evidence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autonomous_evidence" ADD CONSTRAINT "autonomous_evidence_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "autonomous_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autonomous_events" ADD CONSTRAINT "autonomous_events_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defense in depth for Supabase's exposed public schema. No browser policies
-- are created; therefore even accidental grants cannot expose rows.
ALTER TABLE "autonomous_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_agent_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_tool_invocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_memories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomous_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "autonomous_goals","autonomous_agent_definitions","autonomous_runs","autonomous_steps","autonomous_tool_invocations","autonomous_approvals","autonomous_memories","autonomous_evidence","autonomous_events" FROM anon, authenticated;
COMMENT ON TABLE "autonomous_runs" IS 'Internal server-side autonomous execution ledger; no direct browser access.';
COMMENT ON TABLE "autonomous_steps" IS 'Internal capability scheduling and state; owner portal consumes curated projections only.';
COMMENT ON TABLE "autonomous_approvals" IS 'Privileged approval records; mutations require server-side authorization.';
COMMENT ON TABLE "autonomous_evidence" IS 'Internal evidence ledger; publish only curated deliverables, never raw execution payloads.';
