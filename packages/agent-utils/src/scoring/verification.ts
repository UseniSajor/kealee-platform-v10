/**
 * @kealee/agent-utils/scoring/verification
 *
 * Contractor license and insurance verification.
 * Checks expiry, active status, and flags upcoming renewals.
 *
 * Source: extracted from bots/keabot-contractor-match/src/verification.ts
 * NOTE: In production this should call an external license verification API.
 * Currently validates against fields on the Contractor record only.
 */

import type { Contractor, VerificationResult } from './contractor-types';

const EXPIRY_WARNING_DAYS = 30;

export async function verifyLicenseInsurance(contractor: Contractor): Promise<VerificationResult> {
  const issues: string[] = [];
  const now = new Date();

  const licenseStatus: VerificationResult['licenseStatus'] = contractor.licenseStatus;
  let insuranceStatus: VerificationResult['insuranceStatus'] =
    contractor.insuranceActive ? 'active' : 'expired';

  if (contractor.licenseStatus !== 'valid') {
    issues.push(`License is ${contractor.licenseStatus}`);
  }

  if (!contractor.insuranceActive) {
    issues.push('Insurance is not active');
  } else if (contractor.insuranceExpiry && contractor.insuranceExpiry < now) {
    insuranceStatus = 'expired';
    issues.push(`Insurance expired on ${contractor.insuranceExpiry.toLocaleDateString()}`);
  } else if (contractor.insuranceExpiry) {
    const daysUntilExpiry = Math.floor(
      (contractor.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < EXPIRY_WARNING_DAYS) {
      issues.push(`Insurance expires in ${daysUntilExpiry} days`);
    }
  }

  return {
    contractorId: contractor.id,
    licenseStatus,
    insuranceStatus,
    insuranceExpiry: contractor.insuranceExpiry,
    verified: issues.length === 0,
    issues,
  };
}
