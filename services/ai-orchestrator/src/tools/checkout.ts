import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ProductSKU } from "../state/kealee-state";

// Stripe price IDs — these should be set in env vars in production
const STRIPE_PRICE_MAP: Partial<Record<ProductSKU, string>> = {
  LAND_FEASIBILITY_BASIC:     process.env.STRIPE_PRICE_LAND_FEASIBILITY_BASIC     ?? "price_land_basic_placeholder",
  LAND_FEASIBILITY_PRO:       process.env.STRIPE_PRICE_LAND_FEASIBILITY_PRO       ?? "price_land_pro_placeholder",
  DESIGN_CONCEPT_VALIDATION:  process.env.STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION  ?? "price_design_concept_placeholder",
  DESIGN_ADVANCED:            process.env.STRIPE_PRICE_DESIGN_ADVANCED            ?? "price_design_advanced_placeholder",
  ESTIMATE_DETAILED:          process.env.STRIPE_PRICE_ESTIMATE_DETAILED          ?? "price_estimate_detailed_placeholder",
  PERMIT_SIMPLE:              process.env.STRIPE_PRICE_PERMIT_SIMPLE              ?? "price_permit_simple_placeholder",
  PERMIT_PACKAGE:             process.env.STRIPE_PRICE_PERMIT_PACKAGE             ?? "price_permit_package_placeholder",
  PERMIT_COORDINATION:        process.env.STRIPE_PRICE_PERMIT_COORDINATION        ?? "price_permit_coordination_placeholder",
  PM_ADVISORY:                process.env.STRIPE_PRICE_PM_ADVISORY                ?? "price_pm_advisory_placeholder",
  ARCHITECT_VIP:              process.env.STRIPE_PRICE_ARCHITECT_VIP              ?? "price_architect_vip_placeholder",
};

export const createCheckoutSessionTool = tool(
  async ({
    productSku,
    userId,
    projectId,
    successUrl,
    cancelUrl,
    metadata = {},
  }: {
    productSku: ProductSKU;
    userId?: string;
    projectId?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) => {
    const priceId = STRIPE_PRICE_MAP[productSku];
    if (!priceId) {
      return { error: `No Stripe price configured for SKU: ${productSku}` };
    }

    // TODO: call services/api stripe checkout endpoint
    // POST /api/v1/payments/checkout
    const apiUrl = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
    try {
      const response = await fetch(`${apiUrl}/api/v1/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "" },
        body: JSON.stringify({
          priceId,
          productSku,
          userId,
          projectId,
          successUrl,
          cancelUrl,
          metadata: { ...metadata, productSku, projectId: projectId ?? "" },
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        return { error: `Checkout API error: ${response.status} — ${text}` };
      }
      const data = (await response.json()) as { url?: string; sessionId?: string };
      return { checkoutUrl: data.url, sessionId: data.sessionId, productSku };
    } catch (err) {
      return { error: `Checkout API unreachable: ${String(err)}`, productSku };
    }
  },
  {
    name: "create_checkout_session",
    description: "Create a Stripe checkout session for a Kealee product SKU.",
    schema: z.object({
      productSku:  z.string().describe("Kealee product SKU"),
      userId:      z.string().optional(),
      projectId:   z.string().optional(),
      successUrl:  z.string().url(),
      cancelUrl:   z.string().url(),
      metadata:    z.record(z.string()).optional(),
    }),
  }
);
