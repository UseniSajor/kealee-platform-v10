/**
 * Evidence-gated clearing of issuance blocks.
 *
 * The rule this file exists to enforce: professional approval alone does not
 * clear a block. A reviewer clicking "approved" cannot conjure a vertical datum
 * that was never established, or certify a boundary from data that has none.
 *
 * A block clears only when the underlying evidence exists AND the responsible
 * professional has approved it. Both, never either.
 */

import type { SiteTwin } from '../site-plan/site-twin'
import type { QcFinding, QcResult } from './checklist'
import type { SurveyImportRecord } from '../survey/import-record'
import type { PromotionDecision } from '../survey/promotion'
import type { ScopedApproval } from './content-scope'
import type { Discipline } from './disciplines'

export type EvidenceKind =
  | 'certified_survey_file'
  | 'surveyor_licence_verification'
  | 'seal_document_review'
  | 'benchmark_record'
  | 'vertical_datum_statement'
  | 'unit_check'
  | 'transformation_record'
  | 'title_report'
  | 'geotechnical_report'
  | 'architectural_footprint'
  | 'utility_field_location'

export interface EvidenceItem {
  id: string
  kind: EvidenceKind
  /** What the evidence is — a filename, a register lookup, a report reference. */
  reference: string
  attachedAt: string
  attachedBy: string
  /** Set when a licensed professional stands behind the evidence. */
  attestedBy?: { name: string; licenceNumber: string; discipline: Discipline; state: string }
  checksum?: string
  notes?: string
}

export interface EvidenceLedger {
  items: EvidenceItem[]
}

export function hasEvidence(ledger: EvidenceLedger, kind: EvidenceKind): EvidenceItem | undefined {
  return ledger.items.find(i => i.kind === kind)
}

export interface ClearanceRequirement {
  description: string
  satisfied: boolean
  detail: string
}

export interface ClearanceEvaluation {
  code: string
  cleared: boolean
  requirements: ClearanceRequirement[]
  /** Present when the block cannot clear — states what is still needed. */
  outstanding: string[]
  /** Present when data supports drafting but not certification. */
  retainedLevelExplanation?: string
}

export interface ClearanceInput {
  twin: SiteTwin
  ledger: EvidenceLedger
  imports: SurveyImportRecord[]
  promotions: PromotionDecision[]
  approvals: ScopedApproval[]
}

function approvalFor(approvals: ScopedApproval[], subject: string): ScopedApproval | undefined {
  return approvals.find(a => a.subject === subject)
}

/**
 * MISSING_SURVEY_CERTIFICATION clears only when qualifying survey information
 * exists, the responsible Maryland professional is identified, certification
 * evidence is attached, and the relevant review is approved.
 */
export function evaluateSurveyCertification(input: ClearanceInput): ClearanceEvaluation {
  const reqs: ClearanceRequirement[] = []
  const { ledger, imports, approvals } = input

  const qualifying = imports.filter(r => ['csv', 'landxml', 'dxf', 'dwg'].includes(r.format))
  reqs.push({
    description: 'Qualifying survey information exists',
    satisfied: qualifying.length > 0,
    detail: qualifying.length > 0
      ? `${qualifying.length} coordinate-bearing import(s): ${qualifying.map(r => r.originalFilename).join(', ')}.`
      : imports.length > 0
        ? `${imports.length} import(s) present, none carrying survey coordinates ` +
          `(${imports.map(r => r.format).join(', ')}). A PDF or point cloud does not qualify.`
        : 'No survey has been imported.',
  })

  const identified = qualifying.find(r => r.surveyor?.licenceNumber)
  reqs.push({
    description: 'Responsible Maryland professional identified',
    satisfied: identified != null && identified.surveyor?.state === 'MD',
    detail: identified?.surveyor
      ? `${identified.surveyor.name}, ${identified.surveyor.state} licence ${identified.surveyor.licenceNumber}.`
      : 'No licensed surveyor is attached to any qualifying import.',
  })

  const licenceEvidence = hasEvidence(ledger, 'surveyor_licence_verification')
  reqs.push({
    description: 'Licence verified against the state register',
    satisfied: licenceEvidence != null,
    detail: licenceEvidence
      ? `${licenceEvidence.reference} (${licenceEvidence.attachedAt}).`
      : 'No register verification is attached.',
  })

  const sealEvidence = hasEvidence(ledger, 'seal_document_review')
    ?? hasEvidence(ledger, 'certified_survey_file')
  reqs.push({
    description: 'Certification evidence attached',
    satisfied: sealEvidence != null,
    detail: sealEvidence
      ? `${sealEvidence.kind}: ${sealEvidence.reference}.`
      : 'No sealed document or seal-review record is attached.',
  })

  const boundaryApproval = approvalFor(approvals, 'boundary_determination')
  reqs.push({
    description: 'Boundary determination approved by the surveyor',
    satisfied: boundaryApproval?.decision === 'APPROVED',
    detail: boundaryApproval
      ? `Boundary review is ${boundaryApproval.decision}.`
      : 'No boundary-determination review exists.',
  })

  const outstanding = reqs.filter(r => !r.satisfied).map(r => `${r.description} — ${r.detail}`)
  const evidenceMissing = !sealEvidence || !licenceEvidence || qualifying.length === 0
  const approvedWithoutEvidence = boundaryApproval?.decision === 'APPROVED' && evidenceMissing

  return {
    code: 'MISSING_SURVEY_CERTIFICATION',
    cleared: outstanding.length === 0,
    requirements: reqs,
    outstanding,
    retainedLevelExplanation: approvedWithoutEvidence
      ? 'A professional approval is recorded, but the supporting evidence is not. Approval alone does ' +
        'not promote geometry: the objects stay at their current reliability level and the block stays ' +
        'in place until the certified file, the licence verification and the seal review are attached.'
      : outstanding.length > 0
        ? 'The imported data supports drafting a preliminary plan. It does not support a certification ' +
          'claim, so the package remains preliminary and says so on every sheet.'
        : undefined,
  }
}

/**
 * MISSING_VERTICAL_DATUM clears only when the datum is explicitly supplied or
 * professionally verified, benchmark/control information is recorded, and unit
 * and transformation checks pass.
 */
export function evaluateVerticalDatum(input: ClearanceInput): ClearanceEvaluation {
  const reqs: ClearanceRequirement[] = []
  const { twin, ledger, imports } = input

  const datumStatement = hasEvidence(ledger, 'vertical_datum_statement')
  const datumOnTwin = twin.verticalDatum
  const datumOnImport = imports.find(r => r.verticalDatum)
  reqs.push({
    description: 'Vertical datum explicitly supplied or professionally verified',
    satisfied: Boolean(datumOnTwin || datumStatement || datumOnImport?.verticalDatum),
    detail: datumOnTwin
      ? `Site model records ${datumOnTwin}.`
      : datumStatement
        ? `${datumStatement.reference}${datumStatement.attestedBy ? `, attested by ${datumStatement.attestedBy.name}` : ''}.`
        : datumOnImport?.verticalDatum
          ? `Import "${datumOnImport.originalFilename}" declares ${datumOnImport.verticalDatum}.`
          : 'No vertical datum is recorded anywhere. It is never inferred from elevation magnitude.',
  })

  const benchmarkEvidence = hasEvidence(ledger, 'benchmark_record')
  const benchmarkFeature = twin.features.some(
    f => 'attributes' in f && (f.attributes as Record<string, unknown> | undefined)?.role === 'benchmark',
  )
  reqs.push({
    description: 'Benchmark or control information recorded',
    satisfied: benchmarkEvidence != null || benchmarkFeature,
    detail: benchmarkEvidence
      ? `${benchmarkEvidence.reference}.`
      : benchmarkFeature
        ? 'A benchmark is present in the site model.'
        : 'No benchmark or control point is recorded. A datum name with nothing tying the site to it is not a datum.',
  })

  const unitCheck = hasEvidence(ledger, 'unit_check')
  const unitsKnown = imports.every(r => r.coordinateUnit != null || r.format === 'pdf' || r.format === 'las' || r.format === 'laz')
  reqs.push({
    description: 'Unit checks pass',
    satisfied: unitCheck != null || (imports.length > 0 && unitsKnown),
    detail: unitCheck
      ? `${unitCheck.reference}.`
      : unitsKnown && imports.length > 0
        ? `Coordinate units are declared on every coordinate-bearing import.`
        : 'At least one import has undeclared units. Feet and metres differ by 3.28 — this must be settled, not assumed.',
  })

  const transformEvidence = hasEvidence(ledger, 'transformation_record')
  const transformsRecorded = imports.every(r => r.transformationPipeline.length > 0 || r.crs != null)
  reqs.push({
    description: 'Transformation checks pass',
    satisfied: transformEvidence != null || transformsRecorded,
    detail: transformEvidence
      ? `${transformEvidence.reference}.`
      : transformsRecorded
        ? 'Every import records either a confirmed CRS or the transformation applied.'
        : 'An import has neither a confirmed CRS nor a recorded transformation.',
  })

  const outstanding = reqs.filter(r => !r.satisfied).map(r => `${r.description} — ${r.detail}`)

  return {
    code: 'MISSING_VERTICAL_DATUM',
    cleared: outstanding.length === 0,
    requirements: reqs,
    outstanding,
    retainedLevelExplanation: outstanding.length > 0
      ? 'Elevation-dependent objects — contours, surfaces, grading, drainage — stay at their current ' +
        'reliability level. They can be drafted and reviewed; they cannot be certified until the site ' +
        'is tied to a stated datum.'
      : undefined,
  }
}

export interface EvidenceGatedQc extends QcResult {
  /** Blocks that cleared, with the evidence that cleared them. */
  clearedByEvidence: ClearanceEvaluation[]
  /** Blocks that remain, with what is still needed. */
  unclearedEvaluations: ClearanceEvaluation[]
}

/**
 * Re-runs a QC result through the evidence gate. Findings whose evidence
 * requirements are fully met are removed; everything else is annotated with
 * exactly what is missing.
 */
export function applyEvidenceGate(qc: QcResult, input: ClearanceInput): EvidenceGatedQc {
  const evaluators: Record<string, (i: ClearanceInput) => ClearanceEvaluation> = {
    MISSING_SURVEY_CERTIFICATION: evaluateSurveyCertification,
    MISSING_VERTICAL_DATUM: evaluateVerticalDatum,
  }

  const cleared: ClearanceEvaluation[] = []
  const uncleared: ClearanceEvaluation[] = []
  const findings: QcFinding[] = []

  for (const f of qc.findings) {
    const evaluator = evaluators[f.code]
    if (!evaluator) { findings.push(f); continue }
    const evaluation = evaluator(input)
    if (evaluation.cleared) {
      cleared.push(evaluation)
      continue
    }
    uncleared.push(evaluation)
    findings.push({
      ...f,
      remedy:
        `${f.remedy} Outstanding: ${evaluation.outstanding.join(' | ')}` +
        (evaluation.retainedLevelExplanation ? ` ${evaluation.retainedLevelExplanation}` : ''),
    })
  }

  // A block that was not raised may still be evaluated, so an operator can see
  // the standard before they get there.
  for (const [code, evaluator] of Object.entries(evaluators)) {
    if (qc.findings.some(f => f.code === code)) continue
    const evaluation = evaluator(input)
    if (evaluation.cleared) cleared.push(evaluation)
  }

  const blocking = findings.filter(f => f.severity === 'blocking')
  return {
    findings,
    blocking,
    issuable: blocking.length === 0,
    clearedByEvidence: cleared,
    unclearedEvaluations: uncleared,
    summary: blocking.length
      ? `Not ready to submit — ${blocking.length} blocking finding${blocking.length === 1 ? '' : 's'} ` +
        `after the evidence gate. ${cleared.length} block(s) cleared on evidence.`
      : cleared.length
        ? `No blocking findings. ${cleared.length} block(s) cleared on attached evidence and approval.`
        : 'No blocking findings.',
  }
}
