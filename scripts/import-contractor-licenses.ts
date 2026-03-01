/**
 * Kealee Contractor License Import
 *
 * Imports contractor license data from state bulk CSV exports:
 * - VA DPOR (license.dpor.virginia.gov)
 * - MD DLLR/MHIC (dllr.state.md.us)
 * - DC DLCP (opendata.dc.gov)
 *
 * Usage:
 *   pnpm tsx scripts/import-contractor-licenses.ts --state=VA --file=./data/va-contractors.csv
 */

import { readFileSync } from 'fs'

const VA_COLUMNS = {
  licenseNum: 'LicenseNumber',
  companyName: 'BusinessName',
  licenseType: 'LicenseType',
  licenseClass: 'LicenseClass',
  status: 'LicenseStatus',
  expiresAt: 'ExpirationDate',
  issuedAt: 'IssueDate',
  city: 'City',
  county: null as string | null,
  zip: 'Zip',
  phone: 'Phone',
}

const MD_COLUMNS = {
  licenseNum: 'LicenseNumber',
  companyName: 'BusinessName',
  licenseType: 'LicenseType',
  licenseClass: null as string | null,
  status: 'Status',
  expiresAt: 'ExpirationDate',
  issuedAt: 'IssueDate',
  city: 'City',
  county: 'County',
  zip: 'Zip',
  phone: 'Phone',
}

const DC_COLUMNS = {
  licenseNum: 'LICENSE_NUMBER',
  companyName: 'BUSINESS_NAME',
  licenseType: 'LICENSE_TYPE',
  licenseClass: null as string | null,
  status: 'LICENSE_STATUS',
  expiresAt: 'EXPIRATION_DATE',
  issuedAt: 'ISSUE_DATE',
  city: 'CITY',
  county: null as string | null,
  zip: 'ZIP',
  phone: null as string | null,
}

const COLUMN_MAP: Record<string, typeof VA_COLUMNS> = {
  VA: VA_COLUMNS,
  MD: MD_COLUMNS,
  DC: DC_COLUMNS,
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw || raw.trim() === '') return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function normalizeStatus(raw: string): string {
  const s = raw.toLowerCase().trim()
  if (s.includes('active')) return 'Active'
  if (s.includes('expired')) return 'Expired'
  if (s.includes('suspend')) return 'Suspended'
  if (s.includes('revok')) return 'Revoked'
  if (s.includes('inactive')) return 'Inactive'
  if (s.includes('cancel')) return 'Cancelled'
  return raw.trim()
}

async function importLicenses(state: string, filePath: string) {
  console.log(`Importing ${state} contractor licenses from ${filePath}`)

  const cols = COLUMN_MAP[state]
  if (!cols) throw new Error(`Unknown state: ${state}. Use VA, MD, or DC.`)

  // Dynamic imports
  const { parse } = await import('csv-parse/sync')
  const { prisma } = await import('@kealee/database')
  const prismaAny = prisma as any

  const raw = readFileSync(filePath, 'utf-8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true })

  console.log(`  Found ${rows.length.toLocaleString()} records`)

  let imported = 0
  let skipped = 0
  let errors = 0
  const BATCH = 500

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)

    const records = batch
      .filter((row: any) => row[cols.licenseNum]?.trim())
      .map((row: any) => ({
        state,
        licenseNum: row[cols.licenseNum].trim().toUpperCase(),
        companyName: row[cols.companyName]?.trim() ?? '',
        licenseType: row[cols.licenseType]?.trim() ?? '',
        licenseClass: cols.licenseClass ? row[cols.licenseClass]?.trim() ?? null : null,
        status: normalizeStatus(row[cols.status] ?? ''),
        expiresAt: parseDate(row[cols.expiresAt]),
        issuedAt: parseDate(row[cols.issuedAt]),
        city: row[cols.city]?.trim() ?? null,
        county: cols.county ? row[cols.county]?.trim() ?? null : null,
        zip: row[cols.zip]?.trim() ?? null,
        phone: cols.phone ? row[cols.phone]?.trim() ?? null : null,
        lastSynced: new Date(),
      }))

    try {
      const result = await prismaAny.contractorLicenseRegistry.createMany({
        data: records,
        skipDuplicates: true,
      })
      imported += result.count
      skipped += records.length - result.count
    } catch (err) {
      errors += batch.length
      console.error(`  Batch error at row ${i}:`, err)
    }

    if ((i / BATCH) % 10 === 0) {
      process.stdout.write(
        `  Progress: ${Math.min(i + BATCH, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}\r`
      )
    }
  }

  console.log(`\n  Imported: ${imported.toLocaleString()}`)
  console.log(`  Skipped (duplicates): ${skipped.toLocaleString()}`)
  if (errors > 0) console.log(`  Errors: ${errors.toLocaleString()}`)

  await prismaAny.$disconnect()
}

const args = process.argv.slice(2)
const stateArg = args.find((a) => a.startsWith('--state='))?.split('=')[1]?.toUpperCase()
const fileArg = args.find((a) => a.startsWith('--file='))?.split('=')[1]

if (!stateArg || !fileArg) {
  console.error(
    'Usage: pnpm tsx scripts/import-contractor-licenses.ts --state=VA --file=./data/va-contractors.csv'
  )
  process.exit(1)
}

importLicenses(stateArg, fileArg)
  .then(() => {
    console.log('\nImport complete.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
