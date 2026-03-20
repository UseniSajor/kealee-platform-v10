/**
 * services/api/src/modules/concepts/concept-intake.routes.ts
 * Concept intake API — save intake, score lead, create Stripe checkout session
 */

import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { z } from "zod";
import { prismaAny } from "../../utils/prisma-helper";
import { authenticateUser as authenticate } from "../../middleware/auth.middleware";
import { sanitizeErrorMessage } from "../../utils/sanitize-error";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
});

const PACKAGE_PRICES: Record<string, { name: string; amount: number }> = {
  essential:    { name: "AI Concept Design Package",    amount: 58500 },
  professional: { name: "AI Concept Design Package — Priority", amount: 77500 }, // $585 + $195 priority
  premium:      { name: "Premium Concept Package",      amount: 99900 },
  white_glove:  { name: "White Glove Concept Package",  amount: 199900 },
};

const CreateIntakeBodySchema = z.object({
  intakeData: z.object({
    clientName: z.string().min(2),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    projectAddress: z.string().min(5),
    projectType: z.string(),
    propertyUse: z.string().default("primary_residence"),
    budgetRange: z.string(),
    stylePreferences: z.array(z.string()).default([]),
    goals: z.array(z.string()).default([]),
    knownConstraints: z.array(z.string()).default([]),
    uploadedPhotos: z.array(z.string()).default([]),
    timelineGoal: z.string().optional(),
  }),
  funnelSessionId: z.string().optional(),
  source: z.string().default("portal_owner"),
});

const CheckoutBodySchema = z.object({
  intakeId: z.string(),
  packageTier: z.enum(["essential", "professional", "premium", "white_glove"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

function scoreIntakeLead(data: Record<string, unknown>): {
  total: number;
  tier: string;
  route: string;
  flags: string[];
} {
  const budgetScores: Record<string, number> = {
    under_10k: 10, "10k_25k": 18, "25k_50k": 25, "50k_100k": 28, "100k_plus": 30,
  };
  const timelineScores: Record<string, number> = {
    asap: 30, "1_3_months": 24, "3_6_months": 18, "6_12_months": 10, planning: 4,
  };
  const complexityPenalty: Record<string, number> = {
    exterior_refresh: 0, facade_redesign: 2, landscape_redesign: 2,
    driveway_hardscape: 3, addition_concept: 8, porch_deck_concept: 5,
  };

  const flags: string[] = [];
  const budget = budgetScores[data.budgetRange as string] ?? 10;
  const urgency = timelineScores[data.timelineGoal as string ?? "planning"] ?? 4;
  const photos = (data.uploadedPhotos as string[] ?? []).length;
  const readiness =
    (photos >= 3 ? 10 : photos >= 1 ? 5 : 0) +
    ((data.stylePreferences as string[] ?? []).length >= 2 ? 5 : 0) +
    ((data.goals as string[] ?? []).length > 0 ? 5 : 0) +
    (data.contactPhone ? 5 : 0);
  const pen = complexityPenalty[data.projectType as string] ?? 0;
  const complexity = 15 - pen;

  if (data.propertyUse === "multifamily") flags.push("multifamily");
  if (data.projectType === "addition_concept") flags.push("addition_requires_review");
  if (data.budgetRange === "under_10k") flags.push("low_budget");

  const total = Math.min(100, budget + urgency + readiness + complexity);
  const tier = total >= 70 ? "hot" : total >= 45 ? "warm" : "cold";
  const route = tier === "hot" && pen <= 3 ? "fast_track" : tier === "cold" ? "nurture" : "standard";

  return { total, tier, route, flags };
}

export async function conceptIntakeRoutes(fastify: FastifyInstance) {

  // POST /concepts/intake
  fastify.post("/intake", { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      const body = CreateIntakeBodySchema.parse(request.body);
      const score = scoreIntakeLead(body.intakeData as Record<string, unknown>);

      const intake = await prismaAny.permitServiceLead.create({
        data: {
          name: body.intakeData.clientName,
          email: body.intakeData.contactEmail,
          phone: body.intakeData.contactPhone,
          address: body.intakeData.projectAddress,
          projectType: body.intakeData.projectType,
          budgetRange: body.intakeData.budgetRange,
          source: body.source ?? "portal_owner",
          status: "NEW",
          metadata: {
            intakeData: body.intakeData,
            leadScore: score,
            funnelSessionId: body.funnelSessionId ?? null,
            userId,
          },
        },
      });

      return reply.code(201).send({ ok: true, intakeId: intake.id, score, route: score.route });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to save intake") });
    }
  });

  // POST /concepts/checkout
  fastify.post("/checkout", { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      const user = await prismaAny.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user) return reply.code(401).send({ error: "User not found" });

      const body = CheckoutBodySchema.parse(request.body);
      const pkg = PACKAGE_PRICES[body.packageTier];
      if (!pkg) return reply.code(400).send({ error: "Invalid package tier" });

      const intake = await prismaAny.permitServiceLead.findUnique({ where: { id: body.intakeId } });
      if (!intake) return reply.code(404).send({ error: "Intake not found" });

      const meta = (intake.metadata as any) ?? {};
      const address = meta.intakeData?.projectAddress ?? "your property";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: pkg.amount,
              product_data: {
                name: pkg.name,
                description: `Exterior concept package for ${address}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          source: "concept-package",
          packageTier: body.packageTier,
          packageName: pkg.name,
          intakeId: body.intakeId,
          userId,
          funnelSessionId: meta.funnelSessionId ?? "",
          customerEmail: user.email,
          customerName: user.name ?? "",
        },
        success_url: body.successUrl,
        cancel_url: body.cancelUrl,
      });

      return { ok: true, sessionId: session.id, url: session.url };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to create checkout session") });
    }
  });

  // GET /concepts/orders
  fastify.get("/orders", { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      const orders = await prismaAny.conceptPackageOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return orders;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to fetch orders") });
    }
  });

  // GET /concepts/orders/:id
  fastify.get("/orders/:id", { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      const { id } = request.params as { id: string };
      const order = await prismaAny.conceptPackageOrder.findFirst({ where: { id, userId } });
      if (!order) return reply.code(404).send({ error: "Order not found" });
      return order;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to fetch order") });
    }
  });

  // GET /concepts/order-by-session
  fastify.get("/order-by-session", async (request, reply) => {
    try {
      const { session_id } = request.query as { session_id: string };
      if (!session_id) return reply.code(400).send({ error: "Missing session_id" });

      const order = await prismaAny.conceptPackageOrder.findUnique({
        where: { stripeSessionId: session_id },
        select: {
          id: true,
          packageName: true,
          deliveryStatus: true,
          createdAt: true,
          deliveryUrl: true,
        },
      });

      if (!order) return reply.code(404).send({ error: "Order not found" });
      return order;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, "Failed to lookup order") });
    }
  });
}
