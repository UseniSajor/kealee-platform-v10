/**
 * Jurisdiction Onboarding Service
 * Handles jurisdiction onboarding wizard
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface OnboardingData {
  // Step 1: Basic Info
  name: string;
  code: string; // Unique identifier like "PGC-MD"
  state: string;
  county?: string;
  city?: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl?: string;

  // Step 2: Service Area
  serviceArea: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  }; // GeoJSON format

  // Step 3: Subscription
  subscriptionTier: 'BASIC' | 'PRO' | 'ENTERPRISE';
  billingEmail?: string;

  // Step 4: Admin User
  adminUserId: string;
  adminEmail: string;
}

export interface OnboardingResult {
  jurisdictionId: string;
  licenseKey: string;
  status: 'PENDING_SETUP' | 'ACTIVE';
  nextSteps: string[];
}

export class JurisdictionOnboardingService {
  /**
   * Complete jurisdiction onboarding
   */
  async onboardJurisdiction(data: OnboardingData): Promise<OnboardingResult> {
    const supabase = createClient();

    // Generate unique code if not provided
    let code = data.code;
    if (!code) {
      code = await this.generateJurisdictionCode(data.name, data.state);
    }

    // Verify code uniqueness
    const {data: existing} = await supabase
      .from('Jurisdiction')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      throw new Error(`Jurisdiction code "${code}" already exists`);
    }

    // Generate license key
    const licenseKey = this.generateLicenseKey();

    // Calculate monthly fee based on tier
    const monthlyFee = this.getMonthlyFee(data.subscriptionTier);

    // Create jurisdiction
    const {data: jurisdiction, error} = await supabase
      .from('Jurisdiction')
      .insert({
        name: data.name,
        code,
        state: data.state,
        county: data.county,
        city: data.city,
        serviceArea: data.serviceArea,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        websiteUrl: data.websiteUrl,
        status: 'PENDING_SETUP',
        subscriptionTier: data.subscriptionTier,
        monthlyFee: monthlyFee.toString(),
        licenseKey,
        settings: {},
        feeSchedule: this.getDefaultFeeSchedule(),
      })
      .select('id')
      .single();

    if (error || !jurisdiction) {
      throw new Error(`Failed to create jurisdiction: ${error?.message}`);
    }

    // Create admin staff member
    await supabase.from('JurisdictionStaff').insert({
      jurisdictionId: jurisdiction.id,
      userId: data.adminUserId,
      role: 'ADMINISTRATOR',
      active: true,
    });

    // Determine next steps
    const nextSteps = [
      'Configure fee schedules',
      'Set up permit types',
      'Add review disciplines',
      'Add staff members',
      'Set up inspector zones',
      'Configure business rules',
      'Set up holiday calendar',
    ];

    return {
      jurisdictionId: jurisdiction.id,
      licenseKey,
      status: 'PENDING_SETUP',
      nextSteps,
    };
  }

  /**
   * Generate unique jurisdiction code
   */
  private async generateJurisdictionCode(name: string, state: string): Promise<string> {
    // Extract initials from name
    const words = name.split(/\s+/).filter(w => w.length > 0);
    const initials = words.map(w => w[0].toUpperCase()).join('');
    
    // State abbreviation (first 2 letters)
    const stateCode = state.substring(0, 2).toUpperCase();

    // Combine
    let code = `${initials}-${stateCode}`;
    let counter = 1;

    // Ensure uniqueness
    const supabase = createClient();
    while (true) {
      const {data: existing} = await supabase
        .from('Jurisdiction')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) {
        break;
      }

      code = `${initials}-${stateCode}-${counter}`;
      counter++;
    }

    return code;
  }

  /**
   * Generate license key
   */
  private generateLicenseKey(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `LIC-${timestamp}-${random}`;
  }

  /**
   * Get monthly fee by tier
   */
  private getMonthlyFee(tier: string): number {
    const fees: Record<string, number> = {
      BASIC: 500,
      PRO: 1000,
      ENTERPRISE: 2000,
    };
    return fees[tier] || 500;
  }

  /**
   * Get default fee schedule
   */
  private getDefaultFeeSchedule(): any {
    return {
      baseFees: {
        BUILDING: 150,
        ELECTRICAL: 100,
        PLUMBING: 100,
        MECHANICAL: 100,
      },
      valuationRates: {
        BUILDING: 0.01,
        ELECTRICAL: 0.005,
        PLUMBING: 0.005,
        MECHANICAL: 0.005,
      },
      minimumFees: {
        BUILDING: 100,
        ELECTRICAL: 50,
        PLUMBING: 50,
        MECHANICAL: 50,
      },
    };
  }

  /**
   * Validate license key
   */
  async validateLicenseKey(licenseKey: string): Promise<{
    valid: boolean;
    jurisdictionId?: string;
    tier?: string;
    expired?: boolean;
  }> {
    const supabase = createClient();

    const {data: jurisdiction} = await supabase
      .from('Jurisdiction')
      .select('id, subscriptionTier, status')
      .eq('licenseKey', licenseKey)
      .single();

    if (!jurisdiction) {
      return {valid: false};
    }

    if (jurisdiction.status === 'INACTIVE') {
      return {valid: false, expired: true};
    }

    return {
      valid: true,
      jurisdictionId: jurisdiction.id,
      tier: jurisdiction.subscriptionTier || undefined,
    };
  }
}

// Singleton instance
export const jurisdictionOnboardingService = new JurisdictionOnboardingService();
