/**
 * APP-13 EXTENSION: VISUAL TIMELINE SERVICE
 * Provides chronological project progression data from site visit photos,
 * progress analyses, and milestone events for the visual timeline UI.
 */

import { PrismaClient } from '@prisma/client';
import { getEventBus } from '../../../shared/events.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('qa-inspector');

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineEntry {
  id: string;
  date: string;                     // ISO date string
  type: 'visit' | 'milestone' | 'inspection' | 'progress';
  title: string;
  description: string;
  photos: TimelinePhoto[];
  phase?: string;
  progressPercent?: number;
  metadata?: Record<string, any>;
}

export interface TimelinePhoto {
  url: string;
  caption?: string;
  area?: string;
  thumbnail?: string;               // smaller version for timeline strip
}

export interface ProjectTimeline {
  projectId: string;
  projectName: string;
  startDate: string;
  currentPhase: string;
  overallProgress: number;
  entries: TimelineEntry[];
  totalPhotos: number;
  totalVisits: number;
}

export interface TimelineFilters {
  startDate?: Date;
  endDate?: Date;
  type?: ('visit' | 'milestone' | 'inspection' | 'progress')[];
  area?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// VISUAL TIMELINE SERVICE
// ============================================================================

export class VisualTimelineService {
  /**
   * Build the full visual timeline for a project
   */
  async getProjectTimeline(
    projectId: string,
    filters?: TimelineFilters
  ): Promise<ProjectTimeline> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        scheduledStartDate: true,
        currentPhase: true,
      },
    });

    // Gather all timeline entries from multiple sources
    const [visitEntries, milestoneEntries, inspectionEntries] = await Promise.all([
      this.getVisitEntries(projectId, filters),
      this.getMilestoneEntries(projectId, filters),
      this.getInspectionEntries(projectId, filters),
    ]);

    // Combine and sort chronologically
    let allEntries: TimelineEntry[] = [
      ...visitEntries,
      ...milestoneEntries,
      ...inspectionEntries,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply type filter if specified
    if (filters?.type && filters.type.length > 0) {
      allEntries = allEntries.filter(e => filters.type!.includes(e.type));
    }

    // Apply pagination
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paginatedEntries = allEntries.slice(offset, offset + limit);

    // Count totals
    const totalPhotos = allEntries.reduce((sum, e) => sum + e.photos.length, 0);
    const totalVisits = visitEntries.length;

    // Calculate latest progress
    const latestProgress = this.getLatestProgress(allEntries);

    return {
      projectId,
      projectName: project.name,
      startDate: (project.scheduledStartDate || new Date()).toISOString(),
      currentPhase: project.currentPhase || 'CONSTRUCTION',
      overallProgress: latestProgress,
      entries: paginatedEntries,
      totalPhotos,
      totalVisits,
    };
  }

  /**
   * Get timeline entries from site visits
   */
  private async getVisitEntries(
    projectId: string,
    filters?: TimelineFilters
  ): Promise<TimelineEntry[]> {
    const whereClause: any = {
      projectId,
      status: 'COMPLETED',
    };

    if (filters?.startDate || filters?.endDate) {
      whereClause.completedAt = {};
      if (filters.startDate) whereClause.completedAt.gte = filters.startDate;
      if (filters.endDate) whereClause.completedAt.lte = filters.endDate;
    }

    const visits = await prisma.siteVisit.findMany({
      where: whereClause,
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        type: true,
        purpose: true,
        notes: true,
        photos: true,
        findings: true,
        completedAt: true,
        scheduledAt: true,
      },
    });

    return visits.map((visit: any) => {
      const findings = visit.findings as any;
      const progressAnalysis = findings?.progressAnalysis;

      return {
        id: `visit-${visit.id}`,
        date: (visit.completedAt || visit.scheduledAt).toISOString(),
        type: 'visit' as const,
        title: `Site Visit: ${visit.type || 'Progress'}`,
        description: visit.notes || visit.purpose || 'Site visit completed',
        photos: (visit.photos || []).map((url: string, idx: number) => ({
          url,
          caption: `Visit photo ${idx + 1}`,
          area: progressAnalysis?.areaBreakdown?.[idx]?.area,
        })),
        phase: progressAnalysis?.phaseDetected,
        progressPercent: progressAnalysis?.overallProgressPercent,
        metadata: {
          visitId: visit.id,
          visitType: visit.type,
          stalledAreas: progressAnalysis?.stalledAreas,
          highlights: progressAnalysis?.highlights,
        },
      };
    });
  }

  /**
   * Get timeline entries from milestones
   */
  private async getMilestoneEntries(
    projectId: string,
    filters?: TimelineFilters
  ): Promise<TimelineEntry[]> {
    // Milestones are linked through contracts
    const contracts = await prisma.contractAgreement.findMany({
      where: { projectId },
      select: { id: true },
    });
    const contractIds = contracts.map((c: any) => c.id);

    if (contractIds.length === 0) return [];

    const whereClause: any = {
      contractId: { in: contractIds },
      status: 'COMPLETED',
    };

    const milestones = await prisma.milestone.findMany({
      where: whereClause,
      orderBy: { completedAt: 'desc' },
    });

    return milestones
      .filter((m: any) => m.completedAt)
      .map((milestone: any) => ({
        id: `milestone-${milestone.id}`,
        date: milestone.completedAt.toISOString(),
        type: 'milestone' as const,
        title: `Milestone: ${milestone.name || 'Milestone Completed'}`,
        description: milestone.description || `Milestone completed on ${milestone.completedAt.toLocaleDateString()}`,
        photos: [] as TimelinePhoto[],
        metadata: {
          milestoneId: milestone.id,
          amount: milestone.amount,
        },
      }));
  }

  /**
   * Get timeline entries from QA inspections
   */
  private async getInspectionEntries(
    projectId: string,
    filters?: TimelineFilters
  ): Promise<TimelineEntry[]> {
    const prismaAny = prisma as any;

    try {
      const whereClause: any = {
        projectId,
        status: { in: ['passed', 'failed'] },
      };

      if (filters?.startDate || filters?.endDate) {
        whereClause.completedAt = {};
        if (filters.startDate) whereClause.completedAt.gte = filters.startDate;
        if (filters.endDate) whereClause.completedAt.lte = filters.endDate;
      }

      const inspections = await prismaAny.qAInspection.findMany({
        where: whereClause,
        orderBy: { completedAt: 'desc' },
        include: {
          photos: { select: { url: true, location: true } },
        },
      });

      return inspections.map((inspection: any) => ({
        id: `inspection-${inspection.id}`,
        date: (inspection.completedAt || inspection.createdAt).toISOString(),
        type: 'inspection' as const,
        title: `QA Inspection: ${inspection.area} (${inspection.status.toUpperCase()})`,
        description: inspection.aiAnalysis?.overallAssessment || `${inspection.trade} inspection ${inspection.status}`,
        photos: (inspection.photos || []).map((p: any) => ({
          url: p.url,
          area: p.location,
          caption: `${inspection.trade} - ${p.location}`,
        })),
        phase: inspection.trade,
        progressPercent: inspection.score,
        metadata: {
          inspectionId: inspection.id,
          trade: inspection.trade,
          score: inspection.score,
          status: inspection.status,
        },
      }));
    } catch {
      // QA Inspection model may not exist in Prisma yet — return empty
      return [];
    }
  }

  /**
   * Extract the latest progress percentage from timeline entries
   */
  private getLatestProgress(entries: TimelineEntry[]): number {
    for (const entry of entries) {
      if (entry.progressPercent !== undefined && entry.progressPercent > 0) {
        return entry.progressPercent;
      }
    }
    return 0;
  }

  /**
   * Get photos grouped by area for the photo gallery view
   */
  async getPhotosByArea(projectId: string): Promise<Record<string, TimelinePhoto[]>> {
    const timeline = await this.getProjectTimeline(projectId, { limit: 200 });
    const byArea: Record<string, TimelinePhoto[]> = {};

    for (const entry of timeline.entries) {
      for (const photo of entry.photos) {
        const area = photo.area || 'General';
        if (!byArea[area]) byArea[area] = [];
        byArea[area].push({
          ...photo,
          caption: photo.caption || `${entry.title} - ${entry.date}`,
        });
      }
    }

    return byArea;
  }
}

export const visualTimelineService = new VisualTimelineService();
