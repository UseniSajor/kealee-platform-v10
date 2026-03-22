/**
 * Generate permit path notes for a project.
 * Concept-level guidance only — not legal or code advice.
 */

import type { ConceptIntakeInput } from '../floorplan/types';

export interface PermitPathNotes {
  requiresPermit:              boolean;
  likelyPermits:               string[];
  likelyTradePermits:          string[];
  designReviewRequired:        boolean;
  historicReviewPossible:      boolean;
  hoaReviewRequired:           boolean;
  estimatedPermitTimeline:     string;
  estimatedPermitCostRange:    [number, number]; // USD
  keyConsiderations:           string[];
  disclaimerNote:              string;
}

// Permit requirements by project path
const PATH_PERMITS: Record<string, {
  requiresPermit:      boolean;
  likelyPermits:       string[];
  likelyTradePermits:  string[];
  timeline:            string;
  costRange:           [number, number];
}> = {
  kitchen_remodel: {
    requiresPermit:     true,
    likelyPermits:      ['Building Permit — Alteration'],
    likelyTradePermits: ['Electrical Permit', 'Plumbing Permit'],
    timeline:           '2–6 weeks (standard residential)',
    costRange:          [500, 1500],
  },
  bathroom_remodel: {
    requiresPermit:     true,
    likelyPermits:      ['Building Permit — Alteration'],
    likelyTradePermits: ['Electrical Permit', 'Plumbing Permit'],
    timeline:           '2–4 weeks (standard residential)',
    costRange:          [350, 1000],
  },
  interior_renovation: {
    requiresPermit:     true,
    likelyPermits:      ['Building Permit — Alteration', 'Demolition Permit (if applicable)'],
    likelyTradePermits: ['Electrical Permit', 'Mechanical Permit (if HVAC modified)'],
    timeline:           '3–8 weeks',
    costRange:          [500, 2000],
  },
  whole_home_remodel: {
    requiresPermit:     true,
    likelyPermits:      ['Building Permit — Major Alteration', 'Demolition Permit'],
    likelyTradePermits: ['Electrical Permit', 'Plumbing Permit', 'Mechanical/HVAC Permit'],
    timeline:           '4–12 weeks',
    costRange:          [1500, 5000],
  },
  addition_expansion: {
    requiresPermit:     true,
    likelyPermits:      ['Building Permit — Addition', 'Zoning/Use Permit (setback review)'],
    likelyTradePermits: ['Electrical Permit', 'Plumbing Permit', 'Mechanical Permit'],
    timeline:           '6–16 weeks',
    costRange:          [2000, 8000],
  },
  exterior_concept: {
    requiresPermit:     false,
    likelyPermits:      ['Building Permit (if structural changes)', 'Deck/Porch Permit (if applicable)'],
    likelyTradePermits: ['Electrical Permit (exterior lighting)'],
    timeline:           '1–4 weeks (if permits required)',
    costRange:          [200, 1500],
  },
};

// Jurisdiction-specific signals
function detectDesignReview(input: ConceptIntakeInput): boolean {
  const addr = (input.projectAddress + ' ' + (input.jurisdiction ?? '')).toLowerCase();
  return /historic|old town|heritage|district|conservation|landmark/i.test(addr) ||
    (input.knownConstraints ?? []).some(c => /historic|design review/i.test(c));
}

function detectHoaReview(input: ConceptIntakeInput): boolean {
  return (input.knownConstraints ?? []).some(c => /hoa|homeowners association|community rules/i.test(c));
}

function detectHistoricReview(input: ConceptIntakeInput): boolean {
  return (input.knownConstraints ?? []).some(c => /historic|landmark|heritage/i.test(c));
}

export function generatePermitPathNotes(input: ConceptIntakeInput): PermitPathNotes {
  const config = PATH_PERMITS[input.projectPath] ?? PATH_PERMITS.interior_renovation;

  const designReview  = detectDesignReview(input);
  const hoaReview     = detectHoaReview(input);
  const historicReview= detectHistoricReview(input);

  const keyConsiderations: string[] = [
    `Permit applications require stamped construction drawings from a licensed architect or engineer.`,
    `All work must comply with local building code, zoning ordinance, and energy code.`,
    `Inspections are required at rough-in and final stages for all permitted trades.`,
  ];

  if (designReview) {
    keyConsiderations.push(
      `Design review may be required by the local planning or historic preservation board — allow extra time.`,
    );
  }
  if (hoaReview) {
    keyConsiderations.push(
      `HOA approval is typically required before work begins. Submit plans to HOA board as early as possible.`,
    );
  }
  if (historicReview) {
    keyConsiderations.push(
      `Historic review may restrict material choices and exterior changes — consult with a preservation architect.`,
    );
  }
  if (input.projectPath === 'addition_expansion') {
    keyConsiderations.push(
      `Additions require zoning review for setback, lot coverage, and FAR compliance — verify before designing.`,
      `Structural engineer stamp required for foundation and framing drawings.`,
    );
  }

  return {
    requiresPermit:              config.requiresPermit,
    likelyPermits:               config.likelyPermits,
    likelyTradePermits:          config.likelyTradePermits,
    designReviewRequired:        designReview,
    historicReviewPossible:      historicReview,
    hoaReviewRequired:           hoaReview,
    estimatedPermitTimeline:     config.timeline,
    estimatedPermitCostRange:    config.costRange,
    keyConsiderations,
    disclaimerNote:
      'These are preliminary permit path notes based on typical requirements for this project type. ' +
      'Actual permit requirements vary by jurisdiction. Your architect will confirm requirements and manage submissions.',
  };
}
