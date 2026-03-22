/**
 * Generate rough scope direction and trade-by-trade cost ranges.
 * Concept-level only — not an estimate or bid.
 */

import type { ConceptIntakeInput } from '../floorplan/types';

export interface ScopeLineItem {
  trade:                  string;
  description:            string;
  estimatedCostRange:     [number, number]; // USD
  priority:               'required' | 'recommended' | 'optional';
  notes?:                 string;
}

export interface ScopeDirection {
  projectPath:          string;
  totalEstimatedMin:    number;
  totalEstimatedMax:    number;
  scopeItems:           ScopeLineItem[];
  exclusions:           string[];
  assumptions:          string[];
  budgetFitNote:        string;
}

const SCOPE_BY_PATH: Record<string, ScopeLineItem[]> = {
  kitchen_remodel: [
    { trade: 'Demolition',    description: 'Remove existing cabinets, countertops, flooring',      estimatedCostRange: [2000, 5000],   priority: 'required' },
    { trade: 'Carpentry',     description: 'New semi-custom or custom cabinetry',                   estimatedCostRange: [8000, 25000],  priority: 'required' },
    { trade: 'Countertops',   description: 'Quartz, granite, or quartzite surfaces',                estimatedCostRange: [3000, 12000],  priority: 'required' },
    { trade: 'Plumbing',      description: 'Sink, faucet, dishwasher rough-in and finish',          estimatedCostRange: [1500, 4000],   priority: 'required' },
    { trade: 'Electrical',    description: 'Outlets, under-cabinet lighting, appliance circuits',   estimatedCostRange: [2000, 5000],   priority: 'required' },
    { trade: 'Flooring',      description: 'Hardwood, tile, or LVP',                               estimatedCostRange: [3000, 9000],   priority: 'required' },
    { trade: 'Paint & Finish',description: 'Walls, ceiling, trim painting',                         estimatedCostRange: [800,  2000],   priority: 'required' },
    { trade: 'Appliances',    description: 'Range, hood, refrigerator, dishwasher',                estimatedCostRange: [4000, 15000],  priority: 'required',  notes: 'Owner-furnished or contractor-supplied' },
    { trade: 'Backsplash',    description: 'Tile backsplash installation',                         estimatedCostRange: [1200, 4000],   priority: 'recommended' },
    { trade: 'Island',        description: 'Kitchen island with seating',                          estimatedCostRange: [2000, 8000],   priority: 'optional' },
  ],
  bathroom_remodel: [
    { trade: 'Demolition',    description: 'Remove existing tile, fixtures, vanity',               estimatedCostRange: [1500, 3500],   priority: 'required' },
    { trade: 'Plumbing',      description: 'Rough and finish plumbing, fixtures',                  estimatedCostRange: [3000, 8000],   priority: 'required' },
    { trade: 'Tile',          description: 'Shower surround, tub surround, floor tile',            estimatedCostRange: [3000, 10000],  priority: 'required' },
    { trade: 'Vanity',        description: 'Vanity, medicine cabinet, mirrors',                    estimatedCostRange: [1500, 6000],   priority: 'required' },
    { trade: 'Electrical',    description: 'Exhaust fan, lighting, GFCI outlets',                  estimatedCostRange: [800,  2000],   priority: 'required' },
    { trade: 'Paint & Finish',description: 'Moisture-resistant paint, caulking',                   estimatedCostRange: [500,  1200],   priority: 'required' },
    { trade: 'Glass & Hardware',description:'Frameless shower door, towel bars, accessories',      estimatedCostRange: [800,  3000],   priority: 'recommended' },
    { trade: 'Soaking Tub',   description: 'Freestanding or alcove soaking tub',                  estimatedCostRange: [1500, 6000],   priority: 'optional' },
  ],
  interior_renovation: [
    { trade: 'Demolition',    description: 'Selective demolition — walls, flooring, fixtures',     estimatedCostRange: [3000, 10000],  priority: 'required' },
    { trade: 'Structural',    description: 'Beam and header work if walls removed',                estimatedCostRange: [2000, 12000],  priority: 'recommended', notes: 'Requires engineer' },
    { trade: 'Drywall',       description: 'New drywall, taping, skim coat',                       estimatedCostRange: [4000, 12000],  priority: 'required' },
    { trade: 'Flooring',      description: 'Hardwood, LVP, or tile throughout',                    estimatedCostRange: [8000, 25000],  priority: 'required' },
    { trade: 'Paint & Finish',description: 'Full interior paint',                                   estimatedCostRange: [3000, 8000],   priority: 'required' },
    { trade: 'Trim & Millwork',description:'Baseboards, casing, crown molding',                     estimatedCostRange: [2000, 8000],   priority: 'recommended' },
    { trade: 'Electrical',    description: 'Updated outlets, lighting, panel work if needed',      estimatedCostRange: [3000, 10000],  priority: 'recommended' },
    { trade: 'HVAC',          description: 'Ductwork modifications, balancing',                    estimatedCostRange: [2000, 8000],   priority: 'optional' },
  ],
  whole_home_remodel: [
    { trade: 'Demolition',    description: 'Full or selective interior demolition',                estimatedCostRange: [8000, 25000],  priority: 'required' },
    { trade: 'Structural',    description: 'Framing, beams, LVL headers',                          estimatedCostRange: [5000, 20000],  priority: 'required', notes: 'Requires engineer' },
    { trade: 'Plumbing',      description: 'Full rough and finish plumbing',                       estimatedCostRange: [15000, 40000], priority: 'required' },
    { trade: 'Electrical',    description: 'Full electrical update + panel upgrade',               estimatedCostRange: [12000, 30000], priority: 'required' },
    { trade: 'HVAC',          description: 'Ductwork, equipment, controls, zoning',               estimatedCostRange: [10000, 25000], priority: 'required' },
    { trade: 'Insulation',    description: 'Blown-in, batt, or spray foam per energy code',       estimatedCostRange: [4000, 12000],  priority: 'required' },
    { trade: 'Drywall',       description: 'Full interior drywall and finishing',                  estimatedCostRange: [12000, 30000], priority: 'required' },
    { trade: 'Flooring',      description: 'Full interior flooring — all rooms',                  estimatedCostRange: [15000, 40000], priority: 'required' },
    { trade: 'Kitchen',       description: 'Full kitchen renovation',                              estimatedCostRange: [25000, 75000], priority: 'required' },
    { trade: 'Bathrooms',     description: 'All bathroom renovations',                             estimatedCostRange: [15000, 50000], priority: 'required' },
    { trade: 'Paint & Finish',description: 'Full interior paint and finish',                       estimatedCostRange: [6000, 15000],  priority: 'required' },
    { trade: 'Millwork',      description: 'Interior doors, trim, built-ins',                      estimatedCostRange: [8000, 25000],  priority: 'recommended' },
  ],
  addition_expansion: [
    { trade: 'Site Prep',     description: 'Excavation, grading, utility stub-outs',              estimatedCostRange: [5000, 15000],  priority: 'required' },
    { trade: 'Foundation',    description: 'Concrete foundation and footings',                     estimatedCostRange: [8000, 25000],  priority: 'required', notes: 'Requires structural engineer' },
    { trade: 'Framing',       description: 'Wood frame construction and roof tie-in',              estimatedCostRange: [20000, 50000], priority: 'required' },
    { trade: 'Roofing',       description: 'New roofing and connection to existing',               estimatedCostRange: [8000, 20000],  priority: 'required' },
    { trade: 'Windows & Doors',description:'Exterior windows and exterior doors',                  estimatedCostRange: [5000, 15000],  priority: 'required' },
    { trade: 'Exterior',      description: 'Siding, flashing, weather barrier',                    estimatedCostRange: [6000, 18000],  priority: 'required' },
    { trade: 'Plumbing',      description: 'Extension of existing plumbing if needed',             estimatedCostRange: [5000, 12000],  priority: 'recommended' },
    { trade: 'Electrical',    description: 'Extension of electrical service to addition',          estimatedCostRange: [4000, 10000],  priority: 'required' },
    { trade: 'Interior Finish',description:'Drywall, flooring, paint, trim',                       estimatedCostRange: [15000, 40000], priority: 'required' },
  ],
  exterior_concept: [
    { trade: 'Landscaping',   description: 'New plantings, lawn restoration, grading',            estimatedCostRange: [5000, 20000],  priority: 'required' },
    { trade: 'Hardscape',     description: 'Driveway, front walk, patios, retaining walls',       estimatedCostRange: [8000, 30000],  priority: 'recommended' },
    { trade: 'Facade',        description: 'Siding, paint or cladding, trim, shutters',           estimatedCostRange: [8000, 25000],  priority: 'required' },
    { trade: 'Roofing',       description: 'New roofing if life expectancy is low',               estimatedCostRange: [10000, 30000], priority: 'optional', notes: 'Inspect existing condition' },
    { trade: 'Lighting',      description: 'Exterior sconces, pathway lights, uplighting',        estimatedCostRange: [2000, 8000],   priority: 'recommended' },
    { trade: 'Deck / Porch',  description: 'New or rebuilt deck or covered porch',                estimatedCostRange: [10000, 35000], priority: 'optional' },
    { trade: 'Irrigation',    description: 'In-ground irrigation system',                          estimatedCostRange: [3000, 10000],  priority: 'optional' },
    { trade: 'Fence / Gate',  description: 'Privacy fence or decorative gate',                    estimatedCostRange: [2000, 8000],   priority: 'optional' },
  ],
};

const BUDGET_BRACKET_RANGE: Record<string, [number, number]> = {
  under_10k:   [5000,   10000],
  '10k_25k':   [10000,  25000],
  '25k_50k':   [25000,  50000],
  '50k_100k':  [50000,  100000],
  '100k_plus': [100000, 300000],
};

export function generateScopeDirection(input: ConceptIntakeInput): ScopeDirection {
  const items = SCOPE_BY_PATH[input.projectPath] ?? [];

  const totalMin = items.filter(i => i.priority === 'required').reduce((s, i) => s + i.estimatedCostRange[0], 0);
  const totalMax = items.reduce((s, i) => s + i.estimatedCostRange[1], 0);

  const [budgetMin, budgetMax] = BUDGET_BRACKET_RANGE[input.budgetRange] ?? [0, 0];

  let budgetFitNote: string;
  if (totalMin > budgetMax * 1.2) {
    budgetFitNote =
      `The scope indicated by this project path typically runs $${(totalMin / 1000).toFixed(0)}K–$${(totalMax / 1000).toFixed(0)}K. ` +
      `Your stated budget of $${(budgetMin / 1000).toFixed(0)}K–$${(budgetMax / 1000).toFixed(0)}K may require phasing or scope reduction — ` +
      `architect review is strongly recommended to align scope with budget before proceeding.`;
  } else if (totalMin <= budgetMax) {
    budgetFitNote =
      `The required scope items are likely achievable within your stated budget range. ` +
      `Optional and recommended items can be prioritized with your architect based on value and impact.`;
  } else {
    budgetFitNote =
      `Your budget is in range for the required scope with careful contractor selection. ` +
      `Architect-led procurement and value engineering will be important to stay on target.`;
  }

  return {
    projectPath:       input.projectPath,
    totalEstimatedMin: totalMin,
    totalEstimatedMax: totalMax,
    scopeItems:        items,
    exclusions: [
      'Permit fees (jurisdiction-dependent)',
      'Architectural and engineering fees',
      'Furniture and décor',
      'Specialty equipment (home automation, AV)',
      'Unknown existing conditions (mold, asbestos, structural)',
    ],
    assumptions: [
      'Standard residential construction market rates',
      'No hazardous material remediation required',
      'Existing rough-in locations reused where possible',
      'All work subject to local code compliance',
    ],
    budgetFitNote,
  };
}
