/**
 * The artifact registry — `ingestArtifact`, `versionArtifact`, `getArtifact`,
 * `findArtifacts`, `setApproval`.
 *
 * Rules the code enforces, not just documents:
 *  - An artifact is identified by (sourceSystem, sourceRecordId, version);
 *    re-ingesting the same record with the same checksum returns the existing
 *    artifact rather than a duplicate; a different checksum becomes a NEW
 *    VERSION (history kept), never an overwrite.
 *  - Approval is a ladder climbed only by a named actor: `setApproval` records
 *    who, and refuses to let an 'agent' actor set HUMAN_*, PROFESSIONAL_SEALED
 *    or JURISDICTION_APPROVED.
 *  - Secrets are redacted from summaries and metadata before they are stored.
 */
import { createHash } from 'node:crypto'
import type { KnowledgeDb } from '../db'
import type { EventSink } from '../events'
import { KNOWLEDGE_EVENTS, MemoryEventSink } from '../events'
import { authorityFor, defaultRetrievalEligibility, defaultTrainingEligibility, redactJson, redactSecrets } from '../policies'
import type {
  IngestArtifactInput, KnowledgeApprovalStatus, KnowledgeArtifactRecord, KnowledgeArtifactType, VersionArtifactInput,
} from '../types'

export function checksumOf(content: unknown): string {
  const h = createHash('sha256')
  if (content instanceof Uint8Array) h.update(content)
  else h.update(typeof content === 'string' ? content : JSON.stringify(content))
  return h.digest('hex')
}

const GENERATED_TYPES: KnowledgeArtifactType[] = ['SITE_PLAN', 'DESIGN_CONCEPT', 'RENDERING', 'YIELD_STUDY', 'FEASIBILITY_REPORT', 'PERMIT_PACKAGE', 'ESTIMATE', 'SCHEDULE', 'MODEL_RESPONSE', 'CODE_CHANGE']

export class KnowledgeRegistry {
  constructor(private readonly db: KnowledgeDb, private readonly events: EventSink = new MemoryEventSink(), private readonly log: (m: string) => void = () => {}) {}

  /** Registers (or re-finds) the source system. */
  async ensureSource(key: string, defaults?: { name?: string; kind?: string; defaultAuthority?: string; defaultTrainingEligibility?: string }): Promise<{ id: string; key: string }> {
    const existing = await this.db.knowledgeSource.findUnique({ where: { key } })
    if (existing) return existing
    return this.db.knowledgeSource.create({ data: { key, name: defaults?.name ?? key, kind: defaults?.kind ?? 'engine', defaultAuthority: defaults?.defaultAuthority ?? 'AI_GENERATED_DRAFT', defaultTrainingEligibility: defaults?.defaultTrainingEligibility ?? 'UNKNOWN' } })
  }

  /**
   * One identity per thing. Same (sourceSystem, sourceRecordId) + same checksum
   * → the existing artifact. Same record, different checksum → a new version of
   * it (see `versionArtifact`). Otherwise a new artifact at version 1.
   */
  async ingestArtifact(input: IngestArtifactInput): Promise<{ artifact: KnowledgeArtifactRecord; created: boolean; versioned: boolean }> {
    const checksum = input.checksum ?? (input.content !== undefined ? checksumOf(input.content) : input.bytes ? checksumOf(input.bytes) : null)
    const approvalStatus: KnowledgeApprovalStatus = input.approvalStatus ?? (input.generatedByAgent || input.generatedByModel || input.generationRunId ? 'AI_GENERATED' : 'UNREVIEWED')
    const confidentiality = input.confidentiality ?? 'CUSTOMER_CONFIDENTIAL'
    const generated = Boolean(input.generatedByAgent || input.generatedByModel || input.generationRunId) || GENERATED_TYPES.includes(input.artifactType)
    const authority = authorityFor(approvalStatus, input.artifactType, input.authority ?? null)
    const source = input.sourceKey ? await this.ensureSource(input.sourceKey) : null
    const summary = input.summary ? redactSecrets(input.summary) : null
    const meta = redactJson(input.metadata ?? null)
    if ((summary?.redactions ?? 0) + meta.redactions > 0) this.log(`[knowledge] ${(summary?.redactions ?? 0) + meta.redactions} secret(s) redacted from "${input.title}"`)

    if (input.sourceSystem && input.sourceRecordId) {
      const latest = await this.db.knowledgeArtifact.findFirst({ where: { sourceSystem: input.sourceSystem, sourceRecordId: input.sourceRecordId }, orderBy: { version: 'desc' } })
      if (latest) {
        if (latest.checksum && checksum && latest.checksum === checksum) return { artifact: latest, created: false, versioned: false }
        if (checksum) {
          const v = await this.versionArtifact({ artifactId: latest.id, checksum, storageUri: input.storageUri ?? latest.storageUri, changeSummary: `Re-ingested from ${input.sourceSystem}/${input.sourceRecordId} with new content`, changedByAgent: input.generatedByAgent ?? null, changedById: input.uploadedById ?? null, approvalStatus, patch: { metadata: meta.value ?? undefined, summary: summary?.text } })
          return { artifact: v, created: false, versioned: true }
        }
        return { artifact: latest, created: false, versioned: false }
      }
    }

    const data = {
      organizationId: input.organizationId ?? null, projectId: input.projectId ?? null, orderId: input.orderId ?? null,
      artifactType: input.artifactType, artifactSubtype: input.artifactSubtype ?? null, discipline: input.discipline ?? null,
      sourceId: source?.id ?? null, sourceSystem: input.sourceSystem ?? null, sourceRecordId: input.sourceRecordId ?? null,
      sourceUri: input.sourceUri ?? null, storageUri: input.storageUri ?? null, mimeType: input.mimeType ?? null, filename: input.filename ?? null,
      checksum, fileSize: input.fileSize ?? (input.bytes ? input.bytes.byteLength : null),
      title: input.title, summary: summary?.text ?? null, capturedAt: input.capturedAt ?? null, uploadedById: input.uploadedById ?? null,
      generatedByAgent: input.generatedByAgent ?? null, generatedByModel: input.generatedByModel ?? null, generationRunId: input.generationRunId ?? null,
      version: 1, parentArtifactId: input.parentArtifactId ?? null, supersedesArtifactId: input.supersedesArtifactId ?? null,
      status: input.status ?? 'RAW', approvalStatus, authority,
      jurisdiction: input.jurisdiction ?? null, projectPhase: input.projectPhase ?? null, constructionPhase: input.constructionPhase ?? null,
      confidentiality, retentionClass: input.retentionClass ?? 'PROJECT_RECORD',
      trainingEligibility: defaultTrainingEligibility({ approvalStatus, confidentiality, generated, explicit: input.trainingEligibility ?? null }),
      retrievalEligibility: defaultRetrievalEligibility(confidentiality, input.retrievalEligibility ?? null),
      qualityScore: input.qualityScore ?? null, confidenceScore: input.confidenceScore ?? null, metadata: meta.value ?? null,
    }
    const artifact: KnowledgeArtifactRecord = await this.db.knowledgeArtifact.create({ data })
    await this.db.knowledgeArtifactVersion.create({ data: { artifactId: artifact.id, version: 1, checksum, storageUri: data.storageUri, changeSummary: 'Ingested', changedById: input.uploadedById ?? null, changedByAgent: input.generatedByAgent ?? null, approvalStatus, metadata: null } })
    for (const f of input.files ?? []) await this.db.knowledgeArtifactFile.create({ data: { artifactId: artifact.id, ...f, mimeType: f.mimeType ?? null, storageUri: f.storageUri ?? null, checksum: f.checksum ?? null, fileSize: f.fileSize ?? null, pageCount: f.pageCount ?? null, metadata: f.metadata ?? null } })
    const links = input.links ?? (input.projectId || input.orderId ? [{ projectId: input.projectId ?? null, orderId: input.orderId ?? null, parcelId: null, role: generated ? 'deliverable' : 'evidence' }] : [])
    for (const l of links) await this.db.knowledgeProjectLink.create({ data: { artifactId: artifact.id, projectId: l.projectId ?? null, orderId: l.orderId ?? null, parcelId: l.parcelId ?? null, role: l.role ?? 'evidence' } })
    for (const e of input.lineage ?? []) await this.db.knowledgeLineageEdge.create({ data: { subjectId: artifact.id, objectId: e.objectId, relation: e.relation, actorType: input.actor?.type ?? (generated ? 'agent' : 'system'), actorId: input.actor?.id ?? input.generatedByAgent ?? null, generationRunId: input.generationRunId ?? null, note: e.note ?? null } })
    if (input.supersedesArtifactId) {
      await this.db.knowledgeLineageEdge.create({ data: { subjectId: artifact.id, objectId: input.supersedesArtifactId, relation: 'SUPERSEDES', actorType: input.actor?.type ?? 'system', actorId: input.actor?.id ?? null, generationRunId: input.generationRunId ?? null, note: null } })
      await this.db.knowledgeArtifact.update({ where: { id: input.supersedesArtifactId }, data: { status: 'SUPERSEDED' } })
    }
    await this.db.learningEvent.create({ data: { eventType: 'ARTIFACT_INGESTED', organizationId: data.organizationId, projectId: data.projectId, orderId: data.orderId, artifactId: artifact.id, generationRunId: data.generationRunId, actorType: input.actor?.type ?? (generated ? 'agent' : 'system'), actorId: input.actor?.id ?? null, summary: `${input.artifactType} "${input.title}" ingested (${approvalStatus}, ${authority})`, payload: { checksum, sourceSystem: data.sourceSystem, sourceRecordId: data.sourceRecordId } } })
    await this.events.emit({ type: KNOWLEDGE_EVENTS.artifact.created, source: 'knowledge', projectId: data.projectId, orgId: data.organizationId, entity: { type: 'knowledge_artifact', id: artifact.id }, payload: { artifactType: input.artifactType, title: input.title, approvalStatus, authority }, initiatorType: generated ? 'AI' : 'SYSTEM', initiatorId: input.actor?.id ?? 'knowledge' })
    return { artifact, created: true, versioned: false }
  }

  /** A new version of an existing artifact: the history is kept, the head moves. */
  async versionArtifact(input: VersionArtifactInput): Promise<KnowledgeArtifactRecord> {
    const current: KnowledgeArtifactRecord | null = await this.db.knowledgeArtifact.findUnique({ where: { id: input.artifactId } })
    if (!current) throw new Error(`Artifact ${input.artifactId} not found.`)
    const checksum = input.checksum ?? (input.content !== undefined ? checksumOf(input.content) : null)
    const version = current.version + 1
    const meta = input.patch?.metadata ? redactJson({ ...(current.metadata ?? {}), ...input.patch.metadata }).value : current.metadata
    await this.db.knowledgeArtifactVersion.create({ data: { artifactId: current.id, version, checksum, storageUri: input.storageUri ?? current.storageUri, changeSummary: redactSecrets(input.changeSummary).text, changedById: input.changedById ?? null, changedByAgent: input.changedByAgent ?? null, approvalStatus: input.approvalStatus ?? current.approvalStatus, metadata: input.metadata ?? null } })
    const { metadata: _m, ...patch } = input.patch ?? {}
    void _m
    const updated: KnowledgeArtifactRecord = await this.db.knowledgeArtifact.update({ where: { id: current.id }, data: { version, checksum: checksum ?? current.checksum, storageUri: input.storageUri ?? current.storageUri, ...(input.approvalStatus ? { approvalStatus: input.approvalStatus } : {}), ...patch, metadata: meta } })
    await this.db.learningEvent.create({ data: { eventType: 'ARTIFACT_VERSIONED', organizationId: current.organizationId, projectId: current.projectId, orderId: current.orderId, artifactId: current.id, generationRunId: current.generationRunId, actorType: input.changedById ? 'user' : input.changedByAgent ? 'agent' : 'system', actorId: input.changedById ?? input.changedByAgent ?? null, summary: `"${current.title}" → v${version}: ${input.changeSummary}`, payload: { checksum } } })
    await this.events.emit({ type: KNOWLEDGE_EVENTS.artifact.versioned, source: 'knowledge', projectId: current.projectId, orgId: current.organizationId, entity: { type: 'knowledge_artifact', id: current.id }, payload: { version, changeSummary: input.changeSummary } })
    return updated
  }

  /**
   * The approval ladder. Software may mark AI_GENERATED or REJECTED; every rung
   * above that is a person's (or a jurisdiction's) act and records who.
   */
  async setApproval(artifactId: string, approvalStatus: KnowledgeApprovalStatus, actor: { type: 'agent' | 'user' | 'system' | 'jurisdiction'; id: string; note?: string }): Promise<KnowledgeArtifactRecord> {
    const humanOnly: KnowledgeApprovalStatus[] = ['HUMAN_REVIEWED', 'HUMAN_APPROVED', 'PROFESSIONAL_SEALED']
    if (humanOnly.includes(approvalStatus) && actor.type !== 'user') throw new Error(`${approvalStatus} can only be set by a person (actor ${actor.type}).`)
    if (approvalStatus === 'JURISDICTION_APPROVED' && actor.type !== 'jurisdiction' && actor.type !== 'user') throw new Error('JURISDICTION_APPROVED is recorded from a jurisdiction record or by staff entering one.')
    const current: KnowledgeArtifactRecord | null = await this.db.knowledgeArtifact.findUnique({ where: { id: artifactId } })
    if (!current) throw new Error(`Artifact ${artifactId} not found.`)
    const authority = authorityFor(approvalStatus, current.artifactType, null)
    const generated = Boolean(current.generatedByAgent || current.generationRunId)
    const trainingEligibility = current.trainingEligibility === 'EXCLUDED' || current.trainingEligibility === 'TRAINING_APPROVED' ? current.trainingEligibility : defaultTrainingEligibility({ approvalStatus, confidentiality: current.confidentiality, generated })
    const updated = await this.db.knowledgeArtifact.update({ where: { id: artifactId }, data: { approvalStatus, authority, trainingEligibility, status: approvalStatus === 'REJECTED' ? current.status : 'REVIEWED' } })
    await this.db.learningEvent.create({ data: { eventType: approvalStatus === 'REJECTED' ? 'GENERATION_REJECTED' : 'HUMAN_FEEDBACK', organizationId: current.organizationId, projectId: current.projectId, orderId: current.orderId, artifactId, generationRunId: current.generationRunId, actorType: actor.type, actorId: actor.id, summary: `"${current.title}" marked ${approvalStatus} by ${actor.type} ${actor.id}${actor.note ? `: ${actor.note}` : ''}`, payload: { from: current.approvalStatus, to: approvalStatus, authority, trainingEligibility } } })
    return updated
  }

  /** The head version of the artifact a source record maps to, if any. */
  async findBySource(sourceSystem: string, sourceRecordId: string): Promise<KnowledgeArtifactRecord | null> {
    return this.db.knowledgeArtifact.findFirst({ where: { sourceSystem, sourceRecordId }, orderBy: { version: 'desc' } })
  }

  async getArtifact(id: string): Promise<KnowledgeArtifactRecord | null> {
    return this.db.knowledgeArtifact.findUnique({ where: { id } })
  }

  async findArtifacts(where: { organizationId?: string; projectId?: string; orderId?: string; artifactType?: KnowledgeArtifactType; approvalStatus?: KnowledgeApprovalStatus; jurisdiction?: string; trainingEligibility?: string }, take = 100): Promise<KnowledgeArtifactRecord[]> {
    return this.db.knowledgeArtifact.findMany({ where, orderBy: { createdAt: 'desc' }, take })
  }

  /** Corpus counts for the admin console (spec §28). */
  async stats(): Promise<{ artifacts: number; byApproval: Record<string, number>; byType: Record<string, number>; trainingCandidates: number; trainingApproved: number; generationRuns: number; learningEvents: number }> {
    const all: KnowledgeArtifactRecord[] = await this.db.knowledgeArtifact.findMany({ where: {} })
    const byApproval: Record<string, number> = {}, byType: Record<string, number> = {}
    for (const a of all) { byApproval[a.approvalStatus] = (byApproval[a.approvalStatus] ?? 0) + 1; byType[a.artifactType] = (byType[a.artifactType] ?? 0) + 1 }
    return {
      artifacts: all.length, byApproval, byType,
      trainingCandidates: all.filter(a => a.trainingEligibility === 'TRAINING_CANDIDATE').length,
      trainingApproved: all.filter(a => a.trainingEligibility === 'TRAINING_APPROVED').length,
      generationRuns: await this.db.generationRun.count({}),
      learningEvents: await this.db.learningEvent.count({}),
    }
  }
}
