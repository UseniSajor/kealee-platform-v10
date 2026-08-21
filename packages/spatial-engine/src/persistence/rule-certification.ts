/**
 * Persistence for the certifiable-rule model.
 *
 * Extends the Phase 3B `SitePlanStore` pattern rather than introducing a second
 * persistence system: a port with row mappers, a Prisma adapter supplied by the
 * caller, and an in-memory implementation for tests and dry runs.
 *
 * The one behaviour worth stating up front: certification history and audit
 * events are append-only in this layer too. `upsertCertification` never mutates
 * a prior record — withdrawing one writes `active = false` and leaves the row.
 */

import type { CertifiableRule, CertificationRecord, RuleAuditEvent, SourceReconciliation } from '../rules/certification'
import type { RulePack } from '../rules/pack'
import type { AuthoritativeSource, ChangeDetectionResult } from '../rules/change-detection'
import type { ApplicabilityModel } from '../rules/applicability'
import type { RuleProvenance } from '../rules/model'

// ── Rows ────────────────────────────────────────────────────────────────────

export interface RuleSourceRow {
  id: string
  jurisdictionCode: string
  title: string
  authority: string
  url: string | null
  documentId: string | null
  documentHash: string
  version: string
  retrievedAt: string
  lastFetchError: string | null
  lastFetchAttempt: string | null
}

export interface RuleSourceVersionRow {
  sourceId: string
  version: string
  documentHash: string
  retrievedAt: string
  supersededAt: string
}

export interface RuleSourceRegionRow {
  sourceId: string
  regionId: string
  label: string
  hash: string
  ruleIdentities: string[]
  retrievedAt: string
}

export interface CertifiableRuleRow {
  identity: string
  jurisdictionCode: string
  ruleKey: string
  version: number
  state: string
  codeSection: string
  ruleType: string
  scopeKey: Record<string, string>
  effectiveVersion: string
  value: string | null
  payload: unknown
  extractionConfidence: number
  authorityConfidence: number
  applicabilityConfidence: number
  consistencyConfidence: number | null
  sourceFreshnessConfidence: number | null
  sourceId: string | null
  sourceRegionId: string | null
  supersededByIdentity: string | null
  sourceIssues: string[]
  humanReviewRequired: boolean
  humanReviewReasons: string[]
}

export interface RuleProvenanceRow extends Omit<RuleProvenance, 'gaps' | 'textLocation'> {
  ruleIdentity: string
  textLocation: unknown
  gaps: string[]
}

export interface RuleApplicabilityRow {
  ruleIdentity: string
  condition: unknown
  overriddenBy: unknown
  footnotes: unknown
  incompleteReason: string | null
}

export interface RuleReconciliationRow {
  ruleIdentity: string
  status: string
  sourceALabel: string | null
  sourceAAuthority: string | null
  sourceAUrl: string | null
  sourceAHash: string | null
  sourceARawValue: string | null
  sourceANormalized: string | null
  sourceBLabel: string | null
  sourceBAuthority: string | null
  sourceBUrl: string | null
  sourceBHash: string | null
  sourceBRawValue: string | null
  sourceBNormalized: string | null
  matched: boolean | null
  discrepancy: string | null
  note: string
  reconciledAt: string
}

export interface RuleCertificationRow {
  id: string
  ruleIdentity: string
  jurisdiction: string
  ruleKey: string
  ruleVersion: number
  reviewerId: string
  reviewerName: string
  reviewerRole: string
  reviewerLicenceNumber: string | null
  certifiedAt: string
  sourceHash: string
  sourceVersion: string
  note: string
  certificationScope: Record<string, string>
  expiresAt: string | null
  active: boolean
  revokedAt: string | null
  revokedReason: string | null
  rulePackVersion: string | null
  reviewItemId: string | null
}

export interface RulePackVersionRow {
  jurisdictionCode: string
  packVersion: string
  status: string
  effectiveDate: string
  sources: unknown
  certifiedCount: number
  verifiedCount: number
  provisionalCount: number
  extractedCount: number
  supersededCount: number
  revokedCount: number
  humanReviewRequiredCount: number
  coreCount: number
  coreCertifiedCount: number
  unresolvedSourceIssues: unknown
  certificationCoverage: number
  coreCertificationCoverage: number
  statusRationale: string
  lastRefreshedAt: string | null
  lastCertifiedAt: string | null
  supersededByVersion: string | null
}

export interface RulePackMemberRow {
  rulePackId: string
  ruleIdentity: string
  ruleKey: string
  tier: string
  state: string
  humanReviewRequired: boolean
}

export interface RuleAuditEventRow {
  id: string
  ruleIdentity: string
  jurisdiction: string
  ruleKey: string
  ruleVersion: number
  previousState: string | null
  newState: string | null
  action: string
  actorId: string
  actorName: string
  actorRole: string
  occurredAt: string
  reason: string
  sourceHash: string | null
  sourceVersion: string | null
  reviewItemId: string | null
  rulePackVersion: string | null
  affectedProjectIds: string[]
  metadata: unknown
}

export interface RuleSourceChangeEventRow {
  sourceId: string
  jurisdictionCode: string
  changed: boolean
  previousVersion: string
  currentVersion: string
  documentHashBefore: string
  documentHashAfter: string
  changes: unknown
  affectedRuleIdentities: string[]
  unaffectedRuleIdentities: string[]
  scopeIsolated: boolean
  summary: string
  detectedAt: string
}

// ── Mappers ─────────────────────────────────────────────────────────────────

export function certifiableRuleRow(rule: CertifiableRule, sourceId?: string, sourceRegionId?: string): CertifiableRuleRow {
  return {
    identity: rule.identity,
    jurisdictionCode: rule.scope.jurisdiction,
    ruleKey: rule.ruleKey,
    version: rule.version,
    state: rule.state,
    codeSection: rule.scope.codeSection,
    ruleType: rule.scope.ruleType,
    scopeKey: rule.scope.scopeKey,
    effectiveVersion: rule.scope.effectiveVersion,
    value: rule.value,
    payload: rule.payload ?? null,
    extractionConfidence: rule.confidence.extractionConfidence,
    authorityConfidence: rule.confidence.authorityConfidence,
    applicabilityConfidence: rule.confidence.applicabilityConfidence,
    consistencyConfidence: rule.confidence.consistencyConfidence ?? null,
    sourceFreshnessConfidence: rule.confidence.sourceFreshnessConfidence ?? null,
    sourceId: sourceId ?? null,
    sourceRegionId: sourceRegionId ?? null,
    supersededByIdentity: rule.supersededByIdentity ?? null,
    sourceIssues: rule.sourceIssues,
    humanReviewRequired: rule.humanReviewRequired,
    humanReviewReasons: rule.humanReviewReasons,
  }
}

export function ruleProvenanceRow(identity: string, p: RuleProvenance): RuleProvenanceRow {
  return { ...p, ruleIdentity: identity, textLocation: p.textLocation ?? null, gaps: p.gaps ?? [] }
}

export function ruleApplicabilityRow(identity: string, a: ApplicabilityModel): RuleApplicabilityRow {
  return {
    ruleIdentity: identity,
    condition: a.condition,
    overriddenBy: a.overriddenBy ?? [],
    footnotes: a.footnotes ?? [],
    incompleteReason: a.incompleteReason ?? null,
  }
}

export function ruleReconciliationRow(identity: string, r: SourceReconciliation): RuleReconciliationRow {
  return {
    ruleIdentity: identity,
    status: r.status,
    sourceALabel: r.sourceA?.label ?? null,
    sourceAAuthority: r.sourceA?.authority ?? null,
    sourceAUrl: r.sourceA?.sourceUrl ?? null,
    sourceAHash: r.sourceA?.sourceHash ?? null,
    sourceARawValue: r.sourceA?.rawValue ?? null,
    sourceANormalized: r.sourceA?.normalizedValue ?? null,
    sourceBLabel: r.sourceB?.label ?? null,
    sourceBAuthority: r.sourceB?.authority ?? null,
    sourceBUrl: r.sourceB?.sourceUrl ?? null,
    sourceBHash: r.sourceB?.sourceHash ?? null,
    sourceBRawValue: r.sourceB?.rawValue ?? null,
    sourceBNormalized: r.sourceB?.normalizedValue ?? null,
    matched: r.match,
    discrepancy: r.discrepancy,
    note: r.note,
    reconciledAt: r.reconciledAt,
  }
}

export function ruleCertificationRow(c: CertificationRecord, rulePackVersion?: string | null, reviewItemId?: string | null): RuleCertificationRow {
  return {
    id: c.id,
    ruleIdentity: c.ruleIdentity,
    jurisdiction: c.jurisdiction,
    ruleKey: c.ruleKey,
    ruleVersion: c.ruleVersion,
    reviewerId: c.reviewerId,
    reviewerName: c.reviewerName,
    reviewerRole: c.reviewerRole,
    reviewerLicenceNumber: c.reviewerLicenceNumber,
    certifiedAt: c.certifiedAt,
    sourceHash: c.sourceHash,
    sourceVersion: c.sourceVersion,
    note: c.note,
    certificationScope: c.certificationScope,
    expiresAt: c.expiresAt,
    active: c.active,
    revokedAt: c.revokedAt,
    revokedReason: c.revokedReason,
    rulePackVersion: rulePackVersion ?? null,
    reviewItemId: reviewItemId ?? null,
  }
}

export function rulePackVersionRow(pack: RulePack, supersededByVersion?: string | null): RulePackVersionRow {
  return {
    jurisdictionCode: pack.jurisdiction,
    packVersion: pack.packVersion,
    status: pack.status,
    effectiveDate: pack.effectiveDate,
    sources: pack.sources,
    certifiedCount: pack.certifiedCount,
    verifiedCount: pack.verifiedCount,
    provisionalCount: pack.provisionalCount,
    extractedCount: pack.extractedCount,
    supersededCount: pack.supersededCount,
    revokedCount: pack.revokedCount,
    humanReviewRequiredCount: pack.humanReviewRequiredCount,
    coreCount: pack.coreCount,
    coreCertifiedCount: pack.coreCertifiedCount,
    unresolvedSourceIssues: pack.unresolvedSourceIssues,
    certificationCoverage: pack.certificationCoverage,
    coreCertificationCoverage: pack.coreCertificationCoverage,
    statusRationale: pack.statusRationale,
    lastRefreshedAt: pack.lastRefreshedAt,
    lastCertifiedAt: pack.lastCertifiedAt,
    supersededByVersion: supersededByVersion ?? null,
  }
}

export function ruleAuditEventRow(e: RuleAuditEvent): RuleAuditEventRow {
  return {
    id: e.id,
    ruleIdentity: e.ruleIdentity,
    jurisdiction: e.jurisdiction,
    ruleKey: e.ruleKey,
    ruleVersion: e.ruleVersion,
    previousState: e.previousState,
    newState: e.newState,
    action: e.action,
    actorId: e.actorId,
    actorName: e.actorName,
    actorRole: e.actorRole,
    occurredAt: e.occurredAt,
    reason: e.reason,
    sourceHash: e.sourceHash,
    sourceVersion: e.sourceVersion,
    reviewItemId: e.reviewItemId,
    rulePackVersion: e.rulePackVersion,
    affectedProjectIds: e.affectedProjectIds,
    metadata: e.metadata ?? null,
  }
}

export function sourceRows(s: AuthoritativeSource, authority: string): {
  source: RuleSourceRow
  versions: RuleSourceVersionRow[]
  regions: RuleSourceRegionRow[]
} {
  return {
    source: {
      id: s.sourceId,
      jurisdictionCode: s.jurisdiction,
      title: s.title,
      authority,
      url: s.url,
      documentId: s.documentId,
      documentHash: s.documentHash,
      version: s.version,
      retrievedAt: s.retrievedAt,
      lastFetchError: null,
      lastFetchAttempt: null,
    },
    versions: s.history.map(h => ({
      sourceId: s.sourceId,
      version: h.version,
      documentHash: h.documentHash,
      retrievedAt: h.retrievedAt,
      supersededAt: h.supersededAt,
    })),
    regions: s.regions.map(r => ({
      sourceId: s.sourceId,
      regionId: r.regionId,
      label: r.label,
      hash: r.hash,
      ruleIdentities: r.ruleIdentities,
      retrievedAt: s.retrievedAt,
    })),
  }
}

export function sourceChangeEventRow(c: ChangeDetectionResult): RuleSourceChangeEventRow {
  return {
    sourceId: c.sourceId,
    jurisdictionCode: c.jurisdiction,
    changed: c.changed,
    previousVersion: c.previousVersion,
    currentVersion: c.currentVersion,
    documentHashBefore: c.documentHashBefore,
    documentHashAfter: c.documentHashAfter,
    changes: c.changes,
    affectedRuleIdentities: c.affectedRuleIdentities,
    unaffectedRuleIdentities: c.unaffectedRuleIdentities,
    scopeIsolated: c.scopeIsolated,
    summary: c.summary,
    detectedAt: c.detectedAt,
  }
}

// ── The port ────────────────────────────────────────────────────────────────

export interface RuleCertificationStore {
  upsertSource(row: RuleSourceRow): Promise<void>
  appendSourceVersions(rows: RuleSourceVersionRow[]): Promise<void>
  upsertSourceRegions(rows: RuleSourceRegionRow[]): Promise<void>
  upsertRules(rows: CertifiableRuleRow[]): Promise<void>
  upsertProvenance(rows: RuleProvenanceRow[]): Promise<void>
  upsertApplicability(rows: RuleApplicabilityRow[]): Promise<void>
  insertReconciliations(rows: RuleReconciliationRow[]): Promise<void>
  /** Appends a certification. Never mutates a prior record. */
  appendCertification(row: RuleCertificationRow): Promise<void>
  /** Marks the active certification for a rule withdrawn, keeping the row. */
  deactivateCertification(ruleIdentity: string, revokedAt: string, reason: string): Promise<void>
  upsertRulePack(row: RulePackVersionRow): Promise<string>
  replaceRulePackMembers(rulePackId: string, rows: RulePackMemberRow[]): Promise<void>
  appendRuleAudit(rows: RuleAuditEventRow[]): Promise<void>
  insertSourceChangeEvent(row: RuleSourceChangeEventRow): Promise<void>
  transaction<T>(fn: (store: RuleCertificationStore) => Promise<T>): Promise<T>
}

/** In-memory implementation, for tests and dry runs. */
export class InMemoryRuleCertificationStore implements RuleCertificationStore {
  sources: RuleSourceRow[] = []
  sourceVersions: RuleSourceVersionRow[] = []
  sourceRegions: RuleSourceRegionRow[] = []
  rules: CertifiableRuleRow[] = []
  provenance: RuleProvenanceRow[] = []
  applicability: RuleApplicabilityRow[] = []
  reconciliations: RuleReconciliationRow[] = []
  certifications: RuleCertificationRow[] = []
  packs: (RulePackVersionRow & { id: string })[] = []
  packMembers: RulePackMemberRow[] = []
  audit: RuleAuditEventRow[] = []
  sourceChanges: RuleSourceChangeEventRow[] = []

  private upsertBy<T>(list: T[], row: T, key: (r: T) => string): void {
    const i = list.findIndex(r => key(r) === key(row))
    if (i >= 0) list[i] = row
    else list.push(row)
  }

  async upsertSource(row: RuleSourceRow) { this.upsertBy(this.sources, row, r => r.id) }

  async appendSourceVersions(rows: RuleSourceVersionRow[]) {
    for (const r of rows) {
      // Append-only, deduplicated on the natural key.
      if (!this.sourceVersions.some(x => x.sourceId === r.sourceId && x.documentHash === r.documentHash)) {
        this.sourceVersions.push(r)
      }
    }
  }

  async upsertSourceRegions(rows: RuleSourceRegionRow[]) {
    for (const r of rows) this.upsertBy(this.sourceRegions, r, x => `${x.sourceId}|${x.regionId}`)
  }

  async upsertRules(rows: CertifiableRuleRow[]) {
    for (const r of rows) this.upsertBy(this.rules, r, x => x.identity)
  }

  async upsertProvenance(rows: RuleProvenanceRow[]) {
    for (const r of rows) this.upsertBy(this.provenance, r, x => x.ruleIdentity)
  }

  async upsertApplicability(rows: RuleApplicabilityRow[]) {
    for (const r of rows) this.upsertBy(this.applicability, r, x => x.ruleIdentity)
  }

  async insertReconciliations(rows: RuleReconciliationRow[]) { this.reconciliations.push(...rows) }

  async appendCertification(row: RuleCertificationRow) {
    // History is never overwritten — a re-certification is a new row.
    this.certifications.push(row)
  }

  async deactivateCertification(ruleIdentity: string, revokedAt: string, reason: string) {
    for (const c of this.certifications) {
      if (c.ruleIdentity === ruleIdentity && c.active) {
        c.active = false
        c.revokedAt = revokedAt
        c.revokedReason = reason
      }
    }
  }

  async upsertRulePack(row: RulePackVersionRow): Promise<string> {
    const key = `${row.jurisdictionCode}|${row.packVersion}`
    const existing = this.packs.find(p => `${p.jurisdictionCode}|${p.packVersion}` === key)
    if (existing) {
      Object.assign(existing, row)
      return existing.id
    }
    const id = `pack_${key.replace(/[^a-z0-9]+/gi, '_')}`
    this.packs.push({ ...row, id })
    return id
  }

  async replaceRulePackMembers(rulePackId: string, rows: RulePackMemberRow[]) {
    this.packMembers = this.packMembers.filter(m => m.rulePackId !== rulePackId).concat(rows)
  }

  async appendRuleAudit(rows: RuleAuditEventRow[]) { this.audit.push(...rows) }

  async insertSourceChangeEvent(row: RuleSourceChangeEventRow) { this.sourceChanges.push(row) }

  async transaction<T>(fn: (store: RuleCertificationStore) => Promise<T>): Promise<T> {
    return fn(this)
  }
}

// ── Persisting a maintenance cycle ──────────────────────────────────────────

export interface PersistRuleStateInput {
  rules: CertifiableRule[]
  pack?: RulePack
  coreRuleKeys?: string[]
  source?: { source: AuthoritativeSource; authority: string }
  change?: ChangeDetectionResult
  audits?: RuleAuditEvent[]
  newCertifications?: CertificationRecord[]
  withdrawnCertifications?: { ruleIdentity: string; revokedAt: string; reason: string }[]
}

export interface PersistRuleStateResult {
  rulesWritten: number
  certificationsAppended: number
  certificationsWithdrawn: number
  auditEventsAppended: number
  packId: string | null
}

/**
 * Writes a rule-maintenance cycle. Runs in one transaction because a rule whose
 * state says CERTIFIED with no certification row behind it is a record that lies.
 */
export async function persistRuleState(
  store: RuleCertificationStore,
  input: PersistRuleStateInput,
): Promise<PersistRuleStateResult> {
  return store.transaction(async tx => {
    if (input.source) {
      const rows = sourceRows(input.source.source, input.source.authority)
      await tx.upsertSource(rows.source)
      await tx.appendSourceVersions(rows.versions)
      await tx.upsertSourceRegions(rows.regions)
    }

    await tx.upsertRules(input.rules.map(r => certifiableRuleRow(r, input.source?.source.sourceId)))
    await tx.upsertProvenance(input.rules.map(r => ruleProvenanceRow(r.identity, r.provenance)))
    await tx.upsertApplicability(input.rules.map(r => ruleApplicabilityRow(r.identity, r.applicability)))
    await tx.insertReconciliations(
      input.rules
        // A NOT_REQUIRED reconciliation carries no information worth a row.
        .filter(r => r.reconciliation.status !== 'NOT_REQUIRED')
        .map(r => ruleReconciliationRow(r.identity, r.reconciliation)),
    )

    // Appends run before withdrawals. A withdrawal always targets a
    // certification that already exists — including one created earlier in this
    // same cycle — so doing it the other way round leaves a withdrawn rule
    // holding an active certification row.
    for (const c of input.newCertifications ?? []) {
      await tx.appendCertification(ruleCertificationRow(c, input.pack?.packVersion))
    }
    for (const w of input.withdrawnCertifications ?? []) {
      await tx.deactivateCertification(w.ruleIdentity, w.revokedAt, w.reason)
    }

    let packId: string | null = null
    if (input.pack) {
      packId = await tx.upsertRulePack(rulePackVersionRow(input.pack))
      await tx.replaceRulePackMembers(packId, input.pack.members.map(m => ({
        rulePackId: packId as string,
        ruleIdentity: m.ruleIdentity,
        ruleKey: m.ruleKey,
        tier: m.tier,
        state: m.state,
        humanReviewRequired: m.humanReviewRequired,
      })))
    }

    if (input.change) await tx.insertSourceChangeEvent(sourceChangeEventRow(input.change))
    if (input.audits?.length) await tx.appendRuleAudit(input.audits.map(ruleAuditEventRow))

    return {
      rulesWritten: input.rules.length,
      certificationsAppended: input.newCertifications?.length ?? 0,
      certificationsWithdrawn: input.withdrawnCertifications?.length ?? 0,
      auditEventsAppended: input.audits?.length ?? 0,
      packId,
    }
  })
}
