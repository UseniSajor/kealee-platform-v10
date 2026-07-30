import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '@kealee/database'
import { evaluateJurisdictionRules, assertJurisdictionHasActiveRules } from '../rule-engine'

// Distinct, obviously-throwaway jurisdiction code so this can never collide with real data.
const TEST_JURISDICTION = 'TEST-INTEGRATION-PHASE2-DO-NOT-USE'

describe('evaluateJurisdictionRules / assertJurisdictionHasActiveRules (live DB round-trip)', () => {
  afterAll(async () => {
    await prisma.jurisdictionRuleVersion.deleteMany({ where: { jurisdictionCode: TEST_JURISDICTION } })
    await prisma.$disconnect()
  })

  it('a jurisdiction with zero rules is not automation-ready', async () => {
    await expect(assertJurisdictionHasActiveRules(TEST_JURISDICTION)).rejects.toThrow(/No active compliance rules/)
    expect(await evaluateJurisdictionRules(TEST_JURISDICTION, 'ANY', {})).toEqual([])
  })

  it('round-trips a seeded CHECK row through Prisma and the evaluator', async () => {
    await prisma.jurisdictionRuleVersion.create({
      data: {
        jurisdictionCode: TEST_JURISDICTION,
        agency: 'Test Agency',
        ruleKey: 'TEST_ROUND_TRIP',
        version: 1,
        kind: 'CHECK',
        projectTypes: [],
        permitTypes: [],
        applicability: {},
        requirements: {
          dslVersion: 1,
          logic: {
            type: 'branch',
            if: { op: 'eq', field: 'flag', value: true },
            then: { type: 'leaf', outcome: 'PASS', requirement: 'flag is set', blocksSubmission: false, responsibleDiscipline: 'TEST' },
            else: { type: 'leaf', outcome: 'FAIL', requirement: 'flag is set', blocksSubmission: true, responsibleDiscipline: 'TEST' },
          },
        },
        sourceUrl: 'https://example.com',
        sourceTitle: 'Test source',
        lastVerifiedAt: new Date(),
        confidence: 1,
      },
    })

    await expect(assertJurisdictionHasActiveRules(TEST_JURISDICTION)).resolves.toBeUndefined()

    const passResults = await evaluateJurisdictionRules(TEST_JURISDICTION, 'ANY', { flag: true })
    expect(passResults).toHaveLength(1)
    expect(passResults[0]).toMatchObject({ ruleKey: 'TEST_ROUND_TRIP', outcome: 'PASS', blocksSubmission: false })

    const failResults = await evaluateJurisdictionRules(TEST_JURISDICTION, 'ANY', { flag: false })
    expect(failResults[0]).toMatchObject({ ruleKey: 'TEST_ROUND_TRIP', outcome: 'FAIL', blocksSubmission: true })
  })

  it('a projectTypes-scoped rule is excluded for a non-matching project type', async () => {
    await prisma.jurisdictionRuleVersion.create({
      data: {
        jurisdictionCode: TEST_JURISDICTION,
        agency: 'Test Agency',
        ruleKey: 'TEST_SCOPED',
        version: 1,
        kind: 'CHECK',
        projectTypes: ['SPECIAL_TYPE'],
        permitTypes: [],
        applicability: {},
        requirements: { dslVersion: 1, logic: { type: 'leaf', outcome: 'PASS', requirement: 'n/a', blocksSubmission: false, responsibleDiscipline: 'TEST' } },
        sourceUrl: 'https://example.com',
        sourceTitle: 'Test source',
        lastVerifiedAt: new Date(),
        confidence: 1,
      },
    })

    const forOtherType = await evaluateJurisdictionRules(TEST_JURISDICTION, 'OTHER_TYPE', {})
    expect(forOtherType.map((r) => r.ruleKey)).not.toContain('TEST_SCOPED')

    const forSpecialType = await evaluateJurisdictionRules(TEST_JURISDICTION, 'SPECIAL_TYPE', {})
    expect(forSpecialType.map((r) => r.ruleKey)).toContain('TEST_SCOPED')
  })

  it('a superseded rule is excluded', async () => {
    await prisma.jurisdictionRuleVersion.create({
      data: {
        jurisdictionCode: TEST_JURISDICTION,
        agency: 'Test Agency',
        ruleKey: 'TEST_SUPERSEDED',
        version: 1,
        kind: 'CHECK',
        projectTypes: [],
        permitTypes: [],
        applicability: {},
        requirements: { dslVersion: 1, logic: { type: 'leaf', outcome: 'PASS', requirement: 'n/a', blocksSubmission: false, responsibleDiscipline: 'TEST' } },
        sourceUrl: 'https://example.com',
        sourceTitle: 'Test source',
        lastVerifiedAt: new Date(),
        supersededAt: new Date(),
        confidence: 1,
      },
    })

    const results = await evaluateJurisdictionRules(TEST_JURISDICTION, 'ANY', {})
    expect(results.map((r) => r.ruleKey)).not.toContain('TEST_SUPERSEDED')
  })

  it('a SOURCE_REGISTRY-kind row is never evaluated (only CHECK rows are)', async () => {
    await prisma.jurisdictionRuleVersion.create({
      data: {
        jurisdictionCode: TEST_JURISDICTION,
        agency: 'Test Agency',
        ruleKey: 'OFFICIAL_SOURCE_REGISTRY',
        version: 99,
        kind: 'SOURCE_REGISTRY',
        projectTypes: [],
        permitTypes: [],
        applicability: {},
        requirements: { automationMode: 'SOURCE_LOOKUP_REQUIRED' },
        sourceUrl: 'https://example.com',
        sourceTitle: 'Test source',
        lastVerifiedAt: new Date(),
        confidence: 1,
      },
    })

    const results = await evaluateJurisdictionRules(TEST_JURISDICTION, 'ANY', {})
    expect(results.map((r) => r.ruleKey)).not.toContain('OFFICIAL_SOURCE_REGISTRY')
  })
})
