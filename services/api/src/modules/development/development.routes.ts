/**
 * OS-Dev Routes — registered in main API gateway
 * Capital stacks, draws, investor reports, entitlements
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function developmentRoutes(fastify: FastifyInstance) {
  // ── Capital Stacks ───────────────────────────────────────

  fastify.post('/capital-stacks', async (request, reply) => {
    const body = request.body as any;
    const stack = await prisma.capitalStack.create({
      data: {
        projectId: body.projectId,
        orgId: body.orgId,
        totalCapital: body.totalCapital,
        seniorDebt: body.seniorDebt ?? 0,
        mezzanineDebt: body.mezzanineDebt ?? 0,
        preferredEquity: body.preferredEquity ?? 0,
        commonEquity: body.commonEquity ?? 0,
        grants: body.grants ?? 0,
        otherSources: body.otherSources ?? 0,
        notes: body.notes,
      },
      include: { sources: true },
    });
    return reply.code(201).send({ capitalStack: stack });
  });

  fastify.get('/capital-stacks/:projectId', async (request, reply) => {
    const { projectId } = request.params as any;
    const stack = await prisma.capitalStack.findUnique({
      where: { projectId },
      include: { sources: true, drawSchedules: { orderBy: { drawNumber: 'asc' } } },
    });
    if (!stack) return reply.code(404).send({ error: 'Capital stack not found' });
    return reply.send({ capitalStack: stack });
  });

  // ── Capital Sources ──────────────────────────────────────

  fastify.post('/capital-stacks/:id/sources', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const source = await prisma.capitalSource.create({
      data: {
        capitalStackId: id,
        sourceType: body.sourceType,
        lenderName: body.lenderName,
        commitmentAmount: body.commitmentAmount,
        remainingAmount: body.commitmentAmount,
        contactInfo: body.contactInfo,
        interestRate: body.interestRate,
        term: body.term,
        amortization: body.amortization,
        ioPeriod: body.ioPeriod,
        origFee: body.origFee,
        maturityDate: body.maturityDate,
        notes: body.notes,
        documentUrl: body.documentUrl,
        status: 'PENDING',
      },
    });
    return reply.code(201).send({ source });
  });

  // ── Draw Schedules ───────────────────────────────────────

  fastify.post('/capital-stacks/:id/draws', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const draw = await prisma.drawSchedule.create({
      data: {
        capitalStackId: id,
        drawNumber: body.drawNumber,
        requestedAmount: body.requestedAmount,
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        lineItems: body.lineItems,
        notes: body.notes,
        status: 'DRAFT',
      },
    });
    return reply.code(201).send({ draw });
  });

  fastify.get('/capital-stacks/:id/draws', async (request, reply) => {
    const { id } = request.params as any;
    const draws = await prisma.drawSchedule.findMany({
      where: { capitalStackId: id },
      orderBy: { drawNumber: 'asc' },
    });
    return reply.send({ draws });
  });

  fastify.post('/draws/:id/submit', async (request, reply) => {
    const { id } = request.params as any;
    const draw = await prisma.drawSchedule.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
    return reply.send({ draw });
  });

  fastify.post('/draws/:id/approve', async (request, reply) => {
    const { id } = request.params as any;
    const { approvedBy, approvedAmount, retainage } = request.body as any;
    const draw = await prisma.drawSchedule.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAmount,
        retainage: retainage ?? 0,
        netDisbursement: approvedAmount - (retainage ?? 0),
        approvedAt: new Date(),
        approvedBy,
        reviewedAt: new Date(),
        reviewedBy: approvedBy,
      },
    });
    return reply.send({ draw });
  });

  fastify.post('/draws/:id/fund', async (request, reply) => {
    const { id } = request.params as any;
    const draw = await prisma.drawSchedule.update({
      where: { id },
      data: { status: 'FUNDED', fundedAt: new Date() },
    });
    return reply.send({ draw });
  });

  // ── Investor Reports ─────────────────────────────────────

  fastify.post('/investor-reports', async (request, reply) => {
    const body = request.body as any;
    const report = await prisma.investorReport.create({
      data: {
        projectId: body.projectId,
        orgId: body.orgId,
        reportType: body.reportType,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        title: body.title,
        totalInvested: body.totalInvested,
        totalSpent: body.totalSpent,
        budgetRemaining: body.budgetRemaining,
        overallCompletion: body.overallCompletion,
        narrative: body.narrative,
        highlights: body.highlights,
        risks: body.risks,
        nextSteps: body.nextSteps,
        status: 'DRAFT',
      },
    });
    return reply.code(201).send({ report });
  });

  fastify.get('/investor-reports/:projectId', async (request, reply) => {
    const { projectId } = request.params as any;
    const reports = await prisma.investorReport.findMany({
      where: { projectId },
      orderBy: { periodEnd: 'desc' },
      take: 20,
    });
    return reply.send({ reports });
  });

  fastify.post('/investor-reports/:id/publish', async (request, reply) => {
    const { id } = request.params as any;
    const { publishedBy } = request.body as any;
    const report = await prisma.investorReport.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), publishedBy },
    });
    return reply.send({ report });
  });

  // ── Entitlements ─────────────────────────────────────────

  fastify.post('/entitlements', async (request, reply) => {
    const body = request.body as any;
    const entitlement = await prisma.entitlement.create({
      data: {
        projectId: body.projectId,
        orgId: body.orgId,
        entitlementType: body.entitlementType,
        title: body.title,
        description: body.description,
        jurisdiction: body.jurisdiction,
        department: body.department,
        applicationFee: body.applicationFee,
        assignedTo: body.assignedTo,
        status: 'NOT_STARTED',
      },
    });
    return reply.code(201).send({ entitlement });
  });

  fastify.get('/entitlements/:projectId', async (request, reply) => {
    const { projectId } = request.params as any;
    const entitlements = await prisma.entitlement.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send({ entitlements });
  });

  fastify.patch('/entitlements/:id', async (request, reply) => {
    const { id } = request.params as any;
    const entitlement = await prisma.entitlement.update({
      where: { id },
      data: request.body as any,
    });
    return reply.send({ entitlement });
  });
}
