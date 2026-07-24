-- AI voice and sales/support persistence.
-- Canonical project/property/lead/permit ownership remains in existing tables;
-- scalar references deliberately allow staged rollout without destructive FKs.

CREATE TYPE "AiCommunicationChannel" AS ENUM ('VOICE','SMS','WHATSAPP','EMAIL','WEB_CHAT','PORTAL_CHAT');
CREATE TYPE "AiCommunicationSessionStatus" AS ENUM ('PENDING','ACTIVE','TRANSFERRING','COMPLETED','FAILED','REDACTED');
CREATE TYPE "SupportCaseStatus" AS ENUM ('OPEN','AUTHENTICATING','INVESTIGATING','WAITING_CUSTOMER','WAITING_STAFF','ESCALATED','RESOLVED','CLOSED');

CREATE TABLE "ai_communication_sessions" (
  "id" TEXT PRIMARY KEY, "organizationId" TEXT, "contactId" TEXT, "leadId" TEXT, "projectId" TEXT,
  "provider" TEXT NOT NULL, "providerSessionId" TEXT, "channel" "AiCommunicationChannel" NOT NULL,
  "direction" TEXT NOT NULL, "status" "AiCommunicationSessionStatus" NOT NULL DEFAULT 'PENDING',
  "locale" TEXT NOT NULL DEFAULT 'en-US', "consentId" TEXT, "disclosureVersion" TEXT,
  "recordingEnabled" BOOLEAN NOT NULL DEFAULT false, "retentionUntil" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3), "endedAt" TIMESTAMP(3), "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "ai_communication_sessions_providerSessionId_key" ON "ai_communication_sessions"("providerSessionId");
CREATE INDEX "ai_communication_sessions_organizationId_createdAt_idx" ON "ai_communication_sessions"("organizationId","createdAt");
CREATE INDEX "ai_communication_sessions_contactId_createdAt_idx" ON "ai_communication_sessions"("contactId","createdAt");
CREATE INDEX "ai_communication_sessions_projectId_createdAt_idx" ON "ai_communication_sessions"("projectId","createdAt");
CREATE INDEX "ai_communication_sessions_status_createdAt_idx" ON "ai_communication_sessions"("status","createdAt");

CREATE TABLE "ai_conversation_artifacts" (
  "id" TEXT PRIMARY KEY, "sessionId" TEXT NOT NULL, "artifactType" TEXT NOT NULL,
  "encryptedBody" TEXT, "redactedBody" TEXT, "storageUrl" TEXT, "encryptionKeyId" TEXT,
  "contentHash" TEXT NOT NULL, "model" TEXT, "confidence" DECIMAL(5,4), "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ai_conversation_artifacts_sessionId_artifactType_contentHash_key" ON "ai_conversation_artifacts"("sessionId","artifactType","contentHash");
CREATE INDEX "ai_conversation_artifacts_sessionId_createdAt_idx" ON "ai_conversation_artifacts"("sessionId","createdAt");

CREATE TABLE "ai_sales_workflows" (
  "id" TEXT PRIMARY KEY, "organizationId" TEXT NOT NULL, "contactId" TEXT, "leadId" TEXT, "projectId" TEXT,
  "state" TEXT NOT NULL DEFAULT 'NEW', "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "appliedEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[], "version" INTEGER NOT NULL DEFAULT 0,
  "humanOwnerId" TEXT, "stoppedAt" TIMESTAMP(3), "stopReason" TEXT, "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ai_sales_workflows_organizationId_state_updatedAt_idx" ON "ai_sales_workflows"("organizationId","state","updatedAt");
CREATE INDEX "ai_sales_workflows_leadId_idx" ON "ai_sales_workflows"("leadId");
CREATE INDEX "ai_sales_workflows_projectId_idx" ON "ai_sales_workflows"("projectId");

CREATE TABLE "customer_support_cases" (
  "id" TEXT PRIMARY KEY, "organizationId" TEXT NOT NULL, "contactId" TEXT, "projectId" TEXT, "sessionId" TEXT,
  "status" "SupportCaseStatus" NOT NULL DEFAULT 'OPEN', "topic" TEXT NOT NULL, "urgency" TEXT NOT NULL,
  "sentiment" TEXT, "confidence" DECIMAL(5,4), "assignedToUserId" TEXT, "slaDueAt" TIMESTAMP(3),
  "resolutionCriteria" TEXT, "resolvedAt" TIMESTAMP(3), "closedAt" TIMESTAMP(3), "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "customer_support_cases_organizationId_status_slaDueAt_idx" ON "customer_support_cases"("organizationId","status","slaDueAt");
CREATE INDEX "customer_support_cases_projectId_createdAt_idx" ON "customer_support_cases"("projectId","createdAt");
CREATE INDEX "customer_support_cases_assignedToUserId_status_idx" ON "customer_support_cases"("assignedToUserId","status");
