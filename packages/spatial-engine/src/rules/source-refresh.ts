/**
 * The source-refresh job.
 *
 * Phase 3C proved change detection against synthesised content. This fetches
 * the real documents, cuts them into the regions rules were extracted from,
 * hashes each region, and hands the result to the existing detector.
 *
 * It runs in the maintenance workflow, never on a project request path — the
 * whole point of certification is that evaluating a project touches no network
 * and parses no ordinance.
 *
 * Failure is a first-class outcome. A county portal returning 503 is an outage,
 * not an amendment: existing certifications stand, and a maintenance item is
 * raised saying currency can no longer be proven.
 */

import * as http from 'http'
import * as https from 'https'
import { hashSourceContent, normalizeSourceContent, detectSourceChanges, applySourceChange,
  advanceSourceVersion, type AuthoritativeSource, type SourceRegion, type ChangeDetectionResult } from './change-detection'
import type { CertifiableRule, ReviewerRole } from './certification'

export interface FetchResult {
  ok: boolean
  status: number | null
  body: string | null
  error: string | null
  fetchedAt: string
  /** Bytes received, for the operator log. */
  bytes: number
}

export interface FetchOptions {
  timeoutMs?: number
  maxBytes?: number
  userAgent?: string
  /** Injected for tests; defaults to the real network. */
  fetchImpl?: (url: string) => Promise<FetchResult>
}

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_BYTES = 20 * 1024 * 1024

/**
 * Redirect-aware GET returning text.
 *
 * Follows the pattern already established in `gis-client.ts` rather than adding
 * an HTTP dependency. A response is capped so a misconfigured endpoint streaming
 * gigabytes cannot take the maintenance worker down.
 */
export function fetchText(urlString: string, opts: FetchOptions = {}, redirects = 0): Promise<FetchResult> {
  const fetchedAt = new Date().toISOString()
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES

  return new Promise(resolve => {
    if (redirects > 5) {
      resolve({ ok: false, status: null, body: null, error: 'Too many redirects', fetchedAt, bytes: 0 })
      return
    }
    let url: URL
    try {
      url = new URL(urlString)
    } catch {
      resolve({ ok: false, status: null, body: null, error: `Malformed URL: ${urlString}`, fetchedAt, bytes: 0 })
      return
    }

    const client = url.protocol === 'https:' ? https : http
    const req = client.get(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: { 'User-Agent': opts.userAgent ?? 'KealeePlatform/1.0 (contact@kealee.com)' },
      },
      res => {
        const status = res.statusCode ?? null
        if (status && status >= 300 && status < 400 && res.headers.location) {
          res.resume()
          const next = new URL(res.headers.location, urlString).toString()
          fetchText(next, opts, redirects + 1).then(resolve)
          return
        }
        if (!status || status >= 400) {
          res.resume()
          resolve({ ok: false, status, body: null, error: `HTTP ${status}`, fetchedAt, bytes: 0 })
          return
        }

        let data = ''
        let bytes = 0
        res.setEncoding('utf8')
        res.on('data', (chunk: string) => {
          bytes += Buffer.byteLength(chunk, 'utf8')
          if (bytes > maxBytes) {
            req.destroy()
            resolve({ ok: false, status, body: null, error: `Response exceeded ${maxBytes} bytes`, fetchedAt, bytes })
            return
          }
          data += chunk
        })
        res.on('end', () => resolve({ ok: true, status, body: data, error: null, fetchedAt, bytes }))
      },
    )

    req.setTimeout(timeoutMs, () => {
      req.destroy()
      resolve({ ok: false, status: null, body: null, error: `Timed out after ${timeoutMs}ms`, fetchedAt, bytes: 0 })
    })
    req.on('error', e => {
      resolve({ ok: false, status: null, body: null, error: e.message, fetchedAt, bytes: 0 })
    })
  })
}

// ── Region locators ─────────────────────────────────────────────────────────

/**
 * How to cut a region out of a fetched document.
 *
 * A locator that stops matching is reported rather than hashed as empty — an
 * empty-string hash is stable and would read as "unchanged forever", which is
 * the worst possible failure for this system.
 */
export interface RegionLocator {
  regionId: string
  label: string
  ruleIdentities: string[]
  /** Applied to the NORMALISED document. */
  extract: (normalized: string) => string | null
  /**
   * Applied to the RAW document instead, when it is available and returns a
   * slice. Some publishers delimit regions with markup that normalisation
   * removes — anchor ids, for instance — and those are often the only reliable
   * boundary between one section's tables and the next. The returned slice is
   * normalised before hashing, so the hash is still immune to cosmetic churn.
   */
  extractRaw?: (raw: string) => string | null
}

// `betweenMarkers` lives in change-detection.ts and is re-exported through the
// same barrel; there is no second implementation here.

/** A window of text around a section heading — the common ordinance case. */
export function sectionWindow(heading: string, maxChars = 8000): RegionLocator['extract'] {
  const h = heading.toLowerCase()
  return normalized => {
    const at = normalized.indexOf(h)
    if (at < 0) return null
    return normalized.slice(at, at + maxChars)
  }
}

// ── The refresh ─────────────────────────────────────────────────────────────

export interface RefreshOutcome {
  sourceId: string
  fetched: FetchResult
  /** Present when the fetch succeeded. */
  change: ChangeDetectionResult | null
  /** Locators that no longer match — a structural change in the document. */
  unlocatableRegions: string[]
  /** The source record rolled forward, when it changed. */
  source: AuthoritativeSource
  rules: CertifiableRule[]
  downgraded: { identity: string; from: string; to: string; reason: string }[]
  retained: string[]
  /** Maintenance items for a human, distinct from project review items. */
  maintenanceItems: { code: string; detail: string; ruleIdentities: string[] }[]
  summary: string
}

export interface RefreshInput {
  source: AuthoritativeSource
  locators: RegionLocator[]
  rules: CertifiableRule[]
  /** Version label for the newly fetched document, e.g. a date stamp. */
  newVersion?: string
  actor?: { id: string; name: string; role: ReviewerRole | 'system' }
  rulePackVersion?: string | null
  fetchOptions?: FetchOptions
}

/**
 * Fetches one source, re-hashes its regions, and applies whatever changed.
 *
 * Nothing here decides that a rule is wrong — it decides only that a rule's
 * basis moved and therefore cannot continue to be applied unattended.
 */
export async function refreshSource(input: RefreshInput): Promise<RefreshOutcome> {
  const { source, locators, rules } = input
  const doFetch = input.fetchOptions?.fetchImpl ?? ((u: string) => fetchText(u, input.fetchOptions))
  const maintenanceItems: RefreshOutcome['maintenanceItems'] = []

  if (!source.url) {
    return {
      sourceId: source.sourceId,
      fetched: { ok: false, status: null, body: null, error: 'No URL recorded for this source', fetchedAt: new Date().toISOString(), bytes: 0 },
      change: null,
      unlocatableRegions: [],
      source,
      rules,
      downgraded: [],
      retained: rules.map(r => r.identity),
      maintenanceItems: [{
        code: 'SOURCE_NOT_FETCHABLE',
        detail: `${source.title} has no URL, so it cannot be refreshed automatically. Currency must be confirmed by hand.`,
        ruleIdentities: rules.map(r => r.identity),
      }],
      summary: `${source.title}: no URL — cannot refresh.`,
    }
  }

  const fetched = await doFetch(source.url)

  // ── Fetch failed: an outage, not an amendment ───────────────────────────
  if (!fetched.ok || fetched.body == null) {
    const change = detectSourceChanges({
      previous: source,
      current: { documentHash: source.documentHash, version: source.version, retrievedAt: fetched.fetchedAt, regions: [] },
      unavailable: { reason: fetched.error ?? `HTTP ${fetched.status}` },
    })
    return {
      sourceId: source.sourceId,
      fetched,
      change,
      unlocatableRegions: [],
      source: { ...source, },
      rules,
      downgraded: [],
      retained: rules.map(r => r.identity),
      maintenanceItems: [{
        code: 'SOURCE_UNAVAILABLE',
        detail:
          `${source.title} could not be retrieved (${fetched.error ?? `HTTP ${fetched.status}`}). ` +
          'Certifications are retained — an outage is not an amendment — but source currency can no ' +
          'longer be proven and should be confirmed before a permit submission relies on it.',
        ruleIdentities: rules.map(r => r.identity),
      }],
      summary: `${source.title}: unreachable (${fetched.error ?? fetched.status}). Certifications retained.`,
    }
  }

  // ── Re-hash the document and its regions ────────────────────────────────
  const documentHash = await hashSourceContent(fetched.body)
  const normalized = normalizeSourceContent(fetched.body)

  const regions: SourceRegion[] = []
  const unlocatableRegions: string[] = []
  for (const loc of locators) {
    // A raw locator wins when it finds something; otherwise fall back to the
    // normalised one, so a publisher dropping an anchor degrades to coarser
    // scope rather than to no region at all.
    const rawSlice = loc.extractRaw?.(fetched.body)
    const slice = rawSlice != null && rawSlice.trim() !== ''
      ? normalizeSourceContent(rawSlice)
      : loc.extract(normalized)
    if (slice == null || slice.trim() === '') {
      unlocatableRegions.push(loc.label)
      continue
    }
    regions.push({
      regionId: loc.regionId,
      label: loc.label,
      hash: await hashSourceContent(slice, { stripHtml: false }),
      ruleIdentities: loc.ruleIdentities,
    })
  }

  if (unlocatableRegions.length) {
    const affected = locators
      .filter(l => unlocatableRegions.includes(l.label))
      .flatMap(l => l.ruleIdentities)
    maintenanceItems.push({
      code: 'REGION_LOCATOR_FAILED',
      detail:
        `${unlocatableRegions.length} region locator(s) no longer match the document ` +
        `(${unlocatableRegions.slice(0, 3).join('; ')}${unlocatableRegions.length > 3 ? ', …' : ''}). ` +
        'The document has been restructured, or the section was renumbered. The affected rules cannot ' +
        'be proven current until the locators are updated — they are NOT hashed as empty, because an ' +
        'empty hash is stable and would read as "unchanged forever".',
      ruleIdentities: affected,
    })
  }

  const newVersion = input.newVersion ?? fetched.fetchedAt.slice(0, 10)
  const current = { documentHash, version: newVersion, retrievedAt: fetched.fetchedAt, regions }
  const change = detectSourceChanges({ previous: source, current })

  // A region we can no longer locate is treated as removed, so its rules are
  // reconsidered rather than silently trusted.
  const withUnlocatable: ChangeDetectionResult = unlocatableRegions.length
    ? {
        ...change,
        changed: true,
        affectedRuleIdentities: [...new Set([
          ...change.affectedRuleIdentities,
          ...locators.filter(l => unlocatableRegions.includes(l.label)).flatMap(l => l.ruleIdentities),
        ])],
        unaffectedRuleIdentities: change.unaffectedRuleIdentities.filter(
          id => !locators.filter(l => unlocatableRegions.includes(l.label)).flatMap(l => l.ruleIdentities).includes(id),
        ),
      }
    : change

  const applied = applySourceChange({
    rules, change: withUnlocatable, actor: input.actor, rulePackVersion: input.rulePackVersion,
  })

  const nextSource = withUnlocatable.changed ? advanceSourceVersion(source, current) : source

  if (withUnlocatable.changed && !withUnlocatable.scopeIsolated) {
    maintenanceItems.push({
      code: 'CHANGE_SCOPE_UNKNOWN',
      detail:
        'The document changed and the change could not be isolated to tracked regions, so every rule ' +
        'from this source was reconsidered. Add region locators to narrow future invalidations.',
      ruleIdentities: withUnlocatable.affectedRuleIdentities,
    })
  }

  return {
    sourceId: source.sourceId,
    fetched,
    change: withUnlocatable,
    unlocatableRegions,
    source: nextSource,
    rules: applied.rules,
    downgraded: applied.downgraded,
    retained: applied.retained,
    maintenanceItems,
    summary: withUnlocatable.summary,
  }
}

/** Refreshes several sources, isolating a failure in one from the rest. */
export async function refreshAll(inputs: RefreshInput[]): Promise<RefreshOutcome[]> {
  const out: RefreshOutcome[] = []
  for (const input of inputs) {
    try {
      out.push(await refreshSource(input))
    } catch (e) {
      // A thrown error in one source must not abandon the others mid-cycle.
      out.push({
        sourceId: input.source.sourceId,
        fetched: { ok: false, status: null, body: null, error: String(e), fetchedAt: new Date().toISOString(), bytes: 0 },
        change: null,
        unlocatableRegions: [],
        source: input.source,
        rules: input.rules,
        downgraded: [],
        retained: input.rules.map(r => r.identity),
        maintenanceItems: [{
          code: 'REFRESH_FAILED',
          detail: `Refresh of ${input.source.title} threw: ${String(e)}. Certifications retained.`,
          ruleIdentities: input.rules.map(r => r.identity),
        }],
        summary: `${input.source.title}: refresh failed.`,
      })
    }
  }
  return out
}
