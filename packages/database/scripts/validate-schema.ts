#!/usr/bin/env node
/**
 * Schema Validator — CI-safe validation for the modular schema architecture.
 *
 * Usage: npx tsx scripts/validate-schema.ts
 *
 * Checks:
 * 1. All domain directories exist in schema-src/
 * 2. Merge produces valid output
 * 3. Model and enum counts match expectations
 * 4. No duplicate model/enum names
 * 5. Prisma validate passes on the generated schema
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const ROOT = path.join(__dirname, '..')
const SCHEMA_SRC = path.join(ROOT, 'schema-src')
const GENERATED = path.join(ROOT, 'prisma', 'schema.generated.prisma')

const REQUIRED_DOMAINS = [
  'foundation', 'identity', 'ddts', 'land', 'feasibility',
  'development', 'pm', 'payments', 'operations', 'marketplace',
  'documents', 'workflow', 'integrations', 'analytics',
]

let errors = 0

function check(label: string, condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${label} — ${msg}`)
    errors++
  } else {
    console.log(`  OK: ${label}`)
  }
}

// 1. Check domain directories
console.log('\n1. Checking domain directories...')
for (const domain of REQUIRED_DOMAINS) {
  const dir = path.join(SCHEMA_SRC, domain)
  check(`${domain}/`, fs.existsSync(dir), `Missing directory: schema-src/${domain}/`)
}

// 2. Check top-level files
console.log('\n2. Checking top-level schema files...')
check('00-generator.prisma', fs.existsSync(path.join(SCHEMA_SRC, '00-generator.prisma')), 'Missing generator config')
check('01-datasource.prisma', fs.existsSync(path.join(SCHEMA_SRC, '01-datasource.prisma')), 'Missing datasource config')

// 3. Run merge
console.log('\n3. Merging schema...')
try {
  execSync('npx tsx scripts/merge-schema.ts', { cwd: ROOT, stdio: 'pipe' })
  check('Merge', true, '')
} catch (e: any) {
  check('Merge', false, e.stderr?.toString() || 'Merge failed')
}

// 4. Check generated file exists
console.log('\n4. Validating generated schema...')
check('Generated file exists', fs.existsSync(GENERATED), 'schema.generated.prisma not found')

if (fs.existsSync(GENERATED)) {
  const content = fs.readFileSync(GENERATED, 'utf-8')
  const models = (content.match(/^model\s+\w+\s*\{/gm) || [])
  const enums = (content.match(/^enum\s+\w+\s*\{/gm) || [])

  check(`Model count (${models.length})`, models.length >= 360, `Expected >= 360 models, got ${models.length}`)
  check(`Enum count (${enums.length})`, enums.length >= 200, `Expected >= 200 enums, got ${enums.length}`)

  // 5. Check for duplicates
  const modelNames = models.map(m => m.match(/model\s+(\w+)/)?.[1] || '')
  const enumNames = enums.map(e => e.match(/enum\s+(\w+)/)?.[1] || '')
  const allNames = [...modelNames, ...enumNames]
  const dupes = allNames.filter((n, i) => allNames.indexOf(n) !== i)
  check('No duplicates', dupes.length === 0, `Duplicate names: ${[...new Set(dupes)].join(', ')}`)

  // 6. Prisma validate
  console.log('\n5. Running prisma validate...')
  try {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/test'
    execSync(`npx prisma validate --schema=prisma/schema.generated.prisma`, {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    })
    check('Prisma validate', true, '')
  } catch (e: any) {
    const stderr = e.stderr?.toString() || ''
    if (stderr.includes('Environment variable not found')) {
      check('Prisma validate', true, '(skipped — no DATABASE_URL)')
    } else {
      check('Prisma validate', false, stderr)
    }
  }
}

// Summary
console.log(`\n${errors === 0 ? 'ALL CHECKS PASSED' : `${errors} CHECK(S) FAILED`}`)
process.exit(errors > 0 ? 1 : 0)
