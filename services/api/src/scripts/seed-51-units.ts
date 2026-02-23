/**
 * Seed script: 51-unit multifamily project
 *
 * Usage:
 *   npx tsx src/scripts/seed-51-units.ts <projectId>
 *
 * Or call via API:
 *   POST /multifamily/units/bulk with the payload below
 */

const UNIT_TYPES = ['Studio', '1BR', '2BR', '3BR'] as const
const BUILDINGS = ['Building A', 'Building B', 'Building C'] as const

interface UnitDef {
  unitNumber: string
  building: string
  floor: number
  unitType: string
  sqft: number
}

function generateUnits(): UnitDef[] {
  const units: UnitDef[] = []

  // Building A: 18 units (3 floors x 6 units)
  for (let floor = 1; floor <= 3; floor++) {
    for (let unit = 1; unit <= 6; unit++) {
      const unitNum = `A-${floor}0${unit}`
      const typeIdx = (floor + unit) % UNIT_TYPES.length
      const unitType = UNIT_TYPES[typeIdx]
      const sqft = unitType === 'Studio' ? 450 : unitType === '1BR' ? 650 : unitType === '2BR' ? 900 : 1150
      units.push({ unitNumber: unitNum, building: BUILDINGS[0], floor, unitType, sqft })
    }
  }

  // Building B: 18 units (3 floors x 6 units)
  for (let floor = 1; floor <= 3; floor++) {
    for (let unit = 1; unit <= 6; unit++) {
      const unitNum = `B-${floor}0${unit}`
      const typeIdx = (floor + unit + 1) % UNIT_TYPES.length
      const unitType = UNIT_TYPES[typeIdx]
      const sqft = unitType === 'Studio' ? 450 : unitType === '1BR' ? 650 : unitType === '2BR' ? 900 : 1150
      units.push({ unitNumber: unitNum, building: BUILDINGS[1], floor, unitType, sqft })
    }
  }

  // Building C: 15 units (3 floors x 5 units)
  for (let floor = 1; floor <= 3; floor++) {
    for (let unit = 1; unit <= 5; unit++) {
      const unitNum = `C-${floor}0${unit}`
      const typeIdx = (floor + unit + 2) % UNIT_TYPES.length
      const unitType = UNIT_TYPES[typeIdx]
      const sqft = unitType === 'Studio' ? 450 : unitType === '1BR' ? 650 : unitType === '2BR' ? 900 : 1150
      units.push({ unitNumber: unitNum, building: BUILDINGS[2], floor, unitType, sqft })
    }
  }

  return units // 18 + 18 + 15 = 51 units
}

// ── Direct DB seed (no API server needed) ──

async function seedDirect(projectId: string) {
  // Dynamic import so this file can also be used as a module
  const { prismaAny } = await import('../utils/prisma-helper')

  const project = await prismaAny.project.findUnique({ where: { id: projectId } })
  if (!project) {
    console.error(`Project ${projectId} not found`)
    process.exit(1)
  }

  const units = generateUnits()
  console.log(`Seeding ${units.length} units into project "${project.name}" (${projectId})...`)

  // Create area phases first
  const phases = await Promise.all(
    BUILDINGS.map((building, i) =>
      prismaAny.multifamilyAreaPhase.create({
        data: {
          projectId,
          name: `Phase ${i + 1} - ${building}`,
          description: `Construction phase for ${building}`,
          status: 'NOT_STARTED',
          unitCount: building === 'Building C' ? 15 : 18,
        },
      })
    )
  )

  const phaseMap: Record<string, string> = {}
  for (const phase of phases) {
    const building = phase.name.split(' - ')[1]
    phaseMap[building] = phase.id
  }

  // Bulk create units
  let created = 0
  for (const unit of units) {
    await prismaAny.multifamilyUnit.create({
      data: {
        projectId,
        unitNumber: unit.unitNumber,
        building: unit.building,
        floor: unit.floor,
        unitType: unit.unitType,
        sqft: unit.sqft,
        status: 'PLANNED',
        phaseId: phaseMap[unit.building] ?? null,
      },
    })
    created++
  }

  console.log(`Created ${created} units across ${phases.length} area phases.`)
  console.log('')
  console.log('Unit breakdown:')
  console.log('  Building A: 18 units (Floors 1-3, 6 per floor)')
  console.log('  Building B: 18 units (Floors 1-3, 6 per floor)')
  console.log('  Building C: 15 units (Floors 1-3, 5 per floor)')
  console.log('')
  console.log('Area Phases:')
  for (const phase of phases) {
    console.log(`  ${phase.name} (${phase.id})`)
  }
}

// ── Export for API usage ──

export { generateUnits, BUILDINGS, UNIT_TYPES }

// ── CLI entrypoint ──

if (require.main === module) {
  const projectId = process.argv[2]
  if (!projectId) {
    console.error('Usage: npx tsx src/scripts/seed-51-units.ts <projectId>')
    process.exit(1)
  }

  seedDirect(projectId)
    .then(() => {
      console.log('Seed complete.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
