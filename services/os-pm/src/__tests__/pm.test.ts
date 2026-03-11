/**
 * PM Service Integration Tests
 * Tests schedules, RFIs, submittals, change orders, inspections, and budget.
 * Focuses on the most critical 15 operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PrismaClient ────────────────────────────────────────

const mockPrisma = {
  scheduleItem: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  rFI: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  rFIResponse: {
    create: vi.fn(),
  },
  submittal: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  submittalReview: {
    create: vi.fn(),
  },
  changeOrder: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  changeOrderApproval: {
    create: vi.fn(),
  },
  changeOrderLineItem: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  inspection: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  inspectionFinding: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  budgetLine: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  budgetEntry: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  budgetSnapshot: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  budgetAlert: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

// Import after mock
import {
  scheduleService,
  rfiService,
  submittalService,
  changeOrderService,
  inspectionService,
  budgetService,
} from '../pm.service';

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// SCHEDULE
// =====================================================================

describe('scheduleService.create', () => {
  it('creates a schedule item with NOT_STARTED status and default priority', async () => {
    const data = {
      projectId: 'proj_001',
      title: 'Foundation Work',
      description: 'Pour foundation',
      startDate: '2026-03-01',
      endDate: '2026-03-15',
      duration: 14,
      trade: 'Concrete',
      assignedTo: 'user_001',
      dependencies: ['task_prev'],
      milestone: false,
      criticalPath: true,
      progress: 0,
    };

    mockPrisma.scheduleItem.create.mockResolvedValue({
      id: 'sched_001',
      ...data,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
    });

    const result = await scheduleService.create(data, 'user_creator');

    expect(result.status).toBe('NOT_STARTED');
    expect(mockPrisma.scheduleItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        title: 'Foundation Work',
        startDate: expect.any(Date),
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        criticalPath: true,
        dependencies: ['task_prev'],
        createdById: 'user_creator',
      }),
    });
  });

  it('defaults optional fields correctly', async () => {
    const data = {
      projectId: 'proj_001',
      title: 'Minimal Task',
      startDate: '2026-04-01',
    };

    mockPrisma.scheduleItem.create.mockResolvedValue({ id: 'sched_002' });

    await scheduleService.create(data, 'user_001');

    expect(mockPrisma.scheduleItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: null,
        endDate: null,
        duration: null,
        trade: null,
        assignedTo: null,
        dependencies: [],
        milestone: false,
        criticalPath: false,
        progress: 0,
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        color: null,
        metadata: {},
      }),
    });
  });
});

describe('scheduleService.updateProgress', () => {
  it('sets status to COMPLETED when progress is 100', async () => {
    mockPrisma.scheduleItem.findUnique.mockResolvedValue({ id: 'sched_100' });
    mockPrisma.scheduleItem.update.mockResolvedValue({
      id: 'sched_100',
      progress: 100,
      status: 'COMPLETED',
    });

    const result = await scheduleService.updateProgress('sched_100', 100);

    expect(result.status).toBe('COMPLETED');
    expect(mockPrisma.scheduleItem.update).toHaveBeenCalledWith({
      where: { id: 'sched_100' },
      data: { progress: 100, status: 'COMPLETED' },
    });
  });

  it('sets status to IN_PROGRESS when progress is between 1 and 99', async () => {
    mockPrisma.scheduleItem.findUnique.mockResolvedValue({ id: 'sched_101' });
    mockPrisma.scheduleItem.update.mockResolvedValue({
      id: 'sched_101',
      progress: 50,
      status: 'IN_PROGRESS',
    });

    const result = await scheduleService.updateProgress('sched_101', 50);
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('throws when schedule item not found', async () => {
    mockPrisma.scheduleItem.findUnique.mockResolvedValue(null);

    await expect(
      scheduleService.updateProgress('nonexistent', 50),
    ).rejects.toThrow('Schedule item not found');
  });
});

// =====================================================================
// RFIs
// =====================================================================

describe('rfiService.create', () => {
  it('creates an RFI with auto-incremented number and DRAFT status', async () => {
    mockPrisma.rFI.count.mockResolvedValue(5); // 5 existing RFIs

    mockPrisma.rFI.create.mockResolvedValue({
      id: 'rfi_001',
      rfiNumber: 6,
      subject: 'Foundation Detail Clarification',
      status: 'DRAFT',
      priority: 'HIGH',
    });

    const result = await rfiService.create({
      projectId: 'proj_001',
      subject: 'Foundation Detail Clarification',
      question: 'What is the rebar spacing for the grade beam?',
      priority: 'HIGH',
      createdById: 'user_001',
      assignedToId: 'user_002',
      costImpact: true,
      scheduleImpact: false,
      drawingRef: 'S-201',
      specSection: '03300',
    });

    expect(result.rfiNumber).toBe(6);
    expect(result.status).toBe('DRAFT');
    expect(mockPrisma.rFI.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        rfiNumber: 6,
        subject: 'Foundation Detail Clarification',
        status: 'DRAFT',
        priority: 'HIGH',
        costImpact: true,
        scheduleImpact: false,
        drawingRef: 'S-201',
        specSection: '03300',
      }),
      include: expect.any(Object),
    });
  });

  it('defaults priority to MEDIUM and costImpact to false', async () => {
    mockPrisma.rFI.count.mockResolvedValue(0);
    mockPrisma.rFI.create.mockResolvedValue({
      id: 'rfi_002',
      rfiNumber: 1,
      status: 'DRAFT',
      priority: 'MEDIUM',
    });

    await rfiService.create({
      projectId: 'proj_001',
      subject: 'Simple Question',
      question: 'What color paint?',
      createdById: 'user_001',
    });

    expect(mockPrisma.rFI.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priority: 'MEDIUM',
        costImpact: false,
        scheduleImpact: false,
        distributionList: [],
      }),
      include: expect.any(Object),
    });
  });
});

describe('rfiService.addResponse', () => {
  it('creates a response and auto-transitions OPEN RFI to ANSWERED', async () => {
    mockPrisma.rFI.findUnique.mockResolvedValue({
      id: 'rfi_100',
      status: 'OPEN',
    });
    mockPrisma.rFIResponse.create.mockResolvedValue({
      id: 'resp_001',
      rfiId: 'rfi_100',
      response: 'Spacing is 12" O.C.',
    });
    mockPrisma.rFI.update.mockResolvedValue({ id: 'rfi_100', status: 'ANSWERED' });

    const result = await rfiService.addResponse({
      rfiId: 'rfi_100',
      responderId: 'user_002',
      response: 'Spacing is 12" O.C.',
      isOfficial: true,
    });

    expect(result.response).toBe('Spacing is 12" O.C.');

    // Should auto-transition to ANSWERED
    expect(mockPrisma.rFI.update).toHaveBeenCalledWith({
      where: { id: 'rfi_100' },
      data: { status: 'ANSWERED' },
    });
  });

  it('does not transition when RFI is not in OPEN status', async () => {
    mockPrisma.rFI.findUnique.mockResolvedValue({
      id: 'rfi_101',
      status: 'ANSWERED',
    });
    mockPrisma.rFIResponse.create.mockResolvedValue({
      id: 'resp_002',
      response: 'Additional clarification',
    });

    await rfiService.addResponse({
      rfiId: 'rfi_101',
      responderId: 'user_003',
      response: 'Additional clarification',
    });

    // Should NOT have called update for status change
    expect(mockPrisma.rFI.update).not.toHaveBeenCalled();
  });

  it('throws when RFI not found', async () => {
    mockPrisma.rFI.findUnique.mockResolvedValue(null);

    await expect(
      rfiService.addResponse({
        rfiId: 'nonexistent',
        responderId: 'user_001',
        response: 'Test',
      }),
    ).rejects.toThrow('RFI not found');
  });
});

// =====================================================================
// SUBMITTALS
// =====================================================================

describe('submittalService.create', () => {
  it('creates a submittal with auto-incremented number', async () => {
    mockPrisma.submittal.count.mockResolvedValue(10);

    mockPrisma.submittal.create.mockResolvedValue({
      id: 'sub_001',
      submittalNumber: 11,
      title: 'Structural Steel Shop Drawings',
      status: 'DRAFT',
      type: 'SHOP_DRAWING',
    });

    const result = await submittalService.create({
      projectId: 'proj_001',
      title: 'Structural Steel Shop Drawings',
      type: 'SHOP_DRAWING',
      specSection: '05100',
      createdById: 'user_001',
      assignedToId: 'user_002',
      dueDate: '2026-04-01',
    });

    expect(result.submittalNumber).toBe(11);
    expect(result.status).toBe('DRAFT');
  });

  it('defaults type to PRODUCT_DATA', async () => {
    mockPrisma.submittal.count.mockResolvedValue(0);
    mockPrisma.submittal.create.mockResolvedValue({
      id: 'sub_002',
      type: 'PRODUCT_DATA',
      status: 'DRAFT',
    });

    await submittalService.create({
      projectId: 'proj_001',
      title: 'Light Fixture Catalog',
      createdById: 'user_001',
    });

    expect(mockPrisma.submittal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PRODUCT_DATA',
        copies: 1,
        status: 'DRAFT',
      }),
      include: expect.any(Object),
    });
  });
});

describe('submittalService.addReview', () => {
  it('creates a review and updates submittal status to APPROVED', async () => {
    mockPrisma.submittal.findUnique.mockResolvedValue({ id: 'sub_100' });
    mockPrisma.submittalReview.create.mockResolvedValue({
      id: 'rev_001',
      submittalId: 'sub_100',
      status: 'APPROVED',
    });
    mockPrisma.submittal.update.mockResolvedValue({
      id: 'sub_100',
      status: 'APPROVED',
    });

    const result = await submittalService.addReview({
      submittalId: 'sub_100',
      reviewerId: 'user_002',
      status: 'APPROVED',
      comments: 'Looks good, approved.',
    });

    expect(result.status).toBe('APPROVED');

    // Submittal status updated, with approvedDate set
    expect(mockPrisma.submittal.update).toHaveBeenCalledWith({
      where: { id: 'sub_100' },
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedDate: expect.any(Date),
      }),
    });
  });

  it('does not set approvedDate for REJECTED reviews', async () => {
    mockPrisma.submittal.findUnique.mockResolvedValue({ id: 'sub_101' });
    mockPrisma.submittalReview.create.mockResolvedValue({
      id: 'rev_002',
      status: 'REJECTED',
    });
    mockPrisma.submittal.update.mockResolvedValue({});

    await submittalService.addReview({
      submittalId: 'sub_101',
      reviewerId: 'user_002',
      status: 'REJECTED',
      comments: 'Does not meet specification.',
    });

    expect(mockPrisma.submittal.update).toHaveBeenCalledWith({
      where: { id: 'sub_101' },
      data: { status: 'REJECTED' },
    });
  });

  it('throws when submittal not found', async () => {
    mockPrisma.submittal.findUnique.mockResolvedValue(null);

    await expect(
      submittalService.addReview({
        submittalId: 'nonexistent',
        reviewerId: 'user_001',
        status: 'APPROVED',
      }),
    ).rejects.toThrow('Submittal not found');
  });
});

// =====================================================================
// CHANGE ORDERS
// =====================================================================

describe('changeOrderService.create', () => {
  it('creates a change order with auto-generated number and line items', async () => {
    mockPrisma.changeOrder.count.mockResolvedValue(2);

    mockPrisma.changeOrder.create.mockResolvedValue({
      id: 'co_001',
      changeOrderNumber: 'CO-003',
      title: 'Add Elevator Shaft',
      status: 'DRAFT',
      lineItems: [
        { description: 'Shaft excavation', totalCost: 50000 },
        { description: 'Steel reinforcement', totalCost: 75000 },
      ],
    });

    const result = await changeOrderService.create({
      projectId: 'proj_001',
      title: 'Add Elevator Shaft',
      description: 'Additional elevator required by code',
      reason: 'Code compliance',
      totalCost: 125000,
      scheduleDaysImpact: 14,
      lineItems: [
        { description: 'Shaft excavation', totalCost: 50000 },
        { description: 'Steel reinforcement', totalCost: 75000 },
      ],
    });

    expect(result.changeOrderNumber).toBe('CO-003');
    expect(result.status).toBe('DRAFT');
    expect(result.lineItems).toHaveLength(2);
  });
});

describe('changeOrderService.approve', () => {
  it('creates an approval record and updates the change order', async () => {
    mockPrisma.changeOrderApproval.create.mockResolvedValue({
      id: 'approval_001',
      status: 'APPROVED',
    });

    mockPrisma.changeOrder.update.mockResolvedValue({
      id: 'co_100',
      status: 'APPROVED',
      approvedBy: 'user_001',
    });

    const result = await changeOrderService.approve('co_100', {
      approverId: 'user_001',
      role: 'Owner',
      comments: 'Approved. Proceed.',
    });

    expect(result.status).toBe('APPROVED');

    // Approval record created
    expect(mockPrisma.changeOrderApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        changeOrderId: 'co_100',
        approverId: 'user_001',
        role: 'Owner',
        status: 'APPROVED',
        comments: 'Approved. Proceed.',
        approvedAt: expect.any(Date),
        decidedAt: expect.any(Date),
      }),
    });

    // Change order updated
    expect(mockPrisma.changeOrder.update).toHaveBeenCalledWith({
      where: { id: 'co_100' },
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedBy: 'user_001',
        approvedAt: expect.any(Date),
      }),
      include: { approvals: true, lineItems: true },
    });
  });
});

describe('changeOrderService.reject', () => {
  it('rejects a change order with reason', async () => {
    mockPrisma.changeOrderApproval.create.mockResolvedValue({
      id: 'approval_002',
      status: 'REJECTED',
    });
    mockPrisma.changeOrder.update.mockResolvedValue({
      id: 'co_101',
      status: 'REJECTED',
    });

    const result = await changeOrderService.reject('co_101', {
      approverId: 'user_002',
      role: 'GC',
      reason: 'Exceeds budget threshold',
    });

    expect(result.status).toBe('REJECTED');
    expect(mockPrisma.changeOrder.update).toHaveBeenCalledWith({
      where: { id: 'co_101' },
      data: expect.objectContaining({
        status: 'REJECTED',
        rejectionReason: 'Exceeds budget threshold',
      }),
      include: { approvals: true, lineItems: true },
    });
  });
});

// =====================================================================
// INSPECTIONS
// =====================================================================

describe('inspectionService.schedule', () => {
  it('schedules an inspection with SCHEDULED status', async () => {
    mockPrisma.inspection.create.mockResolvedValue({
      id: 'insp_001',
      type: 'STRUCTURAL',
      title: 'Foundation Inspection',
      status: 'SCHEDULED',
      findings: [],
    });

    const result = await inspectionService.schedule(
      {
        projectId: 'proj_001',
        type: 'structural',
        title: 'Foundation Inspection',
        scheduledDate: '2026-03-15',
        scheduledTime: '10:00 AM',
        inspectorId: 'user_003',
        inspectorName: 'John Smith',
        location: 'Building A, Grid B-3',
        checklistItems: [{ item: 'Check rebar spacing', required: true }],
      },
      'user_001',
    );

    expect(result.status).toBe('SCHEDULED');
    expect(mockPrisma.inspection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        type: 'STRUCTURAL',
        title: 'Foundation Inspection',
        status: 'SCHEDULED',
        scheduledDate: expect.any(Date),
        createdById: 'user_001',
      }),
      include: { findings: true },
    });
  });
});

describe('inspectionService.conduct', () => {
  it('completes an inspection with result and status COMPLETED', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({
      id: 'insp_100',
      status: 'SCHEDULED',
    });
    mockPrisma.inspection.update.mockResolvedValue({
      id: 'insp_100',
      status: 'COMPLETED',
      result: 'PASS',
      findings: [],
    });

    const result = await inspectionService.conduct(
      'insp_100',
      {
        result: 'pass',
        notes: 'All items passed inspection',
        checklistResults: [{ item: 'Rebar', result: 'PASS' }],
      },
      'user_003',
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.result).toBe('PASS');
    expect(mockPrisma.inspection.update).toHaveBeenCalledWith({
      where: { id: 'insp_100' },
      data: expect.objectContaining({
        result: 'PASS',
        status: 'COMPLETED',
        conductedAt: expect.any(Date),
        conductedBy: 'user_003',
      }),
      include: { findings: true },
    });
  });

  it('throws when inspection already completed', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({
      id: 'insp_101',
      status: 'COMPLETED',
    });

    await expect(
      inspectionService.conduct(
        'insp_101',
        { result: 'FAIL' },
        'user_003',
      ),
    ).rejects.toThrow('Inspection already conducted');
  });

  it('throws when inspection not found', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue(null);

    await expect(
      inspectionService.conduct('nonexistent', { result: 'PASS' }, 'user_001'),
    ).rejects.toThrow('Inspection not found');
  });
});

describe('inspectionService.addFinding', () => {
  it('creates a finding with OPEN status', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({ id: 'insp_200' });
    mockPrisma.inspectionFinding.create.mockResolvedValue({
      id: 'finding_001',
      type: 'DEFICIENCY',
      severity: 'HIGH',
      title: 'Missing Fire Stop',
      status: 'OPEN',
    });

    const result = await inspectionService.addFinding(
      'insp_200',
      {
        type: 'deficiency',
        severity: 'high',
        title: 'Missing Fire Stop',
        description: 'Firestop not installed at floor penetration',
        location: 'Floor 3, Column C-2',
        correctionRequired: true,
        correctionDeadline: '2026-04-01',
        photoUrls: ['https://storage.example.com/photo1.jpg'],
      },
      'user_003',
    );

    expect(result.status).toBe('OPEN');
    expect(mockPrisma.inspectionFinding.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        inspectionId: 'insp_200',
        type: 'DEFICIENCY',
        severity: 'HIGH',
        title: 'Missing Fire Stop',
        correctionRequired: true,
        status: 'OPEN',
        createdById: 'user_003',
      }),
    });
  });
});

// =====================================================================
// BUDGET
// =====================================================================

describe('budgetService.getOverview', () => {
  it('computes budget totals from all budget lines', async () => {
    mockPrisma.budgetLine.findMany.mockResolvedValue([
      { budgetAmount: '500000', actualAmount: '300000', committedAmount: '100000' },
      { budgetAmount: '200000', actualAmount: '50000', committedAmount: '80000' },
      { budgetAmount: '300000', actualAmount: '250000', committedAmount: '20000' },
    ]);

    const result = await budgetService.getOverview('proj_001');

    expect(result.projectId).toBe('proj_001');
    expect(result.totalBudget).toBe(1000000);
    expect(result.totalActual).toBe(600000);
    expect(result.totalCommitted).toBe(200000);
    expect(result.totalVariance).toBe(400000);
    expect(result.variancePercent).toBe(40); // 400K / 1M * 100
    expect(result.lineCount).toBe(3);
  });

  it('handles zero budget without division by zero', async () => {
    mockPrisma.budgetLine.findMany.mockResolvedValue([]);

    const result = await budgetService.getOverview('proj_empty');

    expect(result.totalBudget).toBe(0);
    expect(result.totalActual).toBe(0);
    expect(result.variancePercent).toBe(0);
    expect(result.lineCount).toBe(0);
  });
});

describe('budgetService.createEntry', () => {
  it('creates a budget entry and auto-increments the budget line actual amount', async () => {
    mockPrisma.budgetEntry.create.mockResolvedValue({
      id: 'entry_001',
      budgetLineId: 'line_001',
      type: 'ACTUAL',
      amount: 50000,
    });

    mockPrisma.budgetLine.findUnique.mockResolvedValue({
      id: 'line_001',
      actualAmount: 100000,
    });
    mockPrisma.budgetLine.update.mockResolvedValue({});

    const result = await budgetService.createEntry(
      {
        budgetLineId: 'line_001',
        type: 'actual',
        amount: 50000,
        description: 'Invoice #1234',
        vendor: 'Concrete Co.',
        invoiceNumber: 'INV-1234',
        date: '2026-03-01',
      },
      'user_001',
    );

    expect(result.amount).toBe(50000);

    // Auto-increment actualAmount
    expect(mockPrisma.budgetLine.update).toHaveBeenCalledWith({
      where: { id: 'line_001' },
      data: { actualAmount: { increment: 50000 } },
    });
  });

  it('increments committedAmount for COMMITTED entry type', async () => {
    mockPrisma.budgetEntry.create.mockResolvedValue({
      id: 'entry_002',
      type: 'COMMITTED',
      amount: 75000,
    });

    mockPrisma.budgetLine.findUnique.mockResolvedValue({ id: 'line_002' });
    mockPrisma.budgetLine.update.mockResolvedValue({});

    await budgetService.createEntry(
      {
        budgetLineId: 'line_002',
        type: 'committed',
        amount: 75000,
      },
      'user_001',
    );

    expect(mockPrisma.budgetLine.update).toHaveBeenCalledWith({
      where: { id: 'line_002' },
      data: { committedAmount: { increment: 75000 } },
    });
  });
});

describe('budgetService.getVarianceReport', () => {
  it('generates a variance report with over/under budget status', async () => {
    mockPrisma.budgetLine.findMany.mockResolvedValue([
      { id: 'bl1', name: 'Concrete', code: '03', category: 'Hard', budgetAmount: '100000', actualAmount: '110000' },
      { id: 'bl2', name: 'Steel', code: '05', category: 'Hard', budgetAmount: '200000', actualAmount: '200000' },
      { id: 'bl3', name: 'Electrical', code: '16', category: 'Hard', budgetAmount: '150000', actualAmount: '100000' },
    ]);

    const result = await budgetService.getVarianceReport('proj_001');

    expect(result.lines).toHaveLength(3);

    // Concrete: 100K - 110K = -10K (over budget)
    expect(result.lines[0].variance).toBe(-10000);
    expect(result.lines[0].status).toBe('OVER_BUDGET');

    // Steel: 200K - 200K = 0 (on budget)
    expect(result.lines[1].variance).toBe(0);
    expect(result.lines[1].status).toBe('ON_BUDGET');

    // Electrical: 150K - 100K = 50K (under budget)
    expect(result.lines[2].variance).toBe(50000);
    expect(result.lines[2].status).toBe('UNDER_BUDGET');
  });
});

describe('budgetService.takeSnapshot', () => {
  it('creates a budget snapshot with current totals', async () => {
    // Mock getOverview data
    mockPrisma.budgetLine.findMany
      .mockResolvedValueOnce([
        { budgetAmount: '500000', actualAmount: '300000', committedAmount: '100000' },
      ])
      .mockResolvedValueOnce([
        { id: 'bl1', budgetAmount: '500000', actualAmount: '300000', committedAmount: '100000' },
      ]);

    mockPrisma.budgetSnapshot.create.mockResolvedValue({
      id: 'snap_001',
      projectId: 'proj_001',
      label: 'March Snapshot',
      totalBudget: 500000,
      totalActual: 300000,
    });

    const result = await budgetService.takeSnapshot('proj_001', 'user_001', 'March Snapshot');

    expect(result.label).toBe('March Snapshot');
    expect(mockPrisma.budgetSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        label: 'March Snapshot',
        totalBudget: 500000,
        totalActual: 300000,
        totalCommitted: 100000,
        totalVariance: 200000,
        createdById: 'user_001',
      }),
    });
  });
});
