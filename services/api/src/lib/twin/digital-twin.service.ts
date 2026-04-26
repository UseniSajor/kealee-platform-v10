/**
 * services/api/src/lib/twin/digital-twin.service.ts
 *
 * Canonical DigitalTwin service — enforces DDTS integrity rules:
 *   1. Every Project MUST have a DigitalTwin (created on project creation)
 *   2. Every ProjectOutput completion MUST update DigitalTwin + create TwinEvent
 *   3. In production (NODE_ENV=production): throw on any integrity violation
 *   4. In development: log warning and continue (non-blocking)
 */

import { prismaAny } from '../../utils/prisma-helper'

const IS_PROD = process.env.NODE_ENV === 'production'

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Ensure a DigitalTwin exists for the given project.
 * - Already exists: returns unchanged.
 * - Missing: creates with INTAKE status.
 * - Production: throws if DB write fails.
 * - Development: logs warn and returns null on failure.
 */
export async function ensureDigitalTwin(
  projectId: string,
  orgId?: string,
): Promise<any> {
  try {
    return await prismaAny.digitalTwin.upsert({
      where:  { projectId },
      update: {}, // no-op if twin already exists
      create: {
        projectId,
        orgId:          orgId ?? 'unknown',
        tier:           'L1',
        status:         'INTAKE',
        healthStatus:   'HEALTHY',
        healthScore:    70,
        currentPhase:   'PRE_CONSTRUCTION',
        phaseHistory:   [],
        enabledModules: [],
        metrics:        {},
        config:         {},
      },
    })
  } catch (err: any) {
    if (IS_PROD) {
      throw new Error(
        `[DigitalTwin] Failed to ensure twin for project ${projectId}: ${err.message}`,
      )
    }
    console.warn(
      `[DigitalTwin] ensureDigitalTwin skipped (dev): project=${projectId} — ${err.message}`,
    )
    return null
  }
}

/**
 * Read the DigitalTwin for a project, including recent events.
 * Returns null on error or if not found (never throws).
 */
export async function readTwinContext(projectId: string): Promise<any | null> {
  try {
    return await prismaAny.digitalTwin.findUnique({
      where:   { projectId },
      include: { events: { take: 5, orderBy: { createdAt: 'desc' } } },
    })
  } catch {
    return null
  }
}

/**
 * Create a TwinEvent on an existing DigitalTwin.
 * Production: throws on DB failure.
 * Development: logs warning and returns.
 */
export async function recordTwinEvent(
  twinId:       string,
  eventType:    string,
  source:       string,
  payload:      Record<string, any>,
  severity?:    string,
  description?: string,
): Promise<void> {
  try {
    await prismaAny.twinEvent.create({
      data: {
        twinId,
        eventType,
        source,
        severity:    severity    ?? 'INFO',
        payload,
        description: description ?? eventType,
      },
    })
  } catch (err: any) {
    if (IS_PROD) {
      throw new Error(
        `[DigitalTwin] recordTwinEvent failed twinId=${twinId}: ${err.message}`,
      )
    }
    console.warn(
      `[DigitalTwin] recordTwinEvent skipped (dev): twinId=${twinId} — ${err.message}`,
    )
  }
}

/**
 * Validate that a project has an existing DigitalTwin.
 * Production: throws if no twin found (integrity violation).
 * Development: returns false with a warning.
 */
export async function validateTwinExists(projectId: string): Promise<boolean> {
  const twin = await prismaAny.digitalTwin
    .findUnique({ where: { projectId }, select: { id: true } })
    .catch(() => null)

  if (!twin) {
    if (IS_PROD) {
      throw new Error(
        `[DigitalTwin] Integrity violation: project ${projectId} has no DigitalTwin`,
      )
    }
    console.warn(
      `[DigitalTwin] No DigitalTwin for project ${projectId} (dev-only, non-fatal)`,
    )
    return false
  }
  return true
}
