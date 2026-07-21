/**
 * Assembly Library
 * Pre-built assembly templates for common construction items
 */

import { CreateAssemblyInput, CreateComponentInput } from './assembly-builder.js';

export interface AssemblyTemplate {
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  components: CreateComponentInput[];
  productivity?: number;
  crewSize?: number;
  notes?: string;
  tags: string[];
}

// CSI Division structure for categorization
export const CSI_DIVISIONS = {
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood, Plastics & Composites',
  '07': 'Thermal & Moisture Protection',
  '08': 'Openings',
  '09': 'Finishes',
  '10': 'Specialties',
  '11': 'Equipment',
  '12': 'Furnishings',
  '21': 'Fire Suppression',
  '22': 'Plumbing',
  '23': 'HVAC',
  '26': 'Electrical',
  '27': 'Communications',
  '31': 'Earthwork',
  '32': 'Exterior Improvements',
  '33': 'Utilities',
};

/**
 * Pre-built assembly templates library
 */
export const ASSEMBLY_TEMPLATES: AssemblyTemplate[] = [
  // ============================================
  // DIVISION 03 - CONCRETE
  // ============================================
  {
    code: '03-1000',
    name: 'Concrete Slab on Grade - 4"',
    description: '4" thick concrete slab on grade with wire mesh reinforcement',
    category: '03 - Concrete',
    subcategory: 'Slabs',
    unit: 'SF',
    components: [
      { type: 'MATERIAL', name: '3000 PSI Concrete', quantity: 0.0123, unit: 'CY', unitCost: 165, sortOrder: 0 },
      { type: 'MATERIAL', name: '6x6 W1.4/W1.4 Wire Mesh', quantity: 1.05, unit: 'SF', unitCost: 0.35, wastePercent: 5, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Vapor Barrier 10 mil', quantity: 1.05, unit: 'SF', unitCost: 0.08, wastePercent: 5, sortOrder: 2 },
      { type: 'LABOR', name: 'Concrete Finisher', quantity: 0.015, unit: 'HR', unitCost: 55, sortOrder: 3 },
      { type: 'LABOR', name: 'Laborer', quantity: 0.010, unit: 'HR', unitCost: 42, sortOrder: 4 },
      { type: 'EQUIPMENT', name: 'Power Trowel', quantity: 0.008, unit: 'HR', unitCost: 25, sortOrder: 5 },
    ],
    productivity: 800,
    crewSize: 4,
    tags: ['concrete', 'slab', 'foundation'],
  },
  {
    code: '03-2000',
    name: 'Concrete Footings - Continuous',
    description: 'Continuous concrete footing 16"W x 8"D',
    category: '03 - Concrete',
    subcategory: 'Footings',
    unit: 'LF',
    components: [
      { type: 'MATERIAL', name: '3000 PSI Concrete', quantity: 0.033, unit: 'CY', unitCost: 165, sortOrder: 0 },
      { type: 'MATERIAL', name: '#4 Rebar', quantity: 0.4, unit: 'LB', unitCost: 0.85, wastePercent: 5, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Form Lumber', quantity: 0.5, unit: 'BF', unitCost: 2.50, sortOrder: 2 },
      { type: 'LABOR', name: 'Carpenter', quantity: 0.05, unit: 'HR', unitCost: 65, sortOrder: 3 },
      { type: 'LABOR', name: 'Concrete Finisher', quantity: 0.03, unit: 'HR', unitCost: 55, sortOrder: 4 },
    ],
    productivity: 100,
    crewSize: 3,
    tags: ['concrete', 'footing', 'foundation'],
  },

  // ============================================
  // DIVISION 06 - WOOD & PLASTICS
  // ============================================
  {
    code: '06-1100',
    name: 'Wood Stud Wall - 2x4 @ 16" OC',
    description: '2x4 wood stud wall framing at 16" on center with single bottom plate and double top plate',
    category: '06 - Wood, Plastics & Composites',
    subcategory: 'Framing',
    unit: 'SF',
    components: [
      { type: 'MATERIAL', name: '2x4 SPF Stud Grade', quantity: 0.75, unit: 'BF', unitCost: 0.85, wastePercent: 5, sortOrder: 0 },
      { type: 'MATERIAL', name: '16d Framing Nails', quantity: 0.025, unit: 'LB', unitCost: 1.50, sortOrder: 1 },
      { type: 'LABOR', name: 'Carpenter', quantity: 0.035, unit: 'HR', unitCost: 65, sortOrder: 2 },
      { type: 'LABOR', name: 'Carpenter Helper', quantity: 0.020, unit: 'HR', unitCost: 42, sortOrder: 3 },
    ],
    productivity: 200,
    crewSize: 2,
    tags: ['framing', 'wall', 'wood'],
  },
  {
    code: '06-1200',
    name: 'Roof Truss Installation',
    description: 'Prefabricated roof truss installation, 24" OC',
    category: '06 - Wood, Plastics & Composites',
    subcategory: 'Trusses',
    unit: 'SF',
    components: [
      { type: 'MATERIAL', name: 'Prefab Wood Truss (allowance)', quantity: 1, unit: 'SF', unitCost: 4.50, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Hurricane Ties', quantity: 0.04, unit: 'EA', unitCost: 1.25, sortOrder: 1 },
      { type: 'MATERIAL', name: '16d Nails', quantity: 0.015, unit: 'LB', unitCost: 1.50, sortOrder: 2 },
      { type: 'LABOR', name: 'Carpenter', quantity: 0.02, unit: 'HR', unitCost: 65, sortOrder: 3 },
      { type: 'EQUIPMENT', name: 'Crane', quantity: 0.005, unit: 'HR', unitCost: 150, sortOrder: 4 },
    ],
    productivity: 500,
    crewSize: 4,
    tags: ['framing', 'roof', 'truss'],
  },

  // ============================================
  // DIVISION 07 - THERMAL & MOISTURE PROTECTION
  // ============================================
  {
    code: '07-2100',
    name: 'Batt Insulation R-19',
    description: 'Fiberglass batt insulation R-19, 6" thick',
    category: '07 - Thermal & Moisture Protection',
    subcategory: 'Insulation',
    unit: 'SF',
    components: [
      { type: 'MATERIAL', name: 'R-19 Fiberglass Batt', quantity: 1.02, unit: 'SF', unitCost: 0.65, wastePercent: 2, sortOrder: 0 },
      { type: 'LABOR', name: 'Insulation Installer', quantity: 0.008, unit: 'HR', unitCost: 48, sortOrder: 1 },
    ],
    productivity: 1200,
    crewSize: 2,
    tags: ['insulation', 'thermal'],
  },
  {
    code: '07-3100',
    name: 'Asphalt Shingles - Architectural',
    description: '30-year architectural asphalt shingles with underlayment',
    category: '07 - Thermal & Moisture Protection',
    subcategory: 'Roofing',
    unit: 'SQ',
    components: [
      { type: 'MATERIAL', name: 'Architectural Shingles', quantity: 3.3, unit: 'BNDL', unitCost: 38, wastePercent: 5, sortOrder: 0 },
      { type: 'MATERIAL', name: '15# Felt Underlayment', quantity: 1.2, unit: 'ROLL', unitCost: 28, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Roofing Nails', quantity: 2.5, unit: 'LB', unitCost: 1.50, sortOrder: 2 },
      { type: 'MATERIAL', name: 'Drip Edge', quantity: 5, unit: 'LF', unitCost: 1.25, sortOrder: 3 },
      { type: 'LABOR', name: 'Roofer', quantity: 1.5, unit: 'HR', unitCost: 55, sortOrder: 4 },
      { type: 'LABOR', name: 'Roofer Helper', quantity: 1.5, unit: 'HR', unitCost: 38, sortOrder: 5 },
    ],
    productivity: 15,
    crewSize: 3,
    notes: '1 SQ = 100 SF of roof area',
    tags: ['roofing', 'shingles'],
  },

  // ============================================
  // DIVISION 08 - OPENINGS
  // ============================================
  {
    code: '08-1100',
    name: 'Exterior Wood Door - 3\'0" x 6\'8"',
    description: 'Exterior solid core wood door with frame, weatherstrip, and hardware',
    category: '08 - Openings',
    subcategory: 'Doors',
    unit: 'EA',
    components: [
      { type: 'MATERIAL', name: 'Solid Core Wood Door', quantity: 1, unit: 'EA', unitCost: 450, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Door Frame/Jamb', quantity: 1, unit: 'SET', unitCost: 125, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Lockset', quantity: 1, unit: 'EA', unitCost: 95, sortOrder: 2 },
      { type: 'MATERIAL', name: 'Hinges', quantity: 3, unit: 'EA', unitCost: 12, sortOrder: 3 },
      { type: 'MATERIAL', name: 'Weatherstrip', quantity: 1, unit: 'SET', unitCost: 25, sortOrder: 4 },
      { type: 'MATERIAL', name: 'Threshold', quantity: 1, unit: 'EA', unitCost: 35, sortOrder: 5 },
      { type: 'LABOR', name: 'Carpenter', quantity: 3, unit: 'HR', unitCost: 65, sortOrder: 6 },
    ],
    productivity: 3,
    crewSize: 1,
    tags: ['door', 'exterior', 'wood'],
  },
  {
    code: '08-5100',
    name: 'Vinyl Window - Double Hung 3\'x4\'',
    description: 'Double hung vinyl window with low-E glass',
    category: '08 - Openings',
    subcategory: 'Windows',
    unit: 'EA',
    components: [
      { type: 'MATERIAL', name: 'Vinyl Double Hung Window', quantity: 1, unit: 'EA', unitCost: 285, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Flashing', quantity: 1, unit: 'SET', unitCost: 15, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Shims', quantity: 1, unit: 'SET', unitCost: 5, sortOrder: 2 },
      { type: 'MATERIAL', name: 'Foam Insulation', quantity: 1, unit: 'CAN', unitCost: 8, sortOrder: 3 },
      { type: 'MATERIAL', name: 'Caulk', quantity: 0.25, unit: 'TUBE', unitCost: 8, sortOrder: 4 },
      { type: 'LABOR', name: 'Carpenter', quantity: 1.5, unit: 'HR', unitCost: 65, sortOrder: 5 },
    ],
    productivity: 5,
    crewSize: 1,
    tags: ['window', 'vinyl'],
  },

  // ============================================
  // DIVISION 09 - FINISHES
  // ============================================
  {
    code: '09-2900',
    name: 'Drywall - 1/2" Standard',
    description: '1/2" drywall installation, taped and finished Level 4',
    category: '09 - Finishes',
    subcategory: 'Drywall',
    unit: 'SF',
    components: [
      { type: 'MATERIAL', name: '1/2" Drywall', quantity: 1.05, unit: 'SF', unitCost: 0.45, wastePercent: 5, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Drywall Screws', quantity: 0.01, unit: 'LB', unitCost: 3.50, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Joint Compound', quantity: 0.05, unit: 'GAL', unitCost: 12, sortOrder: 2 },
      { type: 'MATERIAL', name: 'Paper Tape', quantity: 0.04, unit: 'LF', unitCost: 0.02, sortOrder: 3 },
      { type: 'LABOR', name: 'Drywall Hanger', quantity: 0.012, unit: 'HR', unitCost: 52, sortOrder: 4 },
      { type: 'LABOR', name: 'Drywall Finisher', quantity: 0.018, unit: 'HR', unitCost: 55, sortOrder: 5 },
    ],
    productivity: 600,
    crewSize: 2,
    tags: ['drywall', 'finish'],
  },
  {
    code: '09-9100',
    name: 'Interior Latex Paint - 2 Coats',
    description: 'Interior latex paint, 2 coats on drywall',
    category: '09 - Finishes',
    subcategory: 'Painting',
    unit: 'SF',
    components: [
      { type: 'MATERIAL', name: 'Interior Latex Paint', quantity: 0.0065, unit: 'GAL', unitCost: 45, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Primer', quantity: 0.003, unit: 'GAL', unitCost: 35, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Misc Supplies', quantity: 0.01, unit: 'EA', unitCost: 2, sortOrder: 2 },
      { type: 'LABOR', name: 'Painter', quantity: 0.015, unit: 'HR', unitCost: 52, sortOrder: 3 },
    ],
    productivity: 400,
    crewSize: 2,
    tags: ['painting', 'finish'],
  },

  // ============================================
  // DIVISION 22 - PLUMBING
  // ============================================
  {
    code: '22-4100',
    name: 'Toilet Installation - Standard',
    description: 'Standard toilet installation with supply and drain connections',
    category: '22 - Plumbing',
    subcategory: 'Fixtures',
    unit: 'EA',
    components: [
      { type: 'MATERIAL', name: 'Toilet - Standard', quantity: 1, unit: 'EA', unitCost: 185, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Wax Ring', quantity: 1, unit: 'EA', unitCost: 8, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Supply Line', quantity: 1, unit: 'EA', unitCost: 12, sortOrder: 2 },
      { type: 'MATERIAL', name: 'Shut-off Valve', quantity: 1, unit: 'EA', unitCost: 18, sortOrder: 3 },
      { type: 'MATERIAL', name: 'Closet Bolts', quantity: 1, unit: 'SET', unitCost: 6, sortOrder: 4 },
      { type: 'LABOR', name: 'Plumber', quantity: 2, unit: 'HR', unitCost: 85, sortOrder: 5 },
    ],
    productivity: 4,
    crewSize: 1,
    tags: ['plumbing', 'toilet', 'fixture'],
  },

  // ============================================
  // DIVISION 26 - ELECTRICAL
  // ============================================
  {
    code: '26-2700',
    name: 'Duplex Receptacle',
    description: '20A duplex receptacle with box and wiring',
    category: '26 - Electrical',
    subcategory: 'Devices',
    unit: 'EA',
    components: [
      { type: 'MATERIAL', name: 'Duplex Receptacle 20A', quantity: 1, unit: 'EA', unitCost: 8, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Device Box', quantity: 1, unit: 'EA', unitCost: 3, sortOrder: 1 },
      { type: 'MATERIAL', name: 'Cover Plate', quantity: 1, unit: 'EA', unitCost: 1.50, sortOrder: 2 },
      { type: 'MATERIAL', name: '12/2 NM Cable', quantity: 25, unit: 'LF', unitCost: 0.75, sortOrder: 3 },
      { type: 'MATERIAL', name: 'Wire Connectors', quantity: 4, unit: 'EA', unitCost: 0.20, sortOrder: 4 },
      { type: 'LABOR', name: 'Electrician', quantity: 0.75, unit: 'HR', unitCost: 85, sortOrder: 5 },
    ],
    productivity: 10,
    crewSize: 1,
    tags: ['electrical', 'receptacle'],
  },
  {
    code: '26-5100',
    name: 'Recessed Light - LED 6"',
    description: '6" LED recessed light fixture with trim',
    category: '26 - Electrical',
    subcategory: 'Lighting',
    unit: 'EA',
    components: [
      { type: 'MATERIAL', name: 'LED Recessed Light 6"', quantity: 1, unit: 'EA', unitCost: 45, sortOrder: 0 },
      { type: 'MATERIAL', name: 'Remodel Housing', quantity: 1, unit: 'EA', unitCost: 15, sortOrder: 1 },
      { type: 'MATERIAL', name: '14/2 NM Cable', quantity: 15, unit: 'LF', unitCost: 0.55, sortOrder: 2 },
      { type: 'LABOR', name: 'Electrician', quantity: 0.5, unit: 'HR', unitCost: 85, sortOrder: 3 },
    ],
    productivity: 12,
    crewSize: 1,
    tags: ['electrical', 'lighting', 'LED'],
  },
];

/**
 * Get assembly templates by category
 */
export function getTemplatesByCategory(category: string): AssemblyTemplate[] {
  return ASSEMBLY_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get assembly template by code
 */
export function getTemplateByCode(code: string): AssemblyTemplate | undefined {
  return ASSEMBLY_TEMPLATES.find((t) => t.code === code);
}

/**
 * Search templates
 */
export function searchTemplates(query: string): AssemblyTemplate[] {
  const lowerQuery = query.toLowerCase();
  return ASSEMBLY_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.code.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set(ASSEMBLY_TEMPLATES.map((t) => t.category));
  return Array.from(categories).sort();
}

/**
 * Convert template to CreateAssemblyInput
 */
export function templateToInput(
  template: AssemblyTemplate,
  costDatabaseId: string
): CreateAssemblyInput {
  return {
    costDatabaseId,
    csiCode: template.code,
    name: template.name,
    description: template.description,
    category: template.category,
    subcategory: template.subcategory,
    unit: template.unit,
    items: template.components,
    productionRate: template.productivity,
    crewSize: template.crewSize,
    notes: template.notes,
    tags: template.tags,
    isTemplate: true,
  };
}
