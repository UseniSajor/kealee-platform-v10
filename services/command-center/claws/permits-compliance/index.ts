import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, PERMIT_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Config per architecture doc S10
// ---------------------------------------------------------------------------
const CLAW_CONFIG = {
  name: 'permits-compliance-claw',
  eventPatterns: ['project.*', 'document.*', 'schedule.*'],
  writableModels: [
    'Jurisdiction', 'Permit', 'Inspection', 'InspectionFinding',
    'QualityIssue', 'QAInspectionResult',
  ],
};

// ---------------------------------------------------------------------------
// Jurisdiction portal configuration for DC / MD / VA tri-state area
// ---------------------------------------------------------------------------
interface JurisdictionPortalConfig {
  code: string;
  name: string;
  portalType: 'API_DIRECT' | 'PORTAL_SCRAPE' | 'MANUAL_ENTRY';
  apiProvider?: string;
  timezone: string;
}

const JURISDICTION_PORTALS: JurisdictionPortalConfig[] = [
  { code: 'US-DC', name: 'District of Columbia', portalType: 'API_DIRECT', apiProvider: 'ACCELA', timezone: 'America/New_York' },
  { code: 'US-MD-MONT', name: 'Montgomery County, MD', portalType: 'API_DIRECT', apiProvider: 'ACCELA', timezone: 'America/New_York' },
  { code: 'US-MD-PG', name: "Prince George's County, MD", portalType: 'PORTAL_SCRAPE', timezone: 'America/New_York' },
  { code: 'US-VA-FAIR', name: 'Fairfax County, VA', portalType: 'API_DIRECT', apiProvider: 'TYLER', timezone: 'America/New_York' },
  { code: 'US-VA-ARL', name: 'Arlington County, VA', portalType: 'PORTAL_SCRAPE', timezone: 'America/New_York' },
  { code: 'US-VA-ALEX', name: 'City of Alexandria, VA', portalType: 'API_DIRECT', apiProvider: 'GOVOS', timezone: 'America/New_York' },
];

// ---------------------------------------------------------------------------
// GUARDRAILS -- enforced at claw level
// ---------------------------------------------------------------------------
// 1. Cannot auto-file permits without explicit user trigger
// 2. Cannot modify financial records, budgets, or payments
// 3. Cannot alter schedules or contract terms

/**
 * Claw E -- Permits & Compliance
 *
 * OWNS: Inspection pass / fail authority.
 *
 * Workers:
 *   permit-tracker  -- multi-jurisdiction portal checking, deadline monitoring
 *   qa-inspector    -- Claude Vision AI photo analysis, compliance checks
 */
export class PermitsComplianceClaw extends BaseClaw {
  private ai: AIProvider;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();
  }

  // -------------------------------------------------------------------------
  // Event router
  // -------------------------------------------------------------------------
  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    switch (event.type) {
      // A project phase change may mean new permits are required
      case 'project.phase.changed': {
        const queue = createQueue(KEALEE_QUEUES.PERMIT_TRACKER);
        await queue.add('evaluate-permits-for-phase', {
          event,
          projectId: event.projectId,
          organizationId: event.organizationId,
          phase: (event.payload as any).phase,
        });
        break;
      }

      // A generated document (e.g. plans) may need permit-related processing
      case 'document.generated': {
        const queue = createQueue(KEALEE_QUEUES.PERMIT_TRACKER);
        await queue.add('check-document-compliance', {
          event,
          projectId: event.projectId,
          organizationId: event.organizationId,
          documentId: (event.payload as any).documentId,
        });
        break;
      }

      // Schedule updates may shift inspection windows
      case 'schedule.updated': {
        const queue = createQueue(KEALEE_QUEUES.PERMIT_TRACKER);
        await queue.add('reconcile-inspection-schedule', {
          event,
          projectId: event.projectId,
          organizationId: event.organizationId,
        });
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Worker registration
  // -------------------------------------------------------------------------
  async registerWorkers(): Promise<void> {
    // --- Permit Tracker Worker ---
    createWorker(KEALEE_QUEUES.PERMIT_TRACKER, async (job: Job) => {
      switch (job.name) {
        case 'check-portal-status':
          await this.handleCheckPortalStatus(job);
          break;
        case 'check-deadlines':
          await this.handleCheckDeadlines(job);
          break;
        case 'evaluate-permits-for-phase':
          await this.handleEvaluatePermitsForPhase(job);
          break;
        case 'check-document-compliance':
          await this.handleCheckDocumentCompliance(job);
          break;
        case 'reconcile-inspection-schedule':
          await this.handleReconcileInspectionSchedule(job);
          break;
      }
    });

    // --- QA Inspector Worker ---
    createWorker(KEALEE_QUEUES.QA_INSPECTOR, async (job: Job) => {
      switch (job.name) {
        case 'analyze-photo':
          await this.handleAnalyzePhoto(job);
          break;
        case 'run-compliance-check':
          await this.handleRunComplianceCheck(job);
          break;
        case 'record-result':
          await this.handleRecordResult(job);
          break;
      }
    });

    // --- Schedule daily cron: portal status check at 6 AM ET ---
    const permitQueue = createQueue(KEALEE_QUEUES.PERMIT_TRACKER);
    await permitQueue.add(
      'check-portal-status',
      { jurisdictions: JURISDICTION_PORTALS.map((j) => j.code) },
      {
        repeat: { pattern: '0 6 * * *', tz: 'America/New_York' },
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    // --- Schedule daily cron: deadline monitoring at 7 AM ET ---
    await permitQueue.add(
      'check-deadlines',
      {},
      {
        repeat: { pattern: '0 7 * * *', tz: 'America/New_York' },
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  // =========================================================================
  // PERMIT TRACKER -- Worker Handlers
  // =========================================================================

  /**
   * Daily 6 AM cron: poll each jurisdiction portal for active permit status
   * updates. Publishes permit.status.changed for any deltas detected.
   */
  private async handleCheckPortalStatus(job: Job): Promise<void> {
    const { jurisdictions } = job.data as { jurisdictions: string[] };

    for (const jurisdictionCode of jurisdictions) {
      const jurisdiction = await this.prisma.jurisdiction.findUnique({
        where: { code: jurisdictionCode },
      });
      if (!jurisdiction) continue;

      // Get all active permits in this jurisdiction
      const activePermits = await this.prisma.permit.findMany({
        where: {
          jurisdictionId: jurisdiction.id,
          status: { in: ['SUBMITTED', 'IN_REVIEW', 'CORRECTIONS_NEEDED', 'RESUBMITTED'] },
        },
      });

      for (const permit of activePermits) {
        // Determine status-check strategy based on portal type
        const portalConfig = JURISDICTION_PORTALS.find((p) => p.code === jurisdictionCode);
        if (!portalConfig) continue;

        let portalStatus: string | null = null;

        switch (portalConfig.portalType) {
          case 'API_DIRECT':
            portalStatus = await this.checkViaApi(jurisdiction, permit);
            break;
          case 'PORTAL_SCRAPE':
            portalStatus = await this.checkViaScrape(jurisdiction, permit);
            break;
          case 'MANUAL_ENTRY':
            // Skip -- relies on manual data entry
            continue;
        }

        if (portalStatus && portalStatus !== permit.status) {
          this.assertWritable('Permit');

          const previousStatus = permit.status;

          await this.prisma.permit.update({
            where: { id: permit.id },
            data: { status: portalStatus },
          });

          // Publish status change
          const statusEvent = createEvent({
            type: EVENT_TYPES.permit.status.changed,
            source: this.config.name,
            projectId: permit.projectId,
            organizationId: (permit as any).organizationId ?? undefined,
            payload: {
              permitId: permit.id,
              previousStatus,
              newStatus: portalStatus,
              jurisdictionCode,
            },
            entity: { type: 'Permit', id: permit.id },
          });
          await this.eventBus.publish(statusEvent);

          // If approved, publish specific approved event
          if (portalStatus === 'APPROVED') {
            const approvedEvent = createEvent({
              type: EVENT_TYPES.permit.approved,
              source: this.config.name,
              projectId: permit.projectId,
              organizationId: (permit as any).organizationId ?? undefined,
              payload: { permitId: permit.id, jurisdictionCode },
              entity: { type: 'Permit', id: permit.id },
            });
            await this.eventBus.publish(approvedEvent);
          }
        }
      }
    }
  }

  /**
   * Daily 7 AM cron: check all permits for upcoming deadlines.
   * Publishes permit.expiring for permits within 30 days of expiration.
   */
  private async handleCheckDeadlines(job: Job): Promise<void> {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86_400_000);

    const expiringPermits = await this.prisma.permit.findMany({
      where: {
        status: { in: ['APPROVED', 'ISSUED'] },
        expiresAt: { lte: thirtyDaysFromNow, gt: new Date() },
      },
    });

    for (const permit of expiringPermits) {
      const daysRemaining = Math.ceil(
        ((permit as any).expiresAt.getTime() - Date.now()) / 86_400_000,
      );

      const expiringEvent = createEvent({
        type: EVENT_TYPES.permit.expiring,
        source: this.config.name,
        projectId: permit.projectId,
        organizationId: (permit as any).organizationId ?? undefined,
        payload: {
          permitId: permit.id,
          expiresAt: (permit as any).expiresAt,
          daysRemaining,
          permitType: permit.permitType,
        },
        entity: { type: 'Permit', id: permit.id },
      });
      await this.eventBus.publish(expiringEvent);
    }
  }

  /**
   * When a project phase changes, evaluate whether new permits are required
   * for the upcoming phase.
   */
  private async handleEvaluatePermitsForPhase(job: Job): Promise<void> {
    const { projectId, organizationId, phase, event } = job.data as {
      projectId: string;
      organizationId: string;
      phase: string;
      event: KealeeEventEnvelope;
    };

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { permits: true },
    });
    if (!project) return;

    // AI analysis of required permits for the new phase
    const aiResult = await this.ai.reason({
      task:
        'Determine what permits and inspections are required for this construction phase. ' +
        'Consider DC/MD/VA jurisdiction requirements. Return JSON with required permit types ' +
        'and inspection milestones.',
      context: {
        projectName: project.name,
        projectType: (project as any).type,
        address: (project as any).address,
        currentPhase: phase,
        existingPermits: (project as any).permits?.map((p: any) => ({
          type: p.permitType,
          status: p.status,
        })),
      },
      systemPrompt: PERMIT_PROMPT,
    });

    // GUARDRAIL: We do NOT auto-file permits. We create DRAFT permits and
    // publish an event so the PM can review and trigger filing manually.
    const requiredPermits = (aiResult as any)?.requiredPermits ?? [];

    for (const required of requiredPermits) {
      // Check if a permit of this type already exists for this project
      const existing = await this.prisma.permit.findFirst({
        where: {
          projectId,
          permitType: required.type,
          status: { notIn: ['EXPIRED', 'CANCELLED', 'REJECTED'] },
        },
      });

      if (!existing) {
        this.assertWritable('Permit');

        const newPermit = await this.prisma.permit.create({
          data: {
            projectId,
            clientId: (project as any).clientId,
            jurisdictionId: required.jurisdictionId ?? (project as any).jurisdictionId,
            pmUserId: (project as any).pmUserId,
            permitType: required.type,
            scope: required.scope ?? `${required.type} permit for ${phase} phase`,
            valuation: (project as any).estimatedCost ?? 0,
            address: (project as any).address ?? '',
            status: 'DRAFT', // Never auto-filed
          },
        });

        const createdEvent = createEvent({
          type: EVENT_TYPES.permit.created,
          source: this.config.name,
          projectId,
          organizationId,
          payload: {
            permitId: newPermit.id,
            permitType: required.type,
            status: 'DRAFT',
            phase,
            requiresUserAction: true,
          },
          entity: { type: 'Permit', id: newPermit.id },
          trigger: { eventId: event.id, eventType: event.type },
        });
        await this.eventBus.publish(createdEvent);
      }
    }
  }

  /**
   * When a document is generated (e.g. plans, specs), check if it satisfies
   * outstanding permit requirements.
   */
  private async handleCheckDocumentCompliance(job: Job): Promise<void> {
    const { projectId, documentId, event } = job.data as {
      projectId: string;
      organizationId: string;
      documentId: string;
      event: KealeeEventEnvelope;
    };

    const pendingPermits = await this.prisma.permit.findMany({
      where: {
        projectId,
        status: { in: ['DRAFT', 'CORRECTIONS_NEEDED'] },
      },
    });

    if (pendingPermits.length === 0) return;

    // Use AI to evaluate if the document resolves outstanding corrections
    const aiResult = await this.ai.reason({
      task:
        'Evaluate whether this document addresses outstanding permit corrections ' +
        'or satisfies submission requirements. Return JSON with matched permits.',
      context: {
        documentId,
        pendingPermits: pendingPermits.map((p) => ({
          id: p.id,
          type: p.permitType,
          status: p.status,
        })),
      },
      systemPrompt: PERMIT_PROMPT,
    });

    // Log the analysis -- no writes to non-writable models
    console.log(
      `[${this.config.name}] Document compliance check complete for project ${projectId}:`,
      aiResult,
    );
  }

  /**
   * When the schedule updates, reconcile inspection dates with the new
   * timeline. Create or adjust inspection records as needed.
   */
  private async handleReconcileInspectionSchedule(job: Job): Promise<void> {
    const { projectId, organizationId, event } = job.data as {
      projectId: string;
      organizationId: string;
      event: KealeeEventEnvelope;
    };

    const inspections = await this.prisma.inspection.findMany({
      where: {
        projectId,
        status: { in: ['REQUESTED', 'SCHEDULED', 'PENDING'] },
      },
    });

    if (inspections.length === 0) return;

    // Publish event so the PM is aware inspections may need rescheduling
    for (const inspection of inspections) {
      const alertEvent = createEvent({
        type: EVENT_TYPES.inspection.scheduled,
        source: this.config.name,
        projectId,
        organizationId,
        payload: {
          inspectionId: inspection.id,
          reason: 'schedule_update',
          message: 'Project schedule updated -- please verify inspection dates.',
        },
        entity: { type: 'Inspection', id: inspection.id },
        trigger: { eventId: event.id, eventType: event.type },
      });
      await this.eventBus.publish(alertEvent);
    }
  }

  // =========================================================================
  // QA INSPECTOR -- Worker Handlers
  // =========================================================================

  /**
   * Analyze a site photo using Claude Vision AI.
   * Detects quality issues, safety hazards, and code violations.
   */
  private async handleAnalyzePhoto(job: Job): Promise<void> {
    const { photoUrl, projectId, inspectionId, siteVisitId } = job.data as {
      photoUrl: string;
      projectId: string;
      inspectionId?: string;
      siteVisitId?: string;
    };

    // Claude Vision analysis
    const aiResult = await this.ai.analyzeImage({
      imageUrl: photoUrl,
      task:
        'Analyze this construction site photo for quality issues, safety violations, ' +
        'and code compliance concerns. For each issue found, provide: type (WORKMANSHIP, ' +
        'MATERIAL, SAFETY, CODE_VIOLATION), severity (MINOR, MODERATE, MAJOR, CRITICAL), ' +
        'description, and recommended action.',
      systemPrompt: PERMIT_PROMPT,
    });

    const analysis = aiResult as {
      issues?: Array<{
        type: string;
        severity: string;
        description: string;
        location?: string;
        requiredAction?: string;
        codeReference?: string;
      }>;
      overallScore?: number;
      safetyPass?: boolean;
    };

    // Record the QA inspection result
    this.assertWritable('QAInspectionResult');

    const qaResult = await this.prisma.qAInspectionResult.create({
      data: {
        projectId,
        siteVisitId: siteVisitId ?? null,
        photoUrl,
        analysisResult: analysis as any,
        issuesFound: analysis.issues as any ?? null,
        overallScore: analysis.overallScore ?? null,
      },
    });

    // Create quality issues for anything detected
    if (analysis.issues && analysis.issues.length > 0) {
      this.assertWritable('QualityIssue');

      for (const issue of analysis.issues) {
        await this.prisma.qualityIssue.create({
          data: {
            projectId,
            type: issue.type,
            severity: issue.severity,
            status: 'OPEN',
            title: `AI-detected: ${issue.type} - ${issue.severity}`,
            description: issue.description,
            location: issue.location ?? null,
            detectedBy: 'AI_PHOTO_ANALYSIS',
            photos: [photoUrl],
            aiAnalysis: issue as any,
            aiConfidence: analysis.overallScore
              ? (analysis.overallScore / 100)
              : null,
          },
        });
      }

      // If critical issues or safety failure, publish high-priority alert
      const hasCritical = analysis.issues.some(
        (i) => i.severity === 'CRITICAL' || i.type === 'SAFETY',
      );
      if (hasCritical) {
        const alertEvent = createEvent({
          type: EVENT_TYPES.compliance.alert.high,
          source: this.config.name,
          projectId,
          payload: {
            qaResultId: qaResult.id,
            criticalIssueCount: analysis.issues.filter(
              (i) => i.severity === 'CRITICAL',
            ).length,
            safetyIssueCount: analysis.issues.filter(
              (i) => i.type === 'SAFETY',
            ).length,
            requiresImmediateAction: true,
          },
          entity: { type: 'QAInspectionResult', id: qaResult.id },
        });
        await this.eventBus.publish(alertEvent);
      }
    }
  }

  /**
   * Run a full compliance check for an inspection.
   * Evaluates all requirements against current project state.
   */
  private async handleRunComplianceCheck(job: Job): Promise<void> {
    const { inspectionId, projectId, organizationId } = job.data as {
      inspectionId: string;
      projectId: string;
      organizationId: string;
    };

    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        findings: true,
        permit: true,
      },
    });
    if (!inspection) return;

    // AI compliance evaluation
    const aiResult = await this.ai.reason({
      task:
        'Evaluate inspection compliance based on findings, permit requirements, ' +
        'and jurisdiction code. Determine pass/fail status and list any outstanding ' +
        'deficiencies that must be resolved.',
      context: {
        inspectionType: inspection.inspectionType,
        permitType: (inspection as any).permit?.permitType,
        findings: inspection.findings.map((f: any) => ({
          type: f.type,
          severity: f.severity,
          status: f.status,
          description: f.description,
        })),
      },
      systemPrompt: PERMIT_PROMPT,
    });

    const complianceResult = aiResult as {
      passed: boolean;
      deficiencies?: string[];
      notes?: string;
    };

    // THIS CLAW OWNS INSPECTION PASS/FAIL AUTHORITY
    this.assertWritable('Inspection');

    const newStatus = complianceResult.passed ? 'PASSED' : 'FAILED';

    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: newStatus,
        completedAt: new Date(),
        result: newStatus,
        resultNotes: complianceResult.notes ?? null,
      },
    });

    // Publish appropriate pass/fail event
    if (complianceResult.passed) {
      const passedEvent = createEvent({
        type: EVENT_TYPES.inspection.passed,
        source: this.config.name,
        projectId,
        organizationId,
        payload: {
          inspectionId,
          inspectionType: inspection.inspectionType,
          notes: complianceResult.notes,
        },
        entity: { type: 'Inspection', id: inspectionId },
      });
      await this.eventBus.publish(passedEvent);
    } else {
      const failedEvent = createEvent({
        type: EVENT_TYPES.inspection.failed,
        source: this.config.name,
        projectId,
        organizationId,
        payload: {
          inspectionId,
          inspectionType: inspection.inspectionType,
          deficiencies: complianceResult.deficiencies ?? [],
          notes: complianceResult.notes,
        },
        entity: { type: 'Inspection', id: inspectionId },
      });
      await this.eventBus.publish(failedEvent);

      // Record deficiency findings
      if (complianceResult.deficiencies) {
        this.assertWritable('InspectionFinding');

        for (const deficiency of complianceResult.deficiencies) {
          await this.prisma.inspectionFinding.create({
            data: {
              inspectionId,
              type: 'DEFICIENCY',
              severity: 'MAJOR',
              description: deficiency,
              status: 'OPEN',
              requiredAction: `Resolve deficiency: ${deficiency}`,
              dueDate: new Date(Date.now() + 14 * 86_400_000), // 14-day default
            },
          });
        }
      }

      // Publish compliance alert for failed inspections
      const complianceAlert = createEvent({
        type: EVENT_TYPES.inspection.failed.compliance,
        source: this.config.name,
        projectId,
        organizationId,
        payload: {
          inspectionId,
          inspectionType: inspection.inspectionType,
          deficiencyCount: complianceResult.deficiencies?.length ?? 0,
        },
        entity: { type: 'Inspection', id: inspectionId },
      });
      await this.eventBus.publish(complianceAlert);
    }
  }

  /**
   * Record inspection result (pass/fail) with findings.
   * Called from routes when a PM records an inspection outcome.
   */
  private async handleRecordResult(job: Job): Promise<void> {
    const {
      inspectionId,
      projectId,
      organizationId,
      result,
      findings,
      notes,
    } = job.data as {
      inspectionId: string;
      projectId: string;
      organizationId: string;
      result: 'PASSED' | 'FAILED';
      findings?: Array<{
        type: string;
        severity: string;
        description: string;
        location?: string;
        photos?: string[];
        requiredAction?: string;
      }>;
      notes?: string;
    };

    this.assertWritable('Inspection');

    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: result,
        completedAt: new Date(),
        result,
        resultNotes: notes ?? null,
      },
    });

    // Record individual findings
    if (findings && findings.length > 0) {
      this.assertWritable('InspectionFinding');

      for (const finding of findings) {
        await this.prisma.inspectionFinding.create({
          data: {
            inspectionId,
            type: finding.type,
            severity: finding.severity,
            description: finding.description,
            location: finding.location ?? null,
            photos: finding.photos ?? [],
            status: 'OPEN',
            requiredAction: finding.requiredAction ?? null,
            dueDate: new Date(Date.now() + 14 * 86_400_000),
          },
        });
      }
    }

    // Publish result event
    const eventType = result === 'PASSED'
      ? EVENT_TYPES.inspection.passed
      : EVENT_TYPES.inspection.failed;

    const resultEvent = createEvent({
      type: eventType,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        inspectionId,
        result,
        findingCount: findings?.length ?? 0,
        notes,
      },
      entity: { type: 'Inspection', id: inspectionId },
    });
    await this.eventBus.publish(resultEvent);
  }

  // =========================================================================
  // Private helpers -- portal integration
  // =========================================================================

  /**
   * Check permit status via direct API integration (Accela, Tyler, GovOS).
   */
  private async checkViaApi(
    jurisdiction: any,
    permit: any,
  ): Promise<string | null> {
    try {
      if (!jurisdiction.apiUrl || !jurisdiction.apiKey) return null;

      // API integration call -- abstracted per provider
      const response = await fetch(`${jurisdiction.apiUrl}/permits/${permit.permitNumber}/status`, {
        headers: {
          Authorization: `Bearer ${jurisdiction.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(
          `[${this.config.name}] API check failed for permit ${permit.id} in ${jurisdiction.code}: ${response.status}`,
        );
        return null;
      }

      const data = (await response.json()) as { status?: string };
      return data.status ?? null;
    } catch (err) {
      console.error(`[${this.config.name}] API check error for ${jurisdiction.code}:`, err);
      return null;
    }
  }

  /**
   * Check permit status via portal scraping (headless browser).
   * Falls back gracefully if the portal is unavailable.
   */
  private async checkViaScrape(
    jurisdiction: any,
    permit: any,
  ): Promise<string | null> {
    try {
      if (!jurisdiction.portalUrl) return null;

      // Portal scrape integration -- uses Puppeteer or similar headless browser
      // This is a stub; the actual implementation would use the portal scraper
      // infrastructure from @kealee/integrations
      console.log(
        `[${this.config.name}] Scrape check for permit ${permit.id} in ${jurisdiction.code} -- not yet implemented`,
      );
      return null;
    } catch (err) {
      console.error(`[${this.config.name}] Scrape check error for ${jurisdiction.code}:`, err);
      return null;
    }
  }
}
