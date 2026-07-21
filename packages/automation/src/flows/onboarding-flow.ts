/**
 * Onboarding Flow — User Lifecycle Automation
 *
 * Listens for user.signed_up and user.onboarding_complete events and
 * triggers the appropriate Command Center app chains.
 */

import { PrismaClient } from '@prisma/client';
import { eventBus } from '../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../infrastructure/event-types.js';
import { addJob } from '../infrastructure/queues.js';
import { communicationHubQueue } from '../apps/communication-hub/index.js';
import { taskQueueQueue } from '../apps/task-queue/index.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'ONBOARDING-FLOW';

// ── Welcome message map by role ────────────────────────────────────────────

const WELCOME_MESSAGES: Record<string, { title: string; body: string }> = {
  HOMEOWNER: {
    title: 'Welcome to Kealee!',
    body: "Welcome! Here's how to find your perfect contractor. Describe your project, browse qualified pros, and compare bids — all in one place.",
  },
  CONTRACTOR: {
    title: 'Welcome to Kealee!',
    body: 'Welcome! Complete your profile to start receiving leads. The more detail you add, the better we can match you with projects.',
  },
  SUBCONTRACTOR: {
    title: 'Welcome to Kealee!',
    body: 'Welcome! Complete your profile to start receiving leads. The more detail you add, the better we can match you with projects.',
  },
  DEVELOPER: {
    title: 'Welcome to Kealee!',
    body: 'Welcome! Set up your project portfolio to manage all your developments in one place.',
  },
  ARCHITECT: {
    title: 'Welcome to Kealee!',
    body: 'Welcome! Build your design portfolio and connect with projects that need your expertise.',
  },
  ENGINEER: {
    title: 'Welcome to Kealee!',
    body: 'Welcome! Build your design portfolio and connect with projects that need your expertise.',
  },
  PROPERTY_MANAGER: {
    title: 'Welcome to Kealee!',
    body: 'Welcome! Add your managed properties to centralize maintenance, renovations, and contractor management.',
  },
  BUSINESS_OWNER: {
    title: 'Welcome to Kealee!',
    body: 'Welcome! Set up your business profile to manage commercial projects and find the right contractors.',
  },
};

const DEFAULT_WELCOME = {
  title: 'Welcome to Kealee!',
  body: 'Your account has been created. Get started by exploring the platform.',
};

// ── OnboardingFlow class ───────────────────────────────────────────────────

export class OnboardingFlow {
  /**
   * Register event handlers for the onboarding flow.
   */
  register(): void {
    this.handleUserSignedUp();
    this.handleOnboardingComplete();
    console.log('[OnboardingFlow] Event handlers registered');
  }

  // ─── user.signed_up ──────────────────────────────────────────────────

  private handleUserSignedUp(): void {
    eventBus.subscribe(EVENT_TYPES.USER_SIGNED_UP, async (event) => {
      if (!event.userId) return;

      const userId = event.userId;
      const role = (event.data.role as string)?.toUpperCase() ?? 'USER';
      const firstName = event.data.firstName ?? '';

      // Create tracking task
      const task = await prisma.automationTask.create({
        data: {
          type: 'onboarding:user_signed_up',
          status: 'PROCESSING',
          sourceApp: SOURCE_APP,
          payload: { userId, role, firstName } as any,
          startedAt: new Date(),
        },
      });

      try {
        // 1. APP-08: Queue role-specific welcome email
        const welcome = WELCOME_MESSAGES[role] ?? DEFAULT_WELCOME;
        await addJob(communicationHubQueue, 'send-notification', {
          userId,
          type: 'welcome',
          title: welcome.title,
          body: firstName ? `Hi ${firstName}! ${welcome.body}` : welcome.body,
          channels: ['email', 'in_app'],
        });

        // 2. APP-09: Create onboarding task checklist (role-specific)
        await addJob(taskQueueQueue, 'create-project-tasks', {
          projectType: 'MAINTENANCE', // Lightweight onboarding checklist
          userId,
          context: 'onboarding',
          role,
        });

        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'COMPLETED', result: { role, step: 'signed_up' } as any, completedAt: new Date() },
        });

        console.log(`[OnboardingFlow] user.signed_up processed for ${userId} (role: ${role})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', error: message, completedAt: new Date() },
        });
        console.error(`[OnboardingFlow] user.signed_up failed for ${userId}:`, message);
      }
    });
  }

  // ─── user.onboarding_complete ────────────────────────────────────────

  private handleOnboardingComplete(): void {
    eventBus.subscribe(EVENT_TYPES.USER_ONBOARDING_COMPLETE, async (event) => {
      if (!event.userId) return;

      const userId = event.userId;
      const role = (event.data.role as string)?.toUpperCase() ?? 'USER';
      const organizationId = event.data.organizationId as string | undefined;

      const task = await prisma.automationTask.create({
        data: {
          type: 'onboarding:complete',
          status: 'PROCESSING',
          sourceApp: SOURCE_APP,
          payload: { userId, role, organizationId } as any,
          startedAt: new Date(),
        },
      });

      try {
        if (['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER', 'BUSINESS_OWNER'].includes(role)) {
          await this.handleProjectOwnerOnboarding(userId, role, event.data);
        } else if (['CONTRACTOR', 'SUBCONTRACTOR'].includes(role)) {
          await this.handleContractorOnboarding(userId, event.data);
        } else if (['ARCHITECT', 'ENGINEER'].includes(role)) {
          await this.handleDesignProfessionalOnboarding(userId, event.data);
        }

        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'COMPLETED', result: { role, step: 'onboarding_complete' } as any, completedAt: new Date() },
        });

        console.log(`[OnboardingFlow] onboarding_complete processed for ${userId} (role: ${role})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', error: message, completedAt: new Date() },
        });
        console.error(`[OnboardingFlow] onboarding_complete failed for ${userId}:`, message);
      }
    });
  }

  // ─── Project owner onboarding (homeowner, developer, PM, business) ───

  private async handleProjectOwnerOnboarding(
    userId: string,
    role: string,
    data: Record<string, any>,
  ): Promise<void> {
    // 1. Check if user described a project during onboarding
    const hasProject = data.projectDescription || data.category || data.location;

    if (hasProject) {
      // 2a. Auto-create Lead from onboarding project description
      const lead = await prisma.lead.create({
        data: {
          category: data.category ?? 'GENERAL',
          description: data.projectDescription ?? data.description ?? 'Project from onboarding',
          location: data.location ?? data.address ?? 'TBD',
          city: data.city,
          state: data.state,
          budget: data.budget ? parseFloat(String(data.budget)) : undefined,
          estimatedValue: data.budget ? parseFloat(String(data.budget)) : undefined,
          srp: data.suggestedPrice ? parseFloat(String(data.suggestedPrice)) : undefined,
          stage: 'OPEN',
        },
      });

      // 2b. Publish lead.created → triggers APP-01 Bid Engine
      await eventBus.publish(
        EVENT_TYPES.LEAD_CREATED,
        { leadId: lead.id, category: lead.category, source: 'onboarding' },
        SOURCE_APP,
        { userId },
      );

      // 3. APP-08: Send "Your project is live!" email
      await addJob(communicationHubQueue, 'send-notification', {
        userId,
        type: 'project_live',
        title: 'Your project is live!',
        body: 'Contractors are being notified and you should start receiving bids soon.',
        channels: ['email', 'in_app'],
      });
    } else {
      // No project described — send encouragement to create one
      await addJob(communicationHubQueue, 'send-notification', {
        userId,
        type: 'create_project_prompt',
        title: 'Ready to start your project?',
        body: 'Describe your project and we\'ll match you with qualified contractors in your area.',
        channels: ['email'],
      });
    }
  }

  // ─── Contractor/subcontractor onboarding ─────────────────────────────

  private async handleContractorOnboarding(
    userId: string,
    data: Record<string, any>,
  ): Promise<void> {
    // 1. Verify MarketplaceProfile was created
    const profile = await prisma.marketplaceProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      console.warn(`[OnboardingFlow] No MarketplaceProfile found for contractor ${userId}`);
      return;
    }

    // 2. APP-08: Send "Your profile is live!" email
    await addJob(communicationHubQueue, 'send-notification', {
      userId,
      type: 'marketplace_live',
      title: 'Your profile is live!',
      body: "You're now receiving leads on the Kealee marketplace. Good luck!",
      channels: ['email', 'in_app'],
    });

    // 3. Check for matching open leads
    const specialties = profile.specialties ?? [];
    if (specialties.length > 0) {
      const matchingLeads = await prisma.lead.findMany({
        where: {
          stage: 'OPEN',
          category: { in: specialties },
        },
        select: { id: true, category: true, location: true },
        take: 10,
      });

      if (matchingLeads.length > 0) {
        await addJob(communicationHubQueue, 'send-notification', {
          userId,
          type: 'matching_leads',
          title: `${matchingLeads.length} project${matchingLeads.length === 1 ? '' : 's'} match your skills!`,
          body: `We found existing projects that match your specialties. Check your dashboard to view and bid.`,
          channels: ['email', 'in_app'],
        });
      }
    }
  }

  // ─── Architect/engineer onboarding ───────────────────────────────────

  private async handleDesignProfessionalOnboarding(
    userId: string,
    data: Record<string, any>,
  ): Promise<void> {
    // 1. Verify MarketplaceProfile created
    const profile = await prisma.marketplaceProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      console.warn(`[OnboardingFlow] No MarketplaceProfile found for design professional ${userId}`);
    }

    // 2. APP-08: Send portfolio setup guide
    await addJob(communicationHubQueue, 'send-notification', {
      userId,
      type: 'portfolio_guide',
      title: 'Set up your design portfolio',
      body: 'Upload your best projects to attract clients. A complete portfolio gets 3x more inquiries.',
      channels: ['email', 'in_app'],
    });

    // 3. Check for matching design leads
    const specialties = profile?.specialties ?? [];
    if (specialties.length > 0) {
      const matchingLeads = await prisma.lead.findMany({
        where: {
          stage: 'OPEN',
          category: { in: specialties },
        },
        select: { id: true, category: true },
        take: 5,
      });

      if (matchingLeads.length > 0) {
        await addJob(communicationHubQueue, 'send-notification', {
          userId,
          type: 'matching_design_leads',
          title: `${matchingLeads.length} design project${matchingLeads.length === 1 ? '' : 's'} available`,
          body: 'Projects matching your expertise are looking for design professionals.',
          channels: ['in_app'],
        });
      }
    }
  }
}
