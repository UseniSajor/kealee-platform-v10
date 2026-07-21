/**
 * GHL Auto-Sync Triggers
 *
 * Functions called from existing Kealee flows (user registration, checkout,
 * milestone completion) to keep GHL in sync automatically.
 *
 * All sync operations are fire-and-forget — failures are logged but never
 * block the primary Kealee operation.
 */

import { prisma } from '@kealee/database';
import { isGhlConfigured } from './ghl-client';
import { upsertContact, addTags } from './ghl-contacts';
import { createOpportunity, updateOpportunityStage, findOpportunitiesByContact } from './ghl-opportunities';

const p = prisma as any;

// ---------------------------------------------------------------------------
// Service → Tag mapping
// ---------------------------------------------------------------------------

export const SERVICE_TAG_MAP: Record<string, string> = {
  pm_basic: 'Customer - PM Basic',
  pm_professional: 'Customer - PM Professional',
  pm_enterprise: 'Customer - PM Enterprise',
  arch_basic: 'Customer - Arch Basic',
  arch_premium: 'Customer - Arch Premium',
  po_starter: 'Customer - PO Starter',
  po_pro: 'Customer - PO Pro',
  permit_basic: 'Customer - Permit Basic',
  permit_complex: 'Customer - Permit Complex',
  ops: 'Customer - Ops',
  estimation: 'Customer - Estimation',
};

// ---------------------------------------------------------------------------
// Sync helpers
// ---------------------------------------------------------------------------

/**
 * Sync a new Kealee user to GHL.
 * Called after user registration.
 */
export async function syncNewUser(user: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}, source?: string): Promise<void> {
  if (!isGhlConfigured()) return;

  try {
    const { contact } = await upsertContact({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address1: user.address,
      city: user.city,
      state: user.state,
      postalCode: user.zipCode,
      tags: ['Kealee User', source ? `Source: ${source}` : 'Source: Direct'].filter(Boolean),
    });

    // Store ghlContactId on Kealee user
    await p.user.update({
      where: { id: user.id },
      data: {
        ghlContactId: contact.id,
        ghlSyncedAt: new Date(),
      },
    });

    // Log sync
    await logSync('user', user.id, contact.id, 'kealee_to_ghl', 'success');
  } catch (err: any) {
    console.error(`[GHL Sync] Failed to sync new user ${user.email}:`, err?.message);
    await logSync('user', user.id, '', 'kealee_to_ghl', 'failed', err?.message);
  }
}

/**
 * Sync a checkout/purchase event to GHL.
 * Called after Stripe checkout completion.
 */
export async function syncCheckout(params: {
  userId: string;
  email: string;
  packageName?: string;
  packageKey?: string;
  amount?: number;
  projectId?: string;
  pipelineId?: string;
  contractSignedStageId?: string;
}): Promise<void> {
  if (!isGhlConfigured()) return;

  try {
    // Get or create GHL contact
    const { contact } = await upsertContact({ email: params.email });

    // Add customer tag
    const tagKey = params.packageKey || '';
    const serviceTag = SERVICE_TAG_MAP[tagKey];
    if (serviceTag) {
      await addTags(contact.id, [serviceTag]);
    }

    // Update opportunity stage to "Contract Signed" if we have pipeline info
    if (params.pipelineId && params.contractSignedStageId) {
      const opps = await findOpportunitiesByContact(contact.id);
      const activeOpp = opps.find((o) => o.pipelineId === params.pipelineId && o.status === 'open');
      if (activeOpp) {
        await updateOpportunityStage(activeOpp.id, params.contractSignedStageId);
      }
    }

    await logSync('checkout', params.userId, contact.id, 'kealee_to_ghl', 'success');
  } catch (err: any) {
    console.error(`[GHL Sync] Failed to sync checkout for ${params.email}:`, err?.message);
    await logSync('checkout', params.userId, '', 'kealee_to_ghl', 'failed', err?.message);
  }
}

/**
 * Sync a quote request to GHL — creates an opportunity in the pipeline.
 */
export async function syncQuoteRequest(params: {
  email: string;
  name: string;
  serviceType: string;
  estimatedValue?: number;
  source?: string;
  pipelineId: string;
  quoteRequestedStageId: string;
}): Promise<void> {
  if (!isGhlConfigured()) return;

  try {
    const { contact } = await upsertContact({
      email: params.email,
      name: params.name,
      source: params.source,
    });

    await addTags(contact.id, [`Quote Request - ${params.serviceType}`]);

    await createOpportunity({
      pipelineId: params.pipelineId,
      pipelineStageId: params.quoteRequestedStageId,
      contactId: contact.id,
      name: `${params.name} - ${params.serviceType}`,
      monetaryValue: params.estimatedValue,
      source: params.source || 'Kealee Platform',
    });

    await logSync('quote', contact.id, contact.id, 'kealee_to_ghl', 'success');
  } catch (err: any) {
    console.error(`[GHL Sync] Failed to sync quote request for ${params.email}:`, err?.message);
    await logSync('quote', '', '', 'kealee_to_ghl', 'failed', err?.message);
  }
}

/**
 * Sync a milestone approval to GHL — updates opportunity stage.
 * Called after a milestone is approved.
 */
export async function syncMilestoneApproved(params: {
  projectId: string;
  milestoneId: string;
  milestoneName?: string;
}): Promise<void> {
  if (!isGhlConfigured()) return;

  try {
    // Lookup project's GHL opportunity
    const project = await p.project.findUnique({
      where: { id: params.projectId },
      select: { ghlOpportunityId: true, ghlPipelineId: true, name: true },
    });

    if (!project?.ghlOpportunityId) return;

    // Update opportunity with milestone info (keep stage as "Project Active")
    const { updateOpportunity } = await import('./ghl-opportunities');
    await updateOpportunity(project.ghlOpportunityId, {
      name: `${project.name} - Milestone: ${params.milestoneName || params.milestoneId}`,
    });

    await logSync('milestone', params.milestoneId, project.ghlOpportunityId, 'kealee_to_ghl', 'success');
  } catch (err: any) {
    console.error(`[GHL Sync] Failed to sync milestone ${params.milestoneId}:`, err?.message);
    await logSync('milestone', params.milestoneId, '', 'kealee_to_ghl', 'failed', err?.message);
  }
}

// ---------------------------------------------------------------------------
// Internal logger
// ---------------------------------------------------------------------------

async function logSync(
  entityType: string,
  entityId: string,
  ghlId: string,
  direction: string,
  status: string,
  error?: string,
): Promise<void> {
  try {
    await p.ghlSyncStatus.create({
      data: {
        entityType,
        entityId,
        ghlId,
        lastSynced: new Date(),
        syncDirection: direction,
        status,
        error: error?.slice(0, 500),
      },
    });
  } catch {
    // Ignore log failures
  }
}
