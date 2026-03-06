/**
 * KEALEE - DEVELOPMENT PACKAGE ROUTES
 * 21st Century ROAD to Housing Act — AI Development Package Generator
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { z } from 'zod'
import { developmentPackageService } from './development-package.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Validation Schemas ─────────────────────────────────────────────────────────

const generateSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().min(5),
  parcelNumber: z.string().optional(),
  housingType: z.enum([
    'SINGLE_FAMILY', 'ADU', 'DUPLEX', 'TRIPLEX', 'FOURPLEX',
    'TOWNHOUSE', 'SMALL_APARTMENT', 'MID_RISE', 'MIXED_USE', 'MANUFACTURED', 'MODULAR',
  ]),
  proposedUnits: z.number().int().min(1).max(500),
  totalSqFt: z.number().min(200).max(500000),
  stories: z.number().int().min(1).max(20),
  targetAMI: z.number().optional(),
  affordableUnits: z.number().int().min(0).optional(),
})

// ─── Routes ─────────────────────────────────────────────────────────────────────

export async function developmentPackageRoutes(fastify: FastifyInstance) {
  // POST /development-package/generate — Start async generation
  fastify.post('/generate', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = generateSchema.parse(request.body)
        const userId = (request as any).user?.id
        const result = await developmentPackageService.generatePackage(body, userId)
        return reply.status(202).send({ success: true, data: result })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ success: false, error: 'Validation error', details: error.errors })
        }
        request.log.error(error, 'Package generation failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /development-package/:id — Full package with all components
  fastify.get('/:id', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const result = await developmentPackageService.getPackage(id)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get package failed')
        return reply.status(error.statusCode || 500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /development-package/:id/status — Lightweight status poll
  fastify.get('/:id/status', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const result = await developmentPackageService.getPackageStatus(id)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get package status failed')
        return reply.status(error.statusCode || 500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /development-package/my-packages — User's packages
  fastify.get('/my-packages', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const userId = (request as any).user?.id
        const result = await developmentPackageService.getMyPackages(userId)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get my packages failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })
}
