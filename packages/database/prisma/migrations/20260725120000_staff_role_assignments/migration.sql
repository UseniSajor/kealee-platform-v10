-- Staff role assignments: decoupled from OrgMember/Org, keyed by Supabase
-- auth user id. Lets the /rbac UI (Role/Permission/RolePermission) actually
-- drive who can sign into os-admin / Command Center, instead of that being a
-- manual SQL update against auth.users.
--
-- NOTE: applied directly to the Supabase-hosted Postgres via Supabase MCP on
-- 2026-07-25 (see packages/auth/src/ops-api-auth.ts for the consuming code),
-- since this repo's DATABASE_URL currently points at a different, disconnected
-- Railway Postgres instance. This file exists so `prisma migrate deploy`
-- applies cleanly once DATABASE_URL is repointed at the real database.
CREATE TABLE IF NOT EXISTS "staff_role_assignments" (
  "id" text PRIMARY KEY,
  "authUserId" text NOT NULL UNIQUE,
  "email" text NOT NULL,
  "roleKey" text NOT NULL REFERENCES "roles"("key"),
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" text
);

CREATE INDEX IF NOT EXISTS "staff_role_assignments_roleKey_idx" ON "staff_role_assignments"("roleKey");
