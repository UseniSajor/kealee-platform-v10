/**
 * services/api/src/modules/concepts/concept-queue.routes.ts
 * Command center queue loader — lists concept orders for PM review
 */

import { FastifyInstance } from "fastify";
import { prismaAny } from "../../utils/prisma-helper";
import { authenticateUser as authenticate } from "../../middleware/auth.middleware";
import { sanitizeErrorMessage } from "../../utils/sanitize-error";

export async function conceptQueueRoutes(fastify: FastifyInstance) {

  // GET /concepts/queue — all orders pending PM review
  fastify.get("/queue", { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const {
        status,
        deliveryStatus,
        limit = "50",
        offset = "0",
      } = request.query as Record<string, string>;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (deliveryStatus) {
        where.deliveryStatus = deliveryStatus;
      } else {
        where.deliveryStatus = { in: ["pending", "generating", "ready"] };
      }

      const [orders, total] = await Promise.all([
        prismaAny.conceptPackageOrder.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: parseInt(limit),
          skip: parseInt(offset),
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        prismaAny.conceptPackageOrder.count({ where }),
      ]);

      return { orders, total, limit: parseInt(limit), offset: parseInt(offset) };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to load queue") });
    }
  });

  // GET /concepts/queue/:id — detail view
  fastify.get("/queue/:id", { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const order = await prismaAny.conceptPackageOrder.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
      if (!order) return reply.code(404).send({ error: "Order not found" });

      // Load associated intake lead if metadata has intakeId
      const intakeId = (order.metadata as any)?.intakeId;
      const intake = intakeId
        ? await prismaAny.permitServiceLead.findUnique({ where: { id: intakeId } })
        : null;

      return { order, intake };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to load order") });
    }
  });

  // PATCH /concepts/queue/:id/delivery-status
  fastify.patch(
    "/queue/:id/delivery-status",
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { deliveryStatus, deliveryUrl } = request.body as {
          deliveryStatus: string;
          deliveryUrl?: string;
        };

        const updated = await prismaAny.conceptPackageOrder.update({
          where: { id },
          data: {
            deliveryStatus,
            ...(deliveryUrl ? { deliveryUrl } : {}),
            ...(deliveryStatus === "delivered" ? { deliveredAt: new Date() } : {}),
          },
        });

        return updated;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to update status") });
      }
    },
  );
}
