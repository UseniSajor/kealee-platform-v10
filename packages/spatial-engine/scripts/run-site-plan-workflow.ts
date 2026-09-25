/**
 * Runs the PRODUCTION site-plan workflow for one address, against live GIS,
 * with no database — every stage through the real runner and the real
 * processors, not a parallel script that could drift from them.
 *
 *   cd packages/spatial-engine
 *   pnpm tsx scripts/run-site-plan-workflow.ts "3210 Newark St NW, Washington, DC 20008" \
 *     '{"houseSquareFeet":2400,"storeys":2}'
 *
 * Output goes to output/site-plans/<slug>/ at the repo root: the PDF, the CAD
 * exports, and a manifest.json holding the form data that drove the run, every
 * stage's output and the document list. A bare PDF records what came out and
 * nothing about why; the manifest is what makes a generated plan useful as a
 * record and as training material.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { runStage, type RunnerDeps } from '../src/workflow/runner'
import { SITE_PLAN_PROCESSORS } from '../src/workflow/processors'
import { newWorkflow, nextJobs, type WorkflowSnapshot } from '../src/workflow/state-machine'
import type { SitePlanJobName } from '../src/workflow/definition'
import type { StageContext, PersistedStageOutput, TraceEvent } from '../src/workflow/context'

async function main() {
  const [address, formJson] = process.argv.slice(2)
  if (!address) {
    console.error('usage: tsx scripts/run-site-plan-workflow.ts "<address>" [formData JSON]')
    process.exit(2)
  }
  const formData = { projectAddress: address, ...(formJson ? JSON.parse(formJson) : {}) }
  const slug = address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  const outDir = resolve(__dirname, '..', '..', '..', 'output', 'site-plans', slug)
  mkdirSync(outDir, { recursive: true })

  const persisted: PersistedStageOutput[] = []
  const traces: TraceEvent[] = []
  const documents: { documentId: string; filename: string; contentType: string; bytes: number }[] = []
  let seq = 0

  const capabilities = {
    fetchImpl: fetch,
    async persist(r: PersistedStageOutput) { persisted.push(r) },
    async storeArtifact(a: { bytes: Buffer; filename: string; contentType: string }) {
      writeFileSync(join(outDir, a.filename), a.bytes)
      const documentId = `local_${++seq}`
      documents.push({ documentId, filename: a.filename, contentType: a.contentType, bytes: a.bytes.length })
      return { documentId }
    },
    trace(e: TraceEvent) {
      traces.push(e)
      const d = (e as { detail?: unknown }).detail
      if (d) console.log(`    · ${typeof d === 'string' ? d : JSON.stringify(d)}`)
    },
    now: () => new Date(),
  }
  const deps: RunnerDeps = {
    processors: SITE_PLAN_PROCESSORS as never,
    async loadPriorResult(_w, job) { return persisted.find(p => p.job === job)?.outputs ?? null },
  }
  const subject = {
    organizationId: 'local', projectId: slug, orderId: slug, productId: 'permit_site_plan', formData,
  }
  const ctxFor = (snap: WorkflowSnapshot, job: SitePlanJobName): StageContext => ({
    workflowId: `local-${slug}`, job, attempt: 1, subject, snapshot: snap,
    capabilities: capabilities as never,
    priorOutputs: Object.fromEntries(
      persisted.filter(p => p.status === 'COMPLETED').map(p => [p.job, p.outputs]),
    ) as never,
  })

  let snap = newWorkflow(`local-${slug}`)
  let halted: unknown = null
  for (let i = 0; i < 30; i++) {
    const runnable = nextJobs(snap, { firstReleaseOnly: true })
    if (!runnable.length) break
    const job = runnable[0]
    const t0 = Date.now()
    const out = await runStage(ctxFor(snap, job), deps)
    console.log(`${out.disposition.padEnd(10)} ${job}  (${Date.now() - t0} ms)`)
    if (out.disposition !== 'COMPLETED') {
      halted = out
      const last = persisted[persisted.length - 1] as { blockers?: string[] } | undefined
      for (const b of last?.blockers ?? []) console.log(`    BLOCKER: ${b}`)
      break
    }
    snap = { ...snap, stages: [...snap.stages, { job, status: 'COMPLETED', attempt: 1 }] }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    address, formData,
    halted,
    stages: persisted.map(p => ({ job: p.job, status: p.status, outputs: p.outputs, blockers: (p as { blockers?: string[] }).blockers })),
    documents,
    traces,
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1))
  console.log(`\n${documents.length} document(s) and manifest.json → ${outDir}`)
  process.exit(halted ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
