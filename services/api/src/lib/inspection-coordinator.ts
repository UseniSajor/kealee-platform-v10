/**
 * InspectionCoordinator
 *
 * Manages inspection lifecycle with mandatory human oversight.
 * Bots may SUGGEST scheduling; only a verified specialist may confirm it.
 *
 * Workflow:
 *   1. checkInspectionsDue()  → determines next required inspection
 *   2. scheduleInspection()   → specialist confirms date (requires specialistId)
 *   3. logInspectionResult()  → specialist records pass/fail (requires specialistId)
 *   4. checkPermitComplete()  → auto-marks permit complete if all inspections pass
 */

import { prisma } from '@kealee/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InspectionDue {
  inspectionType: string;
  description: string;
  /** Construction phase when this inspection must occur */
  phase: string;
  /** Whether this inspection is overdue */
  overdue: boolean;
}

export interface ScheduleInspectionInput {
  permitId: string;
  projectId: string;
  jurisdictionId: string;
  inspectionType: string;
  requestedDate: Date;
  /** Human specialist who is authorising the scheduling — required */
  specialistId: string;
  notes?: string;
  isRemote?: boolean;
}

export interface LogResultInput {
  inspectionId: string;
  result: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS' | 'NOT_READY';
  notes?: string;
  deficiencies?: Array<{ code?: string; description: string; severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL' }>;
  /** Human specialist who observed / logged this result — required */
  specialistId: string;
}

// ─── Inspection sequence by permit type ──────────────────────────────────────

const STANDARD_INSPECTION_SEQUENCE: Array<{ type: string; phase: string; description: string }> = [
  { type: 'SITE',              phase: 'Pre-construction', description: 'Site conditions and erosion controls' },
  { type: 'FOOTING',           phase: 'Foundation',       description: 'Footing excavation before pour' },
  { type: 'FOUNDATION',        phase: 'Foundation',       description: 'Foundation walls before backfill' },
  { type: 'UNDER_SLAB_PLUMBING', phase: 'Rough',         description: 'Under-slab plumbing before slab pour' },
  { type: 'ROUGH_FRAMING',     phase: 'Rough',            description: 'Framing before insulation or drywall' },
  { type: 'ROUGH_ELECTRICAL',  phase: 'Rough',            description: 'Electrical rough-in before wall close' },
  { type: 'ROUGH_PLUMBING',    phase: 'Rough',            description: 'Plumbing rough-in before wall close' },
  { type: 'ROUGH_MECHANICAL',  phase: 'Rough',            description: 'HVAC rough-in before wall close' },
  { type: 'INSULATION',        phase: 'Enclosure',        description: 'Insulation before drywall' },
  { type: 'GYPSUM_BOARD',      phase: 'Enclosure',        description: 'Drywall before taping' },
  { type: 'FINAL_ELECTRICAL',  phase: 'Final',            description: 'Electrical final — all fixtures' },
  { type: 'FINAL_PLUMBING',    phase: 'Final',            description: 'Plumbing final — all fixtures' },
  { type: 'FINAL_MECHANICAL',  phase: 'Final',            description: 'HVAC final — all equipment' },
  { type: 'FINAL_BUILDING',    phase: 'Final',            description: 'Final building inspection' },
  { type: 'CERTIFICATE_OF_OCCUPANCY', phase: 'Closeout', description: 'CO issuance inspection' },
];

const RENOVATION_INSPECTION_SEQUENCE = STANDARD_INSPECTION_SEQUENCE.filter(i =>
  ['ROUGH_FRAMING', 'ROUGH_ELECTRICAL', 'ROUGH_PLUMBING', 'ROUGH_MECHANICAL',
   'FINAL_ELECTRICAL', 'FINAL_PLUMBING', 'FINAL_MECHANICAL', 'FINAL_BUILDING'].includes(i.type)
);

// ─── InspectionCoordinator class ─────────────────────────────────────────────

export class InspectionCoordinator {

  /**
   * Determine which inspections are next for a given permit.
   * Returns a list of due inspections in construction order.
   */
  async checkInspectionsDue(permitId: string): Promise<InspectionDue[]> {
    const permit = await prisma.permit.findFirst({
      where: { id: permitId },
      include: {
        inspections: {
          select: { inspectionType: true, result: true, scheduledDate: true },
        },
      },
    });

    if (!permit) throw new Error(`Permit ${permitId} not found`);

    const completedTypes = new Set(
      permit.inspections
        .filter(i => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS')
        .map(i => i.inspectionType)
    );

    const sequence = permit.scope?.toLowerCase().includes('renovati')
      ? RENOVATION_INSPECTION_SEQUENCE
      : STANDARD_INSPECTION_SEQUENCE;

    const due: InspectionDue[] = [];
    const today = new Date();

    for (const step of sequence) {
      if (completedTypes.has(step.type as any)) continue;

      // Check if this inspection is currently scheduled but overdue
      const scheduled = permit.inspections.find(i =>
        i.inspectionType === step.type && !completedTypes.has(step.type as any)
      );

      due.push({
        inspectionType: step.type,
        description: step.description,
        phase: step.phase,
        overdue: scheduled?.scheduledDate ? scheduled.scheduledDate < today : false,
      });

      // Return only the next 3 upcoming inspections to avoid overwhelming the specialist
      if (due.length >= 3) break;
    }

    return due;
  }

  /**
   * Schedule an inspection.
   * REQUIRES a human specialistId — bot may suggest, but only specialist confirms.
   */
  async scheduleInspection(input: ScheduleInspectionInput): Promise<{ inspectionId: string }> {
    if (!input.specialistId) {
      throw new Error('specialistId is required — inspection scheduling requires human oversight');
    }

    const inspection = await prisma.inspection.create({
      data: {
        permitId: input.permitId,
        projectId: input.projectId,
        jurisdictionId: input.jurisdictionId,
        inspectionType: input.inspectionType as any,
        requestedDate: input.requestedDate,
        requestedBy: input.specialistId,
        scheduledDate: input.requestedDate,
        readyToSchedule: true,
        notes: input.notes,
        isRemote: input.isRemote ?? false,
      },
    });

    // Emit event on the permit
    await (prisma as any).permitEvent.create({
      data: {
        permitId: input.permitId,
        userId: input.specialistId,
        eventType: 'INSPECTION_SCHEDULED',
        description: `${input.inspectionType} inspection scheduled for ${input.requestedDate.toISOString().split('T')[0]}`,
        source: 'USER',
      },
    }).catch(() => null);

    return { inspectionId: inspection.id };
  }

  /**
   * Log an inspection result after the building department inspector visits.
   * REQUIRES a human specialistId — results must be recorded by a person.
   */
  async logInspectionResult(input: LogResultInput): Promise<void> {
    if (!input.specialistId) {
      throw new Error('specialistId is required — inspection results must be logged by a human specialist');
    }

    // Update the inspection record
    await prisma.inspection.update({
      where: { id: input.inspectionId },
      data: {
        result: input.result as any,
        inspectorNotes: input.notes,
        completedAt: new Date(),
        deficiencies: input.deficiencies ?? [],
        failedItems: input.deficiencies?.length ?? 0,
      },
    });

    // Create InspectionFinding records for deficiencies
    if (input.deficiencies?.length) {
      await Promise.all(
        input.deficiencies.map(d =>
          (prisma as any).inspectionFinding.create({
            data: {
              inspectionId: input.inspectionId,
              type: 'DEFICIENCY',
              severity: d.severity,
              code: d.code,
              description: d.description,
              status: 'OPEN',
            },
          }).catch(() => null)
        )
      );
    }

    // Check if all inspections for this permit have passed
    await this.checkPermitComplete(input.inspectionId);
  }

  /**
   * Check whether all required inspections have passed.
   * If so, mark permit as COMPLETED.
   */
  private async checkPermitComplete(inspectionId: string): Promise<void> {
    const inspection = await prisma.inspection.findFirst({
      where: { id: inspectionId },
      select: { permitId: true },
    });
    if (!inspection) return;

    const allInspections = await prisma.inspection.findMany({
      where: { permitId: inspection.permitId },
      select: { result: true, inspectionType: true },
    });

    const allPassed = allInspections.every(
      i => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS'
    );

    const hasFinalBuilding = allInspections.some(i => i.inspectionType === 'FINAL_BUILDING');

    if (allPassed && hasFinalBuilding) {
      await prisma.permit.update({
        where: { id: inspection.permitId },
        data: {
          kealeeStatus: 'COMPLETED',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
  }

  /** Return all inspections for a permit with their current status */
  async getInspectionsForPermit(permitId: string) {
    return prisma.inspection.findMany({
      where: { permitId },
      include: {
        inspectionAssignment: true,
      },
      orderBy: { requestedDate: 'asc' },
    });
  }
}

export const inspectionCoordinator = new InspectionCoordinator();
