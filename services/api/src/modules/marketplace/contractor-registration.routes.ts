/**
 * contractor-registration.routes.ts
 *
 * Public endpoint: POST /marketplace/contractors/register
 *
 * Single-step contractor onboarding:
 *   1. Create Supabase user + DB User record (via authService.signup)
 *   2. Create MarketplaceProfile (linked to userId)
 *   3. Create ContractorProfile (business details, license, insurance)
 *   4. Create RotationQueueEntry with eligibility = PENDING_VERIFICATION
 *   5. Return session + profileId + nextStep
 *
 * The contractor is NOT lead-eligible until an admin marks
 * licenseVerified = true and insuranceVerified = true (P2 admin panel).
 *
 * Rate-limited: 5 registrations/hour per IP.
 */

import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { z } from 'zod'
import { authService } from '../auth/auth.service'
import { professionalAssignmentService } from './professional-assignment.service'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Validation schema ────────────────────────────────────────────────────────

const contractorRegistrationSchema = z.object({
  // Account credentials
  email:     z.string().email('Invalid email address'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName:  z.string().min(1, 'Last name is required').max(100),

  // Business information
  companyName:  z.string().min(1, 'Company name is required').max(200),
  phone:        z.string().min(10, 'Valid phone number is required').max(20),
  address:      z.string().min(1, 'Address is required').max(300),
  city:         z.string().min(1, 'City is required').max(100),
  state:        z.string().length(2, 'State must be 2-letter abbreviation').toUpperCase(),
  zip:          z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  website:      z.string().url('Invalid website URL').optional().or(z.literal('')),
  description:  z.string().max(2000).optional(),

  // Professional credentials
  tradeSpecialties:   z.array(z.string()).min(1, 'Select at least one trade specialty'),
  serviceAreas:       z.array(z.string()).min(1, 'Select at least one service area'),
  licenseNumbers:     z.array(z.string()).optional().default([]),
  insuranceCarrier:   z.string().max(200).optional(),
  insuranceExpiration: z.string().optional(), // ISO date string

  // Type — always CONTRACTOR for this flow
  professionalType: z.enum(['CONTRACTOR', 'DESIGN_BUILD']).default('CONTRACTOR'),
})

type ContractorRegistrationBody = z.infer<typeof contractorRegistrationSchema>

// ─── Route ────────────────────────────────────────────────────────────────────

export async function contractorRegistrationRoutes(fastify: FastifyInstance) {
  // Rate limit: 5 registrations per hour per IP (skipped in test environment)
  if (process.env.NODE_ENV !== 'test') {
    await fastify.register(rateLimit, {
      max: 5,
      timeWindow: '1 hour',
      keyGenerator: (request) => request.ip || 'unknown',
    })
  }

  /**
   * POST /marketplace/contractors/register
   *
   * Public — no authentication required.
   * Creates user + contractor profiles + queue entry in a single request.
   */
  fastify.post<{ Body: ContractorRegistrationBody }>(
    '/contractors/register',
    async (request, reply) => {
      // 1. Validate body
      const parseResult = contractorRegistrationSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.code(400).send({
          error: parseResult.error.issues[0]?.message ?? 'Validation failed',
          details: parseResult.error.issues,
        })
      }

      const data = parseResult.data

      try {
        const fullName = `${data.firstName} ${data.lastName}`

        // 2. Create Supabase user + DB User (authService handles both)
        const { user, session } = await authService.signup(
          data.email,
          data.password,
          fullName,
        )

        // 3. Create MarketplaceProfile
        const marketplaceProfile = await prismaAny.marketplaceProfile.create({
          data: {
            userId:          user.id,
            businessName:    data.companyName,
            description:     data.description ?? null,
            specialties:     data.tradeSpecialties,
            serviceArea:     data.serviceAreas,
            professionalType: data.professionalType,
            verified:        false,
            acceptingLeads:  false, // Not eligible until verified
          },
        })

        // 4. Create ContractorProfile (business detail record)
        await prismaAny.contractorProfile.create({
          data: {
            userId:       user.id,
            businessName: data.companyName,
            email:        data.email,
            phone:        data.phone ?? null,
            address:      data.address ?? null,
            city:         data.city ?? null,
            state:        data.state ?? null,
            zipCode:      data.zip ?? null,
            description:  data.description ?? null,
            specialties:  data.tradeSpecialties,
            serviceArea:  data.serviceAreas,
            licenseNumber: data.licenseNumbers?.[0] ?? null,
            insuranceInfo: data.insuranceCarrier ? {
              carrier:    data.insuranceCarrier,
              expiration: data.insuranceExpiration ?? null,
              allLicenses: data.licenseNumbers ?? [],
            } : null,
            isVerified:   false,
            isActive:     true,
            acceptingBids: false, // Not active until verified
          },
        })

        // 5. Create RotationQueueEntry — PENDING_VERIFICATION (not lead-eligible)
        await professionalAssignmentService.upsertQueueEntry({
          profileId:        marketplaceProfile.id,
          professionalType: data.professionalType,
          licenseVerified:  false,
          insuranceVerified: false,
          softwareAccessOnly: false,
        })

        fastify.log.info(
          { userId: user.id, profileId: marketplaceProfile.id },
          'Contractor registered — pending verification',
        )

        return reply.code(201).send({
          success:   true,
          userId:    user.id,
          profileId: marketplaceProfile.id,
          session,
          nextStep:  'pending-verification',
          message:   'Registration successful. Your account is pending admin verification. You will be notified when approved.',
        })

      } catch (err: any) {
        fastify.log.error({ err }, 'Contractor registration failed')

        // Email already exists
        if (
          err?.code === '23505' || // Postgres unique violation
          err?.message?.toLowerCase().includes('already registered') ||
          err?.message?.toLowerCase().includes('already exists') ||
          err?.message?.toLowerCase().includes('user already registered')
        ) {
          return reply.code(409).send({
            error: 'An account with this email address already exists. Please sign in or use a different email.',
          })
        }

        return reply.code(400).send({
          error: sanitizeErrorMessage(err, 'Registration failed. Please try again.'),
        })
      }
    },
  )
}
