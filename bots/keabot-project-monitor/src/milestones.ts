import type { Milestone } from './types.js';

export function buildMilestones(totalAmount: number): Milestone[] {
  return [
    { name: 'Permits', trigger: 'permit_approved', amount: totalAmount * 0.10, percentage: 10, paid: false },
    { name: 'Demo', trigger: 'demo_complete', amount: totalAmount * 0.20, percentage: 20, paid: false },
    { name: 'Framing', trigger: 'framing_complete', amount: totalAmount * 0.30, percentage: 30, paid: false },
    { name: 'Final', trigger: 'final_inspection_passed', amount: totalAmount * 0.40, percentage: 40, paid: false },
  ];
}

export function getNextMilestone(milestones: Milestone[]): Milestone | null {
  return milestones.find(m => !m.paid) ?? null;
}

export function getMilestoneByTrigger(milestones: Milestone[], trigger: string): Milestone | null {
  return milestones.find(m => m.trigger === trigger) ?? null;
}
