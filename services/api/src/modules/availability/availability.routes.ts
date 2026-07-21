/**
 * services/api/src/modules/availability/availability.routes.ts
 *
 * POST /api/v1/availability/check
 * GET  /api/v1/availability/check?service=permit-simple&address=...
 * GET  /api/v1/availability/services
 */

import type { FastifyInstance } from 'fastify'
import { evaluateAvailability } from '../../services/availability.service.js'

export async function availabilityRoutes(fastify: FastifyInstance) {
  fastify.post('/check', {
    schema: {
      body: {
        type: 'object',
        required: ['serviceType'],
        properties: {
          serviceType: { type: 'string' },
          projectAddress: { type: 'string' },
          hasPlans: { type: 'boolean' },
          projectDescription: { type: 'string' },
          jurisdiction: { type: 'string' },
          urgencyFlag: { type: 'boolean' },
        },
      },
    },
    handler: async (request, reply) => {
      const body = request.body as any
      const result = await evaluateAvailability({
        serviceType: body.serviceType,
        requestedAt: new Date(),
        projectAddress: body.projectAddress,
        hasPlans: body.hasPlans,
        projectDescription: body.projectDescription,
        jurisdiction: body.jurisdiction,
        urgencyFlag: body.urgencyFlag,
      })
      return reply.send(result)
    },
  })

  fastify.get('/check', {
    handler: async (request, reply) => {
      const query = request.query as Record<string, string>
      const result = await evaluateAvailability({
        serviceType: query.service ?? query.serviceType ?? 'unknown',
        requestedAt: new Date(),
        projectAddress: query.address ?? query.projectAddress,
        hasPlans: query.hasPlans === 'true',
        projectDescription: query.description,
        jurisdiction: query.jurisdiction,
      })
      return reply.send(result)
    },
  })

  fastify.get('/services', {
    handler: async (_request, reply) => {
      const services = [
        { id: 'permit-simple', name: 'Permit Research + Checklist', turnaroundDays: 1, price: 149 },
        { id: 'permit-package', name: 'Full Permit Package', turnaroundDays: 4, price: 950 },
        { id: 'permit-coordination', name: 'Permit Coordination', turnaroundDays: 7, price: 2750 },
        { id: 'permit-expediting', name: 'Permit Expediting', turnaroundDays: 0.5, price: 5500 },
        { id: 'concept-exterior', name: 'AI Exterior Concept', turnaroundDays: 1, price: 395 },
        { id: 'concept-interior-reno', name: 'AI Interior Reno Concept', turnaroundDays: 1, price: 395 },
        { id: 'concept-whole-home', name: 'AI Whole-Home Concept', turnaroundDays: 2, price: 395 },
        { id: 'concept-garden', name: 'AI Garden Concept', turnaroundDays: 1, price: 395 },
        { id: 'cost-estimate-ai', name: 'AI Design Estimate', turnaroundDays: 2, price: 395 },
        { id: 'cost-estimate-detailed', name: 'Detailed Cost Estimate', turnaroundDays: 6, price: 695 },
        { id: 'cost-estimate-certified', name: 'Certified Cost Estimate', turnaroundDays: 8, price: 1200 },
        { id: 'design-starter', name: 'Design Starter Package', turnaroundDays: 7, price: 1200 },
        { id: 'design-visualization', name: 'Design Visualization Package', turnaroundDays: 10, price: 2800 },
        { id: 'design-predesign', name: 'Full Pre-Design Package', turnaroundDays: 14, price: 6500 },
      ]
      return reply.send({ services })
    },
  })
}
