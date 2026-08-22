/**
 * The persistence port and the orchestration that writes one complete
 * survey-ingestion cycle.
 *
 * `SitePlanStore` is an interface, not a Prisma client. The engine has no
 * database dependency — that is what lets the whole civil model be tested in
 * milliseconds — and the adapter is supplied by the caller, exactly as
 * `CrsTransformer` is for reprojection.
 *
 * Every write emits an audit event. The audit stream is append-only and is the
 * answer to "who changed what, when, and on what basis" — a question that will
 * be asked of any plan that reaches a county reviewer.
 */

import type {
  SurveyImportRow, SurveyPointRow, ReconciliationRunRow, DiscrepancyRow,
  EvidenceRow, ScopedApprovalRow, QcFindingRow, SheetRow, SheetRevisionRow,
  IssuanceRow, AuditEventRow,
} from './records'
import {
  ENGINE_VERSION, surveyImportRow, surveyPointRows, reconciliationRows,
  evidenceRow, scopedApprovalRow, qcFindingRows, sheetRow, sheetRevisionRows,
  issuanceRow, auditEvent,
} from './records'
import type { SurveyImportRecord, SurveyPoint } from '../survey/import-record'
import type { DiscrepancyReport } from '../survey/reconcile'
import type { EvidenceItem, EvidenceGatedQc, ClearanceEvaluation } from '../review/evidence'
import type { ScopedApproval, DividedResponsibilityBlock } from '../review/content-scope'
import type { ComposedSheet } from '../sheets/composer'
import type { RegenerationPlan } from '../survey/promotion'
import type { PromotionDecision } from '../survey/promotion'
import type { RevisionComparison } from '../survey/regenerate'
import type { ReliabilityLevel } from '../site-plan/reliability'

export interface ChecklistResultRow {
  workflowId: string
  itemKey: string
  label: string
  citation: string | null
  ruleVersionId: string | null
  status: string
  detail: string | null
  evidenceId: string | null
  notApplicableReason: string | null
}

export interface RuleVersionRow {
  id: string
  jurisdictionCode: string
  agency: string
  ruleKey: string
  version: number
  kind: string
  sourceUrl: string | null
  section: string | null
  effectiveDate: string | null
  lastVerifiedAt: string | null
  confidence: number
  humanReviewRequired: boolean
  payload: unknown
}

/**
 * The write port. Implementations are expected to be idempotent on the natural
 * keys declared in the migration — an ingestion that is retried must not create
 * a second copy of the same file's findings.
 */
export interface SitePlanStore {
  upsertRuleVersions(rows: RuleVersionRow[]): Promise<void>
  upsertSurveyImport(row: SurveyImportRow): Promise<void>
  replaceSurveyPoints(importId: string, rows: SurveyPointRow[]): Promise<void>
  insertReconciliationRun(run: ReconciliationRunRow, discrepancies: DiscrepancyRow[]): Promise<void>
  insertEvidence(rows: EvidenceRow[]): Promise<void>
  upsertScopedApprovals(rows: ScopedApprovalRow[]): Promise<void>
  upsertChecklistResults(rows: ChecklistResultRow[]): Promise<void>
  replaceQcFindings(workflowId: string, runId: string, rows: QcFindingRow[]): Promise<void>
  upsertSheets(rows: SheetRow[]): Promise<void>
  insertSheetRevisions(rows: SheetRevisionRow[]): Promise<void>
  upsertIssuance(row: IssuanceRow): Promise<void>
  appendAudit(rows: AuditEventRow[]): Promise<void>
  /** Runs the callback inside one transaction. */
  transaction<T>(fn: (store: SitePlanStore) => Promise<T>): Promise<T>
}

export interface PersistIngestionInput {
  organizationId: string
  workflowId: string
  projectId?: string
  siteId?: string
  actorId?: string
  actorType?: AuditEventRow['actorType']

  record: SurveyImportRecord
  points: SurveyPoint[]
  parsedPayload?: unknown
  storageDocumentId?: string

  discrepancies: DiscrepancyReport
  reconciliationRunId: string
  twinRevision: number
  comparisonSources: string[]

  promotion?: PromotionDecision
  evidence?: EvidenceItem[]
  approvals?: ScopedApproval[]
  checklist?: ChecklistResultRow[]

  gatedQc: EvidenceGatedQc
  qcRunId: string
  governingLevel: ReliabilityLevel
  disclosure: string | null

  sheets?: {
    id: string
    composed: ComposedSheet
    status: string
    responsibilityBlock?: DividedResponsibilityBlock
    contentHash?: string
  }[]
  regeneration?: { plan: RegenerationPlan; comparison: RevisionComparison; sheetIdFor: (sheet: string) => string | null; statusBefore: Record<string, string | undefined> }
  compositionRationale?: string
}

export interface PersistIngestionResult {
  importId: string
  reconciliationRunId: string
  qcRunId: string
  discrepanciesWritten: number
  qcFindingsWritten: number
  sheetsWritten: number
  revisionsWritten: number
  auditEventsWritten: number
  issuable: boolean
}

/** Which evidence cleared which block, for the QC row's `clearedByEvidenceId`. */
function evidenceIdResolver(evidence: EvidenceItem[]) {
  const byKind = new Map(evidence.map(e => [e.kind, e.id]))
  return (evaluation: ClearanceEvaluation): string | null => {
    if (evaluation.code === 'MISSING_SURVEY_CERTIFICATION') {
      return byKind.get('seal_document_review') ?? byKind.get('certified_survey_file') ?? null
    }
    if (evaluation.code === 'MISSING_VERTICAL_DATUM') {
      return byKind.get('vertical_datum_statement') ?? byKind.get('benchmark_record') ?? null
    }
    return null
  }
}

/**
 * Writes one complete ingestion cycle in a single transaction: the import and
 * its points, the reconciliation run and its findings, evidence, approvals,
 * checklist results, QC findings, sheets and their revisions, issuance state,
 * and the audit trail over all of it.
 *
 * It is one transaction because a half-written cycle is worse than no cycle: a
 * QC pass recorded without the discrepancies it was computed against is a
 * record that lies.
 */
export async function persistIngestionCycle(
  store: SitePlanStore,
  input: PersistIngestionInput,
): Promise<PersistIngestionResult> {
  return store.transaction(async tx => {
    const audits: AuditEventRow[] = []
    const actorType = input.actorType ?? 'system'
    const push = (
      eventType: string, entityTable: string, entityId: string, summary: string,
      extra?: Partial<AuditEventRow>,
    ) => audits.push(auditEvent({
      workflowId: input.workflowId,
      actorId: input.actorId ?? null,
      actorType,
      actorLicence: input.record.surveyor?.licenceNumber ?? null,
      eventType, entityTable, entityId, summary,
      twinRevision: input.twinRevision,
      ...extra,
    }))

    // ── Survey import ────────────────────────────────────────────────────────
    const importRow = surveyImportRow(input.record, {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      projectId: input.projectId ?? null,
      siteId: input.siteId ?? null,
      uploadedById: input.actorId ?? null,
      storageDocumentId: input.storageDocumentId ?? null,
      parsedPayload: input.parsedPayload,
    })
    await tx.upsertSurveyImport(importRow)
    push('survey.imported', 'survey_imports', importRow.id,
      `Imported ${input.record.originalFilename} (${input.record.format.toUpperCase()}), ` +
      `${input.record.sourceGeometryCount} source object(s), reliability level ` +
      `${input.record.reliabilityLevel}. ${input.record.levelRationale}`,
      { after: { crs: importRow.crs, candidateCrs: importRow.candidateCrs, checksum: importRow.checksum } })

    if (!input.record.crs && input.record.candidateCrs) {
      push('survey.crs_unconfirmed', 'survey_imports', importRow.id,
        `A CRS of ${input.record.candidateCrs} was detected but NOT confirmed. It is stored as a ` +
        'candidate only and does not georeference the geometry.')
    }

    const pointRows = surveyPointRows(importRow.id, input.points)
    await tx.replaceSurveyPoints(importRow.id, pointRows)

    // ── Reconciliation ───────────────────────────────────────────────────────
    const { run, discrepancies } = reconciliationRows(input.discrepancies, {
      runId: input.reconciliationRunId,
      workflowId: input.workflowId,
      importId: importRow.id,
      twinRevision: input.twinRevision,
      comparisonSources: input.comparisonSources,
    })
    await tx.insertReconciliationRun(run, discrepancies)
    push('survey.reconciled', 'survey_reconciliation_runs', run.id,
      `${input.discrepancies.discrepancies.length} finding(s): ${run.blockingCount} blocking, ` +
      `${run.warningCount} warning. Certified geometry was not altered.`,
      { after: { tolerances: run.tolerances, geometryAltered: false } })

    // ── Evidence ─────────────────────────────────────────────────────────────
    const evidence = input.evidence ?? []
    if (evidence.length) {
      await tx.insertEvidence(evidence.map(e => evidenceRow(e, input.workflowId)))
      for (const e of evidence) {
        push('evidence.attached', 'site_plan_evidence', e.id,
          `${e.kind} attached: ${e.reference}` +
          (e.attestedBy ? ` (attested by ${e.attestedBy.name}, licence ${e.attestedBy.licenceNumber})` : ''),
          { actorId: e.attachedBy })
      }
    }

    // ── Promotion ────────────────────────────────────────────────────────────
    if (input.promotion) {
      push(
        input.promotion.promoted ? 'reliability.promoted' : 'reliability.promotion_refused',
        'survey_imports', importRow.id,
        input.promotion.rationale,
        { after: { toLevel: input.promotion.toLevel, scope: input.promotion.promotedScope, blockers: input.promotion.blockers } },
      )
    }

    // ── Scoped approvals ─────────────────────────────────────────────────────
    const approvals = input.approvals ?? []
    if (approvals.length) {
      await tx.upsertScopedApprovals(approvals.map(a =>
        scopedApprovalRow(a, { workflowId: input.workflowId, twinRevision: input.twinRevision })))
      for (const a of approvals.filter(x => x.decision !== 'PENDING')) {
        push('review.decided', 'site_plan_scoped_approvals', a.id,
          `${a.discipline} recorded ${a.decision} on ${a.subject} ` +
          `(${a.objectIds.length} object(s), sheets ${a.appearsOn.join(', ') || 'n/a'}). ` +
          'The decision binds to this model revision.',
          { actorType: 'professional', actorLicence: a.licenceNumber ?? null })
      }
    }

    // ── Checklist ────────────────────────────────────────────────────────────
    if (input.checklist?.length) {
      await tx.upsertChecklistResults(input.checklist)
      push('checklist.recorded', 'site_plan_checklist_results', input.workflowId,
        `${input.checklist.length} checklist item(s) recorded; ` +
        `${input.checklist.filter(c => c.status === 'OUTSTANDING').length} outstanding.`)
    }

    // ── QC ───────────────────────────────────────────────────────────────────
    const qcRows = qcFindingRows(input.gatedQc, {
      workflowId: input.workflowId,
      runId: input.qcRunId,
      twinRevision: input.twinRevision,
      evidenceIdFor: evidenceIdResolver(evidence),
    })
    await tx.replaceQcFindings(input.workflowId, input.qcRunId, qcRows)
    push('qc.evaluated', 'site_plan_qc_findings', input.qcRunId, input.gatedQc.summary, {
      after: {
        blocking: input.gatedQc.blocking.map(f => f.code),
        clearedByEvidence: input.gatedQc.clearedByEvidence.map(c => c.code),
      },
    })
    for (const cleared of input.gatedQc.clearedByEvidence) {
      push('qc.block_cleared', 'site_plan_qc_findings', cleared.code,
        `${cleared.code} cleared. ` +
        cleared.requirements.map(r => `${r.description}: ${r.detail}`).join(' | '))
    }

    // ── Sheets and revisions ─────────────────────────────────────────────────
    let sheetsWritten = 0
    if (input.sheets?.length) {
      await tx.upsertSheets(input.sheets.map(s => sheetRow(s.composed, {
        id: s.id,
        workflowId: input.workflowId,
        status: s.status,
        disclosure: input.disclosure,
        twinRevision: input.twinRevision,
        currentRevision: input.regeneration?.plan.revisionEntry.number ?? 0,
        responsibilityBlock: s.responsibilityBlock,
        contentHash: s.contentHash,
      })))
      sheetsWritten = input.sheets.length
      push('sheets.composed', 'site_plan_sheets', input.workflowId,
        `${sheetsWritten} sheet(s) composed. ${input.compositionRationale ?? ''}`.trim(),
        { after: { sheets: input.sheets.map(s => ({ number: s.composed.number, covers: s.composed.covers, scale: s.composed.scaleLabel })) } })
    }

    let revisionsWritten = 0
    if (input.regeneration) {
      const rows = sheetRevisionRows(
        input.regeneration.plan,
        input.regeneration.comparison,
        {
          workflowId: input.workflowId,
          sheetIdFor: input.regeneration.sheetIdFor,
          statusBefore: input.regeneration.statusBefore,
        },
      )
      if (rows.length) await tx.insertSheetRevisions(rows)
      revisionsWritten = rows.length
      push('sheets.regenerated', 'site_plan_sheet_revisions', input.workflowId,
        `Revision ${input.regeneration.plan.revisionEntry.number}: ` +
        `${input.regeneration.plan.affectedSheets.length} sheet(s) regenerated, ` +
        `${input.regeneration.plan.unaffectedSheets.length} unaffected. ` +
        input.regeneration.plan.supersededHandling,
        {
          before: { twinRevision: input.regeneration.comparison.from.twinRevision },
          after: {
            twinRevision: input.regeneration.comparison.to.twinRevision,
            changes: input.regeneration.comparison.changes,
            supersededObjectIds: input.regeneration.comparison.supersededObjectIds,
          },
        })
    }

    // ── Issuance ─────────────────────────────────────────────────────────────
    const issuance = issuanceRow({
      workflowId: input.workflowId,
      gated: input.gatedQc,
      governingLevel: input.governingLevel,
      disclosure: input.disclosure,
      qcRunId: input.qcRunId,
      sheetCount: sheetsWritten,
      compositionRationale: input.compositionRationale,
    })
    await tx.upsertIssuance(issuance)
    push('issuance.updated', 'site_plan_issuance', input.workflowId,
      `Issuance status ${issuance.status}; issuable=${issuance.issuable}; ` +
      `${issuance.blockingFindingCount} blocking finding(s). ` +
      'PERMIT_SET is never set from QC alone — it requires a sealed professional review record.')

    await tx.appendAudit(audits)

    return {
      importId: importRow.id,
      reconciliationRunId: run.id,
      qcRunId: input.qcRunId,
      discrepanciesWritten: discrepancies.length,
      qcFindingsWritten: qcRows.length,
      sheetsWritten,
      revisionsWritten,
      auditEventsWritten: audits.length,
      issuable: input.gatedQc.issuable,
    }
  })
}

/**
 * In-memory store, for tests and for a dry run that shows exactly what would be
 * written without touching a database.
 */
export class InMemorySitePlanStore implements SitePlanStore {
  ruleVersions: RuleVersionRow[] = []
  imports: SurveyImportRow[] = []
  points: SurveyPointRow[] = []
  runs: ReconciliationRunRow[] = []
  discrepancies: DiscrepancyRow[] = []
  evidence: EvidenceRow[] = []
  approvals: ScopedApprovalRow[] = []
  checklist: ChecklistResultRow[] = []
  qcFindings: QcFindingRow[] = []
  sheets: SheetRow[] = []
  revisions: SheetRevisionRow[] = []
  issuance: IssuanceRow[] = []
  audit: AuditEventRow[] = []
  transactionDepth = 0

  async upsertRuleVersions(rows: RuleVersionRow[]) {
    for (const r of rows) {
      const i = this.ruleVersions.findIndex(x => x.jurisdictionCode === r.jurisdictionCode && x.ruleKey === r.ruleKey && x.version === r.version)
      if (i >= 0) this.ruleVersions[i] = r; else this.ruleVersions.push(r)
    }
  }
  async upsertSurveyImport(row: SurveyImportRow) {
    const i = this.imports.findIndex(x => x.organizationId === row.organizationId && x.checksum === row.checksum)
    if (i >= 0) this.imports[i] = row; else this.imports.push(row)
  }
  async replaceSurveyPoints(importId: string, rows: SurveyPointRow[]) {
    this.points = this.points.filter(p => p.importId !== importId).concat(rows)
  }
  async insertReconciliationRun(run: ReconciliationRunRow, discrepancies: DiscrepancyRow[]) {
    this.runs.push(run)
    this.discrepancies.push(...discrepancies)
  }
  async insertEvidence(rows: EvidenceRow[]) { this.evidence.push(...rows) }
  async upsertScopedApprovals(rows: ScopedApprovalRow[]) {
    for (const r of rows) {
      const i = this.approvals.findIndex(x => x.workflowId === r.workflowId && x.subject === r.subject)
      if (i >= 0) this.approvals[i] = r; else this.approvals.push(r)
    }
  }
  async upsertChecklistResults(rows: ChecklistResultRow[]) {
    for (const r of rows) {
      const i = this.checklist.findIndex(x => x.workflowId === r.workflowId && x.itemKey === r.itemKey)
      if (i >= 0) this.checklist[i] = r; else this.checklist.push(r)
    }
  }
  async replaceQcFindings(workflowId: string, runId: string, rows: QcFindingRow[]) {
    this.qcFindings = this.qcFindings
      .filter(f => !(f.workflowId === workflowId && f.runId === runId))
      .concat(rows)
  }
  async upsertSheets(rows: SheetRow[]) {
    for (const r of rows) {
      const i = this.sheets.findIndex(x => x.workflowId === r.workflowId && x.sheetNumber === r.sheetNumber)
      if (i >= 0) this.sheets[i] = r; else this.sheets.push(r)
    }
  }
  async insertSheetRevisions(rows: SheetRevisionRow[]) { this.revisions.push(...rows) }
  async upsertIssuance(row: IssuanceRow) {
    const i = this.issuance.findIndex(x => x.workflowId === row.workflowId)
    if (i >= 0) this.issuance[i] = row; else this.issuance.push(row)
  }
  async appendAudit(rows: AuditEventRow[]) { this.audit.push(...rows) }

  async transaction<T>(fn: (store: SitePlanStore) => Promise<T>): Promise<T> {
    // A real adapter rolls back; here a throw simply propagates and the caller
    // discards the store, which is the same guarantee for test purposes.
    this.transactionDepth++
    try {
      return await fn(this)
    } finally {
      this.transactionDepth--
    }
  }
}

