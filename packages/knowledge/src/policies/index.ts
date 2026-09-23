/**
 * Governance policies applied at ingest (spec §15, §24, §27).
 *
 *  - Training eligibility is EXPLICIT: nothing enters as a candidate by
 *    accident. Customer/project data defaults to RETRIEVAL_ONLY; only
 *    Kealee-generated outputs that a person has approved, or public records,
 *    may be marked candidates — and promotion to TRAINING_APPROVED is a
 *    separate human act (Phase 7).
 *  - Authority is set from the approval ladder when the caller does not say.
 *  - Secrets are scanned out of anything stored as text/JSON metadata.
 */
import type { KnowledgeApprovalStatus, KnowledgeArtifactType, KnowledgeAuthority, KnowledgeConfidentiality, TrainingEligibility, RetrievalEligibility } from '../types'

/** The default authority an approval status implies (spec §24). */
export function authorityFor(approval: KnowledgeApprovalStatus, type: KnowledgeArtifactType, explicit?: KnowledgeAuthority | null): KnowledgeAuthority {
  if (explicit) return explicit
  switch (approval) {
    case 'JURISDICTION_APPROVED': return type === 'PLAT' || type === 'REGULATION' || type === 'RULE' ? 'APPROVED_GOVERNMENT_RECORD' : 'JURISDICTION_ISSUED_DOCUMENT'
    case 'PROFESSIONAL_SEALED': return 'SEALED_PROFESSIONAL_DOCUMENT'
    case 'HUMAN_APPROVED': return type === 'CONTRACT' ? 'PROJECT_CONTRACT' : 'HUMAN_REVIEWED_KEALEE_FINAL'
    case 'HUMAN_REVIEWED': return 'HUMAN_REVIEWED_KEALEE_FINAL'
    case 'AI_GENERATED': return 'AI_GENERATED_DRAFT'
    case 'REJECTED': return 'UNVERIFIED_INFERENCE'
    default:
      return type === 'PLAT' || type === 'REGULATION' || type === 'RULE' ? 'APPROVED_GOVERNMENT_RECORD'
        : type === 'SURVEY' ? 'VERIFIED_FIELD_MEASUREMENT'
        : type === 'CONTRACT' ? 'PROJECT_CONTRACT'
        : 'UPLOADED_SOURCE_DOCUMENT'
  }
}

/**
 * Default training eligibility. Never TRAINING_APPROVED here; TRAINING_CANDIDATE
 * only for Kealee's own outputs once a person has approved them, or for public
 * records. Everything a customer uploaded stays RETRIEVAL_ONLY until a policy
 * decision (ownership, contract, PII) is recorded against it.
 */
export function defaultTrainingEligibility(input: {
  approvalStatus: KnowledgeApprovalStatus
  confidentiality: KnowledgeConfidentiality
  generated: boolean
  explicit?: TrainingEligibility | null
}): TrainingEligibility {
  if (input.explicit) return input.explicit
  if (input.confidentiality === 'RESTRICTED') return 'EXCLUDED'
  if (input.confidentiality === 'PUBLIC') return 'EVAL_ELIGIBLE'
  if (input.generated && (input.approvalStatus === 'HUMAN_APPROVED' || input.approvalStatus === 'PROFESSIONAL_SEALED' || input.approvalStatus === 'JURISDICTION_APPROVED')) return 'TRAINING_CANDIDATE'
  if (input.generated && input.approvalStatus === 'REJECTED') return 'EVAL_ELIGIBLE'   // failures are for analysis, never positive examples
  return 'RETRIEVAL_ONLY'
}

export function defaultRetrievalEligibility(confidentiality: KnowledgeConfidentiality, explicit?: RetrievalEligibility | null): RetrievalEligibility {
  if (explicit) return explicit
  switch (confidentiality) {
    case 'PUBLIC': return 'ELIGIBLE'
    case 'INTERNAL': return 'ORG_ONLY'
    case 'CUSTOMER_CONFIDENTIAL': return 'PROJECT_ONLY'
    case 'RESTRICTED': return 'EXCLUDED'
  }
}

// ── Secret scanning ──────────────────────────────────────────────────────────

const SECRET_PATTERNS: [RegExp, string][] = [
  [/sk-ant-[A-Za-z0-9_-]{20,}/g, '[REDACTED_ANTHROPIC_KEY]'],
  [/sk-[A-Za-z0-9]{20,}/g, '[REDACTED_API_KEY]'],
  [/(?:r8_|ghp_|gho_|github_pat_)[A-Za-z0-9_]{20,}/g, '[REDACTED_TOKEN]'],
  [/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]'],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]'],
  [/postgres(?:ql)?:\/\/[^\s'"]+:[^\s'"@]+@[^\s'"]+/gi, '[REDACTED_DATABASE_URL]'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]'],
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]'],
  [/\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[^\s'"]{6,}/gi, '$&'.slice(0, 0) + '[REDACTED_CREDENTIAL]'],
]

export interface RedactionResult { text: string; redactions: number }

/** Replace anything that looks like a credential or SSN. Applied to text and to JSON metadata before storage. */
export function redactSecrets(text: string): RedactionResult {
  let out = text, n = 0
  for (const [re, rep] of SECRET_PATTERNS) out = out.replace(re, () => { n++; return rep })
  return { text: out, redactions: n }
}

export function redactJson<T>(value: T): { value: T; redactions: number } {
  if (value == null) return { value, redactions: 0 }
  const r = redactSecrets(JSON.stringify(value))
  return { value: r.redactions ? JSON.parse(r.text) as T : value, redactions: r.redactions }
}

// Personal-data classification, retention and corpus admission.
export * from './personal-data'
