/**
 * Exports Kealee's approved generations as a Qwen fine-tuning dataset.
 *
 *   pnpm tsx training/qwen/export-sft.ts [--out training/qwen/data] [--eval-share 0.1]
 *   (needs DATABASE_URL)
 *
 * WHAT GOES IN
 *   Positives — only what a person approved (the registry's TRAINING_CANDIDATE
 *   / TRAINING_APPROVED, set by POST /api/admin/knowledge/runs/:runId):
 *     · a bot's final deliverable: system = the bot's prompt, user = the bot's
 *       task prompt for that order, assistant = the deliverable Kealee shipped
 *       (engine-computed, possibly model-polished);
 *     · a model call Kealee's guards ACCEPTED (Qwen or Claude): the exact
 *       system / prompt / output. Claude's answers are how the internal model
 *       learns what the escalation model knows.
 *   Negatives (eval only) — answers a guard rejected, and deliverables a
 *   person rejected. Never used as positive examples.
 *
 * WHAT STAYS OUT
 *   · White-label tenants' data, always (KEALEE.md: no data crosses the line;
 *     a professional's judgement must not train a model others use). Only
 *     KEALEE_DIRECT orgs and org-less runs are exported.
 *   · A trace whose own `accepted` flag is false. It remains REJECTED even
 *     when a person accepts the valid primary deliverable in the same run.
 *   · Direct identifiers: address, e-mail, phone, names and ids are dropped
 *     from the request; street addresses in text are replaced with [address].
 */
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { prisma } from '../../packages/database/src'
import { getV30SystemPrompt } from '../../packages/kealee-agent-stack/src/v30/prompts'
import { buildV30BotUserPrompt } from '../../packages/kealee-agent-stack/src/v30/bot-task-prompts'
import type { V30BotType } from '../../packages/kealee-agent-stack/src/v30/types'
import { scrub } from './dataset-utils'

export { scrub } from './dataset-utils'

const arg = (name: string, dflt: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : dflt
}
const OUT = resolve(arg('out', join(__dirname, 'data')))
const EVAL_SHARE = Number(arg('eval-share', '0.1'))

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }
interface Example { messages: Msg[]; meta: Record<string, unknown> }

const inEval = (id: string) => parseInt(createHash('sha256').update(id).digest('hex').slice(0, 8), 16) / 0xffffffff < EVAL_SHARE

async function main() {
  const artifacts = await prisma.knowledgeArtifact.findMany({
    where: {
      sourceSystem: { in: ['v30_bot_executions', 'v30_model_assist'] },
      trainingEligibility: { in: ['TRAINING_CANDIDATE', 'TRAINING_APPROVED', 'EVAL_ELIGIBLE'] },
    },
    select: { id: true, organizationId: true, sourceSystem: true, sourceRecordId: true, trainingEligibility: true, approvalStatus: true, artifactSubtype: true },
  })
  const orgIds = [...new Set(artifacts.map(a => a.organizationId).filter((x): x is string => Boolean(x)))]
  const orgs = await prisma.org.findMany({ where: { id: { in: orgIds } }, select: { id: true, tenantKind: true } })
  const direct = new Set(orgs.filter(o => o.tenantKind === 'KEALEE_DIRECT').map(o => o.id))

  const execIds = [...new Set(artifacts.map(a => String(a.sourceRecordId ?? '').split('#')[0]).filter(Boolean))]
  const execs = new Map((await prisma.v30BotExecution.findMany({
    where: { id: { in: execIds } }, select: { id: true, botType: true, inputData: true, outputData: true },
  })).map(e => [e.id, e]))

  const train: Example[] = []; const evalSet: Example[] = []; const negatives: Record<string, unknown>[] = []
  const skipped: Record<string, number> = {}
  const skip = (why: string) => { skipped[why] = (skipped[why] ?? 0) + 1 }

  for (const a of artifacts) {
    if (a.organizationId && !direct.has(a.organizationId)) { skip('white-label tenant'); continue }
    const [execId, n] = String(a.sourceRecordId ?? '').split('#')
    const exec = execs.get(execId)
    if (!exec) { skip('source execution missing'); continue }
    const input = scrub((exec.inputData ?? {}) as Record<string, unknown>)
    const out = (exec.outputData ?? {}) as Record<string, unknown>
    const positive = a.trainingEligibility === 'TRAINING_CANDIDATE' || a.trainingEligibility === 'TRAINING_APPROVED'

    if (a.sourceSystem === 'v30_bot_executions') {
      const { modelTrace: _t, ...deliverable } = out
      const ex: Example = {
        messages: [
          { role: 'system', content: getV30SystemPrompt(exec.botType as V30BotType) },
          { role: 'user', content: buildV30BotUserPrompt(exec.botType as V30BotType, input) },
          { role: 'assistant', content: JSON.stringify(scrub(deliverable)) },
        ],
        meta: { kind: 'bot', botType: exec.botType, artifactId: a.id },
      }
      if (positive) (inEval(a.id) ? evalSet : train).push(ex)
      else negatives.push({ kind: 'bot_rejected_by_person', botType: exec.botType, messages: ex.messages, artifactId: a.id })
      continue
    }

    const trace = (Array.isArray(out.modelTrace) ? out.modelTrace : [])[Number(n) - 1] as
      { task: string; provider: string; model: string; system: string; prompt: string; output: string; accepted: boolean; rejection?: string } | undefined
    if (!trace) { skip('trace missing'); continue }
    if (!trace.accepted) {
      negatives.push({ kind: 'model_rejected_by_guard', task: trace.task, provider: trace.provider, system: trace.system, prompt: scrub(trace.prompt), rejected: scrub(trace.output), rejection: trace.rejection ?? null, artifactId: a.id })
      continue
    }
    if (!positive) { skip('model answer not approved by a person'); continue }
    const ex: Example = {
      messages: [
        { role: 'system', content: trace.system },
        { role: 'user', content: scrub(trace.prompt) },
        { role: 'assistant', content: scrub(trace.output) },
      ],
      meta: { kind: 'assist', task: trace.task, teacher: `${trace.provider}:${trace.model}`, artifactId: a.id },
    }
    ;(inEval(a.id) ? evalSet : train).push(ex)
  }

  mkdirSync(OUT, { recursive: true })
  const jsonl = (xs: unknown[]) => xs.map(x => JSON.stringify(x)).join('\n') + (xs.length ? '\n' : '')
  writeFileSync(join(OUT, 'train.jsonl'), jsonl(train))
  writeFileSync(join(OUT, 'eval.jsonl'), jsonl(evalSet))
  writeFileSync(join(OUT, 'negatives.jsonl'), jsonl(negatives))
  const manifest = {
    exportedAt: new Date().toISOString(), evalShare: EVAL_SHARE,
    counts: { artifacts: artifacts.length, train: train.length, eval: evalSet.length, negatives: negatives.length },
    byKind: Object.fromEntries(['bot', 'assist'].map(k => [k, train.filter(e => e.meta.kind === k).length])),
    teachers: [...new Set(train.map(e => e.meta.teacher).filter(Boolean))],
    skipped,
  }
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify(manifest, null, 2))
  await prisma.$disconnect()
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1) })
