/**
 * feature-gate.middleware.ts
 *
 * Fastify preHandler middleware for Construction OS feature gating.
 * Blocks access to Phase 2/3 features unless the project has the
 * required OS tier enabled.
 *
 * Usage in a route:
 *   preHandler: [authenticateUser, requireOSFeature('change-orders')]
 *
 * Phase 1 features are always allowed for CONSTRUCTION_READY projects.
 * Phase 2/3 features require the project's ProjectOSAccess record to
 * specify the correct tier.
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { prismaAny } from '../utils/prisma-helper'
import { featuresUpToPhase, OS_FEATURES } from '@kealee/types';

// ── Phase 1 feature slugs (always on) ─────────────────────────────────────────

const PHASE_1_SLUGS = new Set(featuresUpToPhase(1))

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getProjectIdFromRequest(req: FastifyRequest): Promise<string | null> {
  // Try route params first
  const params = req.params as Record<string, string>
  if (params.projectId) return params.projectId

  // Try query string
  const query = req.query as Record<string, string>
  if (query.projectId) return query.projectId

  // Try body
  const body = req.body as Record<string, unknown>
  if (typeof body?.projectId === 'string') return body.projectId

  return null
}

async function getProjectAccess(projectId: string) {
  return prismaAny.projectOSAccess.findUnique({ where: { projectId } })
}

// ── Middleware factory ─────────────────────────────────────────────────────────

/**
 * Returns a Fastify preHandler that gates access to a specific OS feature.
 *
 * @param featureSlug  One of the OS_FEATURES values
 * @param projectIdParam  Optional: name of the route param holding the projectId
 *                        (defaults to auto-detection from params/query/body)
 */
export function requireOSFeature(
  featureSlug: string,
  projectIdParam?: string,
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // Phase 1 features are always allowed — no DB lookup needed
    if (PHASE_1_SLUGS.has(featureSlug as any)) return

    // Resolve projectId
    const params  = req.params as Record<string, string>
    const projectId = projectIdParam
      ? params[projectIdParam]
      : await getProjectIdFromRequest(req)

    if (!projectId) {
      return reply.status(400).send({
        error: 'projectId is required to check OS feature access',
        feature: featureSlug,
      })
    }

    // Look up project access config
    const access = await getProjectAccess(projectId)

    if (!access) {
      // No access record = only Phase 1 features allowed
      return reply.status(403).send({
        error: `Feature '${featureSlug}' is not enabled for this project`,
        feature:    featureSlug,
        resolution: 'Upgrade project tier to PRO or ENTERPRISE to access this feature.',
      })
    }

    // Check explicit disable
    if ((access.disabledSlugs as string[]).includes(featureSlug)) {
      return reply.status(403).send({
        error: `Feature '${featureSlug}' is explicitly disabled for this project`,
        feature: featureSlug,
      })
    }

    // Check explicit enable
    if ((access.enabledSlugs as string[]).includes(featureSlug)) return

    // Look up the feature definition to check phase/tier requirements
    const featureDef = await prismaAny.constructionOSFeature.findUnique({
      where: { slug: featureSlug },
    })

    if (!featureDef || !featureDef.isEnabled) {
      return reply.status(403).send({
        error: `Feature '${featureSlug}' is not available`,
        feature: featureSlug,
      })
    }

    // Check that project phase covers the feature's required phase
    if (access.phase < featureDef.phase) {
      return reply.status(403).send({
        error:      `Feature '${featureSlug}' requires Phase ${featureDef.phase} OS access`,
        feature:    featureSlug,
        required:   { phase: featureDef.phase, tier: featureDef.tier },
        current:    { phase: access.phase, tier: access.tier },
        resolution: `Upgrade this project to Phase ${featureDef.phase} (${featureDef.tier}) OS access.`,
      })
    }

    // Tier check
    const TIER_ORDER = { STANDARD: 1, PRO: 2, ENTERPRISE: 3 }
    if ((TIER_ORDER[access.tier as keyof typeof TIER_ORDER] ?? 0) < (TIER_ORDER[featureDef.tier as keyof typeof TIER_ORDER] ?? 0)) {
      return reply.status(403).send({
        error:      `Feature '${featureSlug}' requires ${featureDef.tier} tier`,
        feature:    featureSlug,
        required:   { tier: featureDef.tier },
        current:    { tier: access.tier },
        resolution: `Upgrade to ${featureDef.tier} tier to access this feature.`,
      })
    }

    // All checks passed
  }
}

/**
 * Middleware that upgrades a project to Phase 1 OS access if no record exists.
 * Place as a preHandler on any PM route to auto-provision.
 *
 * Only creates the record if the project's constructionReadiness = CONSTRUCTION_READY.
 */
export async function autoProvisionOSAccess(req: FastifyRequest, reply: FastifyReply) {
  const projectId = await getProjectIdFromRequest(req)
  if (!projectId) return

  const existing = await prismaAny.projectOSAccess.findUnique({ where: { projectId } })
  if (existing) return

  // Only auto-provision for CONSTRUCTION_READY projects
  const project = await prismaAny.project.findUnique({
    where:  { id: projectId },
    select: { constructionReadiness: true, orgId: true },
  }).catch(() => null)

  if (!project || project.constructionReadiness !== 'CONSTRUCTION_READY') return

  await prismaAny.projectOSAccess.create({
    data: {
      id:            `osa_${Date.now()}`,
      projectId,
      orgId:         project.orgId ?? null,
      phase:         1,
      tier:          'STANDARD',
      enabledSlugs:  [],
      disabledSlugs: [],
    },
  }).catch(() => null)   // silent — don't block the request if this fails
}

/**
 * Admin route: upsert ProjectOSAccess for a project.
 * Called when upgrading a project to Phase 2 or 3.
 */
export async function upsertProjectOSAccess(
  projectId: string,
  opts: { phase: 1 | 2 | 3; tier: 'STANDARD' | 'PRO' | 'ENTERPRISE'; orgId?: string },
): Promise<void> {
  await prismaAny.projectOSAccess.upsert({
    where:  { projectId },
    create: {
      id:            `osa_${Date.now()}`,
      projectId,
      orgId:         opts.orgId ?? null,
      phase:         opts.phase,
      tier:          opts.tier,
      enabledSlugs:  [],
      disabledSlugs: [],
    },
    update: {
      phase: opts.phase,
      tier:  opts.tier,
    },
  })
}
