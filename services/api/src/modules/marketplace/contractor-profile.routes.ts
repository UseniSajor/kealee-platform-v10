/**
 * contractor-profile.routes.ts
 *
 * Authenticated contractor-facing profile endpoints.
 * Registered at prefix /marketplace, so final paths are:
 *
 *   GET   /marketplace/contractors/profile  — fetch own profile
 *   PATCH /marketplace/contractors/profile  — update profile
 *
 * Credential changes (licenseNumber, allLicenses, insuranceCarrier,
 * insuranceExpiration) will:
 *   1. Reset RotationQueueEntry.eligibility → PENDING_VERIFICATION
 *   2. Clear licenseVerified / insuranceVerified flags
 *   3. Mark MarketplaceProfile.verified = false, acceptingLeads = false
 *   4. Mark ContractorProfile.isVerified = false
 *   5. Emit verification.credentials_updated workflow event
 *
 * Non-credential field changes are safe and do NOT trigger re-review.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { workflowEventService, WorkflowEventService } from '../workflow/workflow-event.service'

// ─── Validation schema ────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  // Business Info
  businessName:     z.string().min(1, 'Company name is required').max(200),
  description:      z.string().max(2000).optional(),
  phone:            z.string().max(20).optional(),
  email:            z.string().email('Invalid email').optional(),
  website:          z.string().url('Enter a valid URL (include https://)').optional().or(z.literal('')),
  yearsInBusiness:  z.number().int().min(0).max(100).optional(),
  teamSize:         z.number().int().min(1).max(10000).optional(),
  emergencyServices: z.boolean().optional(),

  // Services
  tradeSpecialties:      z.array(z.string()).min(1, 'Select at least one specialty'),
  serviceCategories:     z.array(z.string()).optional().default([]),
  commercialFocus:       z.boolean().optional().default(false),
  residentialFocus:      z.boolean().optional().default(true),
  preferredProjectSizes: z.array(z.string()).optional().default([]),

  // Coverage
  serviceRadius: z.number().int().min(0).max(500).optional(),
  serviceStates: z.array(z.string()).optional().default([]),
  serviceCities: z.array(z.string()).optional().default([]),

  // Credentials — changes trigger reverification
  licenseNumber:       z.string().max(200).optional(),
  allLicenses:         z.array(z.string()).optional().default([]),
  insuranceCarrier:    z.string().max(200).optional(),
  insuranceExpiration: z.string().optional(), // ISO date string

  // Marketplace toggle
  acceptingLeads: z.boolean().optional(),
})

export type ProfileUpdateBody = z.infer<typeof profileUpdateSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveVerificationStatus(eligibility: string, isVerified: boolean): string {
  if (eligibility === 'ELIGIBLE' && isVerified) return 'APPROVED'
  if (eligibility === 'SUSPENDED')  return 'SUSPENDED'
  if (eligibility === 'INELIGIBLE') return 'REJECTED'
  return 'PENDING'
}

function buildProfileResponse(contractor: any, marketplace: any, queueEntry: any) {
  return {
    contractorProfileId:  contractor.id,
    marketplaceProfileId: marketplace?.id ?? null,
    userId:               contractor.userId,

    // Business
    businessName:     contractor.businessName,
    description:      contractor.description ?? null,
    phone:            contractor.phone ?? null,
    email:            contractor.email,
    website:          contractor.website ?? null,
    yearsInBusiness:  contractor.yearsInBusiness ?? null,
    teamSize:         contractor.teamSize ?? null,
    emergencyServices: contractor.emergencyServices ?? false,

    // Services
    tradeSpecialties:      contractor.specialties ?? [],
    serviceCategories:     contractor.serviceCategories ?? [],
    commercialFocus:       contractor.commercialFocus ?? false,
    residentialFocus:      contractor.residentialFocus ?? true,
    preferredProjectSizes: contractor.preferredProjectSizes ?? [],

    // Coverage
    serviceRadius: contractor.serviceRadius ?? null,
    serviceStates: contractor.serviceStates ?? [],
    serviceCities: contractor.serviceCities ?? [],

    // Address (read-only on this endpoint)
    address: contractor.address ?? null,
    city:    contractor.city ?? null,
    state:   contractor.state ?? null,
    zip:     contractor.zipCode ?? null,

    // Credentials
    licenseNumber:       contractor.licenseNumber ?? null,
    allLicenses:         contractor.insuranceInfo?.allLicenses ?? [],
    insuranceCarrier:    contractor.insuranceInfo?.carrier ?? null,
    insuranceExpiration: contractor.insuranceInfo?.expiration ?? null,

    // Status
    isVerified:         contractor.isVerified ?? false,
    acceptingBids:      contractor.acceptingBids ?? false,
    verificationStatus: deriveVerificationStatus(
      queueEntry?.eligibility ?? 'PENDING_VERIFICATION',
      contractor.isVerified ?? false,
    ),
    eligibility:       queueEntry?.eligibility ?? 'PENDING_VERIFICATION',
    licenseVerified:   queueEntry?.licenseVerified ?? false,
    insuranceVerified: queueEntry?.insuranceVerified ?? false,

    // Marketplace
    acceptingLeads:    marketplace?.acceptingLeads ?? false,
    rating:            contractor.rating ? Number(contractor.rating) : 0,
    reviewCount:       contractor.reviewCount ?? 0,
    projectsCompleted: contractor.projectsCompleted ?? 0,
  }
}

// ─── Route registration ───────────────────────────────────────────────────────

export async function contractorProfileRoutes(fastify: FastifyInstance) {
  // ──────────────────────────────────────────────────────────────────────────
  // GET /marketplace/contractors/slugs — public, for sitemap generation
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get(
    '/contractors/slugs',
    async (request, reply) => {
      try {
        const contractors = await prismaAny.contractorProfile.findMany({
          where: { profileVisibility: 'PUBLIC', isVerified: true, slug: { not: null } },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        });
        return contractors;
      } catch (error: any) {
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch slugs') });
      }
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // GET /marketplace/contractors/profile/:slug — public, no auth
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get(
    '/contractors/profile/:slug',
    async (request, reply) => {
      try {
        const { slug } = request.params as { slug: string };

        const profile = await prismaAny.contractorProfile.findFirst({
          where: {
            slug,
            profileVisibility: 'PUBLIC',
            isVerified: true,
          },
          select: {
            id:                    true,
            slug:                  true,
            companyName:           true,
            tradeSpecialties:      true,
            serviceAreas:          true,
            isVerified:            true,
            rating:                true,
            reviewCount:           true,
            bio:                   true,
            listingTier:           true,
            city:                  true,
            state:                 true,
          },
        });

        if (!profile) {
          return reply.code(404).send({ error: 'Contractor not found' });
        }

        return profile;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch contractor profile' });
      }
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // GET /marketplace/contractors/profile
  // Returns the authenticated contractor's own combined profile.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get(
    '/contractors/profile',
    { preHandler: [authenticateUser] },
    async (request: any, reply) => {
      const userId = request.user.id

      try {
        const [contractor, marketplace] = await Promise.all([
          prismaAny.contractorProfile.findFirst({ where: { userId } }),
          prismaAny.marketplaceProfile.findFirst({
            where: { userId },
            include: {
              queueEntries: {
                where: { professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          }),
        ])

        if (!contractor) {
          return reply.code(404).send({
            error: 'Contractor profile not found. Please complete registration first.',
          })
        }

        const queueEntry = marketplace?.queueEntries?.[0] ?? null
        return reply.send(buildProfileResponse(contractor, marketplace, queueEntry))
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to fetch contractor profile')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to load profile'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // PATCH /marketplace/contractors/profile
  // Updates profile; triggers reverification if credential fields change.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.patch(
    '/contractors/profile',
    { preHandler: [authenticateUser] },
    async (request: any, reply) => {
      const userId = request.user.id

      const parseResult = profileUpdateSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.code(400).send({
          error: parseResult.error.issues[0]?.message ?? 'Validation failed',
          details: parseResult.error.issues,
        })
      }
      const data = parseResult.data

      try {
        const [existingContractor, marketplace] = await Promise.all([
          prismaAny.contractorProfile.findFirst({ where: { userId } }),
          prismaAny.marketplaceProfile.findFirst({
            where: { userId },
            include: {
              queueEntries: {
                where: { professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          }),
        ])

        if (!existingContractor) {
          return reply.code(404).send({ error: 'Contractor profile not found' })
        }

        // ─── Detect credential changes ───────────────────────────────────────
        const existingLicense    = existingContractor.licenseNumber ?? ''
        const existingAllLicenses = JSON.stringify(
          existingContractor.insuranceInfo?.allLicenses ?? [],
        )
        const existingCarrier    = existingContractor.insuranceInfo?.carrier ?? ''
        const existingExpiry     = existingContractor.insuranceInfo?.expiration ?? ''

        const newLicense    = data.licenseNumber ?? ''
        const newAllLicenses = JSON.stringify(data.allLicenses ?? [])
        const newCarrier    = data.insuranceCarrier ?? ''
        const newExpiry     = data.insuranceExpiration ?? ''

        const licenseChanged   = newLicense !== existingLicense || newAllLicenses !== existingAllLicenses
        const insuranceChanged = newCarrier !== existingCarrier  || newExpiry     !== existingExpiry
        const requiresReverification = licenseChanged || insuranceChanged

        // Build updated insuranceInfo JSON
        const hasInsuranceData = newCarrier || (data.allLicenses ?? []).length > 0
        const updatedInsuranceInfo = hasInsuranceData
          ? {
              carrier:     newCarrier || null,
              expiration:  newExpiry  || null,
              allLicenses: data.allLicenses ?? [],
            }
          : (existingContractor.insuranceInfo ?? null)

        // ─── Update ContractorProfile ──────────────────────────────────────
        await prismaAny.contractorProfile.update({
          where: { id: existingContractor.id },
          data: {
            businessName:     data.businessName,
            description:      data.description ?? null,
            phone:            data.phone ?? null,
            email:            data.email ?? existingContractor.email,
            website:          data.website || null,
            yearsInBusiness:  data.yearsInBusiness ?? existingContractor.yearsInBusiness,
            teamSize:         data.teamSize ?? existingContractor.teamSize,
            emergencyServices: data.emergencyServices ?? false,

            specialties:           data.tradeSpecialties,
            serviceCategories:     data.serviceCategories ?? [],
            commercialFocus:       data.commercialFocus ?? false,
            residentialFocus:      data.residentialFocus ?? true,
            preferredProjectSizes: data.preferredProjectSizes ?? [],

            serviceRadius: data.serviceRadius ?? null,
            serviceStates: data.serviceStates ?? [],
            serviceCities: data.serviceCities ?? [],

            licenseNumber: data.licenseNumber || null,
            insuranceInfo: updatedInsuranceInfo,

            ...(requiresReverification ? { isVerified: false } : {}),
          },
        })

        // ─── Update MarketplaceProfile ─────────────────────────────────────
        if (marketplace) {
          await prismaAny.marketplaceProfile.update({
            where: { id: marketplace.id },
            data: {
              businessName: data.businessName,
              description:  data.description ?? null,
              specialties:  data.tradeSpecialties,
              // Sync serviceArea with serviceStates for legacy compat
              serviceArea: (data.serviceStates ?? []).length > 0
                ? data.serviceStates
                : marketplace.serviceArea,
              ...(requiresReverification
                ? { verified: false, acceptingLeads: false }
                : {}),
              // Manual acceptingLeads toggle (only when not being reverified)
              ...(data.acceptingLeads !== undefined && !requiresReverification
                ? { acceptingLeads: data.acceptingLeads }
                : {}),
            },
          })
        }

        // ─── Trigger reverification ────────────────────────────────────────
        if (requiresReverification && marketplace) {
          await Promise.all([
            prismaAny.rotationQueueEntry.updateMany({
              where: {
                profileId:        marketplace.id,
                professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
              },
              data: {
                eligibility:      'PENDING_VERIFICATION',
                licenseVerified:   licenseChanged   ? false : undefined,
                insuranceVerified: insuranceChanged ? false : undefined,
              },
            }),
            workflowEventService.emit({
              eventType:      'verification.credentials_updated',
              subjectType:    'PROFESSIONAL_ASSIGNMENT',
              subjectId:      marketplace.id,
              idempotencyKey: WorkflowEventService.buildKey(
                'verification.credentials_updated',
                'PROFESSIONAL_ASSIGNMENT',
                marketplace.id,
                `${userId}:${Date.now()}`,
              ),
              payload: {
                userId,
                licenseChanged,
                insuranceChanged,
                updatedAt: new Date().toISOString(),
              },
            }),
          ])

          fastify.log.info(
            { userId, marketplaceId: marketplace.id, licenseChanged, insuranceChanged },
            'Contractor credentials updated — re-queued for verification',
          )
        }

        // ─── Return fresh profile ──────────────────────────────────────────
        const [refreshedContractor, refreshedMarketplace] = await Promise.all([
          prismaAny.contractorProfile.findFirst({ where: { userId } }),
          prismaAny.marketplaceProfile.findFirst({
            where: { userId },
            include: {
              queueEntries: {
                where: { professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          }),
        ])

        const queueEntry = refreshedMarketplace?.queueEntries?.[0] ?? null

        return reply.send({
          success:                true,
          requiresReverification,
          profile:                buildProfileResponse(refreshedContractor, refreshedMarketplace, queueEntry),
          message:                requiresReverification
            ? 'Profile updated. Your credential changes require re-verification by our team.'
            : 'Profile updated successfully.',
        })
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to update contractor profile')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to update profile'),
        })
      }
    },
  )
}
