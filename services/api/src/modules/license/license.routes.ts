/**
 * Kealee License Verification API
 *
 * GET  /api/license/verify?num=LICENSE_NUM&state=VA  — verify a license
 * GET  /api/license/search?q=COMPANY_NAME&state=VA   — search by company name
 * POST /api/license/claim                            — claim a verified license
 * GET  /api/license/status/:userId                   — get user's verification
 */

import { FastifyInstance } from 'fastify'
import { prismaAny } from '../../utils/prisma-helper'

// VA DPOR real-time API — used for VA licenses (always current).
// MD and DC use local DB (bulk import updated monthly).
async function verifyViaVaDporApi(licenseNum: string): Promise<{
  found: boolean
  status?: string
  companyName?: string
  licenseType?: string
  licenseClass?: string
  expiresAt?: string
  raw?: unknown
}> {
  try {
    const response = await fetch(
      `https://www.dpor.virginia.gov/api/license/${encodeURIComponent(licenseNum)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!response.ok) return { found: false }

    const data = await response.json()
    return {
      found: true,
      status: data.LicenseStatus ?? data.status,
      companyName: data.BusinessName ?? data.businessName,
      licenseType: data.LicenseType ?? data.licenseType,
      licenseClass: data.ClassCode ?? data.classCode,
      expiresAt: data.ExpirationDate ?? data.expirationDate,
      raw: data,
    }
  } catch {
    return { found: false }
  }
}

export async function licenseRoutes(fastify: FastifyInstance) {
  // GET /verify — main verification endpoint
  fastify.get('/verify', async (request, reply) => {
    const { num, state } = request.query as { num?: string; state?: string }

    if (!num || !state) {
      return reply.status(400).send({
        error: 'Missing required parameters: num (license number) and state (VA | MD | DC)',
      })
    }

    const licenseNum = num.trim().toUpperCase()
    const stateCode = state.trim().toUpperCase()

    if (!['VA', 'MD', 'DC'].includes(stateCode)) {
      return reply.status(400).send({ error: 'state must be VA, MD, or DC' })
    }

    // For VA — try real-time API first
    if (stateCode === 'VA') {
      const liveResult = await verifyViaVaDporApi(licenseNum)

      if (liveResult.found) {
        // Cache in local DB (non-blocking)
        prismaAny.contractorLicenseRegistry
          .upsert({
            where: { licenseNum },
            create: {
              state: 'VA',
              licenseNum,
              companyName: liveResult.companyName ?? '',
              licenseType: liveResult.licenseType ?? '',
              licenseClass: liveResult.licenseClass ?? null,
              status: liveResult.status ?? 'Unknown',
              expiresAt: liveResult.expiresAt ? new Date(liveResult.expiresAt) : null,
              lastSynced: new Date(),
            },
            update: {
              companyName: liveResult.companyName ?? '',
              status: liveResult.status ?? 'Unknown',
              expiresAt: liveResult.expiresAt ? new Date(liveResult.expiresAt) : null,
              lastSynced: new Date(),
            },
          })
          .catch(() => null)

        return reply.send({
          found: true,
          source: 'live',
          state: 'VA',
          licenseNum,
          companyName: liveResult.companyName,
          licenseType: liveResult.licenseType,
          licenseClass: liveResult.licenseClass,
          status: liveResult.status,
          isActive: liveResult.status?.toLowerCase() === 'active',
          expiresAt: liveResult.expiresAt,
        })
      }
    }

    // MD, DC, and VA fallback — query local registry
    const record = await prismaAny.contractorLicenseRegistry.findUnique({
      where: { licenseNum },
    })

    if (!record || record.state !== stateCode) {
      return reply.send({
        found: false,
        state: stateCode,
        licenseNum,
        message: `No ${stateCode} license found with number ${licenseNum}. Verify the number and try again, or contact support.`,
      })
    }

    const isExpired = record.expiresAt ? record.expiresAt < new Date() : false

    return reply.send({
      found: true,
      source: 'registry',
      state: record.state,
      licenseNum: record.licenseNum,
      companyName: record.companyName,
      licenseType: record.licenseType,
      licenseClass: record.licenseClass,
      status: isExpired ? 'Expired' : record.status,
      isActive: record.status === 'Active' && !isExpired,
      expiresAt: record.expiresAt?.toISOString() ?? null,
      lastSynced: record.lastSynced.toISOString(),
    })
  })

  // GET /search — search by company name
  fastify.get('/search', async (request, reply) => {
    const { q, state } = request.query as { q?: string; state?: string }

    if (!q || q.trim().length < 3) {
      return reply.status(400).send({ error: 'Query must be at least 3 characters' })
    }

    const results = await prismaAny.contractorLicenseRegistry.findMany({
      where: {
        companyName: { contains: q.trim(), mode: 'insensitive' },
        ...(state ? { state: state.toUpperCase() } : {}),
        status: 'Active',
      },
      take: 10,
      orderBy: { companyName: 'asc' },
      select: {
        licenseNum: true,
        companyName: true,
        licenseType: true,
        licenseClass: true,
        status: true,
        expiresAt: true,
        state: true,
        city: true,
      },
    })

    return reply.send({ results, count: results.length })
  })

  // POST /claim — link verified license to user account
  fastify.post('/claim', async (request, reply) => {
    const { userId, licenseNum, state } = request.body as {
      userId: string
      licenseNum: string
      state: string
    }

    if (!userId || !licenseNum || !state) {
      return reply.status(400).send({ error: 'userId, licenseNum, and state are required' })
    }

    // Check if already claimed by another user
    const existingClaim = await prismaAny.contractorVerification.findFirst({
      where: { licenseNum: licenseNum.toUpperCase() },
    })

    if (existingClaim && existingClaim.userId !== userId) {
      return reply.status(409).send({
        error: 'This license number is already associated with another Kealee account. Contact support if this is incorrect.',
      })
    }

    const record = await prismaAny.contractorLicenseRegistry.findUnique({
      where: { licenseNum: licenseNum.toUpperCase() },
    })

    if (!record) {
      return reply.status(404).send({ error: 'License not found in registry' })
    }

    const isExpired = record.expiresAt ? record.expiresAt < new Date() : false
    const verificationStatus =
      record.status === 'Active' && !isExpired
        ? 'verified'
        : record.status === 'Suspended'
          ? 'suspended'
          : 'expired'

    const verification = await prismaAny.contractorVerification.upsert({
      where: { userId },
      create: {
        userId,
        state: record.state,
        licenseNum: record.licenseNum,
        licenseType: record.licenseType,
        licenseClass: record.licenseClass,
        companyName: record.companyName,
        status: verificationStatus,
        expiresAt: record.expiresAt,
        verifiedAt: new Date(),
        lastChecked: new Date(),
      },
      update: {
        state: record.state,
        licenseNum: record.licenseNum,
        licenseType: record.licenseType,
        status: verificationStatus,
        expiresAt: record.expiresAt,
        lastChecked: new Date(),
      },
    })

    return reply.status(201).send({
      success: true,
      verification: {
        status: verification.status,
        licenseNum: verification.licenseNum,
        companyName: verification.companyName,
        licenseType: verification.licenseType,
        licenseClass: verification.licenseClass,
        expiresAt: verification.expiresAt?.toISOString(),
        verifiedAt: verification.verifiedAt.toISOString(),
      },
    })
  })

  // GET /status/:userId — verification status for a user
  fastify.get('/status/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }

    const verification = await prismaAny.contractorVerification.findUnique({
      where: { userId },
    })

    if (!verification) {
      return reply.send({ verified: false, message: 'No license verification on file.' })
    }

    const isExpired = verification.expiresAt ? verification.expiresAt < new Date() : false

    return reply.send({
      verified: verification.status === 'verified' && !isExpired,
      status: isExpired ? 'expired' : verification.status,
      state: verification.state,
      licenseNum: verification.licenseNum,
      companyName: verification.companyName,
      licenseType: verification.licenseType,
      licenseClass: verification.licenseClass,
      expiresAt: verification.expiresAt?.toISOString(),
      verifiedAt: verification.verifiedAt.toISOString(),
      lastChecked: verification.lastChecked.toISOString(),
    })
  })
}
