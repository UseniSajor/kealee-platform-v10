import { PrismaClient } from '@prisma/client';
import { generateJSON } from '../../infrastructure/ai.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-05';

const PERMIT_REVIEW_PROMPT =
  'You are a permit review specialist. Review this construction permit ' +
  'application for completeness and compliance. Check for: missing information, ' +
  'code compliance issues, common rejection reasons. Score 0-100 and list specific ' +
  'issues to fix before submission. Be thorough but practical.';

interface AIReviewResult {
  score: number;
  issues: Array<{
    field: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    suggestion: string;
  }>;
  recommendation: string;
  readyToSubmit: boolean;
}

export class PermitTrackerService {
  // -----------------------------------------------------------------------
  // aiReviewApplication
  // -----------------------------------------------------------------------

  async aiReviewApplication(permitId: string): Promise<AIReviewResult> {
    const permit = await prisma.permit.findUniqueOrThrow({
      where: { id: permitId },
      include: {
        project: true,
        jurisdiction: true,
      },
    });

    // Build permit details for AI review
    const permitDetails =
      `PERMIT APPLICATION REVIEW\n\n` +
      `Type: ${permit.permitType}\n` +
      `Subtype: ${permit.subtype ?? 'N/A'}\n` +
      `Jurisdiction: ${permit.jurisdictionId}\n` +
      `Address: ${permit.address}\n` +
      `Parcel: ${permit.parcelNumber ?? 'N/A'}\n` +
      `Zoning: ${permit.zoning ?? 'N/A'}\n` +
      `Valuation: $${Number(permit.valuation).toLocaleString()}\n` +
      `Square Footage: ${permit.squareFootage ?? 'N/A'}\n` +
      `Scope: ${permit.scope}\n\n` +
      `Applicant: ${permit.applicantName} (${permit.applicantType})\n` +
      `Applicant Email: ${permit.applicantEmail}\n` +
      `Applicant Phone: ${permit.applicantPhone}\n\n` +
      `Architect: ${permit.architectName ?? 'None'} (License: ${permit.architectLicense ?? 'N/A'})\n` +
      `Engineer: ${permit.engineerName ?? 'None'} (License: ${permit.engineerLicense ?? 'N/A'})\n` +
      `Contractor: ${permit.contractorName ?? 'None'} (License: ${permit.contractorLicense ?? 'N/A'})\n\n` +
      `Current Status: ${permit.kealeeStatus}\n` +
      `Ready to Submit: ${permit.readyToSubmit}\n\n` +
      `Respond with JSON: { "score": number (0-100), "issues": [{ "field": string, ` +
      `"severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "description": string, ` +
      `"suggestion": string }], "recommendation": string, "readyToSubmit": boolean }`;

    let reviewResult: AIReviewResult;
    try {
      const result = await generateJSON<AIReviewResult>({
        systemPrompt: PERMIT_REVIEW_PROMPT,
        userPrompt: permitDetails,
        maxTokens: 2000,
      });
      reviewResult = result.data;
    } catch (err) {
      console.error('[PermitTracker] AI review failed:', (err as Error).message);
      reviewResult = {
        score: 0,
        issues: [
          {
            field: 'general',
            severity: 'HIGH',
            description: 'AI review could not be completed',
            suggestion: 'Manual review required',
          },
        ],
        recommendation: 'Manual review required - AI review failed',
        readyToSubmit: false,
      };
    }

    // Update permit with review results
    await prisma.permit.update({
      where: { id: permitId },
      data: {
        aiReviewScore: reviewResult.score,
        aiIssuesFound: reviewResult.issues as any,
        readyToSubmit: reviewResult.readyToSubmit,
        kealeeStatus: reviewResult.score >= 80 ? 'READY_TO_SUBMIT' : 'AI_PRE_REVIEW',
        status: reviewResult.score >= 80 ? 'READY_TO_SUBMIT' : 'AI_PRE_REVIEW',
      },
    });

    // If score is low, flag for PM
    if (reviewResult.score < 80) {
      const pmId = permit.pmUserId;
      await prisma.decisionQueue.create({
        data: {
          projectId: permit.projectId,
          pmId,
          type: 'permit_review',
          title: `Permit ${permit.permitNumber ?? permitId} needs attention (Score: ${reviewResult.score})`,
          context: {
            permitId,
            permitType: permit.permitType,
            score: reviewResult.score,
            issueCount: reviewResult.issues.length,
            criticalIssues: reviewResult.issues.filter(
              (i) => i.severity === 'CRITICAL',
            ).length,
          },
          aiRecommendation: reviewResult.recommendation,
          options: [
            { action: 'fix_and_resubmit', label: 'Fix Issues & Resubmit' },
            { action: 'submit_anyway', label: 'Submit As-Is' },
            { action: 'defer', label: 'Defer Review' },
          ],
        },
      });

      await eventBus.publish(
        EVENT_TYPES.DECISION_NEEDED,
        {
          permitId,
          type: 'permit_review',
          score: reviewResult.score,
          issueCount: reviewResult.issues.length,
        },
        SOURCE_APP,
        { projectId: permit.projectId },
      );
    }

    return reviewResult;
  }

  // -----------------------------------------------------------------------
  // checkPermitStatus
  // -----------------------------------------------------------------------

  async checkPermitStatus(permitId: string): Promise<void> {
    const permit = await prisma.permit.findUniqueOrThrow({
      where: { id: permitId },
    });

    // Check expiration approaching (30/60/90 day warnings)
    if (permit.expiresAt) {
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (permit.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
        const severity =
          daysUntilExpiry <= 30 ? 'CRITICAL' : daysUntilExpiry <= 60 ? 'HIGH' : 'MEDIUM';

        await eventBus.publish(
          EVENT_TYPES.DECISION_NEEDED,
          {
            type: 'permit_expiration',
            permitId,
            permitNumber: permit.permitNumber,
            expiresAt: permit.expiresAt.toISOString(),
            daysUntilExpiry,
            severity,
          },
          SOURCE_APP,
          { projectId: permit.projectId },
        );
      }
    }

    // In a production system, this would call the jurisdiction API
    // to check for status updates. For now, log the check.
    console.log(
      `[PermitTracker] Status check for ${permit.permitNumber ?? permitId}: ${permit.kealeeStatus}`,
    );
  }

  // -----------------------------------------------------------------------
  // checkAllPermitExpirations
  // -----------------------------------------------------------------------

  async checkAllPermitExpirations(): Promise<number> {
    const now = new Date();
    const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiringPermits = await prisma.permit.findMany({
      where: {
        expiresAt: { gte: now, lte: ninetyDaysOut },
        kealeeStatus: { in: ['APPROVED', 'ISSUED', 'ACTIVE'] },
      },
      include: { project: true },
    });

    for (const permit of expiringPermits) {
      const daysUntilExpiry = Math.ceil(
        (permit.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      await eventBus.publish(
        EVENT_TYPES.DECISION_NEEDED,
        {
          type: 'permit_expiration',
          permitId: permit.id,
          permitNumber: permit.permitNumber,
          projectId: permit.projectId,
          projectName: permit.project.name,
          expiresAt: permit.expiresAt!.toISOString(),
          daysUntilExpiry,
          severity:
            daysUntilExpiry <= 30 ? 'CRITICAL' : daysUntilExpiry <= 60 ? 'HIGH' : 'MEDIUM',
        },
        SOURCE_APP,
        { projectId: permit.projectId },
      );
    }

    return expiringPermits.length;
  }

  // -----------------------------------------------------------------------
  // checkSubmittedPermits
  // -----------------------------------------------------------------------

  async checkSubmittedPermits(): Promise<number> {
    const submittedPermits = await prisma.permit.findMany({
      where: {
        kealeeStatus: { in: ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'] },
      },
    });

    for (const permit of submittedPermits) {
      await this.checkPermitStatus(permit.id);
    }

    return submittedPermits.length;
  }
}
