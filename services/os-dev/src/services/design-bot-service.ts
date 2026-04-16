import { Anthropic } from "@anthropic-ai/sdk";
import { prisma } from "@kealee/core-ddts";

interface ConceptRequest {
  projectType: "garden" | "kitchen" | "landscape" | "renovation";
  scope: string;
  budget: number;
  location: string;
  email: string;
}

interface MEPSystem {
  irrigation?: string;
  lighting?: string;
  drainage?: string;
  electrical?: string;
  plumbing?: string;
}

interface BOMItem {
  item: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

interface ConceptResponse {
  mepSystem: MEPSystem;
  billOfMaterials: BOMItem[];
  estimatedCost: number;
  description: string;
}

/**
 * Design Bot Service - Generates design concepts using Claude AI
 * Creates MEP systems, bill of materials, and cost estimates
 */
export async function runDesignBot(
  request: ConceptRequest
): Promise<ConceptResponse> {
  const client = new Anthropic();

  const systemPrompt = `You are a professional landscape and garden design expert.
Generate design concepts based on project requirements.

For gardens:
- Suggest irrigation system (drip, spray, etc)
- Recommend lighting (low-voltage path lights, accent lights)
- Plan drainage solutions
- Suggest plant types and quantities
- Estimate materials needed

For kitchen:
- Layout design recommendations
- Cabinetry and appliances
- Countertop and flooring options
- Plumbing requirements

For landscape:
- Hardscape elements
- Plant selection
- Drainage planning
- Lighting design

For renovations:
- Room-by-room recommendations
- Material selections
- System upgrades

Return JSON only with:
{
  mepSystem: {irrigation, lighting, drainage},
  billOfMaterials: [{item, quantity, unit, estimatedCost}],
  estimatedCost: number,
  description: string
}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 2048,
      system: {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
      messages: [
        {
          role: "user",
          content: `Design concept for:
Project Type: ${request.projectType}
Scope: ${request.scope}
Budget: $${request.budget}
Location (zip): ${request.location}

Return only JSON.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const conceptData = JSON.parse(content.text) as ConceptResponse;

    // Validate response structure
    if (
      !conceptData.mepSystem ||
      !Array.isArray(conceptData.billOfMaterials) ||
      conceptData.estimatedCost === undefined ||
      !conceptData.description
    ) {
      throw new Error("Invalid concept response structure");
    }

    // Save to database
    const savedConcept = await prisma.conceptOutput.create({
      data: {
        projectType: request.projectType,
        scope: request.scope,
        budget: request.budget,
        location: request.location,
        mepSystem: conceptData.mepSystem as Record<string, string>,
        billOfMaterials: conceptData.billOfMaterials as Array<
          Record<string, unknown>
        >,
        estimatedCost: conceptData.estimatedCost,
        description: conceptData.description,
      },
    });

    console.log(`Design concept saved: ${savedConcept.id}`);

    return conceptData;
  } catch (error) {
    console.error("Error in runDesignBot:", error);
    throw new Error(
      `Failed to generate design concept: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
