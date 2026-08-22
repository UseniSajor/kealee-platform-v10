/**
 * The rule-maintenance cycle.
 *
 * Phase 3C's economics depend on certifications surviving. A certification that
 * nobody re-checks is not an asset — after a year it is a claim about a document
 * that may have been amended twice. This is the job that keeps them honest, and
 * the job that reopens review only where something actually moved.
 *
 * It exists because the pieces already do, but wiring them by hand is
 * error-prone: refresh, invalidate, sweep expiries, repack, queue, persist —
 * in that order, in one transaction. Getting the order wrong produced a real
 * defect once already (withdrawals applied before the appends they targeted),
 * so the order lives here rather than in every caller.
 *
 * Scheduling is NOT here. `JobQueue` and `JobSchedule` already exist in the
 * platform; this supplies the payload and the handler, not another scheduler.
 */

import type { CertifiableRule, CertificationRecord, RuleAuditEvent, Reviewer, ReviewerRole } from './certification'
import { transitionRule, ruleAuditEvent } from './certification'
import type { RegionLocator } from './source-refresh'
import { refreshAll, type RefreshOutcome, type FetchOptions } from './source-refresh'
import type { AuthoritativeSource } from './change-detection'
import { buildRulePack, type RulePack, type SourceIssue } from './pack'
import { buildMaintenanceQueue, type MaintenanceQueueEntry } from './reviewer-api'
import type { RuleCertificationStore } from '../persistence/rule-certification'
import { persistRuleState } from '../persistence/rule-certification'

// ── Certification expiry ────────────────────────────────────────────────────

export interface ExpirySweepResult {
  rules: CertifiableRule[]
  expired: { identity: string; ruleKey: string; expiredAt: string }[]
  audits: RuleAuditEvent[]
}

/**
 * Withdraws certifications that have passed their expiry date.
 *
 * An expiry is a deliberate act by the reviewer who set it — "this is right
 * today and I want it re-read within the year". Letting it lapse silently would
 * turn a considered limit into a formality, so the sweep is a real transition
 * to PROVISIONAL with an audit entry, not a flag.
 */
export function sweepExpiredCertifications(
  rules: CertifiableRule[],
  now: Date = new Date(),
  actor: { id: string; name: string; role: ReviewerRole | 'system' } = { id: 'system', name: 'rule-maintenance', role: 'system' },
): ExpirySweepResult {
  const out: CertifiableRule[] = []
  const expired: ExpirySweepResult['expired'] = []
  const audits: RuleAuditEvent[] = []

  for (const rule of rules) {
    const cert = rule.certification
    const lapsed =
      rule.state === 'CERTIFIED' &&
      cert?.active === true &&
      cert.expiresAt != null &&
      Date.parse(cert.expiresAt) <= now.getTime()

    if (!lapsed) { out.push(rule); continue }

    const reason =
      `Certification expired on ${cert!.expiresAt!.slice(0, 10)}. It was granted with a review-by date ` +
      'and that date has passed; the rule returns to PROVISIONAL until it is re-read.'
    const t = transitionRule({ rule, to: 'PROVISIONAL', actor, reason, now: now.toISOString() })
    out.push(t.rule)
    audits.push(t.audit)
    expired.push({ identity: rule.identity, ruleKey: rule.ruleKey, expiredAt: cert!.expiresAt! })
  }

  return { rules: out, expired, audits }
}

// ── Pack health ─────────────────────────────────────────────────────────────

export type PackHealthGrade = 'healthy' | 'attention' | 'degraded' | 'unusable'

export interface PackHealth {
  grade: PackHealthGrade
  /** What a maintainer should do next, most valuable first. */
  actions: string[]
  findings: { code: string; detail: string; severity: 'info' | 'warning' | 'blocking' }[]
  /** Rules applied without human review, as a share of gating rules in play. */
  automationRate: number
  summary: string
}

export function assessPackHealth(input: {
  pack: RulePack
  rules: CertifiableRule[]
  outcomes: RefreshOutcome[]
  now?: Date
}): PackHealth {
  const findings: PackHealth['findings'] = []
  const actions: string[] = []
  const { pack, rules, outcomes } = input

  const unreachable = outcomes.filter(o => !o.fetched.ok)
  if (unreachable.length) {
    findings.push({
      code: 'SOURCES_UNREACHABLE',
      severity: 'warning',
      detail:
        `${unreachable.length} source(s) could not be retrieved: ` +
        `${unreachable.map(o => o.sourceId).join(', ')}. Certifications are retained — an outage is not ` +
        'an amendment — but currency cannot be proven while this persists.',
    })
    actions.push('Investigate the unreachable sources; a persistent outage becomes a currency problem.')
  }

  const brokenLocators = outcomes.filter(o => o.unlocatableRegions.length)
  if (brokenLocators.length) {
    findings.push({
      code: 'LOCATORS_BROKEN',
      severity: 'blocking',
      detail:
        `${brokenLocators.length} source(s) have region locators that no longer match: ` +
        brokenLocators.flatMap(o => o.unlocatableRegions).slice(0, 5).join('; ') +
        '. The publisher restructured, or a section was renumbered.',
    })
    actions.unshift('Fix the broken region locators — until then those rules cannot be proven current.')
  }

  const downgraded = outcomes.flatMap(o => o.downgraded)
  if (downgraded.length) {
    findings.push({
      code: 'RULES_DOWNGRADED',
      severity: 'warning',
      detail: `${downgraded.length} rule(s) lost certification because their source changed.`,
    })
    actions.push(`Re-verify and re-certify ${downgraded.length} rule(s) whose source moved.`)
  }

  if (pack.status === 'STALE') {
    findings.push({
      code: 'PACK_STALE', severity: 'warning',
      detail: pack.statusRationale,
    })
    actions.push('Run a source refresh to re-establish currency.')
  }

  if (pack.unresolvedSourceIssues.length) {
    findings.push({
      code: 'UNRESOLVED_SOURCE_ISSUES', severity: 'info',
      detail:
        `${pack.unresolvedSourceIssues.length} rule(s) rest on a source that cannot be obtained. These do ` +
        'not degrade over time — they were never resolvable — and they stay human-review by design.',
    })
  }

  // Automation rate over GATING rules only: an advisory rule was never going to
  // need review, so counting it would flatter the number.
  const gating = rules.filter(r => r.gating && r.state !== 'SUPERSEDED' && r.state !== 'REVOKED')
  const certified = gating.filter(r => r.state === 'CERTIFIED')
  const automationRate = gating.length === 0 ? 0 : Number((certified.length / gating.length).toFixed(4))

  if (pack.coreCount > 0 && pack.coreCertifiedCount < pack.coreCount) {
    findings.push({
      code: 'CORE_UNCERTIFIED', severity: 'blocking',
      detail: `${pack.coreCount - pack.coreCertifiedCount} core rule(s) are not certified.`,
    })
    actions.unshift('Certify the remaining core rules — the pack cannot run unattended without them.')
  }

  const blocking = findings.filter(f => f.severity === 'blocking').length
  const warnings = findings.filter(f => f.severity === 'warning').length

  const grade: PackHealthGrade =
    pack.status === 'SUPERSEDED' ? 'unusable'
    : blocking > 0 ? 'degraded'
    : warnings > 0 ? 'attention'
    : 'healthy'

  return {
    grade,
    actions,
    findings,
    automationRate,
    summary:
      `${pack.jurisdiction} pack ${pack.packVersion} is ${grade} (${pack.status}). ` +
      `${(automationRate * 100).toFixed(0)}% of gating rules apply without human review. ` +
      (actions.length ? `Next: ${actions[0]}` : 'Nothing outstanding.'),
  }
}

// ── The cycle ───────────────────────────────────────────────────────────────

export interface MaintenanceSourceInput {
  source: AuthoritativeSource
  locators: RegionLocator[]
  /**
   * Per-source fetch options, including `fetchImpl`. Present so the cycle can
   * run against fixtures: a maintenance job that can only be exercised by
   * hitting a county portal is one nobody will exercise.
   */
  fetchOptions?: FetchOptions
}

export interface MaintenanceCycleInput {
  jurisdictionCode: string
  rules: CertifiableRule[]
  sources: MaintenanceSourceInput[]
  coreRuleKeys: string[]
  packVersion: string
  effectiveDate: string
  unresolvedSourceIssues?: SourceIssue[]
  /** Omit for a dry run: everything is computed, nothing is written. */
  store?: RuleCertificationStore
  /** Reviewer whose authority the maintenance queue is built for. */
  queueFor?: Reviewer
  /** Rule identity → number of projects currently waiting on it. */
  projectImpact?: Record<string, number>
  actor?: { id: string; name: string; role: ReviewerRole | 'system' }
  now?: Date
}

export interface MaintenanceCycleResult {
  jurisdictionCode: string
  startedAt: string
  finishedAt: string
  dryRun: boolean

  sourcesChecked: number
  sourcesUnreachable: string[]
  sourcesChanged: string[]
  regionsUnlocatable: string[]

  rulesDowngraded: { identity: string; from: string; to: string; reason: string }[]
  rulesRetained: string[]
  certificationsExpired: { identity: string; ruleKey: string; expiredAt: string }[]

  packBefore: RulePack
  packAfter: RulePack
  health: PackHealth
  queue: MaintenanceQueueEntry[]

  rules: CertifiableRule[]
  sources: AuthoritativeSource[]
  audits: RuleAuditEvent[]
  summary: string
}

const SYSTEM_ACTOR = { id: 'system', name: 'rule-maintenance', role: 'system' as const }

/**
 * Runs one maintenance cycle for a jurisdiction.
 *
 * Order matters and is fixed here: refresh every source (a failure in one must
 * not abandon the rest), apply the scoped invalidations, sweep expiries, rebuild
 * the pack from the resulting state, assess health, build the queue, then
 * persist the whole thing in a single transaction.
 *
 * Idempotent by construction: with no source change and nothing expired, it
 * downgrades nothing and writes the same state back.
 */
export async function runMaintenanceCycle(
  input: MaintenanceCycleInput,
): Promise<MaintenanceCycleResult> {
  const now = input.now ?? new Date()
  const startedAt = now.toISOString()
  const actor = input.actor ?? SYSTEM_ACTOR

  const packBefore = buildRulePack({
    jurisdiction: input.jurisdictionCode,
    packVersion: input.packVersion,
    effectiveDate: input.effectiveDate,
    rules: input.rules,
    coreRuleKeys: input.coreRuleKeys,
    sources: input.sources.map(s => ({
      sourceId: s.source.sourceId, title: s.source.title,
      version: s.source.version, documentHash: s.source.documentHash,
      retrievedAt: s.source.retrievedAt,
    })),
    unresolvedSourceIssues: input.unresolvedSourceIssues,
    lastRefreshedAt: input.sources[0]?.source.retrievedAt ?? null,
    now,
  })

  // ── 1. Refresh every source ──────────────────────────────────────────────
  // refreshAll isolates a throw in one source from the others, so a single
  // publisher outage cannot abandon the cycle halfway through.
  let rules = input.rules
  const outcomes = await refreshAll(
    input.sources.map(s => ({
      source: s.source, locators: s.locators, rules,
      actor, rulePackVersion: input.packVersion, fetchOptions: s.fetchOptions,
    })),
  )

  // ── 2. Fold each outcome's rule state forward ────────────────────────────
  // Each refresh saw the rule set as it was at the start, so the results are
  // merged by identity rather than by taking the last outcome wholesale —
  // otherwise the final source's view would overwrite every earlier downgrade.
  const downgradedBy = new Map<string, { identity: string; from: string; to: string; reason: string }>()
  const changedRuleState = new Map<string, CertifiableRule>()
  for (const o of outcomes) {
    for (const d of o.downgraded) downgradedBy.set(d.identity, d)
    for (const r of o.rules) {
      const original = input.rules.find(x => x.identity === r.identity)
      if (original && (original.state !== r.state || original.humanReviewRequired !== r.humanReviewRequired)) {
        changedRuleState.set(r.identity, r)
      }
    }
  }
  rules = rules.map(r => changedRuleState.get(r.identity) ?? r)

  // Every source_changed event raised while applying the invalidations.
  const audits: RuleAuditEvent[] = outcomes.flatMap(o => o.audits)

  // ── 3. Sweep expired certifications ─────────────────────────────────────
  const swept = sweepExpiredCertifications(rules, now, actor)
  rules = swept.rules
  audits.push(...swept.audits)

  // ── 4. Rebuild the pack from the resulting state ─────────────────────────
  const refreshedSources = outcomes.map(o => o.source)
  const packAfter = buildRulePack({
    jurisdiction: input.jurisdictionCode,
    packVersion: input.packVersion,
    effectiveDate: input.effectiveDate,
    rules,
    coreRuleKeys: input.coreRuleKeys,
    sources: refreshedSources.map(s => ({
      sourceId: s.sourceId, title: s.title, version: s.version,
      documentHash: s.documentHash, retrievedAt: s.retrievedAt,
    })),
    unresolvedSourceIssues: input.unresolvedSourceIssues,
    // Only a source we actually reached proves currency. An all-outage cycle
    // must NOT mark the pack fresh — that would convert "we could not check"
    // into "we checked and it is fine", which is the whole failure this system
    // is built to avoid.
    lastRefreshedAt: outcomes.some(o => o.fetched.ok)
      ? startedAt
      : (input.sources[0]?.source.retrievedAt ?? null),
    now,
  })

  // ── 5. Health and queue ──────────────────────────────────────────────────
  const health = assessPackHealth({ pack: packAfter, rules, outcomes, now })

  const currentSourceHashes: Record<string, string | null> = {}
  for (const o of outcomes) {
    for (const region of o.source.regions) {
      for (const id of region.ruleIdentities) currentSourceHashes[id] = region.hash
    }
  }

  const queue = input.queueFor
    ? buildMaintenanceQueue({
        rules, reviewer: input.queueFor, currentSourceHashes,
        projectImpact: input.projectImpact,
      })
    : []

  // ── 6. Persist, in one transaction ───────────────────────────────────────
  const withdrawn = [...downgradedBy.values()].map(d => ({
    ruleIdentity: d.identity, revokedAt: startedAt, reason: d.reason,
  }))
  const expiredWithdrawals = swept.expired.map(e => ({
    ruleIdentity: e.identity, revokedAt: startedAt,
    reason: `Certification expired on ${e.expiredAt}.`,
  }))

  if (input.store) {
    for (const o of outcomes) {
      await persistRuleState(input.store, {
        rules: o.rules.filter(r => o.source.regions.some(g => g.ruleIdentities.includes(r.identity))),
        source: { source: o.source, authority: 'OFFICIAL_CODE' },
        change: o.change ?? undefined,
      })
    }
    await persistRuleState(input.store, {
      rules,
      pack: packAfter,
      coreRuleKeys: input.coreRuleKeys,
      audits,
      withdrawnCertifications: [...withdrawn, ...expiredWithdrawals],
    })
  }

  const finishedAt = new Date(now.getTime()).toISOString()
  const changed = outcomes.filter(o => o.change?.changed).map(o => o.sourceId)
  const unreachable = outcomes.filter(o => !o.fetched.ok).map(o => o.sourceId)

  return {
    jurisdictionCode: input.jurisdictionCode,
    startedAt,
    finishedAt,
    dryRun: !input.store,
    sourcesChecked: outcomes.length,
    sourcesUnreachable: unreachable,
    sourcesChanged: changed,
    regionsUnlocatable: outcomes.flatMap(o => o.unlocatableRegions),
    rulesDowngraded: [...downgradedBy.values()],
    rulesRetained: outcomes.flatMap(o => o.retained),
    certificationsExpired: swept.expired,
    packBefore,
    packAfter,
    health,
    queue,
    rules,
    sources: refreshedSources,
    audits,
    summary:
      `${input.jurisdictionCode}: checked ${outcomes.length} source(s), ` +
      `${changed.length} changed, ${unreachable.length} unreachable. ` +
      `${downgradedBy.size} rule(s) downgraded, ${swept.expired.length} certification(s) expired. ` +
      `Pack ${packBefore.status} → ${packAfter.status}. ${health.summary}` +
      (input.store ? '' : ' (DRY RUN — nothing was written.)'),
  }
}

// ── Job integration ─────────────────────────────────────────────────────────

/**
 * The queue name and payload for the existing `JobQueue` / `JobSchedule`
 * tables. No new scheduler: the platform already has one.
 */
export const RULE_MAINTENANCE_QUEUE = 'rule-maintenance'

export interface RuleMaintenanceJobData {
  jurisdictionCode: string
  packVersion: string
  /** Refuse to run two cycles for one jurisdiction at once. */
  lockKey: string
}

export function ruleMaintenanceJob(jurisdictionCode: string, packVersion: string): {
  queueName: string
  jobId: string
  jobName: string
  data: RuleMaintenanceJobData
} {
  return {
    queueName: RULE_MAINTENANCE_QUEUE,
    // Stable per jurisdiction and pack, so the queue's (queueName, jobId)
    // uniqueness prevents a backlog of duplicate cycles building up.
    jobId: `${jurisdictionCode}:${packVersion}`,
    jobName: `Rule maintenance — ${jurisdictionCode} ${packVersion}`,
    data: { jurisdictionCode, packVersion, lockKey: `${RULE_MAINTENANCE_QUEUE}:${jurisdictionCode}` },
  }
}

/**
 * Suggested cadence.
 *
 * Weekly is the right order of magnitude for an ordinance: counties amend on a
 * scale of months, and a daily fetch is load on a public portal for no
 * information gain. FEMA panels move even more slowly but are cheap to check,
 * so they ride the same cycle rather than getting their own.
 */
export const RULE_MAINTENANCE_SCHEDULE = {
  name: 'rule-maintenance-weekly',
  queueName: RULE_MAINTENANCE_QUEUE,
  cronExpression: '0 4 * * 1',
  timezone: 'America/New_York',
  description:
    'Refreshes jurisdiction rule sources, applies scoped invalidation, sweeps expired certifications ' +
    'and rebuilds the pack. Never runs on a request path.',
} as const
