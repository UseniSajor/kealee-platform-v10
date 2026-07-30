import { describe, expect, it } from 'vitest'
import { evaluateRuleVersion, type JurisdictionRuleVersionRow } from '../rule-engine'
import { PGC_RULES, VERIFIED_DATE, type PgcRuleDefinition } from '../prince-georges-rule-data'
import { princeGeorgesCountyRulePack, type PrinceGeorgesSiteInput } from '../__fixtures__/prince-georges-legacy'

/** Not migrated as DSL rows — see rule-engine.ts / prince-georges-rule-data.ts module docs. */
const SEAL_PRESENCE_KEYS = new Set(['PG_PROFESSIONAL_RELEASE', 'PG_SIGNED_SEALED_PLOT_PLAN'])

function toRow(def: PgcRuleDefinition): JurisdictionRuleVersionRow {
  return {
    ruleKey: def.ruleKey,
    kind: 'CHECK',
    requirements: { dslVersion: 1, logic: def.logic },
    agency: def.authority.agency,
    sourceTitle: def.authority.sourceTitle,
    sourceUrl: def.authority.sourceUrl,
    effectiveDate: null,
    lastVerifiedAt: new Date(`${VERIFIED_DATE}T00:00:00Z`),
  }
}

/** Runs every migrated rule against `input` and returns a ruleKey -> {outcome, blocksSubmission} map. */
function evaluateAllNew(input: Record<string, unknown>) {
  const out = new Map<string, { outcome: string; blocksSubmission: boolean }>()
  for (const def of PGC_RULES) {
    const result = evaluateRuleVersion(toRow(def), input)
    out.set(def.ruleKey, { outcome: result.outcome, blocksSubmission: result.blocksSubmission })
  }
  return out
}

/** Runs the legacy hardcoded pack and returns the same shape, excluding seal-presence checks. */
function evaluateAllLegacy(input: PrinceGeorgesSiteInput) {
  const out = new Map<string, { outcome: string; blocksSubmission: boolean }>()
  for (const r of princeGeorgesCountyRulePack.evaluate(input)) {
    if (SEAL_PRESENCE_KEYS.has(r.ruleKey)) continue
    out.set(r.ruleKey, { outcome: r.outcome, blocksSubmission: r.blocksSubmission })
  }
  return out
}

function assertParity(input: PrinceGeorgesSiteInput, label: string) {
  const legacy = evaluateAllLegacy(input)
  const fresh = evaluateAllNew(input as unknown as Record<string, unknown>)
  expect(fresh.size, `${label}: rule count mismatch`).toBe(legacy.size)
  for (const [key, expected] of legacy) {
    expect(fresh.get(key), `${label}: missing rule ${key}`).toBeDefined()
    expect(fresh.get(key), `${label}: ${key} mismatch`).toEqual(expected)
  }
}

// A fully "clean" baseline: everything present, all thresholds unmet or satisfied.
const BASE: PrinceGeorgesSiteInput = {
  projectType: 'NEW_SINGLE_FAMILY',
  landDisturbanceSqFt: 1000,
  earthMovementCubicYards: 10,
  totalDisturbanceAcres: 0.1,
  woodlandClearing: false,
  existingTcp: false,
  floodplainScreenPositive: false,
  wetlandOrStreamScreenPositive: false,
  drivewayOrRightOfWayWork: false,
  lotCount: undefined,
  frontsExistingBuiltStreet: undefined,
  surveyVerified: true,
  professionalApprovalPresent: true,
  woodlandDocumentationPresent: true,
  sedimentControlPlanPresent: true,
  stormwaterConceptPresent: true,
  municipalityResolved: true,
  zoningUseAllowed: true,
  publicWaterSewerAvailable: true,
  wellSepticApprovalPresent: undefined,
  gradeChangeFeet: 0,
  stormDrainPlanRequired: false,
  stormDrainPlanPresent: undefined,
  signedSealedPlotPlanPresent: true,
  conceptApprovalPresent: true,
  utilityConflictsResolved: true,
}

describe('PGC_RULES DSL matches princeGeorgesCountyRulePack (parity oracle)', () => {
  it('all 15 migrated ruleKeys are present and no seal-presence rules leaked in', () => {
    const keys = PGC_RULES.map((r) => r.ruleKey)
    expect(keys).toHaveLength(15)
    expect(new Set(keys).size).toBe(15)
    for (const forbidden of SEAL_PRESENCE_KEYS) expect(keys).not.toContain(forbidden)
  })

  it('clean baseline (mostly PASS/NOT_APPLICABLE)', () => assertParity(BASE, 'baseline'))

  // PG_LAND_DISTURBANCE_5000: missing / >5000 with plan / >5000 without plan / <=5000
  it('land disturbance: missing', () => assertParity({ ...BASE, landDisturbanceSqFt: undefined }, 'disturbance-missing'))
  it('land disturbance: over threshold, plan present', () => assertParity({ ...BASE, landDisturbanceSqFt: 6000, sedimentControlPlanPresent: true }, 'disturbance-pass'))
  it('land disturbance: over threshold, no plan', () => assertParity({ ...BASE, landDisturbanceSqFt: 6000, sedimentControlPlanPresent: false }, 'disturbance-fail'))
  it('land disturbance: under threshold', () => assertParity({ ...BASE, landDisturbanceSqFt: 4000 }, 'disturbance-na'))

  // PG_EARTH_MOVEMENT_100_CY
  it('earth movement: missing', () => assertParity({ ...BASE, earthMovementCubicYards: undefined }, 'earth-missing'))
  it('earth movement: over threshold', () => assertParity({ ...BASE, earthMovementCubicYards: 150 }, 'earth-over'))
  it('earth movement: under threshold', () => assertParity({ ...BASE, earthMovementCubicYards: 50 }, 'earth-under'))

  // MDE_CONSTRUCTION_ONE_ACRE
  it('acres: missing', () => assertParity({ ...BASE, totalDisturbanceAcres: undefined }, 'acres-missing'))
  it('acres: at threshold', () => assertParity({ ...BASE, totalDisturbanceAcres: 1 }, 'acres-at'))
  it('acres: under threshold', () => assertParity({ ...BASE, totalDisturbanceAcres: 0.5 }, 'acres-under'))

  // PG_WOODLAND_CONSERVATION: 4 combinations
  it('woodland: clearing + docs present', () => assertParity({ ...BASE, woodlandClearing: true, woodlandDocumentationPresent: true }, 'woodland-pass'))
  it('woodland: clearing + no docs', () => assertParity({ ...BASE, woodlandClearing: true, woodlandDocumentationPresent: false }, 'woodland-fail'))
  it('woodland: no clearing + existing TCP', () => assertParity({ ...BASE, woodlandClearing: false, existingTcp: true }, 'woodland-warning'))
  it('woodland: no clearing + no TCP', () => assertParity({ ...BASE, woodlandClearing: false, existingTcp: false }, 'woodland-na'))

  // PG_ENVIRONMENTAL_CONSTRAINTS: compound OR, all 4 combinations
  it('environmental: neither positive', () => assertParity({ ...BASE, floodplainScreenPositive: false, wetlandOrStreamScreenPositive: false }, 'env-pass'))
  it('environmental: floodplain only', () => assertParity({ ...BASE, floodplainScreenPositive: true, wetlandOrStreamScreenPositive: false }, 'env-flood'))
  it('environmental: wetland only', () => assertParity({ ...BASE, floodplainScreenPositive: false, wetlandOrStreamScreenPositive: true }, 'env-wetland'))
  it('environmental: both positive', () => assertParity({ ...BASE, floodplainScreenPositive: true, wetlandOrStreamScreenPositive: true }, 'env-both'))

  // PG_DRIVEWAY_RIGHT_OF_WAY
  it('driveway: work reported', () => assertParity({ ...BASE, drivewayOrRightOfWayWork: true }, 'driveway-yes'))
  it('driveway: no work', () => assertParity({ ...BASE, drivewayOrRightOfWayWork: false }, 'driveway-no'))

  // PG_RESIDENTIAL_INFILL: multi-condition eligibility, boundary cases
  it('infill: eligible (3 lots, fronts street)', () => assertParity({ ...BASE, projectType: 'RESIDENTIAL_INFILL', lotCount: 3, frontsExistingBuiltStreet: true }, 'infill-eligible'))
  it('infill: 0 lots (boundary, ineligible)', () => assertParity({ ...BASE, projectType: 'RESIDENTIAL_INFILL', lotCount: 0, frontsExistingBuiltStreet: true }, 'infill-zero'))
  it('infill: 7 lots (over boundary, ineligible)', () => assertParity({ ...BASE, projectType: 'RESIDENTIAL_INFILL', lotCount: 7, frontsExistingBuiltStreet: true }, 'infill-over'))
  it('infill: 6 lots at boundary, eligible', () => assertParity({ ...BASE, projectType: 'RESIDENTIAL_INFILL', lotCount: 6, frontsExistingBuiltStreet: true }, 'infill-six'))
  it('infill: right lot count, wrong project type', () => assertParity({ ...BASE, projectType: 'NEW_SINGLE_FAMILY', lotCount: 3, frontsExistingBuiltStreet: true }, 'infill-wrong-type'))
  it('infill: does not front built street', () => assertParity({ ...BASE, projectType: 'RESIDENTIAL_INFILL', lotCount: 3, frontsExistingBuiltStreet: false }, 'infill-no-front'))
  it('infill: lotCount undefined', () => assertParity({ ...BASE, projectType: 'RESIDENTIAL_INFILL', lotCount: undefined, frontsExistingBuiltStreet: true }, 'infill-undefined-lots'))

  // PG_SURVEY_SOURCE
  it('survey: verified', () => assertParity({ ...BASE, surveyVerified: true }, 'survey-yes'))
  it('survey: not verified', () => assertParity({ ...BASE, surveyVerified: false }, 'survey-no'))

  // PG_MUNICIPALITY_RESOLUTION
  it('municipality: missing', () => assertParity({ ...BASE, municipalityResolved: undefined }, 'muni-missing'))
  it('municipality: resolved', () => assertParity({ ...BASE, municipalityResolved: true }, 'muni-yes'))
  it('municipality: unresolved', () => assertParity({ ...BASE, municipalityResolved: false }, 'muni-no'))

  // PG_ZONING_USE
  it('zoning: missing', () => assertParity({ ...BASE, zoningUseAllowed: undefined }, 'zoning-missing'))
  it('zoning: allowed', () => assertParity({ ...BASE, zoningUseAllowed: true }, 'zoning-yes'))
  it('zoning: not allowed', () => assertParity({ ...BASE, zoningUseAllowed: false }, 'zoning-no'))

  // PG_WATER_SEWER_SERVICE: both-missing / public / well / neither
  it('water-sewer: both missing', () => assertParity({ ...BASE, publicWaterSewerAvailable: undefined, wellSepticApprovalPresent: undefined }, 'water-missing'))
  it('water-sewer: public available', () => assertParity({ ...BASE, publicWaterSewerAvailable: true, wellSepticApprovalPresent: undefined }, 'water-public'))
  it('water-sewer: well/septic approved', () => assertParity({ ...BASE, publicWaterSewerAvailable: undefined, wellSepticApprovalPresent: true }, 'water-well'))
  it('water-sewer: neither resolved (both explicitly false)', () => assertParity({ ...BASE, publicWaterSewerAvailable: false, wellSepticApprovalPresent: false }, 'water-neither'))

  // PG_GRADE_CHANGE: missing / zero / positive / negative
  it('grade change: missing', () => assertParity({ ...BASE, gradeChangeFeet: undefined }, 'grade-missing'))
  it('grade change: zero', () => assertParity({ ...BASE, gradeChangeFeet: 0 }, 'grade-zero'))
  it('grade change: positive', () => assertParity({ ...BASE, gradeChangeFeet: 3 }, 'grade-positive'))
  it('grade change: negative', () => assertParity({ ...BASE, gradeChangeFeet: -3 }, 'grade-negative'))

  // PG_STORM_DRAIN_PLAN: required+present / required+absent / explicitly-not-required / undefined
  it('storm drain: required and present', () => assertParity({ ...BASE, stormDrainPlanRequired: true, stormDrainPlanPresent: true }, 'storm-pass'))
  it('storm drain: required and absent', () => assertParity({ ...BASE, stormDrainPlanRequired: true, stormDrainPlanPresent: false }, 'storm-fail'))
  it('storm drain: explicitly not required', () => assertParity({ ...BASE, stormDrainPlanRequired: false }, 'storm-na'))
  it('storm drain: requirement undefined', () => assertParity({ ...BASE, stormDrainPlanRequired: undefined }, 'storm-missing'))

  // PG_UTILITY_CONFLICTS
  it('utility conflicts: missing', () => assertParity({ ...BASE, utilityConflictsResolved: undefined }, 'utility-missing'))
  it('utility conflicts: resolved', () => assertParity({ ...BASE, utilityConflictsResolved: true }, 'utility-yes'))
  it('utility conflicts: unresolved', () => assertParity({ ...BASE, utilityConflictsResolved: false }, 'utility-no'))

  // PG_CONCEPT_APPROVAL
  it('concept approval: missing', () => assertParity({ ...BASE, conceptApprovalPresent: undefined }, 'concept-missing'))
  it('concept approval: present', () => assertParity({ ...BASE, conceptApprovalPresent: true }, 'concept-yes'))
  it('concept approval: absent', () => assertParity({ ...BASE, conceptApprovalPresent: false }, 'concept-no'))
})
