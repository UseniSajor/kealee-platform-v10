/**
 * services/api/src/modules/rag/rag-ingester.ts
 *
 * Orchestrates document ingestion into the RAG vector store.
 * Can be called on-demand or via nightly job.
 */

import { buildAllIngestPayloads } from './document-processor.js'

// Inline types — avoids runtime dependency on @kealee/ai which is not installed here
interface IngestOptions {
  sourceType: string
  sourceId: string
  title: string
  content: string
  jurisdiction?: string
  serviceType?: string
  phase?: string
  projectId?: string
  chunkSize?: number
  chunkOverlap?: number
}

/**
 * Lazy-load the vector store — gracefully degrade if @kealee/ai is not built/available
 */
async function ingestDocument(opts: IngestOptions): Promise<void> {
  try {
    // @ts-ignore — @kealee/ai is optional; graceful fallback if not installed
    const mod = await import('@kealee/ai/rag/vector-store.js')
    await mod.ingestDocument(opts)
  } catch (err: any) {
    const isNotFound = err.code === 'MODULE_NOT_FOUND' || String(err.message).includes('Cannot find module')
    if (isNotFound) {
      throw new Error(`[RAG] vector-store unavailable (${err.code ?? 'MODULE_NOT_FOUND'}): skipping DB ingest for ${opts.sourceId}`)
    }
    throw err
  }
}

export interface IngestionResult {
  total: number
  succeeded: number
  failed: number
  errors: Array<{ sourceId: string; error: string }>
  durationMs: number
}

/**
 * Ingest a single document into the vector store
 */
export async function ingestSingleDocument(opts: IngestOptions): Promise<void> {
  await ingestDocument(opts)
}

/**
 * Run full ingestion across all document types
 */
export async function runFullIngestion(): Promise<IngestionResult> {
  const start = Date.now()
  const payloads = await buildAllIngestPayloads()

  let succeeded = 0
  let failed = 0
  const errors: Array<{ sourceId: string; error: string }> = []

  // Process in batches of 5 to avoid rate limiting on embeddings API
  const BATCH_SIZE = 5
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (payload) => {
        try {
          await ingestDocument(payload)
          succeeded++
        } catch (err: any) {
          failed++
          errors.push({ sourceId: payload.sourceId, error: err.message })
          console.error(`[RAG Ingest] Failed ${payload.sourceId}: ${err.message}`)
        }
      })
    )
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < payloads.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return {
    total: payloads.length,
    succeeded,
    failed,
    errors,
    durationMs: Date.now() - start,
  }
}

/**
 * Ingest a specific permit lead (call after permit intake)
 */
export async function ingestPermitLead(lead: {
  id: string
  fullName?: string
  email: string
  contractorType?: string
  jurisdictions?: string[]
  message?: string
  status: string
}): Promise<void> {
  await ingestDocument({
    sourceType: 'PERMIT_APPLICATION',
    sourceId: lead.id,
    title: `Permit Application — ${lead.fullName ?? lead.email}`,
    content: [
      `Applicant: ${lead.fullName ?? 'Unknown'}`,
      `Email: ${lead.email}`,
      `Project Type: ${lead.contractorType ?? 'Not specified'}`,
      `Jurisdictions: ${(lead.jurisdictions ?? []).join(', ')}`,
      `Status: ${lead.status}`,
      `Details: ${lead.message ?? 'No additional details'}`,
    ].join('\n'),
    jurisdiction: lead.jurisdictions?.[0],
    serviceType: 'permit',
  })
}

/**
 * Ingest a concept report after delivery
 */
export async function ingestConceptReport(report: {
  id: string
  projectPath: string
  projectAddress?: string
  clientName?: string
  summary?: string
  jurisdiction?: string
}): Promise<void> {
  await ingestDocument({
    sourceType: 'CONCEPT_REPORT',
    sourceId: report.id,
    title: `Concept Report — ${report.projectPath} — ${report.projectAddress ?? 'Unknown address'}`,
    content: [
      `Client: ${report.clientName ?? 'Unknown'}`,
      `Project: ${report.projectPath}`,
      `Address: ${report.projectAddress ?? 'Not specified'}`,
      `Summary: ${report.summary ?? 'Concept report generated'}`,
    ].join('\n'),
    jurisdiction: report.jurisdiction,
    serviceType: 'concept',
    projectId: report.id,
  })
}
