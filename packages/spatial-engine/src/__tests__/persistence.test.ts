/**
 * Persistence of the site-plan engine's durable record.
 *
 * What is tested is not "does it write rows" but the properties that make the
 * record trustworthy: an ingestion that is retried converges instead of
 * duplicating, a cleared QC block names the evidence that cleared it, the
 * audit stream is append-only and complete, and no status is upgraded by
 * persistence that the engine itself refused to grant.
 */

import {
  InMemorySitePlanStore, persistIngestionCycle, type ChecklistResultRow,
} from '../persistence/store'
import {
  surveyImportRow, surveyPointRows, reconciliationRows, qcFindingRows,
  issuanceRow, ENGINE_VERSION,
} from '../persistence/records'
import {
  buildPgRulePack, summarisePgRulePack, persistPgRulePack, PG_JURISDICTION_CODE,
} from '../persistence/rule-pack'
import { parseSurveyCsv } from '../survey/parse-csv'
import { reconcileSurvey } from '../survey/reconcile'
import { evaluatePromotion, planRegeneration } from '../survey/promotion'
import { applyEvidenceGate, type EvidenceLedger, type EvidenceItem } from '../review/evidence'
import type { ScopedApproval } from '../review/content-scope'
import { createSiteTwin, addFeatures, addSource } from '../site-plan/site-twin'
import { gisSourceRecord } from '../site-plan/reliability'
import { composeSheets, blocksFromFeatures } from '../sheets/composer'
import type { SheetId, SheetStatus } from '../sheets/sheet-template'

const X = 1326382.7, Y = 464763.1
const MD_SURVEYOR = { name: 'A. Reyes', licenceNumber: '21456', state: 'MD', licenceVerifiedAt: '2026-08-01' }
const REVIEWED_SEAL = { sealed: true, evidence: 'document_reviewed' as const }

const CSV = [
  'Point,Northing,Easting,Elevation,Description',
  `1,${Y},${X},112.40,IPF`,
  `2,${Y},${X + 65},112.10,IPF`,
  `3,${Y + 100},${X + 65},113.80,IPF`,
  `10,${Y + 20},${X + 20},112.55,BM TBM#1`,
].join('\n')

function twin(verticalDatum: string | null = 'NAVD88') {
  const ring = {
    coordinates: [[X + 4, Y + 1], [X + 69, Y + 1], [X + 69, Y + 101], [X + 4, Y + 101], [X + 4, Y + 1]] as [number, number][],
  }
  let t = createSiteTwin({
    siteId: 's', projectId: 'p', organizationId: 'org1',
    address: '4500 Rhode Island Ave', jurisdictionCode: PG_JURISDICTION_CODE,
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum,
  })
  t = addSource(t, gisSourceRecord({
    sourceId: 'gis1', authority: 'M-NCPPC', dataset: 'PGAtlas parcels',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
  }))
  const b = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  return addFeatures(t, [
    { kind: 'Parcel', id: 'gis-parcel', parcelId: '17-2345678', ring, areaSqFt: 6500, ...b } as never,
    { kind: 'Setback', id: 'sb1', side: 'front', distanceFt: 25, citation: '§27-4202', ring, ...b } as never,
  ])
}

const FULL_EVIDENCE: EvidenceItem[] = [
  { id: 'ev-cert', kind: 'certified_survey_file', reference: 'lot12-sealed.pdf', attachedAt: '2026-08-20T12:00:00Z', attachedBy: 'ops' },
  { id: 'ev-lic', kind: 'surveyor_licence_verification', reference: 'MD register lookup', attachedAt: '2026-08-20T12:00:00Z', attachedBy: 'ops' },
  { id: 'ev-seal', kind: 'seal_document_review', reference: 'Seal reviewed on page 1', attachedAt: '2026-08-20T12:00:00Z', attachedBy: 'T. Chamberlain' },
  { id: 'ev-bm', kind: 'benchmark_record', reference: 'TBM#1 elev 112.55 NAVD88', attachedAt: '2026-08-20T12:00:00Z', attachedBy: 'ops' },
  { id: 'ev-vd', kind: 'vertical_datum_statement', reference: 'NAVD88 on the sealed survey', attachedAt: '2026-08-20T12:00:00Z', attachedBy: 'ops' },
  { id: 'ev-unit', kind: 'unit_check', reference: 'US survey feet confirmed', attachedAt: '2026-08-20T12:00:00Z', attachedBy: 'ops' },
]

const APPROVED: ScopedApproval[] = [
  {
    id: 'apr-1', discipline: 'surveyor', subject: 'boundary_determination',
    appearsOn: ['C-100'], objectIds: ['p1'], decision: 'APPROVED',
    decidedBy: 'A. Reyes', licenceNumber: '21456', decidedAt: '2026-08-20T13:00:00Z',
  },
  {
    id: 'apr-2', discipline: 'professional_engineer', subject: 'zoning_compliance',
    appearsOn: ['C-200'], objectIds: ['sb1'], decision: 'PENDING',
  },
]

const CURRENT_SHEETS: { sheet: SheetId; status: SheetStatus; revisions: never[] }[] = [
  { sheet: 'C-000', status: 'PRELIMINARY', revisions: [] },
  { sheet: 'C-100', status: 'PRELIMINARY', revisions: [] },
  { sheet: 'C-200', status: 'PRELIMINARY', revisions: [] },
]

async function buildCycle(opts: { evidence?: EvidenceItem[]; approvals?: ScopedApproval[] } = {}) {
  const t = twin()
  const csv = await parseSurveyCsv(CSV, {
    originalFilename: 'lot12-boundary.csv',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: 'NAVD88',
    coordinateUnit: 'usSurveyFoot', surveyDate: '2026-03-14',
    surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL,
  })
  const surveyBoundary = {
    coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][],
  }
  const discrepancies = reconcileSurvey({
    surveyPoints: csv.points, twin: t, surveyBoundary, coordinateUnit: 'usSurveyFoot',
    surveyVerticalDatum: 'NAVD88', gisVerticalDatum: 'NAVD88',
  })
  const promotion = evaluatePromotion({
    record: csv.record, discrepancies, scope: ['Parcel', 'BoundarySegment'],
  })
  const ledger: EvidenceLedger = { items: opts.evidence ?? FULL_EVIDENCE }
  const approvals = opts.approvals ?? APPROVED
  const gatedQc = applyEvidenceGate(
    {
      findings: [
        { code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking', message: 'No certified survey on file.', remedy: 'Obtain a certified survey.' },
        { code: 'MISSING_EASEMENT', severity: 'warning', message: 'No easements recorded.', remedy: 'Confirm against title.' },
      ],
      blocking: [{ code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking', message: 'No certified survey on file.', remedy: 'Obtain a certified survey.' }],
      pendingSeal: [], deliverable: true as const, issuable: false,
      summary: '',
    },
    { twin: t, ledger, imports: [csv.record], promotions: [promotion], approvals },
  )
  const composition = composeSheets({ blocks: blocksFromFeatures(t.features) })
  const plan = planRegeneration({
    changedKinds: ['Parcel', 'BoundarySegment'],
    currentSheets: CURRENT_SHEETS,
    newGoverningLevel: 2, previousGoverningLevel: 1,
    description: 'Certified survey applied.', by: 'engine', date: '2026-08-21',
  })

  return { t, csv, discrepancies, promotion, gatedQc, composition, plan, approvals, ledger }
}

async function persistOnce(store: InMemorySitePlanStore, opts: Parameters<typeof buildCycle>[0] = {}) {
  const c = await buildCycle(opts)
  return persistIngestionCycle(store, {
    organizationId: 'org1',
    workflowId: 'wf1',
    projectId: 'p',
    siteId: 's',
    actorId: 'user-1',
    record: c.csv.record,
    points: c.csv.points,
    discrepancies: c.discrepancies,
    reconciliationRunId: 'recon-1',
    twinRevision: c.t.revision,
    comparisonSources: ['PGAtlas parcels', 'county contours'],
    promotion: c.promotion,
    evidence: c.ledger.items,
    approvals: c.approvals,
    checklist: [
      { workflowId: 'wf1', itemKey: 'dpie.boundary_survey', label: 'Boundary survey', citation: 'DPIE checklist', ruleVersionId: null, status: 'SATISFIED', detail: null, evidenceId: 'ev-cert', notApplicableReason: null },
      { workflowId: 'wf1', itemKey: 'dpie.swm_concept', label: 'SWM concept', citation: 'DPIE checklist', ruleVersionId: null, status: 'OUTSTANDING', detail: null, evidenceId: null, notApplicableReason: null },
    ] satisfies ChecklistResultRow[],
    gatedQc: c.gatedQc,
    qcRunId: 'qc-1',
    governingLevel: 1,
    disclosure: null,
    sheets: c.composition.sheets.map((composed, i) => ({
      id: `sheet-${i + 1}`, composed, status: 'FOR_REVIEW',
    })),
    regeneration: {
      plan: c.plan,
      comparison: {
        from: { twinRevision: 1, governingLevel: 1 },
        to: { twinRevision: 2, governingLevel: 2 },
        changes: [{ subject: 'Lot area', before: '6500 sq ft', after: '6500 sq ft', delta: '0', consequence: 'none' }],
        supersededObjectIds: ['gis-parcel'],
        summary: 'test',
      },
      sheetIdFor: (sheet: string) => (sheet === 'C-100' ? 'sheet-1' : null),
      statusBefore: { 'C-100': 'PRELIMINARY' },
    },
    compositionRationale: c.composition.rationale,
  })
}

// ── Rule pack ───────────────────────────────────────────────────────────────

describe('PG rule pack persistence', () => {
  it('every rule is traceable to a source URL and a section or registry', () => {
    const rows = buildPgRulePack()
    expect(rows.length).toBeGreaterThan(20)
    const s = summarisePgRulePack(rows)
    expect(s.untraceable).toEqual([])
    expect(s.jurisdictionCode).toBe(PG_JURISDICTION_CODE)
  })

  it('flags machine-extracted standards as requiring human review', () => {
    const rows = buildPgRulePack()
    const dimensional = rows.filter(
      r => r.ruleKey.startsWith('zoning.dimensional.') && r.ruleKey !== 'zoning.dimensional.absent',
    )
    expect(dimensional.length).toBeGreaterThan(25)
    expect(dimensional.every(r => r.humanReviewRequired)).toBe(true)
    expect(dimensional.every(r => r.confidence < 1)).toBe(true)
  })

  it('records the absence of a dimensional table as a rule, not as silence', () => {
    const rows = buildPgRulePack()
    const absent = rows.find(r => r.ruleKey === 'zoning.dimensional.absent')
    expect(absent).toBeDefined()
    const payload = absent!.payload as { zones: string[]; reason: string }
    expect(payload.zones.length).toBeGreaterThan(0)
    expect(payload.reason).toMatch(/absence of a standard, not an absence of a requirement/i)
  })

  it('records tree canopy at low confidence because Table 1 could not be retrieved', () => {
    const canopy = buildPgRulePack().find(r => r.ruleKey === 'landscape.tree_canopy')
    expect(canopy?.humanReviewRequired).toBe(true)
    expect(canopy!.confidence).toBeLessThan(0.5)
  })

  it('carries the 2022 effective date on the zoning rules', () => {
    const rows = buildPgRulePack()
    const zoning = rows.filter(r => r.ruleKey.startsWith('zoning.'))
    expect(zoning.every(r => r.effectiveDate === '2022-04-01')).toBe(true)
  })

  it('stamps lastVerifiedAt per rule when one is supplied', async () => {
    const store = new InMemorySitePlanStore()
    const summary = await persistPgRulePack(store, { verifiedAt: '2026-08-21T00:00:00Z' })
    expect(summary.ruleCount).toBe(store.ruleVersions.length)
    expect(store.ruleVersions.every(r => r.lastVerifiedAt === '2026-08-21T00:00:00Z')).toBe(true)
  })

  it('is idempotent — writing twice does not duplicate', async () => {
    const store = new InMemorySitePlanStore()
    await persistPgRulePack(store)
    const first = store.ruleVersions.length
    await persistPgRulePack(store)
    expect(store.ruleVersions).toHaveLength(first)
  })
})

// ── Ingestion cycle ─────────────────────────────────────────────────────────

describe('ingestion cycle persistence', () => {
  it('writes the import, points, reconciliation, evidence, QC, sheets and audit in one pass', async () => {
    const store = new InMemorySitePlanStore()
    const result = await persistOnce(store)

    expect(store.imports).toHaveLength(1)
    expect(store.points.length).toBe(4)
    expect(store.runs).toHaveLength(1)
    expect(store.discrepancies.length).toBe(result.discrepanciesWritten)
    expect(store.evidence).toHaveLength(6)
    expect(store.approvals).toHaveLength(2)
    expect(store.checklist).toHaveLength(2)
    expect(store.qcFindings.length).toBe(result.qcFindingsWritten)
    expect(store.sheets.length).toBe(result.sheetsWritten)
    expect(store.issuance).toHaveLength(1)
    expect(store.audit.length).toBe(result.auditEventsWritten)
  })

  it('preserves every provenance field on the import row', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const row = store.imports[0]

    expect(row.originalFilename).toBe('lot12-boundary.csv')
    expect(row.checksum).toMatch(/^[0-9a-f]{16,}$/)
    expect(row.format).toBe('CSV')
    expect(row.surveyDate).toBe('2026-03-14')
    expect(row.surveyorLicenceNumber).toBe('21456')
    expect(row.surveyorLicenceState).toBe('MD')
    expect(row.sealEvidence).toBe('DOCUMENT_REVIEWED')
    expect(row.crs).toBe('EPSG:2248')
    expect(row.candidateCrs).toBeNull()
    expect(row.horizontalDatum).toBe('NAD83')
    expect(row.verticalDatum).toBe('NAVD88')
    expect(row.coordinateUnit).toBe('usSurveyFoot')
    expect(row.parserVersion).toMatch(/kealee-survey/)
    expect(row.verificationStatus).toBe('PROFESSIONALLY_CERTIFIED')
  })

  it('keeps candidateCrs distinct from crs and audits the distinction', async () => {
    const store = new InMemorySitePlanStore()
    const unconfirmed = await parseSurveyCsv(CSV, { originalFilename: 'unknown-crs.csv' })
    const row = surveyImportRow(unconfirmed.record, { organizationId: 'org1' })
    expect(row.crs).toBeNull()
    expect(row.candidateCrs).toBe('EPSG:2248')
    expect(row.verificationStatus).toBe('CANDIDATE_CRS_PENDING_CONFIRMATION')

    await persistIngestionCycle(store, {
      organizationId: 'org1', workflowId: 'wf2',
      record: unconfirmed.record, points: unconfirmed.points,
      discrepancies: reconcileSurvey({ surveyPoints: [], twin: twin(), coordinateUnit: 'usSurveyFoot' }),
      reconciliationRunId: 'recon-2', twinRevision: 1, comparisonSources: [],
      gatedQc: { findings: [], blocking: [], pendingSeal: [], deliverable: true as const, issuable: true, summary: '', clearedByEvidence: [], unclearedEvaluations: [] },
      qcRunId: 'qc-2', governingLevel: 1, disclosure: null,
    })
    const audit = store.audit.find(a => a.eventType === 'survey.crs_unconfirmed')
    expect(audit?.summary).toMatch(/candidate only/i)
  })

  it('is idempotent on the natural key — a retried ingestion converges', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const importsAfterFirst = store.imports.length
    const pointsAfterFirst = store.points.length
    const sheetsAfterFirst = store.sheets.length

    await persistOnce(store)

    expect(store.imports).toHaveLength(importsAfterFirst)
    expect(store.points).toHaveLength(pointsAfterFirst)
    expect(store.sheets).toHaveLength(sheetsAfterFirst)
    expect(store.approvals).toHaveLength(2)
    expect(store.checklist).toHaveLength(2)
    expect(store.issuance).toHaveLength(1)
    // The QC run is a snapshot, so re-running the same run id replaces it.
    expect(store.qcFindings.filter(f => f.runId === 'qc-1' && f.code === 'MISSING_EASEMENT')).toHaveLength(1)
  })

  it('persists the reconciliation run with its tolerances and the no-alteration guarantee', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const run = store.runs[0]
    expect(run.geometryAltered).toBe(false)
    expect(run.tolerances.boundaryDisplacementFt).toBeGreaterThan(0)
    expect(run.comparisonSources).toContain('PGAtlas parcels')
    expect(run.engineVersion).toBe(ENGINE_VERSION)
    expect(run.summary).toMatch(/NOT moved, rotated, scaled or rubber-sheeted/i)
  })

  it('maps discrepancy locations so a finding can be drawn on the sheet', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const displaced = store.discrepancies.find(d => d.code === 'BOUNDARY_DISPLACEMENT')
    expect(displaced?.severity).toBe('WARNING')
    expect(displaced?.status).toBe('OPEN')
    expect(displaced?.locationNorthing).toBeGreaterThan(400_000)
  })
})

// ── Evidence-gated QC persistence ───────────────────────────────────────────

describe('QC findings record what cleared them', () => {
  it('a cleared block is stored with the evidence id, not silently omitted', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const cleared = store.qcFindings.find(f => f.code === 'MISSING_SURVEY_CERTIFICATION' && f.status === 'CLEARED_BY_EVIDENCE')
    expect(cleared).toBeDefined()
    expect(cleared?.clearedByEvidenceId).toBe('ev-seal')
    expect(cleared?.clearedAt).toBeTruthy()
  })

  it('an uncleared block stores exactly what is outstanding', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store, { evidence: [] })
    const open = store.qcFindings.find(f => f.code === 'MISSING_SURVEY_CERTIFICATION' && f.status === 'OPEN')
    expect(open).toBeDefined()
    expect(open!.outstanding.length).toBeGreaterThan(0)
    expect(open?.retainedLevelExplanation).toBeTruthy()
    expect(open?.clearedByEvidenceId).toBeNull()
  })

  it('approval without evidence does not produce a cleared row', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store, { evidence: [] })
    expect(store.qcFindings.some(f => f.status === 'CLEARED_BY_EVIDENCE')).toBe(false)
    expect(store.issuance[0].issuable).toBe(false)
    expect(store.issuance[0].status).toBe('PRELIMINARY')
  })

  it('never records PERMIT_SET from QC alone', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    expect(store.issuance[0].issuable).toBe(true)
    expect(store.issuance[0].status).toBe('FOR_REVIEW')
    const audit = store.audit.find(a => a.eventType === 'issuance.updated')
    expect(audit?.summary).toMatch(/PERMIT_SET is never set from QC alone/i)
  })

  it('issuanceRow honours an explicit status without inventing one', () => {
    const row = issuanceRow({
      workflowId: 'wf1',
      gated: { findings: [], blocking: [], pendingSeal: [], deliverable: true as const, issuable: true, summary: '', clearedByEvidence: [], unclearedEvaluations: [] },
      governingLevel: 2, disclosure: null, qcRunId: 'qc-1', sheetCount: 2,
      status: 'PERMIT_SET',
    })
    expect(row.status).toBe('PERMIT_SET')
  })
})

// ── Audit ───────────────────────────────────────────────────────────────────

describe('audit history', () => {
  it('covers every stage of the cycle', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const types = store.audit.map(a => a.eventType)
    for (const expected of [
      'survey.imported', 'survey.reconciled', 'evidence.attached', 'reliability.promoted',
      'review.decided', 'checklist.recorded', 'qc.evaluated', 'qc.block_cleared',
      'sheets.composed', 'sheets.regenerated', 'issuance.updated',
    ]) {
      expect(types).toContain(expected)
    }
  })

  it('records the professional and licence behind a decision', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const decision = store.audit.find(a => a.eventType === 'review.decided')
    expect(decision?.actorType).toBe('professional')
    expect(decision?.actorLicence).toBe('21456')
    expect(decision?.summary).toMatch(/boundary_determination/)
  })

  it('records a refused promotion as clearly as a granted one', async () => {
    const store = new InMemorySitePlanStore()
    const unsealed = await parseSurveyCsv(CSV, {
      originalFilename: 'unsealed.csv', crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      verticalDatum: 'NAVD88', coordinateUnit: 'usSurveyFoot', surveyDate: '2026-03-14',
      surveyor: { name: 'A. Reyes', licenceNumber: '21456', state: 'MD' },
      seal: { sealed: true, evidence: 'declared_by_uploader' },
    })
    const discrepancies = reconcileSurvey({ surveyPoints: [], twin: twin(), coordinateUnit: 'usSurveyFoot' })
    const promotion = evaluatePromotion({ record: unsealed.record, discrepancies, scope: ['Parcel'] })

    await persistIngestionCycle(store, {
      organizationId: 'org1', workflowId: 'wf3',
      record: unsealed.record, points: unsealed.points,
      discrepancies, reconciliationRunId: 'recon-3', twinRevision: 1, comparisonSources: [],
      promotion,
      gatedQc: { findings: [], blocking: [], pendingSeal: [], deliverable: true as const, issuable: true, summary: '', clearedByEvidence: [], unclearedEvaluations: [] },
      qcRunId: 'qc-3', governingLevel: 1, disclosure: null,
    })

    const refused = store.audit.find(a => a.eventType === 'reliability.promotion_refused')
    expect(refused).toBeDefined()
    expect(refused?.summary).toMatch(/Held at Level/i)
    expect(store.audit.some(a => a.eventType === 'reliability.promoted')).toBe(false)
  })

  it('stamps the engine version on every event so a record is reproducible', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    expect(store.audit.every(a => a.engineVersion === ENGINE_VERSION)).toBe(true)
    expect(store.audit.every(a => a.workflowId === 'wf1')).toBe(true)
  })

  it('never rewrites an existing event — the stream is append-only', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const first = store.audit.length
    const snapshot = JSON.stringify(store.audit)
    await persistOnce(store)
    expect(store.audit.length).toBeGreaterThan(first)
    expect(JSON.stringify(store.audit.slice(0, first))).toBe(snapshot)
  })
})

// ── Sheets and revisions ────────────────────────────────────────────────────

describe('sheets and revisions', () => {
  it('stores the composed sheet number and the canonical content it covers', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const sheet = store.sheets[0]
    expect(sheet.sheetNumber).toMatch(/^C-\d+$/)
    expect(Array.isArray(sheet.covers)).toBe(true)
    expect(sheet.covers.length).toBeGreaterThan(0)
    expect(sheet.scaleLabel).toMatch(/1" = \d+'/)
  })

  it('records a revision with the superseded object ids retained', async () => {
    const store = new InMemorySitePlanStore()
    await persistOnce(store)
    const rev = store.revisions[0]
    expect(rev.revisionNumber).toBe(1)
    expect(rev.supersededObjectIds).toContain('gis-parcel')
    expect(rev.twinRevisionBefore).toBe(1)
    expect(rev.twinRevisionAfter).toBe(2)
  })

  it('only writes revisions for sheets that exist in the composed set', async () => {
    const store = new InMemorySitePlanStore()
    const result = await persistOnce(store)
    // sheetIdFor resolves only C-100 in this fixture.
    expect(result.revisionsWritten).toBe(1)
  })
})

// ── Mapper edge cases ───────────────────────────────────────────────────────

describe('row mappers', () => {
  it('disambiguates duplicate point ids rather than dropping a shot', () => {
    const rows = surveyPointRows('imp-1', [
      { pointId: '1', northing: 1, easting: 2, elevation: null, description: 'IPF', classification: 'boundary_monument' },
      { pointId: '1', northing: 3, easting: 4, elevation: null, description: 'IPF', classification: 'boundary_monument' },
    ])
    expect(rows.map(r => r.pointId)).toEqual(['1', '1#2'])
    expect(rows).toHaveLength(2)
  })

  it('keeps the raw description alongside the derived classification', () => {
    const rows = surveyPointRows('imp-1', [
      { pointId: '5', northing: 1, easting: 2, elevation: 3, description: 'TREE24 OAK', classification: 'tree' },
    ])
    expect(rows[0].description).toBe('TREE24 OAK')
    expect(rows[0].classification).toBe('tree')
  })

  it('carries a discrepancy location through to the row, and null when there is none', () => {
    const report = reconcileSurvey({
      surveyPoints: [], twin: twin(), coordinateUnit: 'usSurveyFoot',
      surveyVerticalDatum: 'NAVD88', gisVerticalDatum: 'NGVD29',
    })
    const { discrepancies } = reconciliationRows(report, {
      runId: 'r', twinRevision: 1, comparisonSources: [],
    })
    const datum = discrepancies.find(d => d.code === 'VERTICAL_DATUM_CONFLICT')
    expect(datum?.severity).toBe('BLOCKING')
    expect(datum?.locationNorthing).toBeNull()
  })

  it('produces one QC row per finding plus one per cleared block', () => {
    const rows = qcFindingRows(
      {
        findings: [{ code: 'A', severity: 'warning', message: 'm', remedy: 'r' }],
        blocking: [],
        pendingSeal: [], deliverable: true as const, issuable: true,
        summary: '',
        clearedByEvidence: [{ code: 'B', cleared: true, requirements: [{ description: 'd', satisfied: true, detail: 'x' }], outstanding: [] }],
        unclearedEvaluations: [],
      },
      { workflowId: 'wf1', runId: 'qc-1' },
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].status).toBe('OPEN')
    expect(rows[1].status).toBe('CLEARED_BY_EVIDENCE')
  })
})
