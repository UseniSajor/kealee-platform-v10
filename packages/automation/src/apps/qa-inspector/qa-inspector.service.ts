import { PrismaClient } from '@prisma/client';
import { analyzeImageJSON } from '../../infrastructure/ai.js';
import { AI_PROMPTS } from '../../infrastructure/ai-prompts.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { addJob, createQueue, QUEUE_NAMES } from '../../infrastructure/queues.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-13';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface QAIssue {
  type: 'defect' | 'safety' | 'code_violation' | 'quality' | 'incomplete';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  description: string;
  correction: string;
  codeReference?: string;
}

interface QAResult {
  overallScore: number;
  issues: QAIssue[];
  positiveObservations: string[];
  phaseProgress: 'on_track' | 'behind' | 'ahead';
  confidence: number;
}

interface AnalyzePhotoOpts {
  photoUrl: string;
  projectId: string;
  siteVisitId?: string;
  projectPhase: string;
  projectType: string;
}

/** Map severity to QualityIssue schema severity. */
const SEVERITY_MAP: Record<string, string> = {
  LOW: 'MINOR',
  MEDIUM: 'MODERATE',
  HIGH: 'MAJOR',
  CRITICAL: 'CRITICAL',
};

/** Map issue type to QualityIssue schema type. */
const TYPE_MAP: Record<string, string> = {
  defect: 'WORKMANSHIP',
  safety: 'SAFETY',
  code_violation: 'CODE_VIOLATION',
  quality: 'WORKMANSHIP',
  incomplete: 'WORKMANSHIP',
};

/**
 * Phase-specific expectations that help Claude focus its analysis.
 */
const PHASE_EXPECTATIONS: Record<string, string> = {
  PRE_CONSTRUCTION: 'Site should be cleared and prepped. Check for proper layout stakes, erosion control, and site protection.',
  SITE_PREPARATION: 'Expect grading, trenching, utility stubs. Check compaction, proper slopes, erosion control.',
  FOUNDATION: 'Look for rebar spacing, form alignment, anchor bolt placement, waterproofing, drainage tile.',
  FRAMING: 'Check stud spacing, header sizes, nailing patterns, sheathing fastening, window/door rough openings.',
  ROUGH_IN: 'Inspect plumbing DWV layout, electrical wire runs/boxes, HVAC ductwork sealing, fire blocking.',
  INSULATION: 'Verify insulation coverage, no gaps/compression, vapor barrier continuity, R-values per spec.',
  DRYWALL: 'Check for smooth finish, no nail pops, even joints, proper corner beads.',
  EXTERIOR: 'Inspect siding installation, flashing details, caulking, roofing material application.',
  INTERIOR_FINISHES: 'Look for paint quality, trim alignment, flooring transitions, cabinet/counter fit, hardware.',
  MEP_FINISH: 'Verify outlet/switch alignment, fixture installation, HVAC register placement, plumbing fixture function.',
  FINAL_INSPECTION: 'Comprehensive check — everything should be complete, clean, and defect-free.',
  CLOSEOUT: 'Final walkthrough quality. All punch items should be resolved.',
};

/**
 * Infer image media type from URL extension.
 */
function inferMediaType(url: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = url.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg'; // Default to JPEG
}

// -----------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------

export class QAInspectorService {
  // -----------------------------------------------------------------------
  // analyzePhoto
  // -----------------------------------------------------------------------

  async analyzePhoto(opts: AnalyzePhotoOpts): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: opts.projectId },
      select: {
        id: true,
        name: true,
        status: true,
        currentPhase: true,
        pmId: true,
        city: true,
        state: true,
      },
    });

    // Build phase-aware context
    const phaseKey = opts.projectPhase.toUpperCase().replace(/[\s-]/g, '_');
    const phaseExpectation =
      PHASE_EXPECTATIONS[phaseKey] ??
      `Current phase: ${opts.projectPhase}. Inspect for quality, safety, and code compliance.`;

    const userPrompt =
      `Analyze this construction site photo and identify any issues.\n\n` +
      `PROJECT CONTEXT:\n` +
      `- Project: ${project.name ?? 'Construction project'}\n` +
      `- Type: ${opts.projectType}\n` +
      `- Current phase: ${opts.projectPhase}\n` +
      `- Location: ${[project.city, project.state].filter(Boolean).join(', ') || 'N/A'}\n\n` +
      `PHASE EXPECTATIONS:\n${phaseExpectation}\n\n` +
      `Return a JSON object with:\n` +
      `- overallScore: 0-100 quality score\n` +
      `- issues: array of {type ("defect"|"safety"|"code_violation"|"quality"|"incomplete"), ` +
      `severity ("LOW"|"MEDIUM"|"HIGH"|"CRITICAL"), location, description, correction, codeReference?}\n` +
      `- positiveObservations: string array of things that look good\n` +
      `- phaseProgress: "on_track" | "behind" | "ahead"\n` +
      `- confidence: 0.0-1.0 how confident you are in the analysis`;

    // Call Claude Vision API
    let qaResult: QAResult;
    try {
      const result = await analyzeImageJSON<QAResult>({
        imageUrl: opts.photoUrl,
        mediaType: inferMediaType(opts.photoUrl),
        systemPrompt: AI_PROMPTS.QA_INSPECTOR,
        userPrompt,
      });
      qaResult = result.data;
    } catch (err) {
      console.error(
        `[QAInspector] Vision analysis failed for ${opts.photoUrl}:`,
        (err as Error).message,
      );
      // Create a record noting the failure
      const failedResult = await prisma.qAInspectionResult.create({
        data: {
          projectId: opts.projectId,
          siteVisitId: opts.siteVisitId,
          photoUrl: opts.photoUrl,
          analysisResult: { error: (err as Error).message },
          overallScore: null,
        },
      });
      return failedResult.id;
    }

    // Validate and clamp score
    const overallScore = Math.min(100, Math.max(0, qaResult.overallScore ?? 50));
    const issues = Array.isArray(qaResult.issues) ? qaResult.issues : [];

    // Create QAInspectionResult record
    const qaRecord = await prisma.qAInspectionResult.create({
      data: {
        projectId: opts.projectId,
        siteVisitId: opts.siteVisitId,
        photoUrl: opts.photoUrl,
        analysisResult: {
          overallScore,
          positiveObservations: qaResult.positiveObservations ?? [],
          phaseProgress: qaResult.phaseProgress ?? 'on_track',
          confidence: qaResult.confidence ?? 0.5,
          phase: opts.projectPhase,
          projectType: opts.projectType,
        },
        issuesFound: issues as any,
        overallScore,
      },
    });

    // Track IDs of critical/high issues for punch list generation
    const criticalHighIds: string[] = [];

    // Process each issue
    for (const issue of issues) {
      const severity = (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(issue.severity)
        ? issue.severity
        : 'MEDIUM') as QAIssue['severity'];

      // Create QualityIssue record
      const qualityIssue = await prisma.qualityIssue.create({
        data: {
          projectId: opts.projectId,
          type: TYPE_MAP[issue.type] ?? 'WORKMANSHIP',
          severity: SEVERITY_MAP[severity] ?? 'MODERATE',
          status: 'OPEN',
          title: `${issue.type}: ${issue.description.substring(0, 80)}`,
          description:
            `${issue.description}\n\n` +
            `Location: ${issue.location}\n` +
            `Correction: ${issue.correction}` +
            (issue.codeReference ? `\nCode Reference: ${issue.codeReference}` : ''),
          location: issue.location,
          detectedBy: 'AI_PHOTO_ANALYSIS',
          photos: [opts.photoUrl],
          aiAnalysis: {
            qaResultId: qaRecord.id,
            issueType: issue.type,
            correction: issue.correction,
            codeReference: issue.codeReference,
          },
          aiConfidence: qaResult.confidence ?? 0.5,
        },
      });

      if (severity === 'CRITICAL') {
        // CRITICAL: immediate alert
        await eventBus.publish(
          EVENT_TYPES.QA_ISSUE_DETECTED,
          {
            projectName: project.name ?? opts.projectId,
            issueSummary: issue.description,
            severity: 'CRITICAL',
            qualityIssueId: qualityIssue.id,
            qaResultIds: [qaRecord.id],
            issueType: issue.type,
            location: issue.location,
          },
          SOURCE_APP,
          { projectId: opts.projectId },
        );

        criticalHighIds.push(qualityIssue.id);
      } else if (severity === 'HIGH') {
        // HIGH: create correction task + notify PM & contractor
        await prisma.task.create({
          data: {
            projectId: opts.projectId,
            title: `QA Correction: ${issue.description.substring(0, 60)}`,
            description:
              `Issue detected by AI QA Inspector\n\n` +
              `Type: ${issue.type}\nSeverity: ${severity}\n` +
              `Location: ${issue.location}\n\n` +
              `${issue.description}\n\n` +
              `Required Correction: ${issue.correction}` +
              (issue.codeReference ? `\nCode Reference: ${issue.codeReference}` : ''),
            status: 'PENDING',
            priority: 'HIGH',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          },
        });

        if (project.pmId) {
          await prisma.notification.create({
            data: {
              userId: project.pmId,
              type: 'qa_issue',
              title: `QA Issue (HIGH): ${issue.type}`,
              message: `${issue.description.substring(0, 200)}\nLocation: ${issue.location}\nCorrection: ${issue.correction.substring(0, 150)}`,
              channels: ['in_app'],
              status: 'SENT',
              sentAt: new Date(),
              data: { qualityIssueId: qualityIssue.id, qaResultId: qaRecord.id },
            },
          });
        }

        criticalHighIds.push(qualityIssue.id);
      }
      // MEDIUM: batched for punch list (handled below)
      // LOW: logged in QAInspectionResult, included in weekly reports
    }

    // If any CRITICAL or HIGH issues, trigger punch list generation via APP-10
    if (criticalHighIds.length > 0) {
      const documentGenQueue = createQueue(QUEUE_NAMES.DOCUMENT_GEN);
      await addJob(documentGenQueue, 'generate-punch-list', {
        projectId: opts.projectId,
        qaResultIds: [qaRecord.id],
      });
    }

    console.log(
      `[QAInspector] Analyzed photo for project ${opts.projectId}: ` +
        `score=${overallScore}, issues=${issues.length} ` +
        `(${issues.filter((i) => i.severity === 'CRITICAL').length} critical, ` +
        `${issues.filter((i) => i.severity === 'HIGH').length} high)`,
    );

    return qaRecord.id;
  }

  // -----------------------------------------------------------------------
  // analyzeSiteVisitPhotos
  // -----------------------------------------------------------------------

  async analyzeSiteVisitPhotos(siteVisitId: string): Promise<{
    photosQueued: number;
    siteVisitId: string;
  }> {
    const siteVisit = await prisma.siteVisit.findUniqueOrThrow({
      where: { id: siteVisitId },
      include: {
        project: {
          select: { id: true, name: true, currentPhase: true, status: true },
        },
      },
    });

    if (!siteVisit.photos || siteVisit.photos.length === 0) {
      console.log(`[QAInspector] No photos for site visit ${siteVisitId}`);
      return { photosQueued: 0, siteVisitId };
    }

    const projectPhase = siteVisit.project.currentPhase ?? 'GENERAL';
    // Infer project type from visit data or default
    const projectType = 'RENOVATION'; // Default; in production, read from project metadata

    // Queue individual photo analysis jobs
    const qaQueue = createQueue(QUEUE_NAMES.QA_INSPECTOR);

    for (let i = 0; i < siteVisit.photos.length; i++) {
      await addJob(
        qaQueue,
        'analyze-photo',
        {
          photoUrl: siteVisit.photos[i],
          projectId: siteVisit.projectId,
          siteVisitId,
          projectPhase,
          projectType,
        },
        { delay: i * 3000 }, // Stagger: 3 seconds apart for rate limiting
      );
    }

    console.log(
      `[QAInspector] Queued ${siteVisit.photos.length} photos for site visit ${siteVisitId}`,
    );

    return { photosQueued: siteVisit.photos.length, siteVisitId };
  }

  // -----------------------------------------------------------------------
  // compileSiteVisitSummary
  // -----------------------------------------------------------------------

  async compileSiteVisitSummary(siteVisitId: string): Promise<void> {
    const results = await prisma.qAInspectionResult.findMany({
      where: { siteVisitId },
    });

    if (results.length === 0) return;

    // Aggregate scores
    const scores = results
      .filter((r) => r.overallScore !== null)
      .map((r) => Number(r.overallScore));
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    // Count issues by severity
    let totalIssues = 0;
    let criticalCount = 0;
    let highCount = 0;

    for (const r of results) {
      const issues = r.issuesFound as any[] | null;
      if (!Array.isArray(issues)) continue;
      totalIssues += issues.length;
      criticalCount += issues.filter((i: any) => i.severity === 'CRITICAL').length;
      highCount += issues.filter((i: any) => i.severity === 'HIGH').length;
    }

    // Update site visit notes with QA summary
    const summaryText =
      `\n\n--- QA Inspector Summary ---\n` +
      `Photos analyzed: ${results.length}\n` +
      `Average quality score: ${avgScore ?? 'N/A'}/100\n` +
      `Total issues found: ${totalIssues}\n` +
      `Critical: ${criticalCount} | High: ${highCount}\n`;

    const siteVisit = await prisma.siteVisit.findUnique({
      where: { id: siteVisitId },
      select: { notes: true },
    });

    await prisma.siteVisit.update({
      where: { id: siteVisitId },
      data: {
        notes: (siteVisit?.notes ?? '') + summaryText,
        findings: {
          qaScore: avgScore,
          photosAnalyzed: results.length,
          totalIssues,
          criticalIssues: criticalCount,
          highIssues: highCount,
          qaResultIds: results.map((r) => r.id),
        },
      },
    });

    console.log(
      `[QAInspector] Site visit ${siteVisitId} summary: ` +
        `${results.length} photos, avg score ${avgScore}, ${totalIssues} issues`,
    );
  }

  // -----------------------------------------------------------------------
  // getProjectQASummary
  // -----------------------------------------------------------------------

  async getProjectQASummary(projectId: string): Promise<{
    totalInspections: number;
    averageScore: number | null;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    openIssues: number;
    resolvedIssues: number;
    trend: 'improving' | 'declining' | 'stable';
  }> {
    const [qaResults, qualityIssues] = await Promise.all([
      prisma.qAInspectionResult.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.qualityIssue.findMany({
        where: { projectId },
      }),
    ]);

    // Average score
    const scores = qaResults
      .filter((r) => r.overallScore !== null)
      .map((r) => Number(r.overallScore));
    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null;

    // Issues by type and severity
    const issuesByType: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};

    for (const qi of qualityIssues) {
      issuesByType[qi.type] = (issuesByType[qi.type] ?? 0) + 1;
      issuesBySeverity[qi.severity] = (issuesBySeverity[qi.severity] ?? 0) + 1;
    }

    const openIssues = qualityIssues.filter(
      (qi) => qi.status === 'OPEN' || qi.status === 'IN_PROGRESS',
    ).length;
    const resolvedIssues = qualityIssues.filter(
      (qi) => qi.status === 'RESOLVED' || qi.status === 'VERIFIED',
    ).length;

    // Trend: compare recent scores (last 5) vs earlier scores
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (scores.length >= 6) {
      const midpoint = Math.floor(scores.length / 2);
      const earlyAvg =
        scores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
      const recentAvg =
        scores.slice(midpoint).reduce((a, b) => a + b, 0) /
        (scores.length - midpoint);
      if (recentAvg > earlyAvg + 3) trend = 'improving';
      else if (recentAvg < earlyAvg - 3) trend = 'declining';
    }

    return {
      totalInspections: qaResults.length,
      averageScore,
      issuesByType,
      issuesBySeverity,
      openIssues,
      resolvedIssues,
      trend,
    };
  }
}
