/**
 * Pay Service Integration Tests
 * Tests milestone payments, escrow management, draw disbursement,
 * payment processing, refunds, and reconciliation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PrismaClient ────────────────────────────────────────

const mockPrisma = {
  contractAgreement: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  milestone: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  escrowAgreement: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  escrowTransaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  escrowHold: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  drawRequest: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  payment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  invoice: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  lienWaiver: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

// Import after mock
import { payService } from '../pay.service';

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// MILESTONE PAYMENTS
// =====================================================================

describe('payService.createMilestoneSchedule', () => {
  it('creates milestone payment schedule for a valid contract', async () => {
    mockPrisma.contractAgreement.findFirst.mockResolvedValue({
      id: 'contract_001',
      projectId: 'proj_001',
    });

    const milestoneResults = [
      { id: 'ms_001', name: 'Foundation Complete', amount: 100000, status: 'PENDING' },
      { id: 'ms_002', name: 'Framing Complete', amount: 150000, status: 'PENDING' },
      { id: 'ms_003', name: 'Rough-in Complete', amount: 75000, status: 'PENDING' },
    ];

    mockPrisma.$transaction.mockResolvedValue(milestoneResults);

    const result = await payService.createMilestoneSchedule('proj_001', {
      contractId: 'contract_001',
      milestones: [
        { name: 'Foundation Complete', amount: 100000 },
        { name: 'Framing Complete', amount: 150000 },
        { name: 'Rough-in Complete', amount: 75000 },
      ],
    });

    expect(result.milestones).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(mockPrisma.contractAgreement.findFirst).toHaveBeenCalledWith({
      where: { id: 'contract_001', projectId: 'proj_001' },
    });
  });

  it('throws when contract not found for project', async () => {
    mockPrisma.contractAgreement.findFirst.mockResolvedValue(null);

    await expect(
      payService.createMilestoneSchedule('proj_001', {
        contractId: 'nonexistent',
        milestones: [{ name: 'Test', amount: 1000 }],
      }),
    ).rejects.toThrow('Contract nonexistent not found for project proj_001');

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('payService.updateMilestoneStatus', () => {
  it('sets approvedAt and approvedBy when status is APPROVED', async () => {
    mockPrisma.milestone.update.mockResolvedValue({
      id: 'ms_100',
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: 'user_001',
    });

    const result = await payService.updateMilestoneStatus('ms_100', 'APPROVED', {
      approvedBy: 'user_001',
    });

    expect(result.status).toBe('APPROVED');
    expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
      where: { id: 'ms_100' },
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedAt: expect.any(Date),
        approvedBy: 'user_001',
      }),
      include: { contract: true, evidence: true },
    });
  });

  it('sets paidAt when status is PAID', async () => {
    mockPrisma.milestone.update.mockResolvedValue({
      id: 'ms_101',
      status: 'PAID',
      paidAt: new Date(),
    });

    await payService.updateMilestoneStatus('ms_101', 'PAID');

    expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
      where: { id: 'ms_101' },
      data: expect.objectContaining({
        status: 'PAID',
        paidAt: expect.any(Date),
      }),
      include: { contract: true, evidence: true },
    });
  });
});

describe('payService.calculatePaymentBreakdown', () => {
  it('calculates correct breakdown with default 10% holdback', () => {
    const result = payService.calculatePaymentBreakdown(100000);

    // holdback = 10% of 100K = 10K
    // platformFee = 3% of 100K = 3K
    // release = 100K - 10K = 90K
    // contractorPayout = 90K - 3K = 87K
    expect(result.totalAmount).toBe(100000);
    expect(result.holdbackAmount).toBe(10000);
    expect(result.releaseAmount).toBe(90000);
    expect(result.platformFee).toBe(3000);
    expect(result.contractorPayout).toBe(87000);
  });

  it('calculates with custom holdback percentage', () => {
    const result = payService.calculatePaymentBreakdown(50000, 5);

    expect(result.holdbackAmount).toBe(2500);
    expect(result.releaseAmount).toBe(47500);
    expect(result.platformFee).toBe(1500);
    expect(result.contractorPayout).toBe(46000);
  });

  it('handles zero holdback', () => {
    const result = payService.calculatePaymentBreakdown(100000, 0);

    expect(result.holdbackAmount).toBe(0);
    expect(result.releaseAmount).toBe(100000);
    expect(result.contractorPayout).toBe(97000);
  });
});

// =====================================================================
// ESCROW MANAGEMENT
// =====================================================================

describe('payService.createEscrowAgreement', () => {
  it('creates an escrow agreement with PENDING_DEPOSIT status', async () => {
    mockPrisma.contractAgreement.findFirst.mockResolvedValue({
      id: 'contract_001',
      projectId: 'proj_001',
    });
    mockPrisma.escrowAgreement.findUnique.mockResolvedValue(null); // no existing
    mockPrisma.escrowAgreement.findFirst.mockResolvedValue(null); // for account number gen
    mockPrisma.escrowAgreement.create.mockResolvedValue({
      id: 'escrow_001',
      projectId: 'proj_001',
      contractId: 'contract_001',
      status: 'PENDING_DEPOSIT',
      totalContractAmount: 500000,
      holdbackPercentage: 10,
      initialDepositAmount: 50000,
      currentBalance: 0,
      availableBalance: 0,
      heldBalance: 0,
      transactions: [],
      holds: [],
    });

    const result = await payService.createEscrowAgreement('proj_001', {
      contractId: 'contract_001',
      totalContractAmount: 500000,
    });

    expect(result.status).toBe('PENDING_DEPOSIT');
    expect(result.totalContractAmount).toBe(500000);
    expect(mockPrisma.escrowAgreement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractId: 'contract_001',
        projectId: 'proj_001',
        totalContractAmount: 500000,
        holdbackPercentage: 10,
        initialDepositAmount: 50000, // 10% of 500K
        currentBalance: 0,
        availableBalance: 0,
        heldBalance: 0,
        currency: 'USD',
        status: 'PENDING_DEPOSIT',
      }),
      include: { transactions: true, holds: true },
    });
  });

  it('throws when contract not found', async () => {
    mockPrisma.contractAgreement.findFirst.mockResolvedValue(null);

    await expect(
      payService.createEscrowAgreement('proj_001', {
        contractId: 'bad_contract',
        totalContractAmount: 100000,
      }),
    ).rejects.toThrow('Contract bad_contract not found for project proj_001');
  });

  it('throws when escrow already exists for contract', async () => {
    mockPrisma.contractAgreement.findFirst.mockResolvedValue({
      id: 'contract_002',
    });
    mockPrisma.escrowAgreement.findUnique.mockResolvedValue({
      id: 'existing_escrow',
    });

    await expect(
      payService.createEscrowAgreement('proj_001', {
        contractId: 'contract_002',
        totalContractAmount: 100000,
      }),
    ).rejects.toThrow('Escrow agreement already exists for contract contract_002');
  });
});

describe('payService.recordEscrowDeposit', () => {
  it('records a deposit and transitions escrow to ACTIVE on first deposit', async () => {
    mockPrisma.escrowAgreement.findFirstOrThrow.mockResolvedValue({
      id: 'escrow_100',
      currentBalance: 0,
      availableBalance: 0,
      status: 'PENDING_DEPOSIT',
      activatedAt: null,
    });

    const mockTx = {
      escrowTransaction: { create: vi.fn().mockResolvedValue({ id: 'tx_001', type: 'DEPOSIT' }) },
      escrowAgreement: { update: vi.fn().mockResolvedValue({}) },
    };

    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockTx));

    const result = await payService.recordEscrowDeposit('proj_001', {
      amount: 50000,
      reference: 'wire-12345',
      initiatedBy: 'user_001',
    });

    expect(result.type).toBe('DEPOSIT');

    // Transaction created
    expect(mockTx.escrowTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        escrowId: 'escrow_100',
        type: 'DEPOSIT',
        amount: 50000,
        balanceBefore: 0,
        balanceAfter: 50000,
        status: 'COMPLETED',
      }),
    });

    // Escrow balance and status updated
    expect(mockTx.escrowAgreement.update).toHaveBeenCalledWith({
      where: { id: 'escrow_100' },
      data: expect.objectContaining({
        currentBalance: 50000,
        availableBalance: 50000,
        status: 'ACTIVE',
        activatedAt: expect.any(Date),
      }),
    });
  });

  it('adds to existing balance without changing status on subsequent deposits', async () => {
    mockPrisma.escrowAgreement.findFirstOrThrow.mockResolvedValue({
      id: 'escrow_101',
      currentBalance: 50000,
      availableBalance: 40000,
      status: 'ACTIVE',
      activatedAt: new Date(),
    });

    const mockTx = {
      escrowTransaction: { create: vi.fn().mockResolvedValue({ id: 'tx_002' }) },
      escrowAgreement: { update: vi.fn().mockResolvedValue({}) },
    };

    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockTx));

    await payService.recordEscrowDeposit('proj_001', {
      amount: 25000,
      initiatedBy: 'user_001',
    });

    expect(mockTx.escrowAgreement.update).toHaveBeenCalledWith({
      where: { id: 'escrow_101' },
      data: expect.objectContaining({
        currentBalance: 75000,
        availableBalance: 65000,
        status: 'ACTIVE', // unchanged
      }),
    });
  });
});

// =====================================================================
// DRAW REQUESTS
// =====================================================================

describe('payService.createDrawRequest', () => {
  it('creates a draw request with auto-incremented draw number', async () => {
    mockPrisma.drawRequest.findFirst.mockResolvedValue({ drawNumber: 3 });
    mockPrisma.drawRequest.create.mockResolvedValue({
      id: 'draw_001',
      projectId: 'proj_001',
      drawNumber: 4,
      status: 'DRAFT',
      currentBilling: 250000,
    });

    const result = await payService.createDrawRequest('proj_001', {
      scheduledAmount: 1000000,
      currentBilling: 250000,
      previouslyBilled: 500000,
      description: 'Draw #4 for structural work',
      retainage: 10,
    });

    expect(result.drawNumber).toBe(4);
    expect(result.status).toBe('DRAFT');
  });

  it('uses provided draw number when specified', async () => {
    mockPrisma.drawRequest.create.mockResolvedValue({
      id: 'draw_002',
      drawNumber: 1,
      status: 'DRAFT',
    });

    await payService.createDrawRequest('proj_001', {
      drawNumber: 1,
      scheduledAmount: 500000,
      currentBilling: 100000,
    });

    expect(mockPrisma.drawRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        drawNumber: 1,
        status: 'DRAFT',
      }),
    });
  });

  it('starts numbering at 1 when no previous draws exist', async () => {
    mockPrisma.drawRequest.findFirst.mockResolvedValue(null);
    mockPrisma.drawRequest.create.mockResolvedValue({
      id: 'draw_003',
      drawNumber: 1,
    });

    await payService.createDrawRequest('proj_001', {
      scheduledAmount: 100000,
      currentBilling: 25000,
    });

    expect(mockPrisma.drawRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ drawNumber: 1 }),
    });
  });
});

describe('payService.updateDrawRequestStatus', () => {
  it('sets submittedAt when transitioning to SUBMITTED', async () => {
    mockPrisma.drawRequest.update.mockResolvedValue({
      id: 'draw_100',
      status: 'SUBMITTED',
    });

    await payService.updateDrawRequestStatus('draw_100', 'SUBMITTED');

    expect(mockPrisma.drawRequest.update).toHaveBeenCalledWith({
      where: { id: 'draw_100' },
      data: expect.objectContaining({
        status: 'SUBMITTED',
        submittedAt: expect.any(Date),
      }),
    });
  });

  it('sets approvedAt when transitioning to APPROVED', async () => {
    mockPrisma.drawRequest.update.mockResolvedValue({
      id: 'draw_101',
      status: 'APPROVED',
    });

    await payService.updateDrawRequestStatus('draw_101', 'APPROVED');

    expect(mockPrisma.drawRequest.update).toHaveBeenCalledWith({
      where: { id: 'draw_101' },
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedAt: expect.any(Date),
      }),
    });
  });

  it('sets rejectedReason when transitioning to REJECTED', async () => {
    mockPrisma.drawRequest.update.mockResolvedValue({
      id: 'draw_102',
      status: 'REJECTED',
    });

    await payService.updateDrawRequestStatus('draw_102', 'REJECTED', {
      rejectedReason: 'Missing lien waivers',
    });

    expect(mockPrisma.drawRequest.update).toHaveBeenCalledWith({
      where: { id: 'draw_102' },
      data: expect.objectContaining({
        status: 'REJECTED',
        rejectedReason: 'Missing lien waivers',
      }),
    });
  });
});

// =====================================================================
// PAYMENT PROCESSING & REFUNDS
// =====================================================================

describe('payService.createPayment', () => {
  it('creates a PENDING payment record', async () => {
    mockPrisma.payment.create.mockResolvedValue({
      id: 'pay_001',
      amount: 25000,
      status: 'PENDING',
      currency: 'usd',
    });

    const result = await payService.createPayment({
      projectId: 'proj_001',
      orgId: 'org_001',
      amount: 25000,
      description: 'Milestone payment #1',
      stripePaymentIntentId: 'pi_abc123',
    });

    expect(result.status).toBe('PENDING');
    expect(mockPrisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj_001',
        amount: 25000,
        currency: 'usd',
        status: 'PENDING',
        stripePaymentIntentId: 'pi_abc123',
      }),
    });
  });
});

describe('payService.processRefund', () => {
  it('processes a full refund when amount not specified', async () => {
    mockPrisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 'pay_100',
      amount: 50000,
      metadata: { description: 'Original payment' },
    });
    mockPrisma.payment.update.mockResolvedValue({
      id: 'pay_100',
      status: 'REFUNDED',
      refundAmount: 50000,
    });

    const result = await payService.processRefund('pay_100', {
      reason: 'Customer requested cancellation',
    });

    expect(result.status).toBe('REFUNDED');
    expect(result.refundAmount).toBe(50000);
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay_100' },
      data: expect.objectContaining({
        status: 'REFUNDED',
        refundedAt: expect.any(Date),
        refundAmount: 50000,
        metadata: expect.objectContaining({
          refundReason: 'Customer requested cancellation',
          originalAmount: 50000,
        }),
      }),
    });
  });

  it('processes a partial refund with specified amount', async () => {
    mockPrisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 'pay_101',
      amount: 75000,
      metadata: {},
    });
    mockPrisma.payment.update.mockResolvedValue({
      id: 'pay_101',
      status: 'REFUNDED',
      refundAmount: 25000,
    });

    const result = await payService.processRefund('pay_101', {
      amount: 25000,
      reason: 'Partial scope reduction',
    });

    expect(result.refundAmount).toBe(25000);
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay_101' },
      data: expect.objectContaining({
        refundAmount: 25000,
        metadata: expect.objectContaining({
          originalAmount: 75000,
        }),
      }),
    });
  });
});

// =====================================================================
// RECONCILIATION
// =====================================================================

describe('payService.reconcileEscrowBalances', () => {
  it('detects no discrepancy when balances match', async () => {
    mockPrisma.escrowAgreement.findUniqueOrThrow.mockResolvedValue({
      id: 'escrow_500',
      escrowAccountNumber: 'ESC-20260301-0001',
      currentBalance: 75000,
      availableBalance: 75000,
      heldBalance: 0,
      transactions: [
        { type: 'DEPOSIT', amount: 100000, status: 'COMPLETED' },
        { type: 'RELEASE', amount: 25000, status: 'COMPLETED' },
      ],
      holds: [],
    });

    const result = await payService.reconcileEscrowBalances('escrow_500');

    expect(result.hasDiscrepancy).toBe(false);
    expect(result.calculated.currentBalance).toBe(75000);
    expect(result.calculated.availableBalance).toBe(75000);
    expect(result.calculated.heldBalance).toBe(0);
    expect(result.breakdown.totalDeposits).toBe(100000);
    expect(result.breakdown.totalReleases).toBe(25000);
  });

  it('detects discrepancy when recorded balance differs from calculated', async () => {
    mockPrisma.escrowAgreement.findUniqueOrThrow.mockResolvedValue({
      id: 'escrow_501',
      escrowAccountNumber: 'ESC-20260301-0002',
      currentBalance: 80000, // Should be 75K
      availableBalance: 80000,
      heldBalance: 0,
      transactions: [
        { type: 'DEPOSIT', amount: 100000, status: 'COMPLETED' },
        { type: 'RELEASE', amount: 25000, status: 'COMPLETED' },
      ],
      holds: [],
    });

    const result = await payService.reconcileEscrowBalances('escrow_501');

    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancy.current).toBe(5000);
  });

  it('accounts for active holds in available balance', async () => {
    mockPrisma.escrowAgreement.findUniqueOrThrow.mockResolvedValue({
      id: 'escrow_502',
      escrowAccountNumber: 'ESC-20260301-0003',
      currentBalance: 100000,
      availableBalance: 80000,
      heldBalance: 20000,
      transactions: [
        { type: 'DEPOSIT', amount: 100000, status: 'COMPLETED' },
      ],
      holds: [
        { amount: 20000, status: 'ACTIVE' },
      ],
    });

    const result = await payService.reconcileEscrowBalances('escrow_502');

    expect(result.hasDiscrepancy).toBe(false);
    expect(result.calculated.currentBalance).toBe(100000);
    expect(result.calculated.availableBalance).toBe(80000);
    expect(result.calculated.heldBalance).toBe(20000);
  });

  it('handles fee and refund transactions correctly', async () => {
    mockPrisma.escrowAgreement.findUniqueOrThrow.mockResolvedValue({
      id: 'escrow_503',
      escrowAccountNumber: 'ESC-20260301-0004',
      currentBalance: 84000,
      availableBalance: 84000,
      heldBalance: 0,
      transactions: [
        { type: 'DEPOSIT', amount: 100000, status: 'COMPLETED' },
        { type: 'FEE', amount: 3000, status: 'COMPLETED' },
        { type: 'RELEASE', amount: 10000, status: 'COMPLETED' },
        { type: 'REFUND', amount: 3000, status: 'COMPLETED' },
        { type: 'DEPOSIT', amount: 50000, status: 'PENDING' }, // should be ignored
      ],
      holds: [],
    });

    const result = await payService.reconcileEscrowBalances('escrow_503');

    // Calculated: 100K - 10K - 3K - 3K = 84K
    expect(result.hasDiscrepancy).toBe(false);
    expect(result.calculated.currentBalance).toBe(84000);
    expect(result.breakdown.totalDeposits).toBe(100000);
    expect(result.breakdown.totalReleases).toBe(10000);
    expect(result.breakdown.totalFees).toBe(3000);
    expect(result.breakdown.totalRefunds).toBe(3000);
  });
});

// =====================================================================
// ESCROW HOLDS
// =====================================================================

describe('payService.placeEscrowHold', () => {
  it('places a hold and reduces available balance', async () => {
    mockPrisma.escrowAgreement.findFirstOrThrow.mockResolvedValue({
      id: 'escrow_600',
      currentBalance: 100000,
      availableBalance: 100000,
      heldBalance: 0,
      status: 'ACTIVE',
    });

    const mockTx = {
      escrowHold: {
        create: vi.fn().mockResolvedValue({
          id: 'hold_001',
          amount: 25000,
          reason: 'DISPUTE',
          status: 'ACTIVE',
        }),
      },
      escrowAgreement: { update: vi.fn().mockResolvedValue({}) },
    };

    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockTx));

    const result = await payService.placeEscrowHold('proj_001', {
      amount: 25000,
      reason: 'DISPUTE',
      notes: 'Quality dispute on milestone #3',
      placedBy: 'user_001',
    });

    expect(result.status).toBe('ACTIVE');
    expect(mockTx.escrowAgreement.update).toHaveBeenCalledWith({
      where: { id: 'escrow_600' },
      data: expect.objectContaining({
        availableBalance: 75000,
        heldBalance: 25000,
        status: 'FROZEN', // DISPUTE freezes the account
      }),
    });
  });

  it('throws when insufficient available balance', async () => {
    mockPrisma.escrowAgreement.findFirstOrThrow.mockResolvedValue({
      id: 'escrow_601',
      availableBalance: 5000,
    });

    await expect(
      payService.placeEscrowHold('proj_001', {
        amount: 50000,
        reason: 'MANUAL',
        placedBy: 'user_001',
      }),
    ).rejects.toThrow('Insufficient available balance');
  });
});

// =====================================================================
// LIEN WAIVERS
// =====================================================================

describe('payService.createLienWaiver', () => {
  it('creates a lien waiver with GENERATED status', async () => {
    mockPrisma.lienWaiver.create.mockResolvedValue({
      id: 'lw_001',
      projectId: 'proj_001',
      waiverType: 'CONDITIONAL',
      waiverScope: 'PARTIAL',
      status: 'GENERATED',
      waiverAmount: 50000,
    });

    const result = await payService.createLienWaiver('proj_001', {
      contractId: 'contract_001',
      milestoneId: 'ms_001',
      waiverType: 'CONDITIONAL',
      waiverScope: 'PARTIAL',
      projectName: 'Downtown Tower',
      projectAddress: '123 Main St',
      state: 'TX',
      claimantName: 'ABC Contractors',
      claimantAddress: '456 Industrial Blvd',
      ownerName: 'Property Holdings LLC',
      throughDate: '2026-03-31',
      waiverAmount: 50000,
      cumulativeAmount: 150000,
      createdBy: 'user_001',
    });

    expect(result.status).toBe('GENERATED');
    expect(result.waiverAmount).toBe(50000);
    expect(mockPrisma.lienWaiver.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractId: 'contract_001',
        projectId: 'proj_001',
        waiverType: 'CONDITIONAL',
        waiverScope: 'PARTIAL',
        status: 'GENERATED',
        waiverAmount: 50000,
        cumulativeAmount: 150000,
        throughDate: expect.any(Date),
      }),
    });
  });
});

describe('payService.updateLienWaiverStatus', () => {
  it('sets sentAt when status is SENT', async () => {
    mockPrisma.lienWaiver.update.mockResolvedValue({
      id: 'lw_100',
      status: 'SENT',
    });

    await payService.updateLienWaiverStatus('lw_100', 'SENT');

    expect(mockPrisma.lienWaiver.update).toHaveBeenCalledWith({
      where: { id: 'lw_100' },
      data: expect.objectContaining({
        status: 'SENT',
        sentAt: expect.any(Date),
      }),
    });
  });

  it('sets signedAt when status is SIGNED and includes document URL', async () => {
    mockPrisma.lienWaiver.update.mockResolvedValue({
      id: 'lw_101',
      status: 'SIGNED',
    });

    await payService.updateLienWaiverStatus('lw_101', 'SIGNED', {
      signedDocumentUrl: 'https://storage.example.com/signed-waiver.pdf',
    });

    expect(mockPrisma.lienWaiver.update).toHaveBeenCalledWith({
      where: { id: 'lw_101' },
      data: expect.objectContaining({
        status: 'SIGNED',
        signedAt: expect.any(Date),
        signedDocumentUrl: 'https://storage.example.com/signed-waiver.pdf',
      }),
    });
  });
});

// =====================================================================
// ESCROW ACCOUNT NUMBER GENERATION
// =====================================================================

describe('payService.generateEscrowAccountNumber', () => {
  it('generates the first account number for the day', async () => {
    mockPrisma.escrowAgreement.findFirst.mockResolvedValue(null);

    const result = await payService.generateEscrowAccountNumber();

    // Format: ESC-YYYYMMDD-0001
    expect(result).toMatch(/^ESC-\d{8}-0001$/);
  });

  it('increments sequence from existing account numbers', async () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `ESC-${y}${m}${d}`;

    mockPrisma.escrowAgreement.findFirst.mockResolvedValue({
      escrowAccountNumber: `${prefix}-0005`,
    });

    const result = await payService.generateEscrowAccountNumber();

    expect(result).toBe(`${prefix}-0006`);
  });
});
