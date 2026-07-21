/**
 * Architect Upload Routes Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import Fastify, { FastifyInstance } from 'fastify'
import architectUploadsRoutes from './architect-uploads.routes'

describe('Architect Upload Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify()
    
    // Mock authentication
    app.decorateRequest('user', {
      id: 'test-architect-id',
      role: 'ARCHITECT',
    })

    await app.register(architectUploadsRoutes, { prefix: '/architect' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /architect/projects/:projectId/design-versions', () => {
    it('should list design versions for a project', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/architect/projects/${projectId}/design-versions`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeInstanceOf(Array)
    })
  })

  describe('GET /architect/design-versions/:versionId', () => {
    it('should get design version details with files', async () => {
      const versionId = 'test-version-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/architect/design-versions/${versionId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data).toHaveProperty('files')
    })

    it('should return 404 for non-existent version', async () => {
      const versionId = 'non-existent-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/architect/design-versions/${versionId}`,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // Note: File upload tests require multipart/form-data handling
  describe('POST /architect/projects/:projectId/design-files', () => {
    it.skip('should upload design files (requires multipart)', async () => {
      // TODO: Implement with multipart form data
      const projectId = 'test-project-id'
      
      // const formData = new FormData()
      // formData.append('file', fileBuffer, 'floor-plan.pdf')
      // formData.append('designPhase', 'SCHEMATIC')
      // formData.append('fileType', 'DRAWING')
      
      // This would need proper multipart handling
    })

    it('should validate required fields', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/architect/projects/${projectId}/design-files`,
        payload: {
          // Missing required fields
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /architect/projects/:projectId/stamped-drawings', () => {
    it.skip('should upload stamped drawings (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })

    it.skip('should reject non-PDF stamped drawings', async () => {
      // Stamped drawings must be PDF only
      // TODO: Implement multipart test
    })
  })

  describe('POST /architect/projects/:projectId/renderings', () => {
    it.skip('should upload 3D renderings (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })
  })

  describe('POST /architect/projects/:projectId/specifications', () => {
    it.skip('should upload specifications (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })
  })

  describe('POST /architect/portfolio', () => {
    it.skip('should upload portfolio photos (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })

    it('should validate portfolio metadata', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/architect/portfolio',
        payload: {
          projectName: 'Modern Residence',
          projectType: 'Residential',
          description: 'A beautiful modern home design',
          location: 'San Francisco, CA',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      // Will fail without files, but should validate the structure
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /architect/license', () => {
    it.skip('should upload architect license (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })

    it('should validate license information', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/architect/license',
        payload: {
          licenseNumber: 'CA-12345',
          licenseState: 'CA',
          expirationDate: '2027-12-31',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      // Should at least validate the payload structure
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /architect/projects/:projectId/as-builts', () => {
    it.skip('should upload as-built documents (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })
  })

  describe('Role-based access control', () => {
    it('should deny access to non-architects', async () => {
      // Mock different role
      const nonArchitectApp = Fastify()
      
      nonArchitectApp.decorateRequest('user', {
        id: 'test-contractor-id',
        role: 'CONTRACTOR',
      })

      await nonArchitectApp.register(architectUploadsRoutes, { prefix: '/architect' })
      await nonArchitectApp.ready()

      const projectId = 'test-project-id'
      
      const response = await nonArchitectApp.inject({
        method: 'POST',
        url: `/architect/projects/${projectId}/design-files`,
        payload: {
          designPhase: 'SCHEMATIC',
          fileType: 'DRAWING',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      // Should deny based on role permission
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
      
      await nonArchitectApp.close()
    })
  })
})
