/**
 * Webhook Service
 * Event-driven webhook system with retry logic
 */

import {createClient} from '@supabase/supabase-js';
import crypto from 'crypto';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  jurisdictionId?: string;
  organizationId?: string;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseCode?: number;
  responseBody?: string;
}

export class WebhookService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Create webhook
   */
  async createWebhook(
    url: string,
    events: string[],
    jurisdictionId?: string,
    organizationId?: string
  ): Promise<Webhook> {
    const secret = crypto.randomBytes(32).toString('hex');

    const {data, error} = await this.supabase
      .from('Webhook')
      .insert({
        url,
        events,
        secret,
        active: true,
        jurisdictionId,
        organizationId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      secret, // Only returned on creation
    } as Webhook;
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(
    event: string,
    payload: any,
    jurisdictionId?: string,
    organizationId?: string
  ): Promise<void> {
    // Find active webhooks for this event
    let query = this.supabase
      .from('Webhook')
      .select('*')
      .eq('active', true)
      .contains('events', [event]);

    if (jurisdictionId) {
      query = query.eq('jurisdictionId', jurisdictionId);
    }
    if (organizationId) {
      query = query.eq('organizationId', organizationId);
    }

    const {data: webhooks} = await query;

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    // Create deliveries for each webhook
    for (const webhook of webhooks) {
      await this.createDelivery(webhook.id, event, payload);
    }
  }

  /**
   * Create webhook delivery
   */
  private async createDelivery(
    webhookId: string,
    event: string,
    payload: any
  ): Promise<void> {
    const {data: webhook} = await this.supabase
      .from('Webhook')
      .select('secret')
      .eq('id', webhookId)
      .single();

    if (!webhook) return;

    // Sign payload
    const signature = this.signPayload(JSON.stringify(payload), webhook.secret);

    const deliveryData = {
      webhookId,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      nextRetryAt: new Date().toISOString(),
    };

    const {error} = await this.supabase.from('WebhookDelivery').insert(deliveryData);

    if (error) {
      console.error('Failed to create webhook delivery:', error);
      return;
    }

    // Process delivery asynchronously
    this.processDelivery(webhookId, event, payload, signature).catch(console.error);
  }

  /**
   * Process webhook delivery
   */
  private async processDelivery(
    webhookId: string,
    event: string,
    payload: any,
    signature: string
  ): Promise<void> {
    const {data: webhook} = await this.supabase
      .from('Webhook')
      .select('url, secret, active')
      .eq('id', webhookId)
      .single();

    if (!webhook || !(webhook as any).active) return;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': Date.now().toString(),
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text();

      // Update delivery status
      await this.supabase
        .from('WebhookDelivery')
        .update({
          status: response.ok ? 'success' : 'failed',
          responseCode: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit size
          lastAttemptAt: new Date().toISOString(),
          attempts: 1,
        })
        .eq('webhookId', webhookId)
        .eq('event', event)
        .eq('status', 'pending');

      // If failed, schedule retry
      if (!response.ok) {
        await this.scheduleRetry(webhookId, event, 1);
      }
    } catch (error: any) {
      console.error('Webhook delivery failed:', error);
      await this.scheduleRetry(webhookId, event, 1);
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  private async scheduleRetry(
    webhookId: string,
    event: string,
    attempt: number
  ): Promise<void> {
    if (attempt >= 5) {
      // Max retries reached
      await this.supabase
        .from('WebhookDelivery')
        .update({
          status: 'failed',
          lastAttemptAt: new Date().toISOString(),
        })
        .eq('webhookId', webhookId)
        .eq('event', event)
        .eq('status', 'pending');
      return;
    }

    // Exponential backoff: 1min, 2min, 4min, 8min, 16min
    const delayMs = Math.pow(2, attempt - 1) * 60 * 1000;
    const nextRetryAt = new Date(Date.now() + delayMs);

    await this.supabase
      .from('WebhookDelivery')
      .update({
        attempts: attempt,
        nextRetryAt: nextRetryAt.toISOString(),
      })
      .eq('webhookId', webhookId)
      .eq('event', event)
      .eq('status', 'pending');

    // Schedule retry
    setTimeout(() => {
      this.retryDelivery(webhookId, event, attempt + 1).catch(console.error);
    }, delayMs);
  }

  /**
   * Retry delivery
   */
  private async retryDelivery(
    webhookId: string,
    event: string,
    attempt: number
  ): Promise<void> {
    const {data: delivery} = await this.supabase
      .from('WebhookDelivery')
      .select('payload')
      .eq('webhookId', webhookId)
      .eq('event', event)
      .eq('status', 'pending')
      .single();

    if (!delivery) return;

    const {data: webhook} = await this.supabase
      .from('Webhook')
      .select('url, secret')
      .eq('id', webhookId)
      .single();

    if (!webhook) return;

    const signature = this.signPayload(JSON.stringify(delivery.payload), webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': Date.now().toString(),
        },
        body: JSON.stringify(delivery.payload),
      });

      const responseBody = await response.text();

      await this.supabase
        .from('WebhookDelivery')
        .update({
          status: response.ok ? 'success' : 'failed',
          responseCode: response.status,
          responseBody: responseBody.substring(0, 1000),
          lastAttemptAt: new Date().toISOString(),
          attempts: attempt,
        })
        .eq('webhookId', webhookId)
        .eq('event', event)
        .eq('status', 'pending');

      if (!response.ok && attempt < 5) {
        await this.scheduleRetry(webhookId, event, attempt + 1);
      }
    } catch (error: any) {
      console.error('Webhook retry failed:', error);
      if (attempt < 5) {
        await this.scheduleRetry(webhookId, event, attempt + 1);
      }
    }
  }

  /**
   * Sign payload with secret
   */
  private signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.signPayload(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const webhookService = new WebhookService();
