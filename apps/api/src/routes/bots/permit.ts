/**
 * PERMIT BOT ENDPOINT
 * Generates AI-powered permit roadmaps and compliance checklists
 */

import { Router, Request, Response } from 'express';
import PermitBotEnterprise from '@kealee/core-llm/bots/permit-bot-enterprise';
import { prisma } from '@kealee/database';

const router = Router();
const permitBot = new PermitBotEnterprise();

interface PermitRequest {
  projectId: string;
  projectType: string;
  location: { state: string; county: string; zipCode: string };
  scope: string[];
  estimatedCost: number;
  squareFeet: number;
}

/**
 * POST /api/bots/permit
 * Generate permit requirements
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: PermitRequest = req.body;

    // Validate input
    if (!input.projectId || !input.location.state) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Execute bot
    const result = await permitBot.execute(input);

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
          botType: 'PermitBot',
          date: new Date(),
        },
      },
      create: {
        botType: 'PermitBot',
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
    console.error('Permit bot error:', error);
    return res.status(500).json({
      error: `Permit bot failed: ${(error as Error).message}`,
    });
  }
});

export default router;
