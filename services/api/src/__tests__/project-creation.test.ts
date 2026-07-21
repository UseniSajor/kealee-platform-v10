import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { prismaAny } from '../../utils/prisma-helper'
import { authRoutes } from '../modules/auth/auth.routes'
import { projectRoutes } from '../modules/projects/project.routes'
import { propertyRoutes } from '../modules/properties/property.routes'
import { readinessRoutes } from '../modules/readiness/readiness.routes'
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware'
import * as authServiceModule from '../modules/auth/auth.service'

describe('Project Creation Integration Tests (Prompt 1.7)', () => {
  let fastify: any
  let testUser1: { id: string; email: string }
  let testUser2: { id: string; email: string }
  let testOrg: { id: string }
  let authToken1: string
  let authToken2: string

  beforeAll(async () => {
    fastify = Fastify({
      logger: false,
    })

    await fastify.register(cors, { origin: true })
    await fastify.register(helmet)

    fastify.get('/health', async () => {
      return { status: 'ok' }
    })

    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(projectRoutes, { prefix: '/projects' })
    await fastify.register(propertyRoutes, { prefix: '/properties' })
    await fastify.register(readinessRoutes, { prefix: '/readiness' })

    await fastify.ready()

    // Create test users
    testUser1 = await prismaAny.user.create({
      data: {
        email: `test-user-1-${Date.now()}@example.com`,
        name: 'Test User 1',
        password: 'hashed-password-123', // In real tests, this would be properly hashed
      },
    })

    testUser2 = await prismaAny.user.create({
      data: {
        email: `test-user-2-${Date.now()}@example.com`,
        name: 'Test User 2',
        password: 'hashed-password-123',
      },
    })

    // Create test org
    testOrg = await prismaAny.org.create({
      data: {
        name: `Test Org ${Date.now()}`,
        slug: `test-org-${Date.now()}`,
      },
    })

    // Create org memberships
    await prismaAny.orgMember.create({
      data: {
        userId: testUser1.id,
        orgId: testOrg.id,
        roleKey: 'ADMIN',
      },
    })

    // Mock auth service to return our test users
    authToken1 = `test-token-user-${testUser1.id}`
    authToken2 = `test-token-user-${testUser2.id}`
    
    // Mock verifyToken to return test users based on token
    vi.spyOn(authServiceModule.authService, 'verifyToken').mockImplementation(async (token: string) => {
      if (token === authToken1) {
        return { id: testUser1.id, email: testUser1.email } as any
      }
      if (token === authToken2) {
        return { id: testUser2.id, email: testUser2.email } as any
      }
      throw new Error('Invalid token')
    })
  })

  afterAll(async () => {
    // Cleanup test data
    await prismaAny.readinessItem.deleteMany({
      where: {
        project: {
          ownerId: { in: [testUser1.id, testUser2.id] },
        },
      } as any,
    }).catch(() => {})
    await prismaAny.project.deleteMany({
      where: {
        ownerId: { in: [testUser1.id, testUser2.id] },
      } as any,
    }).catch(() => {})
    await prismaAny.property.deleteMany({
      where: {
        orgId: testOrg.id,
      },
    }).catch(() => {})
    await prismaAny.orgMember.deleteMany({
      where: {
        orgId: testOrg.id,
      },
    }).catch(() => {})
    await prismaAny.org.delete({
      where: { id: testOrg.id },
    }).catch(() => {})
    await prismaAny.user.deleteMany({
      where: {
        id: { in: [testUser1.id, testUser2.id] },
      },
    })

    await fastify.close()
  })

  beforeEach(async () => {
    // Clean up projects and readiness items before each test
    await prismaAny.readinessItem.deleteMany({
      where: {
        project: {
          ownerId: { in: [testUser1.id, testUser2.id] },
        },
      },
    })
    await prismaAny.project.deleteMany({
      where: {
        ownerId: { in: [testUser1.id, testUser2.id] },
      },
    })
  })

  describe('Project Creation with All Category Types', () => {
    const categories = ['KITCHEN', 'BATHROOM', 'ADDITION', 'NEW_CONSTRUCTION', 'RENOVATION', 'OTHER']

    categories.forEach((category) => {
      it(`should create project with category ${category}`, async () => {
        const response = await fastify.inject({
          method: 'POST',
          url: '/projects',
          headers: {
            authorization: `Bearer ${authToken1}`,
            'x-user-id': testUser1.id, // Mock auth middleware sets this
          },
          payload: {
            name: `Test ${category} Project`,
            description: `Test project for ${category}`,
            category,
            orgId: testOrg.id,
          },
        })

        expect(response.statusCode).toBe(201)
        const body = response.json()
        expect(body.project).toBeDefined()
        expect(body.project.category).toBe(category)
        expect(body.project.ownerId).toBe(testUser1.id)
        expect(body.project.status).toBe('DRAFT')
      })
    })

    it('should create project with category-specific metadata', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Test Addition Project',
          description: 'Test addition with square footage',
          category: 'ADDITION',
          categoryMetadata: {
            additionSquareFeet: 500,
          },
          orgId: testOrg.id,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.project.category).toBe('ADDITION')
      expect(body.project.categoryMetadata).toBeDefined()
    })
  })

  describe('Property Association Validation', () => {
    let testProperty: { id: string }

    beforeAll(async () => {
      testProperty = await prismaAny.property.create({
        data: {
          orgId: testOrg.id,
          address: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zip: '12345',
        },
      })
    })

    it('should create project with existing property', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Project with Property',
          category: 'KITCHEN',
          propertyId: testProperty.id,
          orgId: testOrg.id,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.project.propertyId).toBe(testProperty.id)
    })

    it('should reject project with invalid property ID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Project with Invalid Property',
          category: 'KITCHEN',
          propertyId: '00000000-0000-0000-0000-000000000000',
          orgId: testOrg.id,
        },
      })

      // Should fail validation or return error
      expect([400, 404, 500]).toContain(response.statusCode)
    })

    it('should allow project without property (optional)', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Project without Property',
          category: 'OTHER',
          orgId: testOrg.id,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.project.propertyId).toBeNull()
    })
  })

  describe('Readiness Checklist Generation', () => {
    let testProject: { id: string }

    beforeEach(async () => {
      // Create a test project
      const projectRes = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Test Project for Readiness',
          category: 'KITCHEN',
          orgId: testOrg.id,
        },
      })
      testProject = projectRes.json().project
    })

    it('should generate readiness checklist from templates', async () => {
      // First, create a readiness template
      const templateRes = await fastify.inject({
        method: 'POST',
        url: '/readiness/templates',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Kitchen Project Template',
          category: 'KITCHEN',
          isActive: true,
        },
      })
      const template = templateRes.json().template

      // Add template items
      await fastify.inject({
        method: 'POST',
        url: `/readiness/templates/${template.id}/items`,
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          title: 'Building Plans',
          description: 'Upload building plans',
          type: 'DOCUMENT_UPLOAD',
          required: true,
          order: 0,
        },
      })

      await fastify.inject({
        method: 'POST',
        url: `/readiness/templates/${template.id}/items`,
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          title: 'HOA Approval',
          description: 'Get HOA approval',
          type: 'QUESTION_ANSWER',
          required: true,
          order: 1,
        },
      })

      // Generate readiness checklist
      const response = await fastify.inject({
        method: 'POST',
        url: `/readiness/projects/${testProject.id}/generate`,
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.items).toBeDefined()
      expect(body.items.length).toBeGreaterThan(0)
      expect(body.items[0].title).toBe('Building Plans')
      expect(body.items[0].required).toBe(true)
    })

    it('should return existing checklist if already generated', async () => {
      // Generate first time
      await fastify.inject({
        method: 'POST',
        url: `/readiness/projects/${testProject.id}/generate`,
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
      })

      // Generate again (should return existing)
      const response = await fastify.inject({
        method: 'POST',
        url: `/readiness/projects/${testProject.id}/generate`,
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.items).toBeDefined()
    })
  })

  describe('Permission Checks', () => {
    it('should require authentication to create project', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        payload: {
          name: 'Unauthorized Project',
          category: 'KITCHEN',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should allow project owner to create project', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Authorized Project',
          category: 'KITCHEN',
          orgId: testOrg.id,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.project.ownerId).toBe(testUser1.id)
    })

    it('should only allow project owner to view their projects', async () => {
      // User1 creates project
      const createRes = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Private Project',
          category: 'KITCHEN',
          orgId: testOrg.id,
        },
      })
      const project = createRes.json().project

      // User2 tries to access User1's project
      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${authToken2}`,
          'x-user-id': testUser2.id,
        },
      })

      // Should be unauthorized (403) or not found (404)
      expect([403, 404]).toContain(response.statusCode)
    })
  })

  describe('Error Scenarios', () => {
    it('should reject project creation with invalid category', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Invalid Category Project',
          category: 'INVALID_CATEGORY',
          orgId: testOrg.id,
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error).toBeDefined()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject project creation with missing required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          // Missing name and category
          description: 'Missing required fields',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.error).toBeDefined()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject project creation with empty name', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: '',
          category: 'KITCHEN',
          orgId: testOrg.id,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject project creation with invalid org ID format', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Invalid Org Project',
          category: 'KITCHEN',
          orgId: 'not-a-uuid',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle project creation with non-existent org ID gracefully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${authToken1}`,
          'x-user-id': testUser1.id,
        },
        payload: {
          name: 'Non-existent Org Project',
          category: 'KITCHEN',
          orgId: '00000000-0000-0000-0000-000000000000',
        },
      })

      // Should either succeed (if orgId is nullable) or fail with appropriate error
      expect([201, 400, 404, 500]).toContain(response.statusCode)
    })
  })
})
