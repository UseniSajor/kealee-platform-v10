/**
 * Stripe Payment Service
 * Handles all Stripe payment operations
 */

import Stripe from 'stripe';
import { PrismaClient } from '@kealee/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const prisma = new PrismaClient();

export interface CreatePaymentIntentOptions {
  amount: number; // in cents
  currency: string;
  paymentMethodId: string;
  customerId?: string;
  metadata?: Record<string, any>;
  description?: string;
}

export interface CreatePaymentMethodOptions {
  type: 'card' | 'us_bank_account';
  cardToken?: string;
  bankAccountToken?: string;
  customerId?: string;
  setAsDefault?: boolean;
}

export class StripePaymentService {
  /**
   * Create or retrieve Stripe customer
   */
  async createOrGetCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    // Check if user already has Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      } catch (error) {
        // Customer not found, create new one
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Save customer ID to database
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  /**
   * Create payment intent for deposit
   */
  async createPaymentIntent(options: CreatePaymentIntentOptions): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: options.amount,
      currency: options.currency.toLowerCase(),
      payment_method: options.paymentMethodId,
      customer: options.customerId,
      confirm: false, // Don't auto-confirm, let frontend confirm
      metadata: options.metadata || {},
      description: options.description,
      // Capture immediately after authorization
      capture_method: 'automatic',
    });

    return paymentIntent;
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.confirm(paymentIntentId);
  }

  /**
   * Capture payment intent (if using manual capture)
   */
  async capturePaymentIntent(paymentIntentId: string, amount?: number): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: amount,
    });
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(options: CreatePaymentMethodOptions): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await stripe.paymentMethods.create({
      type: options.type,
      card: options.cardToken ? { token: options.cardToken } : undefined,
      us_bank_account: options.bankAccountToken ? { token: options.bankAccountToken } : undefined,
    });

    // Attach to customer if provided
    if (options.customerId) {
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: options.customerId,
      });

      // Set as default if requested
      if (options.setAsDefault) {
        await stripe.customers.update(options.customerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.id,
          },
        });
      }
    }

    return paymentMethod;
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return await stripe.paymentMethods.detach(paymentMethodId);
  }

  /**
   * List customer payment methods
   */
  async listCustomerPaymentMethods(
    customerId: string,
    type?: 'card' | 'us_bank_account'
  ): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: type || 'card',
    });

    return paymentMethods.data;
  }

  /**
   * Create refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  ): Promise<Stripe.Refund> {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
    });
  }

  /**
   * Verify bank account (ACH)
   */
  async verifyBankAccount(
    paymentMethodId: string,
    amounts: [number, number]
  ): Promise<Stripe.PaymentMethod> {
    // Stripe uses micro-deposits for verification
    // This would be called after user enters the amounts
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId: string): Promise<Stripe.Charge> {
    return await stripe.charges.retrieve(chargeId);
  }

  /**
   * Calculate Stripe fee
   * Standard: 2.9% + $0.30 per transaction
   * ACH: 0.8% ($5 cap) per transaction
   */
  calculateStripeFee(amount: number, type: 'card' | 'ach'): number {
    if (type === 'card') {
      return Math.round(amount * 0.029 + 30); // 2.9% + $0.30
    } else if (type === 'ach') {
      const fee = Math.round(amount * 0.008); // 0.8%
      return Math.min(fee, 500); // $5 cap
    }
    return 0;
  }

  /**
   * Check payment method requires verification
   */
  requiresVerification(paymentMethod: Stripe.PaymentMethod): boolean {
    if (paymentMethod.type === 'us_bank_account') {
      const bankAccount = paymentMethod.us_bank_account;
      return bankAccount?.status !== 'verified';
    }
    return false;
  }

  /**
   * Get expected clearance date for payment method
   */
  getExpectedClearanceDate(paymentMethod: Stripe.PaymentMethod): Date {
    const now = new Date();

    if (paymentMethod.type === 'card') {
      // Cards clear immediately
      return now;
    } else if (paymentMethod.type === 'us_bank_account') {
      // ACH takes 3-5 business days
      const daysToAdd = 5;
      const clearanceDate = new Date(now);
      clearanceDate.setDate(clearanceDate.getDate() + daysToAdd);
      return clearanceDate;
    }

    return now;
  }
}

export const stripePaymentService = new StripePaymentService();

