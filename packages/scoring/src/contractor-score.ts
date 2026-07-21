/**
 * Contractor Reliability Scoring Service
 *
 * Scores contractors on measurable behaviors that correlate with quality.
 * New contractors start at 50 (neutral) across all components.
 * Scores improve from day one as data points accumulate.
 */

import { PrismaClient } from '@prisma/client';
import type {
  ConfidenceLevel,
  ContractorScoreResult,
  ScoreEvent,
  LeaderboardEntry,
  LeaderboardFilters,
} from './types.js';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// ============================================================================
// WEIGHTS — How much each component contributes to the overall score
// ============================================================================

const WEIGHTS = {
  responsiveness: 0.15,
  uploadCompliance: 0.10,
  bidAccuracy: 0.15,
  scheduleAdherence: 0.20, // Highest: finishing on time matters most
  quality: 0.20, // Tied highest: QA results
  clientSatisfaction: 0.15,
  safety: 0.05,
} as const;

// ============================================================================
// SCORING RULES
// ============================================================================

function scoreResponseTime(hours: number): number {
  if (hours < 4) return 100;
  if (hours < 12) return 85;
  if (hours < 24) return 70;
  if (hours < 48) return 50;
  return 30;
}

function scoreBidAccuracy(differencePercent: number, isUnderBid: boolean): number {
  // Penalize under-bidding (cost overruns) more than over-bidding
  const adjustedDiff = isUnderBid ? differencePercent * 1.5 : differencePercent;

  if (adjustedDiff < 5) return 100;
  if (adjustedDiff < 10) return 85;
  if (adjustedDiff < 15) return 70;
  if (adjustedDiff < 25) return 50;
  return 30;
}

function scoreScheduleAdherence(onTimePercent: number, avgDaysLate: number): number {
  // Base score from on-time percentage
  let score = onTimePercent;

  // Penalty for days late
  if (avgDaysLate > 0 && avgDaysLate <= 3) {
    score -= avgDaysLate * 5;
  } else if (avgDaysLate > 3 && avgDaysLate <= 7) {
    score -= 15 + (avgDaysLate - 3) * 8;
  } else if (avgDaysLate > 7) {
    score -= 47 + (avgDaysLate - 7) * 10;
  }

  // Bonus for early completion (negative avgDaysLate means early)
  if (avgDaysLate < 0) {
    score += Math.min(15, Math.abs(avgDaysLate) * 5);
  }

  return Math.max(0, Math.min(100, score));
}

function scoreQuality(passRate: number, criticalFailures: number): number {
  // Base score from first-time pass rate
  let score: number;
  if (passRate >= 100) score = 100;
  else if (passRate >= 90) score = 85;
  else if (passRate >= 80) score = 70;
  else if (passRate >= 70) score = 50;
  else score = 30;

  // Critical failures count 3x
  score -= criticalFailures * 15;

  return Math.max(0, Math.min(100, score));
}

function scoreClientSatisfaction(avgRating: number, reviewCount: number): number {
  if (reviewCount === 0) return 50; // Neutral for new contractors

  // Map 1-5 stars to 0-100
  const baseScore = ((avgRating - 1) / 4) * 100;

  // Slight confidence boost for more reviews
  const reviewBonus = Math.min(5, reviewCount * 0.5);

  return Math.max(0, Math.min(100, baseScore + reviewBonus));
}

function scoreSafety(violationCount: number): number {
  if (violationCount === 0) return 100;
  if (violationCount === 1) return 85;
  if (violationCount <= 3) return 60;
  return 30;
}

function determineConfidence(dataPoints: number): ConfidenceLevel {
  if (dataPoints <= 5) return 'low';
  if (dataPoints <= 15) return 'medium';
  return 'high';
}

// ============================================================================
// CONTRACTOR SCORING SERVICE
// ============================================================================

export class ContractorScoringService {
  /**
   * Full recalculation of a contractor's score from all data sources
   */
  async calculateScore(contractorId: string): Promise<ContractorScoreResult> {
    let totalDataPoints = 0;

    // ── Responsiveness Score ──────────────────────────────
    const bids = await prisma.bidSubmission.findMany({
      where: { contractorId },
      select: { submittedAt: true, createdAt: true },
    });

    let responsivenessScore = 50;
    let avgBidResponseTimeHours: number | null = null;
    if (bids.length > 0) {
      const responseTimes = bids
        .filter(b => b.submittedAt && b.createdAt)
        .map(b => {
          const diff = new Date(b.submittedAt!).getTime() - new Date(b.createdAt).getTime();
          return diff / (1000 * 60 * 60); // hours
        });

      if (responseTimes.length > 0) {
        avgBidResponseTimeHours = Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        );
        responsivenessScore = scoreResponseTime(avgBidResponseTimeHours);
        totalDataPoints += responseTimes.length;
      }
    }

    // ── Upload Compliance Score ───────────────────────────
    // Check photo uploads per site visit and receipt uploads
    let uploadComplianceScore = 50;
    const visits = await prismaAny.siteVisit?.findMany?.({
      where: { contractor: { id: contractorId } },
      select: { id: true },
    }) || [];
    const photoUploads = await prismaAny.fileUpload?.count?.({
      where: {
        uploadedById: contractorId,
        category: { in: ['SITE_PHOTO', 'PROGRESS_PHOTO'] },
      },
    }) || 0;

    if (visits.length > 0) {
      const uploadRate = Math.min(100, (photoUploads / visits.length) * 100);
      uploadComplianceScore = Math.round(uploadRate);
      totalDataPoints += visits.length;
    }

    // ── Bid Accuracy Score ───────────────────────────────
    let bidAccuracyScore = 50;
    const completedProjects = await prismaAny.contractorProject.findMany({
      where: { contractorId, status: 'COMPLETED' },
      select: { contractValue: true, actualCost: true },
    });

    if (completedProjects.length > 0) {
      const accuracies = (completedProjects as any[])
        .filter((p: any) => p.contractValue && p.actualCost)
        .map((p: any) => {
          const bid = Number(p.contractValue);
          const actual = Number(p.actualCost);
          const diff = Math.abs(bid - actual) / bid * 100;
          const isUnderBid = actual > bid;
          return scoreBidAccuracy(diff, isUnderBid);
        });

      if (accuracies.length > 0) {
        bidAccuracyScore = Math.round(
          accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length
        );
        totalDataPoints += accuracies.length;
      }
    }

    // ── Schedule Adherence Score ──────────────────────────
    let scheduleAdherenceScore = 50;
    const milestones = await prismaAny.contractorProject?.findMany?.({
      where: { contractorId, status: 'COMPLETED' },
      select: { scheduledEndDate: true, actualEndDate: true, completedAt: true },
    }) || [];

    if (milestones.length > 0) {
      let onTimeCount = 0;
      let totalDaysLate = 0;
      let countedMilestones = 0;

      for (const m of milestones) {
        const scheduled = m.scheduledEndDate ? new Date(m.scheduledEndDate) : null;
        const actual = m.completedAt ? new Date(m.completedAt) : (m.actualEndDate ? new Date(m.actualEndDate) : null);

        if (scheduled && actual) {
          const daysLate = Math.ceil((actual.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLate <= 0) onTimeCount++;
          totalDaysLate += daysLate;
          countedMilestones++;
        }
      }

      if (countedMilestones > 0) {
        const onTimePercent = (onTimeCount / countedMilestones) * 100;
        const avgDaysLate = totalDaysLate / countedMilestones;
        scheduleAdherenceScore = scoreScheduleAdherence(onTimePercent, avgDaysLate);
        totalDataPoints += countedMilestones;
      }
    }

    // ── Quality Score ────────────────────────────────────
    let qualityScore = 50;
    const inspections = await prismaAny.qAInspection?.findMany?.({
      where: {
        // Find inspections linked to this contractor's projects
        status: { in: ['passed', 'failed'] },
      },
      select: { status: true, findings: true, score: true },
    }) || [];

    if (inspections.length > 0) {
      const passedFirst = inspections.filter((i: any) => i.status === 'passed').length;
      const passRate = (passedFirst / inspections.length) * 100;
      const criticalFindings = inspections
        .flatMap((i: any) => i.findings || [])
        .filter((f: any) => f.severity === 'critical').length;

      qualityScore = scoreQuality(passRate, criticalFindings);
      totalDataPoints += inspections.length;
    }

    // ── Client Satisfaction Score ─────────────────────────
    let clientSatisfactionScore = 50;
    const reviews = await prisma.contractorReview.findMany({
      where: { contractorId },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
      clientSatisfactionScore = scoreClientSatisfaction(avgRating, reviews.length);
      totalDataPoints += reviews.length;
    }

    // ── Safety Score ─────────────────────────────────────
    let safetyScore = 50;
    const safetyFindings = await prismaAny.qAFinding?.count?.({
      where: {
        category: { contains: 'safety', mode: 'insensitive' },
        status: { not: 'resolved' },
      },
    }) || 0;

    if (safetyFindings >= 0) {
      safetyScore = scoreSafety(safetyFindings);
      totalDataPoints += 1; // Safety is checked as aggregate
    }

    // ── Calculate Overall Score ──────────────────────────
    const overallScore = Math.round(
      responsivenessScore * WEIGHTS.responsiveness +
      uploadComplianceScore * WEIGHTS.uploadCompliance +
      bidAccuracyScore * WEIGHTS.bidAccuracy +
      scheduleAdherenceScore * WEIGHTS.scheduleAdherence +
      qualityScore * WEIGHTS.quality +
      clientSatisfactionScore * WEIGHTS.clientSatisfaction +
      safetyScore * WEIGHTS.safety
    );

    const confidence = determineConfidence(totalDataPoints);

    // ── Upsert the score record ──────────────────────────
    await prismaAny.contractorScore.upsert({
      where: { contractorId },
      create: {
        contractorId,
        responsivenessScore,
        uploadComplianceScore,
        bidAccuracyScore,
        scheduleAdherenceScore,
        qualityScore,
        clientSatisfactionScore,
        safetyScore,
        overallScore,
        projectsCompleted: completedProjects.length,
        totalBidsSubmitted: bids.length,
        avgBidResponseTime: avgBidResponseTimeHours,
        dataPoints: totalDataPoints,
        confidence,
        lastCalculated: new Date(),
      },
      update: {
        responsivenessScore,
        uploadComplianceScore,
        bidAccuracyScore,
        scheduleAdherenceScore,
        qualityScore,
        clientSatisfactionScore,
        safetyScore,
        overallScore,
        projectsCompleted: completedProjects.length,
        totalBidsSubmitted: bids.length,
        avgBidResponseTime: avgBidResponseTimeHours,
        dataPoints: totalDataPoints,
        confidence,
        lastCalculated: new Date(),
      },
    });

    return {
      contractorId,
      overallScore,
      confidence,
      components: {
        responsiveness: { name: 'Responsiveness', score: responsivenessScore, weight: WEIGHTS.responsiveness, dataPoints: bids.length },
        uploadCompliance: { name: 'Upload Compliance', score: uploadComplianceScore, weight: WEIGHTS.uploadCompliance, dataPoints: visits.length },
        bidAccuracy: { name: 'Bid Accuracy', score: bidAccuracyScore, weight: WEIGHTS.bidAccuracy, dataPoints: completedProjects.length },
        scheduleAdherence: { name: 'Schedule Adherence', score: scheduleAdherenceScore, weight: WEIGHTS.scheduleAdherence, dataPoints: milestones.length },
        quality: { name: 'Quality', score: qualityScore, weight: WEIGHTS.quality, dataPoints: inspections.length },
        clientSatisfaction: { name: 'Client Satisfaction', score: clientSatisfactionScore, weight: WEIGHTS.clientSatisfaction, dataPoints: reviews.length },
        safety: { name: 'Safety', score: safetyScore, weight: WEIGHTS.safety, dataPoints: 1 },
      },
      metadata: {
        projectsCompleted: completedProjects.length,
        totalBidsSubmitted: bids.length,
        avgBidResponseTime: avgBidResponseTimeHours,
        dataPoints: totalDataPoints,
        lastCalculated: new Date(),
      },
    };
  }

  /**
   * Incrementally update a component score from a single event
   */
  async updateFromEvent(event: ScoreEvent): Promise<void> {
    const existing = await prismaAny.contractorScore.findUnique({
      where: { contractorId: event.contractorId },
    });

    if (!existing) {
      // No existing score — run full calculation
      await this.calculateScore(event.contractorId);
      return;
    }

    const updates: Record<string, unknown> = {};

    switch (event.type) {
      case 'bid_submitted': {
        const responseTimeHours = Number(event.data.responseTimeHours || 24);
        // Weighted running average with existing score
        const newScore = Math.round(
          (existing.responsivenessScore * 0.7) + (scoreResponseTime(responseTimeHours) * 0.3)
        );
        updates.responsivenessScore = newScore;
        updates.totalBidsSubmitted = existing.totalBidsSubmitted + 1;
        updates.avgBidResponseTime = existing.avgBidResponseTime
          ? Math.round((existing.avgBidResponseTime + responseTimeHours) / 2)
          : Math.round(responseTimeHours);
        break;
      }

      case 'milestone_completed': {
        const daysLate = Number(event.data.daysLate || 0);
        const milestoneScore = daysLate <= 0 ? 100 : scoreScheduleAdherence(80, daysLate);
        updates.scheduleAdherenceScore = Math.round(
          (existing.scheduleAdherenceScore * 0.7) + (milestoneScore * 0.3)
        );
        break;
      }

      case 'qa_result': {
        const passed = Boolean(event.data.passed);
        const severity = event.data.severity as string | undefined;
        const qaScore = passed ? 90 : (severity === 'critical' ? 30 : 55);
        updates.qualityScore = Math.round(
          (existing.qualityScore * 0.7) + (qaScore * 0.3)
        );

        // Update safety if safety-related
        if (event.data.safetyViolation) {
          updates.safetyScore = Math.max(30, existing.safetyScore - 15);
        }
        break;
      }

      case 'review_received': {
        const rating = Number(event.data.rating || 3);
        const reviewScore = scoreClientSatisfaction(rating, existing.dataPoints);
        updates.clientSatisfactionScore = Math.round(
          (existing.clientSatisfactionScore * 0.7) + (reviewScore * 0.3)
        );
        break;
      }

      case 'photo_uploaded': {
        // Uploading photos is always good — nudge score up
        updates.uploadComplianceScore = Math.min(100,
          Math.round(existing.uploadComplianceScore * 0.9 + 100 * 0.1)
        );
        break;
      }

      case 'message_replied': {
        const replyTimeHours = Number(event.data.replyTimeHours || 12);
        const replyScore = scoreResponseTime(replyTimeHours);
        updates.responsivenessScore = Math.round(
          (existing.responsivenessScore * 0.8) + (replyScore * 0.2)
        );
        break;
      }
    }

    // Recalculate overall score
    const updatedScores = {
      responsivenessScore: (updates.responsivenessScore ?? existing.responsivenessScore) as number,
      uploadComplianceScore: (updates.uploadComplianceScore ?? existing.uploadComplianceScore) as number,
      bidAccuracyScore: (updates.bidAccuracyScore ?? existing.bidAccuracyScore) as number,
      scheduleAdherenceScore: (updates.scheduleAdherenceScore ?? existing.scheduleAdherenceScore) as number,
      qualityScore: (updates.qualityScore ?? existing.qualityScore) as number,
      clientSatisfactionScore: (updates.clientSatisfactionScore ?? existing.clientSatisfactionScore) as number,
      safetyScore: (updates.safetyScore ?? existing.safetyScore) as number,
    };

    updates.overallScore = Math.round(
      updatedScores.responsivenessScore * WEIGHTS.responsiveness +
      updatedScores.uploadComplianceScore * WEIGHTS.uploadCompliance +
      updatedScores.bidAccuracyScore * WEIGHTS.bidAccuracy +
      updatedScores.scheduleAdherenceScore * WEIGHTS.scheduleAdherence +
      updatedScores.qualityScore * WEIGHTS.quality +
      updatedScores.clientSatisfactionScore * WEIGHTS.clientSatisfaction +
      updatedScores.safetyScore * WEIGHTS.safety
    );

    updates.dataPoints = existing.dataPoints + 1;
    updates.confidence = determineConfidence(updates.dataPoints as number);
    updates.lastCalculated = new Date();

    await prismaAny.contractorScore.update({
      where: { contractorId: event.contractorId },
      data: updates,
    });
  }

  /**
   * Weekly cron: full recalculation for all contractors + stale score decay
   */
  async recalculateAll(): Promise<{ updated: number; decayed: number }> {
    const contractors = await prisma.contractor.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    let updated = 0;
    let decayed = 0;

    for (const contractor of contractors) {
      try {
        const existingScore = await prismaAny.contractorScore.findUnique({
          where: { contractorId: contractor.id },
        });

        // Apply decay: if no data in 90 days, slowly trend scores toward 50
        if (existingScore) {
          const daysSinceUpdate = Math.ceil(
            (Date.now() - new Date(existingScore.lastCalculated).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceUpdate > 90) {
            // Decay: move 5% toward 50 per 30 days of inactivity
            const decayFactor = Math.min(0.2, (daysSinceUpdate - 90) / 600);
            const decay = (score: number) => Math.round(score + (50 - score) * decayFactor);

            await prismaAny.contractorScore.update({
              where: { contractorId: contractor.id },
              data: {
                responsivenessScore: decay(existingScore.responsivenessScore),
                uploadComplianceScore: decay(existingScore.uploadComplianceScore),
                bidAccuracyScore: decay(existingScore.bidAccuracyScore),
                scheduleAdherenceScore: decay(existingScore.scheduleAdherenceScore),
                qualityScore: decay(existingScore.qualityScore),
                clientSatisfactionScore: decay(existingScore.clientSatisfactionScore),
                safetyScore: decay(existingScore.safetyScore),
                overallScore: decay(existingScore.overallScore),
                lastCalculated: new Date(),
              },
            });
            decayed++;
            continue;
          }
        }

        await this.calculateScore(contractor.id);
        updated++;
      } catch (err) {
        console.error(`[Scoring] Failed to recalculate score for contractor ${contractor.id}:`, err);
      }
    }

    return { updated, decayed };
  }

  /**
   * Get a contractor's current score
   */
  async getScore(contractorId: string): Promise<ContractorScoreResult | null> {
    const score = await prismaAny.contractorScore.findUnique({
      where: { contractorId },
    });

    if (!score) return null;

    return {
      contractorId,
      overallScore: score.overallScore,
      confidence: score.confidence as ConfidenceLevel,
      components: {
        responsiveness: { name: 'Responsiveness', score: score.responsivenessScore, weight: WEIGHTS.responsiveness, dataPoints: 0 },
        uploadCompliance: { name: 'Upload Compliance', score: score.uploadComplianceScore, weight: WEIGHTS.uploadCompliance, dataPoints: 0 },
        bidAccuracy: { name: 'Bid Accuracy', score: score.bidAccuracyScore, weight: WEIGHTS.bidAccuracy, dataPoints: 0 },
        scheduleAdherence: { name: 'Schedule Adherence', score: score.scheduleAdherenceScore, weight: WEIGHTS.scheduleAdherence, dataPoints: 0 },
        quality: { name: 'Quality', score: score.qualityScore, weight: WEIGHTS.quality, dataPoints: 0 },
        clientSatisfaction: { name: 'Client Satisfaction', score: score.clientSatisfactionScore, weight: WEIGHTS.clientSatisfaction, dataPoints: 0 },
        safety: { name: 'Safety', score: score.safetyScore, weight: WEIGHTS.safety, dataPoints: 0 },
      },
      metadata: {
        projectsCompleted: score.projectsCompleted,
        totalBidsSubmitted: score.totalBidsSubmitted,
        avgBidResponseTime: score.avgBidResponseTime,
        dataPoints: score.dataPoints,
        lastCalculated: score.lastCalculated,
      },
    };
  }

  /**
   * Get contractor leaderboard with filters
   */
  async getLeaderboard(filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    const where: Record<string, unknown> = {};

    if (filters?.minScore) {
      where.overallScore = { gte: filters.minScore };
    }
    if (filters?.confidence) {
      where.confidence = filters.confidence;
    }

    const scores = await prismaAny.contractorScore.findMany({
      where,
      include: {
        contractor: {
          select: {
            id: true,
            companyName: true,
            trades: true,
            state: true,
          },
        },
      },
      orderBy: { overallScore: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return scores
      .filter((s: any) => {
        if (filters?.trade) {
          return s.contractor.trades.some((t: string) =>
            t.toLowerCase().includes(filters.trade!.toLowerCase())
          );
        }
        if (filters?.region) {
          return s.contractor.state?.toLowerCase() === filters.region.toLowerCase();
        }
        return true;
      })
      .map((s: any) => ({
        contractorId: s.contractorId,
        companyName: s.contractor.companyName,
        trades: s.contractor.trades,
        overallScore: s.overallScore,
        confidence: s.confidence as ConfidenceLevel,
        projectsCompleted: s.projectsCompleted,
        topComponents: [
          { name: 'On-Time', score: s.scheduleAdherenceScore },
          { name: 'Quality', score: s.qualityScore },
          { name: 'Responsiveness', score: s.responsivenessScore },
        ].sort((a, b) => b.score - a.score),
      }));
  }
}
