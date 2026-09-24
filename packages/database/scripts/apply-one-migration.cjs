/**
 * Applies ONE migration file by name, and records it.
 *
 * Exists because `reconcile-migrations.cjs` cannot handle a migration that
 * creates no tables, columns, indexes or enums: its object parser finds
 * nothing to check, reports "all 0 objects present", and marks the migration
 * applied WITHOUT running it. That silently no-ops any policy, trigger,
 * function or ALTER-only migration — which is how the RLS migration came to be
 * recorded as applied while doing nothing at all.
 *
 *   DATABASE_URL=<direct url> node scripts/apply-one-migration.cjs <migration_dir_name>
 *
 * Prints the SQL before running it, so the thing being applied is visible
 * rather than taken on trust.
 */
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const name = process.argv[2]
if (!name) {
  console.error('usage: node scripts/apply-one-migration.cjs <migration_dir_name>')
  process.exit(2)
}

const file = path.join(__dirname, '..', 'prisma', 'migrations', name, 'migration.sql')
if (!fs.existsSync(file)) {
  console.error(`No such migration: ${file}`)
  process.exit(2)
}

const sql = fs.readFileSync(file, 'utf8')
const prisma = new PrismaClient()

;(async () => {
  console.log(`--- ${name} ---`)
  console.log(sql.split('\n').filter(l => !l.trim().startsWith('--') && l.trim()).join('\n'))
  console.log('--- applying ---')

  await prisma.$executeRawUnsafe(sql)
  console.log('executed')

  await prisma.$executeRawUnsafe(
    `INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
     VALUES (gen_random_uuid()::text, 'applied-by-apply-one-migration', $1, NOW(), NOW(), 1)
     ON CONFLICT DO NOTHING`, name)
  console.log('recorded in _prisma_migrations')

  await prisma.$disconnect()
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await prisma.$disconnect().catch(() => {})
  process.exit(1)
})
