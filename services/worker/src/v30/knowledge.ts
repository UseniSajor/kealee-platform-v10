/**
 * Every v30 bot result enters the Kealee knowledge registry (@kealee/knowledge)
 * as a generation run — the deliverable as its primary output, and each model
 * call the bot made (Qwen or Claude, `outputData.modelTrace`) as a
 * MODEL_RESPONSE beside it.
 *
 * This is the internal model's training supply. The registry's own policy
 * decides eligibility: an AI-generated output is RETRIEVAL_ONLY until a person
 * approves it (then TRAINING_CANDIDATE); a model answer Kealee's guards
 * rejected is recorded REJECTED, which makes it evaluation data only — a hard
 * negative, never a positive example. `training/qwen/` exports from here.
 *
 * Tenant-partitioned: the run carries the project's Org, the tenant.
 * Never on the critical path: a registry failure is logged; the delivery stands.
 */
import { prisma } from '@kealee/database'
import { createKnowledge, type Knowledge, type KnowledgeArtifactType } from '@kealee/knowledge'

let knowledge: Knowledge | null = null
function k(): Knowledge {
  if (!knowledge) knowledge = createKnowledge(prisma, { log: (m) => console.log(m) })
  return knowledge
}

const ARTIFACT_TYPE: Record<string, KnowledgeArtifactType> = {
  design: 'DESIGN_CONCEPT', estimate: 'ESTIMATE', permit: 'PERMIT_PACKAGE', zoning: 'PERMIT_PACKAGE',
  floorplan: 'DRAWING', video: 'RENDERING', intake: 'DOCUMENT',
}

interface Trace { task: string; provider: string; model: string; system: string; prompt: string; output: string; accepted: boolean; rejection?: string; escalatedFrom?: string }

export async function recordV30BotInKnowledge(executionId: string): Promise<void> {
  try {
    const exec = await prisma.v30BotExecution.findUnique({
      where: { id: executionId },
      select: { id: true, projectId: true, packageId: true, botType: true, status: true, inputData: true, outputData: true, modelUsed: true, errorMessage: true, durationMs: true },
    })
    if (!exec || (exec.status !== 'COMPLETE' && exec.status !== 'FAILED')) return
    // Queue retries are expected. A completed execution maps to exactly one
    // knowledge run so it cannot overweight the eventual training corpus.
    const alreadyRecorded = await prisma.generationRun.findFirst({ where: { jobKey: exec.id }, select: { id: true } })
    if (alreadyRecorded) return
    const project = await prisma.project.findUnique({ where: { id: exec.projectId }, select: { orgId: true } })
    const out = (exec.outputData ?? {}) as Record<string, unknown>
    const traces = (Array.isArray(out.modelTrace) ? out.modelTrace : []) as Trace[]
    const { modelTrace: _trace, ...deliverable } = out
    const needsStaff = Boolean(out.requiresHumanFulfillment)

    await k().generation.recordGeneration({
      organizationId: project?.orgId ?? null,
      projectId: exec.projectId,
      productType: `v30_${exec.botType}`,
      agent: `v30-bot:${exec.botType}`,
      model: exec.modelUsed ?? null,
      requestSummary: `${exec.botType} for package ${exec.packageId}`,
      request: (exec.inputData ?? {}) as Record<string, unknown>,
      status: exec.status === 'COMPLETE' ? 'COMPLETED' : 'FAILED',
      errorMessage: exec.errorMessage ?? null,
      jobKey: exec.id,
      metadata: { executionId: exec.id, packageId: exec.packageId, needsStaff, modelCalls: traces.length },
      inputs: [{ role: 'USER_REQUEST', reference: `v30_bot_executions/${exec.id}`, content: exec.inputData ?? null }],
      outputs: [
        ...(exec.status === 'COMPLETE' ? [{
          role: 'primary',
          artifactType: ARTIFACT_TYPE[exec.botType] ?? 'DOCUMENT',
          artifactSubtype: `v30_${exec.botType}`,
          sourceSystem: 'v30_bot_executions', sourceRecordId: exec.id,
          title: `${exec.botType} — package ${exec.packageId}`,
          content: deliverable,
          confidentiality: 'CUSTOMER_CONFIDENTIAL' as const,
        }] : []),
        ...traces.map((t, n) => ({
          role: `model_call_${n + 1}`,
          artifactType: 'MODEL_RESPONSE' as const,
          artifactSubtype: t.task,
          sourceSystem: 'v30_model_assist', sourceRecordId: `${exec.id}#${n + 1}`,
          title: `${t.provider} ${t.task}${t.accepted ? '' : ' (rejected)'}`,
          content: { system: t.system, prompt: t.prompt, output: t.output, provider: t.provider, model: t.model, accepted: t.accepted, rejection: t.rejection ?? null, escalatedFrom: t.escalatedFrom ?? null },
          generatedByModel: t.model,
          confidentiality: 'CUSTOMER_CONFIDENTIAL' as const,
          // A guard rejected it: keep it as a hard negative for evaluation, never as a positive example.
          ...(t.accepted ? {} : { approvalStatus: 'REJECTED' as const }),
        })),
      ],
    })
  } catch (e) {
    console.error(`[knowledge] !! v30 bot execution ${executionId} NOT recorded: ${e instanceof Error ? e.message : String(e)}`)
  }
}
