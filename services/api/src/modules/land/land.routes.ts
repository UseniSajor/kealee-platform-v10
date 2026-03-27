/**
 * OS-Land Routes — registered in main API gateway
 * Proxies to os-land service or runs inline during transition
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prismaAny as prisma } from '../../utils/prisma-helper';

// Import parcel service logic inline (during transition, before service extraction)
// Once os-land runs standalone, these routes can proxy to it instead

export async function landRoutes(fastify: FastifyInstance) {
  // POST /land/parcels
  fastify.post('/parcels', async (request, reply) => {
    const body = request.body as any;
    const parcel = await prisma.parcel.create({
      data: {
        orgId: body.orgId,
        label: body.label,
        parcelNumber: body.parcelNumber,
        legalDesc: body.legalDesc,
        address: body.address,
        city: body.city,
        county: body.county,
        state: body.state,
        zipCode: body.zipCode,
        latitude: body.latitude,
        longitude: body.longitude,
        acreage: body.acreage,
        currentUse: body.currentUse,
        currentOwner: body.currentOwner,
        identifiedBy: body.identifiedBy,
        status: 'IDENTIFIED',
      },
      include: { zoning: true, assessments: true },
    });
    return reply.code(201).send({ parcel });
  });

  // GET /land/parcels
  fastify.get('/parcels', async (request, reply) => {
    const q = request.query as any;
    if (!q.orgId) return reply.code(400).send({ error: 'orgId required' });
    const where: any = { orgId: q.orgId };
    if (q.status) where.status = q.status;
    if (q.state) where.state = q.state;

    const [parcels, total] = await Promise.all([
      prisma.parcel.findMany({
        where,
        include: { zoning: true },
        orderBy: { updatedAt: 'desc' },
        take: q.limit ? parseInt(q.limit) : 50,
        skip: q.offset ? parseInt(q.offset) : 0,
      }),
      prisma.parcel.count({ where }),
    ]);
    return reply.send({ parcels, total });
  });

  // GET /land/parcels/:id
  fastify.get('/parcels/:id', async (request, reply) => {
    const { id } = request.params as any;
    const parcel = await prisma.parcel.findUnique({
      where: { id },
      include: {
        zoning: true,
        assessments: true,
        comparables: true,
        documents: true,
        notes: { orderBy: { createdAt: 'desc' } },
        offers: { orderBy: { offerDate: 'desc' } },
      },
    });
    if (!parcel) return reply.code(404).send({ error: 'Parcel not found' });
    return reply.send({ parcel });
  });

  // POST /land/parcels/:id/zoning
  fastify.post('/parcels/:id/zoning', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const zoning = await prisma.parcelZoning.create({
      data: { parcelId: id, ...body, allowedUses: body.allowedUses ?? [], conditionalUses: body.conditionalUses ?? [], prohibitedUses: body.prohibitedUses ?? [] },
    });
    return reply.code(201).send({ zoning });
  });

  // POST /land/parcels/:id/assessments
  fastify.post('/parcels/:id/assessments', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const assessment = await prisma.siteAssessment.create({
      data: { parcelId: id, assessmentType: body.assessmentType, title: body.title, description: body.description, vendorName: body.vendorName, estimatedCost: body.estimatedCost, status: 'NOT_STARTED' },
    });
    return reply.code(201).send({ assessment });
  });

  // POST /land/parcels/:id/offers
  fastify.post('/parcels/:id/offers', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    await prisma.parcel.update({ where: { id }, data: { status: 'OFFER_PENDING' } });
    const offer = await prisma.landOffer.create({
      data: { parcelId: id, offerAmount: body.offerAmount, earnestMoney: body.earnestMoney, expirationDate: body.expirationDate, ddPeriodDays: body.ddPeriodDays, notes: body.notes, createdBy: body.createdBy, status: 'DRAFT' },
    });
    return reply.code(201).send({ offer });
  });

  // POST /land/parcels/:id/convert — convert to project
  fastify.post('/parcels/:id/convert', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const parcel = await prisma.parcel.findUniqueOrThrow({ where: { id } });
    const project = await prisma.project.create({
      data: {
        name: body.name,
        orgId: body.orgId,
        ownerId: body.ownerId,
        description: body.description,
        address: parcel.address,
        city: parcel.city,
        state: parcel.state,
        zipCode: parcel.zipCode,
        latitude: parcel.latitude,
        longitude: parcel.longitude,
        status: 'ACTIVE',
      },
    });
    await prisma.parcel.update({ where: { id }, data: { status: 'CONVERTED', projectId: project.id } });
    return reply.code(201).send({ project });
  });
}
