/**
 * APP-13 EXTENSION: BEFORE/AFTER COMPARISON SERVICE
 * Auto-pairs photos from different visits using Claude Vision area matching,
 * manages BeforeAfterPair records, and provides data for the slider component.
 */

import { PrismaClient } from '@prisma/client';
import { claude, MODELS } from '../../../shared/ai/claude.js';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export interface BeforeAfterPairResult {
  id: string;
  projectId: string;
  area: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  beforeVisitId: string;
  afterVisitId: string;
  beforeDate: string;
  afterDate: string;
  matchConfidence: number;          // 0-100, how confident we are these show the same area
  progressDescription: string;
  beforePhase: string;
  afterPhase: string;
  progressPercent: number;
}

export interface AutoPairOptions {
  projectId: string;
  currentVisitId: string;
  previousVisitId: string;
  currentPhotos: string[];          // base64 images
  previousPhotos: string[];         // base64 images
  currentPhotoUrls: string[];       // stored URLs
  previousPhotoUrls: string[];      // stored URLs
}

interface PhotoAreaMatch {
  currentIndex: number;
  previousIndex: number;
  area: string;
  confidence: number;
  beforePhase: string;
  afterPhase: string;
  progressDescription: string;
  progressPercent: number;
}

// ============================================================================
// BEFORE/AFTER SERVICE
// ============================================================================

export class BeforeAfterService {
  /**
   * Auto-pair photos from two visits by analyzing visual area similarity
   */
  async autoPairPhotos(opts: AutoPairOptions): Promise<BeforeAfterPairResult[]> {
    const { projectId, currentVisitId, previousVisitId } = opts;

    // Use Claude Vision to match current photos with previous photos
    const matches = await this.findAreaMatches(opts);

    // Create BeforeAfterPair records
    const results: BeforeAfterPairResult[] = [];
    const prismaAny = prisma as any;

    for (const match of matches) {
      // Only create pairs with reasonable confidence
      if (match.confidence < 40) continue;

      try {
        const pair = await prismaAny.beforeAfterPair.create({
          data: {
            projectId,
            area: match.area,
            beforePhotoUrl: opts.previousPhotoUrls[match.previousIndex],
            afterPhotoUrl: opts.currentPhotoUrls[match.currentIndex],
            beforeVisitId: previousVisitId,
            afterVisitId: currentVisitId,
            beforeDate: new Date(), // Will be overridden below
            afterDate: new Date(),
            matchConfidence: match.confidence,
            progressDescription: match.progressDescription,
            beforePhase: match.beforePhase,
            afterPhase: match.afterPhase,
            progressPercent: match.progressPercent,
          },
        });

        // Fetch actual visit dates
        const [beforeVisit, afterVisit] = await Promise.all([
          prisma.siteVisit.findUnique({
            where: { id: previousVisitId },
            select: { completedAt: true, scheduledAt: true },
          }),
          prisma.siteVisit.findUnique({
            where: { id: currentVisitId },
            select: { completedAt: true, scheduledAt: true },
          }),
        ]);

        const beforeDate = beforeVisit?.completedAt || beforeVisit?.scheduledAt || new Date();
        const afterDate = afterVisit?.completedAt || afterVisit?.scheduledAt || new Date();

        // Update with correct dates
        await prismaAny.beforeAfterPair.update({
          where: { id: pair.id },
          data: {
            beforeDate,
            afterDate,
          },
        });

        results.push({
          id: pair.id,
          projectId,
          area: match.area,
          beforePhotoUrl: opts.previousPhotoUrls[match.previousIndex],
          afterPhotoUrl: opts.currentPhotoUrls[match.currentIndex],
          beforeVisitId: previousVisitId,
          afterVisitId: currentVisitId,
          beforeDate: beforeDate.toISOString(),
          afterDate: afterDate.toISOString(),
          matchConfidence: match.confidence,
          progressDescription: match.progressDescription,
          beforePhase: match.beforePhase,
          afterPhase: match.afterPhase,
          progressPercent: match.progressPercent,
        });
      } catch (error) {
        console.error(`[BeforeAfter] Failed to create pair for area ${match.area}:`, error);
      }
    }

    return results;
  }

  /**
   * Use Claude Vision to match photos from different visits that show the same area
   */
  private async findAreaMatches(opts: AutoPairOptions): Promise<PhotoAreaMatch[]> {
    // For efficiency, batch analyze: send all current and previous photos together
    // and ask Claude to identify matching pairs
    const content: any[] = [];

    // Label and add current photos
    for (let i = 0; i < opts.currentPhotos.length; i++) {
      content.push({
        type: 'text',
        text: `CURRENT VISIT - Photo ${i + 1}:`,
      });
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: opts.currentPhotos[i],
        },
      });
    }

    // Label and add previous photos
    for (let i = 0; i < opts.previousPhotos.length; i++) {
      content.push({
        type: 'text',
        text: `PREVIOUS VISIT - Photo ${i + 1}:`,
      });
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: opts.previousPhotos[i],
        },
      });
    }

    content.push({
      type: 'text',
      text: `You are a construction site photo matching expert. Match photos from the CURRENT VISIT with photos from the PREVIOUS VISIT that show the SAME AREA or perspective of the construction site.

For each matched pair, identify:
1. Which current photo matches which previous photo
2. The area/location name
3. Your confidence in the match (0-100)
4. What construction phase each photo shows
5. A brief description of progress between the two
6. Estimated completion percentage

Respond with JSON only:
{
  "matches": [
    {
      "currentIndex": <0-based index of current photo>,
      "previousIndex": <0-based index of previous photo>,
      "area": "descriptive area name (e.g., 'Kitchen North Wall', 'Master Bath', 'Front Elevation')",
      "confidence": <0-100>,
      "beforePhase": "phase in previous photo",
      "afterPhase": "phase in current photo",
      "progressDescription": "2-sentence description of what changed",
      "progressPercent": <0-100 completion>
    }
  ]
}

Rules:
- Each photo should appear in AT MOST one match
- Only match photos that clearly show the same area from a similar angle
- If no matches are found, return {"matches": []}
- Sort by confidence descending`,
    });

    try {
      const response = await claude.messages.create({
        model: MODELS.BALANCED,
        max_tokens: 4096,
        messages: [{ role: 'user', content }],
      });

      const textBlock = response.content.find((block: Anthropic.Messages.ContentBlock) => block.type === 'text');
      const text = (textBlock as Anthropic.TextBlock)?.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{"matches":[]}');

      return (parsed.matches || []).map((m: any) => ({
        currentIndex: m.currentIndex || 0,
        previousIndex: m.previousIndex || 0,
        area: m.area || 'Unknown Area',
        confidence: Math.max(0, Math.min(100, m.confidence || 0)),
        beforePhase: m.beforePhase || 'Unknown',
        afterPhase: m.afterPhase || 'Unknown',
        progressDescription: m.progressDescription || '',
        progressPercent: Math.max(0, Math.min(100, m.progressPercent || 0)),
      }));
    } catch (error) {
      console.error('[BeforeAfter] Vision matching failed:', error);
      return [];
    }
  }

  /**
   * Get all before/after pairs for a project
   */
  async getProjectPairs(
    projectId: string,
    options?: { area?: string; limit?: number; offset?: number }
  ): Promise<BeforeAfterPairResult[]> {
    const prismaAny = prisma as any;

    try {
      const whereClause: any = { projectId };
      if (options?.area) whereClause.area = options.area;

      const pairs = await prismaAny.beforeAfterPair.findMany({
        where: whereClause,
        orderBy: { afterDate: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      });

      return pairs.map((pair: any) => ({
        id: pair.id,
        projectId: pair.projectId,
        area: pair.area,
        beforePhotoUrl: pair.beforePhotoUrl,
        afterPhotoUrl: pair.afterPhotoUrl,
        beforeVisitId: pair.beforeVisitId,
        afterVisitId: pair.afterVisitId,
        beforeDate: pair.beforeDate.toISOString(),
        afterDate: pair.afterDate.toISOString(),
        matchConfidence: pair.matchConfidence,
        progressDescription: pair.progressDescription,
        beforePhase: pair.beforePhase,
        afterPhase: pair.afterPhase,
        progressPercent: pair.progressPercent,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get distinct areas that have before/after pairs
   */
  async getAreasWithPairs(projectId: string): Promise<string[]> {
    const prismaAny = prisma as any;

    try {
      const pairs = await prismaAny.beforeAfterPair.findMany({
        where: { projectId },
        select: { area: true },
        distinct: ['area'],
      });

      return pairs.map((p: any) => p.area);
    } catch {
      return [];
    }
  }

  /**
   * Delete a before/after pair (e.g., if incorrectly matched)
   */
  async deletePair(pairId: string): Promise<void> {
    const prismaAny = prisma as any;
    await prismaAny.beforeAfterPair.delete({
      where: { id: pairId },
    });
  }
}

export const beforeAfterService = new BeforeAfterService();
