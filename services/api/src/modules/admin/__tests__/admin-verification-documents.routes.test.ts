/**
 * admin-verification-documents.routes.test.ts
 *
 * Admin verification document route tests.
 * Mocks: authenticateUser, requireAdmin, prismaAny, storage, workflowEventService.
 *
 * TO RUN: pnpm --filter services/api test -- admin-verification-documents
 */

import Fastify, { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { adminVerificationDocumentsRoutes } from '../admin-verification-documents.routes'
import { errorHandler } from '../../../middleware/error-handler.middleware'

// ─── Auth mock ────────────────────────────────────────────────────────────────

const MOCK_ADMIN = { id: 'admin-001', name: 'Admin User', role: 'admin' }

vi.mock('../../../middleware/auth.middleware', () => ({
  authenticateUser: vi.fn(async (req: any) => { req.user = MOCK_ADMIN }),
  requireAdmin:     vi.fn(async () => {}),
  requireRole:      vi.fn(() => vi.fn()),
}))

// ─── Prisma mock ──────────────────────────────────────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    marketplaceProfile: {
      findUnique: vi.fn(),
    },
    verificationDocument: {
      findUnique: vi.fn(),
      findMany:   vi.fn(),
      update:     vi.fn(),
    },
    rotationQueueEntry: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}))

// ─── Storage mock ─────────────────────────────────────────────────────────────

vi.mock('../../../modules/verification/verification-document.storage', () => ({
  getPresignedDownloadUrl: vi.fn().mockResolvedValue({
    url:       'https://s3.example.com/download?token=admin',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  }),
}))

// ─── Workflow mock ────────────────────────────────────────────────────────────

vi.mock('../../workflow/workflow-event.service', () => ({
  workflowEventService: {
    emit: vi.fn().mockResolvedValue({ id: 'evt-001' }),
  },
  WorkflowEventService: {
    buildKey: vi.fn().mockReturnValue('idempotency-key'),
  },
}))

vi.mock('bullmq',  () => ({ Queue: vi.fn() }))
vi.mock('ioredis', () => ({ default: vi.fn() }))

import { prismaAny } from '../../../utils/prisma-helper'
import { workflowEventService } from '../../workflow/workflow-event.service'
import { getPresignedDownloadUrl } from '../../../modules/verification/verification-document.storage'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PROFILE_ID  = 'a1b2c3d4-0000-4000-8000-000000000001'
const DOC_ID      = 'a1b2c3d4-0000-4000-8000-000000000002'

const MOCK_PROFILE = {
  id:           PROFILE_ID,
  businessName: 'Smith Construction LLC',
}

const MOCK_DOC = {
  id:                   DOC_ID,
  marketplaceProfileId: PROFILE_ID,
  documentType:         'LICENSE',
  status:               'UPLOADED',
  version:              1,
  fileKey:              `verification-docs/${PROFILE_ID}/LICENSE/uuid/license.pdf`,
  fileName:             'license.pdf',
  mimeType:             'application/pdf',
  fileSize:             204800,
  description:          null,
  issuerName:           'State of Arizona',
  documentNumber:       'ROC-123456',
  expiresAt:            null,
  reviewedBy:           null,
  reviewedAt:           null,
  reviewNote:           null,
  rejectionReason:      null,
  createdAt:            new Date('2026-03-13T10:00:00Z'),
  updatedAt:            new Date('2026-03-13T10:00:00Z'),
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.setErrorHandler(errorHandler)
  await app.register(adminVerificationDocumentsRoutes, { prefix: '/admin' })
  await app.ready()
  return app
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /admin/verification/documents/:profileId', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns documents for a profile', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_PROFILE)
    ;(prismaAny.verificationDocument.findMany  as any).mockResolvedValueOnce([MOCK_DOC])

    const res = await app.inject({
      method: 'GET',
      url:    `/admin/verification/documents/${PROFILE_ID}`,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.profileId).toBe(PROFILE_ID)
    expect(body.businessName).toBe('Smith Construction LLC')
    expect(body.documents).toHaveLength(1)
    expect(body.documents[0].documentType).toBe('LICENSE')
    expect(body.documents[0]).not.toHaveProperty('fileKey') // never exposed
  })

  it('returns 404 when profile not found', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)

    const res = await app.inject({
      method: 'GET',
      url:    `/admin/verification/documents/${PROFILE_ID}`,
    })
    expect(res.statusCode).toBe(404)
  })

  it('includes summary counts grouped by documentType + effectiveStatus', async () => {
    const docs = [
      { ...MOCK_DOC, id: 'd1', documentType: 'LICENSE',   status: 'APPROVED' },
      { ...MOCK_DOC, id: 'd2', documentType: 'INSURANCE', status: 'UPLOADED' },
      { ...MOCK_DOC, id: 'd3', documentType: 'LICENSE',   status: 'UPLOADED' },
    ]
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_PROFILE)
    ;(prismaAny.verificationDocument.findMany  as any).mockResolvedValueOnce(docs)

    const { summary } = (await app.inject({
      method: 'GET',
      url:    `/admin/verification/documents/${PROFILE_ID}`,
    })).json()

    expect(summary['LICENSE']['APPROVED']).toBe(1)
    expect(summary['LICENSE']['UPLOADED']).toBe(1)
    expect(summary['INSURANCE']['UPLOADED']).toBe(1)
  })

  it('excludes ARCHIVED by default', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_PROFILE)
    ;(prismaAny.verificationDocument.findMany  as any).mockResolvedValueOnce([])

    await app.inject({ method: 'GET', url: `/admin/verification/documents/${PROFILE_ID}` })

    expect(prismaAny.verificationDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: 'ARCHIVED' } }),
      }),
    )
  })
})

describe('PATCH /admin/verification/documents/:documentId', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  function mockFindDoc(overrides: any = {}) {
    ;(prismaAny.verificationDocument.findUnique as any).mockResolvedValueOnce({
      ...MOCK_DOC, ...overrides,
    })
    ;(prismaAny.verificationDocument.update as any).mockResolvedValueOnce({
      ...MOCK_DOC, ...overrides,
    })
  }

  it('sets status to UNDER_REVIEW', async () => {
    mockFindDoc()

    const res = await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'UNDER_REVIEW' },
    })

    expect(res.statusCode).toBe(200)
    expect(prismaAny.verificationDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'UNDER_REVIEW' }),
      }),
    )
    expect(workflowEventService.emit).toHaveBeenCalled()
  })

  it('approves a document and emits workflow event', async () => {
    mockFindDoc({ documentType: 'LICENSE' })

    const res = await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: {
        status:          'APPROVED',
        reviewNote:      'License verified against state database',
        updateQueueEntry: false,
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)
    expect(workflowEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'verification.document_reviewed',
        payload:   expect.objectContaining({ newStatus: 'APPROVED' }),
      }),
    )
  })

  it('updates RotationQueueEntry.licenseVerified when LICENSE + updateQueueEntry=true', async () => {
    mockFindDoc({ documentType: 'LICENSE' })

    await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'APPROVED', updateQueueEntry: true },
    })

    expect(prismaAny.rotationQueueEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ licenseVerified: true }),
      }),
    )
  })

  it('updates RotationQueueEntry.insuranceVerified when INSURANCE + updateQueueEntry=true', async () => {
    mockFindDoc({ documentType: 'INSURANCE' })

    await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'APPROVED', updateQueueEntry: true },
    })

    expect(prismaAny.rotationQueueEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ insuranceVerified: true }),
      }),
    )
  })

  it('does NOT update queue entry for BOND + updateQueueEntry=true (no queue field for BOND)', async () => {
    mockFindDoc({ documentType: 'BOND' })

    await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'APPROVED', updateQueueEntry: true },
    })

    expect(prismaAny.rotationQueueEntry.updateMany).not.toHaveBeenCalled()
  })

  it('returns 400 when rejecting without rejectionReason', async () => {
    const res = await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'REJECTED' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/rejectionReason/i)
  })

  it('rejects a document with a reason', async () => {
    mockFindDoc()

    const res = await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: {
        status:          'REJECTED',
        rejectionReason: 'License number could not be verified in state records',
      },
    })
    expect(res.statusCode).toBe(200)
    expect(prismaAny.verificationDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status:          'REJECTED',
          rejectionReason: 'License number could not be verified in state records',
        }),
      }),
    )
  })

  it('returns 409 when trying to review an ARCHIVED document', async () => {
    ;(prismaAny.verificationDocument.findUnique as any).mockResolvedValueOnce({
      ...MOCK_DOC, status: 'ARCHIVED',
    })

    const res = await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'UNDER_REVIEW' },
    })
    expect(res.statusCode).toBe(409)
  })

  it('returns 404 when document not found', async () => {
    ;(prismaAny.verificationDocument.findUnique as any).mockResolvedValueOnce(null)

    const res = await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'UNDER_REVIEW' },
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    const res = await app.inject({
      method:  'PATCH',
      url:     `/admin/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { status: 'BOGUS' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /admin/verification/documents/:documentId/download', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns a signed download URL for any document', async () => {
    ;(prismaAny.verificationDocument.findUnique as any).mockResolvedValueOnce(MOCK_DOC)

    const res = await app.inject({
      method: 'GET',
      url:    `/admin/verification/documents/${DOC_ID}/download`,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.url).toContain('https://')
    expect(getPresignedDownloadUrl).toHaveBeenCalledWith(
      MOCK_DOC.fileKey,
      MOCK_DOC.fileName,
    )
  })

  it('returns 404 when document not found', async () => {
    ;(prismaAny.verificationDocument.findUnique as any).mockResolvedValueOnce(null)

    const res = await app.inject({
      method: 'GET',
      url:    `/admin/verification/documents/${DOC_ID}/download`,
    })
    expect(res.statusCode).toBe(404)
  })
})
