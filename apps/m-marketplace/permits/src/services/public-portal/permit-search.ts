/**
 * Public Permit Search Service
 * Permit search by address, permit number, or owner
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface PermitSearchQuery {
  query: string;
  searchType: 'ADDRESS' | 'PERMIT_NUMBER' | 'OWNER' | 'PARCEL' | 'ALL';
  jurisdictionId?: string;
}

export interface PublicPermitInfo {
  permitId: string;
  permitNumber: string;
  type: string;
  subtype?: string;
  description: string;
  status: string;
  propertyAddress: string;
  parcelNumber?: string;
  applicantName?: string;
  submittedAt?: Date;
  issuedAt?: Date;
  expiresAt?: Date;
  jurisdictionName: string;
}

export interface PermitSearchResult {
  permits: PublicPermitInfo[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class PermitSearchService {
  /**
   * Search permits
   */
  async searchPermits(
    searchQuery: PermitSearchQuery,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PermitSearchResult> {
    const supabase = createClient();
    let query = supabase
      .from('Permit')
      .select(
        `
        id,
        permitNumber,
        type,
        subtype,
        description,
        status,
        submittedAt,
        issuedAt,
        expiresAt,
        property:Property(address, parcelNumber),
        applicant:User(name),
        jurisdiction:Jurisdiction(name)
      `,
        {count: 'exact'}
      )
      .eq('status', 'ISSUED')
      .or('status.eq.ACTIVE,status.eq.COMPLETED'); // Only show issued/active/completed permits publicly

    // Apply jurisdiction filter
    if (searchQuery.jurisdictionId) {
      query = query.eq('jurisdictionId', searchQuery.jurisdictionId);
    }

    // Apply search filter based on type
    const searchTerm = searchQuery.query.trim();
    if (searchTerm) {
      switch (searchQuery.searchType) {
        case 'ADDRESS':
          query = query.ilike('property.address', `%${searchTerm}%`);
          break;
        case 'PERMIT_NUMBER':
          query = query.ilike('permitNumber', `%${searchTerm}%`);
          break;
        case 'OWNER':
          query = query.ilike('applicant.name', `%${searchTerm}%`);
          break;
        case 'PARCEL':
          query = query.ilike('property.parcelNumber', `%${searchTerm}%`);
          break;
        case 'ALL':
        default:
          // Search across multiple fields
          query = query.or(
            `permitNumber.ilike.%${searchTerm}%,property.address.ilike.%${searchTerm}%,applicant.name.ilike.%${searchTerm}%,property.parcelNumber.ilike.%${searchTerm}%`
          );
          break;
      }
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to).order('submittedAt', {ascending: false});

    const {data: permits, count, error} = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    const mappedPermits: PublicPermitInfo[] = (permits || []).map((p: any) => ({
      permitId: p.id,
      permitNumber: p.permitNumber,
      type: p.type,
      subtype: p.subtype || undefined,
      description: p.description,
      status: p.status,
      propertyAddress: p.property?.address || 'N/A',
      parcelNumber: p.property?.parcelNumber || undefined,
      applicantName: p.applicant?.name || undefined,
      submittedAt: p.submittedAt ? new Date(p.submittedAt) : undefined,
      issuedAt: p.issuedAt ? new Date(p.issuedAt) : undefined,
      expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined,
      jurisdictionName: p.jurisdiction?.name || 'Unknown',
    }));

    return {
      permits: mappedPermits,
      total: count || 0,
      page,
      pageSize,
      hasMore: count ? from + pageSize < count : false,
    };
  }

  /**
   * Get permit by number (public view)
   */
  async getPermitByNumber(permitNumber: string): Promise<PublicPermitInfo | null> {
    const supabase = createClient();

    const {data: permit} = await supabase
      .from('Permit')
      .select(
        `
        id,
        permitNumber,
        type,
        subtype,
        description,
        status,
        submittedAt,
        issuedAt,
        expiresAt,
        property:Property(address, parcelNumber),
        applicant:User(name),
        jurisdiction:Jurisdiction(name)
      `
      )
      .eq('permitNumber', permitNumber)
      .in('status', ['ISSUED', 'ACTIVE', 'COMPLETED'])
      .single();

    if (!permit) {
      return null;
    }

    return {
      permitId: (permit as any).id,
      permitNumber: (permit as any).permitNumber,
      type: (permit as any).type,
      subtype: (permit as any).subtype || undefined,
      description: (permit as any).description,
      status: (permit as any).status,
      propertyAddress: (permit as any).property?.address || 'N/A',
      parcelNumber: (permit as any).property?.parcelNumber || undefined,
      applicantName: (permit as any).applicant?.name || undefined,
      submittedAt: (permit as any).submittedAt ? new Date((permit as any).submittedAt) : undefined,
      issuedAt: (permit as any).issuedAt ? new Date((permit as any).issuedAt) : undefined,
      expiresAt: (permit as any).expiresAt ? new Date((permit as any).expiresAt) : undefined,
      jurisdictionName: (permit as any).jurisdiction?.name || 'Unknown',
    };
  }

  /**
   * Get permits by address
   */
  async getPermitsByAddress(address: string): Promise<PublicPermitInfo[]> {
    const result = await this.searchPermits({
      query: address,
      searchType: 'ADDRESS',
    });

    return result.permits;
  }

  /**
   * Get permits by owner
   */
  async getPermitsByOwner(ownerName: string): Promise<PublicPermitInfo[]> {
    const result = await this.searchPermits({
      query: ownerName,
      searchType: 'OWNER',
    });

    return result.permits;
  }
}

// Singleton instance
export const permitSearchService = new PermitSearchService();
