/**
 * Webhook Idempotency Service Tests
 * Test suite for webhook duplicate detection and retry logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { webhookIdempotencyService } from '../webhook-idempotency.service';
import { prisma } from '@kealee/database';

describe('WebhookIdempotencyService', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.webhookRetry.deleteMany();
    await prisma.webhookLog.deleteMany();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isProcessed', () => {
    it('should return false for new webhook', async () => {
      const result = await webhookIdempotencyService.isProcessed('wh_new123');
      expect(result).toBe(false);
    });

    it('should return true for processed webhook', async () => {
      await prisma.webhookLog.create({
        data: {
          webhookId: 'wh_processed123',
          status: 'PROCESSED',
        },
      });

      const result = await webhookIdempotencyService.isProcessed('wh_processed123');
      expect(result).toBe(true);
    });
  });

  describe('processWebhook', () => {
    it('should process new webhook successfully', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);

      const event = {
        id: 'wh_test123',
        type: 'payment.succeeded',
        payload: { amount: 10000 },
        source: 'stripe' as const,
        receivedAt: new Date(),
      };

      const result = await webhookIdempotencyService.processWebhook(
        event,
        mockHandler
      );

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.duplicate).toBe(false);
      expect(mockHandler).toHaveBeenCalledWith(event);

      // Verify webhook was logged
      const log = await prisma.webhookLog.findUnique({
        where: { webhookId: event.id },
      });

      expect(log).toBeDefined();
      expect(log!.status).toBe('PROCESSED');
    });

    it('should reject duplicate webhook', async () => {
      const mockHandler = vi.fn();

      // Process webhook first time
      await prisma.webhookLog.create({
        data: {
          webhookId: 'wh_duplicate123',
          status: 'PROCESSED',
        },
      });

      const event = {
        id: 'wh_duplicate123',
        type: 'payment.succeeded',
        payload: {},
        source: 'stripe' as const,
        receivedAt: new Date(),
      };

      const result = await webhookIdempotencyService.processWebhook(
        event,
        mockHandler
      );

      expect(result.success).toBe(true);
      expect(result.processed).toBe(false);
      expect(result.duplicate).toBe(true);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle webhook processing errors', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Processing failed'));

      const event = {
        id: 'wh_error123',
        type: 'payment.failed',
        payload: {},
        source: 'stripe' as const,
        receivedAt: new Date(),
      };

      const result = await webhookIdempotencyService.processWebhook(
        event,
        mockHandler
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing failed');

      // Verify webhook was logged as failed
      const log = await prisma.webhookLog.findUnique({
        where: { webhookId: event.id },
      });

      expect(log).toBeDefined();
      expect(log!.status).toBe('FAILED');
      expect(log!.retryCount).toBe(1);
    });

    it('should schedule retry on failure', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Network error'));

      const event = {
        id: 'wh_retry123',
        type: 'charge.refunded',
        payload: { amount: 5000 },
        source: 'stripe' as const,
        receivedAt: new Date(),
      };

      await webhookIdempotencyService.processWebhook(event, mockHandler);

      // Verify retry was scheduled
      const retries = await prisma.webhookRetry.findMany({
        where: { webhookId: event.id },
      });

      expect(retries).toHaveLength(1);
      expect(retries[0].status).toBe('PENDING');
      expect(retries[0].retryCount).toBe(1);
    });

    it('should stop retrying after max attempts', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Persistent error'));

      const event = {
        id: 'wh_maxretry123',
        type: 'invoice.payment_failed',
        payload: {},
        source: 'stripe' as const,
        receivedAt: new Date(),
      };

      // Simulate 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await webhookIdempotencyService.processWebhook(event, mockHandler);
      }

      // 4th attempt should reject with max retries error
      const result = await webhookIdempotencyService.processWebhook(
        event,
        mockHandler
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Max retries exceeded');
    });
  });

  describe('webhook history', () => {
    it('should retrieve webhook processing history', async () => {
      await prisma.webhookLog.create({
        data: {
          webhookId: 'wh_history123',
          status: 'FAILED',
          retryCount: 2,
        },
      });

      await prisma.webhookRetry.createMany({
        data: [
          {
            webhookId: 'wh_history123',
            retryCount: 1,
            scheduledFor: new Date(),
            payload: {},
            status: 'COMPLETED',
          },
          {
            webhookId: 'wh_history123',
            retryCount: 2,
            scheduledFor: new Date(),
            payload: {},
            status: 'FAILED',
          },
        ],
      });

      const history = await webhookIdempotencyService.getWebhookHistory(
        'wh_history123'
      );

      expect(history).toBeDefined();
      expect(history!.retryCount).toBe(2);
      expect(history!.retries).toHaveLength(2);
    });
  });

  describe('cleanup', () => {
    it('should clean up old webhook logs', async () => {
      // Create old logs (35 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);

      await prisma.webhookLog.createMany({
        data: [
          {
            webhookId: 'wh_old1',
            status: 'PROCESSED',
            createdAt: oldDate,
          },
          {
            webhookId: 'wh_old2',
            status: 'PROCESSED',
            createdAt: oldDate,
          },
        ],
      });

      // Create recent log
      await prisma.webhookLog.create({
        data: {
          webhookId: 'wh_recent',
          status: 'PROCESSED',
        },
      });

      const deleted = await webhookIdempotencyService.cleanupOldLogs(30);

      expect(deleted).toBe(2);

      // Verify recent log still exists
      const recent = await prisma.webhookLog.findUnique({
        where: { webhookId: 'wh_recent' },
      });
      expect(recent).toBeDefined();
    });
  });
});
