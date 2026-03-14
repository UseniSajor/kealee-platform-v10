/**
 * service-regions.seed.ts
 *
 * Seeds the initial 5 launch regions for the national marketplace rollout.
 * Run with: npx ts-node packages/database/prisma/seeds/service-regions.seed.ts
 * Or call seedServiceRegions() from the main seed.ts file.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const SERVICE_REGIONS = [
  {
    name:                  'Washington DC Metro',
    slug:                  'dc-metro',
    cities:                ['Washington', 'Arlington', 'Alexandria', 'Bethesda', 'Silver Spring', 'Rockville', 'McLean', 'Tysons', 'Fairfax', 'Reston'],
    states:                ['DC', 'MD', 'VA'],
    zipCodes:              [],
    isLaunched:            true,                // First market — go live immediately
    targetContractorCount: 75,
    targetLeadsPerWeek:    30,
    costIndexMultiplier:   1.25,
    timezone:              'America/New_York',
    notes:                 'Primary launch market. High permit-ready lead volume from existing Kealee clients.',
  },
  {
    name:                  'Seattle Metro',
    slug:                  'seattle-metro',
    cities:                ['Seattle', 'Bellevue', 'Kirkland', 'Redmond', 'Tacoma', 'Renton', 'Bothell', 'Issaquah'],
    states:                ['WA'],
    zipCodes:              [],
    isLaunched:            false,
    targetContractorCount: 50,
    targetLeadsPerWeek:    20,
    costIndexMultiplier:   1.20,
    timezone:              'America/Los_Angeles',
    notes:                 'Wave 2 market. Strong tech-sector project owner base.',
  },
  {
    name:                  'Atlanta Metro',
    slug:                  'atlanta-metro',
    cities:                ['Atlanta', 'Sandy Springs', 'Marietta', 'Alpharetta', 'Roswell', 'Smyrna', 'Decatur', 'Dunwoody'],
    states:                ['GA'],
    zipCodes:              [],
    isLaunched:            false,
    targetContractorCount: 50,
    targetLeadsPerWeek:    20,
    costIndexMultiplier:   1.00,
    timezone:              'America/New_York',
    notes:                 'Wave 2 market. Lower cost index creates competitive fee advantage.',
  },
  {
    name:                  'Chicago Metro',
    slug:                  'chicago-metro',
    cities:                ['Chicago', 'Evanston', 'Oak Park', 'Naperville', 'Schaumburg', 'Aurora', 'Joliet', 'Waukegan'],
    states:                ['IL'],
    zipCodes:              [],
    isLaunched:            false,
    targetContractorCount: 60,
    targetLeadsPerWeek:    25,
    costIndexMultiplier:   1.15,
    timezone:              'America/Chicago',
    notes:                 'Wave 3 market. Complex permitting jurisdiction — license verification critical.',
  },
  {
    name:                  'Austin TX',
    slug:                  'austin-tx',
    cities:                ['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville', 'Kyle', 'Buda', 'Leander'],
    states:                ['TX'],
    zipCodes:              [],
    isLaunched:            false,
    targetContractorCount: 40,
    targetLeadsPerWeek:    15,
    costIndexMultiplier:   1.05,
    timezone:              'America/Chicago',
    notes:                 'Wave 3 market. High new-construction rate. ADU ordinance creates lead volume.',
  },
] as const

export async function seedServiceRegions() {
  console.log('🌎 Seeding service regions...')
  let created = 0
  let skipped = 0

  for (const region of SERVICE_REGIONS) {
    const existing = await prisma.serviceRegion.findUnique({ where: { slug: region.slug } })
    if (existing) {
      console.log(`  ↷ skipping ${region.slug} (exists)`)
      skipped++
      continue
    }
    await prisma.serviceRegion.create({ data: region })
    console.log(`  ✓ created ${region.slug}`)
    created++
  }

  console.log(`  → ${created} created, ${skipped} skipped`)
  return { created, skipped }
}

// Stand-alone execution
if (require.main === module) {
  seedServiceRegions()
    .then(r => { console.log('Done:', r); process.exit(0) })
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
