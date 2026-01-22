/**
 * Stripe Webhook Security Service
 * Handles webhook signature verification and replay attack prevention
 */

import Stripe from 'stripe';
import { FastifyRequest } from 'fastify';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: Stripe.Event;
  error?: string;
}

export class StripeWebhookSecurityService {
  private processedEvents: Set<string> = new Set();
  private readonly REPLAY_WINDOW_SECONDS = 300; // 5 minutes

  /**
   * Verify Stripe webhook signature
   * Prevents forged webhook events
   */
  async verifyWebhookSignature(
    request: FastifyRequest
  ): Promise<WebhookVerificationResult> {
    try {
      const signature = request.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature) {
        return {
          isValid: false,
          error: 'Missing stripe-signature header',
        };
      }

      if (!webhookSecret) {
        return {
          isValid: false,
          error: 'STRIPE_WEBHOOK_SECRET not configured',
        };
      }

      // Get raw body (required for signature verification)
      const rawBody = (request as any).rawBody;
      if (!rawBody) {
        return {
          isValid: false,
          error: 'Raw body not available. Ensure rawBody plugin is configured.',
        };
      }

      // Verify signature
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature as string,
          webhookSecret
        );
      } catch (err: any) {
        return {
          isValid: false,
          error: `Webhook signature verification failed: ${err.message}`,
        };
      }

      // Check for replay attacks
      const replayCheckResult = this.checkReplayAttack(event);
      if (!replayCheckResult.isValid) {
        return replayCheckResult;
      }

      // Mark event as processed
      this.markEventProcessed(event.id);

      return {
        isValid: true,
        event,
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: `Webhook verification error: ${error.message}`,
      };
    }
  }

  /**
   * Check for replay attacks
   * Prevents duplicate webhook processing
   */
  private checkReplayAttack(event: Stripe.Event): WebhookVerificationResult {
    // Check if event was already processed
    if (this.processedEvents.has(event.id)) {
      return {
        isValid: false,
        error: `Duplicate event: ${event.id} already processed`,
      };
    }

    // Check event timestamp (prevent old events)
    const eventAge = Date.now() / 1000 - event.created;
    if (eventAge > this.REPLAY_WINDOW_SECONDS) {
      return {
        isValid: false,
        error: `Event too old: ${eventAge}s (max: ${this.REPLAY_WINDOW_SECONDS}s)`,
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Mark event as processed
   * Store in memory (in production, use Redis for distributed systems)
   */
  private markEventProcessed(eventId: string): void {
    this.processedEvents.add(eventId);

    // Clean up old events after 1 hour
    setTimeout(() => {
      this.processedEvents.delete(eventId);
    }, 3600000);
  }

  /**
   * Validate webhook event type
   * Ensures only expected events are processed
   */
  validateEventType(event: Stripe.Event, allowedTypes: string[]): boolean {
    return allowedTypes.includes(event.type);
  }

  /**
   * Extract metadata safely
   */
  extractMetadata(event: Stripe.Event): Record<string, any> {
    const data = event.data.object as any;
    return data.metadata || {};
  }

  /**
   * Log webhook event for audit
   */
  async logWebhookEvent(event: Stripe.Event, status: 'SUCCESS' | 'FAILED', error?: string) {
    // TODO: Integrate with audit service
    console.log({
      eventId: event.id,
      eventType: event.type,
      status,
      error,
      timestamp: new Date(event.created * 1000),
    });
  }
}

export const stripeWebhookSecurityService = new StripeWebhookSecurityService();

