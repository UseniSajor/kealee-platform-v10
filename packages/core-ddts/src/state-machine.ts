/**
 * DDTS State Machine — manages valid lifecycle phase transitions
 */

import { TwinStatus, PHASE_ORDER } from './types';

/** Valid transitions map: from → allowed destinations */
const TRANSITIONS: Record<TwinStatus, TwinStatus[]> = {
  INTAKE: ['LAND_ANALYSIS', 'FEASIBILITY', 'PRE_CONSTRUCTION', 'ARCHIVED'],
  LAND_ANALYSIS: ['FEASIBILITY', 'ARCHIVED'],
  FEASIBILITY: ['ENTITLEMENT', 'PRE_CONSTRUCTION', 'ARCHIVED'],
  ENTITLEMENT: ['PRE_CONSTRUCTION', 'FEASIBILITY', 'ARCHIVED'],
  PRE_CONSTRUCTION: ['CONSTRUCTION', 'ARCHIVED'],
  CONSTRUCTION: ['CLOSEOUT', 'ARCHIVED'],
  CLOSEOUT: ['OPERATIONS', 'ARCHIVED'],
  OPERATIONS: ['ARCHIVED'],
  ARCHIVED: [], // Terminal state
};

export class TwinStateMachine {
  /**
   * Check if a transition is valid
   */
  static isValidTransition(from: TwinStatus, to: TwinStatus): boolean {
    const allowed = TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.includes(to);
  }

  /**
   * Get allowed next states from current state
   */
  static getAllowedTransitions(current: TwinStatus): TwinStatus[] {
    return TRANSITIONS[current] ?? [];
  }

  /**
   * Validate a transition, throwing if invalid
   */
  static validateTransition(from: TwinStatus, to: TwinStatus): void {
    if (!this.isValidTransition(from, to)) {
      const allowed = this.getAllowedTransitions(from);
      throw new Error(
        `Invalid twin phase transition: ${from} → ${to}. ` +
        `Allowed transitions from ${from}: [${allowed.join(', ')}]`
      );
    }
  }

  /**
   * Get the ordinal position of a phase (for progress tracking)
   */
  static getPhaseOrdinal(status: TwinStatus): number {
    return PHASE_ORDER.indexOf(status);
  }

  /**
   * Check if one phase comes after another in the lifecycle
   */
  static isAfter(status: TwinStatus, reference: TwinStatus): boolean {
    return this.getPhaseOrdinal(status) > this.getPhaseOrdinal(reference);
  }

  /**
   * Calculate lifecycle progress as percentage (0-100)
   */
  static getLifecycleProgress(status: TwinStatus): number {
    if (status === 'ARCHIVED') return 100;
    const ordinal = this.getPhaseOrdinal(status);
    const total = PHASE_ORDER.length - 1; // Exclude ARCHIVED
    return Math.round((ordinal / total) * 100);
  }
}
