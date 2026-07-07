/**
 * FLOORPLAN BOT ENDPOINT
 * Generates powered by AI tools floorplans and material takeoffs
 */

import { Router, Request, Response } from 'express';
import FloorplanBotEnterprise from '@kealee/core-llm/bots/floorplan-bot-enterprise';
import { prisma } from '@kealee/database';

const router = Router();
const floorplanBot = new FloorplanBotEnterprise();

interface FloorplanRequest {
  projectId: string;
  projectType: string;
  squareFeet: number;
  scope: string[];
  currentLayout: string;
  preferences: {
    openConcept?: boolean;
    accessibility?: boolean;
    traffic?: 'minimal' | 'moderate' | 'active';
  };
}

/**
 * POST /api/bots/floorplan
 * Generate floorplans
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: FloorplanRequest = req.body;

    // Validate input
    if (!input.projectId || !input.projectType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Execute bot
    const result = await floorplanBot.execute(input);

    if (!result.success) {
      return res.status(500).json({
        error: result.error,
        metrics: result.metrics,
      });
    }

    // Store metrics
    await prisma.v30BotMetrics.upsert({
      where: {
        botType_date: {
          botType: 'FloorplanBot',
          date: new Date(),
        },
      },
      create: {
        botType: 'FloorplanBot',
        date: new Date(),
        totalExecutions: 1,
        successCount: 1,
        failureCount: 0,
        averageDuration: result.metrics.executionTime,
        totalCost: String(result.metrics.costUSD),
        averageCost: String(result.metrics.costUSD),
        averageQuality: result.metrics.qualityScore,
        modelDistribution: { 'claude-opus-4-8': 1 },
        totalTokens: result.metrics.tokensUsed,
      },
      update: {
        totalExecutions: { increment: 1 },
        successCount: { increment: 1 },
        totalTokens: { increment: result.metrics.tokensUsed },
      },
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      metrics: result.metrics,
    });
  } catch (error) {
    console.error('Floorplan bot error:', error);
    return res.status(500).json({
      error: `Floorplan bot failed: ${(error as Error).message}`,
    });
  }
});

export default router;
