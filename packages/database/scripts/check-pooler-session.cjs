/**
 * Does `SET LOCAL` survive on the connection the application actually uses?
 *
 * This matters more than it sounds. RLS reads `current_setting('app.tenant_id')`,
 * and the application connects through Supabase's pooler on port 6543 in
 * TRANSACTION mode — a connection is pinned only for the duration of a
 * transaction and handed to someone else afterwards.
 *
 * If session settings did not survive inside a transaction on that pooler, the
 * entire tenant-session design would be wrong, and the failure would appear as
 * empty query results rather than an error. Worth ten seconds to check instead
 * of discovering it during a cutover.
 *
 *   DATABASE_URL=<pooler url, port 6543> node scripts/check-pooler-session.cjs
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

;(async () => {
  const url = process.env.DATABASE_URL || ''
  const port = (url.match(/:(\d+)\//) || [])[1] || '?'
  console.log(`connected via port ${port} (${port === '6543' ? 'TRANSACTION-mode pooler' : port === '5432' ? 'direct' : 'unknown'})`)

  let pass = 0, fail = 0
  const ok = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)) }

  // Inside a transaction, SET LOCAL must be visible to later statements.
  const inside = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', 'probe-tenant', true)`)
    const r = await tx.$queryRawUnsafe(`SELECT current_setting('app.tenant_id', true) AS t`)
    return r[0].t
  })
  ok(inside === 'probe-tenant', `SET LOCAL is visible to later statements in the same transaction (got ${JSON.stringify(inside)})`)

  // And it must NOT survive the transaction, or one tenant's context would be
  // handed to whoever takes the connection next.
  const after = await prisma.$queryRawUnsafe(`SELECT current_setting('app.tenant_id', true) AS t`)
  ok(!after[0].t, `the setting does NOT leak past the transaction (got ${JSON.stringify(after[0].t)})`)

  console.log(`\n${pass} passed, ${fail} failed`)
  await prisma.$disconnect()
  process.exit(fail ? 1 : 0)
})().catch(async (e) => {
  console.error('ERR', e.message)
  await prisma.$disconnect().catch(() => {})
  process.exit(1)
})
