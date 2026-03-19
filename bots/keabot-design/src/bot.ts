/**
 * bots/keabot-design/src/bot.ts
 *
 * DesignBot — generates preliminary design concepts after project intake.
 *
 * Extends KeaBot from @kealee/core-bots.
 * Runs automatically after project intake and produces:
 *   - Concept layout
 *   - Floor plan sketch
 *   - Site placement
 *   - Rough elevations
 *   - EstimateBot input
 *   - PermitBot input
 *
 * Upgrade tiers (wired to revenue hooks):
 *   free               → AI concept only
 *   architect_review   → AI concept + licensed architect review
 *   full_design        → Complete design development package
 */

import { KeaBot, type BotConfig, type BotTool, type BotMessage } from '@kealee/core-bots';
import type {
  ProjectDesignContext,
  DesignPackage,
  EstimateBotInput,
  PermitBotInput,
} from './design.types.js';
import {
  DESIGN_BOT_SYSTEM_PROMPT,
  buildConceptPrompt,
  buildArchitectReviewPrompt,
  buildFullDesignPrompt,
} from './design.prompts.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const DESIGN_BOT_CONFIG: BotConfig = {
  name:         'DesignBot',
  description:  'Generates preliminary design concepts, floor plans, site placement, and elevations immediately after project intake.',
  domain:       'design',
  systemPrompt: DESIGN_BOT_SYSTEM_PROMPT,
  model:        'claude-opus-4-6',   // Use Opus for design quality
  maxTokens:    8192,
  temperature:  0.4,                 // Slight creativity for design
};

// ─── DesignBot class ──────────────────────────────────────────────────────────

export class KeaBotDesign extends KeaBot {
  constructor() {
    super(DESIGN_BOT_CONFIG);
  }

  async initialize(): Promise<void> {
    this._registerDesignTools();
  }

  // ─── Tools ────────────────────────────────────────────────────────────────

  private _registerDesignTools(): void {
    // Tool: generate design concept
    this.registerTool({
      name:        'generate_design_concept',
      description: 'Generate a full preliminary design concept for the project including layout, floor plan, site placement, and elevations.',
      parameters: {
        projectId:     { type: 'string',  description: 'The Kealee project ID' },
        projectType:   { type: 'string',  description: 'residential | multifamily | commercial | mixed_use | adu' },
        buildingSqft:  { type: 'number',  description: 'Target building square footage' },
        lotSqft:       { type: 'number',  description: 'Lot square footage' },
        stories:       { type: 'number',  description: 'Number of stories' },
        bedrooms:      { type: 'number',  description: 'Number of bedrooms (residential)' },
        bathrooms:     { type: 'number',  description: 'Number of bathrooms' },
        budget:        { type: 'number',  description: 'Total project budget in USD' },
        location:      { type: 'string',  description: 'City, state, or address' },
        zoning:        { type: 'string',  description: 'Zoning designation (e.g., R1, R2, C1)' },
        style:         { type: 'string',  description: 'Architectural style preference' },
        programNotes:  { type: 'string',  description: 'Owner program notes and requirements' },
      },
      handler: async (params) => {
        const ctx = params as unknown as ProjectDesignContext;
        return this._generateConcept(ctx);
      },
    });

    // Tool: get design package status
    this.registerTool({
      name:        'get_design_status',
      description: 'Check the status and tier of the design package for a project.',
      parameters: {
        projectId: { type: 'string', description: 'The Kealee project ID' },
      },
      handler: async ({ projectId }) => ({
        projectId,
        status: 'ready',
        tier:   'free',
        message: 'AI concept is available. Upgrade options: advanced_concept ($899) or full_design ($4,499).',
      }),
    });

    // Tool: request upgrade
    this.registerTool({
      name:        'request_design_upgrade',
      description: 'Trigger the revenue hook UI for design package upgrades.',
      parameters: {
        projectId: { type: 'string', description: 'Project ID' },
        currentTier: { type: 'string', description: 'Current design tier (free)' },
      },
      handler: async ({ projectId }) => ({
        hookStage: 'design_complete',
        projectId,
        action:    'show_revenue_hook',
        message:   'Show design upgrade options to the owner.',
      }),
    });
  }

  // ─── Message handler ───────────────────────────────────────────────────────

  async handleMessage(
    message: string,
    context?: Record<string, unknown>,
  ): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string) {
    const lower = message.toLowerCase();

    // Hand off to EstimateBot when design is done and cost questions arise
    if (lower.includes('cost') || lower.includes('budget') || lower.includes('estimate')) {
      return {
        fromBot:             'DesignBot',
        toBot:               'EstimateBot',
        reason:              'Cost estimation requested — handing off to EstimateBot',
        context:             { triggeredBy: 'design_complete' },
        conversationHistory: [] as BotMessage[],
      };
    }

    // Hand off to PermitBot for permit questions
    if (lower.includes('permit') || lower.includes('approval') || lower.includes('zoning')) {
      return {
        fromBot:             'DesignBot',
        toBot:               'PermitBot',
        reason:              'Permit questions — handing off to PermitBot',
        context:             { triggeredBy: 'design_permit_question' },
        conversationHistory: [] as BotMessage[],
      };
    }

    return null;
  }

  // ─── Core generation ───────────────────────────────────────────────────────

  private async _generateConcept(ctx: ProjectDesignContext): Promise<DesignPackage> {
    const prompt = buildConceptPrompt(ctx);
    const response = await this.chat(prompt, { projectId: ctx.projectId });

    // Parse JSON from response
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/);

    let parsed: Partial<DesignPackage>;
    try {
      parsed = JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? '{}');
    } catch {
      // Fallback structure if JSON parsing fails
      parsed = this._buildFallbackPackage(ctx, response);
    }

    return {
      projectId:        ctx.projectId,
      generatedAt:      new Date().toISOString(),
      tier:             'free',
      conceptLayout:    parsed.conceptLayout        ?? this._defaultConceptLayout(ctx),
      floorPlanSketch:  parsed.floorPlanSketch      ?? this._defaultFloorPlan(ctx),
      sitePlacement:    parsed.sitePlacement        ?? this._defaultSitePlacement(ctx),
      elevations:       parsed.elevations           ?? this._defaultElevations(),
      designSummary:    parsed.designSummary        ?? response.slice(0, 400),
      estimateBotInput: parsed.estimateBotInput     ?? this._buildEstimateBotInput(ctx),
      permitBotInput:   parsed.permitBotInput       ?? this._buildPermitBotInput(ctx),
    };
  }

  /**
   * Generate architect review (Tier 2 upgrade).
   * Called after revenue hook checkout completes.
   */
  async generateArchitectReview(
    ctx: ProjectDesignContext,
    aiConcept: DesignPackage,
  ): Promise<{ reviewNotes: Record<string, unknown>; refinedPackage: DesignPackage }> {
    const prompt = buildArchitectReviewPrompt(ctx, JSON.stringify(aiConcept, null, 2));
    const response = await this.chat(prompt, { projectId: ctx.projectId, tier: 'architect_review' });

    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/);

    let reviewNotes: Record<string, unknown> = {};
    try {
      reviewNotes = JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? '{}');
    } catch {
      reviewNotes = { rawReview: response };
    }

    const refinedPackage: DesignPackage = {
      ...aiConcept,
      tier:          'architect_review',
      designSummary: (reviewNotes.refinedSummary as string) ?? aiConcept.designSummary,
    };

    return { reviewNotes, refinedPackage };
  }

  /**
   * Generate full design package (Tier 3 upgrade).
   */
  async generateFullDesignPackage(
    ctx: ProjectDesignContext,
    aiConcept: DesignPackage,
  ): Promise<{ fullDesignPackage: Record<string, unknown>; refinedPackage: DesignPackage }> {
    const prompt = buildFullDesignPrompt(ctx, JSON.stringify(aiConcept, null, 2));
    const response = await this.chat(prompt, { projectId: ctx.projectId, tier: 'full_design' });

    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/);

    let fullDesignPackage: Record<string, unknown> = {};
    try {
      fullDesignPackage = JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? '{}');
    } catch {
      fullDesignPackage = { rawOutput: response };
    }

    const refinedPackage: DesignPackage = { ...aiConcept, tier: 'full_design' };
    return { fullDesignPackage, refinedPackage };
  }

  // ─── Defaults / fallbacks ──────────────────────────────────────────────────

  private _buildFallbackPackage(ctx: ProjectDesignContext, rawResponse: string): Partial<DesignPackage> {
    return {
      conceptLayout: {
        summary:          rawResponse.slice(0, 200),
        zoningSummary:    `${ctx.zoning ?? 'Standard'} zoning`,
        programElements:  ctx.programNotes ? ctx.programNotes.split(',').map(s => s.trim()) : ['Living', 'Kitchen', 'Bedrooms', 'Bathrooms'],
        circulationNotes: 'Standard circulation — review with architect',
        keyDesignMoves:   ['Compact floor plate', 'Maximize natural light'],
        constraints:      [],
      },
      designSummary: rawResponse.slice(0, 300),
    };
  }

  private _defaultConceptLayout(ctx: ProjectDesignContext) {
    return {
      summary:          `${ctx.projectType} project at ${ctx.location ?? 'specified location'}`,
      zoningSummary:    ctx.zoning ?? 'Zoning TBD',
      programElements:  ['Entry', 'Living Room', 'Kitchen', 'Dining', 'Primary Suite', 'Bedrooms', 'Bathrooms', 'Utility'],
      circulationNotes: 'Central corridor with primary suite separation',
      keyDesignMoves:   ['Open plan living', 'Energy efficiency', 'Indoor-outdoor connection'],
      constraints:      ['Verify setbacks with local jurisdiction'],
    };
  }

  private _defaultFloorPlan(ctx: ProjectDesignContext) {
    const sqft = ctx.buildingSqft ?? 2000;
    return {
      description:  `${ctx.stories ?? 1}-story ${ctx.projectType} with ${ctx.bedrooms ?? 3} bedroom program`,
      rooms:        [
        { name: 'Entry Foyer',     sqft: 60,  level: 1 },
        { name: 'Living Room',     sqft: 320, level: 1 },
        { name: 'Kitchen',         sqft: 200, level: 1 },
        { name: 'Dining',          sqft: 160, level: 1 },
        { name: 'Primary Suite',   sqft: 280, level: ctx.stories && ctx.stories > 1 ? 2 : 1 },
        { name: 'Primary Bath',    sqft: 90,  level: ctx.stories && ctx.stories > 1 ? 2 : 1 },
        { name: 'Bedroom 2',       sqft: 160, level: ctx.stories && ctx.stories > 1 ? 2 : 1 },
        { name: 'Bedroom 3',       sqft: 140, level: ctx.stories && ctx.stories > 1 ? 2 : 1 },
        { name: 'Hall Bath',       sqft: 60,  level: ctx.stories && ctx.stories > 1 ? 2 : 1 },
        { name: 'Laundry',         sqft: 50,  level: 1 },
        { name: 'Garage',          sqft: 440, level: 1 },
      ],
      totalSqft:    sqft,
      efficiency:   0.82,
      textLayout:   `[GARAGE 440sf] [ENTRY] [LIVING 320sf]\n[KITCHEN 200sf] [DINING 160sf]\n[PRIMARY SUITE 280sf + BATH 90sf]\n[BR2 160sf] [BR3 140sf] [BATH 60sf]`,
    };
  }

  private _defaultSitePlacement(ctx: ProjectDesignContext) {
    return {
      description:       `Building placed to maximize lot coverage while maintaining required setbacks`,
      setbacks:          'Front: 20ft, Rear: 15ft, Side: 5ft (verify with jurisdiction)',
      buildingFootprint: ctx.buildingSqft ? `${(ctx.buildingSqft * 0.6).toFixed(0)} sqft` : 'TBD',
      parkingNotes:      '2-car garage, 2 driveway spaces',
      accessNotes:       'Primary access from street frontage',
      orientationNotes:  'South-facing living areas preferred for passive solar',
      lotCoverageEst:    0.45,
    };
  }

  private _defaultElevations(): DesignPackage['elevations'] {
    return [
      {
        facade:          'front',
        description:     'Primary street-facing elevation with garage door, entry door, and large windows',
        heightFt:        22,
        keyFeatures:     ['Covered entry porch', 'Garage door', 'Horizontal siding'],
        materialPalette: ['Fiber cement siding', 'Stone veneer accent', 'Metal roofing'],
      },
      {
        facade:          'rear',
        description:     'Rear elevation opening to backyard with sliding glass doors',
        heightFt:        22,
        keyFeatures:     ['Sliding glass doors', 'Covered patio', 'Large windows'],
        materialPalette: ['Matching siding', 'Tempered glass'],
      },
      {
        facade:          'left',
        description:     'Side elevation — limited windows for privacy',
        heightFt:        22,
        keyFeatures:     ['Utility access', 'Minimal openings'],
        materialPalette: ['Matching siding'],
      },
      {
        facade:          'right',
        description:     'Side elevation — matching materials',
        heightFt:        22,
        keyFeatures:     ['Side entry option'],
        materialPalette: ['Matching siding'],
      },
    ];
  }

  private _buildEstimateBotInput(ctx: ProjectDesignContext): EstimateBotInput {
    return {
      buildingSqft:       ctx.buildingSqft ?? 2000,
      stories:            ctx.stories ?? 1,
      projectType:        ctx.projectType,
      qualityLevel:       ctx.budget && ctx.buildingSqft
        ? ctx.budget / ctx.buildingSqft > 400 ? 'premium'
          : ctx.budget / ctx.buildingSqft > 250 ? 'standard'
          : 'economy'
        : 'standard',
      programElements:    ctx.programNotes?.split(',').map(s => s.trim()) ?? ['standard residential'],
      materialPalette:    ['fiber cement siding', 'asphalt shingle', 'standard finishes'],
      location:           ctx.location ?? 'US',
      designComplexity:   'moderate',
    };
  }

  private _buildPermitBotInput(ctx: ProjectDesignContext): PermitBotInput {
    return {
      projectType:          ctx.projectType,
      buildingSqft:         ctx.buildingSqft ?? 2000,
      stories:              ctx.stories ?? 1,
      location:             ctx.location ?? 'US',
      zoning:               ctx.zoning ?? 'R1',
      hasAdu:               ctx.projectType === 'adu',
      hasStructuralChanges: true,  // new construction always has structural
      hasMepWork:           true,  // new construction always has MEP
      programElements:      ctx.programNotes?.split(',').map(s => s.trim()) ?? ['residential'],
    };
  }

  /**
   * Handle design.concept.initiated Redis event.
   * Called by the event listener in the service entry point.
   */
  async handleConceptInitiated(data: {
    projectId: string;
    conceptValidationId: string;
  }): Promise<void> {
    const { scoreDCS, projectToDCSInput } = await import('./scoring.js');
    const { prismaAny } = await import('../../../services/api/src/utils/prisma-helper.js').catch(
      () => ({ prismaAny: null as any })
    );

    // Try to import prisma from the package directly
    let prisma: any;
    try {
      const mod = await import('@kealee/database');
      prisma = mod.prismaAny ?? mod.default;
    } catch {
      prisma = prismaAny;
    }

    if (!prisma) {
      console.error('[DesignBot] No database client available for handleConceptInitiated');
      return;
    }

    try {
      // Load project data
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) {
        console.error('[DesignBot] Project not found:', data.projectId);
        return;
      }

      // Run DCS scoring
      const dcsInput  = projectToDCSInput(project);
      const dcsResult = scoreDCS(dcsInput);

      // Save DCS score and design route to Project
      await prisma.project.update({
        where: { id: data.projectId },
        data: {
          dcsScore:    dcsResult.total,
          designRoute: dcsResult.route,
        },
      });

      // Update ConceptValidation with DCS score and route
      await prisma.projectConceptValidation.update({
        where: { id: data.conceptValidationId },
        data: {
          status:      'IN_REVIEW',
          dcsScore:    dcsResult.total,
          designRoute: dcsResult.route,
        },
      });

      if (dcsResult.skipAiConcept) {
        // DCS >= 71 — skip AI concept, just flag for architect
        console.log(`[DesignBot] DCS ${dcsResult.total} >= 71 — skipping AI concept, flagging architect required`);
        // Emit architect.engagement.required event
        return;
      }

      if (dcsResult.route === 'ARCHITECT_REQUIRED') {
        // DCS 41-70 or budget >= $65K — generate reference sketch only
        console.log(`[DesignBot] ${dcsResult.routingReason} — generating reference sketch`);

        const ctx = {
          projectId:    data.projectId,
          projectType:  project.type ?? 'residential',
          buildingSqft: project.sqft ?? 1500,
          lotSqft:      project.lotSqft,
          stories:      project.stories,
          bedrooms:     project.bedrooms,
          bathrooms:    project.bathrooms,
          budget:       project.budgetEstimated,
          location:     `${project.city ?? ''}, ${project.state ?? ''}`.trim(),
          zoning:       project.zoning,
          programNotes: project.description ?? '',
        };

        const concept = await this._generateConcept(ctx);

        await prisma.projectConceptValidation.update({
          where: { id: data.conceptValidationId },
          data: {
            aiConceptJson: {
              ...concept,
              architectRequired: true,
              routingReason:     dcsResult.routingReason,
              note:              'AI concept provided as reference only. Architect required for permit-ready drawings.',
            },
          },
        });
      } else {
        // AI_ONLY route — generate full concept
        console.log(`[DesignBot] ${dcsResult.routingReason} — generating full AI concept`);

        const ctx = {
          projectId:    data.projectId,
          projectType:  project.type ?? 'residential',
          buildingSqft: project.sqft ?? 1500,
          lotSqft:      project.lotSqft,
          stories:      project.stories,
          bedrooms:     project.bedrooms,
          bathrooms:    project.bathrooms,
          budget:       project.budgetEstimated,
          location:     `${project.city ?? ''}, ${project.state ?? ''}`.trim(),
          zoning:       project.zoning,
          programNotes: project.description ?? '',
        };

        const concept = await this._generateConcept(ctx);

        await prisma.projectConceptValidation.update({
          where: { id: data.conceptValidationId },
          data: {
            aiConceptJson: concept,
            dcsScore:      dcsResult.total,
            designRoute:   dcsResult.route,
          },
        });
      }
    } catch (err: any) {
      console.error('[DesignBot] handleConceptInitiated error:', err?.message);
    }
  }
}
