/**
 * Pay Service — Comprehensive payment operations for OS-Pay
 *
 * Consolidates: Milestone Payments, Escrow Management, Draw Disbursement,
 * Payment Processing, Invoice Management, Financial Reporting,
 * Reconciliation, and Lien Waiver tracking.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Constants ──────────────────────────────────────────────────
const DEFAULT_HOLDBACK_PERCENTAGE = 10;
const PLATFORM_FEE_PERCENTAGE = 0.03; // 3%

// ── Types ──────────────────────────────────────────────────────

export type MilestonePaymentStatus =
  | 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED'
  | 'REJECTED' | 'DISPUTED' | 'PAID';

export type EscrowStatusType =
  | 'PENDING_DEPOSIT' | 'ACTIVE' | 'FROZEN' | 'CLOSED';

export type DrawRequestStatusType =
  | 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'FUNDED' | 'REJECTED';

export type LienWaiverTypeValue = 'CONDITIONAL' | 'UNCONDITIONAL';
export type LienWaiverScopeValue = 'PARTIAL' | 'FINAL';
export type LienWaiverStatusValue = 'GENERATED' | 'SENT' | 'SIGNED' | 'RECORDED' | 'EXPIRED';

// ── Service ────────────────────────────────────────────────────

export const payService = {

  // ============================================================================
  // MILESTONE PAYMENTS
  // ============================================================================

  /**
   * Create a milestone payment schedule for a project contract
   */
  async createMilestoneSchedule(projectId: string, data: {
    contractId: string;
    milestones: Array<{
      name: string;
      description?: string;
      amount: number;
      dependsOnId?: string;
    }>;
  }) {
    // Verify project and contract exist
    const contract = await prisma.contractAgreement.findFirst({
      where: { id: data.contractId, projectId },
    });
    if (!contract) {
      throw new Error(`Contract ${data.contractId} not found for project ${projectId}`);
    }

    const created = await prisma.$transaction(
      data.milestones.map((m) =>
        prisma.milestone.create({
          data: {
            contractId: data.contractId,
            name: m.name,
            description: m.description,
            amount: m.amount,
            dependsOnId: m.dependsOnId,
            status: 'PENDING',
          },
        }),
      ),
    );

    return { milestones: created, total: created.length };
  },

  /**
   * List milestones for a project contract
   */
  async listMilestones(projectId: string, options?: {
    contractId?: string;
    status?: MilestonePaymentStatus;
    limit?: number;
    offset?: number;
  }) {
    const contracts = await prisma.contractAgreement.findMany({
      where: { projectId },
      select: { id: true },
    });
    const contractIds = contracts.map((c) => c.id);

    const where: any = { contractId: { in: contractIds } };
    if (options?.contractId) where.contractId = options.contractId;
    if (options?.status) where.status = options.status;

    const [milestones, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        include: {
          contract: { select: { id: true, projectId: true } },
          evidence: true,
          lienWaivers: true,
        },
        orderBy: { createdAt: 'asc' } as any,
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.milestone.count({ where }),
    ]);

    return { milestones, total };
  },

  /**
   * Get a single milestone by ID
   */
  async getMilestone(milestoneId: string) {
    return prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { id: true, name: true, ownerId: true } },
            contractor: { select: { id: true, name: true, email: true } },
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        evidence: true,
        lienWaivers: true,
      },
    });
  },

  /**
   * Update milestone status (approve, reject, mark as paid, etc.)
   */
  async updateMilestoneStatus(milestoneId: string, status: MilestonePaymentStatus, data?: {
    approvedBy?: string;
    notes?: string;
  }) {
    const updateData: any = { status };
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = data?.approvedBy;
    }
    if (status === 'PAID') {
      updateData.paidAt = new Date();
    }

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: { contract: true, evidence: true },
    });
  },

  /**
   * Calculate payment amount with holdback
   */
  calculatePaymentBreakdown(
    milestoneAmount: number,
    holdbackPercentage: number = DEFAULT_HOLDBACK_PERCENTAGE,
  ) {
    const totalAmount = milestoneAmount;
    const holdbackAmount = (totalAmount * holdbackPercentage) / 100;
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
    const releaseAmount = totalAmount - holdbackAmount;
    const contractorPayout = releaseAmount - platformFee;

    return {
      totalAmount: Math.round(totalAmount * 100) / 100,
      holdbackAmount: Math.round(holdbackAmount * 100) / 100,
      releaseAmount: Math.round(releaseAmount * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      contractorPayout: Math.round(contractorPayout * 100) / 100,
    };
  },

  /**
   * Check if milestone can be paid
   */
  async canReleaseMilestonePayment(milestoneId: string): Promise<{
    canRelease: boolean;
    reasons: string[];
  }> {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true, status: true } },
          },
        },
        evidence: true,
      },
    });

    if (!milestone) {
      return { canRelease: false, reasons: ['Milestone not found'] };
    }

    const reasons: string[] = [];

    if (milestone.status !== 'APPROVED') {
      reasons.push(`Milestone must be APPROVED (current: ${milestone.status})`);
    }
    if (milestone.status === 'PAID') {
      reasons.push('Milestone has already been paid');
    }
    if (!milestone.evidence || milestone.evidence.length === 0) {
      reasons.push('Milestone must have evidence before payment');
    }

    // Check escrow status
    const escrow = await prisma.escrowAgreement.findFirst({
      where: { projectId: milestone.contract.projectId },
    });

    if (!escrow) {
      reasons.push('Escrow agreement not found for project');
    } else if (escrow.status === 'FROZEN') {
      reasons.push('Escrow is frozen due to active dispute');
    } else if (Number(escrow.availableBalance) < Number(milestone.amount)) {
      reasons.push(
        `Insufficient escrow balance (available: ${escrow.availableBalance}, required: ${milestone.amount})`,
      );
    }

    return { canRelease: reasons.length === 0, reasons };
  },

  /**
   * Release payment for an approved milestone (creates escrow transaction)
   */
  async releaseMilestonePayment(milestoneId: string, initiatedBy: string, options?: {
    skipHoldback?: boolean;
    notes?: string;
  }) {
    const { canRelease, reasons } = await this.canReleaseMilestonePayment(milestoneId);
    if (!canRelease) {
      throw new Error(`Cannot release payment: ${reasons.join(', ')}`);
    }

    const milestone = await prisma.milestone.findUniqueOrThrow({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { id: true, ownerId: true } },
          },
        },
      },
    });

    const escrow = await prisma.escrowAgreement.findFirstOrThrow({
      where: { projectId: milestone.contract.projectId },
    });

    const holdbackPct = options?.skipHoldback ? 0 : DEFAULT_HOLDBACK_PERCENTAGE;
    const breakdown = this.calculatePaymentBreakdown(Number(milestone.amount), holdbackPct);

    // Atomic transaction: create escrow tx, update balances, mark milestone PAID
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.escrowTransaction.create({
        data: {
          escrowId: escrow.id,
          type: options?.skipHoldback ? 'RELEASE' : 'RELEASE',
          amount: breakdown.releaseAmount,
          balanceBefore: escrow.currentBalance,
          balanceAfter: Number(escrow.currentBalance) - breakdown.releaseAmount,
          status: 'PENDING',
          reference: milestoneId,
          initiatedBy,
          metadata: {
            milestoneId,
            milestoneName: milestone.name,
            holdbackAmount: breakdown.holdbackAmount,
            platformFee: breakdown.platformFee,
            contractorPayout: breakdown.contractorPayout,
            notes: options?.notes ?? null,
          },
        },
      });

      await tx.escrowAgreement.update({
        where: { id: escrow.id },
        data: {
          currentBalance: Number(escrow.currentBalance) - breakdown.releaseAmount,
          availableBalance: Number(escrow.availableBalance) - breakdown.releaseAmount,
        },
      });

      await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'PAID', paidAt: new Date() },
      });

      return transaction;
    });

    return {
      transaction: result,
      breakdown,
      escrowBalanceAfter: Number(escrow.currentBalance) - breakdown.releaseAmount,
    };
  },

  // ============================================================================
  // ESCROW MANAGEMENT
  // ============================================================================

  /**
   * Create an escrow agreement for a project contract
   */
  async createEscrowAgreement(projectId: string, data: {
    contractId: string;
    totalContractAmount: number;
    holdbackPercentage?: number;
    currency?: string;
  }) {
    const contract = await prisma.contractAgreement.findFirst({
      where: { id: data.contractId, projectId },
    });
    if (!contract) {
      throw new Error(`Contract ${data.contractId} not found for project ${projectId}`);
    }

    // Check if escrow already exists for this contract
    const existing = await prisma.escrowAgreement.findUnique({
      where: { contractId: data.contractId },
    });
    if (existing) {
      throw new Error(`Escrow agreement already exists for contract ${data.contractId}`);
    }

    const holdbackPct = data.holdbackPercentage ?? DEFAULT_HOLDBACK_PERCENTAGE;
    const initialDeposit = (data.totalContractAmount * holdbackPct) / 100;

    // Generate account number
    const accountNumber = await this.generateEscrowAccountNumber();

    return prisma.escrowAgreement.create({
      data: {
        contractId: data.contractId,
        projectId,
        escrowAccountNumber: accountNumber,
        totalContractAmount: data.totalContractAmount,
        initialDepositAmount: initialDeposit,
        holdbackPercentage: holdbackPct,
        currentBalance: 0,
        availableBalance: 0,
        heldBalance: 0,
        currency: data.currency ?? 'USD',
        status: 'PENDING_DEPOSIT',
      },
      include: { transactions: true, holds: true },
    });
  },

  /**
   * Get escrow agreement for a project
   */
  async getEscrowAgreement(projectId: string) {
    return prisma.escrowAgreement.findFirst({
      where: { projectId },
      include: {
        contract: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            contractor: { select: { id: true, name: true, email: true } },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        holds: {
          where: { status: 'ACTIVE' },
        },
      },
    });
  },

  /**
   * Record a deposit into escrow
   */
  async recordEscrowDeposit(projectId: string, data: {
    amount: number;
    reference?: string;
    initiatedBy: string;
    metadata?: Record<string, any>;
  }) {
    const escrow = await prisma.escrowAgreement.findFirstOrThrow({
      where: { projectId },
    });

    const isFirstDeposit = Number(escrow.currentBalance) === 0;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.escrowTransaction.create({
        data: {
          escrowId: escrow.id,
          type: 'DEPOSIT',
          amount: data.amount,
          balanceBefore: escrow.currentBalance,
          balanceAfter: Number(escrow.currentBalance) + data.amount,
          status: 'COMPLETED',
          reference: data.reference,
          processedDate: new Date(),
          initiatedBy: data.initiatedBy,
          metadata: data.metadata ?? {},
        },
      });

      await tx.escrowAgreement.update({
        where: { id: escrow.id },
        data: {
          currentBalance: Number(escrow.currentBalance) + data.amount,
          availableBalance: Number(escrow.availableBalance) + data.amount,
          status: isFirstDeposit ? 'ACTIVE' : escrow.status,
          activatedAt: isFirstDeposit ? new Date() : escrow.activatedAt,
        },
      });

      return transaction;
    });

    return result;
  },

  /**
   * Place a hold on escrow funds
   */
  async placeEscrowHold(projectId: string, data: {
    amount: number;
    reason: 'DISPUTE' | 'COMPLIANCE' | 'MANUAL' | 'LIEN';
    notes?: string;
    expiresAt?: string;
    placedBy: string;
  }) {
    const escrow = await prisma.escrowAgreement.findFirstOrThrow({
      where: { projectId },
    });

    if (Number(escrow.availableBalance) < data.amount) {
      throw new Error(
        `Insufficient available balance. Available: ${escrow.availableBalance}, requested hold: ${data.amount}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const hold = await tx.escrowHold.create({
        data: {
          escrowId: escrow.id,
          amount: data.amount,
          reason: data.reason,
          status: 'ACTIVE',
          placedBy: data.placedBy,
          placedAt: new Date(),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          notes: data.notes,
        },
      });

      await tx.escrowAgreement.update({
        where: { id: escrow.id },
        data: {
          availableBalance: Number(escrow.availableBalance) - data.amount,
          heldBalance: Number(escrow.heldBalance) + data.amount,
          status: data.reason === 'DISPUTE' ? 'FROZEN' : escrow.status,
        },
      });

      return hold;
    });

    return result;
  },

  /**
   * Release a hold on escrow funds
   */
  async releaseEscrowHold(holdId: string, data: {
    releasedBy: string;
    notes?: string;
  }) {
    const hold = await prisma.escrowHold.findUniqueOrThrow({
      where: { id: holdId },
      include: { escrow: true },
    });

    if (hold.status !== 'ACTIVE') {
      throw new Error('Hold is not active');
    }

    const result = await prisma.$transaction(async (tx) => {
      const released = await tx.escrowHold.update({
        where: { id: holdId },
        data: {
          status: 'RELEASED',
          releasedBy: data.releasedBy,
          releasedAt: new Date(),
          notes: data.notes ?? hold.notes,
        },
      });

      const escrow = hold.escrow;
      const isLastHold = Number(escrow.heldBalance) <= Number(hold.amount);

      await tx.escrowAgreement.update({
        where: { id: escrow.id },
        data: {
          availableBalance: Number(escrow.availableBalance) + Number(hold.amount),
          heldBalance: Number(escrow.heldBalance) - Number(hold.amount),
          status: hold.reason === 'DISPUTE' && isLastHold ? 'ACTIVE' : escrow.status,
        },
      });

      return released;
    });

    return result;
  },

  /**
   * List escrow transactions for a project
   */
  async listEscrowTransactions(projectId: string, options?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const escrow = await prisma.escrowAgreement.findFirst({
      where: { projectId },
    });

    if (!escrow) {
      return { transactions: [], total: 0 };
    }

    const where: any = { escrowId: escrow.id };
    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;

    const [transactions, total] = await Promise.all([
      prisma.escrowTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.escrowTransaction.count({ where }),
    ]);

    return { transactions, total, escrow };
  },

  // ============================================================================
  // DRAW DISBURSEMENT
  // ============================================================================

  /**
   * Create a draw request
   */
  async createDrawRequest(projectId: string, data: {
    drawNumber?: number;
    periodEnd?: string;
    description?: string;
    scheduledAmount: number;
    previouslyBilled?: number;
    currentBilling: number;
    retainage?: number;
    notes?: string;
    createdBy?: string;
  }) {
    // Auto-calculate draw number if not provided
    let drawNumber = data.drawNumber;
    if (!drawNumber) {
      const lastDraw = await prisma.drawRequest.findFirst({
        where: { projectId },
        orderBy: { drawNumber: 'desc' },
      });
      drawNumber = (lastDraw?.drawNumber ?? 0) + 1;
    }

    return prisma.drawRequest.create({
      data: {
        projectId,
        drawNumber,
        periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
        description: data.description ?? '',
        scheduledAmount: data.scheduledAmount,
        previouslyBilled: data.previouslyBilled ?? 0,
        currentBilling: data.currentBilling,
        retainage: data.retainage ?? 10,
        status: 'DRAFT',
        notes: data.notes,
        createdBy: data.createdBy,
      },
    });
  },

  /**
   * List draw requests for a project
   */
  async listDrawRequests(projectId: string, options?: {
    status?: DrawRequestStatusType;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { projectId };
    if (options?.status) where.status = options.status;

    const [draws, total] = await Promise.all([
      prisma.drawRequest.findMany({
        where,
        orderBy: { drawNumber: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.drawRequest.count({ where }),
    ]);

    return { draws, total };
  },

  /**
   * Get a single draw request
   */
  async getDrawRequest(drawId: string) {
    return prisma.drawRequest.findUnique({
      where: { id: drawId },
    });
  },

  /**
   * Update draw request status through approval pipeline
   */
  async updateDrawRequestStatus(drawId: string, status: DrawRequestStatusType, data?: {
    rejectedReason?: string;
    aiaDocumentUrl?: string;
    notes?: string;
  }) {
    const updateData: any = { status };

    if (status === 'SUBMITTED') {
      updateData.submittedAt = new Date();
    } else if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (status === 'FUNDED') {
      updateData.fundedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedReason = data?.rejectedReason;
    }

    if (data?.aiaDocumentUrl) updateData.aiaDocumentUrl = data.aiaDocumentUrl;
    if (data?.notes) updateData.notes = data.notes;

    return prisma.drawRequest.update({
      where: { id: drawId },
      data: updateData,
    });
  },

  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================

  /**
   * Create a payment record (Stripe integration hook)
   */
  async createPayment(data: {
    projectId?: string;
    orgId?: string;
    amount: number;
    currency?: string;
    description?: string;
    stripePaymentIntentId?: string;
    metadata?: Record<string, any>;
  }) {
    return prisma.payment.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        amount: data.amount,
        currency: data.currency ?? 'usd',
        status: 'PENDING',
        stripePaymentIntentId: data.stripePaymentIntentId,
        metadata: {
          description: data.description,
          ...(data.metadata ?? {}),
        },
      },
    });
  },

  /**
   * Update payment status (called by webhooks or Stripe events)
   */
  async updatePaymentStatus(paymentId: string, status: string, data?: {
    paidAt?: Date;
    failedAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
    stripePaymentIntentId?: string;
  }) {
    const updateData: any = { status: status.toUpperCase() };
    if (data?.paidAt) updateData.paidAt = data.paidAt;
    if (data?.failedAt) updateData.failedAt = data.failedAt;
    if (data?.refundedAt) updateData.refundedAt = data.refundedAt;
    if (data?.refundAmount) updateData.refundAmount = data.refundAmount;
    if (data?.stripePaymentIntentId) updateData.stripePaymentIntentId = data.stripePaymentIntentId;

    return prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });
  },

  /**
   * List payments for a project
   */
  async listPayments(projectId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { projectId };
    if (options?.status) where.status = options.status.toUpperCase();
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options?.endDate) where.createdAt.lte = new Date(options.endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  },

  /**
   * Process a refund
   */
  async processRefund(paymentId: string, data: {
    amount?: number; // partial refund; omit for full refund
    reason?: string;
  }) {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });

    const refundAmount = data.amount ?? Number(payment.amount);

    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount,
        metadata: {
          ...(payment.metadata as Record<string, any> ?? {}),
          refundReason: data.reason,
          originalAmount: Number(payment.amount),
        },
      },
    });
  },

  // ============================================================================
  // INVOICE MANAGEMENT
  // ============================================================================

  /**
   * Create an invoice for a project
   */
  async createInvoice(projectId: string, data: {
    amount: number;
    description?: string;
    dueDate?: string;
    invoiceNumber?: string;
    metadata?: Record<string, any>;
  }) {
    // Generate invoice ID for Stripe reference
    const stripeInvoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return prisma.invoice.create({
      data: {
        orgId: null,
        stripeInvoiceId,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: 'usd',
        status: 'draft',
        periodStart: new Date(),
        periodEnd: data.dueDate ? new Date(data.dueDate) : null,
        metadata: {
          projectId,
          description: data.description ?? 'Payment invoice',
          ...(data.metadata ?? {}),
        },
      },
    });
  },

  /**
   * List invoices for a project (by metadata.projectId)
   */
  async listInvoices(projectId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    // Invoice model doesn't have a direct projectId column,
    // so we store it in metadata and use JSON filtering
    const where: any = {};
    if (options?.status) where.status = options.status;

    const allInvoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200, // fetch more to filter
    });

    // Filter by projectId in metadata
    const projectInvoices = allInvoices.filter((inv: any) => {
      const meta = inv.metadata as Record<string, any> | null;
      return meta?.projectId === projectId;
    });

    const paged = projectInvoices.slice(
      options?.offset ?? 0,
      (options?.offset ?? 0) + (options?.limit ?? 50),
    );

    return { invoices: paged, total: projectInvoices.length };
  },

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: string, data?: {
    paidAt?: Date;
    hostedInvoiceUrl?: string;
    invoicePdf?: string;
  }) {
    const updateData: any = { status };
    if (data?.paidAt) updateData.paidAt = data.paidAt;
    if (data?.hostedInvoiceUrl) updateData.hostedInvoiceUrl = data.hostedInvoiceUrl;
    if (data?.invoicePdf) updateData.invoicePdf = data.invoicePdf;

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });
  },

  // ============================================================================
  // LIEN WAIVERS
  // ============================================================================

  /**
   * Create a lien waiver for a payment
   */
  async createLienWaiver(projectId: string, data: {
    contractId: string;
    milestoneId?: string;
    escrowTransactionId?: string;
    waiverType: LienWaiverTypeValue;
    waiverScope: LienWaiverScopeValue;
    projectName: string;
    projectAddress: string;
    state: string;
    claimantName: string;
    claimantAddress: string;
    claimantEmail?: string;
    claimantPhone?: string;
    ownerName: string;
    ownerAddress?: string;
    throughDate: string;
    waiverAmount: number;
    cumulativeAmount: number;
    createdBy: string;
    metadata?: Record<string, any>;
  }) {
    return prisma.lienWaiver.create({
      data: {
        contractId: data.contractId,
        projectId,
        milestoneId: data.milestoneId,
        escrowTransactionId: data.escrowTransactionId,
        waiverType: data.waiverType,
        waiverScope: data.waiverScope,
        status: 'GENERATED',
        projectName: data.projectName,
        projectAddress: data.projectAddress,
        state: data.state,
        claimantName: data.claimantName,
        claimantAddress: data.claimantAddress,
        claimantEmail: data.claimantEmail,
        claimantPhone: data.claimantPhone,
        ownerName: data.ownerName,
        ownerAddress: data.ownerAddress,
        throughDate: new Date(data.throughDate),
        waiverAmount: data.waiverAmount,
        cumulativeAmount: data.cumulativeAmount,
        createdBy: data.createdBy,
        metadata: data.metadata ?? {},
      },
    });
  },

  /**
   * List lien waivers for a project
   */
  async listLienWaivers(projectId: string, options?: {
    status?: LienWaiverStatusValue;
    milestoneId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { projectId };
    if (options?.status) where.status = options.status;
    if (options?.milestoneId) where.milestoneId = options.milestoneId;

    const [waivers, total] = await Promise.all([
      prisma.lienWaiver.findMany({
        where,
        include: {
          milestone: { select: { id: true, name: true, amount: true } },
          escrowTransaction: { select: { id: true, type: true, amount: true, status: true } },
        },
        orderBy: { generatedAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.lienWaiver.count({ where }),
    ]);

    return { waivers, total };
  },

  /**
   * Update lien waiver status (sent, signed, recorded, expired)
   */
  async updateLienWaiverStatus(waiverId: string, status: LienWaiverStatusValue, data?: {
    signedDocumentUrl?: string;
    documentUrl?: string;
  }) {
    const updateData: any = { status };

    if (status === 'SENT') updateData.sentAt = new Date();
    if (status === 'SIGNED') updateData.signedAt = new Date();
    if (status === 'RECORDED') updateData.recordedAt = new Date();
    if (data?.signedDocumentUrl) updateData.signedDocumentUrl = data.signedDocumentUrl;
    if (data?.documentUrl) updateData.documentUrl = data.documentUrl;

    return prisma.lienWaiver.update({
      where: { id: waiverId },
      data: updateData,
    });
  },

  // ============================================================================
  // RECONCILIATION
  // ============================================================================

  /**
   * Calculate and verify escrow balances for reconciliation
   */
  async reconcileEscrowBalances(escrowId: string) {
    const escrow = await prisma.escrowAgreement.findUniqueOrThrow({
      where: { id: escrowId },
      include: {
        transactions: true,
        holds: { where: { status: 'ACTIVE' } },
      },
    });

    let totalDeposits = 0;
    let totalReleases = 0;
    let totalFees = 0;
    let totalRefunds = 0;

    escrow.transactions.forEach((tx) => {
      if (tx.status === 'COMPLETED') {
        switch (tx.type) {
          case 'DEPOSIT':
            totalDeposits += Number(tx.amount);
            break;
          case 'RELEASE':
            totalReleases += Number(tx.amount);
            break;
          case 'FEE':
            totalFees += Number(tx.amount);
            break;
          case 'REFUND':
            totalRefunds += Number(tx.amount);
            break;
          case 'INTEREST':
            totalDeposits += Number(tx.amount);
            break;
        }
      }
    });

    const heldBalance = escrow.holds.reduce(
      (sum, h) => sum + Number(h.amount),
      0,
    );

    const calculatedCurrent = totalDeposits - totalReleases - totalFees - totalRefunds;
    const calculatedAvailable = calculatedCurrent - heldBalance;

    const currentDiscrepancy = Math.abs(calculatedCurrent - Number(escrow.currentBalance));
    const availableDiscrepancy = Math.abs(calculatedAvailable - Number(escrow.availableBalance));
    const heldDiscrepancy = Math.abs(heldBalance - Number(escrow.heldBalance));

    const tolerance = 0.01;
    const hasDiscrepancy =
      currentDiscrepancy > tolerance ||
      availableDiscrepancy > tolerance ||
      heldDiscrepancy > tolerance;

    return {
      escrowId: escrow.id,
      escrowAccountNumber: escrow.escrowAccountNumber,
      recorded: {
        currentBalance: Number(escrow.currentBalance),
        availableBalance: Number(escrow.availableBalance),
        heldBalance: Number(escrow.heldBalance),
      },
      calculated: {
        currentBalance: Math.round(calculatedCurrent * 100) / 100,
        availableBalance: Math.round(calculatedAvailable * 100) / 100,
        heldBalance: Math.round(heldBalance * 100) / 100,
      },
      breakdown: {
        totalDeposits: Math.round(totalDeposits * 100) / 100,
        totalReleases: Math.round(totalReleases * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
      },
      discrepancy: {
        current: Math.round(currentDiscrepancy * 100) / 100,
        available: Math.round(availableDiscrepancy * 100) / 100,
        held: Math.round(heldDiscrepancy * 100) / 100,
      },
      hasDiscrepancy,
    };
  },

  /**
   * Run reconciliation across all active escrow accounts
   */
  async reconcileAll() {
    const activeEscrows = await prisma.escrowAgreement.findMany({
      where: { status: { in: ['ACTIVE', 'FROZEN'] } },
      select: { id: true, escrowAccountNumber: true },
    });

    const results = await Promise.all(
      activeEscrows.map(async (e) => {
        try {
          return await this.reconcileEscrowBalances(e.id);
        } catch (err: any) {
          return {
            escrowId: e.id,
            escrowAccountNumber: e.escrowAccountNumber,
            error: err.message,
          };
        }
      }),
    );

    const discrepancies = results.filter((r: any) => r.hasDiscrepancy);

    return {
      totalAccounts: activeEscrows.length,
      reconciled: results.length,
      discrepancies: discrepancies.length,
      results,
    };
  },

  /**
   * Get trust account compliance summary (regulatory)
   */
  async getTrustAccountCompliance() {
    const escrows = await prisma.escrowAgreement.findMany({
      where: { status: { in: ['ACTIVE', 'FROZEN'] } },
      include: {
        holds: { where: { status: 'ACTIVE' } },
      },
    });

    const totalHeld = escrows.reduce(
      (sum, e) => sum + Number(e.currentBalance),
      0,
    );
    const totalAvailable = escrows.reduce(
      (sum, e) => sum + Number(e.availableBalance),
      0,
    );
    const totalOnHold = escrows.reduce(
      (sum, e) => sum + Number(e.heldBalance),
      0,
    );
    const frozenAccounts = escrows.filter((e) => e.status === 'FROZEN');

    return {
      activeAccounts: escrows.length,
      frozenAccounts: frozenAccounts.length,
      totalHeldInTrust: Math.round(totalHeld * 100) / 100,
      totalAvailable: Math.round(totalAvailable * 100) / 100,
      totalOnHold: Math.round(totalOnHold * 100) / 100,
      accounts: escrows.map((e) => ({
        id: e.id,
        accountNumber: e.escrowAccountNumber,
        status: e.status,
        currentBalance: Number(e.currentBalance),
        availableBalance: Number(e.availableBalance),
        heldBalance: Number(e.heldBalance),
        activeHolds: e.holds.length,
      })),
    };
  },

  // ============================================================================
  // FINANCIAL REPORTING
  // ============================================================================

  /**
   * Get financial summary for a project
   */
  async getProjectFinancialSummary(projectId: string) {
    // Get escrow data
    const escrow = await prisma.escrowAgreement.findFirst({
      where: { projectId },
      include: {
        transactions: true,
        holds: { where: { status: 'ACTIVE' } },
      },
    });

    // Get milestones via contracts
    const contracts = await prisma.contractAgreement.findMany({
      where: { projectId },
      select: { id: true },
    });
    const contractIds = contracts.map((c) => c.id);

    const milestones = contractIds.length > 0
      ? await prisma.milestone.findMany({
          where: { contractId: { in: contractIds } },
        })
      : [];

    // Get payments
    const payments = await prisma.payment.findMany({
      where: { projectId },
    });

    // Get draw requests
    const draws = await prisma.drawRequest.findMany({
      where: { projectId },
    });

    // Get lien waivers
    const lienWaivers = await prisma.lienWaiver.findMany({
      where: { projectId },
    });

    // Calculate summaries
    const totalContractValue = milestones.reduce(
      (sum, m) => sum + Number(m.amount),
      0,
    );
    const paidMilestones = milestones.filter((m) => m.status === 'PAID');
    const totalPaid = paidMilestones.reduce(
      (sum, m) => sum + Number(m.amount),
      0,
    );
    const pendingMilestones = milestones.filter((m) =>
      ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status),
    );
    const totalPending = pendingMilestones.reduce(
      (sum, m) => sum + Number(m.amount),
      0,
    );

    const totalPayments = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const completedPayments = payments.filter(
      (p) => p.status === 'COMPLETED' || p.status === 'completed',
    );
    const totalCollected = completedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const fundedDraws = draws.filter((d) => d.status === 'FUNDED');
    const totalDrawsFunded = fundedDraws.reduce(
      (sum, d) => sum + d.currentBilling,
      0,
    );

    const signedWaivers = lienWaivers.filter((w) => w.status === 'SIGNED' || w.status === 'RECORDED');

    return {
      projectId,
      escrow: escrow
        ? {
            accountNumber: escrow.escrowAccountNumber,
            status: escrow.status,
            currentBalance: Number(escrow.currentBalance),
            availableBalance: Number(escrow.availableBalance),
            heldBalance: Number(escrow.heldBalance),
            totalContractAmount: Number(escrow.totalContractAmount),
          }
        : null,
      milestones: {
        total: milestones.length,
        paid: paidMilestones.length,
        pending: pendingMilestones.length,
        totalContractValue: Math.round(totalContractValue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100,
        completionPercentage: totalContractValue > 0
          ? Math.round((totalPaid / totalContractValue) * 10000) / 100
          : 0,
      },
      payments: {
        total: payments.length,
        completed: completedPayments.length,
        totalAmount: Math.round(totalPayments * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
      },
      draws: {
        total: draws.length,
        funded: fundedDraws.length,
        totalFunded: Math.round(totalDrawsFunded * 100) / 100,
      },
      lienWaivers: {
        total: lienWaivers.length,
        signed: signedWaivers.length,
        pending: lienWaivers.length - signedWaivers.length,
      },
    };
  },

  /**
   * Revenue recognition summary (platform fees collected)
   */
  async getRevenueRecognitionSummary(options?: {
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {
      status: 'COMPLETED',
      type: 'FEE',
    };
    if (options?.startDate || options?.endDate) {
      where.processedDate = {};
      if (options?.startDate) where.processedDate.gte = new Date(options.startDate);
      if (options?.endDate) where.processedDate.lte = new Date(options.endDate);
    }

    const feeTransactions = await prisma.escrowTransaction.findMany({
      where,
      orderBy: { processedDate: 'desc' },
    });

    const totalFees = feeTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    // Also get payments that are platform fees
    const platformPayments = await prisma.payment.findMany({
      where: {
        status: { in: ['COMPLETED', 'completed'] },
        ...(options?.startDate || options?.endDate
          ? {
              paidAt: {
                ...(options?.startDate ? { gte: new Date(options.startDate) } : {}),
                ...(options?.endDate ? { lte: new Date(options.endDate) } : {}),
              },
            }
          : {}),
      },
    });

    const platformFeePayments = platformPayments.filter((p: any) => {
      const meta = p.metadata as Record<string, any> | null;
      return meta?.type === 'platform_fee';
    });

    const totalPlatformFees = platformFeePayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    return {
      period: {
        startDate: options?.startDate ?? 'all-time',
        endDate: options?.endDate ?? 'current',
      },
      escrowFees: {
        count: feeTransactions.length,
        total: Math.round(totalFees * 100) / 100,
      },
      platformFees: {
        count: platformFeePayments.length,
        total: Math.round(totalPlatformFees * 100) / 100,
      },
      totalRevenue: Math.round((totalFees + totalPlatformFees) * 100) / 100,
    };
  },

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Generate unique escrow account number ESC-YYYYMMDD-XXXX
   */
  async generateEscrowAccountNumber(): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `ESC-${y}${m}${d}`;

    const latest = await prisma.escrowAgreement.findFirst({
      where: { escrowAccountNumber: { startsWith: prefix } },
      orderBy: { escrowAccountNumber: 'desc' },
    });

    let seq = 1;
    if (latest) {
      const match = latest.escrowAccountNumber.match(/-(\d{4})$/);
      if (match) seq = parseInt(match[1], 10) + 1;
    }

    return `${prefix}-${String(seq).padStart(4, '0')}`;
  },
};
