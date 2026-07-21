/**
 * Deposit API Integration Tests
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { testPrisma, seedTestData, clearDatabase, generateTestToken } from '../setup';
import { depositRoutes } from '../../routes/deposit.routes';

describe('Deposit API', () => {
  let app: FastifyInstance;
  let testData: Awaited<ReturnType<typeof seedTestData>>;
  let authToken: string;

  beforeAll(async () => {
    app = Fastify();
    
    // Register routes
    await app.register(depositRoutes, { prefix: '/api/deposits' });
    
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    testData = await seedTestData();
    authToken = generateTestToken(testData.user.id);
    
    // Create payment method
    await testPrisma.paymentMethod.create({
      data: {
        userId: testData.user.id,
        type: 'CARD',
        stripePaymentMethodId: 'pm_test_123',
        last4: '4242',
        brand: 'Visa',
        isDefault: true,
        isVerified: true,
        status: 'ACTIVE',
      },
    });
  });

  describe('POST /api/deposits', () => {
    it('should create deposit request', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/deposits',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          escrowId: testData.escrow.id,
          amount: 1000,
          paymentMethodId: paymentMethod!.id,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.amount).toBe(1000);
      expect(body.data.status).toBe('PENDING');
    });

    it('should reject deposit below minimum amount', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/deposits',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          escrowId: testData.escrow.id,
          amount: 50, // Below $1.00 minimum
          paymentMethodId: paymentMethod!.id,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject unauthorized request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/deposits',
        payload: {
          escrowId: testData.escrow.id,
          amount: 1000,
          paymentMethodId: 'pm_test',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/deposits/:depositId/process', () => {
    it('should process pending deposit', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const deposit = await testPrisma.depositRequest.create({
        data: {
          escrowAgreementId: testData.escrow.id,
          paymentMethodId: paymentMethod!.id,
          userId: testData.user.id,
          amount: 1000,
          currency: 'USD',
          status: 'PENDING',
          requiresVerification: false,
          retryCount: 0,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/deposits/${deposit.id}/process`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(['PROCESSING', 'CLEARING', 'COMPLETED']).toContain(body.data.status);
    });

    it('should reject processing of already completed deposit', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const deposit = await testPrisma.depositRequest.create({
        data: {
          escrowAgreementId: testData.escrow.id,
          paymentMethodId: paymentMethod!.id,
          userId: testData.user.id,
          amount: 1000,
          currency: 'USD',
          status: 'COMPLETED',
          requiresVerification: false,
          retryCount: 0,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/deposits/${deposit.id}/process`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/deposits/:depositId', () => {
    it('should get deposit details', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const deposit = await testPrisma.depositRequest.create({
        data: {
          escrowAgreementId: testData.escrow.id,
          paymentMethodId: paymentMethod!.id,
          userId: testData.user.id,
          amount: 1500,
          currency: 'USD',
          status: 'PENDING',
          requiresVerification: false,
          retryCount: 0,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/deposits/${deposit.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(deposit.id);
      expect(body.data.amount).toBe(1500);
    });

    it('should return 404 for non-existent deposit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/deposits/non_existent_id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/deposits/escrow/:escrowId', () => {
    it('should get deposit history for escrow', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      // Create multiple deposits
      await testPrisma.depositRequest.createMany({
        data: [
          {
            escrowAgreementId: testData.escrow.id,
            paymentMethodId: paymentMethod!.id,
            userId: testData.user.id,
            amount: 1000,
            currency: 'USD',
            status: 'COMPLETED',
            requiresVerification: false,
            retryCount: 0,
          },
          {
            escrowAgreementId: testData.escrow.id,
            paymentMethodId: paymentMethod!.id,
            userId: testData.user.id,
            amount: 2000,
            currency: 'USD',
            status: 'PENDING',
            requiresVerification: false,
            retryCount: 0,
          },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/deposits/escrow/${testData.escrow.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.count).toBe(2);
    });

    it('should return empty array for escrow with no deposits', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/deposits/escrow/${testData.escrow.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(0);
    });
  });

  describe('POST /api/deposits/:depositId/retry', () => {
    it('should retry failed deposit', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const deposit = await testPrisma.depositRequest.create({
        data: {
          escrowAgreementId: testData.escrow.id,
          paymentMethodId: paymentMethod!.id,
          userId: testData.user.id,
          amount: 1000,
          currency: 'USD',
          status: 'FAILED',
          requiresVerification: false,
          retryCount: 1,
          failureReason: 'Card declined',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/deposits/${deposit.id}/retry`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should reject retry after max attempts', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const deposit = await testPrisma.depositRequest.create({
        data: {
          escrowAgreementId: testData.escrow.id,
          paymentMethodId: paymentMethod!.id,
          userId: testData.user.id,
          amount: 1000,
          currency: 'USD',
          status: 'FAILED',
          requiresVerification: false,
          retryCount: 3, // Max retries reached
          failureReason: 'Card declined',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/deposits/${deposit.id}/retry`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/deposits/:depositId/cancel', () => {
    it('should cancel pending deposit', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const deposit = await testPrisma.depositRequest.create({
        data: {
          escrowAgreementId: testData.escrow.id,
          paymentMethodId: paymentMethod!.id,
          userId: testData.user.id,
          amount: 1000,
          currency: 'USD',
          status: 'PENDING',
          requiresVerification: false,
          retryCount: 0,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/deposits/${deposit.id}/cancel`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify deposit is cancelled
      const updatedDeposit = await testPrisma.depositRequest.findUnique({
        where: { id: deposit.id },
      });

      expect(updatedDeposit?.status).toBe('CANCELLED');
    });

    it('should reject cancellation of completed deposit', async () => {
      const paymentMethod = await testPrisma.paymentMethod.findFirst({
        where: { userId: testData.user.id },
      });

      const deposit = await testPrisma.depositRequest.create({
        data: {
          escrowAgreementId: testData.escrow.id,
          paymentMethodId: paymentMethod!.id,
          userId: testData.user.id,
          amount: 1000,
          currency: 'USD',
          status: 'COMPLETED',
          requiresVerification: false,
          retryCount: 0,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/deposits/${deposit.id}/cancel`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});

