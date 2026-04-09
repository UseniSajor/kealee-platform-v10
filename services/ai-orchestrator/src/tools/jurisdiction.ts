import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const lookupJurisdictionTool = tool(
  async ({ address }: { address: string }) => {
    // TODO: integrate with services/api jurisdiction module
    // For now: parse address to extract state/county/city
    const parts = address.split(",").map((p) => p.trim());
    const city = parts[parts.length - 3] ?? "";
    const state = parts[parts.length - 2]?.split(" ")[0] ?? "";
    return {
      jurisdiction: `${city}, ${state}`,
      state,
      city,
      permitPortalUrl: null,
      notes: "Jurisdiction lookup — connect to /api/v1/jurisdictions endpoint for live data.",
    };
  },
  {
    name: "lookup_jurisdiction",
    description: "Identify the permitting jurisdiction for a given address.",
    schema: z.object({
      address: z.string().describe("Full street address including city, state, zip"),
    }),
  }
);
