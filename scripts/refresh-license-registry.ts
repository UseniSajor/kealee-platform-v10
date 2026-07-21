/**
 * Kealee License Registry Monthly Refresh
 *
 * Downloads fresh bulk exports from state portals and re-imports.
 * MD and DC don't have live APIs — this keeps the registry current.
 *
 * Schedule: Railway cron, 1st of every month at 2am ET
 * Usage: pnpm tsx scripts/refresh-license-registry.ts
 */

import { execSync } from 'child_process'

const DATA_DIR = './data'

// MD DLLR MHIC export URL
const MD_EXPORT_URL = 'https://www.dllr.state.md.us/license/mhic_export.csv'

// DC Open Data contractor license export
const DC_EXPORT_URL = 'https://opendata.dc.gov/datasets/contractor-license.csv'

async function refresh() {
  console.log('Starting monthly license registry refresh...')

  const { prisma } = await import('@kealee/database')
  const prismaAny = prisma as any

  // Download fresh MD export
  console.log('Downloading MD DLLR export...')
  try {
    execSync(`curl -s -o ${DATA_DIR}/md-contractors.csv "${MD_EXPORT_URL}"`)
  } catch {
    console.warn('MD download failed — skipping MD refresh')
  }

  // Download fresh DC export
  console.log('Downloading DC DLCP export...')
  try {
    execSync(`curl -s -o ${DATA_DIR}/dc-contractors.csv "${DC_EXPORT_URL}"`)
  } catch {
    console.warn('DC download failed — skipping DC refresh')
  }

  // Re-import
  try {
    execSync(
      `pnpm tsx scripts/import-contractor-licenses.ts --state=MD --file=${DATA_DIR}/md-contractors.csv`,
      { stdio: 'inherit' }
    )
  } catch {
    console.warn('MD import failed')
  }

  try {
    execSync(
      `pnpm tsx scripts/import-contractor-licenses.ts --state=DC --file=${DATA_DIR}/dc-contractors.csv`,
      { stdio: 'inherit' }
    )
  } catch {
    console.warn('DC import failed')
  }

  // Log sync stats
  const counts = await prismaAny.contractorLicenseRegistry.groupBy({
    by: ['state'],
    _count: { id: true },
  })

  console.log('\nRegistry totals after refresh:')
  counts.forEach((c: any) => console.log(`  ${c.state}: ${c._count.id.toLocaleString()} licenses`))

  // Expire verified accounts where license is now expired
  const updated = await prismaAny.contractorVerification.updateMany({
    where: {
      status: 'verified',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'expired' },
  })

  if (updated.count > 0) {
    console.log(
      `\nMarked ${updated.count} previously-verified accounts as expired (license renewal needed)`
    )
  }

  console.log('\nRefresh complete.')
  await prismaAny.$disconnect()
}

refresh().catch((err) => {
  console.error('Refresh failed:', err)
  process.exit(1)
})
