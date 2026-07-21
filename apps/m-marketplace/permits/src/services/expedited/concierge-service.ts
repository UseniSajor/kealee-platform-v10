/**
 * Concierge Service
 * Concierge service for complex projects
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface ConciergeService {
  permitId: string;
  coordinatorId: string;
  coordinatorName: string;
  services: ConciergeServiceType[];
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
}

export type ConciergeServiceType =
  | 'DOCUMENT_REVIEW'
  | 'CODE_COMPLIANCE_CHECK'
  | 'COORDINATION'
  | 'RESUBMISSION_ASSISTANCE'
  | 'INSPECTION_COORDINATION'
  | 'STAKEHOLDER_COMMUNICATION';

export interface ConciergeTask {
  id: string;
  permitId: string;
  serviceType: ConciergeServiceType;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: string;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
}

export class ConciergeServiceManager {
  /**
   * Activate concierge service for permit
   */
  async activateConciergeService(
    permitId: string,
    services: ConciergeServiceType[]
  ): Promise<ConciergeService> {
    const supabase = createClient();

    // Get permit details
    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId, expedited')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    if (!permit.expedited) {
      throw new Error('Concierge service only available for expedited permits');
    }

    // Assign coordinator
    const {data: coordinators} = await supabase
      .from('JurisdictionStaff')
      .select('*, user:User(name)')
      .eq('jurisdictionId', permit.jurisdictionId)
      .eq('role', 'PERMIT_COORDINATOR')
      .eq('active', true)
      .limit(1);

    if (!coordinators || coordinators.length === 0) {
      throw new Error('No coordinators available');
    }

    const coordinator = coordinators[0];

    // Create concierge service record
    const {data: concierge} = await supabase
      .from('ConciergeService')
      .insert({
        permitId,
        coordinatorId: coordinator.id,
        services,
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (!concierge) {
      throw new Error('Failed to create concierge service');
    }

    // Create initial tasks
    await this.createConciergeTasks(permitId, services, coordinator.id);

    return {
      permitId: concierge.permitId,
      coordinatorId: concierge.coordinatorId,
      coordinatorName: (coordinator.user as any)?.name || 'Unknown',
      services: concierge.services || [],
      status: concierge.status,
      startedAt: new Date(concierge.startedAt),
      completedAt: concierge.completedAt ? new Date(concierge.completedAt) : undefined,
    };
  }

  /**
   * Create concierge tasks
   */
  private async createConciergeTasks(
    permitId: string,
    services: ConciergeServiceType[],
    coordinatorId: string
  ): Promise<void> {
    const supabase = createClient();

    const tasks: Array<Omit<ConciergeTask, 'id' | 'completedAt'>> = [];

    if (services.includes('DOCUMENT_REVIEW')) {
      tasks.push({
        permitId,
        serviceType: 'DOCUMENT_REVIEW',
        title: 'Review Submitted Documents',
        description: 'Review all submitted documents for completeness and compliance',
        status: 'PENDING',
        assignedTo: coordinatorId,
      });
    }

    if (services.includes('CODE_COMPLIANCE_CHECK')) {
      tasks.push({
        permitId,
        serviceType: 'CODE_COMPLIANCE_CHECK',
        title: 'Pre-check Code Compliance',
        description: 'Perform preliminary code compliance check before review',
        status: 'PENDING',
        assignedTo: coordinatorId,
      });
    }

    if (services.includes('COORDINATION')) {
      tasks.push({
        permitId,
        serviceType: 'COORDINATION',
        title: 'Coordinate Multi-Discipline Review',
        description: 'Coordinate review across multiple disciplines',
        status: 'PENDING',
        assignedTo: coordinatorId,
      });
    }

    if (services.includes('RESUBMISSION_ASSISTANCE')) {
      tasks.push({
        permitId,
        serviceType: 'RESUBMISSION_ASSISTANCE',
        title: 'Assist with Resubmission',
        description: 'Provide guidance and assistance for resubmission',
        status: 'PENDING',
        assignedTo: coordinatorId,
      });
    }

    if (services.includes('INSPECTION_COORDINATION')) {
      tasks.push({
        permitId,
        serviceType: 'INSPECTION_COORDINATION',
        title: 'Coordinate Inspections',
        description: 'Coordinate and schedule inspections with priority',
        status: 'PENDING',
        assignedTo: coordinatorId,
      });
    }

    if (services.includes('STAKEHOLDER_COMMUNICATION')) {
      tasks.push({
        permitId,
        serviceType: 'STAKEHOLDER_COMMUNICATION',
        title: 'Stakeholder Communication',
        description: 'Maintain communication with all stakeholders',
        status: 'PENDING',
        assignedTo: coordinatorId,
      });
    }

    // Insert tasks
    for (const task of tasks) {
      await supabase.from('ConciergeTask').insert({
        permitId: task.permitId,
        serviceType: task.serviceType,
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo,
      });
    }
  }

  /**
   * Get concierge service for permit
   */
  async getConciergeService(permitId: string): Promise<ConciergeService | null> {
    const supabase = createClient();

    const {data: concierge} = await supabase
      .from('ConciergeService')
      .select('*, coordinator:JurisdictionStaff(user:User(name))')
      .eq('permitId', permitId)
      .single();

    if (!concierge) {
      return null;
    }

    return {
      permitId: concierge.permitId,
      coordinatorId: concierge.coordinatorId,
      coordinatorName:
        (concierge.coordinator as any)?.user?.name || 'Unknown',
      services: concierge.services || [],
      status: concierge.status,
      startedAt: new Date(concierge.startedAt),
      completedAt: concierge.completedAt ? new Date(concierge.completedAt) : undefined,
    };
  }

  /**
   * Get concierge tasks
   */
  async getConciergeTasks(permitId: string): Promise<ConciergeTask[]> {
    const supabase = createClient();

    const {data: tasks} = await supabase
      .from('ConciergeTask')
      .select('*')
      .eq('permitId', permitId)
      .order('createdAt', {ascending: true});

    if (!tasks) {
      return [];
    }

    return tasks.map(t => ({
      id: t.id,
      permitId: t.permitId,
      serviceType: t.serviceType,
      title: t.title,
      description: t.description,
      status: t.status,
      assignedTo: t.assignedTo,
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      notes: t.notes || undefined,
    }));
  }
}

// Singleton instance
export const conciergeServiceManager = new ConciergeServiceManager();
