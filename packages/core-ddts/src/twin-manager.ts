/**
 * DDTS Twin Manager — CRUD operations for Digital Twins
 * System of record for project lifecycle state
 */

import type { PrismaClient } from '@kealee/database';
import { TwinStateMachine } from './state-machine';
import { HealthCalculator, type KPIValue } from './health-calculator';
import type {
  TwinStatus,
  TwinTier,
  CreateTwinInput,
  UpdateTwinInput,
  TwinSnapshotInput,
  TwinEventInput,
  KPIUpdate,
  DEFAULT_KPIS,
} from './types';

export class TwinManager {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new Digital Twin for a project
   */
  async createTwin(input: CreateTwinInput) {
    const tier = input.tier ?? 'L1';
    const { DEFAULT_KPIS: kpiDefs } = await import('./types');

    const twin = await this.prisma.digitalTwin.create({
      data: {
        projectId: input.projectId,
        orgId: input.orgId,
        tier,
        status: 'INTAKE',
        healthStatus: 'UNKNOWN',
        healthScore: 0,
        label: input.label,
        enabledModules: input.enabledModules ?? [],
        phaseHistory: [{ phase: 'INTAKE', startedAt: new Date().toISOString() }],
      },
    });

    // Create default KPIs for the tier
    const defaults = kpiDefs[tier] ?? kpiDefs.L1;
    if (defaults.length > 0) {
      await this.prisma.twinKPI.createMany({
        data: defaults.map((kpi) => ({
          twinId: twin.id,
          kpiKey: kpi.kpiKey,
          label: kpi.label,
          category: kpi.category,
          unit: kpi.unit,
          targetValue: kpi.targetValue,
          warningMin: kpi.warningMin,
          warningMax: kpi.warningMax,
          criticalMin: kpi.criticalMin,
          criticalMax: kpi.criticalMax,
          currentValue: 0,
          status: 'HEALTHY',
        })),
      });
    }

    // Record creation event
    await this.recordEvent(twin.id, {
      eventType: 'twin.created',
      source: 'core-ddts',
      payload: { tier, projectId: input.projectId },
      description: `Digital twin created (${tier}) for project ${input.projectId}`,
    });

    return twin;
  }

  /**
   * Get a twin by project ID
   */
  async getTwinByProject(projectId: string) {
    return this.prisma.digitalTwin.findUnique({
      where: { projectId },
      include: {
        kpis: true,
        modules: { where: { isActive: true } },
      },
    });
  }

  /**
   * Get a twin by ID with full details
   */
  async getTwin(twinId: string) {
    return this.prisma.digitalTwin.findUnique({
      where: { id: twinId },
      include: {
        kpis: true,
        modules: { where: { isActive: true } },
        snapshots: { orderBy: { snapshotAt: 'desc' }, take: 5 },
        events: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  /**
   * Update twin metadata (not phase transitions)
   */
  async updateTwin(twinId: string, input: UpdateTwinInput) {
    return this.prisma.digitalTwin.update({
      where: { id: twinId },
      data: {
        tier: input.tier,
        label: input.label,
        enabledModules: input.enabledModules,
        config: input.config as any,
      },
    });
  }

  /**
   * Transition twin to a new lifecycle phase
   */
  async transitionPhase(twinId: string, newStatus: TwinStatus, reason?: string) {
    const twin = await this.prisma.digitalTwin.findUniqueOrThrow({
      where: { id: twinId },
    });

    const currentStatus = twin.status as TwinStatus;
    TwinStateMachine.validateTransition(currentStatus, newStatus);

    // Update phase history
    const history = (twin.phaseHistory as any[]) ?? [];
    // Close current phase
    if (history.length > 0) {
      history[history.length - 1].endedAt = new Date().toISOString();
    }
    // Open new phase
    history.push({ phase: newStatus, startedAt: new Date().toISOString() });

    const updated = await this.prisma.digitalTwin.update({
      where: { id: twinId },
      data: {
        status: newStatus,
        currentPhase: newStatus,
        phaseStartedAt: new Date(),
        phaseHistory: history,
      },
    });

    // Record event
    await this.recordEvent(twinId, {
      eventType: 'twin.phase.changed',
      source: 'core-ddts',
      severity: 'MEDIUM',
      payload: { from: currentStatus, to: newStatus, reason },
      description: `Phase transition: ${currentStatus} → ${newStatus}`,
    });

    // Auto-snapshot on phase change
    await this.createSnapshot(twinId, {
      label: `Phase: ${newStatus}`,
      trigger: 'phase_change',
    });

    return updated;
  }

  /**
   * Create a point-in-time snapshot
   */
  async createSnapshot(twinId: string, input: TwinSnapshotInput = {}) {
    const twin = await this.prisma.digitalTwin.findUniqueOrThrow({
      where: { id: twinId },
      include: { kpis: true, modules: true },
    });

    const kpiValues = twin.kpis.reduce((acc: Record<string, number>, kpi: any) => {
      acc[kpi.kpiKey] = kpi.currentValue;
      return acc;
    }, {});

    return this.prisma.twinSnapshot.create({
      data: {
        twinId,
        label: input.label,
        trigger: input.trigger ?? 'manual',
        status: twin.status as any,
        healthScore: twin.healthScore,
        metrics: twin.metrics ?? {},
        moduleState: twin.modules.map((m: any) => ({
          moduleKey: m.moduleKey,
          isActive: m.isActive,
          state: m.state,
        })),
        kpiValues,
      },
    });
  }

  /**
   * Record a twin event
   */
  async recordEvent(twinId: string, input: TwinEventInput) {
    return this.prisma.twinEvent.create({
      data: {
        twinId,
        eventType: input.eventType,
        source: input.source,
        severity: input.severity ?? 'INFO',
        payload: input.payload as any,
        description: input.description,
        correlationId: input.correlationId,
        causedBy: input.causedBy,
        actorType: input.actorType ?? 'SYSTEM',
        actorId: input.actorId,
      },
    });
  }

  /**
   * Update KPI values and recalculate health
   */
  async updateKPIs(twinId: string, updates: KPIUpdate[]) {
    // Update each KPI
    for (const update of updates) {
      const kpi = await this.prisma.twinKPI.findUnique({
        where: { twinId_kpiKey: { twinId, kpiKey: update.kpiKey } },
      });

      if (!kpi) continue;

      // Append to history (keep last 30 values)
      const history = ((kpi.history as any[]) ?? []).slice(-29);
      history.push({ value: update.value, timestamp: new Date().toISOString() });

      // Evaluate status
      const status = HealthCalculator.evaluateKPI({
        kpiKey: kpi.kpiKey,
        currentValue: update.value,
        warningMin: kpi.warningMin,
        warningMax: kpi.warningMax,
        criticalMin: kpi.criticalMin,
        criticalMax: kpi.criticalMax,
        category: kpi.category,
      });

      await this.prisma.twinKPI.update({
        where: { twinId_kpiKey: { twinId, kpiKey: update.kpiKey } },
        data: {
          currentValue: update.value,
          status,
          lastUpdated: new Date(),
          history,
        },
      });
    }

    // Recalculate overall health
    await this.recalculateHealth(twinId);
  }

  /**
   * Recalculate twin health from all KPIs
   */
  async recalculateHealth(twinId: string) {
    const kpis = await this.prisma.twinKPI.findMany({
      where: { twinId },
    });

    const kpiValues: KPIValue[] = kpis.map((kpi) => ({
      kpiKey: kpi.kpiKey,
      currentValue: kpi.currentValue,
      warningMin: kpi.warningMin,
      warningMax: kpi.warningMax,
      criticalMin: kpi.criticalMin,
      criticalMax: kpi.criticalMax,
      category: kpi.category,
    }));

    const health = HealthCalculator.calculate(kpiValues);

    await this.prisma.digitalTwin.update({
      where: { id: twinId },
      data: {
        healthStatus: health.healthStatus,
        healthScore: health.healthScore,
        lastMetricsCalc: new Date(),
      },
    });

    // Record health change event if critical
    if (health.healthStatus === 'CRITICAL' && health.breachedKPIs.length > 0) {
      await this.recordEvent(twinId, {
        eventType: 'twin.health.critical',
        source: 'core-ddts',
        severity: 'HIGH',
        payload: {
          healthScore: health.healthScore,
          breachedKPIs: health.breachedKPIs,
        },
        description: `Twin health is CRITICAL. Breached KPIs: ${health.breachedKPIs.join(', ')}`,
      });
    }

    return health;
  }

  /**
   * Activate an OS module on a twin
   */
  async activateModule(twinId: string, moduleKey: string, state?: Record<string, unknown>) {
    const existing = await this.prisma.twinModule.findUnique({
      where: { twinId_moduleKey: { twinId, moduleKey } },
    });

    if (existing) {
      return this.prisma.twinModule.update({
        where: { twinId_moduleKey: { twinId, moduleKey } },
        data: { isActive: true, deactivatedAt: null, state: state as any },
      });
    }

    return this.prisma.twinModule.create({
      data: {
        twinId,
        moduleKey,
        isActive: true,
        state: state as any,
      },
    });
  }

  /**
   * Deactivate an OS module on a twin
   */
  async deactivateModule(twinId: string, moduleKey: string) {
    return this.prisma.twinModule.update({
      where: { twinId_moduleKey: { twinId, moduleKey } },
      data: { isActive: false, deactivatedAt: new Date() },
    });
  }

  /**
   * List twins for an org with optional filtering
   */
  async listTwins(orgId: string, options?: {
    status?: TwinStatus;
    tier?: TwinTier;
    healthStatus?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { orgId };
    if (options?.status) where.status = options.status;
    if (options?.tier) where.tier = options.tier;
    if (options?.healthStatus) where.healthStatus = options.healthStatus;

    const [twins, total] = await Promise.all([
      this.prisma.digitalTwin.findMany({
        where,
        include: { kpis: true },
        orderBy: { updatedAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.digitalTwin.count({ where }),
    ]);

    return { twins, total };
  }

  /**
   * Get timeline of events for a twin
   */
  async getTimeline(twinId: string, limit = 50, offset = 0) {
    return this.prisma.twinEvent.findMany({
      where: { twinId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get snapshots for comparison
   */
  async getSnapshots(twinId: string, limit = 20) {
    return this.prisma.twinSnapshot.findMany({
      where: { twinId },
      orderBy: { snapshotAt: 'desc' },
      take: limit,
    });
  }
}
