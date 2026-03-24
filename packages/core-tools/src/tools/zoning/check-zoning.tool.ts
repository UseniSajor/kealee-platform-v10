import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";

const Input = z.object({
  address: z.string().min(5),
});

type In = z.infer<typeof Input>;

export interface ZoningResult {
  address: string;
  zoningCode: string;
  zoningDescription: string;
  allowedUses: string[];
  maxHeight?: string;
  maxLotCoverage?: string;
  setbacks?: {
    front?: string;
    rear?: string;
    side?: string;
  };
  adusPermitted: boolean;
  multifamilyPermitted: boolean;
  riskFlags: string[];
  source: "live" | "stub";
  note?: string;
}

export const checkZoningTool: ToolDefinition<In, ZoningResult> = {
  name: "check_zoning",
  description:
    "Looks up zoning designation, allowed uses, setbacks, ADU eligibility, and basic constraints for a property address.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["zoning", "permits", "intake"],

  async execute(input: In, context: ToolContext): Promise<ZoningResult> {
    // TODO: integrate live zoning API (Regrid, Zoneomics, or local GIS)
    // For now, return a stub with realistic structure so downstream tools have shape

    const addr = input.address.toLowerCase();
    const isUrban = addr.includes("dc") || addr.includes("washington") || addr.includes("baltimore");

    const result: ZoningResult = {
      address: input.address,
      zoningCode: isUrban ? "R-2" : "RS-1",
      zoningDescription: isUrban
        ? "Residential — low-to-medium density, multifamily permitted in some sub-zones"
        : "Residential single-family",
      allowedUses: ["single_family", "accessory_structure", "home_occupation"],
      maxHeight: "35 ft",
      maxLotCoverage: "40%",
      setbacks: { front: "25 ft", rear: "20 ft", side: "5 ft" },
      adusPermitted: true,
      multifamilyPermitted: isUrban,
      riskFlags: [],
      source: "stub",
      note: "TODO: replace with live zoning API call",
    };

    if (result.adusPermitted) {
      result.allowedUses.push("adu");
    }

    // Surface risk flags into session memory
    if (!result.adusPermitted) {
      await context.memory.riskFlags.push("adu_not_permitted_by_zoning");
    }

    return result;
  },
};
