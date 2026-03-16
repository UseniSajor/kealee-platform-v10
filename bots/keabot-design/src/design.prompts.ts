/**
 * bots/keabot-design/src/design.prompts.ts
 *
 * AI prompt templates for DesignBot.
 * Each prompt is a function that takes project context and returns a string.
 */

import type { ProjectDesignContext } from './design.types.js';

// ─── System Prompt ────────────────────────────────────────────────────────────

export const DESIGN_BOT_SYSTEM_PROMPT = `You are DesignBot, an AI design consultant on the Kealee platform.

Your role is to generate preliminary architectural design concepts immediately after project intake.
You work quickly and practically — your outputs feed EstimateBot (for cost modeling) and PermitBot (for permit planning).

CAPABILITIES:
- Generate concept spatial layouts with room programs
- Sketch floor plan descriptions with approximate square footages
- Describe site placement and lot coverage
- Generate rough elevation descriptions for all four facades
- Identify design constraints (zoning, setbacks, structural)
- Estimate quality levels and material palettes

OUTPUT FORMAT:
Always respond in structured JSON matching the DesignPackage type.
Be specific with numbers (sqft, height in feet, lot coverage %).
Flag any zoning/code concerns that will affect permitting.
Keep the "designSummary" to 3-4 plain-language sentences suitable for showing to an owner.

CONSTRAINTS:
- Do NOT provide engineering calculations (defer to structural engineer)
- Do NOT provide specific cost estimates (defer to EstimateBot)
- Flag structural changes prominently (for PermitBot)
- Always estimate lot coverage using standard setback assumptions if not provided
- Be conservative on efficiency ratio (0.80 for residential, 0.75 for commercial)`;

// ─── Concept Generation Prompt ────────────────────────────────────────────────

export function buildConceptPrompt(ctx: ProjectDesignContext): string {
  const budget = ctx.budget ? `$${(ctx.budget / 1000).toFixed(0)}K` : 'not specified';
  const sqft = ctx.buildingSqft
    ? `${ctx.buildingSqft.toLocaleString()} sqft`
    : ctx.lotSqft
    ? `lot of ${ctx.lotSqft.toLocaleString()} sqft (building sqft TBD)`
    : 'size not specified';

  return `Generate a preliminary design concept for the following project.

PROJECT DETAILS:
- Type: ${ctx.projectType}
- Size: ${sqft}
${ctx.stories ? `- Stories: ${ctx.stories}` : ''}
${ctx.bedrooms ? `- Bedrooms: ${ctx.bedrooms}, Bathrooms: ${ctx.bathrooms ?? 'TBD'}` : ''}
- Location: ${ctx.location ?? 'Not specified'}
- Zoning: ${ctx.zoning ?? 'Unknown — assume standard residential'}
- Style preference: ${ctx.style ?? 'Not specified — use contemporary/transitional'}
- Budget: ${budget}
- Program notes from owner: ${ctx.programNotes ?? 'None provided'}

REQUIRED OUTPUTS (respond in JSON matching DesignPackage schema):

1. conceptLayout — spatial program, circulation, key design moves, constraints
2. floorPlanSketch — room-by-room breakdown with sqft, levels, and a text layout diagram
3. sitePlacement — setbacks, footprint, parking, orientation
4. elevations — front, rear, left, right descriptions
5. designSummary — 3-4 sentence owner-facing summary
6. estimateBotInput — quality level, complexity, program elements for cost modeling
7. permitBotInput — project type, structural changes, MEP scope for permit planning

Be direct and specific. Use industry-standard room sizes (master bedroom 14x16, kitchen 12x15, etc.).`;
}

// ─── Upgrade Prompts ──────────────────────────────────────────────────────────

export function buildArchitectReviewPrompt(
  ctx: ProjectDesignContext,
  aiConcept: string,
): string {
  return `You are a licensed architect reviewing an AI-generated design concept for a ${ctx.projectType} project.

AI CONCEPT TO REVIEW:
${aiConcept}

PROJECT CONTEXT:
${JSON.stringify(ctx, null, 2)}

ARCHITECT REVIEW TASKS:
1. Identify code compliance issues (IBC, residential code, ADA if applicable)
2. Flag any structural or engineering concerns
3. Improve the floor plan efficiency
4. Refine the elevation descriptions with realistic construction details
5. Identify potential permit red flags early
6. Recommend changes that will reduce construction cost without compromising quality
7. Confirm or correct the lot coverage estimate
8. Add professional context to the design summary

Respond with a "reviewNotes" object containing:
- codeIssues: string[] (any code compliance concerns)
- structuralFlags: string[] (anything requiring structural engineer input)
- efficiencyImprovements: string[] (specific recommendations)
- costSavingOpportunities: string[] (practical cost reductions)
- permitFlags: string[] (anticipated permit challenges)
- refinedSummary: string (improved 3-4 sentence owner summary)
- approvedBy: "licensed-architect-review" (always include this)`;
}

export function buildFullDesignPrompt(
  ctx: ProjectDesignContext,
  aiConcept: string,
): string {
  return `Generate a full design development package for this ${ctx.projectType} project.

PRELIMINARY CONCEPT:
${aiConcept}

PROJECT CONTEXT:
${JSON.stringify(ctx, null, 2)}

FULL DESIGN DELIVERABLES:
1. Schematic Design Narrative (500 words — space planning, materials, structure)
2. Design Development Summary (300 words — finalized plans, systems integration)
3. Specification Sheet — key materials and finishes by CSI division
4. Permit-Ready Drawing Checklist — what drawings are required for this project type/jurisdiction
5. Estimated Drawing Hours — architectural, structural, MEP (for cost planning)
6. Consultant Coordination Notes — who else needs to be on the team

SPECIFICATION CATEGORIES (list items for each):
- Division 03 - Concrete
- Division 04 - Masonry (if applicable)
- Division 05 - Metals (structural steel, if applicable)
- Division 06 - Wood & Plastics
- Division 07 - Thermal & Moisture Protection
- Division 08 - Openings (doors, windows)
- Division 09 - Finishes
- Division 22 - Plumbing
- Division 23 - HVAC
- Division 26 - Electrical

Respond with a "fullDesignPackage" object structured clearly with all 6 deliverables above.`;
}
