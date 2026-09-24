# Applying production migrations

**Do not run `prisma migrate deploy` against production.** Read the hazard
below first; it is not hypothetical.

## The hazard

`packages/database/prisma/migrations` holds 44 migrations, and two of them have
**no timestamp prefix**:

```
add_growth_metrics_schema/   (179 lines of DDL)
manual/                      (5 lines)
```

Prisma orders migrations lexicographically by directory name, so both sort
**before** every `2026…` migration. If `_prisma_migrations` does not already
list them, `migrate deploy` will run them — 179 lines of DDL nobody reviewed —
ahead of everything else. There is also a duplicate timestamp pair at
`20260821120000` (`clerk_identity_and_estimate_relation` and
`site_plan_persistence`).

Much of this schema reached production out-of-band via `prisma db push`, so the
migration history and the live schema disagree about what has "run" even where
the objects all exist.

## The correct procedure

`packages/database/scripts/reconcile-migrations.cjs` exists for exactly this and
is non-destructive by construction. For every migration the `_prisma_migrations`
table does not list, it parses the CREATE TABLE / ADD COLUMN / CREATE INDEX /
CREATE TYPE statements and checks each object against `information_schema` and
`pg_indexes`. Objects that already exist are recorded as applied via
`prisma migrate resolve --applied`; only genuinely missing objects are created,
and only with `--apply`. It matches indexes by table and columns rather than by
name, because a `db push` schema carries Prisma's generated index names.

```bash
# 1. Get the DIRECT url (port 5432, not the 6543 pooler — DDL needs a direct
#    connection; the pgBouncer pooler will fail or behave oddly on DDL).
railway variables --service worker --kv | grep '^DIRECT_URL='

# 2. Report only. Changes nothing. Read this output before going further.
cd packages/database
DATABASE_URL="<DIRECT_URL>" node scripts/reconcile-migrations.cjs

# 3. Apply, once the report is understood.
DATABASE_URL="<DIRECT_URL>" node scripts/reconcile-migrations.cjs --apply

# 4. Confirm.
DATABASE_URL="<DIRECT_URL>" npx prisma migrate status --schema=./prisma/schema.prisma
```

Take a Supabase snapshot before step 3 regardless. The script is additive, but a
snapshot costs a minute and the alternative to having one is discovering you
needed it.

## What is pending as of 2026-09-23

`20260923120000_rag_corpus_phase_g` — the retrieval corpus for Phase G:
`rag_documents`, `rag_chunks`, `rag_retrievals`, plus indexes and one foreign
key. All statements are `IF NOT EXISTS` / guarded, so it is idempotent and safe
under either path. Nothing else in this migration is destructive and it drops
nothing.

Until it is applied, `packages/ai/src/rag` still has no tables behind it and
Phase G cannot ingest. Nothing else breaks: no running code queries those
tables yet.

## Nothing in the deploy pipeline runs migrations

`services/worker/railway.json` declares `startCommand: node dist/index.js` and
no release command. Railway auto-deploys application code from a push to
`main`, and **never touches the database**. Schema changes are always a
deliberate, separate, human act. Keep it that way.
