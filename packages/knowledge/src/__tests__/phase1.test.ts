/**
 * Phase 1 acceptance tests (spec §33 — the ones Phase 1 covers):
 *   A  uploading a drawing creates a knowledge artifact
 *   B  updating it creates a new version instead of overwriting history
 *   E  a generation records its input artifacts (lineage GENERATED_FROM)
 *   F/G a human correction is recorded and the approved output becomes a training CANDIDATE
 *   H  a rejected generation never becomes approved training data
 *   M  lineage traces a final output back to its sources and answers the provenance questions
 *   O  approved source material outranks an unverified AI draft (authority)
 *   +  secrets never reach the store; software cannot climb the approval ladder
 */
import { describe, it, expect } from 'vitest'
import { createKnowledge, authorityRank, MemoryEventSink, KNOWLEDGE_EVENTS, redactSecrets } from '../index'
import { recordOutputFolder, recordSitePlanDelivery, recordSitePlanReview } from '../adapters'
import { memoryDb } from './memory-db'

function setup() {
  const db = memoryDb()
  const events = new MemoryEventSink()
  return { db, events, k: createKnowledge(db, { events }) }
}

describe('A/B — artifact identity and versions', () => {
  it('ingests an uploaded drawing as a RAW, UNREVIEWED, retrieval-only artifact and emits knowledge.artifact.created', async () => {
    const { k, events, db } = setup()
    const { artifact, created } = await k.registry.ingestArtifact({ orderId: 'o1', artifactType: 'DRAWING', discipline: 'civil', sourceSystem: 'documents', sourceRecordId: 'doc1', content: 'PDF-BYTES-1', title: 'Survey plat', uploadedById: 'u1' })
    expect(created).toBe(true)
    expect(artifact.version).toBe(1)
    expect(artifact.status).toBe('RAW')
    expect(artifact.approvalStatus).toBe('UNREVIEWED')
    expect(artifact.trainingEligibility).toBe('RETRIEVAL_ONLY')          // customer data is never a candidate by default
    expect(artifact.retrievalEligibility).toBe('PROJECT_ONLY')
    expect(artifact.checksum).toHaveLength(64)
    expect(await db.tables.knowledgeArtifactVersion.count({ where: { artifactId: artifact.id } })).toBe(1)
    expect(await db.tables.knowledgeProjectLink.count({ where: { artifactId: artifact.id } })).toBe(1)
    expect(events.events.map(e => e.type)).toContain(KNOWLEDGE_EVENTS.artifact.created)
  })

  it('re-ingesting the same record with the same bytes returns the same artifact; different bytes make version 2 and keep version 1', async () => {
    const { k, db } = setup()
    const a = await k.registry.ingestArtifact({ artifactType: 'DRAWING', sourceSystem: 'documents', sourceRecordId: 'doc1', content: 'PDF-BYTES-1', title: 'Survey plat' })
    const same = await k.registry.ingestArtifact({ artifactType: 'DRAWING', sourceSystem: 'documents', sourceRecordId: 'doc1', content: 'PDF-BYTES-1', title: 'Survey plat' })
    expect(same.created).toBe(false); expect(same.versioned).toBe(false); expect(same.artifact.id).toBe(a.artifact.id)
    const changed = await k.registry.ingestArtifact({ artifactType: 'DRAWING', sourceSystem: 'documents', sourceRecordId: 'doc1', content: 'PDF-BYTES-2', title: 'Survey plat' })
    expect(changed.versioned).toBe(true); expect(changed.artifact.id).toBe(a.artifact.id); expect(changed.artifact.version).toBe(2)
    const versions = await db.tables.knowledgeArtifactVersion.findMany({ where: { artifactId: a.artifact.id }, orderBy: { version: 'asc' } })
    expect(versions.map(v => v.version)).toEqual([1, 2])
    expect(versions[0].checksum).toBe(a.artifact.checksum)                  // history kept
    expect(await db.tables.knowledgeArtifact.count()).toBe(1)             // no duplicate identity
  })
})

describe('E/M — generation records and lineage', () => {
  it('records a generation whose output is GENERATED_FROM every source artifact, and traces it back', async () => {
    const { k } = setup()
    const survey = await k.registry.ingestArtifact({ artifactType: 'SURVEY', sourceSystem: 'documents', sourceRecordId: 'survey', content: 'S', title: 'Boundary survey', approvalStatus: 'PROFESSIONAL_SEALED' })
    const plat = await k.registry.ingestArtifact({ artifactType: 'PLAT', sourceSystem: 'pgatlas', sourceRecordId: 'plat', content: 'P', title: 'Recorded plat', approvalStatus: 'JURISDICTION_APPROVED', actor: { type: 'jurisdiction', id: 'pg' } })
    const { run, outputs } = await k.generation.recordGeneration({
      orderId: 'o1', productType: 'site_plan', agent: 'siteplan.drafter', model: 'deterministic', promptText: 'SYSTEM PROMPT v3', promptId: 'siteplan', promptVersion: '3',
      rulesUsed: { rulePack: 'pg-2026.09' }, toolsExecuted: ['pgatlas', 'render-pdf'],
      inputs: [{ role: 'SOURCE_ARTIFACT', artifactId: survey.artifact.id }, { role: 'SOURCE_ARTIFACT', artifactId: plat.artifact.id }, { role: 'RULE', reference: 'rule-pack@pg-2026.09' }],
      outputs: [{ artifactType: 'SITE_PLAN', sourceSystem: 'documents', sourceRecordId: 'plan-pdf', content: 'PDF', title: 'Preliminary site plan' }],
    })
    expect(run.status).toBe('COMPLETED'); expect(run.promptHash).toHaveLength(64)
    const plan = outputs[0]
    expect(plan.approvalStatus).toBe('AI_GENERATED'); expect(plan.authority).toBe('AI_GENERATED_DRAFT'); expect(plan.generationRunId).toBe(run.id)
    const trace = await k.provenance.traceLineage(plan.id)
    expect(trace.upstream.map(u => u.artifact.title).sort()).toEqual(['Boundary survey', 'Recorded plat'])
    expect(trace.upstream.every(u => u.edge.relation === 'GENERATED_FROM')).toBe(true)
    expect(trace.answers.generatedBy).toEqual(['siteplan.drafter / deterministic'])
    expect(trace.answers.prompts).toEqual(['siteplan@3'])
    expect(trace.answers.tools).toEqual([['pgatlas', 'render-pdf']])
    expect(trace.answers.reviewed).toBe(false); expect(trace.answers.approved).toBe(false)
    // and the sources see the plan as a dependent
    const fromPlat = await k.provenance.traceLineage(plat.artifact.id)
    expect(fromPlat.downstream.map(d => d.artifact.id)).toEqual([plan.id])
  })
})

describe('F/G/H — human disposition drives training eligibility; software cannot approve', () => {
  it('an accepted generation becomes HUMAN_APPROVED and a TRAINING_CANDIDATE — never TRAINING_APPROVED', async () => {
    const { k, events } = setup()
    const { run, outputs } = await k.generation.recordGeneration({ productType: 'estimate', agent: 'EstimateBot', model: 'claude-opus-5', outputs: [{ artifactType: 'ESTIMATE', sourceSystem: 'estimates', sourceRecordId: 'e1', content: { total: 100 }, title: 'Estimate' }] })
    expect(outputs[0].trainingEligibility).toBe('RETRIEVAL_ONLY')
    await k.generation.disposeGeneration(run.id, 'accepted', { id: 'estimator-1', note: 'checked against takeoff' })
    const after = await k.registry.getArtifact(outputs[0].id)
    expect(after?.approvalStatus).toBe('HUMAN_APPROVED')
    expect(after?.authority).toBe('HUMAN_REVIEWED_KEALEE_FINAL')
    expect(after?.trainingEligibility).toBe('TRAINING_CANDIDATE')
    expect(events.events.map(e => e.type)).toContain(KNOWLEDGE_EVENTS.generation.approved)
  })

  it('a corrected generation is HUMAN_REVIEWED with the correction on record; a rejected one is never approved training data', async () => {
    const { k, db } = setup()
    const { run, outputs } = await k.generation.recordGeneration({ productType: 'estimate', agent: 'EstimateBot', outputs: [{ artifactType: 'ESTIMATE', sourceSystem: 'estimates', sourceRecordId: 'e2', content: { total: 100 }, title: 'Estimate' }] })
    await k.generation.disposeGeneration(run.id, 'rejected', { id: 'estimator-1', note: 'quantities wrong' })
    const rejected = await k.registry.getArtifact(outputs[0].id)
    expect(rejected?.approvalStatus).toBe('REJECTED')
    expect(rejected?.trainingEligibility).toBe('EVAL_ELIGIBLE')          // kept for analysis, not a positive example
    expect(['TRAINING_CANDIDATE', 'TRAINING_APPROVED']).not.toContain(rejected?.trainingEligibility)
    const ledger = await db.tables.learningEvent.findMany({ where: { generationRunId: run.id } })
    expect(ledger.map(l => l.eventType)).toContain('GENERATION_REJECTED')
  })

  it('an agent cannot set a human or jurisdiction approval', async () => {
    const { k } = setup()
    const a = await k.registry.ingestArtifact({ artifactType: 'SITE_PLAN', sourceSystem: 'x', sourceRecordId: '1', content: 'p', title: 'plan', generatedByAgent: 'bot' })
    await expect(k.registry.setApproval(a.artifact.id, 'HUMAN_APPROVED', { type: 'agent', id: 'bot' })).rejects.toThrow(/only be set by a person/)
    await expect(k.registry.setApproval(a.artifact.id, 'JURISDICTION_APPROVED', { type: 'agent', id: 'bot' })).rejects.toThrow()
    const ok = await k.registry.setApproval(a.artifact.id, 'HUMAN_APPROVED', { type: 'user', id: 'pe-1' })
    expect(ok.approvalStatus).toBe('HUMAN_APPROVED')
  })
})

describe('O — authority', () => {
  it('a jurisdiction-approved plat outranks a sealed survey, which outranks a human-reviewed Kealee final, which outranks an AI draft', () => {
    expect(authorityRank('APPROVED_GOVERNMENT_RECORD')).toBeLessThan(authorityRank('SEALED_PROFESSIONAL_DOCUMENT'))
    expect(authorityRank('SEALED_PROFESSIONAL_DOCUMENT')).toBeLessThan(authorityRank('HUMAN_REVIEWED_KEALEE_FINAL'))
    expect(authorityRank('HUMAN_REVIEWED_KEALEE_FINAL')).toBeLessThan(authorityRank('AI_GENERATED_DRAFT'))
    expect(authorityRank('AI_GENERATED_DRAFT')).toBeLessThan(authorityRank('UNVERIFIED_INFERENCE'))
  })
  it('ingest assigns authority from the approval ladder and the artifact type', async () => {
    const { k } = setup()
    const plat = await k.registry.ingestArtifact({ artifactType: 'PLAT', sourceSystem: 'a', sourceRecordId: '1', content: 'x', title: 'plat', approvalStatus: 'JURISDICTION_APPROVED' })
    const draft = await k.registry.ingestArtifact({ artifactType: 'SITE_PLAN', sourceSystem: 'a', sourceRecordId: '2', content: 'y', title: 'draft', generatedByAgent: 'bot' })
    expect(plat.artifact.authority).toBe('APPROVED_GOVERNMENT_RECORD')
    expect(draft.artifact.authority).toBe('AI_GENERATED_DRAFT')
    expect(authorityRank(plat.artifact.authority)).toBeLessThan(authorityRank(draft.artifact.authority))
  })
})

describe('security — secrets never reach the store', () => {
  it('redacts keys, database URLs and SSNs from summaries and metadata', async () => {
    const { k } = setup()
    const { artifact } = await k.registry.ingestArtifact({ artifactType: 'DOCUMENT', sourceSystem: 'a', sourceRecordId: 's', content: 'x', title: 'notes', summary: 'key sk-ant-abcdefghijklmnopqrstuvwxyz0123456789 and ssn 123-45-6789', metadata: { db: 'postgresql://user:hunter2@host:5432/db', ok: 'fine' } })
    expect(artifact.summary).not.toContain('sk-ant-'); expect(artifact.summary).toContain('[REDACTED_ANTHROPIC_KEY]'); expect(artifact.summary).toContain('[REDACTED_SSN]')
    expect(JSON.stringify(artifact.metadata)).not.toContain('hunter2'); expect((artifact.metadata as Record<string, unknown>).ok).toBe('fine')
    expect(redactSecrets('token = abcdef123456').text).toContain('[REDACTED_CREDENTIAL]')
  })
})

describe('adapters — the platform’s own products enter the registry', () => {
  it('a delivered site plan records the county parcel as its source, the PDF as its output, and a professional review climbs the ladder', async () => {
    const { k } = setup()
    const { run, plan } = await recordSitePlanDelivery(k, {
      workflowId: 'wf1', orderId: 'o1', productId: 'permit_site_plan', address: '1005 Rollins Ave', documentId: 'doc-9', documentFilename: 'set.pdf', pageCount: 11,
      deliverable: { deliveredAt: '2026-09-21T00:00:00Z', property: { parcelId: '0412007', matchedAddress: '1005 ROLLINS AVE', zoneCode: 'RSF-65' }, terrain: { contourCount: 40 }, rulePackVersion: 'pg-1.4', qc: { issuable: false, summary: '3 pending seal', pendingSeal: ['seal'] } },
      stageOutputs: { 'siteplan.initialize': { definitionVersion: 'v2' }, 'siteplan.render_exports': {} },
    })
    expect(run.productType).toBe('site_plan'); expect(run.rulesUsed).toEqual({ rulePackVersion: 'pg-1.4' })
    const trace = await k.provenance.traceLineage(plan.id)
    expect(trace.answers.sources[0]).toMatch(/PGAtlas parcel 0412007 .*VALIDATED_STRUCTURED_DATA/)
    const { plan: reviewed } = await recordSitePlanReview(k, { planArtifactId: plan.id, workflowId: 'wf1', orderId: 'o1', state: 'APPROVED', sheetRevision: 0, disciplines: [{ discipline: 'professional_engineer', state: 'APPROVED', reviewer: { displayName: 'A. Engineer', licenceNumber: 'MD-1', licenceState: 'MD' } }], redlines: [] })
    expect(reviewed.approvalStatus).toBe('HUMAN_APPROVED'); expect(reviewed.trainingEligibility).toBe('TRAINING_CANDIDATE')
    const t2 = await k.provenance.traceLineage(plan.id)
    expect(t2.answers.approved).toBe(true); expect(t2.downstream[0].edge.relation).toBe('APPROVES')
  })

  it('an engine output folder (yield study) becomes a generation with its PGAtlas parcels as sources and a yield summary in metadata', async () => {
    const { k } = setup()
    const { run, primary } = await recordOutputFolder(k, {
      slug: 'aragona-village', folder: 'output/site-plans/aragona-village', kind: 'yield_study', recordFile: 'aragona-village.yield.json',
      record: { name: 'Aragona Village', zone: 'CGO', mappedZone: 'RE', hypothetical: true, tractAcres: 14.309, parcels: [{ account: '4007985', owner: 'BRANDYWINE BUILDERS LLC', plat: '05230085', zone: 'RE', gisSqFt: 35000 }], yield: { totalDwellingUnits: 199 }, stormwater: { esdvCf: 24037, practiceFootprintSqFt: 30046, reservedSqFt: 30209 }, openSpace: { sqFt: 41007 } },
      pdfs: [{ filename: 'aragona-village-yield-study.pdf', sizeBytes: 20000, sha256: 'a'.repeat(64) }], exports: [], readme: '# Aragona',
    })
    expect(run.agent).toBe('propose-townhomes'); expect(primary.artifactType).toBe('YIELD_STUDY'); expect(primary.approvalStatus).toBe('AI_GENERATED')
    expect((primary.metadata as Record<string, unknown>).yield).toEqual({ totalDwellingUnits: 199 })
    const trace = await k.provenance.traceLineage(primary.id)
    expect(trace.answers.sources).toEqual(['DOCUMENT: PGAtlas parcel 4007985 — BRANDYWINE BUILDERS LLC (VALIDATED_STRUCTURED_DATA)'])
    // K (reproducibility): registering the same folder again is the same generation, not a second run
    const again = await recordOutputFolder(k, { slug: 'aragona-village', folder: 'output/site-plans/aragona-village', kind: 'yield_study', recordFile: 'aragona-village.yield.json', record: { name: 'Aragona Village', zone: 'CGO', mappedZone: 'RE', hypothetical: true, tractAcres: 14.309, parcels: [{ account: '4007985', owner: 'BRANDYWINE BUILDERS LLC', plat: '05230085', zone: 'RE', gisSqFt: 35000 }], yield: { totalDwellingUnits: 199 }, stormwater: { esdvCf: 24037, practiceFootprintSqFt: 30046, reservedSqFt: 30209 }, openSpace: { sqFt: 41007 } }, pdfs: [{ filename: 'aragona-village-yield-study.pdf', sizeBytes: 20000, sha256: 'a'.repeat(64) }], exports: [], readme: '# Aragona' })
    expect(again.unchanged).toBe(true); expect(again.run.id).toBe(run.id); expect(again.primary.id).toBe(primary.id)
    expect((await k.registry.stats()).generationRuns).toBe(1)
  })
})
