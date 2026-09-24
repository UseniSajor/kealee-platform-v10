# Cutting over to the non-bypassing database role

Moves the application from `postgres` (which can bypass row-level security) to
`kealee_app` (which cannot). Until this is done, **the RLS policies on the RAG
tables are live and do nothing** — see
`prisma/migrations/20260924150000_rag_rls/migration.sql`.

Allow 30 minutes. Do it when you can watch, not at the end of something else.

---

## Before you start

**1. The wrapped worker must be deployed.** Commit `a4cfdc22` makes the
worker's site-plan database work run with the tenant session set. If you cut
over while the old worker is live, nothing breaks today — site-plan tables have
no RLS policy yet — but you lose the ability to enable one afterwards without a
second cutover. Check the live commit:

```bash
curl -s https://kealee.com/api/health | jq -r '.commit'
```

**2. Run one real site-plan order and confirm it completes.** This is the
baseline you will compare against afterwards. Without it you cannot tell
whether something the cutover broke was already broken.

**3. Take a Supabase snapshot.** A minute now against an unknown later.

---

## The two things that will catch you out

**Supabase's pooler wants `role.project_ref`, not `role`.** Every current URL
uses `postgres.rkreqfpkxavqpsqexbfs`, so the new one is
`kealee_app.rkreqfpkxavqpsqexbfs`. A plain `kealee_app` fails authentication
against port 6543 with an error that reads like a wrong password.

**`marketing-cron` does not hold a literal URL.** Its `DATABASE_URL` is
`postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?sslmode=require`.
Changing `DATABASE_URL` there does nothing. Change `DATABASE_USER` and
`DATABASE_PASSWORD` instead, or leave the service alone — it is a cron runner
and can move last.

---

## Step 1 — Set a password on the role

`kealee_app` exists already with `rolbypassrls=false` and 652 tables granted.
It has **no password**, which is why it cannot yet connect.

Supabase dashboard → Database → Roles → `kealee_app` → set a password. Or from
a `psql` session you control:

```sql
ALTER ROLE kealee_app WITH PASSWORD '<generate a strong one>';
```

Generate it somewhere that is not a chat window or a shell history file.

## Step 2 — Cut over ONE service and watch it

`web-main` first: it is the most exercised and has the best healthcheck.

```bash
railway variables --service web-main \
  --set "DATABASE_URL=postgresql://kealee_app.rkreqfpkxavqpsqexbfs:<password>@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
```

Then, once it has redeployed:

```bash
curl -s https://kealee.com/api/health | jq
```

Load a page that reads real data — the admin site-plan desk, or an owner
deliverables list. **What you are looking for is not an error.** RLS fails
closed, so a missing grant shows up as an empty list, a page that renders with
nothing on it, a count of zero. If a page that had rows now has none, stop and
go to Rollback.

## Step 3 — The rest

```bash
for s in worker portal-owner portal-contractor portal-developer \
         os-admin m-marketplace command-center kealee-platform-v10; do
  railway variables --service "$s" \
    --set "DATABASE_URL=postgresql://kealee_app.rkreqfpkxavqpsqexbfs:<password>@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
done
```

`marketing-os` has no `DATABASE_URL` and needs nothing. `marketing-cron` is the
interpolated case above.

## Step 4 — Leave DIRECT_URL alone

Only `worker` and `kealee-platform-v10` carry `DIRECT_URL`. **Both stay on
`postgres`.** Migrations create tables, types and policies, and `kealee_app`
deliberately cannot. Pointing `DIRECT_URL` at the application role means the
next migration fails on a permission error — which is the system working, but
at an inconvenient moment.

## Step 5 — Verify, then finish the isolation

```bash
cd packages/database
DATABASE_URL="<the new kealee_app url>" node scripts/verify-siteplan-writes.cjs
```

That reproduces the worker's insert shape and checks all 11 site-plan tables.

Then tell Claude, or run it yourself: enable RLS on the site-plan tables and
drop the temporary `organizationId` column default from
`20260924170000_site_plan_org_default_hotfix`. Both are safe **only** once the
wrapped worker is live and this cutover is verified, because until then a
policy-protected read with no tenant session returns nothing.

---

## Rollback

Put the old URL back and redeploy. The role, the grants and the policies are
all additive — nothing needs undoing, because the policies only take effect for
a role that cannot bypass them.

```bash
railway variables --service <name> \
  --set "DATABASE_URL=postgresql://postgres.rkreqfpkxavqpsqexbfs:<old password>@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
```

Keep the old URL somewhere before you start. `railway variables --service <name> --kv`
prints it, and once overwritten it is gone.

## If something looks wrong

The signature of a missing grant is **empty, not broken**. A 500 is probably
something else; a page that renders fine with no rows on it is this.

```sql
-- what kealee_app can reach
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'kealee_app' AND table_name = '<the table that looks empty>';

-- confirm the role really cannot bypass
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'kealee_app';
```

A table added by a migration run *after* the grants were issued is covered by
`ALTER DEFAULT PRIVILEGES`, which is already set — but only for tables created
by `postgres`. A table created by any other role will not inherit it.
