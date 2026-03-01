/**
 * Kealee Government Procurement Sync
 * Fetches open construction contracts from SAM.gov
 * Run on a schedule: pnpm tsx scripts/sync-govt-contracts.ts
 */

// SAM.gov NAICS codes for construction
const CONSTRUCTION_NAICS = [
  '236115', // New Single-Family Housing
  '236116', // New Multifamily Housing
  '236210', // Industrial Building Construction
  '236220', // Commercial Building Construction
  '237110', // Water & Sewer Line Construction
  '237310', // Highway, Street, Bridge Construction
  '237990', // Other Heavy Construction
  '238110', // Poured Concrete Foundation
  '238120', // Structural Steel Erection
  '238160', // Roofing Contractors
  '238210', // Electrical Contractors
  '238220', // Plumbing / HVAC Contractors
  '238310', // Drywall Contractors
  '238910', // Site Preparation Contractors
]

function getDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

async function syncSamGovContracts() {
  const apiKey = process.env.SAM_GOV_API_KEY
  if (!apiKey) {
    console.error('SAM_GOV_API_KEY environment variable is required')
    process.exit(1)
  }

  // Dynamic import to avoid top-level import issues
  const { prisma } = await import('@kealee/database')
  const prismaAny = prisma as any

  console.log('Fetching construction contracts from SAM.gov...')

  const url =
    `https://api.sam.gov/opportunities/v2/search?` +
    `api_key=${apiKey}` +
    `&naicsCode=${CONSTRUCTION_NAICS.join(',')}` +
    `&postedFrom=${getDateDaysAgo(30)}` +
    `&ptype=o` +
    `&limit=100`

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    console.error(`SAM.gov API returned ${response.status}: ${response.statusText}`)
    process.exit(1)
  }

  const data = await response.json()
  const opportunities = data.opportunitiesData ?? []
  let synced = 0

  for (const opp of opportunities) {
    const solNum = opp.solicitationNumber ?? opp.id
    if (!solNum) continue

    try {
      await prismaAny.governmentContract.upsert({
        where: { solicitationNum: solNum },
        create: {
          solicitationNum: solNum,
          title: opp.title ?? 'Untitled',
          agency: opp.organizationHierarchy?.[0]?.name ?? 'Federal',
          agencyLevel: 'federal',
          jurisdiction: 'Federal',
          naicsCode: opp.naicsCode ?? '',
          setAsideType: opp.typeOfSetAside ?? null,
          estimatedValue: opp.award?.amount ?? null,
          issueDate: new Date(opp.postedDate ?? new Date()),
          dueDate: new Date(opp.responseDeadLine ?? opp.archiveDate ?? new Date()),
          status: 'open',
          description: (opp.description ?? '').substring(0, 10000),
          sourceUrl: `https://sam.gov/opp/${opp.noticeId}/view`,
        },
        update: {
          status: opp.active === 'Yes' ? 'open' : 'closed',
          dueDate: new Date(opp.responseDeadLine ?? opp.archiveDate ?? new Date()),
        },
      })
      synced++
    } catch (err) {
      console.warn(`Failed to sync ${solNum}: ${err}`)
    }
  }

  console.log(`Synced ${synced}/${opportunities.length} contracts from SAM.gov`)
  await prismaAny.$disconnect()
}

syncSamGovContracts().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
