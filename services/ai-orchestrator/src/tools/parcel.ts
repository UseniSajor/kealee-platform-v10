import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const lookupParcelTool = tool(
  async ({ parcelId, address }: { parcelId?: string; address?: string }) => {
    // TODO: connect to county assessor API or GIS parcel layer
    return {
      parcelId: parcelId ?? null,
      address: address ?? null,
      lotSizeSqFt: null,
      lotSizeAcres: null,
      currentUse: null,
      assessedValue: null,
      yearBuilt: null,
      structureSqFt: null,
      ownerName: null,
      notes: "Parcel lookup — connect to /api/v1/parcels endpoint backed by county assessor data.",
    };
  },
  {
    name: "lookup_parcel",
    description: "Retrieve parcel details including lot size, current use, and assessed value.",
    schema: z.object({
      parcelId: z.string().optional().describe("Assessor parcel number (APN)"),
      address: z.string().optional().describe("Full street address as fallback"),
    }),
  }
);
