import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";
import Stripe from "stripe";

const Input = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  productKey: z.string(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: z.record(z.string()).optional(),
});

type In = z.infer<typeof Input>;

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  priceId: string;
}

// Maps product key → Stripe price env var name
const PRODUCT_PRICE_MAP: Record<string, string> = {
  EXTERIOR_ESSENTIAL: "STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION",
  EXTERIOR_PROFESSIONAL: "STRIPE_PRICE_DESIGN_ADVANCED",
  EXTERIOR_PREMIUM: "STRIPE_PRICE_DESIGN_FULL",
  GARDEN_BASIC: "STRIPE_PRICE_GARDEN_BASIC",
  GARDEN_ADVANCED: "STRIPE_PRICE_GARDEN_ADVANCED",
  GARDEN_FULL: "STRIPE_PRICE_GARDEN_FULL",
  INTERIOR_BASIC: "STRIPE_PRICE_INTERIOR_BASIC",
  INTERIOR_ADVANCED: "STRIPE_PRICE_INTERIOR_ADVANCED",
  INTERIOR_FULL: "STRIPE_PRICE_INTERIOR_FULL",
  WHOLE_HOME_BASIC: "STRIPE_PRICE_WHOLE_HOME_BASIC",
  WHOLE_HOME_ADVANCED: "STRIPE_PRICE_WHOLE_HOME_ADVANCED",
  WHOLE_HOME_FULL: "STRIPE_PRICE_WHOLE_HOME_FULL",
  DEV_FEASIBILITY: "STRIPE_PRICE_DEV_FEASIBILITY",
  DEV_PROFORMA: "STRIPE_PRICE_DEV_PROFORMA",
  DEV_CAPITAL: "STRIPE_PRICE_DEV_CAPITAL",
  DEV_ENTITLEMENTS: "STRIPE_PRICE_DEV_ENTITLEMENTS",
  EST_BASIC: "STRIPE_PRICE_ESTIMATE_DETAILED",
  PERMIT_STANDARD: "STRIPE_PRICE_PERMIT_SIMPLE",
  PERMIT_EXPEDITED: "STRIPE_PRICE_PERMIT_EXPEDITING",
};

export const createCheckoutTool: ToolDefinition<In, CheckoutResult> = {
  name: "create_checkout",
  description:
    "Creates a Stripe Checkout session for a given product key. Requires operator approval before execution.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: false,
  requiresApproval: true,
  tags: ["payments", "stripe", "checkout"],

  async execute(input: In, context: ToolContext): Promise<CheckoutResult> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const priceEnvKey = PRODUCT_PRICE_MAP[input.productKey];
    if (!priceEnvKey) throw new Error(`Unknown product key: ${input.productKey}`);

    const priceId = process.env[priceEnvKey];
    if (!priceId) throw new Error(`Stripe price ID not configured for: ${priceEnvKey}`);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kealee.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: input.successUrl ?? `${appUrl}/intake/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl ?? `${appUrl}/concept-engine`,
      customer_email: input.email,
      metadata: {
        source: "keacore",
        sessionId: context.session.id,
        productKey: input.productKey,
        ...(input.metadata ?? {}),
      },
    });

    return {
      checkoutUrl: session.url ?? "",
      sessionId: session.id,
      priceId,
    };
  },
};
