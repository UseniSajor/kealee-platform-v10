-- Canonical Clerk identity fields. Legacy clerkUserId/clerkOrgId columns are
-- retained temporarily so this migration is safe for already-provisioned data.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "externalAuthId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" TEXT DEFAULT 'supabase';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Org" ADD COLUMN IF NOT EXISTS "externalAuthId" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'clerkUserId'
  ) THEN
    EXECUTE 'UPDATE "User" SET "externalAuthId" = "clerkUserId", "authProvider" = ''clerk'' WHERE "externalAuthId" IS NULL AND "clerkUserId" IS NOT NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Org' AND column_name = 'clerkOrgId'
  ) THEN
    EXECUTE 'UPDATE "Org" SET "externalAuthId" = "clerkOrgId" WHERE "externalAuthId" IS NULL AND "clerkOrgId" IS NOT NULL';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "User_externalAuthId_key" ON "User"("externalAuthId");
CREATE UNIQUE INDEX IF NOT EXISTS "Org_externalAuthId_key" ON "Org"("externalAuthId");

-- Estimate.projectId existed without its declared relation in the canonical
-- Prisma schema. Keep orphaned historic estimates valid by nulling bad links.
UPDATE "estimates" e
SET "projectId" = NULL
WHERE "projectId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = e."projectId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'estimates_projectId_fkey'
  ) THEN
    ALTER TABLE "estimates"
      ADD CONSTRAINT "estimates_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
