CREATE TABLE IF NOT EXISTS "site_plan_review_assignments" (
  "id" UUID NOT NULL,
  "workflowId" TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "assignedById" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "discipline" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "site_plan_review_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_review_assignments_workflowId_key"
  ON "site_plan_review_assignments"("workflowId");
CREATE INDEX IF NOT EXISTS "site_plan_review_assignments_professionalProfileId_status_updatedAt_idx"
  ON "site_plan_review_assignments"("professionalProfileId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "site_plan_review_assignments_status_assignedAt_idx"
  ON "site_plan_review_assignments"("status", "assignedAt");

-- Server-only review data. Prisma connects as the database role; browser Data
-- API roles must not be able to enumerate professional assignments directly.
ALTER TABLE "site_plan_review_assignments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "site_plan_review_assignments" FROM anon, authenticated;
