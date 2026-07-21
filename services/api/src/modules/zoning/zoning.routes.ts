/**
 * KEALEE - ZONING ACCELERATOR ROUTES
 * 21st Century ROAD to Housing Act — Sec 203, 209, NEPA
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { z } from 'zod'
import { zoningService } from './zoning.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Validation Schemas ─────────────────────────────────────────────────────────

const analyzeSchema = z.object({
  address: z.string().min(5),
  parcelNumber: z.string().optional(),
  jurisdictionId: z.string().uuid().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().optional(),
})

const complianceSchema = z.object({
  zoningProfileId: z.string().uuid(),
  housingType: z.enum([
    'SINGLE_FAMILY', 'ADU', 'DUPLEX', 'TRIPLEX', 'FOURPLEX',
    'TOWNHOUSE', 'SMALL_APARTMENT', 'MID_RISE', 'MIXED_USE', 'MANUFACTURED', 'MODULAR',
  ]),
  proposedUnits: z.number().int().min(1).max(500),
  stories: z.number().int().min(1).max(20),
  totalSqFt: z.number().min(200).max(500000),
  buildingHeight: z.number().optional(),
  lotCoverage: z.number().min(0).max(1).optional(),
  proposedFAR: z.number().min(0).max(20).optional(),
  parkingSpaces: z.number().int().min(0).optional(),
})

const nepaSchema = z.object({
  address: z.string().min(5),
  housingType: z.string(),
  proposedUnits: z.number().int().min(1),
  isPreviouslyDeveloped: z.boolean().optional(),
  isInfillSite: z.boolean().optional(),
  acreage: z.number().optional(),
})

const densityBonusSchema = z.object({
  zoningProfileId: z.string().uuid(),
  proposedUnits: z.number().int().min(1),
  affordableUnits: z.number().int().min(0),
  affordableAMI: z.number().min(0).max(150),
})

const permitChecklistSchema = z.object({
  zoningProfileId: z.string().uuid(),
  housingType: z.string(),
  jurisdictionId: z.string().uuid().optional(),
})

// ─── Routes ─────────────────────────────────────────────────────────────────────

export async function zoningRoutes(fastify: FastifyInstance) {
  // POST /zoning/analyze — AI zoning analysis (auth required)
  fastify.post('/analyze', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = analyzeSchema.parse(request.body)
        const userId = (request as any).user?.id
        const result = await zoningService.analyzeZoning(body, userId)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ success: false, error: 'Validation error', details: error.errors })
        }
        request.log.error(error, 'Zoning analysis failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // POST /zoning/compliance-check — Check proposed development compliance
  fastify.post('/compliance-check', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = complianceSchema.parse(request.body)
        const userId = (request as any).user?.id
        const result = await zoningService.checkCompliance(body, userId)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ success: false, error: 'Validation error', details: error.errors })
        }
        request.log.error(error, 'Compliance check failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // POST /zoning/nepa-check — NEPA exemption assessment
  fastify.post('/nepa-check', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = nepaSchema.parse(request.body)
        const result = await zoningService.checkNEPAExemption(body)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ success: false, error: 'Validation error', details: error.errors })
        }
        request.log.error(error, 'NEPA check failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // POST /zoning/permit-checklist — Generate permit requirements
  fastify.post('/permit-checklist', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = permitChecklistSchema.parse(request.body)
        const result = await zoningService.generatePermitChecklist(body)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ success: false, error: 'Validation error', details: error.errors })
        }
        request.log.error(error, 'Permit checklist generation failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // POST /zoning/density-bonus — Density bonus calculator
  fastify.post('/density-bonus', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = densityBonusSchema.parse(request.body)
        const result = await zoningService.analyzeDensityBonus(body)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ success: false, error: 'Validation error', details: error.errors })
        }
        request.log.error(error, 'Density bonus analysis failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /zoning/profile/:id — Get ZoningProfile
  fastify.get('/profile/:id', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const result = await zoningService.getProfile(id)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get zoning profile failed')
        return reply.status(error.statusCode || 500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /zoning/reports/:profileId — List compliance reports
  fastify.get('/reports/:profileId', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { profileId } = request.params as { profileId: string }
        const result = await zoningService.getReports(profileId)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get compliance reports failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /zoning/lookup?address=... — Public address lookup (no auth)
  fastify.get('/lookup', {
    handler: async (request, reply) => {
      try {
        const { address } = request.query as { address?: string }
        if (!address || address.length < 5) {
          return reply.status(400).send({ success: false, error: 'Address is required (min 5 chars)' })
        }
        const result = await zoningService.lookupAddress(address)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Address lookup failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })
}
