import { describe, expect, it } from 'vitest'
import { evaluateProfessionalRelease, type ProfessionalReleaseInput } from '../professional-release'

/**
 * Direct tests for the one real hard gate in the whole site-plan pipeline: a plan cannot be
 * submitted to a jurisdiction without a valid, verified, unexpired professional seal. This
 * function was dead code (never called) before this session's work wired it into
 * submitSitePlanToJurisdiction — it had zero test coverage despite being the most
 * safety-critical piece of logic in the pipeline.
 */

const SOURCE_HASH = 'a'.repeat(64)
const SEALED_HASH = 'b'.repeat(64)
const NOW = new Date('2026-07-30T00:00:00Z')

const VALID: ProfessionalReleaseInput = {
  jurisdictionCode: 'US-MD-PRINCE_GEORGES',
  professionalId: 'assignment-1',
  licenseNumber: 'MD-PE-12345',
  licensedJurisdictions: ['US-MD-PRINCE_GEORGES'],
  licenseVerifiedAt: '2026-07-01T00:00:00Z',
  licenseExpiresAt: '2027-01-01T00:00:00Z',
  reviewDecision: 'APPROVED',
  sourceContentHash: SOURCE_HASH,
  sealedContentHash: SEALED_HASH,
  sealControlledByProfessional: true,
  complianceResults: [],
  now: NOW,
}

describe('evaluateProfessionalRelease — the hard seal gate', () => {
  it('allows submission when everything is valid', () => {
    const decision = evaluateProfessionalRelease(VALID)
    expect(decision.allowed).toBe(true)
    expect(decision.blockers).toEqual([])
  })

  it('blocks when there is no professional review at all (PENDING)', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, reviewDecision: 'PENDING', sealControlledByProfessional: false, sealedContentHash: undefined })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Professional review is not approved')
  })

  it('blocks when the license was never verified', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, licenseVerifiedAt: undefined })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Professional license is not verified')
  })

  it('blocks when the license does not cover this jurisdiction', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, licensedJurisdictions: ['US-DC-DC'] })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('License is not verified for the project jurisdiction')
  })

  it('blocks when the license has expired', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, licenseExpiresAt: '2026-01-01T00:00:00Z' })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Professional license is expired')
  })

  it('blocks when the review decision is not APPROVED (REJECTED)', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, reviewDecision: 'REJECTED' })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Professional review is not approved')
  })

  it('blocks when the review decision is not APPROVED (CHANGES_REQUESTED)', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, reviewDecision: 'CHANGES_REQUESTED' })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Professional review is not approved')
  })

  it('blocks when the caller (Kealee) controls the seal instead of the professional', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, sealControlledByProfessional: false })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Professional does not control the signature/seal operation')
  })

  it('blocks when the source content hash is missing or malformed', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, sourceContentHash: 'not-a-hash' })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Source document hash is invalid')
  })

  it('blocks when the sealed content hash is missing', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, sealedContentHash: undefined })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Sealed document hash is invalid')
  })

  it('blocks when the sealed content hash is malformed', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, sealedContentHash: 'not-a-hash' })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Sealed document hash is invalid')
  })

  it('CRITICAL: blocks when the sealed hash equals the source hash — Kealee must never fabricate a seal', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, sealedContentHash: SOURCE_HASH })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Sealed version must be recorded as a distinct immutable artifact')
  })

  it('blocks when any compliance result blocks submission', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, complianceResults: [
      { ruleKey: 'PG_SURVEY_SOURCE', outcome: 'FAIL', requirement: 'x', inputs: {},
        authority: { agency: 'a', title: 't', url: 'u', lastVerifiedDate: 'd' },
        responsibleDiscipline: 'LAND_SURVEYOR', blocksSubmission: true },
    ] })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Compliance blocker remains: PG_SURVEY_SOURCE')
  })

  it('blocks when a compliance result outcome is FAIL/MISSING_DATA/PROFESSIONAL_DETERMINATION_REQUIRED even if blocksSubmission is false', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, complianceResults: [
      { ruleKey: 'PG_ZONING_USE', outcome: 'MISSING_DATA', requirement: 'x', inputs: {},
        authority: { agency: 'a', title: 't', url: 'u', lastVerifiedDate: 'd' },
        responsibleDiscipline: 'LAND_PLANNER', blocksSubmission: false },
    ] })
    expect(decision.allowed).toBe(false)
    expect(decision.blockers).toContain('Compliance blocker remains: PG_ZONING_USE')
  })

  it('allows submission when compliance results are all clean (PASS/NOT_APPLICABLE/WARNING)', () => {
    const decision = evaluateProfessionalRelease({ ...VALID, complianceResults: [
      { ruleKey: 'PG_SURVEY_SOURCE', outcome: 'PASS', requirement: 'x', inputs: {},
        authority: { agency: 'a', title: 't', url: 'u', lastVerifiedDate: 'd' },
        responsibleDiscipline: 'LAND_SURVEYOR', blocksSubmission: false },
      { ruleKey: 'PG_WOODLAND_CONSERVATION', outcome: 'WARNING', requirement: 'x', inputs: {},
        authority: { agency: 'a', title: 't', url: 'u', lastVerifiedDate: 'd' },
        responsibleDiscipline: 'LANDSCAPE_ARCHITECT', blocksSubmission: false },
    ] })
    expect(decision.allowed).toBe(true)
  })

  it('reports every blocker simultaneously, not just the first', () => {
    const decision = evaluateProfessionalRelease({
      ...VALID, licenseVerifiedAt: undefined, reviewDecision: 'PENDING',
      sealControlledByProfessional: false, sealedContentHash: undefined,
    })
    expect(decision.blockers.length).toBeGreaterThanOrEqual(3)
  })

  it('the chain-of-custody echoes the exact hashes and identity used in the decision', () => {
    const decision = evaluateProfessionalRelease(VALID)
    expect(decision.chainOfCustody).toEqual({
      sourceContentHash: SOURCE_HASH, sealedContentHash: SEALED_HASH,
      professionalId: 'assignment-1', licenseNumber: 'MD-PE-12345',
    })
  })
})
