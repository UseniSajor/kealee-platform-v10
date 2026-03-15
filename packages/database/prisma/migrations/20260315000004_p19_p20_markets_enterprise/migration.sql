-- P19: Multi-Market Expansion Operating System
-- markets, launch_checklist_items, market_configs

CREATE TYPE "MarketStatus" AS ENUM ('PLANNED', 'SOFT_LAUNCH', 'ACTIVE', 'PAUSED', 'DEPRECATED');
CREATE TYPE "LaunchChecklistItemStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED');
CREATE TYPE "LaunchChecklistCategory" AS ENUM ('LEGAL', 'CONTRACTOR_SUPPLY', 'DEMAND_GEN', 'PRICING', 'COMPLIANCE', 'OPERATIONS');

CREATE TABLE "markets" (
    "id"               TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "jurisdictionCode" TEXT NOT NULL,
    "countryCode"      TEXT NOT NULL DEFAULT 'US',
    "stateCode"        TEXT,
    "city"             TEXT,
    "timezone"         TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "status"           "MarketStatus" NOT NULL DEFAULT 'PLANNED',
    "launchDate"       TIMESTAMP(3),
    "notes"            TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "launch_checklist_items" (
    "id"          TEXT NOT NULL,
    "marketId"    TEXT NOT NULL,
    "category"    "LaunchChecklistCategory" NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "status"      "LaunchChecklistItemStatus" NOT NULL DEFAULT 'TODO',
    "dueDate"     TIMESTAMP(3),
    "assigneeId"  TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "launch_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "market_configs" (
    "id"        TEXT NOT NULL,
    "marketId"  TEXT NOT NULL,
    "key"       TEXT NOT NULL,
    "value"     JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "markets_jurisdictionCode_key" ON "markets"("jurisdictionCode");
CREATE UNIQUE INDEX "market_configs_marketId_key_key" ON "market_configs"("marketId", "key");
CREATE INDEX "markets_status_idx" ON "markets"("status");
CREATE INDEX "launch_checklist_items_marketId_status_idx" ON "launch_checklist_items"("marketId", "status");
CREATE INDEX "launch_checklist_items_marketId_category_idx" ON "launch_checklist_items"("marketId", "category");

ALTER TABLE "launch_checklist_items" ADD CONSTRAINT "launch_checklist_items_marketId_fkey"
    FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "market_configs" ADD CONSTRAINT "market_configs_marketId_fkey"
    FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- P20: Enterprise/B2B Platform Layer
-- portfolio_orgs, team_memberships, feature_flags, org_entitlements, partner_integrations

CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR', 'FINANCE', 'VIEWER');
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PartnerType" AS ENUM ('LENDER', 'TITLE_COMPANY', 'INSURANCE_PROVIDER', 'MATERIAL_SUPPLIER', 'EQUIPMENT_RENTAL', 'SURETY');
CREATE TYPE "FeatureFlagScope" AS ENUM ('GLOBAL', 'ORG', 'USER', 'MARKET');

CREATE TABLE "portfolio_orgs" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "domain"    TEXT,
    "logoUrl"   TEXT,
    "planId"    TEXT,
    "ownerId"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_orgs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_memberships" (
    "id"         TEXT NOT NULL,
    "orgId"      TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "role"       "TeamRole" NOT NULL,
    "projectIds" TEXT[],
    "invitedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt"   TIMESTAMP(3),

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feature_flags" (
    "id"             TEXT NOT NULL,
    "flagKey"        TEXT NOT NULL,
    "enabled"        BOOLEAN NOT NULL DEFAULT false,
    "scope"          "FeatureFlagScope" NOT NULL,
    "scopeId"        TEXT,
    "rolloutPercent" DOUBLE PRECISION,
    "expiresAt"      TIMESTAMP(3),
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "org_entitlements" (
    "id"         TEXT NOT NULL,
    "orgId"      TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "status"     "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt"  TIMESTAMP(3),
    "metadata"   JSONB NOT NULL DEFAULT '{}',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "partner_integrations" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "partnerType"  "PartnerType" NOT NULL,
    "webhookUrl"   TEXT,
    "apiKeyHash"   TEXT,
    "contactEmail" TEXT,
    "markets"      TEXT[],
    "active"       BOOLEAN NOT NULL DEFAULT true,
    "metadata"     JSONB NOT NULL DEFAULT '{}',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_memberships_orgId_userId_key" ON "team_memberships"("orgId", "userId");
CREATE UNIQUE INDEX "feature_flags_flagKey_scope_scopeId_key" ON "feature_flags"("flagKey", "scope", "scopeId");
CREATE UNIQUE INDEX "org_entitlements_orgId_featureKey_key" ON "org_entitlements"("orgId", "featureKey");
CREATE INDEX "portfolio_orgs_ownerId_idx" ON "portfolio_orgs"("ownerId");
CREATE INDEX "team_memberships_userId_idx" ON "team_memberships"("userId");
CREATE INDEX "feature_flags_flagKey_scope_idx" ON "feature_flags"("flagKey", "scope");
CREATE INDEX "org_entitlements_orgId_status_idx" ON "org_entitlements"("orgId", "status");
CREATE INDEX "partner_integrations_partnerType_active_idx" ON "partner_integrations"("partnerType", "active");

ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "portfolio_orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
