/**
 * Concept Engine Worker Processor
 *
 * Handles three job types:
 * 1. generate_floorplan    — builds room graph + SVG, saves to concept_floorplans
 * 2. generate_concept_package — runs Claude narrative + assembles package, saves to concept_packages
 * 3. create_architect_review_task — creates architect review record
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
  await job.updateProgress(50);

  // Persist floor plan
  await prisma.$executeRaw`
    INSERT INTO concept_floorplans
      (id, intake_id, project_id, twin_id, capture_session_id,
       floorplan_json, svg_inline, version, status, created_at, updated_at)
    VALUES
      (${result.floorplanId}, ${intakeId}, ${projectId ?? null},
       ${twinId ?? null}, ${captureSessionId ?? null},
       ${JSON.stringify(result.floorplanJson)}::jsonb,
       ${result.svgString},
       1, 'generated', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      floorplan_json = EXCLUDED.floorplan_json,
      svg_inline = EXCLUDED.svg_inline,
      updated_at = now()
  `;

  await job.updateProgress(80);

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

  // Persist concept package
  await prisma.$executeRaw`
    INSERT INTO concept_packages
      (id, intake_id, floorplan_id, package_json, architect_handoff_json,
       status, created_at, updated_at)
    VALUES
      (${result.conceptPackageId}, ${intakeId}, ${floorplanId},
       ${JSON.stringify(result.packageJson)}::jsonb,
       ${JSON.stringify(result.architectHandoffJson)}::jsonb,
       'generated', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      package_json           = EXCLUDED.package_json,
      architect_handoff_json = EXCLUDED.architect_handoff_json,
      updated_at             = now()
  `;

  await job.updateProgress(85);

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
