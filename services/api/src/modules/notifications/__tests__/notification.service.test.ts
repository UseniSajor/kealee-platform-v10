/**
 * Notification Service Tests
 * Test suite for multi-channel notification delivery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../notification.service';
import { prisma } from '@kealee/database';

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        id: 'email_test123',
        from: 'noreply@kealee.com',
        to: 'test@example.com',
      }),
    },
  })),
}));

describe('NotificationService', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('should send email notification successfully', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          notificationPreferences: {
            email: true,
            push: false,
          },
        },
      });

      await notificationService.send({
        userId: user.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: 'You have received a payment of $100',
        data: { amount: 100 },
        channels: ['email'],
      });

      // Verify notification was created
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('PAYMENT_RECEIVED');
      expect(notifications[0].status).toBe('SENT');
    });

    it('should respect user notification preferences', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          notificationPreferences: {
            email: false, // Email disabled
            push: true,
          },
        },
      });

      await notificationService.send({
        userId: user.id,
        type: 'DEPOSIT_COMPLETED',
        title: 'Deposit Completed',
        message: 'Your deposit has been processed',
        channels: ['email'],
      });

      // Verify notification was created but not sent
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].status).toBe('PENDING'); // Not sent due to preferences
    });

    it('should handle multiple notification types', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const types = [
        'PAYMENT_RECEIVED',
        'DEPOSIT_COMPLETED',
        'ESCROW_RELEASED',
        'DISPUTE_OPENED',
        'ACH_VERIFICATION_REQUIRED',
      ];

      for (const type of types) {
        await notificationService.send({
          userId: user.id,
          type: type as any,
          title: `Test ${type}`,
          message: `Test message for ${type}`,
        });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
      });

      expect(notifications).toHaveLength(types.length);
    });
  });

  describe('notification helpers', () => {
    it('should send payment received notification', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      await notificationService.notifyPaymentReceived(user.id, 100, 'tx_123');

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id, type: 'PAYMENT_RECEIVED' },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toContain('Payment Received');
    });

    it('should send deposit completed notification', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      await notificationService.notifyDepositCompleted(user.id, 50000, 'dep_123');

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id, type: 'DEPOSIT_COMPLETED' },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toContain('$50000');
    });

    it('should send escrow released notification', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      await notificationService.notifyEscrowReleased(
        user.id,
        25000,
        'Contractor ABC',
        'escrow_123'
      );

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id, type: 'ESCROW_RELEASED' },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toContain('Contractor ABC');
    });

    it('should send dispute opened notification', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      await notificationService.notifyDisputeOpened(
        user.id,
        'dispute_123',
        'Work not completed',
        10000
      );

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id, type: 'DISPUTE_OPENED' },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toContain('Work not completed');
    });

    it('should send ACH verification notification', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      await notificationService.notifyACHVerificationRequired(user.id, 'pm_123');

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id, type: 'ACH_VERIFICATION_REQUIRED' },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toContain('Verification Required');
    });
  });

  describe('email content generation', () => {
    it('should generate proper HTML email content', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      // Send notification
      await notificationService.send({
        userId: user.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: 'You have received a payment',
        data: {
          amount: 100,
          transactionId: 'tx_123',
        },
      });

      // Verify email was sent (check mock)
      const Resend = require('resend').Resend;
      const mockInstance = Resend.mock.results[0].value;
      expect(mockInstance.emails.send).toHaveBeenCalled();
    });
  });
});
