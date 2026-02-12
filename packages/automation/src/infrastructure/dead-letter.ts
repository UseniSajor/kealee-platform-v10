/**
 * Dead Letter Queue
 *
 * Manages jobs that have exhausted all retry attempts.
 * Provides persistence, pattern detection, retry, and discard capabilities.
 */

import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────

export interface DeadLetterEntry {
  originalQueue: string;
  jobId: string;
  jobName: string;
  data: any;
  error: string;
  attempts: number;
  appId: string;
  prisma?: any;
}

export interface DeadLetterQuery {
  appId?: string;
  status?: 'pending' | 'retried' | 'discarded';
  since?: Date;
  limit?: number;
  offset?: number;
}

export interface DeadLetterStats {
  total: number;
  pending: number;
  retried: number;
  discarded: number;
  byApp: Record<string, number>;
}

// ── Error Pattern Hashing ────────────────────────────────────

function errorPatternHash(appId: string, error: string): string {
  // Normalize error: strip specific IDs, timestamps, UUIDs
  const normalized = error
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<TIMESTAMP>')
    .replace(/\d+/g, '<N>')
    .substring(0, 200);

  const hash = crypto.createHash('sha256').update(`${appId}:${normalized}`).digest('hex').substring(0, 16);
  return hash;
}

// ── Core Functions ───────────────────────────────────────────

/**
 * Move a failed job to the dead letter log.
 */
export async function moveToDeadLetter(entry: DeadLetterEntry): Promise<string | null> {
  const { originalQueue, jobId, jobName, data, error, attempts, appId, prisma } = entry;

  console.warn(
    `[DeadLetter] Job moved to dead letter: ${appId} ${jobName} ${jobId} (${attempts} attempts)`
  );

  if (!prisma) {
    console.error('[DeadLetter] No prisma client — cannot persist dead letter log');
    return null;
  }

  try {
    const pattern = errorPatternHash(appId, error);

    const record = await prisma.deadLetterLog.create({
      data: {
        originalQueue,
        jobId,
        jobName,
        appId,
        data: data ?? {},
        error,
        attempts,
        pattern,
        status: 'pending',
      },
    });

    // Check for error patterns (same pattern in last hour)
    await detectErrorPattern(prisma, appId, pattern, error);

    return record.id;
  } catch (dbErr) {
    console.error('[DeadLetter] Failed to persist dead letter:', dbErr);
    return null;
  }
}

/**
 * Detect recurring error patterns and escalate if needed.
 */
async function detectErrorPattern(
  prisma: any,
  appId: string,
  pattern: string,
  error: string
): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const patternCount = await prisma.deadLetterLog.count({
      where: {
        appId,
        pattern,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (patternCount >= 3) {
      // Import alertService lazily to avoid circular deps
      const { alertService, AlertLevel } = await import('./alerting');

      await alertService.createAlert({
        level: AlertLevel.CRITICAL,
        source: appId,
        title: `Recurring Failure Pattern in ${appId}`,
        message: `${patternCount} jobs have failed with the same error pattern in the last hour: ${error.substring(0, 200)}`,
        data: { pattern, count: patternCount, appId },
        prisma,
      });
    }
  } catch (err) {
    console.error('[DeadLetter] Pattern detection failed:', err);
  }
}

/**
 * Query dead letter jobs for the admin dashboard.
 */
export async function getDeadLetterJobs(
  prisma: any,
  query?: DeadLetterQuery
): Promise<{ items: any[]; total: number }> {
  const where: any = {};

  if (query?.appId) where.appId = query.appId;
  if (query?.status) where.status = query.status;
  if (query?.since) where.createdAt = { gte: query.since };

  const [items, total] = await Promise.all([
    prisma.deadLetterLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.limit ?? 50,
      skip: query?.offset ?? 0,
    }),
    prisma.deadLetterLog.count({ where }),
  ]);

  return { items, total };
}

/**
 * Get dead letter statistics.
 */
export async function getDeadLetterStats(prisma: any): Promise<DeadLetterStats> {
  const [total, pending, retried, discarded] = await Promise.all([
    prisma.deadLetterLog.count(),
    prisma.deadLetterLog.count({ where: { status: 'pending' } }),
    prisma.deadLetterLog.count({ where: { status: 'retried' } }),
    prisma.deadLetterLog.count({ where: { status: 'discarded' } }),
  ]);

  // Get counts by app
  const appCounts = await prisma.deadLetterLog.groupBy({
    by: ['appId'],
    _count: true,
    where: { status: 'pending' },
  });

  const byApp: Record<string, number> = {};
  for (const entry of appCounts) {
    byApp[entry.appId] = entry._count;
  }

  return { total, pending, retried, discarded, byApp };
}

/**
 * Retry a dead letter job by re-adding it to its original queue.
 *
 * @param addJobFn - Caller provides the function to re-enqueue (avoids coupling to BullMQ here)
 */
export async function retryDeadLetter(
  prisma: any,
  deadLetterId: string,
  addJobFn: (queue: string, name: string, data: any) => Promise<void>
): Promise<boolean> {
  const record = await prisma.deadLetterLog.findUnique({
    where: { id: deadLetterId },
  });

  if (!record || record.status !== 'pending') {
    return false;
  }

  // Re-enqueue the job
  await addJobFn(record.originalQueue, record.jobName, record.data);

  // Mark as retried
  await prisma.deadLetterLog.update({
    where: { id: deadLetterId },
    data: {
      status: 'retried',
      retriedAt: new Date(),
    },
  });

  console.log(`[DeadLetter] Retried: ${deadLetterId} → ${record.originalQueue}`);
  return true;
}

/**
 * Discard a dead letter job (mark as not-worth-retrying).
 */
export async function discardDeadLetter(
  prisma: any,
  deadLetterId: string,
  reason: string
): Promise<boolean> {
  const record = await prisma.deadLetterLog.findUnique({
    where: { id: deadLetterId },
  });

  if (!record || record.status !== 'pending') {
    return false;
  }

  await prisma.deadLetterLog.update({
    where: { id: deadLetterId },
    data: {
      status: 'discarded',
      discardedAt: new Date(),
      discardReason: reason,
    },
  });

  console.log(`[DeadLetter] Discarded: ${deadLetterId} — ${reason}`);
  return true;
}

/**
 * Bulk retry all pending dead letter jobs for a specific app.
 */
export async function retryAllForApp(
  prisma: any,
  appId: string,
  addJobFn: (queue: string, name: string, data: any) => Promise<void>
): Promise<number> {
  const records = await prisma.deadLetterLog.findMany({
    where: { appId, status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });

  let retried = 0;
  for (const record of records) {
    try {
      await addJobFn(record.originalQueue, record.jobName, record.data);
      await prisma.deadLetterLog.update({
        where: { id: record.id },
        data: { status: 'retried', retriedAt: new Date() },
      });
      retried++;
    } catch (err) {
      console.error(`[DeadLetter] Failed to retry ${record.id}:`, err);
    }
  }

  console.log(`[DeadLetter] Bulk retried ${retried}/${records.length} jobs for ${appId}`);
  return retried;
}
