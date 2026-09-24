-- Tenancy — docs/decisions/white-label-and-tenancy.md
--
-- Kealee runs two businesses on one codebase. KEALEE_DIRECT is the homeowner
-- business, where Kealee is the service provider and owes the duty to get the
-- work reviewed. WHITE_LABEL is a firm licensing the software, where their own
-- professionals are responsible. The liability models are opposites, so the
-- distinction lives in the type system rather than in a config flag.
--
-- Additive and idempotent. Creates nothing that existing code reads, so it is
-- safe to apply ahead of the application work.

DO $$ BEGIN
    CREATE TYPE "TenantKind" AS ENUM ('KEALEE_DIRECT', 'WHITE_LABEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "TenantIsolation" AS ENUM ('DEDICATED_DEPLOYMENT', 'SHARED_WITH_RLS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "tenants" (
    "id"               TEXT NOT NULL,
    "slug"             TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "kind"             "TenantKind" NOT NULL,
    "status"           "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "isolation"        "TenantIsolation" NOT NULL DEFAULT 'DEDICATED_DEPLOYMENT',
    "displayName"      TEXT,
    "logoUrl"          TEXT,
    "primaryColor"     TEXT,
    "secondaryColor"   TEXT,
    "customDomain"     TEXT,
    "emailFromName"    TEXT,
    "emailFromAddress" TEXT,
    "reportHeader"     TEXT,
    "reportFooter"     TEXT,
    "legalDisclaimer"  TEXT,
    "supportEmail"     TEXT,
    "showKealeeBrand"  BOOLEAN NOT NULL DEFAULT true,
    "enabledModules"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "planKey"          TEXT,
    "jurisdictions"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    "terminatedAt"     TIMESTAMP(3),
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key"         ON "tenants"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_customDomain_key" ON "tenants"("customDomain");
CREATE INDEX        IF NOT EXISTS "tenants_kind_status_idx"  ON "tenants"("kind", "status");

-- Exactly ONE homeowner tenant may ever exist. Enforced by the database
-- because "there is only one" is the kind of invariant application code
-- forgets, and a second KEALEE_DIRECT row would silently split the homeowner
-- business in two.
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_single_kealee_direct"
    ON "tenants"((kind)) WHERE kind = 'KEALEE_DIRECT';

CREATE TABLE IF NOT EXISTS "tenant_usage" (
    "id"                  TEXT NOT NULL,
    "tenantId"            TEXT NOT NULL,
    "periodStart"         TIMESTAMP(3) NOT NULL,
    "periodEnd"           TIMESTAMP(3) NOT NULL,
    "aiInputTokens"       BIGINT NOT NULL DEFAULT 0,
    "aiOutputTokens"      BIGINT NOT NULL DEFAULT 0,
    "agentRuns"           INTEGER NOT NULL DEFAULT 0,
    "documentsCreated"    INTEGER NOT NULL DEFAULT 0,
    "reportsGenerated"    INTEGER NOT NULL DEFAULT 0,
    "propertiesEvaluated" INTEGER NOT NULL DEFAULT 0,
    "storageBytes"        BIGINT NOT NULL DEFAULT 0,
    "emailsSent"          INTEGER NOT NULL DEFAULT 0,
    "apiCalls"            INTEGER NOT NULL DEFAULT 0,
    "jobSeconds"          INTEGER NOT NULL DEFAULT 0,
    "thirdPartyCents"     INTEGER NOT NULL DEFAULT 0,
    "modelCostCents"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_usage_tenantId_periodStart_key"
    ON "tenant_usage"("tenantId", "periodStart");
CREATE INDEX IF NOT EXISTS "tenant_usage_tenantId_periodEnd_idx"
    ON "tenant_usage"("tenantId", "periodEnd");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_usage_tenantId_fkey') THEN
        ALTER TABLE "tenant_usage"
            ADD CONSTRAINT "tenant_usage_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Tenant zero. Explicit rather than implicit: an implicit default is the thing
-- that leaks, because code that forgets to set a tenant silently lands in it.
INSERT INTO "tenants" ("id", "slug", "name", "kind", "status", "isolation",
                       "displayName", "showKealeeBrand", "jurisdictions", "updatedAt")
VALUES ('tenant_kealee_direct', 'kealee', 'Kealee', 'KEALEE_DIRECT', 'ACTIVE',
        'DEDICATED_DEPLOYMENT', 'Kealee', true,
        ARRAY['prince_georges_md']::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
