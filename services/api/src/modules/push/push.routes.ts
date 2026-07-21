/**
 * Web Push Notification Routes
 *
 * POST /subscribe       — Store push subscription
 * POST /unsubscribe     — Remove push subscription
 * GET  /subscriptions   — Get user's active subscriptions
 * POST /send            — Send push to user (admin/internal)
 * POST /send-project    — Send push to project team
 * GET  /vapid-key       — Get VAPID public key
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateBody } from '../../middleware/validation.middleware';
import { pushService } from './push.service';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const subscribeSchema = z.object({
  userId: z.string(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  userAgent: z.string().optional(),
  platform: z.string().optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

const sendSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  url: z.string().optional(),
  tag: z.string().optional(),
  requireInteraction: z.boolean().optional(),
  data: z.record(z.any()).optional(),
});

const sendProjectSchema = z.object({
  projectId: z.string(),
  title: z.string(),
  body: z.string(),
  url: z.string().optional(),
  tag: z.string().optional(),
  requireInteraction: z.boolean().optional(),
  excludeUserId: z.string().optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function pushRoutes(fastify: FastifyInstance) {

  // ── POST /subscribe — Store push subscription ──────────────────
  fastify.post(
    '/subscribe',
    { preHandler: [validateBody(subscribeSchema)] },
    async (request, reply) => {
      try {
        const data = subscribeSchema.parse(request.body);
        const subscription = await pushService.subscribe(data);

        return reply.status(201).send({
          success: true,
          subscriptionId: subscription.id,
        });
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── POST /unsubscribe — Remove push subscription ───────────────
  fastify.post(
    '/unsubscribe',
    { preHandler: [validateBody(unsubscribeSchema)] },
    async (request, reply) => {
      try {
        const { endpoint } = unsubscribeSchema.parse(request.body);
        await pushService.unsubscribe(endpoint);

        return reply.send({
          success: true,
          message: 'Subscription removed',
        });
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── GET /subscriptions — Get user's active subscriptions ───────
  fastify.get(
    '/subscriptions',
    async (request, reply) => {
      try {
        const query = request.query as any;
        const userId = query.userId;

        if (!userId) {
          return reply.status(400).send({
            success: false,
            error: 'userId query parameter required',
          });
        }

        const subscriptions = await pushService.getUserSubscriptions(userId);

        return reply.send({
          success: true,
          count: subscriptions.length,
          subscriptions: subscriptions.map((s: any) => ({
            id: s.id,
            platform: s.platform,
            userAgent: s.userAgent,
            lastUsed: s.lastUsed,
            createdAt: s.createdAt,
          })),
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── POST /send — Send push to a specific user ─────────────────
  fastify.post(
    '/send',
    { preHandler: [validateBody(sendSchema)] },
    async (request, reply) => {
      try {
        const data = sendSchema.parse(request.body);
        const result = await pushService.sendToUser(data.userId, {
          title: data.title,
          body: data.body,
          icon: data.icon,
          badge: data.badge,
          url: data.url,
          tag: data.tag,
          requireInteraction: data.requireInteraction,
          data: data.data,
        });

        return reply.send({
          success: true,
          ...result,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── POST /send-project — Send push to project team ─────────────
  fastify.post(
    '/send-project',
    { preHandler: [validateBody(sendProjectSchema)] },
    async (request, reply) => {
      try {
        const data = sendProjectSchema.parse(request.body);
        const result = await pushService.sendToProject(
          data.projectId,
          {
            title: data.title,
            body: data.body,
            url: data.url,
            tag: data.tag,
            requireInteraction: data.requireInteraction,
          },
          data.excludeUserId
        );

        return reply.send({
          success: true,
          ...result,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── GET /vapid-key — Get public VAPID key ──────────────────────
  fastify.get(
    '/vapid-key',
    async (request, reply) => {
      const key = process.env.VAPID_PUBLIC_KEY || '';
      return reply.send({
        success: true,
        publicKey: key,
        configured: !!key,
      });
    }
  );
}
