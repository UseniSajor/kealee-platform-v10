/**
 * Zoning Bot Service — @kealee/core-rules
 * Analyzes zoning requirements for DMV properties
 * Uses Claude AI to parse zoning data and provides requirements analysis
 *
 * CONSOLIDATED: Removed duplicate implementations from services/api and services/os-dev
 */

import { Anthropic } from "@anthropic-ai/sdk";

/** basic = jurisdiction and headline risks; project = adds setbacks/FAR/permit roadmap;
 *  contractor = adds trade permits, inspection sequence, proposal assumptions;
 *  development = adds density/bulk, entitlement path, development risk register. */
export type PropertyIntelligenceDepth = "basic" | "project" | "contractor" | "development";

export interface ZoningRequest {
  location: string;
  propertySize: number;
  projectType: "garden" | "kitchen" | "landscape" | "renovation";
  email: string;
  propertyIntelligenceDepth?: PropertyIntelligenceDepth;
}

export interface ZoningResponse {
  jurisdiction: string;
  zoning: string;
  setbacks: {
    front: number;
    side: number;
    rear: number;
  };
  far?: number; // Floor Area Ratio
  permitType: string[];
  requirements: string[];
  // Populated only at contractor/development depth
  tradePermits?: string[];
  inspectionSequence?: string[];
  proposalAssumptions?: string[];
  // Populated only at development depth
  allowedUses?: string[];
  densityAndBulk?: string;
  entitlementPath?: string[];
  developmentRiskRegister?: { risk: string; severity: string; mitigation: string }[];
}

const DEPTH_PROMPT_ADDENDUM: Record<PropertyIntelligenceDepth, string> = {
  basic: "Return only jurisdiction, zoning district, permitType, and headline requirements. Omit setbacks/far if not confidently known.",
  project: "Also include setbacks, far, and a project-specific permit roadmap in requirements.",
  contractor: "Also include tradePermits (permits by trade), inspectionSequence (ordered inspection steps), and proposalAssumptions (scope exclusions a contractor should state in a client proposal).",
  development: "Also include allowedUses, densityAndBulk (a short description of density/bulk limits), entitlementPath (ordered entitlement/approval steps), and developmentRiskRegister (risk, severity, mitigation entries) for a development feasibility review.",
};

/**
 * Run zoning analysis for a property
 */
export async function runZoningBot(
  request: ZoningRequest
): Promise<ZoningResponse> {
  const client = new Anthropic();
  const depth: PropertyIntelligenceDepth = request.propertyIntelligenceDepth ?? "basic";

  const systemPrompt = `You are a zoning expert for the DC-Baltimore corridor (DMV).
Analyze zoning requirements based on location (zip code).

Known jurisdictions:
- 20024: DC (DCRA) - Urban zoning, no setbacks
- 20745: Prince George's County, MD - Suburban, front 25ft, side 5ft, rear 20ft
- 20814: Montgomery County, MD - Suburban, front 30ft, side 8ft, rear 25ft
- 22202: Arlington County, VA - Urban, front 15ft, side 0ft, rear 10ft
- 22153: Fairfax County, VA - Suburban, front 25ft, side 10ft, rear 20ft
- 22301: Alexandria, VA - Historic, front 20ft, side 5ft, rear 15ft
- 21202: Baltimore City, MD - Urban, front 10ft, side 0ft, rear 15ft

Analysis depth requested: ${depth}. ${DEPTH_PROMPT_ADDENDUM[depth]}
Do not claim a requirement is confirmed without it being consistent with the jurisdiction data above.

Return JSON only with: {
  jurisdiction: string,
  zoning: string,
  setbacks: {front, side, rear},
  far: number,
  permitType: string[],
  requirements: string[]
  ${depth === "contractor" || depth === "development" ? ", tradePermits: string[], inspectionSequence: string[], proposalAssumptions: string[]" : ""}
  ${depth === "development" ? ", allowedUses: string[], densityAndBulk: string, entitlementPath: string[], developmentRiskRegister: {risk, severity, mitigation}[]" : ""}
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze zoning for:
Location: ${request.location}
Property Size: ${request.propertySize} sq ft
Project Type: ${request.projectType}

Return only JSON.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const rawText = content.text.trim();
    const jsonText = rawText.startsWith("```")
      ? rawText.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "")
      : rawText;
    const zoningData = JSON.parse(jsonText) as ZoningResponse;

    // Validate response structure
    if (
      !zoningData.jurisdiction ||
      !zoningData.zoning ||
      !zoningData.setbacks ||
      !Array.isArray(zoningData.permitType) ||
      !Array.isArray(zoningData.requirements)
    ) {
      throw new Error("Invalid zoning response structure");
    }

    return zoningData;
  } catch (error) {
    console.error("Error in runZoningBot:", error);
    throw new Error(
      `Failed to generate zoning analysis: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
