/**
 * Subscription Flow — Subscription Lifecycle Automation
 *
 * Listens for subscription.created, subscription.renewed, and subscription.canceled
 * events and triggers the appropriate workspace setup, feature enablement, and
 * communication sequences.
 */

import { PrismaClient } from '@prisma/client';
import { eventBus } from '../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../infrastructure/event-types.js';
import { addJob } from '../infrastructure/queues.js';
import { communicationHubQueue } from '../apps/communication-hub/index.js';
import { taskQueueQueue } from '../apps/task-queue/index.js';
import { documentGenQueue } from '../apps/document-gen/index.js';
import { permitTrackerQueue } from '../apps/permit-tracker/index.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'SUBSCRIPTION-FLOW';

// ── PM Package tier → enabled Command Center apps ──────────────────────────

const PM_PACKAGE_APPS: Record<string, string[]> = {
  PACKAGE_A: ['APP-04', 'APP-07', 'APP-08', 'APP-09'],
  PACKAGE_B: ['APP-04', 'APP-07', 'APP-08', 'APP-09', 'APP-02', 'APP-03', 'APP-06', 'APP-11'],
  PACKAGE_C: [
    'APP-04', 'APP-07', 'APP-08', 'APP-09',
    'APP-02', 'APP-03', 'APP-06', 'APP-11',
    'APP-12', 'APP-13', 'APP-14', 'APP-10',
  ],
  PACKAGE_D: [
    'APP-01', 'APP-02', 'APP-03', 'APP-04', 'APP-05',
    'APP-06', 'APP-07', 'APP-08', 'APP-09', 'APP-10',
    'APP-11', 'APP-12', 'APP-13', 'APP-14', 'APP-15',
  ],
};

// ── SubscriptionFlow class ─────────────────────────────────────────────────

export class SubscriptionFlow {
  /**
   * Register event handlers for subscription lifecycle events.
   */
  register(): void {
    this.handleSubscriptionCreated();
    this.handleSubscriptionCanceled();
    console.log('[SubscriptionFlow] Event handlers registered');
  }

  // ─── subscription.created ────────────────────────────────────────────

  private handleSubscriptionCreated(): void {
    eventBus.subscribe(EVENT_TYPES.SUBSCRIPTION_CREATED, async (event) => {
      const product = event.data.product as string | undefined;
      const subscriptionId = event.data.subscriptionId as string | undefined;
      const orgId = event.data.orgId as string | undefined;
      const tier = event.data.tier as string | undefined;

      if (!product || !subscriptionId) {
        console.warn('[SubscriptionFlow] subscription.created missing product or subscriptionId');
        return;
      }

      const task = await prisma.automationTask.create({
        data: {
          type: `subscription:created:${product}`,
          status: 'PROCESSING',
          sourceApp: SOURCE_APP,
          payload: { subscriptionId, product, tier, orgId } as any,
          startedAt: new Date(),
        },
      });

      try {
        switch (product) {
          case 'pm_staffing':
            await this.handlePMStaffingSubscription(subscriptionId, orgId, tier ?? 'PACKAGE_A', event);
            break;
          case 'marketplace':
            await this.handleMarketplaceSubscription(subscriptionId, tier, event);
            break;
          case 'architect':
            await this.handleArchitectSubscription(subscriptionId, orgId, event);
            break;
          case 'permit':
            await this.handlePermitSubscription(subscriptionId, tier ?? 'PERMIT_A', event);
            break;
          default:
            console.warn(`[SubscriptionFlow] Unknown product: ${product}`);
        }

        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'COMPLETED', result: { product, tier } as any, completedAt: new Date() },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', error: message, completedAt: new Date() },
        });
        console.error(`[SubscriptionFlow] subscription.created failed:`, message);
      }
    });
  }

  // ─── PM Staffing subscription ────────────────────────────────────────

  private async handlePMStaffingSubscription(
    subscriptionId: string,
    orgId: string | undefined,
    tier: string,
    event: any,
  ): Promise<void> {
    // 1. Activate os-pm workspace for organization
    if (orgId) {
      await prisma.systemConfig.upsert({
        where: { key: `workspace:os-pm:${orgId}` },
        update: { value: { active: true, tier, activatedAt: new Date().toISOString() } },
        create: {
          key: `workspace:os-pm:${orgId}`,
          value: { active: true, tier, activatedAt: new Date().toISOString() },
          description: `PM workspace activation for org ${orgId}`,
          category: 'workspace',
        },
      });
    }

    // 2. APP-09: Load task templates for their project types
    await addJob(taskQueueQueue, 'create-project-tasks', {
      context: 'pm_workspace_setup',
      projectType: 'NEW_CONSTRUCTION',
      orgId,
    });

    // 3. APP-10: Load document templates (contracts, SOWs)
    await addJob(documentGenQueue, 'generate-document', {
      templateName: 'scope_of_work',
      context: 'pm_workspace_setup',
      orgId,
      variables: { setup: true },
    });

    // 4. Enable Command Center apps based on tier via ModuleEntitlement
    const enabledApps = PM_PACKAGE_APPS[tier] ?? PM_PACKAGE_APPS.PACKAGE_A;
    if (orgId) {
      for (const appId of enabledApps) {
        await prisma.moduleEntitlement.upsert({
          where: { orgId_moduleKey: { orgId, moduleKey: appId } },
          update: { enabled: true, enabledAt: new Date() },
          create: {
            orgId,
            moduleKey: appId,
            enabled: true,
            enabledAt: new Date(),
          },
        });
      }
      console.log(`[SubscriptionFlow] Enabled ${enabledApps.length} apps for org ${orgId} (${tier})`);
    }

    // 5. APP-08: Send "Your PM workspace is ready" email
    const userId = event.userId ?? event.data.userId;
    if (userId) {
      await addJob(communicationHubQueue, 'send-notification', {
        userId,
        type: 'pm_workspace_ready',
        title: 'Your PM workspace is ready!',
        body: `Your ${tier.replace('PACKAGE_', 'Package ')} subscription is active. Log in to os-pm to start managing your projects with ${enabledApps.length} automation apps enabled.`,
        channels: ['email', 'in_app'],
      });
    }

    // 6. For each existing active project → publish project.activated to run kickoff chain
    if (orgId) {
      const activeProjects = await prisma.project.findMany({
        where: { orgId, status: 'ACTIVE' },
        select: { id: true, name: true },
        take: 50,
      });

      for (const project of activeProjects) {
        await eventBus.publish(
          EVENT_TYPES.PROJECT_ACTIVATED,
          { projectName: project.name, source: 'pm_subscription_setup' },
          SOURCE_APP,
          { projectId: project.id, userId },
        );
      }

      if (activeProjects.length > 0) {
        console.log(
          `[SubscriptionFlow] Triggered kickoff for ${activeProjects.length} active projects (org: ${orgId})`,
        );
      }
    }
  }

  // ─── Marketplace subscription ────────────────────────────────────────

  private async handleMarketplaceSubscription(
    subscriptionId: string,
    tier: string | undefined,
    event: any,
  ): Promise<void> {
    const userId = event.userId ?? event.data.userId;

    // 1. Upgrade MarketplaceProfile
    if (userId) {
      await prisma.marketplaceProfile.updateMany({
        where: { userId },
        data: {
          subscriptionTier: tier ?? 'PROFESSIONAL',
        },
      });
    }

    // 2. APP-08: Send tier confirmation email
    if (userId) {
      await addJob(communicationHubQueue, 'send-notification', {
        userId,
        type: 'marketplace_upgrade',
        title: 'Marketplace subscription activated!',
        body: `Your ${tier ?? 'Professional'} marketplace subscription is active. You now have priority placement and increased lead notifications.`,
        channels: ['email', 'in_app'],
      });
    }

    // 3. Increase lead notification limits via SystemConfig
    if (userId) {
      await prisma.systemConfig.upsert({
        where: { key: `marketplace:lead_limit:${userId}` },
        update: { value: { tier: tier ?? 'PROFESSIONAL', maxLeads: tier === 'ENTERPRISE' ? 999 : 50 } },
        create: {
          key: `marketplace:lead_limit:${userId}`,
          value: { tier: tier ?? 'PROFESSIONAL', maxLeads: tier === 'ENTERPRISE' ? 999 : 50 },
          description: `Marketplace lead notification limit for ${userId}`,
          category: 'marketplace',
        },
      });
    }
  }

  // ─── Architect subscription ──────────────────────────────────────────

  private async handleArchitectSubscription(
    subscriptionId: string,
    orgId: string | undefined,
    event: any,
  ): Promise<void> {
    const userId = event.userId ?? event.data.userId;

    // 1. Activate architect workspace
    if (orgId) {
      await prisma.systemConfig.upsert({
        where: { key: `workspace:architect:${orgId}` },
        update: { value: { active: true, activatedAt: new Date().toISOString() } },
        create: {
          key: `workspace:architect:${orgId}`,
          value: { active: true, activatedAt: new Date().toISOString() },
          description: `Architect workspace activation for org ${orgId}`,
          category: 'workspace',
        },
      });
    }

    // 2. Load design project templates
    await addJob(taskQueueQueue, 'create-project-tasks', {
      context: 'architect_workspace_setup',
      projectType: 'NEW_CONSTRUCTION',
      orgId,
    });

    // 3. APP-08: Send workspace setup guide
    if (userId) {
      await addJob(communicationHubQueue, 'send-notification', {
        userId,
        type: 'architect_workspace_ready',
        title: 'Your architect workspace is ready!',
        body: 'Your architect.kealee.com workspace is active. Upload design documents, manage revisions, and collaborate with project teams.',
        channels: ['email', 'in_app'],
      });
    }
  }

  // ─── Permit subscription ─────────────────────────────────────────────

  private async handlePermitSubscription(
    subscriptionId: string,
    tier: string,
    event: any,
  ): Promise<void> {
    const userId = event.userId ?? event.data.userId;
    const projectId = event.data.projectId as string | undefined;

    // 1. If there's a project context, queue the permit for AI review
    if (projectId) {
      // Look up existing permits for this project
      const permits = await prisma.permit.findMany({
        where: { projectId },
        select: { id: true },
      });

      // 2. APP-05: Begin AI review process for each permit
      for (const permit of permits) {
        await addJob(permitTrackerQueue, 'ai-review', {
          permitId: permit.id,
        });
      }

      if (permits.length > 0) {
        console.log(
          `[SubscriptionFlow] Queued AI review for ${permits.length} permits (project: ${projectId})`,
        );
      }
    }

    // 3. APP-08: Send permit assistance welcome
    if (userId) {
      const tierLabel = tier.replace('PERMIT_', 'Package ');
      await addJob(communicationHubQueue, 'send-notification', {
        userId,
        type: 'permit_welcome',
        title: 'Permit assistance activated!',
        body: `Your ${tierLabel} permit service is active. Our team will handle the permit process — sit back and we'll keep you updated on progress.`,
        channels: ['email', 'in_app'],
      });
    }
  }

  // ─── subscription.canceled ───────────────────────────────────────────

  private handleSubscriptionCanceled(): void {
    eventBus.subscribe(EVENT_TYPES.SUBSCRIPTION_CANCELED, async (event) => {
      const subscriptionId = event.data.subscriptionId as string | undefined;
      const product = event.data.product as string | undefined;
      const orgId = event.data.orgId as string | undefined;
      const userId = event.userId ?? event.data.userId;

      if (!subscriptionId) return;

      const task = await prisma.automationTask.create({
        data: {
          type: `subscription:canceled:${product ?? 'unknown'}`,
          status: 'PROCESSING',
          sourceApp: SOURCE_APP,
          payload: { subscriptionId, product, orgId } as any,
          startedAt: new Date(),
        },
      });

      try {
        // 1. Determine grace period (end of billing cycle)
        const gracePeriodEnd = event.data.periodEnd
          ? new Date(event.data.periodEnd as string)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

        // 2. APP-08: Send "Sorry to see you go" email
        if (userId) {
          await addJob(communicationHubQueue, 'send-notification', {
            userId,
            type: 'subscription_canceled',
            title: 'Your subscription has been canceled',
            body: `We're sorry to see you go. Your access will continue until ${gracePeriodEnd.toLocaleDateString()}. Changed your mind? You can reactivate anytime from your account settings.`,
            channels: ['email', 'in_app'],
          });
        }

        // 3. Schedule deactivation at period end via SystemConfig
        if (orgId && product) {
          const workspaceKey =
            product === 'pm_staffing' ? `workspace:os-pm:${orgId}` :
            product === 'architect' ? `workspace:architect:${orgId}` :
            null;

          if (workspaceKey) {
            await prisma.systemConfig.upsert({
              where: { key: `deactivation:${workspaceKey}` },
              update: {
                value: {
                  scheduledFor: gracePeriodEnd.toISOString(),
                  product,
                  subscriptionId,
                },
              },
              create: {
                key: `deactivation:${workspaceKey}`,
                value: {
                  scheduledFor: gracePeriodEnd.toISOString(),
                  product,
                  subscriptionId,
                },
                description: `Scheduled deactivation for ${product} (org: ${orgId})`,
                category: 'deactivation',
              },
            });
          }

          // 4. Archive workspace data (mark as inactive, don't delete)
          if (product === 'pm_staffing') {
            // Disable module entitlements at grace period end
            // For now, mark them with an expiry
            await prisma.moduleEntitlement.updateMany({
              where: { orgId, enabled: true },
              data: { expiresAt: gracePeriodEnd },
            });
          }
        }

        await prisma.automationTask.update({
          where: { id: task.id },
          data: {
            status: 'COMPLETED',
            result: { product, gracePeriodEnd: gracePeriodEnd.toISOString() } as any,
            completedAt: new Date(),
          },
        });

        console.log(
          `[SubscriptionFlow] subscription.canceled processed — grace until ${gracePeriodEnd.toISOString()}`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', error: message, completedAt: new Date() },
        });
        console.error(`[SubscriptionFlow] subscription.canceled failed:`, message);
      }
    });
  }
}
