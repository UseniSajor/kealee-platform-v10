/**
 * APP-06: INSPECTION COORDINATOR
 * Automated inspection scheduling and tracking
 * Automation Level: 85%
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { sendEmail } from '../../../shared/integrations/email.js';
import { sendSMS } from '../../../shared/integrations/sms.js';
import { addWorkingDays, formatDate, formatDateTime, isWorkingDay, daysUntilDeadline } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('inspection-coordinator');

// ============================================================================
// TYPES
// ============================================================================

type InspectionType =
  | 'FOUNDATION'
  | 'FRAMING'
  | 'ROUGH_ELECTRICAL'
  | 'ROUGH_PLUMBING'
  | 'ROUGH_MECHANICAL'
  | 'INSULATION'
  | 'DRYWALL'
  | 'FINAL_ELECTRICAL'
  | 'FINAL_PLUMBING'
  | 'FINAL_MECHANICAL'
  | 'FIRE_SAFETY'
  | 'ACCESSIBILITY'
  | 'FINAL'
  | 'CERTIFICATE_OF_OCCUPANCY'
  | 'RE_INSPECTION';

type InspectionStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'PASSED'
  | 'FAILED'
  | 'PARTIAL'
  | 'CANCELLED'
  | 'NO_SHOW';

interface Inspection {
  id: string;
  projectId: string;
  permitId?: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate?: Date;
  scheduledTimeWindow?: string;
  inspectorName?: string;
  inspectorPhone?: string;
  confirmationNumber?: string;
  areas: string[];
  prerequisites: string[];
  notes?: string;
  result?: InspectionResult;
}

interface InspectionResult {
  passed: boolean;
  score?: number;
  findings: InspectionFinding[];
  photos?: string[];
  signedOff: boolean;
  signedOffBy?: string;
  signedOffAt?: Date;
  reInspectionRequired: boolean;
  reInspectionNotes?: string;
}

interface InspectionFinding {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'observation';
  code?: string;
  description: string;
  location: string;
  correctionRequired: boolean;
  correctedAt?: Date;
  photo?: string;
}

interface InspectionPreparation {
  inspectionId: string;
  checklist: PreparationItem[];
  readyForInspection: boolean;
  blockers: string[];
}

interface PreparationItem {
  id: string;
  task: string;
  category: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
}

// ============================================================================
// INSPECTION SERVICE
// ============================================================================

class InspectionService {
  /**
   * Get preparation checklist for inspection type
   */
  getPreparationChecklist(type: InspectionType): PreparationItem[] {
    const checklists: Record<InspectionType, PreparationItem[]> = {
      FOUNDATION: [
        { id: '1', task: 'Forms set to correct dimensions', category: 'Formwork', completed: false },
        { id: '2', task: 'Rebar placed per structural plans', category: 'Reinforcement', completed: false },
        { id: '3', task: 'Rebar tied and secured', category: 'Reinforcement', completed: false },
        { id: '4', task: 'Anchor bolts positioned correctly', category: 'Hardware', completed: false },
        { id: '5', task: 'Inspection cards and plans on site', category: 'Documentation', completed: false },
        { id: '6', task: 'Area clear and accessible', category: 'Access', completed: false },
      ],
      FRAMING: [
        { id: '1', task: 'All framing complete per plans', category: 'Structure', completed: false },
        { id: '2', task: 'Hold-downs and straps installed', category: 'Hardware', completed: false },
        { id: '3', task: 'Fire blocking installed', category: 'Fire Safety', completed: false },
        { id: '4', task: 'Shear wall nailing complete', category: 'Structure', completed: false },
        { id: '5', task: 'Window and door headers correct size', category: 'Structure', completed: false },
        { id: '6', task: 'Approved plans on site', category: 'Documentation', completed: false },
      ],
      ROUGH_ELECTRICAL: [
        { id: '1', task: 'All boxes installed and secured', category: 'Electrical', completed: false },
        { id: '2', task: 'Wiring pulled to all locations', category: 'Electrical', completed: false },
        { id: '3', task: 'Panel installed with proper clearance', category: 'Electrical', completed: false },
        { id: '4', task: 'Grounding electrode installed', category: 'Electrical', completed: false },
        { id: '5', task: 'GFCI locations identified', category: 'Electrical', completed: false },
        { id: '6', task: 'Smoke detector locations marked', category: 'Fire Safety', completed: false },
      ],
      ROUGH_PLUMBING: [
        { id: '1', task: 'All waste lines installed with proper slope', category: 'Plumbing', completed: false },
        { id: '2', task: 'Water lines pressure tested', category: 'Plumbing', completed: false },
        { id: '3', task: 'Vents extended above roof line', category: 'Plumbing', completed: false },
        { id: '4', task: 'Clean-outs accessible', category: 'Plumbing', completed: false },
        { id: '5', task: 'Water heater platform ready', category: 'Plumbing', completed: false },
      ],
      ROUGH_MECHANICAL: [
        { id: '1', task: 'Ductwork installed per plans', category: 'HVAC', completed: false },
        { id: '2', task: 'Equipment pads/platforms ready', category: 'HVAC', completed: false },
        { id: '3', task: 'Refrigerant lines in place', category: 'HVAC', completed: false },
        { id: '4', task: 'Combustion air provisions verified', category: 'HVAC', completed: false },
      ],
      INSULATION: [
        { id: '1', task: 'All insulation installed per specs', category: 'Insulation', completed: false },
        { id: '2', task: 'R-values match Title 24 requirements', category: 'Energy', completed: false },
        { id: '3', task: 'Air sealing complete', category: 'Energy', completed: false },
        { id: '4', task: 'Vapor barrier installed correctly', category: 'Insulation', completed: false },
        { id: '5', task: 'CF-6R certificates on site', category: 'Documentation', completed: false },
      ],
      DRYWALL: [
        { id: '1', task: 'All drywall hung and screwed', category: 'Drywall', completed: false },
        { id: '2', task: 'Fire-rated assemblies correct', category: 'Fire Safety', completed: false },
        { id: '3', task: 'Moisture-resistant board in wet areas', category: 'Drywall', completed: false },
      ],
      FINAL_ELECTRICAL: [
        { id: '1', task: 'All devices installed and operational', category: 'Electrical', completed: false },
        { id: '2', task: 'Panel labeled and directory complete', category: 'Electrical', completed: false },
        { id: '3', task: 'GFCI/AFCI protection verified', category: 'Electrical', completed: false },
        { id: '4', task: 'Smoke/CO detectors installed and tested', category: 'Fire Safety', completed: false },
      ],
      FINAL_PLUMBING: [
        { id: '1', task: 'All fixtures installed and operational', category: 'Plumbing', completed: false },
        { id: '2', task: 'No leaks under pressure', category: 'Plumbing', completed: false },
        { id: '3', task: 'Water heater strapped and vented', category: 'Plumbing', completed: false },
      ],
      FINAL_MECHANICAL: [
        { id: '1', task: 'HVAC system operational', category: 'HVAC', completed: false },
        { id: '2', task: 'Thermostat installed and programmed', category: 'HVAC', completed: false },
        { id: '3', task: 'Registers and returns installed', category: 'HVAC', completed: false },
      ],
      FIRE_SAFETY: [
        { id: '1', task: 'Sprinkler system tested', category: 'Fire Safety', completed: false },
        { id: '2', task: 'Fire extinguishers placed', category: 'Fire Safety', completed: false },
        { id: '3', task: 'Exit signs and emergency lights operational', category: 'Fire Safety', completed: false },
        { id: '4', task: 'Fire alarm system tested', category: 'Fire Safety', completed: false },
      ],
      ACCESSIBILITY: [
        { id: '1', task: 'Accessible route verified', category: 'ADA', completed: false },
        { id: '2', task: 'Door widths and hardware compliant', category: 'ADA', completed: false },
        { id: '3', task: 'Restroom clearances verified', category: 'ADA', completed: false },
        { id: '4', task: 'Signage installed', category: 'ADA', completed: false },
      ],
      FINAL: [
        { id: '1', task: 'All previous inspections passed', category: 'Documentation', completed: false },
        { id: '2', task: 'Exterior complete (siding, roofing)', category: 'Exterior', completed: false },
        { id: '3', task: 'Interior finishes complete', category: 'Interior', completed: false },
        { id: '4', task: 'Site work complete (grading, drainage)', category: 'Site', completed: false },
        { id: '5', task: 'Address posted and visible', category: 'Site', completed: false },
      ],
      CERTIFICATE_OF_OCCUPANCY: [
        { id: '1', task: 'All final inspections passed', category: 'Documentation', completed: false },
        { id: '2', task: 'All required certificates obtained', category: 'Documentation', completed: false },
        { id: '3', task: 'Final walk-through complete', category: 'Inspection', completed: false },
        { id: '4', task: 'Fees paid', category: 'Documentation', completed: false },
      ],
      RE_INSPECTION: [
        { id: '1', task: 'All corrections from previous inspection complete', category: 'Corrections', completed: false },
        { id: '2', task: 'Documentation of corrections ready', category: 'Documentation', completed: false },
        { id: '3', task: 'Area accessible for re-inspection', category: 'Access', completed: false },
      ],
    };

    return checklists[type] || [];
  }

  /**
   * Get typical inspection sequence for project type
   */
  getInspectionSequence(projectType: string): InspectionType[] {
    const sequences: Record<string, InspectionType[]> = {
      NEW_CONSTRUCTION: [
        'FOUNDATION',
        'FRAMING',
        'ROUGH_ELECTRICAL',
        'ROUGH_PLUMBING',
        'ROUGH_MECHANICAL',
        'INSULATION',
        'DRYWALL',
        'FINAL_ELECTRICAL',
        'FINAL_PLUMBING',
        'FINAL_MECHANICAL',
        'FINAL',
        'CERTIFICATE_OF_OCCUPANCY',
      ],
      RENOVATION: [
        'ROUGH_ELECTRICAL',
        'ROUGH_PLUMBING',
        'ROUGH_MECHANICAL',
        'INSULATION',
        'DRYWALL',
        'FINAL_ELECTRICAL',
        'FINAL_PLUMBING',
        'FINAL_MECHANICAL',
        'FINAL',
      ],
      COMMERCIAL: [
        'FOUNDATION',
        'FRAMING',
        'ROUGH_ELECTRICAL',
        'ROUGH_PLUMBING',
        'ROUGH_MECHANICAL',
        'FIRE_SAFETY',
        'INSULATION',
        'DRYWALL',
        'ACCESSIBILITY',
        'FINAL_ELECTRICAL',
        'FINAL_PLUMBING',
        'FINAL_MECHANICAL',
        'FINAL',
        'CERTIFICATE_OF_OCCUPANCY',
      ],
    };

    return sequences[projectType] || sequences.NEW_CONSTRUCTION;
  }

  /**
   * Find next available inspection slot
   */
  async findAvailableSlot(
    preferredDate: Date,
    inspectionType: InspectionType
  ): Promise<{ date: Date; timeWindow: string }> {
    // In production, this would check inspector availability via API
    // For now, find next working day
    let date = preferredDate;
    while (!isWorkingDay(date)) {
      date = addWorkingDays(date, 1);
    }

    // Assign time window based on inspection type complexity
    const complexInspections = ['FRAMING', 'FINAL', 'FIRE_SAFETY', 'CERTIFICATE_OF_OCCUPANCY'];
    const timeWindow = complexInspections.includes(inspectionType)
      ? '8:00 AM - 12:00 PM'
      : '1:00 PM - 5:00 PM';

    return { date, timeWindow };
  }

  /**
   * Check inspection readiness
   */
  async checkReadiness(inspectionId: string): Promise<InspectionPreparation> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        preparationItems: true,
      },
    });

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    const checklist = (inspection as any).preparationItems?.length > 0
      ? (inspection as any).preparationItems
      : this.getPreparationChecklist((inspection as any).type);

    const blockers = checklist
      .filter((item: PreparationItem) => !item.completed)
      .map((item: PreparationItem) => item.task);

    return {
      inspectionId,
      checklist,
      readyForInspection: blockers.length === 0,
      blockers,
    };
  }
}

const inspectionService = new InspectionService();

// ============================================================================
// WORKER
// ============================================================================

async function processInspectionJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'SCHEDULE_INSPECTION':
      return await scheduleInspection(data);

    case 'CONFIRM_INSPECTION':
      return await confirmInspection(data.inspectionId);

    case 'SEND_REMINDERS':
      return await sendInspectionReminders();

    case 'RECORD_RESULT':
      return await recordInspectionResult(data.inspectionId, data.result);

    case 'CHECK_READINESS':
      return await inspectionService.checkReadiness(data.inspectionId);

    case 'SCHEDULE_RE_INSPECTION':
      return await scheduleReInspection(data.inspectionId, data.preferredDate);

    case 'GENERATE_SEQUENCE':
      return await generateInspectionSequence(data.projectId, data.projectType);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function scheduleInspection(data: {
  projectId: string;
  permitId?: string;
  type: InspectionType;
  preferredDate: Date;
  areas?: string[];
  notes?: string;
}) {
  // Find available slot
  const slot = await inspectionService.findAvailableSlot(
    new Date(data.preferredDate),
    data.type
  );

  // Create inspection
  const inspection = await prisma.inspection.create({
    data: {
      projectId: data.projectId,
      permitId: data.permitId,
      type: data.type,
      status: 'SCHEDULED',
      scheduledDate: slot.date,
      scheduledTimeWindow: slot.timeWindow,
      areas: data.areas || [],
      prerequisites: [],
      notes: data.notes,
    } as any,
  });

  // Create preparation checklist items
  const checklist = inspectionService.getPreparationChecklist(data.type);
  for (const item of checklist) {
    await prisma.inspectionPreparationItem.create({
      data: {
        inspectionId: inspection.id,
        task: item.task,
        category: item.category,
        completed: false,
      } as any,
    });
  }

  // Emit event
  await eventBus.publish(EVENT_TYPES.INSPECTION_SCHEDULED, {
    inspectionId: inspection.id,
    projectId: data.projectId,
    type: data.type,
    scheduledDate: slot.date,
    timeWindow: slot.timeWindow,
  });

  // Notify team
  await notifyInspectionScheduled(inspection);

  return inspection;
}

async function confirmInspection(inspectionId: string) {
  const inspection = await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    } as any,
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.INSPECTION_CONFIRMED, {
    inspectionId,
    projectId: inspection.projectId,
  });

  return inspection;
}

async function sendInspectionReminders() {
  // Find inspections scheduled for tomorrow
  const tomorrow = addWorkingDays(new Date(), 1);
  const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
  const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

  const inspections = await prisma.inspection.findMany({
    where: {
      result: null, // Not yet completed
      scheduledDate: {
        gte: startOfTomorrow,
        lte: endOfTomorrow,
      },
    },
    include: {
      project: {
        include: {
          projectManagers: {
            include: { user: true },
          },
        },
      },
    },
  });

  const reminders = [];
  for (const inspection of inspections) {
    // Check readiness
    const readiness = await inspectionService.checkReadiness(inspection.id);

    if (!readiness.readyForInspection) {
      // Send warning about incomplete items
      await sendReadinessWarning(inspection as any, readiness);
    }

    // Send reminder to team
    await sendReminderNotification(inspection as any);
    reminders.push(inspection.id);
  }

  return { remindersSent: reminders.length, inspections: reminders };
}

async function recordInspectionResult(
  inspectionId: string,
  result: InspectionResult
) {
  const inspection = await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      status: result.passed ? 'PASSED' : 'FAILED',
      result: result as any,
      completedAt: new Date(),
    } as any,
    include: { project: true },
  });

  // Create findings records
  for (const finding of result.findings) {
    await prisma.inspectionFinding.create({
      data: {
        inspectionId,
        severity: finding.severity,
        code: finding.code,
        description: finding.description,
        location: finding.location,
        correctionRequired: finding.correctionRequired,
        photo: finding.photo,
      } as any,
    });
  }

  // Emit event
  await eventBus.publish(
    result.passed ? EVENT_TYPES.INSPECTION_PASSED : EVENT_TYPES.INSPECTION_FAILED,
    {
      inspectionId,
      projectId: inspection.projectId,
      type: (inspection as any).type,
      passed: result.passed,
      findingsCount: result.findings.length,
      reInspectionRequired: result.reInspectionRequired,
    }
  );

  // If failed, schedule re-inspection
  if (result.reInspectionRequired) {
    await queues.INSPECTION.add(
      'schedule-reinspection',
      {
        type: 'SCHEDULE_RE_INSPECTION',
        inspectionId,
        preferredDate: addWorkingDays(new Date(), 3),
      },
      JOB_OPTIONS.DEFAULT
    );
  }

  // Notify team of result
  await notifyInspectionResult(inspection as any, result);

  return inspection;
}

async function scheduleReInspection(
  originalInspectionId: string,
  preferredDate: Date
) {
  const original = await prisma.inspection.findUnique({
    where: { id: originalInspectionId },
  });

  if (!original) {
    throw new Error('Original inspection not found');
  }

  // Schedule re-inspection
  return await scheduleInspection({
    projectId: original.projectId,
    permitId: (original as any).permitId,
    type: 'RE_INSPECTION',
    preferredDate,
    notes: `Re-inspection for ${(original as any).type} (${originalInspectionId})`,
  });
}

async function generateInspectionSequence(
  projectId: string,
  projectType: string
) {
  const sequence = inspectionService.getInspectionSequence(projectType);

  const inspections = [];
  let currentDate = addWorkingDays(new Date(), 7); // Start 1 week from now

  for (const type of sequence) {
    // Space inspections appropriately
    const inspection = await prisma.inspection.create({
      data: {
        projectId,
        type,
        status: 'PENDING',
        areas: [],
        prerequisites: [],
      } as any,
    });

    // Create preparation items
    const checklist = inspectionService.getPreparationChecklist(type);
    for (const item of checklist) {
      await prisma.inspectionPreparationItem.create({
        data: {
          inspectionId: inspection.id,
          task: item.task,
          category: item.category,
          completed: false,
        } as any,
      });
    }

    inspections.push(inspection);
    currentDate = addWorkingDays(currentDate, 5); // Space by 5 working days
  }

  return { projectId, sequence, inspections };
}

async function notifyInspectionScheduled(inspection: any) {
  const project = await prisma.project.findUnique({
    where: { id: inspection.projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  });

  if (!project) return;

  const pmEmails = (project as any).projectManagers?.map((pm: any) => pm.user.email) || [];

  if (pmEmails.length > 0) {
    await sendEmail({
      to: pmEmails,
      subject: `Inspection Scheduled: ${inspection.type} - ${project.name}`,
      html: `
        <h2>Inspection Scheduled</h2>
        <p>An inspection has been scheduled for your project:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Project:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${project.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Inspection Type:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${inspection.type}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(inspection.scheduledDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time Window:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${inspection.scheduledTimeWindow}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          Please ensure all preparation items are completed before the inspection.
        </p>
      `,
    });
  }
}

async function sendReadinessWarning(
  inspection: any,
  readiness: InspectionPreparation
) {
  const project = await prisma.project.findUnique({
    where: { id: inspection.projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  });

  if (!project) return;

  const pmEmails = (project as any).projectManagers?.map((pm: any) => pm.user.email) || [];

  if (pmEmails.length > 0) {
    await sendEmail({
      to: pmEmails,
      subject: `⚠️ Inspection Not Ready: ${inspection.type} - ${project.name}`,
      html: `
        <h2 style="color: #d97706;">Inspection Readiness Warning</h2>
        <p>The following inspection is scheduled for tomorrow but has incomplete preparation items:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Inspection:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${inspection.type}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(inspection.scheduledDate)}</td>
          </tr>
        </table>
        <h3>Incomplete Items:</h3>
        <ul>
          ${readiness.blockers.map(b => `<li>${b}</li>`).join('')}
        </ul>
        <p style="color: #dc2626;">
          Please complete all preparation items or consider rescheduling the inspection.
        </p>
      `,
    });
  }
}

async function sendReminderNotification(inspection: any) {
  const project = await prisma.project.findUnique({
    where: { id: inspection.projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  });

  if (!project) return;

  // Send SMS to PM on record
  const primaryPM = (project as any).projectManagers?.[0];
  if (primaryPM?.user?.phone) {
    await sendSMS({
      to: primaryPM.user.phone,
      body: `REMINDER: ${inspection.type} inspection tomorrow at ${project.name}. Time: ${inspection.scheduledTimeWindow}`,
    });
  }
}

async function notifyInspectionResult(
  inspection: any,
  result: InspectionResult
) {
  const project = await prisma.project.findUnique({
    where: { id: inspection.projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  });

  if (!project) return;

  const pmEmails = (project as any).projectManagers?.map((pm: any) => pm.user.email) || [];
  const statusColor = result.passed ? '#059669' : '#dc2626';
  const statusText = result.passed ? 'PASSED' : 'FAILED';

  if (pmEmails.length > 0) {
    await sendEmail({
      to: pmEmails,
      subject: `Inspection ${statusText}: ${inspection.type} - ${project.name}`,
      html: `
        <h2 style="color: ${statusColor};">Inspection ${statusText}</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Project:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${project.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Inspection:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${inspection.type}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Result:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: ${statusColor}; font-weight: bold;">
              ${statusText}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Findings:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${result.findings.length} items</td>
          </tr>
        </table>
        ${result.findings.length > 0 ? `
          <h3>Findings:</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #ddd;">Severity</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Location</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Description</th>
            </tr>
            ${result.findings.map(f => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${f.severity.toUpperCase()}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${f.location}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${f.description}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        ${result.reInspectionRequired ? `
          <p style="margin-top: 20px; color: #d97706;">
            <strong>Re-inspection Required:</strong> ${result.reInspectionNotes || 'Please correct all findings and schedule a re-inspection.'}
          </p>
        ` : ''}
      `,
    });
  }
}

// Create worker
export const inspectionWorker = createWorker(
  QUEUE_NAMES.INSPECTION,
  processInspectionJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function inspectionRoutes(fastify: FastifyInstance) {
  /**
   * Get all inspections for a project
   */
  fastify.get('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { status } = request.query as { status?: string };

    const inspections = await prisma.inspection.findMany({
      where: {
        projectId,
        ...(status && { status }),
      },
      include: {
        findings: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return inspections;
  });

  /**
   * Get inspection by ID
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, address: true },
        },
        permit: true,
        findings: true,
        preparationItems: true,
      },
    });

    if (!inspection) {
      return reply.status(404).send({ error: 'Inspection not found' });
    }

    return inspection;
  });

  /**
   * Schedule new inspection
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      permitId?: string;
      type: InspectionType;
      preferredDate: string;
      areas?: string[];
      notes?: string;
    };

    const job = await queues.INSPECTION.add(
      'schedule-inspection',
      {
        type: 'SCHEDULE_INSPECTION',
        ...data,
        preferredDate: new Date(data.preferredDate),
      },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'scheduling' };
  });

  /**
   * Confirm inspection
   */
  fastify.post('/:id/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const inspection = await confirmInspection(id);
    return inspection;
  });

  /**
   * Record inspection result
   */
  fastify.post('/:id/result', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const result = request.body as InspectionResult;

    const job = await queues.INSPECTION.add(
      'record-result',
      { type: 'RECORD_RESULT', inspectionId: id, result },
      JOB_OPTIONS.HIGH_PRIORITY
    );

    return { jobId: job.id, status: 'recording' };
  });

  /**
   * Check inspection readiness
   */
  fastify.get('/:id/readiness', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const readiness = await inspectionService.checkReadiness(id);
    return readiness;
  });

  /**
   * Update preparation item
   */
  fastify.patch('/:inspectionId/preparation/:itemId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { inspectionId, itemId } = request.params as {
      inspectionId: string;
      itemId: string;
    };
    const { completed, notes } = request.body as {
      completed: boolean;
      notes?: string;
    };

    const item = await prisma.inspectionPreparationItem.update({
      where: { id: itemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        notes,
      } as any,
    });

    return item;
  });

  /**
   * Get preparation checklist template
   */
  fastify.get('/templates/checklist/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.params as { type: InspectionType };

    const checklist = inspectionService.getPreparationChecklist(type);
    return { type, items: checklist };
  });

  /**
   * Get inspection sequence for project type
   */
  fastify.get('/templates/sequence/:projectType', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectType } = request.params as { projectType: string };

    const sequence = inspectionService.getInspectionSequence(projectType);
    return { projectType, sequence };
  });

  /**
   * Generate inspection sequence for project
   */
  fastify.post('/projects/:projectId/generate-sequence', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { projectType } = request.body as { projectType: string };

    const job = await queues.INSPECTION.add(
      'generate-sequence',
      { type: 'GENERATE_SEQUENCE', projectId, projectType },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const tomorrow = addWorkingDays(new Date(), 1);

    const [
      scheduledToday,
      scheduledTomorrow,
      pendingResults,
      failedRecent,
    ] = await Promise.all([
      prisma.inspection.count({
        where: {
          result: null,
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.inspection.count({
        where: {
          result: null,
          scheduledDate: {
            gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
            lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.inspection.count({
        where: { result: null, scheduledDate: { lte: new Date() } },
      }),
      prisma.inspection.count({
        where: {
          result: 'FAIL',
          completedAt: { gte: addWorkingDays(new Date(), -7) },
        },
      }),
    ]);

    return {
      scheduledToday,
      scheduledTomorrow,
      pendingResults,
      failedRecent,
    };
  });
}
