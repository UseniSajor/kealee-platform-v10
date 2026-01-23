/**
 * Webhook Idempotency Service
 * Prevents duplicate webhook processing and handles retries
 */

import { prisma } from '@kealee/database';
import { Redis } from 'ioredis';

// Redis client for fast idempotency checks
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface WebhookEvent {
  id: string;
  type: string;
  payload: Record<string, any>;
  source: 'stripe' | 'docusign' | 'internal';
  receivedAt: Date;
}

export interface WebhookProcessingResult {
  success: boolean;
  processed: boolean;
  duplicate: boolean;
  error?: string;
  retryCount?: number;
}

/**
 * Webhook Idempotency Service
 */
export class WebhookIdempotencyService {
  private readonly IDEMPOTENCY_TTL = 86400; // 24 hours in seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 60s

  /**
   * Check if webhook has already been processed
   */
  async isProcessed(webhookId: string): Promise<boolean> {
    // Check Redis first (fast)
    const redisKey = `webhook:processed:${webhookId}`;
    const cached = await redis.get(redisKey);
    if (cached) {
      return true;
    }

    // Check database (fallback)
    const record = await prisma.webhookLog.findUnique({
      where: { webhookId },
      select: { status: true },
    });

    return record?.status === 'PROCESSED';
  }

  /**
   * Mark webhook as processed
   */
  async markProcessed(webhookId: string, result: Record<string, any>): Promise<void> {
    // Store in Redis for fast lookups
    const redisKey = `webhook:processed:${webhookId}`;
    await redis.setex(redisKey, this.IDEMPOTENCY_TTL, JSON.stringify(result));

    // Store in database for audit
    await prisma.webhookLog.upsert({
      where: { webhookId },
      update: {
        status: 'PROCESSED',
        processedAt: new Date(),
        result,
      },
      create: {
        webhookId,
        status: 'PROCESSED',
        processedAt: new Date(),
        result,
      },
    });
  }

  /**
   * Mark webhook as failed
   */
  async markFailed(
    webhookId: string,
    error: string,
    retryCount: number = 0
  ): Promise<void> {
    await prisma.webhookLog.upsert({
      where: { webhookId },
      update: {
        status: 'FAILED',
        error,
        retryCount,
        lastAttemptAt: new Date(),
      },
      create: {
        webhookId,
        status: 'FAILED',
        error,
        retryCount,
        lastAttemptAt: new Date(),
      },
    });
  }

  /**
   * Process webhook with idempotency and retry logic
   */
  async processWebhook(
    event: WebhookEvent,
    handler: (event: WebhookEvent) => Promise<void>
  ): Promise<WebhookProcessingResult> {
    try {
      // Check if already processed
      const alreadyProcessed = await this.isProcessed(event.id);
      if (alreadyProcessed) {
        console.log(`[Webhook] Duplicate webhook ignored: ${event.id}`);
        return {
          success: true,
          processed: false,
          duplicate: true,
        };
      }

      // Get retry count
      const log = await prisma.webhookLog.findUnique({
        where: { webhookId: event.id },
        select: { retryCount: true },
      });
      const retryCount = log?.retryCount || 0;

      // Check if max retries exceeded
      if (retryCount >= this.MAX_RETRIES) {
        console.error(
          `[Webhook] Max retries exceeded for webhook: ${event.id}`
        );
        await this.markFailed(event.id, 'Max retries exceeded', retryCount);
        return {
          success: false,
          processed: false,
          duplicate: false,
          error: 'Max retries exceeded',
          retryCount,
        };
      }

      // Process webhook
      await handler(event);

      // Mark as successfully processed
      await this.markProcessed(event.id, {
        type: event.type,
        source: event.source,
        processedAt: new Date(),
      });

      console.log(`[Webhook] Successfully processed: ${event.id}`);

      return {
        success: true,
        processed: true,
        duplicate: false,
        retryCount,
      };
    } catch (error: any) {
      console.error(`[Webhook] Processing failed: ${event.id}`, error);

      // Get current retry count
      const log = await prisma.webhookLog.findUnique({
        where: { webhookId: event.id },
        select: { retryCount: true },
      });
      const retryCount = (log?.retryCount || 0) + 1;

      // Mark as failed
      await this.markFailed(event.id, error.message, retryCount);

      // Schedule retry if not exceeded max
      if (retryCount < this.MAX_RETRIES) {
        await this.scheduleRetry(event, retryCount);
      }

      return {
        success: false,
        processed: false,
        duplicate: false,
        error: error.message,
        retryCount,
      };
    }
  }

  /**
   * Schedule webhook retry
   */
  private async scheduleRetry(event: WebhookEvent, retryCount: number): Promise<void> {
    const delay = this.RETRY_DELAYS[retryCount - 1] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];

    console.log(
      `[Webhook] Scheduling retry #${retryCount} for ${event.id} in ${delay}ms`
    );

    // Store retry job in database
    await prisma.webhookRetry.create({
      data: {
        webhookId: event.id,
        retryCount,
        scheduledFor: new Date(Date.now() + delay),
        payload: event.payload,
        status: 'PENDING',
      },
    });

    // In production, use a job queue like BullMQ to process retries
    // For now, we'll use setTimeout (not recommended for production)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        console.log(`[Webhook] Retrying webhook ${event.id} (attempt ${retryCount})`);
        // Retry logic would go here
      }, delay);
    }
  }

  /**
   * Get webhook processing history
   */
  async getWebhookHistory(webhookId: string) {
    const log = await prisma.webhookLog.findUnique({
      where: { webhookId },
      include: {
        retries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return log;
  }

  /**
   * Get pending retries
   */
  async getPendingRetries() {
    const now = new Date();

    const pendingRetries = await prisma.webhookRetry.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: now,
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      take: 100,
    });

    return pendingRetries;
  }

  /**
   * Process pending retries (call this from a cron job)
   */
  async processRetries(): Promise<void> {
    const retries = await this.getPendingRetries();

    console.log(`[Webhook] Processing ${retries.length} pending retries`);

    for (const retry of retries) {
      try {
        // Mark as processing
        await prisma.webhookRetry.update({
          where: { id: retry.id },
          data: { status: 'PROCESSING' },
        });

        const event: WebhookEvent = {
          id: retry.webhookId,
          type: (retry.payload as any).type || 'unknown',
          payload: retry.payload as Record<string, any>,
          source: (retry.payload as any).source || 'stripe',
          receivedAt: new Date(),
        };

        // Process the webhook
        // Note: You'll need to pass the appropriate handler based on event type
        // await this.processWebhook(event, handler);

        // Mark retry as completed
        await prisma.webhookRetry.update({
          where: { id: retry.id },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      } catch (error: any) {
        console.error(`[Webhook] Retry failed for ${retry.webhookId}:`, error);

        // Mark retry as failed
        await prisma.webhookRetry.update({
          where: { id: retry.id },
          data: { 
            status: 'FAILED',
            error: error.message,
          },
        });
      }
    }
  }

  /**
   * Clean up old webhook logs (call this from a cron job)
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.webhookLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: 'PROCESSED',
      },
    });

    console.log(`[Webhook] Cleaned up ${deleted.count} old webhook logs`);

    return deleted.count;
  }
}

// Export singleton instance
export const webhookIdempotencyService = new WebhookIdempotencyService();
