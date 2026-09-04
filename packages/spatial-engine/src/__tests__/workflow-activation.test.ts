/**
 * Order to workflow to queue.
 *
 * The audit found the engine unreachable: one external importer, no worker, and
 * eleven site_plan_* tables no application wrote. These tests hold the
 * connection open — a paid order must create or resume a workflow and enqueue
 * the first permitted job, and a duplicate delivery must not double anything.
 */

import {
  activateSitePlanWorkflow, type ActivationPorts, type ExistingWorkflow,
} from '../workflow/activation'
import { SITE_PLAN_WORKFLOW_VERSION, FIRST_JOB } from '../workflow/definition'
import { SITE_PLAN_QUEUE, workflowIdempotencyKey } from '../workflow/registry'

interface Enqueued { queue: string; job: string; jobKey: string; workflowId: string }

/** In-memory ports with the unique constraints the real store enforces. */
function ports(seed: ExistingWorkflow | null = null) {
  const workflows = new Map<string, ExistingWorkflow>()
  const queue: Enqueued[] = []
  const jobKeys = new Set<string>()
  const createInputs: { formData: Record<string, unknown> }[] = []
  let created = 0
  if (seed) workflows.set(workflowIdempotencyKey({ orderId: 'ord_1', definitionVersion: SITE_PLAN_WORKFLOW_VERSION }), seed)

  const p: ActivationPorts = {
    async findWorkflowByIdempotencyKey(key) { return workflows.get(key) ?? null },
    async createWorkflow(input) {
      created++
      createInputs.push({ formData: input.formData })
      const wf: ExistingWorkflow = {
        workflowId: `wf_${created}`, definitionVersion: input.definitionVersion, stages: [],
      }
      workflows.set(input.idempotencyKey, wf)
      return { workflowId: wf.workflowId }
    },
    async enqueue(input) {
      // The real store upserts on (queueName, jobId); a redelivery is a no-op.
      if (jobKeys.has(input.jobKey)) return
      jobKeys.add(input.jobKey)
      queue.push({ queue: input.queue, job: input.job, jobKey: input.jobKey, workflowId: input.workflowId })
    },
  }
  return { p, queue, workflows, createInputs, createdCount: () => created }
}

const subject = {
  organizationId: 'org_1', projectId: 'proj_1', orderId: 'ord_1', productId: 'permit_site_plan',
}

describe('production reachability', () => {
  it('hands the order form data to the store, or no stage can resolve a property', async () => {
    // The subject has always carried formData and the port silently dropped it,
    // so every real paid order reached `resolve_property` with an empty object
    // and blocked on 'No address'. Only the pilot worked, because it supplies
    // form data directly rather than through activation.
    const { p, createInputs } = ports()
    const formData = { address: '1005 Rollins Ave', houseSquareFeet: 2400, storeys: 2 }
    await activateSitePlanWorkflow({
      subject: { ...subject, formData }, ports: p, eligible: true,
    })
    expect(createInputs).toHaveLength(1)
    expect(createInputs[0].formData).toEqual(formData)
  })

  it('passes an empty object rather than undefined when an order carries none', async () => {
    const { p, createInputs } = ports()
    await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    expect(createInputs[0].formData).toEqual({})
  })

  it('a paid site-plan order creates a workflow and enqueues the first job', async () => {
    const { p, queue, createdCount } = ports()
    const out = await activateSitePlanWorkflow({ subject, ports: p, eligible: true })

    expect(out.disposition).toBe('CREATED')
    expect(out.workflowId).toBe('wf_1')
    expect(out.enqueued).toEqual([FIRST_JOB])
    expect(createdCount()).toBe(1)
    expect(queue).toHaveLength(1)
  })

  it('enqueues onto the shared site-plan queue, not a per-job queue', async () => {
    const { p, queue } = ports()
    await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    expect(queue[0].queue).toBe(SITE_PLAN_QUEUE)
    expect(queue[0].job).toBe(FIRST_JOB)
  })

  it('creates nothing for an order that is not a site plan', async () => {
    const { p, queue, createdCount } = ports()
    const out = await activateSitePlanWorkflow({ subject, ports: p, eligible: false })
    expect(out.disposition).toBe('NOT_ELIGIBLE')
    expect(out.workflowId).toBeNull()
    expect(createdCount()).toBe(0)
    expect(queue).toHaveLength(0)
  })
})

describe('idempotency', () => {
  it('duplicate delivery does not create a second workflow', async () => {
    const { p, createdCount } = ports()
    const first = await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    const second = await activateSitePlanWorkflow({ subject, ports: p, eligible: true })

    expect(first.disposition).toBe('CREATED')
    expect(second.disposition).not.toBe('CREATED')
    expect(second.workflowId).toBe(first.workflowId)
    expect(createdCount()).toBe(1)
  })

  it('duplicate delivery does not enqueue the same job twice', async () => {
    const { p, queue } = ports()
    await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    await activateSitePlanWorkflow({ subject, ports: p, eligible: true })

    const initializeJobs = queue.filter(q => q.job === FIRST_JOB)
    expect(initializeJobs).toHaveLength(1)
  })

  it('reports DUPLICATE when the first stage is still in flight', async () => {
    const seed: ExistingWorkflow = {
      workflowId: 'wf_seed', definitionVersion: SITE_PLAN_WORKFLOW_VERSION,
      stages: [{ job: FIRST_JOB, status: 'IN_PROGRESS', attempt: 1 }],
    }
    const { p, queue } = ports(seed)
    const out = await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    expect(out.disposition).toBe('DUPLICATE')
    expect(queue).toHaveLength(0)
  })
})

describe('resume', () => {
  it('resumes an interrupted workflow at its next permitted stage', async () => {
    const seed: ExistingWorkflow = {
      workflowId: 'wf_seed', definitionVersion: SITE_PLAN_WORKFLOW_VERSION,
      stages: [
        { job: 'siteplan.initialize', status: 'COMPLETED', attempt: 1 },
        { job: 'siteplan.resolve_property', status: 'COMPLETED', attempt: 1 },
      ],
    }
    const { p, queue } = ports(seed)
    const out = await activateSitePlanWorkflow({ subject, ports: p, eligible: true })

    expect(out.disposition).toBe('RESUMED')
    expect(out.workflowId).toBe('wf_seed')
    // Both branches that are now unblocked, and NOT the two already done.
    expect(out.enqueued).toContain('siteplan.resolve_jurisdiction')
    expect(out.enqueued).not.toContain('siteplan.initialize')
    expect(queue.every(q => q.workflowId === 'wf_seed')).toBe(true)
  })

  it('reports ALREADY_COMPLETE when every stage has finished', async () => {
    const { FIRST_RELEASE_STAGES } = require('../workflow/definition')
    const seed: ExistingWorkflow = {
      workflowId: 'wf_done', definitionVersion: SITE_PLAN_WORKFLOW_VERSION,
      stages: FIRST_RELEASE_STAGES.map((s: { job: string }) =>
        ({ job: s.job, status: 'COMPLETED' as const, attempt: 1 })),
    }
    const { p, queue } = ports(seed)
    const out = await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    expect(out.disposition).toBe('ALREADY_COMPLETE')
    expect(queue).toHaveLength(0)
  })

  it('refuses to mix definition versions', async () => {
    const seed: ExistingWorkflow = {
      workflowId: 'wf_old', definitionVersion: SITE_PLAN_WORKFLOW_VERSION + 1, stages: [],
    }
    const { p, queue } = ports(seed)
    const out = await activateSitePlanWorkflow({ subject, ports: p, eligible: true })
    expect(out.disposition).toBe('VERSION_MISMATCH')
    expect(queue).toHaveLength(0)
  })
})

describe('a paid order is never lost to an exception', () => {
  it('returns FAILED rather than throwing when the store is down', async () => {
    const broken: ActivationPorts = {
      async findWorkflowByIdempotencyKey() { throw new Error('connection refused') },
      async createWorkflow() { throw new Error('unreachable') },
      async enqueue() { throw new Error('unreachable') },
    }
    const out = await activateSitePlanWorkflow({ subject, ports: broken, eligible: true })
    expect(out.disposition).toBe('FAILED')
    expect(out.error).toMatch(/connection refused/)
    expect(out.summary).toMatch(/manual queue/i)
  })

  it('returns FAILED rather than throwing when the queue is down', async () => {
    const { p } = ports()
    const halfBroken: ActivationPorts = {
      ...p,
      async enqueue() { throw new Error('redis down') },
    }
    const out = await activateSitePlanWorkflow({ subject, ports: halfBroken, eligible: true })
    expect(out.disposition).toBe('FAILED')
    expect(out.error).toMatch(/redis down/)
  })
})
