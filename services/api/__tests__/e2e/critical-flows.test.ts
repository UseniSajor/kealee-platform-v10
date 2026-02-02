/**
 * Critical Path E2E Tests
 * Tests the most important user journeys
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';
let authToken: string;
let testUserId: string;
let testProjectId: string;

describe('Critical Path Flows', () => {
  describe('1. User Registration and Login', () => {
    it('should register a new user', async () => {
      const testEmail = `test+${Date.now()}@example.com`;
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email: testEmail,
        password: 'Test123!@#',
        name: 'Test User',
        role: 'GC',
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('user');
      testUserId = response.data.user.id;
    });

    it('should login with credentials', async () => {
      // Test login
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      authToken = response.data.token;
    });
  });

  describe('2. Package Subscription Flow', () => {
    it('should create Stripe checkout session', async () => {
      const response = await axios.post(
        `${API_URL}/api/checkout/create`,
        {
          packageId: 'PKG_B',
          userId: testUserId,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('sessionId');
    });

    it('should handle Stripe webhook', async () => {
      // Test webhook processing
      // Note: Requires Stripe test event
    });
  });

  describe('3. Project Creation Flow', () => {
    it('should create a new project', async () => {
      const response = await axios.post(
        `${API_URL}/api/projects`,
        {
          name: 'Test Project',
          address: '123 Test St',
          type: 'RESIDENTIAL',
          budget: 100000,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      testProjectId = response.data.id;
    });
  });

  describe('4. Estimate Creation Flow', () => {
    it('should create an estimate', async () => {
      const response = await axios.post(
        `${API_URL}/api/estimates`,
        {
          projectId: testProjectId,
          name: 'Test Estimate',
          sections: [],
          settings: {
            overheadPercent: 15,
            profitPercent: 10,
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
    });
  });

  describe('5. Escrow and Payment Flow', () => {
    it('should create escrow account', async () => {
      const response = await axios.post(
        `${API_URL}/api/escrow`,
        {
          projectId: testProjectId,
          amount: 50000,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('escrowId');
    });
  });

  describe('6. Permit Application Flow', () => {
    it('should create permit application', async () => {
      const response = await axios.post(
        `${API_URL}/api/permits`,
        {
          projectId: testProjectId,
          type: 'BUILDING',
          jurisdictionCode: 'SF-DBI',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('permitId');
    });
  });
});

describe('Performance Tests', () => {
  it('should respond to health check in < 100ms', async () => {
    const start = Date.now();
    const response = await axios.get(`${API_URL}/health`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
  });

  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 10 }, () =>
      axios.get(`${API_URL}/health`)
    );

    const responses = await Promise.all(requests);
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });
});
