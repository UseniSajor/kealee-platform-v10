-- HOTFIX. Restores writes that 20260924160000_site_plan_org_scope broke.
--
-- WHAT I GOT WRONG: that migration added `organizationId` as NOT NULL with no
-- default. The backfill was correct and every existing row resolved cleanly, so
-- it looked finished. It was not: the DEPLOYED worker inserts into
-- site_plan_stage_executions and site_plan_audit_events on every order and does
-- not pass organizationId, because the code that would pass it is not written
-- yet. A NOT NULL column with no default rejects those inserts outright.
--
-- The window was roughly fifteen minutes between applying that migration and
-- this one. Any site-plan order activating in that window would have failed on
-- its first stage write.
--
-- The lesson, written down because it is the kind that repeats: adding a NOT
-- NULL column is not a schema change, it is a CONTRACT change with every
-- writer. Backfilling the existing rows proves nothing about the next INSERT.
-- Check what writes to a table before constraining it, not only what is in it.
--
-- THE DEFAULT IS TEMPORARY AND IS A COMPROMISE. An implicit default is exactly
-- what this whole tenancy design warns against — code that forgets to set an
-- owner silently lands in one. It is correct today only because exactly one
-- real tenant exists (kealee-platform, KEALEE_DIRECT) and every row legitimately
-- belongs to it.
--
-- REMOVE THIS DEFAULT once the worker and web-main pass organizationId
-- explicitly on every site-plan write. Leaving it in place past that point
-- means a white-label row created by code that forgot to set the owner is
-- silently attributed to Kealee's own business, which is the precise failure
-- docs/decisions/white-label-and-tenancy.md exists to prevent.

DO $$
DECLARE
    t   TEXT;
    org TEXT;
BEGIN
    SELECT id INTO org FROM "Org" WHERE "tenantKind" = 'KEALEE_DIRECT' ORDER BY "createdAt" ASC LIMIT 1;
    IF org IS NULL THEN
        RAISE EXCEPTION 'No KEALEE_DIRECT organization exists; refusing to guess a default owner';
    END IF;
    RAISE NOTICE 'defaulting site-plan organizationId to % until the code sets it explicitly', org;

    FOREACH t IN ARRAY ARRAY[
        'site_plan_sheets', 'site_plan_stage_executions', 'site_plan_review_assignments',
        'site_plan_scoped_approvals', 'site_plan_sheet_revisions', 'site_plan_evidence',
        'site_plan_audit_events', 'site_plan_qc_findings', 'site_plan_checklist_results',
        'site_plan_compliance_results', 'site_plan_issuance'
    ] LOOP
        IF to_regclass(format('%I', t)) IS NULL THEN CONTINUE; END IF;
        EXECUTE format('ALTER TABLE %I ALTER COLUMN "organizationId" SET DEFAULT %L', t, org);
    END LOOP;
END $$;
