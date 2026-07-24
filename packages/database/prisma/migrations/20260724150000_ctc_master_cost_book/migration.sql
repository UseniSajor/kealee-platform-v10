-- Canonical CTC master cost-book registry and task tables.
-- Kealee owns the platform schema, normalization, and derived allocations.
-- This migration does not claim ownership of the Gordian source publication.

CREATE TABLE IF NOT EXISTS "ctc_cost_database" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "source" text NOT NULL,
  "region" text,
  "base_year" integer NOT NULL DEFAULT 2023,
  "escalation_year" integer,
  "escalation_factor" numeric(8,4) NOT NULL DEFAULT 1.0,
  "publisher" text,
  "copyright_holder" text,
  "licensee" text,
  "rights_basis" text,
  "platform_custodian" text NOT NULL DEFAULT 'Kealee Services LLC',
  "redistribution_allowed" boolean NOT NULL DEFAULT false,
  "is_master" boolean NOT NULL DEFAULT true,
  "cost_pdf" text,
  "technical_pdf" text,
  "task_count" integer NOT NULL DEFAULT 0,
  "spec_count" integer NOT NULL DEFAULT 0,
  "imported_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ctc_cost_tasks" (
  "id" bigserial PRIMARY KEY,
  "database_id" text NOT NULL REFERENCES "ctc_cost_database"("id") ON DELETE CASCADE,
  "task_number" text NOT NULL,
  "csi_code" text,
  "csi_division" text,
  "description" text NOT NULL,
  "uom" text,
  "unit_price_2023" numeric(14,4),
  "labor_cost_2023" numeric(14,4),
  "material_cost_2023" numeric(14,4),
  "equipment_cost_2023" numeric(14,4),
  "labor_hours" numeric(12,4),
  "labor_rate_2023" numeric(10,2),
  "labor_hours_method" text,
  "labor_rate_source_task" text,
  "labor_rate_trade" text,
  "labor_rate_effective_date" date,
  "escalation_factor" numeric(8,4) NOT NULL DEFAULT 1.0,
  "unit_price_current" numeric(14,4),
  "is_modifier" boolean NOT NULL DEFAULT false,
  "modifier_of" text,
  "modifier_type" text,
  "modifier_value" numeric(14,4),
  "page" integer,
  "source" text NOT NULL DEFAULT 'CTC-2023',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ctc_cost_tasks_database_id_task_number_key" UNIQUE ("database_id", "task_number")
);

CREATE TABLE IF NOT EXISTS "ctc_technical_specs" (
  "id" bigserial PRIMARY KEY,
  "database_id" text NOT NULL REFERENCES "ctc_cost_database"("id") ON DELETE CASCADE,
  "spec_number" text,
  "csi_code" text,
  "csi_division" text,
  "title" text,
  "body" text,
  "page" integer,
  "source" text NOT NULL DEFAULT 'CTC-2023',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ctc_technical_specs_database_id_spec_number_key" UNIQUE ("database_id", "spec_number")
);

CREATE INDEX IF NOT EXISTS "ctc_cost_database_is_master_idx" ON "ctc_cost_database" ("is_master");
CREATE INDEX IF NOT EXISTS "ctc_cost_database_source_idx" ON "ctc_cost_database" ("source");
CREATE INDEX IF NOT EXISTS "ctc_cost_tasks_csi_division_idx" ON "ctc_cost_tasks" ("csi_division");
CREATE INDEX IF NOT EXISTS "ctc_cost_tasks_csi_code_idx" ON "ctc_cost_tasks" ("csi_code");
CREATE INDEX IF NOT EXISTS "ctc_cost_tasks_task_number_idx" ON "ctc_cost_tasks" ("task_number");
CREATE INDEX IF NOT EXISTS "ctc_cost_tasks_search_idx"
  ON "ctc_cost_tasks" USING gin (to_tsvector('english', "description"));
CREATE INDEX IF NOT EXISTS "ctc_technical_specs_csi_code_idx" ON "ctc_technical_specs" ("csi_code");
CREATE INDEX IF NOT EXISTS "ctc_technical_specs_csi_division_idx" ON "ctc_technical_specs" ("csi_division");

ALTER TABLE "ctc_cost_database" ADD COLUMN IF NOT EXISTS "copyright_holder" text;
ALTER TABLE "ctc_cost_database" ADD COLUMN IF NOT EXISTS "rights_basis" text;
ALTER TABLE "ctc_cost_database" ADD COLUMN IF NOT EXISTS "platform_custodian" text NOT NULL DEFAULT 'Kealee Services LLC';
ALTER TABLE "ctc_cost_database" ADD COLUMN IF NOT EXISTS "redistribution_allowed" boolean NOT NULL DEFAULT false;
ALTER TABLE "ctc_cost_database" ADD COLUMN IF NOT EXISTS "is_master" boolean NOT NULL DEFAULT true;
ALTER TABLE "ctc_cost_database" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "ctc_cost_tasks" ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "ctc_cost_tasks" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "ctc_technical_specs" ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "ctc_technical_specs" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();
