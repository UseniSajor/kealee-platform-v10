-- P17: Revenue Optimization Layer
-- subscription_plans, lead_pricing, sponsored_placements

CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "LeadPricingStrategy" AS ENUM ('FLAT', 'AUCTION', 'SUBSCRIPTION_INCLUDED');
CREATE TYPE "PlacementType" AS ENUM ('FEATURED_CONTRACTOR', 'FEATURED_PROJECT', 'BANNER_AD', 'CATEGORY_SPONSOR');

CREATE TABLE "subscription_plans" (
    "id"                   TEXT NOT NULL,
    "name"                 TEXT NOT NULL,
    "tier"                 "PlanTier" NOT NULL,
    "monthlyPriceCents"    INTEGER NOT NULL,
    "annualPriceCents"     INTEGER NOT NULL,
    "features"             JSONB NOT NULL DEFAULT '{}',
    "leadCreditsPerMonth"  INTEGER,
    "maxProjects"          INTEGER,
    "maxTeamMembers"       INTEGER,
    "active"               BOOLEAN NOT NULL DEFAULT true,
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdAnnual"  TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_pricing" (
    "id"               TEXT NOT NULL,
    "tradeCategory"    TEXT NOT NULL,
    "jurisdictionCode" TEXT NOT NULL,
    "strategy"         "LeadPricingStrategy" NOT NULL,
    "flatPriceCents"   INTEGER,
    "minBidCents"      INTEGER,
    "maxBidCents"      INTEGER,
    "active"           BOOLEAN NOT NULL DEFAULT true,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pricing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sponsored_placements" (
    "id"                   TEXT NOT NULL,
    "sponsorId"            TEXT NOT NULL,
    "placementType"        "PlacementType" NOT NULL,
    "entityId"             TEXT NOT NULL,
    "entityType"           TEXT NOT NULL,
    "startDate"            TIMESTAMP(3) NOT NULL,
    "endDate"              TIMESTAMP(3) NOT NULL,
    "budgetCents"          INTEGER NOT NULL,
    "spentCents"           INTEGER NOT NULL DEFAULT 0,
    "impressions"          INTEGER NOT NULL DEFAULT 0,
    "clicks"               INTEGER NOT NULL DEFAULT 0,
    "active"               BOOLEAN NOT NULL DEFAULT true,
    "targetJurisdictions"  TEXT[],
    "targetTradeCategories" TEXT[],
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsored_placements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lead_pricing_tradeCategory_jurisdictionCode_key" ON "lead_pricing"("tradeCategory", "jurisdictionCode");
CREATE INDEX "subscription_plans_tier_active_idx" ON "subscription_plans"("tier", "active");
CREATE INDEX "lead_pricing_tradeCategory_active_idx" ON "lead_pricing"("tradeCategory", "active");
CREATE INDEX "sponsored_placements_type_active_dates_idx" ON "sponsored_placements"("placementType", "active", "startDate", "endDate");
CREATE INDEX "sponsored_placements_sponsorId_idx" ON "sponsored_placements"("sponsorId");

-- P18: Marketplace Intelligence Layer
-- score_events, entity_scores

CREATE TABLE "score_events" (
    "id"         TEXT NOT NULL,
    "entityId"   TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "eventType"  TEXT NOT NULL,
    "weight"     DOUBLE PRECISION NOT NULL,
    "metadata"   JSONB NOT NULL DEFAULT '{}',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entity_scores" (
    "id"             TEXT NOT NULL,
    "entityId"       TEXT NOT NULL,
    "entityType"     TEXT NOT NULL,
    "overallScore"   DOUBLE PRECISION NOT NULL DEFAULT 50,
    "responsiveness" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "reliability"    DOUBLE PRECISION NOT NULL DEFAULT 50,
    "quality"        DOUBLE PRECISION NOT NULL DEFAULT 50,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entity_scores_entityId_entityType_key" ON "entity_scores"("entityId", "entityType");
CREATE INDEX "score_events_entityId_entityType_idx" ON "score_events"("entityId", "entityType");
CREATE INDEX "score_events_entityType_eventType_idx" ON "score_events"("entityType", "eventType");
CREATE INDEX "entity_scores_entityType_overallScore_idx" ON "entity_scores"("entityType", "overallScore" DESC);
