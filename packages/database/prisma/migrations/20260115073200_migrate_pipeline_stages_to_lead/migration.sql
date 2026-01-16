-- AlterTable: Add stageChangedAt to Lead
ALTER TABLE "Lead" ADD COLUMN "stageChangedAt" TIMESTAMP(3);

-- CreateIndex: Add index for stageChangedAt
CREATE INDEX "Lead_stageChangedAt_idx" ON "Lead"("stageChangedAt");

-- AlterTable: Add completion tracking fields to SalesTask
ALTER TABLE "SalesTask" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "SalesTask" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "SalesTask" ADD COLUMN "timeSpent" INTEGER;

-- CreateIndex: Add indexes for SalesTask
CREATE INDEX "SalesTask_type_idx" ON "SalesTask"("type");
CREATE INDEX "SalesTask_createdAt_idx" ON "SalesTask"("createdAt");
