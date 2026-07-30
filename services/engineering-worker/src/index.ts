import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@kealee/database';
import { KEALEE_QUEUES } from '@kealee/queue';
import type { EngineeringJobData, EngineeringJobResult } from '@kealee/queue';
import { uploadDocument } from '@kealee/storage';
import { solveSiteFit, type SolveSiteFitInput } from '@kealee/os-engineering';
import { buildPostgisEnvelope, validateOptionsWithPostgis } from './postgis-site-fit';

if (!process.env.REDIS_URL || !process.env.DATABASE_URL) {
  throw new Error('engineering-worker requires REDIS_URL and DATABASE_URL');
}
const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const db = prisma as any;
const TOOL_VERSION = 'kealee-engineering-worker-1.0.0';
const healthServer = createServer((request, response) => {
  if (request.url !== '/health') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ status: 'ok', service: 'engineering-worker', toolVersion: TOOL_VERSION }));
});
healthServer.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');

async function runProcessor(data: EngineeringJobData, signal: AbortSignal): Promise<Record<string, unknown>> {
  if (data.type === 'SOLVE_SCENARIO') {
    const input = data.options as unknown as SolveSiteFitInput;
    const precomputedEnvelope = await buildPostgisEnvelope(db, input);
    const solved = solveSiteFit({ ...input, precomputedEnvelope });
    solved.options = await validateOptionsWithPostgis(
      db,
      { ...input, precomputedEnvelope },
      solved.options,
    );
    return {
      ...solved,
      confidence: solved.options.every(option => option.valid) ? 0.85 : 0.65,
      automaticPercent: 100,
      estimatedCostUsd: 0,
    };
  }
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.ENGINEERING_PYTHON ?? 'python3',
      [process.env.ENGINEERING_PROCESSOR ?? '/app/services/engineering-worker/python/processor.py'],
      { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PYTHONUNBUFFERED: '1' } });
    let stdout = ''; let stderr = '';
    const timeout = setTimeout(() => child.kill('SIGTERM'), Number(process.env.ENGINEERING_JOB_TIMEOUT_MS ?? 600000));
    signal.addEventListener('abort', () => child.kill('SIGTERM'), { once: true });
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error(`Engineering processor failed (${code}): ${stderr.slice(-2000)}`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error('Engineering processor returned invalid JSON')); }
    });
    child.stdin.end(JSON.stringify(data));
  });
}

async function persistScenarioResult(data: EngineeringJobData, result: Record<string, unknown>) {
  if (data.type !== 'SOLVE_SCENARIO' || !data.scenarioId) return;
  const solved = result as unknown as ReturnType<typeof solveSiteFit>;
  const inputHash = createHash('sha256').update(JSON.stringify(data.options)).digest('hex');
  await db.$transaction(async (tx: any) => {
    await tx.feasibilityScenario.update({
      where: { id: data.scenarioId },
      data: {
        siteFitStatus: 'SOLVED',
        solverVersion: solved.solverVersion,
        ruleSetVersion: solved.ruleSetVersion,
        randomSeed: solved.randomSeed,
        warnings: solved.warnings,
        metrics: { options: solved.options.map(option => option.metrics) },
        reviewStatus: 'PENDING',
      },
    });
    for (const option of solved.options) {
      const proposedBuilding = option.geometry.features.find(feature =>
        feature.properties.layer === 'PROPOSED_BUILDING');
      const saved = await tx.feasibilityScenarioOption.upsert({
        where: { scenarioId_ordinal: { scenarioId: data.scenarioId, ordinal: option.ordinal } },
        create: {
          scenarioId: data.scenarioId,
          ordinal: option.ordinal,
          name: option.name,
          geometryGeoJson: option.geometry,
          buildingModel: proposedBuilding ?? {},
          siteCoverage: option.metrics.siteCoveragePercent,
          far: option.metrics.far,
          grossFloorArea: option.metrics.grossFloorAreaSqFt,
          netRentableArea: option.metrics.netRentableAreaSqFt,
          unitCount: option.metrics.unitCount,
          unitMix: data.options.program ?? {},
          parkingSpaces: option.metrics.parkingSpaces,
          landscapeArea: option.metrics.openSpaceSqFt,
          imperviousArea: option.metrics.footprintAreaSqFt,
          score: option.score,
          validationReport: option.validationReport,
          solverVersion: solved.solverVersion,
          inputHash,
        },
        update: {
          name: option.name,
          geometryGeoJson: option.geometry,
          buildingModel: proposedBuilding ?? {},
          siteCoverage: option.metrics.siteCoveragePercent,
          far: option.metrics.far,
          grossFloorArea: option.metrics.grossFloorAreaSqFt,
          netRentableArea: option.metrics.netRentableAreaSqFt,
          unitCount: option.metrics.unitCount,
          unitMix: data.options.program ?? {},
          parkingSpaces: option.metrics.parkingSpaces,
          landscapeArea: option.metrics.openSpaceSqFt,
          imperviousArea: option.metrics.footprintAreaSqFt,
          score: option.score,
          validationReport: option.validationReport,
          solverVersion: solved.solverVersion,
          inputHash,
        },
      });
      const spatialGeometry = proposedBuilding?.geometry;
      const srid = Number(String((data.options as any).crs).split(':')[1]);
      if (!spatialGeometry || !Number.isInteger(srid)) {
        throw new Error(`Option ${option.ordinal} is missing valid PostGIS persistence inputs`);
      }
      await tx.$executeRawUnsafe(`
        UPDATE "feasibility_scenario_options"
        SET "spatialGeometry" = extensions.ST_SetSRID(
          extensions.ST_GeomFromGeoJSON($1),
          $2::integer
        )
        WHERE "id" = $3
      `, JSON.stringify(spatialGeometry), srid, saved.id);
      await tx.geometryValidationRun.upsert({
        where: {
          scenarioOptionId_inputHash: {
            scenarioOptionId: saved.id,
            inputHash,
          },
        },
        create: {
          scenarioOptionId: saved.id,
          ruleSetVersion: solved.ruleSetVersion,
          solverVersion: solved.solverVersion,
          inputHash,
          inputs: data.options,
          results: option.validationReport.ruleResults,
          errors: option.errors,
          warnings: option.warnings,
          valid: option.valid,
        },
        update: {
          ruleSetVersion: solved.ruleSetVersion,
          solverVersion: solved.solverVersion,
          inputs: data.options,
          results: option.validationReport.ruleResults,
          errors: option.errors,
          warnings: option.warnings,
          valid: option.valid,
        },
      });
    }
  });
}

const worker = new Worker<EngineeringJobData, EngineeringJobResult>(KEALEE_QUEUES.ENGINEERING_PROCESSING,
  async job => {
    const started = Date.now();
    const controller = new AbortController();
    await job.updateProgress({ stage: 'PROCESSING', percent: 5 });
    const stage = await db.engineeringStage.findFirst({ where: {
      engineeringProjectId: job.data.engineeringProjectId, stageCode: job.data.stageCode,
      idempotencyKey: job.data.idempotencyKey,
    } });
    if (stage?.status === 'COMPLETE') return stage.outputs as EngineeringJobResult;
    await db.engineeringStage.upsert({
      where: { idempotencyKey: job.data.idempotencyKey },
      create: { engineeringProjectId: job.data.engineeringProjectId, stageCode: job.data.stageCode,
        status: 'PROCESSING', inputs: job.data, outputs: {}, sourceProvenance: {
          documentId: job.data.documentId, sourceUrl: job.data.sourceUrl, contentHash: job.data.sourceContentHash,
        }, confidence: 0, blockingIssues: [], calculationVersion: TOOL_VERSION, auditHistory: [{
          at: new Date().toISOString(), action: 'PROCESSING', actorId: job.data.actorId,
        }], idempotencyKey: job.data.idempotencyKey, startedAt: new Date() },
      update: { status: 'PROCESSING', startedAt: new Date() },
    });
    try {
      const result = await runProcessor(job.data, controller.signal);
      await job.updateProgress({ stage: 'PERSISTING', percent: 90 });
      const warnings = Array.isArray(result.warnings) ? result.warnings.map(String) : [];
      const artifacts = Array.isArray(result.artifacts) ? result.artifacts as Array<{
        kind: string; filename: string; base64: string;
      }> : [];
      const uploadedArtifacts: Array<{ kind: string; documentId: string; url: string }> = [];
      for (const artifact of artifacts) {
        const uploaded = await uploadDocument({ projectId: job.data.projectId, type: 'design',
          file: Buffer.from(artifact.base64, 'base64'), filename: artifact.filename,
          uploadedBy: job.data.actorId }, { prisma: db });
        uploadedArtifacts.push({ kind: artifact.kind, documentId: uploaded.documentId, url: uploaded.url });
      }
      const output: EngineeringJobResult = { jobType: job.data.type,
        status: warnings.length ? 'NEEDS_VERIFICATION' : 'COMPLETE',
        outputRefs: uploadedArtifacts.map(item => item.documentId),
        warnings, metrics: { processingMs: Date.now() - started,
          automaticPercent: Number(result.automaticPercent ?? 0) }, result, toolVersion: TOOL_VERSION };
      await persistScenarioResult(job.data, result);
      await db.engineeringStage.update({ where: { idempotencyKey: job.data.idempotencyKey }, data: {
        status: output.status === 'COMPLETE' ? 'COMPLETE' : 'NEEDS_VERIFICATION',
        outputs: output, confidence: Math.min(1, Math.max(0, Number(result.confidence ?? 0))),
        blockingIssues: warnings, completedAt: new Date(),
      } });
      await db.engineeringCostRecord.create({ data: { engineeringProjectId: job.data.engineeringProjectId,
        stageCode: job.data.stageCode, costType: job.data.type, amountUsd: Number(result.estimatedCostUsd ?? 0),
        processingMs: Date.now() - started, provider: 'open-source-local', metadata: { jobId: job.id } } });
      if (['GENERATE_DXF', 'GENERATE_VECTOR_PDF', 'GENERATE_REPORT'].includes(job.data.type)
        && uploadedArtifacts.length) {
        const existing = await db.engineeringDrawingPackage.findFirst({ where: {
          engineeringProjectId: job.data.engineeringProjectId,
        }, orderBy: { revision: 'desc' } });
        const revision = existing ? existing.revision + 1 : 1;
        const byKind = (kind: string) => uploadedArtifacts.find(item => item.kind === kind)?.documentId;
        await db.engineeringDrawingPackage.create({ data: {
          engineeringProjectId: job.data.engineeringProjectId, revision, classification: 'EXTRACTED',
          status: 'NEEDS_PROFESSIONAL_REVIEW', dxfDocumentId: byKind('DXF'),
          pdfDocumentId: byKind('PDF'), previewDocumentId: byKind('PREVIEW'),
          reportDocumentId: byKind('REPORT'), manifest: result.manifest ?? {},
          validationReport: result.validationReport ?? {}, sourceRefs: {
            jobId: job.id, sourceDocumentId: job.data.documentId, contentHash: job.data.sourceContentHash,
          },
        } });
      }
      await job.updateProgress({ stage: 'COMPLETE', percent: 100 });
      return output;
    } catch (error) {
      await db.engineeringStage.update({ where: { idempotencyKey: job.data.idempotencyKey }, data: {
        status: 'FAILED', blockingIssues: [error instanceof Error ? error.message : String(error)],
      } });
      throw error;
    }
  }, { connection, concurrency: Number(process.env.ENGINEERING_WORKER_CONCURRENCY ?? 2),
    lockDuration: Number(process.env.ENGINEERING_JOB_TIMEOUT_MS ?? 600000) });

worker.on('failed', (job, error) => console.error(JSON.stringify({
  event: 'engineering_job_failed', jobId: job?.id, type: job?.data.type, message: error.message,
})));
worker.on('completed', job => console.log(JSON.stringify({ event: 'engineering_job_completed', jobId: job.id,
  type: job.data.type })));

async function shutdown() {
  healthServer.close();
  await worker.close(); await connection.quit(); await db.$disconnect(); process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
