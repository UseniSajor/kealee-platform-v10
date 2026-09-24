/**
 * The survey route. Before this existed, `reconcileSurvey` was called with
 * `surveyPoints: []` hardcoded, so every point-level check in the
 * reconciliation report was dead code and a supplied survey went nowhere.
 */
import { describe, it, expect } from 'vitest'
import { ingestSuppliedSurvey, absentFromSurvey, type SuppliedSurvey } from '../workflow/survey-intake'

const CSV = [
  'P,N,E,Z,DESC',
  '1,440150.12,1340350.44,210.35,IPF',
  '2,440150.90,1340410.22,210.812,IPF',
  '3,440215.10,1340410.60,213.44,IPF',
  '4,440215.00,1340350.10,213.02,IPF',
  '10,440180.00,1340380.00,211.90,BM',
  '20,440175.00,1340375.00,211.55,SPOT',
  '21,440185.00,1340385.00,212.10,SPOT',
  '30,440190.00,1340390.00,212.60,BLDG',
].join('\n')

function survey(over: Partial<SuppliedSurvey> = {}): SuppliedSurvey {
  return {
    format: 'csv', content: CSV, filename: 'lot.csv',
    verticalDatum: 'NAVD88', horizontalDatum: 'NAD83',
    unit: 'usSurveyFoot',
    surveyor: { name: 'A Surveyor', licenceNumber: 'MD-12345', licenceState: 'MD' } as never,
    surveyedOn: '2026-09-01', sealed: true,
    ...over,
  }
}

describe('no survey supplied', () => {
  it('says the elevations are not established rather than staying silent', async () => {
    const r = await ingestSuppliedSurvey(null)
    expect(r.supplied).toBe(false)
    expect(r.pointCount).toBe(0)
    expect(r.summary).toMatch(/not established/)
    expect(r.summary).toMatch(/Level 1/)
  })
})

describe('a supplied CSV survey', () => {
  it('parses the points and reaches the workflow', async () => {
    const r = await ingestSuppliedSurvey(survey())
    expect(r.supplied).toBe(true)
    expect(r.pointCount).toBe(8)
    expect(r.points.length).toBe(8)
  })

  it('classifies what the survey establishes', async () => {
    const r = await ingestSuppliedSurvey(survey())
    expect(r.classes.boundary_monument).toBe(4)
    expect(r.classes.benchmark).toBe(1)
    expect(r.classes.spot_elevation).toBe(2)
    expect(r.classes.building_corner).toBe(1)
  })

  it('carries the surveyor and the datum through', async () => {
    const r = await ingestSuppliedSurvey(survey())
    expect(r.verticalDatum).toBe('NAVD88')
    expect(r.surveyor?.name).toBe('A Surveyor')
    expect(r.sealed).toBe(true)
  })

  it('warns when elevations arrive with NO stated vertical datum', async () => {
    // Guessing NAVD88 because the county uses it would put every proposed
    // grade out by about a foot if the survey were NGVD29.
    const r = await ingestSuppliedSurvey(survey({ verticalDatum: null }))
    expect(r.warnings.join(' ')).toMatch(/states no vertical datum/)
    expect(r.warnings.join(' ')).toMatch(/Not assumed/)
  })
})

describe('what a survey does NOT establish', () => {
  it('names the gaps rather than omitting them', async () => {
    // Omission reads as "not required". Naming reads as "someone must go and
    // get this", which is the truth.
    const r = await ingestSuppliedSurvey(survey())
    // This survey HAS monuments, a benchmark, spots and a building corner,
    // so the only gap left is utilities.
    expect(r.absent.join(' ')).toMatch(/utilities/i)
    expect(r.absent.join(' ')).toMatch(/Quality Level D/)
  })

  it('reports a missing benchmark as blocking the use of elevations', () => {
    const gaps = absentFromSurvey({ spot_elevation: 3, boundary_monument: 4, building_corner: 1, utility_structure: 1 })
    expect(gaps.join(' ')).toMatch(/benchmark/i)
    expect(gaps.join(' ')).toMatch(/must not be combined with county contours/)
  })

  it('cites the section that requires spot elevations', () => {
    const gaps = absentFromSurvey({})
    expect(gaps.join(' ')).toMatch(/32-130\(a\)\(9\)/)
  })
})

describe('a format the workflow cannot read yet', () => {
  it('reports it instead of silently behaving as though no survey exists', async () => {
    // Those are different facts, and the second one loses a file the customer
    // paid a surveyor for.
    const r = await ingestSuppliedSurvey(survey({ format: 'landxml' }))
    expect(r.supplied).toBe(true)
    expect(r.format).toBe('landxml')
    expect(r.warnings.join(' ')).toMatch(/only CSV is wired/)
    expect(r.warnings.join(' ')).toMatch(/NOT been silently ignored/)
  })
})

describe('an unreadable file', () => {
  it('flags it for a person rather than pretending there was no survey', async () => {
    const r = await ingestSuppliedSurvey(survey({ content: 'not,a,survey\nx' }))
    expect(r.supplied).toBe(true)
    const text = r.summary + ' ' + r.warnings.join(' ')
    expect(text).toMatch(/no usable points|could not be (read|parsed)/)
    // And it must never read as "there was no survey".
    expect(text).toMatch(/NOT been discarded|flagged for a person/)
  })
})
