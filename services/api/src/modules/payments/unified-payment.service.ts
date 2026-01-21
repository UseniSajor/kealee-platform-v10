/**
 * Unified Payment Service
 * Consolidates all payment operations into a single service
 * Supports idempotency keys for safe retries
 */

import { prismaAny } from '../../utils/prisma-helper'
import { getStripe } from '../billing/stripe.client'
import { milestonePaymentService } from './milestone-payment.service'
import { paymentService } from './payment.service'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
import { eventService } from '../events/event.service'
import { auditService } from '../audit/audit.service'
import { v4 as uuidv4 } from 'uuid'

// Idempotency key storage (in-memory cache, can be moved to Redis in production)
const idempotencyCache = new Map<string, { result: any; expiresAt: number }>()
const IDEMPOTENCY_KEY_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface IdempotencyResult<T> {
  isDuplicate: boolean
  result?: T
}

class UnifiedPaymentService {
  /**
   * Check idempotency key and return cached result if exists
   */
  private async checkIdempotencyKey<T>(
    idempotencyKey: string,
    operation: string
  ): Promise<IdempotencyResult<T> | null> {
    // Check in-memory cache
    const cached = idempotencyCache.get(`${operation}:${idempotencyKey}`)
    if (cached && cached.expiresAt > Date.now()) {
      return { isDuplicate: true, result: cached.result }
    }

    // Check database (if IdempotencyKey model exists)
    try {
      const existing = await prismaAny.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      })

      if (existing && existing.operation === operation) {
        // Cache the result
        idempotencyCache.set(`${operation}:${idempotencyKey}`, {
          result: existing.response as T,
          expiresAt: Date.now() + IDEMPOTENCY_KEY_TTL,
        })
        return { isDuplicate: true, result: existing.response as T }
      }
    } catch (error: any) {
      // If model doesn't exist, continue without database check
      if (!error.message?.includes('model')) {
        throw error
      }
    }

    return null
  }

  /**
   * Store idempotency key result
   */
  private async storeIdempotencyKey<T>(
    idempotencyKey: string,
    operation: string,
    result: T
  ): Promise<void> {
    // Store in cache
    idempotencyCache.set(`${operation}:${idempotencyKey}`, {
      result,
      expiresAt: Date.now() + IDEMPOTENCY_KEY_TTL,
    })

    // Store in database (if IdempotencyKey model exists)
    try {
      await prismaAny.idempotencyKey.upsert({
        where: { key: idempotencyKey },
        create: {
          key: idempotencyKey,
          operation,
          response: result as any,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_KEY_TTL),
        },
        update: {
          response: result as any,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_KEY_TTL),
        },
      })
    } catch (error: any) {
      // If model doesn't exist, just log
      if (error.message?.includes('model')) {
        console.warn('IdempotencyKey model not found, using in-memory cache only')
      } else {
        throw error
      }
    }
  }

  /**
   * Process payment with idempotency support
   */
  async processPayment(
    data: {
      type: 'milestone' | 'subscription' | 'invoice' | 'one_time'
      amount: number
      currency?: string
      metadata: Record<string, any>
      userId: string
      idempotencyKey?: string
    }
  ) {
    const idempotencyKey = data.idempotencyKey || `payment_${uuidv4()}`
    const operation = `process_payment:${data.type}:${idempotencyKey}`

    // Check idempotency
    const cached = await this.checkIdempotencyKey(idempotencyKey, operation)
    if (cached?.isDuplicate) {
      return cached.result
    }

    let result: any

    switch (data.type) {
      case 'milestone':
        if (!data.metadata.milestoneId) {
          throw new ValidationError('milestoneId is required for milestone payments')
        }
        result = await milestonePaymentService.releaseMilestonePayment(
          data.metadata.milestoneId,
          data.userId,
          {
            skipHoldback: data.metadata.skipHoldback,
            notes: data.metadata.notes,
          }
        )
        break

      case 'subscription':
        // Subscription payments handled by Stripe webhooks
        throw new ValidationError('Subscription payments are handled automatically via webhooks')

      case 'invoice':
        result = await paymentService.generateInvoice({
          orgId: data.metadata.orgId,
          subscriptionId: data.metadata.subscriptionId,
          amount: data.amount,
          currency: data.currency || 'usd',
          description: data.metadata.description,
          lineItems: data.metadata.lineItems || [],
          dueDate: data.metadata.dueDate ? new Date(data.metadata.dueDate) : undefined,
          metadata: data.metadata,
        })
        break

      case 'one_time': {
        // Create one-time payment intent
        const stripe = getStripe()
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(data.amount * 100),
          currency: data.currency || 'usd',
          metadata: {
            ...data.metadata,
            type: 'one_time',
            userId: data.userId,
          },
          // Note: idempotency_key is not a direct param, use headers instead
          // idempotency_key: idempotencyKey,
        })
        result = {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
        }
        break
      }

      default:
        throw new ValidationError(`Unknown payment type: ${data.type}`)
    }

    // Store result for idempotency
    await this.storeIdempotencyKey(idempotencyKey, operation, result)

    return { ...result, idempotencyKey }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string, userId: string) {
    // Try to find by payment intent ID
    const payment = await prismaAny.payment.findFirst({
      where: { stripePaymentIntentId: paymentId },
    })

    if (payment) {
      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        metadata: payment.metadata,
      }
    }

    // Try milestone payment service
    try {
      return await milestonePaymentService.getPaymentDetails(paymentId, userId)
    } catch (error) {
      // Not found
      throw new NotFoundError('Payment', paymentId)
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    userId: string,
    options?: {
      amount?: number
      reason?: string
      idempotencyKey?: string
    }
  ) {
    const idempotencyKey = options?.idempotencyKey || `refund_${uuidv4()}`
    const operation = `refund_payment:${idempotencyKey}`

    // Check idempotency
    const cached = await this.checkIdempotencyKey(idempotencyKey, operation)
    if (cached?.isDuplicate) {
      return cached.result
    }

    // Get payment
    const payment = await prismaAny.payment.findFirst({
      where: { stripePaymentIntentId: paymentId },
    })

    if (!payment) {
      throw new NotFoundError('Payment', paymentId)
    }

    // Use milestone payment service for refunds
    const result = await milestonePaymentService.processRefund(paymentId, userId, options)

    // Store result
    await this.storeIdempotencyKey(idempotencyKey, operation, result)

    return { ...result, idempotencyKey }
  }
}

export const unifiedPaymentService = new UnifiedPaymentService()
