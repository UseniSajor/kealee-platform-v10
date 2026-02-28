/**
 * System Config Routes
 * Handles SystemConfig, IntegrationCredential, and DashboardWidget models
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

const keyParamSchema = z.object({
  key: z.string().min(1),
});

// SystemConfig
const configListSchema = z.object({
  category: z.string().optional(),
  isPublic: z.string().transform((v) => v === 'true').optional(),
});

const configUpsertSchema = z.object({
  value: z.any(),
  description: z.string().optional(),
  category: z.string().optional(),
  dataType: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  isPublic: z.boolean().optional(),
  isEncrypted: z.boolean().optional(),
  validationRule: z.string().optional(),
});

// IntegrationCredential
const integrationListSchema = z.object({
  service: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'ERROR', 'PENDING_AUTH']).optional(),
  orgId: z.string().uuid().optional(),
});

const integrationCreateSchema = z.object({
  orgId: z.string().uuid().optional(),
  service: z.enum([
    'GOOGLE_CALENDAR', 'GOOGLE_DRIVE', 'GOOGLE_MAPS', 'DOCUSIGN',
    'SENDGRID', 'TWILIO', 'STRIPE', 'GOHIGHLEVEL', 'OPENWEATHER',
    'ANTHROPIC', 'OPENAI', 'GOOGLE_VISION', 'AWS_S3', 'AZURE_BLOB',
    'QUICKBOOKS', 'PROCORE', 'BUILDERTREND',
  ]),
  credentials: z.record(z.any()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'ERROR', 'PENDING_AUTH']).optional(),
  scope: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const integrationUpdateSchema = z.object({
  credentials: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'ERROR', 'PENDING_AUTH']).optional(),
  scope: z.array(z.string()).optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  lastError: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// DashboardWidget
const widgetCreateSchema = z.object({
  type: z.enum([
    'PROJECT_SUMMARY', 'TASK_LIST', 'CALENDAR', 'BUDGET_OVERVIEW',
    'SCHEDULE_TIMELINE', 'RISK_ALERTS', 'PREDICTIONS', 'RECENT_ACTIVITY',
    'METRICS_CHART', 'PERMIT_STATUS', 'INSPECTION_CALENDAR',
    'COMMUNICATION_FEED', 'WEATHER_FORECAST', 'AI_INSIGHTS', 'CUSTOM',
  ]),
  title: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  config: z.record(z.any()).optional(),
  refreshInterval: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const widgetUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  config: z.record(z.any()).optional(),
  refreshInterval: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function systemConfigRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // SYSTEM CONFIG
  // --------------------------------------------------------------------------

  // GET /config - List system configs
  fastify.get(
    '/config',
    { preHandler: [validateQuery(configListSchema)] },
    async (request, reply) => {
      try {
        const query = configListSchema.parse(request.query);

        const where: any = {};
        if (query.category) where.category = query.category;
        if (query.isPublic !== undefined) where.isPublic = query.isPublic;

        const configs = await p.systemConfig.findMany({
          where,
          orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });

        // Strip encrypted values for display
        const safeConfigs = configs.map((c: any) => ({
          ...c,
          value: c.isEncrypted ? '[ENCRYPTED]' : c.value,
        }));

        return reply.send({
          success: true,
          data: safeConfigs,
          count: safeConfigs.length,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to list system configs'),
        });
      }
    }
  );

  // GET /config/:key - Single config by key
  fastify.get(
    '/config/:key',
    { preHandler: [validateParams(keyParamSchema)] },
    async (request, reply) => {
      try {
        const { key } = keyParamSchema.parse(request.params);

        const config = await p.systemConfig.findUnique({
          where: { key },
        });

        if (!config) {
          return reply.code(404).send({
            success: false,
            error: 'Config key not found',
          });
        }

        return reply.send({
          success: true,
          data: {
            ...config,
            value: config.isEncrypted ? '[ENCRYPTED]' : config.value,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get config'),
        });
      }
    }
  );

  // PUT /config/:key - Upsert config
  fastify.put(
    '/config/:key',
    {
      preHandler: [
        validateParams(keyParamSchema),
        validateBody(configUpsertSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { key } = keyParamSchema.parse(request.params);
        const data = configUpsertSchema.parse(request.body);

        const config = await p.systemConfig.upsert({
          where: { key },
          update: {
            value: data.value,
            description: data.description,
            category: data.category,
            dataType: data.dataType,
            isPublic: data.isPublic,
            isEncrypted: data.isEncrypted,
            validationRule: data.validationRule,
          },
          create: {
            key,
            value: data.value,
            description: data.description,
            category: data.category,
            dataType: data.dataType || 'string',
            isPublic: data.isPublic ?? false,
            isEncrypted: data.isEncrypted ?? false,
            validationRule: data.validationRule,
          },
        });

        return reply.send({
          success: true,
          data: {
            ...config,
            value: config.isEncrypted ? '[ENCRYPTED]' : config.value,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to upsert config'),
        });
      }
    }
  );

  // DELETE /config/:key - Delete config
  fastify.delete(
    '/config/:key',
    { preHandler: [validateParams(keyParamSchema)] },
    async (request, reply) => {
      try {
        const { key } = keyParamSchema.parse(request.params);

        const existing = await p.systemConfig.findUnique({ where: { key } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Config key not found',
          });
        }

        await p.systemConfig.delete({ where: { key } });

        return reply.send({
          success: true,
          message: `Config key "${key}" deleted`,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to delete config'),
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // INTEGRATION CREDENTIALS
  // --------------------------------------------------------------------------

  // GET /integrations - List integration credentials
  fastify.get(
    '/integrations',
    { preHandler: [validateQuery(integrationListSchema)] },
    async (request, reply) => {
      try {
        const query = integrationListSchema.parse(request.query);

        const where: any = {};
        if (query.service) where.service = query.service;
        if (query.status) where.status = query.status;
        if (query.orgId) where.orgId = query.orgId;

        const integrations = await p.integrationCredential.findMany({
          where,
          orderBy: { service: 'asc' },
          select: {
            id: true,
            orgId: true,
            service: true,
            status: true,
            scope: true,
            tokenExpiresAt: true,
            lastUsedAt: true,
            lastError: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            // Exclude credentials, accessToken, refreshToken for security
          },
        });

        return reply.send({
          success: true,
          data: integrations,
          count: integrations.length,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to list integrations'),
        });
      }
    }
  );

  // POST /integrations - Create integration credential
  fastify.post(
    '/integrations',
    { preHandler: [validateBody(integrationCreateSchema)] },
    async (request, reply) => {
      try {
        const data = integrationCreateSchema.parse(request.body);

        const integration = await p.integrationCredential.create({
          data: {
            orgId: data.orgId,
            service: data.service,
            credentials: data.credentials,
            status: data.status || 'PENDING_AUTH',
            scope: data.scope || [],
            metadata: data.metadata || undefined,
          },
          select: {
            id: true,
            orgId: true,
            service: true,
            status: true,
            scope: true,
            metadata: true,
            createdAt: true,
          },
        });

        return reply.code(201).send({
          success: true,
          data: integration,
        });
      } catch (error: any) {
        fastify.log.error(error);
        if (error.code === 'P2002') {
          return reply.code(409).send({
            success: false,
            error: 'Integration for this organization and service already exists',
          });
        }
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create integration'),
        });
      }
    }
  );

  // PATCH /integrations/:id - Update integration credential
  fastify.patch(
    '/integrations/:id',
    {
      preHandler: [
        validateParams(idParamSchema),
        validateBody(integrationUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);
        const data = integrationUpdateSchema.parse(request.body);

        const existing = await p.integrationCredential.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Integration not found',
          });
        }

        const updateData: any = {};
        if (data.credentials !== undefined) updateData.credentials = data.credentials;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.scope !== undefined) updateData.scope = data.scope;
        if (data.accessToken !== undefined) updateData.accessToken = data.accessToken;
        if (data.refreshToken !== undefined) updateData.refreshToken = data.refreshToken;
        if (data.tokenExpiresAt !== undefined) updateData.tokenExpiresAt = new Date(data.tokenExpiresAt);
        if (data.lastError !== undefined) updateData.lastError = data.lastError;
        if (data.metadata !== undefined) updateData.metadata = data.metadata;

        const integration = await p.integrationCredential.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            orgId: true,
            service: true,
            status: true,
            scope: true,
            tokenExpiresAt: true,
            lastUsedAt: true,
            lastError: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return reply.send({
          success: true,
          data: integration,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update integration'),
        });
      }
    }
  );

  // DELETE /integrations/:id - Delete integration credential
  fastify.delete(
    '/integrations/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const existing = await p.integrationCredential.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Integration not found',
          });
        }

        await p.integrationCredential.delete({ where: { id } });

        return reply.send({
          success: true,
          message: 'Integration credential deleted',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to delete integration'),
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // DASHBOARD WIDGETS
  // --------------------------------------------------------------------------

  // GET /widgets - List dashboard widgets for current user
  fastify.get(
    '/widgets',
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;

        const widgets = await p.dashboardWidget.findMany({
          where: { userId: user.id },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });

        return reply.send({
          success: true,
          data: widgets,
          count: widgets.length,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to list widgets'),
        });
      }
    }
  );

  // POST /widgets - Create dashboard widget
  fastify.post(
    '/widgets',
    { preHandler: [validateBody(widgetCreateSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const data = widgetCreateSchema.parse(request.body);

        const widget = await p.dashboardWidget.create({
          data: {
            userId: user.id,
            type: data.type,
            title: data.title,
            position: data.position,
            config: data.config || undefined,
            refreshInterval: data.refreshInterval,
            isVisible: data.isVisible ?? true,
            sortOrder: data.sortOrder ?? 0,
          },
        });

        return reply.code(201).send({
          success: true,
          data: widget,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create widget'),
        });
      }
    }
  );

  // PATCH /widgets/:id - Update widget (position, config, etc.)
  fastify.patch(
    '/widgets/:id',
    {
      preHandler: [
        validateParams(idParamSchema),
        validateBody(widgetUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);
        const data = widgetUpdateSchema.parse(request.body);

        const existing = await p.dashboardWidget.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Widget not found',
          });
        }

        if (existing.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.position !== undefined) updateData.position = data.position;
        if (data.config !== undefined) updateData.config = data.config;
        if (data.refreshInterval !== undefined) updateData.refreshInterval = data.refreshInterval;
        if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;
        if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

        const widget = await p.dashboardWidget.update({
          where: { id },
          data: updateData,
        });

        return reply.send({
          success: true,
          data: widget,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update widget'),
        });
      }
    }
  );

  // DELETE /widgets/:id - Delete widget
  fastify.delete(
    '/widgets/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const existing = await p.dashboardWidget.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Widget not found',
          });
        }

        if (existing.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        await p.dashboardWidget.delete({ where: { id } });

        return reply.send({
          success: true,
          message: 'Widget deleted',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to delete widget'),
        });
      }
    }
  );
}
