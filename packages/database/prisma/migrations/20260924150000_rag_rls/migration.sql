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
-- STEP 1 DONE (2026-09-24). Role `kealee_app` created:
--   rolsuper=false  rolbypassrls=false  rolcanlogin=true  password: NOT SET
--   652 tables granted, plus ALTER DEFAULT PRIVILEGES so new tables inherit.
-- No NOSUPERUSER clause: Supabase's `postgres` is not a superuser and cannot
-- set that attribute, and roles are non-superuser by default anyway.
-- No password was set, deliberately — the role cannot authenticate, so its
-- existence changes nothing about who can reach this database.
--
-- STEP 3 DONE (2026-09-24). The policy was proven under that role using
-- SET LOCAL ROLE, which exercises RLS exactly as a real connection would
-- without needing credentials. Two tenants, seven checks, all passed:
--   * A sees only its own row; B sees only its own
--   * A cannot read B even by naming the exact row id
--   * A cannot INSERT a row labelled as B        (WITH CHECK)
--   * A cannot UPDATE B's row — 0 rows affected  (USING)
--   * no tenant session returns NOTHING, not everything
--   * proof rows removed; tables empty again
-- The policy is correct. Only the connecting role is wrong.
--
-- STEP 2 REMAINS, and is a human cutover:
--   a. Set a password on kealee_app (Supabase dashboard, or ALTER ROLE from
--      a psql session you control).
--   b. Repoint DATABASE_URL for every service to kealee_app. Leave DIRECT_URL
--      on postgres — migrations must create objects kealee_app must not.
--   c. Watch the healthchecks. If any grant is missing, EVERY service fails at
--      once, and the symptom is empty results rather than an error, because
--      the policy fails closed.
--   d. Re-run the proof against the real connection.
-- Do this deliberately, not as a side effect of something else.
