import { prisma } from '@kealee/database';
import { SITE_PLAN_STAGES, applySitePlanEvent, assertJurisdictionAutomationReady,
  classifyEngineeringDocument, createSitePlanWorkflow, generateCivilSitePlan } from '@kealee/os-engineering';
import type { CivilSitePlanInput, SitePlanWorkflowEvent } from '@kealee/os-engineering';
import { PRELIMINARY_FEASIBILITY_DISCLAIMER } from '@kealee/os-engineering';
import { createQueue, KEALEE_QUEUES } from '@kealee/queue';
import type { EngineeringJobData } from '@kealee/queue';
import { getAiAutomationConfig } from '@kealee/core-config';
import { createHash } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { getSignedUrl, uploadDocument } from '@kealee/storage';
import { AuthorizationError, NotFoundError, ValidationError } from '../../errors/app.error';

const db = prisma as any;
let engineeringQueue: ReturnType<typeof createQueue> | undefined;
function getEngineeringQueue() {
  engineeringQueue ??= createQueue(KEALEE_QUEUES.ENGINEERING_PROCESSING);
  return engineeringQueue;
}
function engineeringQueueJobId(idempotencyKey: string) {
  return createHash('sha256').update(idempotencyKey).digest('hex');
}
async function assertProjectAccess(projectId: string, userId: string) {
  const project = await db.project.findUnique({ where: { id: projectId }, select: {
    id: true, orgId: true, ownerId: true, memberships: { where: { userId }, select: { id: true } },
  } });
  if (!project) throw new NotFoundError('Project', projectId);
  if (project.ownerId !== userId && !project.memberships.length) throw new AuthorizationError('Project access denied');
  return project;
}

const OPERATIONS_ROLES = new Set(['admin', 'super_admin', 'pm', 'operations']);
const EXTRACTION_LAYERS = new Set(['BOUNDARY', 'EASEMENTS', 'RIGHT-OF-WAY', 'EXISTING-CONTOURS',
  'PROPOSED-CONTOURS', 'EXISTING-STRUCTURES', 'PROPOSED-STRUCTURES', 'SETBACKS', 'UTILITIES',
  'STORM-DRAIN', 'SWM-BMP', 'EROSION-CONTROL', 'LIMIT-OF-DISTURBANCE', 'TREE-SAVE',
  'WOODLAND-CLEARING', 'FLOODPLAIN', 'STREAM-BUFFER', 'WETLAND', 'ANNOTATIONS']);

export async function extractSitePlanDocument(user: { id: string; role: string; organizationId?: string | null },
  workflowId: string, file: { buffer: Buffer; filename: string; mediaType: string },
  options: { crs: string; units: 'FEET' | 'METERS' }) {
  const config = getAiAutomationConfig();
  if (!config.sitePlanAutomationEnabled) throw new ValidationError('Site-plan automation is disabled');
  if (!OPERATIONS_ROLES.has(user.role.toLowerCase())) throw new AuthorizationError('Operations access denied');
  if (!process.env.ANTHROPIC_API_KEY) throw new ValidationError('Document extraction is unavailable: AI provider is not configured');
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  if (!['admin', 'super_admin'].includes(user.role.toLowerCase()) && workflow.organizationId !== user.organizationId) {
    throw new AuthorizationError('Site-plan workflow access denied');
  }
  if (!['DOCUMENT_COLLECTION', 'PLAN_GENERATION'].includes(workflow.currentStage)) {
    throw new ValidationError('Plat and survey extraction is only available during document collection or plan generation');
  }
  const uploaded = await uploadDocument({ projectId: workflow.projectId, type: 'design', file: file.buffer,
    filename: file.filename, uploadedBy: user.id }, { prisma: db });
  const sourceRetrievedAt = new Date().toISOString();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const content = file.mediaType === 'application/pdf'
    ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.buffer.toString('base64') } },
      { type: 'text', text: sitePlanExtractionPrompt(options.crs, options.units, uploaded.documentId, sourceRetrievedAt) }]
    : [{ type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.buffer.toString('base64') } },
      { type: 'text', text: sitePlanExtractionPrompt(options.crs, options.units, uploaded.documentId, sourceRetrievedAt) }];
  const response = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8192,
    system: 'You extract reviewable civil geometry from plats and surveys. Never infer a surveyed fact that is not legible.',
    messages: [{ role: 'user', content: content as any }] });
  const raw = response.content.find(block => block.type === 'text');
  if (!raw || raw.type !== 'text' || typeof raw.text !== 'string') {
    throw new ValidationError('Document extraction returned no structured result');
  }
  let parsed: any;
  try { parsed = JSON.parse(raw.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
  catch { throw new ValidationError('Document extraction returned invalid JSON'); }
  const geometry = normalizeExtractedGeometry(parsed.geometry, uploaded.documentId, sourceRetrievedAt);
  if (!geometry.length) throw new ValidationError('No reliable coordinate geometry could be extracted; enter geometry manually or provide a clearer scaled survey');
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.map(String).slice(0, 50) : [];
  warnings.push('AI-extracted geometry requires operator verification against the source document.');
  const extraction = { documentId: uploaded.documentId, documentUrl: uploaded.url, filename: file.filename,
    crs: options.crs, units: options.units, geometry, warnings, reviewRequired: true, extractedAt: sourceRetrievedAt };
  const stage = await db.sitePlanStageExecution.findFirst({ where: { workflowId, stage: 'DOCUMENT_COLLECTION' },
    orderBy: { attempt: 'desc' } });
  await db.$transaction(async (tx: any) => {
    if (stage) await tx.sitePlanStageExecution.update({ where: { id: stage.id }, data: {
      outputs: { ...(typeof stage.outputs === 'object' && stage.outputs ? stage.outputs : {}), latestExtraction: extraction },
    } });
    await tx.workflowEvent.create({ data: { eventType: 'SITE_PLAN_DOCUMENT_EXTRACTED', subjectType: 'PROJECT',
      subjectId: workflow.projectId, payload: { workflowId, actorId: user.id, documentId: uploaded.documentId,
        geometryCount: geometry.length, reviewRequired: true },
      idempotencyKey: `site-plan-extraction:${workflowId}:${uploaded.documentId}`, processedAt: new Date() } });
  });
  return extraction;
}

export async function enqueueSitePlanDocumentExtraction(
  user: { id: string; role: string; organizationId?: string | null },
  workflowId: string,
  file: { buffer: Buffer; filename: string; mediaType: string },
  options: { crs: string; units: 'FEET' | 'METERS'; idempotencyKey: string },
) {
  const config = getAiAutomationConfig();
  if (!config.sitePlanAutomationEnabled || !config.engineeringInfillPhase1Enabled) {
    throw new ValidationError('Phase 1 engineering automation is disabled');
  }
  if (!config.engineeringSurveyOcrEnabled) throw new ValidationError('Engineering survey OCR is disabled');
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  if (OPERATIONS_ROLES.has(user.role.toLowerCase())) {
    if (!['admin', 'super_admin'].includes(user.role.toLowerCase()) && workflow.organizationId !== user.organizationId) {
      throw new AuthorizationError('Site-plan workflow access denied');
    }
  } else await assertProjectAccess(workflow.projectId, user.id);
  const classification = classifyEngineeringDocument(file.filename, file.mediaType, file.buffer.length, 100 * 1024 * 1024);
  if (!['BOUNDARY_SURVEY', 'TOPOGRAPHIC_SURVEY', 'RECORDED_PLAT'].includes(classification.documentType)) {
    throw new ValidationError('This endpoint accepts a boundary survey, topographic survey, or recorded plat');
  }
  const contentHash = createHash('sha256').update(file.buffer).digest('hex');
  const duplicate = await db.fileUpload.findFirst({ where: { projectId: workflow.projectId,
    metadata: { path: ['engineeringContentHash'], equals: contentHash } } });
  const uploaded = duplicate
    ? { documentId: duplicate.id, url: duplicate.fileUrl }
    : await uploadDocument({ projectId: workflow.projectId, type: 'design', file: file.buffer,
      filename: file.filename, uploadedBy: user.id }, { prisma: db });
  if (!duplicate) {
    const newlyUploaded = await db.fileUpload.findUnique({ where: { id: uploaded.documentId } });
    await db.fileUpload.update({ where: { id: uploaded.documentId }, data: { metadata: {
      ...(newlyUploaded?.metadata ?? {}), engineeringContentHash: contentHash,
      documentType: classification.documentType, antivirusStatus: classification.antivirusStatus,
      classificationVersion: classification.toolVersion,
    } } });
  }
  const sourceFile = duplicate ?? await db.fileUpload.findUnique({ where: { id: uploaded.documentId } });
  const sourceBucket = String(sourceFile?.metadata?.bucket ?? '');
  const sourcePath = String(sourceFile?.metadata?.storagePath ?? '');
  if (!sourceBucket || !sourcePath) throw new ValidationError('Survey storage metadata is incomplete');
  const workerSourceUrl = await getSignedUrl(sourceBucket, sourcePath, 21600);
  const jurisdictionCode = String(workflow.metadata?.jurisdictionCode ?? '');
  const engineeringProject = await db.engineeringProject.upsert({
    where: { organizationId_projectId: { organizationId: workflow.organizationId, projectId: workflow.projectId } },
    create: { organizationId: workflow.organizationId, projectId: workflow.projectId,
      sitePlanWorkflowId: workflow.id, jurisdictionCode, status: 'ACTIVE' },
    update: { sitePlanWorkflowId: workflow.id, jurisdictionCode },
  });
  const jobData: EngineeringJobData = {
    type: 'SURVEY_OCR', organizationId: workflow.organizationId, projectId: workflow.projectId,
    engineeringProjectId: engineeringProject.id, workflowId, stageCode: 'SURVEY_EXTRACTION',
    idempotencyKey: options.idempotencyKey, actorId: user.id, documentId: uploaded.documentId,
    sourceUrl: workerSourceUrl, sourceContentHash: contentHash,
    options: { crs: options.crs, units: options.units },
    requestedAt: new Date().toISOString(),
  };
  await db.engineeringStage.upsert({ where: { idempotencyKey: options.idempotencyKey },
    create: { engineeringProjectId: engineeringProject.id, stageCode: 'SURVEY_EXTRACTION',
      status: 'READY', inputs: jobData, outputs: {}, sourceProvenance: { documentId: uploaded.documentId,
        contentHash, classification }, confidence: 0, blockingIssues: [],
      calculationVersion: 'kealee-engineering-worker-1.0.0', auditHistory: [{
        at: new Date().toISOString(), action: 'QUEUED', actorId: user.id,
      }], idempotencyKey: options.idempotencyKey },
    update: {} });
  const job = await getEngineeringQueue().add('SURVEY_OCR', jobData, {
    jobId: engineeringQueueJobId(options.idempotencyKey),
    attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  return { jobId: String(job.id), status: await job.getState(), documentId: uploaded.documentId,
    duplicate: Boolean(duplicate), reviewRequired: true };
}

export async function getEngineeringJob(user: { id: string; role: string; organizationId?: string | null },
  workflowId: string, jobId: string) {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  if (OPERATIONS_ROLES.has(user.role.toLowerCase())) {
    if (!['admin', 'super_admin'].includes(user.role.toLowerCase()) && workflow.organizationId !== user.organizationId) {
      throw new AuthorizationError('Site-plan workflow access denied');
    }
  } else await assertProjectAccess(workflow.projectId, user.id);
  const job = await getEngineeringQueue().getJob(jobId);
  if (!job || job.data.workflowId !== workflowId || job.data.organizationId !== workflow.organizationId) {
    throw new NotFoundError('EngineeringJob', jobId);
  }
  return { id: String(job.id), state: await job.getState(), progress: job.progress,
    result: job.returnvalue ?? null, failedReason: job.failedReason || null };
}

export async function enqueueEngineeringTask(
  user: { id: string; role: string; organizationId?: string | null },
  workflowId: string,
  input: { type: EngineeringJobData['type']; stageCode: string; idempotencyKey: string;
    scenarioId?: string; options: Record<string, unknown> },
) {
  if (!OPERATIONS_ROLES.has(user.role.toLowerCase())) throw new AuthorizationError('Operations access denied');
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  if (!['admin', 'super_admin'].includes(user.role.toLowerCase()) && workflow.organizationId !== user.organizationId) {
    throw new AuthorizationError('Site-plan workflow access denied');
  }
  const engineeringProject = await db.engineeringProject.findFirst({ where: { sitePlanWorkflowId: workflowId } });
  if (!engineeringProject) throw new ValidationError('Upload and classify source documents before running engineering tasks');
  const data: EngineeringJobData = { type: input.type, organizationId: workflow.organizationId,
    projectId: workflow.projectId, engineeringProjectId: engineeringProject.id, workflowId,
    scenarioId: input.scenarioId,
    stageCode: input.stageCode, idempotencyKey: input.idempotencyKey, actorId: user.id,
    options: input.options, requestedAt: new Date().toISOString() };
  await db.engineeringStage.upsert({ where: { idempotencyKey: input.idempotencyKey },
    create: { engineeringProjectId: engineeringProject.id, stageCode: input.stageCode, status: 'READY',
      inputs: data, outputs: {}, sourceProvenance: {}, confidence: 0, blockingIssues: [],
      calculationVersion: 'kealee-engineering-worker-1.0.0', auditHistory: [{
        at: new Date().toISOString(), action: 'QUEUED', actorId: user.id,
      }], idempotencyKey: input.idempotencyKey },
    update: {} });
  const job = await getEngineeringQueue().add(input.type, data, {
    jobId: engineeringQueueJobId(input.idempotencyKey),
    attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  return { jobId: String(job.id), status: await job.getState() };
}

export async function createAndSolveSiteFitScenario(
  user: { id: string; role: string; organizationId?: string | null },
  workflowId: string,
  input: {
    name: string;
    idempotencyKey: string;
    boundary: { type: 'Polygon'; coordinates: number[][][] };
    crs: string;
    source: { provider: string; effectiveDate?: string; confidence: number };
    ruleSet: {
      version: string;
      uniformSetback: number;
      maxLotCoveragePercent?: number;
      maxFar?: number;
      maxHeightFeet?: number;
      parkingSpacesPerUnit?: number;
      sourceReferences: string[];
      humanVerified: boolean;
    };
    program: {
      typology: 'SINGLE_FAMILY' | 'TOWNHOME' | 'GARDEN_MULTIFAMILY' |
        'WRAP_PODIUM_MULTIFAMILY' | 'SURFACE_PARKING' | 'SMALL_MIXED_USE';
      targetUnits: number;
      averageUnitSqFt: number;
      stories: number;
      parkingSpacesPerUnit?: number;
    };
    objectiveWeights?: Record<string, number>;
    randomSeed: number;
  },
) {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  await assertProjectAccess(workflow.projectId, user.id);
  if (!['DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION'].includes(workflow.currentStage)) {
    throw new ValidationError('Site-fit scenarios are available during document collection, feasibility, or plan generation');
  }
  const boundaryHash = createHash('sha256').update(JSON.stringify(input.boundary)).digest('hex');
  const existingStage = await db.engineeringStage.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existingStage) {
    const existingJob = await getEngineeringQueue().getJob(engineeringQueueJobId(input.idempotencyKey));
    return {
      scenarioId: String(existingStage.inputs?.scenarioId ?? ''),
      jobId: existingJob ? String(existingJob.id) : engineeringQueueJobId(input.idempotencyKey),
      status: existingJob ? await existingJob.getState() : existingStage.status,
      disclaimer: PRELIMINARY_FEASIBILITY_DISCLAIMER,
    };
  }
  const engineeringProject = await db.engineeringProject.upsert({
    where: { organizationId_projectId: {
      organizationId: workflow.organizationId,
      projectId: workflow.projectId,
    } },
    create: {
      organizationId: workflow.organizationId,
      projectId: workflow.projectId,
      sitePlanWorkflowId: workflow.id,
      jurisdictionCode: String(workflow.metadata?.jurisdictionCode ?? 'UNVERIFIED'),
      status: 'ACTIVE',
    },
    update: { sitePlanWorkflowId: workflow.id },
  });
  const created = await db.$transaction(async (tx: any) => {
    const dataset = await tx.siteSourceDataset.upsert({
      where: { organizationId_projectId_type_checksum: {
        organizationId: workflow.organizationId,
        projectId: workflow.projectId,
        type: 'USER_UPLOAD',
        checksum: boundaryHash,
      } },
      create: {
        organizationId: workflow.organizationId,
        projectId: workflow.projectId,
        parcelId: workflow.parcelId,
        type: 'USER_UPLOAD',
        provider: input.source.provider,
        retrievedAt: new Date(),
        effectiveDate: input.source.effectiveDate ? new Date(input.source.effectiveDate) : null,
        crs: input.crs,
        linearUnit: 'FT',
        checksum: boundaryHash,
        confidence: input.source.confidence,
        metadata: { format: 'GeoJSON', boundary: input.boundary },
        createdBy: user.id,
      },
      update: {},
    });
    let study = await tx.feasibilityStudy.findFirst({
      where: { projectId: workflow.projectId, orgId: workflow.organizationId },
      orderBy: { updatedAt: 'desc' },
    });
    study ??= await tx.feasibilityStudy.create({
      data: {
        projectId: workflow.projectId,
        parcelId: workflow.parcelId,
        orgId: workflow.organizationId,
        title: `${input.name} feasibility`,
        productType: input.program.typology.toLowerCase(),
        targetUnits: input.program.targetUnits,
        createdBy: user.id,
      },
    });
    const solverInput = {
      boundary: input.boundary,
      crs: input.crs,
      linearUnit: 'FT',
      sourceDatasetIds: [dataset.id],
      ruleSet: input.ruleSet,
      program: input.program,
      objectiveWeights: input.objectiveWeights,
      randomSeed: input.randomSeed,
    };
    const scenario = await tx.feasibilityScenario.create({
      data: {
        studyId: study.id,
        name: input.name,
        typology: input.program.typology,
        siteFitStatus: 'SOLVING',
        inputs: solverInput,
        objectiveWeights: input.objectiveWeights ?? {},
        ruleSetVersion: input.ruleSet.version,
        randomSeed: input.randomSeed,
        unitMix: input.program,
        totalUnits: input.program.targetUnits,
        reviewStatus: 'NOT_REQUESTED',
        warnings: [PRELIMINARY_FEASIBILITY_DISCLAIMER],
      },
    });
    const data: EngineeringJobData = {
      type: 'SOLVE_SCENARIO',
      organizationId: workflow.organizationId,
      projectId: workflow.projectId,
      engineeringProjectId: engineeringProject.id,
      workflowId,
      scenarioId: scenario.id,
      stageCode: 'FEASIBILITY_SCENARIO',
      idempotencyKey: input.idempotencyKey,
      actorId: user.id,
      options: solverInput,
      requestedAt: new Date().toISOString(),
    };
    await tx.engineeringStage.create({
      data: {
        engineeringProjectId: engineeringProject.id,
        stageCode: 'FEASIBILITY_SCENARIO',
        status: 'READY',
        inputs: data,
        outputs: {},
        sourceProvenance: { sourceDatasetId: dataset.id, boundaryHash },
        confidence: 0,
        blockingIssues: [],
        calculationVersion: 'kealee-site-fit-1.0.0',
        auditHistory: [{ at: new Date().toISOString(), action: 'QUEUED', actorId: user.id }],
        idempotencyKey: input.idempotencyKey,
      },
    });
    return { scenario, data };
  });
  const job = await getEngineeringQueue().add('SOLVE_SCENARIO', created.data, {
    jobId: engineeringQueueJobId(input.idempotencyKey),
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
  return {
    scenarioId: created.scenario.id,
    jobId: String(job.id),
    status: await job.getState(),
    disclaimer: PRELIMINARY_FEASIBILITY_DISCLAIMER,
  };
}

export async function getSiteFitScenario(
  user: { id: string; role: string; organizationId?: string | null },
  workflowId: string,
  scenarioId: string,
) {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  await assertProjectAccess(workflow.projectId, user.id);
  const scenario = await db.feasibilityScenario.findFirst({
    where: {
      id: scenarioId,
      study: { projectId: workflow.projectId, orgId: workflow.organizationId },
    },
    include: {
      options: {
        orderBy: { ordinal: 'asc' },
        include: { validationRuns: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
  });
  if (!scenario) throw new NotFoundError('FeasibilityScenario', scenarioId);
  return { ...scenario, disclaimer: PRELIMINARY_FEASIBILITY_DISCLAIMER };
}

export async function cancelEngineeringJob(user: { id: string; role: string; organizationId?: string | null },
  workflowId: string, jobId: string) {
  const current = await getEngineeringJob(user, workflowId, jobId);
  const job = await getEngineeringQueue().getJob(jobId);
  if (!job) throw new NotFoundError('EngineeringJob', jobId);
  if (['completed', 'failed'].includes(current.state)) throw new ValidationError('Completed engineering jobs cannot be cancelled');
  await job.remove();
  await db.engineeringStage.updateMany({ where: { idempotencyKey: job.data.idempotencyKey },
    data: { status: 'SUPERSEDED', blockingIssues: ['Cancelled by operator'] } });
  return { id: jobId, state: 'cancelled' };
}

export async function getEngineeringDrawingDownload(userId: string, workflowId: string,
  packageId: string, kind: 'DXF' | 'PDF' | 'PREVIEW' | 'REPORT') {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  await assertProjectAccess(workflow.projectId, userId);
  const engineeringProject = await db.engineeringProject.findFirst({ where: { sitePlanWorkflowId: workflowId } });
  if (!engineeringProject) throw new NotFoundError('EngineeringProject', workflowId);
  const drawing = await db.engineeringDrawingPackage.findFirst({ where: {
    id: packageId, engineeringProjectId: engineeringProject.id,
  } });
  if (!drawing) throw new NotFoundError('EngineeringDrawingPackage', packageId);
  const documentId = { DXF: drawing.dxfDocumentId, PDF: drawing.pdfDocumentId,
    PREVIEW: drawing.previewDocumentId, REPORT: drawing.reportDocumentId }[kind];
  if (!documentId) throw new ValidationError(`${kind} artifact is not available`);
  const file = await db.fileUpload.findUnique({ where: { id: documentId } });
  if (!file) throw new NotFoundError('FileUpload', documentId);
  const bucket = String(file.metadata?.bucket ?? '');
  const path = String(file.metadata?.storagePath ?? '');
  if (!bucket || !path) throw new ValidationError('Artifact storage metadata is incomplete');
  return { url: await getSignedUrl(bucket, path, 900), expiresInSeconds: 900, kind };
}

function sitePlanExtractionPrompt(crs: string, units: 'FEET' | 'METERS', sourceId: string, retrievedAt: string) {
  return `Extract only clearly supported site geometry from this plat or survey as JSON.
Target CRS label: ${crs}. Units: ${units}. Do not transform coordinates unless the document supplies enough information.
Return {"geometry": [...], "warnings": [...]} only. Each geometry item must be:
{"id":"string","layer":"BOUNDARY|EASEMENTS|RIGHT-OF-WAY|EXISTING-CONTOURS|PROPOSED-CONTOURS|EXISTING-STRUCTURES|PROPOSED-STRUCTURES|SETBACKS|UTILITIES|STORM-DRAIN|SWM-BMP|EROSION-CONTROL|LIMIT-OF-DISTURBANCE|TREE-SAVE|WOODLAND-CLEARING|FLOODPLAIN|STREAM-BUFFER|WETLAND|ANNOTATIONS","vertices":[{"x":number,"y":number}],"closed":boolean,"authority":"EXTRACTED","sourceId":"${sourceId}","sourceRetrievedAt":"${retrievedAt}","confidence":number}.
Use a local origin if the sheet gives bearings/distances but no coordinates, preserving stated dimensions in ${units}. Confidence must not exceed 0.85. Closed geometry requires at least 3 vertices. Return an empty geometry array when scale or dimensions are insufficient. Record illegible, missing, or ambiguous facts in warnings.`;
}

export function normalizeExtractedGeometry(value: unknown, sourceId: string, sourceRetrievedAt: string) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: any, index: number) => {
    if (!item || !EXTRACTION_LAYERS.has(item.layer) || !Array.isArray(item.vertices)) return [];
    const vertices = item.vertices.map((point: any) => ({ x: Number(point?.x), y: Number(point?.y) }))
      .filter((point: { x: number; y: number }) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const closed = Boolean(item.closed);
    if (vertices.length < (closed ? 3 : 2)) return [];
    return [{ id: String(item.id || `extracted-${index + 1}`).slice(0, 200), layer: item.layer, vertices, closed,
      authority: 'EXTRACTED', sourceId, sourceRetrievedAt, confidence: Math.min(0.85, Math.max(0, Number(item.confidence) || 0)) }];
  });
}

export async function listProfessionalReviews(userId: string) {
  const profile = await db.marketplaceProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];

  const assignments = await db.professionalAssignment.findMany({
    where: { profileId: profile.id },
    select: { id: true },
  });
  const assignmentIds = assignments.map((assignment: { id: string }) => assignment.id);
  if (!assignmentIds.length) return [];

  const reviews = await db.professionalReviewRecord.findMany({
    where: { professionalAssignmentId: { in: assignmentIds } },
    orderBy: [{ decision: 'asc' }, { updatedAt: 'desc' }],
  });
  const workflowIds = [...new Set(reviews.map((review: { workflowId: string }) => review.workflowId))];
  const [workflows, stages, compliance] = await Promise.all([
    db.sitePlanWorkflow.findMany({ where: { id: { in: workflowIds } } }),
    db.sitePlanStageExecution.findMany({ where: { workflowId: { in: workflowIds } }, orderBy: { updatedAt: 'desc' } }),
    db.sitePlanComplianceResult.findMany({ where: { workflowId: { in: workflowIds }, blocksSubmission: true } }),
  ]);
  const workflowById = new Map(workflows.map((workflow: any) => [workflow.id, workflow]));
  return reviews.map((review: any) => ({
    ...review,
    workflow: workflowById.get(review.workflowId) ?? null,
    stages: stages.filter((stage: any) => stage.workflowId === review.workflowId),
    blockingComplianceCount: compliance.filter((result: any) => result.workflowId === review.workflowId).length,
  }));
}

export async function recordProfessionalReviewDecision(userId: string, reviewId: string, input: {
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  declaration: string;
  licenseNumber: string;
  sourceDocumentId?: string;
  sealedDocumentId?: string;
  sourceContentHash?: string;
  sealedContentHash?: string;
  redlines?: string[];
}) {
  const review = await db.professionalReviewRecord.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('ProfessionalReviewRecord', reviewId);
  if (review.decision !== 'PENDING') throw new ValidationError('This professional review already has a final decision');
  const assignment = await db.professionalAssignment.findFirst({
    where: { id: review.professionalAssignmentId, profile: { userId } },
    select: { id: true },
  });
  if (!assignment) throw new AuthorizationError('Professional assignment access denied');
  if (review.licenseNumber !== input.licenseNumber) throw new ValidationError('License number does not match the assignment');
  if (!review.licenseVerifiedAt || (review.expiresAt && review.expiresAt <= new Date())) {
    throw new ValidationError('A current verified professional license is required');
  }
  if (input.decision === 'APPROVED') {
    if (!input.sourceDocumentId || !input.sealedDocumentId || !input.sourceContentHash || !input.sealedContentHash) {
      throw new ValidationError('Approval requires source and sealed document evidence');
    }
    if (input.sourceContentHash === input.sealedContentHash) {
      throw new ValidationError('The sealed deliverable must be a separately signed, version-locked artifact');
    }
    const blockers = await db.sitePlanComplianceResult.count({ where: { workflowId: review.workflowId, blocksSubmission: true } });
    if (blockers) throw new ValidationError('Blocking compliance findings must be resolved before approval');
  }
  if (input.decision === 'CHANGES_REQUESTED' && !input.redlines?.length) {
    throw new ValidationError('Revision requests require at least one redline');
  }
  const updated = await db.professionalReviewRecord.updateMany({
    where: { id: reviewId, decision: 'PENDING' },
    data: {
      decision: input.decision,
      declaration: input.declaration,
      sourceDocumentId: input.sourceDocumentId,
      sealedDocumentId: input.sealedDocumentId,
      sourceContentHash: input.sourceContentHash,
      sealedContentHash: input.sealedContentHash,
      decidedAt: new Date(),
      metadata: { ...(typeof review.metadata === 'object' && review.metadata ? review.metadata : {}), redlines: input.redlines ?? [] },
    },
  });
  if (updated.count !== 1) throw new ValidationError('This professional review already has a final decision');
  return db.professionalReviewRecord.findUnique({ where: { id: reviewId } });
}

/** Persist a professional's review edits as an auditable revision before a decision. */
export async function saveProfessionalReviewEdits(userId: string, reviewId: string, input: {
  revision: number;
  geometry: unknown;
  redlines: string[];
  notes?: string;
}) {
  const review = await db.professionalReviewRecord.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('ProfessionalReviewRecord', reviewId);
  const assignment = await db.professionalAssignment.findFirst({
    where: { id: review.professionalAssignmentId, profile: { userId } }, select: { id: true },
  });
  if (!assignment) throw new AuthorizationError('Professional assignment access denied');
  if (!['PENDING', 'CHANGES_REQUESTED'].includes(review.decision)) {
    throw new ValidationError('Edits can only be saved before approval or release');
  }
  const metadata = typeof review.metadata === 'object' && review.metadata ? review.metadata as Record<string, unknown> : {};
  const revisions = Array.isArray(metadata.revisions) ? metadata.revisions : [];
  const revisionRecord = {
    revision: input.revision, geometry: input.geometry, redlines: input.redlines,
    notes: input.notes, editedById: userId, editedAt: new Date().toISOString(),
  };
  return db.professionalReviewRecord.update({ where: { id: reviewId }, data: {
    metadata: { ...metadata, currentRevision: input.revision, revisions: [...revisions, revisionRecord], redlines: input.redlines },
  } });
}

/** Release a signed/sealed professional deliverable. Kealee never fabricates a seal. */
export async function releaseProfessionalReview(userId: string, reviewId: string, declaration: string) {
  const review = await db.professionalReviewRecord.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('ProfessionalReviewRecord', reviewId);
  const assignment = await db.professionalAssignment.findFirst({
    where: { id: review.professionalAssignmentId, profile: { userId } }, select: { id: true },
  });
  if (!assignment) throw new AuthorizationError('Professional assignment access denied');
  if (review.decision !== 'APPROVED') throw new ValidationError('The review must be approved before release');
  if (!review.sourceDocumentId || !review.sealedDocumentId || !review.sourceContentHash || !review.sealedContentHash) {
    throw new ValidationError('Release requires immutable source and signed/sealed document evidence');
  }
  if (!review.licenseVerifiedAt || (review.expiresAt && review.expiresAt <= new Date())) {
    throw new ValidationError('A current verified professional license is required for release');
  }
  const blockers = await db.sitePlanComplianceResult.count({ where: { workflowId: review.workflowId, blocksSubmission: true } });
  if (blockers) throw new ValidationError('Blocking compliance findings must be resolved before release');
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: review.workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', review.workflowId);
  if (workflow.releasedAt) return { review, workflow };
  const releasedAt = new Date();
  const updatedReview = await db.$transaction(async (tx: any) => {
    const updated = await tx.sitePlanWorkflow.updateMany({ where: { id: workflow.id, releasedAt: null }, data: {
      status: 'RELEASED', releasedAt, metadata: { ...(workflow.metadata ?? {}), releasedById: userId,
        releasedAt: releasedAt.toISOString(), releaseDeclaration: declaration },
    } });
    if (updated.count !== 1) throw new ValidationError('The workflow was released by another request');
    await tx.sitePlanStageExecution.updateMany({ where: { workflowId: workflow.id, stage: 'PROFESSIONAL_REVIEW' }, data: {
      status: 'APPROVED', reviewedById: userId, reviewedAt: releasedAt, completedAt: releasedAt,
    } });
    return tx.professionalReviewRecord.update({ where: { id: review.id }, data: {
      metadata: { ...(review.metadata ?? {}), releasedById: userId, releasedAt: releasedAt.toISOString(), releaseDeclaration: declaration },
    } });
  });
  return { review: updatedReview, workflow: { ...workflow, status: 'RELEASED', releasedAt } };
}

export async function listOperationsQueue(user: { role: string; organizationId?: string | null }) {
  if (!OPERATIONS_ROLES.has(user.role.toLowerCase())) throw new AuthorizationError('Operations access denied');
  const where = ['admin', 'super_admin'].includes(user.role.toLowerCase())
    ? {}
    : { organizationId: user.organizationId ?? '__no_organization__' };
  const workflows = await db.sitePlanWorkflow.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 200 });
  const workflowIds = workflows.map((workflow: { id: string }) => workflow.id);
  const [stages, compliance, reviews, corrections] = await Promise.all([
    db.sitePlanStageExecution.findMany({ where: { workflowId: { in: workflowIds } }, orderBy: { updatedAt: 'desc' } }),
    db.sitePlanComplianceResult.findMany({ where: { workflowId: { in: workflowIds }, blocksSubmission: true } }),
    db.professionalReviewRecord.findMany({ where: { workflowId: { in: workflowIds } }, orderBy: { updatedAt: 'desc' } }),
    db.permitCorrectionCycle.findMany({ where: { workflowId: { in: workflowIds }, status: { not: 'CLOSED' } } }),
  ]);
  const engineeringProjects = await db.engineeringProject.findMany({ where: { sitePlanWorkflowId: { in: workflowIds } } });
  const drawingPackages = await db.engineeringDrawingPackage.findMany({ where: {
    engineeringProjectId: { in: engineeringProjects.map((project: any) => project.id) },
  } });
  const redlines = await db.engineeringRedline.findMany({ where: {
    drawingPackageId: { in: drawingPackages.map((drawing: any) => drawing.id) }, status: { not: 'RESOLVED' },
  } });
  return workflows.map((workflow: any) => ({
    ...workflow,
    stages: stages.filter((stage: any) => stage.workflowId === workflow.id),
    blockingComplianceCount: compliance.filter((result: any) => result.workflowId === workflow.id).length,
    pendingReviewCount: reviews.filter((review: any) => review.workflowId === workflow.id && review.decision === 'PENDING').length,
    openCorrectionCount: corrections.filter((cycle: any) => cycle.workflowId === workflow.id).length,
    openRedlineCount: redlines.filter((redline: any) => drawingPackages.some((drawing: any) =>
      drawing.id === redline.drawingPackageId && engineeringProjects.some((project: any) =>
        project.id === drawing.engineeringProjectId && project.sitePlanWorkflowId === workflow.id))).length,
  }));
}

export async function generateSitePlanArtifact(user: { id: string; role: string; organizationId?: string | null },
  workflowId: string, idempotencyKey: string, input: Omit<CivilSitePlanInput, 'id'>) {
  const config = getAiAutomationConfig();
  if (!config.sitePlanAutomationEnabled) throw new ValidationError('Site-plan automation is disabled');
  if (!OPERATIONS_ROLES.has(user.role.toLowerCase())) throw new AuthorizationError('Operations access denied');
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  if (!['admin', 'super_admin'].includes(user.role.toLowerCase()) && workflow.organizationId !== user.organizationId) {
    throw new AuthorizationError('Site-plan workflow access denied');
  }
  if (workflow.currentStage !== 'PLAN_GENERATION') {
    throw new ValidationError('Site-plan artifacts can only be generated during the plan generation stage');
  }
  const stage = await db.sitePlanStageExecution.findFirst({
    where: { workflowId, stage: 'PLAN_GENERATION' }, orderBy: { attempt: 'desc' },
  });
  if (!stage || !['IN_PROGRESS', 'UNDER_REVIEW'].includes(stage.status)) {
    throw new ValidationError('The plan generation stage must be started before generating an artifact');
  }
  const jurisdictionCode = typeof workflow.metadata?.jurisdictionCode === 'string'
    ? workflow.metadata.jurisdictionCode : undefined;
  if (!jurisdictionCode) {
    throw new ValidationError('Site-plan generation requires a resolved local jurisdiction');
  }
  try {
    assertJurisdictionAutomationReady(jurisdictionCode);
  } catch (error) {
    throw new ValidationError(error instanceof Error ? error.message : 'Local jurisdiction rules are not automation-ready');
  }
  if (input.requestedClassification === 'PERMIT_READY') {
    const [blockingFindings, approval] = await Promise.all([
      db.sitePlanComplianceResult.count({ where: { workflowId, blocksSubmission: true } }),
      input.professionalApprovalId ? db.professionalReviewRecord.findFirst({ where: {
        id: input.professionalApprovalId, workflowId, decision: 'APPROVED',
      } }) : null,
    ]);
    if (blockingFindings) throw new ValidationError('Blocking compliance findings must be resolved before permit-ready generation');
    if (!approval || !approval.licenseVerifiedAt || (approval.expiresAt && approval.expiresAt <= new Date())) {
      throw new ValidationError('Permit-ready generation requires a current verified professional approval for this workflow');
    }
    if (!approval.sourceDocumentId || !approval.sealedDocumentId || !approval.sourceContentHash || !approval.sealedContentHash) {
      throw new ValidationError('Professional approval is missing immutable source and sealed document evidence');
    }
  }
  const eventId = `site-plan-generation:${workflowId}:${idempotencyKey}`;
  const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const priorEvent = await db.workflowEvent.findUnique({ where: { idempotencyKey: eventId } });
  if (priorEvent?.payload?.inputHash && priorEvent.payload.inputHash !== inputHash) {
    throw new ValidationError('Idempotency key was already used with different site-plan input');
  }
  const artifact = generateCivilSitePlan({ ...input, id: workflowId });
  const outputSummary = {
    idempotencyKey, revision: input.revision, classification: input.requestedClassification,
    jurisdictionCode, units: input.units, crs: input.crs, geometryCount: input.geometry.length,
    quantities: artifact.quantities, warnings: artifact.warnings, generatedAt: new Date().toISOString(),
  };
  await db.$transaction(async (tx: any) => {
    await tx.sitePlanStageExecution.update({ where: { id: stage.id }, data: {
      inputs: { revision: input.revision, classification: input.requestedClassification,
        units: input.units, crs: input.crs, geometry: input.geometry },
      outputs: { ...(typeof stage.outputs === 'object' && stage.outputs ? stage.outputs : {}), generation: outputSummary },
    } });
    await tx.workflowEvent.upsert({ where: { idempotencyKey: eventId }, create: {
      eventType: 'SITE_PLAN_ARTIFACT_GENERATED', subjectType: 'PROJECT', subjectId: workflow.projectId,
      payload: { workflowId, actorId: user.id, inputHash, ...outputSummary }, idempotencyKey: eventId, processedAt: new Date(),
    }, update: {} });
  });
  return { artifact, summary: outputSummary };
}
export async function createSitePlan(projectId: string, userId: string, input: {
  organizationId?: string; jurisdictionCode: string; propertyId?: string; parcelId?: string; productId?: string;
}) {
  const project = await assertProjectAccess(projectId, userId);
  const organizationId = input.organizationId ?? project.orgId;
  if (!organizationId) throw new ValidationError('Project organization must be resolved before ordering a site plan');
  if (project.orgId && project.orgId !== organizationId) throw new AuthorizationError('Organization mismatch');
  const existing = await db.sitePlanWorkflow.findUnique({ where: {
    organizationId_projectId: { organizationId, projectId },
  } });
  if (existing) return getSitePlan(existing.id, userId);
  return db.$transaction(async (tx: any) => {
    const workflow = await tx.sitePlanWorkflow.create({ data: { organizationId,
      projectId, propertyId: input.propertyId, parcelId: input.parcelId, productId: input.productId,
      professionalReviewRequired: true, metadata: { jurisdictionCode: input.jurisdictionCode } } });
    const snapshot = createSitePlanWorkflow(workflow.id);
    await tx.sitePlanStageExecution.createMany({ data: snapshot.stages.map((stage) => ({
      workflowId: workflow.id, stage: stage.stage, status: stage.state, attempt: stage.attempt,
      prerequisites: stage.prerequisites, blockers: stage.blockers, outputs: { refs: stage.outputRefs },
    })) });
    return { ...workflow, stages: snapshot.stages };
  });
}
export async function getSitePlan(workflowId: string, userId: string) {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  await assertProjectAccess(workflow.projectId, userId);
  const [stages, compliance, reviews, corrections] = await Promise.all([
    db.sitePlanStageExecution.findMany({ where: { workflowId }, orderBy: [{ stage: 'asc' }, { attempt: 'asc' }] }),
    db.sitePlanComplianceResult.findMany({ where: { workflowId }, orderBy: { createdAt: 'asc' } }),
    db.professionalReviewRecord.findMany({ where: { workflowId }, orderBy: { createdAt: 'desc' } }),
    db.permitCorrectionCycle.findMany({ where: { workflowId }, orderBy: { cycleNumber: 'asc' } }),
  ]);
  return { ...workflow, stages, compliance, professionalReviews: reviews, correctionCycles: corrections };
}
export async function applySitePlanWorkflowEvent(workflowId: string, userId: string,
  expectedVersion: number, event: SitePlanWorkflowEvent) {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  await assertProjectAccess(workflow.projectId, userId);
  if (workflow.version !== expectedVersion) throw new ValidationError('Workflow version conflict');
  const rows = await db.sitePlanStageExecution.findMany({ where: { workflowId }, orderBy: { attempt: 'asc' } });
  const latest = new Map<string, any>();
  for (const row of rows) latest.set(row.stage, row);
  const snapshot = createSitePlanWorkflow(workflowId);
  snapshot.version = workflow.version;
  snapshot.appliedEventIds = Array.isArray(workflow.metadata?.appliedEventIds) ? workflow.metadata.appliedEventIds : [];
  snapshot.professionalApprovalId = workflow.metadata?.professionalApprovalId;
  snapshot.sealedDocumentId = workflow.metadata?.sealedDocumentId;
  snapshot.releasedAt = workflow.releasedAt?.toISOString();
  snapshot.stages = SITE_PLAN_STAGES.map((stage) => {
    const row = latest.get(stage);
    const base = createSitePlanWorkflow(workflowId).stages.find((item) => item.stage === stage)!;
    return row ? { ...base, state: row.status, prerequisites: row.prerequisites ?? [], blockers: row.blockers ?? [],
      outputRefs: row.outputs?.refs ?? [], assignedPartyId: row.assignedPartyId, attempt: row.attempt } : base;
  });
  if (snapshot.appliedEventIds.includes(event.id)) return getSitePlan(workflowId, userId);
  const next = applySitePlanEvent(snapshot, event);
  await db.$transaction(async (tx: any) => {
    const updated = await tx.sitePlanWorkflow.updateMany({ where: { id: workflowId, version: expectedVersion }, data: {
      version: { increment: 1 }, currentStage: event.stage, releasedAt: next.releasedAt ? new Date(next.releasedAt) : null,
      metadata: { ...(workflow.metadata ?? {}), appliedEventIds: next.appliedEventIds,
        professionalApprovalId: next.professionalApprovalId, sealedDocumentId: next.sealedDocumentId },
    } });
    if (updated.count !== 1) throw new ValidationError('Workflow version conflict');
    for (const stage of next.stages) {
      await tx.sitePlanStageExecution.upsert({ where: { workflowId_stage_attempt: {
        workflowId, stage: stage.stage, attempt: stage.attempt } }, create: {
        workflowId, stage: stage.stage, status: stage.state, attempt: stage.attempt,
        prerequisites: stage.prerequisites, blockers: stage.blockers, outputs: { refs: stage.outputRefs },
        assignedPartyId: stage.assignedPartyId,
      }, update: { status: stage.state, blockers: stage.blockers, outputs: { refs: stage.outputRefs },
        assignedPartyId: stage.assignedPartyId,
        startedAt: stage.state === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: ['COMPLETED', 'APPROVED'].includes(stage.state) ? new Date() : undefined } });
    }
    await tx.workflowEvent.upsert({ where: { idempotencyKey: event.id }, create: {
      eventType: `SITE_PLAN_${event.type}`, subjectType: 'PROJECT', subjectId: workflow.projectId,
      payload: event, idempotencyKey: event.id, processedAt: new Date(),
    }, update: {} });
  });
  return getSitePlan(workflowId, userId);
}
