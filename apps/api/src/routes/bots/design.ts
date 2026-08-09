/**
 * DESIGN BOT ENDPOINT
 * Generates powered by AI tools design concepts for construction projects
 */

import { Router, Request, Response } from 'express';
import DesignBotEnterprise from '@kealee/core-llm/bots/design-bot-enterprise';
import { prisma } from '@kealee/database';

const router = Router();
const designBot = new DesignBotEnterprise();

interface DesignRequest {
  projectId: string;
  projectType: string;
  squareFeet: number;
  budget: number;
  stylePreferences: string[];
  accessibility: boolean;
  timeline: number;
  formData: any;
}

/**
 * POST /api/bots/design
 * Generate design concepts
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: DesignRequest = req.body;

    // Validate input
    if (!input.projectId || !input.projectType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Execute bot
    const result = await designBot.execute(input);

    if (!result.success) {
      return res.status(500).json({
        error: result.error,
        metrics: result.metrics,
      });
    }

    // Store metrics in database
    await prisma.v30BotMetrics.upsert({
      where: {
        botType_date: {
          botType: 'DesignBot',
          date: new Date(),
        },
      },
      create: {
        botType: 'DesignBot',
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
        cacheTokens: 0,
        cacheHitRate: result.metrics.cacheHits > 0 ? 0.5 : 0,
      },
      update: {
        totalExecutions: { increment: 1 },
        successCount: { increment: 1 },
        averageDuration: result.metrics.executionTime,
        totalTokens: { increment: result.metrics.tokensUsed },
        cacheHitRate: { increment: result.metrics.cacheHits > 0 ? 0.1 : 0 },
      },
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      metrics: result.metrics,
    });
  } catch (error) {
    console.error('Design bot error:', error);
    return res.status(500).json({
      error: `Design bot failed: ${(error as Error).message}`,
    });
  }
});

/**
 * GET /api/bots/design/metrics
 * Get design bot metrics
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = designBot.getMetrics();
    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return res.status(500).json({ error: 'Failed to get metrics' });
  }
});

export default router;
