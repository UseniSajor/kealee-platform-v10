/**
 * Insurance Verification Service
 * Insurance certificate verification integration
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface InsuranceCertificate {
  id: string;
  contractorId: string;
  insuranceType: 'GENERAL_LIABILITY' | 'WORKERS_COMP' | 'PROFESSIONAL_LIABILITY' | 'BOND';
  policyNumber: string;
  carrier: string;
  coverageAmount: number;
  effectiveDate: Date;
  expirationDate: Date;
  certificateUrl?: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface InsuranceValidationResult {
  contractorId: string;
  valid: boolean;
  missingTypes: string[];
  expiredTypes: string[];
  insufficientCoverage: Array<{
    type: string;
    required: number;
    provided: number;
  }>;
  certificates: InsuranceCertificate[];
  requiredActions: string[];
}

export class InsuranceVerificationService {
  /**
   * Validate contractor insurance
   */
  async validateContractorInsurance(
    contractorId: string,
    permitType: string,
    projectValuation?: number
  ): Promise<InsuranceValidationResult> {
    const supabase = createClient();

    // Get required insurance types for permit
    const requiredTypes = this.getRequiredInsuranceTypes(permitType, projectValuation);

    // Get contractor insurance certificates
    const {data: certificates} = await supabase
      .from('InsuranceCertificate')
      .select('*')
      .eq('contractorId', contractorId)
      .eq('active', true);

    if (!certificates || certificates.length === 0) {
      return {
        contractorId,
        valid: false,
        missingTypes: requiredTypes,
        expiredTypes: [],
        insufficientCoverage: [],
        certificates: [],
        requiredActions: [`Provide insurance certificates: ${requiredTypes.join(', ')}`],
      };
    }

    const now = new Date();
    const missingTypes: string[] = [];
    const expiredTypes: string[] = [];
    const insufficientCoverage: Array<{
      type: string;
      required: number;
      provided: number;
    }> = [];
    const validCertificates: InsuranceCertificate[] = [];

    // Check each required type
    for (const requiredType of requiredTypes) {
      const certificate = certificates.find(c => c.insuranceType === requiredType);

      if (!certificate) {
        missingTypes.push(requiredType);
        continue;
      }

      // Check expiration
      const expirationDate = new Date(certificate.expirationDate);
      if (expirationDate < now) {
        expiredTypes.push(requiredType);
        continue;
      }

      // Check coverage amount
      const requiredAmount = this.getRequiredCoverageAmount(requiredType, projectValuation);
      if (certificate.coverageAmount < requiredAmount) {
        insufficientCoverage.push({
          type: requiredType,
          required: requiredAmount,
          provided: certificate.coverageAmount,
        });
        continue;
      }

      // Certificate is valid
      validCertificates.push(this.mapCertificate(certificate));
    }

    const valid = missingTypes.length === 0 && expiredTypes.length === 0 && insufficientCoverage.length === 0;
    const requiredActions: string[] = [];

    if (missingTypes.length > 0) {
      requiredActions.push(`Provide insurance certificates: ${missingTypes.join(', ')}`);
    }

    if (expiredTypes.length > 0) {
      requiredActions.push(`Renew expired insurance: ${expiredTypes.join(', ')}`);
    }

    if (insufficientCoverage.length > 0) {
      insufficientCoverage.forEach(ic => {
        requiredActions.push(
          `Increase ${ic.type} coverage from $${ic.provided.toLocaleString()} to $${ic.required.toLocaleString()}`
        );
      });
    }

    return {
      contractorId,
      valid,
      missingTypes,
      expiredTypes,
      insufficientCoverage,
      certificates: validCertificates,
      requiredActions,
    };
  }

  /**
   * Get required insurance types for permit
   */
  private getRequiredInsuranceTypes(
    permitType: string,
    projectValuation?: number
  ): string[] {
    const baseTypes = ['GENERAL_LIABILITY'];

    // Add workers comp for larger projects
    if (projectValuation && projectValuation > 50000) {
      baseTypes.push('WORKERS_COMP');
    }

    // Add professional liability for design-build
    if (permitType === 'BUILDING' && projectValuation && projectValuation > 100000) {
      baseTypes.push('PROFESSIONAL_LIABILITY');
    }

    return baseTypes;
  }

  /**
   * Get required coverage amount
   */
  private getRequiredCoverageAmount(
    insuranceType: string,
    projectValuation?: number
  ): number {
    const baseAmounts: Record<string, number> = {
      GENERAL_LIABILITY: 1000000, // $1M
      WORKERS_COMP: 1000000, // $1M
      PROFESSIONAL_LIABILITY: 500000, // $500K
      BOND: projectValuation ? projectValuation * 0.1 : 50000, // 10% of project or $50K
    };

    return baseAmounts[insuranceType] || 1000000;
  }

  /**
   * Verify insurance certificate
   */
  async verifyInsuranceCertificate(
    certificateId: string
  ): Promise<{verified: boolean; message: string}> {
    const supabase = createClient();

    const {data: certificate} = await supabase
      .from('InsuranceCertificate')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (!certificate) {
      return {verified: false, message: 'Certificate not found'};
    }

    // In production, would verify with insurance carrier API
    // For now, check expiration and basic validation
    const now = new Date();
    const expirationDate = new Date(certificate.expirationDate);

    if (expirationDate < now) {
      return {verified: false, message: 'Certificate expired'};
    }

    // Update verification status
    await supabase
      .from('InsuranceCertificate')
      .update({
        verified: true,
        verifiedAt: new Date().toISOString(),
      })
      .eq('id', certificateId);

    return {verified: true, message: 'Certificate verified'};
  }

  /**
   * Map database certificate to InsuranceCertificate
   */
  private mapCertificate(certificate: any): InsuranceCertificate {
    return {
      id: certificate.id,
      contractorId: certificate.contractorId,
      insuranceType: certificate.insuranceType,
      policyNumber: certificate.policyNumber,
      carrier: certificate.carrier,
      coverageAmount: certificate.coverageAmount,
      effectiveDate: new Date(certificate.effectiveDate),
      expirationDate: new Date(certificate.expirationDate),
      certificateUrl: certificate.certificateUrl || undefined,
      verified: certificate.verified || false,
      verifiedAt: certificate.verifiedAt ? new Date(certificate.verifiedAt) : undefined,
      verifiedBy: certificate.verifiedBy || undefined,
    };
  }
}

// Singleton instance
export const insuranceVerificationService = new InsuranceVerificationService();
