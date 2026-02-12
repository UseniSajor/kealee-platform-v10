/**
 * Alerting System
 *
 * Centralized alerting for the Command Center.
 * Supports INFO, WARNING, ERROR, CRITICAL levels with multi-channel delivery:
 *   INFO     → log only
 *   WARNING  → in-app notification to admins
 *   ERROR    → in-app + email to admins
 *   CRITICAL → in-app + email + SMS + Slack webhook
 */

// ── Types ────────────────────────────────────────────────────

export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface CreateAlertOptions {
  level: AlertLevel;
  source: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  prisma?: any;
}

export interface AlertQuery {
  level?: AlertLevel | AlertLevel[];
  source?: string;
  acknowledged?: boolean;
  since?: Date;
  limit?: number;
  offset?: number;
}

export interface AlertStats {
  total: number;
  unacknowledged: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
}

// ── Alert Service ────────────────────────────────────────────

class AlertServiceImpl {
  /**
   * Create an alert and deliver it through the appropriate channels.
   */
  async createAlert(opts: CreateAlertOptions): Promise<string | null> {
    const { level, source, title, message, data, prisma } = opts;

    // Always log
    const logFn = level === AlertLevel.CRITICAL || level === AlertLevel.ERROR
      ? console.error
      : level === AlertLevel.WARNING
        ? console.warn
        : console.log;

    logFn(`[Alert:${level}] [${source}] ${title}: ${message}`);

    // Persist to database if prisma is available
    let alertId: string | null = null;
    if (prisma) {
      try {
        const alert = await prisma.alert.create({
          data: { level, source, title, message, data: data ?? {} },
        });
        alertId = alert.id;
      } catch (dbErr) {
        console.error('[AlertService] Failed to persist alert:', dbErr);
      }
    }

    // Deliver based on level (fire-and-forget, don't block the caller)
    this.deliver(level, title, message, source, data).catch((err) => {
      console.error('[AlertService] Delivery failed:', err);
    });

    return alertId;
  }

  /**
   * Acknowledge an alert (marks as handled by an admin).
   */
  async acknowledgeAlert(prisma: any, alertId: string, userId: string): Promise<boolean> {
    try {
      await prisma.alert.update({
        where: { id: alertId },
        data: {
          acknowledged: true,
          acknowledgedBy: userId,
          acknowledgedAt: new Date(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bulk acknowledge all unacknowledged alerts matching criteria.
   */
  async acknowledgeAll(
    prisma: any,
    userId: string,
    filter?: { source?: string; level?: AlertLevel }
  ): Promise<number> {
    const where: any = { acknowledged: false };
    if (filter?.source) where.source = filter.source;
    if (filter?.level) where.level = filter.level;

    const result = await prisma.alert.updateMany({
      where,
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Query alerts for the admin dashboard.
   */
  async getAlerts(prisma: any, query?: AlertQuery): Promise<{ items: any[]; total: number }> {
    const where: any = {};

    if (query?.level) {
      where.level = Array.isArray(query.level) ? { in: query.level } : query.level;
    }
    if (query?.source) where.source = query.source;
    if (query?.acknowledged !== undefined) where.acknowledged = query.acknowledged;
    if (query?.since) where.createdAt = { gte: query.since };

    const [items, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query?.limit ?? 50,
        skip: query?.offset ?? 0,
      }),
      prisma.alert.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Get alert statistics.
   */
  async getAlertStats(prisma: any): Promise<AlertStats> {
    const [total, unacknowledged] = await Promise.all([
      prisma.alert.count(),
      prisma.alert.count({ where: { acknowledged: false } }),
    ]);

    const levelCounts = await prisma.alert.groupBy({
      by: ['level'],
      _count: true,
      where: { acknowledged: false },
    });

    const sourceCounts = await prisma.alert.groupBy({
      by: ['source'],
      _count: true,
      where: { acknowledged: false },
    });

    const byLevel: Record<string, number> = {};
    for (const entry of levelCounts) {
      byLevel[entry.level] = entry._count;
    }

    const bySource: Record<string, number> = {};
    for (const entry of sourceCounts) {
      bySource[entry.source] = entry._count;
    }

    return { total, unacknowledged, byLevel, bySource };
  }

  /**
   * Send a Slack alert via webhook.
   */
  async sendSlackAlert(
    level: AlertLevel,
    title: string,
    message: string,
    source: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[AlertService] SLACK_WEBHOOK_URL not configured — Slack alert skipped');
      return false;
    }

    const color = level === AlertLevel.CRITICAL
      ? '#dc2626' // red
      : level === AlertLevel.ERROR
        ? '#f59e0b' // amber
        : level === AlertLevel.WARNING
          ? '#eab308' // yellow
          : '#22c55e'; // green

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${levelEmoji(level)} ${title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Level:*\n${level}` },
            { type: 'mrkdwn', text: `*Source:*\n${source}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message.substring(0, 2000),
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Kealee Command Center | ${new Date().toISOString()}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
              url: `${process.env.ADMIN_URL || 'https://admin.kealee.com'}/automation/alerts`,
            },
          ],
        },
      ],
      attachments: [{ color, blocks: [] }],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (err) {
      console.error('[AlertService] Slack webhook failed:', err);
      return false;
    }
  }

  /**
   * Run system health checks.
   * Call this on a schedule (e.g., every 5 minutes).
   */
  async checkSystemHealth(prisma: any, redisClient?: any): Promise<void> {
    // 1. Check Redis connection
    if (redisClient) {
      try {
        await redisClient.ping();
      } catch {
        await this.createAlert({
          level: AlertLevel.CRITICAL,
          source: 'system',
          title: 'Redis Connection Down',
          message: 'Unable to reach the Redis server. All queues are affected. Job processing is halted.',
          prisma,
        });
      }
    }

    // 2. Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // Can't persist this alert since DB is down — just log
      console.error('[HealthCheck] CRITICAL: Database connection failed');
      return;
    }

    // 3. Check dead letter queue growth
    try {
      const dlqPending = await prisma.deadLetterLog.count({
        where: { status: 'pending' },
      });

      if (dlqPending > 50) {
        await this.createAlert({
          level: AlertLevel.ERROR,
          source: 'system',
          title: `Dead Letter Queue Growing: ${dlqPending} failed jobs`,
          message: `There are ${dlqPending} unresolved failed jobs in the dead letter queue. Review and retry or discard them.`,
          data: { dlqPending },
          prisma,
        });
      } else if (dlqPending > 20) {
        await this.createAlert({
          level: AlertLevel.WARNING,
          source: 'system',
          title: `Dead Letter Queue: ${dlqPending} pending jobs`,
          message: `${dlqPending} failed jobs are pending review in the dead letter queue.`,
          data: { dlqPending },
          prisma,
        });
      }
    } catch (err) {
      console.error('[HealthCheck] Failed to check DLQ:', err);
    }

    // 4. Check error rates per app (last 15 minutes)
    try {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

      const metrics = await prisma.appHealthMetric.findMany({
        where: {
          period: { gte: fifteenMinAgo },
          jobsTotal: { gt: 0 },
        },
      });

      // Aggregate by app
      const appAgg: Record<string, { total: number; failed: number }> = {};
      for (const m of metrics) {
        if (!appAgg[m.appId]) appAgg[m.appId] = { total: 0, failed: 0 };
        appAgg[m.appId].total += m.jobsTotal;
        appAgg[m.appId].failed += m.jobsFailed;
      }

      for (const [appId, agg] of Object.entries(appAgg)) {
        const errorRate = (agg.failed / agg.total) * 100;

        if (errorRate > 50) {
          await this.createAlert({
            level: AlertLevel.CRITICAL,
            source: appId,
            title: `High Error Rate: ${appId} (${errorRate.toFixed(0)}%)`,
            message: `${appId} has a ${errorRate.toFixed(1)}% error rate in the last 15 minutes (${agg.failed}/${agg.total} jobs failed).`,
            data: { appId, errorRate, failed: agg.failed, total: agg.total },
            prisma,
          });
        } else if (errorRate > 20) {
          await this.createAlert({
            level: AlertLevel.ERROR,
            source: appId,
            title: `Elevated Error Rate: ${appId} (${errorRate.toFixed(0)}%)`,
            message: `${appId} error rate is ${errorRate.toFixed(1)}% in the last 15 minutes (${agg.failed}/${agg.total} jobs).`,
            data: { appId, errorRate, failed: agg.failed, total: agg.total },
            prisma,
          });
        }
      }
    } catch (err) {
      console.error('[HealthCheck] Error rate check failed:', err);
    }

    // 5. Check circuit breaker states
    try {
      const { getAllCircuitStatuses } = await import('./circuit-breaker');
      const statuses = getAllCircuitStatuses();

      for (const status of statuses) {
        if (status.state === 'OPEN') {
          // Only alert if this is a fresh open (within last 5 min)
          const recentAlert = await prisma.alert.findFirst({
            where: {
              source: 'system',
              title: { contains: `Circuit Breaker OPEN: ${status.name}` },
              createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
            },
          });

          if (!recentAlert) {
            await this.createAlert({
              level: AlertLevel.ERROR,
              source: 'system',
              title: `Circuit Breaker OPEN: ${status.name}`,
              message: `The ${status.name} circuit breaker is open. Requests are being fast-failed. Last failure: ${status.lastFailure?.toISOString() ?? 'unknown'}`,
              data: { service: status.name, state: status.state, failures: status.failures },
              prisma,
            });
          }
        }
      }
    } catch (err) {
      console.error('[HealthCheck] Circuit breaker check failed:', err);
    }
  }

  // ── Private Delivery Methods ─────────────────────────────

  private async deliver(
    level: AlertLevel,
    title: string,
    message: string,
    source: string,
    data?: Record<string, any>
  ): Promise<void> {
    switch (level) {
      case AlertLevel.CRITICAL:
        // Slack + Email + SMS (all async, don't block)
        await Promise.allSettled([
          this.sendSlackAlert(level, title, message, source, data),
          this.sendAdminEmail(level, title, message, source),
          this.sendAdminSms(title, message),
        ]);
        break;

      case AlertLevel.ERROR:
        // Email only (Slack optional based on config)
        await Promise.allSettled([
          this.sendAdminEmail(level, title, message, source),
          process.env.SLACK_ALERTS_ON_ERROR === 'true'
            ? this.sendSlackAlert(level, title, message, source, data)
            : Promise.resolve(),
        ]);
        break;

      case AlertLevel.WARNING:
        // In-app only (already persisted to DB)
        break;

      case AlertLevel.INFO:
        // Log only (already logged above)
        break;
    }
  }

  private async sendAdminEmail(
    level: AlertLevel,
    title: string,
    message: string,
    source: string
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (!adminEmail) {
      console.warn('[AlertService] ADMIN_ALERT_EMAIL not set — email alert skipped');
      return;
    }

    // Use Resend directly to avoid circular dependency with email service
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Kealee Alerts <alerts@kealee.com>',
          to: [adminEmail],
          subject: `[${level}] ${title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;">
              <div style="background:${level === 'CRITICAL' ? '#dc2626' : '#f59e0b'};color:#fff;padding:16px;border-radius:8px 8px 0 0;">
                <h1 style="margin:0;font-size:18px;">${levelEmoji(level)} ${title}</h1>
              </div>
              <div style="border:1px solid #e5e7eb;border-top:0;padding:16px;border-radius:0 0 8px 8px;">
                <p><strong>Source:</strong> ${source}</p>
                <p><strong>Level:</strong> ${level}</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;" />
                <p>${message}</p>
                <p style="margin-top:24px;">
                  <a href="${process.env.ADMIN_URL || 'https://admin.kealee.com'}/automation/alerts"
                     style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
                    View in Dashboard
                  </a>
                </p>
              </div>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error('[AlertService] Admin email failed:', err);
    }
  }

  private async sendAdminSms(title: string, message: string): Promise<void> {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;
    const adminPhone = process.env.ADMIN_ALERT_PHONE;

    if (!twilioSid || !twilioToken || !twilioFrom || !adminPhone) {
      console.warn('[AlertService] Twilio not configured — SMS alert skipped');
      return;
    }

    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: adminPhone,
          From: twilioFrom,
          Body: `[KEALEE CRITICAL] ${title}: ${message.substring(0, 140)}`,
        }),
      });
    } catch (err) {
      console.error('[AlertService] Admin SMS failed:', err);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────

function levelEmoji(level: AlertLevel): string {
  switch (level) {
    case AlertLevel.CRITICAL: return '\u{1F6A8}'; // 🚨
    case AlertLevel.ERROR: return '\u{274C}'; // ❌
    case AlertLevel.WARNING: return '\u{26A0}\u{FE0F}'; // ⚠️
    case AlertLevel.INFO: return '\u{2139}\u{FE0F}'; // ℹ️
  }
}

// ── Singleton Export ─────────────────────────────────────────

export const alertService = new AlertServiceImpl();
