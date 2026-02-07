/**
 * Client Action Routes Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import Fastify, { FastifyInstance } from 'fastify'
import clientActionsRoutes from './client-actions.routes'

describe('Client Action Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify()
    
    // Mock authentication
    app.decorateRequest('user', {
      id: 'test-client-id',
      role: 'HOMEOWNER',
    })

    await app.register(clientActionsRoutes, { prefix: '/client' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /client/projects', () => {
    it('should create a new project/lead', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/client/projects',
        payload: {
          propertyAddress: '123 Main St, San Francisco, CA 94102',
          propertyType: 'SINGLE_FAMILY',
          projectDescription: 'Kitchen remodel with new cabinets, countertops, and appliances. Looking for complete gut and renovation.',
          projectType: 'Kitchen Remodel',
          budgetRange: {
            min: 30000,
            max: 50000,
          },
          desiredStartDate: '2026-03-01',
          desiredTimeline: '2_3_months',
          specialRequirements: 'Must use eco-friendly materials',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data.projectType).toBe('Kitchen Remodel')
      expect(body.message).toContain('successfully')
    })

    it('should reject invalid project data (missing required fields)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/client/projects',
        payload: {
          propertyAddress: '123 Main St',
          // Missing required fields
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject invalid budget range (max < min)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/client/projects',
        payload: {
          propertyAddress: '123 Main St, San Francisco, CA 94102',
          propertyType: 'SINGLE_FAMILY',
          projectDescription: 'Test project description that is long enough',
          projectType: 'Test',
          budgetRange: {
            min: 50000,
            max: 30000, // Max less than min - invalid
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /client/leads/:leadId/bids', () => {
    it('should get bids for a lead', async () => {
      const leadId = 'test-lead-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/client/leads/${leadId}/bids`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeInstanceOf(Array)
    })

    it('should deny access to non-owner', async () => {
      const leadId = 'other-user-lead-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/client/leads/${leadId}/bids`,
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('POST /client/bids/:bidId/accept', () => {
    it('should accept a bid', async () => {
      const bidId = 'test-bid-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/client/bids/${bidId}/accept`,
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toContain('accepted')
    })
  })

  describe('GET /client/projects/:projectId/milestones', () => {
    it('should list milestones for a project', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/client/projects/${projectId}/milestones`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeInstanceOf(Array)
    })
  })

  describe('POST /client/milestones/:milestoneId/approve', () => {
    it('should approve a milestone and release payment', async () => {
      const milestoneId = 'test-milestone-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/client/milestones/${milestoneId}/approve`,
        payload: {
          milestoneId,
          approved: true,
          comments: 'Work looks great!',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toContain('approved')
    })

    it('should reject a milestone', async () => {
      const milestoneId = 'test-milestone-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/client/milestones/${milestoneId}/approve`,
        payload: {
          milestoneId,
          approved: false,
          comments: 'Please fix the issues',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toContain('rejected')
    })
  })

  describe('GET /client/projects/:projectId/change-orders', () => {
    it('should list change orders', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'GET',
        url: `/client/projects/${projectId}/change-orders`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeInstanceOf(Array)
    })
  })

  describe('POST /client/change-orders/:changeOrderId/approve', () => {
    it('should approve a change order', async () => {
      const changeOrderId = 'test-co-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/client/change-orders/${changeOrderId}/approve`,
        payload: {
          changeOrderId,
          approved: true,
          comments: 'Approved',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })
  })

  describe('POST /client/projects/:projectId/reviews', () => {
    it('should leave a review', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/client/projects/${projectId}/reviews`,
        payload: {
          projectId,
          contractorId: 'test-contractor-id',
          rating: 5,
          reviewText: 'Excellent work! Very professional and completed on time.',
          categories: {
            quality: 5,
            communication: 5,
            timeline: 4,
            professionalism: 5,
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toContain('submitted')
    })

    it('should reject review with invalid rating', async () => {
      const projectId = 'test-project-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/client/projects/${projectId}/reviews`,
        payload: {
          projectId,
          contractorId: 'test-contractor-id',
          rating: 6, // Invalid - must be 1-5
          reviewText: 'Test review',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /client/escrow/:escrowId/fund', () => {
    it('should fund escrow account', async () => {
      const escrowId = 'test-escrow-id'
      
      const response = await app.inject({
        method: 'POST',
        url: `/client/escrow/${escrowId}/fund`,
        payload: {
          paymentMethodId: 'pm_test_123',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toContain('funded')
    })
  })
})
