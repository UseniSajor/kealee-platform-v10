/**
 * Schedule Twin Hooks
 *
 * Fire-and-forget hooks called at the end of PM schedule service methods
 * to keep the project's Digital Twin in sync.
 *
 * All functions swallow errors so they never break the calling service.
 */

import type { TwinEventEmitter, ActorInfo } from '@kealee/core-ddts';

// ---- Schedule Item Created -----------------------------------------------

export async function onScheduleItemCreated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    scheduleItemId: string;
    title: string;
    startDate: string;
    endDate?: string;
    isMilestone: boolean;
    isCriticalPath: boolean;
    trade?: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.schedule.itemCreated',
      data.projectId,
      {
        scheduleItemId: data.scheduleItemId,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        isMilestone: data.isMilestone,
        isCriticalPath: data.isCriticalPath,
        trade: data.trade,
      },
      actor,
      { description: `Schedule item created: "${data.title}"` },
    );
  } catch (err) {
    console.error('[twin-hooks] onScheduleItemCreated failed:', err);
  }
}

// ---- Schedule Item Updated -----------------------------------------------

export async function onScheduleItemUpdated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    scheduleItemId: string;
    title: string;
    updatedFields: string[];
    newStatus?: string;
    previousStatus?: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    const hasStatusChange = data.newStatus && data.previousStatus && data.newStatus !== data.previousStatus;

    await emitter.emitProjectEvent(
      'pm.schedule.itemUpdated',
      data.projectId,
      {
        scheduleItemId: data.scheduleItemId,
        title: data.title,
        updatedFields: data.updatedFields,
        newStatus: data.newStatus,
        previousStatus: data.previousStatus,
      },
      actor,
      {
        severity: hasStatusChange ? 'LOW' : 'INFO',
        description: hasStatusChange
          ? `Schedule "${data.title}": ${data.previousStatus} -> ${data.newStatus}`
          : `Schedule item "${data.title}" updated`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onScheduleItemUpdated failed:', err);
  }
}

// ---- Schedule Progress Updated -------------------------------------------

export async function onScheduleProgressUpdated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    scheduleItemId: string;
    title: string;
    progress: number;
    status: string;
    isCriticalPath: boolean;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    // If this is a critical-path item completing, bump the SPI toward 1.0
    const kpiUpdates = data.isCriticalPath && data.progress >= 100
      ? [{ kpiKey: 'schedule_spi', delta: 0.02 }]
      : [];

    if (kpiUpdates.length > 0) {
      await emitter.emitAndUpdateKPI(
        'pm.schedule.progressUpdated',
        data.projectId,
        kpiUpdates,
        {
          scheduleItemId: data.scheduleItemId,
          title: data.title,
          progress: data.progress,
          status: data.status,
          isCriticalPath: data.isCriticalPath,
        },
        actor,
        {
          description: `Schedule "${data.title}": ${data.progress}% complete`,
        },
      );
    } else {
      await emitter.emitProjectEvent(
        'pm.schedule.progressUpdated',
        data.projectId,
        {
          scheduleItemId: data.scheduleItemId,
          title: data.title,
          progress: data.progress,
          status: data.status,
          isCriticalPath: data.isCriticalPath,
        },
        actor,
        {
          description: `Schedule "${data.title}": ${data.progress}% complete`,
        },
      );
    }
  } catch (err) {
    console.error('[twin-hooks] onScheduleProgressUpdated failed:', err);
  }
}

// ---- Schedule Bulk Updated -----------------------------------------------

export async function onScheduleBulkUpdated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    updatedCount: number;
    itemIds: string[];
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.schedule.bulkUpdated',
      data.projectId,
      {
        updatedCount: data.updatedCount,
        itemIds: data.itemIds,
      },
      actor,
      {
        severity: 'LOW',
        description: `Bulk schedule update: ${data.updatedCount} items`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onScheduleBulkUpdated failed:', err);
  }
}

// ---- Schedule Milestone Reached ------------------------------------------

export async function onScheduleMilestoneReached(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    scheduleItemId: string;
    title: string;
    completedAt: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitAndUpdateKPI(
      'pm.schedule.milestoneReached',
      data.projectId,
      [{ kpiKey: 'completion_pct', delta: 3 }],
      {
        scheduleItemId: data.scheduleItemId,
        title: data.title,
        completedAt: data.completedAt,
      },
      actor,
      {
        severity: 'MEDIUM',
        description: `Schedule milestone reached: "${data.title}"`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onScheduleMilestoneReached failed:', err);
  }
}
