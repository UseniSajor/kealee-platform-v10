/**
 * Professional issuance.
 *
 * There is no seal image in this system, and nothing here can apply one. A
 * seal is an act by a licensed person on a specific document:
 *
 *   PREPARED   the engine rendered the set for revision R; its SHA-256 is fixed
 *   APPROVED   a PE with a licence valid in the project state approved THAT hash
 *   EXECUTED   a signature produced OUTSIDE this application (a PKI digital
 *              signature, or the professional's own signing tool) is recorded
 *              by the hash of the signed file and a verification result
 *   INVALIDATED any later change to the model voids it
 *
 * The execution step takes a verifier, not a signer: the application proves a
 * signature is present and bound to the approved document; it never creates
 * one on the professional's behalf.
 */

import { createHash } from 'node:crypto'

export type IssuanceState = 'PREPARED' | 'APPROVED' | 'EXECUTED' | 'INVALIDATED'
export type ExecutionMethod = 'PKI_DIGITAL_SIGNATURE' | 'EXTERNAL_SIGNING_SERVICE'

export interface IssuanceRecord {
  id: string
  organizationId: string
  projectId: string
  revision: number
  revisionId: string
  state: IssuanceState
  documentHash: string
  documentRef: string | null
  preparedBy: string
  preparedAt: string
  approval: { by: string; licenceId: string; at: string; statement: string } | null
  execution: {
    by: string; licenceId: string; at: string; method: ExecutionMethod
    signedDocumentHash: string; signedDocumentRef: string | null
    verification: { valid: boolean; signerSubject: string | null; verifiedAt: string; detail: string }
  } | null
  invalidatedAt: string | null
  invalidatedByRevision: number | null
  invalidationReason: string | null
}

export function sha256(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export function prepareIssuance(input: { id: string; organizationId: string; projectId: string; revision: number; revisionId: string; document: Uint8Array; documentRef?: string | null; preparedBy: string; now: string }): IssuanceRecord {
  return {
    id: input.id, organizationId: input.organizationId, projectId: input.projectId, revision: input.revision, revisionId: input.revisionId,
    state: 'PREPARED', documentHash: sha256(input.document), documentRef: input.documentRef ?? null, preparedBy: input.preparedBy, preparedAt: input.now,
    approval: null, execution: null, invalidatedAt: null, invalidatedByRevision: null, invalidationReason: null,
  }
}

export type IssuanceResult = { ok: true; record: IssuanceRecord } | { ok: false; reason: string }

/** A PE approves the exact document. `authorisedLicenceId` comes from access.authorize, never from the client. */
export function approveIssuance(rec: IssuanceRecord, input: { by: string; authorisedLicenceId: string; documentHash: string; currentRevision: number; now: string }): IssuanceResult {
  if (rec.state !== 'PREPARED') return { ok: false, reason: `Issuance is ${rec.state}.` }
  if (rec.revision !== input.currentRevision) return { ok: false, reason: `This issuance is for revision ${rec.revision}; the model is at ${input.currentRevision}.` }
  if (input.documentHash !== rec.documentHash) return { ok: false, reason: 'The document hash does not match the prepared document — approve the document you reviewed.' }
  return { ok: true, record: { ...rec, state: 'APPROVED', approval: { by: input.by, licenceId: input.authorisedLicenceId, at: input.now, statement: `Approved for issuance: document ${rec.documentHash.slice(0, 12)}…, revision ${rec.revision}.` } } }
}

export interface SignatureVerifier {
  /** Verifies that `signed` carries a valid signature by the licensee over the approved content. */
  verify(input: { signed: Uint8Array; approvedDocumentHash: string; licenceId: string }): Promise<{ valid: boolean; signerSubject: string | null; detail: string }>
}

/**
 * Records an externally produced signature. No verifier, no execution: the
 * application refuses to mark a plan sealed on anyone's say-so.
 */
export async function executeIssuance(rec: IssuanceRecord, input: {
  by: string; authorisedLicenceId: string; method: ExecutionMethod; signed: Uint8Array; signedDocumentRef?: string | null
  verifier: SignatureVerifier | null; currentRevision: number; now: string
}): Promise<IssuanceResult> {
  if (rec.state !== 'APPROVED') return { ok: false, reason: `Issuance is ${rec.state}; it must be APPROVED first.` }
  if (rec.revision !== input.currentRevision) return { ok: false, reason: `This issuance is for revision ${rec.revision}; the model is at ${input.currentRevision}.` }
  if (rec.approval?.by !== input.by) return { ok: false, reason: 'The professional who approved the document must execute it.' }
  if (!input.verifier) return { ok: false, reason: 'No signature verifier is configured. Kealee does not apply seals; a signed document from the professional’s own signing tool must be verified before the plan is marked signed/sealed.' }
  const v = await input.verifier.verify({ signed: input.signed, approvedDocumentHash: rec.documentHash, licenceId: input.authorisedLicenceId })
  if (!v.valid) return { ok: false, reason: `Signature did not verify: ${v.detail}` }
  return {
    ok: true,
    record: {
      ...rec, state: 'EXECUTED',
      execution: {
        by: input.by, licenceId: input.authorisedLicenceId, at: input.now, method: input.method,
        signedDocumentHash: sha256(input.signed), signedDocumentRef: input.signedDocumentRef ?? null,
        verification: { valid: true, signerSubject: v.signerSubject, verifiedAt: input.now, detail: v.detail },
      },
    },
  }
}

export function invalidateIssuance(rec: IssuanceRecord, byRevision: number, reason: string, now: string): IssuanceRecord {
  if (rec.state === 'INVALIDATED') return rec
  return { ...rec, state: 'INVALIDATED', invalidatedAt: now, invalidatedByRevision: byRevision, invalidationReason: reason }
}
