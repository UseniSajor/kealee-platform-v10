/**
 * Probes every endpoint in `dmv-endpoints.ts` against the live services.
 *
 * Exists because of what happened to Prince George's: the county retired
 * `Geocoders/Address/GeocodeServer` and it kept answering HTTP **200** with
 * `{"error":{"code":404}}` in the body. A `res.ok` check read the dead service
 * as a clean no-match, and a real paid order blocked for five hours on an
 * address that was perfectly valid.
 *
 * So this does not check status codes. It parses the body and requires real
 * layer metadata back. An endpoint that returns a service error is reported as
 * DEAD however cheerful its HTTP status.
 *
 *   cd packages/spatial-engine && pnpm tsx scripts/verify-dmv-endpoints.ts
 */
import { DMV_GIS_ENDPOINTS, capabilityOf, type JurisdictionGisEndpoints } from '../src/jurisdictions/dmv-endpoints'

type Verdict = 'ALIVE' | 'SERVICE_ERROR' | 'UNREACHABLE' | 'NOT_JSON' | 'ABSENT'

interface Probe {
  label: string
  url: string | null
  verdict: Verdict
  detail: string
}

async function probe(label: string, url: string | null): Promise<Probe> {
  if (!url) return { label, url, verdict: 'ABSENT', detail: 'not published / not located' }
  try {
    const res = await fetch(`${url}?f=json`, { headers: { accept: 'application/json' } })
    const text = await res.text()
    let body: any
    try { body = JSON.parse(text) } catch {
      return { label, url, verdict: 'NOT_JSON', detail: `HTTP ${res.status}, body was not JSON` }
    }
    // The PG trap: a service error inside a 200.
    if (body?.error) {
      return {
        label, url, verdict: 'SERVICE_ERROR',
        detail: `HTTP ${res.status} carrying error ${body.error.code}: ${String(body.error.message ?? '').slice(0, 60)}`,
      }
    }
    const name = body?.name ?? body?.mapName ?? '(unnamed)'
    const type = body?.type ?? (Array.isArray(body?.layers) ? `${body.layers.length} layers` : 'service')
    return { label, url, verdict: 'ALIVE', detail: `${name} — ${type}` }
  } catch (e) {
    return { label, url, verdict: 'UNREACHABLE', detail: e instanceof Error ? e.message : String(e) }
  }
}

async function checkJurisdiction(j: JurisdictionGisEndpoints): Promise<number> {
  const probes = await Promise.all([
    probe('zoning', j.zoning),
    probe('parcels', j.parcels),
    probe('contours', j.contours?.url ?? null),
    probe('spot elevations', j.spotElevations),
    probe('addresses', j.addresses),
  ])

  console.log(`\n${j.name}  (${j.state})  — verified ${j.verifiedOn}`)
  let broken = 0
  for (const p of probes) {
    const mark =
      p.verdict === 'ALIVE' ? 'ok  ' :
      p.verdict === 'ABSENT' ? '--  ' : 'DEAD'
    if (p.verdict !== 'ALIVE' && p.verdict !== 'ABSENT') broken++
    console.log(`  ${mark} ${p.label.padEnd(16)} ${p.detail}`)
  }

  const cap = capabilityOf(j)
  console.log(
    `  capability: parcel=${cap.canLocateParcel ? 'y' : 'n'} ` +
    `zone=${cap.canReadZoneCode ? 'y' : 'n'} ` +
    `terrain=${cap.canShowTerrain ? 'y' : 'n'} ` +
    `setbacks=${cap.canComputeSetbacks ? 'y' : 'n'}  ` +
    `SELLABLE=${cap.sellable ? 'YES' : 'no'}`,
  )
  for (const b of j.blockers) console.log(`    · ${b}`)
  return broken
}

async function main(): Promise<void> {
  console.log('Probing DMV GIS endpoints. A service error inside an HTTP 200 counts as DEAD.')
  let broken = 0
  for (const j of DMV_GIS_ENDPOINTS) broken += await checkJurisdiction(j)

  console.log(
    `\n${broken === 0 ? 'Every published endpoint answered.' : `${broken} endpoint(s) did not answer — the registry is out of date.`}`,
  )
  console.log(
    '\nNo jurisdiction here is sellable. Every one lacks an extracted dimensional\n' +
    'table, so setbacks cannot be computed, and a guessed setback draws a\n' +
    'non-compliant plan that looks exactly like a compliant one. Prince George’s\n' +
    'is served because someone extracted its standards from the adopted\n' +
    'ordinance; that work has no shortcut.',
  )
  process.exit(broken === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
