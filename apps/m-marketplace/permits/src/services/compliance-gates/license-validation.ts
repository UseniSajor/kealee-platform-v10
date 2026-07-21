/**
 * License Validation Service
 * Contractor license validation during permit application
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface ContractorLicense {
  contractorId: string;
  licenseNumber: string;
  licenseType: string; // "GENERAL_CONTRACTOR", "ELECTRICAL", "PLUMBING", etc.
  state: string;
  issuedDate: Date;
  expirationDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface LicenseValidationResult {
  contractorId: string;
  licenseNumber: string;
  valid: boolean;
  status: 'VALID' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'NOT_FOUND' | 'VERIFICATION_FAILED';
  message: string;
  license?: ContractorLicense;
  requiredActions?: string[];
}

export class LicenseValidationService {
  /**
   * Validate contractor license
   */
  async validateContractorLicense(
    contractorId: string,
    permitType: string
  ): Promise<LicenseValidationResult> {
    const supabase = createClient();

    // Get contractor licenses
    const {data: licenses} = await supabase
      .from('ContractorLicense')
      .select('*')
      .eq('contractorId', contractorId)
      .eq('active', true);

    if (!licenses || licenses.length === 0) {
      return {
        contractorId,
        licenseNumber: '',
        valid: false,
        status: 'NOT_FOUND',
        message: 'No contractor license found',
        requiredActions: ['Provide valid contractor license'],
      };
    }

    // Determine required license type for permit
    const requiredLicenseType = this.getRequiredLicenseType(permitType);

    // Find matching license
    const matchingLicense = licenses.find(
      l => l.licenseType === requiredLicenseType || l.licenseType === 'GENERAL_CONTRACTOR'
    );

    if (!matchingLicense) {
      return {
        contractorId,
        licenseNumber: '',
        valid: false,
        status: 'NOT_FOUND',
        message: `Required license type ${requiredLicenseType} not found`,
        requiredActions: [`Provide valid ${requiredLicenseType} license`],
      };
    }

    // Check license status
    const now = new Date();
    const expirationDate = new Date(matchingLicense.expirationDate);

    if (expirationDate < now) {
      return {
        contractorId,
        licenseNumber: matchingLicense.licenseNumber,
        valid: false,
        status: 'EXPIRED',
        message: `License ${matchingLicense.licenseNumber} expired on ${expirationDate.toLocaleDateString()}`,
        license: this.mapLicense(matchingLicense),
        requiredActions: ['Renew expired license'],
      };
    }

    if (matchingLicense.status === 'SUSPENDED') {
      return {
        contractorId,
        licenseNumber: matchingLicense.licenseNumber,
        valid: false,
        status: 'SUSPENDED',
        message: `License ${matchingLicense.licenseNumber} is suspended`,
        license: this.mapLicense(matchingLicense),
        requiredActions: ['Resolve license suspension'],
      };
    }

    if (matchingLicense.status === 'REVOKED') {
      return {
        contractorId,
        licenseNumber: matchingLicense.licenseNumber,
        valid: false,
        status: 'REVOKED',
        message: `License ${matchingLicense.licenseNumber} is revoked`,
        license: this.mapLicense(matchingLicense),
        requiredActions: ['Obtain new valid license'],
      };
    }

    // Verify license with state licensing board (mock - would call API)
    const verified = await this.verifyLicenseWithState(
      matchingLicense.licenseNumber,
      matchingLicense.state
    );

    if (!verified) {
      return {
        contractorId,
        licenseNumber: matchingLicense.licenseNumber,
        valid: false,
        status: 'VERIFICATION_FAILED',
        message: `Could not verify license ${matchingLicense.licenseNumber} with state licensing board`,
        license: this.mapLicense(matchingLicense),
        requiredActions: ['Verify license with state licensing board'],
      };
    }

    // Update license verification status
    await supabase
      .from('ContractorLicense')
      .update({
        verified: true,
        verifiedAt: new Date().toISOString(),
      })
      .eq('id', matchingLicense.id);

    return {
      contractorId,
      licenseNumber: matchingLicense.licenseNumber,
      valid: true,
      status: 'VALID',
      message: `License ${matchingLicense.licenseNumber} is valid and verified`,
      license: {
        ...this.mapLicense(matchingLicense),
        verified: true,
        verifiedAt: new Date(),
      },
    };
  }

  /**
   * Get required license type for permit type
   */
  private getRequiredLicenseType(permitType: string): string {
    const mapping: Record<string, string> = {
      BUILDING: 'GENERAL_CONTRACTOR',
      ELECTRICAL: 'ELECTRICAL',
      PLUMBING: 'PLUMBING',
      MECHANICAL: 'MECHANICAL',
      DEMOLITION: 'GENERAL_CONTRACTOR',
      SIGN: 'GENERAL_CONTRACTOR',
      GRADING: 'GENERAL_CONTRACTOR',
      FENCE: 'GENERAL_CONTRACTOR',
    };

    return mapping[permitType] || 'GENERAL_CONTRACTOR';
  }

  /**
   * Verify license with state licensing board (mock)
   */
  private async verifyLicenseWithState(
    licenseNumber: string,
    state: string
  ): Promise<boolean> {
    // In production, would call state licensing board API
    // Examples: CSLB (California), DBPR (Florida), etc.
    // For now, return true if license number format is valid
    return licenseNumber.length >= 6;
  }

  /**
   * Map database license to ContractorLicense
   */
  private mapLicense(license: any): ContractorLicense {
    return {
      contractorId: license.contractorId,
      licenseNumber: license.licenseNumber,
      licenseType: license.licenseType,
      state: license.state,
      issuedDate: new Date(license.issuedDate),
      expirationDate: new Date(license.expirationDate),
      status: license.status,
      verified: license.verified || false,
      verifiedAt: license.verifiedAt ? new Date(license.verifiedAt) : undefined,
      verifiedBy: license.verifiedBy || undefined,
    };
  }

  /**
   * Check if license is required for permit type
   */
  requiresLicense(permitType: string): boolean {
    // Most permit types require a license
    // Owner-occupant permits may not require license
    return true; // Default to requiring license
  }
}

// Singleton instance
export const licenseValidationService = new LicenseValidationService();
