-- ============================================================================
-- KEALEE PLATFORM — Row-Level Security Policies
-- ============================================================================
-- Apply via Supabase SQL Editor or as a migration.
--
-- Principles:
--   1. Every table with user data has RLS enabled.
--   2. The service_role key (used by Command Center workers) bypasses all RLS.
--   3. Users can only see/modify data they are authorized to access.
--   4. Admin users get broader access through org membership checks.
-- ============================================================================

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ ENABLE RLS                                                              │
-- └──────────────────────────────────────────────────────────────────────────┘

ALTER TABLE "User"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Org"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrgMember"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EscrowAgreement"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialTransaction"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyReport"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteVisit"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BudgetSnapshot"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DecisionQueue"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BidEvaluation"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bid"                   ENABLE ROW LEVEL SECURITY;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ HELPER: check if the current user is a member of a given project        │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Project" p
    LEFT JOIN "project_managers" pm ON pm."projectId" = p.id
    LEFT JOIN "Client" c ON c.id = p."clientId"
    WHERE p.id = p_project_id
      AND (
        p."pmId" = auth.uid()::text
        OR pm."userId" = auth.uid()::text
        OR c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR p."orgId" IN (
          SELECT "orgId" FROM "OrgMember" WHERE "userId" = auth.uid()::text
        )
      )
  );
$$;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ USER — own record only                                                  │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "users_select_own" ON "User"
  FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "users_update_own" ON "User"
  FOR UPDATE USING (id = auth.uid()::text);

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ ORG — only org members                                                  │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "org_members_select" ON "Org"
  FOR SELECT USING (
    id IN (
      SELECT "orgId" FROM "OrgMember"
      WHERE "userId" = auth.uid()::text
    )
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ ORG_MEMBER — see own memberships + same-org members                     │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "org_member_access" ON "OrgMember"
  FOR SELECT USING (
    "userId" = auth.uid()::text
    OR "orgId" IN (
      SELECT "orgId" FROM "OrgMember"
      WHERE "userId" = auth.uid()::text
    )
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ CLIENT — see own client record (matched by email)                       │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "client_own_record" ON "Client"
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR "assignedPM" = auth.uid()::text
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ PROJECT — members only                                                  │
-- │  - PM (pmId)                                                            │
-- │  - Project managers (project_managers table)                             │
-- │  - Client (via Client.email match)                                      │
-- │  - Org members (same org)                                               │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "project_membership" ON "Project"
  FOR SELECT USING (
    "pmId" = auth.uid()::text
    OR id IN (
      SELECT "projectId" FROM "project_managers"
      WHERE "userId" = auth.uid()::text
    )
    OR "clientId" IN (
      SELECT id FROM "Client"
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR "orgId" IN (
      SELECT "orgId" FROM "OrgMember"
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY "project_update" ON "Project"
  FOR UPDATE USING (
    "pmId" = auth.uid()::text
    OR id IN (
      SELECT "projectId" FROM "project_managers"
      WHERE "userId" = auth.uid()::text
    )
    OR "orgId" IN (
      SELECT "orgId" FROM "OrgMember"
      WHERE "userId" = auth.uid()::text
    )
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LEAD — clients see own leads, contractors see matched leads              │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "lead_access" ON "Lead"
  FOR SELECT USING (
    "projectId" IN (
      SELECT id FROM "Project"
      WHERE "clientId" IN (
        SELECT id FROM "Client"
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
    OR id IN (
      SELECT "leadId" FROM "LeadMatch"
      WHERE "contractorId" = auth.uid()::text
    )
    OR "projectId" IN (
      SELECT "projectId" FROM "project_managers"
      WHERE "userId" = auth.uid()::text
    )
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ ESCROW AGREEMENT — project members only                                 │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "escrow_project_members" ON "EscrowAgreement"
  FOR SELECT USING (
    is_project_member("projectId"::uuid)
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ FINANCIAL TRANSACTION — project members + org admins                     │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "financial_txn_access" ON "FinancialTransaction"
  FOR SELECT USING (
    is_project_member("projectId"::uuid)
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ WEEKLY REPORT — project members                                         │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "weekly_report_access" ON "WeeklyReport"
  FOR SELECT USING (
    is_project_member("projectId"::uuid)
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ SITE VISIT — assigned PM + project members                              │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "site_visit_access" ON "SiteVisit"
  FOR SELECT USING (
    "pmId" = auth.uid()::text
    OR is_project_member("projectId"::uuid)
  );

CREATE POLICY "site_visit_update" ON "SiteVisit"
  FOR UPDATE USING (
    "pmId" = auth.uid()::text
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ BUDGET SNAPSHOT — PM + project client + org admins                      │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "budget_snapshot_access" ON "BudgetSnapshot"
  FOR SELECT USING (
    is_project_member("projectId"::uuid)
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ DECISION QUEUE — assigned PM or project client                          │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "decision_queue_access" ON "DecisionQueue"
  FOR SELECT USING (
    "pmId" = auth.uid()::text
    OR is_project_member("projectId"::uuid)
  );

CREATE POLICY "decision_queue_update" ON "DecisionQueue"
  FOR UPDATE USING (
    "pmId" = auth.uid()::text
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ BID EVALUATION — project members                                        │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "bid_evaluation_access" ON "BidEvaluation"
  FOR SELECT USING (
    is_project_member("projectId"::uuid)
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ BID — project members + the contractor who submitted                    │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE POLICY "bid_access" ON "Bid"
  FOR SELECT USING (
    "contractorId" = auth.uid()::text
    OR "evaluationId" IN (
      SELECT id FROM "BidEvaluation"
      WHERE is_project_member("projectId"::uuid)
    )
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ NOTES                                                                   │
-- └──────────────────────────────────────────────────────────────────────────┘
-- The service_role key automatically bypasses all RLS policies.
-- Command Center workers use the service_role key via createSupabaseAdminClient().
--
-- To grant full admin access to specific users (without service_role):
--   CREATE POLICY "admin_full_access" ON "Project"
--     USING (
--       auth.uid()::text IN (
--         SELECT "userId" FROM "OrgMember"
--         WHERE "roleKey" IN ('admin', 'super_admin')
--       )
--     );
-- Apply this pattern per-table as needed.
