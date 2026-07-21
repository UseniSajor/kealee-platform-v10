/**
 * lead-assignment-expiry.job.ts
 *
 * Cron job: runs every 30 minutes.
 * Finds all ProfessionalAssignment rows that are still PENDING past their
 * acceptDeadline, marks them FORFEITED, pushes the professional to the back
 * of the rotation queue, and routes the lead to the next eligible professional.
 *
 * Business rule 4:
 *   "If not accepted within 48 hours → lead is forfeited and professional
 *    moves to back of queue."
 *
 * This job is the only component that resolves the EXPIRED → FORFEITED
 * transition.  The service method processExpiredAssignments() does the actual
 * DB work; this file is the cron wrapper following the existing job pattern
 * (see bid-urgent-check.job.ts for reference).
 */

import { PrismaClient } from '@prisma/client'
import { CronJobResult } from '../types/cron.types'

// We access prismaAny via a local PrismaClient because the worker service does
// not share the API's prisma-helper utility.  The worker initialises its own
// PrismaClient in index.ts; here we create a scoped instance following the
// pattern used by other job files in this directory.
const prisma = new PrismaClient()

/** 48 hours in milliseconds */
const HOURS_48_MS = 48 * 60 * 60 * 1000

/**
 * Maximum assignments to process per cron tick.
 * Prevents the job from running too long if a large backlog builds up.
 * Increase as throughput requires.
 */
const BATCH_SIZE = 100

// NOTE: This job does not enforce the construction-readiness gate directly.
// That check lives in professional-assignment.service.ts → engageContractor().
// See the CONSTRUCTION_READY_PHASES constant and its TODO note there.

export async function executeLeadAssignmentExpiry(): Promise<CronJobResult> {
  const startTime = Date.now()

  const result: CronJobResult = {
    success:     true,
    jobType:     'lead_assignment_expiry',
    executedAt:  new Date(startTime),
  }

  const errors: string[] = []
  let processed = 0
  let forwarded = 0

  try {
    const now = new Date()

    // ── Step 1: Fetch expired PENDING assignments ────────────────────────────
    const expired = await (prisma as any).professionalAssignment.findMany({
      where: {
        status:         'PENDING',
        acceptDeadline: { lt: now },
      },
      take: BATCH_SIZE,
      // Process oldest-expired first so no lead sits without a professional
      orderBy: { acceptDeadline: 'asc' },
    })

    if (expired.length === 0) {
      result.result = { processed: 0, forwarded: 0, errors: [] }
      result.duration = Date.now() - startTime
      return result
    }

    console.log(`[lead-assignment-expiry] Found ${expired.length} expired assignments to process`)

    // ── Step 2: Process each expired assignment ──────────────────────────────
    for (const assignment of expired) {
      try {
        await _processOneExpiredAssignment(assignment, now)
        processed++

        // ── Step 3: Forward lead to next in queue ────────────────────────────
        const routeResult = await _routeToNextInQueue(
          assignment.leadId,
          assignment.profileId,
          assignment.professionalType,
        )

        if (routeResult.forwarded) {
          forwarded++
          console.log(
            `[lead-assignment-expiry] Lead ${assignment.leadId} forwarded to ` +
            `${routeResult.nextProfileId} (${assignment.professionalType})`
          )
        } else {
          console.warn(
            `[lead-assignment-expiry] No next-in-queue for lead ${assignment.leadId} ` +
            `(${assignment.professionalType}): ${routeResult.reason}`
          )
        }
      } catch (err: any) {
        const msg = `Assignment ${assignment.id}: ${err?.message ?? String(err)}`
        errors.push(msg)
        console.error(`[lead-assignment-expiry] ${msg}`)
      }
    }

    result.result   = { processed, forwarded, errors }
    result.success  = errors.length === 0
    result.duration = Date.now() - startTime

    console.log(
      `[lead-assignment-expiry] Done. processed=${processed} forwarded=${forwarded} errors=${errors.length} ` +
      `duration=${result.duration}ms`
    )
  } catch (fatalError: any) {
    result.success  = false
    result.error    = fatalError?.message ?? String(fatalError)
    result.duration = Date.now() - startTime
    console.error('[lead-assignment-expiry] Fatal error:', fatalError)
  } finally {
    await prisma.$disconnect()
  }

  return result
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Transitions one assignment from PENDING → EXPIRED → FORFEITED and
 * stamps the professional's queue entry with lastForwardedAt so they
 * sort to the back of the rotation.
 */
async function _processOneExpiredAssignment(assignment: any, now: Date): Promise<void> {
  // Intermediate EXPIRED state prevents double-processing if the cron fires
  // while we're mid-loop on a large batch
  await (prisma as any).professionalAssignment.update({
    where: { id: assignment.id },
    data:  { status: 'EXPIRED', forwardedAt: now },
  })

  // Push professional to back of queue by stamping lastAssignedAt = now
  // (so they sort after all professionals with older lastAssignedAt values)
  await (prisma as any).rotationQueueEntry.updateMany({
    where: {
      profileId:        assignment.profileId,
      professionalType: assignment.professionalType,
    },
    data: {
      lastForwardedAt: now,
      lastAssignedAt:  now,  // back of queue
      totalForfeited:  { increment: 1 },
    },
  })

  // Final terminal state
  await (prisma as any).professionalAssignment.update({
    where: { id: assignment.id },
    data:  { status: 'FORFEITED' },
  })
}

/**
 * Finds the next ELIGIBLE professional in the rotation queue for a given
 * lead + professionalType, creates a new ProfessionalAssignment, and
 * stamps their queue entry.
 *
 * Returns { forwarded: true, nextProfileId } on success or
 *         { forwarded: false, reason }       when the queue is exhausted.
 */
async function _routeToNextInQueue(
  leadId:           string,
  fromProfileId:    string,
  professionalType: string,
): Promise<{ forwarded: boolean; nextProfileId?: string; reason?: string }> {
  // Collect all profileIds that have already been offered this lead
  const previousOffers = await (prisma as any).professionalAssignment.findMany({
    where:  { leadId },
    select: { profileId: true },
  })
  const excludeIds = previousOffers.map((o: any) => o.profileId)

  // Find next eligible entry (null lastAssignedAt sorts first = front of queue)
  const nextEntry = await (prisma as any).rotationQueueEntry.findFirst({
    where: {
      professionalType,
      eligibility:        'ELIGIBLE',
      softwareAccessOnly: false,
      profileId:          { notIn: excludeIds },
    },
    orderBy: { lastAssignedAt: 'asc' },
  })

  if (!nextEntry) {
    return {
      forwarded: false,
      reason:    `Queue exhausted — no remaining ELIGIBLE ${professionalType} not yet offered lead ${leadId}`,
    }
  }

  const now            = new Date()
  const acceptDeadline = new Date(now.getTime() + HOURS_48_MS)

  // Create next assignment
  await (prisma as any).professionalAssignment.create({
    data: {
      leadId,
      profileId:        nextEntry.profileId,
      professionalType,
      sourceType:       'PLATFORM_SERVICE',
      status:           'PENDING',
      rotationPosition: null, // not tracking position number in worker (cosmetic only)
      assignedAt:       now,
      acceptDeadline,
    },
  })

  // Stamp queue entry
  await (prisma as any).rotationQueueEntry.update({
    where: { id: nextEntry.id },
    data: {
      lastAssignedAt: now,
      totalOffered:   { increment: 1 },
    },
  })

  return { forwarded: true, nextProfileId: nextEntry.profileId }
}
