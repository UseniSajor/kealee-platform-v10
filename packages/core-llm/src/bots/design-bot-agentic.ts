/**
 * DESIGN BOT - AGENTIC EDITION (Migrated from EnterpriseBot)
 *
 * Multi-step design concept generation using:
 * - Claude Opus for reasoning
 * - RAG tool for jurisdiction + service rules
 * - Optional browser for design research
 *
 * Migration notes:
 * - Replaced callClaude() with callAgentic()
 * - System prompt includes tool guidance
 * - Input handling: context → structured message
 * - Output: JSON with concept details + tool history
 *
 * Feature flag: AGENTIC_DESIGN_BOT=true
 */

import { AgenticBot, type AgenticBotConfig } from '@kealee/core-bots';
import type { SessionMemory } from '@kealee/core-agents';

const DESIGN_BOT_SYSTEM_PROMPT = `
You are an expert residential design specialist with deep knowledge of building codes,
materials, and construction best practices.

YOUR TOOLS:
1. retrieve_context: Get jurisdiction-specific building codes, design standards, material specs
2. (Optional) browse_web: Research design trends, competitor references, material suppliers

YOUR WORKFLOW:
1. Analyze the project requirements (type, budget, style, timeline)
2. Call retrieve_context with jurisdiction + project type to get local rules
3. Generate 3 distinct design concepts that comply with retrieved standards
4. For each concept, provide:
   - Positioning (style, aesthetic approach)
   - Key features (3-5 distinctive elements)
   - Materials & finishes (specific products, colors)
   - Estimated cost range (labor + materials)
   - Build timeline (weeks, phases)
   - Any feasibility concerns

IMPORTANT GUIDELINES:
- Always ground your designs in retrieved context (don't make up building codes)
- If retrieve_context returns empty results:
  * Note the limitation explicitly
  * Proceed with generic best-practices
  * Recommend contacting local authorities for specific rules
- Be specific about materials (not just "flooring" but "bamboo engineered hardwood, 3/4 inch")
- Include labor + material cost breakdown
- Flag any unusual constraints (tight timelines, budget mismatches, etc.)

OUTPUT FORMAT:
Provide a structured JSON response with:
{
  "summary": "Executive overview of the design approach",
  "concepts": [
    {
      "id": "concept_1",
      "name": "Modern Minimalist",
      "positioning": "Clean lines, neutral palette, emphasis on functionality",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
      "materials": { "flooring": "...", "countertops": "...", ... },
      "estimatedCostMin": 45000,
      "estimatedCostMax": 65000,
      "timeline": "8-10 weeks",
      "feasibilityNotes": "Budget-friendly, standard timeline"
    }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "nextSteps": "Recommended next action"
}
`;

export interface DesignBotInput {
  projectType: string; // kitchen, bathroom, addition, whole-home, etc.
  squareFeet: number;
  budget: number;
  stylePreferences: string[];
  location: string;
  timeline?: number; // days
  accessibility?: boolean;
  additionalNotes?: string;
}

export interface DesignConcept {
  id: string;
  name: string;
  positioning: string;
  keyFeatures: string[];
  materials: Record<string, string>;
  estimatedCostMin: number;
  estimatedCostMax: number;
  timeline: string;
  feasibilityNotes?: string;
}

export interface DesignBotOutput {
  summary: string;
  concepts: DesignConcept[];
  recommendations: string[];
  nextSteps: string;
  toolHistory?: any[];
}

export class DesignBotAgentic extends AgenticBot {
  constructor() {
    const config: AgenticBotConfig = {
      name: 'DesignBot',
      description: 'Multi-step design concept generation with jurisdiction-aware recommendations',
      domain: 'design',
      systemPrompt: DESIGN_BOT_SYSTEM_PROMPT,
      model: 'claude-opus-4-8',
      maxTokens: 4096,
      temperature: 0.7,
      enableRagTool: true, // Auto-registered
      enableBrowserTool: false, // Disabled by default (can enable for research)
    };

    super(config);
  }

  async initialize(): Promise<void> {
    // No-op: RAG tool auto-registered in AgenticBot constructor
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    try {
      // Multi-step execution with RAG tool
      return await this.callAgentic(message, {
        sessionId: (context?.sessionId as string) || `session_${Date.now()}`,
        userId: context?.userId as string | undefined,
        projectId: context?.projectId as string | undefined,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        error: `DesignBot failed: ${error}`,
        summary: '',
        concepts: [],
        recommendations: [],
        nextSteps: 'Please try again or contact support',
      });
    }
  }

  shouldHandoff(): null {
    // No handoff logic for design bot
    return null;
  }

  /**
   * Helper: Build structured message from DesignBotInput
   *
   * Usage:
   * ```
   * const message = bot.buildDesignRequest({
   *   projectType: 'kitchen',
   *   squareFeet: 250,
   *   budget: 75000,
   *   stylePreferences: ['modern', 'minimalist'],
   *   location: 'Washington, DC',
   * });
   * const result = await bot.handleMessage(message, context);
   * ```
   */
  buildDesignRequest(input: DesignBotInput): string {
    return `
Design Project Request:

Project Type: ${input.projectType}
Location: ${input.location}
Square Footage: ${input.squareFeet} sqft
Budget: $${input.budget.toLocaleString()}
Style Preferences: ${input.stylePreferences.join(', ')}
Timeline: ${input.timeline ? input.timeline + ' days' : 'flexible'}
Accessibility Required: ${input.accessibility ? 'Yes' : 'No'}
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ''}

Please generate 3 design concepts that align with these parameters. Use the retrieve_context tool
to ground your designs in local building codes and standards for ${input.location}.
`;
  }
}

/**
 * Migration Example: Using DesignBotAgentic
 *
 * Before (EnterpriseBot):
 * ```typescript
 * const bot = new DesignBotEnterprise();
 * const result = await bot.execute({
 *   projectId: 'proj_123',
 *   projectType: 'kitchen',
 *   squareFeet: 250,
 *   budget: 75000,
 *   stylePreferences: ['modern'],
 *   formData: {...}
 * });
 * ```
 *
 * After (AgenticBot):
 * ```typescript
 * const bot = new DesignBotAgentic();
 * const message = bot.buildDesignRequest({
 *   projectType: 'kitchen',
 *   location: 'Washington, DC',
 *   squareFeet: 250,
 *   budget: 75000,
 *   stylePreferences: ['modern'],
 * });
 * const result = await bot.handleMessage(message, {
 *   sessionId: 'session_123',
 *   projectId: 'proj_123',
 * });
 * const output = JSON.parse(result);
 * ```
 */
