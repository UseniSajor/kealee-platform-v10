/**
 * Compliance Service
 * Regulatory compliance monitoring and enforcement
 */

import { Prisma } from '@kealee/database';

import { prismaAny as prisma } from '../../utils/prisma-helper';

export interface ComplianceRule {
  id: string;
  ruleType: 'STATE_ESCROW' | 'AML' | 'KYC' | 'LICENSING' | 'INSURANCE' | 'BOND';
  jurisdiction: string;
  ruleDescription: string;
  requirements: Record<string, any>;
  effectiveDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ComplianceCheckResult {
  id: string;
  userId?: string;
  contractId?: string;
  escrowId?: string;
  ruleId: string;
  checkType: string;
  checkStatus: 'PASS' | 'FAIL' | 'PENDING';
  checkDate: Date;
  expiresAt?: Date;
  failureReason?: string;
  remediation?: Record<string, any>;
  performedBy: string;
}

export interface LicenseValidation {
  userId: string;
  licenseType: string;
  licenseNumber: string;
  issuingAuthority: string;
  state: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  issueDate: Date;
  expirationDate: Date;
  verifiedAt?: Date;
  verificationSource?: string;
}

export interface InsuranceValidation {
  userId: string;
  insuranceType: 'GENERAL_LIABILITY' | 'WORKERS_COMP' | 'PROFESSIONAL';
  carrier: string;
  policyNumber: string;
  coverageAmount: number;
  effectiveDate: Date;
  expirationDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  verifiedAt?: Date;
}

export interface ComplianceAlert {
  id: string;
  alertType: 'LICENSE_EXPIRING' | 'INSURANCE_LAPSING' | 'BOND_INSUFFICIENT' | 'REGULATORY_CHANGE' | 'DOCUMENT_REQUIRED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  contractId?: string;
  message: string;
  dueDate?: Date;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
  resolvedAt?: Date;
}

export class ComplianceService {
  /**
   * Get state-specific escrow compliance rules
   */
  async getStateEscrowRules(state: string): Promise<ComplianceRule[]> {
    // In production, this would query a compliance rules database
    // For now, returning mock data based on state

    const stateRules: Record<string, Partial<ComplianceRule>[]> = {
      CA: [
        {
          ruleType: 'STATE_ESCROW',
          ruleDescription: 'California requires CSLB license for contractors',
          requirements: {
            licenseType: 'CSLB',
            minimumBond: 25000,
            insuranceRequired: true,
            minimumInsurance: 1000000,
          },
          severity: 'CRITICAL',
        },
        {
          ruleType: 'LICENSING',
          ruleDescription: 'License must be active and verified',
          requirements: {
            verificationFrequency: 'MONTHLY',
            allowGracePeriod: false,
          },
          severity: 'HIGH',
        },
      ],
      TX: [
        {
          ruleType: 'STATE_ESCROW',
          ruleDescription: 'Texas retainage limited to 10%',
          requirements: {
            maxRetainage: 0.1,
            releaseTimeline: 30, // days
          },
          severity: 'HIGH',
        },
      ],
      NY: [
        {
          ruleType: 'STATE_ESCROW',
          ruleDescription: 'New York requires surety bond for projects > $100k',
          requirements: {
            bondRequiredAbove: 100000,
            bondPercentage: 0.1,
          },
          severity: 'HIGH',
        },
      ],
    };

    const rules = stateRules[state] || [];

    return rules.map((rule, index) => ({
      id: `rule-${state}-${index}`,
      ruleType: rule.ruleType || 'STATE_ESCROW',
      jurisdiction: state,
      ruleDescription: rule.ruleDescription || '',
      requirements: rule.requirements || {},
      effectiveDate: new Date(),
      isActive: true,
      severity: rule.severity || 'MEDIUM',
    }));
  }

  /**
   * Run comprehensive compliance check for a user
   */
  async runComplianceCheck(userId: string): Promise<ComplianceCheckResult[]> {
    const results: ComplianceCheckResult[] = [];

    // Check 1: License validation
    const licenseCheck = await this.checkLicense(userId);
    results.push(licenseCheck);

    // Check 2: Insurance validation
    const insuranceCheck = await this.checkInsurance(userId);
    results.push(insuranceCheck);

    // Check 3: Bond validation
    const bondCheck = await this.checkBond(userId);
    results.push(bondCheck);

    // Check 4: OFAC sanctions screening
    const sanctionsCheck = await this.checkSanctions(userId);
    results.push(sanctionsCheck);

    return results;
  }

  /**
   * Validate contractor license
   */
  async validateLicense(
    userId: string,
    licenseNumber: string,
    state: string
  ): Promise<LicenseValidation> {
    // In production, would integrate with state licensing boards API
    // For now, mock validation

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Simulate API call to state licensing board
    const isValid = await this.queryStateLicensingBoard(licenseNumber, state);

    return {
      userId,
      licenseType: `${state}_CONTRACTOR`,
      licenseNumber,
      issuingAuthority: `${state} Contractors State License Board`,
      state,
      status: isValid ? 'ACTIVE' : 'EXPIRED',
      issueDate: new Date('2020-01-01'),
      expirationDate: new Date('2026-12-31'),
      verifiedAt: new Date(),
      verificationSource: 'STATE_API',
    };
  }

  /**
   * Validate insurance certificate
   */
  async validateInsurance(
    userId: string,
    policyNumber: string
  ): Promise<InsuranceValidation> {
    // In production, would integrate with insurance verification services

    return {
      userId,
      insuranceType: 'GENERAL_LIABILITY',
      carrier: 'State Farm',
      policyNumber,
      coverageAmount: 2000000,
      effectiveDate: new Date(),
      expirationDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      verifiedAt: new Date(),
    };
  }

  /**
   * Check bond requirements for contract
   */
  async checkBondRequirements(contractId: string): Promise<{
    required: boolean;
    minimumAmount: number;
    currentAmount: number;
    isSufficient: boolean;
  }> {
    const contract = await prisma.contractAgreement.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Determine if bond is required based on contract amount and state
    const state = 'CA'; // Would get from contract/project
    const stateRules = await this.getStateEscrowRules(state);

    const bondRule = stateRules.find(r => r.requirements.bondRequiredAbove);
    const bondRequiredAbove = bondRule?.requirements.bondRequiredAbove || 500000;
    const bondPercentage = bondRule?.requirements.bondPercentage || 0.1;

    const contractAmount = contract.amount.toNumber();
    const required = contractAmount >= bondRequiredAbove;
    const minimumAmount = required ? contractAmount * bondPercentage : 0;

    // Check if contractor has sufficient bond
    const currentAmount = await this.getContractorBondAmount(contract.contractorId);

    return {
      required,
      minimumAmount,
      currentAmount,
      isSufficient: currentAmount >= minimumAmount,
    };
  }

  /**
   * Get active compliance alerts
   */
  async getActiveAlerts(userId?: string): Promise<ComplianceAlert[]> {
    // In production, would query alerts from database
    const alerts: ComplianceAlert[] = [];

    if (userId) {
      // Check for expiring licenses
      const licenses = await this.getUserLicenses(userId);
      for (const license of licenses) {
        const daysUntilExpiry = this.daysBetween(new Date(), license.expirationDate);
        if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
          alerts.push({
            id: `alert-license-${license.licenseNumber}`,
            alertType: 'LICENSE_EXPIRING',
            severity: daysUntilExpiry <= 30 ? 'CRITICAL' : 'HIGH',
            userId,
            message: `License ${license.licenseNumber} expires in ${daysUntilExpiry} days`,
            dueDate: license.expirationDate,
            status: 'OPEN',
            createdAt: new Date(),
          });
        } else if (daysUntilExpiry <= 0) {
          alerts.push({
            id: `alert-license-expired-${license.licenseNumber}`,
            alertType: 'LICENSE_EXPIRING',
            severity: 'CRITICAL',
            userId,
            message: `License ${license.licenseNumber} has EXPIRED`,
            dueDate: license.expirationDate,
            status: 'OPEN',
            createdAt: new Date(),
          });
        }
      }

      // Check for expiring insurance
      const insurance = await this.getUserInsurance(userId);
      for (const policy of insurance) {
        const daysUntilExpiry = this.daysBetween(new Date(), policy.expirationDate);
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          alerts.push({
            id: `alert-insurance-${policy.policyNumber}`,
            alertType: 'INSURANCE_LAPSING',
            severity: daysUntilExpiry <= 15 ? 'CRITICAL' : 'HIGH',
            userId,
            message: `Insurance policy ${policy.policyNumber} expires in ${daysUntilExpiry} days`,
            dueDate: policy.expirationDate,
            status: 'OPEN',
            createdAt: new Date(),
          });
        }
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Generate compliance report for auditors
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalChecks: number;
      passedChecks: number;
      failedChecks: number;
      pendingChecks: number;
      complianceRate: number;
    };
    alerts: {
      total: number;
      bySeverity: Record<string, number>;
      byType: Record<string, number>;
    };
    recommendations: string[];
  }> {
    // Mock compliance report
    // In production, would aggregate real data

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalChecks: 1250,
        passedChecks: 1180,
        failedChecks: 45,
        pendingChecks: 25,
        complianceRate: 94.4,
      },
      alerts: {
        total: 67,
        bySeverity: {
          CRITICAL: 5,
          HIGH: 18,
          MEDIUM: 32,
          LOW: 12,
        },
        byType: {
          LICENSE_EXPIRING: 23,
          INSURANCE_LAPSING: 15,
          BOND_INSUFFICIENT: 8,
          DOCUMENT_REQUIRED: 21,
        },
      },
      recommendations: [
        'Implement automated license renewal reminders 90 days before expiration',
        'Require insurance certificate uploads at contract signing',
        'Review bond requirements for contracts above $500k',
        'Conduct quarterly compliance audits for all active contractors',
      ],
    };
  }

  // Helper methods

  private async checkLicense(userId: string): Promise<ComplianceCheckResult> {
    // Check if user has valid license
    const licenses = await this.getUserLicenses(userId);
    const hasValidLicense = licenses.some(l => l.status === 'ACTIVE');

    return {
      id: `check-license-${userId}`,
      userId,
      ruleId: 'rule-license-001',
      checkType: 'LICENSE_VALIDATION',
      checkStatus: hasValidLicense ? 'PASS' : 'FAIL',
      checkDate: new Date(),
      failureReason: hasValidLicense ? undefined : 'No valid active license found',
      performedBy: 'SYSTEM',
    };
  }

  private async checkInsurance(userId: string): Promise<ComplianceCheckResult> {
    const insurance = await this.getUserInsurance(userId);
    const hasValidInsurance = insurance.some(
      i => i.status === 'ACTIVE' && i.coverageAmount >= 1000000
    );

    return {
      id: `check-insurance-${userId}`,
      userId,
      ruleId: 'rule-insurance-001',
      checkType: 'INSURANCE_VALIDATION',
      checkStatus: hasValidInsurance ? 'PASS' : 'FAIL',
      checkDate: new Date(),
      failureReason: hasValidInsurance
        ? undefined
        : 'No valid insurance with minimum $1M coverage',
      performedBy: 'SYSTEM',
    };
  }

  private async checkBond(userId: string): Promise<ComplianceCheckResult> {
    // Mock bond check
    return {
      id: `check-bond-${userId}`,
      userId,
      ruleId: 'rule-bond-001',
      checkType: 'BOND_VALIDATION',
      checkStatus: 'PASS',
      checkDate: new Date(),
      performedBy: 'SYSTEM',
    };
  }

  private async checkSanctions(userId: string): Promise<ComplianceCheckResult> {
    // Mock OFAC sanctions screening
    // In production, would integrate with OFAC API

    return {
      id: `check-sanctions-${userId}`,
      userId,
      ruleId: 'rule-sanctions-001',
      checkType: 'SANCTIONS_SCREENING',
      checkStatus: 'PASS',
      checkDate: new Date(),
      performedBy: 'SYSTEM',
    };
  }

  private async queryStateLicensingBoard(
    licenseNumber: string,
    state: string
  ): Promise<boolean> {
    // Mock API call to state licensing board
    // In production, would integrate with actual state APIs
    return true;
  }

  private async getContractorBondAmount(contractorId: string): Promise<number> {
    // Mock bond amount
    return 50000;
  }

  private async getUserLicenses(userId: string): Promise<LicenseValidation[]> {
    // Mock license data
    return [
      {
        userId,
        licenseType: 'CA_CONTRACTOR',
        licenseNumber: 'CA-12345',
        issuingAuthority: 'California Contractors State License Board',
        state: 'CA',
        status: 'ACTIVE',
        issueDate: new Date('2020-01-01'),
        expirationDate: new Date('2026-12-31'),
        verifiedAt: new Date(),
      },
    ];
  }

  private async getUserInsurance(userId: string): Promise<InsuranceValidation[]> {
    // Mock insurance data
    return [
      {
        userId,
        insuranceType: 'GENERAL_LIABILITY',
        carrier: 'State Farm',
        policyNumber: 'POL-123456',
        coverageAmount: 2000000,
        effectiveDate: new Date(),
        expirationDate: new Date('2026-06-30'),
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    ];
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = date2.getTime() - date1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const complianceService = new ComplianceService();

