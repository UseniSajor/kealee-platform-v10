-- Site-plan workflow activation.
--
-- Additive only. No column is renamed or dropped, and every addition is
-- nullable or defaulted, so this is safe to run against existing production
-- rows and safe to run twice.
--
-- Why each one exists:
--
--   site_plan_workflows.definition_version — a worker refuses to run a stage
--     under a definition version other than its own rather than mixing
--     definitions mid-flight.
--   site_plan_workflows.order_id / idempotency_key — duplicate Stripe delivery
--     is normal, not exceptional. The unique key makes a redelivery resolve to
--     the existing workflow instead of creating a second one.
--   site_plan_stage_executions.job — `stage` carries the coarse
--     SitePlanStageCode the schema already had; the state machine sequences on
--     the detailed registered job name, so resume needs it persisted.
--   site_plan_stage_executions.job_queue_id — correlates a stage to the
--     JobQueue row that executed it.
--   site_plan_issuance.delivery_state — the customer-visible delivery
--     lifecycle. Jurisdiction approval is separate and never implied by it.

-- ── Enum ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SitePlanDeliveryState') THEN
    CREATE TYPE "SitePlanDeliveryState" AS ENUM (
      'GENERATING',
      'PRELIMINARY_READY',
      'PROFESSIONAL_REVIEW',
      'REVISION_REQUIRED',
      'SUBMISSION_PACKAGE_READY',
      'FAILED'
    );
  END IF;
END$$;

-- ── site_plan_workflows ─────────────────────────────────────────────────────
ALTER TABLE "site_plan_workflows"
  ADD COLUMN IF NOT EXISTS "definitionVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "orderId" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- Unique rather than a plain index: the constraint IS the idempotency
-- guarantee. A partial index skipping NULLs keeps pre-existing rows valid.
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_workflows_idempotencyKey_key"
  ON "site_plan_workflows" ("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "site_plan_workflows_orderId_idx"
  ON "site_plan_workflows" ("orderId");

-- ── site_plan_stage_executions ──────────────────────────────────────────────
ALTER TABLE "site_plan_stage_executions"
  ADD COLUMN IF NOT EXISTS "job" TEXT,
  ADD COLUMN IF NOT EXISTS "jobQueueId" TEXT;

-- The runner upserts on (workflowId, job) so a retry updates its attempt
-- rather than accumulating rows — a pile of attempts would make "what
-- completed" ambiguous on resume. Partial, because `job` is null on any row
-- written before this migration.
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_stage_executions_workflowId_job_key"
  ON "site_plan_stage_executions" ("workflowId", "job")
  WHERE "job" IS NOT NULL;

-- ── site_plan_issuance ──────────────────────────────────────────────────────
ALTER TABLE "site_plan_issuance"
  ADD COLUMN IF NOT EXISTS "deliveryState" "SitePlanDeliveryState" NOT NULL DEFAULT 'GENERATING';
