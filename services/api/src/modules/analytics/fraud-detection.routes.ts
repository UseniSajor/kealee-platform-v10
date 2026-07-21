/**
 * Fraud Detection Routes
 * Handles FraudScore and ChurnPrediction models
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const fraudScoreListSchema = z.object({
  userId: z.string().uuid().optional(),
  riskLevel: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).optional(),
  entityType: z.string().optional(),
  manualReviewRequired: z.string().transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

const fraudScoreCreateSchema = z.object({
  transactionId: z.string().optional(),
  userId: z.string().uuid().optional(),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  riskLevel: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  confidence: z.number().min(0).max(100),
  features: z.record(z.any()),
  flaggedReasons: z.array(z.string()).optional(),
  manualReviewRequired: z.boolean().optional(),
  actionsTaken: z.array(z.string()).optional(),
});

const churnPredictionListSchema = z.object({
  userId: z.string().uuid().optional(),
  riskLevel: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).optional(),
  minProbability: z.string().transform(Number).optional(),
  priorityLevel: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

const churnPredictionCreateSchema = z.object({
  userId: z.string().uuid(),
  churnScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  confidence: z.number().min(0).max(100),
  churnProbability: z.number().min(0).max(100),
  riskFactors: z.record(z.any()),
  features: z.record(z.any()),
  retentionActions: z.array(z.string()).optional(),
  priorityLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  lastEngagement: z.string().datetime().optional(),
  daysSinceActivity: z.number().int().optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function fraudDetectionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // FRAUD SCORES
  // --------------------------------------------------------------------------

  // GET /fraud-scores - List fraud scores with filtering and pagination
  fastify.get(
    '/fraud-scores',
    { preHandler: [validateQuery(fraudScoreListSchema)] },
    async (request, reply) => {
      try {
        const query = fraudScoreListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.userId) where.userId = query.userId;
        if (query.riskLevel) where.riskLevel = query.riskLevel;
        if (query.entityType) where.entityType = query.entityType;
        if (query.manualReviewRequired !== undefined) {
          where.manualReviewRequired = query.manualReviewRequired;
        }

        const [scores, total] = await Promise.all([
          p.fraudScore.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          }),
          p.fraudScore.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: scores,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to list fraud scores'),
        });
      }
    }
  );

  // GET /fraud-scores/:id - Single fraud score
  fastify.get(
    '/fraud-scores/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const score = await p.fraudScore.findUnique({
          where: { id },
          include: {
            user: { select: { id: true, email: true, name: true } },
            reviewer: { select: { id: true, email: true, name: true } },
          },
        });

        if (!score) {
          return reply.code(404).send({
            success: false,
            error: 'Fraud score not found',
          });
        }

        return reply.send({
          success: true,
          data: score,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get fraud score'),
        });
      }
    }
  );

  // POST /fraud-scores - Create/calculate fraud score
  fastify.post(
    '/fraud-scores',
    { preHandler: [validateBody(fraudScoreCreateSchema)] },
    async (request, reply) => {
      try {
        const data = fraudScoreCreateSchema.parse(request.body);

        const score = await p.fraudScore.create({
          data: {
            transactionId: data.transactionId,
            userId: data.userId,
            entityType: data.entityType,
            entityId: data.entityId,
            score: data.score,
            riskLevel: data.riskLevel,
            confidence: data.confidence,
            features: data.features,
            flaggedReasons: data.flaggedReasons || [],
            manualReviewRequired: data.manualReviewRequired ?? false,
            actionsTaken: data.actionsTaken || [],
          },
        });

        return reply.code(201).send({
          success: true,
          data: score,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create fraud score'),
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // CHURN PREDICTIONS
  // --------------------------------------------------------------------------

  // GET /churn-predictions - List churn predictions with filtering
  fastify.get(
    '/churn-predictions',
    { preHandler: [validateQuery(churnPredictionListSchema)] },
    async (request, reply) => {
      try {
        const query = churnPredictionListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.userId) where.userId = query.userId;
        if (query.riskLevel) where.riskLevel = query.riskLevel;
        if (query.priorityLevel) where.priorityLevel = query.priorityLevel;
        if (query.minProbability !== undefined) {
          where.churnProbability = { gte: query.minProbability };
        }

        const [predictions, total] = await Promise.all([
          p.churnPrediction.findMany({
            where,
            orderBy: { churnScore: 'desc' },
            skip,
            take: limit,
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          }),
          p.churnPrediction.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: predictions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to list churn predictions'),
        });
      }
    }
  );

  // POST /churn-predictions - Create prediction
  fastify.post(
    '/churn-predictions',
    { preHandler: [validateBody(churnPredictionCreateSchema)] },
    async (request, reply) => {
      try {
        const data = churnPredictionCreateSchema.parse(request.body);

        // Upsert because ChurnPrediction has unique userId
        const prediction = await p.churnPrediction.upsert({
          where: { userId: data.userId },
          update: {
            churnScore: data.churnScore,
            riskLevel: data.riskLevel,
            confidence: data.confidence,
            churnProbability: data.churnProbability,
            riskFactors: data.riskFactors,
            features: data.features,
            retentionActions: data.retentionActions || [],
            priorityLevel: data.priorityLevel || 'low',
            lastEngagement: data.lastEngagement ? new Date(data.lastEngagement) : undefined,
            daysSinceActivity: data.daysSinceActivity,
            calculatedAt: new Date(),
          },
          create: {
            userId: data.userId,
            churnScore: data.churnScore,
            riskLevel: data.riskLevel,
            confidence: data.confidence,
            churnProbability: data.churnProbability,
            riskFactors: data.riskFactors,
            features: data.features,
            retentionActions: data.retentionActions || [],
            priorityLevel: data.priorityLevel || 'low',
            lastEngagement: data.lastEngagement ? new Date(data.lastEngagement) : undefined,
            daysSinceActivity: data.daysSinceActivity,
          },
        });

        return reply.code(201).send({
          success: true,
          data: prediction,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create churn prediction'),
        });
      }
    }
  );
}
