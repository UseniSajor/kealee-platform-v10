-- Phase 1 of the data-driven jurisdiction rule engine: adds JurisdictionRuleVersion.kind
-- (distinguishing evaluable CHECK rows from discovery-gate/input-schema/compiled rows),
-- a SUBMITTED_TO_JURISDICTION stage, the missing link from PermitSubmission to
-- SitePlanWorkflow, and real @relation FK integrity on tables that previously only had
-- bare-string foreign key columns.
--
-- Scoped narrowly and applied by hand via `prisma db execute` rather than `prisma migrate
-- dev`, because this database's migration history does not currently replay cleanly into a
-- shadow database (an old migration, 20260115073113_add_lead_pipeline_fields, assumes a
-- User table that no earlier migration in the tracked history creates) — a pre-existing
-- issue unrelated to this change. Verified before applying: site_plan_workflows,
-- site_plan_stage_executions, site_plan_compliance_results, professional_review_records,
-- and "PermitSubmission" all had zero rows; jurisdiction_rule_versions had exactly its
-- known 8 OFFICIAL_SOURCE_REGISTRY discovery-gate rows (now backfilled to kind=SOURCE_REGISTRY).

-- 1. New enum for JurisdictionRuleVersion.kind
CREATE TYPE "JurisdictionRuleKind" AS ENUM ('CHECK', 'INPUT_SCHEMA', 'SOURCE_REGISTRY', 'COMPILED');

-- 2. New workflow stage
ALTER TYPE "SitePlanStageCode" ADD VALUE IF NOT EXISTS 'SUBMITTED_TO_JURISDICTION';

-- 3. kind column on JurisdictionRuleVersion
ALTER TABLE "jurisdiction_rule_versions" ADD COLUMN "kind" "JurisdictionRuleKind" NOT NULL DEFAULT 'CHECK';
CREATE INDEX "jurisdiction_rule_versions_jurisdictionCode_kind_supersededAt_idx"
  ON "jurisdiction_rule_versions"("jurisdictionCode", "kind", "supersededAt");
UPDATE "jurisdiction_rule_versions" SET "kind" = 'SOURCE_REGISTRY' WHERE "ruleKey" = 'OFFICIAL_SOURCE_REGISTRY';

-- 4. sitePlanWorkflowId on PermitSubmission
ALTER TABLE "PermitSubmission" ADD COLUMN "sitePlanWorkflowId" TEXT;
CREATE INDEX "PermitSubmission_sitePlanWorkflowId_idx" ON "PermitSubmission"("sitePlanWorkflowId");
ALTER TABLE "PermitSubmission" ADD CONSTRAINT "PermitSubmission_sitePlanWorkflowId_fkey"
  FOREIGN KEY ("sitePlanWorkflowId") REFERENCES "site_plan_workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Real @relation FKs (all affected tables confirmed empty — safe to add without orphans)
ALTER TABLE "site_plan_stage_executions" ADD CONSTRAINT "site_plan_stage_executions_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "site_plan_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "site_plan_compliance_results" ADD CONSTRAINT "site_plan_compliance_results_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "site_plan_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_plan_compliance_results" ADD CONSTRAINT "site_plan_compliance_results_stageExecutionId_fkey"
  FOREIGN KEY ("stageExecutionId") REFERENCES "site_plan_stage_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_plan_compliance_results" ADD CONSTRAINT "site_plan_compliance_results_ruleVersionId_fkey"
  FOREIGN KEY ("ruleVersionId") REFERENCES "jurisdiction_rule_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "professional_review_records" ADD CONSTRAINT "professional_review_records_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "site_plan_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "professional_review_records" ADD CONSTRAINT "professional_review_records_professionalAssignmentId_fkey"
  FOREIGN KEY ("professionalAssignmentId") REFERENCES "professional_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
