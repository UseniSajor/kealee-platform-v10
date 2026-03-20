/**
 * services/api/src/modules/intake/public-intake.routes.ts
 * Public (no-auth) intake endpoints — used by apps/web-main /intake flow
 */

import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { z } from "zod";
import { prismaAny } from "../../utils/prisma-helper";
import { sanitizeErrorMessage } from "../../utils/sanitize-error";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
});

// ── Payment amounts per project path ─────────────────────────────────────────
const PATH_AMOUNTS: Record<string, number> = {
  exterior_concept:    38500, // $385 AI Concept Package
  interior_renovation: 38500, // $385 AI Concept Package
  kitchen_remodel:     38500, // $385 AI Concept Package
  bathroom_remodel:    38500, // $385 AI Concept Package
  whole_home_remodel:  38500, // $385 AI Concept Package
  addition_expansion:  38500, // $385 AI Concept Package
  design_build:        38500, // $385 AI Concept Package
  permit_path_only:    14900, // $149 Permit Path Intake
};

const PATH_NAMES: Record<string, string> = {
  exterior_concept:    "Exterior Concept AI Package",
  interior_renovation: "Interior Renovation AI Package",
  kitchen_remodel:     "Kitchen Remodel AI Package",
  bathroom_remodel:    "Bathroom Remodel AI Package",
  whole_home_remodel:  "Whole-Home Remodel AI Package",
  addition_expansion:  "Addition / Expansion AI Package",
  design_build:        "Design + Build AI Package",
  permit_path_only:    "Permit Path Intake",
};

const SITE_VISIT_FEE = 12500; // $125

// ── Schemas ───────────────────────────────────────────────────────────────────
const PublicIntakeBody = z.object({
  projectPath: z.string().min(1),
  clientName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  projectAddress: z.string().min(5),
  budgetRange: z.string().min(1),
  timelineGoal: z.string().optional(),
  uploadedPhotos: z.array(z.string()).default([]),
  source: z.string().default("public_intake"),
  funnelSessionId: z.string().optional(),
}).passthrough();

const CheckoutBody = z.object({
  intakeId: z.string(),
  projectPath: z.string(),
  amount: z.number().int().positive(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  siteVisitRequested: z.boolean().default(false),
});

const CreateTaskBody = z.object({
  intakeId: z.string(),
  projectPath: z.string(),
  tags: z.array(z.string()).default([]),
  siteVisitRequested: z.boolean().default(false),
  clientName: z.string().optional(),
  projectAddress: z.string().optional(),
  preferredVisitWindow: z.string().optional(),
});

// ── Lead scoring ──────────────────────────────────────────────────────────────
const BUDGET_SCORES: Record<string, number> = {
  under_10k: 10, under_50k: 12, "10k_25k": 18, "25k_50k": 22,
  "50k_150k": 22, "50k_100k": 25, "100k_250k": 26, "100k_plus": 28,
  "150k_300k": 26, "250k_500k": 28, "300k_500k": 28, "300k_plus": 27,
  "500k_1m": 29, "500k_plus": 30, "1m_plus": 30,
};

const TIMELINE_SCORES: Record<string, number> = {
  asap: 30, urgent: 30, "1_3_months": 24, "3_6_months": 18,
  "6_12_months": 10, planning: 4, flexible: 6,
};

function scoreLead(data: Record<string, unknown>) {
  const budget = BUDGET_SCORES[String(data.budgetRange ?? "")] ?? 10;
  const urgency = TIMELINE_SCORES[String(data.timelineGoal ?? "planning")] ?? 4;
  const complexity = 10;
  const total = Math.min(100, budget + urgency + complexity);
  const tier = total >= 70 ? "hot" : total >= 45 ? "warm" : "cold";
  const route = tier === "hot" ? "fast_track" : tier === "cold" ? "nurture" : "standard";
  return { total, tier, route };
}

// ── Route plugin ──────────────────────────────────────────────────────────────
export async function publicIntakeRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/intake/public
   * Create a new public intake lead — no authentication required
   */
  fastify.post("/public", async (request, reply) => {
    const parse = PublicIntakeBody.safeParse(request.body);
    if (!parse.success) {
      const errors = parse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return reply.status(400).send({ ok: false, errors });
    }

    const data = parse.data;
    const score = scoreLead(data as Record<string, unknown>);

    try {
      const paymentAmount = PATH_AMOUNTS[data.projectPath] ?? 29900;
      const intake = await prismaAny.publicIntakeLead.create({
        data: {
          clientName: data.clientName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone ?? null,
          projectAddress: data.projectAddress,
          projectPath: data.projectPath,
          budgetRange: data.budgetRange,
          timelineGoal: data.timelineGoal ?? null,
          uploadedPhotos: data.uploadedPhotos,
          source: data.source,
          funnelSessionId: data.funnelSessionId ?? null,
          leadScore: score.total,
          leadTier: score.tier,
          leadRoute: score.route,
          requiresPayment: true,
          paymentAmount,
          metadata: data as unknown as Record<string, unknown>,
          status: "new",
        },
      });

      const requiresPayment = true;

      return reply.send({
        ok: true,
        intakeId: intake.id,
        requiresPayment,
        paymentAmount,
        tier: score.tier,
        route: score.route,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ ok: false, errors: [sanitizeErrorMessage(err)] });
    }
  });

  /**
   * POST /api/v1/intake/checkout
   * Create Stripe checkout session for an existing intake
   */
  fastify.post("/checkout", async (request, reply) => {
    const parse = CheckoutBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid request" });
    }

    const { intakeId, projectPath, amount, successUrl, cancelUrl, siteVisitRequested } = parse.data;

    try {
      const baseAmount = siteVisitRequested ? amount - SITE_VISIT_FEE : amount;

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: "usd",
            unit_amount: baseAmount,
            product_data: { name: PATH_NAMES[projectPath] ?? "Project Intake" },
          },
          quantity: 1,
        },
      ];

      if (siteVisitRequested) {
        lineItems.push({
          price_data: {
            currency: "usd",
            unit_amount: SITE_VISIT_FEE,
            product_data: { name: "Kealee Site Visit Scan" },
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        metadata: {
          source: "public_intake",
          intakeId,
          projectPath,
          siteVisitRequested: siteVisitRequested ? "true" : "false",
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return reply.send({ url: session.url });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });

  /**
   * POST /api/v1/intake/task
   * Create a command-center task for an intake (non-fatal, internal)
   */
  fastify.post("/task", async (request, reply) => {
    const parse = CreateTaskBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid request" });
    }

    const { intakeId, projectPath, tags, siteVisitRequested, clientName, projectAddress, preferredVisitWindow } = parse.data;

    try {
      // Create standard intake review task
      const task = await prismaAny.commandCenterTask?.create?.({
        data: {
          title: `New public intake: ${PATH_NAMES[projectPath] ?? projectPath}`,
          referenceId: intakeId,
          referenceType: "public_intake_lead",
          tags,
          status: "open",
          source: "public_intake",
        },
      }).catch(() => null);

      // Create site visit scheduling task if requested
      let siteVisitTaskId: string | null = null;
      if (siteVisitRequested) {
        const notes = [
          "Contact client to schedule Kealee Site Visit Scan.",
          clientName ? `Client: ${clientName}` : null,
          projectAddress ? `Address: ${projectAddress}` : null,
          preferredVisitWindow ? `Preferred availability: ${preferredVisitWindow}` : null,
        ].filter(Boolean).join(" | ");

        const siteVisitTask = await prismaAny.commandCenterTask?.create?.({
          data: {
            title: `Schedule Site Visit: ${clientName ?? "New Client"} — ${PATH_NAMES[projectPath] ?? projectPath}`,
            referenceId: intakeId,
            referenceType: "public_intake_lead",
            tags: ["site_visit", "needs_scheduling", "operations"],
            status: "open",
            source: "site_visit_intake",
            taskType: "schedule_site_visit",
            queue: "operations",
            priority: "HIGH",
            notes,
          },
        }).catch(() => null);

        siteVisitTaskId = siteVisitTask?.id ?? null;
      }

      return reply.send({ ok: true, taskId: task?.id ?? null, siteVisitTaskId });
    } catch {
      // Non-fatal
      return reply.send({ ok: true, taskId: null, siteVisitTaskId: null });
    }
  });
}
