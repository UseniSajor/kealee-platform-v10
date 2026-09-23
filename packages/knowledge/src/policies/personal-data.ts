/**
 * Personal data in the knowledge corpus.
 *
 * Phase G accumulates delivered plans, professional redlines and QC findings
 * into a retrievable corpus that seeds future generation. That corpus is a
 * genuine asset. It is also, without this module, a pile of customer records.
 *
 * THE DISTINCTION THAT MAKES IT SAFE AND STILL USEFUL:
 *
 *   A parcel is PUBLIC RECORD. Its boundary, zoning, acreage, soils, contours
 *   and adjacent owners are published by the county to anyone who asks. A
 *   professional's redline about a setback is WORK PRODUCT about that parcel.
 *   Neither is personal data.
 *
 *   The LINK between that parcel and a named, paying, identifiable customer IS
 *   personal data. So is their email, their phone number, and the fact that
 *   they are planning an addition.
 *
 * So the corpus keeps the engineering and drops the link. A retrieval hit
 * returns "in RSF-65, reviewers have twice withheld approval where the
 * driveway apron exceeded 20 ft" — which is exactly what improves the next
 * plan — and never returns who ordered it.
 *
 * This is not a substitute for a privacy policy or a lawful basis. It is the
 * technical control that makes one honourable.
 */

/** Why a record may be retained at all. */
export type LawfulBasis =
  /** Needed to deliver what the customer bought. */
  | 'CONTRACT_PERFORMANCE'
  /** A record the law requires us to keep (tax, professional practice). */
  | 'LEGAL_OBLIGATION'
  /** Improving the service, where the customer has not objected. */
  | 'LEGITIMATE_INTEREST'
  /** The customer said yes, specifically, and can say no again. */
  | 'CONSENT'
  /** Published by a public authority; not personal data in the first place. */
  | 'PUBLIC_RECORD'

export type DataClass =
  /** Identifies a living person, directly or in combination. */
  | 'PERSONAL'
  /** About a parcel or a drawing. Published or professional work product. */
  | 'ENGINEERING'
  /** Personal data that has had its identifiers removed and cannot be re-linked. */
  | 'DEIDENTIFIED'

export interface FieldPolicy {
  field: string
  dataClass: DataClass
  /** May this field enter the retrieval corpus? */
  corpusEligible: boolean
  /** How it is treated on the way in. */
  treatment: 'keep' | 'drop' | 'hash' | 'generalise'
  reason: string
}

/**
 * Field-level policy for everything the site-plan path can produce.
 *
 * `drop` means the value never reaches the corpus. `hash` means a stable
 * opaque token replaces it, so two records about the same parcel can still be
 * related without the parcel being identifiable from the corpus alone.
 * `generalise` reduces precision until it stops identifying — an address
 * becomes a zoning district.
 */
export const FIELD_POLICIES: FieldPolicy[] = [
  // ── Personal. None of this enters the corpus. ──
  { field: 'contactEmail', dataClass: 'PERSONAL', corpusEligible: false, treatment: 'drop',
    reason: 'Directly identifying and of no engineering value.' },
  { field: 'clientName', dataClass: 'PERSONAL', corpusEligible: false, treatment: 'drop',
    reason: 'Directly identifying and of no engineering value.' },
  { field: 'contactPhone', dataClass: 'PERSONAL', corpusEligible: false, treatment: 'drop',
    reason: 'Directly identifying and of no engineering value.' },
  { field: 'orderId', dataClass: 'PERSONAL', corpusEligible: false, treatment: 'hash',
    reason: 'Re-identifies a customer through the orders table. Hashed so two records about one job still relate.' },
  { field: 'address', dataClass: 'PERSONAL', corpusEligible: false, treatment: 'generalise',
    reason:
      'A street address plus a project intention identifies a household. The parcel facts are ' +
      'public; the address as an index into a customer list is not. Generalised to zone and ' +
      'jurisdiction, which is what retrieval actually needs.' },

  // ── Engineering. Public record or professional work product. ──
  { field: 'zoneCode', dataClass: 'ENGINEERING', corpusEligible: true, treatment: 'keep',
    reason: 'Published zoning. Public record.' },
  { field: 'jurisdictionCode', dataClass: 'ENGINEERING', corpusEligible: true, treatment: 'keep',
    reason: 'Which county publishes the rules. Public record and not person-specific.' },
  { field: 'parcelAreaSqFt', dataClass: 'ENGINEERING', corpusEligible: true, treatment: 'keep',
    reason: 'Published by the county assessment record.' },
  { field: 'setbacks', dataClass: 'ENGINEERING', corpusEligible: true, treatment: 'keep',
    reason: 'Derived from the published zoning table.' },
  { field: 'qcFindings', dataClass: 'ENGINEERING', corpusEligible: true, treatment: 'keep',
    reason: 'A statement about a drawing. This is the material that improves the next plan.' },
  { field: 'redlineComment', dataClass: 'ENGINEERING', corpusEligible: true, treatment: 'keep',
    reason:
      'A licensed professional statement about a drawing. Work product, not personal data — ' +
      'but see `reviewerName`, which is.' },
  { field: 'reviewerName', dataClass: 'PERSONAL', corpusEligible: false, treatment: 'drop',
    reason:
      'The professional is a person too. Their DECISION is the useful signal; their identity ' +
      'belongs in the audit trail, which is a different store with a different purpose.' },
  { field: 'licenceNumber', dataClass: 'PERSONAL', corpusEligible: false, treatment: 'drop',
    reason: 'Identifies an individual professional. Audit trail only.' },
  { field: 'sheetGeometry', dataClass: 'ENGINEERING', corpusEligible: true, treatment: 'keep',
    reason: 'Parcel geometry from the county fabric. Public record.' },
]

const BY_FIELD = new Map(FIELD_POLICIES.map(p => [p.field, p]))

export function policyFor(field: string): FieldPolicy | null {
  return BY_FIELD.get(field) ?? null
}

/**
 * Fields with no policy.
 *
 * An unlisted field is treated as PERSONAL and dropped. That default is the
 * whole point: a new field added to the deliverable must be classified
 * deliberately before it can reach the corpus, rather than arriving there
 * because nobody thought about it.
 */
export function unclassified(fields: string[]): string[] {
  return fields.filter(f => !BY_FIELD.has(f))
}

export interface RetentionRule {
  store: string
  /** Days. `null` means retained while the account exists. */
  retainDays: number | null
  basis: LawfulBasis
  /** What a deletion request must do to this store. */
  onErasureRequest: 'delete' | 'deidentify' | 'retain_with_reason'
  reason: string
}

export const RETENTION_RULES: RetentionRule[] = [
  {
    store: 'public_intake_leads.form_data', retainDays: null, basis: 'CONTRACT_PERFORMANCE',
    onErasureRequest: 'delete',
    reason: 'The order record. Deleted on request once any legal retention period has run.',
  },
  {
    store: 'documents (delivered plans)', retainDays: null, basis: 'CONTRACT_PERFORMANCE',
    onErasureRequest: 'retain_with_reason',
    reason:
      'A sealed or professionally reviewed drawing is a professional practice record. ' +
      'Maryland practice expects a licensee to retain their work. Erasure is refused with ' +
      'that reason stated, not silently ignored.',
  },
  {
    store: 'knowledge_artifacts', retainDays: null, basis: 'LEGITIMATE_INTEREST',
    onErasureRequest: 'deidentify',
    reason:
      'Holds engineering facts about a parcel. De-identification satisfies an erasure request ' +
      'because what remains is public record and work product, with no link to the person.',
  },
  {
    store: 'rag_documents / rag_chunks', retainDays: null, basis: 'LEGITIMATE_INTEREST',
    onErasureRequest: 'delete',
    reason:
      'The retrieval corpus is rebuildable from the artifacts. Deleting one person’s chunks ' +
      'costs nothing and removes any residual re-identification risk from free text.',
  },
  {
    store: 'learning_events', retainDays: 2555, basis: 'LEGITIMATE_INTEREST',
    onErasureRequest: 'deidentify',
    reason: 'Seven years, matching the professional record period. Actor ids are hashed on erasure.',
  },
]

export interface CorpusAdmission {
  admitted: Record<string, unknown>
  dropped: string[]
  hashed: string[]
  generalised: string[]
  /** Fields with no policy, dropped by default. Non-empty means someone must classify them. */
  unclassified: string[]
}

/**
 * Applies the field policy to a record on its way into the corpus.
 *
 * Deliberately conservative and deliberately loud: anything unclassified is
 * dropped AND reported, so a new field shows up as a governance task rather
 * than as silent data loss or silent data leakage.
 */
export function admitToCorpus(
  record: Record<string, unknown>,
  hash: (value: string) => string,
  generalise: (field: string, value: unknown) => unknown,
): CorpusAdmission {
  const admitted: Record<string, unknown> = {}
  const dropped: string[] = []
  const hashed: string[] = []
  const generalisedFields: string[] = []
  const unknownFields: string[] = []

  for (const [field, value] of Object.entries(record)) {
    const policy = BY_FIELD.get(field)
    if (!policy) { unknownFields.push(field); dropped.push(field); continue }
    switch (policy.treatment) {
      case 'keep':
        if (policy.corpusEligible) admitted[field] = value
        else dropped.push(field)
        break
      case 'drop':
        dropped.push(field)
        break
      case 'hash':
        admitted[`${field}Hash`] = hash(String(value ?? ''))
        hashed.push(field)
        break
      case 'generalise': {
        const g = generalise(field, value)
        if (g === null || g === undefined) dropped.push(field)
        else { admitted[field] = g; generalisedFields.push(field) }
        break
      }
    }
  }

  return {
    admitted, dropped, hashed,
    generalised: generalisedFields,
    unclassified: unknownFields,
  }
}
