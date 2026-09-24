-- Tenant-scope the site-plan child tables.
-- docs/decisions/white-label-and-tenancy.md — Org IS the tenant.
--
-- `site_plan_workflows` already carries `organizationId`. Its children carry
-- only `workflowId`, so today the owning tenant of a sheet, a stage execution
-- or an audit event is reachable only through a join. That is fine for
-- application queries and useless for a row-level security policy: a policy
-- that joins is slower, and is the kind of thing someone later "simplifies".
-- So the owner is denormalised onto each child.
--
-- THIS MIGRATION DOES NOT ENABLE RLS. Adding the column changes no read path
-- and no query plan, and is safe to apply at any time. Enabling the policies
-- is 20260924170000_site_plan_rls, which must not be applied until the worker
-- and web-main read paths set the tenant session — otherwise every site-plan
-- query returns zero rows the moment the application stops connecting as a
-- BYPASSRLS role, and delivery stops.
--
-- Row counts at authoring time: audit_events 221, stage_executions 97,
-- workflows 9, all other children empty.

DO $$
DECLARE
    t        TEXT;
    orphans  BIGINT;
    total    BIGINT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'site_plan_sheets', 'site_plan_stage_executions', 'site_plan_review_assignments',
        'site_plan_scoped_approvals', 'site_plan_sheet_revisions', 'site_plan_evidence',
        'site_plan_audit_events', 'site_plan_qc_findings', 'site_plan_checklist_results',
        'site_plan_compliance_results', 'site_plan_issuance'
    ] LOOP
        IF to_regclass(format('%I', t)) IS NULL THEN
            RAISE NOTICE 'skipping %, table not present', t;
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "organizationId" TEXT', t);

        -- Derive the owner through the parent workflow.
        EXECUTE format($f$
            UPDATE %I c SET "organizationId" = w."organizationId"
            FROM "site_plan_workflows" w
            WHERE c."workflowId" = w.id AND c."organizationId" IS NULL
        $f$, t);

        -- Anything still unowned has a workflowId pointing at a workflow that
        -- is gone. It is NOT assigned to the homeowner org: that would be a
        -- guess presented as a fact, and an orphan silently filed under a real
        -- tenant is worse than one left visibly unowned. The column stays
        -- nullable on that table, and the RLS policy will hide such rows from
        -- every tenant until a human resolves them.
        EXECUTE format('SELECT count(*) FROM %I WHERE "organizationId" IS NULL', t) INTO orphans;
        EXECUTE format('SELECT count(*) FROM %I', t) INTO total;

        IF orphans = 0 THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN "organizationId" SET NOT NULL', t);
            RAISE NOTICE '% : % rows, all owned, column set NOT NULL', t, total;
        ELSE
            RAISE WARNING '% : % of % rows have no reachable workflow; column left NULLABLE and those rows are unowned', t, orphans, total;
        END IF;

        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I("organizationId")',
                       t || '_organizationId_idx', t);
    END LOOP;
END $$;
