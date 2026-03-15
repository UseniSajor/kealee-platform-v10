/**
 * engagement-exec.routes.ts
 * Prefix: /engagement-exec
 * Change orders, milestone approvals, escrow releases, disputes.
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../middleware/auth'
import {
  CreateChangeOrderDto,
  RespondChangeOrderDto,
  SubmitMilestoneDto,
  ApproveMilestoneDto,
  OpenDisputeDto,
  ResolveDisputeDto,
  ReleaseEscrowDto,
} from './engagement-exec.dto'
import {
  createChangeOrder,
  listChangeOrders,
  respondToChangeOrder,
  submitMilestone,
  approveMilestone,
  releaseMilestonePayment,
  openDispute,
  resolveDispute,
  getEscrowState,
} from './engagement-exec.service'

export async function engagementExecRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser)

  // ─── Change Orders ──────────────────────────────────────────────────────────

  /** POST /engagement-exec/change-orders — create change order */
  fastify.post('/change-orders', async (request, reply) => {
    const user = (request as any).user
    const body = CreateChangeOrderDto.parse(request.body)
    const co = await createChangeOrder(user.id, body)
    return reply.status(201).send({ changeOrder: co })
  })

  /** GET /engagement-exec/change-orders/:contractId — list for contract */
  fastify.get('/change-orders/:contractId', async (request, reply) => {
    const user = (request as any).user
    const { contractId } = request.params as { contractId: string }
    const orders = await listChangeOrders(contractId, user.id)
    return reply.send({ changeOrders: orders })
  })

  /** POST /engagement-exec/change-orders/:id/respond — approve/reject/counter */
  fastify.post('/change-orders/:id/respond', async (request, reply) => {
    const user = (request as any).user
    const { id } = request.params as { id: string }
    const body = RespondChangeOrderDto.parse(request.body)
    const co = await respondToChangeOrder(id, user.id, body)
    return reply.send({ changeOrder: co })
  })

  // ─── Milestone Execution ────────────────────────────────────────────────────

  /** POST /engagement-exec/milestones/submit — contractor submits milestone */
  fastify.post('/milestones/submit', async (request, reply) => {
    const user = (request as any).user
    const body = SubmitMilestoneDto.parse(request.body)
    const result = await submitMilestone(user.id, body)
    return reply.send({ milestone: result })
  })

  /** POST /engagement-exec/milestones/approve — owner approves/rejects */
  fastify.post('/milestones/approve', async (request, reply) => {
    const user = (request as any).user
    const body = ApproveMilestoneDto.parse(request.body)
    const result = await approveMilestone(user.id, body)
    return reply.send({ milestone: result })
  })

  /** POST /engagement-exec/milestones/release — owner releases payment */
  fastify.post('/milestones/release', async (request, reply) => {
    const user = (request as any).user
    const body = ReleaseEscrowDto.parse(request.body)
    const result = await releaseMilestonePayment(user.id, body)
    return reply.send(result)
  })

  // ─── Escrow State ───────────────────────────────────────────────────────────

  /** GET /engagement-exec/escrow/:contractId — escrow state + recent tx */
  fastify.get('/escrow/:contractId', async (request, reply) => {
    const user = (request as any).user
    const { contractId } = request.params as { contractId: string }
    const state = await getEscrowState(contractId, user.id)
    if (!state) return reply.status(404).send({ error: 'Escrow not found for this contract' })
    return reply.send({ escrow: state })
  })

  // ─── Disputes ───────────────────────────────────────────────────────────────

  /** POST /engagement-exec/disputes — open a dispute */
  fastify.post('/disputes', async (request, reply) => {
    const user = (request as any).user
    const body = OpenDisputeDto.parse(request.body)
    const dispute = await openDispute(user.id, body)
    return reply.status(201).send({ dispute })
  })

  /** POST /engagement-exec/disputes/:id/resolve — admin/mediator resolves */
  fastify.post('/disputes/:id/resolve', async (request, reply) => {
    const user = (request as any).user
    const { id } = request.params as { id: string }
    const body = ResolveDisputeDto.parse(request.body)
    const dispute = await resolveDispute(id, user.id, body)
    return reply.send({ dispute })
  })

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({ error: error.message, statusCode })
  })
}
