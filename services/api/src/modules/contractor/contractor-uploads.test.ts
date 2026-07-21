/**
 * Contractor Upload Routes Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import Fastify, { FastifyInstance } from 'fastify'
import contractorUploadsRoutes from './contractor-uploads.routes'
import { prismaAny } from '../../utils/prisma-helper'

describe('Contractor Upload Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify()
    
    // Mock authentication
    app.decorateRequest('user', {
      id: 'test-user-id',
      role: 'CONTRACTOR',
    })

    await app.register(contractorUploadsRoutes, { prefix: '/contractor' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /contractor/projects/:projectId/daily-logs', () => {
    it('should create a daily log entry', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/contractor/projects/${projectId}/daily-logs`,
        payload: {
          workPerformed: 'Installed drywall in kitchen area, completed rough-in',
          crewCount: 3,
          hoursWorked: 8,
          weather: 'Sunny',
          temperature: '75°F',
          progressNotes: 'On schedule, no delays',
          subsOnSite: ['Electrician', 'Plumber'],
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data.workPerformed).toBe('Installed drywall in kitchen area, completed rough-in')
    })

    it('should reject invalid daily log (missing workPerformed)', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/contractor/projects/${projectId}/daily-logs`,
        payload: {
          crewCount: 3,
          // Missing workPerformed
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject unauthorized user', async () => {
      const projectId = 'test-project-id'
      
      // Remove user decoration to simulate unauthorized
      const response = await app.inject({
        method: 'POST',
        url: `/contractor/projects/${projectId}/daily-logs`,
        payload: {
          workPerformed: 'Test work',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /contractor/projects/:projectId/daily-logs', () => {
    it('should list daily logs for a project', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/contractor/projects/${projectId}/daily-logs?limit=10&offset=0`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeInstanceOf(Array)
      expect(body.pagination).toHaveProperty('total')
      expect(body.pagination).toHaveProperty('limit')
      expect(body.pagination).toHaveProperty('offset')
    })
  })

  describe('PATCH /contractor/projects/:projectId/daily-logs/:logId', () => {
    it('should update a daily log', async () => {
      const projectId = 'test-project-id'
      const logId = 'test-log-id'
      
      const response = await app.inject({
        method: 'PATCH',
        url: `/contractor/projects/${projectId}/daily-logs/${logId}`,
        payload: {
          progressNotes: 'Updated: Completed ahead of schedule',
          issues: 'Minor delay due to material delivery',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should reject update from non-owner', async () => {
      const projectId = 'test-project-id'
      const logId = 'test-log-id'
      
      // Mock different user
      const response = await app.inject({
        method: 'PATCH',
        url: `/contractor/projects/${projectId}/daily-logs/${logId}`,
        payload: {
          progressNotes: 'Unauthorized update',
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('GET /contractor/projects/:projectId/files', () => {
    it('should list project files', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/contractor/projects/${projectId}/files?limit=20`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.files).toBeInstanceOf(Array)
    })

    it('should filter files by category', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/contractor/projects/${projectId}/files?category=SITE_PHOTO`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })
  })

  // Note: File upload tests require multipart/form-data handling
  // These would typically use a test client like supertest or form-data
  describe('POST /contractor/projects/:projectId/site-photos', () => {
    it.skip('should upload site photos (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })
  })

  describe('POST /contractor/projects/:projectId/receipts', () => {
    it.skip('should upload receipts (requires multipart)', async () => {
      // TODO: Implement with multipart form data
    })
  })
})
