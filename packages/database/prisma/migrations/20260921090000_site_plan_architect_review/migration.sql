-- One review assignment per discipline per workflow (architect review queue).
DROP INDEX IF EXISTS "site_plan_review_assignments_workflowId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_review_assignments_workflowId_discipline_key"
  ON "site_plan_review_assignments"("workflowId", "discipline");
CREATE INDEX IF NOT EXISTS "site_plan_review_assignments_workflowId_idx"
  ON "site_plan_review_assignments"("workflowId");
