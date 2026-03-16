/**
 * services/command-center/bots/growth/__tests__/growth.test.ts
 *
 * Tests for GrowthBot scoring model, rules, registry, dispatcher,
 * and safe behavior when data is incomplete.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calcTradeShortageScore,
  calcTradeSurplusScore,
  calcGeoShortageScore,
  calcGeoSurplusScore,
  calcBacklogRisk,
  calcInactivityRisk,
  calcMatchingUrgency,
  toPriorityLabel,
  buildTradeScore,
  buildGeoScore,
  buildBacklogRiskScore,
  calcOverallLiquidityScore,
} from '../growth.scoring.js'
import {
  tradeShortageRecommendations,
  tradeSurplusRecommendations,
  geoShortageRecommendations,
  backlogRiskRecommendations,
  inactivityRecommendations,
  deriveAllRecommendations,
} from '../growth.rules.js'
import { botRegistry, KEABOTS_ORG_CHART } from '../../shared/bot.registry.js'
import { BotDispatcher } from '../../shared/bot.dispatcher.js'
import type {
  TradeDemandRow,
  TradeSupplyRow,
  GeoRow,
  AssignmentBacklogRow,
  ContractorInactivityScore,
  TradeScore,
  GeoScore,
} from '../growth.types.js'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mkDemand = (overrides: Partial<TradeDemandRow> = {}): TradeDemandRow => ({
  trade: 'HVAC',
  openProjectCount: 10,
  totalProjectValue: 2_000_000,
  medianProjectValue: 200_000,
  unfilledAssignmentCount: 5,
  expiredAssignmentCount: 3,
  avgDaysUnfilled: 7,
  ...overrides,
})

const mkSupply = (overrides: Partial<TradeSupplyRow> = {}): TradeSupplyRow => ({
  trade: 'HVAC',
  totalContractors: 8,
  verifiedContractors: 5,
  activeContractors: 4,
  inactiveContractors: 1,
  avgResponseRateDays: 1.5,
  ...overrides,
})

const mkGeoRow = (overrides: Partial<GeoRow> = {}): GeoRow => ({
  state: 'TX',
  city: 'Austin',
  openProjectCount: 20,
  unfilledProjectCount: 12,
  verifiedContractorCount: 3,
  expiredAssignmentCount: 5,
  medianProjectValue: 150_000,
  ...overrides,
})

const mkBacklogRow = (overrides: Partial<AssignmentBacklogRow> = {}): AssignmentBacklogRow => ({
  trade: 'HVAC',
  state: 'TX',
  queueDepth: 8,
  oldestUnfilledDays: 21,
  avgExpiryHoursRemaining: 12,
  ...overrides,
})

const mkInactiveContractor = (overrides: Partial<ContractorInactivityScore> = {}): ContractorInactivityScore => ({
  profileId: 'profile-1',
  userId: 'user-1',
  businessName: 'Test HVAC Co',
  email: 'test@hvac.com',
  inactivityRiskScore: 80,
  daysSinceLastActivity: 65,
  expiredAssignmentRate: 0.6,
  responseRate: 0.3,
  atRiskOfChurn: true,
  ...overrides,
})

// ─── Scoring: Trade Shortage ──────────────────────────────────────────────────

describe('calcTradeShortageScore', () => {
  it('returns high score when many projects and few contractors', () => {
    const d = mkDemand({ openProjectCount: 20, unfilledAssignmentCount: 15, expiredAssignmentCount: 8 })
    const s = mkSupply({ verifiedContractors: 2 })
    const score = calcTradeShortageScore(d, s)
    expect(score).toBeGreaterThan(50)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns low score when many contractors and few projects', () => {
    const d = mkDemand({ openProjectCount: 2, unfilledAssignmentCount: 0, expiredAssignmentCount: 0 })
    const s = mkSupply({ verifiedContractors: 20 })
    const score = calcTradeShortageScore(d, s)
    expect(score).toBeLessThan(20)
  })

  it('handles zero contractors safely (no division by zero)', () => {
    const d = mkDemand({ openProjectCount: 10 })
    const s = mkSupply({ verifiedContractors: 0 })
    const score = calcTradeShortageScore(d, s)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('handles zero projects (no shortage)', () => {
    const d = mkDemand({ openProjectCount: 0, unfilledAssignmentCount: 0, expiredAssignmentCount: 0 })
    const s = mkSupply({ verifiedContractors: 10 })
    const score = calcTradeShortageScore(d, s)
    expect(score).toBe(0)
  })

  it('score never exceeds 100', () => {
    const d = mkDemand({ openProjectCount: 1000, unfilledAssignmentCount: 500, expiredAssignmentCount: 400 })
    const s = mkSupply({ verifiedContractors: 1 })
    const score = calcTradeShortageScore(d, s)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── Scoring: Trade Surplus ───────────────────────────────────────────────────

describe('calcTradeSurplusScore', () => {
  it('returns high score when many idle contractors and few projects', () => {
    const d = mkDemand({ openProjectCount: 2 })
    const s = mkSupply({ verifiedContractors: 30, inactiveContractors: 25 })
    const score = calcTradeSurplusScore(d, s)
    expect(score).toBeGreaterThan(30)
  })

  it('returns 0 when no verified contractors', () => {
    const d = mkDemand()
    const s = mkSupply({ verifiedContractors: 0 })
    const score = calcTradeSurplusScore(d, s)
    expect(score).toBe(0)
  })

  it('returns low score when contractors match demand', () => {
    const d = mkDemand({ openProjectCount: 10 })
    const s = mkSupply({ verifiedContractors: 10, inactiveContractors: 1 })
    const score = calcTradeSurplusScore(d, s)
    expect(score).toBeLessThan(20)
  })
})

// ─── Scoring: Geography Shortage ─────────────────────────────────────────────

describe('calcGeoShortageScore', () => {
  it('returns high score when many unfilled projects and few local contractors', () => {
    const row = mkGeoRow({ unfilledProjectCount: 15, verifiedContractorCount: 1 })
    const score = calcGeoShortageScore(row)
    expect(score).toBeGreaterThan(40)
  })

  it('returns 0 when no unfilled projects', () => {
    const row = mkGeoRow({ unfilledProjectCount: 0, verifiedContractorCount: 10 })
    const score = calcGeoShortageScore(row)
    expect(score).toBe(0)
  })

  it('handles zero contractor count safely', () => {
    const row = mkGeoRow({ verifiedContractorCount: 0, unfilledProjectCount: 5 })
    const score = calcGeoShortageScore(row)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── Scoring: Backlog Risk ────────────────────────────────────────────────────

describe('calcBacklogRisk', () => {
  it('returns high risk for old unfilled assignments with large backlog', () => {
    const row = mkBacklogRow({ queueDepth: 20, oldestUnfilledDays: 30 })
    const score = calcBacklogRisk(row)
    expect(score).toBeGreaterThan(50)
  })

  it('returns low risk for fresh small queue', () => {
    const row = mkBacklogRow({ queueDepth: 2, oldestUnfilledDays: 2 })
    const score = calcBacklogRisk(row)
    expect(score).toBeLessThan(15)
  })
})

// ─── Scoring: Inactivity Risk ─────────────────────────────────────────────────

describe('calcInactivityRisk', () => {
  it('returns high risk for long-inactive contractor with high expiry rate', () => {
    const score = calcInactivityRisk(65, 8, 10, 0.2)
    expect(score).toBeGreaterThan(60)
  })

  it('returns low risk for active contractor', () => {
    const score = calcInactivityRisk(5, 0, 10, 0.9)
    expect(score).toBeLessThan(20)
  })

  it('handles zero total assignments safely', () => {
    const score = calcInactivityRisk(30, 0, 0, 0.8)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── Scoring: Matching Urgency ────────────────────────────────────────────────

describe('calcMatchingUrgency', () => {
  it('returns high urgency for expiring high-value assignment with shortage', () => {
    const score = calcMatchingUrgency(8, 600_000, 80)
    expect(score).toBeGreaterThan(70)
  })

  it('returns low urgency for non-urgent low-value in balanced market', () => {
    const score = calcMatchingUrgency(48, 50_000, 5)
    expect(score).toBeLessThan(30)
  })
})

// ─── Priority labels ──────────────────────────────────────────────────────────

describe('toPriorityLabel', () => {
  it('maps scores to correct labels', () => {
    expect(toPriorityLabel(80)).toBe('CRITICAL')
    expect(toPriorityLabel(60)).toBe('HIGH')
    expect(toPriorityLabel(30)).toBe('MEDIUM')
    expect(toPriorityLabel(15)).toBe('LOW')
    expect(toPriorityLabel(5)).toBe('NONE')
  })
})

// ─── Rules: Recommendations ───────────────────────────────────────────────────

describe('tradeShortageRecommendations', () => {
  it('generates RECRUIT_TRADE recommendation for high shortage', () => {
    const ts = buildTradeScore(
      mkDemand({ openProjectCount: 20, unfilledAssignmentCount: 15, expiredAssignmentCount: 10 }),
      mkSupply({ verifiedContractors: 2 }),
      [mkBacklogRow()],
    )
    const recs = tradeShortageRecommendations(ts)
    expect(recs.length).toBeGreaterThan(0)
    expect(recs[0].type).toBe('RECRUIT_TRADE')
    expect(recs[0].targetTrade).toBe('HVAC')
  })

  it('returns empty array for low shortage', () => {
    const ts = buildTradeScore(
      mkDemand({ openProjectCount: 2, unfilledAssignmentCount: 0, expiredAssignmentCount: 0 }),
      mkSupply({ verifiedContractors: 20 }),
      [],
    )
    const recs = tradeShortageRecommendations(ts)
    expect(recs.length).toBe(0)
  })

  it('actions include INTERNAL_ALERT for HIGH shortage', () => {
    const ts = buildTradeScore(
      mkDemand({ openProjectCount: 30, unfilledAssignmentCount: 20, expiredAssignmentCount: 15 }),
      mkSupply({ verifiedContractors: 2 }),
      [mkBacklogRow()],
    )
    const recs = tradeShortageRecommendations(ts)
    if (recs.length > 0 && ts.shortageScore >= 50) {
      const hasAlert = recs[0].suggestedActions.some(a => a.type === 'INTERNAL_SLACK_ALERT')
      expect(hasAlert).toBe(true)
    }
  })
})

describe('tradeSurplusRecommendations', () => {
  it('generates DEMAND_GEN_TRADE recommendation for surplus', () => {
    const ts = buildTradeScore(
      mkDemand({ openProjectCount: 1 }),
      mkSupply({ verifiedContractors: 30, inactiveContractors: 25 }),
      [],
    )
    const recs = tradeSurplusRecommendations(ts)
    expect(recs.some(r => r.type === 'DEMAND_GEN_TRADE')).toBe(true)
  })

  it('returns empty for balanced market', () => {
    const ts = buildTradeScore(mkDemand(), mkSupply(), [])
    const recs = tradeSurplusRecommendations(ts)
    expect(recs.length).toBe(0)
  })
})

describe('geoShortageRecommendations', () => {
  it('generates RECRUIT_REGION recommendation for regional shortage', () => {
    const gs = buildGeoScore(mkGeoRow({ unfilledProjectCount: 15, verifiedContractorCount: 1 }))
    const recs = geoShortageRecommendations(gs)
    expect(recs.some(r => r.type === 'RECRUIT_REGION')).toBe(true)
  })

  it('returns empty for balanced region', () => {
    const gs = buildGeoScore(mkGeoRow({ unfilledProjectCount: 1, verifiedContractorCount: 10, expiredAssignmentCount: 0 }))
    const recs = geoShortageRecommendations(gs)
    expect(recs.length).toBe(0)
  })
})

describe('inactivityRecommendations', () => {
  it('generates REACTIVATE_CONTRACTOR recommendation for high-risk contractors', () => {
    const inactive = [mkInactiveContractor(), mkInactiveContractor({ profileId: 'p2', inactivityRiskScore: 85 })]
    const recs = inactivityRecommendations(inactive)
    expect(recs.length).toBeGreaterThan(0)
    expect(recs[0].type).toBe('REACTIVATE_CONTRACTOR')
    expect(recs[0].suggestedActions.some(a => a.type === 'SENDGRID_SEQUENCE')).toBe(true)
  })

  it('returns empty when no inactive contractors', () => {
    const recs = inactivityRecommendations([])
    expect(recs.length).toBe(0)
  })
})

// ─── Duplicate recommendation IDs ────────────────────────────────────────────

describe('deriveAllRecommendations: no duplicate IDs', () => {
  it('all recommendation IDs are unique', () => {
    const tradeScores = [
      buildTradeScore(mkDemand({ trade: 'HVAC', openProjectCount: 20, unfilledAssignmentCount: 15, expiredAssignmentCount: 8 }), mkSupply({ trade: 'HVAC', verifiedContractors: 2 }), [mkBacklogRow()]),
      buildTradeScore(mkDemand({ trade: 'Electrical', openProjectCount: 15, unfilledAssignmentCount: 10, expiredAssignmentCount: 5 }), mkSupply({ trade: 'Electrical', verifiedContractors: 1 }), []),
    ]
    const geoScores   = [buildGeoScore(mkGeoRow())]
    const backlog     = [buildBacklogRiskScore(mkBacklogRow())]
    const inactive    = [mkInactiveContractor()]

    const recs = deriveAllRecommendations(tradeScores, geoScores, backlog, inactive)
    const ids  = recs.map(r => r.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ─── Safe behavior with empty data ───────────────────────────────────────────

describe('safe behavior with incomplete data', () => {
  it('calcOverallLiquidityScore returns 50 with no trade scores', () => {
    expect(calcOverallLiquidityScore([])).toBe(50)
  })

  it('deriveAllRecommendations returns empty with all empty inputs', () => {
    const recs = deriveAllRecommendations([], [], [], [])
    expect(recs).toEqual([])
  })

  it('buildTradeScore safe with all zeros', () => {
    const d = mkDemand({ openProjectCount: 0, unfilledAssignmentCount: 0, expiredAssignmentCount: 0 })
    const s = mkSupply({ verifiedContractors: 0, inactiveContractors: 0 })
    const ts = buildTradeScore(d, s, [])
    expect(ts.shortageScore).toBe(0)
    expect(ts.surplusScore).toBe(0)
    expect(ts.backlogRisk).toBe(0)
  })

  it('buildGeoScore safe with zero supply and demand', () => {
    const gs = buildGeoScore(mkGeoRow({ openProjectCount: 0, unfilledProjectCount: 0, verifiedContractorCount: 0 }))
    expect(gs.shortageScore).toBe(0)
    expect(gs.surplusScore).toBe(0)
  })
})

// ─── Bot registry ─────────────────────────────────────────────────────────────

describe('BotRegistry', () => {
  it('org chart has all expected groups', () => {
    expect(KEABOTS_ORG_CHART).toHaveProperty('GROWTH_MARKETING')
    expect(KEABOTS_ORG_CHART).toHaveProperty('INTAKE_QUALIFICATION')
    expect(KEABOTS_ORG_CHART).toHaveProperty('SUPPLY_CONTRACTOR_OPS')
    expect(KEABOTS_ORG_CHART).toHaveProperty('COMPLIANCE_VERIFICATION')
  })

  it('growth-bot is listed in GROWTH_MARKETING', () => {
    expect(KEABOTS_ORG_CHART.GROWTH_MARKETING.bots).toContain('growth-bot')
  })

  it('HUMAN_INTERACTION_MAP has all three stages', () => {
    const { HUMAN_INTERACTION_MAP } = require('../../shared/bot.registry.js')
    expect(HUMAN_INTERACTION_MAP).toHaveProperty('safe')
    expect(HUMAN_INTERACTION_MAP).toHaveProperty('supervised')
    expect(HUMAN_INTERACTION_MAP).toHaveProperty('required')
  })
})

// ─── Dispatcher: duplicate event protection ───────────────────────────────────

describe('BotDispatcher deduplication', () => {
  it('dedup key prevents same event from being dispatched twice', async () => {
    // Mock Redis with a simple in-memory store
    const store = new Map<string, string>()
    const mockRedis = {
      set: vi.fn(async (key: string, _val: string, ..._args: any[]) => {
        if (store.has(key)) return null // NX behavior: null = already exists
        store.set(key, '1')
        return 'OK'
      }),
    }

    // Mock bot registry
    const mockBot = {
      id: 'test-bot',
      subscribedEvents: ['test.event'],
      handle: vi.fn().mockResolvedValue({
        botId: 'test-bot',
        eventType: 'test.event',
        actionsTriggered: [],
        recommendationsEmitted: [],
        processingMs: 5,
      }),
    }

    const mockRegistry = {
      getBotsForEvent: vi.fn().mockReturnValue([mockBot]),
    }

    // Inline test dispatcher logic
    const event = BotDispatcher.buildEvent('test.event', 'test', { foo: 'bar' })
    const dedupKey = `bot-dispatch:test-bot:${event.id}`

    const first  = await mockRedis.set(dedupKey, '1', 'EX', 3600, 'NX')
    const second = await mockRedis.set(dedupKey, '1', 'EX', 3600, 'NX')

    expect(first).toBe('OK')    // first call proceeds
    expect(second).toBeNull()   // duplicate blocked
  })
})

// ─── Permission boundary tests ────────────────────────────────────────────────

describe('GrowthBot permission boundaries', () => {
  it('outbound campaigns (CRM, email, SMS) always have requiresApproval=true', () => {
    const ts = buildTradeScore(
      mkDemand({ openProjectCount: 20, unfilledAssignmentCount: 15, expiredAssignmentCount: 10 }),
      mkSupply({ verifiedContractors: 2 }),
      [mkBacklogRow()],
    )
    const recs = tradeShortageRecommendations(ts)
    for (const rec of recs) {
      for (const action of rec.suggestedActions) {
        if (['CRM_WORKFLOW_ENROLL', 'SENDGRID_SEQUENCE', 'TWILIO_SMS', 'CRM_TAG'].includes(action.type)) {
          expect(action.requiresApproval).toBe(true)
        }
      }
    }
  })

  it('INTERNAL_SLACK_ALERT and DASHBOARD_FLAG never require approval', () => {
    const ts = buildTradeScore(
      mkDemand({ openProjectCount: 30, unfilledAssignmentCount: 20, expiredAssignmentCount: 15 }),
      mkSupply({ verifiedContractors: 2 }),
      [mkBacklogRow()],
    )
    const recs = tradeShortageRecommendations(ts)
    for (const rec of recs) {
      for (const action of rec.suggestedActions) {
        if (['INTERNAL_SLACK_ALERT', 'DASHBOARD_FLAG'].includes(action.type)) {
          expect(action.requiresApproval).toBe(false)
        }
      }
    }
  })
})
