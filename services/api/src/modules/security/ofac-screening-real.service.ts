/**
 * OFAC Sanctions Screening Service - Production Implementation
 * Integrates with ComplyAdvantage API for real-time sanctions screening
 * 
 * DOCUMENTATION: https://docs.complyadvantage.com/
 */

import axios from 'axios';

export interface ScreeningResult {
  isMatch: boolean;
  matchScore: number;
  matchType: 'EXACT' | 'FUZZY' | 'NONE';
  sdnEntries: SDNEntry[];
  screenedAt: Date;
  riskLevel: 'CLEAR' | 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  searchId?: string; // ComplyAdvantage search ID for audit
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

export class OFACScreeningRealService {
  private apiKey: string;
  private apiUrl: string;
  private isProduction: boolean;

  constructor() {
    // Check environment
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Get API credentials from environment
    this.apiKey = process.env.COMPLYADVANTAGE_API_KEY || '';
    this.apiUrl = process.env.COMPLYADVANTAGE_API_URL || 'https://api.complyadvantage.com';

    // Validate configuration
    if (this.isProduction && !this.apiKey) {
      throw new Error('COMPLYADVANTAGE_API_KEY is required in production');
    }

    if (!this.apiKey) {
      console.warn('⚠️ OFAC screening running in TEST MODE - using mock data');
    }
  }

  /**
   * Screen individual against OFAC SDN list
   */
  async screenIndividual(data: IndividualScreeningData): Promise<ScreeningResult> {
    // If no API key, use test mode
    if (!this.apiKey) {
      return this.testModeScreening(data);
    }

    try {
      // Call ComplyAdvantage API
      const response = await axios.post(
        `${this.apiUrl}/searches`,
        {
          search_term: `${data.firstName} ${data.lastName}`,
          fuzziness: 0.6, // 60% match threshold
          filters: {
            types: ['person'],
            birth_year: data.dateOfBirth ? data.dateOfBirth.getFullYear() : undefined,
          },
          share_url: 1, // Generate shareable URL for audit
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const searchData = response.data;
      const matches = searchData.content?.data || [];

      // Determine if there's a match
      const hasMatch = matches.length > 0;
      const highestMatch = matches.length > 0 ? matches[0] : null;
      const matchScore = highestMatch ? highestMatch.match_score : 0;

      // Map to our format
      const sdnEntries: SDNEntry[] = matches.map((match: any) => ({
        uid: match.id,
        name: match.name,
        type: 'Individual',
        programs: match.types || [],
        addresses: match.addresses || [],
        identifications: match.identifications || [],
      }));

      // Determine risk level
      let riskLevel: 'CLEAR' | 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
      if (matchScore >= 0.9) {
        riskLevel = 'BLOCKED';
      } else if (matchScore >= 0.7) {
        riskLevel = 'HIGH';
      } else if (matchScore >= 0.5) {
        riskLevel = 'MEDIUM';
      } else if (matchScore >= 0.3) {
        riskLevel = 'LOW';
      } else {
        riskLevel = 'CLEAR';
      }

      return {
        isMatch: hasMatch && matchScore > 0.5,
        matchScore,
        matchType: matchScore > 0.9 ? 'EXACT' : matchScore > 0.5 ? 'FUZZY' : 'NONE',
        sdnEntries,
        screenedAt: new Date(),
        riskLevel,
        searchId: searchData.id,
      };
    } catch (error: any) {
      console.error('OFAC screening error:', error.message);
      
      // In production, fail closed (block on error)
      if (this.isProduction) {
        return {
          isMatch: true,
          matchScore: 1.0,
          matchType: 'EXACT',
          sdnEntries: [],
          screenedAt: new Date(),
          riskLevel: 'BLOCKED',
        };
      }

      // In development, allow through but log
      return {
        isMatch: false,
        matchScore: 0,
        matchType: 'NONE',
        sdnEntries: [],
        screenedAt: new Date(),
        riskLevel: 'CLEAR',
      };
    }
  }

  /**
   * Screen business entity
   */
  async screenBusiness(data: BusinessScreeningData): Promise<ScreeningResult> {
    if (!this.apiKey) {
      return this.testModeScreening({ firstName: data.businessName, lastName: '' });
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/searches`,
        {
          search_term: data.businessName,
          fuzziness: 0.6,
          filters: {
            types: ['entity', 'organisation'],
          },
          share_url: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const searchData = response.data;
      const matches = searchData.content?.data || [];
      const hasMatch = matches.length > 0;
      const highestMatch = matches.length > 0 ? matches[0] : null;
      const matchScore = highestMatch ? highestMatch.match_score : 0;

      const sdnEntries: SDNEntry[] = matches.map((match: any) => ({
        uid: match.id,
        name: match.name,
        type: 'Entity',
        programs: match.types || [],
        addresses: match.addresses || [],
        identifications: [],
      }));

      let riskLevel: 'CLEAR' | 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
      if (matchScore >= 0.9) riskLevel = 'BLOCKED';
      else if (matchScore >= 0.7) riskLevel = 'HIGH';
      else if (matchScore >= 0.5) riskLevel = 'MEDIUM';
      else if (matchScore >= 0.3) riskLevel = 'LOW';
      else riskLevel = 'CLEAR';

      return {
        isMatch: hasMatch && matchScore > 0.5,
        matchScore,
        matchType: matchScore > 0.9 ? 'EXACT' : matchScore > 0.5 ? 'FUZZY' : 'NONE',
        sdnEntries,
        screenedAt: new Date(),
        riskLevel,
        searchId: searchData.id,
      };
    } catch (error: any) {
      console.error('Business screening error:', error.message);

      if (this.isProduction) {
        return {
          isMatch: true,
          matchScore: 1.0,
          matchType: 'EXACT',
          sdnEntries: [],
          screenedAt: new Date(),
          riskLevel: 'BLOCKED',
        };
      }

      return {
        isMatch: false,
        matchScore: 0,
        matchType: 'NONE',
        sdnEntries: [],
        screenedAt: new Date(),
        riskLevel: 'CLEAR',
      };
    }
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
   * Test mode screening (for development/testing)
   */
  private testModeScreening(data: any): ScreeningResult {
    // Known test names that trigger matches
    const testSanctionedNames = [
      'NARCO TERRORIST',
      'SANCTIONED ENTITY',
      'BLOCKED PARTY',
      'TEST MATCH',
    ];

    const fullName = typeof data.firstName === 'string' 
      ? `${data.firstName} ${data.lastName || ''}`.toUpperCase()
      : data.businessName?.toUpperCase() || '';

    const isMatch = testSanctionedNames.some(name => fullName.includes(name));

    return {
      isMatch,
      matchScore: isMatch ? 0.95 : 0.0,
      matchType: isMatch ? 'EXACT' : 'NONE',
      sdnEntries: isMatch ? [
        {
          uid: 'TEST-SDN-001',
          name: fullName,
          type: 'Individual',
          programs: ['TEST'],
          addresses: [],
          identifications: [],
        },
      ] : [],
      screenedAt: new Date(),
      riskLevel: isMatch ? 'BLOCKED' : 'CLEAR',
      searchId: 'TEST-MODE',
    };
  }

  private isIndividual(data: any): data is IndividualScreeningData {
    return 'firstName' in data && 'lastName' in data;
  }
}

export const ofacScreeningRealService = new OFACScreeningRealService();

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Sign up for ComplyAdvantage: https://www.complyadvantage.com/
 *    - Pricing: $199/month + per-search fees
 *    - Free trial available
 * 
 * 2. Get API credentials from dashboard
 * 
 * 3. Add to environment variables:
 *    ```bash
 *    COMPLYADVANTAGE_API_KEY=your_api_key_here
 *    COMPLYADVANTAGE_API_URL=https://api.complyadvantage.com
 *    ```
 * 
 * 4. Test integration:
 *    ```typescript
 *    const result = await ofacScreeningRealService.screenIndividual({
 *      firstName: 'John',
 *      lastName: 'Doe',
 *      dateOfBirth: new Date('1990-01-01'),
 *    });
 *    console.log(result);
 *    ```
 * 
 * 5. Integrate into user registration:
 *    ```typescript
 *    const screening = await ofacScreeningRealService.screenIndividual({
 *      firstName: user.firstName,
 *      lastName: user.lastName,
 *      dateOfBirth: user.dateOfBirth,
 *    });
 *    
 *    if (screening.riskLevel === 'BLOCKED') {
 *      throw new Error('User blocked due to OFAC match');
 *    }
 *    
 *    // Store screening result
 *    await prisma.ofacScreening.create({
 *      data: {
 *        userId: user.id,
 *        searchId: screening.searchId,
 *        riskLevel: screening.riskLevel,
 *        matchScore: screening.matchScore,
 *        screenedAt: screening.screenedAt,
 *      },
 *    });
 *    ```
 * 
 * ALTERNATIVE PROVIDERS:
 * - Dow Jones Risk & Compliance: https://developer.dowjones.com/
 * - Refinitiv World-Check: https://www.refinitiv.com/en/products/world-check-kyc-screening
 * - Direct OFAC XML: https://sanctionslist.ofac.treas.gov/ (free, requires parsing)
 */

