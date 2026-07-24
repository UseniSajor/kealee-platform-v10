import { spawn } from 'node:child_process';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@kealee/database';
import { KEALEE_QUEUES } from '@kealee/queue';
import type { EngineeringJobData, EngineeringJobResult } from '@kealee/queue';
import { uploadDocument } from '@kealee/storage';

if (!process.env.REDIS_URL || !process.env.DATABASE_URL) {
  throw new Error('engineering-worker requires REDIS_URL and DATABASE_URL');
}
const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const db = prisma as any;
const TOOL_VERSION = 'kealee-engineering-worker-1.0.0';

function runProcessor(data: EngineeringJobData, signal: AbortSignal): Promise<Record<string, unknown>> {
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
  await worker.close(); await connection.quit(); await db.$disconnect(); process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
