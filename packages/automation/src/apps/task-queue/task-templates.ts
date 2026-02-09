/**
 * Task templates organized by project type and phase.
 *
 * Each template maps to a Task record created when a project is activated.
 * Phases align with the ProjectPhaseType enum in the Prisma schema.
 */

export type ProjectType = 'NEW_CONSTRUCTION' | 'RENOVATION' | 'ADDITION' | 'MAINTENANCE';

export interface TaskTemplate {
  title: string;
  description: string;
  phase: string; // Maps to ProjectPhaseType enum values
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedDays: number;
  /** Titles of tasks this one depends on (must complete first). */
  dependsOn?: string[];
  subtasks?: Array<{
    title: string;
    description: string;
    estimatedDays: number;
  }>;
}

// ---------------------------------------------------------------------------
// NEW_CONSTRUCTION — ~60 tasks across 8 phases
// ---------------------------------------------------------------------------

const NEW_CONSTRUCTION_TASKS: TaskTemplate[] = [
  // Phase 1: PRE_CONSTRUCTION
  {
    title: 'Review architectural plans and specifications',
    description: 'Review all architectural and engineering drawings for completeness and constructability.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Obtain building permits',
    description: 'Submit permit applications to local jurisdiction and track approval.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'URGENT',
    estimatedDays: 14,
    subtasks: [
      { title: 'Prepare permit application package', description: 'Compile plans, forms, and fees.', estimatedDays: 3 },
      { title: 'Submit to building department', description: 'Submit application and pay fees.', estimatedDays: 1 },
      { title: 'Respond to plan review comments', description: 'Address reviewer corrections.', estimatedDays: 5 },
    ],
  },
  {
    title: 'Finalize subcontractor agreements',
    description: 'Execute contracts with all subcontractors and verify insurance/licenses.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 7,
  },
  {
    title: 'Schedule pre-construction meeting',
    description: 'Coordinate kickoff meeting with owner, architect, and key subs.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 3,
  },
  {
    title: 'Order long-lead materials',
    description: 'Identify and order materials with extended lead times (steel, windows, specialty items).',
    phase: 'PRE_CONSTRUCTION',
    priority: 'URGENT',
    estimatedDays: 5,
  },
  {
    title: 'Establish site logistics plan',
    description: 'Plan material staging, equipment access, parking, and temporary facilities.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'NORMAL',
    estimatedDays: 3,
  },
  {
    title: 'Set up project documentation system',
    description: 'Configure document management, RFI tracking, and submittal logs.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'NORMAL',
    estimatedDays: 2,
  },
  {
    title: 'Verify utility connections and easements',
    description: 'Confirm water, sewer, electric, gas availability and locate easements.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 5,
  },

  // Phase 2: SITE_PREPARATION
  {
    title: 'Mobilize site and install temporary facilities',
    description: 'Set up construction fencing, portable toilets, dumpsters, and temporary power.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 3,
  },
  {
    title: 'Clear and grade site',
    description: 'Remove vegetation, debris, and grade site to plan elevations.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Mobilize site and install temporary facilities'],
  },
  {
    title: 'Install erosion control measures',
    description: 'Place silt fencing, inlet protection, and stabilization measures per SWPPP.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Excavate for utilities',
    description: 'Trench and install underground water, sewer, storm, and electrical lines.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 7,
    dependsOn: ['Clear and grade site'],
  },
  {
    title: 'Compact subgrade and place aggregate base',
    description: 'Proof roll and compact subgrade. Place and compact base materials.',
    phase: 'SITE_PREPARATION',
    priority: 'NORMAL',
    estimatedDays: 4,
    dependsOn: ['Excavate for utilities'],
  },
  {
    title: 'Schedule footing inspection',
    description: 'Request pre-pour footing inspection from building department.',
    phase: 'SITE_PREPARATION',
    priority: 'NORMAL',
    estimatedDays: 2,
  },

  // Phase 3: FOUNDATION
  {
    title: 'Excavate foundation',
    description: 'Excavate to design depth and verify bearing capacity.',
    phase: 'FOUNDATION',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Form and pour footings',
    description: 'Set footing forms, place rebar, and pour concrete footings.',
    phase: 'FOUNDATION',
    priority: 'HIGH',
    estimatedDays: 4,
    dependsOn: ['Excavate foundation'],
  },
  {
    title: 'Install foundation walls',
    description: 'Form, reinforce, and pour foundation walls. Strip forms after cure.',
    phase: 'FOUNDATION',
    priority: 'HIGH',
    estimatedDays: 7,
    dependsOn: ['Form and pour footings'],
  },
  {
    title: 'Waterproof foundation',
    description: 'Apply waterproofing membrane and install drain tile system.',
    phase: 'FOUNDATION',
    priority: 'NORMAL',
    estimatedDays: 3,
    dependsOn: ['Install foundation walls'],
  },
  {
    title: 'Backfill foundation',
    description: 'Backfill around foundation walls in lifts with compaction.',
    phase: 'FOUNDATION',
    priority: 'NORMAL',
    estimatedDays: 3,
    dependsOn: ['Waterproof foundation'],
  },
  {
    title: 'Pour slab on grade',
    description: 'Place vapor barrier, insulation, rebar, and pour concrete slab.',
    phase: 'FOUNDATION',
    priority: 'HIGH',
    estimatedDays: 4,
    dependsOn: ['Install foundation walls'],
  },
  {
    title: 'Schedule foundation inspection',
    description: 'Request foundation inspection from building department.',
    phase: 'FOUNDATION',
    priority: 'URGENT',
    estimatedDays: 2,
    dependsOn: ['Pour slab on grade'],
  },

  // Phase 4: FRAMING
  {
    title: 'Deliver and stage framing lumber',
    description: 'Receive lumber delivery and organize on site for framing sequence.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Frame first floor walls',
    description: 'Layout, cut, and erect first floor wall framing per plans.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 7,
    dependsOn: ['Deliver and stage framing lumber'],
  },
  {
    title: 'Frame second floor and roof structure',
    description: 'Install floor joists/trusses, upper walls, and roof trusses/rafters.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 10,
    dependsOn: ['Frame first floor walls'],
  },
  {
    title: 'Install sheathing and house wrap',
    description: 'Apply wall sheathing, roof decking, and weather-resistive barrier.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Frame second floor and roof structure'],
  },
  {
    title: 'Install windows and exterior doors',
    description: 'Set and flash windows and exterior doors per manufacturer specs.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 4,
    dependsOn: ['Install sheathing and house wrap'],
  },
  {
    title: 'Schedule framing inspection',
    description: 'Request framing and nailing inspection from building department.',
    phase: 'FRAMING',
    priority: 'URGENT',
    estimatedDays: 2,
    dependsOn: ['Install windows and exterior doors'],
  },

  // Phase 5: ROUGH_IN
  {
    title: 'Rough-in plumbing',
    description: 'Install supply lines, drain-waste-vent piping, and tub/shower valves.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 7,
  },
  {
    title: 'Rough-in electrical',
    description: 'Run wiring, install boxes, panel, and circuits per electrical plan.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 7,
  },
  {
    title: 'Rough-in HVAC',
    description: 'Install ductwork, set equipment, run refrigerant and condensate lines.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 7,
  },
  {
    title: 'Install fire suppression system',
    description: 'Install sprinkler heads, piping, and fire alarm wiring if required.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Schedule rough-in inspections',
    description: 'Request plumbing, electrical, HVAC, and fire inspections.',
    phase: 'ROUGH_IN',
    priority: 'URGENT',
    estimatedDays: 3,
    dependsOn: ['Rough-in plumbing', 'Rough-in electrical', 'Rough-in HVAC'],
  },

  // Phase 6: INSULATION + DRYWALL (combined)
  {
    title: 'Install insulation',
    description: 'Install wall, ceiling, and floor insulation to specified R-values.',
    phase: 'INSULATION',
    priority: 'HIGH',
    estimatedDays: 4,
  },
  {
    title: 'Schedule insulation inspection',
    description: 'Request insulation and energy code inspection.',
    phase: 'INSULATION',
    priority: 'URGENT',
    estimatedDays: 2,
    dependsOn: ['Install insulation'],
  },
  {
    title: 'Hang and finish drywall',
    description: 'Hang drywall, tape, mud, and sand to Level 4 finish.',
    phase: 'DRYWALL',
    priority: 'HIGH',
    estimatedDays: 10,
  },
  {
    title: 'Prime and paint interior',
    description: 'Prime all drywall surfaces and apply finish coats per color schedule.',
    phase: 'DRYWALL',
    priority: 'NORMAL',
    estimatedDays: 7,
    dependsOn: ['Hang and finish drywall'],
  },

  // Phase 7: EXTERIOR + INTERIOR_FINISHES
  {
    title: 'Install roofing',
    description: 'Install underlayment, flashing, and roofing material (shingles/metal/tile).',
    phase: 'EXTERIOR',
    priority: 'URGENT',
    estimatedDays: 5,
  },
  {
    title: 'Install exterior siding and trim',
    description: 'Apply siding, corner boards, fascia, and soffit per architectural plans.',
    phase: 'EXTERIOR',
    priority: 'HIGH',
    estimatedDays: 10,
  },
  {
    title: 'Complete exterior flatwork',
    description: 'Pour driveways, sidewalks, patios, and steps.',
    phase: 'EXTERIOR',
    priority: 'NORMAL',
    estimatedDays: 5,
  },
  {
    title: 'Landscape and grade final',
    description: 'Final grading, topsoil, sod/seed, plantings, and irrigation.',
    phase: 'EXTERIOR',
    priority: 'NORMAL',
    estimatedDays: 5,
  },
  {
    title: 'Install cabinets and countertops',
    description: 'Set kitchen and bath cabinets, templated and install countertops.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Install flooring',
    description: 'Install tile, hardwood, LVP, and carpet per finish schedule.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 7,
  },
  {
    title: 'Install interior trim and doors',
    description: 'Install baseboard, casing, crown molding, and interior doors.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 7,
  },
  {
    title: 'Install fixtures and appliances',
    description: 'Set plumbing fixtures, lighting fixtures, and kitchen appliances.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 4,
  },

  // Phase 8: MEP_FINISH + FINAL_INSPECTION + CLOSEOUT
  {
    title: 'Complete MEP finish work',
    description: 'Install outlets/switches/plates, connect fixtures, start up HVAC, test all systems.',
    phase: 'MEP_FINISH',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Commission mechanical systems',
    description: 'Test and balance HVAC, verify plumbing pressure, test electrical circuits.',
    phase: 'MEP_FINISH',
    priority: 'HIGH',
    estimatedDays: 3,
    dependsOn: ['Complete MEP finish work'],
  },
  {
    title: 'Conduct punch list walkthrough',
    description: 'Walk entire project with owner/architect and document all punch items.',
    phase: 'FINAL_INSPECTION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Complete punch list items',
    description: 'Address and resolve all punch list items documented during walkthrough.',
    phase: 'FINAL_INSPECTION',
    priority: 'HIGH',
    estimatedDays: 7,
    dependsOn: ['Conduct punch list walkthrough'],
  },
  {
    title: 'Schedule final building inspection',
    description: 'Request certificate of occupancy inspection from building department.',
    phase: 'FINAL_INSPECTION',
    priority: 'URGENT',
    estimatedDays: 3,
    dependsOn: ['Complete punch list items'],
  },
  {
    title: 'Obtain certificate of occupancy',
    description: 'Receive CO from jurisdiction after passing final inspection.',
    phase: 'FINAL_INSPECTION',
    priority: 'URGENT',
    estimatedDays: 5,
    dependsOn: ['Schedule final building inspection'],
  },
  {
    title: 'Compile closeout documents',
    description: 'Gather warranties, as-builts, O&M manuals, and lien waivers.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Final owner walkthrough and handover',
    description: 'Demonstrate systems to owner, hand over keys and documentation.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 2,
    dependsOn: ['Compile closeout documents', 'Obtain certificate of occupancy'],
  },
  {
    title: 'Process final payment and retainage',
    description: 'Submit final pay application and coordinate retainage release.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 7,
    dependsOn: ['Final owner walkthrough and handover'],
  },
];

// ---------------------------------------------------------------------------
// RENOVATION — ~40 tasks across 6 phases
// ---------------------------------------------------------------------------

const RENOVATION_TASKS: TaskTemplate[] = [
  // Phase 1: PRE_CONSTRUCTION
  {
    title: 'Review project scope and plans',
    description: 'Review renovation scope, drawings, and existing conditions assessment.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 3,
  },
  {
    title: 'Verify permits and approvals',
    description: 'Confirm required permits for renovation scope and submit applications.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'URGENT',
    estimatedDays: 10,
  },
  {
    title: 'Schedule pre-construction meeting',
    description: 'Coordinate kickoff meeting with owner and key trades.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Finalize subcontractor agreements',
    description: 'Execute contracts with subs. Verify insurance and licenses.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Order long-lead materials',
    description: 'Order specialty items, custom cabinets, fixtures with extended lead times.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'URGENT',
    estimatedDays: 3,
  },
  {
    title: 'Conduct hazardous materials survey',
    description: 'Test for asbestos, lead paint, and other hazardous materials in existing structure.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'URGENT',
    estimatedDays: 5,
  },

  // Phase 2: SITE_PREPARATION (Demolition)
  {
    title: 'Obtain demolition permit',
    description: 'Submit and obtain demolition permit for scope of removal.',
    phase: 'SITE_PREPARATION',
    priority: 'URGENT',
    estimatedDays: 7,
  },
  {
    title: 'Set up site protection',
    description: 'Install dust barriers, floor protection, and HVAC covers for occupied areas.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Disconnect and cap existing utilities',
    description: 'Safely disconnect plumbing, electrical, and HVAC in demo area.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Execute selective demolition',
    description: 'Remove walls, fixtures, flooring, and other elements per plans.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Set up site protection', 'Disconnect and cap existing utilities'],
  },
  {
    title: 'Debris removal and disposal',
    description: 'Remove all demolition debris and dispose per regulations.',
    phase: 'SITE_PREPARATION',
    priority: 'NORMAL',
    estimatedDays: 3,
    dependsOn: ['Execute selective demolition'],
  },
  {
    title: 'Inspect structural elements',
    description: 'Evaluate exposed structural elements for condition and load capacity.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 2,
    dependsOn: ['Execute selective demolition'],
  },

  // Phase 3: FRAMING (Structural modifications)
  {
    title: 'Install temporary shoring',
    description: 'Shore existing structure as needed for structural modifications.',
    phase: 'FRAMING',
    priority: 'URGENT',
    estimatedDays: 3,
  },
  {
    title: 'Frame new walls and openings',
    description: 'Construct new partition walls, headers, and structural modifications.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Install temporary shoring'],
  },
  {
    title: 'Install structural reinforcement',
    description: 'Add beams, columns, or sistered joists per structural engineer plans.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 4,
  },
  {
    title: 'Schedule framing inspection',
    description: 'Request structural/framing inspection from building department.',
    phase: 'FRAMING',
    priority: 'URGENT',
    estimatedDays: 2,
    dependsOn: ['Frame new walls and openings'],
  },

  // Phase 4: ROUGH_IN
  {
    title: 'Rough-in plumbing modifications',
    description: 'Reroute and extend plumbing supply and drain lines.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Rough-in electrical modifications',
    description: 'Add circuits, relocate panels, and run new wiring.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Rough-in HVAC modifications',
    description: 'Modify ductwork, add zones, and update equipment as needed.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 4,
  },
  {
    title: 'Schedule rough-in inspections',
    description: 'Request plumbing, electrical, and HVAC rough inspections.',
    phase: 'ROUGH_IN',
    priority: 'URGENT',
    estimatedDays: 3,
    dependsOn: ['Rough-in plumbing modifications', 'Rough-in electrical modifications', 'Rough-in HVAC modifications'],
  },

  // Phase 5: INTERIOR_FINISHES
  {
    title: 'Install insulation in new/modified walls',
    description: 'Insulate new walls and any opened cavities.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Hang and finish drywall',
    description: 'Hang, tape, and finish drywall. Patch and blend with existing surfaces.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 7,
    dependsOn: ['Install insulation in new/modified walls'],
  },
  {
    title: 'Prime and paint',
    description: 'Prime new surfaces and paint to match or update existing finishes.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 5,
    dependsOn: ['Hang and finish drywall'],
  },
  {
    title: 'Install cabinets and countertops',
    description: 'Set cabinets, template and install countertops.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Install flooring',
    description: 'Install new flooring materials and transition strips.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Install trim, doors, and hardware',
    description: 'Install baseboard, casing, doors, and finish hardware.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 4,
  },
  {
    title: 'Install fixtures and appliances',
    description: 'Set plumbing fixtures, light fixtures, switches, and appliances.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 3,
  },

  // Phase 6: FINAL_INSPECTION + CLOSEOUT
  {
    title: 'Conduct punch list walkthrough',
    description: 'Walk project with owner and document remaining items.',
    phase: 'FINAL_INSPECTION',
    priority: 'HIGH',
    estimatedDays: 1,
  },
  {
    title: 'Complete punch list items',
    description: 'Address all punch list items from walkthrough.',
    phase: 'FINAL_INSPECTION',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Conduct punch list walkthrough'],
  },
  {
    title: 'Schedule final inspection',
    description: 'Request final building inspection and certificate of occupancy.',
    phase: 'FINAL_INSPECTION',
    priority: 'URGENT',
    estimatedDays: 3,
    dependsOn: ['Complete punch list items'],
  },
  {
    title: 'Final cleanup and owner walkthrough',
    description: 'Deep clean, demonstrate systems, hand over documentation.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Process final payment',
    description: 'Submit final pay application and release retainage.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Final cleanup and owner walkthrough'],
  },
];

// ---------------------------------------------------------------------------
// ADDITION — ~45 tasks across 7 phases
// ---------------------------------------------------------------------------

const ADDITION_TASKS: TaskTemplate[] = [
  // Phase 1: PRE_CONSTRUCTION
  {
    title: 'Review addition plans and tie-in details',
    description: 'Review architectural plans focusing on connection to existing structure.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 4,
  },
  {
    title: 'Obtain building permits',
    description: 'Submit permit applications for addition scope.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'URGENT',
    estimatedDays: 14,
  },
  {
    title: 'Finalize subcontractor agreements',
    description: 'Execute contracts with all trades for addition work.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Order long-lead materials',
    description: 'Order windows, doors, roofing, and specialty items.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'URGENT',
    estimatedDays: 5,
  },
  {
    title: 'Plan existing structure protection',
    description: 'Develop plan to protect occupied areas during construction.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Survey and mark addition footprint',
    description: 'Stake out addition location and verify setbacks and property lines.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 2,
  },

  // Phase 2: SITE_PREPARATION
  {
    title: 'Set up site access and protection',
    description: 'Install fencing, dust barriers, and protect existing landscaping.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Excavate addition footprint',
    description: 'Clear area and excavate to required depth for foundation.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 4,
    dependsOn: ['Set up site access and protection'],
  },
  {
    title: 'Install underground utilities',
    description: 'Extend water, sewer, and electrical to addition location.',
    phase: 'SITE_PREPARATION',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Excavate addition footprint'],
  },

  // Phase 3: FOUNDATION
  {
    title: 'Form and pour addition footings',
    description: 'Set forms, place rebar, and pour footings with dowels to existing.',
    phase: 'FOUNDATION',
    priority: 'HIGH',
    estimatedDays: 4,
  },
  {
    title: 'Install foundation walls',
    description: 'Form, reinforce, and pour addition foundation walls.',
    phase: 'FOUNDATION',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Form and pour addition footings'],
  },
  {
    title: 'Waterproof and backfill',
    description: 'Apply waterproofing, install drain tile, and backfill.',
    phase: 'FOUNDATION',
    priority: 'NORMAL',
    estimatedDays: 3,
    dependsOn: ['Install foundation walls'],
  },
  {
    title: 'Pour slab for addition',
    description: 'Place vapor barrier, insulation, rebar, and pour slab.',
    phase: 'FOUNDATION',
    priority: 'HIGH',
    estimatedDays: 3,
    dependsOn: ['Install foundation walls'],
  },
  {
    title: 'Schedule foundation inspection',
    description: 'Request foundation inspection before backfill.',
    phase: 'FOUNDATION',
    priority: 'URGENT',
    estimatedDays: 2,
  },

  // Phase 4: FRAMING
  {
    title: 'Frame addition walls',
    description: 'Erect wall framing for addition per structural plans.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Frame roof and tie into existing',
    description: 'Install roof structure and integrate with existing roof system.',
    phase: 'FRAMING',
    priority: 'URGENT',
    estimatedDays: 7,
    dependsOn: ['Frame addition walls'],
  },
  {
    title: 'Open wall between existing and addition',
    description: 'Remove existing exterior wall and install headers for the connection.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 3,
    dependsOn: ['Frame roof and tie into existing'],
  },
  {
    title: 'Install sheathing and weather barrier',
    description: 'Sheath walls and roof, install WRB and flash tie-in points.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 4,
    dependsOn: ['Frame addition walls'],
  },
  {
    title: 'Install windows and exterior doors',
    description: 'Set and flash windows and exterior doors in addition.',
    phase: 'FRAMING',
    priority: 'HIGH',
    estimatedDays: 3,
    dependsOn: ['Install sheathing and weather barrier'],
  },
  {
    title: 'Schedule framing inspection',
    description: 'Request framing inspection for addition structure.',
    phase: 'FRAMING',
    priority: 'URGENT',
    estimatedDays: 2,
    dependsOn: ['Open wall between existing and addition'],
  },

  // Phase 5: ROUGH_IN
  {
    title: 'Rough-in plumbing',
    description: 'Extend plumbing to addition spaces.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Rough-in electrical',
    description: 'Run wiring and circuits for addition.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Rough-in HVAC',
    description: 'Extend or add HVAC system for addition spaces.',
    phase: 'ROUGH_IN',
    priority: 'HIGH',
    estimatedDays: 5,
  },
  {
    title: 'Schedule rough-in inspections',
    description: 'Request MEP rough inspections.',
    phase: 'ROUGH_IN',
    priority: 'URGENT',
    estimatedDays: 3,
    dependsOn: ['Rough-in plumbing', 'Rough-in electrical', 'Rough-in HVAC'],
  },

  // Phase 6: INTERIOR_FINISHES
  {
    title: 'Install insulation',
    description: 'Insulate addition walls, ceiling, and floor.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 3,
  },
  {
    title: 'Hang and finish drywall',
    description: 'Drywall addition and blend transition to existing.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 7,
    dependsOn: ['Install insulation'],
  },
  {
    title: 'Paint interior',
    description: 'Prime and paint addition interior.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 4,
    dependsOn: ['Hang and finish drywall'],
  },
  {
    title: 'Install flooring',
    description: 'Install flooring with transitions to existing areas.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 4,
  },
  {
    title: 'Install trim, fixtures, and hardware',
    description: 'Finish trim, cabinets, fixtures, and appliances.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 5,
  },
  {
    title: 'Install exterior siding and roofing',
    description: 'Match and install exterior cladding and roofing for addition.',
    phase: 'EXTERIOR',
    priority: 'HIGH',
    estimatedDays: 7,
  },

  // Phase 7: FINAL_INSPECTION + CLOSEOUT
  {
    title: 'Conduct punch list walkthrough',
    description: 'Walk addition and tie-in areas, document remaining items.',
    phase: 'FINAL_INSPECTION',
    priority: 'HIGH',
    estimatedDays: 1,
  },
  {
    title: 'Complete punch list items',
    description: 'Resolve all punch list items.',
    phase: 'FINAL_INSPECTION',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Conduct punch list walkthrough'],
  },
  {
    title: 'Schedule final inspection',
    description: 'Request final inspection and CO amendment.',
    phase: 'FINAL_INSPECTION',
    priority: 'URGENT',
    estimatedDays: 3,
    dependsOn: ['Complete punch list items'],
  },
  {
    title: 'Final cleanup and handover',
    description: 'Clean, demonstrate, and hand over addition to owner.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Process final payment',
    description: 'Submit final pay application and release retainage.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['Final cleanup and handover'],
  },
];

// ---------------------------------------------------------------------------
// MAINTENANCE — ~15 tasks across 3 phases
// ---------------------------------------------------------------------------

const MAINTENANCE_TASKS: TaskTemplate[] = [
  // Phase 1: PRE_CONSTRUCTION (Assessment)
  {
    title: 'Conduct property assessment',
    description: 'Inspect property and document current conditions and maintenance needs.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Review maintenance history',
    description: 'Review past maintenance records, warranties, and service logs.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'NORMAL',
    estimatedDays: 1,
  },
  {
    title: 'Create maintenance scope and schedule',
    description: 'Define scope of work, priority items, and schedule for maintenance tasks.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 2,
  },
  {
    title: 'Obtain quotes from service providers',
    description: 'Request quotes for specialized maintenance work (HVAC, plumbing, etc.).',
    phase: 'PRE_CONSTRUCTION',
    priority: 'NORMAL',
    estimatedDays: 5,
  },
  {
    title: 'Schedule maintenance visits',
    description: 'Coordinate access and schedule for all maintenance work.',
    phase: 'PRE_CONSTRUCTION',
    priority: 'HIGH',
    estimatedDays: 2,
  },

  // Phase 2: INTERIOR_FINISHES (Execution — general maintenance)
  {
    title: 'HVAC system maintenance',
    description: 'Service HVAC: change filters, clean coils, check refrigerant, test operation.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 1,
  },
  {
    title: 'Plumbing system inspection',
    description: 'Check for leaks, test water heater, inspect drains, verify shut-off valves.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 1,
  },
  {
    title: 'Electrical system check',
    description: 'Test GFCI outlets, check panel, inspect smoke/CO detectors, test emergency lighting.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 1,
  },
  {
    title: 'Roof and exterior inspection',
    description: 'Inspect roof, gutters, siding, caulking, and exterior paint condition.',
    phase: 'INTERIOR_FINISHES',
    priority: 'NORMAL',
    estimatedDays: 1,
  },
  {
    title: 'Address identified repair items',
    description: 'Complete minor repairs identified during inspections.',
    phase: 'INTERIOR_FINISHES',
    priority: 'HIGH',
    estimatedDays: 5,
    dependsOn: ['HVAC system maintenance', 'Plumbing system inspection', 'Electrical system check'],
  },

  // Phase 3: CLOSEOUT
  {
    title: 'Compile maintenance report',
    description: 'Document completed work, findings, and recommended future maintenance.',
    phase: 'CLOSEOUT',
    priority: 'NORMAL',
    estimatedDays: 2,
  },
  {
    title: 'Update maintenance schedule',
    description: 'Update recurring maintenance calendar with next service dates.',
    phase: 'CLOSEOUT',
    priority: 'NORMAL',
    estimatedDays: 1,
  },
  {
    title: 'Owner review and sign-off',
    description: 'Review maintenance report with owner and obtain sign-off.',
    phase: 'CLOSEOUT',
    priority: 'HIGH',
    estimatedDays: 2,
    dependsOn: ['Compile maintenance report'],
  },
  {
    title: 'Process final invoice',
    description: 'Submit final invoice for maintenance services rendered.',
    phase: 'CLOSEOUT',
    priority: 'NORMAL',
    estimatedDays: 3,
    dependsOn: ['Owner review and sign-off'],
  },
];

// ---------------------------------------------------------------------------
// Lookup map
// ---------------------------------------------------------------------------

export const TASK_TEMPLATES: Record<ProjectType, TaskTemplate[]> = {
  NEW_CONSTRUCTION: NEW_CONSTRUCTION_TASKS,
  RENOVATION: RENOVATION_TASKS,
  ADDITION: ADDITION_TASKS,
  MAINTENANCE: MAINTENANCE_TASKS,
};

/**
 * Get the ordered list of phases for a given project type.
 */
export function getPhasesForType(projectType: ProjectType): string[] {
  const templates = TASK_TEMPLATES[projectType];
  const seen = new Set<string>();
  const phases: string[] = [];
  for (const t of templates) {
    if (!seen.has(t.phase)) {
      seen.add(t.phase);
      phases.push(t.phase);
    }
  }
  return phases;
}
