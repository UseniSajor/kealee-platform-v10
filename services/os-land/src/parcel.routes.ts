/**
 * Parcel Routes — /api/v1/land/parcels
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parcelService } from './parcel.service';

const uuidParam = z.object({ id: z.string().uuid() });

const createParcelSchema = z.object({
  orgId: z.string().uuid(),
  label: z.string().min(1),
  parcelNumber: z.string().optional(),
  legalDesc: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  acreage: z.number().optional(),
  currentUse: z.string().optional(),
  currentOwner: z.string().optional(),
  identifiedBy: z.string().optional(),
});

const zoningSchema = z.object({
  zoningCode: z.string(),
  zoningDesc: z.string().optional(),
  overlay: z.string().optional(),
  jurisdiction: z.string().optional(),
  maxDensity: z.number().optional(),
  maxHeight: z.number().optional(),
  maxFAR: z.number().optional(),
  maxLotCoverage: z.number().optional(),
  frontSetback: z.number().optional(),
  sideSetback: z.number().optional(),
  rearSetback: z.number().optional(),
  allowedUses: z.array(z.string()).optional(),
  conditionalUses: z.array(z.string()).optional(),
  prohibitedUses: z.array(z.string()).optional(),
  parkingRatio: z.number().optional(),
  sourceUrl: z.string().optional(),
});

const assessmentSchema = z.object({
  assessmentType: z.enum([
    'ENVIRONMENTAL', 'GEOTECHNICAL', 'SURVEY', 'TITLE',
    'TRAFFIC', 'UTILITY', 'FLOOD', 'WETLAND',
  ]),
  title: z.string().optional(),
  description: z.string().optional(),
  vendorName: z.string().optional(),
  estimatedCost: z.number().optional(),
});

const offerSchema = z.object({
  offerAmount: z.number().positive(),
  earnestMoney: z.number().optional(),
  expirationDate: z.string().datetime().optional(),
  ddPeriodDays: z.number().int().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

const convertSchema = z.object({
  name: z.string().min(1),
  orgId: z.string().uuid(),
  ownerId: z.string().uuid(),
  description: z.string().optional(),
});

export async function parcelRoutes(fastify: FastifyInstance) {
  // POST /parcels — create a parcel
  fastify.post('/', async (request, reply) => {
    const body = createParcelSchema.parse(request.body);
    const parcel = await parcelService.createParcel(body);
    return reply.code(201).send({ parcel });
  });

  // GET /parcels — list parcels
  fastify.get('/', async (request, reply) => {
    const q = request.query as any;
    if (!q.orgId) return reply.code(400).send({ error: 'orgId required' });
    const result = await parcelService.listParcels(q.orgId, {
      status: q.status,
      state: q.state,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  // GET /parcels/:id — get parcel detail
  fastify.get('/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const parcel = await parcelService.getParcel(id);
    if (!parcel) return reply.code(404).send({ error: 'Parcel not found' });
    return reply.send({ parcel });
  });

  // PATCH /parcels/:id — update parcel
  fastify.patch('/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const parcel = await parcelService.updateParcel(id, request.body as any);
    return reply.send({ parcel });
  });

  // PATCH /parcels/:id/status — update parcel status
  fastify.patch('/:id/status', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { status } = z.object({ status: z.string() }).parse(request.body);
    const parcel = await parcelService.updateParcelStatus(id, status as any);
    return reply.send({ parcel });
  });

  // POST /parcels/:id/zoning — add zoning analysis
  fastify.post('/:id/zoning', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const body = zoningSchema.parse(request.body);
    const zoning = await parcelService.addZoning(id, body);
    return reply.code(201).send({ zoning });
  });

  // POST /parcels/:id/assessments — create site assessment
  fastify.post('/:id/assessments', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const body = assessmentSchema.parse(request.body);
    const assessment = await parcelService.createAssessment(id, body);
    return reply.code(201).send({ assessment });
  });

  // PATCH /parcels/assessments/:id — update assessment
  fastify.patch('/assessments/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const assessment = await parcelService.updateAssessment(id, request.body as any);
    return reply.send({ assessment });
  });

  // POST /parcels/:id/comparables — add comparable
  fastify.post('/:id/comparables', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const comparable = await parcelService.addComparable(id, request.body as any);
    return reply.code(201).send({ comparable });
  });

  // POST /parcels/:id/documents — add document
  fastify.post('/:id/documents', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const doc = await parcelService.addDocument(id, request.body as any);
    return reply.code(201).send({ document: doc });
  });

  // POST /parcels/:id/notes — add note
  fastify.post('/:id/notes', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const note = await parcelService.addNote(id, request.body as any);
    return reply.code(201).send({ note });
  });

  // POST /parcels/:id/offers — create offer
  fastify.post('/:id/offers', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const body = offerSchema.parse(request.body);
    const offer = await parcelService.createOffer(id, {
      ...body,
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
    });
    return reply.code(201).send({ offer });
  });

  // PATCH /parcels/offers/:id/status — update offer status
  fastify.patch('/offers/:id/status', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { status, ...data } = request.body as any;
    const offer = await parcelService.updateOfferStatus(id, status, data);
    return reply.send({ offer });
  });

  // POST /parcels/:id/convert — convert parcel to project
  fastify.post('/:id/convert', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const body = convertSchema.parse(request.body);
    const project = await parcelService.convertToProject(id, body);
    return reply.code(201).send({ project });
  });

  // POST /parcels/:id/score — calculate development score
  fastify.post('/:id/score', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const score = await parcelService.calculateDevelopmentScore(id);
    return reply.send({ score });
  });
}
