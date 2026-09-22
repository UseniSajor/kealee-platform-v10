/**
 * Adapters: the platform's existing products, described to the registry.
 *
 * Each adapter turns what a producer already has — a workflow's stage
 * outputs, an order's concept JSON, a folder of engine outputs — into one
 * `recordGeneration` call. They are pure functions over data plus the
 * `Knowledge` facade; the producer decides when to call them (the worker
 * after `deliver_preliminary`, the concept route after it writes
 * `conceptOutput`, a script over `output/site-plans/`).
 */
import { createHash } from 'node:crypto'
import type { Knowledge } from '../index'
import type { KnowledgeArtifactRecord, GenerationRunRecord } from '../types'

const sha = (v: unknown) => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex')

// ── Site plan delivered by the engine (worker) ──────────────────────────────

export interface SitePlanDeliveryFacts {
  workflowId: string
  orderId: string
  organizationId?: string | null
  projectId?: string | null
  productId: string | null
  address?: string | null
  jurisdiction?: string | null
  documentId: string
  documentFilename?: string | null
  pageCount?: number | null
  /** The engine's own record of what it drew (`form_data.sitePlanDeliverable`). */
  deliverable: Record<string, unknown>
  /** Stage outputs by job name, for the rules and sources used. */
  stageOutputs?: Record<string, unknown>
  revision?: number
  supersedesArtifactId?: string | null
}

/** Records an engine site plan: the county layers it read as source artifacts, the PDF as the output. */
export async function recordSitePlanDelivery(k: Knowledge, f: SitePlanDeliveryFacts): Promise<{ run: GenerationRunRecord; plan: KnowledgeArtifactRecord }> {
  const property = (f.deliverable.property ?? {}) as Record<string, unknown>
  const terrain = (f.deliverable.terrain ?? {}) as Record<string, unknown>
  // Source artifacts: the county parcel and terrain as the engine saw them — VALIDATED structured data, not AI.
  const parcel = await k.registry.ingestArtifact({
    orderId: f.orderId, organizationId: f.organizationId ?? null, projectId: f.projectId ?? null,
    artifactType: 'DOCUMENT', artifactSubtype: 'county-parcel-record', discipline: 'civil', sourceKey: 'pgatlas',
    sourceSystem: 'pgatlas.parcels', sourceRecordId: String(property.parcelId ?? f.orderId), content: property,
    title: `PGAtlas parcel ${property.parcelId ?? ''} — ${property.matchedAddress ?? f.address ?? ''}`.trim(),
    authority: 'VALIDATED_STRUCTURED_DATA', approvalStatus: 'UNREVIEWED', confidentiality: 'INTERNAL', jurisdiction: f.jurisdiction ?? 'prince_georges_md',
    metadata: { ...property, terrain }, actor: { type: 'system', id: 'site-plan-engine' },
  })
  const rulePack = f.deliverable.rulePackVersion ?? null
  const { run, outputs } = await k.generation.recordGeneration({
    orderId: f.orderId, organizationId: f.organizationId ?? null, projectId: f.projectId ?? null,
    productType: 'site_plan', agent: 'siteplan.drafter', agentVersion: String((f.stageOutputs?.['siteplan.initialize'] as Record<string, unknown> | undefined)?.definitionVersion ?? ''), model: 'deterministic',
    requestSummary: `${f.productId ?? 'site plan'} for ${f.address ?? f.orderId}`, request: { productId: f.productId, address: f.address },
    rulesUsed: rulePack ? { rulePackVersion: rulePack } : null,
    toolsExecuted: Object.keys(f.stageOutputs ?? {}),
    status: 'COMPLETED', workflowId: f.workflowId, startedAt: new Date(String(f.deliverable.deliveredAt ?? Date.now())), completedAt: new Date(String(f.deliverable.deliveredAt ?? Date.now())),
    inputs: [
      { role: 'SOURCE_ARTIFACT', artifactId: parcel.artifact.id },
      ...(rulePack ? [{ role: 'RULE' as const, reference: `rule-pack@${rulePack}` }] : []),
      { role: 'USER_REQUEST', reference: f.orderId, content: { productId: f.productId } },
    ],
    outputs: [{
      artifactType: 'SITE_PLAN', artifactSubtype: f.productId ?? 'preliminary_site_plan', discipline: 'civil', sourceKey: 'site-plan-engine',
      sourceSystem: 'documents', sourceRecordId: f.documentId, content: f.deliverable, filename: f.documentFilename ?? null, mimeType: 'application/pdf',
      title: `Site plan — ${f.address ?? f.orderId}${f.revision ? ` (rev ${f.revision})` : ''}`,
      summary: String(f.deliverable.qc && (f.deliverable.qc as Record<string, unknown>).summary || ''),
      jurisdiction: f.jurisdiction ?? 'prince_georges_md', supersedesArtifactId: f.supersedesArtifactId ?? null,
      files: [{ role: 'primary', filename: f.documentFilename ?? 'site-plan.pdf', mimeType: 'application/pdf', pageCount: f.pageCount ?? null }],
      metadata: { workflowId: f.workflowId, revision: f.revision ?? 0, qc: f.deliverable.qc ?? null, pendingSeal: (f.deliverable.qc as Record<string, unknown> | undefined)?.pendingSeal ?? null },
      links: [{ orderId: f.orderId, role: 'deliverable' }],
    }],
  })
  return { run, plan: outputs[0] }
}

/** A professional's decision on a site plan (route_review outcome) → REVIEWS/APPROVES lineage + approval ladder. */
export async function recordSitePlanReview(k: Knowledge, f: { planArtifactId: string; workflowId: string; orderId: string; state: 'APPROVED' | 'CHANGES_REQUESTED'; sheetRevision: number; disciplines: { discipline: string; state: string; reviewer: { displayName: string; licenceNumber: string | null; licenceState: string | null } | null }[]; redlines: { subject: string; comment: string; decidedByName: string | null }[] }) {
  const review = await k.registry.ingestArtifact({
    orderId: f.orderId, artifactType: 'CODE_REVIEW', artifactSubtype: 'professional-review', discipline: f.disciplines.map(d => d.discipline).join('+'),
    sourceKey: 'professional-review', sourceSystem: 'site_plan_workflows.review', sourceRecordId: `${f.workflowId}:rev${f.sheetRevision}:${f.state}`, content: f,
    title: `Professional review of site plan rev ${f.sheetRevision}: ${f.state}`,
    summary: f.redlines.map(r => `${r.subject}: ${r.comment}`).join(' · ') || 'All subjects approved.',
    approvalStatus: 'HUMAN_REVIEWED', authority: 'HUMAN_REVIEWED_KEALEE_FINAL', confidentiality: 'INTERNAL',
    metadata: { disciplines: f.disciplines, sheetRevision: f.sheetRevision },
    lineage: [{ objectId: f.planArtifactId, relation: f.state === 'APPROVED' ? 'APPROVES' : 'REVIEWS' }],
    actor: { type: 'user', id: f.disciplines.map(d => d.reviewer?.displayName).filter(Boolean).join(', ') || 'reviewer' },
  })
  const reviewerId = f.disciplines.map(d => d.reviewer?.licenceNumber).filter(Boolean).join(',') || 'reviewer'
  const plan = await k.registry.setApproval(f.planArtifactId, f.state === 'APPROVED' ? 'HUMAN_APPROVED' : 'HUMAN_REVIEWED', { type: 'user', id: reviewerId, note: f.state })
  return { review: review.artifact, plan }
}

// ── Design concept (web-main concept generator) ─────────────────────────────

export interface ConceptGenerationFacts {
  intakeId: string
  organizationId?: string | null
  projectPath: string
  tier: number
  address?: string | null
  clientName?: string | null
  model: string
  promptText?: string | null
  request: Record<string, unknown>
  conceptOutput: Record<string, unknown>
  renderUrls?: string[]
  pdfUrl?: string | null
  generation: number
  /** Present when this generation answers an architect's send-back. */
  designerDirection?: string | null
  supersedesArtifactId?: string | null
}

export async function recordConceptGeneration(k: Knowledge, f: ConceptGenerationFacts): Promise<{ run: GenerationRunRecord; concept: KnowledgeArtifactRecord; renders: KnowledgeArtifactRecord[] }> {
  const request = await k.registry.ingestArtifact({
    orderId: f.intakeId, organizationId: f.organizationId ?? null, artifactType: 'DOCUMENT', artifactSubtype: 'concept-programme', sourceKey: 'concept-intake',
    sourceSystem: 'public_intake_leads.form_data', sourceRecordId: `${f.intakeId}:programme`, content: f.request,
    title: `Programme — ${f.projectPath} at ${f.address ?? f.intakeId}`, authority: 'UPLOADED_SOURCE_DOCUMENT', metadata: { tier: f.tier, clientName: f.clientName ?? null },
    actor: { type: 'user', id: f.intakeId },
  })
  const { run, outputs } = await k.generation.recordGeneration({
    orderId: f.intakeId, organizationId: f.organizationId ?? null, productType: 'design_concept', agent: 'concept-generator', model: f.model,
    promptId: 'concept-package', promptVersion: f.designerDirection ? 'v2-with-architect-direction' : 'v2', promptText: f.promptText ?? null,
    requestSummary: `${f.projectPath} tier ${f.tier} for ${f.address ?? f.intakeId}${f.generation ? ` (generation ${f.generation})` : ''}`,
    request: { projectPath: f.projectPath, tier: f.tier, designerDirection: f.designerDirection ?? null },
    inputs: [
      { role: 'SOURCE_ARTIFACT', artifactId: request.artifact.id },
      { role: 'USER_REQUEST', reference: f.intakeId },
      ...(f.designerDirection ? [{ role: 'RETRIEVED_CONTEXT' as const, reference: 'architect-direction', content: { direction: f.designerDirection } }] : []),
    ],
    outputs: [
      {
        artifactType: 'DESIGN_CONCEPT', artifactSubtype: f.projectPath, discipline: 'architectural', sourceKey: 'concept-generator',
        sourceSystem: 'public_intake_leads.form_data', sourceRecordId: `${f.intakeId}:conceptOutput`, content: f.conceptOutput,
        title: `Design concept — ${f.projectPath} at ${f.address ?? f.intakeId} (generation ${f.generation})`,
        summary: String((f.conceptOutput.designConcept as Record<string, unknown> | undefined)?.style ?? ''),
        supersedesArtifactId: f.supersedesArtifactId ?? null, metadata: { generation: f.generation, tier: f.tier, pdfUrl: f.pdfUrl ?? null },
        files: f.pdfUrl ? [{ role: 'export', filename: 'concept-package.pdf', mimeType: 'application/pdf', storageUri: f.pdfUrl }] : [],
        links: [{ orderId: f.intakeId, role: 'deliverable' }],
      },
      ...(f.renderUrls ?? []).map((url, i) => ({
        role: 'render', artifactType: 'RENDERING' as const, artifactSubtype: 'concept-render', discipline: 'architectural', sourceKey: 'render-provider',
        sourceSystem: 'render-urls', sourceRecordId: `${f.intakeId}:g${f.generation}:r${i}`, checksum: sha(url), storageUri: url, mimeType: 'image/png',
        title: `Concept render ${i + 1} — ${f.projectPath} at ${f.address ?? f.intakeId}`, links: [{ orderId: f.intakeId, role: 'deliverable' as const }],
      })),
    ],
  })
  return { run, concept: outputs[0], renders: outputs.slice(1) }
}

/** An architect's review of a concept (`form_data.architectReview`). */
export async function recordConceptReview(k: Knowledge, f: { conceptArtifactId: string; intakeId: string; state: 'APPROVED' | 'CHANGES_REQUESTED'; comment: string | null; reviewer: { displayName: string; licenceNumber: string | null }; generation: number }) {
  await k.registry.ingestArtifact({
    orderId: f.intakeId, artifactType: 'CODE_REVIEW', artifactSubtype: 'architect-concept-review', discipline: 'architectural', sourceKey: 'professional-review',
    sourceSystem: 'public_intake_leads.form_data', sourceRecordId: `${f.intakeId}:architectReview:g${f.generation}:${f.state}`, content: f,
    title: `Architect review of concept generation ${f.generation}: ${f.state}`, summary: f.comment, approvalStatus: 'HUMAN_REVIEWED', authority: 'HUMAN_REVIEWED_KEALEE_FINAL', confidentiality: 'INTERNAL',
    lineage: [{ objectId: f.conceptArtifactId, relation: f.state === 'APPROVED' ? 'APPROVES' : 'REVIEWS' }], actor: { type: 'user', id: f.reviewer.licenceNumber ?? f.reviewer.displayName },
  })
  return k.registry.setApproval(f.conceptArtifactId, f.state === 'APPROVED' ? 'HUMAN_APPROVED' : 'HUMAN_REVIEWED', { type: 'user', id: f.reviewer.licenceNumber ?? f.reviewer.displayName, note: f.comment ?? f.state })
}

// ── Engine outputs on disk (output/site-plans/<slug>/) ───────────────────────

export interface OutputFolderFacts {
  slug: string
  folder: string
  /** The study/proposal JSON the engine wrote (yield.json, proposal.json, plat-record.json). */
  record: Record<string, unknown>
  recordFile: string
  pdfs: { filename: string; sizeBytes: number; sha256: string }[]
  exports: { filename: string; sizeBytes: number; sha256: string; mimeType: string }[]
  manifest?: Record<string, unknown> | null
  readme?: string | null
  kind: 'yield_study' | 'subdivision' | 'site_plan'
}

/** Registers a folder of engine outputs as one generation with the record JSON as the primary artifact. */
export async function recordOutputFolder(k: Knowledge, f: OutputFolderFacts): Promise<{ run: GenerationRunRecord; primary: KnowledgeArtifactRecord; unchanged?: boolean }> {
  const r = f.record
  // Idempotent: an unchanged record JSON is the same generation — return it rather than record a second run.
  const existing = await k.registry.findBySource('output/site-plans', `${f.slug}/${f.recordFile}`)
  if (existing && existing.checksum === sha(r) && existing.generationRunId) {
    const run = await k.generation.getRun(existing.generationRunId)
    if (run) return { run, primary: existing, unchanged: true }
  }
  const name = String(r.name ?? r.reference ?? f.slug)
  const parcels = Array.isArray(r.parcels) ? (r.parcels as Record<string, unknown>[]) : []
  const accounts = parcels.map(p => String(p.account ?? '')).filter(Boolean)
  const sources: string[] = []
  for (const p of parcels) {
    const { artifact } = await k.registry.ingestArtifact({
      artifactType: 'DOCUMENT', artifactSubtype: 'county-parcel-record', discipline: 'civil', sourceKey: 'pgatlas', sourceSystem: 'pgatlas.parcels', sourceRecordId: String(p.account),
      content: { account: p.account, owner: p.owner, description: p.description, plat: p.plat, liber: p.liber, folio: p.folio, gisSqFt: p.gisSqFt, zone: p.zone },
      title: `PGAtlas parcel ${p.account} — ${p.owner ?? ''} ${p.description ?? ''}`.trim(), authority: 'VALIDATED_STRUCTURED_DATA', confidentiality: 'INTERNAL', jurisdiction: 'prince_georges_md',
      metadata: { plat: p.plat ?? null, zone: p.zone ?? null }, actor: { type: 'system', id: 'pgatlas' },
    })
    sources.push(artifact.id)
  }
  const productType = f.kind === 'yield_study' ? 'attached_housing_yield_study' : f.kind === 'subdivision' ? 'subdivision_concept' : 'site_plan'
  const { run, outputs } = await k.generation.recordGeneration({
    productType, agent: f.kind === 'yield_study' ? 'propose-townhomes' : f.kind === 'subdivision' ? 'propose-subdivision' : 'generate-subdivision', model: 'deterministic',
    requestSummary: name, request: { slug: f.slug, zone: r.zone ?? null, hypothetical: r.hypothetical ?? null, accounts },
    rulesUsed: r.standards ?? r.designStandards ?? null, toolsExecuted: ['pgatlas', 'polygon-clipping', 'pdfkit'],
    status: 'COMPLETED', metadata: { folder: f.folder, manifest: f.manifest ?? null },
    inputs: sources.map(id => ({ role: 'SOURCE_ARTIFACT' as const, artifactId: id })),
    outputs: [{
      artifactType: f.kind === 'yield_study' ? 'YIELD_STUDY' : 'SITE_PLAN', artifactSubtype: f.kind, discipline: 'civil', sourceKey: 'site-plan-engine',
      sourceSystem: 'output/site-plans', sourceRecordId: `${f.slug}/${f.recordFile}`, content: r, filename: f.recordFile, mimeType: 'application/json', storageUri: `${f.folder}/${f.recordFile}`,
      title: name, summary: f.readme ? f.readme.slice(0, 2000) : null, jurisdiction: 'prince_georges_md', confidentiality: 'INTERNAL',
      // Engine outputs the owner asked for and reviewed in session are still AI/deterministic drafts until a professional signs.
      approvalStatus: 'AI_GENERATED',
      files: [
        ...f.pdfs.map(p => ({ role: 'primary', filename: p.filename, mimeType: 'application/pdf', storageUri: `${f.folder}/${p.filename}`, checksum: p.sha256, fileSize: p.sizeBytes })),
        ...f.exports.map(e => ({ role: 'export', filename: e.filename, mimeType: e.mimeType, storageUri: `${f.folder}/${e.filename}`, checksum: e.sha256, fileSize: e.sizeBytes })),
      ],
      metadata: {
        yield: r.yield ?? null, stormwater: r.stormwater ? { esdvCf: (r.stormwater as Record<string, unknown>).esdvCf, practiceFootprintSqFt: (r.stormwater as Record<string, unknown>).practiceFootprintSqFt, reservedSqFt: (r.stormwater as Record<string, unknown>).reservedSqFt } : null,
        openSpace: r.openSpace ? { sqFt: (r.openSpace as Record<string, unknown>).sqFt } : null, zone: r.zone ?? null, mappedZone: r.mappedZone ?? null, hypothetical: r.hypothetical ?? null, tractAcres: r.tractAcres ?? null, accounts,
      },
    }],
  })
  return { run, primary: outputs[0] }
}
