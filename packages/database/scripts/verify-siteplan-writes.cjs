/**
 * Proves the deployed worker can still write site-plan rows.
 *
 * Reproduces the exact INSERT shape the worker uses — WITHOUT organizationId,
 * because the deployed code does not pass it — and checks the row lands with a
 * sensible owner. Then removes it.
 *
 * This exists because adding `organizationId` as NOT NULL with no default
 * broke exactly these inserts, and the backfill looked like proof that the
 * migration was safe. It was not: backfilling existing rows says nothing about
 * the next INSERT. Run this after any change to the site-plan table contract.
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const PROBE = 'writecheck-probe'

;(async () => {
  let pass = 0, fail = 0
  const ok = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)) }

  // The worker's audit-event insert shape.
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO site_plan_audit_events (id,"workflowId","eventType","entityTable","entityId",summary)
       VALUES ($1,'wf-probe','probe','probe','probe','probe')`, PROBE)
    const r = await prisma.$queryRawUnsafe(
      `SELECT "organizationId" FROM site_plan_audit_events WHERE id=$1`, PROBE)
    ok(r.length === 1, 'audit-event insert without organizationId succeeds')
    const org = r[0]?.organizationId
    const kind = org
      ? await prisma.$queryRawUnsafe(`SELECT "tenantKind" FROM "Org" WHERE id=$1`, org)
      : []
    ok(kind[0]?.tenantKind === 'KEALEE_DIRECT',
       `defaulted owner is the homeowner org (${kind[0]?.tenantKind ?? 'none'})`)
  } catch (e) {
    ok(false, 'audit-event insert failed: ' + e.message.split('\n').find(l => l.includes('ERROR'))?.trim())
  } finally {
    await prisma.$executeRawUnsafe(`DELETE FROM site_plan_audit_events WHERE id=$1`, PROBE).catch(() => {})
  }

  // Every site-plan child must be writable without an explicit owner until the
  // code sets one. A single table left without the default is a latent outage
  // that only fires on whichever order happens to touch it.
  const tables = ['site_plan_sheets','site_plan_stage_executions','site_plan_review_assignments',
    'site_plan_scoped_approvals','site_plan_sheet_revisions','site_plan_evidence',
    'site_plan_audit_events','site_plan_qc_findings','site_plan_checklist_results',
    'site_plan_compliance_results','site_plan_issuance']
  const missing = []
  for (const t of tables) {
    const c = await prisma.$queryRawUnsafe(
      `SELECT column_default FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name='organizationId'`, t)
    if (!c.length || !c[0].column_default) missing.push(t)
  }
  ok(missing.length === 0, `all ${tables.length} site-plan tables have an owner default (${missing.join(', ') || 'none missing'})`)

  const left = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS c FROM site_plan_audit_events WHERE id=$1`, PROBE)
  ok(left[0].c === 0, 'probe row removed')

  console.log(`\n${pass} passed, ${fail} failed`)
  await prisma.$disconnect()
  process.exit(fail ? 1 : 0)
})().catch(async (e) => {
  console.error('ERR', e.message)
  await prisma.$executeRawUnsafe(`DELETE FROM site_plan_audit_events WHERE id='writecheck-probe'`).catch(() => {})
  await prisma.$disconnect().catch(() => {})
  process.exit(1)
})
