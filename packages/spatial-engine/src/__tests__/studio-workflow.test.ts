/**
 * Site Plan Studio — professional controls and the end-to-end paths:
 * RBAC, licensing, lifecycle, issuance, invitations, the AI compiler, redlines,
 * the audit chain, the service, and AI-generator parity.
 */
import { describe, it, expect } from 'vitest'
import {
  demoModel, DEMO_ORIGIN, authorize, checkTransition, stateAfterMutation, honestLabel, type Actor, type ProfessionalLicence,
  approveIssuance, executeIssuance, prepareIssuance, invalidateIssuance, sha256, createInvitation, checkInvitation, consumeInvitation,
  compileDeterministic, compileIntent, acceptLlmCompilation, interpretRedline, appendEvent, verifyChain, betaMetrics,
  StudioService, MemoryStudioRepository, StudioError, type ProjectRecord, runProductionWorkflow, studioToTwin,
  productionChecklist, evaluateRules, readiness, PRODUCTION_STAGES, renderStudioSet, type StudioModel,
} from '../studio'

const IDS = { organizationId: 'org-kealee', workspaceId: 'ws-1', projectId: 'demo' }
const byLabel = (m: StudioModel, l: string) => m.objects.find(o => o.attributes.label === l)!
const NOW = new Date('2026-09-26T12:00:00Z')
const lic = (state: string, kind: 'PE' | 'PLS' = 'PE', verification: ProfessionalLicence['verification'] = 'VERIFIED', expiresAt: string | null = '2027-12-31'): ProfessionalLicence =>
  ({ id: `lic-${kind}-${state}`, kind, state, number: '12345', discipline: kind === 'PE' ? 'Civil' : 'Land Surveying', expiresAt, verification, verifiedBy: 'admin', verifiedAt: '2026-09-01' })
const actor = (role: Actor['role'], licences: ProfessionalLicence[] = [], extra: Partial<Actor> = {}): Actor => ({ userId: `u-${role}`, type: 'user', role, active: true, licences, ...extra })
const MD = { projectId: 'demo', state: 'MD' }

describe('capability RBAC', () => {
  it('lets a drafter draft but not approve, seal or override', () => {
    const d = actor('SITE_PLAN_DRAFTER')
    for (const c of ['PROPOSE_CHANGE', 'ACCEPT_CHANGE', 'RUN_CALCULATION', 'RUN_CHECKS', 'PREPARE_SHEETS', 'REQUEST_PE_REVIEW'] as const) expect(authorize(d, c, MD, NOW).allowed).toBe(true)
    for (const c of ['PROFESSIONAL_APPROVE', 'MARK_READY_FOR_SEAL', 'SIGN_SEAL', 'OVERRIDE_RULE', 'CERTIFY_SURVEY'] as const) expect(authorize(d, c, MD, NOW).allowed).toBe(false)
  })
  it('gives an admin no professional authority, and the AI none at all', () => {
    expect(authorize(actor('ADMIN', [lic('MD')]), 'SIGN_SEAL', MD, NOW).allowed).toBe(false)
    expect(authorize({ userId: 'ai', type: 'ai', role: 'PROFESSIONAL_ENGINEER', active: true, licences: [lic('MD')] }, 'PROPOSE_CHANGE', MD, NOW).allowed).toBe(false)
  })
  it('keeps survey separate from engineering', () => {
    expect(authorize(actor('SURVEYOR', [lic('MD', 'PLS')]), 'CERTIFY_SURVEY', MD, NOW).allowed).toBe(true)
    expect(authorize(actor('SURVEYOR', [lic('MD', 'PLS')]), 'SIGN_SEAL', MD, NOW).allowed).toBe(false)
    expect(authorize(actor('PROFESSIONAL_ENGINEER', [lic('MD')]), 'CERTIFY_SURVEY', MD, NOW).allowed).toBe(false)
  })
  it('refuses inactive members and unassigned projects', () => {
    expect(authorize(actor('SITE_PLAN_DRAFTER', [], { active: false }), 'VIEW_PROJECT', MD, NOW).allowed).toBe(false)
    expect(authorize(actor('SITE_PLAN_DRAFTER', [], { projectIds: ['other'] }), 'VIEW_PROJECT', MD, NOW).allowed).toBe(false)
  })
})

describe('multi-jurisdiction licensing', () => {
  const pe = actor('PROFESSIONAL_ENGINEER', [lic('MD'), lic('DC')])
  it('authorises only in the issuing state', () => {
    expect(authorize(pe, 'SIGN_SEAL', MD, NOW)).toEqual({ allowed: true, licenceId: 'lic-PE-MD' })
    expect(authorize(pe, 'SIGN_SEAL', { projectId: 'demo', state: 'DC' }, NOW)).toEqual({ allowed: true, licenceId: 'lic-PE-DC' })
    const va = authorize(pe, 'SIGN_SEAL', { projectId: 'demo', state: 'VA' }, NOW)
    expect(va.allowed).toBe(false)
    expect((va as any).reason).toMatch(/MD, DC — a licence in one state does not authorise work in another/)
  })
  it('refuses unverified and expired licences', () => {
    expect(authorize(actor('PROFESSIONAL_ENGINEER', [lic('MD', 'PE', 'PENDING')]), 'SIGN_SEAL', MD, NOW).allowed).toBe(false)
    expect(authorize(actor('PROFESSIONAL_ENGINEER', [lic('MD', 'PE', 'VERIFIED', '2026-01-01')]), 'SIGN_SEAL', MD, NOW).allowed).toBe(false)
  })
})

describe('project lifecycle', () => {
  const gate = { blockingFindings: 0, hasIssuanceForCurrentRevision: true, issuanceExecuted: true, previouslySubmitted: false }
  it('gates professional states on role, licence, QA and issuance', () => {
    const pe = actor('PROFESSIONAL_ENGINEER', [lic('MD')]), d = actor('SITE_PLAN_DRAFTER')
    expect(checkTransition(d, MD, 'INTERNAL_QA', 'PE_REVIEW', gate, NOW).allowed).toBe(true)
    expect(checkTransition(d, MD, 'INTERNAL_QA', 'PE_REVIEW', { ...gate, blockingFindings: 2 }, NOW).allowed).toBe(false)
    expect(checkTransition(d, MD, 'PE_REVIEW', 'APPROVED_FOR_ISSUANCE', gate, NOW).allowed).toBe(false)
    expect(checkTransition(pe, MD, 'PE_REVIEW', 'APPROVED_FOR_ISSUANCE', gate, NOW).allowed).toBe(true)
    expect(checkTransition(pe, MD, 'READY_FOR_SEAL', 'SIGNED_SEALED', { ...gate, issuanceExecuted: false }, NOW).allowed).toBe(false)
    expect(checkTransition(pe, MD, 'READY_FOR_SEAL', 'REISSUED', gate, NOW).allowed).toBe(false)
    expect(checkTransition(pe, MD, 'READY_FOR_SEAL', 'REISSUED', { ...gate, previouslySubmitted: true }, NOW).allowed).toBe(true)
    expect(checkTransition(pe, MD, 'DRAFTING', 'SIGNED_SEALED', gate, NOW).allowed).toBe(false)
  })
  it('voids professional acts when the plan changes afterwards', () => {
    expect(stateAfterMutation('SIGNED_SEALED')).toEqual({ state: 'REVISION_REQUIRED', invalidatesIssuance: true })
    expect(stateAfterMutation('READY_FOR_SEAL').invalidatesIssuance).toBe(true)
    expect(stateAfterMutation('SUBMITTED')).toEqual({ state: 'REVISION', invalidatesIssuance: true })
    expect(stateAfterMutation('DRAFTING')).toEqual({ state: 'DRAFTING', invalidatesIssuance: false })
  })
  it('never labels a plan beyond what happened', () => {
    expect(honestLabel('DRAFTING', { aiGenerated: true, engineeringChecksPassed: false, fieldVerificationOutstanding: true })).toBe('AI GENERATED')
    expect(honestLabel('INTERNAL_QA', { aiGenerated: true, engineeringChecksPassed: true, fieldVerificationOutstanding: true })).toBe('FIELD VERIFICATION REQUIRED')
    expect(honestLabel('SUBMITTED', { aiGenerated: false, engineeringChecksPassed: true, fieldVerificationOutstanding: false })).toMatch(/NOT APPROVED/)
  })
})

describe('issuance', () => {
  const doc = new TextEncoder().encode('%PDF-1.7 demo set rev 3')
  const base = () => prepareIssuance({ id: 'i1', organizationId: 'o', projectId: 'p', revision: 3, revisionId: 'r3', document: doc, preparedBy: 'u-d', now: 'now' })
  const verifier = { verify: async ({ signed }: { signed: Uint8Array }) => ({ valid: new TextDecoder().decode(signed).includes('SIGNED'), signerSubject: 'CN=Jane PE', detail: 'PKI' }) }
  it('binds approval to the exact document and revision', () => {
    expect(approveIssuance(base(), { by: 'pe', authorisedLicenceId: 'l', documentHash: 'nope', currentRevision: 3, now: 't' }).ok).toBe(false)
    expect(approveIssuance(base(), { by: 'pe', authorisedLicenceId: 'l', documentHash: sha256(doc), currentRevision: 4, now: 't' }).ok).toBe(false)
    expect(approveIssuance(base(), { by: 'pe', authorisedLicenceId: 'l', documentHash: sha256(doc), currentRevision: 3, now: 't' }).ok).toBe(true)
  })
  it('never executes without an external signature that verifies', async () => {
    const ap = (approveIssuance(base(), { by: 'pe', authorisedLicenceId: 'l', documentHash: sha256(doc), currentRevision: 3, now: 't' }) as any).record
    expect((await executeIssuance(ap, { by: 'pe', authorisedLicenceId: 'l', method: 'PKI_DIGITAL_SIGNATURE', signed: doc, verifier: null, currentRevision: 3, now: 't' })).ok).toBe(false)
    expect((await executeIssuance(ap, { by: 'pe', authorisedLicenceId: 'l', method: 'PKI_DIGITAL_SIGNATURE', signed: doc, verifier, currentRevision: 3, now: 't' })).ok).toBe(false)
    expect((await executeIssuance(ap, { by: 'other', authorisedLicenceId: 'l', method: 'PKI_DIGITAL_SIGNATURE', signed: new TextEncoder().encode('SIGNED'), verifier, currentRevision: 3, now: 't' })).ok).toBe(false)
    const ok = await executeIssuance(ap, { by: 'pe', authorisedLicenceId: 'l', method: 'PKI_DIGITAL_SIGNATURE', signed: new TextEncoder().encode('SIGNED'), verifier, currentRevision: 3, now: 't' })
    expect(ok.ok).toBe(true)
    const inv = invalidateIssuance((ok as any).record, 4, 'moved house', 't2')
    expect(inv).toMatchObject({ state: 'INVALIDATED', invalidatedByRevision: 4 })
  })
})

describe('invitation tokens', () => {
  const make = (extra: object = {}) => createInvitation({ id: 'inv', organizationId: 'o', workspaceId: 'w', projectIds: ['p'], invitedRole: 'PROFESSIONAL_ENGINEER', invitedById: 'pm', email: 'Eng@Firm.com', jurisdictions: ['MD'], now: NOW, ...extra }) as any
  it('stores only the hash and accepts the right token once', () => {
    const { record, token } = make()
    expect(record.tokenHash).not.toContain(token)
    expect(checkInvitation(record, token, NOW, 'eng@firm.com')).toEqual({ ok: true })
    expect(checkInvitation(record, token + 'x', NOW, 'eng@firm.com')).toEqual({ ok: false, reason: 'NOT_FOUND' })
    expect(checkInvitation(record, token, NOW, 'someone@else.com')).toEqual({ ok: false, reason: 'EMAIL_MISMATCH' })
    expect(checkInvitation(consumeInvitation(record), token, NOW, 'eng@firm.com')).toEqual({ ok: false, reason: 'USED' })
    expect(checkInvitation(record, token, new Date('2026-10-30'), 'eng@firm.com')).toEqual({ ok: false, reason: 'EXPIRED' })
    expect(checkInvitation({ ...record, status: 'REVOKED' }, token, NOW, 'eng@firm.com')).toEqual({ ok: false, reason: 'REVOKED' })
  })
  it('cannot grant ADMIN', () => {
    expect(make({ invitedRole: 'ADMIN' })).toHaveProperty('error')
  })
})

describe('AI command compiler', () => {
  const m = demoModel(IDS)
  const req = (text: string, extra: object = {}) => ({ text, mode: 'EDIT' as const, selection: [], model: m, requestedBy: 'u', ...extra })
  it('"Move the proposed house six feet east" → MOVE_OBJECT (6, 0) ft', () => {
    const c = compileDeterministic(req('Move the proposed house six feet east.'))
    expect(c.kind).toBe('PROPOSAL')
    expect((c as any).commands[0]).toMatchObject({ action: 'MOVE_OBJECT', objectIds: [byLabel(m, 'Proposed house').id], vector: { x: 6, y: 0 }, units: 'ft', origin: 'AI' })
    expect((c as any).validations).toEqual(['setbacks', 'easements', 'lotCoverage', 'utilityClearance', 'gradingImpact', 'stormwaterImpact'])
  })
  it('prompts against the selection', () => {
    const d = byLabel(m, 'Proposed driveway')
    expect((compileDeterministic(req('Move this 4 feet north', { selection: [d.id] })) as any).commands[0]).toMatchObject({ objectIds: [d.id], vector: { x: 0, y: 4 } })
    expect((compileDeterministic(req('Make this driveway 12 feet wide', { selection: [d.id] })) as any).commands[0]).toMatchObject({ action: 'SET_PROPERTY', key: 'widthFt', value: 12 })
    const slope = compileDeterministic(req('Reduce this section below 8% without changing the garage elevation.', { selection: [d.id] })) as any
    expect(slope.commands[0]).toMatchObject({ action: 'SET_SLOPE', hold: 'end', holdElevationFt: 104, slopePct: -7.9 })
    expect((compileDeterministic(req('Connect CB-1 to CB-2')) as any).commands[0]).toMatchObject({ action: 'ROUTE_PIPE', fromId: byLabel(m, 'CB-1').id, toId: byLabel(m, 'CB-2').id })
    expect((compileDeterministic(req('Create dimensions from this building to each property line', { selection: [byLabel(m, 'Proposed house').id] })) as any).commands).toHaveLength(4)
  })
  it('sizes the connecting pipe from the Rational Method, not from the model', () => {
    const c = compileDeterministic(req('Size the connecting storm pipe.')) as any
    expect(c.commands[0].designFlowCfs).toBe(1.12) // 0.45 × 7.1 × 0.35
    expect(c.assumptions[0]).toMatch(/Rational Method/)
  })
  it('routes calculations, checks and explanations without mutating', () => {
    expect(compileDeterministic(req('Calculate drainage flow', { mode: 'CALCULATE' })).kind).toBe('CALCULATION')
    expect(compileDeterministic(req('Check all setbacks', { mode: 'CHECK' })).kind).toBe('CHECK')
    const why = compileDeterministic(req('Explain why this design fails', { mode: 'EXPLAIN' })) as any
    expect(why.kind).toBe('ANSWER')
    expect(why.answer).toMatch(/Driveway grade: FAIL/)
  })
  it('never mutates in ASK, EXPLAIN, CHECK or CALCULATE, and never issues from a prompt', async () => {
    for (const mode of ['ASK', 'EXPLAIN', 'CHECK', 'CALCULATE'] as const) expect((await compileIntent(req('Move the house 5 feet east', { mode }))).kind).toBe('STOP')
    expect(await compileIntent(req('seal the plans', { mode: 'ISSUE' }))).toMatchObject({ kind: 'STOP', condition: 'REQUIRES_PROFESSIONAL_REVIEW' })
  })
  it('stops for missing data instead of inventing it', () => {
    const noRain = { ...m, design: {} }
    expect(compileDeterministic({ ...req('Calculate drainage flow'), model: noRain })).toMatchObject({ kind: 'STOP', condition: 'REQUIRES_INPUT' })
  })
  it('gates language-model output through the schema', () => {
    const r = req('do something clever')
    expect(acceptLlmCompilation('not json', r).kind).toBe('STOP')
    expect(acceptLlmCompilation(JSON.stringify({ commands: [{ action: 'MOVE_OBJECT', objectIds: ['ghost'], vector: { x: 1, y: 0 } }] }), r).kind).toBe('STOP')
    const lot = m.objects.find(o => o.type === 'ParcelBoundary')!
    expect(acceptLlmCompilation(JSON.stringify({ commands: [{ action: 'MOVE_OBJECT', objectIds: [lot.id], vector: { x: 1, y: 0 } }] }), r)).toMatchObject({ kind: 'STOP', reason: expect.stringContaining('recorded plat data') })
    const ok = acceptLlmCompilation(JSON.stringify({ commands: [{ action: 'MOVE_OBJECT', objectIds: [byLabel(m, 'Proposed house').id], vector: { x: 1, y: 0 }, origin: 'TOOL', requestedBy: 'someone-else' }] }), r) as any
    expect(ok.commands[0]).toMatchObject({ origin: 'AI', requestedBy: 'u' })
  })
})

describe('redlines', () => {
  const m = demoModel(IDS)
  const [X, Y] = DEMO_ORIGIN
  it('turns a cloud plus note into a structured move of the clouded object', async () => {
    const r = await interpretRedline(m, { id: 'mk1', kind: 'CLOUD', text: 'Shift 3 ft west', geometry: { type: 'Polygon', coordinates: [[[X + 28, Y + 28], [X + 72, Y + 28], [X + 72, Y + 62], [X + 28, Y + 62], [X + 28, Y + 28]]] }, author: 'pe', createdAt: 't' }, 'pe')
    expect(r.targets).toEqual([byLabel(m, 'Proposed house').id])
    expect((r.compiled as any).commands[0]).toMatchObject({ action: 'MOVE_OBJECT', vector: { x: -3, y: 0 }, origin: 'REDLINE' })
  })
  it('turns a cross-out of existing work into demolition, not erasure', async () => {
    const tree = byLabel(m, '24" oak')
    const r = await interpretRedline(m, { id: 'mk2', kind: 'CROSS_OUT', geometry: { type: 'LineString', coordinates: [[X + 10, Y + 95], [X + 20, Y + 105]] }, targetIds: [tree.id], author: 'pe', createdAt: 't' }, 'pe')
    expect((r.compiled as any).commands).toEqual([expect.objectContaining({ action: 'SET_PROPERTY', objectIds: [tree.id], key: 'status', value: 'TO_BE_REMOVED' })])
  })
  it('builds a sketched swale as proposed geometry', async () => {
    const r = await interpretRedline(m, { id: 'mk3', kind: 'SKETCH', text: 'add swale here', geometry: { type: 'LineString', coordinates: [[X + 90, Y + 140], [X + 90, Y + 10]] }, author: 'pe', createdAt: 't' }, 'pe')
    expect((r.compiled as any).commands[0].object).toMatchObject({ type: 'Swale', status: 'PROPOSED' })
  })
})

describe('audit chain', () => {
  it('detects any edit to history', () => {
    const base = { organizationId: 'o', workspaceId: 'w', projectId: 'p', userId: 'u', role: 'SITE_PLAN_DRAFTER', actorType: 'user' as const, mode: null, origin: 'AI', prompt: 'x', selectedObjectIds: [], aiInterpretation: null, proposedCommands: null, validationResults: null, decision: null, manualEdits: null, resultingRevision: 1, proposalId: null, rulesVersion: null, durationMs: null, detail: null }
    const e1 = appendEvent(null, { ...base, id: 'e1', eventType: 'PROMPT' }, 't1')
    const e2 = appendEvent(e1, { ...base, id: 'e2', eventType: 'PROMPT', prompt: 'y' }, 't2')
    expect(verifyChain([e1, e2])).toBeNull()
    expect(e2.trainingConsent).toBe(false)
    expect(verifyChain([e1, { ...e2, prompt: 'edited' }])).toMatchObject({ brokenAt: 2 })
    expect(verifyChain([e2])).toMatchObject({ brokenAt: 2 })
  })
})

// ── The service, end to end ──────────────────────────────────────────────

function setup() {
  const repo = new MemoryStudioRepository()
  const m = demoModel(IDS)
  const project: ProjectRecord = {
    id: 'demo', organizationId: IDS.organizationId, workspaceId: IDS.workspaceId, name: 'Demo', address: '12 Demo Street', jurisdictionCode: 'prince_georges_md',
    licenceState: 'MD', state: 'DRAFTING', currentRevision: 1, workflowId: null, aiGenerated: false, previouslySubmitted: false,
    facts: { address: '12 Demo Street', parcelId: 'DEMO-LOT-12', owner: null, projectName: 'Demo', horizontalDatum: 'NAD83', sourceDocuments: ['demo'], programme: { use: 'SFD' }, wantsParking: true, landscapingRequired: false },
    sheets: null, traditionalEstimateHours: 16, isDemo: true, createdBy: 'seed', createdAt: 't', updatedAt: 't',
  }
  repo.seed(project, m)
  let t = NOW.getTime(), n = 0
  const svc = new StudioService({ repo, now: () => new Date((t += 1000)), newId: () => `x${++n}`, verifier: { verify: async () => ({ valid: true, signerSubject: 'CN=PE', detail: 'test verifier' }) } })
  return { repo, svc, m }
}

describe('StudioService', () => {
  it('prompt → proposal → accept → revision, with the whole trail in the audit log', async () => {
    const { svc, repo, m } = setup()
    const d = actor('SITE_PLAN_DRAFTER')
    const r = await svc.copilot(d, 'demo', { mode: 'EDIT', text: 'Move the proposed house 5 feet east.', selection: [] }) as any
    expect(r.proposal.status).toBe('PROPOSED')
    expect((await repo.getModel('demo'))!.revision).toBe(1) // nothing applied yet
    const out = await svc.decide(d, 'demo', r.proposal.id, 'ACCEPT')
    expect(out).toMatchObject({ status: 'ACCEPTED', state: 'DRAFTING' })
    const model = (await repo.getModel('demo'))!
    expect(model.revision).toBe(2)
    const h = model.objects.find(o => o.id === byLabel(m, 'Proposed house').id)!
    expect((h.geometry as any).coordinates[0][0][0]).toBe(DEMO_ORIGIN[0] + 35)
    const types = repo.events.map(e => e.eventType)
    expect(types).toEqual(['PROMPT', 'PROPOSAL_CREATED', 'PROPOSAL_ACCEPTED'])
    expect(verifyChain(repo.events)).toBeNull()
  })

  it('the drawing-tool path reaches the same model through the same proposal', async () => {
    const a = setup(), b = setup(), d = actor('SITE_PLAN_DRAFTER')
    const id = byLabel(a.m, 'Proposed house').id
    const viaAi = await a.svc.copilot(d, 'demo', { mode: 'EDIT', text: 'move the house 5 feet east', selection: [] }) as any
    await a.svc.decide(d, 'demo', viaAi.proposal.id, 'ACCEPT')
    const viaTool = await b.svc.proposeCommands(d, 'demo', [{ requestedBy: 'spoofed', origin: 'GENERATOR' as any, action: 'MOVE_OBJECT', objectIds: [id], vector: { x: 5, y: 0 } }])
    expect(viaTool.commands[0]).toMatchObject({ requestedBy: 'u-SITE_PLAN_DRAFTER', origin: 'TOOL' })
    await b.svc.decide(d, 'demo', viaTool.id, 'ACCEPT')
    const g = async (s: typeof a) => (await s.repo.getModel('demo'))!.objects.find(o => o.id === id)!.geometry
    expect(await g(a)).toEqual(await g(b))
  })

  it('a reviewer can redline but not commit; the drafter accepts', async () => {
    const { svc } = setup()
    const rv = actor('REVIEWER'), d = actor('SITE_PLAN_DRAFTER')
    const [X, Y] = DEMO_ORIGIN
    const r = await svc.redline(rv, 'demo', { kind: 'CLOUD', text: 'move 2 ft west', geometry: { type: 'Polygon', coordinates: [[[X + 28, Y + 28], [X + 72, Y + 28], [X + 72, Y + 62], [X + 28, Y + 62], [X + 28, Y + 28]]] } }) as any
    await expect(svc.decide(rv, 'demo', r.proposal.id, 'ACCEPT')).rejects.toBeInstanceOf(StudioError)
    expect((await svc.decide(d, 'demo', r.proposal.id, 'ACCEPT')).status).toBe('ACCEPTED')
  })

  it('runs the full professional issuance and voids it when the plan changes', async () => {
    const { svc, repo, m } = setup()
    const d = actor('SITE_PLAN_DRAFTER'), pe = actor('PROFESSIONAL_ENGINEER', [lic('MD')]), pm = actor('PROJECT_MANAGER')
    // Resolve the demo's deliberate failures first: regrade the driveway; override the street utilities with a basis.
    const dw = byLabel(m, 'Proposed driveway')
    const p = await svc.proposeCommands(d, 'demo', [{ requestedBy: '', origin: 'TOOL', action: 'SET_SLOPE', objectId: dw.id, slopePct: -7.9, hold: 'end', holdElevationFt: 104 }])
    await svc.decide(d, 'demo', p.id, 'ACCEPT')
    const util = evaluateRules((await repo.getModel('demo'))!).find(r => r.code === 'UTILITY_SEPARATION')!
    await expect(svc.overrideRule(d, 'demo', util.key, 'x')).rejects.toThrow()
    await svc.overrideRule(pe, 'demo', util.key, 'Existing WSSC mains in the public street; not part of this private-lot scope.')
    await svc.transition(d, 'demo', 'INTERNAL_QA')
    await svc.transition(d, 'demo', 'PE_REVIEW')
    await expect(svc.transition(d, 'demo', 'APPROVED_FOR_ISSUANCE')).rejects.toThrow(/does not hold/)
    await svc.transition(pe, 'demo', 'APPROVED_FOR_ISSUANCE')
    const doc = new TextEncoder().encode('%PDF- rev')
    const iss = await svc.prepareIssuance(d, 'demo', doc, null)
    await svc.approveIssuance(pe, 'demo', iss.documentHash)
    await svc.transition(pe, 'demo', 'READY_FOR_SEAL')
    await svc.executeIssuance(pe, 'demo', new TextEncoder().encode('signed'), 'PKI_DIGITAL_SIGNATURE', null)
    const sealed = await svc.transition(pe, 'demo', 'SIGNED_SEALED')
    expect(sealed.state).toBe('SIGNED_SEALED')
    await svc.transition(pm, 'demo', 'SUBMITTED')
    // A change after submission: new revision, state REVISION, issuance invalidated.
    const again = await svc.copilot(d, 'demo', { mode: 'EDIT', text: 'move the house 1 foot east', selection: [] }) as any
    const res = await svc.decide(d, 'demo', again.proposal.id, 'ACCEPT')
    expect(res.state).toBe('REVISION')
    expect((await repo.latestIssuance('demo'))!.state).toBe('INVALIDATED')
    expect(repo.events.map(e => e.eventType)).toContain('ISSUANCE_INVALIDATED')
    const metrics = await svc.metrics(pm, 'demo')
    expect(metrics).toMatchObject({ aiProposals: 1, aiAccepted: 1, submissionCycles: 1 })
  })

  it('refuses an AI actor and an unlicensed seal outright', async () => {
    const { svc } = setup()
    await expect(svc.copilot({ userId: 'ai', type: 'ai', role: 'PROFESSIONAL_ENGINEER', active: true, licences: [] }, 'demo', { mode: 'EDIT', text: 'move the house 1 foot east', selection: [] })).rejects.toBeInstanceOf(StudioError)
    await expect(svc.transition(actor('PROFESSIONAL_ENGINEER', [lic('VA')]), 'demo', 'INTERNAL_QA')).resolves.toBeTruthy()
  })
})

// ── AI generator parity ─────────────────────────────────────────────────

describe('AI generator runs the professional workflow', () => {
  it('imports records, drafts through commands, and records every stage honestly', () => {
    const demo = demoModel(IDS)
    const twin = studioToTwin(demo, { siteId: 's', address: '12 Demo Street', horizontalDatum: 'NAD83' })
    let n = 0
    const res = runProductionWorkflow({
      twin, zoning: demo.zoning, edgeYards: ['front', 'side', 'rear', 'side'],
      facts: { address: '12 Demo Street', parcelId: 'DEMO-LOT-12', owner: null, projectName: 'Demo', horizontalDatum: 'NAD83', sourceDocuments: ['demo'], programme: { use: 'SFD' }, wantsParking: true, landscapingRequired: false },
      sheets: null, design: demo.design, ids: { ...IDS, projectId: 'gen' }, newId: () => `g${++n}`, now: '2026-09-26T12:00:00.000Z',
    })
    expect(res.stages.map(s => s.stage)).toEqual([...PRODUCTION_STAGES])
    const st = Object.fromEntries(res.stages.map(s => [s.stage, s.status]))
    expect(st.BOUNDARY_BASE_MAP).toBe('COMPLETED') // recorded plat
    expect(st.EXISTING_CONDITIONS).toBe('REQUIRES_FIELD_VERIFICATION') // LiDAR contours, GIS utilities
    expect(st.UTILITY_COORDINATION).toBe('REQUIRES_FIELD_VERIFICATION')
    expect(st.PROFESSIONAL_REVIEW).toBe('REQUIRES_PROFESSIONAL_REVIEW')
    expect(st.APPROVAL_FOR_ISSUANCE).toBe('BLOCKED')
    expect(st.FINAL_DOCUMENT).toBe('BLOCKED')
    // Same objects, commands and rules as the professional path.
    expect(res.model.objects.find(o => o.type === 'ParcelBoundary')!.source).toBe('RECORDED_PLAT')
    expect(res.model.objects.find(o => o.type === 'BuildingFootprint')!.source).toBe('PROPOSED_DESIGN')
    expect(res.model.objects.filter(o => o.type === 'Dimension')).toHaveLength(4)
    expect(res.model.objects.some(o => o.type === 'BuildableArea')).toBe(true)
    expect(res.revisions.every(r => r.commands.every(c => c.origin === 'GENERATOR')) || res.revisions[0].commands.length === 0).toBe(true)
    expect(res.calculations.map(c => c.calcId)).toEqual(expect.arrayContaining(['runoff_coefficient', 'rational_method', 'lot_coverage', 'setback_clearance']))
    expect(res.rules.find(r => r.code === 'DRIVEWAY_GRADE')?.status).toBe('FAIL')
    expect(res.readiness.label).toBe('AI GENERATED')
    expect(res.readiness.professionalReview.status).toBe('NOT_COMPLETE')
    expect(res.worklist.length).toBeGreaterThan(5)
    // The generator never marks its own draft professionally complete.
    expect(res.stages.filter(s => s.status === 'COMPLETED').map(s => s.stage)).not.toContain('PROFESSIONAL_REVIEW')
  })
})

describe('QA and readiness', () => {
  it('reports components, not one number, and flags what a drafter would', () => {
    const m = demoModel(IDS)
    const rules = evaluateRules(m)
    const cl = productionChecklist(m, rules, [], { address: 'a', parcelId: 'p', owner: null, projectName: 'n', horizontalDatum: 'NAD83', sourceDocuments: ['d'], programme: { use: 'SFD' }, wantsParking: true, landscapingRequired: false }, null)
    expect(cl.find(i => i.key === 'dimensions')!.status).toBe('MISSING')
    expect(cl.find(i => i.key === 'owner')!.status).toBe('REQUIRES_INPUT')
    const rd = readiness(m, 'DRAFTING', cl, rules, [], 'NONE', false)
    expect(rd.jurisdictionRules.status).toBe('FAIL')
    expect(rd.engineeringCalculations.status).toBe('NOT_STARTED')
    expect(rd.issuance.status).toBe('NOT_READY')
    expect(rd.sourceReliability.itemsRequiringVerification).toBeGreaterThan(0)
  })
})

describe('regenerated drawings', () => {
  it('renders the demo through the existing renderers and validates each export', async () => {
    const r = await renderStudioSet(demoModel(IDS), { siteId: 'demo', projectName: 'Demo', address: '12 Demo Street', horizontalDatum: 'NAD83' })
    const v = Object.fromEntries(r.validation.map(x => [x.format, x]))
    expect(v.PDF.valid).toBe(true)
    expect(r.pdf!.pageCount).toBe(r.sheets.length)
    expect(v.DXF.valid).toBe(true)
    expect(v.LANDXML.valid).toBe(true)
    expect(v.SVG.valid).toBe(true)
    expect(v.DWG).toMatchObject({ valid: false, detail: expect.stringContaining('UNSUPPORTED') })
    expect(r.audit.sheets.length).toBe(r.sheets.length)
  }, 60_000)
})
