/**
 * Capital Service Integration Tests
 * Tests capital stack CRUD, source management, draw lifecycle,
 * investor reporting, and entitlement tracking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PrismaClient ────────────────────────────────────────

const mockPrisma = {
  capitalStack: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  capitalSource: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  drawSchedule: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  investorReport: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  entitlement: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

// Import after mock
import { capitalService } from '../capital.service';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createCapitalStack ──────────────────────────────────────

describe('capitalService.createCapitalStack', () => {
  it('creates a capital stack with all source tiers', async () => {
    const input = {
      projectId: 'proj_001',
      orgId: 'org_001',
      totalCapital: 50000000,
      seniorDebt: 30000000,
      mezzanineDebt: 5000000,
      preferredEquity: 5000000,
      commonEquity: 8000000,
      grants: 1000000,
      otherSources: 1000000,
      notes: 'Initial capital structure',
    };

    const mockStack = {
      id: 'stack_001',
      ...input,
      sources: [],
    };

    mockPrisma.capitalStack.create.mockResolvedValue(mockStack);

    const result = await capitalService.createCapitalStack(input);

    expect(result).toEqual(mockStack);
    expect(mockPrisma.capitalStack.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        orgId: 'org_001',
        totalCapital: 50000000,
        seniorDebt: 30000000,
        mezzanineDebt: 5000000,
        preferredEquity: 5000000,
        commonEquity: 8000000,
        grants: 1000000,
        otherSources: 1000000,
      }),
      include: { sources: true },
    });
  });

  it('defaults optional source tiers to 0', async () => {
    const input = {
      projectId: 'proj_002',
      orgId: 'org_001',
      totalCapital: 10000000,
    };

    mockPrisma.capitalStack.create.mockResolvedValue({
      id: 'stack_002',
      ...input,
      seniorDebt: 0,
      mezzanineDebt: 0,
      preferredEquity: 0,
      commonEquity: 0,
      grants: 0,
      otherSources: 0,
      sources: [],
    });

    await capitalService.createCapitalStack(input);

    expect(mockPrisma.capitalStack.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        seniorDebt: 0,
        mezzanineDebt: 0,
        preferredEquity: 0,
        commonEquity: 0,
        grants: 0,
        otherSources: 0,
      }),
      include: { sources: true },
    });
  });
});

// ── getCapitalStack ─────────────────────────────────────────

describe('capitalService.getCapitalStack', () => {
  it('retrieves a capital stack with sources and draw schedules', async () => {
    const mockStack = {
      id: 'stack_100',
      projectId: 'proj_001',
      totalCapital: 50000000,
      sources: [{ id: 'src_001', lenderName: 'Bank A' }],
      drawSchedules: [{ id: 'draw_001', drawNumber: 1 }],
    };

    mockPrisma.capitalStack.findUnique.mockResolvedValue(mockStack);

    const result = await capitalService.getCapitalStack('proj_001');

    expect(result).toEqual(mockStack);
    expect(mockPrisma.capitalStack.findUnique).toHaveBeenCalledWith({
      where: { projectId: 'proj_001' },
      include: {
        sources: { orderBy: { createdAt: 'asc' } },
        drawSchedules: { orderBy: { drawNumber: 'asc' } },
      },
    });
  });

  it('returns null when project has no capital stack', async () => {
    mockPrisma.capitalStack.findUnique.mockResolvedValue(null);

    const result = await capitalService.getCapitalStack('proj_unknown');
    expect(result).toBeNull();
  });
});

// ── addSource ───────────────────────────────────────────────

describe('capitalService.addSource', () => {
  it('creates a capital source with PENDING status and triggers recalculation', async () => {
    const sourceData = {
      sourceType: 'SENIOR_DEBT',
      lenderName: 'First National Bank',
      commitmentAmount: 20000000,
      interestRate: 5.5,
      term: 360,
      amortization: 360,
      ioPeriod: 24,
      origFee: 1.0,
      notes: 'Construction-to-perm loan',
    };

    mockPrisma.capitalSource.create.mockResolvedValue({
      id: 'src_001',
      capitalStackId: 'stack_001',
      ...sourceData,
      remainingAmount: 20000000,
      status: 'PENDING',
    });

    // Mock recalculateStackTotals (called inside addSource)
    mockPrisma.capitalSource.findMany.mockResolvedValue([
      { sourceType: 'SENIOR_DEBT', commitmentAmount: 20000000 },
    ]);
    mockPrisma.capitalStack.update.mockResolvedValue({});

    const result = await capitalService.addSource('stack_001', sourceData);

    expect(result.status).toBe('PENDING');
    expect(result.remainingAmount).toBe(20000000);
    expect(mockPrisma.capitalSource.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        capitalStackId: 'stack_001',
        sourceType: 'SENIOR_DEBT',
        lenderName: 'First National Bank',
        commitmentAmount: 20000000,
        remainingAmount: 20000000,
        interestRate: 5.5,
        status: 'PENDING',
      }),
    });
  });

  it('sets remainingAmount equal to commitmentAmount initially', async () => {
    mockPrisma.capitalSource.create.mockResolvedValue({
      id: 'src_002',
      commitmentAmount: 5000000,
      remainingAmount: 5000000,
      status: 'PENDING',
    });
    mockPrisma.capitalSource.findMany.mockResolvedValue([]);
    mockPrisma.capitalStack.update.mockResolvedValue({});

    const result = await capitalService.addSource('stack_001', {
      sourceType: 'COMMON_EQUITY',
      lenderName: 'LP Fund',
      commitmentAmount: 5000000,
    });

    expect(result.remainingAmount).toBe(5000000);
  });
});

// ── recalculateStackTotals ──────────────────────────────────

describe('capitalService.recalculateStackTotals', () => {
  it('correctly aggregates sources by type', async () => {
    mockPrisma.capitalSource.findMany.mockResolvedValue([
      { sourceType: 'SENIOR_DEBT', commitmentAmount: 20000000 },
      { sourceType: 'MEZZANINE', commitmentAmount: 5000000 },
      { sourceType: 'PREFERRED_EQUITY', commitmentAmount: 3000000 },
      { sourceType: 'COMMON_EQUITY', commitmentAmount: 7000000 },
      { sourceType: 'GRANT', commitmentAmount: 500000 },
      { sourceType: 'TAX_CREDIT', commitmentAmount: 1000000 },
      { sourceType: 'BRIDGE_LOAN', commitmentAmount: 2000000 },
    ]);
    mockPrisma.capitalStack.update.mockResolvedValue({});

    await capitalService.recalculateStackTotals('stack_001');

    expect(mockPrisma.capitalStack.update).toHaveBeenCalledWith({
      where: { id: 'stack_001' },
      data: {
        totalCapital: 38500000,
        seniorDebt: 20000000,
        mezzanineDebt: 5000000,
        preferredEquity: 3000000,
        commonEquity: 7000000,
        grants: 1500000, // GRANT + TAX_CREDIT
        otherSources: 2000000,
      },
    });
  });

  it('handles empty sources gracefully', async () => {
    mockPrisma.capitalSource.findMany.mockResolvedValue([]);
    mockPrisma.capitalStack.update.mockResolvedValue({});

    await capitalService.recalculateStackTotals('stack_002');

    expect(mockPrisma.capitalStack.update).toHaveBeenCalledWith({
      where: { id: 'stack_002' },
      data: {
        totalCapital: 0,
        seniorDebt: 0,
        mezzanineDebt: 0,
        preferredEquity: 0,
        commonEquity: 0,
        grants: 0,
        otherSources: 0,
      },
    });
  });
});

// ── finalizeCapitalStack ────────────────────────────────────

describe('capitalService.finalizeCapitalStack', () => {
  it('finalizes a capital stack and calculates leverage ratios', async () => {
    mockPrisma.capitalStack.findUniqueOrThrow.mockResolvedValue({
      id: 'stack_300',
      seniorDebt: 20000000,
      mezzanineDebt: 5000000,
      preferredEquity: 3000000,
      commonEquity: 7000000,
      totalCapital: 35000000,
      sources: [],
    });
    mockPrisma.capitalStack.update.mockResolvedValue({
      id: 'stack_300',
      isFinalized: true,
    });

    const result = await capitalService.finalizeCapitalStack('stack_300', 'user_001');

    // totalDebt = 20M + 5M = 25M, LTV = 25M / 35M
    expect(mockPrisma.capitalStack.update).toHaveBeenCalledWith({
      where: { id: 'stack_300' },
      data: expect.objectContaining({
        isFinalized: true,
        finalizedBy: 'user_001',
        finalizedAt: expect.any(Date),
        loanToValue: 25000000 / 35000000,
        loanToCost: 25000000 / 35000000,
      }),
    });
  });

  it('handles zero total capital without division by zero', async () => {
    mockPrisma.capitalStack.findUniqueOrThrow.mockResolvedValue({
      id: 'stack_301',
      seniorDebt: 0,
      mezzanineDebt: 0,
      preferredEquity: 0,
      commonEquity: 0,
      totalCapital: 0,
      sources: [],
    });
    mockPrisma.capitalStack.update.mockResolvedValue({ id: 'stack_301' });

    await capitalService.finalizeCapitalStack('stack_301', 'user_001');

    expect(mockPrisma.capitalStack.update).toHaveBeenCalledWith({
      where: { id: 'stack_301' },
      data: expect.objectContaining({
        loanToValue: null,
        loanToCost: null,
      }),
    });
  });
});

// ── createDraw ──────────────────────────────────────────────

describe('capitalService.createDraw', () => {
  it('creates a draw schedule with DRAFT status', async () => {
    const drawData = {
      drawNumber: 1,
      requestedAmount: 3000000,
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      lineItems: [
        { category: 'Foundation', amount: 1500000 },
        { category: 'Structural Steel', amount: 1500000 },
      ],
      notes: 'Initial draw for site work',
    };

    mockPrisma.drawSchedule.create.mockResolvedValue({
      id: 'draw_001',
      capitalStackId: 'stack_001',
      ...drawData,
      status: 'DRAFT',
    });

    const result = await capitalService.createDraw('stack_001', drawData);

    expect(result.status).toBe('DRAFT');
    expect(mockPrisma.drawSchedule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        capitalStackId: 'stack_001',
        drawNumber: 1,
        requestedAmount: 3000000,
        status: 'DRAFT',
      }),
    });
  });
});

// ── submitDraw ──────────────────────────────────────────────

describe('capitalService.submitDraw', () => {
  it('transitions draw from DRAFT to SUBMITTED with timestamp', async () => {
    mockPrisma.drawSchedule.update.mockResolvedValue({
      id: 'draw_100',
      status: 'SUBMITTED',
      submittedAt: expect.any(Date),
    });

    const result = await capitalService.submitDraw('draw_100');

    expect(result.status).toBe('SUBMITTED');
    expect(mockPrisma.drawSchedule.update).toHaveBeenCalledWith({
      where: { id: 'draw_100' },
      data: {
        status: 'SUBMITTED',
        submittedAt: expect.any(Date),
      },
    });
  });
});

// ── approveDraw ─────────────────────────────────────────────

describe('capitalService.approveDraw', () => {
  it('approves a draw with retainage and calculates net disbursement', async () => {
    mockPrisma.drawSchedule.update.mockResolvedValue({
      id: 'draw_200',
      status: 'APPROVED',
      approvedAmount: 2800000,
      retainage: 280000,
      netDisbursement: 2520000,
    });

    const result = await capitalService.approveDraw(
      'draw_200',
      'user_001',
      2800000,
      280000,
    );

    expect(result.netDisbursement).toBe(2520000);
    expect(mockPrisma.drawSchedule.update).toHaveBeenCalledWith({
      where: { id: 'draw_200' },
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedAmount: 2800000,
        retainage: 280000,
        netDisbursement: 2520000, // 2800000 - 280000
        approvedBy: 'user_001',
        reviewedBy: 'user_001',
        approvedAt: expect.any(Date),
        reviewedAt: expect.any(Date),
      }),
    });
  });

  it('defaults retainage to 0 when not specified', async () => {
    mockPrisma.drawSchedule.update.mockResolvedValue({
      id: 'draw_201',
      status: 'APPROVED',
      approvedAmount: 1000000,
      retainage: 0,
      netDisbursement: 1000000,
    });

    const result = await capitalService.approveDraw('draw_201', 'user_002', 1000000);

    expect(result.netDisbursement).toBe(1000000);
    expect(mockPrisma.drawSchedule.update).toHaveBeenCalledWith({
      where: { id: 'draw_201' },
      data: expect.objectContaining({
        retainage: 0,
        netDisbursement: 1000000,
      }),
    });
  });
});

// ── rejectDraw ──────────────────────────────────────────────

describe('capitalService.rejectDraw', () => {
  it('rejects a draw with reason and reviewer info', async () => {
    mockPrisma.drawSchedule.update.mockResolvedValue({
      id: 'draw_300',
      status: 'REJECTED',
      rejectionReason: 'Incomplete documentation',
    });

    const result = await capitalService.rejectDraw(
      'draw_300',
      'user_001',
      'Incomplete documentation',
    );

    expect(result.status).toBe('REJECTED');
    expect(mockPrisma.drawSchedule.update).toHaveBeenCalledWith({
      where: { id: 'draw_300' },
      data: expect.objectContaining({
        status: 'REJECTED',
        reviewedBy: 'user_001',
        reviewedAt: expect.any(Date),
        rejectionReason: 'Incomplete documentation',
      }),
    });
  });
});

// ── listDraws ───────────────────────────────────────────────

describe('capitalService.listDraws', () => {
  it('lists draws ordered by draw number ascending', async () => {
    const mockDraws = [
      { id: 'draw_1', drawNumber: 1 },
      { id: 'draw_2', drawNumber: 2 },
      { id: 'draw_3', drawNumber: 3 },
    ];

    mockPrisma.drawSchedule.findMany.mockResolvedValue(mockDraws);

    const result = await capitalService.listDraws('stack_001');

    expect(result).toEqual(mockDraws);
    expect(mockPrisma.drawSchedule.findMany).toHaveBeenCalledWith({
      where: { capitalStackId: 'stack_001' },
      orderBy: { drawNumber: 'asc' },
    });
  });
});

// ── createInvestorReport ────────────────────────────────────

describe('capitalService.createInvestorReport', () => {
  it('creates a DRAFT investor report with budget variance', async () => {
    const reportData = {
      projectId: 'proj_001',
      orgId: 'org_001',
      reportType: 'MONTHLY',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      title: 'January 2026 Investor Update',
      totalInvested: 10000000,
      totalSpent: 4500000,
      budgetRemaining: 5500000,
      overallCompletion: 35,
      narrative: 'Project is on schedule and under budget.',
      highlights: [{ text: 'Foundation complete' }],
      risks: [{ text: 'Material price volatility' }],
      nextSteps: [{ text: 'Begin structural steel' }],
    };

    mockPrisma.investorReport.create.mockResolvedValue({
      id: 'report_001',
      ...reportData,
      status: 'DRAFT',
      budgetVariance: -55, // (4.5M - 10M) / 10M * 100
    });

    const result = await capitalService.createInvestorReport(reportData);

    expect(result.status).toBe('DRAFT');
    expect(mockPrisma.investorReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        reportType: 'MONTHLY',
        status: 'DRAFT',
        totalInvested: 10000000,
        totalSpent: 4500000,
        budgetVariance: expect.any(Number),
        narrative: 'Project is on schedule and under budget.',
      }),
    });
  });

  it('sets budgetVariance to null when invested/spent not provided', async () => {
    mockPrisma.investorReport.create.mockResolvedValue({
      id: 'report_002',
      status: 'DRAFT',
      budgetVariance: null,
    });

    await capitalService.createInvestorReport({
      projectId: 'proj_002',
      orgId: 'org_001',
      reportType: 'QUARTERLY',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-03-31'),
    });

    expect(mockPrisma.investorReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        budgetVariance: null,
        status: 'DRAFT',
      }),
    });
  });
});

// ── publishInvestorReport ───────────────────────────────────

describe('capitalService.publishInvestorReport', () => {
  it('publishes a report with timestamp and publisher info', async () => {
    mockPrisma.investorReport.update.mockResolvedValue({
      id: 'report_100',
      status: 'PUBLISHED',
      publishedBy: 'user_001',
    });

    const result = await capitalService.publishInvestorReport('report_100', 'user_001');

    expect(result.status).toBe('PUBLISHED');
    expect(mockPrisma.investorReport.update).toHaveBeenCalledWith({
      where: { id: 'report_100' },
      data: {
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
        publishedBy: 'user_001',
      },
    });
  });
});

// ── createEntitlement ───────────────────────────────────────

describe('capitalService.createEntitlement', () => {
  it('creates an entitlement with NOT_STARTED status', async () => {
    const entitlementData = {
      projectId: 'proj_001',
      orgId: 'org_001',
      entitlementType: 'REZONING',
      title: 'Rezone from R-1 to MU-2',
      description: 'Request to rezone parcel for mixed-use development',
      jurisdiction: 'City of Austin',
      department: 'Planning & Zoning',
      applicationFee: 5000,
      assignedTo: 'user_001',
    };

    mockPrisma.entitlement.create.mockResolvedValue({
      id: 'ent_001',
      ...entitlementData,
      status: 'NOT_STARTED',
    });

    const result = await capitalService.createEntitlement(entitlementData);

    expect(result.status).toBe('NOT_STARTED');
    expect(mockPrisma.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        entitlementType: 'REZONING',
        title: 'Rezone from R-1 to MU-2',
        status: 'NOT_STARTED',
      }),
    });
  });
});

// ── listEntitlements ────────────────────────────────────────

describe('capitalService.listEntitlements', () => {
  it('lists entitlements ordered by creation date', async () => {
    const mockEntitlements = [
      { id: 'ent_1', title: 'Rezoning', createdAt: new Date('2026-01-01') },
      { id: 'ent_2', title: 'Variance', createdAt: new Date('2026-01-15') },
    ];

    mockPrisma.entitlement.findMany.mockResolvedValue(mockEntitlements);

    const result = await capitalService.listEntitlements('proj_001');

    expect(result).toEqual(mockEntitlements);
    expect(mockPrisma.entitlement.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj_001' },
      orderBy: { createdAt: 'asc' },
    });
  });
});

// ── fundDraw ────────────────────────────────────────────────

describe('capitalService.fundDraw', () => {
  it('marks draw as FUNDED and updates capital source balances', async () => {
    mockPrisma.drawSchedule.update.mockResolvedValue({
      id: 'draw_400',
      capitalStackId: 'stack_001',
      status: 'FUNDED',
      netDisbursement: 2000000,
      approvedAmount: 2200000,
    });

    mockPrisma.capitalStack.findUniqueOrThrow.mockResolvedValue({
      id: 'stack_001',
      sources: [
        {
          id: 'src_001',
          status: 'ACTIVE',
          fundedAmount: 5000000,
          commitmentAmount: 20000000,
        },
      ],
    });

    mockPrisma.capitalSource.update.mockResolvedValue({});

    const result = await capitalService.fundDraw('draw_400');

    expect(result.status).toBe('FUNDED');
    expect(mockPrisma.drawSchedule.update).toHaveBeenCalledWith({
      where: { id: 'draw_400' },
      data: { status: 'FUNDED', fundedAt: expect.any(Date) },
    });

    // Source balance updated: funded = 5M + 2M = 7M, remaining = 20M - 7M = 13M
    expect(mockPrisma.capitalSource.update).toHaveBeenCalledWith({
      where: { id: 'src_001' },
      data: {
        fundedAmount: 7000000,
        remainingAmount: 13000000,
      },
    });
  });

  it('handles case with no active sources gracefully', async () => {
    mockPrisma.drawSchedule.update.mockResolvedValue({
      id: 'draw_401',
      capitalStackId: 'stack_002',
      status: 'FUNDED',
      netDisbursement: 500000,
    });

    mockPrisma.capitalStack.findUniqueOrThrow.mockResolvedValue({
      id: 'stack_002',
      sources: [],
    });

    const result = await capitalService.fundDraw('draw_401');

    expect(result.status).toBe('FUNDED');
    expect(mockPrisma.capitalSource.update).not.toHaveBeenCalled();
  });
});
