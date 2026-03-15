/**
 * enterprise.service.ts — Enterprise/B2B Platform Layer
 * Portfolio organizations, team roles, feature flags, entitlements, partner integrations.
 */
import prisma from '../../lib/prisma'
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

const db = prisma as any

// ─── Portfolio Orgs ───────────────────────────────────────────────────────────

export async function listPortfolioOrgs(userId: string): Promise<PortfolioOrgDto[]> {
  const memberships = await db.teamMembership.findMany({
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
  const membership = await db.teamMembership.findFirst({
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
  const org = await db.$transaction(async (tx: any) => {
    const created = await tx.portfolioOrg.create({
      data: { ...body, ownerId: creatorId },
    })
    // Auto-add creator as OWNER
    await tx.teamMembership.create({
      data: { orgId: created.id, userId: creatorId, role: 'OWNER', joinedAt: new Date() },
    })
    return tx.portfolioOrg.findUnique({
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
  const org = await db.portfolioOrg.update({
    where: { id: orgId },
    data: body,
    include: { _count: { select: { members: true, projects: true } } },
  })
  return mapOrg(org)
}

// ─── Team Membership ──────────────────────────────────────────────────────────

export async function listTeamMembers(orgId: string, requesterId: string): Promise<TeamMemberDto[]> {
  await _requireOrgRole(orgId, requesterId, ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR', 'FINANCE', 'VIEWER'])
  const members = await db.teamMembership.findMany({
    where: { orgId },
    include: { user: { select: { email: true } } },
    orderBy: { invitedAt: 'asc' },
  })
  return members.map(mapMember)
}

export async function inviteTeamMember(body: InviteTeamMemberBody, inviterId: string): Promise<TeamMemberDto> {
  await _requireOrgRole(body.orgId, inviterId, ['OWNER', 'ADMIN'])

  // Find or pre-register user by email
  const user = await db.user.findUnique({ where: { email: body.email }, select: { id: true, email: true } })
  if (!user) throw Object.assign(new Error('User not found — they must register first'), { statusCode: 404 })

  const existing = await db.teamMembership.findFirst({ where: { orgId: body.orgId, userId: user.id } })
  if (existing) throw Object.assign(new Error('User is already a member'), { statusCode: 409 })

  const member = await db.teamMembership.create({
    data: {
      orgId: body.orgId,
      userId: user.id,
      role: body.role,
      projectIds: body.projectIds ?? [],
      invitedAt: new Date(),
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
  const member = await db.teamMembership.update({
    where: { id: memberId },
    data: { role: body.role, projectIds: body.projectIds },
    include: { user: { select: { email: true } } },
  })
  return mapMember(member)
}

export async function removeTeamMember(orgId: string, memberId: string, requesterId: string): Promise<void> {
  await _requireOrgRole(orgId, requesterId, ['OWNER', 'ADMIN'])
  const member = await db.teamMembership.findFirst({ where: { id: memberId, orgId } })
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  if (member.role === 'OWNER') throw Object.assign(new Error('Cannot remove org owner'), { statusCode: 422 })
  await db.teamMembership.delete({ where: { id: memberId } })
}

// ─── Feature Flags ────────────────────────────────────────────────────────────

export async function setFeatureFlag(body: SetFeatureFlagBody): Promise<FeatureFlagDto> {
  const flag = await db.featureFlag.upsert({
    where: { flagKey_scope_scopeId: { flagKey: body.flagKey, scope: body.scope, scopeId: body.scopeId ?? '' } },
    create: {
      ...body,
      scopeId: body.scopeId ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
    update: {
      enabled: body.enabled,
      rolloutPercent: body.rolloutPercent ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })
  return mapFlag(flag)
}

export async function checkFeatureFlag(body: CheckFeatureFlagBody): Promise<boolean> {
  const now = new Date()

  // Check most-specific scope first, then broader
  const candidates = await db.featureFlag.findMany({
    where: {
      flagKey: body.flagKey,
      OR: [
        { scope: 'USER', scopeId: body.userId ?? '' },
        { scope: 'ORG', scopeId: body.orgId ?? '' },
        { scope: 'MARKET', scopeId: body.marketCode ?? '' },
        { scope: 'GLOBAL', scopeId: '' },
      ],
    },
  })

  if (!candidates.length) return false

  // Apply specificity: USER > ORG > MARKET > GLOBAL
  const priorityOrder = ['USER', 'ORG', 'MARKET', 'GLOBAL']
  const sorted = candidates
    .filter((f: any) => !f.expiresAt || new Date(f.expiresAt) > now)
    .sort((a: any, b: any) => priorityOrder.indexOf(a.scope) - priorityOrder.indexOf(b.scope))

  if (!sorted.length) return false
  const flag = sorted[0]

  if (flag.rolloutPercent != null && flag.rolloutPercent < 100) {
    // Simple deterministic rollout based on userId hash
    const hash = body.userId ? simpleHash(body.userId + flag.flagKey) % 100 : 0
    return hash < flag.rolloutPercent
  }

  return flag.enabled
}

export async function listFeatureFlags(scope?: string): Promise<FeatureFlagDto[]> {
  const flags = await db.featureFlag.findMany({
    where: scope ? { scope } : undefined,
    orderBy: [{ flagKey: 'asc' }, { scope: 'asc' }],
  })
  return flags.map(mapFlag)
}

// ─── Entitlements ─────────────────────────────────────────────────────────────

export async function grantEntitlement(body: GrantEntitlementBody): Promise<EntitlementDto> {
  const entitlement = await db.orgEntitlement.upsert({
    where: { orgId_featureKey: { orgId: body.orgId, featureKey: body.featureKey } },
    create: {
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      metadata: body.metadata ?? {},
    },
    update: {
      status: body.status,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })
  return mapEntitlement(entitlement)
}

export async function listOrgEntitlements(orgId: string): Promise<EntitlementDto[]> {
  const entitlements = await db.orgEntitlement.findMany({ where: { orgId } })
  return entitlements.map(mapEntitlement)
}

export async function hasEntitlement(orgId: string, featureKey: string): Promise<boolean> {
  const entitlement = await db.orgEntitlement.findFirst({
    where: {
      orgId,
      featureKey,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  return entitlement !== null
}

// ─── Partner Integrations ─────────────────────────────────────────────────────

export async function registerPartner(body: RegisterPartnerBody): Promise<PartnerDto> {
  const partner = await db.partnerIntegration.create({
    data: { ...body, active: true, markets: body.markets ?? [], metadata: body.metadata ?? {} },
  })
  return mapPartner(partner)
}

export async function listPartners(partnerType?: string): Promise<PartnerDto[]> {
  const partners = await db.partnerIntegration.findMany({
    where: { active: true, ...(partnerType ? { partnerType } : {}) },
    orderBy: { name: 'asc' },
  })
  return partners.map(mapPartner)
}

export async function deactivatePartner(partnerId: string): Promise<void> {
  await db.partnerIntegration.update({ where: { id: partnerId }, data: { active: false } })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function _requireOrgRole(orgId: string, userId: string, allowedRoles: string[]): Promise<void> {
  const membership = await db.teamMembership.findFirst({ where: { orgId, userId } })
  if (!membership || !allowedRoles.includes(membership.role)) {
    throw Object.assign(new Error('Insufficient organization permissions'), { statusCode: 403 })
  }
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
    logoUrl: o.logoUrl ?? null,
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
    role: m.role,
    projectIds: m.projectIds ?? [],
    invitedAt: new Date(m.invitedAt).toISOString(),
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
    featureKey: e.featureKey,
    status: e.status,
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
