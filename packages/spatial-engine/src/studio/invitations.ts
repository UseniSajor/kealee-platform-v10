/**
 * Professional invitation tokens.
 *
 * The token is 256 bits of randomness, shown ONCE in the link; only its
 * SHA-256 is stored. A leaked database therefore leaks no usable link. An
 * invitation is bound to an organisation, optionally a workspace and project,
 * one role (never ADMIN), an expiry, a use limit and, when set, an email.
 */

import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import { INVITABLE_ROLES, type StudioRole } from './access'

export interface InvitationRecord {
  id: string
  organizationId: string
  workspaceId: string | null
  projectIds: string[]
  invitedRole: StudioRole
  invitedById: string
  email: string | null
  tokenHash: string
  expiresAt: string
  maxUses: number
  uses: number
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  jurisdictions: string[]
  createdAt: string
}

export function newInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashToken(token) }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function createInvitation(input: Omit<InvitationRecord, 'tokenHash' | 'uses' | 'status' | 'createdAt' | 'maxUses' | 'expiresAt'> & { now: Date; ttlDays?: number; maxUses?: number }):
  { record: InvitationRecord; token: string } | { error: string } {
  if (!INVITABLE_ROLES.includes(input.invitedRole)) return { error: `${input.invitedRole} cannot be granted by invitation.` }
  const ttl = Math.min(Math.max(input.ttlDays ?? 7, 1), 30)
  const { token, tokenHash } = newInvitationToken()
  return {
    token,
    record: {
      id: input.id, organizationId: input.organizationId, workspaceId: input.workspaceId, projectIds: input.projectIds,
      invitedRole: input.invitedRole, invitedById: input.invitedById, email: input.email?.trim().toLowerCase() || null,
      tokenHash, expiresAt: new Date(input.now.getTime() + ttl * 86400_000).toISOString(),
      maxUses: Math.max(1, Math.min(input.maxUses ?? 1, 25)), uses: 0, status: 'PENDING', jurisdictions: input.jurisdictions,
      createdAt: input.now.toISOString(),
    },
  }
}

export type InvitationCheck = { ok: true } | { ok: false; reason: 'NOT_FOUND' | 'EXPIRED' | 'USED' | 'REVOKED' | 'EMAIL_MISMATCH' }

/** Checks a presented token against a stored record. Constant-time hash comparison. */
export function checkInvitation(rec: InvitationRecord | null, token: string, now: Date, userEmail?: string | null): InvitationCheck {
  if (!rec) return { ok: false, reason: 'NOT_FOUND' }
  const a = Buffer.from(rec.tokenHash, 'hex'), b = Buffer.from(hashToken(token), 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'NOT_FOUND' }
  if (rec.status === 'REVOKED') return { ok: false, reason: 'REVOKED' }
  if (new Date(rec.expiresAt).getTime() < now.getTime()) return { ok: false, reason: 'EXPIRED' }
  if (rec.uses >= rec.maxUses || rec.status === 'ACCEPTED' && rec.maxUses === 1) return { ok: false, reason: 'USED' }
  if (rec.email && (userEmail ?? '').trim().toLowerCase() !== rec.email) return { ok: false, reason: 'EMAIL_MISMATCH' }
  return { ok: true }
}

export function consumeInvitation(rec: InvitationRecord): InvitationRecord {
  const uses = rec.uses + 1
  return { ...rec, uses, status: uses >= rec.maxUses ? 'ACCEPTED' : rec.status }
}

/** Whether a role must hold a verified licence before its membership activates. */
export function roleRequiresLicence(role: StudioRole): 'PE' | 'PLS' | null {
  return role === 'PROFESSIONAL_ENGINEER' ? 'PE' : role === 'SURVEYOR' ? 'PLS' : null
}

/** The onboarding checklist shown after acceptance. Steps are completed by events, not by clicking "done". */
export const ONBOARDING_STEPS = [
  { key: 'CONFIRM_PROFILE', label: 'Confirm profile' },
  { key: 'CONFIRM_FIRM', label: 'Confirm firm' },
  { key: 'ADD_LICENCES', label: 'Add and verify licences' },
  { key: 'SELECT_DISCIPLINES', label: 'Select disciplines' },
  { key: 'WORKSPACE_TUTORIAL', label: 'Review the workspace tutorial' },
  { key: 'OPEN_DEMO', label: 'Open the demo project' },
  { key: 'GUIDED_DRAFTING', label: 'Complete a guided drafting action' },
  { key: 'AI_PROMPT', label: 'Complete an AI-prompt action' },
  { key: 'ENGINEERING_CHECK', label: 'Run an engineering check' },
  { key: 'REVIEW_HISTORY', label: 'Review revision history' },
  { key: 'FIRST_PROJECT', label: 'Complete your first assigned project' },
] as const
