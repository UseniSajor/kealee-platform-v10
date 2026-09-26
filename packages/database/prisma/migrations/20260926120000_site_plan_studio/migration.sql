-- Kealee Site Plan Studio — professional production workspace.
--
-- ADDITIVE ONLY: thirteen new tables, no change to any existing table, so no
-- existing writer is affected (KEALEE.md rule 6). Every table carries
-- organizationId for row-level security later; RLS is NOT enabled here
-- (enabling it before the application sets the session tenant returns zero
-- rows — KEALEE.md).
--
-- studio_engineering_events and studio_revisions are append-only: a trigger
-- refuses UPDATE and DELETE, so history cannot be rewritten through the
-- application or an ad-hoc query.

CREATE TABLE "studio_workspaces" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "studio_workspaces_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_TERMS',
    "projectIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jurisdictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invitationId" TEXT,
    "termsVersion" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "onboarding" JSONB NOT NULL DEFAULT '{}',
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "studio_memberships_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "professional_licenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "discipline" TEXT,
    "expiresAt" TIMESTAMP(3),
    "verification" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "professional_licenses_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "professional_details" (
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "firmName" TEXT,
    "disciplines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "insuranceCarrier" TEXT,
    "insurancePolicy" TEXT,
    "insuranceExpiresAt" TIMESTAMP(3),
    "signatureAuthority" BOOLEAN NOT NULL DEFAULT false,
    "sealAuthority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "professional_details_pkey" PRIMARY KEY ("userId")
);
CREATE TABLE "studio_invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "projectIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invitedRole" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "email" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "jurisdictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_invitations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "linkedProjectId" TEXT,
    "workflowId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "jurisdictionCode" TEXT,
    "licenceState" TEXT,
    "state" TEXT NOT NULL DEFAULT 'DRAFTING',
    "currentRevision" INTEGER NOT NULL DEFAULT 1,
    "currentRevisionId" TEXT NOT NULL,
    "crs" TEXT NOT NULL DEFAULT 'EPSG:2248',
    "verticalDatum" TEXT,
    "zoning" JSONB,
    "design" JSONB,
    "facts" JSONB NOT NULL DEFAULT '{}',
    "sheets" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "previouslySubmitted" BOOLEAN NOT NULL DEFAULT false,
    "traditionalEstimateHours" DOUBLE PRECISION,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "studio_projects_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_objects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "layer" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceDate" TEXT,
    "sourceAccuracy" TEXT NOT NULL,
    "sourceAuthority" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "revisionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "studio_objects_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_revisions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "revisionId" TEXT NOT NULL,
    "parentRevision" INTEGER NOT NULL,
    "proposalId" TEXT,
    "commands" JSONB NOT NULL,
    "changes" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "engineVersion" TEXT NOT NULL,
    CONSTRAINT "studio_revisions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_proposals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "baseRevision" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "commands" JSONB NOT NULL,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "preview" JSONB,
    "material" BOOLEAN NOT NULL DEFAULT true,
    "stopConditions" JSONB NOT NULL DEFAULT '[]',
    "mode" TEXT,
    "prompt" TEXT,
    "requestedBy" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "decision" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "resultingRevision" INTEGER,
    CONSTRAINT "studio_proposals_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_calculations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "calcId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "record" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_calculations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_rule_overrides" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "overriddenBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "overriddenAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "studio_rule_overrides_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_engineering_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "projectId" TEXT,
    "sequence" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT,
    "actorType" TEXT NOT NULL,
    "mode" TEXT,
    "origin" TEXT,
    "prompt" TEXT,
    "selectedObjectIds" JSONB NOT NULL DEFAULT '[]',
    "aiInterpretation" JSONB,
    "proposedCommands" JSONB,
    "validationResults" JSONB,
    "decision" TEXT,
    "manualEdits" JSONB,
    "resultingRevision" INTEGER,
    "proposalId" TEXT,
    "engineVersion" TEXT NOT NULL,
    "rulesVersion" TEXT,
    "durationMs" INTEGER,
    "detail" JSONB,
    "trainingConsent" BOOLEAN NOT NULL DEFAULT false,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,
    CONSTRAINT "studio_engineering_events_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "studio_issuances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "revisionId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "documentRef" TEXT,
    "preparedBy" TEXT NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL,
    "approval" JSONB,
    "execution" JSONB,
    "invalidatedAt" TIMESTAMP(3),
    "invalidatedByRevision" INTEGER,
    "invalidationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "studio_issuances_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "studio_workspaces_organizationId_idx" ON "studio_workspaces"("organizationId");
CREATE INDEX "studio_memberships_userId_idx" ON "studio_memberships"("userId");
CREATE INDEX "studio_memberships_organizationId_status_idx" ON "studio_memberships"("organizationId", "status");
CREATE UNIQUE INDEX "studio_memberships_organizationId_userId_key" ON "studio_memberships"("organizationId", "userId");
CREATE INDEX "professional_licenses_verification_idx" ON "professional_licenses"("verification");
CREATE UNIQUE INDEX "professional_licenses_userId_kind_state_key" ON "professional_licenses"("userId", "kind", "state");
CREATE UNIQUE INDEX "studio_invitations_tokenHash_key" ON "studio_invitations"("tokenHash");
CREATE INDEX "studio_invitations_organizationId_status_idx" ON "studio_invitations"("organizationId", "status");
CREATE INDEX "studio_projects_organizationId_workspaceId_updatedAt_idx" ON "studio_projects"("organizationId", "workspaceId", "updatedAt");
CREATE INDEX "studio_projects_workflowId_idx" ON "studio_projects"("workflowId");
CREATE INDEX "studio_objects_projectId_type_idx" ON "studio_objects"("projectId", "type");
CREATE INDEX "studio_objects_organizationId_idx" ON "studio_objects"("organizationId");
CREATE UNIQUE INDEX "studio_revisions_revisionId_key" ON "studio_revisions"("revisionId");
CREATE INDEX "studio_revisions_organizationId_idx" ON "studio_revisions"("organizationId");
CREATE UNIQUE INDEX "studio_revisions_projectId_revision_key" ON "studio_revisions"("projectId", "revision");
CREATE INDEX "studio_proposals_projectId_status_idx" ON "studio_proposals"("projectId", "status");
CREATE INDEX "studio_proposals_organizationId_idx" ON "studio_proposals"("organizationId");
CREATE INDEX "studio_calculations_projectId_calcId_idx" ON "studio_calculations"("projectId", "calcId");
CREATE UNIQUE INDEX "studio_rule_overrides_projectId_ruleKey_key" ON "studio_rule_overrides"("projectId", "ruleKey");
CREATE INDEX "studio_engineering_events_projectId_sequence_idx" ON "studio_engineering_events"("projectId", "sequence");
CREATE INDEX "studio_engineering_events_eventType_occurredAt_idx" ON "studio_engineering_events"("eventType", "occurredAt");
CREATE UNIQUE INDEX "studio_engineering_events_organizationId_sequence_key" ON "studio_engineering_events"("organizationId", "sequence");
CREATE INDEX "studio_issuances_projectId_revision_idx" ON "studio_issuances"("projectId", "revision");

-- Append-only history.
CREATE OR REPLACE FUNCTION studio_refuse_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'table % is append-only: % refused', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER studio_engineering_events_append_only
  BEFORE UPDATE OR DELETE ON "studio_engineering_events"
  FOR EACH ROW EXECUTE FUNCTION studio_refuse_mutation();

CREATE TRIGGER studio_revisions_append_only
  BEFORE UPDATE OR DELETE ON "studio_revisions"
  FOR EACH ROW EXECUTE FUNCTION studio_refuse_mutation();
