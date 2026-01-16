/**
 * Hearing and Meeting Calendar Integration Service
 * Hearing and meeting calendar integration
 */

import {createClient} from '@/lib/supabase/client';

export interface PublicHearing {
  id: string;
  title: string;
  description: string;
  type: 'ZONING' | 'PLANNING' | 'BOARD' | 'PUBLIC_HEARING' | 'MEETING';
  date: Date;
  startTime: string; // "18:00"
  endTime?: string; // "20:00"
  location: string;
  address?: string;
  virtualLink?: string; // For online meetings
  relatedPermitIds?: string[];
  agendaItems?: Array<{
    title: string;
    description?: string;
    permitId?: string;
  }>;
  publicAccessible: boolean;
}

export interface MeetingCalendar {
  month: number; // 1-12
  year: number;
  hearings: PublicHearing[];
  nextHearing?: PublicHearing;
}

export class CalendarIntegrationService {
  /**
   * Get public hearings for period
   */
  async getPublicHearings(
    jurisdictionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PublicHearing[]> {
    const supabase = createClient();

    const {data: hearings} = await supabase
      .from('PublicHearing')
      .select('*')
      .eq('jurisdictionId', jurisdictionId)
      .eq('publicAccessible', true)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', {ascending: true})
      .order('startTime', {ascending: true});

    if (!hearings) {
      return [];
    }

    return hearings.map(hearing => ({
      id: hearing.id,
      title: hearing.title,
      description: hearing.description || '',
      type: hearing.type,
      date: new Date(hearing.date),
      startTime: hearing.startTime,
      endTime: hearing.endTime || undefined,
      location: hearing.location,
      address: hearing.address || undefined,
      virtualLink: hearing.virtualLink || undefined,
      relatedPermitIds: hearing.relatedPermitIds || undefined,
      agendaItems: hearing.agendaItems || undefined,
      publicAccessible: hearing.publicAccessible || false,
    }));
  }

  /**
   * Get meeting calendar for month
   */
  async getMeetingCalendar(
    jurisdictionId: string,
    month: number,
    year: number
  ): Promise<MeetingCalendar> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const hearings = await this.getPublicHearings(jurisdictionId, startDate, endDate);

    // Get next hearing (future)
    const now = new Date();
    const nextHearing = hearings.find(h => h.date >= now);

    return {
      month,
      year,
      hearings,
      nextHearing,
    };
  }

  /**
   * Get hearings related to permit
   */
  async getPermitHearings(permitId: string): Promise<PublicHearing[]> {
    const supabase = createClient();

    // Get permit jurisdiction
    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get hearings that mention this permit
    const {data: hearings} = await supabase
      .from('PublicHearing')
      .select('*')
      .eq('jurisdictionId', permit.jurisdictionId)
      .eq('publicAccessible', true)
      .contains('relatedPermitIds', [permitId])
      .order('date', {ascending: true});

    if (!hearings) {
      return [];
    }

    return hearings.map(hearing => ({
      id: hearing.id,
      title: hearing.title,
      description: hearing.description || '',
      type: hearing.type,
      date: new Date(hearing.date),
      startTime: hearing.startTime,
      endTime: hearing.endTime || undefined,
      location: hearing.location,
      address: hearing.address || undefined,
      virtualLink: hearing.virtualLink || undefined,
      relatedPermitIds: hearing.relatedPermitIds || undefined,
      agendaItems: hearing.agendaItems || undefined,
      publicAccessible: hearing.publicAccessible || false,
    }));
  }

  /**
   * Get upcoming hearings
   */
  async getUpcomingHearings(
    jurisdictionId: string,
    limit: number = 10
  ): Promise<PublicHearing[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Next 3 months

    const hearings = await this.getPublicHearings(jurisdictionId, startDate, endDate);

    return hearings.slice(0, limit);
  }
}

// Singleton instance
export const calendarIntegrationService = new CalendarIntegrationService();
