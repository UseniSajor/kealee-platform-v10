-- Row-level security on the retrieval corpus.
-- docs/decisions/white-label-and-tenancy.md, phase T2.
--
-- SCOPED TO THE THREE RAG TABLES AND NOTHING ELSE, deliberately.
--
-- The site-plan tables cannot carry RLS yet: verified against production
-- 2026-09-24, `SitePlanSheet` and `SitePlanStageExecution` have neither a
-- tenantId nor an organizationId column, so there is nothing for a policy to
-- filter on. Enabling RLS there would need the column, a backfill through the
-- parent workflow, and the read paths wrapped in a tenant session first. That
-- is a separate change.
--
-- The RAG tables are the opposite case and that is why they go first:
--   * they carry `tenantId` as of 20260923120000
--   * they are EMPTY (0 rows, verified against production)
--   * nothing deployed reads them — the only ingester lives in `services/api`,
--     which is not in the Railway production service list
--
-- So the blast radius is zero, and the boundary is locked BEFORE the corpus
-- starts filling rather than after. Retrofitting isolation onto a populated
-- corpus means deciding who owns rows whose owner was never recorded.
--
-- FAILS CLOSED: with no `app.tenant_id` set, `current_setting(..., true)`
-- returns NULL, `"tenantId" = NULL` evaluates to NULL rather than true, and the
-- query returns nothing. A caller that forgets `withTenantSession()` gets an
-- empty result, never another tenant's data.
--
-- FORCE, so the policy applies to the table owner too. Without it the role the
-- application connects as may well be the owner and bypass RLS entirely, which
-- is the most common way this control is quietly disabled.

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['rag_documents', 'rag_chunks', 'rag_retrievals'] LOOP
        IF to_regclass(format('%I', t)) IS NULL THEN
            RAISE NOTICE 'skipping %, table not present', t;
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
        EXECUTE format($p$
            CREATE POLICY %I ON %I
            USING ("tenantId" = current_setting('app.tenant_id', true))
            WITH CHECK ("tenantId" = current_setting('app.tenant_id', true))
        $p$, t || '_tenant_isolation', t);
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠ APPLIED 2026-09-24 AND CURRENTLY INERT. READ BEFORE TRUSTING IT.
--
-- These policies are live on all three tables — relrowsecurity and
-- relforcerowsecurity are both true and three policies exist — and they DO
-- NOTHING, because the role the application connects as can bypass them:
--
--     SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;
--     -> postgres | false | TRUE
--
-- Verified empirically rather than assumed. A two-tenant proof run against
-- production seeded one document per tenant and every isolation check failed:
-- tenant A read B's rows, an INSERT forging B's tenantId succeeded, and a query
-- with NO tenant session returned everything instead of nothing. The proof rows
-- were deleted afterwards and the tables are empty again.
--
-- This is the exact failure this file's own header warns about, and it is worth
-- stating plainly: ENABLING RLS ISOLATES NOTHING UNTIL THE CONNECTING ROLE
-- CANNOT BYPASS IT. Enabled-and-bypassed is more dangerous than disabled,
-- because it reads as protection to any audit that checks relrowsecurity.
--
-- To make it real, three steps, in this order:
--   1. Create a login role with NOBYPASSRLS and NOSUPERUSER, and grant it
--      USAGE on schema public, DML on all tables, USAGE+SELECT on sequences,
--      plus matching ALTER DEFAULT PRIVILEGES so future tables inherit them.
--   2. Point DATABASE_URL at that role. Leave DIRECT_URL on postgres —
--      migrations must create objects the application role must not.
--   3. Re-run the two-tenant proof. It must pass before isolation is claimed.
--
-- Step 2 is a cutover: if any grant is missing, EVERY service fails at once.
-- Do it deliberately and watch the healthchecks, not as a side effect of
-- something else.
