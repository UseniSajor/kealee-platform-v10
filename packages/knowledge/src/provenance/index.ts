/**
 * The lineage graph (spec §4): `addLineage` and `traceLineage`.
 *
 * `traceLineage` walks subject → object for "what produced this" and
 * object → subject for "what depended on it", and gathers the generation runs
 * on the path so the trace answers: sources, generating agent/model, prompt
 * version/hash, tools, reviewed, approved, dependents.
 */
import type { KnowledgeDb } from '../db'
import type { GenerationRunRecord, KnowledgeArtifactRecord, KnowledgeLineageRelation, LineageEdgeRecord, LineageTrace } from '../types'

export class Provenance {
  constructor(private readonly db: KnowledgeDb) {}

  async addLineage(subjectId: string, objectId: string, relation: KnowledgeLineageRelation, actor?: { type: 'agent' | 'user' | 'system' | 'jurisdiction'; id: string; generationRunId?: string | null; note?: string | null }): Promise<LineageEdgeRecord> {
    if (subjectId === objectId) throw new Error('An artifact cannot be its own lineage.')
    const existing = await this.db.knowledgeLineageEdge.findFirst({ where: { subjectId, objectId, relation } })
    if (existing) return existing
    return this.db.knowledgeLineageEdge.create({ data: { subjectId, objectId, relation, actorType: actor?.type ?? null, actorId: actor?.id ?? null, generationRunId: actor?.generationRunId ?? null, note: actor?.note ?? null } })
  }

  async traceLineage(artifactId: string, maxDepth = 12): Promise<LineageTrace> {
    const root: KnowledgeArtifactRecord | null = await this.db.knowledgeArtifact.findUnique({ where: { id: artifactId } })
    if (!root) throw new Error(`Artifact ${artifactId} not found.`)
    const upstream: LineageTrace['upstream'] = []
    const downstream: LineageTrace['downstream'] = []
    const seenUp = new Set<string>([artifactId]), seenDown = new Set<string>([artifactId])

    const walk = async (id: string, depth: number, dir: 'up' | 'down') => {
      if (depth > maxDepth) return
      const edges: LineageEdgeRecord[] = await this.db.knowledgeLineageEdge.findMany({ where: dir === 'up' ? { subjectId: id } : { objectId: id } })
      for (const edge of edges) {
        const nextId = dir === 'up' ? edge.objectId : edge.subjectId
        const seen = dir === 'up' ? seenUp : seenDown
        if (seen.has(nextId)) continue
        seen.add(nextId)
        const artifact: KnowledgeArtifactRecord | null = await this.db.knowledgeArtifact.findUnique({ where: { id: nextId } })
        if (!artifact) continue
        ;(dir === 'up' ? upstream : downstream).push({ artifact, edge, depth })
        await walk(nextId, depth + 1, dir)
      }
    }
    await walk(artifactId, 1, 'up')
    await walk(artifactId, 1, 'down')

    // Generation runs on the upstream path (the root's own, and every ancestor's)
    const runIds = new Set<string>()
    for (const a of [root, ...upstream.map(u => u.artifact)]) if (a.generationRunId) runIds.add(a.generationRunId)
    for (const u of upstream) if (u.edge.generationRunId) runIds.add(u.edge.generationRunId)
    const generations: GenerationRunRecord[] = []
    for (const id of runIds) { const r = await this.db.generationRun.findUnique({ where: { id } }); if (r) generations.push(r) }

    const reviewRelations: KnowledgeLineageRelation[] = ['REVIEWS', 'APPROVES', 'CORRECTS']
    const reviewed = downstream.some(d => reviewRelations.includes(d.edge.relation)) || ['HUMAN_REVIEWED', 'HUMAN_APPROVED', 'PROFESSIONAL_SEALED', 'JURISDICTION_APPROVED', 'REJECTED'].includes(root.approvalStatus)
    const approved = downstream.some(d => d.edge.relation === 'APPROVES') || ['HUMAN_APPROVED', 'PROFESSIONAL_SEALED', 'JURISDICTION_APPROVED'].includes(root.approvalStatus)
    return {
      artifactId, upstream, downstream, generations,
      answers: {
        sources: upstream.filter(u => !u.artifact.generationRunId).map(u => `${u.artifact.artifactType}: ${u.artifact.title} (${u.artifact.authority})`),
        generatedBy: generations.map(g => `${g.agent}${g.model ? ` / ${g.model}` : ''}`),
        prompts: generations.map(g => g.promptId ? `${g.promptId}@${g.promptVersion ?? '?'}` : g.promptHash ? `sha256:${g.promptHash.slice(0, 12)}` : 'none recorded'),
        tools: generations.map(g => g.toolsExecuted).filter(Boolean),
        reviewed, approved, dependents: downstream.length,
      },
    }
  }
}
