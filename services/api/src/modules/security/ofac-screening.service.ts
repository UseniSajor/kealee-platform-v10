/**
 * OFAC Sanctions Screening Service
 * Screens individuals and businesses against OFAC SDN list
 * 
 * CRITICAL: This is a placeholder implementation
 * MUST integrate with real OFAC screening service before production
 */

export interface ScreeningResult {
  isMatch: boolean;
  matchScore: number;
  matchType: 'EXACT' | 'FUZZY' | 'NONE';
  sdnEntries: SDNEntry[];
  screenedAt: Date;
  riskLevel: 'CLEAR' | 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
}

export interface SDNEntry {
  uid: string;
  name: string;
  type: 'Individual' | 'Entity';
  programs: string[];
  addresses: string[];
  identifications: any[];
}

export interface IndividualScreeningData {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  citizenship?: string;
  identification?: {
    type: 'PASSPORT' | 'DRIVERS_LICENSE' | 'SSN';
    number: string;
    country?: string;
  };
}

export interface BusinessScreeningData {
  businessName: string;
  dbaName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  ein?: string;
  registrationNumber?: string;
  owners?: IndividualScreeningData[];
}

export class OFACScreeningService {
  /**
   * Screen individual against OFAC SDN list
   * 
   * REQUIRED INTEGRATIONS (choose one):
   * 1. ComplyAdvantage API: https://docs.complyadvantage.com/
   * 2. Dow Jones Risk & Compliance: https://developer.dowjones.com/
   * 3. Refinitiv World-Check: https://www.refinitiv.com/en/products/world-check-kyc-screening
   * 4. Direct OFAC XML parsing: https://sanctionslist.ofac.treas.gov/
   */
  async screenIndividual(data: IndividualScreeningData): Promise<ScreeningResult> {
    // ⚠️ PLACEHOLDER IMPLEMENTATION
    // TODO: Replace with real OFAC screening service

    console.warn('⚠️ USING PLACEHOLDER OFAC SCREENING - MUST IMPLEMENT REAL SERVICE');

    // Simulate API call delay
    await this.simulateDelay(100);

    // Mock known sanctioned names for testing
    const mockSanctionedNames = [
      'NARCO TERRORIST',
      'SANCTIONED ENTITY',
      'BLOCKED PARTY',
    ];

    const fullName = `${data.firstName} ${data.lastName}`.toUpperCase();
    const isMatch = mockSanctionedNames.some(name => fullName.includes(name));

    return {
      isMatch,
      matchScore: isMatch ? 0.95 : 0.0,
      matchType: isMatch ? 'EXACT' : 'NONE',
      sdnEntries: isMatch ? [
        {
          uid: 'SDN-12345',
          name: fullName,
          type: 'Individual',
          programs: ['NARCOTICS'],
          addresses: [],
          identifications: [],
        },
      ] : [],
      screenedAt: new Date(),
      riskLevel: isMatch ? 'BLOCKED' : 'CLEAR',
    };
  }

  /**
   * Screen business entity
   */
  async screenBusiness(data: BusinessScreeningData): Promise<ScreeningResult> {
    console.warn('⚠️ USING PLACEHOLDER OFAC SCREENING - MUST IMPLEMENT REAL SERVICE');

    await this.simulateDelay(100);

    const mockSanctionedBusinesses = [
      'SANCTIONED CORP',
      'BLOCKED ENTITY LLC',
      'TERRORIST ORGANIZATION',
    ];

    const businessName = data.businessName.toUpperCase();
    const isMatch = mockSanctionedBusinesses.some(name => businessName.includes(name));

    return {
      isMatch,
      matchScore: isMatch ? 0.98 : 0.0,
      matchType: isMatch ? 'EXACT' : 'NONE',
      sdnEntries: isMatch ? [
        {
          uid: 'SDN-67890',
          name: businessName,
          type: 'Entity',
          programs: ['TERRORISM'],
          addresses: [],
          identifications: [],
        },
      ] : [],
      screenedAt: new Date(),
      riskLevel: isMatch ? 'BLOCKED' : 'CLEAR',
    };
  }

  /**
   * Screen transaction
   * Required for transactions > $10,000
   */
  async screenTransaction(data: {
    amount: number;
    sender: IndividualScreeningData | BusinessScreeningData;
    recipient: IndividualScreeningData | BusinessScreeningData;
  }): Promise<{
    senderScreening: ScreeningResult;
    recipientScreening: ScreeningResult;
    requiresManualReview: boolean;
  }> {
    const senderScreening = this.isIndividual(data.sender)
      ? await this.screenIndividual(data.sender)
      : await this.screenBusiness(data.sender);

    const recipientScreening = this.isIndividual(data.recipient)
      ? await this.screenIndividual(data.recipient)
      : await this.screenBusiness(data.recipient);

    const requiresManualReview =
      senderScreening.riskLevel !== 'CLEAR' ||
      recipientScreening.riskLevel !== 'CLEAR' ||
      data.amount > 100000; // Review all transactions > $100k

    return {
      senderScreening,
      recipientScreening,
      requiresManualReview,
    };
  }

  /**
   * Get screening history for user
   */
  async getScreeningHistory(userId: string): Promise<ScreeningResult[]> {
    // TODO: Query from database
    return [];
  }

  /**
   * Re-screen all users (daily batch job)
   * OFAC list updates daily
   */
  async batchRescreenUsers(): Promise<{
    totalScreened: number;
    newMatches: number;
    cleared: number;
  }> {
    console.log('⚠️ Running batch OFAC rescreening (placeholder)');

    // TODO: Implement batch screening
    // 1. Get all active users
    // 2. Screen each against updated SDN list
    // 3. Flag new matches for review
    // 4. Clear false positives

    return {
      totalScreened: 0,
      newMatches: 0,
      cleared: 0,
    };
  }

  /**
   * Handle blocked party
   */
  async handleBlockedParty(data: {
    userId: string;
    screeningResult: ScreeningResult;
  }): Promise<void> {
    console.error('🚨 BLOCKED PARTY DETECTED:', {
      userId: data.userId,
      matches: data.screeningResult.sdnEntries,
    });

    // TODO: Implement blocked party workflow
    // 1. Freeze all user accounts
    // 2. Block all transactions
    // 3. Notify compliance team
    // 4. File SAR (Suspicious Activity Report) if required
    // 5. Document decision trail
  }

  // Helper methods

  private isIndividual(data: any): data is IndividualScreeningData {
    return 'firstName' in data && 'lastName' in data;
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const ofacScreeningService = new OFACScreeningService();

/**
 * INTEGRATION GUIDE:
 * 
 * 1. Choose OFAC screening provider:
 *    - ComplyAdvantage (Recommended): $199/month + per-search
 *    - Dow Jones: Enterprise pricing
 *    - Refinitiv: Enterprise pricing
 *    - Direct OFAC XML: Free but requires parsing and fuzzy matching
 * 
 * 2. Sign up and get API credentials
 * 
 * 3. Update environment variables:
 *    OFAC_API_KEY=your_api_key
 *    OFAC_API_URL=https://api.complyadvantage.com/searches
 * 
 * 4. Replace screenIndividual() and screenBusiness() with real API calls
 * 
 * 5. Integrate into user registration:
 *    ```typescript
 *    const screeningResult = await ofacScreeningService.screenIndividual({
 *      firstName: user.firstName,
 *      lastName: user.lastName,
 *      dateOfBirth: user.dateOfBirth,
 *    });
 * 
 *    if (screeningResult.riskLevel === 'BLOCKED') {
 *      throw new Error('User blocked due to OFAC match');
 *    }
 *    ```
 * 
 * 6. Set up daily batch rescreening:
 *    ```typescript
 *    // cron job (daily at 2 AM)
 *    cron.schedule('0 2 * * *', async () => {
 *      await ofacScreeningService.batchRescreenUsers();
 *    });
 *    ```
 * 
 * 7. Screen large transactions:
 *    ```typescript
 *    if (transaction.amount > 10000) {
 *      const screening = await ofacScreeningService.screenTransaction({
 *        amount: transaction.amount,
 *        sender: {...},
 *        recipient: {...},
 *      });
 *      
 *      if (screening.requiresManualReview) {
 *        // Hold transaction for compliance review
 *      }
 *    }
 *    ```
 */

