/**
 * Zoning Bot Service — @kealee/core-rules
 * Analyzes zoning requirements for DMV properties
 * Uses Claude AI to parse zoning data and provides requirements analysis
 *
 * CONSOLIDATED: Removed duplicate implementations from services/api and services/os-dev
 */

import { Anthropic } from "@anthropic-ai/sdk";
import { prisma } from "@kealee/core-ddts";

export interface ZoningRequest {
  location: string;
  propertySize: number;
  projectType: "garden" | "kitchen" | "landscape" | "renovation";
  email: string;
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
}

/**
 * Run zoning analysis for a property
 */
export async function runZoningBot(
  request: ZoningRequest
): Promise<ZoningResponse> {
  const client = new Anthropic();

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

Return JSON only with: {
  jurisdiction: string,
  zoning: string,
  setbacks: {front, side, rear},
  far: number,
  permitType: string[],
  requirements: string[]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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

    const zoningData = JSON.parse(content.text) as ZoningResponse;

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

    // Save to database
    const savedOutput = await prisma.zoningOutput.create({
      data: {
        location: request.location,
        jurisdiction: zoningData.jurisdiction,
        zoning: zoningData.zoning,
        setbacks: zoningData.setbacks as Record<string, number>,
        far: zoningData.far || null,
        permitTypes: zoningData.permitType,
        requirements: zoningData.requirements,
      },
    });

    console.log(`Zoning analysis saved: ${savedOutput.id}`);

    return zoningData;
  } catch (error) {
    console.error("Error in runZoningBot:", error);
    throw new Error(
      `Failed to generate zoning analysis: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
