/**
 * Hearing and Meeting Calendar Service
 * Hearing and meeting calendar integration
 */

import {createClient} from '@/lib/supabase/client';

export interface HearingMeeting {
  id: string;
  title: string;
  type: 'HEARING' | 'MEETING' | 'PUBLIC_COMMENT_PERIOD' | 'BOARD_REVIEW';
  description?: string;
  date: Date;
  startTime: string;
  endTime?: string;
  location: string;
  virtualMeetingUrl?: string;
  agendaUrl?: string;
  minutesUrl?: string;
  relatedPermitIds: string[];
  relatedProjectIds: string[];
  jurisdictionId: string;
  jurisdictionName: string;
  registrationRequired: boolean;
  registrationUrl?: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  date: Date;
  startTime: string;
  endTime?: string;
  location: string;
  description?: string;
  url?: string;
}

export class HearingCalendarService {
  /**
   * Get upcoming hearings and meetings
   */
  async getUpcomingHearings(
    jurisdictionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HearingMeeting[]> {
    const supabase = createClient();

    let query = supabase
      .from('HearingMeeting')
      .select('*, jurisdiction:Jurisdiction(name)')
      .eq('status', 'UPCOMING')
      .gte('date', (startDate || new Date()).toISOString());

    if (jurisdictionId) {
      query = query.eq('jurisdictionId', jurisdictionId);
    }

    if (endDate) {
      query = query.lte('date', endDate.toISOString());
    }

    query = query.order('date', {ascending: true}).order('startTime', {ascending: true});

    const {data: hearings} = await query.limit(100);

    if (!hearings) {
      return [];
    }

    return hearings.map(h => ({
      id: h.id,
      title: h.title,
      type: h.type,
      description: h.description || undefined,
      date: new Date(h.date),
      startTime: h.startTime,
      endTime: h.endTime || undefined,
      location: h.location,
      virtualMeetingUrl: h.virtualMeetingUrl || undefined,
      agendaUrl: h.agendaUrl || undefined,
      minutesUrl: h.minutesUrl || undefined,
      relatedPermitIds: h.relatedPermitIds || [],
      relatedProjectIds: h.relatedProjectIds || [],
      jurisdictionId: h.jurisdictionId,
      jurisdictionName: (h.jurisdiction as any)?.name || 'N/A',
      registrationRequired: h.registrationRequired || false,
      registrationUrl: h.registrationUrl || undefined,
      status: h.status,
    }));
  }

  /**
   * Get hearings for permit
   */
  async getHearingsForPermit(permitId: string): Promise<HearingMeeting[]> {
    const supabase = createClient();

    const {data: hearings} = await supabase
      .from('HearingMeeting')
      .select('*, jurisdiction:Jurisdiction(name)')
      .contains('relatedPermitIds', [permitId])
      .order('date', {ascending: true});

    if (!hearings) {
      return [];
    }

    return hearings.map(h => ({
      id: h.id,
      title: h.title,
      type: h.type,
      description: h.description || undefined,
      date: new Date(h.date),
      startTime: h.startTime,
      endTime: h.endTime || undefined,
      location: h.location,
      virtualMeetingUrl: h.virtualMeetingUrl || undefined,
      agendaUrl: h.agendaUrl || undefined,
      minutesUrl: h.minutesUrl || undefined,
      relatedPermitIds: h.relatedPermitIds || [],
      relatedProjectIds: h.relatedProjectIds || [],
      jurisdictionId: h.jurisdictionId,
      jurisdictionName: (h.jurisdiction as any)?.name || 'N/A',
      registrationRequired: h.registrationRequired || false,
      registrationUrl: h.registrationUrl || undefined,
      status: h.status,
    }));
  }

  /**
   * Get calendar events (simplified for calendar views)
   */
  async getCalendarEvents(
    jurisdictionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    const hearings = await this.getUpcomingHearings(jurisdictionId, startDate, endDate);

    return hearings.map(h => ({
      id: h.id,
      title: h.title,
      type: h.type,
      date: h.date,
      startTime: h.startTime,
      endTime: h.endTime,
      location: h.location,
      description: h.description,
      url: h.virtualMeetingUrl || h.agendaUrl,
    }));
  }

  /**
   * Get hearing details
   */
  async getHearingDetails(hearingId: string): Promise<HearingMeeting | null> {
    const supabase = createClient();

    const {data: hearing} = await supabase
      .from('HearingMeeting')
      .select('*, jurisdiction:Jurisdiction(name)')
      .eq('id', hearingId)
      .single();

    if (!hearing) {
      return null;
    }

    return {
      id: hearing.id,
      title: hearing.title,
      type: hearing.type,
      description: hearing.description || undefined,
      date: new Date(hearing.date),
      startTime: hearing.startTime,
      endTime: hearing.endTime || undefined,
      location: hearing.location,
      virtualMeetingUrl: hearing.virtualMeetingUrl || undefined,
      agendaUrl: hearing.agendaUrl || undefined,
      minutesUrl: hearing.minutesUrl || undefined,
      relatedPermitIds: hearing.relatedPermitIds || [],
      relatedProjectIds: hearing.relatedProjectIds || [],
      jurisdictionId: hearing.jurisdictionId,
      jurisdictionName: (h.jurisdiction as any)?.name || 'N/A',
      registrationRequired: hearing.registrationRequired || false,
      registrationUrl: hearing.registrationUrl || undefined,
      status: hearing.status,
    };
  }
}

// Singleton instance
export const hearingCalendarService = new HearingCalendarService();
