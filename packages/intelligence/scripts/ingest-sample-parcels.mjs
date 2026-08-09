#!/usr/bin/env node
/**
 * Ingest sample DMV parcels into property_twins.
 * Usage: node scripts/ingest-sample-parcels.mjs [--all]
 */
import { parcelIngestionService, isIntelligencePersistenceAvailable } from '../dist/index.js'

if (!isIntelligencePersistenceAvailable()) {
  console.error('DATABASE_URL / KEALEE_DB_URL required')
  process.exit(1)
}

const all = process.argv.includes('--all')

try {
  if (all) {
    const results = await parcelIngestionService.ingestAllSamples()
    console.log(`Ingested ${results.length} sample parcels`)
    for (const r of results) {
      console.log(`  ${r.propertyTwin.address} → ${r.propertyTwin.id} (created=${r.created})`)
    }
  } else {
    const r = await parcelIngestionService.ingestSample()
    console.log(`Ingested: ${r.propertyTwin.address}`)
    console.log(`  propertyTwinId: ${r.propertyTwin.id}`)
    console.log(`  loopRunId: ${r.loopRunId}`)
  }
} catch (err) {
  console.error(err)
  process.exit(1)
}
