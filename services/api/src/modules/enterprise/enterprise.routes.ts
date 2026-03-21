/**
 * enterprise.routes.ts — Enterprise/B2B Platform Layer
 * Prefix: /enterprise
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../../middleware/auth'
import {
  CreatePortfolioOrgDto,
  UpdatePortfolioOrgDto,
  InviteTeamMemberDto,
  UpdateTeamMemberRoleDto,
  SetFeatureFlagDto,
  CheckFeatureFlagDto,
  RegisterPartnerDto,
  GrantEntitlementDto,
} from './enterprise.dto'
import {
  listPortfolioOrgs,
  getPortfolioOrg,
  createPortfolioOrg,
  updatePortfolioOrg,
  listTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  setFeatureFlag,
  checkFeatureFlag,
  listFeatureFlags,
  grantEntitlement,
  listOrgEntitlements,
  hasEntitlement,
  registerPartner,
  listPartners,
  deactivatePartner,
} from './enterprise.service'

export async function enterpriseRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser)

  // ─── Portfolio Orgs ────────────────────────────────────────────────────────

  /** GET /enterprise/orgs */
  fastify.get('/orgs', async (request, reply) => {
    const user = (request as any).user
    const orgs = await listPortfolioOrgs(user.id)
    return reply.send({ orgs })
  })

  /** POST /enterprise/orgs */
  fastify.post('/orgs', async (request, reply) => {
    const user = (request as any).user
    const body = CreatePortfolioOrgDto.parse(request.body)
    const org = await createPortfolioOrg(body, user.id)
    return reply.status(201).send({ org })
  })

  /** GET /enterprise/orgs/:orgId */
  fastify.get('/orgs/:orgId', async (request, reply) => {
    const user = (request as any).user
    const { orgId } = request.params as { orgId: string }
    const org = await getPortfolioOrg(orgId, user.id)
    return reply.send({ org })
  })

  /** PATCH /enterprise/orgs/:orgId */
  fastify.patch('/orgs/:orgId', async (request, reply) => {
    const user = (request as any).user
    const { orgId } = request.params as { orgId: string }
    const body = UpdatePortfolioOrgDto.parse(request.body)
    const org = await updatePortfolioOrg(orgId, body, user.id)
    return reply.send({ org })
  })

  // ─── Team Membership ───────────────────────────────────────────────────────

  /** GET /enterprise/orgs/:orgId/members */
  fastify.get('/orgs/:orgId/members', async (request, reply) => {
    const user = (request as any).user
    const { orgId } = request.params as { orgId: string }
    const members = await listTeamMembers(orgId, user.id)
    return reply.send({ members })
  })

  /** POST /enterprise/orgs/:orgId/members — invite */
  fastify.post('/orgs/:orgId/members', async (request, reply) => {
    const user = (request as any).user
    const { orgId } = request.params as { orgId: string }
    const body = InviteTeamMemberDto.parse({ ...request.body as object, orgId })
    const member = await inviteTeamMember(body, user.id)
    return reply.status(201).send({ member })
  })

  /** PATCH /enterprise/orgs/:orgId/members/:memberId */
  fastify.patch('/orgs/:orgId/members/:memberId', async (request, reply) => {
    const user = (request as any).user
    const { orgId, memberId } = request.params as { orgId: string; memberId: string }
    const body = UpdateTeamMemberRoleDto.parse(request.body)
    const member = await updateTeamMemberRole(orgId, memberId, body, user.id)
    return reply.send({ member })
  })

  /** DELETE /enterprise/orgs/:orgId/members/:memberId */
  fastify.delete('/orgs/:orgId/members/:memberId', async (request, reply) => {
    const user = (request as any).user
    const { orgId, memberId } = request.params as { orgId: string; memberId: string }
    await removeTeamMember(orgId, memberId, user.id)
    return reply.status(204).send()
  })

  // ─── Feature Flags ─────────────────────────────────────────────────────────

  /** GET /enterprise/flags?scope= */
  fastify.get('/flags', async (request, reply) => {
    const { scope } = request.query as Record<string, string>
    const flags = await listFeatureFlags(scope)
    return reply.send({ flags })
  })

  /** PUT /enterprise/flags */
  fastify.put('/flags', async (request, reply) => {
    const body = SetFeatureFlagDto.parse(request.body)
    const flag = await setFeatureFlag(body)
    return reply.send({ flag })
  })

  /** POST /enterprise/flags/check */
  fastify.post('/flags/check', async (request, reply) => {
    const body = CheckFeatureFlagDto.parse(request.body)
    const enabled = await checkFeatureFlag(body)
    return reply.send({ enabled })
  })

  // ─── Entitlements ──────────────────────────────────────────────────────────

  /** GET /enterprise/orgs/:orgId/entitlements */
  fastify.get('/orgs/:orgId/entitlements', async (request, reply) => {
    const { orgId } = request.params as { orgId: string }
    const entitlements = await listOrgEntitlements(orgId)
    return reply.send({ entitlements })
  })

  /** POST /enterprise/orgs/:orgId/entitlements */
  fastify.post('/orgs/:orgId/entitlements', async (request, reply) => {
    const { orgId } = request.params as { orgId: string }
    const body = GrantEntitlementDto.parse({ ...request.body as object, orgId })
    const entitlement = await grantEntitlement(body)
    return reply.send({ entitlement })
  })

  /** GET /enterprise/orgs/:orgId/entitlements/check?featureKey= */
  fastify.get('/orgs/:orgId/entitlements/check', async (request, reply) => {
    const { orgId } = request.params as { orgId: string }
    const { featureKey } = request.query as Record<string, string>
    if (!featureKey) return reply.status(400).send({ error: 'featureKey required' })
    const has = await hasEntitlement(orgId, featureKey)
    return reply.send({ has })
  })

  // ─── Partner Integrations ──────────────────────────────────────────────────

  /** GET /enterprise/partners?partnerType= */
  fastify.get('/partners', async (request, reply) => {
    const { partnerType } = request.query as Record<string, string>
    const partners = await listPartners(partnerType)
    return reply.send({ partners })
  })

  /** POST /enterprise/partners */
  fastify.post('/partners', async (request, reply) => {
    const body = RegisterPartnerDto.parse(request.body)
    const partner = await registerPartner(body)
    return reply.status(201).send({ partner })
  })

  /** DELETE /enterprise/partners/:partnerId */
  fastify.delete('/partners/:partnerId', async (request, reply) => {
    const { partnerId } = request.params as { partnerId: string }
    await deactivatePartner(partnerId)
    return reply.status(204).send()
  })

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({ error: error.message, statusCode })
  })
}
