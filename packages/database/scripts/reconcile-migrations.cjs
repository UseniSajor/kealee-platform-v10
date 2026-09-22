/**
 * Reconciles the Prisma migration history against a live database WITHOUT
 * replaying SQL that has already run out-of-band.
 *
 * For every local migration the `_prisma_migrations` table does not list, it
 * reads the CREATE TABLE / ADD COLUMN / CREATE INDEX statements in the file
 * and checks each object exists. If every object exists the migration is
 * recorded as applied (`prisma migrate resolve --applied`); if any object is
 * missing it is reported — and applied with `--apply` (the migrations here are
 * additive and idempotent). Nothing destructive is ever executed here.
 *
 *   DATABASE_URL=<direct url> node scripts/reconcile-migrations.cjs [--apply]
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')

const apply = process.argv.includes('--apply')
const dir = path.join(__dirname, '..', 'prisma', 'migrations')
const prisma = new PrismaClient()

function objectsOf(sql) {
  const tables = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"?([A-Za-z_]+)"?/gi)].map(m => m[1])
  const columns = [...sql.matchAll(/ALTER TABLE (?:ONLY )?"?([A-Za-z_]+)"?\s+ADD COLUMN (?:IF NOT EXISTS )?"?([A-Za-z_]+)"?/gi)].map(m => [m[1], m[2]])
  // An index is identified by its table and columns, not its name: a schema that was pushed with
  // `prisma db push` carries Prisma's generated index names, not the migration file's.
  const indexes = [...sql.matchAll(/CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?"?([A-Za-z_]+)"?\s+ON\s+"?([A-Za-z_]+)"?\s*(?:USING \w+\s*)?\(([^)]+)\)/gi)]
    .map(m => ({ name: m[1], table: m[2], columns: m[3].split(',').map(c => c.replace(/"/g, '').trim().split(/\s+/)[0]) }))
  const enums = [...sql.matchAll(/CREATE TYPE "?([A-Za-z_]+)"? AS ENUM/gi)].map(m => m[1])
  return { tables, columns, indexes, enums }
}

async function main() {
  const applied = new Set((await prisma.$queryRawUnsafe(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`)).map(r => r.migration_name))
  const local = fs.readdirSync(dir).filter(d => fs.existsSync(path.join(dir, d, 'migration.sql'))).sort()
  const report = []
  for (const name of local) {
    if (applied.has(name)) continue
    const sql = fs.readFileSync(path.join(dir, name, 'migration.sql'), 'utf8')
    const o = objectsOf(sql)
    const missing = []
    for (const t of o.tables) {
      const r = await prisma.$queryRawUnsafe(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, t)
      if (!r.length) missing.push(`table ${t}`)
    }
    for (const [t, c] of o.columns) {
      const r = await prisma.$queryRawUnsafe(`SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`, t, c)
      if (!r.length) missing.push(`column ${t}.${c}`)
    }
    for (const i of o.indexes) {
      const rows = await prisma.$queryRawUnsafe(`SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=$1`, i.table)
      const want = i.columns.join(',')
      const equivalent = rows.some(r => { const m = /\(([^)]+)\)/.exec(r.indexdef); return m && m[1].split(',').map(c => c.replace(/"/g, '').trim().split(/\s+/)[0]).join(',') === want })
      if (!equivalent) missing.push(`index ${i.name} on ${i.table}(${want})`)
    }
    for (const e of o.enums) {
      const r = await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_type WHERE typname=$1`, e)
      if (!r.length) missing.push(`enum ${e}`)
    }
    const destructive = /^\s*(DROP TABLE|TRUNCATE|DELETE FROM|ALTER COLUMN)/im.test(sql)
    report.push({ name, objects: o.tables.length + o.columns.length + o.indexes.length + o.enums.length, missing, destructive })
  }
  for (const r of report) {
    if (!r.missing.length) {
      console.log(`✔ ${r.name}: all ${r.objects} object(s) present — recording as applied`)
      execSync(`npx prisma migrate resolve --applied ${r.name} --schema=./prisma/schema.prisma`, { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    } else if (apply && !r.destructive) {
      console.log(`▶ ${r.name}: ${r.missing.length} missing (${r.missing.join(', ')}) — applying`)
      execSync(`npx prisma db execute --schema=./prisma/schema.prisma --file ./prisma/migrations/${r.name}/migration.sql`, { stdio: 'inherit', cwd: path.join(__dirname, '..') })
      execSync(`npx prisma migrate resolve --applied ${r.name} --schema=./prisma/schema.prisma`, { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    } else {
      console.log(`✖ ${r.name}: ${r.missing.length} missing${r.destructive ? ' (has destructive statements — not auto-applied)' : ''}: ${r.missing.join(', ')}`)
    }
  }
  const dbOnly = [...applied].filter(n => !local.includes(n))
  if (dbOnly.length) console.log(`ℹ ${dbOnly.length} migration(s) exist in the database but not in the repo (applied out-of-band, contents not recoverable): ${dbOnly.join(', ')}`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
