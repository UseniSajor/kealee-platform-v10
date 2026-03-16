/**
 * services/command-center/bots/contractor-match/contractor-match.bot.ts
 *
 * ContractorMatchBot — matches qualified contractors to projects when permits
 * are complete or a project advances to BIDDING phase.
 *
 * Subscribed events:
 *   - project.permits.complete
 *   - project.phase.changed (payload.newPhase === 'BIDDING')
 *   - project.contractor.assignment.requested
 *
 * Actions:
 *   - QUEUE_JOB → bid-engine queue (creates InvitationBatch)
 *   - INTERNAL_ALERT → ops team when no eligible contractors found
 *   - DASHBOARD_METRIC_UPDATE → match_score update
 */

import { createLogger } from '@kealee/observability'
import { getPrisma } from '@kealee/database'
import {
  OperationalBot,
  BotCategory,
  BotEvent,
  BotResult,
  BotAction,
} from '../shared/bot.interface.js'

const logger = createLogger('contractor-match-bot')

// ─── Scoring weights ───────────────────────────────────────────────────────────

const WEIGHTS = {
  tradeMatch:          0.35,
  locationProximity:   0.25,
  capacityAvailable:   0.20,
  performanceRating:   0.15,
  credentialCurrency:  0.05,
} as const

function computeMatchScore(contractor: {
  tradeMatch: boolean
  distanceMiles: number
  hasCapacity: boolean
  avgRating: number
  credentialsValid: boolean
}): number {
  let score = 0
  score += contractor.tradeMatch       ? WEIGHTS.tradeMatch         * 100 : 0
  score += contractor.distanceMiles <= 50
    ? WEIGHTS.locationProximity * 100
    : contractor.distanceMiles <= 100
      ? WEIGHTS.locationProximity * 60
      : 0
  score += contractor.hasCapacity      ? WEIGHTS.capacityAvailable  * 100 : 0
  score += (contractor.avgRating / 5)  * WEIGHTS.performanceRating  * 100
  score += contractor.credentialsValid ? WEIGHTS.credentialCurrency * 100 : 0
  return Math.round(score)
}

// ─── Bot ──────────────────────────────────────────────────────────────────────

export class ContractorMatchBot extends OperationalBot {
  readonly id          = 'contractor-match-bot'
  readonly name        = 'ContractorMatchBot'
  readonly category: BotCategory = 'SUPPLY_CONTRACTOR_OPS'
  readonly description = 'Matches eligible, verified contractors to projects when permits clear or bidding opens.'
  readonly subscribedEvents = [
    'project.permits.complete',
    'project.phase.changed',
    'project.contractor.assignment.requested',
  ]
  readonly requiresHumanApproval = false  // bot creates shortlist; owner selects
  readonly synchronous           = false
  readonly internalOnly          = false  // outputs shown in portal-owner

  async handle(event: BotEvent): Promise<BotResult> {
    const start = Date.now()
    logger.info({ botId: this.id, eventType: event.type }, 'ContractorMatchBot handling event')

    try {
      const projectId = event.payload.projectId as string | undefined
      if (!projectId) {
        return this.makeResult(event.type, [], [], start)
      }

      // Skip phase.changed events unless they're BIDDING phase
      if (
        event.type === 'project.phase.changed' &&
        (event.payload.newPhase as string) !== 'BIDDING'
      ) {
        return this.makeResult(event.type, [], [], start)
      }

      const actions = await this._runMatchAndQueue(projectId, event.type, start)
      return this.makeResult(event.type, actions, [], start)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ botId: this.id, err: msg }, 'ContractorMatchBot error')
      return {
        botId: this.id,
        eventType: event.type,
        actionsTriggered: [],
        recommendationsEmitted: [],
        processingMs: Date.now() - start,
        error: msg,
      }
    }
  }

  // ─── Core matching logic ───────────────────────────────────────────────────

  private async _runMatchAndQueue(
    projectId: string,
    eventType: string,
    start: number,
  ): Promise<BotAction[]> {
    const prisma = getPrisma()
    const actions: BotAction[] = []

    // Load project with required trades and location
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id:             true,
        requiredTrades: true,
        city:           true,
        stateCode:      true,
        latitude:       true,
        longitude:      true,
      },
    })

    if (!project) {
      logger.warn({ projectId }, 'Project not found for matching')
      return actions
    }

    // Find verified contractors in the region with matching trades
    const candidates = await prisma.contractor.findMany({
      where: {
        verified: true,
        active:   true,
        trades: {
          hasSome: (project.requiredTrades ?? []) as string[],
        },
        stateCode: project.stateCode ?? undefined,
      },
      select: {
        id:              true,
        trades:          true,
        avgRating:       true,
        activeProjects:  true,
        maxConcurrent:   true,
        credentialExpiry: true,
        latitude:        true,
        longitude:       true,
      },
      take: 50,
    })

    if (candidates.length === 0) {
      logger.warn({ projectId }, 'No eligible contractors found — emitting ops alert')
      actions.push(
        this.makeAction(
          'INTERNAL_ALERT',
          {
            message: `No eligible contractors found for project ${projectId}`,
            projectId,
            severity: 'HIGH',
          },
          { requiresApproval: false, autoExecute: true },
        ),
      )
      return actions
    }

    // Score each candidate
    const scored = candidates
      .map(c => {
        const distanceMiles = _haversine(
          project.latitude  ?? 0, project.longitude  ?? 0,
          c.latitude        ?? 0, c.longitude        ?? 0,
        )
        const tradeMatch = (c.trades as string[]).some(t =>
          (project.requiredTrades as string[] ?? []).includes(t),
        )
        const score = computeMatchScore({
          tradeMatch,
          distanceMiles,
          hasCapacity: (c.activeProjects ?? 0) < (c.maxConcurrent ?? 5),
          avgRating: Number(c.avgRating ?? 0),
          credentialsValid: !c.credentialExpiry || new Date(c.credentialExpiry) > new Date(),
        })
        return { contractorId: c.id, score }
      })
      .filter(c => c.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    // Queue bid-engine job to create invitation batch
    actions.push(
      this.makeAction(
        'QUEUE_JOB',
        {
          queue:       'BID_ENGINE',
          jobName:     'create_invitation_batch',
          projectId,
          candidates:  scored,
          triggeredBy: eventType,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    )

    // Update dashboard metric
    actions.push(
      this.makeAction(
        'DASHBOARD_METRIC_UPDATE',
        {
          projectId,
          metric: 'match_score',
          value:  scored[0]?.score ?? 0,
          count:  scored.length,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    )

    logger.info(
      { projectId, totalCandidates: candidates.length, shortlisted: scored.length },
      'ContractorMatchBot shortlist created',
    )

    return actions
  }
}

// ─── Haversine distance (km → miles) ─────────────────────────────────────────

function _haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = _toRad(lat2 - lat1)
  const dLon = _toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(_toRad(lat1)) * Math.cos(_toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function _toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
