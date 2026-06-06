#!/usr/bin/env tsx
/**
 * seed-dmv-rag.ts
 *
 * One-time ingestion script: reads dmv_full_dataset.jsonl and seeds the platform
 * RAG vector store via rag-ingester's ingestSingleDocument() function.
 *
 * Usage (from services/api/):
 *   tsx scripts/seed-dmv-rag.ts              # full run
 *   tsx scripts/seed-dmv-rag.ts --dry-run    # parse + report only, no DB writes
 *
 * Prerequisites (full run):
 *   - @kealee/ai package built:  pnpm --filter @kealee/ai build
 *   - OPENAI_API_KEY set in environment (required for vector embeddings)
 *   - DATABASE_URL pointing to target Postgres database
 *
 * The script batches in groups of 5 with a 600ms inter-batch delay to respect
 * the OpenAI text-embedding-3-small rate limit (3 000 RPM on free tier).
 */

import fs   from 'fs'
import path from 'path'

// ── Types (inline — avoids importing the live rag-retriever at script run time) ──

type RecordType = 'permit' | 'zoning' | 'cost' | 'workflow'

interface BaseRecord { type: RecordType }
interface PermitRecord extends BaseRecord {
  type: 'permit'
  jurisdiction: string
  project_types: string[]
  permit_type: string
  processing_days: number
  requirements: string[]
  common_issues: string[]
  fee_base: number
  fee_per_sqft?: number
  expedited_available?: boolean
  online_submission?: boolean
}
interface ZoningRecord extends BaseRecord {
  type: 'zoning'
  jurisdiction: string
  zone: string
  max_lot_coverage: number
  min_lot_size_sqft: number
  setback_front: number
  setback_side: number
  setback_rear?: number
  max_height_ft: number
  adu_allowed: boolean
  min_adu_sqft?: number
  max_adu_sqft?: number
  parking_spaces_required?: number
}
interface CostRecord extends BaseRecord {
  type: 'cost'
  jurisdiction: string
  project_type: string
  cost_per_sqft: number
  avg_size_sqft: number
  total_hard_cost_est?: number
  soft_costs_percent: number
  contingency_percent: number
  typical_duration_months: number
  primary_expense_categories: string[]
  permit_fee_est?: number
  design_fee_est?: number
}
interface WorkflowRecord extends BaseRecord {
  type: 'workflow'
  jurisdiction: string
  stage: string
  project_type: string
  key_steps: string[]
  estimated_days: number
  deliverables: string[]
  next_stage: string | null
  required_professionals?: string[]
  common_blockers?: string[]
}
type RAGRecord = PermitRecord | ZoningRecord | CostRecord | WorkflowRecord

// ── Config ────────────────────────────────────────────────────────────────────

const DRY_RUN    = process.argv.includes('--dry-run')
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 600

// Path to the static JSONL seed file (two levels up from services/api/)
const DATASET_PATH = path.resolve(__dirname, '../../../data/rag/full/dmv_full_dataset.jsonl')

// ── Content serialisers ───────────────────────────────────────────────────────
// Each serialiser converts a typed RAG record into a human-readable string
// suitable for splitting into embedding chunks.

function permitContent(r: PermitRecord): string {
  return [
    `Permit Type: ${r.permit_type}`,
    `Jurisdiction: ${r.jurisdiction}`,
    `Project Types: ${r.project_types.join(', ')}`,
    `Processing Days: ${r.processing_days}`,
    `Base Fee: $${r.fee_base}`,
    r.fee_per_sqft           != null ? `Fee per Sqft: $${r.fee_per_sqft}` : null,
    `Requirements: ${r.requirements.join('; ')}`,
    `Common Issues: ${r.common_issues.join('; ')}`,
    r.expedited_available ? 'Expedited processing available' : null,
    r.online_submission   ? 'Online submission available'   : null,
  ].filter(Boolean).join('\n')
}

function zoningContent(r: ZoningRecord): string {
  return [
    `Zone: ${r.zone}`,
    `Jurisdiction: ${r.jurisdiction}`,
    `Max Lot Coverage: ${r.max_lot_coverage}%`,
    `Min Lot Size: ${r.min_lot_size_sqft} sqft`,
    `Front Setback: ${r.setback_front} ft`,
    `Side Setback: ${r.setback_side} ft`,
    r.setback_rear             != null ? `Rear Setback: ${r.setback_rear} ft`            : null,
    `Max Height: ${r.max_height_ft} ft`,
    `ADU Allowed: ${r.adu_allowed}`,
    r.min_adu_sqft             != null ? `Min ADU Size: ${r.min_adu_sqft} sqft`          : null,
    r.max_adu_sqft             != null ? `Max ADU Size: ${r.max_adu_sqft} sqft`          : null,
    r.parking_spaces_required  != null ? `Parking Required: ${r.parking_spaces_required} spaces` : null,
  ].filter(Boolean).join('\n')
}

function costContent(r: CostRecord): string {
  return [
    `Project Type: ${r.project_type}`,
    `Jurisdiction: ${r.jurisdiction}`,
    `Cost per Sqft: $${r.cost_per_sqft}`,
    `Average Size: ${r.avg_size_sqft} sqft`,
    r.total_hard_cost_est != null ? `Total Hard Cost Estimate: $${r.total_hard_cost_est.toLocaleString()}` : null,
    `Soft Costs: ${r.soft_costs_percent}%`,
    `Contingency: ${r.contingency_percent}%`,
    `Typical Duration: ${r.typical_duration_months} months`,
    `Primary Expense Categories: ${r.primary_expense_categories.join(', ')}`,
    r.permit_fee_est != null ? `Permit Fee Estimate: $${r.permit_fee_est.toLocaleString()}` : null,
    r.design_fee_est != null ? `Design Fee Estimate: $${r.design_fee_est.toLocaleString()}` : null,
  ].filter(Boolean).join('\n')
}

function workflowContent(r: WorkflowRecord): string {
  return [
    `Stage: ${r.stage}`,
    `Project Type: ${r.project_type}`,
    `Jurisdiction: ${r.jurisdiction}`,
    `Key Steps: ${r.key_steps.join('; ')}`,
    `Estimated Days: ${r.estimated_days}`,
    `Deliverables: ${r.deliverables.join('; ')}`,
    r.next_stage              ? `Next Stage: ${r.next_stage}`                                    : null,
    r.required_professionals  ? `Required Professionals: ${r.required_professionals.join(', ')}` : null,
    r.common_blockers         ? `Common Blockers: ${r.common_blockers.join('; ')}`               : null,
  ].filter(Boolean).join('\n')
}

// ── Public helpers (exported for testing) ─────────────────────────────────────

export function recordContent(r: RAGRecord): string {
  switch (r.type) {
    case 'permit':   return permitContent(r as PermitRecord)
    case 'zoning':   return zoningContent(r as ZoningRecord)
    case 'cost':     return costContent(r as CostRecord)
    case 'workflow': return workflowContent(r as WorkflowRecord)
  }
}

export function recordTitle(r: RAGRecord): string {
  const j = (r as { jurisdiction?: string }).jurisdiction ?? ''
  switch (r.type) {
    case 'permit':   return `Permit: ${(r as PermitRecord).permit_type} — ${j}`
    case 'zoning':   return `Zoning: ${(r as ZoningRecord).zone} — ${j}`
    case 'cost':     return `Cost: ${(r as CostRecord).project_type} — ${j}`
    case 'workflow': return `Workflow: ${(r as WorkflowRecord).stage} — ${(r as WorkflowRecord).project_type}`
  }
}

export function recordSourceId(r: RAGRecord, index: number): string {
  const j = ((r as { jurisdiction?: string }).jurisdiction ?? 'unknown')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
  switch (r.type) {
    case 'permit':   return `dmv-permit-${j}-${index}`
    case 'zoning':   return `dmv-zoning-${j}-${(r as ZoningRecord).zone.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`
    case 'cost':     return `dmv-cost-${(r as CostRecord).project_type.replace(/[^a-z0-9]+/g, '-')}-${j}-${index}`
    case 'workflow': return `dmv-workflow-${(r as WorkflowRecord).stage}-${(r as WorkflowRecord).project_type.replace(/[^a-z0-9]+/g, '-')}-${index}`
  }
}

// ── Load records ──────────────────────────────────────────────────────────────

function loadRecords(filePath: string): RAGRecord[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset not found: ${filePath}`)
  }
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean)
  const records: RAGRecord[] = []
  let skipped = 0
  for (let i = 0; i < lines.length; i++) {
    try {
      records.push(JSON.parse(lines[i]) as RAGRecord)
    } catch {
      console.warn(`  [skip] Invalid JSON at line ${i + 1}`)
      skipped++
    }
  }
  if (skipped > 0) console.warn(`  [warn] Skipped ${skipped} invalid lines`)
  return records
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[seed-dmv-rag] Starting…')
  console.log(`[seed-dmv-rag] Dataset: ${DATASET_PATH}`)

  const records = loadRecords(DATASET_PATH)

  const typeCounts = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1
    return acc
  }, {})
  console.log(`[seed-dmv-rag] Loaded ${records.length} records:`, typeCounts)

  if (DRY_RUN) {
    console.log('[seed-dmv-rag] --dry-run mode: no DB writes, printing first record per type')
    for (const type of ['permit', 'zoning', 'cost', 'workflow'] as RecordType[]) {
      const r = records.find(rec => rec.type === type)
      if (r) {
        console.log(`\n--- ${type} (index 0) ---`)
        console.log('  title:', recordTitle(r))
        console.log('  sourceId:', recordSourceId(r, 0))
        console.log('  content (first 200 chars):', recordContent(r).slice(0, 200))
      }
    }
    console.log('\n[seed-dmv-rag] Dry run complete.')
    return
  }

  // Lazy-import ingester so script runs cleanly in --dry-run without @kealee/ai
  const { ingestSingleDocument } = await import('../src/modules/rag/rag-ingester')

  let succeeded = 0
  let failed    = 0
  const errors: string[] = []

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (r, batchIdx) => {
        const globalIdx  = i + batchIdx
        const jurisdiction = (r as { jurisdiction?: string }).jurisdiction ?? ''
        try {
          await ingestSingleDocument({
            sourceType:  `DMV_${r.type.toUpperCase()}`,
            sourceId:    recordSourceId(r, globalIdx),
            title:       recordTitle(r),
            content:     recordContent(r),
            jurisdiction,
            serviceType: r.type,
          })
          succeeded++
        } catch (err: unknown) {
          failed++
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`${recordTitle(r)}: ${msg}`)
          console.error(`[seed-dmv-rag] Failed ${recordTitle(r)}: ${msg}`)
        }
      }),
    )

    // Progress + rate-limit delay
    if (i + BATCH_SIZE < records.length) {
      const done = Math.min(i + BATCH_SIZE, records.length)
      process.stdout.write(`\r[seed-dmv-rag] ${done}/${records.length}…`)
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  console.log(`\n[seed-dmv-rag] Done — ${succeeded} succeeded, ${failed} failed`)
  if (errors.length) {
    console.error(`[seed-dmv-rag] First ${Math.min(errors.length, 10)} errors:`)
    errors.slice(0, 10).forEach(e => console.error(`  - ${e}`))
    if (errors.length > 10) console.error(`  … and ${errors.length - 10} more`)
    process.exit(1)
  }
}

// Run when executed directly (not imported)
if (require.main === module) {
  main().catch(err => {
    console.error('[seed-dmv-rag] Fatal:', err)
    process.exit(1)
  })
}
