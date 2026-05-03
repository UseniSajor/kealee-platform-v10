-- Migration: agent_sessions, bot_prompts, keabot_events
-- Created: 2026-05-03

-- CreateTable agent_sessions
CREATE TABLE "agent_sessions" (
    "id"         TEXT         NOT NULL,
    "orgId"      TEXT,
    "userId"     TEXT,
    "projectId"  TEXT,
    "threadId"   TEXT,
    "source"     TEXT         NOT NULL,
    "mode"       TEXT         NOT NULL DEFAULT 'assisted',
    "status"     TEXT         NOT NULL DEFAULT 'active',
    "memory"     JSONB        NOT NULL DEFAULT '{}',
    "metadata"   JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    "closedAt"   TIMESTAMP(3),

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable bot_prompts
CREATE TABLE "bot_prompts" (
    "id"          TEXT         NOT NULL,
    "botName"     TEXT         NOT NULL,
    "promptType"  TEXT         NOT NULL,
    "version"     INTEGER      NOT NULL DEFAULT 1,
    "content"     TEXT         NOT NULL,
    "variables"   JSONB,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable keabot_events
CREATE TABLE "keabot_events" (
    "id"             TEXT         NOT NULL,
    "projectId"      TEXT,
    "sessionId"      TEXT,
    "eventType"      TEXT         NOT NULL,
    "payload"        JSONB        NOT NULL DEFAULT '{}',
    "context"        JSONB,
    "triggeredBots"  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "executionPlan"  JSONB,
    "status"         TEXT         NOT NULL DEFAULT 'pending',
    "errors"         JSONB,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"    TIMESTAMP(3),

    CONSTRAINT "keabot_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex agent_sessions
CREATE INDEX "agent_sessions_userId_idx"    ON "agent_sessions"("userId");
CREATE INDEX "agent_sessions_projectId_idx" ON "agent_sessions"("projectId");
CREATE INDEX "agent_sessions_status_idx"    ON "agent_sessions"("status");

-- CreateIndex bot_prompts
CREATE UNIQUE INDEX "bot_prompts_botName_version_key" ON "bot_prompts"("botName", "version");
CREATE INDEX "bot_prompts_botName_idx"   ON "bot_prompts"("botName");
CREATE INDEX "bot_prompts_isActive_idx"  ON "bot_prompts"("isActive");

-- CreateIndex keabot_events
CREATE INDEX "keabot_events_projectId_idx"  ON "keabot_events"("projectId");
CREATE INDEX "keabot_events_sessionId_idx"  ON "keabot_events"("sessionId");
CREATE INDEX "keabot_events_eventType_idx"  ON "keabot_events"("eventType");
CREATE INDEX "keabot_events_status_idx"     ON "keabot_events"("status");
