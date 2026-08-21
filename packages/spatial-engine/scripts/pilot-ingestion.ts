/**
 * Pilot run of the full Phase 3B pipeline on a real Prince George's County lot.
 *
 * 4500 Rhode Island Ave, Brentwood, MD 20722 — RSF-65, roughly 65 x 100 ft.
 * The GIS parcel is offset from the surveyed boundary, the LiDAR is older than
 * the survey, and the disturbance sits either side of the 5,000 sq ft line.
 * That is the ordinary case, not a contrived one.
 *
 * Run:  npx tsx packages/spatial-engine/scripts/pilot-ingestion.ts
 */

import { parseSurveyCsv } from '../src/survey/parse-csv'
import { reconcileSurvey } from '../src/survey/reconcile'
import { normalizeSurvey, applyToTwin } from '../src/survey/normalize'
import { evaluatePromotion, applyPromotion } from '../src/survey/promotion'
import { regenerateAfterSurvey } from '../src/survey/regenerate'
import { applyEvidenceGate, type EvidenceLedger } from '../src/review/evidence'
import { seedScopedApprovals, buildResponsibilityBlock, summariseScopedReview } from '../src/review/content-scope'
import { composeSheets, blocksFromFeatures } from '../src/sheets/composer'
import { createSiteTwin, addFeatures, addSource, featuresOfKind } from '../src/site-plan/site-twin'
import { gisSourceRecord, governingReliability } from '../src/site-plan/reliability'
import { InMemorySitePlanStore, persistIngestionCycle } from '../src/persistence/store'
import { persistPgRulePack } from '../src/persistence/rule-pack'
import type { SheetId, SheetStatus } from '../src/sheets/sheet-template'
import type { ScopedApproval } from '../src/review/content-scope'

const X = 1326382.7, Y = 464763.1
const SURVEYOR = { name: 'A. Reyes', licenceNumber: '21456', state: 'MD', licenceVerifiedAt: '2026-08-01' }

const CSV = [
  'Point,Northing,Easting,Elevation,Description',
  `1,${Y},${X},112.40,IPF`,
  `2,${Y},${X + 65},112.10,IPF`,
  `3,${Y + 100},${X + 65},113.80,IPF`,
  `4,${Y + 100},${X},114.20,IPF`,
  `10,${Y + 20},${X + 20},112.55,BM TBM#1`,
  `11,${Y + 40},${X + 30},112.90,EOP`,
  `12,${Y + 55},${X + 44},113.10,TREE24`,
  `13,${Y + 60},${X + 10},113.30,MH SAN`,
  `14,${Y + 12},${X + 8},112.35,INL`,
].join('\n')

function h(title: string) { console.log(`\n${'═'.repeat(78)}\n${title}\n${'═'.repeat(78)}`) }

async function main() {
  // ── Preliminary model: GIS only ───────────────────────────────────────────
  const gisRing = {
    coordinates: [[X + 4.2, Y + 1.1], [X + 69.2, Y + 1.1], [X + 69.2, Y + 101.1], [X + 4.2, Y + 101.1], [X + 4.2, Y + 1.1]] as [number, number][],
  }
  let before = createSiteTwin({
    siteId: 'pilot', projectId: 'pilot', organizationId: 'kealee',
    address: '4500 Rhode Island Ave, Brentwood, MD 20722',
    jurisdictionCode: 'prince_georges_md',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: null,
  })
  before = addSource(before, gisSourceRecord({
    sourceId: 'gis1', authority: 'M-NCPPC', dataset: 'PGAtlas parcels + zoning layer 59',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
  }))
  before = { ...before, zoneCode: 'RSF-65' }
  const gb = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  before = addFeatures(before, [
    { kind: 'Parcel', id: 'gis-parcel', parcelId: '17-2345678', ring: gisRing, areaSqFt: 6500, ...gb } as never,
    { kind: 'Setback', id: 'sb-front', side: 'front', distanceFt: 25, citation: 'Sec. 27-4202 RSF-65', ring: gisRing, ...gb } as never,
    { kind: 'Building', id: 'bldg-prop', existing: false, ring: gisRing, ...gb } as never,
  ])

  const disturbanceBefore = {
    buildingFootprintSqFt: 1596, drivewaySqFt: 700, gradingSqFt: 1500, utilityTrenchesSqFt: 200,
    stormwaterFacilitiesSqFt: 250, stockpilesSqFt: 40, constructionAccessSqFt: 60,
    offsiteWorkSqFt: 0, demolitionSqFt: 0, stagingAreasSqFt: 54,
  }

  // ── QC before any survey ──────────────────────────────────────────────────
  const qcBefore = applyEvidenceGate(
    {
      findings: [
        { code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking', message: 'No surveyor-certified boundary or topographic survey is on file.', remedy: 'Obtain a certified survey.' },
        { code: 'MISSING_VERTICAL_DATUM', severity: 'blocking', message: 'Elevation work is proposed but no vertical datum is recorded.', remedy: 'Establish the datum.' },
        { code: 'MISSING_EASEMENT', severity: 'warning', message: 'No easements are recorded in the model.', remedy: 'Confirm against the title report.' },
      ],
      blocking: [],
      issuable: false,
      summary: '',
    },
    { twin: before, ledger: { items: [] }, imports: [], promotions: [], approvals: [] },
  )

  h('QC BEFORE SURVEY INGESTION (GIS only, Level 1)')
  console.log(`issuable: ${qcBefore.issuable}`)
  for (const f of qcBefore.findings) console.log(`  [${f.severity.toUpperCase()}] ${f.code}\n      ${f.message}`)
  for (const e of qcBefore.unclearedEvaluations) {
    console.log(`  ${e.code} — outstanding:`)
    for (const o of e.outstanding) console.log(`      · ${o}`)
  }

  // ── Ingest the survey ─────────────────────────────────────────────────────
  const csv = await parseSurveyCsv(CSV, {
    originalFilename: 'lot12-boundary-topo.csv',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: 'NAVD88',
    coordinateUnit: 'usSurveyFoot', surveyDate: '2026-03-14',
    surveyor: SURVEYOR, seal: { sealed: true, evidence: 'document_reviewed' },
  })

  h('SURVEY IMPORT')
  console.log(`file            ${csv.record.originalFilename}`)
  console.log(`checksum        ${csv.record.checksum.slice(0, 32)}…`)
  console.log(`format          ${csv.record.format.toUpperCase()}   parser ${csv.record.parserVersion}`)
  console.log(`survey date     ${csv.record.surveyDate}   (upload ${csv.record.uploadedAt.slice(0, 10)})`)
  console.log(`surveyor        ${csv.record.surveyor?.name}, ${csv.record.surveyor?.state} PLS ${csv.record.surveyor?.licenceNumber}`)
  console.log(`CRS             ${csv.record.crs} (confirmed)   candidate: ${csv.record.candidateCrs ?? 'n/a'}`)
  console.log(`datums          H ${csv.record.horizontalDatum} / V ${csv.record.verticalDatum}   unit ${csv.record.coordinateUnit}`)
  console.log(`points          ${csv.points.length}   benchmarks ${csv.benchmarks.length}`)
  console.log(`reliability     Level ${csv.record.reliabilityLevel} — ${csv.record.verificationStatus}`)
  for (const w of csv.record.warnings) console.log(`  warning: ${w}`)

  const surveyBoundary = {
    coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][],
  }

  // ── Reconcile ─────────────────────────────────────────────────────────────
  const report = reconcileSurvey({
    surveyPoints: csv.points,
    twin: before,
    surveyBoundary,
    platAreaSqFt: 6500,
    recordAcreage: 6500 / 43560,
    coordinateUnit: 'usSurveyFoot',
    surveyVerticalDatum: 'NAVD88',
    gisVerticalDatum: 'NAVD88',
    lidarElevationAt: () => 110.9,
    gisCaptureDate: '2018-04-01',
    surveyDate: '2026-03-14',
    surveyCalls: [{ bearing: 'N 90-00-00 E', distanceFt: 65.12 }],
    platCalls: [{ bearing: 'N 90-00-00 E', distanceFt: 65.00 }],
  })

  h('PILOT DISCREPANCY REPORT')
  console.log(report.summary)
  console.log(`geometryAltered: ${report.geometryAltered}\n`)
  for (const d of report.discrepancies) {
    console.log(`[${d.severity.toUpperCase()}] ${d.code} — ${d.subject}`)
    console.log(`   survey      ${d.surveyValue}`)
    console.log(`   comparison  ${d.comparisonValue}`)
    console.log(`   delta       ${d.delta}   (tolerance ${d.tolerance})`)
    if (d.location) console.log(`   at          N ${d.location[0].toFixed(2)}  E ${d.location[1].toFixed(2)}`)
    console.log(`   means       ${d.interpretation}`)
    console.log(`   action      ${d.resolution}\n`)
  }

  // ── Normalise, promote, regenerate ────────────────────────────────────────
  // Promotion is decided BEFORE normalisation, because it decides what
  // reliability level the objects are allowed to enter the model at.
  const promotion = evaluatePromotion({
    record: csv.record, discrepancies: report,
    scope: ['Parcel', 'BoundarySegment', 'SpotElevation', 'Tree', 'Utility', 'Structure'],
  })
  const normalized = normalizeSurvey({
    record: csv.record, points: csv.points, benchmarks: csv.benchmarks,
    parcelRings: [{ name: 'LOT 12', coordinates: surveyBoundary.coordinates }],
    promotion,
  })
  const applied = applyToTwin(before, normalized, {
    kinds: ['Parcel'], reason: 'Replaced by certified boundary and topographic survey.',
  })
  const after = applyPromotion({ ...applied.twin, verticalDatum: 'NAVD88' }, promotion, normalized.source.sourceId)

  h('LEVEL 2 PROMOTION')
  for (const c of promotion.checks) console.log(`  ${c.satisfied ? '✓' : '✗'} ${c.requirement}\n      ${c.detail}`)
  console.log(`\n${promotion.rationale}`)
  console.log(`scope promoted: ${promotion.promotedScope.join(', ') || 'none'}`)

  const currentSheets: { sheet: SheetId; status: SheetStatus; revisions: never[] }[] = [
    { sheet: 'C-000', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'C-100', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'C-200', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'C-400', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'L-100', status: 'PRELIMINARY', revisions: [] },
  ]

  const outcome = regenerateAfterSurvey({
    before, after, supersededObjectIds: applied.supersededIds,
    discrepancies: report,
    disturbanceBefore,
    disturbanceAfter: { ...disturbanceBefore, gradingSqFt: 2800 },
    setbacksBefore: [{ side: 'front', requiredFt: 25, providedFt: 25.4, citation: 'Sec. 27-4202' }],
    setbacks: [{ side: 'front', requiredFt: 25, providedFt: 24.1, citation: 'Sec. 27-4202' }],
    currentSheets, revisionBy: 'Kealee site-plan engine',
  })

  h('REGENERATION — WHAT CHANGED AND WHAT IT MEANS')
  console.log(outcome.comparison.summary + '\n')
  for (const c of outcome.comparison.changes) {
    console.log(`${c.subject}`)
    console.log(`   ${c.before}  →  ${c.after}   (${c.delta})`)
    console.log(`   ${c.consequence}\n`)
  }
  console.log(`affected sheets   ${outcome.plan.affectedSheets.join(', ')}`)
  console.log(`unaffected        ${outcome.plan.unaffectedSheets.join(', ')}`)
  console.log(`status changes    ${outcome.plan.statusChanges.map(s => `${s.sheet} ${s.from}→${s.to}`).join(', ') || 'none'}`)
  console.log(`disclosure        ${outcome.plan.disclosure ?? '(removed — governing data is now certified)'}`)
  console.log(`superseded        ${outcome.plan.supersededHandling}`)

  // ── Compose the regenerated sheets ────────────────────────────────────────
  const blocks = blocksFromFeatures(after.features)
  const composition = composeSheets({ blocks })

  h('REGENERATED PILOT SHEETS')
  console.log(composition.rationale + '\n')
  for (const s of composition.sheets) {
    const block = buildResponsibilityBlock({
      sheet: s.covers[0],
      features: s.blocks.flatMap(b => b.features),
    })
    console.log(`${s.number}  ${s.title}`)
    console.log(`   covers   ${s.covers.join(', ')}`)
    console.log(`   scale    ${s.scaleLabel}`)
    if (s.legibilityNote) console.log(`   note     ${s.legibilityNote}`)
    console.log('   responsibility:')
    for (const r of block.rows) {
      console.log(`      ${r.title}${r.licence ? ` (${r.licence})` : ''}`)
      console.log(`         certifies: ${r.certifies.join(', ')}  [${r.objectIds.length} object(s)]`)
      if (r.excludes.length) console.log(`         not theirs: ${r.excludes.join(', ')}`)
    }
    console.log(`   ${block.divisionNote}\n`)
  }

  // ── QC after ──────────────────────────────────────────────────────────────
  const ledger: EvidenceLedger = {
    items: [
      { id: 'ev-cert', kind: 'certified_survey_file', reference: 'lot12-boundary-topo-sealed.pdf', attachedAt: '2026-08-21T09:00:00Z', attachedBy: 'ops' },
      { id: 'ev-lic', kind: 'surveyor_licence_verification', reference: 'MD DLLR register lookup 2026-08-01', attachedAt: '2026-08-21T09:00:00Z', attachedBy: 'ops' },
      { id: 'ev-seal', kind: 'seal_document_review', reference: 'Seal reviewed, sheet 1 of 1', attachedAt: '2026-08-21T09:05:00Z', attachedBy: 'T. Chamberlain' },
      { id: 'ev-bm', kind: 'benchmark_record', reference: 'TBM#1 top of hydrant, elev 112.55 NAVD88', attachedAt: '2026-08-21T09:05:00Z', attachedBy: 'ops' },
      { id: 'ev-vd', kind: 'vertical_datum_statement', reference: 'NAVD88 stated on the sealed survey', attachedAt: '2026-08-21T09:05:00Z', attachedBy: 'ops' },
      { id: 'ev-unit', kind: 'unit_check', reference: 'US survey feet confirmed against recorded acreage', attachedAt: '2026-08-21T09:06:00Z', attachedBy: 'ops' },
    ],
  }

  const approvals: ScopedApproval[] = seedScopedApprovals({
    twin: after,
    sheetFeatures: composition.sheets.map(s => ({
      sheet: s.covers[0], features: s.blocks.flatMap(b => b.features),
    })),
  }).map(a => a.subject === 'boundary_determination' || a.subject === 'topographic_survey'
    ? { ...a, decision: 'APPROVED' as const, decidedBy: SURVEYOR.name, licenceNumber: SURVEYOR.licenceNumber, decidedAt: '2026-08-21T10:00:00Z' }
    : a)

  const qcAfter = applyEvidenceGate(
    {
      findings: [
        { code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking', message: 'No surveyor-certified boundary or topographic survey is on file.', remedy: 'Obtain a certified survey.' },
        { code: 'MISSING_VERTICAL_DATUM', severity: 'blocking', message: 'Elevation work is proposed but no vertical datum is recorded.', remedy: 'Establish the datum.' },
        { code: 'MISSING_EASEMENT', severity: 'warning', message: 'No easements are recorded in the model.', remedy: 'Confirm against the title report.' },
      ],
      blocking: [],
      issuable: false,
      summary: '',
    },
    { twin: after, ledger, imports: [csv.record], promotions: [promotion], approvals },
  )

  h('QC AFTER SURVEY INGESTION')
  console.log(qcAfter.summary)
  console.log(`issuable: ${qcAfter.issuable}\n`)
  for (const c of qcAfter.clearedByEvidence) {
    console.log(`  CLEARED  ${c.code}`)
    for (const r of c.requirements) console.log(`      ✓ ${r.description}: ${r.detail}`)
  }
  for (const f of qcAfter.findings) console.log(`  [${f.severity.toUpperCase()}] ${f.code} — ${f.message}`)

  const review = summariseScopedReview(approvals)
  console.log(`\nreview: ${review.summary}`)

  // ── Persist ───────────────────────────────────────────────────────────────
  const store = new InMemorySitePlanStore()
  const pack = await persistPgRulePack(store, { verifiedAt: new Date().toISOString() })
  const persisted = await persistIngestionCycle(store, {
    organizationId: 'kealee', workflowId: 'pilot-wf', projectId: 'pilot', siteId: 'pilot',
    actorId: 'engine',
    record: csv.record, points: csv.points,
    discrepancies: report, reconciliationRunId: 'pilot-recon-1',
    twinRevision: after.revision,
    comparisonSources: ['PGAtlas parcels', 'county contours', 'MD iMAP LiDAR', 'recorded plat', 'digital site twin'],
    promotion, evidence: ledger.items, approvals,
    gatedQc: qcAfter, qcRunId: 'pilot-qc-1',
    governingLevel: governingReliability(after.sources),
    disclosure: outcome.plan.disclosure,
    sheets: composition.sheets.map((composed, i) => ({
      id: `pilot-sheet-${i + 1}`, composed, status: 'FOR_REVIEW',
    })),
    regeneration: {
      plan: outcome.plan, comparison: outcome.comparison,
      // Canonical sheet -> the composed page that actually carries it. An
      // affected canonical sheet with no page in this set gets no revision row.
      sheetIdFor: sheet => {
        const i = composition.sheets.findIndex(s => s.covers.includes(sheet as SheetId))
        return i >= 0 ? `pilot-sheet-${i + 1}` : null
      },
      statusBefore: Object.fromEntries(currentSheets.map(s => [s.sheet, s.status])),
    },
    compositionRationale: composition.rationale,
  })

  h('PERSISTED')
  console.log(`rule pack        ${pack.ruleCount} rules, ${pack.requiringHumanReview} requiring human review, mean confidence ${pack.meanConfidence.toFixed(2)}`)
  console.log(`import           ${persisted.importId}`)
  console.log(`survey points    ${store.points.length}`)
  console.log(`discrepancies    ${persisted.discrepanciesWritten}`)
  console.log(`QC findings      ${persisted.qcFindingsWritten} (${store.qcFindings.filter(f => f.status === 'CLEARED_BY_EVIDENCE').length} cleared on evidence)`)
  console.log(`sheets           ${persisted.sheetsWritten}`)
  console.log(`revisions        ${persisted.revisionsWritten}`)
  console.log(`audit events     ${persisted.auditEventsWritten}`)
  console.log(`issuance         ${store.issuance[0].status}, issuable=${store.issuance[0].issuable}`)
  console.log('\naudit stream:')
  for (const a of store.audit) console.log(`  ${a.eventType.padEnd(32)} ${a.summary.slice(0, 110)}`)

  h('MODEL STATE')
  console.log(`parcels in model  ${featuresOfKind(after, 'Parcel').length} (${applied.supersededIds.length} superseded, retained)`)
  console.log(`governing level   ${governingReliability(after.sources)}`)
  console.log(`twin revision     ${before.revision} → ${after.revision}`)
}

main().catch(e => { console.error(e); process.exit(1) })
