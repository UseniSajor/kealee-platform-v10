/**
 * Marketplace Routes -- /api/v1/marketplace
 *
 * Contractor listings, portfolio, matchmaking, bidding, leads,
 * reviews, verification, workforce pipeline.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { marketplaceService } from './marketplace.service';

// ── Zod Schemas ──────────────────────────────────────────────────

const uuidParam = z.object({ id: z.string().uuid() });

const createProfileSchema = z.object({
  userId: z.string().uuid(),
  businessName: z.string().min(1),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  serviceArea: z.record(z.unknown()).optional(),
  subscriptionTier: z.string().optional(),
  maxPipelineValue: z.number().optional(),
});

const updateProfileSchema = z.object({
  businessName: z.string().min(1).optional(),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  serviceArea: z.record(z.unknown()).optional(),
  subscriptionTier: z.string().optional(),
  maxPipelineValue: z.number().optional(),
  acceptingLeads: z.boolean().optional(),
  verified: z.boolean().optional(),
});

const portfolioSchema = z.object({
  projectName: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  imageUrls: z.array(z.string()).optional(),
  completedAt: z.string().datetime().optional(),
});

const matchRequestSchema = z.object({
  projectType: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  estimatedValue: z.number().optional(),
  requiredSpecialties: z.array(z.string()).optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
});

const bidRequestSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
});

const bidResponseSchema = z.object({
  bidRequestId: z.string().uuid(),
  profileId: z.string().uuid(),
  amount: z.number().positive(),
  timeline: z.string().optional(),
  details: z.string().optional(),
  userId: z.string().uuid().optional(),
});

const createLeadSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  estimatedValue: z.number().optional(),
  srp: z.number().optional(),
  location: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  projectId: z.string().uuid().optional(),
  projectType: z.string().optional(),
  userId: z.string().uuid().optional(),
});

const updateLeadStageSchema = z.object({
  stage: z.enum(['OPEN', 'INTAKE', 'DISTRIBUTED', 'QUOTED', 'AWARDED', 'LOST', 'CLOSED']),
});

const distributeLeadSchema = z.object({
  profileIds: z.array(z.string().uuid()).min(1),
});

const reviewSchema = z.object({
  contractorId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  reviewerId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  workQuality: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  timeliness: z.number().int().min(1).max(5).optional(),
  professionalism: z.number().int().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
});

const credentialSchema = z.object({
  contractorId: z.string().uuid(),
  type: z.enum(['LICENSE', 'INSURANCE', 'BOND', 'CERTIFICATION']),
  name: z.string().min(1),
  number: z.string().optional(),
  issuedBy: z.string().optional(),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  documentUrl: z.string().url().optional(),
});

// ── Route Registration ───────────────────────────────────────────

export async function marketplaceRoutes(fastify: FastifyInstance) {
  // ================================================================
  // CONTRACTORS
  // ================================================================

  // POST /contractors -- create contractor profile
  fastify.post('/contractors', async (request, reply) => {
    const body = createProfileSchema.parse(request.body);
    const profile = await marketplaceService.createContractorProfile(body);
    return reply.code(201).send({ profile });
  });

  // GET /contractors -- search / list contractors
  fastify.get('/contractors', async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    const result = await marketplaceService.searchContractors({
      search: q.search,
      specialty: q.specialty,
      city: q.city,
      state: q.state,
      verifiedOnly: q.verifiedOnly === 'true',
      minRating: q.minRating ? parseFloat(q.minRating) : undefined,
      acceptingLeads: q.acceptingLeads !== undefined ? q.acceptingLeads === 'true' : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
    return reply.send(result);
  });

  // GET /contractors/:id -- get contractor profile
  fastify.get('/contractors/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const profile = await marketplaceService.getContractorProfile(id);
    if (!profile) return reply.code(404).send({ error: 'Contractor profile not found' });
    return reply.send({ profile });
  });

  // PATCH /contractors/:id -- update contractor profile
  fastify.patch('/contractors/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const body = updateProfileSchema.parse(request.body);
    const profile = await marketplaceService.updateContractorProfile(id, body);
    return reply.send({ profile });
  });

  // ================================================================
  // PORTFOLIO
  // ================================================================

  // POST /contractors/:id/portfolio -- add portfolio item
  fastify.post('/contractors/:id/portfolio', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const body = portfolioSchema.parse(request.body);
    const item = await marketplaceService.addPortfolioItem(id, body);
    return reply.code(201).send({ item });
  });

  // GET /contractors/:id/portfolio -- list portfolio items
  fastify.get('/contractors/:id/portfolio', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const items = await marketplaceService.listPortfolio(id);
    return reply.send({ items });
  });

  // DELETE /contractors/portfolio/:id -- delete portfolio item
  fastify.delete('/contractors/portfolio/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    await marketplaceService.deletePortfolioItem(id);
    return reply.code(204).send();
  });

  // ================================================================
  // MATCHMAKING
  // ================================================================

  // POST /match -- find matching contractors for a project
  fastify.post('/match', async (request, reply) => {
    const body = matchRequestSchema.parse(request.body);
    const result = await marketplaceService.matchContractors(body);
    return reply.send(result);
  });

  // ================================================================
  // BIDDING
  // ================================================================

  // POST /bids/request -- create a bid request (opens a lead for bidding)
  fastify.post('/bids/request', async (request, reply) => {
    const body = bidRequestSchema.parse(request.body);
    const bidRequest = await marketplaceService.createBidRequest(body);
    return reply.code(201).send({ bidRequest });
  });

  // POST /bids/submit -- submit a bid (quote) on a lead
  fastify.post('/bids/submit', async (request, reply) => {
    const body = bidResponseSchema.parse(request.body);
    const bid = await marketplaceService.submitBid(body);
    return reply.code(201).send({ bid });
  });

  // GET /bids/:id -- list bids for a lead
  fastify.get('/bids/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const bids = await marketplaceService.listBids(id);
    return reply.send({ bids });
  });

  // POST /bids/:id/award -- award a bid (accept a quote)
  fastify.post('/bids/:id/award', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const result = await marketplaceService.awardBid(id);
    return reply.send(result);
  });

  // ================================================================
  // LEADS
  // ================================================================

  // POST /leads -- create a lead
  fastify.post('/leads', async (request, reply) => {
    const body = createLeadSchema.parse(request.body);
    const lead = await marketplaceService.createLead(body);
    return reply.code(201).send({ lead });
  });

  // GET /leads -- list leads
  fastify.get('/leads', async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    const result = await marketplaceService.listLeads({
      stage: q.stage,
      city: q.city,
      state: q.state,
      projectType: q.projectType,
      estimatedValueMin: q.estimatedValueMin ? parseFloat(q.estimatedValueMin) : undefined,
      estimatedValueMax: q.estimatedValueMax ? parseFloat(q.estimatedValueMax) : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
    return reply.send(result);
  });

  // GET /leads/score -- score open leads by priority
  fastify.get('/leads/score', async (_request, reply) => {
    const scored = await marketplaceService.scoreLeads();
    return reply.send({ leads: scored });
  });

  // GET /leads/:id -- get a single lead
  fastify.get('/leads/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const lead = await marketplaceService.getLead(id);
    return reply.send({ lead });
  });

  // PATCH /leads/:id/stage -- update lead stage
  fastify.patch('/leads/:id/stage', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { stage } = updateLeadStageSchema.parse(request.body);
    const lead = await marketplaceService.updateLeadStage(id, stage);
    return reply.send({ lead });
  });

  // POST /leads/:id/distribute -- distribute lead to contractors
  fastify.post('/leads/:id/distribute', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { profileIds } = distributeLeadSchema.parse(request.body);
    const lead = await marketplaceService.distributeLead(id, profileIds);
    return reply.send({ lead });
  });

  // ================================================================
  // REVIEWS
  // ================================================================

  // POST /reviews -- create a review
  fastify.post('/reviews', async (request, reply) => {
    const body = reviewSchema.parse(request.body);
    const review = await marketplaceService.createReview(body);
    return reply.code(201).send({ review });
  });

  // GET /reviews/:id -- list reviews for a contractor
  fastify.get('/reviews/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const q = request.query as Record<string, string | undefined>;
    const result = await marketplaceService.listReviews(
      id,
      q.limit ? parseInt(q.limit, 10) : undefined,
      q.offset ? parseInt(q.offset, 10) : undefined,
    );
    return reply.send(result);
  });

  // GET /reviews/:id/summary -- aggregate review summary
  fastify.get('/reviews/:id/summary', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const summary = await marketplaceService.getReviewSummary(id);
    return reply.send(summary);
  });

  // ================================================================
  // VERIFICATION
  // ================================================================

  // POST /verification/credentials -- add a credential
  fastify.post('/verification/credentials', async (request, reply) => {
    const body = credentialSchema.parse(request.body);
    const credential = await marketplaceService.addCredential(body);
    return reply.code(201).send({ credential });
  });

  // GET /verification/:id/credentials -- list credentials for a contractor
  fastify.get('/verification/:id/credentials', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const credentials = await marketplaceService.listCredentials(id);
    return reply.send({ credentials });
  });

  // POST /verification/credentials/:id/verify -- verify a credential
  fastify.post('/verification/credentials/:id/verify', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const credential = await marketplaceService.verifyCredential(id);
    return reply.send({ credential });
  });

  // GET /verification/:id/status -- overall verification status
  fastify.get('/verification/:id/status', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const status = await marketplaceService.getVerificationStatus(id);
    return reply.send(status);
  });

  // ================================================================
  // WORKFORCE PIPELINE
  // ================================================================

  // GET /workforce/summary -- aggregate workforce stats
  fastify.get('/workforce/summary', async (_request, reply) => {
    const summary = await marketplaceService.getWorkforceSummary();
    return reply.send(summary);
  });

  // GET /workforce/availability/:id -- contractor availability details
  fastify.get('/workforce/availability/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const availability = await marketplaceService.getContractorAvailability(id);
    return reply.send(availability);
  });
}
