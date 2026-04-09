import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const lookupZoningTool = tool(
  async ({ address, parcelId }: { address?: string; parcelId?: string }) => {
    // TODO: integrate with services/api zoning module and GIS layer
    // Stub returns a structured placeholder — connect to real GIS/zoning API
    return {
      zoning: null,
      overlays: [] as string[],
      allowedUses: [] as string[],
      maxHeight: null,
      maxFAR: null,
      setbacks: { front: null, rear: null, left: null, right: null },
      notes:
        "Zoning lookup — connect to /api/v1/zoning endpoint backed by county GIS data.",
      source: address ?? parcelId ?? "unknown",
    };
  },
  {
    name: "lookup_zoning",
    description:
      "Look up zoning classification, overlays, setbacks, and allowed uses for an address or parcel.",
    schema: z.object({
      address: z.string().optional().describe("Full street address"),
      parcelId: z.string().optional().describe("Assessor parcel number (APN)"),
    }),
  }
);
