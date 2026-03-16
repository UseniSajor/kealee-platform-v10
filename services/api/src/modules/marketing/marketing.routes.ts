/**
 * services/api/src/modules/marketing/marketing.routes.ts
 *
 * Contractor marketing module routes.
 *
 * Routes:
 *   GET  /marketing/packages              — list all packages
 *   GET  /marketing/packages/:id          — get single package
 *   POST /marketing/subscribe             — create Stripe subscription checkout
 *   POST /marketing/leads                 — capture inbound marketing lead
 *   GET  /marketing/landing/:profileId    — get landing page SEO data
 */

import type { FastifyInstance } from 'fastify';
import { getAllPackages, getPackage } from './marketing.packages.js';
import {
  createMarketingSubscription,
  notifyContractorLead,
  getContractorLandingPageData,
} from './marketing.service.js';

export async function marketingRoutes(fastify: FastifyInstance): Promise<void> {

  // ─── Package catalog ───────────────────────────────────────────────────────

  fastify.get('/packages', async (_req, reply) => {
    return reply.send({ packages: getAllPackages() });
  });

  fastify.get<{ Params: { id: string } }>('/packages/:id', async (req, reply) => {
    const pkg = getPackage(req.params.id as any);
    if (!pkg) return reply.status(404).send({ error: 'Package not found' });
    return reply.send({ package: pkg });
  });

  // ─── Subscribe ─────────────────────────────────────────────────────────────

  fastify.post<{
    Body: {
      userId:     string;
      profileId:  string;
      email:      string;
      packageId:  string;
      billing:    'monthly' | 'annual';
      successUrl: string;
      cancelUrl:  string;
    };
  }>('/subscribe', async (req, reply) => {
    const { userId, profileId, email, packageId, billing, successUrl, cancelUrl } = req.body;

    if (!userId || !profileId || !email || !packageId || !billing || !successUrl || !cancelUrl) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    try {
      const result = await createMarketingSubscription({
        userId,
        profileId,
        email,
        packageId:  packageId as any,
        billing,
        successUrl,
        cancelUrl,
      });
      return reply.send(result);
    } catch (err: any) {
      req.log.error({ err }, 'Marketing subscription checkout failed');
      return reply.status(500).send({ error: err?.message ?? 'Checkout failed' });
    }
  });

  // ─── Lead capture ──────────────────────────────────────────────────────────

  /**
   * Called by the contractor landing page lead form.
   * Notifies the contractor via email + SMS.
   */
  fastify.post<{
    Body: {
      contractorProfileId: string;
      contractorEmail:     string;
      contractorPhone?:    string;
      contractorName?:     string;
      leadName:            string;
      leadEmail:           string;
      leadPhone?:          string;
      leadMessage?:        string;
      trade?:              string;
      geo?:                string;
    };
  }>('/leads', async (req, reply) => {
    const {
      contractorEmail,
      contractorPhone,
      contractorName,
      leadName,
      leadEmail,
      leadPhone,
      leadMessage,
      trade,
      geo,
    } = req.body;

    if (!contractorEmail || !leadName || !leadEmail) {
      return reply.status(400).send({ error: 'contractorEmail, leadName, and leadEmail are required' });
    }

    // Fire-and-forget — don't block the response on external API calls
    notifyContractorLead({
      contractorEmail,
      contractorPhone,
      contractorName,
      leadName,
      leadEmail,
      leadPhone,
      leadMessage,
      trade,
      geo,
    }).catch(err => req.log.error({ err }, 'Lead notification failed'));

    return reply.status(202).send({ received: true });
  });

  // ─── Landing page data ─────────────────────────────────────────────────────

  fastify.get<{ Params: { profileId: string } }>('/landing/:profileId', async (req, reply) => {
    const data = await getContractorLandingPageData(req.params.profileId);
    return reply.send(data);
  });
}
