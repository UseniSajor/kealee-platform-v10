import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import {
  HermesOrchestrator,
  KeaBotBridge,
  ObsidianVaultWriter,
  OrgoComputerClient,
  ReadinessAuditRunner,
  type AgentRunRequest,
  type AgentRunResult,
  type KeaBotDescriptor,
} from '@kealee/kealee-agent-stack'
import { botRegistry } from '../bots/bots.registry'

const runStore = new Map<string, AgentRunResult>()

const runBodySchema = z.object({
  name: z.string().min(1).default('Kealee Agent Ops Run'),
  goal: z.string().min(1),
  mode: z.enum(['dry-run', 'live']).optional(),
  agents: z.array(z.string().min(1)).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const auditBodySchema = z.object({
  dryRun: z.boolean().optional(),
  siteUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function agentOpsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    const token = process.env.AGENT_OPS_INTERNAL_TOKEN
    if (!token) return

    const header = request.headers.authorization ?? request.headers['x-agent-ops-token']
    const provided = Array.isArray(header) ? header[0] : header
    const normalized = typeof provided === 'string' && provided.startsWith('Bearer ')
      ? provided.slice('Bearer '.length)
      : provided

    if (normalized !== token) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.post('/runs', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = runBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid run request', issues: parsed.error.flatten() })
    }

    const runner = createReadinessRunner()
    const result = await runner.run(parsed.data as AgentRunRequest)
    runStore.set(result.id, result)
    return reply.code(202).send(result)
  })

  fastify.get('/runs/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = (request.params as { id?: string }).id
    if (!id) return reply.code(400).send({ error: 'id is required' })

    const inMemory = runStore.get(id)
    if (inMemory) return reply.send(inMemory)

    const latest = await createObsidianWriter().readLatest()
    if (latest?.id === id) return reply.send(latest)
    return reply.code(404).send({ error: 'Agent Ops run not found' })
  })

  fastify.get('/readiness/latest', async (_request: FastifyRequest, reply: FastifyReply) => {
    const latest = await createObsidianWriter().readLatest()
    if (!latest) return reply.code(404).send({ error: 'No readiness audit has been recorded yet' })
    return reply.send(latest)
  })

  fastify.post('/readiness/audit', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = auditBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid audit request', issues: parsed.error.flatten() })
    }

    const runner = createReadinessRunner(parsed.data.siteUrl)
    const result = await runner.run({
      name: 'Kealee Blocking Launch Readiness Audit',
      goal: 'Audit repo, agent ops, and web-main sales funnel for blocking launch readiness.',
      mode: parsed.data.dryRun === false ? 'live' : undefined,
      metadata: {
        trigger: 'POST /agent-ops/readiness/audit',
        ...parsed.data.metadata,
      },
    })
    runStore.set(result.id, result)
    return reply.code(202).send(result)
  })
}

function createReadinessRunner(siteUrl?: string) {
  return new ReadinessAuditRunner({
    hermes: new HermesOrchestrator({
      apiUrl: process.env.HERMES_API_URL,
      apiKey: process.env.HERMES_API_KEY,
    }),
    orgo: new OrgoComputerClient({
      apiUrl: process.env.ORGO_API_URL,
      apiKey: process.env.ORGO_API_KEY,
    }),
    obsidian: createObsidianWriter(),
    keabots: new KeaBotBridge({ listBots: listKeaBots }),
    siteUrl: siteUrl ?? process.env.AGENT_OPS_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  })
}

function createObsidianWriter() {
  return new ObsidianVaultWriter({
    vaultPath: process.env.OBSIDIAN_VAULT_PATH ?? `${process.cwd()}/tmp/obsidian-agent-ops`,
  })
}

async function listKeaBots(): Promise<KeaBotDescriptor[]> {
  const modernBots = botRegistry.list().map(bot => ({
    name: bot.id,
    displayName: bot.name,
    domain: 'api-bots',
    version: bot.version,
  }))

  return [...LEGACY_KEABOTS, ...modernBots]
}

const LEGACY_KEABOTS: KeaBotDescriptor[] = [
  { name: 'keabot-owner', displayName: 'Owner Bot', stage: 'intake', domain: 'owner', version: '1.0.0' },
  { name: 'keabot-design', displayName: 'Design Bot', stage: 'design', domain: 'design', version: '1.0.0' },
  { name: 'keabot-permit', displayName: 'Permit Bot', stage: 'permit', domain: 'permit', version: '1.0.0' },
  { name: 'keabot-estimate', displayName: 'Estimate Bot', stage: 'estimate', domain: 'estimate', version: '1.0.0' },
  { name: 'keabot-contractor-match', displayName: 'Contractor Match Bot', stage: 'contractor', domain: 'contractor', version: '1.0.0' },
  { name: 'keabot-feasibility', displayName: 'Feasibility Bot', stage: 'feasibility', domain: 'feasibility', version: '1.0.0' },
  { name: 'keabot-payments', displayName: 'Payments Bot', stage: 'payments', domain: 'payments', version: '1.0.0' },
  { name: 'keabot-construction', displayName: 'Construction Bot', stage: 'execution', domain: 'construction', version: '1.0.0' },
  { name: 'keabot-project-monitor', displayName: 'Project Monitor Bot', stage: 'monitoring', domain: 'monitoring', version: '1.0.0' },
  { name: 'keabot-support', displayName: 'Support Bot', stage: 'support', domain: 'support', version: '1.0.0' },
  { name: 'keabot-marketing', displayName: 'Marketing Bot', stage: 'marketing', domain: 'marketing', version: '1.0.0' },
  { name: 'keabot-finance', displayName: 'Finance Bot', stage: 'monitoring', domain: 'finance', version: '1.0.0' },
  { name: 'keabot-gc', displayName: 'GC Bot', stage: 'contractor', domain: 'gc', version: '1.0.0' },
  { name: 'keabot-land', displayName: 'Land Bot', stage: 'intake', domain: 'land', version: '1.0.0' },
  { name: 'keabot-marketplace', displayName: 'Marketplace Bot', stage: 'contractor', domain: 'marketplace', version: '1.0.0' },
  { name: 'keabot-operations', displayName: 'Ops Bot', stage: 'monitoring', domain: 'operations', version: '1.0.0' },
  { name: 'keabot-command', displayName: 'Command Bot', stage: 'monitoring', domain: 'command', version: '1.0.0' },
  { name: 'keabot-developer', displayName: 'Developer Bot', stage: 'intake', domain: 'developer', version: '1.0.0' },
]
