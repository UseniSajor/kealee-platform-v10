/**
 * web-main's handle on the Kealee knowledge registry (@kealee/knowledge).
 * One instance per process; every call site records fire-and-forget and
 * logs a miss — the customer's deliverable never waits on the corpus.
 */
import { prisma } from '@kealee/database'
import { createKnowledge, recordConceptGeneration, recordConceptReview, type Knowledge, type ConceptGenerationFacts } from '@kealee/knowledge'

let instance: Knowledge | null = null
export function knowledge(): Knowledge {
  if (!instance) instance = createKnowledge(prisma, { log: (m) => console.log(m) })
  return instance
}

/** After `/api/concept/generate` writes `conceptOutput`. */
export async function recordConceptInKnowledge(f: ConceptGenerationFacts): Promise<void> {
  try {
    const { run, concept, renders } = await recordConceptGeneration(knowledge(), f)
    console.log(`[knowledge] concept ${concept.id} (v${concept.version}) recorded — run ${run.id}, ${renders.length} render(s)`)
  } catch (e) {
    console.error(`[knowledge] !! concept for ${f.intakeId} NOT recorded: ${e instanceof Error ? e.message : String(e)}`)
  }
}

/** After an architect decides on a concept (OS Architecture). */
export async function recordConceptReviewInKnowledge(f: { intakeId: string; state: 'APPROVED' | 'CHANGES_REQUESTED'; comment: string | null; reviewer: { displayName: string; licenceNumber: string | null }; generation: number }): Promise<void> {
  try {
    const concept = await (prisma as any).knowledgeArtifact.findFirst({ where: { sourceSystem: 'public_intake_leads.form_data', sourceRecordId: `${f.intakeId}:conceptOutput` }, orderBy: { version: 'desc' }, select: { id: true } })
    if (!concept) { console.warn(`[knowledge] concept review for ${f.intakeId}: concept not in the registry yet`); return }
    await recordConceptReview(knowledge(), { conceptArtifactId: concept.id, ...f })
  } catch (e) {
    console.error(`[knowledge] !! concept review for ${f.intakeId} NOT recorded: ${e instanceof Error ? e.message : String(e)}`)
  }
}
