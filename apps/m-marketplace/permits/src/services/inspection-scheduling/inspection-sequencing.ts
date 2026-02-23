/**
 * Inspection Sequencing Service
 * Automatic inspection sequencing (footing before foundation, etc.)
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface InspectionSequence {
  inspectionType: string;
  prerequisites: string[]; // Inspection types that must be completed first
  optionalPrerequisites?: string[]; // Inspection types recommended but not required
  order: number; // Sequence order
}

export interface InspectionSequenceCheck {
  inspectionType: string;
  canProceed: boolean;
  missingPrerequisites: string[];
  completedPrerequisites: string[];
  blockers: Array<{
    inspectionType: string;
    status: string;
    completedDate?: Date;
  }>;
}

export class InspectionSequencingService {
  private sequences: InspectionSequence[] = [];

  constructor() {
    this.initializeSequences();
  }

  /**
   * Initialize inspection sequences
   */
  private initializeSequences() {
    this.sequences = [
      // Site work
      {
        inspectionType: 'FOOTING',
        prerequisites: [],
        order: 1,
      },
      {
        inspectionType: 'FOUNDATION',
        prerequisites: ['FOOTING'],
        order: 2,
      },
      {
        inspectionType: 'SLAB',
        prerequisites: ['FOUNDATION'],
        optionalPrerequisites: ['FOOTING'],
        order: 3,
      },
      // Rough-in inspections
      {
        inspectionType: 'ROUGH_FRAMING',
        prerequisites: ['FOUNDATION', 'SLAB'],
        order: 4,
      },
      {
        inspectionType: 'ROUGH_ELECTRICAL',
        prerequisites: ['ROUGH_FRAMING'],
        order: 5,
      },
      {
        inspectionType: 'ROUGH_PLUMBING',
        prerequisites: ['ROUGH_FRAMING'],
        order: 5,
      },
      {
        inspectionType: 'ROUGH_MECHANICAL',
        prerequisites: ['ROUGH_FRAMING'],
        order: 5,
      },
      {
        inspectionType: 'INSULATION',
        prerequisites: ['ROUGH_ELECTRICAL', 'ROUGH_PLUMBING', 'ROUGH_MECHANICAL'],
        order: 6,
      },
      {
        inspectionType: 'DRYWALL',
        prerequisites: ['INSULATION'],
        order: 7,
      },
      // Final inspections
      {
        inspectionType: 'FINAL_ELECTRICAL',
        prerequisites: ['DRYWALL'],
        order: 8,
      },
      {
        inspectionType: 'FINAL_PLUMBING',
        prerequisites: ['DRYWALL'],
        order: 8,
      },
      {
        inspectionType: 'FINAL_MECHANICAL',
        prerequisites: ['DRYWALL'],
        order: 8,
      },
      {
        inspectionType: 'FINAL_BUILDING',
        prerequisites: ['FINAL_ELECTRICAL', 'FINAL_PLUMBING', 'FINAL_MECHANICAL'],
        order: 9,
      },
      {
        inspectionType: 'FINAL_CERTIFICATE_OF_OCCUPANCY',
        prerequisites: ['FINAL_BUILDING'],
        order: 10,
      },
    ];
  }

  /**
   * Check if inspection can proceed
   */
  async checkInspectionSequence(
    permitId: string,
    inspectionType: string
  ): Promise<InspectionSequenceCheck> {
    const supabase = createClient();

    // Find sequence for inspection type
    const sequence = this.sequences.find(s => s.inspectionType === inspectionType);
    
    if (!sequence) {
      // No sequence defined, allow to proceed
      return {
        inspectionType,
        canProceed: true,
        missingPrerequisites: [],
        completedPrerequisites: [],
        blockers: [],
      };
    }

    // Get all inspections for permit
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('id, type, status, result, completedAt')
      .eq('permitId', permitId)
      .in('type', sequence.prerequisites);

    // Check prerequisites
    const completedInspections = inspections?.filter(
      i => i.status === 'COMPLETED' && (i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS')
    ) || [];

    const completedTypes = completedInspections.map(i => i.type);
    const missingPrerequisites = sequence.prerequisites.filter(
      p => !completedTypes.includes(p)
    );

    // Build blockers list
    const blockers = sequence.prerequisites.map(prereq => {
      const inspection = inspections?.find(i => i.type === prereq);
      return {
        inspectionType: prereq,
        status: inspection?.status || 'NOT_REQUESTED',
        completedDate: inspection?.completedAt
          ? new Date(inspection.completedAt)
          : undefined,
      };
    });

    const canProceed = missingPrerequisites.length === 0;

    return {
      inspectionType,
      canProceed,
      missingPrerequisites,
      completedPrerequisites: completedTypes,
      blockers,
    };
  }

  /**
   * Get next available inspections for permit
   */
  async getNextAvailableInspections(permitId: string): Promise<string[]> {
    const supabase = createClient();

    // Get all inspections for permit
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('id, type, status, result')
      .eq('permitId', permitId);

    const completedInspections = inspections?.filter(
      i => i.status === 'COMPLETED' && (i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS')
    ) || [];

    const completedTypes = completedInspections.map(i => i.type);

    // Find inspections that can proceed
    const available: string[] = [];

    for (const sequence of this.sequences) {
      // Check if already completed
      if (completedTypes.includes(sequence.inspectionType)) {
        continue;
      }

      // Check if already requested/scheduled
      const existing = inspections?.find(i => i.type === sequence.inspectionType);
      if (existing) {
        continue;
      }

      // Check prerequisites
      const allPrerequisitesMet = sequence.prerequisites.every(
        p => completedTypes.includes(p)
      );

      if (allPrerequisitesMet) {
        available.push(sequence.inspectionType);
      }
    }

    return available;
  }

  /**
   * Get inspection sequence for permit type
   */
  getInspectionSequence(): InspectionSequence[] {
    return [...this.sequences].sort((a, b) => a.order - b.order);
  }

  /**
   * Create inspection requirement template
   */
  createInspectionTemplate(
    permitType: string,
    projectPhase: string
  ): Array<{
    inspectionType: string;
    required: boolean;
    order: number;
    prerequisites: string[];
  }> {
    // Filter sequences based on permit type and phase
    const relevantSequences = this.sequences.filter(seq => {
      // Customize based on permit type and phase
      // For now, return all sequences
      return true;
    });

    return relevantSequences.map(seq => ({
      inspectionType: seq.inspectionType,
      required: true,
      order: seq.order,
      prerequisites: seq.prerequisites,
    }));
  }
}

// Singleton instance
export const inspectionSequencingService = new InspectionSequencingService();
