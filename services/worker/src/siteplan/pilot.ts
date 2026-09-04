/**
 * Pilot: drives the production chain against a real database.
 *
 * Not a generator. It calls the SAME entry point the Stripe webhook calls
 * (Workflow.activateSitePlanWorkflow) and the SAME drain the cron calls
 * (drainSitePlanQueue). No business logic lives here — if this file ever
 * computes something about a site plan, it has become a second engine.
 */

import { prisma } from '@kealee/database'
import { Workflow } from '@kealee/pascal-agents/engine'
import { drainSitePlanQueue } from './processor'

async function main() {
  const address = process.argv[2] ?? '1005 Rollins Ave'
  const orderId = process.argv[3] ?? `pilot_${Date.now()}`

  console.log(`\n=== PILOT: ${address} (order ${orderId}) ===\n`)

  // Minimal owning records, as an intake would have created.
  const org = await prisma.org.upsert({
    where: { id: 'pilot-org' },
    create: { id: 'pilot-org', name: 'Pilot Org', slug: 'pilot-org' },
    update: {},
    select: { id: true },
  })
  // One project per order, as a real order has. `sitePlanWorkflow` is unique on
  // (organizationId, projectId), so a fixed project id meant the pilot could
  // only ever run ONCE against a given database — the second run died on a
  // constraint violation rather than on anything about the site plan.
  const projectId = `pilot-project-${orderId}`
  const project = await prisma.project.upsert({
    where: { id: projectId },
    create: {
      // `Project` has no `projectNumber` column, and `status` is a plain String
      // with an 'ACTIVE' default — the `as never` beside it was hiding exactly
      // the kind of mismatch that `projectNumber` turned out to be.
      id: projectId, orgId: org.id, name: address, status: 'ACTIVE',
    },
    update: {},
    select: { id: true },
  }).catch(async () => {
    const p = await prisma.project.findFirst({ select: { id: true } })
    return p ?? { id: projectId }
  })

  // ── 1. The production entry point ────────────────────────────────────────
  const activation = await Workflow.activateSitePlanWorkflow({
    subject: {
      organizationId: org.id, projectId: project.id, orderId,
      productId: 'permit_site_plan',
      formData: { address, houseSquareFeet: 2400, storeys: 2, garage: 'attached_2_car' },
    },
    eligible: true,
    ports: {
      async findWorkflowByIdempotencyKey(key) {
        const wf = await prisma.sitePlanWorkflow.findUnique({
          where: { idempotencyKey: key }, select: { id: true, definitionVersion: true },
        })
        if (!wf) return null
        const ex = await prisma.sitePlanStageExecution.findMany({
          where: { workflowId: wf.id }, select: { job: true, status: true, attempt: true },
        })
        return {
          workflowId: wf.id, definitionVersion: wf.definitionVersion,
          stages: ex.filter(e => e.job).map(e => ({
            job: e.job as never, status: e.status as never, attempt: e.attempt,
          })),
        }
      },
      async createWorkflow(i) {
        const wf = await prisma.sitePlanWorkflow.create({
          data: {
            idempotencyKey: i.idempotencyKey, definitionVersion: i.definitionVersion,
            organizationId: i.organizationId, projectId: i.projectId,
            orderId: i.orderId, productId: i.productId,
            currentStage: i.currentStage as never, status: 'ACTIVE',
            version: 1, professionalReviewRequired: true,
            // The port now carries the subject form data, so write THAT rather than a
            // hardcoded copy — a second source of truth here is how the pilot
            // passed while every real order reached the engine with nothing.
            metadata: i.formData as never,
          },
          select: { id: true },
        })
        return { workflowId: wf.id }
      },
      async enqueue(i) {
        await prisma.jobQueue.upsert({
          where: { queueName_jobId: { queueName: i.queue, jobId: i.jobKey } },
          create: {
            queueName: i.queue, jobId: i.jobKey, jobName: i.job, status: 'WAITING',
            priority: 0, attempts: 0, maxAttempts: i.maxAttempts,
            data: { workflowId: i.workflowId, job: i.job, payloadVersion: i.payloadVersion } as never,
          },
          update: {},
        })
      },
    },
  })

  console.log(`[1] activation: ${activation.disposition}`)
  console.log(`    workflow: ${activation.workflowId}`)
  console.log(`    enqueued: ${activation.enqueued.join(', ')}`)
  if (!activation.workflowId) { console.log('    HALTED:', activation.summary); return }

  // ── 2. Drain, exactly as the cron does ───────────────────────────────────
  console.log('\n[2] draining …')
  for (let tick = 1; tick <= 20; tick++) {
    const r = await drainSitePlanQueue(5)
    if (r.claimed === 0) break
    for (const d of r.details) {
      console.log(`    ${String(d.job).padEnd(36)} ${d.disposition}`)
      if (d.disposition !== 'COMPLETED' && d.disposition !== 'SKIPPED_ALREADY_DONE') {
        console.log(`        ${d.summary}`)
      }
    }
  }

  // ── 3. What actually landed in the database ──────────────────────────────
  const wfId = activation.workflowId
  const stages = await prisma.sitePlanStageExecution.findMany({
    where: { workflowId: wfId },
    select: { job: true, stage: true, status: true, outputs: true },
    orderBy: { createdAt: 'asc' },
  })
  const wf = await prisma.sitePlanWorkflow.findUnique({
    where: { id: wfId }, select: { currentStage: true, definitionVersion: true },
  })
  const docs = await prisma.document.findMany({
    where: { category: { startsWith: 'site-plan' } },
    select: { id: true, name: true, size: true, category: true },
  })
  const audit = await prisma.sitePlanAuditEvent.count({ where: { workflowId: wfId } })
  const jobs = await prisma.jobQueue.groupBy({
    by: ['status'], where: { queueName: 'siteplan' }, _count: true,
  })

  console.log('\n[3] persisted:')
  console.log(`    workflow stage: ${wf?.currentStage}  (definition v${wf?.definitionVersion})`)
  console.log(`    stage rows: ${stages.length}`)
  for (const s of stages) console.log(`      ${String(s.job).padEnd(36)} ${s.stage.padEnd(20)} ${s.status}`)
  console.log(`    audit events: ${audit}`)
  console.log(`    jobs: ${jobs.map(j => `${j.status}=${j._count}`).join(' ')}`)
  console.log(`    documents: ${docs.length}`)
  for (const d of docs) console.log(`      ${d.id}  ${d.name}  ${d.size} bytes  [${d.category}]`)

  const deliver = stages.find(s => s.job === 'siteplan.deliver_preliminary')
  if (deliver) console.log(`\n[4] delivery: ${JSON.stringify(deliver.outputs)}`)
}

main()
  .catch(e => { console.error('\nPILOT FAILED:', e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
