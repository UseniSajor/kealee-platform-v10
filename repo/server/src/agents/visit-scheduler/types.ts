
export interface VisitScheduleRequest {
    projectId: string;
    pmId: string;
    visitType: 'assessment' | 'progress' | 'inspection_prep' | 'punch_list' | 'final';
    preferredDates?: Date[];
    duration: number;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
}

export interface ScheduledVisit {
    id: string;
    projectId: string;
    pmId: string;
    scheduledAt: Date;
    endAt: Date;
    type: string;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    location: { address: string; lat: number; lng: number };
    weather?: { conditions: string; temp: number; isWorkable: boolean };
}

export interface Location {
    lat: number;
    lng: number;
    address?: string;
}
