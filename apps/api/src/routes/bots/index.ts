/**
 * BOTS ROUTER
 * Master router for all AI bots (Design, Estimate, Permit, Floorplan)
 */

import { Router, Request, Response } from 'express';
import designRouter from './design';
import estimateRouter from './estimate';
import permitRouter from './permit';
import floorplanRouter from './floorplan';
import { prisma } from '@kealee/database';

const router = Router();

// Mount individual bot routers
router.use('/design', designRouter);
router.use('/estimate', estimateRouter);
router.use('/permit', permitRouter);
router.use('/floorplan', floorplanRouter);

/**
 * GET /api/bots/health
 * Check bot health status
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const botMetrics = await prisma.v30BotMetrics.findMany({
      orderBy: { date: 'desc' },
      take: 4, // Last day of each bot
      select: {
        botType: true,
        totalExecutions: true,
        successCount: true,
        failureCount: true,
        averageQuality: true,
        averageCost: true,
      },
    });

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      bots: botMetrics,
      summary: {
        totalBots: 4,
        activeBots: botMetrics.filter((m) => m.successCount > 0).length,
        errorRate: botMetrics.length > 0
          ? botMetrics.reduce((sum, m) => sum + m.failureCount, 0) /
            botMetrics.reduce((sum, m) => sum + m.totalExecutions, 1)
          : 0,
      },
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/bots/metrics
 * Get aggregated bot metrics
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await prisma.v30BotMetrics.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { date: 'desc' },
    });

    const aggregated = {
      period: '7 days',
      totalExecutions: metrics.reduce((sum, m) => sum + m.totalExecutions, 0),
      successCount: metrics.reduce((sum, m) => sum + m.successCount, 0),
      failureCount: metrics.reduce((sum, m) => sum + m.failureCount, 0),
      totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
      averageQuality: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + (m.averageQuality || 0), 0) / metrics.length
        : 0,
      successRate:
        metrics.length > 0
          ? (metrics.reduce((sum, m) => sum + m.successCount, 0) /
              metrics.reduce((sum, m) => sum + m.totalExecutions, 1)) *
            100
          : 0,
      byBot: [
        ...new Set(metrics.map((m) => m.botType)),
      ].map((botType) => {
        const botMetrics = metrics.filter((m) => m.botType === botType);
        return {
          botType,
          executions: botMetrics.reduce((sum, m) => sum + m.totalExecutions, 0),
          successRate:
            (botMetrics.reduce((sum, m) => sum + m.successCount, 0) /
              botMetrics.reduce((sum, m) => sum + m.totalExecutions, 1)) *
            100,
          averageQuality:
            botMetrics.reduce((sum, m) => sum + (m.averageQuality || 0), 0) /
            botMetrics.length,
        };
      }),
    };

    return res.status(200).json(aggregated);
  } catch (error) {
    console.error('Metrics error:', error);
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/bots/status
 * Get real-time bot status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMetrics = await prisma.v30BotMetrics.findMany({
      where: {
        date: today,
      },
    });

    const status = {
      timestamp: new Date(),
      date: today.toISOString(),
      bots: [
        {
          name: 'DesignBot',
          status: todayMetrics.some((m) => m.botType === 'DesignBot') ? 'active' : 'idle',
          executions: todayMetrics.find((m) => m.botType === 'DesignBot')?.totalExecutions || 0,
          successRate: todayMetrics.find((m) => m.botType === 'DesignBot')
            ? ((todayMetrics.find((m) => m.botType === 'DesignBot')?.successCount || 0) /
                (todayMetrics.find((m) => m.botType === 'DesignBot')?.totalExecutions || 1)) *
              100
            : 0,
        },
        {
          name: 'EstimateBot',
          status: todayMetrics.some((m) => m.botType === 'EstimateBot') ? 'active' : 'idle',
          executions: todayMetrics.find((m) => m.botType === 'EstimateBot')?.totalExecutions || 0,
          successRate: todayMetrics.find((m) => m.botType === 'EstimateBot')
            ? ((todayMetrics.find((m) => m.botType === 'EstimateBot')?.successCount || 0) /
                (todayMetrics.find((m) => m.botType === 'EstimateBot')?.totalExecutions || 1)) *
              100
            : 0,
        },
        {
          name: 'PermitBot',
          status: todayMetrics.some((m) => m.botType === 'PermitBot') ? 'active' : 'idle',
          executions: todayMetrics.find((m) => m.botType === 'PermitBot')?.totalExecutions || 0,
          successRate: todayMetrics.find((m) => m.botType === 'PermitBot')
            ? ((todayMetrics.find((m) => m.botType === 'PermitBot')?.successCount || 0) /
                (todayMetrics.find((m) => m.botType === 'PermitBot')?.totalExecutions || 1)) *
              100
            : 0,
        },
        {
          name: 'FloorplanBot',
          status: todayMetrics.some((m) => m.botType === 'FloorplanBot') ? 'active' : 'idle',
          executions: todayMetrics.find((m) => m.botType === 'FloorplanBot')?.totalExecutions || 0,
          successRate: todayMetrics.find((m) => m.botType === 'FloorplanBot')
            ? ((todayMetrics.find((m) => m.botType === 'FloorplanBot')?.successCount || 0) /
                (todayMetrics.find((m) => m.botType === 'FloorplanBot')?.totalExecutions || 1)) *
              100
            : 0,
        },
      ],
    };

    return res.status(200).json(status);
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
});

export default router;
