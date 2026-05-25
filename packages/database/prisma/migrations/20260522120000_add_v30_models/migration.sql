-- Kealee Platform v30 models (idempotent)
-- Spec: Kealee Platform Agents/v30/KEALEE-v30-COMPLETE-MASTER-SPEC.md

BEGIN;

-- Project v30 columns
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "packageType" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "packageFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "v30Status" TEXT NOT NULL DEFAULT 'INTAKE';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "whitelabelId" TEXT;

-- User v30 columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "v30Roles" TEXT[] DEFAULT ARRAY['customer']::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "v30Permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED';

CREATE TABLE IF NOT EXISTS "v30_white_label_configs" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "companyEmail" TEXT NOT NULL,
  "logoUrl" TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#0064C8',
  "secondaryColor" TEXT NOT NULL DEFAULT '#666666',
  "accentColor" TEXT NOT NULL DEFAULT '#00B050',
  "customDomain" TEXT,
  "enabledFeatures" TEXT[] DEFAULT ARRAY['design', 'estimate']::TEXT[],
  "monthlyProjectLimit" INTEGER,
  "teamSizeLimit" INTEGER,
  "markup" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "customPricing" JSONB,
  "webhookUrl" TEXT,
  "webhookSecret" TEXT,
  "supportEmail" TEXT,
  "supportPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "v30_white_label_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "v30_white_label_configs_partnerId_key" ON "v30_white_label_configs"("partnerId");

CREATE TABLE IF NOT EXISTS "v30_intake_responses" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyType" TEXT NOT NULL,
  "primaryScope" TEXT NOT NULL,
  "budgetRange" TEXT NOT NULL,
  "timeline" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "squareFeet" INTEGER NOT NULL,
  "yearBuilt" TEXT NOT NULL,
  "utilities" JSONB NOT NULL DEFAULT '{}',
  "codeConsiderations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "scopeComplexity" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "estimatedCost" DECIMAL(12,2) NOT NULL,
  "estimatedDays" INTEGER NOT NULL,
  "analysisJson" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "analyzedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "v30_intake_responses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "v30_intake_responses_projectId_key" ON "v30_intake_responses"("projectId");

CREATE TABLE IF NOT EXISTS "v30_custom_packages" (
  "id" TEXT NOT NULL,
  "intakeResponseId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "basePrice" DECIMAL(12,2) NOT NULL,
  "featureAddons" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalPrice" DECIMAL(12,2) NOT NULL,
  "stripeProductId" TEXT,
  "stripePriceId" TEXT,
  "stripeSessionId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "acceptedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "v30_custom_packages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "v30_custom_packages_intakeResponseId_key" ON "v30_custom_packages"("intakeResponseId");
CREATE UNIQUE INDEX IF NOT EXISTS "v30_custom_packages_projectId_key" ON "v30_custom_packages"("projectId");

-- Additional v30 tables: bot_executions, bot_results, workspaces, configs, metrics, funnel
-- (Prisma migrate deploy will sync full DDL from schema; this file ensures core intake path exists)

COMMIT;
