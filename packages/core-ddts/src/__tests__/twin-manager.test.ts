/**
 * TwinManager Integration Tests
 * Tests DDTS lifecycle management: create, transition, snapshot, events, KPIs, health
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwinManager } from '../twin-manager';
import { TwinStateMachine } from '../state-machine';
import { HealthCalculator } from '../health-calculator';

// ── Mock PrismaClient ──────────────────────────────────────────

function createMockPrisma() {
  return {
    digitalTwin: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    twinKPI: {
      createMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    twinEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    twinSnapshot: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    twinModule: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

type MockPrisma = ReturnType<typeof createMockPrisma>;

describe('TwinManager', () => {
  let prisma: MockPrisma;
  let manager: TwinManager;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    manager = new TwinManager(prisma as any);
  });

  // ── createTwin ─────────────────────────────────────────────

  describe('createTwin', () => {
    it('creates a digital twin with correct tier and INTAKE status', async () => {
      const input = {
        projectId: 'proj_001',
        orgId: 'org_001',
        tier: 'L2' as const,
        label: 'My Test Twin',
        enabledModules: ['estimation', 'scheduling'],
      };

      const mockTwin = {
        id: 'twin_abc',
        projectId: input.projectId,
        orgId: input.orgId,
        tier: 'L2',
        status: 'INTAKE',
        healthStatus: 'UNKNOWN',
        healthScore: 0,
        label: input.label,
        enabledModules: input.enabledModules,
        phaseHistory: [{ phase: 'INTAKE', startedAt: expect.any(String) }],
      };

      prisma.digitalTwin.create.mockResolvedValue(mockTwin);
      prisma.twinKPI.createMany.mockResolvedValue({ count: 6 });
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_001' });

      const result = await manager.createTwin(input);

      expect(result).toEqual(mockTwin);
      expect(prisma.digitalTwin.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'proj_001',
          orgId: 'org_001',
          tier: 'L2',
          status: 'INTAKE',
          healthStatus: 'UNKNOWN',
          healthScore: 0,
          label: 'My Test Twin',
          enabledModules: ['estimation', 'scheduling'],
        }),
      });
    });

    it('defaults to tier L1 when no tier provided', async () => {
      const input = { projectId: 'proj_002', orgId: 'org_001' };

      prisma.digitalTwin.create.mockResolvedValue({
        id: 'twin_def',
        tier: 'L1',
        status: 'INTAKE',
      });
      prisma.twinKPI.createMany.mockResolvedValue({ count: 3 });
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_002' });

      await manager.createTwin(input);

      expect(prisma.digitalTwin.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tier: 'L1',
        }),
      });
    });

    it('creates default KPIs for the specified tier', async () => {
      const input = { projectId: 'proj_003', orgId: 'org_001', tier: 'L1' as const };

      prisma.digitalTwin.create.mockResolvedValue({ id: 'twin_ghi' });
      prisma.twinKPI.createMany.mockResolvedValue({ count: 3 });
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_003' });

      await manager.createTwin(input);

      expect(prisma.twinKPI.createMany).toHaveBeenCalledTimes(1);
      const createManyCall = prisma.twinKPI.createMany.mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(3); // L1 has 3 default KPIs
      expect(createManyCall.data[0]).toEqual(
        expect.objectContaining({
          twinId: 'twin_ghi',
          kpiKey: 'budget_variance',
          category: 'cost',
          currentValue: 0,
          status: 'HEALTHY',
        }),
      );
    });

    it('records a twin.created event after creation', async () => {
      const input = { projectId: 'proj_004', orgId: 'org_001', tier: 'L2' as const };

      prisma.digitalTwin.create.mockResolvedValue({ id: 'twin_jkl' });
      prisma.twinKPI.createMany.mockResolvedValue({ count: 6 });
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_004' });

      await manager.createTwin(input);

      expect(prisma.twinEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          twinId: 'twin_jkl',
          eventType: 'twin.created',
          source: 'core-ddts',
          severity: 'INFO',
          payload: { tier: 'L2', projectId: 'proj_004' },
        }),
      });
    });
  });

  // ── transitionPhase ────────────────────────────────────────

  describe('transitionPhase', () => {
    it('transitions from INTAKE to FEASIBILITY', async () => {
      prisma.digitalTwin.findUniqueOrThrow.mockResolvedValue({
        id: 'twin_100',
        status: 'INTAKE',
        phaseHistory: [{ phase: 'INTAKE', startedAt: '2026-01-01T00:00:00Z' }],
      });
      prisma.digitalTwin.update.mockResolvedValue({
        id: 'twin_100',
        status: 'FEASIBILITY',
      });
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_100' });
      // createSnapshot mocks
      prisma.digitalTwin.findUniqueOrThrow.mockResolvedValueOnce({
        id: 'twin_100',
        status: 'INTAKE',
        phaseHistory: [{ phase: 'INTAKE', startedAt: '2026-01-01T00:00:00Z' }],
      });
      prisma.digitalTwin.findUniqueOrThrow.mockResolvedValueOnce({
        id: 'twin_100',
        status: 'FEASIBILITY',
        healthScore: 0,
        metrics: {},
        kpis: [],
        modules: [],
      });
      prisma.twinSnapshot.create.mockResolvedValue({ id: 'snap_001' });

      const result = await manager.transitionPhase('twin_100', 'FEASIBILITY', 'Ready for feasibility');

      expect(result.status).toBe('FEASIBILITY');
      expect(prisma.digitalTwin.update).toHaveBeenCalledWith({
        where: { id: 'twin_100' },
        data: expect.objectContaining({
          status: 'FEASIBILITY',
          currentPhase: 'FEASIBILITY',
        }),
      });
    });

    it('records a twin.phase.changed event on transition', async () => {
      prisma.digitalTwin.findUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'twin_101',
          status: 'FEASIBILITY',
          phaseHistory: [
            { phase: 'INTAKE', startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-02T00:00:00Z' },
            { phase: 'FEASIBILITY', startedAt: '2026-01-02T00:00:00Z' },
          ],
        })
        .mockResolvedValueOnce({
          id: 'twin_101',
          status: 'ENTITLEMENT',
          healthScore: 50,
          metrics: {},
          kpis: [],
          modules: [],
        });

      prisma.digitalTwin.update.mockResolvedValue({ id: 'twin_101', status: 'ENTITLEMENT' });
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_101' });
      prisma.twinSnapshot.create.mockResolvedValue({ id: 'snap_002' });

      await manager.transitionPhase('twin_101', 'ENTITLEMENT');

      expect(prisma.twinEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          twinId: 'twin_101',
          eventType: 'twin.phase.changed',
          severity: 'MEDIUM',
          payload: expect.objectContaining({
            from: 'FEASIBILITY',
            to: 'ENTITLEMENT',
          }),
        }),
      });
    });

    it('throws an error for invalid transitions', async () => {
      prisma.digitalTwin.findUniqueOrThrow.mockResolvedValue({
        id: 'twin_102',
        status: 'INTAKE',
        phaseHistory: [{ phase: 'INTAKE', startedAt: '2026-01-01T00:00:00Z' }],
      });

      // INTAKE -> CONSTRUCTION is not allowed
      await expect(
        manager.transitionPhase('twin_102', 'CONSTRUCTION'),
      ).rejects.toThrow(/Invalid twin phase transition.*INTAKE.*CONSTRUCTION/);

      expect(prisma.digitalTwin.update).not.toHaveBeenCalled();
    });

    it('rejects transition from terminal ARCHIVED state', async () => {
      prisma.digitalTwin.findUniqueOrThrow.mockResolvedValue({
        id: 'twin_103',
        status: 'ARCHIVED',
        phaseHistory: [],
      });

      await expect(
        manager.transitionPhase('twin_103', 'INTAKE'),
      ).rejects.toThrow(/Invalid twin phase transition/);
    });

    it('auto-creates a snapshot on successful phase change', async () => {
      prisma.digitalTwin.findUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'twin_104',
          status: 'PRE_CONSTRUCTION',
          phaseHistory: [{ phase: 'PRE_CONSTRUCTION', startedAt: '2026-01-01T00:00:00Z' }],
        })
        .mockResolvedValueOnce({
          id: 'twin_104',
          status: 'CONSTRUCTION',
          healthScore: 80,
          metrics: {},
          kpis: [{ kpiKey: 'budget_variance', currentValue: 2 }],
          modules: [],
        });

      prisma.digitalTwin.update.mockResolvedValue({ id: 'twin_104', status: 'CONSTRUCTION' });
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_104' });
      prisma.twinSnapshot.create.mockResolvedValue({ id: 'snap_003' });

      await manager.transitionPhase('twin_104', 'CONSTRUCTION');

      expect(prisma.twinSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          twinId: 'twin_104',
          label: 'Phase: CONSTRUCTION',
          trigger: 'phase_change',
        }),
      });
    });
  });

  // ── createSnapshot ─────────────────────────────────────────

  describe('createSnapshot', () => {
    it('captures current twin state including KPI values', async () => {
      prisma.digitalTwin.findUniqueOrThrow.mockResolvedValue({
        id: 'twin_200',
        status: 'CONSTRUCTION',
        healthScore: 85,
        metrics: { budgetVariance: 3 },
        kpis: [
          { kpiKey: 'budget_variance', currentValue: 3 },
          { kpiKey: 'schedule_spi', currentValue: 0.95 },
        ],
        modules: [
          { moduleKey: 'estimation', isActive: true, state: { version: 2 } },
        ],
      });
      prisma.twinSnapshot.create.mockResolvedValue({ id: 'snap_200' });

      await manager.createSnapshot('twin_200', { label: 'Weekly Check', trigger: 'scheduled' });

      expect(prisma.twinSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          twinId: 'twin_200',
          label: 'Weekly Check',
          trigger: 'scheduled',
          status: 'CONSTRUCTION',
          healthScore: 85,
          metrics: { budgetVariance: 3 },
          kpiValues: {
            budget_variance: 3,
            schedule_spi: 0.95,
          },
          moduleState: [
            { moduleKey: 'estimation', isActive: true, state: { version: 2 } },
          ],
        }),
      });
    });

    it('defaults trigger to manual when not specified', async () => {
      prisma.digitalTwin.findUniqueOrThrow.mockResolvedValue({
        id: 'twin_201',
        status: 'INTAKE',
        healthScore: 0,
        metrics: null,
        kpis: [],
        modules: [],
      });
      prisma.twinSnapshot.create.mockResolvedValue({ id: 'snap_201' });

      await manager.createSnapshot('twin_201');

      expect(prisma.twinSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trigger: 'manual',
        }),
      });
    });
  });

  // ── recordEvent ────────────────────────────────────────────

  describe('recordEvent', () => {
    it('logs an event with correct envelope fields', async () => {
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_300' });

      const input = {
        eventType: 'twin.health.critical',
        source: 'health-calculator',
        severity: 'HIGH' as const,
        payload: { healthScore: 25, breachedKPIs: ['budget_variance'] },
        description: 'Twin health is CRITICAL',
        correlationId: 'corr_001',
        actorType: 'SYSTEM' as const,
      };

      await manager.recordEvent('twin_300', input);

      expect(prisma.twinEvent.create).toHaveBeenCalledWith({
        data: {
          twinId: 'twin_300',
          eventType: 'twin.health.critical',
          source: 'health-calculator',
          severity: 'HIGH',
          payload: { healthScore: 25, breachedKPIs: ['budget_variance'] },
          description: 'Twin health is CRITICAL',
          correlationId: 'corr_001',
          causedBy: undefined,
          actorType: 'SYSTEM',
          actorId: undefined,
        },
      });
    });

    it('defaults severity to INFO and actorType to SYSTEM', async () => {
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_301' });

      await manager.recordEvent('twin_301', {
        eventType: 'twin.module.activated',
        source: 'core-ddts',
        payload: { moduleKey: 'estimation' },
      });

      expect(prisma.twinEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'INFO',
          actorType: 'SYSTEM',
        }),
      });
    });
  });

  // ── updateKPIs ─────────────────────────────────────────────

  describe('updateKPIs', () => {
    it('updates KPI values and appends to history', async () => {
      prisma.twinKPI.findUnique.mockResolvedValue({
        kpiKey: 'budget_variance',
        currentValue: 2,
        warningMin: null,
        warningMax: 5,
        criticalMin: null,
        criticalMax: 10,
        category: 'cost',
        history: [{ value: 1, timestamp: '2026-01-01T00:00:00Z' }],
      });
      prisma.twinKPI.update.mockResolvedValue({});
      prisma.twinKPI.findMany.mockResolvedValue([]);
      prisma.digitalTwin.update.mockResolvedValue({});

      await manager.updateKPIs('twin_400', [{ kpiKey: 'budget_variance', value: 4 }]);

      expect(prisma.twinKPI.update).toHaveBeenCalledWith({
        where: { twinId_kpiKey: { twinId: 'twin_400', kpiKey: 'budget_variance' } },
        data: expect.objectContaining({
          currentValue: 4,
          status: 'HEALTHY', // 4 < warningMax of 5
          history: expect.arrayContaining([
            { value: 1, timestamp: '2026-01-01T00:00:00Z' },
            { value: 4, timestamp: expect.any(String) },
          ]),
        }),
      });
    });

    it('skips unknown KPIs without error', async () => {
      prisma.twinKPI.findUnique.mockResolvedValue(null);
      prisma.twinKPI.findMany.mockResolvedValue([]);
      prisma.digitalTwin.update.mockResolvedValue({});

      await expect(
        manager.updateKPIs('twin_401', [{ kpiKey: 'nonexistent_kpi', value: 99 }]),
      ).resolves.not.toThrow();

      expect(prisma.twinKPI.update).not.toHaveBeenCalled();
    });

    it('triggers recalculateHealth after updating KPIs', async () => {
      prisma.twinKPI.findUnique.mockResolvedValue({
        kpiKey: 'schedule_spi',
        currentValue: 1.0,
        warningMin: 0.9,
        warningMax: null,
        criticalMin: 0.8,
        criticalMax: null,
        category: 'schedule',
        history: [],
      });
      prisma.twinKPI.update.mockResolvedValue({});
      prisma.twinKPI.findMany.mockResolvedValue([
        {
          kpiKey: 'schedule_spi',
          currentValue: 0.75,
          warningMin: 0.9,
          warningMax: null,
          criticalMin: 0.8,
          criticalMax: null,
          category: 'schedule',
        },
      ]);
      prisma.digitalTwin.update.mockResolvedValue({});
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_401' });

      await manager.updateKPIs('twin_402', [{ kpiKey: 'schedule_spi', value: 0.75 }]);

      // recalculateHealth was called (updates digitalTwin with health)
      expect(prisma.digitalTwin.update).toHaveBeenCalledWith({
        where: { id: 'twin_402' },
        data: expect.objectContaining({
          healthStatus: 'CRITICAL',
        }),
      });
    });
  });

  // ── recalculateHealth ──────────────────────────────────────

  describe('recalculateHealth', () => {
    it('computes weighted health score from all KPIs', async () => {
      prisma.twinKPI.findMany.mockResolvedValue([
        {
          kpiKey: 'budget_variance',
          currentValue: 2,
          warningMin: null,
          warningMax: 5,
          criticalMin: null,
          criticalMax: 10,
          category: 'cost',
        },
        {
          kpiKey: 'schedule_spi',
          currentValue: 0.95,
          warningMin: 0.9,
          warningMax: null,
          criticalMin: 0.8,
          criticalMax: null,
          category: 'schedule',
        },
      ]);
      prisma.digitalTwin.update.mockResolvedValue({});

      const result = await manager.recalculateHealth('twin_500');

      // Both KPIs are HEALTHY -> each category gets score 100
      // cost weight = 0.30, schedule weight = 0.25
      // weighted = (100*0.30 + 100*0.25) / (0.30+0.25) = 100
      expect(result.healthStatus).toBe('HEALTHY');
      expect(result.healthScore).toBe(100);
      expect(result.breachedKPIs).toEqual([]);
      expect(result.warningKPIs).toEqual([]);

      expect(prisma.digitalTwin.update).toHaveBeenCalledWith({
        where: { id: 'twin_500' },
        data: expect.objectContaining({
          healthStatus: 'HEALTHY',
          healthScore: 100,
        }),
      });
    });

    it('returns CRITICAL status when KPIs are breached', async () => {
      prisma.twinKPI.findMany.mockResolvedValue([
        {
          kpiKey: 'budget_variance',
          currentValue: 15, // Over criticalMax of 10
          warningMin: null,
          warningMax: 5,
          criticalMin: null,
          criticalMax: 10,
          category: 'cost',
        },
      ]);
      prisma.digitalTwin.update.mockResolvedValue({});
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_500' });

      const result = await manager.recalculateHealth('twin_501');

      expect(result.healthStatus).toBe('CRITICAL');
      expect(result.breachedKPIs).toContain('budget_variance');
    });

    it('records a critical health event when status is CRITICAL', async () => {
      prisma.twinKPI.findMany.mockResolvedValue([
        {
          kpiKey: 'budget_variance',
          currentValue: 12,
          warningMin: null,
          warningMax: 5,
          criticalMin: null,
          criticalMax: 10,
          category: 'cost',
        },
      ]);
      prisma.digitalTwin.update.mockResolvedValue({});
      prisma.twinEvent.create.mockResolvedValue({ id: 'evt_501' });

      await manager.recalculateHealth('twin_502');

      expect(prisma.twinEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'twin.health.critical',
          severity: 'HIGH',
          payload: expect.objectContaining({
            breachedKPIs: ['budget_variance'],
          }),
        }),
      });
    });

    it('returns UNKNOWN with score 0 when no KPIs exist', async () => {
      prisma.twinKPI.findMany.mockResolvedValue([]);
      prisma.digitalTwin.update.mockResolvedValue({});

      const result = await manager.recalculateHealth('twin_503');

      expect(result.healthStatus).toBe('UNKNOWN');
      expect(result.healthScore).toBe(0);
    });

    it('returns AT_RISK when KPIs are in warning range', async () => {
      prisma.twinKPI.findMany.mockResolvedValue([
        {
          kpiKey: 'budget_variance',
          currentValue: 7, // Between warningMax(5) and criticalMax(10)
          warningMin: null,
          warningMax: 5,
          criticalMin: null,
          criticalMax: 10,
          category: 'cost',
        },
      ]);
      prisma.digitalTwin.update.mockResolvedValue({});

      const result = await manager.recalculateHealth('twin_504');

      expect(result.healthStatus).toBe('AT_RISK');
      expect(result.warningKPIs).toContain('budget_variance');
      expect(result.healthScore).toBe(60); // AT_RISK score for single KPI
    });
  });

  // ── TwinStateMachine (unit) ────────────────────────────────

  describe('TwinStateMachine', () => {
    it('validates INTAKE -> FEASIBILITY as allowed', () => {
      expect(TwinStateMachine.isValidTransition('INTAKE', 'FEASIBILITY')).toBe(true);
    });

    it('validates INTAKE -> CONSTRUCTION as disallowed', () => {
      expect(TwinStateMachine.isValidTransition('INTAKE', 'CONSTRUCTION')).toBe(false);
    });

    it('allows any non-terminal state to transition to ARCHIVED', () => {
      const nonTerminal = [
        'INTAKE', 'LAND_ANALYSIS', 'FEASIBILITY', 'ENTITLEMENT',
        'PRE_CONSTRUCTION', 'CONSTRUCTION', 'CLOSEOUT', 'OPERATIONS',
      ] as const;
      for (const state of nonTerminal) {
        expect(TwinStateMachine.isValidTransition(state, 'ARCHIVED')).toBe(true);
      }
    });

    it('returns empty transitions for ARCHIVED (terminal)', () => {
      expect(TwinStateMachine.getAllowedTransitions('ARCHIVED')).toEqual([]);
    });

    it('throws on invalid transition via validateTransition', () => {
      expect(() =>
        TwinStateMachine.validateTransition('OPERATIONS', 'INTAKE'),
      ).toThrow(/Invalid twin phase transition/);
    });
  });
});
