-- ============================================================================
-- Construction Task Catalog (CTC) — Gordian / Maryland DGS, base year 2023
-- Two companion catalogs from the source PDFs:
--   1. COST catalog       -> ctc_cost_tasks     (priced MasterFormat tasks)
--   2. TECHNICAL catalog  -> ctc_technical_specs (scope / inclusions per task)
-- Plus a platform bridge into the estimating engine's Assembly model.
-- Prices are stored at their 2023 basis AND escalated to the current year.
-- ============================================================================

-- ── Catalog registry (one row per imported catalog/version) ─────────────────
CREATE TABLE IF NOT EXISTS ctc_cost_database (
  id                text PRIMARY KEY,              -- e.g. 'CTC-2023'
  name              text NOT NULL,
  source            text NOT NULL,                 -- 'CTC-2023'
  region            text,                          -- 'MD-DC-VA'
  base_year         int  NOT NULL DEFAULT 2023,
  escalation_year   int,                           -- year prices were escalated to
  escalation_factor numeric(6,4) NOT NULL DEFAULT 1.0,
  publisher         text,                          -- 'The Gordian Group, Inc.'
  copyright_holder  text,                          -- owner of source publication
  licensee          text,                          -- 'Maryland Dept. of General Services'
  rights_basis      text,                          -- contract/license/public-use basis; verify before production use
  platform_custodian text NOT NULL DEFAULT 'Kealee Services LLC',
  redistribution_allowed boolean NOT NULL DEFAULT false,
  is_master         boolean NOT NULL DEFAULT true,
  cost_pdf          text,                          -- source filename (cost)
  technical_pdf     text,                          -- source filename (technical)
  task_count        int  DEFAULT 0,
  spec_count        int  DEFAULT 0,
  imported_at       timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Priced tasks (COST catalog) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ctc_cost_tasks (
  id                 bigserial PRIMARY KEY,
  database_id        text NOT NULL REFERENCES ctc_cost_database(id) ON DELETE CASCADE,
  task_number        text NOT NULL,                -- '03 30 00-0100'
  csi_code           text,                         -- '03 30 00'
  csi_division       text,                         -- '03'
  description        text NOT NULL,
  uom                text,                         -- SF, LF, EA, CY, LB, MO, HR
  -- 2023 basis (as published). CTC unit price bundles labor+material+equipment.
  unit_price_2023    numeric(14,4),
  labor_cost_2023    numeric(14,4),                -- split via division L/M/E ratio
  material_cost_2023 numeric(14,4),
  equipment_cost_2023 numeric(14,4),
  labor_hours        numeric(12,4),
  labor_rate_2023    numeric(10,2),
  labor_hours_method text,
  labor_rate_source_task text,
  labor_rate_trade   text,
  labor_rate_effective_date date,
  -- current-year escalation (base_year -> escalation_year)
  escalation_factor  numeric(6,4) DEFAULT 1.0,
  unit_price_current numeric(14,4),
  -- modifiers (CTC "Add/Deduct for condition" lines)
  is_modifier        boolean NOT NULL DEFAULT false,
  modifier_of        text,
  modifier_type      text,                          -- ADD | DEDUCT | REPLACE | PERCENTAGE
  modifier_value     numeric(14,4),
  page               int,
  source             text NOT NULL DEFAULT 'CTC-2023',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (database_id, task_number)
);
CREATE INDEX IF NOT EXISTS idx_ctc_cost_div  ON ctc_cost_tasks (csi_division);
CREATE INDEX IF NOT EXISTS idx_ctc_cost_code ON ctc_cost_tasks (csi_code);
CREATE INDEX IF NOT EXISTS idx_ctc_cost_desc ON ctc_cost_tasks USING gin (to_tsvector('english', description));
ALTER TABLE ctc_cost_tasks ADD COLUMN IF NOT EXISTS labor_rate_2023 numeric(10,2);
ALTER TABLE ctc_cost_tasks ADD COLUMN IF NOT EXISTS labor_hours_method text;
ALTER TABLE ctc_cost_tasks ADD COLUMN IF NOT EXISTS labor_rate_source_task text;
ALTER TABLE ctc_cost_tasks ADD COLUMN IF NOT EXISTS labor_rate_trade text;
ALTER TABLE ctc_cost_tasks ADD COLUMN IF NOT EXISTS labor_rate_effective_date date;

-- ── Technical specifications (TECHNICAL catalog) ────────────────────────────
CREATE TABLE IF NOT EXISTS ctc_technical_specs (
  id            bigserial PRIMARY KEY,
  database_id   text NOT NULL REFERENCES ctc_cost_database(id) ON DELETE CASCADE,
  spec_number   text,                              -- CSI section, e.g. '03 30 00'
  csi_code      text,
  csi_division  text,
  title         text,
  body          text,                              -- scope / inclusions / execution
  page          int,
  source        text NOT NULL DEFAULT 'CTC-2023',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (database_id, spec_number)
);
CREATE INDEX IF NOT EXISTS idx_ctc_spec_code ON ctc_technical_specs (csi_code);
CREATE INDEX IF NOT EXISTS idx_ctc_spec_body ON ctc_technical_specs USING gin (to_tsvector('english', coalesce(body,'')));

-- ── Joined view: priced task + its technical scope (on CSI section) ─────────
CREATE OR REPLACE VIEW ctc_tasks_with_spec AS
SELECT c.task_number, c.csi_code, c.csi_division, c.description, c.uom,
       c.unit_price_2023, c.unit_price_current, c.labor_hours,
       t.title AS spec_title, t.body AS spec_body
FROM ctc_cost_tasks c
LEFT JOIN ctc_technical_specs t
  ON t.database_id = c.database_id AND t.csi_code = c.csi_code;

-- ── Platform bridge: estimating-engine Assembly rows (subset the engine uses)
-- Mirrors packages/estimating/src/seed-ctc.ts mapping so EstimatingService can
-- price against CTC once the full Prisma schema is present. Standalone here.
CREATE TABLE IF NOT EXISTS ctc_assembly (
  id             text PRIMARY KEY,                 -- uuid
  cost_database_id text NOT NULL,
  ctc_task_number text,
  csi_code       text,
  name           text NOT NULL,
  category       text,                             -- AssemblyCategory bridge
  unit           text,
  unit_cost      numeric(14,4),                    -- current-year
  labor_cost     numeric(14,4),
  material_cost  numeric(14,4),
  equipment_cost numeric(14,4),
  labor_hours    numeric(12,4),
  source_database text NOT NULL DEFAULT 'CTC-2023',
  is_active      boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_ctc_assembly_code ON ctc_assembly (csi_code);

ALTER TABLE ctc_cost_database ADD COLUMN IF NOT EXISTS copyright_holder text;
ALTER TABLE ctc_cost_database ADD COLUMN IF NOT EXISTS rights_basis text;
ALTER TABLE ctc_cost_database ADD COLUMN IF NOT EXISTS platform_custodian text NOT NULL DEFAULT 'Kealee Services LLC';
ALTER TABLE ctc_cost_database ADD COLUMN IF NOT EXISTS redistribution_allowed boolean NOT NULL DEFAULT false;
ALTER TABLE ctc_cost_database ADD COLUMN IF NOT EXISTS is_master boolean NOT NULL DEFAULT true;
ALTER TABLE ctc_cost_database ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE ctc_cost_tasks ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE ctc_cost_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE ctc_technical_specs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE ctc_technical_specs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
