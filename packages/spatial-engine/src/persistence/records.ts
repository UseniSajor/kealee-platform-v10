/**
 * Row shapes for the site-plan persistence layer, and the mappers that produce
 * them from engine types.
 *
 * The engine stays free of a database dependency — it is pure logic over the
 * twin, and that is what makes it testable without a Postgres. Persistence is
 * expressed as a port (`SitePlanStore`) with a Prisma adapter alongside, the
 * same injection pattern already used for `CrsTransformer`.
 *
 * Enum values here are the SQL enum spellings, so a mapper is the only place
 * that has to know both vocabularies.
 */

import type { SurveyImportRecord, SurveyPoint } from '../survey/import-record'
import type { DiscrepancyReport, Discrepancy, ReconciliationTolerances } from '../survey/reconcile'
import type { EvidenceItem, ClearanceEvaluation, EvidenceGatedQc } from '../review/evidence'
import type { ScopedApproval, ContentSubject, DividedResponsibilityBlock } from '../review/content-scope'
import type { ComposedSheet } from '../sheets/composer'
import type { RevisionComparison } from '../survey/regenerate'
import type { RegenerationPlan } from '../survey/promotion'
import type { ReliabilityLevel } from '../site-plan/reliability'

export const ENGINE_VERSION = 'kealee-site-plan-1.0.0'

// ── Row types ───────────────────────────────────────────────────────────────

export interface SurveyImportRow {
  id: string
  organizationId: string
  workflowId: string | null
  projectId: string | null
  siteId: string | null
  originalFilename: string
  checksum: string
  format: string
  storageDocumentId: string | null
  uploadedAt: string
  uploadedById: string | null
  surveyDate: string | null
  surveyorName: string | null
  surveyorLicenceNumber: string | null
  surveyorLicenceState: string | null
  surveyorLicenceVerifiedAt: string | null
  sealed: boolean
  sealEvidence: string
  sealSignedAt: string | null
  crs: string | null
  candidateCrs: string | null
  crsConfirmedById: string | null
  crsConfirmedAt: string | null
  horizontalDatum: string | null
  verticalDatum: string | null
  coordinateUnit: string | null
  benchmark: unknown
  transformationPipeline: unknown
  parserVersion: string
  sourceGeometryCount: number
  normalizedGeometryCount: number
  confidence: number
  verificationStatus: string
  reliabilityLevel: number
  levelRationale: string
  warnings: string[]
  parsedPayload: unknown
}

export interface SurveyPointRow {
  importId: string
  pointId: string
  northing: number
  easting: number
  elevation: number | null
  description: string
  classification: string
}

export interface ReconciliationRunRow {
  id: string
  workflowId: string | null
  importId: string | null
  twinRevision: number
  tolerances: ReconciliationTolerances
  comparisonSources: string[]
  blockingCount: number
  warningCount: number
  geometryAltered: false
  summary: string
  engineVersion: string
}

export interface DiscrepancyRow {
  workflowId: string | null
  importId: string | null
  runId: string
  code: string
  severity: string
  status: string
  subject: string
  surveyValue: string
  comparisonValue: string
  delta: string
  tolerance: string
  locationNorthing: number | null
  locationEasting: number | null
  interpretation: string
  resolution: string
}

export interface EvidenceRow {
  id: string
  workflowId: string
  kind: string
  reference: string
  storageDocumentId: string | null
  checksum: string | null
  attachedAt: string
  attachedById: string
  attestedByName: string | null
  attestedByLicence: string | null
  attestedByDiscipline: string | null
  attestedByState: string | null
  notes: string | null
}

export interface ScopedApprovalRow {
  id: string
  workflowId: string
  subject: string
  discipline: string
  appearsOnSheets: string[]
  objectIds: string[]
  decision: string
  decidedById: string | null
  decidedByName: string | null
  licenceNumber: string | null
  licenceState: string | null
  decidedAt: string | null
  comment: string | null
  twinRevision: number | null
  contentHash: string | null
}

export interface QcFindingRow {
  workflowId: string
  runId: string
  code: string
  severity: string
  status: string
  message: string
  remedy: string
  outstanding: string[]
  retainedLevelExplanation: string | null
  clearedByEvidenceId: string | null
  clearedByApprovalId: string | null
  clearedAt: string | null
  twinRevision: number | null
}

export interface SheetRow {
  id: string
  workflowId: string
  sheetNumber: string
  title: string
  covers: string[]
  status: string
  scaleFtPerIn: number | null
  scaleLabel: string | null
  sheetSize: string | null
  disclosure: string | null
  responsibilityBlock: unknown
  currentRevision: number
  twinRevision: number
  contentHash: string | null
}

export interface SheetRevisionRow {
  sheetId: string
  workflowId: string
  revisionNumber: number
  revisionDate: string
  description: string
  issuedBy: string
  statusBefore: string | null
  statusAfter: string
  twinRevisionBefore: number | null
  twinRevisionAfter: number
  changes: RevisionComparison['changes']
  supersededObjectIds: string[]
  contentHash: string | null
}

export interface IssuanceRow {
  workflowId: string
  status: string
  governingReliabilityLevel: number
  disclosure: string | null
  issuable: boolean
  blockingFindingCount: number
  qcRunId: string | null
  sheetCount: number
  compositionRationale: string | null
}

export interface AuditEventRow {
  workflowId: string
  actorId: string | null
  actorType: 'system' | 'user' | 'professional' | 'jurisdiction'
  actorLicence: string | null
  eventType: string
  entityTable: string
  entityId: string
  summary: string
  before?: unknown
  after?: unknown
  twinRevision: number | null
  engineVersion: string
  metadata?: unknown
}

// ── Enum mapping ────────────────────────────────────────────────────────────

const SQL = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '_')

export const toSqlFormat = (f: SurveyImportRecord['format']) => SQL(f)
export const toSqlVerification = (v: SurveyImportRecord['verificationStatus']) => SQL(v)
export const toSqlSealEvidence = (e: SurveyImportRecord['seal']['evidence']) => SQL(e)
export const toSqlSeverity = (s: Discrepancy['severity']) => SQL(s)
export const toSqlSubject = (s: ContentSubject) => SQL(s)
export const toSqlEvidenceKind = (k: EvidenceItem['kind']) => SQL(k)

// ── Mappers ─────────────────────────────────────────────────────────────────

export function surveyImportRow(
  record: SurveyImportRecord,
  ctx: {
    organizationId: string
    workflowId?: string | null
    projectId?: string | null
    siteId?: string | null
    uploadedById?: string | null
    storageDocumentId?: string | null
    crsConfirmedById?: string | null
    parsedPayload?: unknown
  },
): SurveyImportRow {
  return {
    id: record.importId,
    organizationId: ctx.organizationId,
    workflowId: ctx.workflowId ?? null,
    projectId: ctx.projectId ?? null,
    siteId: ctx.siteId ?? null,
    originalFilename: record.originalFilename,
    checksum: record.checksum,
    format: toSqlFormat(record.format),
    storageDocumentId: ctx.storageDocumentId ?? null,
    uploadedAt: record.uploadedAt,
    uploadedById: ctx.uploadedById ?? null,
    surveyDate: record.surveyDate,
    surveyorName: record.surveyor?.name ?? null,
    surveyorLicenceNumber: record.surveyor?.licenceNumber ?? null,
    surveyorLicenceState: record.surveyor?.state ?? null,
    surveyorLicenceVerifiedAt: record.surveyor?.licenceVerifiedAt ?? null,
    sealed: record.seal.sealed,
    sealEvidence: toSqlSealEvidence(record.seal.evidence),
    sealSignedAt: record.seal.signedAt ?? null,
    crs: record.crs,
    candidateCrs: record.candidateCrs,
    crsConfirmedById: ctx.crsConfirmedById ?? null,
    crsConfirmedAt: record.crs ? record.uploadedAt : null,
    horizontalDatum: record.horizontalDatum,
    verticalDatum: record.verticalDatum,
    coordinateUnit: record.coordinateUnit,
    benchmark: record.benchmark,
    transformationPipeline: record.transformationPipeline,
    parserVersion: record.parserVersion,
    sourceGeometryCount: record.sourceGeometryCount,
    normalizedGeometryCount: record.normalizedGeometryCount,
    confidence: record.confidence,
    verificationStatus: toSqlVerification(record.verificationStatus),
    reliabilityLevel: record.reliabilityLevel,
    levelRationale: record.levelRationale,
    warnings: record.warnings,
    parsedPayload: ctx.parsedPayload ?? null,
  }
}

export function surveyPointRows(importId: string, points: SurveyPoint[]): SurveyPointRow[] {
  // Duplicate point ids exist in real files; the unique index is (importId,
  // pointId), so a collision is disambiguated rather than dropped.
  const seen = new Map<string, number>()
  return points.map(p => {
    const n = (seen.get(p.pointId) ?? 0) + 1
    seen.set(p.pointId, n)
    return {
      importId,
      pointId: n === 1 ? p.pointId : `${p.pointId}#${n}`,
      northing: p.northing,
      easting: p.easting,
      elevation: p.elevation,
      description: p.description,
      classification: p.classification,
    }
  })
}

export function reconciliationRows(
  report: DiscrepancyReport,
  ctx: {
    runId: string
    workflowId?: string | null
    importId?: string | null
    twinRevision: number
    comparisonSources: string[]
  },
): { run: ReconciliationRunRow; discrepancies: DiscrepancyRow[] } {
  return {
    run: {
      id: ctx.runId,
      workflowId: ctx.workflowId ?? null,
      importId: ctx.importId ?? null,
      twinRevision: ctx.twinRevision,
      tolerances: report.tolerances,
      comparisonSources: ctx.comparisonSources,
      blockingCount: report.blockingCount,
      warningCount: report.warningCount,
      geometryAltered: false,
      summary: report.summary,
      engineVersion: ENGINE_VERSION,
    },
    discrepancies: report.discrepancies.map(d => ({
      workflowId: ctx.workflowId ?? null,
      importId: ctx.importId ?? null,
      runId: ctx.runId,
      code: d.code,
      severity: toSqlSeverity(d.severity),
      status: 'OPEN',
      subject: d.subject,
      surveyValue: d.surveyValue,
      comparisonValue: d.comparisonValue,
      delta: d.delta,
      tolerance: d.tolerance,
      locationNorthing: d.location?.[0] ?? null,
      locationEasting: d.location?.[1] ?? null,
      interpretation: d.interpretation,
      resolution: d.resolution,
    })),
  }
}

export function evidenceRow(item: EvidenceItem, workflowId: string): EvidenceRow {
  return {
    id: item.id,
    workflowId,
    kind: toSqlEvidenceKind(item.kind),
    reference: item.reference,
    storageDocumentId: null,
    checksum: item.checksum ?? null,
    attachedAt: item.attachedAt,
    attachedById: item.attachedBy,
    attestedByName: item.attestedBy?.name ?? null,
    attestedByLicence: item.attestedBy?.licenceNumber ?? null,
    attestedByDiscipline: item.attestedBy?.discipline ?? null,
    attestedByState: item.attestedBy?.state ?? null,
    notes: item.notes ?? null,
  }
}

export function scopedApprovalRow(
  a: ScopedApproval,
  ctx: { workflowId: string; twinRevision?: number; contentHash?: string },
): ScopedApprovalRow {
  return {
    id: a.id,
    workflowId: ctx.workflowId,
    subject: toSqlSubject(a.subject),
    discipline: a.discipline,
    appearsOnSheets: a.appearsOn,
    objectIds: a.objectIds,
    decision: a.decision,
    decidedById: null,
    decidedByName: a.decidedBy ?? null,
    licenceNumber: a.licenceNumber ?? null,
    licenceState: null,
    decidedAt: a.decidedAt ?? null,
    comment: a.comment ?? null,
    twinRevision: ctx.twinRevision ?? null,
    contentHash: ctx.contentHash ?? null,
  }
}

/**
 * QC findings, with cleared blocks recorded as rows in their own right.
 *
 * A cleared block is not simply absent: it is stored with the evidence that
 * cleared it, so the clearance is auditable and can be withdrawn if the
 * evidence is later revoked.
 */
export function qcFindingRows(
  gated: EvidenceGatedQc,
  ctx: {
    workflowId: string
    runId: string
    twinRevision?: number
    evidenceIdFor?: (evaluation: ClearanceEvaluation) => string | null
    approvalIdFor?: (evaluation: ClearanceEvaluation) => string | null
  },
): QcFindingRow[] {
  const open: QcFindingRow[] = gated.findings.map(f => {
    const evaluation = gated.unclearedEvaluations.find(e => e.code === f.code)
    return {
      workflowId: ctx.workflowId,
      runId: ctx.runId,
      code: f.code,
      severity:
        f.severity === 'blocking' ? 'BLOCKING'
        : f.severity === 'pending_seal' ? 'PENDING_SEAL'
        : 'WARNING',
      status: 'OPEN',
      message: f.message,
      remedy: f.remedy,
      outstanding: evaluation?.outstanding ?? [],
      retainedLevelExplanation: evaluation?.retainedLevelExplanation ?? null,
      clearedByEvidenceId: null,
      clearedByApprovalId: null,
      clearedAt: null,
      twinRevision: ctx.twinRevision ?? null,
    }
  })

  const cleared: QcFindingRow[] = gated.clearedByEvidence.map(e => ({
    workflowId: ctx.workflowId,
    runId: ctx.runId,
    code: e.code,
    severity: 'BLOCKING',
    status: 'CLEARED_BY_EVIDENCE',
    message: `${e.code} cleared on evidence.`,
    remedy: e.requirements.map(r => `${r.description}: ${r.detail}`).join(' | '),
    outstanding: [],
    retainedLevelExplanation: null,
    clearedByEvidenceId: ctx.evidenceIdFor?.(e) ?? null,
    clearedByApprovalId: ctx.approvalIdFor?.(e) ?? null,
    clearedAt: new Date().toISOString(),
    twinRevision: ctx.twinRevision ?? null,
  }))

  return [...open, ...cleared]
}

export function sheetRow(
  sheet: ComposedSheet,
  ctx: {
    id: string
    workflowId: string
    status: string
    disclosure: string | null
    twinRevision: number
    currentRevision?: number
    responsibilityBlock?: DividedResponsibilityBlock
    contentHash?: string
  },
): SheetRow {
  return {
    id: ctx.id,
    workflowId: ctx.workflowId,
    sheetNumber: sheet.number,
    title: sheet.title,
    covers: sheet.covers,
    status: ctx.status,
    scaleFtPerIn: sheet.scaleFtPerIn,
    scaleLabel: sheet.scaleLabel,
    sheetSize: `${sheet.sheetSize.widthPt / 72}x${sheet.sheetSize.heightPt / 72}in`,
    disclosure: ctx.disclosure,
    responsibilityBlock: ctx.responsibilityBlock ?? null,
    currentRevision: ctx.currentRevision ?? 0,
    twinRevision: ctx.twinRevision,
    contentHash: ctx.contentHash ?? null,
  }
}

export function sheetRevisionRows(
  plan: RegenerationPlan,
  comparison: RevisionComparison,
  ctx: {
    workflowId: string
    sheetIdFor: (sheetId: string) => string | null
    statusBefore: Record<string, string | undefined>
  },
): SheetRevisionRow[] {
  // Several canonical sheets can land on ONE composed page. A revision belongs
  // to the page, not to the canonical content, so the first canonical sheet
  // that resolves to a given page claims the row and the rest are folded in —
  // otherwise the (sheetId, revisionNumber) unique index rejects the write.
  const claimed = new Set<string>()
  return plan.affectedSheets.flatMap(canonical => {
    const sheetId = ctx.sheetIdFor(canonical)
    if (!sheetId || claimed.has(sheetId)) return []
    claimed.add(sheetId)
    const change = plan.statusChanges.find(c => c.sheet === canonical)
    return [{
      sheetId,
      workflowId: ctx.workflowId,
      revisionNumber: plan.revisionEntry.number,
      revisionDate: plan.revisionEntry.date,
      description: plan.revisionEntry.description,
      issuedBy: plan.revisionEntry.by,
      statusBefore: change?.from ?? ctx.statusBefore[canonical] ?? null,
      statusAfter: change?.to ?? ctx.statusBefore[canonical] ?? 'PRELIMINARY',
      twinRevisionBefore: comparison.from.twinRevision,
      twinRevisionAfter: comparison.to.twinRevision,
      changes: comparison.changes,
      supersededObjectIds: comparison.supersededObjectIds,
      contentHash: null,
    }]
  })
}

export function issuanceRow(input: {
  workflowId: string
  gated: EvidenceGatedQc
  governingLevel: ReliabilityLevel
  disclosure: string | null
  qcRunId: string
  sheetCount: number
  compositionRationale?: string
  status?: string
}): IssuanceRow {
  return {
    workflowId: input.workflowId,
    // Issuable is a QC statement. It is never upgraded to PERMIT_SET here —
    // that requires a sealed professional review record.
    status: input.status ?? (input.gated.issuable ? 'FOR_REVIEW' : 'PRELIMINARY'),
    governingReliabilityLevel: input.governingLevel,
    disclosure: input.disclosure,
    issuable: input.gated.issuable,
    blockingFindingCount: input.gated.blocking.length,
    qcRunId: input.qcRunId,
    sheetCount: input.sheetCount,
    compositionRationale: input.compositionRationale ?? null,
  }
}

export function auditEvent(input: Omit<AuditEventRow, 'engineVersion'> & { engineVersion?: string }): AuditEventRow {
  return { ...input, engineVersion: input.engineVersion ?? ENGINE_VERSION }
}
