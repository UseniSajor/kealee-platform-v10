/**
 * Generate a concept narrative using Claude.
 * Returns structured text sections for homeowner delivery and architect handoff.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ConceptIntakeInput } from '../floorplan/types';
import type { FloorPlanJson } from '../floorplan/types';

export interface ConceptNarrative {
  projectSummary:    string;
  designIntent:      string;
  spaceBySpace:      Record<string, string>; // room label → 1–2 sentences
  materialDirection: string;
  styleNarrative:    string;
  lifestyleAlignment:string;
  nextSteps:         string;
}

export async function generateConceptNarrative(
  input: ConceptIntakeInput,
  floorplan: FloorPlanJson,
): Promise<ConceptNarrative> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const roomList = floorplan.rooms
    .map(r => `- ${r.label} (~${r.widthFt}' × ${r.depthFt}', ${r.areaFt2} sq ft)`)
    .join('\n');

  const styleStr  = input.stylePreferences.join(', ') || 'contemporary';
  const goalsStr  = (input.goals ?? []).join('; ') || 'improve livability and aesthetics';
  const budget    = input.budgetRange.replace(/_/g, ' ').replace('plus', '+');
  const materials = (input.desiredMaterials ?? []).join(', ') || 'curated selections';
  const path      = input.projectPath.replace(/_/g, ' ');

  const prompt = `You are a licensed architect writing a concept narrative for a homeowner's review package.

PROJECT DETAILS
- Address: ${input.projectAddress}
- Project: ${path}
- Style preferences: ${styleStr}
- Budget range: $${budget}
- Goals: ${goalsStr}
- Desired materials: ${materials}
- Property use: ${input.propertyUse ?? 'Primary Residence'}

FLOOR PLAN ROOMS
${roomList}

Write a structured concept narrative as a JSON object with exactly these keys:
{
  "projectSummary": "2–3 sentences: overview of the project scope and concept direction",
  "designIntent": "1–2 sentences: overarching design philosophy for this project",
  "spaceBySpace": {
    "<room label exactly as listed above>": "1–2 sentences: this room's design direction, materials, and function"
  },
  "materialDirection": "2–3 sentences: material palette, finish hierarchy, and texture direction",
  "styleNarrative": "2–3 sentences: how the style preference translates to specific design decisions for this home",
  "lifestyleAlignment": "1–2 sentences: how the design supports the homeowner's stated goals and lifestyle",
  "nextSteps": "2–3 sentences: how architect-led design development will refine this concept into construction documents"
}

Rules:
- Reference specific rooms by their exact label
- Be specific to the style and project type — avoid generic filler
- Keep nextSteps focused on the architect upsell path
- Return ONLY the raw JSON object, no markdown fences`;

  try {
    const res = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1400,
      messages:   [{ role: 'user', content: prompt }],
    });

    const text    = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned) as ConceptNarrative;
  } catch (err) {
    console.error('[generateConceptNarrative] Claude call failed:', (err as Error).message);
    return buildFallbackNarrative(input, floorplan);
  }
}

function buildFallbackNarrative(
  input: ConceptIntakeInput,
  floorplan: FloorPlanJson,
): ConceptNarrative {
  const style = input.stylePreferences[0] ?? 'contemporary';
  const path  = input.projectPath.replace(/_/g, ' ');
  const spaceBySpace: Record<string, string> = {};

  for (const r of floorplan.rooms) {
    spaceBySpace[r.label] =
      `The ${r.label.toLowerCase()} (~${r.widthFt}' × ${r.depthFt}') is designed ` +
      `to support comfortable daily use with a ${style} aesthetic and thoughtful material selection.`;
  }

  return {
    projectSummary:
      `This ${path} concept for ${input.projectAddress} targets a ${style} design direction ` +
      `with a focus on function, flow, and livability within a $${input.budgetRange.replace(/_/g, ' ')} budget.`,
    designIntent:
      `The design intent is to create a cohesive, well-proportioned space that reflects the ` +
      `homeowner's style preferences while supporting their stated project goals.`,
    spaceBySpace,
    materialDirection:
      `Material selections will draw from a curated palette appropriate for ${style} interiors, ` +
      `balancing durability with visual warmth. Finishes will be coordinated across all spaces for continuity.`,
    styleNarrative:
      `The ${style} direction will be expressed through clean proportions, a restrained material palette, ` +
      `and intentional lighting — adapted to the existing scale and character of the home.`,
    lifestyleAlignment:
      `This concept supports the homeowner's goals by optimizing flow, maximizing natural light, ` +
      `and creating spaces that work harder for daily life.`,
    nextSteps:
      `An architect-led Design Development engagement will refine this concept into ` +
      `construction-ready drawings, coordinate with structural and MEP engineers, and guide the permit submission process.`,
  };
}
