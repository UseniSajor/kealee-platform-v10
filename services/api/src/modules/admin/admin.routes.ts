/**
 * Admin Routes
 * Backend endpoints for os-admin settings, email templates, and RBAC role updates
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateBody, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const settingsSchema = z.object({
  featureFlags: z.record(z.boolean()).optional(),
  integrations: z.record(z.object({
    enabled: z.boolean(),
    webhookSecret: z.string().optional(),
    url: z.string().optional(),
    apiKey: z.string().optional(),
  })).optional(),
  security: z.object({
    requireMfa: z.boolean().optional(),
    sessionTimeout: z.number().optional(),
    maxLoginAttempts: z.number().optional(),
  }).optional(),
  notifications: z.object({
    emailEnabled: z.boolean().optional(),
    slackEnabled: z.boolean().optional(),
    slackWebhook: z.string().optional(),
  }).optional(),
});

const emailTemplateUpdateSchema = z.object({
  subject: z.string().optional(),
  body: z.string().optional(),
  isActive: z.boolean().optional(),
});

const roleUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

// ============================================================================
// SETTINGS KEYS - How we store structured settings in SystemConfig
// ============================================================================

const SETTINGS_CATEGORIES = {
  featureFlags: 'feature_flags',
  integrations: 'integrations',
  security: 'security',
  notifications: 'notifications',
};

// ============================================================================
// ROUTES
// ============================================================================

export async function adminRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // ADMIN SETTINGS (aggregates SystemConfig entries)
  // --------------------------------------------------------------------------

  // GET /settings - Get all admin settings as structured object
  fastify.get('/settings', async (request, reply) => {
    try {
      // Fetch all admin-category system configs
      const configs = await p.systemConfig.findMany({
        where: {
          category: {
            in: Object.values(SETTINGS_CATEGORIES),
          },
        },
      });

      // Build structured settings object from key-value configs
      const settings: any = {
        featureFlags: {},
        integrations: {
          stripe: { enabled: true },
          supabase: { enabled: true },
          resend: { enabled: true },
          anthropic: { enabled: true },
        },
        security: {
          requireMfa: false,
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
        },
        notifications: {
          emailEnabled: true,
          slackEnabled: false,
        },
      };

      for (const config of configs) {
        try {
          const value = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;

          if (config.category === SETTINGS_CATEGORIES.featureFlags) {
            // key = "feature_flag.aiReview", value = true/false
            const flagName = config.key.replace('feature_flag.', '');
            settings.featureFlags[flagName] = value;
          } else if (config.category === SETTINGS_CATEGORIES.integrations) {
            // key = "integration.stripe", value = { enabled, webhookSecret, ... }
            const serviceName = config.key.replace('integration.', '');
            settings.integrations[serviceName] = {
              ...settings.integrations[serviceName],
              ...value,
            };
          } else if (config.category === SETTINGS_CATEGORIES.security) {
            // key = "security.config", value = { requireMfa, sessionTimeout, ... }
            if (config.key === 'security.config') {
              settings.security = { ...settings.security, ...value };
            }
          } else if (config.category === SETTINGS_CATEGORIES.notifications) {
            // key = "notifications.config", value = { emailEnabled, slackEnabled, ... }
            if (config.key === 'notifications.config') {
              settings.notifications = { ...settings.notifications, ...value };
            }
          }
        } catch (parseErr) {
          // If value isn't JSON, skip
          fastify.log.warn(`Failed to parse config ${config.key}: ${parseErr}`);
        }
      }

      return reply.send({ settings });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to load settings'),
      });
    }
  });

  // PUT /settings - Save all admin settings
  fastify.put(
    '/settings',
    { preHandler: [validateBody(settingsSchema)] },
    async (request, reply) => {
      try {
        const data = settingsSchema.parse(request.body);
        const user = (request as AuthenticatedRequest).user!;

        const upserts: Promise<any>[] = [];

        // Feature Flags - store each flag as individual config
        if (data.featureFlags) {
          for (const [flagName, enabled] of Object.entries(data.featureFlags)) {
            upserts.push(
              p.systemConfig.upsert({
                where: { key: `feature_flag.${flagName}` },
                update: {
                  value: JSON.stringify(enabled),
                  updatedBy: user.id,
                },
                create: {
                  key: `feature_flag.${flagName}`,
                  value: JSON.stringify(enabled),
                  description: `Feature flag: ${flagName}`,
                  category: SETTINGS_CATEGORIES.featureFlags,
                  dataType: 'boolean',
                  isPublic: false,
                  isEncrypted: false,
                },
              })
            );
          }
        }

        // Integrations - store each integration service as config entry
        if (data.integrations) {
          for (const [serviceName, config] of Object.entries(data.integrations)) {
            // Don't store actual API keys in SystemConfig (use IntegrationCredential for that)
            // Only store enabled state and non-secret config
            const safeConfig: any = { enabled: config.enabled };
            if (config.url) safeConfig.url = config.url;

            upserts.push(
              p.systemConfig.upsert({
                where: { key: `integration.${serviceName}` },
                update: {
                  value: JSON.stringify(safeConfig),
                  updatedBy: user.id,
                },
                create: {
                  key: `integration.${serviceName}`,
                  value: JSON.stringify(safeConfig),
                  description: `Integration: ${serviceName}`,
                  category: SETTINGS_CATEGORIES.integrations,
                  dataType: 'json',
                  isPublic: false,
                  isEncrypted: false,
                },
              })
            );
          }
        }

        // Security config - store as single object
        if (data.security) {
          upserts.push(
            p.systemConfig.upsert({
              where: { key: 'security.config' },
              update: {
                value: JSON.stringify(data.security),
                updatedBy: user.id,
              },
              create: {
                key: 'security.config',
                value: JSON.stringify(data.security),
                description: 'Security configuration',
                category: SETTINGS_CATEGORIES.security,
                dataType: 'json',
                isPublic: false,
                isEncrypted: false,
              },
            })
          );
        }

        // Notifications config - store as single object
        if (data.notifications) {
          const safeNotifications: any = {
            emailEnabled: data.notifications.emailEnabled,
            slackEnabled: data.notifications.slackEnabled,
          };
          if (data.notifications.slackWebhook) {
            safeNotifications.slackWebhook = data.notifications.slackWebhook;
          }

          upserts.push(
            p.systemConfig.upsert({
              where: { key: 'notifications.config' },
              update: {
                value: JSON.stringify(safeNotifications),
                updatedBy: user.id,
              },
              create: {
                key: 'notifications.config',
                value: JSON.stringify(safeNotifications),
                description: 'Notification configuration',
                category: SETTINGS_CATEGORIES.notifications,
                dataType: 'json',
                isPublic: false,
                isEncrypted: false,
              },
            })
          );
        }

        await Promise.all(upserts);

        return reply.send({
          success: true,
          message: 'Settings saved successfully',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to save settings'),
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // EMAIL TEMPLATES
  // --------------------------------------------------------------------------

  // GET /email-templates - List email templates
  fastify.get('/email-templates', async (request, reply) => {
    try {
      // Store email templates as SystemConfig entries with category 'email_templates'
      const templates = await p.systemConfig.findMany({
        where: { category: 'email_templates' },
        orderBy: { key: 'asc' },
      });

      const emailTemplates = templates.map((t: any) => {
        let parsed: any = {};
        try {
          parsed = typeof t.value === 'string' ? JSON.parse(t.value) : t.value;
        } catch { /* ignore */ }

        return {
          id: t.id,
          key: t.key,
          name: parsed.name || t.key.replace('email_template.', '').replace(/_/g, ' '),
          subject: parsed.subject || '',
          body: parsed.body || '',
          isActive: parsed.isActive !== false,
          description: t.description,
          updatedAt: t.updatedAt,
        };
      });

      // If no templates exist yet, return default set
      if (emailTemplates.length === 0) {
        const defaults = getDefaultEmailTemplates();
        return reply.send({ templates: defaults });
      }

      return reply.send({ templates: emailTemplates });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to load email templates'),
      });
    }
  });

  // PATCH /email-templates/:id - Update email template
  fastify.patch(
    '/email-templates/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().min(1) })),
        validateBody(emailTemplateUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const updates = emailTemplateUpdateSchema.parse(request.body);
        const user = (request as AuthenticatedRequest).user!;

        // Find template by id
        const existing = await p.systemConfig.findUnique({ where: { id } });
        if (!existing || existing.category !== 'email_templates') {
          return reply.code(404).send({
            error: 'Email template not found',
          });
        }

        // Merge updates into existing value
        let currentValue: any = {};
        try {
          currentValue = typeof existing.value === 'string'
            ? JSON.parse(existing.value)
            : existing.value;
        } catch { /* ignore */ }

        const newValue = { ...currentValue, ...updates };

        await p.systemConfig.update({
          where: { id },
          data: {
            value: JSON.stringify(newValue),
            updatedBy: user.id,
          },
        });

        return reply.send({
          success: true,
          template: {
            id: existing.id,
            key: existing.key,
            ...newValue,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update email template'),
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // RBAC ROLE UPDATE (PATCH /roles/:roleKey)
  // --------------------------------------------------------------------------

  fastify.patch(
    '/roles/:roleKey',
    {
      preHandler: [
        validateParams(z.object({ roleKey: z.string().min(1) })),
        validateBody(roleUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { roleKey } = request.params as { roleKey: string };
        const updates = roleUpdateSchema.parse(request.body);

        // Verify role exists
        const role = await p.role.findUnique({
          where: { key: roleKey },
          include: { permissions: true },
        });

        if (!role) {
          return reply.code(404).send({
            error: 'Role not found',
          });
        }

        // Update role name/description if provided
        if (updates.name || updates.description !== undefined) {
          await p.role.update({
            where: { key: roleKey },
            data: {
              ...(updates.name && { name: updates.name }),
              ...(updates.description !== undefined && { description: updates.description }),
            },
          });
        }

        // Update permissions if provided (replace all)
        if (updates.permissions) {
          // Remove existing permissions
          await p.rolePermission.deleteMany({
            where: { roleKey },
          });

          // Add new permissions
          for (const permKey of updates.permissions) {
            // Verify permission exists
            const perm = await p.permission.findUnique({ where: { key: permKey } });
            if (perm) {
              await p.rolePermission.create({
                data: {
                  roleKey,
                  permissionKey: permKey,
                },
              });
            }
          }
        }

        // Fetch updated role
        const updatedRole = await p.role.findUnique({
          where: { key: roleKey },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });

        return reply.send({ role: updatedRole });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update role'),
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // BILLING STATS (aggregate endpoint for admin dashboard)
  // --------------------------------------------------------------------------

  fastify.get('/billing-stats', async (request, reply) => {
    try {
      const query = request.query as { start?: string; end?: string };

      // Get subscription counts from database
      const [totalOrgs, activeOrgs, totalUsers, totalProjects] = await Promise.all([
        p.org.count(),
        p.org.count({ where: { status: 'ACTIVE' } }),
        p.user.count(),
        p.project.count(),
      ]);

      return reply.send({
        totalOrgs,
        activeOrgs,
        totalUsers,
        totalProjects,
        mrr: 0, // Requires Stripe API integration
        arr: 0,
        churnRate: 0,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to get billing stats'),
      });
    }
  });

}

// ============================================================================
// DEFAULT EMAIL TEMPLATES
// ============================================================================

function getDefaultEmailTemplates() {
  return [
    {
      id: 'default-welcome',
      key: 'email_template.welcome',
      name: 'Welcome Email',
      subject: 'Welcome to Kealee Platform',
      body: `Hi {{name}},\n\nWelcome to Kealee! Your account has been created.\n\nYou can access your dashboard at {{dashboardUrl}}.\n\nBest regards,\nThe Kealee Team`,
      isActive: true,
    },
    {
      id: 'default-invite',
      key: 'email_template.team_invite',
      name: 'Team Invitation',
      subject: 'You\'ve been invited to join {{orgName}} on Kealee',
      body: `Hi {{name}},\n\n{{inviterName}} has invited you to join {{orgName}} as a {{roleName}}.\n\nClick here to accept: {{inviteUrl}}\n\nBest regards,\nThe Kealee Team`,
      isActive: true,
    },
    {
      id: 'default-password-reset',
      key: 'email_template.password_reset',
      name: 'Password Reset',
      subject: 'Reset your Kealee password',
      body: `Hi {{name}},\n\nWe received a request to reset your password. Click the link below:\n\n{{resetUrl}}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe Kealee Team`,
      isActive: true,
    },
    {
      id: 'default-service-request',
      key: 'email_template.service_request_update',
      name: 'Service Request Update',
      subject: 'Your service request #{{requestId}} has been updated',
      body: `Hi {{name}},\n\nYour service request "{{requestTitle}}" has been updated to: {{newStatus}}.\n\n{{message}}\n\nView details: {{requestUrl}}\n\nBest regards,\nThe Kealee Team`,
      isActive: true,
    },
    {
      id: 'default-permit-status',
      key: 'email_template.permit_status',
      name: 'Permit Status Update',
      subject: 'Permit {{permitNumber}} status update',
      body: `Hi {{name}},\n\nYour permit {{permitNumber}} for {{projectName}} has been updated.\n\nNew status: {{status}}\n\n{{message}}\n\nBest regards,\nThe Kealee Team`,
      isActive: true,
    },
    {
      id: 'default-weekly-report',
      key: 'email_template.weekly_report',
      name: 'Weekly Report',
      subject: 'Your weekly project report for {{projectName}}',
      body: `Hi {{name}},\n\nHere's your weekly report for {{projectName}}.\n\n{{reportContent}}\n\nView full report: {{reportUrl}}\n\nBest regards,\nThe Kealee Team`,
      isActive: true,
    },
  ];
}
