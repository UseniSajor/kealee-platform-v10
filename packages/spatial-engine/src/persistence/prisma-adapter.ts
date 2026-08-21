/**
 * Prisma adapter for `SitePlanStore`.
 *
 * The client is accepted structurally rather than imported, so this package
 * still builds and tests without `@prisma/client` present. Callers pass their
 * existing client from `@kealee/database`; nothing new is instantiated here, so
 * there is one connection pool for the process as there was before.
 *
 * Every write is an upsert on the natural key declared in the migration, so a
 * retried ingestion converges instead of duplicating.
 */

import type {
  SitePlanStore, ChecklistResultRow, RuleVersionRow,
} from './store'
import type {
  SurveyImportRow, SurveyPointRow, ReconciliationRunRow, DiscrepancyRow,
  EvidenceRow, ScopedApprovalRow, QcFindingRow, SheetRow, SheetRevisionRow,
  IssuanceRow, AuditEventRow,
} from './records'

/** The slice of a Prisma client this adapter uses. */
export interface PrismaLike {
  surveyImport: Delegate
  surveyPoint: Delegate
  surveyReconciliationRun: Delegate
  surveyDiscrepancy: Delegate
  sitePlanEvidence: Delegate
  sitePlanScopedApproval: Delegate
  sitePlanChecklistResult: Delegate
  sitePlanQcFinding: Delegate
  sitePlanSheet: Delegate
  sitePlanSheetRevision: Delegate
  sitePlanIssuance: Delegate
  sitePlanAuditEvent: Delegate
  jurisdictionRuleVersion: Delegate
  $transaction<T>(fn: (tx: PrismaLike) => Promise<T>): Promise<T>
}

interface Delegate {
  create(args: { data: unknown }): Promise<unknown>
  createMany(args: { data: unknown[]; skipDuplicates?: boolean }): Promise<unknown>
  upsert(args: { where: unknown; create: unknown; update: unknown }): Promise<unknown>
  deleteMany(args: { where: unknown }): Promise<unknown>
}

/** Dates arrive as ISO strings from the engine; Prisma wants Date objects. */
const d = (v: string | null | undefined): Date | null => {
  if (!v) return null
  const parsed = new Date(v)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export class PrismaSitePlanStore implements SitePlanStore {
  constructor(private readonly prisma: PrismaLike) {}

  async upsertRuleVersions(rows: RuleVersionRow[]): Promise<void> {
    for (const r of rows) {
      await this.prisma.jurisdictionRuleVersion.upsert({
        where: { jurisdictionCode_ruleKey_version: { jurisdictionCode: r.jurisdictionCode, ruleKey: r.ruleKey, version: r.version } },
        create: {
          id: r.id,
          jurisdictionCode: r.jurisdictionCode,
          agency: r.agency,
          ruleKey: r.ruleKey,
          version: r.version,
          kind: r.kind,
          sourceUrl: r.sourceUrl,
          section: r.section,
          effectiveDate: d(r.effectiveDate),
          lastVerifiedAt: d(r.lastVerifiedAt),
          confidence: r.confidence,
          humanReviewRequired: r.humanReviewRequired,
          payload: r.payload,
        },
        update: {
          sourceUrl: r.sourceUrl,
          section: r.section,
          effectiveDate: d(r.effectiveDate),
          lastVerifiedAt: d(r.lastVerifiedAt),
          confidence: r.confidence,
          humanReviewRequired: r.humanReviewRequired,
          payload: r.payload,
        },
      })
    }
  }

  async upsertSurveyImport(row: SurveyImportRow): Promise<void> {
    const data = {
      ...row,
      uploadedAt: d(row.uploadedAt),
      surveyDate: d(row.surveyDate),
      surveyorLicenceVerifiedAt: d(row.surveyorLicenceVerifiedAt),
      sealSignedAt: d(row.sealSignedAt),
      crsConfirmedAt: d(row.crsConfirmedAt),
    }
    await this.prisma.surveyImport.upsert({
      where: { organizationId_checksum: { organizationId: row.organizationId, checksum: row.checksum } },
      create: data,
      // The identity columns are the natural key and never change on a re-import.
      update: (({ id, organizationId, checksum, ...rest }) => rest)(data),
    })
  }

  async replaceSurveyPoints(importId: string, rows: SurveyPointRow[]): Promise<void> {
    await this.prisma.surveyPoint.deleteMany({ where: { importId } })
    if (rows.length) await this.prisma.surveyPoint.createMany({ data: rows, skipDuplicates: true })
  }

  async insertReconciliationRun(run: ReconciliationRunRow, discrepancies: DiscrepancyRow[]): Promise<void> {
    await this.prisma.surveyReconciliationRun.create({ data: run })
    if (discrepancies.length) {
      await this.prisma.surveyDiscrepancy.createMany({ data: discrepancies })
    }
  }

  async insertEvidence(rows: EvidenceRow[]): Promise<void> {
    if (!rows.length) return
    await this.prisma.sitePlanEvidence.createMany({
      data: rows.map(r => ({ ...r, attachedAt: d(r.attachedAt) })),
      skipDuplicates: true,
    })
  }

  async upsertScopedApprovals(rows: ScopedApprovalRow[]): Promise<void> {
    for (const r of rows) {
      const data = { ...r, decidedAt: d(r.decidedAt) }
      await this.prisma.sitePlanScopedApproval.upsert({
        where: { id: r.id },
        create: data,
        update: (({ id, workflowId, subject, ...rest }) => rest)(data),
      })
    }
  }

  async upsertChecklistResults(rows: ChecklistResultRow[]): Promise<void> {
    for (const r of rows) {
      await this.prisma.sitePlanChecklistResult.upsert({
        where: { workflowId_itemKey: { workflowId: r.workflowId, itemKey: r.itemKey } },
        create: r,
        update: (({ workflowId, itemKey, ...rest }) => rest)(r),
      })
    }
  }

  async replaceQcFindings(workflowId: string, runId: string, rows: QcFindingRow[]): Promise<void> {
    // A QC run is a snapshot: re-running the same run id replaces its findings
    // rather than accumulating them.
    await this.prisma.sitePlanQcFinding.deleteMany({ where: { workflowId, runId } })
    if (rows.length) {
      await this.prisma.sitePlanQcFinding.createMany({
        data: rows.map(r => ({ ...r, clearedAt: d(r.clearedAt) })),
      })
    }
  }

  async upsertSheets(rows: SheetRow[]): Promise<void> {
    for (const r of rows) {
      await this.prisma.sitePlanSheet.upsert({
        where: { workflowId_sheetNumber: { workflowId: r.workflowId, sheetNumber: r.sheetNumber } },
        create: r,
        update: (({ id, workflowId, sheetNumber, ...rest }) => rest)(r),
      })
    }
  }

  async insertSheetRevisions(rows: SheetRevisionRow[]): Promise<void> {
    if (!rows.length) return
    await this.prisma.sitePlanSheetRevision.createMany({
      data: rows.map(r => ({ ...r, revisionDate: d(r.revisionDate) })),
      skipDuplicates: true,
    })
  }

  async upsertIssuance(row: IssuanceRow): Promise<void> {
    await this.prisma.sitePlanIssuance.upsert({
      where: { workflowId: row.workflowId },
      create: row,
      update: (({ workflowId, ...rest }) => rest)(row),
    })
  }

  async appendAudit(rows: AuditEventRow[]): Promise<void> {
    if (!rows.length) return
    // Append-only: never upserted, never updated, never deleted.
    await this.prisma.sitePlanAuditEvent.createMany({ data: rows })
  }

  async transaction<T>(fn: (store: SitePlanStore) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(tx => fn(new PrismaSitePlanStore(tx)))
  }
}
