/**
 * APP-13: AUTOMATED QA INSPECTOR
 * AI-powered quality assurance and photo analysis
 * Automation Level: AI-driven
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { generateJSON, generateText, analyzeConstructionPhoto } from '../../../shared/ai/claude.js';
import { sendEmail } from '../../../shared/integrations/email.js';
import { formatDate } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('qa-inspector');

// ============================================================================
// TYPES
// ============================================================================

interface QAInspection {
  id: string;
  projectId: string;
  area: string;
  trade: string;
  type: 'visual' | 'measurement' | 'compliance' | 'safety';
  status: 'pending' | 'in-progress' | 'passed' | 'failed' | 'needs-review';
  checklist: QAChecklistItem[];
  photos: QAPhoto[];
  findings: QAFinding[];
  score?: number;
  inspectorNotes?: string;
  aiAnalysis?: AIAnalysisResult;
  createdAt: Date;
  completedAt?: Date;
}

interface QAChecklistItem {
  id: string;
  category: string;
  item: string;
  standard: string;
  status: 'pass' | 'fail' | 'na' | 'pending';
  notes?: string;
  photo?: string;
}

interface QAPhoto {
  id: string;
  url: string;
  location: string;
  capturedAt: Date;
  analyzed: boolean;
  analysis?: PhotoAnalysis;
}

interface PhotoAnalysis {
  workType: string;
  quality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unacceptable';
  issues: PhotoIssue[];
  safetyObservations: string[];
  progressIndicators: string[];
  confidence: number;
}

interface PhotoIssue {
  severity: 'critical' | 'major' | 'minor' | 'observation';
  category: string;
  description: string;
  location: string;
  recommendation: string;
}

interface QAFinding {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'observation';
  category: string;
  description: string;
  location: string;
  rootCause?: string;
  recommendation: string;
  correctiveAction?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'verified';
  dueDate?: Date;
  assignedTo?: string;
  photos?: string[];
  verifiedAt?: Date;
  verifiedBy?: string;
}

interface AIAnalysisResult {
  overallAssessment: string;
  qualityScore: number;
  complianceScore: number;
  safetyScore: number;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface QualityTrend {
  projectId: string;
  period: { start: Date; end: Date };
  overallScore: number;
  scoreByTrade: Record<string, number>;
  scoreByArea: Record<string, number>;
  findingsTrend: { date: string; count: number; severity: string }[];
  improvements: string[];
  concerns: string[];
}

// ============================================================================
// QA SERVICE
// ============================================================================

class QAInspectorService {
  /**
   * Get standard checklist for trade
   */
  getStandardChecklist(trade: string): QAChecklistItem[] {
    const checklists: Record<string, QAChecklistItem[]> = {
      FRAMING: [
        { id: '1', category: 'Structure', item: 'Studs plumb within 1/4"', standard: 'IRC R602', status: 'pending' },
        { id: '2', category: 'Structure', item: 'Headers properly sized', standard: 'IRC R602.7', status: 'pending' },
        { id: '3', category: 'Structure', item: 'Hold-downs installed per plan', standard: 'Engineering', status: 'pending' },
        { id: '4', category: 'Structure', item: 'Fire blocking in place', standard: 'IRC R302.11', status: 'pending' },
        { id: '5', category: 'Structure', item: 'Nailing pattern correct', standard: 'IRC Table 602.3(1)', status: 'pending' },
        { id: '6', category: 'Moisture', item: 'Flashing at windows/doors', standard: 'IRC R703.8', status: 'pending' },
      ],
      ELECTRICAL: [
        { id: '1', category: 'Wiring', item: 'Wire gauge matches circuit', standard: 'NEC 310.16', status: 'pending' },
        { id: '2', category: 'Wiring', item: 'Proper wire securing', standard: 'NEC 334.30', status: 'pending' },
        { id: '3', category: 'Boxes', item: 'Box fill calculated', standard: 'NEC 314.16', status: 'pending' },
        { id: '4', category: 'Boxes', item: 'Boxes properly secured', standard: 'NEC 314.23', status: 'pending' },
        { id: '5', category: 'Safety', item: 'GFCI protection where required', standard: 'NEC 210.8', status: 'pending' },
        { id: '6', category: 'Safety', item: 'AFCI protection where required', standard: 'NEC 210.12', status: 'pending' },
      ],
      PLUMBING: [
        { id: '1', category: 'Drainage', item: 'Proper slope (1/4" per ft)', standard: 'IPC 704.1', status: 'pending' },
        { id: '2', category: 'Drainage', item: 'Vents properly sized', standard: 'IPC 906', status: 'pending' },
        { id: '3', category: 'Supply', item: 'Proper pipe support spacing', standard: 'IPC 308', status: 'pending' },
        { id: '4', category: 'Supply', item: 'Pressure test passed', standard: 'IPC 312.5', status: 'pending' },
        { id: '5', category: 'Safety', item: 'Backflow prevention installed', standard: 'IPC 608', status: 'pending' },
      ],
      HVAC: [
        { id: '1', category: 'Ductwork', item: 'Ducts properly sealed', standard: 'IMC 603.9', status: 'pending' },
        { id: '2', category: 'Ductwork', item: 'Duct sizing per design', standard: 'Engineering', status: 'pending' },
        { id: '3', category: 'Equipment', item: 'Equipment properly secured', standard: 'IMC 304', status: 'pending' },
        { id: '4', category: 'Clearances', item: 'Combustion air adequate', standard: 'IMC 701', status: 'pending' },
        { id: '5', category: 'Insulation', item: 'Duct insulation per specs', standard: 'IECC', status: 'pending' },
      ],
      CONCRETE: [
        { id: '1', category: 'Preparation', item: 'Subgrade properly compacted', standard: 'ACI 302', status: 'pending' },
        { id: '2', category: 'Reinforcement', item: 'Rebar spacing per plans', standard: 'ACI 318', status: 'pending' },
        { id: '3', category: 'Reinforcement', item: 'Proper cover maintained', standard: 'ACI 318', status: 'pending' },
        { id: '4', category: 'Finish', item: 'Surface tolerance met', standard: 'ACI 117', status: 'pending' },
        { id: '5', category: 'Curing', item: 'Proper curing methods', standard: 'ACI 308', status: 'pending' },
      ],
    };

    return checklists[trade.toUpperCase()] || [];
  }

  /**
   * Analyze photo using AI
   */
  async analyzePhoto(photo: QAPhoto, context: { trade: string; area: string }): Promise<PhotoAnalysis> {
    const analysis = await analyzeConstructionPhoto(photo.url, context as any) as any;

    return {
      workType: analysis.workType,
      quality: this.mapQualityLevel(analysis.qualityLevel),
      issues: analysis.issues.map((issue: any) => ({
        severity: issue.severity,
        category: context.trade,
        description: issue.description,
        location: issue.location,
        recommendation: issue.recommendation,
      })),
      safetyObservations: analysis.safetyObservations,
      progressIndicators: analysis.progressIndicators,
      confidence: analysis.confidence,
    };
  }

  /**
   * Map quality level string to enum
   */
  private mapQualityLevel(level: string): PhotoAnalysis['quality'] {
    const mapping: Record<string, PhotoAnalysis['quality']> = {
      excellent: 'excellent',
      good: 'good',
      acceptable: 'acceptable',
      poor: 'poor',
      'needs attention': 'poor',
      unacceptable: 'unacceptable',
    };
    return mapping[level.toLowerCase()] || 'acceptable';
  }

  /**
   * Perform comprehensive AI inspection
   */
  async performAIInspection(
    inspection: QAInspection
  ): Promise<AIAnalysisResult> {
    // Analyze all photos
    const photoAnalyses: PhotoAnalysis[] = [];
    for (const photo of inspection.photos) {
      if (!photo.analyzed) {
        const analysis = await this.analyzePhoto(photo, {
          trade: inspection.trade,
          area: inspection.area,
        });
        photoAnalyses.push(analysis);
      } else if (photo.analysis) {
        photoAnalyses.push(photo.analysis);
      }
    }

    // Calculate scores
    const qualityScores = photoAnalyses.map(a => {
      const scoreMap = { excellent: 100, good: 85, acceptable: 70, poor: 50, unacceptable: 20 };
      return scoreMap[a.quality];
    });

    const qualityScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 0;

    // Check compliance from checklist
    const passedItems = inspection.checklist.filter(c => c.status === 'pass').length;
    const totalItems = inspection.checklist.filter(c => c.status !== 'na').length;
    const complianceScore = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

    // Aggregate all issues
    const allIssues = photoAnalyses.flatMap(a => a.issues);
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const safetyIssues = allIssues.filter(i => i.category.toLowerCase().includes('safety'));

    const safetyScore = safetyIssues.length === 0 ? 100 :
      safetyIssues.some(i => i.severity === 'critical') ? 40 : 70;

    // Generate AI assessment
    const assessmentPrompt = `Provide a quality assessment summary for construction inspection:

Trade: ${inspection.trade}
Area: ${inspection.area}
Checklist Results: ${passedItems}/${totalItems} passed
Photo Analysis Summary:
${photoAnalyses.map(a => `- Quality: ${a.quality}, Issues: ${a.issues.length}`).join('\n')}

All Issues Found:
${allIssues.map(i => `- [${i.severity}] ${i.description}`).join('\n') || 'None'}

Provide:
1. A 2-3 sentence overall assessment
2. Top 3 key findings
3. Top 3 recommendations
4. Risk level (low/medium/high)`;

    const aiAssessment = await (generateJSON as any)({
      systemPrompt: 'You are a construction quality control expert. Provide clear, actionable assessments.',
      userPrompt: assessmentPrompt,
    }) as {
      assessment: string;
      keyFindings: string[];
      recommendations: string[];
      riskLevel: 'low' | 'medium' | 'high';
    };

    return {
      overallAssessment: aiAssessment.assessment,
      qualityScore,
      complianceScore,
      safetyScore,
      keyFindings: aiAssessment.keyFindings,
      recommendations: aiAssessment.recommendations,
      riskLevel: aiAssessment.riskLevel,
    };
  }

  /**
   * Calculate quality trends
   */
  async calculateTrends(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<QualityTrend> {
    const inspections = await (prisma as any).qAInspection.findMany({
      where: {
        projectId,
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['passed', 'failed'] },
      },
      include: { findings: true },
    } as any);

    // Calculate overall score
    const scores = inspections
      .filter(i => (i as any).score !== null)
      .map(i => (i as any).score as number);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Score by trade
    const scoreByTrade: Record<string, number> = {};
    const tradeGroups = inspections.reduce((acc: any, i) => {
      const trade = (i as any).trade;
      if (!acc[trade]) acc[trade] = [];
      if ((i as any).score !== null) acc[trade].push((i as any).score);
      return acc;
    }, {});

    for (const [trade, tradeScores] of Object.entries(tradeGroups as Record<string, number[]>)) {
      scoreByTrade[trade] = tradeScores.length > 0
        ? Math.round(tradeScores.reduce((a, b) => a + b, 0) / tradeScores.length)
        : 0;
    }

    // Score by area
    const scoreByArea: Record<string, number> = {};
    const areaGroups = inspections.reduce((acc: any, i) => {
      const area = (i as any).area;
      if (!acc[area]) acc[area] = [];
      if ((i as any).score !== null) acc[area].push((i as any).score);
      return acc;
    }, {});

    for (const [area, areaScores] of Object.entries(areaGroups as Record<string, number[]>)) {
      scoreByArea[area] = areaScores.length > 0
        ? Math.round(areaScores.reduce((a, b) => a + b, 0) / areaScores.length)
        : 0;
    }

    // Findings trend
    const findingsByDate = inspections.reduce((acc: any, i) => {
      const date = formatDate((i as any).createdAt);
      if (!acc[date]) acc[date] = { critical: 0, major: 0, minor: 0 };
      for (const f of (i as any).findings || []) {
        acc[date][f.severity]++;
      }
      return acc;
    }, {});

    const findingsTrend = Object.entries(findingsByDate).flatMap(([date, counts]: [string, any]) => [
      { date, count: counts.critical, severity: 'critical' },
      { date, count: counts.major, severity: 'major' },
      { date, count: counts.minor, severity: 'minor' },
    ]);

    // Identify improvements and concerns
    const improvements: string[] = [];
    const concerns: string[] = [];

    for (const [trade, score] of Object.entries(scoreByTrade)) {
      if (score >= 90) improvements.push(`${trade} showing excellent quality`);
      if (score < 70) concerns.push(`${trade} needs quality improvement`);
    }

    return {
      projectId,
      period: { start: startDate, end: endDate },
      overallScore,
      scoreByTrade,
      scoreByArea,
      findingsTrend,
      improvements,
      concerns,
    };
  }
}

const qaService = new QAInspectorService();

// ============================================================================
// WORKER
// ============================================================================

async function processQAJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'ANALYZE_PHOTO':
      return await analyzePhotoJob(data);

    case 'RUN_INSPECTION':
      return await runInspection(data.inspectionId);

    case 'GENERATE_REPORT':
      return await generateQAReport(data.inspectionId);

    case 'CALCULATE_TRENDS':
      return await qaService.calculateTrends(
        data.projectId,
        new Date(data.startDate),
        new Date(data.endDate)
      );

    case 'CREATE_FINDING':
      return await createFinding(data);

    case 'VERIFY_CORRECTION':
      return await verifyCorrection(data.findingId, data.verifiedBy, data.photos);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function analyzePhotoJob(data: { photoId: string; inspectionId: string }) {
  const inspection = await (prisma as any).qAInspection.findUnique({
    where: { id: data.inspectionId },
    include: { photos: true },
  } as any);

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  const photo = (inspection as any).photos?.find((p: any) => p.id === data.photoId);
  if (!photo) {
    throw new Error('Photo not found');
  }

  const analysis = await qaService.analyzePhoto(photo as QAPhoto, {
    trade: (inspection as any).trade,
    area: (inspection as any).area,
  });

  // Update photo with analysis
  await (prisma as any).qAPhoto.update({
    where: { id: data.photoId },
    data: {
      analyzed: true,
      analysis: analysis as any,
    },
  });

  // Create findings from critical issues
  for (const issue of analysis.issues.filter(i => i.severity === 'critical')) {
    await createFinding({
      inspectionId: data.inspectionId,
      severity: issue.severity,
      category: issue.category,
      description: issue.description,
      location: issue.location,
      recommendation: issue.recommendation,
      photos: [photo.url],
    });
  }

  return analysis;
}

async function runInspection(inspectionId: string) {
  const inspection = await (prisma as any).qAInspection.findUnique({
    where: { id: inspectionId },
    include: {
      photos: true,
      checklist: true,
      findings: true,
    },
  } as any);

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  // Update status
  await (prisma as any).qAInspection.update({
    where: { id: inspectionId },
    data: { status: 'in-progress' },
  });

  // Run AI analysis
  const aiAnalysis = await qaService.performAIInspection(inspection as unknown as QAInspection);

  // Determine overall status
  const status = aiAnalysis.qualityScore >= 70 &&
    aiAnalysis.complianceScore >= 80 &&
    aiAnalysis.safetyScore >= 80
    ? 'passed'
    : 'failed';

  // Update inspection
  const updated = await (prisma as any).qAInspection.update({
    where: { id: inspectionId },
    data: {
      status,
      score: Math.round((aiAnalysis.qualityScore + aiAnalysis.complianceScore + aiAnalysis.safetyScore) / 3),
      aiAnalysis: aiAnalysis as any,
      completedAt: new Date(),
    },
  });

  // Emit event
  await eventBus.publish(
    status === 'passed' ? (EVENT_TYPES as any).QA_PASSED : (EVENT_TYPES as any).QA_FAILED,
    {
      inspectionId,
      projectId: inspection.projectId,
      status,
      score: updated.score,
      trade: (inspection as any).trade,
      area: (inspection as any).area,
    }
  );

  // Notify if failed
  if (status === 'failed') {
    await notifyInspectionFailed(inspection as any, aiAnalysis);
  }

  return { inspectionId, status, aiAnalysis };
}

async function generateQAReport(inspectionId: string) {
  const inspection = await (prisma as any).qAInspection.findUnique({
    where: { id: inspectionId },
    include: {
      project: true,
      photos: true,
      checklist: true,
      findings: true,
    },
  } as any);

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  const aiAnalysis = (inspection as any).aiAnalysis as AIAnalysisResult;

  const report = {
    title: `QA Inspection Report - ${(inspection as any).area}`,
    project: (inspection as any).project.name,
    trade: (inspection as any).trade,
    area: (inspection as any).area,
    date: formatDate((inspection as any).completedAt || new Date()),
    status: inspection.status,
    scores: {
      overall: inspection.score,
      quality: aiAnalysis?.qualityScore || 0,
      compliance: aiAnalysis?.complianceScore || 0,
      safety: aiAnalysis?.safetyScore || 0,
    },
    checklist: {
      passed: (inspection as any).checklist?.filter((c: any) => c.status === 'pass').length || 0,
      failed: (inspection as any).checklist?.filter((c: any) => c.status === 'fail').length || 0,
      items: (inspection as any).checklist || [],
    },
    findings: (inspection as any).findings || [],
    photos: (inspection as any).photos?.map((p: any) => ({
      url: p.url,
      location: p.location,
      analysis: p.analysis,
    })) || [],
    aiAssessment: aiAnalysis?.overallAssessment || '',
    recommendations: aiAnalysis?.recommendations || [],
  };

  return report;
}

async function createFinding(data: {
  inspectionId: string;
  severity: QAFinding['severity'];
  category: string;
  description: string;
  location: string;
  recommendation: string;
  rootCause?: string;
  photos?: string[];
  assignedTo?: string;
  dueDate?: string;
}) {
  const finding = await (prisma as any).qAFinding.create({
    data: {
      inspectionId: data.inspectionId,
      severity: data.severity,
      category: data.category,
      description: data.description,
      location: data.location,
      recommendation: data.recommendation,
      rootCause: data.rootCause,
      photos: data.photos || [],
      status: 'open',
      assignedTo: data.assignedTo,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    } as any,
  });

  // Emit event for critical findings
  if (data.severity === 'critical') {
    await eventBus.publish((EVENT_TYPES as any).QA_CRITICAL_FINDING, {
      findingId: finding.id,
      inspectionId: data.inspectionId,
      description: data.description,
      location: data.location,
    });
  }

  return finding;
}

async function verifyCorrection(
  findingId: string,
  verifiedBy: string,
  photos?: string[]
) {
  const finding = await (prisma as any).qAFinding.update({
    where: { id: findingId },
    data: {
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy,
      verificationPhotos: photos || [],
    } as any,
  });

  return finding;
}

async function notifyInspectionFailed(inspection: any, aiAnalysis: AIAnalysisResult) {
  const project = await prisma.project.findUnique({
    where: { id: inspection.projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  } as any);

  if (!project) return;

  const pmEmails = (project as any).projectManagers?.map((pm: any) => pm.user.email) || [];

  if (pmEmails.length > 0) {
    await sendEmail({
      to: pmEmails,
      subject: `QA Inspection Failed: ${inspection.area} - ${project.name}`,
      html: `
        <h2 style="color: #dc2626;">QA Inspection Failed</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Project:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${project.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Area:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${inspection.area}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Trade:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${inspection.trade}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Score:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #dc2626;">${inspection.score}%</td>
          </tr>
        </table>
        <h3>Assessment</h3>
        <p>${aiAnalysis.overallAssessment}</p>
        <h3>Key Findings</h3>
        <ul>
          ${aiAnalysis.keyFindings.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <h3>Recommendations</h3>
        <ul>
          ${aiAnalysis.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
      `,
    });
  }
}

// Create worker
export const qaInspectorWorker = createWorker(
  QUEUE_NAMES.QA_INSPECTOR,
  processQAJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function qaInspectorRoutes(fastify: FastifyInstance) {
  /**
   * Get inspections for a project
   */
  fastify.get('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { status, trade } = request.query as { status?: string; trade?: string };

    const inspections = await (prisma as any).qAInspection.findMany({
      where: {
        projectId,
        ...(status && { status }),
        ...(trade && { trade }),
      },
      include: {
        findings: { select: { id: true, severity: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    } as any);

    return { inspections };
  });

  /**
   * Get inspection by ID
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const inspection = await (prisma as any).qAInspection.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        photos: true,
        checklist: true,
        findings: true,
      },
    } as any);

    if (!inspection) {
      return reply.status(404).send({ error: 'Inspection not found' });
    }

    return inspection;
  });

  /**
   * Create new inspection
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      area: string;
      trade: string;
      type: QAInspection['type'];
      photos?: { url: string; location: string }[];
    };

    // Get standard checklist
    const checklist = qaService.getStandardChecklist(data.trade);

    const inspection = await (prisma as any).qAInspection.create({
      data: {
        projectId: data.projectId,
        area: data.area,
        trade: data.trade,
        type: data.type,
        status: 'pending',
        checklist: {
          create: checklist.map(item => ({
            category: item.category,
            item: item.item,
            standard: item.standard,
            status: 'pending',
          })),
        },
        photos: data.photos ? {
          create: data.photos.map(p => ({
            url: p.url,
            location: p.location,
            capturedAt: new Date(),
            analyzed: false,
          })),
        } : undefined,
      } as any,
      include: {
        checklist: true,
        photos: true,
      },
    });

    return inspection;
  });

  /**
   * Add photo to inspection
   */
  fastify.post('/:id/photos', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { url, location } = request.body as { url: string; location: string };

    const photo = await (prisma as any).qAPhoto.create({
      data: {
        inspectionId: id,
        url,
        location,
        capturedAt: new Date(),
        analyzed: false,
      } as any,
    });

    // Queue analysis
    await queues.QA_INSPECTOR.add(
      'analyze-photo',
      { type: 'ANALYZE_PHOTO', photoId: photo.id, inspectionId: id },
      JOB_OPTIONS.DEFAULT
    );

    return photo;
  });

  /**
   * Update checklist item
   */
  fastify.patch('/:inspectionId/checklist/:itemId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { inspectionId, itemId } = request.params as { inspectionId: string; itemId: string };
    const { status, notes, photo } = request.body as {
      status: QAChecklistItem['status'];
      notes?: string;
      photo?: string;
    };

    const item = await (prisma as any).qAChecklistItem.update({
      where: { id: itemId },
      data: { status, notes, photo } as any,
    });

    return item;
  });

  /**
   * Run AI inspection
   */
  fastify.post('/:id/run', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.QA_INSPECTOR.add(
      'run-inspection',
      { type: 'RUN_INSPECTION', inspectionId: id },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'running' };
  });

  /**
   * Get inspection report
   */
  fastify.get('/:id/report', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const report = await generateQAReport(id);
    return report;
  });

  /**
   * Get quality trends
   */
  fastify.get('/projects/:projectId/trends', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { days = '30' } = request.query as { days?: string };

    const endDate = new Date();
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const trends = await qaService.calculateTrends(projectId, startDate, endDate);
    return trends;
  });

  /**
   * Get checklist template
   */
  fastify.get('/templates/checklist/:trade', async (request: FastifyRequest, reply: FastifyReply) => {
    const { trade } = request.params as { trade: string };

    const checklist = qaService.getStandardChecklist(trade);
    return { trade, items: checklist };
  });

  /**
   * Create finding
   */
  fastify.post('/:inspectionId/findings', async (request: FastifyRequest, reply: FastifyReply) => {
    const { inspectionId } = request.params as { inspectionId: string };
    const data = request.body as Omit<QAFinding, 'id' | 'status'>;

    const finding = await createFinding({
      inspectionId,
      ...data,
    } as any);

    return finding;
  });

  /**
   * Verify finding correction
   */
  fastify.post('/findings/:findingId/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const { findingId } = request.params as { findingId: string };
    const { verifiedBy, photos } = request.body as { verifiedBy: string; photos?: string[] };

    const finding = await verifyCorrection(findingId, verifiedBy, photos);
    return finding;
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      inspectionsToday,
      passedToday,
      failedToday,
      openFindings,
      criticalFindings,
    ] = await Promise.all([
      (prisma as any).qAInspection.count({
        where: { completedAt: { gte: today } },
      }),
      (prisma as any).qAInspection.count({
        where: { completedAt: { gte: today }, status: 'passed' },
      }),
      (prisma as any).qAInspection.count({
        where: { completedAt: { gte: today }, status: 'failed' },
      }),
      (prisma as any).qAFinding.count({
        where: { status: 'open' },
      }),
      (prisma as any).qAFinding.count({
        where: { status: 'open', severity: 'critical' },
      }),
    ]);

    return {
      inspectionsToday,
      passedToday,
      failedToday,
      passRate: inspectionsToday > 0 ? Math.round((passedToday / inspectionsToday) * 100) : 0,
      openFindings,
      criticalFindings,
    };
  });
}
