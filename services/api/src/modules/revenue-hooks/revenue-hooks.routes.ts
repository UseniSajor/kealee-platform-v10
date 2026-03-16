/**
 * services/api/src/modules/revenue-hooks/revenue-hooks.routes.ts
 *
 * Revenue hooks API — creates Stripe Checkout Sessions for tiered services.
 *
 * Routes:
 *   POST /revenue-hooks/checkout         — create checkout session
 *   POST /revenue-hooks/checkout/verify  — verify completed session
 *   GET  /revenue-hooks/tiers/:stage     — get tier config for a hook stage
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { authenticateUser } from '../../middleware/auth.middleware.js';

// ─── Stripe ───────────────────────────────────────────────────────────────────

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

// ─── Hook Stage → metadata ────────────────────────────────────────────────────

const HOOK_STAGE_LABELS: Record<string, string> = {
  project_intake:         'Project Intake',
  design_complete:        'Design Package',
  estimate_complete:      'Cost Estimate',
  permit_detected:        'Permit Services',
  contractor_assignment:  'Contractor Assignment',
  engagement_creation:    'Engagement Agreement',
  project_execution:      'Project Execution',
  contractor_growth:      'Contractor Growth',
};

// ─── Tier pricing config (server-side truth) ─────────────────────────────────
// Matches packages/core-hooks/src/hooks.config.ts — authoritative on the server.

interface TierConfig {
  id:      string;
  name:    string;
  price:   number;
  priceId: string | undefined;
}

const TIER_CONFIGS: Record<string, TierConfig[]> = {
  permit_detected: [
    { id: 'permit_free',          name: 'Permit Checklist',     price: 0,      priceId: undefined },
    { id: 'permit_prep',          name: 'Permit Preparation',   price: 150000, priceId: process.env.STRIPE_PRICE_PERMIT_PREP },
    { id: 'permit_coordination',  name: 'Permit Coordination',  price: 300000, priceId: process.env.STRIPE_PRICE_PERMIT_COORDINATION },
    { id: 'permit_expediting',    name: 'Permit Expediting',    price: 500000, priceId: process.env.STRIPE_PRICE_PERMIT_EXPEDITING },
  ],
  design_complete: [
    { id: 'design_free',             name: 'AI Concept',           price: 0,      priceId: undefined },
    { id: 'design_architect_review', name: 'Architect Review',     price: 99900,  priceId: process.env.STRIPE_PRICE_DESIGN_ARCHITECT_REVIEW },
    { id: 'design_full_package',     name: 'Full Design Package',  price: 449900, priceId: process.env.STRIPE_PRICE_DESIGN_FULL },
  ],
  estimate_complete: [
    { id: 'estimate_basic',      name: 'AI Estimate',          price: 0,      priceId: undefined },
    { id: 'estimate_detailed',   name: 'Detailed Analysis',    price: 49900,  priceId: process.env.STRIPE_PRICE_ESTIMATE_DETAILED },
    { id: 'estimate_certified',  name: 'Certified Report',     price: 149900, priceId: process.env.STRIPE_PRICE_ESTIMATE_CERTIFIED },
  ],
  project_intake: [
    { id: 'intake_free',         name: 'Self-Guided',          price: 0,      priceId: undefined },
    { id: 'intake_feasibility',  name: 'Feasibility Review',   price: 49900,  priceId: process.env.STRIPE_PRICE_INTAKE_FEASIBILITY },
    { id: 'intake_full_service', name: 'Full Intake Package',  price: 149900, priceId: process.env.STRIPE_PRICE_INTAKE_FULL },
  ],
  contractor_assignment: [
    { id: 'assignment_basic',      name: 'Standard Assignment', price: 0,      priceId: undefined },
    { id: 'assignment_contract',   name: 'Custom Contract',     price: 99900,  priceId: process.env.STRIPE_PRICE_ASSIGNMENT_CONTRACT },
    { id: 'assignment_oversight',  name: 'Project Oversight',   price: 249900, priceId: process.env.STRIPE_PRICE_ASSIGNMENT_OVERSIGHT },
  ],
  engagement_creation: [
    { id: 'engagement_standard',  name: 'Standard Agreement',  price: 0,      priceId: undefined },
    { id: 'engagement_custom',    name: 'Custom Agreement',     price: 149900, priceId: process.env.STRIPE_PRICE_ENGAGEMENT_CUSTOM },
    { id: 'engagement_full_legal', name: 'Full Legal Package',  price: 349900, priceId: process.env.STRIPE_PRICE_ENGAGEMENT_LEGAL },
  ],
  project_execution: [
    { id: 'execution_basic',        name: 'Self-Managed',           price: 0,      priceId: undefined },
    { id: 'execution_monitoring',   name: 'Construction Monitoring', price: 99900,  priceId: process.env.STRIPE_PRICE_EXECUTION_MONITORING },
    { id: 'execution_financial',    name: 'Financial Control',       price: 199900, priceId: process.env.STRIPE_PRICE_EXECUTION_FINANCIAL },
  ],
  contractor_growth: [
    { id: 'growth_starter',     name: 'Starter',   price: 9900,  priceId: process.env.STRIPE_PRICE_GROWTH_STARTER },
    { id: 'growth_pro',         name: 'Growth',    price: 29900, priceId: process.env.STRIPE_PRICE_GROWTH_PRO },
    { id: 'growth_enterprise',  name: 'Pro',       price: 79900, priceId: process.env.STRIPE_PRICE_GROWTH_ENTERPRISE },
  ],
};

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function revenueHooksRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * GET /revenue-hooks/tiers/:stage
   * Returns tier config for a hook stage (client-facing, no auth required).
   */
  fastify.get('/tiers/:stage', async (request: FastifyRequest, reply: FastifyReply) => {
    const { stage } = request.params as { stage: string };
    const tiers = TIER_CONFIGS[stage];
    if (!tiers) {
      return reply.status(404).send({ error: `Unknown hook stage: ${stage}` });
    }
    return reply.send({ stage, tiers: tiers.map(t => ({ ...t, priceId: undefined })) }); // don't expose price IDs
  });

  /**
   * POST /revenue-hooks/checkout
   * Create a Stripe Checkout Session for a revenue hook tier.
   * Requires authentication.
   */
  fastify.post(
    '/checkout',
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const {
        priceId,
        tierId,
        stage,
        projectId,
        successUrl,
        cancelUrl,
      } = request.body as {
        priceId?:   string;
        tierId:     string;
        stage:      string;
        projectId?: string;
        successUrl?: string;
        cancelUrl?:  string;
      };

      // Validate tier exists and price matches server config
      const stageTiers = TIER_CONFIGS[stage];
      if (!stageTiers) {
        return reply.status(400).send({ error: `Unknown stage: ${stage}` });
      }

      const tier = stageTiers.find(t => t.id === tierId);
      if (!tier) {
        return reply.status(400).send({ error: `Unknown tier: ${tierId}` });
      }

      // Free tier — no checkout needed
      if (tier.price === 0) {
        return reply.send({ free: true, tierId, stage });
      }

      if (!stripe) {
        return reply.status(503).send({ error: 'Stripe not configured — set STRIPE_SECRET_KEY' });
      }

      const resolvedPriceId = tier.priceId ?? priceId;
      if (!resolvedPriceId) {
        return reply.status(400).send({ error: `No Stripe price configured for tier ${tierId}` });
      }

      const baseUrl = process.env.WEB_MAIN_URL ?? 'https://kealee.com';
      const stageLabel = HOOK_STAGE_LABELS[stage] ?? stage;

      try {
        const session = await stripe.checkout.sessions.create({
          mode:        'payment',
          line_items:  [{ price: resolvedPriceId, quantity: 1 }],
          success_url: successUrl ?? `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&tier=${tierId}&stage=${stage}`,
          cancel_url:  cancelUrl  ?? `${baseUrl}/projects/${projectId ?? ''}`,
          customer_email: user.email,
          metadata: {
            userId:     user.id,
            tierId,
            tierName:   tier.name,
            stage,
            stageLabel,
            projectId:  projectId ?? '',
          },
          // Allow promotion codes
          allow_promotion_codes: true,
        });

        // Log the purchase intent for analytics
        fastify.log.info({
          userId:    user.id,
          tierId,
          stage,
          projectId,
          sessionId: session.id,
          amount:    tier.price,
        }, 'Revenue hook checkout session created');

        return reply.send({ url: session.url, sessionId: session.id });
      } catch (err: any) {
        fastify.log.error({ err: err.message, tierId, stage }, 'Stripe checkout session error');
        return reply.status(500).send({ error: 'Failed to create checkout session' });
      }
    },
  );

  /**
   * POST /revenue-hooks/checkout/verify
   * Verify a completed Stripe checkout session.
   * Called from the success page to confirm payment.
   */
  fastify.post(
    '/checkout/verify',
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.body as { sessionId: string };
      const user = (request as any).user;

      if (!stripe) {
        return reply.status(503).send({ error: 'Stripe not configured' });
      }

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
          return reply.status(400).send({ verified: false, status: session.payment_status });
        }

        // Confirm the session belongs to this user
        if (session.metadata?.userId !== user.id) {
          return reply.status(403).send({ error: 'Session does not belong to this user' });
        }

        fastify.log.info({
          userId:    user.id,
          sessionId,
          tierId:    session.metadata?.tierId,
          stage:     session.metadata?.stage,
          amount:    session.amount_total,
        }, 'Revenue hook checkout verified');

        return reply.send({
          verified:  true,
          tierId:    session.metadata?.tierId,
          tierName:  session.metadata?.tierName,
          stage:     session.metadata?.stage,
          projectId: session.metadata?.projectId,
          amount:    session.amount_total,
        });
      } catch (err: any) {
        fastify.log.error({ err: err.message, sessionId }, 'Checkout verification error');
        return reply.status(500).send({ error: 'Verification failed' });
      }
    },
  );
}
