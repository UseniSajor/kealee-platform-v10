/**
 * enterprise.service.ts — Enterprise/B2B Platform Layer
 * Portfolio organizations, team roles, feature flags, entitlements, partner integrations.
 */
import { prisma } from '../../lib/prisma'
import { randomUUID } from 'node:crypto'
import { isHomeownerRole } from '../../middleware/tenant-context'
import type {
  CreatePortfolioOrgBody,
  UpdatePortfolioOrgBody,
  InviteTeamMemberBody,
  UpdateTeamMemberRoleBody,
  SetFeatureFlagBody,
  CheckFeatureFlagBody,
  RegisterPartnerBody,
  GrantEntitlementBody,
  PortfolioOrgDto,
  TeamMemberDto,
  FeatureFlagDto,
  EntitlementDto,
  PartnerDto,
} from './enterprise.dto'

const db = prisma

// ─── Portfolio Orgs ───────────────────────────────────────────────────────────

export async function listPortfolioOrgs(userId: string): Promise<PortfolioOrgDto[]> {
  const memberships = await db.orgMember.findMany({
    where: { userId },
    include: {
      org: {
        include: {
          _count: { select: { members: true, projects: true } },
        },
      },
    },
  })
  return memberships.map((m: any) => mapOrg(m.org))
}

export async function getPortfolioOrg(orgId: string, userId: string): Promise<PortfolioOrgDto> {
  const membership = await db.orgMember.findFirst({
    where: { orgId, userId },
    include: {
      org: { include: { _count: { select: { members: true, projects: true } } } },
    },
  })
  if (!membership) throw Object.assign(new Error('Organization not found or no access'), { statusCode: 404 })
  return mapOrg(membership.org)
}

export async function createPortfolioOrg(
  body: CreatePortfolioOrgBody,
  creatorId: string,
): Promise<PortfolioOrgDto> {
  rejectUnsupportedOrgSettings(body)
  const creator = await db.user.findUnique({ where: { id: creatorId }, select: { role: true, status: true } })
  if (!creator || creator.status !== 'ACTIVE' || isHomeownerRole(creator.role)) {
    throw Object.assign(new Error('Active professional account required'), { statusCode: 403 })
  }
  const org = await db.$transaction(async (tx) => {
    await tx.role.upsert({ where: { key: 'org_owner' }, create: { key: 'org_owner', name: 'Organization owner' }, update: {} })
    const created = await tx.org.create({
      data: { name: body.name, slug: `org-${randomUUID()}`, logo: body.logoUrl, description: body.notes },
    })
    // Auto-add creator as OWNER
    await tx.orgMember.create({
      data: { orgId: created.id, userId: creatorId, roleKey: 'org_owner' },
    })
    return tx.org.findUniqueOrThrow({
      where: { id: created.id },
      include: { _count: { select: { members: true, projects: true } } },
    })
  })
  return mapOrg(org)
}

export async function updatePortfolioOrg(
  orgId: string,
  body: UpdatePortfolioOrgBody,
  userId: string,
): Promise<PortfolioOrgDto> {
  await _requireOrgRole(orgId, userId, ['OWNER', 'ADMIN'])
  rejectUnsupportedOrgSettings(body)
  const org = await db.org.update({
    where: { id: orgId },
    data: { name: body.name, logo: body.logoUrl, description: body.notes },
    include: { _count: { select: { members: true, projects: true } } },
  })
  return mapOrg(org)
}

// ─── Team Membership ──────────────────────────────────────────────────────────

export async function listTeamMembers(orgId: string, requesterId: string): Promise<TeamMemberDto[]> {
  await _requireOrgRole(orgId, requesterId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR', 'FINANCE', 'VIEWER'])
  const members = await db.orgMember.findMany({
    where: { orgId },
    include: { user: { select: { email: true } } },
    orderBy: { joinedAt: 'asc' },
  })
  return members.map(mapMember)
}

export async function inviteTeamMember(body: InviteTeamMemberBody, inviterId: string): Promise<TeamMemberDto> {
  await _requireOrgRole(body.orgId, inviterId, ['OWNER', 'ADMIN'])

  // Find or pre-register user by email
  const user = await db.user.findUnique({ where: { email: body.email }, select: { id: true, email: true, role: true, status: true } })
  if (!user) throw Object.assign(new Error('User not found — they must register first'), { statusCode: 404 })
  if (user.status !== 'ACTIVE' || isHomeownerRole(user.role)) {
    throw Object.assign(new Error('Homeowners receive project access, not organization membership'), { statusCode: 403 })
  }
  rejectProjectRestrictions(body.projectIds)
  if (body.role === 'OWNER') throw Object.assign(new Error('Ownership transfer requires a separate operation'), { statusCode: 422 })

  const existing = await db.orgMember.findFirst({ where: { orgId: body.orgId, userId: user.id } })
  if (existing) throw Object.assign(new Error('User is already a member'), { statusCode: 409 })

  const roleKey = await ensureOrgRole(body.role)
  const member = await db.orgMember.create({
    data: {
      orgId: body.orgId,
      userId: user.id,
      roleKey,
    },
    include: { user: { select: { email: true } } },
  })
  return mapMember(member)
}

export async function updateTeamMemberRole(
  orgId: string,
  memberId: string,
  body: UpdateTeamMemberRoleBody,
  requesterId: string,
): Promise<TeamMemberDto> {
  await _requireOrgRole(orgId, requesterId, ['OWNER', 'ADMIN'])
  rejectProjectRestrictions(body.projectIds)
  const existing = await db.orgMember.findFirst({ where: { id: memberId, orgId } })
  if (!existing) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  if (normalizeRole(existing.roleKey) === 'OWNER' || body.role === 'OWNER') {
    throw Object.assign(new Error('Ownership transfer requires a separate operation'), { statusCode: 422 })
  }
  const roleKey = await ensureOrgRole(body.role)
  const member = await db.orgMember.update({
    where: { id: memberId, orgId },
    data: { roleKey },
    include: { user: { select: { email: true } } },
  })
  return mapMember(member)
}

export async function removeTeamMember(orgId: string, memberId: string, requesterId: string): Promise<void> {
  await _requireOrgRole(orgId, requesterId, ['OWNER', 'ADMIN'])
  const member = await db.orgMember.findFirst({ where: { id: memberId, orgId } })
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  if (normalizeRole(member.roleKey) === 'OWNER') throw Object.assign(new Error('Cannot remove org owner'), { statusCode: 422 })
  await db.orgMember.delete({ where: { id: memberId, orgId } })
}

// ─── Feature Flags ────────────────────────────────────────────────────────────

export async function setFeatureFlag(body: SetFeatureFlagBody): Promise<FeatureFlagDto> {
  if (body.scope !== 'GLOBAL' && !body.scopeId) throw Object.assign(new Error('scopeId required'), { statusCode: 400 })
  const flag = { ...body, scopeId: body.scope === 'GLOBAL' ? null : body.scopeId ?? null,
    rolloutPercent: body.rolloutPercent ?? null, expiresAt: body.expiresAt ?? null }
  const key = `enterprise.flag:${JSON.stringify([flag.flagKey, flag.scope, flag.scopeId])}`
  await db.systemConfig.upsert({
    where: { key },
    create: { key, value: flag, category: 'enterprise.flags', dataType: 'json', isPublic: false },
    update: { value: flag },
  })
  return mapFlag(flag)
}

export async function checkFeatureFlag(body: CheckFeatureFlagBody): Promise<boolean> {
  const now = new Date()

  // Check most-specific scope first, then broader
  const candidates = (await listFeatureFlags()).filter(flag => flag.flagKey === body.flagKey && (
    (flag.scope === 'USER' && !!body.userId && flag.scopeId === body.userId) ||
    (flag.scope === 'ORG' && !!body.orgId && flag.scopeId === body.orgId) ||
    (flag.scope === 'MARKET' && !!body.marketCode && flag.scopeId === body.marketCode) || flag.scope === 'GLOBAL'
  ))

  if (!candidates.length) return false

  // Apply specificity: USER > ORG > MARKET > GLOBAL
  const priorityOrder = ['USER', 'ORG', 'MARKET', 'GLOBAL']
  const sorted = candidates
    .filter((f: any) => !f.expiresAt || new Date(f.expiresAt) > now)
    .sort((a: any, b: any) => priorityOrder.indexOf(a.scope) - priorityOrder.indexOf(b.scope))

  if (!sorted.length) return false
  const flag = sorted[0]
  if (!flag.enabled) return false

  if (flag.rolloutPercent != null && flag.rolloutPercent < 100) {
    // Simple deterministic rollout based on userId hash
    const hash = body.userId ? simpleHash(body.userId + flag.flagKey) % 100 : 0
    return hash < flag.rolloutPercent
  }

  return flag.enabled
}

export async function listFeatureFlags(scope?: string): Promise<FeatureFlagDto[]> {
  const flags = await db.systemConfig.findMany({
    where: { category: 'enterprise.flags' }, orderBy: { key: 'asc' },
  })
  return flags.map(row => mapFlag(row.value)).filter(flag => !scope || flag.scope === scope)
}

// ─── Entitlements ─────────────────────────────────────────────────────────────

export async function grantEntitlement(body: GrantEntitlementBody): Promise<EntitlementDto> {
  const enabled = ['ACTIVE', 'TRIAL'].includes(body.status)
  const entitlement = await db.moduleEntitlement.upsert({
    where: { orgId_moduleKey: { orgId: body.orgId, moduleKey: body.featureKey } },
    create: {
      orgId: body.orgId, moduleKey: body.featureKey, enabled,
      enabledAt: enabled ? new Date() : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
    update: {
      enabled, enabledAt: enabled ? new Date() : undefined, disabledAt: enabled ? null : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })
  return mapEntitlement(entitlement)
}

export async function listOrgEntitlements(orgId: string): Promise<EntitlementDto[]> {
  const entitlements = await db.moduleEntitlement.findMany({ where: { orgId } })
  return entitlements.map(mapEntitlement)
}

export async function hasEntitlement(orgId: string, featureKey: string): Promise<boolean> {
  const entitlement = await db.moduleEntitlement.findFirst({
    where: {
      orgId,
      moduleKey: featureKey,
      enabled: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  return entitlement !== null
}

// ─── Partner Integrations ─────────────────────────────────────────────────────

export async function registerPartner(body: RegisterPartnerBody): Promise<PartnerDto> {
  if (body.apiKeyHash || body.webhookUrl) throw Object.assign(new Error('Configure partner credentials through integration credential management'), { statusCode: 422 })
  const partner = { ...body, id: randomUUID(), active: true, markets: body.markets ?? [], metadata: body.metadata ?? {} }
  await db.systemConfig.create({
    data: { key: `enterprise.partner:${partner.id}`, value: JSON.parse(JSON.stringify(partner)), category: 'enterprise.partners', dataType: 'json', isPublic: false },
  })
  return mapPartner(partner)
}

export async function listPartners(partnerType?: string): Promise<PartnerDto[]> {
  const partners = await db.systemConfig.findMany({
    where: { category: 'enterprise.partners' }, orderBy: { key: 'asc' },
  })
  return partners.map(row => mapPartner(row.value)).filter(partner => partner.active && (!partnerType || partner.partnerType === partnerType))
}

export async function deactivatePartner(partnerId: string): Promise<void> {
  const key = `enterprise.partner:${partnerId}`
  const existing = await db.systemConfig.findUnique({ where: { key } })
  if (!existing) throw Object.assign(new Error('Partner not found'), { statusCode: 404 })
  await db.systemConfig.update({ where: { key }, data: { value: { ...(existing.value as Record<string, string>), active: false } } })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function _requireOrgRole(orgId: string, userId: string, allowedRoles: string[]): Promise<void> {
  const membership = await db.orgMember.findFirst({ where: { orgId, userId, org: { status: 'ACTIVE' } } })
  if (!membership || !allowedRoles.includes(normalizeRole(membership.roleKey))) {
    throw Object.assign(new Error('Insufficient organization permissions'), { statusCode: 403 })
  }
}

function normalizeRole(role: string): string { return role.toUpperCase().replace(/^ORG_/, '') }
async function ensureOrgRole(role: string): Promise<string> {
  const key = `org_${role.toLowerCase()}`
  await db.role.upsert({ where: { key }, create: { key, name: `Organization ${role.toLowerCase()}` }, update: {} })
  return key
}
function rejectProjectRestrictions(projectIds?: string[]) {
  if (projectIds?.length) throw Object.assign(new Error('Use project sharing for project-limited access'), { statusCode: 422 })
}
function rejectUnsupportedOrgSettings(body: UpdatePortfolioOrgBody) {
  if (body.domain || body.planId) throw Object.assign(new Error('Manage domains and plans in the white-label control plane'), { statusCode: 422 })
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function mapOrg(o: any): PortfolioOrgDto {
  return {
    id: o.id,
    name: o.name,
    domain: o.domain ?? null,
    logoUrl: o.logo ?? null,
    planId: o.planId ?? null,
    memberCount: o._count?.members ?? 0,
    projectCount: o._count?.projects ?? 0,
    createdAt: new Date(o.createdAt).toISOString(),
  }
}

function mapMember(m: any): TeamMemberDto {
  return {
    id: m.id,
    orgId: m.orgId,
    userId: m.userId,
    email: m.user?.email ?? '',
    role: normalizeRole(m.roleKey),
    projectIds: m.projectIds ?? [],
    invitedAt: new Date(m.joinedAt).toISOString(),
    joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : null,
  }
}

function mapFlag(f: any): FeatureFlagDto {
  return {
    flagKey: f.flagKey,
    enabled: f.enabled,
    scope: f.scope,
    scopeId: f.scopeId ?? null,
    rolloutPercent: f.rolloutPercent ?? null,
    expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
  }
}

function mapEntitlement(e: any): EntitlementDto {
  return {
    id: e.id,
    orgId: e.orgId,
    featureKey: e.moduleKey,
    status: e.expiresAt && new Date(e.expiresAt) <= new Date() ? 'EXPIRED' : e.enabled ? 'ACTIVE' : 'CANCELLED',
    expiresAt: e.expiresAt ? new Date(e.expiresAt).toISOString() : null,
  }
}

function mapPartner(p: any): PartnerDto {
  return {
    id: p.id,
    name: p.name,
    partnerType: p.partnerType,
    active: p.active,
    markets: p.markets ?? [],
    contactEmail: p.contactEmail ?? null,
  }
}
