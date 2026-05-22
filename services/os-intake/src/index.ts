import Fastify from 'fastify'
import cors from '@fastify/cors'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { processV30ProjectIntake } from '@kealee/os-intake'
import { z } from 'zod'

const SERVICE_NAME = 'os-intake'
const PORT = parseInt(process.env.PORT || '3016', 10)

const intakeSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  answers: z.record(z.unknown()),
  selectedFeatures: z.array(z.string()).optional(),
})

async function bootstrap() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: true })

  app.get('/health', async () => ({
    status: 'ok',
    service: SERVICE_NAME,
    v30: isV30Enabled(),
  }))

  app.post('/v30/intake', async (request, reply) => {
    if (!isV30Enabled()) {
      return reply.code(503).send({ error: 'v30 disabled' })
    }
    const parsed = intakeSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.flatten() })
    }
    try {
      const result = await processV30ProjectIntake({
        projectId: parsed.data.projectId,
        userId: parsed.data.userId,
        answers: parsed.data.answers as Parameters<typeof processV30ProjectIntake>[0]['answers'],
        selectedFeatures: parsed.data.selectedFeatures,
      })
      return reply.code(201).send(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Intake failed'
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
