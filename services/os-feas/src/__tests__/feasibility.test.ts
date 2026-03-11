/**
 * Feasibility Service Integration Tests
 * Tests CRUD operations, scenario management, DCF proforma generation,
 * IRR/ROI calculations, and Go/No-Go decisions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PrismaClient ────────────────────────────────────────

const mockPrisma = {
  feasibilityStudy: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  feasibilityScenario: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  feasibilityCostAssumption: {
    create: vi.fn(),
  },
  feasibilityRevenueAssumption: {
    create: vi.fn(),
  },
  feasibilityComparison: {
    create: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

// Import after mock
import { feasibilityService } from '../feasibility.service';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createStudy ─────────────────────────────────────────────

describe('feasibilityService.createStudy', () => {
  it('creates a study with DRAFT status and includes relations', async () => {
    const input = {
      orgId: 'org_001',
      projectId: 'proj_001',
      parcelId: 'parcel_001',
      title: 'Downtown Mixed-Use Feasibility',
      description: 'Evaluating a 200-unit mixed-use tower',
      landCost: 5000000,
      targetUnits: 200,
      targetSqFt: 250000,
      productType: 'Mixed-Use',
      constructionType: 'Type I',
      createdBy: 'user_001',
    };

    const mockStudy = {
      id: 'study_001',
      ...input,
      status: 'DRAFT',
      scenarios: [],
      costAssumptions: [],
      revenueAssumptions: [],
      comparisons: [],
    };

    mockPrisma.feasibilityStudy.create.mockResolvedValue(mockStudy);

    const result = await feasibilityService.createStudy(input);

    expect(result).toEqual(mockStudy);
    expect(result.status).toBe('DRAFT');
    expect(mockPrisma.feasibilityStudy.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: 'org_001',
        projectId: 'proj_001',
        parcelId: 'parcel_001',
        title: 'Downtown Mixed-Use Feasibility',
        landCost: 5000000,
        targetUnits: 200,
        targetSqFt: 250000,
        productType: 'Mixed-Use',
        constructionType: 'Type I',
        status: 'DRAFT',
      }),
      include: {
        scenarios: true,
        costAssumptions: true,
        revenueAssumptions: true,
        comparisons: true,
      },
    });
  });

  it('creates a study with only required fields', async () => {
    const input = { orgId: 'org_002', title: 'Quick Feasibility' };

    mockPrisma.feasibilityStudy.create.mockResolvedValue({
      id: 'study_002',
      orgId: 'org_002',
      title: 'Quick Feasibility',
      status: 'DRAFT',
      scenarios: [],
      costAssumptions: [],
      revenueAssumptions: [],
      comparisons: [],
    });

    const result = await feasibilityService.createStudy(input);

    expect(result.status).toBe('DRAFT');
    expect(mockPrisma.feasibilityStudy.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: 'org_002',
        title: 'Quick Feasibility',
        status: 'DRAFT',
        projectId: undefined,
        parcelId: undefined,
      }),
      include: {
        scenarios: true,
        costAssumptions: true,
        revenueAssumptions: true,
        comparisons: true,
      },
    });
  });
});

// ── getStudy ────────────────────────────────────────────────

describe('feasibilityService.getStudy', () => {
  it('retrieves a study with ordered scenarios and assumptions', async () => {
    const mockStudy = {
      id: 'study_100',
      title: 'Test Study',
      scenarios: [{ id: 's1', sortOrder: 1 }],
      costAssumptions: [{ id: 'ca1', sortOrder: 0 }],
      revenueAssumptions: [{ id: 'ra1', sortOrder: 0 }],
      comparisons: [{ id: 'comp1' }],
    };

    mockPrisma.feasibilityStudy.findUnique.mockResolvedValue(mockStudy);

    const result = await feasibilityService.getStudy('study_100');

    expect(result).toEqual(mockStudy);
    expect(mockPrisma.feasibilityStudy.findUnique).toHaveBeenCalledWith({
      where: { id: 'study_100' },
      include: {
        scenarios: { orderBy: { sortOrder: 'asc' } },
        costAssumptions: { orderBy: { sortOrder: 'asc' } },
        revenueAssumptions: { orderBy: { sortOrder: 'asc' } },
        comparisons: { orderBy: { createdAt: 'desc' } },
      },
    });
  });

  it('returns null when study not found', async () => {
    mockPrisma.feasibilityStudy.findUnique.mockResolvedValue(null);

    const result = await feasibilityService.getStudy('nonexistent');
    expect(result).toBeNull();
  });
});

// ── listStudies ─────────────────────────────────────────────

describe('feasibilityService.listStudies', () => {
  it('lists studies for an org with default pagination', async () => {
    const mockStudies = [
      { id: 's1', title: 'Study A', scenarios: [] },
      { id: 's2', title: 'Study B', scenarios: [] },
    ];

    mockPrisma.feasibilityStudy.findMany.mockResolvedValue(mockStudies);
    mockPrisma.feasibilityStudy.count.mockResolvedValue(2);

    const result = await feasibilityService.listStudies('org_001');

    expect(result.studies).toEqual(mockStudies);
    expect(result.total).toBe(2);
    expect(mockPrisma.feasibilityStudy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId: 'org_001' },
        take: 50,
        skip: 0,
        orderBy: { updatedAt: 'desc' },
      }),
    );
  });

  it('filters by status', async () => {
    mockPrisma.feasibilityStudy.findMany.mockResolvedValue([]);
    mockPrisma.feasibilityStudy.count.mockResolvedValue(0);

    await feasibilityService.listStudies('org_001', { status: 'GO' as any });

    expect(mockPrisma.feasibilityStudy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId: 'org_001', status: 'GO' },
      }),
    );
  });

  it('applies custom limit and offset', async () => {
    mockPrisma.feasibilityStudy.findMany.mockResolvedValue([]);
    mockPrisma.feasibilityStudy.count.mockResolvedValue(0);

    await feasibilityService.listStudies('org_001', { limit: 10, offset: 20 });

    expect(mockPrisma.feasibilityStudy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      }),
    );
  });
});

// ── addScenario ─────────────────────────────────────────────

describe('feasibilityService.addScenario', () => {
  it('creates a scenario with all financial fields', async () => {
    const scenarioData = {
      name: 'Base Case',
      description: 'Conservative assumptions',
      isBaseline: true,
      sortOrder: 1,
      unitMix: { '1BR': 80, '2BR': 100, '3BR': 20 },
      totalUnits: 200,
      totalSqFt: 250000,
      landCost: 5000000,
      hardCosts: 30000000,
      softCosts: 5000000,
      contingency: 2000000,
      totalDevelopCost: 42000000,
      costPerUnit: 210000,
      costPerSqFt: 168,
      grossRevenue: 60000000,
      grossRentalIncome: 400000,
      vacancyRate: 5,
      effectiveGrossIncome: 4560000,
      operatingExpenses: 1200000,
      netOperatingIncome: 3360000,
    };

    const mockScenario = {
      id: 'scenario_001',
      studyId: 'study_001',
      ...scenarioData,
      proformaYears: 10,
    };

    mockPrisma.feasibilityScenario.create.mockResolvedValue(mockScenario);

    const result = await feasibilityService.addScenario('study_001', scenarioData);

    expect(result).toEqual(mockScenario);
    expect(mockPrisma.feasibilityScenario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studyId: 'study_001',
        name: 'Base Case',
        isBaseline: true,
        totalUnits: 200,
        landCost: 5000000,
        hardCosts: 30000000,
        proformaYears: 10,
      }),
    });
  });

  it('defaults isBaseline to false, totalUnits to 0, proformaYears to 10', async () => {
    const scenarioData = {
      name: 'Alt Scenario',
      unitMix: {},
    };

    mockPrisma.feasibilityScenario.create.mockResolvedValue({
      id: 'scenario_002',
      studyId: 'study_001',
      ...scenarioData,
      isBaseline: false,
      totalUnits: 0,
      proformaYears: 10,
    });

    await feasibilityService.addScenario('study_001', scenarioData);

    expect(mockPrisma.feasibilityScenario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isBaseline: false,
        totalUnits: 0,
        sortOrder: 0,
        proformaYears: 10,
      }),
    });
  });
});

// ── generateProforma ────────────────────────────────────────

describe('feasibilityService.generateProforma', () => {
  it('generates a 10-year DCF proforma with correct cash flows', async () => {
    const mockScenario = {
      id: 'scenario_300',
      totalDevelopCost: 10000000,
      landCost: 2000000,
      hardCosts: 6000000,
      softCosts: 1500000,
      contingency: 500000,
      grossRentalIncome: 0,
      vacancyRate: 5,
      operatingExpenses: 200000,
      proformaYears: 10,
      study: {
        revenueAssumptions: [
          { monthlyRent: 2000, unitCount: 50 },
          { monthlyRent: 2500, unitCount: 30 },
        ],
        costAssumptions: [],
      },
    };

    mockPrisma.feasibilityScenario.findUniqueOrThrow.mockResolvedValue(mockScenario);
    mockPrisma.feasibilityScenario.update.mockResolvedValue({ id: 'scenario_300' });

    const result = await feasibilityService.generateProforma('scenario_300');

    // Year-1 gross rental: (2000*50*12) + (2500*30*12) = 1,200,000 + 900,000 = 2,100,000
    expect(result.proforma).toHaveLength(10);
    expect(result.proforma[0].grossRentalIncome).toBe(2100000);

    // Vacancy: 2,100,000 * 0.05 = 105,000
    expect(result.proforma[0].vacancyLoss).toBe(105000);

    // EGI: 2,100,000 - 105,000 = 1,995,000
    expect(result.proforma[0].effectiveGrossIncome).toBe(1995000);

    // NOI: 1,995,000 - 200,000 = 1,795,000
    expect(result.proforma[0].netOperatingIncome).toBe(1795000);

    // Year-2 should escalate by 3%
    const year2Gross = 2100000 * 1.03;
    expect(result.proforma[1].grossRentalIncome).toBe(
      Math.round(year2Gross * 100) / 100,
    );

    // Metrics
    expect(result.metrics.totalDevelopCost).toBe(10000000);
    expect(result.metrics.year1NOI).toBe(1795000);
    expect(result.metrics.irr).not.toBeNull();
    expect(result.metrics.roi).toBeGreaterThan(0);
    expect(result.metrics.capRate).toBeGreaterThan(0);
    expect(result.metrics.paybackMonths).toBeGreaterThan(0);
  });

  it('uses scenario-level grossRentalIncome as fallback', async () => {
    const mockScenario = {
      id: 'scenario_301',
      totalDevelopCost: 5000000,
      landCost: 0,
      hardCosts: 0,
      softCosts: 0,
      contingency: 0,
      grossRentalIncome: 50000, // monthly
      vacancyRate: 10,
      operatingExpenses: 100000,
      proformaYears: 5,
      study: {
        revenueAssumptions: [], // empty -> trigger fallback
        costAssumptions: [],
      },
    };

    mockPrisma.feasibilityScenario.findUniqueOrThrow.mockResolvedValue(mockScenario);
    mockPrisma.feasibilityScenario.update.mockResolvedValue({ id: 'scenario_301' });

    const result = await feasibilityService.generateProforma('scenario_301');

    // Fallback: 50000 * 12 = 600,000
    expect(result.proforma[0].grossRentalIncome).toBe(600000);
    expect(result.proforma).toHaveLength(5);
  });

  it('calculates totalDevelopCost from components when totalDevelopCost is 0', async () => {
    const mockScenario = {
      id: 'scenario_302',
      totalDevelopCost: 0,
      landCost: 1000000,
      hardCosts: 3000000,
      softCosts: 500000,
      contingency: 200000,
      grossRentalIncome: 0,
      vacancyRate: 5,
      operatingExpenses: 50000,
      proformaYears: 10,
      study: {
        revenueAssumptions: [{ monthlyRent: 3000, unitCount: 20 }],
        costAssumptions: [],
      },
    };

    mockPrisma.feasibilityScenario.findUniqueOrThrow.mockResolvedValue(mockScenario);
    mockPrisma.feasibilityScenario.update.mockResolvedValue({ id: 'scenario_302' });

    const result = await feasibilityService.generateProforma('scenario_302');

    // totalDevelopCost = 1M + 3M + 500K + 200K = 4,700,000
    expect(result.metrics.totalDevelopCost).toBe(4700000);
  });

  it('returns zero metrics when costs and revenue are zero', async () => {
    const mockScenario = {
      id: 'scenario_303',
      totalDevelopCost: 0,
      landCost: 0,
      hardCosts: 0,
      softCosts: 0,
      contingency: 0,
      grossRentalIncome: 0,
      vacancyRate: 5,
      operatingExpenses: 0,
      proformaYears: 10,
      study: {
        revenueAssumptions: [],
        costAssumptions: [],
      },
    };

    mockPrisma.feasibilityScenario.findUniqueOrThrow.mockResolvedValue(mockScenario);
    mockPrisma.feasibilityScenario.update.mockResolvedValue({ id: 'scenario_303' });

    const result = await feasibilityService.generateProforma('scenario_303');

    expect(result.metrics.totalDevelopCost).toBe(0);
    expect(result.metrics.year1NOI).toBe(0);
    expect(result.metrics.roi).toBe(0);
    expect(result.metrics.capRate).toBe(0);
    expect(result.metrics.paybackMonths).toBeNull();
  });

  it('updates the scenario with proforma data and metrics', async () => {
    const mockScenario = {
      id: 'scenario_304',
      totalDevelopCost: 2000000,
      landCost: 0,
      hardCosts: 0,
      softCosts: 0,
      contingency: 0,
      grossRentalIncome: 0,
      vacancyRate: 5,
      operatingExpenses: 50000,
      proformaYears: 10,
      study: {
        revenueAssumptions: [{ monthlyRent: 1500, unitCount: 20 }],
        costAssumptions: [],
      },
    };

    mockPrisma.feasibilityScenario.findUniqueOrThrow.mockResolvedValue(mockScenario);
    mockPrisma.feasibilityScenario.update.mockResolvedValue({ id: 'scenario_304' });

    await feasibilityService.generateProforma('scenario_304');

    expect(mockPrisma.feasibilityScenario.update).toHaveBeenCalledWith({
      where: { id: 'scenario_304' },
      data: expect.objectContaining({
        proforma: expect.any(Array),
        netOperatingIncome: expect.any(Number),
        irr: expect.any(Number),
        roi: expect.any(Number),
        capRate: expect.any(Number),
        cashOnCash: expect.any(Number),
        paybackMonths: expect.any(Number),
      }),
    });
  });
});

// ── makeDecision (Go/No-Go) ─────────────────────────────────

describe('feasibilityService.makeDecision', () => {
  it('marks a study as GO with decision details', async () => {
    const mockUpdated = {
      id: 'study_400',
      status: 'GO',
      decision: 'GO',
      decisionBy: 'user_001',
      decisionDate: expect.any(Date),
      decisionNotes: 'Strong IRR, proceed',
    };

    mockPrisma.feasibilityStudy.update.mockResolvedValue(mockUpdated);

    const result = await feasibilityService.makeDecision(
      'study_400',
      'GO',
      'user_001',
      'Strong IRR, proceed',
    );

    expect(result.status).toBe('GO');
    expect(mockPrisma.feasibilityStudy.update).toHaveBeenCalledWith({
      where: { id: 'study_400' },
      data: expect.objectContaining({
        decision: 'GO',
        decisionBy: 'user_001',
        decisionNotes: 'Strong IRR, proceed',
        status: 'GO',
        decisionDate: expect.any(Date),
      }),
      include: {
        scenarios: true,
        costAssumptions: true,
        revenueAssumptions: true,
        comparisons: true,
      },
    });
  });

  it('marks a study as NO_GO', async () => {
    mockPrisma.feasibilityStudy.update.mockResolvedValue({
      id: 'study_401',
      status: 'NO_GO',
      decision: 'NO_GO',
    });

    const result = await feasibilityService.makeDecision(
      'study_401',
      'NO_GO',
      'user_002',
      'IRR below threshold',
    );

    expect(result.status).toBe('NO_GO');
    expect(mockPrisma.feasibilityStudy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          decision: 'NO_GO',
          status: 'NO_GO',
        }),
      }),
    );
  });

  it('maps CONDITIONAL decision to ON_HOLD status', async () => {
    mockPrisma.feasibilityStudy.update.mockResolvedValue({
      id: 'study_402',
      status: 'ON_HOLD',
      decision: 'CONDITIONAL',
    });

    await feasibilityService.makeDecision('study_402', 'CONDITIONAL', 'user_001');

    expect(mockPrisma.feasibilityStudy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          decision: 'CONDITIONAL',
          status: 'ON_HOLD',
        }),
      }),
    );
  });
});

// ── updateBestMetrics ───────────────────────────────────────

describe('feasibilityService.updateBestMetrics', () => {
  it('selects the best IRR, ROI, NOI across all scenarios', async () => {
    mockPrisma.feasibilityScenario.findMany.mockResolvedValue([
      { irr: 12.5, roi: 80, netOperatingIncome: 1500000, totalDevelopCost: 10000000 },
      { irr: 15.2, roi: 95, netOperatingIncome: 2000000, totalDevelopCost: 12000000 },
      { irr: 8.0, roi: 60, netOperatingIncome: 900000, totalDevelopCost: 8000000 },
    ]);
    mockPrisma.feasibilityStudy.update.mockResolvedValue({});

    await feasibilityService.updateBestMetrics('study_500');

    expect(mockPrisma.feasibilityStudy.update).toHaveBeenCalledWith({
      where: { id: 'study_500' },
      data: {
        bestIRR: 15.2,
        bestROI: 95,
        bestNOI: 2000000,
        totalProjectCost: 12000000,
      },
    });
  });

  it('returns null when no scenarios exist', async () => {
    mockPrisma.feasibilityScenario.findMany.mockResolvedValue([]);

    const result = await feasibilityService.updateBestMetrics('study_501');
    expect(result).toBeNull();
    expect(mockPrisma.feasibilityStudy.update).not.toHaveBeenCalled();
  });

  it('handles scenarios with null metrics gracefully', async () => {
    mockPrisma.feasibilityScenario.findMany.mockResolvedValue([
      { irr: null, roi: null, netOperatingIncome: 0, totalDevelopCost: 0 },
    ]);
    mockPrisma.feasibilityStudy.update.mockResolvedValue({});

    await feasibilityService.updateBestMetrics('study_502');

    expect(mockPrisma.feasibilityStudy.update).toHaveBeenCalledWith({
      where: { id: 'study_502' },
      data: {
        bestIRR: null,
        bestROI: null,
        bestNOI: null,
        totalProjectCost: null,
      },
    });
  });
});

// ── addCostAssumption ───────────────────────────────────────

describe('feasibilityService.addCostAssumption', () => {
  it('creates a cost assumption with all fields', async () => {
    const costData = {
      category: 'Hard Costs',
      subcategory: 'Concrete',
      lineItem: '6" Concrete Slab',
      amount: 12.50,
      unit: 'SF',
      quantity: 50000,
      totalCost: 625000,
      source: 'RSMeans 2026',
      confidence: 85,
      notes: 'Per Q1 2026 pricing',
      sortOrder: 1,
    };

    mockPrisma.feasibilityCostAssumption.create.mockResolvedValue({
      id: 'ca_001',
      studyId: 'study_001',
      ...costData,
    });

    const result = await feasibilityService.addCostAssumption('study_001', costData);

    expect(result.category).toBe('Hard Costs');
    expect(mockPrisma.feasibilityCostAssumption.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studyId: 'study_001',
        category: 'Hard Costs',
        lineItem: '6" Concrete Slab',
        amount: 12.50,
        totalCost: 625000,
        sortOrder: 1,
      }),
    });
  });

  it('defaults sortOrder to 0', async () => {
    mockPrisma.feasibilityCostAssumption.create.mockResolvedValue({
      id: 'ca_002',
      sortOrder: 0,
    });

    await feasibilityService.addCostAssumption('study_001', {
      category: 'Soft Costs',
      lineItem: 'Architecture Fee',
      amount: 250000,
    });

    expect(mockPrisma.feasibilityCostAssumption.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sortOrder: 0 }),
    });
  });
});

// ── addRevenueAssumption ────────────────────────────────────

describe('feasibilityService.addRevenueAssumption', () => {
  it('creates a revenue assumption with rental parameters', async () => {
    const revenueData = {
      unitType: '2BR/2BA',
      unitCount: 80,
      avgSqFt: 1100,
      pricePerUnit: 350000,
      pricePerSqFt: 318,
      monthlyRent: 2200,
      annualEscalation: 3,
      stabilizedOccupancy: 95,
      absorptionMonths: 18,
      notes: 'Market comparable rents',
    };

    mockPrisma.feasibilityRevenueAssumption.create.mockResolvedValue({
      id: 'ra_001',
      studyId: 'study_001',
      ...revenueData,
    });

    const result = await feasibilityService.addRevenueAssumption('study_001', revenueData);

    expect(result.unitType).toBe('2BR/2BA');
    expect(mockPrisma.feasibilityRevenueAssumption.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studyId: 'study_001',
        unitType: '2BR/2BA',
        unitCount: 80,
        monthlyRent: 2200,
        sortOrder: 0,
      }),
    });
  });
});

// ── addComparison ───────────────────────────────────────────

describe('feasibilityService.addComparison', () => {
  it('creates a comparison project with date parsing', async () => {
    const compData = {
      projectName: 'Riverwalk Towers',
      address: '456 River Rd, Austin TX',
      completedAt: '2025-06-15',
      productType: 'Multifamily',
      totalUnits: 300,
      totalSqFt: 350000,
      totalCost: 55000000,
      costPerUnit: 183333,
      costPerSqFt: 157,
      avgSalePrice: 0,
      avgRent: 2100,
      capRate: 5.5,
      similarity: 85,
      notes: 'Similar size and product type',
    };

    mockPrisma.feasibilityComparison.create.mockResolvedValue({
      id: 'comp_001',
      studyId: 'study_001',
      ...compData,
      completedAt: new Date('2025-06-15'),
    });

    const result = await feasibilityService.addComparison('study_001', compData);

    expect(result.projectName).toBe('Riverwalk Towers');
    expect(mockPrisma.feasibilityComparison.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studyId: 'study_001',
        projectName: 'Riverwalk Towers',
        completedAt: expect.any(Date),
        similarity: 85,
      }),
    });
  });

  it('omits completedAt when not provided', async () => {
    mockPrisma.feasibilityComparison.create.mockResolvedValue({
      id: 'comp_002',
      completedAt: undefined,
    });

    await feasibilityService.addComparison('study_001', {
      projectName: 'Simple Comp',
    });

    expect(mockPrisma.feasibilityComparison.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        completedAt: undefined,
      }),
    });
  });
});
