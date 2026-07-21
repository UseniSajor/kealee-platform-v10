import { FastifyPluginAsync } from 'fastify'
import { LeadIntelligenceService } from '../../services/lead-intelligence.service.js'

export const leadRoutes: FastifyPluginAsync = async (fastify) => {
  // ── POST /api/v1/lead/update ──────────────────────────────────────────────
  fastify.post<{
    Body: {
      email?: string
      phone?: string
      firstName?: string
      lastName?: string
      projectType?: string
      location?: string
      budgetRange?: string
      hasPlans?: boolean
      needsPermit?: boolean
      urgencyLevel?: string
      source?: string
      event?: string
      scorePoints?: number
    }
  }>('/api/v1/lead/update', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email:       { type: 'string', format: 'email' },
          phone:       { type: 'string' },
          firstName:   { type: 'string' },
          lastName:    { type: 'string' },
          projectType: { type: 'string' },
          location:    { type: 'string' },
          budgetRange: { type: 'string' },
          hasPlans:    { type: 'boolean' },
          needsPermit: { type: 'boolean' },
          urgencyLevel:{ type: 'string' },
          source:      { type: 'string' },
          event:       { type: 'string' },
          scorePoints: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const { email, phone, event, scorePoints, ...profileData } = request.body

    if (!email && !phone) {
      return reply.status(400).send({ error: 'email or phone required' })
    }

    try {
      // Upsert profile
      const profile = await LeadIntelligenceService.upsertLeadProfile({
        email,
        phone,
        ...profileData,
      })

      // Score if event provided
      let scoreResult: { newScore: number; stage: string; isHot: boolean } | null = null
      if (event && email) {
        scoreResult = await LeadIntelligenceService.scoreLeadByEmail(email, event, scorePoints)
      }

      return reply.send({
        success: true,
        leadId: profile.id,
        leadScore: scoreResult?.newScore ?? profile.leadScore,
        stage: scoreResult?.stage ?? profile.stage,
        isHot: scoreResult?.isHot ?? false,
      })
    } catch (err) {
      fastify.log.error(err, 'lead upsert error')
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // ── GET /api/v1/lead/:id ──────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/api/v1/lead/:id',
    async (request, reply) => {
      const { id } = request.params
      const lead = await LeadIntelligenceService.getLeadById(id)
      if (!lead) return reply.status(404).send({ error: 'Lead not found' })
      return reply.send(lead)
    }
  )
}
