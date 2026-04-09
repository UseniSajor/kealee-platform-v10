import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const createStripePriceTool = tool(
  async ({ productName, unitAmount, currency = "usd", productSku }: {
    productName: string;
    unitAmount: number;
    currency?: string;
    productSku: string;
  }) => {
    // TODO: call Stripe API to create product + price
    // In production, use STRIPE_SECRET_KEY from env
    return {
      priceId: `price_placeholder_${productSku}`,
      productId: `prod_placeholder_${productSku}`,
      status: "placeholder",
      note: "Connect to Stripe API with STRIPE_SECRET_KEY env var",
    };
  },
  {
    name: "create_stripe_price",
    description: "Create a Stripe product and price for a Kealee SKU.",
    schema: z.object({
      productName: z.string(),
      unitAmount:  z.number().int().positive().describe("Amount in cents"),
      currency:    z.string().optional(),
      productSku:  z.string(),
    }),
  }
);

export const retrieveStripeProductTool = tool(
  async ({ priceId }: { priceId: string }) => {
    return {
      priceId,
      status: "placeholder",
      note: "Connect to Stripe API to retrieve product/price details.",
    };
  },
  {
    name: "retrieve_stripe_product",
    description: "Retrieve Stripe product details by price ID.",
    schema: z.object({ priceId: z.string() }),
  }
);
