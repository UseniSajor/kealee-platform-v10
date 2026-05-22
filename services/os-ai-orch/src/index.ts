import Fastify from 'fastify'
import cors from '@fastify/cors'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import {
  getV30ProjectGenerationStatus,
  getV30ProjectWorkspace,
  startV30Generation,
} from '@kealee/os-ai-orch'
import { z } from 'zod'

const SERVICE_NAME = 'os-ai-orch'
const PORT = parseInt(process.env.PORT || '3017', 10)

const generateSchema = z.object({
  projectId: z.string().min(1),
  packageId: z.string().min(1),
  sharedInput: z.record(z.unknown()).optional(),
})

async function bootstrap() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: true })

  app.get('/health', async () => ({
    status: 'ok',
    service: SERVICE_NAME,
    v30: isV30Enabled(),
  }))

  app.post('/v30/generate', async (request, reply) => {
    if (!isV30Enabled()) return reply.code(503).send({ error: 'v30 disabled' })
    const parsed = generateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid body' })
    }
    try {
      const result = await startV30Generation(parsed.data)
      return reply.send(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      return reply.code(503).send({ error: message })
    }
  })

  app.get('/v30/project/:projectId/status', async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    try {
      return reply.send(await getV30ProjectGenerationStatus(projectId))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Status unavailable'
      return reply.code(503).send({ error: message })
    }
  })

  app.get('/v30/project/:projectId/workspace', async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    try {
      const workspace = await getV30ProjectWorkspace(projectId)
      const generation = await getV30ProjectGenerationStatus(projectId)
      return reply.send({ ...workspace, generation })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Workspace unavailable'
      return reply.code(503).send({ error: message })
    }
  })

  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`[${SERVICE_NAME}] listening on ${PORT}`)
}

bootstrap().catch(err => {
  console.error(`[${SERVICE_NAME}]`, err)
  process.exit(1)
})
