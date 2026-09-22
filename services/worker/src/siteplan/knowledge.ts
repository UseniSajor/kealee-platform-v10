/**
 * The site-plan engine's outputs enter the Kealee knowledge registry
 * (@kealee/knowledge, Phase 1): every delivered plan is a generation run with
 * the county parcel as its source, the PDF as its output, and every
 * professional decision a review edge that climbs the approval ladder.
 *
 * Never on the critical path: a registry failure is logged and the delivery
 * stands. No silent failures — the miss is on the console and in the audit
 * trail so the corpus can be back-filled.
 */
import { prisma } from '@kealee/database'
import { createKnowledge, recordSitePlanDelivery, recordSitePlanReview, type Knowledge } from '@kealee/knowledge'

let knowledge: Knowledge | null = null
function k(): Knowledge {
  if (!knowledge) knowledge = createKnowledge(prisma, { log: (m) => console.log(m) })
  return knowledge
}

export async function recordDeliveryInKnowledge(input: {
  workflowId: string; orderId: string; productId: string | null; address: string | null
  record: { document: { id: string; filename: string | null; pageCount: number | null }; deliveredAt: string; revision?: number } & Record<string, unknown>
  outputs: Record<string, unknown>
  previousDocumentId?: string | null
}): Promise<void> {
  try {
    const previous = input.previousDocumentId
      ? await prisma.knowledgeArtifact.findFirst({ where: { sourceSystem: 'documents', sourceRecordId: input.previousDocumentId }, orderBy: { version: 'desc' }, select: { id: true } })
      : null
    const { run, plan } = await recordSitePlanDelivery(k(), {
      workflowId: input.workflowId, orderId: input.orderId, productId: input.productId, address: input.address,
      documentId: input.record.document.id, documentFilename: input.record.document.filename, pageCount: input.record.document.pageCount,
      deliverable: input.record, stageOutputs: input.outputs, revision: input.record.revision ?? 0, supersedesArtifactId: previous?.id ?? null,
    })
    console.log(`[knowledge] site plan ${plan.id} recorded (run ${run.id}, ${plan.approvalStatus})`)
  } catch (e) {
    console.error(`[knowledge] !! site plan for order ${input.orderId} NOT recorded: ${e instanceof Error ? e.message : String(e)}`)
    await prisma.sitePlanAuditEvent.create({ data: { workflowId: input.workflowId, actorType: 'system', eventType: 'knowledge.record_failed', entityTable: 'knowledge_artifacts', entityId: input.record.document.id, summary: `Knowledge registry write failed: ${e instanceof Error ? e.message : String(e)}` } }).catch(() => undefined)
  }
}

export async function recordReviewInKnowledge(input: {
  workflowId: string; orderId: string
  routed: { documentId?: string; reviewState: string; sheetRevision?: number; disciplines?: { discipline: string; state: string; reviewer: { displayName: string; licenceNumber: string | null; licenceState: string | null } | null }[]; redlines?: { subject: string; comment: string; decidedByName: string | null }[] }
}): Promise<void> {
  if (input.routed.reviewState !== 'APPROVED' && input.routed.reviewState !== 'CHANGES_REQUESTED') return
  try {
    if (!input.routed.documentId) return
    const plan = await prisma.knowledgeArtifact.findFirst({ where: { sourceSystem: 'documents', sourceRecordId: input.routed.documentId }, orderBy: { version: 'desc' }, select: { id: true } })
    if (!plan) { console.warn(`[knowledge] review for order ${input.orderId}: plan document ${input.routed.documentId} is not in the registry yet`); return }
    await recordSitePlanReview(k(), {
      planArtifactId: plan.id, workflowId: input.workflowId, orderId: input.orderId, state: input.routed.reviewState,
      sheetRevision: input.routed.sheetRevision ?? 0, disciplines: input.routed.disciplines ?? [], redlines: input.routed.redlines ?? [],
    })
    console.log(`[knowledge] review ${input.routed.reviewState} recorded against plan ${plan.id}`)
  } catch (e) {
    console.error(`[knowledge] !! review for order ${input.orderId} NOT recorded: ${e instanceof Error ? e.message : String(e)}`)
  }
}
