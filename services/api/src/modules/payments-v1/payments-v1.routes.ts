/**
 * Payments v1 Routes — registered in main API gateway at /api/v1/payments
 * Proxies to os-pay service or runs inline during transition
 */

import { FastifyInstance } from 'fastify';
import { prismaAny as prisma } from '../../utils/prisma-helper';

export async function paymentsV1Routes(fastify: FastifyInstance) {
  // ── Milestone Payments ──

  fastify.get('/projects/:projectId/milestones', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: { payments: true },
      orderBy: { orderIndex: 'asc' },
    });

    return { milestones };
  });

  fastify.post('/projects/:projectId/milestones/:milestoneId/pay', async (request, reply) => {
    const { projectId, milestoneId } = request.params as { projectId: string; milestoneId: string };
    const body = request.body as { amount: number; method?: string };

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!milestone) return reply.status(404).send({ error: 'Milestone not found' });

    const payment = await prisma.payment.create({
      data: {
        milestoneId,
        projectId,
        amount: body.amount,
        status: 'pending',
        method: body.method || 'stripe',
      },
    });

    return reply.status(201).send(payment);
  });

  // ── Escrow Management ──

  fastify.get('/projects/:projectId/escrow', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const escrow = await prisma.escrowAccount.findFirst({
      where: { projectId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });

    if (!escrow) return reply.status(404).send({ error: 'No escrow account for this project' });
    return escrow;
  });

  fastify.post('/projects/:projectId/escrow/deposit', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const body = request.body as { amount: number; description?: string };

    const escrow = await prisma.escrowAccount.findFirst({ where: { projectId } });
    if (!escrow) return reply.status(404).send({ error: 'No escrow account' });

    const transaction = await prisma.escrowTransaction.create({
      data: {
        escrowAccountId: escrow.id,
        type: 'deposit',
        amount: body.amount,
        description: body.description || 'Deposit',
        status: 'completed',
      },
    });

    await prisma.escrowAccount.update({
      where: { id: escrow.id },
      data: { balance: { increment: body.amount } },
    });

    return reply.status(201).send(transaction);
  });

  // ── Draw Requests ──

  fastify.get('/projects/:projectId/draws', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const draws = await prisma.drawSchedule.findMany({
      where: { projectId },
      orderBy: { drawNumber: 'asc' },
    });

    return { draws };
  });

  fastify.post('/projects/:projectId/draws', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      drawNumber: number;
      amount: number;
      description: string;
    };

    const draw = await prisma.drawSchedule.create({
      data: {
        projectId,
        drawNumber: body.drawNumber,
        amount: body.amount,
        description: body.description,
        status: 'DRAFT',
      },
    });

    return reply.status(201).send(draw);
  });

  // ── Lien Waivers ──

  fastify.get('/projects/:projectId/lien-waivers', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const waivers = await prisma.lienWaiver.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return { waivers };
  });

  // ── Financial Summary ──

  fastify.get('/projects/:projectId/summary', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const [payments, escrow, draws] = await Promise.all([
      prisma.payment.aggregate({
        where: { projectId, status: 'completed' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.escrowAccount.findFirst({
        where: { projectId },
        select: { balance: true },
      }),
      prisma.drawSchedule.findMany({
        where: { projectId },
        select: { amount: true, status: true },
      }),
    ]);

    return {
      projectId,
      totalPaid: payments._sum.amount || 0,
      paymentCount: payments._count,
      escrowBalance: escrow?.balance || 0,
      draws: {
        total: draws.length,
        funded: draws.filter((d: any) => d.status === 'FUNDED').length,
        totalRequested: draws.reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
      },
    };
  });

  // ── Reconciliation ──

  fastify.get('/reconciliation', async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const reconciliations = await prisma.escrowReconciliation.findMany({
      where,
      orderBy: { reconciliationDate: 'desc' },
      take: 20,
    });

    return { reconciliations };
  });

  fastify.post('/reconciliation', async (request, reply) => {
    const body = request.body as {
      projectId: string;
      expectedBalance: number;
      actualBalance: number;
      notes?: string;
    };

    const discrepancy = body.actualBalance - body.expectedBalance;

    const rec = await prisma.escrowReconciliation.create({
      data: {
        projectId: body.projectId,
        reconciliationDate: new Date(),
        expectedBalance: body.expectedBalance,
        actualBalance: body.actualBalance,
        discrepancy,
        status: Math.abs(discrepancy) < 0.01 ? 'MATCHED' : 'DISCREPANCY',
        notes: body.notes,
        reconciledById: 'system',
      },
    });

    return reply.status(201).send(rec);
  });
}
