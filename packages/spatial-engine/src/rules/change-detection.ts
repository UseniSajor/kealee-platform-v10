/**
 * Source hashing and scoped change detection.
 *
 * The economics of Phase 3C rest entirely on this file. Certification is only
 * worth granting if it survives — and it can only survive if we can prove the
 * ordinance text has not moved underneath it. So every source is normalised and
 * hashed, and every rule is hashed against the REGION it came from rather than
 * the whole document.
 *
 * Region-level hashing is what makes invalidation surgical. When the county
 * amends the RSF-65 table, the RMF-20 certifications are not collateral damage.
 */

import { checksumOf } from '../survey/import-record'
import type { CertifiableRule, RuleAuditEvent, ReviewerRole } from './certification'
import { ruleAuditEvent, transitionRule } from './certification'
import type { RuleState } from './model'

// ── Normalisation ───────────────────────────────────────────────────────────

/**
 * Normalises source content before hashing.
 *
 * Without this, a hash flips because the county's CMS changed a session id in a
 * footer or reflowed whitespace — and every certification in the jurisdiction
 * reopens for no reason. Normalisation strips what cannot change the meaning
 * and keeps everything that can.
 */
export function normalizeSourceContent(raw: string, opts: { stripHtml?: boolean } = {}): string {
  let s = raw

  if (opts.stripHtml !== false && /<[a-z!][\s\S]*>/i.test(s)) {
    // Script, style and comments carry no regulatory content.
    s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
         .replace(/<style[\s\S]*?<\/style>/gi, ' ')
         .replace(/<!--[\s\S]*?-->/g, ' ')
    // Keep table structure as explicit delimiters so a shifted cell still
    // changes the hash. They are text rather than newlines because whitespace
    // is collapsed below — indentation must not be able to flip a hash.
    s = s.replace(/<\/(td|th)>/gi, ' | ')
         .replace(/<\/(tr|p|div|li|h[1-6])>/gi, ' || ')
         .replace(/<[^>]+>/g, ' ')
  }

  return s
    // Volatile scaffolding a CMS regenerates on every request.
    .replace(/(?:session|sid|token|nonce|csrf|_ga|timestamp)=[A-Za-z0-9._%-]+/gi, '')
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    // All whitespace — including newlines and indentation — collapses to one
    // space. A CMS reflowing its markup must not read as an amendment; the
    // structural delimiters inserted above carry the table shape instead.
    .replace(/\s+/g, ' ')
    .replace(/ *\|\| */g, ' || ')
    .replace(/ *\| */g, ' | ')
    .trim()
    .toLowerCase()
}

export async function hashSourceContent(raw: string, opts?: { stripHtml?: boolean }): Promise<string> {
  return checksumOf(normalizeSourceContent(raw, opts))
}

// ── Source records ──────────────────────────────────────────────────────────

/**
 * A region of a source document that one or more rules were extracted from —
 * a single table, a single section. Rules bind to regions, not documents.
 */
export interface SourceRegion {
  regionId: string
  /** Human-readable locator, e.g. "Sec. 27-4205 Table 27-4205(b)". */
  label: string
  /** Hash of the normalised region content. */
  hash: string
  /** Rule identities extracted from this region. */
  ruleIdentities: string[]
}

export interface AuthoritativeSource {
  sourceId: string
  jurisdiction: string
  title: string
  url: string | null
  documentId: string | null
  /** Hash of the whole normalised document. */
  documentHash: string
  version: string
  retrievedAt: string
  regions: SourceRegion[]
  /** Prior versions, newest first. Never discarded. */
  history: { version: string; documentHash: string; retrievedAt: string; supersededAt: string }[]
}

/** Splits a document into hashable regions by locator. */
export async function buildSourceRegions(
  content: string,
  locators: { regionId: string; label: string; extract: (normalized: string) => string | null }[],
  ruleIdentitiesByRegion: Record<string, string[]> = {},
): Promise<{ regions: SourceRegion[]; unlocatable: string[] }> {
  const normalized = normalizeSourceContent(content)
  const regions: SourceRegion[] = []
  const unlocatable: string[] = []

  for (const loc of locators) {
    const slice = loc.extract(normalized)
    if (slice == null || slice.trim() === '') {
      // A region that cannot be located is reported, never hashed as empty —
      // an empty-string hash is stable and would look like "unchanged forever".
      unlocatable.push(loc.label)
      continue
    }
    regions.push({
      regionId: loc.regionId,
      label: loc.label,
      hash: await checksumOf(slice),
      ruleIdentities: ruleIdentitiesByRegion[loc.regionId] ?? [],
    })
  }
  return { regions, unlocatable }
}

/** Convenience locator: everything between two markers. */
export function betweenMarkers(start: string, end?: string) {
  return (normalized: string): string | null => {
    const s = normalized.indexOf(start.toLowerCase())
    if (s < 0) return null
    const from = s + start.length
    if (!end) return normalized.slice(from)
    const e = normalized.indexOf(end.toLowerCase(), from)
    return e < 0 ? normalized.slice(from) : normalized.slice(from, e)
  }
}

// ── Change detection ────────────────────────────────────────────────────────

export type SourceChangeKind =
  | 'UNCHANGED'
  | 'REGION_CHANGED'
  | 'REGION_ADDED'
  | 'REGION_REMOVED'
  | 'DOCUMENT_CHANGED_SCOPE_UNKNOWN'
  | 'SOURCE_UNAVAILABLE'

export interface SourceChange {
  kind: SourceChangeKind
  regionId: string | null
  label: string
  previousHash: string | null
  currentHash: string | null
  affectedRuleIdentities: string[]
  detail: string
}

export interface ChangeDetectionResult {
  sourceId: string
  jurisdiction: string
  changed: boolean
  previousVersion: string
  currentVersion: string
  documentHashBefore: string
  documentHashAfter: string
  changes: SourceChange[]
  /** Rules whose certification must be reconsidered. */
  affectedRuleIdentities: string[]
  /** Rules explicitly proven unaffected — these keep their certification. */
  unaffectedRuleIdentities: string[]
  /** True when the change could not be narrowed to regions. */
  scopeIsolated: boolean
  summary: string
  detectedAt: string
}

export interface DetectChangesInput {
  previous: AuthoritativeSource
  current: { documentHash: string; version: string; retrievedAt: string; regions: SourceRegion[] }
  /** Set when the fetch failed. An unreachable source is itself a finding. */
  unavailable?: { reason: string }
}

/**
 * Compares a freshly retrieved source against the stored one.
 *
 * The important behaviour is what happens when the document hash changes but no
 * region hash does: that is a change OUTSIDE the regions we extracted from, and
 * it does not touch any certification. Treating it as a jurisdiction-wide
 * invalidation is exactly the over-reaction section 9 forbids.
 */
export function detectSourceChanges(input: DetectChangesInput): ChangeDetectionResult {
  const { previous, current } = input
  const detectedAt = current.retrievedAt
  const allKnownRules = [...new Set(previous.regions.flatMap(r => r.ruleIdentities))]

  if (input.unavailable) {
    return {
      sourceId: previous.sourceId,
      jurisdiction: previous.jurisdiction,
      changed: false,
      previousVersion: previous.version,
      currentVersion: previous.version,
      documentHashBefore: previous.documentHash,
      documentHashAfter: previous.documentHash,
      changes: [{
        kind: 'SOURCE_UNAVAILABLE',
        regionId: null,
        label: previous.title,
        previousHash: previous.documentHash,
        currentHash: null,
        affectedRuleIdentities: allKnownRules,
        detail:
          `The source could not be retrieved: ${input.unavailable.reason}. Existing certifications are ` +
          'NOT withdrawn on a fetch failure — an outage is not an amendment — but currency can no longer ' +
          'be proven, so a maintenance review is raised.',
      }],
      affectedRuleIdentities: [],
      unaffectedRuleIdentities: allKnownRules,
      scopeIsolated: false,
      summary: `${previous.title} is unreachable. Certifications retained; freshness can no longer be proven.`,
      detectedAt,
    }
  }

  if (previous.documentHash === current.documentHash) {
    return {
      sourceId: previous.sourceId,
      jurisdiction: previous.jurisdiction,
      changed: false,
      previousVersion: previous.version,
      currentVersion: current.version,
      documentHashBefore: previous.documentHash,
      documentHashAfter: current.documentHash,
      changes: [],
      affectedRuleIdentities: [],
      unaffectedRuleIdentities: allKnownRules,
      scopeIsolated: true,
      summary:
        `${previous.title} is unchanged (${current.documentHash.slice(0, 16)}…). ` +
        `All ${allKnownRules.length} rule(s) retain their certification and no review is reopened.`,
      detectedAt,
    }
  }

  const prevByRegion = new Map(previous.regions.map(r => [r.regionId, r]))
  const currByRegion = new Map(current.regions.map(r => [r.regionId, r]))
  const changes: SourceChange[] = []
  const affected = new Set<string>()
  const unaffected = new Set<string>()

  for (const prev of previous.regions) {
    const curr = currByRegion.get(prev.regionId)
    if (!curr) {
      changes.push({
        kind: 'REGION_REMOVED',
        regionId: prev.regionId,
        label: prev.label,
        previousHash: prev.hash,
        currentHash: null,
        affectedRuleIdentities: prev.ruleIdentities,
        detail:
          `${prev.label} is no longer present in the source. Its rules cannot be confirmed against ` +
          'anything and must not continue to be applied automatically.',
      })
      prev.ruleIdentities.forEach(r => affected.add(r))
      continue
    }
    if (curr.hash !== prev.hash) {
      changes.push({
        kind: 'REGION_CHANGED',
        regionId: prev.regionId,
        label: prev.label,
        previousHash: prev.hash,
        currentHash: curr.hash,
        affectedRuleIdentities: prev.ruleIdentities,
        detail: `${prev.label} changed. ${prev.ruleIdentities.length} rule(s) extracted from it need re-verification.`,
      })
      prev.ruleIdentities.forEach(r => affected.add(r))
    } else {
      prev.ruleIdentities.forEach(r => unaffected.add(r))
    }
  }

  for (const curr of current.regions) {
    if (prevByRegion.has(curr.regionId)) continue
    changes.push({
      kind: 'REGION_ADDED',
      regionId: curr.regionId,
      label: curr.label,
      previousHash: null,
      currentHash: curr.hash,
      affectedRuleIdentities: [],
      detail: `${curr.label} is new in this version. It may contain requirements not yet extracted.`,
    })
  }

  // Document moved but no tracked region did. Something outside our extraction
  // footprint changed — a preamble, an unrelated subtitle, a nav menu.
  const regionLevelChange = changes.some(c => c.kind === 'REGION_CHANGED' || c.kind === 'REGION_REMOVED')
  const scopeIsolated = previous.regions.length > 0
  if (!regionLevelChange && scopeIsolated) {
    changes.push({
      kind: 'REGION_CHANGED',
      regionId: null,
      label: 'outside tracked regions',
      previousHash: previous.documentHash,
      currentHash: current.documentHash,
      affectedRuleIdentities: [],
      detail:
        'The document hash changed but every tracked region is byte-identical after normalisation. ' +
        'The amendment lies outside the text these rules were extracted from, so no certification is ' +
        'withdrawn. A maintenance item is raised to confirm no new requirement was introduced.',
    })
  }

  if (!scopeIsolated) {
    // No regions tracked — we cannot say what moved, so everything is suspect.
    changes.push({
      kind: 'DOCUMENT_CHANGED_SCOPE_UNKNOWN',
      regionId: null,
      label: previous.title,
      previousHash: previous.documentHash,
      currentHash: current.documentHash,
      affectedRuleIdentities: allKnownRules,
      detail:
        'The document changed and no regions are tracked for this source, so the change cannot be ' +
        'isolated. Every rule from this source is reconsidered — this is the one case where a ' +
        'jurisdiction-wide reopen is correct.',
    })
    allKnownRules.forEach(r => affected.add(r))
  }

  for (const r of affected) unaffected.delete(r)

  return {
    sourceId: previous.sourceId,
    jurisdiction: previous.jurisdiction,
    changed: true,
    previousVersion: previous.version,
    currentVersion: current.version,
    documentHashBefore: previous.documentHash,
    documentHashAfter: current.documentHash,
    changes,
    affectedRuleIdentities: [...affected],
    unaffectedRuleIdentities: [...unaffected],
    scopeIsolated,
    summary:
      `${previous.title} changed (${previous.version} → ${current.version}). ` +
      `${affected.size} rule(s) affected, ${unaffected.size} explicitly unaffected and still certified. ` +
      (scopeIsolated
        ? 'The change was isolated to specific regions.'
        : 'The change could not be isolated, so all rules from this source were reconsidered.'),
    detectedAt,
  }
}

// ── Applying a detected change ──────────────────────────────────────────────

export interface InvalidationResult {
  rules: CertifiableRule[]
  downgraded: { identity: string; from: RuleState; to: RuleState; reason: string }[]
  retained: string[]
  audits: RuleAuditEvent[]
}

/**
 * Applies a change result to a set of rules.
 *
 * A changed region does NOT revoke — revocation means the rule was wrong.
 * A certified rule whose source moved goes back to PROVISIONAL: it is still the
 * best information available for drafting, it simply is not certified any more.
 * A removed region is worse: the rule's basis is gone, so it is SUPERSEDED.
 */
export function applySourceChange(input: {
  rules: CertifiableRule[]
  change: ChangeDetectionResult
  actor?: { id: string; name: string; role: ReviewerRole | 'system' }
  rulePackVersion?: string | null
}): InvalidationResult {
  const actor = input.actor ?? { id: 'system', name: 'rule-maintenance', role: 'system' as const }
  const affected = new Set(input.change.affectedRuleIdentities)
  const removedRegions = new Set(
    input.change.changes
      .filter(c => c.kind === 'REGION_REMOVED')
      .flatMap(c => c.affectedRuleIdentities),
  )

  const rules: CertifiableRule[] = []
  const downgraded: InvalidationResult['downgraded'] = []
  const retained: string[] = []
  const audits: RuleAuditEvent[] = []

  for (const rule of input.rules) {
    if (!affected.has(rule.identity)) {
      retained.push(rule.identity)
      rules.push(rule)
      continue
    }

    const to: RuleState = removedRegions.has(rule.identity) ? 'SUPERSEDED' : 'PROVISIONAL'
    const reason = removedRegions.has(rule.identity)
      ? `The source region this rule was extracted from no longer exists in ${input.change.currentVersion}.`
      : `The source region changed in ${input.change.currentVersion} ` +
        `(${input.change.documentHashBefore.slice(0, 12)}… → ${input.change.documentHashAfter.slice(0, 12)}…). ` +
        'The rule is still usable for drafting but is no longer certified.'

    // A rule already below CERTIFIED and already in the target state needs no
    // transition; recording one would be noise.
    if (rule.state === to) {
      rules.push({
        ...rule,
        humanReviewRequired: true,
        humanReviewReasons: [...new Set([...rule.humanReviewReasons, reason])],
      })
      downgraded.push({ identity: rule.identity, from: rule.state, to, reason })
      continue
    }

    try {
      const t = transitionRule({
        rule, to, actor, reason, rulePackVersion: input.rulePackVersion ?? null,
      })
      rules.push(t.rule)
      audits.push({ ...t.audit, action: 'source_changed' })
      downgraded.push({ identity: rule.identity, from: rule.state, to, reason })
    } catch {
      // Terminal states cannot move. The rule is already out of service, which
      // is the outcome a source change would have produced anyway.
      rules.push(rule)
      audits.push(ruleAuditEvent({
        ruleIdentity: rule.identity,
        jurisdiction: rule.scope.jurisdiction,
        ruleKey: rule.ruleKey,
        ruleVersion: rule.version,
        previousState: rule.state,
        newState: rule.state,
        action: 'source_changed',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        reason: `${reason} The rule is already ${rule.state} and stays there.`,
        sourceHash: input.change.documentHashAfter,
        sourceVersion: input.change.currentVersion,
        reviewItemId: null,
        rulePackVersion: input.rulePackVersion ?? null,
        affectedProjectIds: [],
      }))
    }
  }

  return { rules, downgraded, retained, audits }
}

/** Rolls the source forward, keeping prior versions. */
export function advanceSourceVersion(
  previous: AuthoritativeSource,
  current: { documentHash: string; version: string; retrievedAt: string; regions: SourceRegion[] },
): AuthoritativeSource {
  return {
    ...previous,
    documentHash: current.documentHash,
    version: current.version,
    retrievedAt: current.retrievedAt,
    regions: current.regions,
    history: [
      { version: previous.version, documentHash: previous.documentHash, retrievedAt: previous.retrievedAt, supersededAt: current.retrievedAt },
      ...previous.history,
    ],
  }
}
