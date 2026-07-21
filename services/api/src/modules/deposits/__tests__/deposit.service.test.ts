/**
 * Deposit Service Tests
 * Comprehensive test suite for deposit processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { depositService } from '../deposit.service';
import { prisma } from '@kealee/database';
import { Decimal } from '@kealee/database';

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 50000,
      }),
    },
    paymentMethods: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
        card: {
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      }),
    },
  })),
}));

describe('DepositService', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.depositRequest.deleteMany();
    await prisma.escrowAgreement.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('createDeposit', () => {
    it('should create a deposit request successfully', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'OWNER',
        },
      });

      // Create test escrow
      const escrow = await prisma.escrowAgreement.create({
        data: {
          contractId: 'contract123',
          totalAmount: new Decimal(100000),
          currentBalance: new Decimal(0),
          availableBalance: new Decimal(0),
          status: 'PENDING_DEPOSIT',
        },
      });

      // Create test payment method
      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          type: 'CARD',
          stripePaymentMethodId: 'pm_test123',
          lastFour: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
      });

      // Create deposit
      const result = await depositService.createDeposit({
        escrowId: escrow.id,
        userId: user.id,
        amount: 50000,
        currency: 'USD',
        paymentMethodId: paymentMethod.id,
      });

      expect(result.success).toBe(true);
      expect(result.depositId).toBeDefined();

      // Verify deposit was created in database
      const deposit = await prisma.depositRequest.findUnique({
        where: { id: result.depositId },
      });

      expect(deposit).toBeDefined();
      expect(deposit!.amount.toNumber()).toBe(50000);
      expect(deposit!.status).toBe('PENDING');
    });

    it('should reject deposit with insufficient amount', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const escrow = await prisma.escrowAgreement.create({
        data: {
          contractId: 'contract123',
          totalAmount: new Decimal(100000),
          currentBalance: new Decimal(0),
          availableBalance: new Decimal(0),
          status: 'PENDING_DEPOSIT',
        },
      });

      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          type: 'CARD',
          stripePaymentMethodId: 'pm_test123',
          lastFour: '4242',
          isDefault: true,
        },
      });

      // Try to create deposit with amount less than $1
      await expect(
        depositService.createDeposit({
          escrowId: escrow.id,
          userId: user.id,
          amount: 0.5,
          currency: 'USD',
          paymentMethodId: paymentMethod.id,
        })
      ).rejects.toThrow();
    });
  });

  describe('processDeposit', () => {
    it('should process a pending deposit successfully', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const escrow = await prisma.escrowAgreement.create({
        data: {
          contractId: 'contract123',
          totalAmount: new Decimal(100000),
          currentBalance: new Decimal(0),
          availableBalance: new Decimal(0),
          status: 'ACTIVE',
        },
      });

      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          type: 'CARD',
          stripePaymentMethodId: 'pm_test123',
          lastFour: '4242',
          isDefault: true,
        },
      });

      const deposit = await prisma.depositRequest.create({
        data: {
          escrowId: escrow.id,
          userId: user.id,
          amount: new Decimal(50000),
          currency: 'USD',
          paymentMethodId: paymentMethod.id,
          status: 'PENDING',
        },
      });

      const result = await depositService.processDeposit(deposit.id);

      expect(result.success).toBe(true);
      expect(result.status).toBe('COMPLETED');

      // Verify escrow balance updated
      const updatedEscrow = await prisma.escrowAgreement.findUnique({
        where: { id: escrow.id },
      });

      expect(updatedEscrow!.currentBalance.toNumber()).toBe(50000);
    });

    it('should handle failed payment processing', async () => {
      // Mock Stripe payment failure
      vi.mocked(require('stripe').default).mockImplementation(() => ({
        paymentIntents: {
          create: vi.fn().mockRejectedValue(new Error('Payment declined')),
        },
      }));

      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const escrow = await prisma.escrowAgreement.create({
        data: {
          contractId: 'contract123',
          totalAmount: new Decimal(100000),
          currentBalance: new Decimal(0),
          availableBalance: new Decimal(0),
          status: 'ACTIVE',
        },
      });

      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          type: 'CARD',
          stripePaymentMethodId: 'pm_test123',
          lastFour: '4242',
          isDefault: true,
        },
      });

      const deposit = await prisma.depositRequest.create({
        data: {
          escrowId: escrow.id,
          userId: user.id,
          amount: new Decimal(50000),
          currency: 'USD',
          paymentMethodId: paymentMethod.id,
          status: 'PENDING',
        },
      });

      await expect(depositService.processDeposit(deposit.id)).rejects.toThrow();

      // Verify deposit status updated to FAILED
      const updatedDeposit = await prisma.depositRequest.findUnique({
        where: { id: deposit.id },
      });

      expect(updatedDeposit!.status).toBe('FAILED');
    });
  });

  describe('validation', () => {
    it('should validate deposit amount limits', async () => {
      const result = await depositService.validateDepositAmount(0.5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum deposit');

      const result2 = await depositService.validateDepositAmount(2000000);
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('Maximum deposit');

      const result3 = await depositService.validateDepositAmount(50000);
      expect(result3.valid).toBe(true);
    });

    it('should validate payment method', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      // Expired payment method
      const expiredPM = await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          type: 'CARD',
          stripePaymentMethodId: 'pm_expired',
          lastFour: '4242',
          expiryMonth: 1,
          expiryYear: 2020, // Expired
          isDefault: true,
        },
      });

      const result = await depositService.validatePaymentMethod(expiredPM.id);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });
});
