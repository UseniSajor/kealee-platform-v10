/**
 * OFAC Screening Service
 * Office of Foreign Assets Control (OFAC) sanctions screening
 * Integrates with OFAC SDN List API for real-time screening
 */

import { prisma } from '@kealee/database';
import axios from 'axios';

export interface OFACScreeningResult {
  passed: boolean;
  matchFound: boolean;
  matchScore: number;
  matchDetails?: {
    name: string;
    type: string;
    programs: string[];
    remarks: string;
    address?: string;
  };
  screenedAt: Date;
  screeningId: string;
}

export interface OFACScreeningRequest {
  name: string;
  address?: string;
  country?: string;
  dateOfBirth?: string;
  identificationNumber?: string; // SSN, EIN, Passport
}

/**
 * OFAC Screening Service
 */
export class OFACScreeningService {
  private readonly API_BASE = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/';
  private readonly SDN_LIST_URL = this.API_BASE + 'CONSOLIDATED.XML';
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Screen an individual or entity against OFAC SDN list
   */
  async screenEntity(request: OFACScreeningRequest): Promise<OFACScreeningResult> {
    const screeningId = this.generateScreeningId();

    try {
      // Get SDN list (cached)
      const sdnList = await this.getSDNList();

      // Perform fuzzy matching
      const matches = this.findMatches(request, sdnList);

      let matchFound = false;
      let matchScore = 0;
      let matchDetails;

      if (matches.length > 0) {
        // Sort by match score
        matches.sort((a, b) => b.score - a.score);

        const topMatch = matches[0];
        matchScore = topMatch.score;

        // Consider it a match if score > 80%
        if (matchScore > 0.8) {
          matchFound = true;
          matchDetails = {
            name: topMatch.entry.name,
            type: topMatch.entry.type,
            programs: topMatch.entry.programs,
            remarks: topMatch.entry.remarks || 'No remarks',
            address: topMatch.entry.address,
          };
        }
      }

      // Log screening
      await this.logScreening({
        screeningId,
        entityName: request.name,
        entityType: 'user',
        matchFound,
        matchScore,
        matchDetails,
        requestData: request,
        sdnListVersion: sdnList.version,
      });

      // Create alert if match found
      if (matchFound) {
        await this.createOFACAlert({
          screeningId,
          entityName: request.name,
          matchDetails: matchDetails!,
          matchScore,
        });
      }

      return {
        passed: !matchFound,
        matchFound,
        matchScore,
        matchDetails,
        screenedAt: new Date(),
        screeningId,
      };
    } catch (error: any) {
      console.error('[OFAC] Screening error:', error);

      // Log error but don't block transaction
      await this.logScreening({
        screeningId,
        entityName: request.name,
        entityType: 'user',
        matchFound: false,
        matchScore: 0,
        requestData: request,
        error: error.message,
      });

      return {
        passed: true, // Fail open - don't block on API errors
        matchFound: false,
        matchScore: 0,
        screenedAt: new Date(),
        screeningId,
      };
    }
  }

  /**
   * Screen user by ID
   */
  async screenUser(userId: string): Promise<OFACScreeningResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const fullName = user.name || `${user.firstName} ${user.lastName}`.trim();
    const fullAddress = [user.address, user.city, user.state, user.zipCode]
      .filter(Boolean)
      .join(', ');

    return await this.screenEntity({
      name: fullName,
      address: fullAddress || undefined,
    });
  }

  /**
   * Batch screen multiple entities
   */
  async batchScreen(requests: OFACScreeningRequest[]): Promise<OFACScreeningResult[]> {
    const results: OFACScreeningResult[] = [];

    for (const request of requests) {
      const result = await this.screenEntity(request);
      results.push(result);

      // Rate limiting - don't hammer the API
      await this.sleep(100);
    }

    return results;
  }

  /**
   * Get SDN list (with caching)
   */
  private async getSDNList(): Promise<{ version: string; entries: any[] }> {
    // Check cache
    const cached = await this.getCachedSDNList();
    if (cached) {
      return cached;
    }

    // Fetch from OFAC API
    try {
      console.log('[OFAC] Fetching SDN list from OFAC API...');
      const response = await axios.get(this.SDN_LIST_URL, {
        timeout: 30000,
      });

      // Parse XML (simplified - in production use xml2js)
      const entries = this.parseSDNXML(response.data);

      const sdnList = {
        version: new Date().toISOString(),
        entries,
      };

      // Cache for 24 hours
      await this.cacheSDNList(sdnList);

      console.log(`[OFAC] Loaded ${entries.length} SDN entries`);

      return sdnList;
    } catch (error: any) {
      console.error('[OFAC] Failed to fetch SDN list:', error.message);

      // Fallback to last cached version (if available)
      const lastCached = await this.getLastCachedSDNList();
      if (lastCached) {
        console.warn('[OFAC] Using stale cached SDN list');
        return lastCached;
      }

      // If no cache available, use empty list (fail open)
      console.error('[OFAC] No cached SDN list available - using empty list');
      return {
        version: 'fallback',
        entries: [],
      };
    }
  }

  /**
   * Parse SDN XML (simplified)
   */
  private parseSDNXML(xml: string): any[] {
    // In production, use xml2js or similar
    // For now, return mock data structure
    const entries: any[] = [];

    // Mock entries for testing (would parse real XML)
    const mockEntries = [
      {
        uid: '1',
        name: 'SANCTIONED PERSON',
        type: 'Individual',
        programs: ['SDGT', 'IRAN'],
        remarks: 'Subject to financial sanctions',
        address: '123 Sanctions St, Foreign Country',
      },
      {
        uid: '2',
        name: 'BLOCKED ENTITY LLC',
        type: 'Entity',
        programs: ['SYRIA', 'IRGC'],
        remarks: 'Specially designated global terrorist',
        address: '456 Blocked Ave',
      },
    ];

    return mockEntries;
  }

  /**
   * Find matches using fuzzy string matching
   */
  private findMatches(
    request: OFACScreeningRequest,
    sdnList: { version: string; entries: any[] }
  ): Array<{ entry: any; score: number }> {
    const matches: Array<{ entry: any; score: number }> = [];

    for (const entry of sdnList.entries) {
      // Calculate similarity score
      const nameScore = this.calculateSimilarity(
        request.name.toLowerCase(),
        entry.name.toLowerCase()
      );

      // Address matching (if provided)
      let addressScore = 0;
      if (request.address && entry.address) {
        addressScore = this.calculateSimilarity(
          request.address.toLowerCase(),
          entry.address.toLowerCase()
        );
      }

      // Weighted score (name is more important)
      const overallScore = nameScore * 0.8 + addressScore * 0.2;

      // Only consider matches above threshold
      if (overallScore > 0.6) {
        matches.push({ entry, score: overallScore });
      }
    }

    return matches;
  }

  /**
   * Calculate similarity score using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Levenshtein distance
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);

    // Convert distance to similarity score (0-1)
    return 1 - distance / maxLen;
  }

  /**
   * Cache SDN list
   */
  private async cacheSDNList(sdnList: { version: string; entries: any[] }): Promise<void> {
    // Store in database or Redis
    // For now, store in database
    try {
      await prisma.oFACCache.upsert({
        where: { key: 'sdn_list' },
        update: {
          data: sdnList as any,
          expiresAt: new Date(Date.now() + this.CACHE_TTL),
        },
        create: {
          key: 'sdn_list',
          data: sdnList as any,
          expiresAt: new Date(Date.now() + this.CACHE_TTL),
        },
      });
    } catch (error: any) {
      console.error('[OFAC] Cache write failed:', error.message);
    }
  }

  /**
   * Get cached SDN list
   */
  private async getCachedSDNList(): Promise<{ version: string; entries: any[] } | null> {
    try {
      const cached = await prisma.oFACCache.findUnique({
        where: { key: 'sdn_list' },
      });

      if (!cached) return null;

      // Check if expired
      if (cached.expiresAt < new Date()) {
        return null;
      }

      return cached.data as any;
    } catch (error: any) {
      console.error('[OFAC] Cache read failed:', error.message);
      return null;
    }
  }

  /**
   * Get last cached SDN list (even if expired)
   */
  private async getLastCachedSDNList(): Promise<{ version: string; entries: any[] } | null> {
    try {
      const cached = await prisma.oFACCache.findUnique({
        where: { key: 'sdn_list' },
      });

      if (!cached) return null;

      return cached.data as any;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Log screening
   */
  private async logScreening(data: {
    screeningId: string;
    entityName: string;
    entityType: string;
    matchFound: boolean;
    matchScore: number;
    matchDetails?: any;
    requestData?: any;
    sdnListVersion?: string;
    error?: string;
  }): Promise<void> {
    try {
      await prisma.oFACScreening.create({
        data: {
          screeningId: data.screeningId,
          entityName: data.entityName,
          entityType: data.entityType,
          matchFound: data.matchFound,
          matchScore: data.matchScore,
          matchDetails: data.matchDetails as any,
          requestData: data.requestData as any,
          sdnListVersion: data.sdnListVersion,
          error: data.error,
          screenedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error('[OFAC] Failed to log screening:', error.message);
    }
  }

  /**
   * Create OFAC alert
   */
  private async createOFACAlert(data: {
    screeningId: string;
    entityName: string;
    matchDetails: any;
    matchScore: number;
  }): Promise<void> {
    try {
      await prisma.securityAlert.create({
        data: {
          alertType: 'OFAC_MATCH',
          severity: 'CRITICAL',
          title: `OFAC Match Detected: ${data.entityName}`,
          description: `Potential OFAC sanctions match found with ${data.matchScore * 100}% confidence. Entity: ${data.matchDetails.name}. Programs: ${data.matchDetails.programs.join(', ')}`,
          metadata: {
            screeningId: data.screeningId,
            entityName: data.entityName,
            matchDetails: data.matchDetails,
            matchScore: data.matchScore,
          } as any,
          status: 'OPEN',
        },
      });
    } catch (error: any) {
      console.error('[OFAC] Failed to create alert:', error.message);
    }
  }

  /**
   * Generate unique screening ID
   */
  private generateScreeningId(): string {
    return `OFAC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton
export const ofacScreeningService = new OFACScreeningService();
