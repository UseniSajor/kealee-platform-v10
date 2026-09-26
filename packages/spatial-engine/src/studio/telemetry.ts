/**
 * The engineering event log — immutable, hash-chained — and the beta metrics
 * read from it.
 *
 * Every prompt, proposal, decision, manual edit, calculation, check, state
 * transition and issuance act is one event. Events are appended, never
 * updated: each carries the hash of the one before, so an edit anywhere in
 * the history breaks the chain and `verifyChain` says where. (The database
 * table additionally refuses UPDATE and DELETE by trigger.)
 *
 * `trainingConsent` is false on every event. The log exists to audit work and
 * to find recurring corrections that should become deterministic rules; using
 * a professional's corrections to train a model is a separate data-governance
 * decision this code does not make.
 */

import { createHash } from 'node:crypto'
import { STUDIO_ENGINE_VERSION } from './model'

export const ENGINEERING_EVENT_TYPES = [
  'PROMPT', 'PROPOSAL_CREATED', 'PROPOSAL_ACCEPTED', 'PROPOSAL_MODIFIED', 'PROPOSAL_REJECTED', 'PROPOSAL_STALE',
  'MANUAL_EDIT', 'IMPORT', 'CALCULATION', 'CHECK', 'RULE_OVERRIDE', 'REDLINE', 'REVIEW_COMMENT',
  'STATE_TRANSITION', 'ISSUANCE_PREPARED', 'ISSUANCE_APPROVED', 'ISSUANCE_EXECUTED', 'ISSUANCE_INVALIDATED',
  'SHEETS_RENDERED', 'GENERATOR_STAGE', 'MEMBERSHIP', 'INVITATION', 'LICENCE',
] as const
export type EngineeringEventType = typeof ENGINEERING_EVENT_TYPES[number]

export interface EngineeringEvent {
  id: string
  organizationId: string
  workspaceId: string | null
  projectId: string | null
  sequence: number
  occurredAt: string
  eventType: EngineeringEventType
  userId: string | null
  role: string | null
  actorType: 'user' | 'ai' | 'system'
  mode: string | null
  origin: string | null
  prompt: string | null
  selectedObjectIds: string[]
  aiInterpretation: unknown
  proposedCommands: unknown
  validationResults: unknown
  decision: 'ACCEPTED' | 'MODIFIED' | 'REJECTED' | null
  manualEdits: unknown
  resultingRevision: number | null
  proposalId: string | null
  engineVersion: string
  rulesVersion: string | null
  durationMs: number | null
  detail: unknown
  trainingConsent: false
  prevHash: string | null
  hash: string
}

export type NewEvent = Omit<EngineeringEvent, 'sequence' | 'hash' | 'prevHash' | 'engineVersion' | 'trainingConsent' | 'occurredAt'> & { occurredAt?: string }

function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null)
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  return `{${Object.keys(v as object).sort().map(k => `${JSON.stringify(k)}:${canonical((v as any)[k])}`).join(',')}}`
}

export function hashEvent(e: Omit<EngineeringEvent, 'hash'>): string {
  return createHash('sha256').update(canonical(e)).digest('hex')
}

/** Appends to an in-memory or loaded chain. The caller persists the result. */
export function appendEvent(prev: EngineeringEvent | null, e: NewEvent, now = new Date().toISOString()): EngineeringEvent {
  const body: Omit<EngineeringEvent, 'hash'> = {
    ...e, occurredAt: e.occurredAt ?? now, sequence: (prev?.sequence ?? 0) + 1, prevHash: prev?.hash ?? null,
    engineVersion: STUDIO_ENGINE_VERSION, trainingConsent: false,
  }
  return { ...body, hash: hashEvent(body) }
}

/** First broken link, or null when the chain is intact. */
export function verifyChain(events: EngineeringEvent[]): { brokenAt: number; reason: string } | null {
  let prev: EngineeringEvent | null = null
  for (const e of [...events].sort((a, b) => a.sequence - b.sequence)) {
    const { hash, ...body } = e
    if (hashEvent(body) !== hash) return { brokenAt: e.sequence, reason: 'event content does not match its hash' }
    if ((prev?.hash ?? null) !== e.prevHash) return { brokenAt: e.sequence, reason: 'event does not follow the previous one' }
    if (prev && e.sequence !== prev.sequence + 1) return { brokenAt: e.sequence, reason: 'sequence gap' }
    prev = e
  }
  return null
}

export interface BetaMetrics {
  aiProposals: number
  aiAccepted: number
  aiModified: number
  aiRejected: number
  manualCommands: number
  redlines: number
  revisions: number
  calculations: number
  checksRun: number
  errorsFound: number
  ruleViolations: number
  professionalCorrections: number
  submissionCycles: number
  finalApprovalStatus: string | null
  time: { aiDraftingMs: number; manualDraftingMs: number; reviewMs: number; kealeeDraftingMs: number; traditionalEstimateMs: number | null }
  /** Commands professionals most often change after the AI proposed them — candidates for deterministic rules. */
  recurringCorrections: { action: string; count: number }[]
}

export function betaMetrics(events: EngineeringEvent[], traditionalEstimateHours: number | null = null): BetaMetrics {
  const ev = [...events].sort((a, b) => a.sequence - b.sequence)
  const isAi = (e: EngineeringEvent) => e.origin === 'AI' || e.origin === 'REDLINE' || e.origin === 'GENERATOR'
  const of = (t: EngineeringEventType) => ev.filter(e => e.eventType === t)
  const created = of('PROPOSAL_CREATED')
  const aiIds = new Set(created.filter(isAi).map(e => e.proposalId))
  const decided = (t: EngineeringEventType) => of(t).filter(e => aiIds.has(e.proposalId)).length
  const corrections = new Map<string, number>()
  for (const e of of('PROPOSAL_MODIFIED').filter(x => aiIds.has(x.proposalId))) {
    const orig = created.find(c => c.proposalId === e.proposalId)
    for (const c of (orig?.proposedCommands as { action: string }[] | undefined) ?? []) corrections.set(c.action, (corrections.get(c.action) ?? 0) + 1)
  }
  let reviewMs = 0, reviewStart: number | null = null
  for (const e of of('STATE_TRANSITION')) {
    const d = e.detail as { to?: string; from?: string } | null
    if (d?.to === 'PE_REVIEW') reviewStart = Date.parse(e.occurredAt)
    else if (d?.from === 'PE_REVIEW' && reviewStart != null) { reviewMs += Date.parse(e.occurredAt) - reviewStart; reviewStart = null }
  }
  const sum = (xs: EngineeringEvent[]) => xs.reduce((s, e) => s + (e.durationMs ?? 0), 0)
  const accepted = of('PROPOSAL_ACCEPTED').concat(of('PROPOSAL_MODIFIED'))
  const aiDraftingMs = sum(accepted.filter(e => aiIds.has(e.proposalId)))
  const manualDraftingMs = sum(accepted.filter(e => !aiIds.has(e.proposalId))) + sum(of('MANUAL_EDIT'))
  const lastState = [...of('STATE_TRANSITION')].reverse()[0]
  return {
    aiProposals: aiIds.size, aiAccepted: decided('PROPOSAL_ACCEPTED'), aiModified: decided('PROPOSAL_MODIFIED'), aiRejected: decided('PROPOSAL_REJECTED'),
    manualCommands: created.filter(e => !isAi(e)).length + of('MANUAL_EDIT').length, redlines: of('REDLINE').length,
    revisions: accepted.length + of('IMPORT').length, calculations: of('CALCULATION').length, checksRun: of('CHECK').length,
    errorsFound: of('CHECK').reduce((s, e) => s + Number((e.detail as any)?.errors ?? 0), 0),
    ruleViolations: of('CHECK').reduce((s, e) => s + Number((e.detail as any)?.failing ?? 0), 0),
    professionalCorrections: decided('PROPOSAL_MODIFIED') + of('REDLINE').length + of('RULE_OVERRIDE').length,
    submissionCycles: of('STATE_TRANSITION').filter(e => (e.detail as any)?.to === 'SUBMITTED').length,
    finalApprovalStatus: (lastState?.detail as any)?.to ?? null,
    time: { aiDraftingMs, manualDraftingMs, reviewMs, kealeeDraftingMs: aiDraftingMs + manualDraftingMs, traditionalEstimateMs: traditionalEstimateHours == null ? null : traditionalEstimateHours * 3_600_000 },
    recurringCorrections: [...corrections].map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count),
  }
}
