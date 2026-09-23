/**
 * DESIGN BOT - ENTERPRISE EDITION
 * powered by AI tools home design concept generation
 *
 * Improvements over v30:
 * - Multi-concept generation with variants
 * - Style consistency validation
 * - Budget-aware design suggestions
 * - Accessibility compliance checking
 * - 3D visualization hints for rendering
 * - Material recommendation engine
 * - Cost estimation integration
 */

import { EnterpriseBot, BotConfig, BotResult } from './enterprise-bot-base';
import { prisma } from '@kealee/database';

export interface DesignInput {
  projectId: string;
  projectType: string; // kitchen, bathroom, addition, etc.
  squareFeet: number;
  budget: number;
  stylePreferences: string[];
  accessibility: boolean;
  timeline: number; // days
  formData: any;
}

export interface DesignOutput {
  projectId: string;
  conceptCount: number;
  concepts: Array<{
    id: string;
    name: string;
    description: string;
    styleMatch: number; // 0-100
    estimatedCost: number;
    materials: string[];
    accessibility: string[];
    renderingHints: string;
    uniqueFeatures: string[];
  }>;
  recommendations: string[];
  estimatedTimeline: number;
}

export class DesignBotEnterprise extends EnterpriseBot {
  constructor() {
    const config: BotConfig = {
      name: 'DesignBot',
      model: 'claude-opus-5',
      // maxTokens covers THINKING PLUS the JSON body. These bots run on
      // claude-opus-5 / claude-sonnet-5 where thinking is on by default, so a
      // ceiling sized for the visible JSON alone gets consumed by reasoning
      // and the body is cut off mid-array — surfacing as a JSON.parse error
      // ("Expected ',' or ']' after array element"), not as truncation.
      maxTokens: 16000,
      temperature: 0.7,
      timeout: 60000,
      retries: 3,
      cacheTTL: 3600, // 1 hour cache
    };
    super(config);
  }

  async execute(input: DesignInput): Promise<BotResult<DesignOutput>> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(input);

      // Generate concepts
      const concepts = await this.generateConcepts(input);

      // Validate quality
      const qualityScore = await this.validateQuality(concepts);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(input, concepts);

      const result: DesignOutput = {
        projectId: input.projectId,
        conceptCount: concepts.length,
        concepts,
        recommendations,
        estimatedTimeline: Math.ceil(input.timeline * (1 + Math.random() * 0.2)),
      };

      // Store in database
      await this.storeResult(input.projectId, result);

      return {
        success: true,
        data: result,
        metrics: {
          ...this.metrics,
          executionTime: Date.now() - startTime,
          qualityScore,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.metrics.errors++;
      return {
        success: false,
        error: `DesignBot error: ${(error as Error).message}`,
        metrics: {
          ...this.metrics,
          executionTime: Date.now() - startTime,
        },
        timestamp: new Date(),
      };
    }
  }

  private validateInput(input: DesignInput): void {
    if (!input.projectId || !input.projectType) {
      throw new Error('Missing required fields: projectId, projectType');
    }
    if (input.squareFeet <= 0) {
      throw new Error('Invalid squareFeet');
    }
    if (input.budget <= 0) {
      throw new Error('Invalid budget');
    }
  }

  /**
   * The package promises the purchaser three concept directions to choose
   * between (docs/system/concept-package-deliverables.md). A model that
   * returns two leaves the customer without the comparison they paid for, so
   * the shortfall is asked for again rather than delivered short.
   */
  private static readonly MIN_CONCEPTS = 3;

  private async generateConcepts(input: DesignInput): Promise<DesignOutput['concepts']> {
    const systemPrompt = this._designSystemPrompt();
    const concepts = await this._requestConcepts(input, this._buildConceptPrompt(input), systemPrompt);

    if (concepts.length < DesignBotEnterprise.MIN_CONCEPTS) {
      const missing = DesignBotEnterprise.MIN_CONCEPTS - concepts.length;
      const topUpPrompt = [
        this._buildConceptPrompt(input),
        '',
        `ALREADY PROPOSED — do not repeat these, and do not restate them in your answer:`,
        ...concepts.map((c) => `- ${c.name}: ${c.description}`),
        '',
        `Return exactly ${missing} further distinct concept${missing === 1 ? '' : 's'} in the same JSON shape.`,
      ].join('\n');
      try {
        const extra = await this._requestConcepts(input, topUpPrompt, systemPrompt);
        const seen = new Set(concepts.map((c) => c.name.trim().toLowerCase()));
        for (const candidate of extra) {
          if (concepts.length >= DesignBotEnterprise.MIN_CONCEPTS) break;
          if (seen.has(candidate.name.trim().toLowerCase())) continue;
          seen.add(candidate.name.trim().toLowerCase());
          concepts.push(candidate);
        }
      } catch (error) {
        // The directions already produced still ship; the package states how
        // many were produced rather than implying a missing one exists.
        console.warn('[design-bot] concept top-up failed:', error instanceof Error ? error.message : error);
      }
    }

    return concepts.map((c, idx) => ({ ...c, id: `concept-${idx + 1}` }));
  }

  private async _requestConcepts(
    input: DesignInput,
    prompt: string,
    systemPrompt: string,
  ): Promise<DesignOutput['concepts']> {
    const { content } = await this.callClaude(
      prompt,
      systemPrompt,
      `design-${input.projectId}`
    );

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse design concepts');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const raw = Array.isArray(parsed.concepts) ? parsed.concepts : [];
    return raw
      .filter((c: any) => c && typeof c.name === 'string' && c.name.trim().length > 0)
      .map((c: any, idx: number) => ({
        id: `concept-${idx + 1}`,
        name: c.name,
        description: c.description ?? '',
        styleMatch: c.styleMatch || 75,
        estimatedCost: c.estimatedCost || input.budget * 0.8,
        materials: c.materials || [],
        accessibility: c.accessibility || [],
        renderingHints: c.renderingHints || '',
        uniqueFeatures: c.uniqueFeatures || [],
      }));
  }

  private async generateRecommendations(
    input: DesignInput,
    concepts: DesignOutput['concepts']
  ): Promise<string[]> {
    const prompt = `Based on these design concepts for a ${input.projectType} project:
${concepts.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Generate 3-5 specific recommendations for maximizing ROI and homeowner satisfaction.`;

    const { content } = await this.callClaude(
      prompt,
      'You are an expert home renovation advisor. Provide specific, actionable recommendations.'
    );

    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 5);
  }

  private _buildConceptPrompt(input: DesignInput): string {
    return `You are an expert home designer. Generate 3-5 unique design concepts for the following project:

Project Type: ${input.projectType}
Square Feet: ${input.squareFeet}
Budget: $${input.budget.toLocaleString()}
Style Preferences: ${input.stylePreferences.join(', ')}
Accessibility Required: ${input.accessibility ? 'Yes' : 'No'}${typeof input.formData?.designerDirection === 'string' && input.formData.designerDirection.trim()
  ? `\n\nREVISION — a licensed architect reviewed the previous concept (generation ${Number(input.formData.conceptGeneration ?? 0)}) on Kealee's OS Architecture desk and withheld approval. Their direction, which every concept below MUST follow:\n${input.formData.designerDirection}`
  : ''}
Timeline: ${input.timeline} days

For each concept, provide:
1. A creative name
2. Detailed description
3. Material list
4. Estimated cost
5. Accessibility features (if required)
6. Unique features that set it apart
7. Style match score (0-100)
8. Rendering hints for 3D visualization

Respond with ONLY valid JSON in this format:
{
  "concepts": [
    {
      "name": "...",
      "description": "...",
      "materials": [...],
      "estimatedCost": ...,
      "accessibility": [...],
      "uniqueFeatures": [...],
      "styleMatch": ...,
      "renderingHints": "..."
    }
  ]
}`;
  }

  private _designSystemPrompt(): string {
    return `You are an expert architectural designer specializing in home renovations. Your designs should:
- Be practical and buildable
- Maximize the budget efficiency
- Follow current design trends (2026)
- Consider local building codes
- Account for accessibility when requested
- Include material recommendations that balance quality and cost
- Provide specific, detailed descriptions suitable for visualization

Always respond with valid JSON for easy parsing.`;
  }

  private async storeResult(projectId: string, result: DesignOutput): Promise<void> {
    try {
      await (prisma as any).v30ConceptDeliverable?.upsert({
        where: { projectId },
        create: {
          projectId,
          designBotOutput: result as any,
          status: 'COMPLETED',
          generatedAt: new Date(),
        },
        update: {
          designBotOutput: result as any,
          status: 'COMPLETED',
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store design result:', error);
      // Don't throw - continue even if storage fails
    }
  }

  protected async validateQuality(concepts: DesignOutput['concepts']): Promise<number> {
    if (!concepts || concepts.length === 0) return 0;
    if (concepts.length < 3) return 40;

    let score = 80;
    // Deduct if missing key fields
    for (const concept of concepts) {
      if (!concept.description || concept.description.length < 20) score -= 5;
      if (!concept.materials || concept.materials.length === 0) score -= 5;
      if (concept.styleMatch < 50) score -= 5;
    }

    return Math.max(score, 40);
  }
}

export default DesignBotEnterprise;
