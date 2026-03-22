/**
 * Concept Engine API Routes
 *
 * POST /api/concept/generate-floorplan
 * POST /api/concept/generate-package
 * POST /api/concept/create-architect-review
 *
 * These routes enqueue worker jobs — heavy generation does not run inline.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prismaAny }          from '../../utils/prisma-helper';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';
import { generateFloorplan }  from '@kealee/concept-engine';

// ── Zod schemas ────────────────────────────────────────────────────────────

const GenerateFloorplanBody = z.object({
  intakeId:         z.string().min(1),
  projectPath:      z.string().min(1),
  projectId:        z.string().optional(),
  twinId:           z.string().optional(),
  captureSessionId: z.string().optional(),
  clientName:       z.string().min(1),
  contactEmail:     z.string().email(),
  contactPhone:     z.string().optional(),
  projectAddress:   z.string().min(5),
  budgetRange:      z.string().min(1),
  stylePreferences: z.array(z.string()).default([]),
  goals:            z.array(z.string()).optional(),
  knownConstraints: z.array(z.string()).optional(),
  desiredMaterials: z.array(z.string()).optional(),
  uploadedPhotos:   z.array(z.string()).optional(),
  propertyUse:      z.string().optional(),
  jurisdiction:     z.string().optional(),
  timelineGoal:     z.string().optional(),
  captureZones:     z.array(z.string()).optional(),
  captureAssets:    z.array(z.object({
    zone:           z.string(),
    aiLabel:        z.string().optional(),
    aiDescription:  z.string().optional(),
    aiTags:         z.array(z.string()).optional(),
    systemCategory: z.string().optional(),
  })).optional(),
  voiceNoteTranscriptions: z.array(z.string()).optional(),
});

const GeneratePackageBody = z.object({
  intakeId:    z.string().min(1),
  floorplanId: z.string().min(1),
  twinId:      z.string().optional(),
  projectPath: z.string().min(1),
});

const CreateArchitectReviewBody = z.object({
  intakeId:          z.string().min(1),
  conceptPackageId:  z.string().min(1),
  assignedArchitect: z.string().optional(),
  notes:             z.string().optional(),
});

// ── Queue helper (imported lazily to avoid circular deps) ─────────────────

async function getConceptEngineQueue() {
  const { Queue } = await import('bullmq');
  const IORedis   = (await import('ioredis')).default;
  const redisUrl  = process.env.REDIS_URL;
  if (!redisUrl) return null;
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  return new Queue('concept-engine', { connection: connection as any });
}

// ── Route plugin ───────────────────────────────────────────────────────────

export async function conceptEngineRoutes(fastify: FastifyInstance) {

  /**
   * POST /api/concept/generate-floorplan
   * Generates floor plan synchronously (pure compute, no AI call).
   * Persists to concept_floorplans and triggers generate-package job.
   */
  fastify.post('/generate-floorplan', {
    schema: { tags: ['concept-engine'] },
  }, async (request, reply) => {
    const body = GenerateFloorplanBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', details: body.error.flatten() });
    }
    const input = body.data;

    try {
      // Generate floor plan (synchronous — pure computation)
      const result = generateFloorplan(input);

      // Persist to concept_floorplans
      await prismaAny.$executeRaw`
        INSERT INTO concept_floorplans
          (id, intake_id, project_id, twin_id, capture_session_id,
           floorplan_json, svg_inline, version, status, created_at, updated_at)
        VALUES
          (${result.floorplanId}, ${input.intakeId}, ${input.projectId ?? null},
           ${input.twinId ?? null}, ${input.captureSessionId ?? null},
           ${JSON.stringify(result.floorplanJson)}::jsonb,
           ${result.svgString},
           1, 'generated', now(), now())
        ON CONFLICT (id) DO NOTHING
      `;

      // Enqueue package generation job
      const queue = await getConceptEngineQueue();
      if (queue) {
        await queue.add('generate_concept_package', {
          intakeId:    input.intakeId,
          floorplanId: result.floorplanId,
          projectPath: input.projectPath,
          twinId:      input.twinId,
          intake:      input,
        }, { priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        await queue.close();
      }

      return reply.status(200).send({
        floorplanId:  result.floorplanId,
        floorplanJson:result.floorplanJson,
        svgUrl:       null, // populated after storage upload in worker
        totalAreaFt2: result.totalAreaFt2,
        roomCount:    result.roomCount,
        layoutIssues: result.layoutIssues,
        packageJobQueued: !!queue,
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[concept-engine] generate-floorplan failed');
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });

  /**
   * POST /api/concept/generate-package
   * Enqueues a concept package generation job for an existing floor plan.
   * Call this if the package job failed and needs to be retried.
   */
  fastify.post('/generate-package', {
    schema: { tags: ['concept-engine'] },
  }, async (request, reply) => {
    const body = GeneratePackageBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', details: body.error.flatten() });
    }
    const { intakeId, floorplanId, twinId, projectPath } = body.data;

    try {
      // Verify floor plan exists
      const rows = await prismaAny.$queryRaw`
        SELECT id, floorplan_json, svg_inline
        FROM concept_floorplans
        WHERE id = ${floorplanId}
        LIMIT 1
      ` as Array<{ id: string; floorplan_json: unknown; svg_inline: string }>;

      if (!rows.length) {
        return reply.status(404).send({ error: 'Floor plan not found' });
      }

      const queue = await getConceptEngineQueue();
      let jobId: string | undefined;

      if (queue) {
        const job = await queue.add('generate_concept_package', {
          intakeId, floorplanId, projectPath, twinId,
        }, { priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        jobId = job.id ?? undefined;
        await queue.close();
      }

      return reply.status(202).send({
        queued:      true,
        intakeId,
        floorplanId,
        jobId,
        message:     'Concept package generation job queued',
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[concept-engine] generate-package enqueue failed');
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });

  /**
   * POST /api/concept/create-architect-review
   * Creates an architect review task for a generated concept package.
   */
  fastify.post('/create-architect-review', {
    schema: { tags: ['concept-engine'] },
  }, async (request, reply) => {
    const body = CreateArchitectReviewBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', details: body.error.flatten() });
    }
    const { intakeId, conceptPackageId, assignedArchitect, notes } = body.data;

    try {
      const rows = await prismaAny.$queryRaw`
        INSERT INTO architect_review_tasks
          (intake_id, concept_package_id, assigned_architect, review_status, notes, created_at, updated_at)
        VALUES
          (${intakeId}, ${conceptPackageId}, ${assignedArchitect ?? null},
           'pending', ${notes ?? null}, now(), now())
        RETURNING id, review_status, created_at
      ` as Array<{ id: string; review_status: string; created_at: string }>;

      const task = rows[0];
      return reply.status(201).send({
        taskId:          task?.id,
        reviewStatus:    task?.review_status ?? 'pending',
        intakeId,
        conceptPackageId,
        createdAt:       task?.created_at,
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[concept-engine] create-architect-review failed');
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });

  /**
   * GET /api/concept/floorplan/:intakeId
   * Fetch the latest floor plan for an intake.
   */
  fastify.get('/floorplan/:intakeId', async (request, reply) => {
    const { intakeId } = request.params as { intakeId: string };
    try {
      const rows = await prismaAny.$queryRaw`
        SELECT id, intake_id, floorplan_json, svg_url, svg_inline,
               version, status, created_at
        FROM concept_floorplans
        WHERE intake_id = ${intakeId}
        ORDER BY created_at DESC
        LIMIT 1
      ` as Array<Record<string, unknown>>;

      if (!rows.length) return reply.status(404).send({ error: 'No floor plan found' });
      return reply.send(rows[0]);
    } catch (err: any) {
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });

  /**
   * GET /api/concept/package/:intakeId
   * Fetch the latest concept package for an intake.
   */
  fastify.get('/package/:intakeId', async (request, reply) => {
    const { intakeId } = request.params as { intakeId: string };
    try {
      const rows = await prismaAny.$queryRaw`
        SELECT id, intake_id, floorplan_id, package_json,
               architect_handoff_json, status, delivery_url, created_at
        FROM concept_packages
        WHERE intake_id = ${intakeId}
        ORDER BY created_at DESC
        LIMIT 1
      ` as Array<Record<string, unknown>>;

      if (!rows.length) return reply.status(404).send({ error: 'No concept package found' });
      return reply.send(rows[0]);
    } catch (err: any) {
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });

  /**
   * GET /api/concept/architect-tasks
   * List pending architect review tasks (command center queue).
   */
  fastify.get('/architect-tasks', async (request, reply) => {
    const query = request.query as { status?: string; limit?: string };
    const status = query.status ?? 'pending';
    const limit  = Math.min(parseInt(query.limit ?? '50', 10), 200);

    try {
      const rows = await prismaAny.$queryRaw`
        SELECT t.id, t.intake_id, t.concept_package_id,
               t.assigned_architect, t.review_status, t.notes,
               t.revision_count, t.created_at,
               cp.package_json->'client'->>'name'  AS client_name,
               cp.package_json->'client'->>'address' AS project_address,
               cp.package_json->'project'->>'path'  AS project_path
        FROM architect_review_tasks t
        LEFT JOIN concept_packages cp ON cp.id = t.concept_package_id
        WHERE t.review_status = ${status}
        ORDER BY t.created_at DESC
        LIMIT ${limit}
      ` as Array<Record<string, unknown>>;

      return reply.send({ tasks: rows, count: rows.length });
    } catch (err: any) {
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });

  /**
   * PATCH /api/concept/architect-tasks/:taskId
   * Update architect review task (assign, change status, add notes, signoff).
   */
  fastify.patch('/architect-tasks/:taskId', async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const body = request.body as {
      reviewStatus?:     string;
      assignedArchitect?:string;
      notes?:            string;
      signoff?:          boolean;
    };

    try {
      const sets: string[] = [];
      if (body.reviewStatus)      sets.push(`review_status = '${body.reviewStatus.replace(/'/g, "''")}'`);
      if (body.assignedArchitect) sets.push(`assigned_architect = '${body.assignedArchitect.replace(/'/g, "''")}'`);
      if (body.notes)             sets.push(`notes = '${body.notes.replace(/'/g, "''")}'`);
      if (body.signoff)           sets.push(`architect_signoff = now()`);
      sets.push(`updated_at = now()`);

      if (sets.length <= 1) return reply.status(400).send({ error: 'No fields to update' });

      await prismaAny.$executeRaw`
        UPDATE architect_review_tasks
        SET review_status = ${body.reviewStatus ?? null},
            updated_at    = now()
        WHERE id = ${parseInt(taskId, 10)}
      `;

      return reply.send({ updated: true, taskId });
    } catch (err: any) {
      return reply.status(500).send({ error: sanitizeErrorMessage(err) });
    }
  });
}
