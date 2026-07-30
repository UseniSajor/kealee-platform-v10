import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '@kealee/database'
import { evaluateJurisdictionRules } from '../rule-engine'
import { princeGeorgesCountyRulePack, type PrinceGeorgesSiteInput } from '../__fixtures__/prince-georges-legacy'
import { PGC_RULES } from '../prince-georges-rule-data'

/**
 * The actual Phase 3 parity proof: evaluateJurisdictionRules queries the LIVE, SEEDED
 * database (not in-memory PGC_RULES data) and must match the legacy hardcoded pack across
 * the same input matrix used in Phase 0. This is what gates deleting the legacy pack.
 */

const JURISDICTION = 'US-MD-PRINCE_GEORGES'
const SEAL_PRESENCE_KEYS = new Set(['PG_PROFESSIONAL_RELEASE', 'PG_SIGNED_SEALED_PLOT_PLAN'])

function evaluateLegacy(input: PrinceGeorgesSiteInput) {
  const out = new Map<string, { outcome: string; blocksSubmission: boolean }>()
  for (const r of princeGeorgesCountyRulePack.evaluate(input)) {
    if (SEAL_PRESENCE_KEYS.has(r.ruleKey)) continue
    out.set(r.ruleKey, { outcome: r.outcome, blocksSubmission: r.blocksSubmission })
  }
  return out
}

async function assertSeedParity(input: PrinceGeorgesSiteInput, label: string) {
  const legacy = evaluateLegacy(input)
  const fromDb = await evaluateJurisdictionRules(JURISDICTION, input.projectType, input as unknown as Record<string, unknown>)
  const fresh = new Map(fromDb.map((r) => [r.ruleKey, { outcome: r.outcome, blocksSubmission: r.blocksSubmission }]))
  expect(fresh.size, `${label}: rule count mismatch (DB may not be seeded)`).toBe(legacy.size)
  for (const [key, expected] of legacy) {
    expect(fresh.get(key), `${label}: missing rule ${key} from DB`).toEqual(expected)
  }
}

describe('DB-seeded US-MD-PRINCE_GEORGES rules match princeGeorgesCountyRulePack (live parity)', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('the DB has exactly the 15 migrated CHECK rows (not more, not fewer)', async () => {
    const rows = await prisma.jurisdictionRuleVersion.findMany({
      where: { jurisdictionCode: JURISDICTION, kind: 'CHECK', supersededAt: null },
    })
    expect(rows.map((r) => r.ruleKey).sort()).toEqual(PGC_RULES.map((r) => r.ruleKey).sort())
  })

  const BASE: PrinceGeorgesSiteInput = {
    projectType: 'NEW_SINGLE_FAMILY',
    landDisturbanceSqFt: 6000,
    earthMovementCubicYards: 150,
    totalDisturbanceAcres: 1.2,
    woodlandClearing: true,
    existingTcp: false,
    floodplainScreenPositive: false,
    wetlandOrStreamScreenPositive: false,
    drivewayOrRightOfWayWork: true,
    lotCount: undefined,
    frontsExistingBuiltStreet: undefined,
    surveyVerified: true,
    professionalApprovalPresent: false,
    woodlandDocumentationPresent: false,
    sedimentControlPlanPresent: false,
    stormwaterConceptPresent: false,
    municipalityResolved: true,
    zoningUseAllowed: true,
    publicWaterSewerAvailable: true,
    wellSepticApprovalPresent: undefined,
    gradeChangeFeet: 2,
    stormDrainPlanRequired: true,
    stormDrainPlanPresent: false,
    signedSealedPlotPlanPresent: false,
    conceptApprovalPresent: false,
    utilityConflictsResolved: false,
  }

  it('a "worst case" input with most checks failing/blocking', () => assertSeedParity(BASE, 'worst-case'))

  it('a clean, all-passing residential infill input', () => assertSeedParity({
    ...BASE,
    projectType: 'RESIDENTIAL_INFILL',
    landDisturbanceSqFt: 1000,
    earthMovementCubicYards: 10,
    totalDisturbanceAcres: 0.1,
    woodlandClearing: false,
    drivewayOrRightOfWayWork: false,
    lotCount: 4,
    frontsExistingBuiltStreet: true,
    sedimentControlPlanPresent: true,
    gradeChangeFeet: 0,
    stormDrainPlanRequired: false,
    utilityConflictsResolved: true,
    conceptApprovalPresent: true,
  }, 'clean-infill'))

  it('a fully missing-data input (nothing resolved yet)', () => assertSeedParity({
    projectType: 'OTHER',
    woodlandClearing: false,
    existingTcp: false,
    floodplainScreenPositive: false,
    wetlandOrStreamScreenPositive: false,
    drivewayOrRightOfWayWork: false,
    surveyVerified: false,
    professionalApprovalPresent: false,
    woodlandDocumentationPresent: false,
    sedimentControlPlanPresent: false,
    stormwaterConceptPresent: false,
    signedSealedPlotPlanPresent: false,
  }, 'all-missing'))
})
