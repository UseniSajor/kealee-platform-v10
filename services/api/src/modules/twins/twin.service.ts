/**
 * Twin Service — wraps TwinManager for API use
 */

import { prisma } from '../../lib/prisma';
import { TwinManager } from '@kealee/core-ddts';
import type {
  CreateTwinInput,
  UpdateTwinInput,
  TwinSnapshotInput,
  TwinEventInput,
  KPIUpdate,
  TwinStatus,
  TwinTier,
} from '@kealee/core-ddts';

const manager = new TwinManager(prisma);

export const twinService = {
  createTwin: (input: CreateTwinInput) => manager.createTwin(input),

  getTwin: (twinId: string) => manager.getTwin(twinId),

  getTwinByProject: (projectId: string) => manager.getTwinByProject(projectId),

  updateTwin: (twinId: string, input: UpdateTwinInput) => manager.updateTwin(twinId, input),

  transitionPhase: (twinId: string, newStatus: TwinStatus, reason?: string) =>
    manager.transitionPhase(twinId, newStatus, reason),

  createSnapshot: (twinId: string, input?: TwinSnapshotInput) =>
    manager.createSnapshot(twinId, input),

  recordEvent: (twinId: string, input: TwinEventInput) =>
    manager.recordEvent(twinId, input),

  updateKPIs: (twinId: string, updates: KPIUpdate[]) =>
    manager.updateKPIs(twinId, updates),

  recalculateHealth: (twinId: string) => manager.recalculateHealth(twinId),

  activateModule: (twinId: string, moduleKey: string, state?: Record<string, unknown>) =>
    manager.activateModule(twinId, moduleKey, state),

  deactivateModule: (twinId: string, moduleKey: string) =>
    manager.deactivateModule(twinId, moduleKey),

  listTwins: (orgId: string, options?: {
    status?: TwinStatus;
    tier?: TwinTier;
    healthStatus?: string;
    limit?: number;
    offset?: number;
  }) => manager.listTwins(orgId, options),

  getTimeline: (twinId: string, limit?: number, offset?: number) =>
    manager.getTimeline(twinId, limit, offset),

  getSnapshots: (twinId: string, limit?: number) =>
    manager.getSnapshots(twinId, limit),
};
