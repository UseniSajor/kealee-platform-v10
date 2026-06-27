/**
 * Local DMV zoning seed assessor fallback — no external API required.
 * Matches parcel addresses to data/zoning/dmv_zoning_seed.csv for mailing-only outreach.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface LocalAssessorRecord {
  address: string
  jurisdiction: string
  zoningCode: string
  notes: string
  lotSizeMinSqft?: number
}

let cache: LocalAssessorRecord[] | null = null

function repoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '../../../../../')
}

export function loadLocalAssessorSeed(): LocalAssessorRecord[] {
  if (cache) return cache
  const csvPath = path.join(repoRoot(), 'data', 'zoning', 'dmv_zoning_seed.csv')
  const raw = fs.readFileSync(csvPath, 'utf8')
  const lines = raw.trim().split('\n').slice(1)
  cache = lines.map((line) => {
    const cols = parseCsvLine(line)
    const notes = cols[9] ?? ''
    const lotMatch = notes.match(/(\d[\d,]*)\s*sq\s*ft\s*min/i)
    return {
      address: cols[0]?.trim() ?? '',
      jurisdiction: cols[1]?.trim() ?? '',
      zoningCode: cols[2]?.trim() ?? '',
      notes,
      lotSizeMinSqft: lotMatch ? parseInt(lotMatch[1].replace(/,/g, ''), 10) : undefined,
    }
  })
  return cache
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQ = !inQ
      continue
    }
    if (c === ',' && !inQ) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out
}

function normalizeAddr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function lookupLocalAssessor(address: string): LocalAssessorRecord | null {
  const norm = normalizeAddr(address.split(',')[0] ?? address)
  if (!norm) return null
  const seed = loadLocalAssessorSeed()
  return (
    seed.find((r) => {
      const rNorm = normalizeAddr(r.address.split(',')[0] ?? r.address)
      return rNorm.includes(norm.slice(0, 12)) || norm.includes(rNorm.slice(0, 12))
    }) ?? null
  )
}

export function parseDmvZoningCsvToParcels(): Array<{
  address: string
  jurisdiction?: string
  zoningCode?: string
  lotSizeSqft?: number
  ownerMailingAddress: string
  propertyType: string
}> {
  return loadLocalAssessorSeed()
    .filter((r) => r.zoningCode.match(/^R-/i) || r.zoningCode.match(/^RF-/i))
    .map((r) => ({
      address: r.address,
      jurisdiction: r.jurisdiction,
      zoningCode: r.zoningCode,
      lotSizeSqft: r.lotSizeMinSqft,
      ownerMailingAddress: r.address,
      propertyType: 'single_family',
    }))
}
