/**
 * Who may do what — capability-based, enforced server-side.
 *
 * A role is a bundle of capabilities; a capability that carries professional
 * authority additionally needs a VERIFIED licence of the right kind, current
 * on the day, issued by the state the project is in. A Maryland PE is not a
 * Virginia PE. An ADMIN runs the platform and holds no professional authority
 * at all. The AI holds no capability: it proposes, and a person with the
 * capability accepts.
 */

export const STUDIO_ROLES = [
  'SITE_PLAN_DRAFTER', 'ENGINEERING_TECH', 'ENGINEER_IN_TRAINING', 'PROFESSIONAL_ENGINEER',
  'SURVEYOR', 'REVIEWER', 'PROJECT_MANAGER', 'ADMIN',
] as const
export type StudioRole = typeof STUDIO_ROLES[number]

/** Roles an invitation may grant. ADMIN is never granted by link. */
export const INVITABLE_ROLES: StudioRole[] = STUDIO_ROLES.filter(r => r !== 'ADMIN')

export const CAPABILITIES = [
  'VIEW_PROJECT', 'USE_COPILOT', 'PROPOSE_CHANGE', 'ACCEPT_CHANGE', 'RUN_CALCULATION', 'RUN_CHECKS',
  'PREPARE_SHEETS', 'EXPORT_PRELIMINARY', 'COMMENT', 'CREATE_REDLINE', 'CREATE_PROJECT',
  'IMPORT_SOURCE_DATA', 'IMPORT_SURVEY', 'CERTIFY_SURVEY', 'OVERRIDE_RULE',
  'TRANSITION_PRODUCTION', 'REQUEST_PE_REVIEW', 'PROFESSIONAL_APPROVE', 'MARK_READY_FOR_SEAL', 'SIGN_SEAL',
  'SUBMIT_TO_AHJ', 'RECORD_AHJ_RESPONSE', 'MANAGE_MEMBERS', 'INVITE_PROFESSIONAL', 'VERIFY_LICENCE', 'VIEW_TELEMETRY',
] as const
export type Capability = typeof CAPABILITIES[number]

const PRODUCTION: Capability[] = [
  'VIEW_PROJECT', 'USE_COPILOT', 'PROPOSE_CHANGE', 'ACCEPT_CHANGE', 'RUN_CALCULATION', 'RUN_CHECKS',
  'PREPARE_SHEETS', 'EXPORT_PRELIMINARY', 'COMMENT', 'CREATE_REDLINE', 'CREATE_PROJECT', 'IMPORT_SOURCE_DATA',
  'TRANSITION_PRODUCTION', 'REQUEST_PE_REVIEW',
]

export const ROLE_CAPABILITIES: Record<StudioRole, Capability[]> = {
  SITE_PLAN_DRAFTER: PRODUCTION,
  ENGINEERING_TECH: PRODUCTION,
  ENGINEER_IN_TRAINING: PRODUCTION,
  PROFESSIONAL_ENGINEER: [...PRODUCTION, 'OVERRIDE_RULE', 'PROFESSIONAL_APPROVE', 'MARK_READY_FOR_SEAL', 'SIGN_SEAL', 'SUBMIT_TO_AHJ'],
  // Survey is its own licence. A surveyor imports and certifies survey data;
  // engineering approvals are not theirs, and a PE does not certify a survey.
  SURVEYOR: ['VIEW_PROJECT', 'USE_COPILOT', 'RUN_CHECKS', 'COMMENT', 'CREATE_REDLINE', 'IMPORT_SOURCE_DATA', 'IMPORT_SURVEY', 'CERTIFY_SURVEY', 'EXPORT_PRELIMINARY'],
  REVIEWER: ['VIEW_PROJECT', 'USE_COPILOT', 'RUN_CALCULATION', 'RUN_CHECKS', 'COMMENT', 'CREATE_REDLINE', 'EXPORT_PRELIMINARY'],
  PROJECT_MANAGER: ['VIEW_PROJECT', 'USE_COPILOT', 'RUN_CALCULATION', 'RUN_CHECKS', 'COMMENT', 'CREATE_PROJECT', 'EXPORT_PRELIMINARY', 'TRANSITION_PRODUCTION', 'REQUEST_PE_REVIEW', 'SUBMIT_TO_AHJ', 'RECORD_AHJ_RESPONSE', 'MANAGE_MEMBERS', 'INVITE_PROFESSIONAL', 'VIEW_TELEMETRY'],
  ADMIN: ['VIEW_PROJECT', 'MANAGE_MEMBERS', 'INVITE_PROFESSIONAL', 'VERIFY_LICENCE', 'VIEW_TELEMETRY', 'CREATE_PROJECT'],
}

/** Capabilities that exercise a licence. Each names the licence kind it needs. */
export const LICENSED_CAPABILITIES: Partial<Record<Capability, LicenceKind>> = {
  OVERRIDE_RULE: 'PE', PROFESSIONAL_APPROVE: 'PE', MARK_READY_FOR_SEAL: 'PE', SIGN_SEAL: 'PE', CERTIFY_SURVEY: 'PLS',
}

export type LicenceKind = 'PE' | 'PLS' | 'RA' | 'RLA'
export type LicenceVerification = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'REVOKED'

export interface ProfessionalLicence {
  id: string
  kind: LicenceKind
  /** Issuing jurisdiction: 'MD', 'VA', 'DC'. */
  state: string
  number: string
  discipline: string | null
  expiresAt: string | null
  verification: LicenceVerification
  verifiedBy: string | null
  verifiedAt: string | null
}

export interface Actor {
  userId: string
  type: 'user' | 'ai' | 'system'
  role: StudioRole | null
  /** Membership is active (invitation accepted, terms accepted, not suspended). */
  active: boolean
  licences: ProfessionalLicence[]
  /** Project-scoped assignment, when membership is project-limited. */
  projectIds?: string[] | null
}

export interface AuthzProject { projectId: string; state: string | null /* 'MD' | 'VA' | 'DC' */ }

export type AuthzResult = { allowed: true; licenceId: string | null } | { allowed: false; reason: string }

export function roleCan(role: StudioRole | null, cap: Capability): boolean {
  return !!role && ROLE_CAPABILITIES[role].includes(cap)
}

/** Whether one of the licences authorises professional work in `state` on `at`. Exact state only. */
export function licenceFor(licences: ProfessionalLicence[], kind: LicenceKind, state: string | null, at: Date): ProfessionalLicence | null {
  if (!state) return null
  return licences.find(l =>
    l.kind === kind && l.state.toUpperCase() === state.toUpperCase() && l.verification === 'VERIFIED' &&
    (!l.expiresAt || new Date(l.expiresAt).getTime() >= at.getTime())) ?? null
}

/** The single server-side gate. Every API mutation calls this. */
export function authorize(actor: Actor, cap: Capability, project: AuthzProject | null, at = new Date()): AuthzResult {
  if (actor.type === 'ai') return { allowed: false, reason: 'The AI holds no capability; it may only propose for a person to accept.' }
  if (actor.type === 'system') return cap === 'RUN_CHECKS' || cap === 'RUN_CALCULATION' || cap === 'VIEW_PROJECT' ? { allowed: true, licenceId: null } : { allowed: false, reason: 'System actors run checks only.' }
  if (!actor.active) return { allowed: false, reason: 'Membership is not active — accept the invitation and the professional terms first.' }
  if (!roleCan(actor.role, cap)) return { allowed: false, reason: `${actor.role ?? 'No role'} does not hold ${cap}.` }
  if (project && actor.projectIds && actor.projectIds.length && !actor.projectIds.includes(project.projectId)) {
    return { allowed: false, reason: 'You are not assigned to this project.' }
  }
  const kind = LICENSED_CAPABILITIES[cap]
  if (!kind) return { allowed: true, licenceId: null }
  const lic = licenceFor(actor.licences, kind, project?.state ?? null, at)
  if (!lic) {
    const other = actor.licences.filter(l => l.kind === kind && l.verification === 'VERIFIED').map(l => l.state)
    return {
      allowed: false,
      reason: `${cap} needs a verified, current ${kind} licence issued by ${project?.state ?? 'the project state'}.` +
        (other.length ? ` You hold ${kind} licences in ${other.join(', ')} — a licence in one state does not authorise work in another.` : ''),
    }
  }
  return { allowed: true, licenceId: lic.id }
}

// ── Project lifecycle ──────────────────────────────────────────────────────

export const PROJECT_STATES = [
  'INTAKE', 'BASE_DATA', 'CONCEPT', 'DRAFTING', 'ENGINEERING', 'INTERNAL_QA', 'PE_REVIEW', 'REVISION_REQUIRED',
  'APPROVED_FOR_ISSUANCE', 'READY_FOR_SEAL', 'SIGNED_SEALED', 'SUBMITTED', 'AHJ_COMMENTS', 'REVISION', 'REISSUED', 'APPROVED',
] as const
export type ProjectState = typeof PROJECT_STATES[number]

/** States that exist only because a licensed professional acted. */
export const PROFESSIONAL_STATES: ReadonlySet<ProjectState> = new Set(['APPROVED_FOR_ISSUANCE', 'READY_FOR_SEAL', 'SIGNED_SEALED', 'REISSUED'])

const T = (from: ProjectState[], to: ProjectState, cap: Capability) => from.map(f => ({ from: f, to, cap }))
export const TRANSITIONS: { from: ProjectState; to: ProjectState; cap: Capability }[] = [
  ...T(['INTAKE'], 'BASE_DATA', 'TRANSITION_PRODUCTION'),
  ...T(['BASE_DATA'], 'CONCEPT', 'TRANSITION_PRODUCTION'),
  ...T(['BASE_DATA', 'CONCEPT'], 'DRAFTING', 'TRANSITION_PRODUCTION'),
  ...T(['DRAFTING'], 'ENGINEERING', 'TRANSITION_PRODUCTION'),
  ...T(['DRAFTING', 'ENGINEERING', 'REVISION'], 'INTERNAL_QA', 'TRANSITION_PRODUCTION'),
  ...T(['INTERNAL_QA'], 'DRAFTING', 'TRANSITION_PRODUCTION'),
  ...T(['INTERNAL_QA'], 'PE_REVIEW', 'REQUEST_PE_REVIEW'),
  ...T(['PE_REVIEW'], 'REVISION_REQUIRED', 'PROFESSIONAL_APPROVE'),
  ...T(['PE_REVIEW'], 'APPROVED_FOR_ISSUANCE', 'PROFESSIONAL_APPROVE'),
  ...T(['REVISION_REQUIRED'], 'DRAFTING', 'TRANSITION_PRODUCTION'),
  ...T(['REVISION_REQUIRED'], 'ENGINEERING', 'TRANSITION_PRODUCTION'),
  ...T(['APPROVED_FOR_ISSUANCE'], 'READY_FOR_SEAL', 'MARK_READY_FOR_SEAL'),
  ...T(['READY_FOR_SEAL'], 'SIGNED_SEALED', 'SIGN_SEAL'),
  ...T(['READY_FOR_SEAL'], 'REISSUED', 'SIGN_SEAL'),
  ...T(['SIGNED_SEALED', 'REISSUED'], 'SUBMITTED', 'SUBMIT_TO_AHJ'),
  ...T(['SUBMITTED'], 'AHJ_COMMENTS', 'RECORD_AHJ_RESPONSE'),
  ...T(['SUBMITTED'], 'APPROVED', 'RECORD_AHJ_RESPONSE'),
  ...T(['AHJ_COMMENTS'], 'REVISION', 'TRANSITION_PRODUCTION'),
]

export interface TransitionGate {
  /** Unresolved ERROR-severity findings (rules not overridden, QA errors). */
  blockingFindings: number
  /** An issuance record for the CURRENT revision with a document hash. */
  hasIssuanceForCurrentRevision: boolean
  /** The issuance is executed (signed document hash recorded). */
  issuanceExecuted: boolean
  /** The project has been submitted before (a re-seal is a REISSUE). */
  previouslySubmitted: boolean
}

export function checkTransition(actor: Actor, project: AuthzProject, from: ProjectState, to: ProjectState, gate: TransitionGate, at = new Date()): AuthzResult {
  const t = TRANSITIONS.find(x => x.from === from && x.to === to)
  if (!t) return { allowed: false, reason: `No transition ${from} → ${to}.` }
  const a = authorize(actor, t.cap, project, at)
  if (!a.allowed) return a
  if (to === 'PE_REVIEW' && gate.blockingFindings > 0) return { allowed: false, reason: `${gate.blockingFindings} blocking finding(s) are unresolved — internal QA has not passed.` }
  if (to === 'APPROVED_FOR_ISSUANCE' && gate.blockingFindings > 0) return { allowed: false, reason: 'Blocking findings remain; approve only a plan with every error resolved or professionally overridden.' }
  if (to === 'READY_FOR_SEAL' && !gate.hasIssuanceForCurrentRevision) return { allowed: false, reason: 'Prepare the issuance document for the current revision first — the seal attaches to a hashed document.' }
  if ((to === 'SIGNED_SEALED' || to === 'REISSUED') && !gate.issuanceExecuted) return { allowed: false, reason: 'No executed signature is recorded for the current revision.' }
  if (to === 'SIGNED_SEALED' && gate.previouslySubmitted) return { allowed: false, reason: 'This project has been submitted before; a re-sealed set is REISSUED.' }
  if (to === 'REISSUED' && !gate.previouslySubmitted) return { allowed: false, reason: 'Nothing was issued before; this is SIGNED_SEALED.' }
  return a
}

/**
 * The state after an accepted change to the model. Any change after a
 * professional acted voids that act: the approval, the seal and the issuance
 * were of a different revision.
 */
export function stateAfterMutation(state: ProjectState): { state: ProjectState; invalidatesIssuance: boolean } {
  if (state === 'APPROVED_FOR_ISSUANCE' || state === 'READY_FOR_SEAL' || state === 'SIGNED_SEALED' || state === 'REISSUED' || state === 'PE_REVIEW') {
    return { state: 'REVISION_REQUIRED', invalidatesIssuance: state !== 'PE_REVIEW' }
  }
  if (state === 'SUBMITTED' || state === 'AHJ_COMMENTS' || state === 'APPROVED') return { state: 'REVISION', invalidatesIssuance: true }
  if (state === 'INTAKE' || state === 'BASE_DATA') return { state: 'DRAFTING', invalidatesIssuance: false }
  return { state, invalidatesIssuance: false }
}

/** What the plan may honestly be called in its current state. */
export function honestLabel(state: ProjectState, opts: { aiGenerated: boolean; engineeringChecksPassed: boolean; fieldVerificationOutstanding: boolean }): string {
  switch (state) {
    case 'SIGNED_SEALED': case 'REISSUED': return 'SIGNED/SEALED'
    case 'APPROVED_FOR_ISSUANCE': case 'READY_FOR_SEAL': return 'APPROVED FOR ISSUANCE'
    case 'SUBMITTED': case 'AHJ_COMMENTS': return 'SUBMITTED — NOT APPROVED BY THE JURISDICTION'
    case 'APPROVED': return 'APPROVED BY THE JURISDICTION'
    case 'PE_REVIEW': return 'PROFESSIONAL REVIEW IN PROGRESS'
    case 'INTERNAL_QA': return opts.fieldVerificationOutstanding ? 'FIELD VERIFICATION REQUIRED' : 'READY FOR PROFESSIONAL REVIEW'
    case 'REVISION_REQUIRED': case 'REVISION': return 'PROFESSIONAL REVIEW REQUIRED'
    default:
      if (opts.engineeringChecksPassed) return 'ENGINEERING CHECK COMPLETE'
      return opts.aiGenerated ? 'AI GENERATED' : 'DRAFT'
  }
}

/** Copilot modes and the capability each needs. None of them seal. */
export const COPILOT_MODES = ['ASK', 'DRAFT', 'EDIT', 'CALCULATE', 'CHECK', 'EXPLAIN', 'OPTIMIZE', 'REDLINE', 'ISSUE'] as const
export type CopilotMode = typeof COPILOT_MODES[number]
export const MODE_CAPABILITY: Record<CopilotMode, Capability> = {
  ASK: 'VIEW_PROJECT', EXPLAIN: 'VIEW_PROJECT', CHECK: 'RUN_CHECKS', CALCULATE: 'RUN_CALCULATION',
  DRAFT: 'PROPOSE_CHANGE', EDIT: 'PROPOSE_CHANGE', OPTIMIZE: 'PROPOSE_CHANGE', REDLINE: 'CREATE_REDLINE',
  ISSUE: 'MARK_READY_FOR_SEAL',
}
/** Modes that may return proposed mutations. ASK, EXPLAIN, CHECK and CALCULATE never do. */
export const MUTATING_MODES: ReadonlySet<CopilotMode> = new Set(['DRAFT', 'EDIT', 'OPTIMIZE', 'REDLINE'])
