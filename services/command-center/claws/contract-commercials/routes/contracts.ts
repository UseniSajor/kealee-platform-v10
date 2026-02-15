import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';

export function contractRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // =====================================================================
    // Contracts
    // =====================================================================

    // List contracts
    fastify.get('/', async (request) => {
      const { projectId, status } = request.query as {
        projectId?: string;
        status?: string;
      };

      const contracts = await prisma.contract.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(status && { status }),
        },
        include: {
          agreements: { orderBy: { version: 'desc' }, take: 1 },
          changeOrders: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: contracts };
    });

    // Get single contract with full details
    fastify.get('/:id', async (request) => {
      const { id } = request.params as { id: string };

      const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          agreements: { orderBy: { version: 'desc' } },
          changeOrders: {
            include: {
              lineItems: true,
              approvals: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          payments: { orderBy: { createdAt: 'desc' } },
          scheduledPayments: { orderBy: { sortOrder: 'asc' } },
        },
      });

      if (!contract) {
        return { error: 'Contract not found', statusCode: 404 };
      }

      return { data: contract };
    });

    // Create contract
    fastify.post('/', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        contractorId?: string;
        type?: string;
        totalAmount?: number;
      };

      const contract = await prisma.contract.create({
        data: {
          projectId: body.projectId,
          organizationId: body.organizationId,
          contractorId: body.contractorId ?? null,
          status: 'DRAFT',
          type: body.type ?? 'FIXED_PRICE',
          totalAmount: body.totalAmount ?? 0,
        },
      });

      return { data: contract };
    });

    // Update contract
    fastify.put('/:id', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;

      const contract = await prisma.contract.update({
        where: { id },
        data: body,
      });

      return { data: contract };
    });

    // Execute contract -- queues execution job
    fastify.post('/:id/execute', async (request) => {
      const { id } = request.params as { id: string };

      const contract = await prisma.contract.findUnique({
        where: { id },
      });

      if (!contract) {
        return { error: 'Contract not found', statusCode: 404 };
      }

      if (contract.status !== 'DRAFT' && contract.status !== 'PENDING') {
        return {
          error: `Cannot execute contract in ${contract.status} status`,
          statusCode: 400,
        };
      }

      const queue = createQueue(KEALEE_QUEUES.CONTRACT_ENGINE);
      await queue.add('execute-contract', {
        contractId: id,
        projectId: contract.projectId,
        organizationId: contract.organizationId,
      });

      return { data: { queued: true, contractId: id } };
    });

    // =====================================================================
    // Change Orders
    // =====================================================================

    // List change orders for a contract
    fastify.get('/:id/change-orders', async (request) => {
      const { id } = request.params as { id: string };

      const changeOrders = await prisma.changeOrder.findMany({
        where: { contractId: id },
        include: {
          lineItems: true,
          approvals: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: changeOrders };
    });

    // Get single change order
    fastify.get('/:id/change-orders/:coId', async (request) => {
      const { coId } = request.params as { id: string; coId: string };

      const changeOrder = await prisma.changeOrder.findUnique({
        where: { id: coId },
        include: {
          lineItems: true,
          approvals: true,
        },
      });

      if (!changeOrder) {
        return { error: 'Change order not found', statusCode: 404 };
      }

      return { data: changeOrder };
    });

    // Create change order request
    fastify.post('/:id/change-orders', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        title: string;
        description?: string;
        requestedBy?: string;
        projectId: string;
        organizationId: string;
      };

      const changeOrder = await prisma.changeOrder.create({
        data: {
          contractId: id,
          projectId: body.projectId,
          organizationId: body.organizationId,
          title: body.title,
          description: body.description ?? '',
          requestedBy: body.requestedBy ?? null,
          status: 'PENDING_EVALUATION',
        },
      });

      // Queue evaluation
      const queue = createQueue(KEALEE_QUEUES.CHANGE_ORDER);
      await queue.add('evaluate-change-order', {
        event: {
          type: 'project.change.requested',
          projectId: body.projectId,
          organizationId: body.organizationId,
          payload: {
            contractId: id,
            changeOrderId: changeOrder.id,
            title: body.title,
            description: body.description,
            requestedBy: body.requestedBy,
          },
        },
      });

      return { data: changeOrder };
    });

    // Approve change order (manual approval for OWNER / WRITTEN_SIGNOFF tiers)
    fastify.post('/:id/change-orders/:coId/approve', async (request) => {
      const { coId } = request.params as { id: string; coId: string };
      const body = request.body as {
        approvedBy: string;
        notes?: string;
      };

      const changeOrder = await prisma.changeOrder.findUnique({
        where: { id: coId },
        include: { approvals: true },
      });

      if (!changeOrder) {
        return { error: 'Change order not found', statusCode: 404 };
      }

      // Update pending approval record
      const pendingApproval = changeOrder.approvals.find(
        (a) => a.status === 'PENDING_OWNER' || a.status === 'PENDING_WRITTEN_SIGNOFF',
      );

      if (pendingApproval) {
        await prisma.changeOrderApproval.update({
          where: { id: pendingApproval.id },
          data: {
            status: 'APPROVED',
            approvedBy: body.approvedBy,
            approvedAt: new Date(),
            notes: body.notes ?? null,
          },
        });
      }

      await prisma.changeOrder.update({
        where: { id: coId },
        data: { status: 'APPROVED' },
      });

      return { data: { approved: true, changeOrderId: coId } };
    });

    // =====================================================================
    // Pay Applications
    // =====================================================================

    // List payments for a contract
    fastify.get('/:id/payments', async (request) => {
      const { id } = request.params as { id: string };

      const payments = await prisma.payment.findMany({
        where: { contractId: id },
        orderBy: { createdAt: 'desc' },
      });

      return { data: payments };
    });

    // Submit pay application
    fastify.post('/:id/pay-apps', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        amount: number;
        payAppNumber: number;
        periodStart?: string;
        periodEnd?: string;
        projectId: string;
        organizationId: string;
      };

      // Queue pay app processing
      const queue = createQueue(KEALEE_QUEUES.PAYMENT);
      await queue.add('process-pay-app', {
        event: {
          type: 'project.payapp.submitted',
          projectId: body.projectId,
          organizationId: body.organizationId,
          payload: {
            contractId: id,
            amount: body.amount,
            payAppNumber: body.payAppNumber,
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
          },
        },
      });

      return {
        data: {
          queued: true,
          contractId: id,
          payAppNumber: body.payAppNumber,
        },
      };
    });

    // Disburse approved payment
    fastify.post('/:id/payments/:paymentId/disburse', async (request) => {
      const { paymentId } = request.params as {
        id: string;
        paymentId: string;
      };

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return { error: 'Payment not found', statusCode: 404 };
      }

      if (payment.status !== 'APPROVED' && payment.status !== 'RETAINAGE_CALCULATED') {
        return {
          error: `Cannot disburse payment in ${payment.status} status`,
          statusCode: 400,
        };
      }

      const queue = createQueue(KEALEE_QUEUES.PAYMENT);
      await queue.add('disburse-payment', {
        paymentId,
        projectId: payment.projectId,
        organizationId: payment.organizationId,
      });

      return { data: { queued: true, paymentId } };
    });

    // Get scheduled payments for a contract
    fastify.get('/:id/scheduled-payments', async (request) => {
      const { id } = request.params as { id: string };

      const scheduledPayments = await prisma.scheduledPayment.findMany({
        where: { contractId: id },
        orderBy: { sortOrder: 'asc' },
      });

      return { data: scheduledPayments };
    });
  };
}
