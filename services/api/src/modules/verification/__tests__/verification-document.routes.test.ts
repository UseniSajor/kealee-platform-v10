/**
 * verification-document.routes.test.ts
 *
 * Contractor-facing verification document route tests.
 * Mocks: authenticateUser, prismaAny, verification-document.storage.
 *
 * TO RUN: pnpm --filter services/api test -- verification-document.routes
 */

import Fastify, { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { verificationDocumentRoutes } from '../verification-document.routes'
import { errorHandler } from '../../../middleware/error-handler.middleware'

// ─── Auth mock ────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-001', name: 'Jane Smith', role: 'contractor' }

vi.mock('../../../middleware/auth.middleware', () => ({
  authenticateUser: vi.fn(async (req: any) => { req.user = MOCK_USER }),
  requireAdmin:     vi.fn(),
  requireRole:      vi.fn(() => vi.fn()),
}))

// ─── Prisma mock ──────────────────────────────────────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    marketplaceProfile: {
      findUnique: vi.fn(),
    },
    verificationDocument: {
      create:     vi.fn(),
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      update:     vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

// ─── Storage mock ─────────────────────────────────────────────────────────────

vi.mock('../verification-document.storage', () => ({
  getPresignedUploadUrl: vi.fn().mockResolvedValue({
    presignedUrl: 'https://s3.example.com/presigned-put?token=abc',
    key:          `verification-docs/a1b2c3d4-0000-4000-8000-000000000001/LICENSE/uuid/license.pdf`,
    expiresAt:    new Date(Date.now() + 3_600_000).toISOString(),
  }),
  getPresignedDownloadUrl: vi.fn().mockResolvedValue({
    url:       'https://s3.example.com/presigned-get?token=xyz',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  }),
  buildVerificationDocKey: vi.fn().mockReturnValue(
    `verification-docs/a1b2c3d4-0000-4000-8000-000000000001/LICENSE/uuid/license.pdf`
  ),
}))

vi.mock('bullmq',  () => ({ Queue: vi.fn() }))
vi.mock('ioredis', () => ({ default: vi.fn() }))

import { prismaAny } from '../../../utils/prisma-helper'
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '../verification-document.storage'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MP_ID      = 'a1b2c3d4-0000-4000-8000-000000000001'
const DOC_ID     = 'a1b2c3d4-0000-4000-8000-000000000002'
const VALID_KEY  = `verification-docs/${MP_ID}/LICENSE/uuid/license.pdf`

const MOCK_MP = { id: MP_ID }

const MOCK_DOC = {
  id:                   DOC_ID,
  marketplaceProfileId: MP_ID,
  documentType:         'LICENSE',
  status:               'UPLOADED',
  version:              1,
  fileKey:              VALID_KEY,
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

const VALID_PRESIGNED_BODY = {
  documentType: 'LICENSE',
  fileName:     'license.pdf',
  mimeType:     'application/pdf',
  fileSize:     204800,
}

const VALID_CONFIRM_BODY = {
  key:            VALID_KEY,
  documentType:   'LICENSE',
  fileName:       'license.pdf',
  mimeType:       'application/pdf',
  fileSize:       204800,
  issuerName:     'State of Arizona',
  documentNumber: 'ROC-123456',
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.setErrorHandler(errorHandler)
  await app.register(verificationDocumentRoutes, { prefix: '/verification' })
  await app.ready()
  return app
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /verification/documents/presigned-url', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns presigned URL when profile exists', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)

    const res = await app.inject({
      method:  'POST',
      url:     '/verification/documents/presigned-url',
      headers: { 'content-type': 'application/json' },
      payload: VALID_PRESIGNED_BODY,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.presignedUrl).toContain('https://')
    expect(body.key).toBe(VALID_KEY)
    expect(body.marketplaceProfileId).toBe(MP_ID)
    expect(getPresignedUploadUrl).toHaveBeenCalledWith(
      MP_ID, 'LICENSE', 'license.pdf', 'application/pdf',
    )
  })

  it('returns 404 when marketplace profile not found', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)
    const res = await app.inject({
      method: 'POST', url: '/verification/documents/presigned-url',
      headers: { 'content-type': 'application/json' },
      payload: VALID_PRESIGNED_BODY,
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().error).toMatch(/profile not found/i)
  })

  it('returns 400 for invalid documentType', async () => {
    const res = await app.inject({
      method: 'POST', url: '/verification/documents/presigned-url',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_PRESIGNED_BODY, documentType: 'INVALID' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for disallowed mimeType', async () => {
    const res = await app.inject({
      method: 'POST', url: '/verification/documents/presigned-url',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_PRESIGNED_BODY, mimeType: 'application/zip' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/allowed types/i)
  })

  it('returns 400 when fileSize exceeds 20MB', async () => {
    const res = await app.inject({
      method: 'POST', url: '/verification/documents/presigned-url',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_PRESIGNED_BODY, fileSize: 21 * 1024 * 1024 },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/20 MB/i)
  })
})

describe('POST /verification/documents', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('creates a document record version 1 when none exist', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findMany as any).mockResolvedValueOnce([])
    ;(prismaAny.verificationDocument.create   as any).mockResolvedValueOnce(MOCK_DOC)

    const res = await app.inject({
      method:  'POST',
      url:     '/verification/documents',
      headers: { 'content-type': 'application/json' },
      payload: VALID_CONFIRM_BODY,
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.document.documentType).toBe('LICENSE')
    expect(body.document.status).toBe('UPLOADED')
    expect(prismaAny.verificationDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version:              1,
          marketplaceProfileId: MP_ID,
        }),
      }),
    )
    // No previous docs to archive
    expect(prismaAny.verificationDocument.updateMany).not.toHaveBeenCalled()
  })

  it('bumps version and archives previous when prior version exists', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findMany as any).mockResolvedValueOnce([
      { id: 'old-doc', version: 1 },
    ])
    ;(prismaAny.verificationDocument.create as any).mockResolvedValueOnce({
      ...MOCK_DOC, id: 'doc-002', version: 2,
    })
    ;(prismaAny.verificationDocument.updateMany as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     '/verification/documents',
      headers: { 'content-type': 'application/json' },
      payload: VALID_CONFIRM_BODY,
    })

    expect(res.statusCode).toBe(201)
    expect(prismaAny.verificationDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 2 }) }),
    )
    expect(prismaAny.verificationDocument.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['old-doc'] } },
        data:  { status: 'ARCHIVED' },
      }),
    )
  })

  it('returns 403 when key does not belong to user profile', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)

    const res = await app.inject({
      method:  'POST',
      url:     '/verification/documents',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_CONFIRM_BODY, key: 'verification-docs/other-profile/LICENSE/x.pdf' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 404 when no marketplace profile', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)
    const res = await app.inject({
      method:  'POST',
      url:     '/verification/documents',
      headers: { 'content-type': 'application/json' },
      payload: VALID_CONFIRM_BODY,
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /verification/documents', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns empty state when no marketplace profile', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)

    const res = await app.inject({ method: 'GET', url: '/verification/documents' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.documents).toHaveLength(0)
    expect(body.profileExists).toBe(false)
  })

  it('returns documents for authenticated user', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findMany as any).mockResolvedValueOnce([MOCK_DOC])

    const res = await app.inject({ method: 'GET', url: '/verification/documents' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.documents).toHaveLength(1)
    expect(body.documents[0].documentType).toBe('LICENSE')
    expect(body.documents[0]).not.toHaveProperty('fileKey') // never exposed
  })

  it('computes effectiveStatus=EXPIRED for approved doc with past expiresAt', async () => {
    const expiredDoc = {
      ...MOCK_DOC,
      status:    'APPROVED',
      expiresAt: new Date('2020-01-01'),
    }
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findMany as any).mockResolvedValueOnce([expiredDoc])

    const res = await app.inject({ method: 'GET', url: '/verification/documents' })
    const doc = res.json().documents[0]
    expect(doc.effectiveStatus).toBe('EXPIRED')
    expect(doc.isExpired).toBe(true)
    expect(doc.status).toBe('APPROVED') // underlying status unchanged
  })

  it('excludes ARCHIVED by default', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findMany as any).mockResolvedValueOnce([])

    await app.inject({ method: 'GET', url: '/verification/documents' })

    expect(prismaAny.verificationDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: 'ARCHIVED' } }),
      }),
    )
  })

  it('includes ARCHIVED when includeArchived=true', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findMany as any).mockResolvedValueOnce([])

    await app.inject({ method: 'GET', url: '/verification/documents?includeArchived=true' })

    // Should NOT have the status: { not: ARCHIVED } filter
    expect(prismaAny.verificationDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ status: { not: 'ARCHIVED' } }),
      }),
    )
  })
})

describe('GET /verification/documents/:id/download', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns presigned download URL for own document', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockResolvedValueOnce(MOCK_DOC)

    const res = await app.inject({
      method: 'GET',
      url:    `/verification/documents/${DOC_ID}/download`,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.url).toContain('https://')
    expect(body.expiresAt).toBeTruthy()
    expect(getPresignedDownloadUrl).toHaveBeenCalledWith(VALID_KEY, 'license.pdf')
  })

  it('returns 404 for a document that does not belong to this user', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockResolvedValueOnce(null)

    const res = await app.inject({
      method: 'GET',
      url:    `/verification/documents/${DOC_ID}/download`,
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /verification/documents/:id', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('updates metadata on UPLOADED document', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockResolvedValueOnce(MOCK_DOC)
    ;(prismaAny.verificationDocument.update     as any).mockResolvedValueOnce({
      ...MOCK_DOC, issuerName: 'AZ Contractor License Board',
    })

    const res = await app.inject({
      method:  'PATCH',
      url:     `/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { issuerName: 'AZ Contractor License Board' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().document.issuerName).toBe('AZ Contractor License Board')
  })

  it('returns 409 when trying to edit an APPROVED document', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockResolvedValueOnce({
      ...MOCK_DOC, status: 'APPROVED',
    })

    const res = await app.inject({
      method:  'PATCH',
      url:     `/verification/documents/${DOC_ID}`,
      headers: { 'content-type': 'application/json' },
      payload: { issuerName: 'New Name' },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toMatch(/approved/i)
  })
})

describe('DELETE /verification/documents/:id', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('archives a non-APPROVED document', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockResolvedValueOnce(MOCK_DOC)
    ;(prismaAny.verificationDocument.update     as any).mockResolvedValueOnce({
      ...MOCK_DOC, status: 'ARCHIVED',
    })

    const res = await app.inject({
      method: 'DELETE',
      url:    `/verification/documents/${DOC_ID}`,
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)
    expect(prismaAny.verificationDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ARCHIVED' } }),
    )
  })

  it('returns 403 when trying to archive an APPROVED document', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockResolvedValueOnce({
      ...MOCK_DOC, status: 'APPROVED',
    })

    const res = await app.inject({
      method: 'DELETE',
      url:    `/verification/documents/${DOC_ID}`,
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 409 when document is already archived', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockResolvedValueOnce({
      ...MOCK_DOC, status: 'ARCHIVED',
    })

    const res = await app.inject({
      method: 'DELETE',
      url:    `/verification/documents/${DOC_ID}`,
    })
    expect(res.statusCode).toBe(409)
  })

  it('returns 500 on DB error', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MP)
    ;(prismaAny.verificationDocument.findFirst  as any).mockRejectedValueOnce(new Error('DB timeout'))

    const res = await app.inject({
      method: 'DELETE',
      url:    `/verification/documents/${DOC_ID}`,
    })
    expect(res.statusCode).toBe(500)
  })
})
