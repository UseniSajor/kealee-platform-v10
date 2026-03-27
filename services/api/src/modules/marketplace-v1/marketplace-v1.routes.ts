/**
 * Marketplace v1 Routes — registered in main API gateway at /api/v1/marketplace
 * Proxies to marketplace service or runs inline during transition
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prismaAny as prisma } from '../../utils/prisma-helper';

export async function marketplaceV1Routes(fastify: FastifyInstance) {
  // ── Contractor Listings ──

  fastify.get('/contractors', async (request, reply) => {
    const { trade, location, minRating, limit = '20', offset = '0' } = request.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (trade) where.trade = trade;
    if (location) where.serviceArea = { has: location };

    const contractors = await prisma.contractorProfile.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' },
    });

    return { contractors, total: await prisma.contractorProfile.count({ where }) };
  });

  fastify.get('/contractors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const contractor = await prisma.contractorProfile.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!contractor) return reply.status(404).send({ error: 'Contractor not found' });
    return contractor;
  });

  // ── Matchmaking ──

  fastify.post('/match', async (request, reply) => {
    const body = request.body as {
      projectId: string;
      trades: string[];
      location?: string;
      budgetRange?: { min: number; max: number };
    };

    const contractors = await prisma.contractorProfile.findMany({
      where: {
        trade: { in: body.trades },
        isActive: true,
      },
      include: { user: { select: { name: true, email: true } } },
      take: 20,
    });

    // Score contractors based on trade match, rating, and availability
    const scored = contractors.map((c: any) => ({
      contractor: c,
      score: Math.round(
        (c.rating || 3) * 20 + (c.completedProjects || 0) * 2
      ),
    }));

    scored.sort((a: any, b: any) => b.score - a.score);

    return { matches: scored, total: scored.length, projectId: body.projectId };
  });

  // ── Lead Management ──

  fastify.get('/leads', async (request, reply) => {
    const { status, assignedTo, limit = '20' } = request.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedToId = assignedTo;

    const leads = await prisma.lead.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    return { leads, total: await prisma.lead.count({ where }) };
  });

  fastify.post('/leads', async (request, reply) => {
    const body = request.body as {
      name: string;
      email: string;
      phone?: string;
      source: string;
      projectType?: string;
    };

    const lead = await prisma.lead.create({
      data: {
        ...body,
        status: 'new',
        score: 0,
      },
    });

    return reply.status(201).send(lead);
  });

  // ── Reviews ──

  fastify.get('/contractors/:id/reviews', async (request, reply) => {
    const { id } = request.params as { id: string };

    const reviews = await prisma.review.findMany({
      where: { contractorProfileId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { reviews, total: await prisma.review.count({ where: { contractorProfileId: id } }) };
  });
}
