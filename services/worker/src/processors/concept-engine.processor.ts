/**
 * Concept Engine Worker Processor
 *
 * Handles five job types:
 * 1. generate_floorplan             — builds room graph + SVG, saves to concept_floorplans
 * 2. generate_concept_package       — runs Claude narrative + assembles package, saves to concept_packages
 * 3. create_architect_review_task   — creates architect review record
 * 4. generate_visual_prompt_bundle  — builds Midjourney + SD prompts, updates concept_packages
 * 5. generate_buildability_snapshot — zoning + risk flags, updates concept_packages
 */

import { Worker, Job } from 'bullmq';
import { redis }       from '../config/redis.config';
import type { ConceptEngineJobData } from '../queues/concept-engine.queue';

async function getPrisma() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    return new PrismaClient() as any;
  } catch {
    console.warn('[concept-engine] Prisma client not available');
    return null;
  }
}

// ── Job 1: Generate Floor Plan ───────────────────────────────────────────────

async function processGenerateFloorplan(
  job: Job<ConceptEngineJobData>,
  prisma: any,
): Promise<void> {
  const { intakeId, projectPath, projectId, twinId, captureSessionId, intake } = job.data;

  await job.updateProgress(10);

  const {
    generateFloorplan,
    renderSvgFloorplan,
    buildLayoutJson,
    buildRoomGraph,
  } = await import('@kealee/concept-engine');

  const intakeInput = {
    intakeId,
    projectPath: projectPath as any,
    projectId,
    twinId,
    captureSessionId,
    ...(intake ?? {}),
  };

  const result = generateFloorplan(intakeInput as any);
  await job.updateProgress(40);

  // Upload SVG to Supabase Storage
  let svgUrl: string | null = null;
  try {
    const { uploadFile } = await import('@kealee/storage');
    const svgBuffer = Buffer.from(result.svgString, 'utf-8');
    const uploadResult = await uploadFile({
      bucket: 'designs',
      path: `concept-packages/${intakeId}/floorplan.svg`,
      file: svgBuffer,
      contentType: 'image/svg+xml',
    });
    svgUrl = uploadResult.url;
    console.log(`[concept-engine] SVG uploaded: ${svgUrl}`);
  } catch (uploadErr) {
    console.warn('[concept-engine] SVG upload failed (non-fatal):', uploadErr);
  }

  await job.updateProgress(55);

  // Persist floor plan
  await prisma.$executeRaw`
    INSERT INTO concept_floorplans
      (id, intake_id, project_id, twin_id, capture_session_id,
       floorplan_json, svg_inline, svg_url, version, status, created_at, updated_at)
    VALUES
      (${result.floorplanId}, ${intakeId}, ${projectId ?? null},
       ${twinId ?? null}, ${captureSessionId ?? null},
       ${JSON.stringify(result.floorplanJson)}::jsonb,
       ${result.svgString},
       ${svgUrl},
       1, 'generated', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      floorplan_json = EXCLUDED.floorplan_json,
      svg_inline = EXCLUDED.svg_inline,
      svg_url = EXCLUDED.svg_url,
      updated_at = now()
  `;

  await job.updateProgress(75);

  // Chain: enqueue generate_concept_package
  const { conceptEngineQueue } = await import('../queues/concept-engine.queue');
  await conceptEngineQueue.generateConceptPackage({
    intakeId,
    floorplanId: result.floorplanId,
    projectPath,
    twinId,
    projectId,
    captureSessionId,
    intake: intakeInput as any,
  });

  await job.updateProgress(100);
  console.log(`[concept-engine] Floor plan ${result.floorplanId} saved for intake ${intakeId}`);
}

// ── Job 2: Generate Concept Package ─────────────────────────────────────────

async function processGenerateConceptPackage(
  job: Job<ConceptEngineJobData>,
  prisma: any,
): Promise<void> {
  const { intakeId, floorplanId, twinId, projectPath, intake } = job.data;

  if (!floorplanId) throw new Error('floorplanId required for generate_concept_package');

  await job.updateProgress(10);

  // Orchestration gate: check if pre-design concept generation is approved
  try {
    const { orchestratePreDesign } = await import('@kealee/core');
    const orchResult = orchestratePreDesign({
      projectId: (intake as any)?.projectId ?? intakeId,
      projectType: projectPath,
      dcsScore: (intake as any)?.uploadedPhotos?.length > 0 ? 0.80 : 0.55,
      requiresArchitect: (intake as any)?.requiresArchitect ?? false,
      budgetEstimate: undefined,
      userInputsComplete: !!(intake as any)?.budgetRange,
    });
    if (orchResult.decision === 'BLOCK') {
      throw new Error(`[concept-engine] Orchestration BLOCK for intake ${intakeId}: ${orchResult.reasonCodes.join(', ')}`);
    }
    if (orchResult.decision === 'REQUIRE_APPROVAL' || orchResult.decision === 'ESCALATE') {
      console.log(`[concept-engine] Orchestration ${orchResult.decision} for intake ${intakeId} — proceeding (fail-open). Reason: ${orchResult.reasonCodes.join(', ')}`);
    }
  } catch (orchErr: any) {
    // Fail-open unless it was an explicit BLOCK
    if (orchErr.message?.includes('Orchestration BLOCK')) throw orchErr;
    console.warn(`[concept-engine] Orchestration check unavailable (fail-open): ${orchErr.message}`);
  }

  // Load floor plan from DB
  const fpRows = await prisma.$queryRaw`
    SELECT id, floorplan_json, svg_url, svg_inline
    FROM concept_floorplans
    WHERE id = ${floorplanId}
    LIMIT 1
  ` as Array<{ id: string; floorplan_json: any; svg_url: string | null; svg_inline: string | null }>;

  if (!fpRows.length) throw new Error(`Floor plan ${floorplanId} not found`);

  const fp     = fpRows[0];
  const floorplanJson = typeof fp.floorplan_json === 'string'
    ? JSON.parse(fp.floorplan_json)
    : fp.floorplan_json;

  await job.updateProgress(20);

  const { generateConceptPackage } = await import('@kealee/concept-engine');

  const conceptInput = {
    intakeId,
    floorplanId,
    floorplan: floorplanJson,
    twinId,
    projectPath,
    svgUrl: fp.svg_url ?? undefined,
    intake: { intakeId, projectPath: projectPath as any, ...(intake ?? {}) } as any,
  };

  const result = await generateConceptPackage(conceptInput);
  await job.updateProgress(70);

  // Generate PDF
  let pdfUrl: string | null = null;
  try {
    const { renderConceptPdf } = await import('@kealee/concept-engine');
    const { uploadFile } = await import('@kealee/storage');
    const pdfBuffer = await renderConceptPdf({ homeownerDeliverables: result.packageJson });
    const pdfUpload = await uploadFile({
      bucket: 'designs',
      path: `concept-packages/${intakeId}/concept-package.pdf`,
      file: pdfBuffer,
      contentType: 'application/pdf',
    });
    pdfUrl = pdfUpload.url;
    console.log(`[concept-engine] PDF uploaded: ${pdfUrl}`);
  } catch (pdfErr) {
    console.warn('[concept-engine] PDF generation/upload failed (non-fatal):', pdfErr);
  }

  await job.updateProgress(82);

  // Persist concept package
  await prisma.$executeRaw`
    INSERT INTO concept_packages
      (id, intake_id, floorplan_id, package_json, architect_handoff_json,
       pdf_url, status, created_at, updated_at)
    VALUES
      (${result.conceptPackageId}, ${intakeId}, ${floorplanId},
       ${JSON.stringify(result.packageJson)}::jsonb,
       ${JSON.stringify(result.architectHandoffJson)}::jsonb,
       ${pdfUrl},
       'generated', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      package_json           = EXCLUDED.package_json,
      architect_handoff_json = EXCLUDED.architect_handoff_json,
      pdf_url                = EXCLUDED.pdf_url,
      updated_at             = now()
  `;

  await job.updateProgress(88);

  // Chain: enqueue architect review task
  const { conceptEngineQueue } = await import('../queues/concept-engine.queue');
  await conceptEngineQueue.createArchitectReviewTask({
    intakeId,
    conceptPackageId: result.conceptPackageId,
    projectPath,
  });

  await job.updateProgress(100);
  console.log(`[concept-engine] Concept package ${result.conceptPackageId} saved for intake ${intakeId}`);
}

// ── Job 3: Create Architect Review Task ──────────────────────────────────────

async function processCreateArchitectReviewTask(
  job: Job<ConceptEngineJobData>,
  prisma: any,
): Promise<void> {
  const { intakeId, conceptPackageId, assignedArchitect, notes } = job.data;

  if (!conceptPackageId) throw new Error('conceptPackageId required for create_architect_review_task');

  await prisma.$executeRaw`
    INSERT INTO architect_review_tasks
      (intake_id, concept_package_id, assigned_architect, review_status, notes, created_at, updated_at)
    VALUES
      (${intakeId}, ${conceptPackageId}, ${assignedArchitect ?? null},
       'pending', ${notes ?? null}, now(), now())
    ON CONFLICT DO NOTHING
  `;

  await job.updateProgress(100);
  console.log(`[concept-engine] Architect review task created for concept package ${conceptPackageId}`);
}

// ── Job 4: Generate Visual Prompt Bundle ─────────────────────────────────────

async function processGenerateVisualPromptBundle(
  job: Job<ConceptEngineJobData>,
  prisma: any,
): Promise<void> {
  const { intakeId, floorplanId, projectPath, intake } = job.data;

  await job.updateProgress(10);

  // Load floor plan
  const fpRows = await prisma.$queryRaw`
    SELECT id, floorplan_json FROM concept_floorplans WHERE intake_id = ${intakeId} LIMIT 1
  ` as Array<{ id: string; floorplan_json: any }>;

  const floorplanJson = fpRows.length
    ? (typeof fpRows[0].floorplan_json === 'string' ? JSON.parse(fpRows[0].floorplan_json) : fpRows[0].floorplan_json)
    : null;

  await job.updateProgress(30);

  const { buildVisualPromptBundle } = await import('@kealee/concept-engine');
  const intakeInput = {
    intakeId,
    projectPath: projectPath as any,
    address: (intake as any)?.address ?? '',
    budgetRange: (intake as any)?.budgetRange ?? 'under_10k',
    stylePreference: (intake as any)?.stylePreference ?? 'modern',
    constraints: (intake as any)?.constraints ?? [],
    uploadedPhotos: (intake as any)?.uploadedPhotos ?? [],
    captureAssets: (intake as any)?.captureAssets ?? [],
    spatialNodes: (intake as any)?.spatialNodes ?? [],
    ...(intake ?? {}),
  };

  const bundle = floorplanJson
    ? buildVisualPromptBundle(intakeInput as any, floorplanJson)
    : null;

  if (bundle) {
    await prisma.$executeRaw`
      UPDATE concept_packages
      SET visual_prompts_json = ${JSON.stringify(bundle)}::jsonb,
          updated_at = now()
      WHERE intake_id = ${intakeId}
    `;
  }

  await job.updateProgress(100);
  console.log(`[concept-engine] Visual prompt bundle generated for intake ${intakeId}`);
}

// ── Job 5: Generate Buildability Snapshot ────────────────────────────────────

async function processGenerateBuildabilitySnapshot(
  job: Job<ConceptEngineJobData>,
  prisma: any,
): Promise<void> {
  const { intakeId, projectPath, address, jurisdiction, budgetRange, constraints } = job.data;

  await job.updateProgress(10);

  const { buildBuildabilitySnapshot } = await import('@kealee/concept-engine');

  const snapshot = await buildBuildabilitySnapshot({
    intakeId,
    projectPath,
    address: address ?? '',
    jurisdiction: jurisdiction ?? undefined,
    budgetRange: budgetRange ?? undefined,
    constraints: constraints ?? [],
    zoningData: null, // will attempt Claude inference
  });

  await job.updateProgress(80);

  await prisma.$executeRaw`
    UPDATE concept_packages
    SET buildability_json = ${JSON.stringify(snapshot)}::jsonb,
        updated_at = now()
    WHERE intake_id = ${intakeId}
  `;

  await job.updateProgress(100);
  console.log(`[concept-engine] Buildability snapshot generated for intake ${intakeId} (AI inferred: ${snapshot.inferredByAI})`);
}

// ── Router ───────────────────────────────────────────────────────────────────

async function processConceptEngineJob(job: Job<ConceptEngineJobData>): Promise<void> {
  const prisma = await getPrisma();
  if (!prisma) throw new Error('Database connection unavailable');

  try {
    const { jobType } = job.data;
    switch (jobType) {
      case 'generate_floorplan':
        await processGenerateFloorplan(job, prisma);
        break;
      case 'generate_concept_package':
        await processGenerateConceptPackage(job, prisma);
        break;
      case 'create_architect_review_task':
        await processCreateArchitectReviewTask(job, prisma);
        break;
      case 'generate_visual_prompt_bundle':
        await processGenerateVisualPromptBundle(job, prisma);
        break;
      case 'generate_buildability_snapshot':
        await processGenerateBuildabilitySnapshot(job, prisma);
        break;
      default:
        throw new Error(`Unknown jobType: ${(job.data as any).jobType}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// ── Worker factory ───────────────────────────────────────────────────────────

export function createConceptEngineWorker(): Worker<ConceptEngineJobData> {
  const worker = new Worker<ConceptEngineJobData>(
    'concept-engine',
    async (job) => processConceptEngineJob(job),
    {
      connection:  redis,
      concurrency: 2,
      limiter:     { max: 5, duration: 60000 },
    },
  );

  worker.on('completed', (job) => {
    console.log(`[concept-engine] Job ${job.id} (${job.data.jobType}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[concept-engine] Job ${job?.id} (${job?.data?.jobType}) failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[concept-engine] Worker error:', err);
  });

  return worker;
}
