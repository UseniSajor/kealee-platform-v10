/**
 * APP-13 EXTENSION: PROGRESS TRACKING BY PHOTO COMPARISON
 * Uses Claude Vision to compare current vs. previous visit photos,
 * detect construction phase changes, estimate progress %, and flag stalled areas.
 */

import { PrismaClient } from '@prisma/client';
import { claude, MODELS } from '../../../shared/ai/claude.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const eventBus = getEventBus('qa-inspector');

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressAnalysisOptions {
  projectId: string;
  currentPhotos: string[];          // base64 or URLs of current visit photos
  previousPhotos?: string[];         // base64 or URLs of previous visit photos
  siteVisitId?: string;             // current visit ID for linking
  previousVisitId?: string;         // previous visit ID for reference
  projectPhase?: string;            // current expected phase
  areas?: string[];                 // specific areas being photographed
}

export interface AreaProgress {
  area: string;
  previousPhase: string;
  currentPhase: string;
  progressPercent: number;          // 0-100 estimated completion for this area
  changeDetected: boolean;
  description: string;
  concerns: string[];
  isStalled: boolean;               // no visible progress between visits
}

export interface ProgressAnalysisResult {
  projectId: string;
  siteVisitId?: string;
  overallProgressPercent: number;   // weighted average across areas
  phaseDetected: string;            // auto-detected current phase
  areaBreakdown: AreaProgress[];
  stalledAreas: string[];           // areas with no visible progress
  highlights: string[];             // notable progress items
  concerns: string[];               // areas of concern
  comparisonSummary: string;        // AI narrative comparing visits
  analyzedAt: Date;
}

export interface ProgressComparisonInput {
  currentImage: string;             // base64
  previousImage?: string;           // base64
  area?: string;
  expectedPhase?: string;
}

interface VisionProgressResult {
  area: string;
  previousPhase: string;
  currentPhase: string;
  progressPercent: number;
  changeDetected: boolean;
  description: string;
  concerns: string[];
  isStalled: boolean;
  highlights: string[];
}

// ============================================================================
// PROGRESS ANALYSIS SERVICE
// ============================================================================

export class ProgressAnalysisService {
  /**
   * Main entry: Analyze progress across all provided photos
   */
  async analyzeProgress(opts: ProgressAnalysisOptions): Promise<ProgressAnalysisResult> {
    const { projectId, currentPhotos, previousPhotos, projectPhase, areas } = opts;

    // If previous photos exist, do comparison analysis; otherwise single-visit analysis
    const hasPrevious = previousPhotos && previousPhotos.length > 0;

    // Build comparison pairs — match by index or area tags
    const comparisons: ProgressComparisonInput[] = currentPhotos.map((photo, idx) => ({
      currentImage: photo,
      previousImage: hasPrevious ? previousPhotos![Math.min(idx, previousPhotos!.length - 1)] : undefined,
      area: areas?.[idx] || `Area ${idx + 1}`,
      expectedPhase: projectPhase,
    }));

    // Analyze each pair/photo through Claude Vision
    const areaResults: AreaProgress[] = [];
    const allHighlights: string[] = [];
    const allConcerns: string[] = [];

    for (const comparison of comparisons) {
      const result = await this.analyzePhotoPair(comparison);
      areaResults.push({
        area: result.area,
        previousPhase: result.previousPhase,
        currentPhase: result.currentPhase,
        progressPercent: result.progressPercent,
        changeDetected: result.changeDetected,
        description: result.description,
        concerns: result.concerns,
        isStalled: result.isStalled,
      });
      allHighlights.push(...result.highlights);
      allConcerns.push(...result.concerns);
    }

    // Calculate overall progress
    const overallProgressPercent = areaResults.length > 0
      ? Math.round(
          areaResults.reduce((sum: number, a: AreaProgress) => sum + a.progressPercent, 0) / areaResults.length
        )
      : 0;

    // Identify stalled areas
    const stalledAreas = areaResults
      .filter((a: AreaProgress) => a.isStalled)
      .map((a: AreaProgress) => a.area);

    // Detect the dominant phase
    const phaseDetected = this.detectDominantPhase(areaResults);

    // Generate comparison summary narrative
    const comparisonSummary = await this.generateComparisonNarrative(
      areaResults,
      allHighlights,
      allConcerns,
      hasPrevious || false
    );

    const result: ProgressAnalysisResult = {
      projectId,
      siteVisitId: opts.siteVisitId,
      overallProgressPercent,
      phaseDetected,
      areaBreakdown: areaResults,
      stalledAreas,
      highlights: [...new Set(allHighlights)],
      concerns: [...new Set(allConcerns)],
      comparisonSummary,
      analyzedAt: new Date(),
    };

    // Save to the site visit if linked
    if (opts.siteVisitId) {
      await this.saveProgressToVisit(opts.siteVisitId, result);
    }

    // Emit event
    await eventBus.publish((EVENT_TYPES as any).QA_PROGRESS_ANALYZED || 'qa.progress.analyzed', {
      projectId,
      siteVisitId: opts.siteVisitId,
      overallProgressPercent,
      stalledAreas,
      phaseDetected,
    });

    return result;
  }

  /**
   * Compare two photos (current vs. previous) using Claude Vision
   */
  private async analyzePhotoPair(input: ProgressComparisonInput): Promise<VisionProgressResult> {
    const content: any[] = [];

    // Add current photo
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: input.currentImage,
      },
    });

    // Add previous photo if available
    if (input.previousImage) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: input.previousImage,
        },
      });
    }

    // Build prompt based on whether we have comparison or single photo
    const prompt = input.previousImage
      ? `You are a construction progress analyst. Compare these two construction site photos.
The FIRST image is the CURRENT state. The SECOND image is from the PREVIOUS site visit.

Area: ${input.area || 'Unknown'}
Expected Phase: ${input.expectedPhase || 'Unknown'}

Analyze and respond with JSON only:
{
  "area": "${input.area || 'Unknown'}",
  "previousPhase": "detected phase from previous photo (e.g., Foundation, Framing, Rough-In, Drywall, Finish, Landscaping)",
  "currentPhase": "detected phase from current photo",
  "progressPercent": <0-100 estimated completion of this area>,
  "changeDetected": <true if visible progress between photos>,
  "description": "2-3 sentence description of what changed",
  "concerns": ["list any quality, safety, or progress concerns"],
  "isStalled": <true if no meaningful progress between the two photos>,
  "highlights": ["notable positive progress items"]
}`
      : `You are a construction progress analyst. Analyze this construction site photo.

Area: ${input.area || 'Unknown'}
Expected Phase: ${input.expectedPhase || 'Unknown'}

Analyze and respond with JSON only:
{
  "area": "${input.area || 'Unknown'}",
  "previousPhase": "N/A",
  "currentPhase": "detected phase (e.g., Foundation, Framing, Rough-In, Drywall, Finish, Landscaping)",
  "progressPercent": <0-100 estimated completion of this area>,
  "changeDetected": false,
  "description": "2-3 sentence description of current state",
  "concerns": ["list any quality, safety, or progress concerns"],
  "isStalled": false,
  "highlights": ["notable items visible in the photo"]
}`;

    content.push({ type: 'text', text: prompt });

    try {
      const response = await claude.messages.create({
        model: MODELS.BALANCED,
        max_tokens: 2048,
        messages: [{ role: 'user', content }],
      });

      const textBlock = response.content.find((block: Anthropic.Messages.ContentBlock) => block.type === 'text');
      const text = (textBlock as Anthropic.TextBlock)?.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{}');

      return {
        area: parsed.area || input.area || 'Unknown',
        previousPhase: parsed.previousPhase || 'N/A',
        currentPhase: parsed.currentPhase || 'Unknown',
        progressPercent: Math.max(0, Math.min(100, parsed.progressPercent || 0)),
        changeDetected: parsed.changeDetected ?? false,
        description: parsed.description || 'Analysis unavailable',
        concerns: parsed.concerns || [],
        isStalled: parsed.isStalled ?? false,
        highlights: parsed.highlights || [],
      };
    } catch (error) {
      console.error(`[ProgressAnalysis] Vision analysis failed for ${input.area}:`, error);
      return {
        area: input.area || 'Unknown',
        previousPhase: 'N/A',
        currentPhase: 'Unknown',
        progressPercent: 0,
        changeDetected: false,
        description: 'Photo analysis failed — manual review required',
        concerns: ['Automated analysis could not be completed'],
        isStalled: false,
        highlights: [],
      };
    }
  }

  /**
   * Detect the dominant construction phase from area results
   */
  private detectDominantPhase(areas: AreaProgress[]): string {
    const phaseCounts: Record<string, number> = {};
    for (const area of areas) {
      const phase = area.currentPhase;
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    }

    let dominant = 'Unknown';
    let maxCount = 0;
    for (const [phase, count] of Object.entries(phaseCounts)) {
      if (count > maxCount) {
        dominant = phase;
        maxCount = count;
      }
    }

    return dominant;
  }

  /**
   * Generate a narrative comparing visits
   */
  private async generateComparisonNarrative(
    areas: AreaProgress[],
    highlights: string[],
    concerns: string[],
    hadPreviousPhotos: boolean
  ): Promise<string> {
    const prompt = hadPreviousPhotos
      ? `Write a concise 2-3 paragraph progress comparison for a construction project owner.

Area Progress:
${areas.map((a: AreaProgress) => `- ${a.area}: ${a.currentPhase} (${a.progressPercent}% complete)${a.isStalled ? ' [STALLED]' : ''}${a.changeDetected ? ' [PROGRESS DETECTED]' : ''}`).join('\n')}

Highlights: ${highlights.join(', ') || 'None'}
Concerns: ${concerns.join(', ') || 'None'}

Focus on:
1. What progress was made since last visit
2. Any areas that have stalled
3. Overall trajectory

Write in a professional, reassuring tone. Be factual and specific.`
      : `Write a concise 2-paragraph initial assessment for a construction project owner based on the first site visit.

Area Assessment:
${areas.map((a: AreaProgress) => `- ${a.area}: ${a.currentPhase} (${a.progressPercent}% complete)`).join('\n')}

Highlights: ${highlights.join(', ') || 'None'}
Concerns: ${concerns.join(', ') || 'None'}

Focus on current state and what to expect. Write in a professional, reassuring tone.`;

    try {
      const response = await claude.messages.create({
        model: MODELS.FAST,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a construction project manager writing progress updates for clients. Be clear, factual, and professional.',
      });

      const textBlock = response.content.find((block: Anthropic.Messages.ContentBlock) => block.type === 'text');
      return (textBlock as Anthropic.TextBlock)?.text || 'Progress analysis complete. See area breakdown for details.';
    } catch {
      return 'Progress analysis complete. See area breakdown for details.';
    }
  }

  /**
   * Save progress analysis result to the site visit record
   */
  private async saveProgressToVisit(siteVisitId: string, result: ProgressAnalysisResult): Promise<void> {
    try {
      const prismaAny = prisma as any;
      await prismaAny.siteVisit.update({
        where: { id: siteVisitId },
        data: {
          findings: {
            progressAnalysis: {
              overallProgressPercent: result.overallProgressPercent,
              phaseDetected: result.phaseDetected,
              areaBreakdown: result.areaBreakdown,
              stalledAreas: result.stalledAreas,
              highlights: result.highlights,
              concerns: result.concerns,
              comparisonSummary: result.comparisonSummary,
              analyzedAt: result.analyzedAt.toISOString(),
            },
          },
        },
      });
    } catch (error) {
      console.error(`[ProgressAnalysis] Failed to save to visit ${siteVisitId}:`, error);
    }
  }

  /**
   * Get the previous visit's photos for comparison
   */
  async getPreviousVisitPhotos(projectId: string, beforeDate: Date): Promise<{
    visitId: string;
    photos: string[];
    visitDate: Date;
  } | null> {
    const previousVisit = await prisma.siteVisit.findFirst({
      where: {
        projectId,
        status: 'COMPLETED',
        completedAt: { lt: beforeDate },
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        photos: true,
        completedAt: true,
      },
    });

    if (!previousVisit || !previousVisit.photos || previousVisit.photos.length === 0) {
      return null;
    }

    return {
      visitId: previousVisit.id,
      photos: previousVisit.photos,
      visitDate: previousVisit.completedAt || new Date(),
    };
  }

  /**
   * Analyze progress for a site visit by automatically fetching previous visit photos
   */
  async analyzeVisitProgress(siteVisitId: string): Promise<ProgressAnalysisResult> {
    const visit = await prisma.siteVisit.findUniqueOrThrow({
      where: { id: siteVisitId },
      select: {
        id: true,
        projectId: true,
        photos: true,
        scheduledAt: true,
        completedAt: true,
      },
    });

    if (!visit.photos || visit.photos.length === 0) {
      throw new Error('No photos available for this site visit');
    }

    // Get project phase
    const project = await prisma.project.findUnique({
      where: { id: visit.projectId },
      select: { currentPhase: true },
    });

    // Get previous visit photos
    const previousVisit = await this.getPreviousVisitPhotos(
      visit.projectId,
      visit.scheduledAt
    );

    return this.analyzeProgress({
      projectId: visit.projectId,
      currentPhotos: visit.photos,
      previousPhotos: previousVisit?.photos,
      siteVisitId,
      previousVisitId: previousVisit?.visitId,
      projectPhase: project?.currentPhase || undefined,
    });
  }
}

export const progressAnalysisService = new ProgressAnalysisService();
