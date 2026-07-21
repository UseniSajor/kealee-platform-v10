/**
 * Project Twin Hooks
 *
 * Fire-and-forget hooks called at the end of project service methods
 * to keep the project's Digital Twin in sync.
 *
 * All functions swallow errors so they never break the calling service.
 */

import type { TwinEventEmitter, ActorInfo } from '@kealee/core-ddts';

// ---- Project Created (from lead) ----------------------------------------

export async function onProjectCreated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    name: string;
    category: string;
    ownerId: string;
    orgId?: string;
    leadId?: string;
    executionTier?: string;
    budgetTotal?: number;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.project.created',
      data.projectId,
      {
        name: data.name,
        category: data.category,
        ownerId: data.ownerId,
        orgId: data.orgId,
        leadId: data.leadId,
        executionTier: data.executionTier,
        budgetTotal: data.budgetTotal,
      },
      actor,
      { description: `Project "${data.name}" created` },
    );
  } catch (err) {
    console.error('[twin-hooks] onProjectCreated failed:', err);
  }
}

// ---- Project Status Changed ----------------------------------------------

export async function onProjectStatusChanged(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    previousStatus: string;
    newStatus: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.project.statusChanged',
      data.projectId,
      {
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
      },
      actor,
      {
        severity: 'MEDIUM',
        description: `Project status: ${data.previousStatus} -> ${data.newStatus}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onProjectStatusChanged failed:', err);
  }
}

// ---- Project Updated (general metadata) ----------------------------------

export async function onProjectUpdated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    fields: Record<string, unknown>;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.project.updated',
      data.projectId,
      { updatedFields: Object.keys(data.fields), ...data.fields },
      actor,
    );
  } catch (err) {
    console.error('[twin-hooks] onProjectUpdated failed:', err);
  }
}

// ---- Member Added --------------------------------------------------------

export async function onProjectMemberAdded(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    userId: string;
    role: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.project.memberAdded',
      data.projectId,
      { userId: data.userId, role: data.role },
      actor,
    );
  } catch (err) {
    console.error('[twin-hooks] onProjectMemberAdded failed:', err);
  }
}
