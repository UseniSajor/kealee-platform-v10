import type { JurisdictionCheckResult } from './jurisdiction-rules';

export interface ProfessionalReleaseInput {
  jurisdictionCode: string;
  professionalId: string;
  licenseNumber: string;
  licensedJurisdictions: string[];
  licenseVerifiedAt?: string;
  licenseExpiresAt?: string;
  reviewDecision: 'PENDING' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  sourceContentHash: string;
  sealedContentHash?: string;
  sealControlledByProfessional: boolean;
  complianceResults: JurisdictionCheckResult[];
  now?: Date;
}
export interface ProfessionalReleaseDecision {
  allowed: boolean;
  blockers: string[];
  chainOfCustody: { sourceContentHash: string; sealedContentHash?: string; professionalId: string; licenseNumber: string };
}

export function evaluateProfessionalRelease(input: ProfessionalReleaseInput): ProfessionalReleaseDecision {
  const blockers: string[] = [];
  const now = input.now ?? new Date();
  if (!input.licenseNumber.trim() || !input.licenseVerifiedAt) blockers.push('Professional license is not verified');
  if (!input.licensedJurisdictions.includes(input.jurisdictionCode)) blockers.push('License is not verified for the project jurisdiction');
  if (input.licenseExpiresAt && new Date(input.licenseExpiresAt) <= now) blockers.push('Professional license is expired');
  if (input.reviewDecision !== 'APPROVED') blockers.push('Professional review is not approved');
  if (!input.sealControlledByProfessional) blockers.push('Professional does not control the signature/seal operation');
  if (!/^[a-f0-9]{64}$/i.test(input.sourceContentHash)) blockers.push('Source document hash is invalid');
  if (!input.sealedContentHash || !/^[a-f0-9]{64}$/i.test(input.sealedContentHash)) blockers.push('Sealed document hash is invalid');
  if (input.sealedContentHash === input.sourceContentHash) blockers.push('Sealed version must be recorded as a distinct immutable artifact');
  for (const check of input.complianceResults) {
    if (check.blocksSubmission || ['FAIL', 'MISSING_DATA', 'PROFESSIONAL_DETERMINATION_REQUIRED'].includes(check.outcome)) {
      blockers.push(`Compliance blocker remains: ${check.ruleKey}`);
    }
  }
  return { allowed: blockers.length === 0, blockers, chainOfCustody: {
    sourceContentHash: input.sourceContentHash, sealedContentHash: input.sealedContentHash,
    professionalId: input.professionalId, licenseNumber: input.licenseNumber,
  } };
}
