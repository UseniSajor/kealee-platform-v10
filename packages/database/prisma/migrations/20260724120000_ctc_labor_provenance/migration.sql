ALTER TABLE "assemblies"
  ADD COLUMN IF NOT EXISTS "appliedLaborRate" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "laborHoursMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "laborRateSourceTask" TEXT,
  ADD COLUMN IF NOT EXISTS "laborRateTrade" TEXT,
  ADD COLUMN IF NOT EXISTS "laborRateEffectiveDate" TIMESTAMPTZ;

ALTER TABLE "estimate_line_items"
  ADD COLUMN IF NOT EXISTS "appliedLaborRate" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "laborHoursMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "laborRateSourceTask" TEXT,
  ADD COLUMN IF NOT EXISTS "laborRateTrade" TEXT,
  ADD COLUMN IF NOT EXISTS "laborRateEffectiveDate" TIMESTAMPTZ;

ALTER TABLE IF EXISTS "ctc_cost_tasks"
  ADD COLUMN IF NOT EXISTS "labor_rate_2023" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "labor_hours_method" TEXT,
  ADD COLUMN IF NOT EXISTS "labor_rate_source_task" TEXT,
  ADD COLUMN IF NOT EXISTS "labor_rate_trade" TEXT,
  ADD COLUMN IF NOT EXISTS "labor_rate_effective_date" DATE;
