/**
 * Professional review routing, county checklist and issuance QC.
 *
 * The behaviours that matter: work reaches the discipline licensed to seal it,
 * sign-off does not manufacture missing data, and "ready to submit" is never
 * confused with "the County approved it".
 */

import {
  DISCIPLINES, seedReviewItems, buildReviewMatrix, type ReviewItem,
} from '../review/disciplines'
import { buildCountyChecklist, runIssuanceQc, buildRevisionResponseMatrix } from '../review/checklist'
import { createSiteTwin, addFeatures, addSource } from '../site-plan/site-twin'
import { gisSourceRecord } from '../site-plan/reliability'
import { classifyProject } from '../site-plan/classification'
import type { SheetId } from '../sheets/sheet-template'

const SHEETS: SheetId[] = ['C-000', 'C-100', 'C-200', 'C-400', 'C-500', 'C-600', 'C-700', 'C-900', 'L-100']

function fixture(opts: { certifiedSurvey?: boolean; verticalDatum?: string | null } = {}) {
  const X = 1326382.7, Y = 464763.1
  const ring = { coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][] }
  let t = createSiteTwin({
    siteId: 's', projectId: 'p', organizationId: 'o', address: '4500 Rhode Island Ave',
    jurisdictionCode: 'prince_georges_md', crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    verticalDatum: opts.verticalDatum ?? null,
  })
  t = addSource(t, gisSourceRecord({
    sourceId: 's1', authority: 'M-NCPPC', dataset: 'Zoning layer 59',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
  }))
  if (opts.certifiedSurvey) {
    t = addSource(t, {
      sourceId: 's2', authority: 'Smith Surveying', dataset: 'Boundary and topographic survey',
      retrievedAt: new Date().toISOString(), crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      verticalDatum: 'NAVD88', accuracyClass: 'survey_grade', reliabilityLevel: 2,
    })
  }
  t = { ...t, zoneCode: 'RSF-65' }
  const b = { sourceId: 's1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  return addFeatures(t, [
    { kind: 'Parcel', id: 'pc', parcelId: 'x', ring, areaSqFt: 6500, ...b } as never,
    { kind: 'Building', id: 'bn', existing: false, ring, ...b } as never,
  ])
}

const fullyQuantified = {
  buildingFootprintSqFt: 1596, drivewaySqFt: 700, gradingSqFt: 2600, utilityTrenchesSqFt: 200,
  stormwaterFacilitiesSqFt: 250, stockpilesSqFt: 40, constructionAccessSqFt: 60,
  offsiteWorkSqFt: 0, demolitionSqFt: 0, stagingAreasSqFt: 54,
}

describe('discipline routing', () => {
  it('routes each sheet to the discipline licensed to seal it', () => {
    expect(DISCIPLINES.surveyor.sheets).toContain('C-100')
    expect(DISCIPLINES.professional_engineer.sheets).toContain('C-600')
    expect(DISCIPLINES.landscape_architect.sheets).toContain('L-100')
    // A surveyor must never be routed stormwater design.
    expect(DISCIPLINES.surveyor.sheets).not.toContain('C-600')
    // An engineer must never be routed boundary certification.
    expect(DISCIPLINES.professional_engineer.sheets).not.toContain('C-100')
  })

  it('marks surveyor and engineer as required for submission', () => {
    expect(DISCIPLINES.surveyor.requiredForSubmission).toBe(true)
    expect(DISCIPLINES.professional_engineer.requiredForSubmission).toBe(true)
    expect(DISCIPLINES.land_use_planner.requiredForSubmission).toBe(false)
  })

  it('seeds a review item per sheet and per stated assumption', () => {
    const items = seedReviewItems({
      sheets: SHEETS,
      assumptions: [{ feature: 'Grading', assumption: 'Assumed datum', resolvedBy: 'survey' }],
    })
    expect(items.some(i => i.sheet === 'C-100' && i.discipline === 'surveyor')).toBe(true)
    const assumptionItem = items.find(i => i.subject.startsWith('Confirm assumption'))
    expect(assumptionItem?.discipline).toBe('surveyor')
    expect(assumptionItem?.platformNote).toBe('Assumed datum')
  })
})

describe('review matrix', () => {
  const items = () => seedReviewItems({ sheets: SHEETS, assumptions: [] })

  it('blocks submission while a required discipline is pending', () => {
    const m = buildReviewMatrix(items(), SHEETS)
    expect(m.submissionReady).toBe(false)
    expect(m.blockingDisciplines).toEqual(expect.arrayContaining(['surveyor', 'professional_engineer']))
  })

  it('does not imply jurisdiction approval once signed off', () => {
    const signed: ReviewItem[] = items().map(i => ({ ...i, decision: 'APPROVED' }))
    const m = buildReviewMatrix(signed, SHEETS)
    expect(m.submissionReady).toBe(true)
    expect(m.summary).toMatch(/Jurisdiction approval is separate/i)
  })

  it('a single rejection fails the discipline', () => {
    const list = items()
    list[0] = { ...list[0], decision: 'REJECTED' }
    const m = buildReviewMatrix(list.map(i => (i === list[0] ? i : { ...i, decision: 'APPROVED' })), SHEETS)
    expect(m.rows.find(r => r.discipline === list[0].discipline)?.decision).toBe('REJECTED')
    expect(m.submissionReady).toBe(false)
  })
})

describe('county checklist', () => {
  it('cites a source for every requirement', () => {
    const twin = fixture()
    const cls = classifyProject({ zoneCode: 'RSF-65', disturbance: fullyQuantified, sources: twin.sources })
    const cl = buildCountyChecklist({ twin, applicability: cls, sheets: SHEETS })
    for (const item of cl.items) expect(item.citation.length).toBeGreaterThan(5)
  })

  it('marks the seal as applied by the professional, never the platform', () => {
    const twin = fixture()
    const cls = classifyProject({ zoneCode: 'RSF-65', disturbance: fullyQuantified, sources: twin.sources })
    const seal = buildCountyChecklist({ twin, applicability: cls, sheets: SHEETS })
      .items.find(i => i.code === 'SP-13')
    expect(seal?.evidence).toMatch(/never by the platform/i)
  })

  it('recognises a certified survey when present', () => {
    const cls = (t: ReturnType<typeof fixture>) =>
      classifyProject({ zoneCode: 'RSF-65', disturbance: fullyQuantified, sources: t.sources })
    const without = fixture()
    const withSurvey = fixture({ certifiedSurvey: true })
    expect(buildCountyChecklist({ twin: without, applicability: cls(without), sheets: SHEETS })
      .items.find(i => i.code === 'SP-02')?.status).toBe('outstanding')
    expect(buildCountyChecklist({ twin: withSurvey, applicability: cls(withSurvey), sheets: SHEETS })
      .items.find(i => i.code === 'SP-02')?.status).toBe('provided')
  })
})

describe('issuance quality control', () => {
  const build = (twin: ReturnType<typeof fixture>, signed: boolean, disturbance = fullyQuantified) => {
    const cls = classifyProject({ zoneCode: 'RSF-65', disturbance, sources: twin.sources })
    const items = seedReviewItems({ sheets: SHEETS, assumptions: [] })
      .map(i => ({ ...i, decision: signed ? ('APPROVED' as const) : ('PENDING' as const) }))
    const matrix = buildReviewMatrix(items, SHEETS)
    const checklist = buildCountyChecklist({ twin, applicability: cls, sheets: SHEETS })
    return runIssuanceQc({ twin, applicability: cls, checklist, reviewMatrix: matrix, sheetFrameFailures: 0 })
  }

  it('delivers the plan even with no professional review', () => {
    // Outstanding review is a pending_seal item, never a delivery gate. The
    // platform drafts a complete plan and a human seals it afterwards — a
    // reviewer cannot seal a plan that was never drawn.
    const qc = build(fixture(), false)
    expect(qc.deliverable).toBe(true)
    expect(qc.pendingSeal.map(f => f.code)).toContain('MISSING_PROFESSIONAL_REVIEW')
    // And it is not a DRAWING defect, so it must not appear as blocking.
    expect(qc.blocking.map(f => f.code)).not.toContain('MISSING_PROFESSIONAL_REVIEW')
  })

  it('sign-off does NOT manufacture missing survey data', () => {
    // A PE approving the set cannot conjure a certified survey into existence.
    // The finding stays open — it just no longer withholds the drawing.
    const qc = build(fixture(), true)
    expect(qc.pendingSeal.map(f => f.code)).toContain('MISSING_SURVEY_CERTIFICATION')
    expect(qc.pendingSeal.map(f => f.code)).not.toContain('MISSING_PROFESSIONAL_REVIEW')
    expect(qc.deliverable).toBe(true)
  })

  it('is issuable once data and review are both present', () => {
    const qc = build(fixture({ certifiedSurvey: true, verticalDatum: 'NAVD88' }), true)
    expect(qc.blocking.map(f => f.code)).not.toContain('MISSING_SURVEY_CERTIFICATION')
    expect(qc.issuable).toBe(true)
  })

  it('blocks when limits of disturbance are indeterminate', () => {
    const qc = build(fixture({ certifiedSurvey: true, verticalDatum: 'NAVD88' }), true,
      { buildingFootprintSqFt: 800 } as typeof fullyQuantified)
    expect(qc.blocking.map(f => f.code)).toContain('INCONSISTENT_LIMITS_OF_DISTURBANCE')
  })

  it('every finding carries a remedy', () => {
    for (const f of build(fixture(), false).findings) expect(f.remedy.length).toBeGreaterThan(10)
  })
})

describe('revision response matrix', () => {
  it('tracks addressed versus outstanding County comments', () => {
    const m = buildRevisionResponseMatrix(
      [
        { id: 'c1', reviewer: 'DPIE', comment: 'Show SWM outfall', receivedAt: '2026-08-01' },
        { id: 'c2', reviewer: 'DPIE', comment: 'Dimension the driveway', receivedAt: '2026-08-01' },
      ],
      [{ commentId: 'c1', response: 'Outfall added', sheetsRevised: ['C-600'], modelRevision: 5, status: 'addressed' }],
    )
    expect(m.addressed).toBe(1)
    expect(m.outstanding).toBe(1)
    expect(m.rows[0].response?.sheetsRevised).toContain('C-600')
  })
})
