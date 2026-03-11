/**
 * Capital Service — capital stacks, draw tracking, investor reporting, entitlements
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const capitalService = {
  // ── Capital Stack ──────────────────────────────────────────

  async createCapitalStack(data: {
    projectId: string;
    orgId: string;
    totalCapital: number;
    seniorDebt?: number;
    mezzanineDebt?: number;
    preferredEquity?: number;
    commonEquity?: number;
    grants?: number;
    otherSources?: number;
    notes?: string;
  }) {
    return prisma.capitalStack.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        totalCapital: data.totalCapital,
        seniorDebt: data.seniorDebt ?? 0,
        mezzanineDebt: data.mezzanineDebt ?? 0,
        preferredEquity: data.preferredEquity ?? 0,
        commonEquity: data.commonEquity ?? 0,
        grants: data.grants ?? 0,
        otherSources: data.otherSources ?? 0,
        notes: data.notes,
      },
      include: { sources: true },
    });
  },

  async getCapitalStack(projectId: string) {
    return prisma.capitalStack.findUnique({
      where: { projectId },
      include: {
        sources: { orderBy: { createdAt: 'asc' } },
        drawSchedules: { orderBy: { drawNumber: 'asc' } },
      },
    });
  },

  async updateCapitalStack(id: string, data: Record<string, unknown>) {
    return prisma.capitalStack.update({
      where: { id },
      data: data as any,
      include: { sources: true },
    });
  },

  async finalizeCapitalStack(id: string, finalizedBy: string) {
    // Recalculate leverage metrics
    const stack = await prisma.capitalStack.findUniqueOrThrow({
      where: { id },
      include: { sources: true },
    });

    const totalDebt = Number(stack.seniorDebt) + Number(stack.mezzanineDebt);
    const totalEquity = Number(stack.preferredEquity) + Number(stack.commonEquity);
    const total = Number(stack.totalCapital);

    return prisma.capitalStack.update({
      where: { id },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
        finalizedBy,
        loanToValue: total > 0 ? totalDebt / total : null,
        loanToCost: total > 0 ? totalDebt / total : null,
      },
    });
  },

  // ── Capital Sources ────────────────────────────────────────

  async addSource(capitalStackId: string, data: {
    sourceType: string;
    lenderName: string;
    commitmentAmount: number;
    contactInfo?: Record<string, unknown>;
    interestRate?: number;
    term?: number;
    amortization?: number;
    ioPeriod?: number;
    origFee?: number;
    maturityDate?: Date;
    notes?: string;
    documentUrl?: string;
  }) {
    const source = await prisma.capitalSource.create({
      data: {
        capitalStackId,
        sourceType: data.sourceType as any,
        lenderName: data.lenderName,
        commitmentAmount: data.commitmentAmount,
        remainingAmount: data.commitmentAmount,
        contactInfo: data.contactInfo as any,
        interestRate: data.interestRate,
        term: data.term,
        amortization: data.amortization,
        ioPeriod: data.ioPeriod,
        origFee: data.origFee,
        maturityDate: data.maturityDate,
        notes: data.notes,
        documentUrl: data.documentUrl,
        status: 'PENDING',
      },
    });

    // Recalculate capital stack totals
    await this.recalculateStackTotals(capitalStackId);
    return source;
  },

  async updateSource(id: string, data: Record<string, unknown>) {
    return prisma.capitalSource.update({
      where: { id },
      data: data as any,
    });
  },

  async recalculateStackTotals(capitalStackId: string) {
    const sources = await prisma.capitalSource.findMany({
      where: { capitalStackId },
    });

    const totals = sources.reduce(
      (acc, s) => {
        const amount = Number(s.commitmentAmount);
        switch (s.sourceType) {
          case 'SENIOR_DEBT': acc.seniorDebt += amount; break;
          case 'MEZZANINE': acc.mezzanineDebt += amount; break;
          case 'PREFERRED_EQUITY': acc.preferredEquity += amount; break;
          case 'COMMON_EQUITY': acc.commonEquity += amount; break;
          case 'GRANT': case 'TAX_CREDIT': acc.grants += amount; break;
          default: acc.otherSources += amount;
        }
        acc.total += amount;
        return acc;
      },
      { seniorDebt: 0, mezzanineDebt: 0, preferredEquity: 0, commonEquity: 0, grants: 0, otherSources: 0, total: 0 }
    );

    await prisma.capitalStack.update({
      where: { id: capitalStackId },
      data: {
        totalCapital: totals.total,
        seniorDebt: totals.seniorDebt,
        mezzanineDebt: totals.mezzanineDebt,
        preferredEquity: totals.preferredEquity,
        commonEquity: totals.commonEquity,
        grants: totals.grants,
        otherSources: totals.otherSources,
      },
    });
  },

  // ── Draw Schedules ─────────────────────────────────────────

  async createDraw(capitalStackId: string, data: {
    drawNumber: number;
    requestedAmount: number;
    periodStart?: Date;
    periodEnd?: Date;
    lineItems?: unknown[];
    notes?: string;
  }) {
    return prisma.drawSchedule.create({
      data: {
        capitalStackId,
        drawNumber: data.drawNumber,
        requestedAmount: data.requestedAmount,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        lineItems: data.lineItems as any,
        notes: data.notes,
        status: 'DRAFT',
      },
    });
  },

  async submitDraw(id: string) {
    return prisma.drawSchedule.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  },

  async approveDraw(id: string, approvedBy: string, approvedAmount: number, retainage?: number) {
    const netDisbursement = approvedAmount - (retainage ?? 0);
    return prisma.drawSchedule.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAmount,
        retainage: retainage ?? 0,
        netDisbursement,
        reviewedAt: new Date(),
        reviewedBy: approvedBy,
        approvedAt: new Date(),
        approvedBy,
      },
    });
  },

  async fundDraw(id: string) {
    const draw = await prisma.drawSchedule.update({
      where: { id },
      data: { status: 'FUNDED', fundedAt: new Date() },
    });

    // Update funded amount on capital sources
    const stack = await prisma.capitalStack.findUniqueOrThrow({
      where: { id: draw.capitalStackId },
      include: { sources: { where: { status: 'ACTIVE' } } },
    });

    // Simple: distribute funded amount to first active source
    if (stack.sources.length > 0) {
      const source = stack.sources[0];
      const newFunded = Number(source.fundedAmount) + Number(draw.netDisbursement ?? draw.approvedAmount ?? 0);
      await prisma.capitalSource.update({
        where: { id: source.id },
        data: {
          fundedAmount: newFunded,
          remainingAmount: Number(source.commitmentAmount) - newFunded,
        },
      });
    }

    return draw;
  },

  async rejectDraw(id: string, reviewedBy: string, reason: string) {
    return prisma.drawSchedule.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy,
        rejectionReason: reason,
      },
    });
  },

  async listDraws(capitalStackId: string) {
    return prisma.drawSchedule.findMany({
      where: { capitalStackId },
      orderBy: { drawNumber: 'asc' },
    });
  },

  // ── Investor Reports ───────────────────────────────────────

  async createInvestorReport(data: {
    projectId: string;
    orgId: string;
    reportType: string;
    periodStart: Date;
    periodEnd: Date;
    title?: string;
    totalInvested?: number;
    totalSpent?: number;
    budgetRemaining?: number;
    overallCompletion?: number;
    narrative?: string;
    highlights?: unknown[];
    risks?: unknown[];
    nextSteps?: unknown[];
  }) {
    return prisma.investorReport.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        reportType: data.reportType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        title: data.title,
        totalInvested: data.totalInvested,
        totalSpent: data.totalSpent,
        budgetRemaining: data.budgetRemaining,
        overallCompletion: data.overallCompletion,
        budgetVariance: data.totalInvested && data.totalSpent
          ? ((Number(data.totalSpent) - Number(data.totalInvested)) / Number(data.totalInvested)) * 100
          : null,
        narrative: data.narrative,
        highlights: data.highlights as any,
        risks: data.risks as any,
        nextSteps: data.nextSteps as any,
        status: 'DRAFT',
      },
    });
  },

  async publishInvestorReport(id: string, publishedBy: string) {
    return prisma.investorReport.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), publishedBy },
    });
  },

  async listInvestorReports(projectId: string, limit = 20) {
    return prisma.investorReport.findMany({
      where: { projectId },
      orderBy: { periodEnd: 'desc' },
      take: limit,
    });
  },

  // ── Entitlements ───────────────────────────────────────────

  async createEntitlement(data: {
    projectId: string;
    orgId: string;
    entitlementType: string;
    title: string;
    description?: string;
    jurisdiction?: string;
    department?: string;
    applicationFee?: number;
    assignedTo?: string;
  }) {
    return prisma.entitlement.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        entitlementType: data.entitlementType as any,
        title: data.title,
        description: data.description,
        jurisdiction: data.jurisdiction,
        department: data.department,
        applicationFee: data.applicationFee,
        assignedTo: data.assignedTo,
        status: 'NOT_STARTED',
      },
    });
  },

  async updateEntitlement(id: string, data: Record<string, unknown>) {
    return prisma.entitlement.update({
      where: { id },
      data: data as any,
    });
  },

  async listEntitlements(projectId: string) {
    return prisma.entitlement.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  },
};
