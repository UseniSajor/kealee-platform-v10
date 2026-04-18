import { Anthropic } from "@anthropic-ai/sdk";
import { prisma } from "@kealee/core-ddts";
import { zoningService } from "../modules/zoning/zoning.service";

interface ConceptRequest {
  projectType: "garden" | "kitchen" | "landscape" | "renovation";
  scope: string;
  budget: number;
  location: string;
  email: string;
  tier?: 'concept_basic' | 'concept_advanced' | 'concept_full';
  address?: string;
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
  // Zoning intelligence fields
  zoningDistrict?: string;
  zoningFeasibility?: 'PRELIMINARY' | 'MODERATE' | 'VERIFIED';
  zoningRiskFlags?: string[];
  feasibilityFlags?: string[];
  requiresArchitect?: boolean;
  requiresEngineer?: boolean;
  readinessStatus?: 'NOT_READY' | 'NEEDS_MORE_INFO' | 'READY_FOR_ESTIMATE' | 'REQUIRES_ARCHITECT' | 'REQUIRES_ENGINEER';
  nextRecommendedStep?: string;
}

/**
 * Design Bot Service - Generates design concepts using Claude AI
 * Creates MEP systems, bill of materials, cost estimates
 * Integrates zoning intelligence for feasibility-aware concepts
 */
export async function runDesignBot(
  request: ConceptRequest
): Promise<ConceptResponse> {
  const client = new Anthropic();

  // Get zoning intelligence based on tier
  let zoningContext = ''
  if (request.address) {
    try {
      const tier = request.tier || 'concept_basic'
      const zoningData =
        tier === 'concept_full' ? await zoningService.getZoningFullReport({ address: request.address })
        : tier === 'concept_advanced' ? await zoningService.getZoningSummary({ address: request.address })
        : await zoningService.getZoningSnapshot({ address: request.address })

      zoningContext = `ZONING INTELLIGENCE:
Jurisdiction: ${zoningData.jurisdiction}
Zoning District: ${zoningData.zoningDistrict}
Basic Use Allowed: ${zoningData.basicUseAllowed}
Feasibility Rating: ${zoningData.feasibilityRating}
Confidence: ${zoningData.confidenceLevel}%
High Level Constraints: ${zoningData.highLevelConstraints?.join(', ')}
Risk Flags: ${zoningData.riskFlags?.join(', ')}

DESIGN CONSTRAINTS: Ensure concept complies with zoning requirements and addresses any identified risk flags.
`
    } catch (error) {
      console.warn('Failed to get zoning intelligence:', error)
    }
  }

  const systemPrompt = `You are a professional landscape and garden design expert.
Generate design concepts based on project requirements.

${zoningContext}


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
  description: string,
  zoningDistrict: string (optional, if zoning info available),
  zoningFeasibility: "PRELIMINARY" | "MODERATE" | "VERIFIED",
  requiresArchitect: boolean,
  requiresEngineer: boolean,
  readinessStatus: "NOT_READY" | "NEEDS_MORE_INFO" | "READY_FOR_ESTIMATE" | "REQUIRES_ARCHITECT",
  nextRecommendedStep: string
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
${request.address ? `Address: ${request.address}` : ''}
Service Tier: ${request.tier || 'concept_basic'}

Assess feasibility based on zoning constraints.
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

    // Set defaults for zoning fields if not provided
    if (!conceptData.zoningFeasibility) {
      conceptData.zoningFeasibility = 'PRELIMINARY'
    }
    if (conceptData.requiresArchitect === undefined) {
      conceptData.requiresArchitect = false
    }
    if (conceptData.requiresEngineer === undefined) {
      conceptData.requiresEngineer = false
    }
    if (!conceptData.readinessStatus) {
      conceptData.readinessStatus = 'READY_FOR_ESTIMATE'
    }
    if (!conceptData.nextRecommendedStep) {
      conceptData.nextRecommendedStep = 'Proceed to estimation'
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
