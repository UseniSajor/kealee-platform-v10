-- Add Clerk ID fields for external auth provider linking
-- User: clerkUserId (Clerk user ID for authentication)
-- Org: clerkOrgId (Clerk organization ID, if using Clerk Organizations)

ALTER TABLE "User" ADD COLUMN "clerkUserId" TEXT;
ALTER TABLE "Org" ADD COLUMN "clerkOrgId" TEXT;

-- Create unique indexes for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "User"("clerkUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "Org_clerkOrgId_key" ON "Org"("clerkOrgId");

-- Add comment for clarity
COMMENT ON COLUMN "User"."clerkUserId" IS 'External Clerk user ID for authentication';
COMMENT ON COLUMN "Org"."clerkOrgId" IS 'External Clerk organization ID (optional, if using Clerk Organizations)';
