import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

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
  setbacks?: { front?: string; rear?: string; side?: string };
  adusPermitted: boolean;
  multifamilyPermitted: boolean;
  riskFlags: string[];
  jurisdiction: string;
  jurisdictionCode: string;
  permitAuthority: string;
  permitPortalUrl: string;
  zoningMapUrl: string;
  source: "live" | "ai" | "stub";
  confidence: "high" | "medium" | "low";
  note?: string;
}

// Jurisdiction detection from address string
function detectJurisdiction(address: string): {
  code: string;
  name: string;
  permitAuthority: string;
  permitPortalUrl: string;
  zoningMapUrl: string;
} {
  const a = address.toLowerCase();

  if (a.includes(", dc") || a.includes("washington, d.c") || a.includes("washington dc") || a.match(/\bdc\b/)) {
    return {
      code: "dc",
      name: "District of Columbia",
      permitAuthority: "DC Department of Buildings",
      permitPortalUrl: "https://dob.dc.gov/service/building-permits",
      zoningMapUrl: "https://maps.dcoz.dc.gov",
    };
  }
  if (a.includes("montgomery county") || a.includes(", md") && (a.includes("rockville") || a.includes("bethesda") || a.includes("silver spring") || a.includes("gaithersburg") || a.includes("germantown"))) {
    return {
      code: "montgomery_md",
      name: "Montgomery County, MD",
      permitAuthority: "Montgomery County Dept. of Permitting Services",
      permitPortalUrl: "https://permitting.montgomerycountymd.gov",
      zoningMapUrl: "https://montgomeryplanning.org/tools/gis-maps-and-data/",
    };
  }
  if (a.includes("prince george") || (a.includes(", md") && (a.includes("hyattsville") || a.includes("college park") || a.includes("bowie") || a.includes("laurel") || a.includes("greenbelt")))) {
    return {
      code: "pg_md",
      name: "Prince George's County, MD",
      permitAuthority: "Prince George's DPIE",
      permitPortalUrl: "https://dpie.mypgc.us",
      zoningMapUrl: "https://pgplanning.org/resources/zoning/",
    };
  }
  if (a.includes("fairfax") || (a.includes(", va") && (a.includes("reston") || a.includes("herndon") || a.includes("mclean") || a.includes("annandale") || a.includes("springfield")))) {
    return {
      code: "fairfax_va",
      name: "Fairfax County, VA",
      permitAuthority: "Fairfax County Land Development Services",
      permitPortalUrl: "https://plus.fairfaxcounty.gov",
      zoningMapUrl: "https://www.fairfaxcounty.gov/planning-zoning/",
    };
  }
  if (a.includes("arlington") && a.includes("va")) {
    return {
      code: "arlington_va",
      name: "Arlington County, VA",
      permitAuthority: "Arlington County Dept. of Community Planning, Housing & Development",
      permitPortalUrl: "https://www.arlingtonva.us/Government/Departments/Community-Planning-Housing-Development/Permits",
      zoningMapUrl: "https://gis.arlingtonva.us/",
    };
  }
  if (a.includes("alexandria") && a.includes("va")) {
    return {
      code: "alexandria_va",
      name: "Alexandria, VA",
      permitAuthority: "City of Alexandria Building & Fire Codes",
      permitPortalUrl: "https://www.alexandriava.gov/Building-permits",
      zoningMapUrl: "https://www.alexandriava.gov/ZoningInformation",
    };
  }
  if (a.includes("loudoun") || (a.includes(", va") && (a.includes("leesburg") || a.includes("ashburn") || a.includes("sterling") || a.includes("purcellville")))) {
    return {
      code: "loudoun_va",
      name: "Loudoun County, VA",
      permitAuthority: "Loudoun County Dept. of Building & Development",
      permitPortalUrl: "https://www.loudoun.gov/permits",
      zoningMapUrl: "https://www.loudoun.gov/2248/Zoning-District-Maps",
    };
  }

  // Fallback
  return {
    code: "unknown",
    name: "Unknown Jurisdiction",
    permitAuthority: "Local Building Department",
    permitPortalUrl: "",
    zoningMapUrl: "",
  };
}

export const checkZoningTool: ToolDefinition<In, ZoningResult> = {
  name: "check_zoning",
  description:
    "Looks up zoning designation, allowed uses, setbacks, ADU eligibility, and risk flags for a property address. Uses AI to interpret jurisdiction-specific zoning context.",
  version: "2.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["zoning", "permits", "intake"],

  async execute(input: In, context: ToolContext): Promise<ZoningResult> {
    const jurisdiction = detectJurisdiction(input.address);
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // If we have the Anthropic key, use Claude to provide a jurisdiction-informed zoning analysis
    if (anthropicKey) {
      const client = new Anthropic({ apiKey: anthropicKey });

      const prompt = `You are a zoning analyst for the ${jurisdiction.name} area.

Given this address: "${input.address}"

Based on your knowledge of ${jurisdiction.name} zoning regulations, provide a JSON zoning analysis with these exact fields:
{
  "zoningCode": "likely residential zone code (e.g. R-1, RS-1, R-2)",
  "zoningDescription": "plain English description",
  "allowedUses": ["array", "of", "allowed", "uses"],
  "maxHeight": "max building height",
  "maxLotCoverage": "max lot coverage percent",
  "setbacks": {"front": "x ft", "rear": "x ft", "side": "x ft"},
  "adusPermitted": true/false,
  "multifamilyPermitted": true/false,
  "riskFlags": ["list", "of", "risk", "flags"],
  "confidence": "high|medium|low"
}

Risk flags to consider: historic_review_possible, flood_zone_check, zoning_relief_possible, occupancy_change_check, adu_size_restriction, hoa_likely, commercial_corridor_proximity.

Respond ONLY with valid JSON, no other text.`;

      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
        const parsed = JSON.parse(text) as Partial<ZoningResult>;

        const result: ZoningResult = {
          address: input.address,
          zoningCode: parsed.zoningCode ?? "R-1",
          zoningDescription: parsed.zoningDescription ?? "Residential",
          allowedUses: parsed.allowedUses ?? ["single_family"],
          maxHeight: parsed.maxHeight,
          maxLotCoverage: parsed.maxLotCoverage,
          setbacks: parsed.setbacks,
          adusPermitted: parsed.adusPermitted ?? true,
          multifamilyPermitted: parsed.multifamilyPermitted ?? false,
          riskFlags: parsed.riskFlags ?? [],
          jurisdiction: jurisdiction.name,
          jurisdictionCode: jurisdiction.code,
          permitAuthority: jurisdiction.permitAuthority,
          permitPortalUrl: jurisdiction.permitPortalUrl,
          zoningMapUrl: jurisdiction.zoningMapUrl,
          source: "ai",
          confidence: (parsed.confidence as "high" | "medium" | "low") ?? "medium",
          note: `AI-generated analysis for ${jurisdiction.name}. Verify at ${jurisdiction.zoningMapUrl}`,
        };

        // Bubble risk flags into session memory
        for (const flag of result.riskFlags) {
          if (!context.memory.riskFlags.includes(flag)) {
            context.memory.riskFlags.push(flag);
          }
        }

        return result;
      } catch (err) {
        // Fall through to stub on AI failure
        console.warn("[check_zoning] AI call failed, using stub:", err);
      }
    }

    // Stub fallback when no API key or AI call fails
    // TODO: integrate live Regrid or Zoneomics parcel API for real data
    const isUrban = ["dc", "arlington_va", "alexandria_va"].includes(jurisdiction.code);

    return {
      address: input.address,
      zoningCode: isUrban ? "R-2" : "RS-1",
      zoningDescription: isUrban
        ? "Residential — low-to-medium density"
        : "Residential single-family",
      allowedUses: ["single_family", "accessory_structure", "home_occupation", "adu"],
      maxHeight: "35 ft",
      maxLotCoverage: "40%",
      setbacks: { front: "25 ft", rear: "20 ft", side: "5 ft" },
      adusPermitted: true,
      multifamilyPermitted: isUrban,
      riskFlags: [],
      jurisdiction: jurisdiction.name,
      jurisdictionCode: jurisdiction.code,
      permitAuthority: jurisdiction.permitAuthority,
      permitPortalUrl: jurisdiction.permitPortalUrl,
      zoningMapUrl: jurisdiction.zoningMapUrl,
      source: "stub",
      confidence: "low",
      note: "TODO: Set ANTHROPIC_API_KEY or integrate Regrid API for real zoning data",
    };
  },
};
