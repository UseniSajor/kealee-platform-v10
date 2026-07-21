/**
 * Phase Engine
 *
 * Manages the construction project lifecycle phases:
 * PRE_DESIGN → ARCHITECT → PERMIT → PRE_CONSTRUCTION → CONSTRUCTION → CLOSEOUT
 *
 * Generates milestones for each phase transition and tracks completion.
 */

export type ProjectPhase =
  | 'PRE_DESIGN'
  | 'ARCHITECT'
  | 'PERMIT'
  | 'PRE_CONSTRUCTION'
  | 'CONSTRUCTION'
  | 'CLOSEOUT'

export const PHASE_ORDER: ProjectPhase[] = [
  'PRE_DESIGN',
  'ARCHITECT',
  'PERMIT',
  'PRE_CONSTRUCTION',
  'CONSTRUCTION',
  'CLOSEOUT',
]

export interface PhaseMilestone {
  name: string
  description: string
  phase: ProjectPhase
  required: boolean
  estimatedDaysFromPhaseStart: number
}

// Milestones per phase — used to auto-generate on phase transition
const PHASE_MILESTONES: Record<ProjectPhase, PhaseMilestone[]> = {
  PRE_DESIGN: [
    { name: 'Concept package delivered', description: 'AI or architect concept package delivered to owner', phase: 'PRE_DESIGN', required: true, estimatedDaysFromPhaseStart: 5 },
    { name: 'Owner concept approval', description: 'Owner reviews and approves concept direction', phase: 'PRE_DESIGN', required: true, estimatedDaysFromPhaseStart: 10 },
    { name: 'Budget range confirmed', description: 'Preliminary budget range agreed upon', phase: 'PRE_DESIGN', required: false, estimatedDaysFromPhaseStart: 12 },
  ],
  ARCHITECT: [
    { name: 'Architect engaged', description: 'Architect contract signed and kickoff scheduled', phase: 'ARCHITECT', required: true, estimatedDaysFromPhaseStart: 5 },
    { name: 'Schematic design complete', description: 'SD drawings reviewed and approved by owner', phase: 'ARCHITECT', required: true, estimatedDaysFromPhaseStart: 30 },
    { name: 'Design development complete', description: 'DD package ready for permit submittal', phase: 'ARCHITECT', required: true, estimatedDaysFromPhaseStart: 60 },
    { name: 'Construction documents complete', description: 'CDs stamped and ready for permit', phase: 'ARCHITECT', required: true, estimatedDaysFromPhaseStart: 90 },
  ],
  PERMIT: [
    { name: 'Permit application submitted', description: 'Application filed with local jurisdiction', phase: 'PERMIT', required: true, estimatedDaysFromPhaseStart: 3 },
    { name: 'Permit comments addressed', description: 'All review comments responded to', phase: 'PERMIT', required: false, estimatedDaysFromPhaseStart: 30 },
    { name: 'Building permit issued', description: 'Permit approved and posted at site', phase: 'PERMIT', required: true, estimatedDaysFromPhaseStart: 60 },
  ],
  PRE_CONSTRUCTION: [
    { name: 'GC selected', description: 'General contractor awarded contract', phase: 'PRE_CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 14 },
    { name: 'Subcontractors confirmed', description: 'Key subs — MEP, framing — under contract', phase: 'PRE_CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 21 },
    { name: 'Material procurement started', description: 'Long-lead items ordered', phase: 'PRE_CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 10 },
    { name: 'Site prep complete', description: 'Temporary utilities, fencing, and layout complete', phase: 'PRE_CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 25 },
    { name: 'Pre-construction meeting held', description: 'All parties aligned on schedule and logistics', phase: 'PRE_CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 28 },
  ],
  CONSTRUCTION: [
    { name: 'Foundation / demo complete', description: 'Existing structure demo or foundation poured', phase: 'CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 14 },
    { name: 'Framing complete', description: 'Structural framing passed inspection', phase: 'CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 35 },
    { name: 'MEP rough-in complete', description: 'Mechanical, electrical, plumbing rough inspections passed', phase: 'CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 55 },
    { name: 'Insulation & drywall', description: 'Insulation inspection + drywall hang and tape', phase: 'CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 70 },
    { name: 'Finishes complete', description: 'Flooring, tile, millwork, fixtures installed', phase: 'CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 100 },
    { name: 'Final inspections passed', description: 'All final inspections signed off', phase: 'CONSTRUCTION', required: true, estimatedDaysFromPhaseStart: 110 },
  ],
  CLOSEOUT: [
    { name: 'Certificate of occupancy issued', description: 'CO received from jurisdiction', phase: 'CLOSEOUT', required: true, estimatedDaysFromPhaseStart: 5 },
    { name: 'Punch list complete', description: 'All punch list items resolved', phase: 'CLOSEOUT', required: true, estimatedDaysFromPhaseStart: 15 },
    { name: 'Owner walkthrough', description: 'Final owner acceptance walkthrough completed', phase: 'CLOSEOUT', required: true, estimatedDaysFromPhaseStart: 18 },
    { name: 'Warranty documentation delivered', description: 'All warranties and as-builts handed to owner', phase: 'CLOSEOUT', required: true, estimatedDaysFromPhaseStart: 21 },
    { name: 'Final payment released', description: 'Retention and final payment processed', phase: 'CLOSEOUT', required: true, estimatedDaysFromPhaseStart: 25 },
  ],
}

// ---------------------------------------------------------------------------
// Phase engine functions
// ---------------------------------------------------------------------------

export function getNextPhase(current: ProjectPhase): ProjectPhase | null {
  const idx = PHASE_ORDER.indexOf(current)
  if (idx < 0 || idx >= PHASE_ORDER.length - 1) return null
  return PHASE_ORDER[idx + 1]
}

export function getMilestonesForPhase(phase: ProjectPhase): PhaseMilestone[] {
  return PHASE_MILESTONES[phase] ?? []
}

export function getAllPhaseMilestones(): PhaseMilestone[] {
  return PHASE_ORDER.flatMap((p) => PHASE_MILESTONES[p])
}

export function estimateCompletionDate(
  phase: ProjectPhase,
  phaseStartDate: Date,
): Date {
  const milestones = getMilestonesForPhase(phase)
  if (!milestones.length) return phaseStartDate

  const maxDays = Math.max(...milestones.map((m) => m.estimatedDaysFromPhaseStart))
  const date = new Date(phaseStartDate)
  date.setDate(date.getDate() + maxDays)
  return date
}

export function isValidPhaseTransition(from: ProjectPhase, to: ProjectPhase): boolean {
  const fromIdx = PHASE_ORDER.indexOf(from)
  const toIdx = PHASE_ORDER.indexOf(to)
  // Allow forward transitions only, and allow re-entering same phase
  return toIdx >= fromIdx
}
