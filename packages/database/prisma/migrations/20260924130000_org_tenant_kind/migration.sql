-- An Org is the tenant, and now says WHICH BUSINESS it belongs to.
-- docs/decisions/white-label-and-tenancy.md §4b — Org-as-tenant adopted.
--
-- The white-label schema models tier and status, which describe commercial
-- shape. Neither says who carries professional responsibility, and that is the
-- distinction the design turns on: in the homeowner business Kealee produces
-- the work and owes the duty to get it reviewed; in white-label the client's
-- own professional is responsible. Conflating them has Kealee inheriting
-- liability for a builder's decision on a drawing Kealee never saw.
--
-- Additive and idempotent. Every existing Org is the homeowner business,
-- because white-label does not exist yet, so the backfill is unambiguous.

DO $$ BEGIN
    CREATE TYPE "OrgTenantKind" AS ENUM ('KEALEE_DIRECT', 'WHITE_LABEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Org" ADD COLUMN IF NOT EXISTS "tenantKind" "OrgTenantKind";
UPDATE "Org" SET "tenantKind" = 'KEALEE_DIRECT' WHERE "tenantKind" IS NULL;
ALTER TABLE "Org" ALTER COLUMN "tenantKind" SET NOT NULL;
ALTER TABLE "Org" ALTER COLUMN "tenantKind" SET DEFAULT 'KEALEE_DIRECT';

CREATE INDEX IF NOT EXISTS "Org_tenantKind_idx" ON "Org"("tenantKind");
