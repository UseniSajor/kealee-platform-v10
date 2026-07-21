/**
 * ESTIMATE BOT ENDPOINT
 * Generates AI-powered construction cost estimates
 */

import { Router, Request, Response } from 'express';
import EstimateBotEnterprise from '@kealee/core-llm/bots/estimate-bot-enterprise';
import { prisma } from '@kealee/database';

const router = Router();
const estimateBot = new EstimateBotEnterprise();

interface EstimateRequest {
  projectId: string;
  projectType: string;
  squareFeet: number;
  scope: string[];
  location: { state: string; zipCode: string };
  timeline: number;
  quality: 'basic' | 'standard' | 'premium';
  materials: string[];
}

/**
 * POST /api/bots/estimate
 * Generate cost estimates
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: EstimateRequest = req.body;

    // Validate input
    if (!input.projectId || !input.location.state) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Execute bot
    const result = await estimateBot.execute(input);

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
          botType: 'EstimateBot',
          date: new Date(),
        },
      },
      create: {
        botType: 'EstimateBot',
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
    console.error('Estimate bot error:', error);
    return res.status(500).json({
      error: `Estimate bot failed: ${(error as Error).message}`,
    });
  }
});

export default router;
