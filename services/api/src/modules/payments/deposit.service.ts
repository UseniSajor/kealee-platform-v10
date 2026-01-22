/**
 * Deposit Service
 * Handles deposit processing and coordination between Stripe and Escrow
 */

import { PrismaClient, DepositStatus } from '@kealee/database';
import { stripePaymentService } from './stripe-payment.service';
import { escrowService } from '../escrow/escrow.service';
import { eventBus } from '../../events/event-bus';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export interface CreateDepositDTO {
  userId: string;
  escrowId: string;
  amount: number;
  paymentMethodId: string;
  currency?: string;
}

export class DepositService {
  /**
   * Create deposit request
   */
  async createDeposit(data: CreateDepositDTO): Promise<any> {
    // Validate escrow exists and is active
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: data.escrowId },
      include: { contract: true },
    });

    if (!escrow) {
      throw new Error('Escrow agreement not found');
    }

    if (escrow.status === 'CLOSED') {
      throw new Error('Cannot deposit to closed escrow');
    }

    if (escrow.status === 'FROZEN') {
      throw new Error('Cannot deposit to frozen escrow');
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, firstName: true, lastName: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const customer = await stripePaymentService.createOrGetCustomer(
      data.userId,
      user.email,
      `${user.firstName} ${user.lastName}`
    );

    // Get payment method details
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: data.paymentMethodId },
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    if (paymentMethod.userId !== data.userId) {
      throw new Error('Payment method does not belong to user');
    }

    if (paymentMethod.status !== 'ACTIVE') {
      throw new Error('Payment method is not active');
    }

    // Check if payment method requires verification
    const stripePaymentMethod = await stripePaymentService.getPaymentIntent(
      paymentMethod.stripePaymentMethodId
    );

    const requiresVerification = stripePaymentService.requiresVerification(stripePaymentMethod as any);

    // Calculate expected clearance date
    const expectedClearanceDate = stripePaymentService.getExpectedClearanceDate(stripePaymentMethod as any);

    // Create deposit request in database
    const deposit = await prisma.depositRequest.create({
      data: {
        userId: data.userId,
        escrowAgreementId: data.escrowId,
        paymentMethodId: data.paymentMethodId,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: 'PENDING',
        requiresVerification,
        expectedClearanceDate,
        retryCount: 0,
      },
      include: {
        paymentMethod: true,
        escrowAgreement: {
          include: {
            contract: true,
          },
        },
      },
    });

    // Emit event
    eventBus.emit('deposit.created', {
      depositId: deposit.id,
      userId: data.userId,
      escrowId: data.escrowId,
      amount: data.amount,
    });

    return deposit;
  }

  /**
   * Process deposit (charge payment method)
   */
  async processDeposit(depositId: string): Promise<any> {
    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
      include: {
        paymentMethod: true,
        escrowAgreement: {
          include: {
            contract: true,
          },
        },
        user: true,
      },
    });

    if (!deposit) {
      throw new Error('Deposit request not found');
    }

    if (deposit.status !== 'PENDING') {
      throw new Error(`Deposit is already ${deposit.status}`);
    }

    try {
      // Update status to PROCESSING
      await prisma.depositRequest.update({
        where: { id: depositId },
        data: { status: 'PROCESSING' },
      });

      // Create Stripe payment intent
      const paymentIntent = await stripePaymentService.createPaymentIntent({
        amount: deposit.amount, // Already in cents
        currency: deposit.currency.toLowerCase(),
        paymentMethodId: deposit.paymentMethod.stripePaymentMethodId,
        customerId: deposit.user.stripeCustomerId || undefined,
        description: `Deposit to Escrow ${deposit.escrowAgreement.escrowAccountNumber}`,
        metadata: {
          depositId: deposit.id,
          escrowId: deposit.escrowAgreementId,
          userId: deposit.userId,
          contractId: deposit.escrowAgreement.contractId,
        },
      });

      // Auto-confirm payment intent
      await stripePaymentService.confirmPaymentIntent(paymentIntent.id);

      // Update deposit with Stripe IDs
      await prisma.depositRequest.update({
        where: { id: depositId },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          status: 'PROCESSING', // Will be updated to CLEARING/COMPLETED by webhook
        },
      });

      // If card payment, it will complete immediately (handled by webhook)
      // If ACH, it will move to CLEARING status (webhook)

      return await this.getDeposit(depositId);
    } catch (error: any) {
      // Update deposit status to FAILED
      await prisma.depositRequest.update({
        where: { id: depositId },
        data: {
          status: 'FAILED',
          failureReason: error.message,
          failureCode: error.code || 'UNKNOWN',
        },
      });

      // Emit event
      eventBus.emit('deposit.failed', {
        depositId,
        userId: deposit.userId,
        escrowId: deposit.escrowAgreementId,
        reason: error.message,
      });

      throw error;
    }
  }

  /**
   * Handle successful payment (called by webhook)
   */
  async handleSuccessfulPayment(paymentIntentId: string, chargeId: string): Promise<void> {
    const deposit = await prisma.depositRequest.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        paymentMethod: true,
        escrowAgreement: true,
      },
    });

    if (!deposit) {
      console.error(`Deposit not found for payment intent: ${paymentIntentId}`);
      return;
    }

    // Check if payment method is card (immediate) or ACH (needs clearing)
    const isCard = deposit.paymentMethod.type === 'CARD';

    if (isCard) {
      // Card payments complete immediately
      await this.completeDeposit(deposit.id, chargeId);
    } else {
      // ACH payments need to clear (3-5 business days)
      await prisma.depositRequest.update({
        where: { id: deposit.id },
        data: {
          status: 'CLEARING',
          stripeChargeId: chargeId,
        },
      });

      // Emit event
      eventBus.emit('deposit.clearing', {
        depositId: deposit.id,
        userId: deposit.userId,
        escrowId: deposit.escrowAgreementId,
        expectedClearanceDate: deposit.expectedClearanceDate,
      });
    }
  }

  /**
   * Complete deposit (funds are available)
   */
  async completeDeposit(depositId: string, chargeId: string): Promise<void> {
    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
      include: {
        escrowAgreement: true,
      },
    });

    if (!deposit) {
      throw new Error('Deposit not found');
    }

    // Record deposit in escrow
    await escrowService.recordDeposit(
      deposit.escrowAgreementId,
      deposit.amount,
      deposit.userId,
      `Deposit #${depositId}`,
      { depositId, chargeId }
    );

    // Update deposit status
    await prisma.depositRequest.update({
      where: { id: depositId },
      data: {
        status: 'COMPLETED',
        stripeChargeId: chargeId,
        clearedAt: new Date(),
      },
    });

    // Emit event
    eventBus.emit('deposit.completed', {
      depositId,
      userId: deposit.userId,
      escrowId: deposit.escrowAgreementId,
      amount: deposit.amount,
    });
  }

  /**
   * Handle failed payment (called by webhook)
   */
  async handleFailedPayment(paymentIntentId: string, error: any): Promise<void> {
    const deposit = await prisma.depositRequest.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!deposit) {
      console.error(`Deposit not found for payment intent: ${paymentIntentId}`);
      return;
    }

    await prisma.depositRequest.update({
      where: { id: deposit.id },
      data: {
        status: 'FAILED',
        failureReason: error.message || 'Payment failed',
        failureCode: error.code || 'UNKNOWN',
      },
    });

    // Emit event
    eventBus.emit('deposit.failed', {
      depositId: deposit.id,
      userId: deposit.userId,
      escrowId: deposit.escrowAgreementId,
      reason: error.message,
    });
  }

  /**
   * Retry failed deposit
   */
  async retryDeposit(depositId: string): Promise<any> {
    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new Error('Deposit not found');
    }

    if (deposit.status !== 'FAILED') {
      throw new Error('Can only retry failed deposits');
    }

    if (deposit.retryCount >= 3) {
      throw new Error('Maximum retry attempts reached');
    }

    // Increment retry count and reset status
    await prisma.depositRequest.update({
      where: { id: depositId },
      data: {
        status: 'PENDING',
        retryCount: deposit.retryCount + 1,
        failureReason: null,
        failureCode: null,
      },
    });

    // Process deposit again
    return await this.processDeposit(depositId);
  }

  /**
   * Cancel deposit
   */
  async cancelDeposit(depositId: string, userId: string): Promise<void> {
    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new Error('Deposit not found');
    }

    if (deposit.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!['PENDING', 'PROCESSING'].includes(deposit.status)) {
      throw new Error(`Cannot cancel deposit with status ${deposit.status}`);
    }

    // Cancel Stripe payment intent if exists
    if (deposit.stripePaymentIntentId) {
      try {
        await stripePaymentService.cancelPaymentIntent(deposit.stripePaymentIntentId);
      } catch (error) {
        console.error('Failed to cancel Stripe payment intent:', error);
      }
    }

    // Update deposit status
    await prisma.depositRequest.update({
      where: { id: depositId },
      data: { status: 'CANCELLED' },
    });

    // Emit event
    eventBus.emit('deposit.cancelled', {
      depositId,
      userId: deposit.userId,
      escrowId: deposit.escrowAgreementId,
    });
  }

  /**
   * Get deposit
   */
  async getDeposit(depositId: string): Promise<any> {
    return await prisma.depositRequest.findUnique({
      where: { id: depositId },
      include: {
        paymentMethod: true,
        escrowAgreement: {
          include: {
            contract: true,
          },
        },
        user: true,
      },
    });
  }

  /**
   * Get deposit history for escrow
   */
  async getDepositHistory(escrowId: string): Promise<any[]> {
    return await prisma.depositRequest.findMany({
      where: { escrowAgreementId: escrowId },
      include: {
        paymentMethod: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const depositService = new DepositService();

