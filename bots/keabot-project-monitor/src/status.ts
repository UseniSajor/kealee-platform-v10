import type { ProjectPhase } from './types.js';

const PHASE_PROGRESS: Record<ProjectPhase, number> = {
  permits_filed: 5, permits_approved: 15,
  contractor_hired: 20,
  demo_scheduled: 25, demo_in_progress: 30, demo_complete: 35,
  framing: 50, mep: 65, finishing: 80,
  inspection_scheduled: 85, inspection_passed: 90, inspection_failed: 85,
  final_walkthrough: 95, complete: 100,
};

const PHASE_LABELS: Record<ProjectPhase, string> = {
  permits_filed: 'Permits - Filed',
  permits_approved: 'Permits - Approved',
  contractor_hired: 'Contractor Hired',
  demo_scheduled: 'Demo/Prep - Scheduled',
  demo_in_progress: 'Demo/Prep - In Progress',
  demo_complete: 'Demo/Prep - Complete',
  framing: 'Construction - Framing',
  mep: 'Construction - MEP',
  finishing: 'Construction - Finishing',
  inspection_scheduled: 'Inspection - Scheduled',
  inspection_passed: 'Inspection - Passed',
  inspection_failed: 'Inspection - Failed',
  final_walkthrough: 'Final Walkthrough',
  complete: 'Complete',
};

export function getPhaseProgress(phase: ProjectPhase): number {
  return PHASE_PROGRESS[phase] ?? 0;
}

export function getPhaseLabel(phase: ProjectPhase): string {
  return PHASE_LABELS[phase] ?? phase;
}
