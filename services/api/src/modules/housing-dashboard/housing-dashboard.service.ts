import { prismaAny } from '../../lib/prisma';

/**
 * Housing Dashboard Service — Phase 4
 * Municipal housing pipeline tracking, CDBG reporting, pattern book adoption.
 * Act Alignment: CDBG reporting, Sec 210 pattern book adoption tracking.
 */
export class HousingDashboardService {
  /**
   * Get pipeline overview for a jurisdiction — units by stage
   */
  async getPipelineOverview(jurisdictionId: string) {
    const prisma = prismaAny();
    const entries = await prisma.housingPipelineEntry.findMany({
      where: { jurisdictionId },
      orderBy: { createdAt: 'desc' },
    });

    const stageGroups: Record<string, { count: number; totalUnits: number; affordableUnits: number }> = {};
    for (const entry of entries) {
      const stage = entry.currentStage || 'unknown';
      if (!stageGroups[stage]) stageGroups[stage] = { count: 0, totalUnits: 0, affordableUnits: 0 };
      stageGroups[stage].count++;
      stageGroups[stage].totalUnits += entry.totalUnits || 0;
      stageGroups[stage].affordableUnits += entry.affordableUnits || 0;
    }

    return {
      jurisdictionId,
      totalProjects: entries.length,
      totalUnits: entries.reduce((sum, e) => sum + (e.totalUnits || 0), 0),
      totalAffordableUnits: entries.reduce((sum, e) => sum + (e.affordableUnits || 0), 0),
      byStage: stageGroups,
    };
  }

  /**
   * Get housing metrics — permit trends, unit production, type breakdown
   */
  async getHousingMetrics(jurisdictionId: string, period: 'month' | 'quarter' | 'year' = 'quarter') {
    const prisma = prismaAny();

    const now = new Date();
    const startDate = new Date();
    if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
    else startDate.setFullYear(now.getFullYear() - 1);

    const entries = await prisma.housingPipelineEntry.findMany({
      where: {
        jurisdictionId,
        createdAt: { gte: startDate },
      },
    });

    const byType: Record<string, number> = {};
    for (const entry of entries) {
      const type = entry.housingType || 'UNKNOWN';
      byType[type] = (byType[type] || 0) + 1;
    }

    const permits = await prisma.permit?.findMany?.({
      where: {
        jurisdictionId,
        createdAt: { gte: startDate },
      },
      select: { id: true, status: true, createdAt: true },
    }).catch(() => []) || [];

    return {
      period,
      startDate: startDate.toISOString(),
      newProjects: entries.length,
      totalUnitsProposed: entries.reduce((sum: number, e: any) => sum + (e.totalUnits || 0), 0),
      byHousingType: byType,
      permitActivity: {
        submitted: permits.length,
        approved: permits.filter((p: any) => p.status === 'APPROVED').length,
        pending: permits.filter((p: any) => p.status === 'IN_REVIEW' || p.status === 'SUBMITTED').length,
      },
    };
  }

  /**
   * Get pattern book adoption stats for a jurisdiction
   */
  async getPatternBookAdoption(jurisdictionId: string) {
    const prisma = prismaAny();

    const designs = await prisma.patternBookDesign.findMany({
      where: { jurisdictionId },
      select: {
        id: true,
        name: true,
        housingType: true,
        status: true,
        downloadCount: true,
        selectionCount: true,
        permitSubmissionCount: true,
      },
    });

    const selections = await prisma.patternBookSelection.count({
      where: {
        design: { jurisdictionId },
      },
    }).catch(() => 0);

    return {
      jurisdictionId,
      totalDesigns: designs.length,
      publishedDesigns: designs.filter((d: any) => d.status === 'PUBLISHED' || d.status === 'PRE_APPROVED').length,
      totalDownloads: designs.reduce((sum: number, d: any) => sum + (d.downloadCount || 0), 0),
      totalSelections: selections,
      totalPermitSubmissions: designs.reduce((sum: number, d: any) => sum + (d.permitSubmissionCount || 0), 0),
      designsByType: designs.reduce((acc: Record<string, number>, d: any) => {
        acc[d.housingType] = (acc[d.housingType] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  /**
   * Get permit trends over time for a jurisdiction
   */
  async getPermitTrends(jurisdictionId: string, months: number = 12) {
    const prisma = prismaAny();
    const trends: Array<{ month: string; submitted: number; approved: number; denied: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const permits = await prisma.permit?.findMany?.({
        where: {
          jurisdictionId,
          createdAt: { gte: start, lt: end },
        },
        select: { status: true },
      }).catch(() => []) || [];

      trends.push({
        month: start.toISOString().slice(0, 7),
        submitted: permits.length,
        approved: permits.filter((p: any) => p.status === 'APPROVED').length,
        denied: permits.filter((p: any) => p.status === 'DENIED').length,
      });
    }

    return { jurisdictionId, months, trends };
  }

  /**
   * Generate CDBG-format export data
   */
  async exportCDBGReport(jurisdictionId: string, year: number) {
    const prisma = prismaAny();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const entries = await prisma.housingPipelineEntry.findMany({
      where: {
        jurisdictionId,
        createdAt: { gte: startDate, lt: endDate },
      },
    });

    return {
      reportType: 'CDBG_ANNUAL',
      jurisdictionId,
      reportingYear: year,
      generatedAt: new Date().toISOString(),
      summary: {
        totalProjects: entries.length,
        totalUnitsProduced: entries.reduce((sum: number, e: any) => sum + (e.totalUnits || 0), 0),
        affordableUnits: entries.reduce((sum: number, e: any) => sum + (e.affordableUnits || 0), 0),
        marketRateUnits: entries.reduce((sum: number, e: any) => sum + ((e.totalUnits || 0) - (e.affordableUnits || 0)), 0),
        patternBookProjects: entries.filter((e: any) => e.usesPatternBook).length,
        grantFundedProjects: entries.filter((e: any) => e.grantFunding && e.grantFunding > 0).length,
        totalGrantFunding: entries.reduce((sum: number, e: any) => sum + (e.grantFunding || 0), 0),
      },
      byHousingType: entries.reduce((acc: Record<string, number>, e: any) => {
        acc[e.housingType] = (acc[e.housingType] || 0) + (e.totalUnits || 0);
        return acc;
      }, {}),
      entries: entries.map((e: any) => ({
        id: e.id,
        projectName: e.projectName,
        housingType: e.housingType,
        totalUnits: e.totalUnits,
        affordableUnits: e.affordableUnits,
        currentStage: e.currentStage,
        usesPatternBook: e.usesPatternBook,
        grantFunding: e.grantFunding,
      })),
    };
  }

  /**
   * Create or update a pipeline entry
   */
  async upsertPipelineEntry(data: {
    jurisdictionId: string;
    projectName: string;
    housingType: string;
    totalUnits: number;
    affordableUnits?: number;
    currentStage: string;
    usesPatternBook?: boolean;
    grantFunding?: number;
  }) {
    const prisma = prismaAny();
    return prisma.housingPipelineEntry.create({
      data: {
        ...data,
        affordableUnits: data.affordableUnits || 0,
        usesPatternBook: data.usesPatternBook || false,
        grantFunding: data.grantFunding || 0,
      },
    });
  }
}

export const housingDashboardService = new HousingDashboardService();
