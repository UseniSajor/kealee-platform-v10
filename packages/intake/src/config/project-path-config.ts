export const PROJECT_PATHS = [
  "exterior_concept",
  "garden_concept",
  "whole_home_concept",
  "interior_reno_concept",
  "developer_concept",
  "interior_renovation",
  "kitchen_remodel",
  "bathroom_remodel",
  "whole_home_remodel",
  "addition_expansion",
  "design_build",
  "permit_path_only",
  "capture_site_concept",
  // Commercial / developer paths
  "multi_unit_residential",
  "mixed_use",
  "commercial_office",
  "development_feasibility",
  "townhome_subdivision",
  "single_family_subdivision",
  "single_lot_development",
] as const;

export type ProjectPath = (typeof PROJECT_PATHS)[number];

export function isValidProjectPath(path: string): path is ProjectPath {
  return (PROJECT_PATHS as readonly string[]).includes(path);
}

export interface PhotoZone {
  id: string;
  /** Human-readable zone label shown on the capture card, e.g. "Rear yard looking toward house" */
  label: string;
  required: boolean;
  /** Short instruction shown under the zone label on the capture card */
  hint: string;
}

export interface PricingTier {
  /** Inclusive upper bound on unit/lot count. Use Infinity for the top tier. */
  maxUnits: number;
  /** Price in cents */
  amount: number;
  /** Human-readable label shown at checkout e.g. "Up to 20 units" */
  label: string;
}

export interface ProjectPathMeta {
  path: ProjectPath;
  label: string;
  description: string;
  requiresPayment: boolean;
  /** Base / minimum price in cents (used when pricingTiers is absent or unit count unknown) */
  paymentAmount: number;
  paymentTier: string;
  requiresCapture: boolean;
  /** When true, the UI should prompt for a video walkthrough in the media step */
  requiresVideo: boolean;
  /** Labeled capture zones specific to this path. Empty array = generic photo upload. */
  photoZones: PhotoZone[];
  minFields: string[];
  /** When present, price scales with the unit/lot count provided at intake */
  pricingTiers?: PricingTier[];
}

/** Resolve the applicable price in cents given an optional unit/lot count. */
export function resolvePaymentAmount(meta: ProjectPathMeta, unitCount?: number): number {
  if (!meta.pricingTiers || unitCount === undefined) return meta.paymentAmount;
  const tier = meta.pricingTiers.find(t => unitCount <= t.maxUnits);
  return tier?.amount ?? meta.pricingTiers[meta.pricingTiers.length - 1].amount;
}

/** Return the tier label for display ("Up to 20 units", etc.) */
export function resolveTierLabel(meta: ProjectPathMeta, unitCount?: number): string | undefined {
  if (!meta.pricingTiers || unitCount === undefined) return undefined;
  const tier = meta.pricingTiers.find(t => unitCount <= t.maxUnits);
  return tier?.label ?? meta.pricingTiers[meta.pricingTiers.length - 1].label;
}

export const PROJECT_PATH_META: Record<ProjectPath, ProjectPathMeta> = {
  garden_concept: {
    path: "garden_concept",
    label: "Garden Concept",
    description: "Garden design, farming layout, raised beds, irrigation, and outdoor living concepts.",
    requiresPayment: true,
    paymentAmount: 39500,
    paymentTier: "essential",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "overall_yard", label: "Overall Yard", required: true, hint: "Stand at one end and capture the full yard" },
      { id: "existing_beds", label: "Existing Beds / Plantings", required: false, hint: "Any existing garden areas or mature plants" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  whole_home_concept: {
    path: "whole_home_concept",
    label: "Whole Home Concept",
    description: "Full property transformation concept with interior and exterior direction.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "essential",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "exterior_front", label: "Exterior Front", required: true, hint: "Stand at the street, capture the full front facade" },
      { id: "kitchen", label: "Kitchen", required: true, hint: "Wide-angle shot showing layout and cabinets" },
      { id: "living_area", label: "Main Living Area", required: true, hint: "Capture as much of the room as possible" },
      { id: "primary_bath", label: "Primary Bathroom", required: false, hint: "Vanity, shower/tub, and flooring visible" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  interior_reno_concept: {
    path: "interior_reno_concept",
    label: "Interior Renovation Concept",
    description: "Interior reno concept with layout, kitchen/bath renderings, and finish direction.",
    requiresPayment: true,
    paymentAmount: 39500,
    paymentTier: "interior_intake",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "room_overview", label: "Room Overview", required: true, hint: "Capture the full room from the doorway" },
      { id: "focal_wall", label: "Focal Wall / Feature", required: true, hint: "The main wall or feature you want to change" },
      { id: "flooring", label: "Existing Flooring", required: false, hint: "Close-up of current flooring condition" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  developer_concept: {
    path: "developer_concept",
    label: "Developer Concept",
    description: "Business-grade concept with feasibility context, pro forma framing, and development path.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "commercial_entry",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "site_overview", label: "Site Overview", required: true, hint: "Capture the full site from the street" },
      { id: "adjacent_context", label: "Adjacent Structures / Neighborhood Context", required: false, hint: "Show neighboring buildings and street character" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress"],
  },
  exterior_concept: {
    path: "exterior_concept",
    label: "Exterior Concept",
    description: "Facade, curb appeal, landscape, and exterior design direction.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "essential",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "front_facade", label: "Front Facade", required: true, hint: "Stand at the street, capture full front elevation" },
      { id: "left_elevation", label: "Left Side Elevation", required: true, hint: "Stand at left corner, capture the side of the house" },
      { id: "right_elevation", label: "Right Side Elevation", required: true, hint: "Stand at right corner, capture the side of the house" },
      { id: "street_view", label: "Street View / Context", required: false, hint: "Show neighboring homes and streetscape" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  interior_renovation: {
    path: "interior_renovation",
    label: "Interior Renovation",
    description: "Room-by-room renovation planning for interior upgrades and redesign.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "interior_intake",
    requiresCapture: true,
    requiresVideo: true,
    photoZones: [
      { id: "room_overview", label: "Room Overview", required: true, hint: "Full room from the doorway — show walls, floor, and ceiling" },
      { id: "focal_wall", label: "Main Feature Wall", required: true, hint: "The wall or feature you most want to change" },
      { id: "flooring_closeup", label: "Flooring Close-Up", required: true, hint: "Capture existing floor material and condition" },
      { id: "ceiling_detail", label: "Ceiling / Lighting", required: false, hint: "Show ceiling height, existing fixtures" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  kitchen_remodel: {
    path: "kitchen_remodel",
    label: "Kitchen Remodel",
    description: "Full kitchen transformation — layout, cabinetry, countertops, and appliances.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "interior_intake",
    requiresCapture: true,
    requiresVideo: false,
    photoZones: [
      { id: "overall_view", label: "Overall View", required: true, hint: "Stand at the entrance, capture the full kitchen layout" },
      { id: "sink_wall", label: "Sink Wall", required: true, hint: "Face the sink — show window, faucet, and surrounding cabinets" },
      { id: "cooking_wall", label: "Cooking Wall / Range", required: true, hint: "Face the range or cooktop — show hood and surrounding cabinetry" },
      { id: "cabinets_closeup", label: "Cabinets Close-Up", required: false, hint: "Detail shot of upper and lower cabinet fronts" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  bathroom_remodel: {
    path: "bathroom_remodel",
    label: "Bathroom Remodel",
    description: "Bath and master suite redesign — tile, fixtures, vanities, and layout.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "interior_intake",
    requiresCapture: true,
    requiresVideo: false,
    photoZones: [
      { id: "vanity_sink", label: "Vanity / Sink", required: true, hint: "Face the vanity — show mirror, faucet, and storage" },
      { id: "shower_tub", label: "Shower / Tub", required: true, hint: "Show full shower or tub, including tile and fixtures" },
      { id: "toilet_area", label: "Toilet Area", required: true, hint: "Capture toilet and any surrounding storage or tile" },
      { id: "flooring", label: "Flooring", required: false, hint: "Close-up of existing tile or floor material" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  whole_home_remodel: {
    path: "whole_home_remodel",
    label: "Whole-Home Remodel",
    description: "Major renovation, luxury remodel, full-property transformation, and design direction.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "essential",
    requiresCapture: true,
    requiresVideo: true,
    photoZones: [
      { id: "exterior_front", label: "Exterior Front", required: true, hint: "Stand at the street, capture the full front of the home" },
      { id: "kitchen", label: "Kitchen", required: true, hint: "Stand at the entrance to the kitchen, show full layout" },
      { id: "primary_bath", label: "Primary Bathroom", required: true, hint: "Show vanity, shower/tub, and flooring" },
      { id: "main_living", label: "Main Living Area", required: true, hint: "Capture as much of the living/family room as possible" },
      { id: "basement", label: "Basement", required: false, hint: "Show ceiling height, existing finish level, and utility locations" },
      { id: "electrical_panel", label: "Electrical Panel", required: false, hint: "Open panel door and photograph the breaker layout" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  addition_expansion: {
    path: "addition_expansion",
    label: "Addition / Expansion",
    description: "Rear, side, vertical, and garage additions with structured project intake.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "essential",
    requiresCapture: true,
    requiresVideo: true,
    photoZones: [
      { id: "rear_yard", label: "Rear Yard Looking Toward House", required: true, hint: "Stand at back fence, capture full yard width and existing structure" },
      { id: "side_yard", label: "Side Yard", required: true, hint: "Show available side yard clearance and existing walls" },
      { id: "exterior_walls", label: "Exterior Walls Being Extended", required: true, hint: "Capture the existing wall(s) where the addition will connect" },
      { id: "neighborhood_context", label: "Neighborhood Context", required: false, hint: "Show adjacent homes and any relevant site constraints" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  design_build: {
    path: "design_build",
    label: "Design + Build",
    description: "Integrated project intake for design, permitting, and execution planning.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "design_build",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "existing_condition", label: "Existing Condition", required: true, hint: "Capture the primary area being designed or built" },
      { id: "site_context", label: "Site Context", required: false, hint: "Show surrounding area and any relevant constraints" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  },
  permit_path_only: {
    path: "permit_path_only",
    label: "Permit Path",
    description: "Get your project organized for a path-to-approval review.",
    requiresPayment: true,
    paymentAmount: 14900,
    paymentTier: "permit_intake",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "existing_condition", label: "Existing Condition", required: false, hint: "Photos of the current state of the area requiring permits" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "permitType"],
  },
  capture_site_concept: {
    path: "capture_site_concept",
    label: "Capture Site",
    description: "Mobile-guided full property capture to build your digital twin.",
    requiresPayment: false,
    paymentAmount: 0,
    paymentTier: "capture_only",
    requiresCapture: true,
    requiresVideo: true,
    photoZones: [
      { id: "exterior_front", label: "Exterior Front", required: true, hint: "Full front facade from the street" },
      { id: "exterior_rear", label: "Exterior Rear", required: true, hint: "Full rear facade from the back yard" },
      { id: "exterior_left", label: "Left Elevation", required: true, hint: "Left side of the home" },
      { id: "exterior_right", label: "Right Elevation", required: true, hint: "Right side of the home" },
      { id: "main_living", label: "Main Living Area", required: true, hint: "Wide shot from the corner of the room" },
      { id: "kitchen", label: "Kitchen", required: true, hint: "Full kitchen layout from the entrance" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress"],
  },
  // ── Commercial / developer paths ─────────────────────────────────────────────
  multi_unit_residential: {
    path: "multi_unit_residential",
    label: "Multi-Unit Residential",
    description: "ADU, duplex, or apartment — optimized unit mix and pro forma.",
    requiresPayment: true,
    paymentAmount: 79900,
    paymentTier: "commercial_standard",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "site_overview", label: "Site Overview", required: true, hint: "Full site from the street" },
      { id: "existing_structure", label: "Existing Structure (if any)", required: false, hint: "Any buildings currently on site" },
      { id: "adjacent_context", label: "Adjacent Context", required: false, hint: "Neighboring buildings that affect design" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  },
  mixed_use: {
    path: "mixed_use",
    label: "Mixed-Use Development",
    description: "Retail ground floor + residential above — full stack concept.",
    requiresPayment: true,
    paymentAmount: 129900,
    paymentTier: "commercial_premium",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "site_overview", label: "Site Overview", required: true, hint: "Full site from the street" },
      { id: "adjacent_retail", label: "Adjacent Retail / Street Character", required: false, hint: "Show neighboring retail and pedestrian context" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  },
  commercial_office: {
    path: "commercial_office",
    label: "Commercial Office",
    description: "Workspace planning with AI — from headcount to floor plan.",
    requiresPayment: true,
    paymentAmount: 99900,
    paymentTier: "commercial_standard",
    requiresCapture: false,
    requiresVideo: true,
    photoZones: [
      { id: "overall_space", label: "Overall Space", required: true, hint: "Wide shot from the corner showing full floor plate" },
      { id: "existing_layout", label: "Existing Layout / Workstations", required: false, hint: "Current desk arrangement and partitions" },
      { id: "meeting_rooms", label: "Meeting Rooms", required: false, hint: "Capture a representative conference or meeting room" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "totalGfaSqFt"],
  },
  development_feasibility: {
    path: "development_feasibility",
    label: "Development Feasibility",
    description: "Land + vision → bankable concept with pro forma in minutes.",
    requiresPayment: true,
    paymentAmount: 149900,
    paymentTier: "commercial_premium",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "site_overview", label: "Site Overview", required: true, hint: "Full site from the street or aerial if available" },
      { id: "site_interior", label: "Site Interior / Topography", required: false, hint: "Walk the site and capture slope, drainage, and vegetation" },
      { id: "adjacent_context", label: "Adjacent Context", required: false, hint: "Neighboring uses that affect feasibility" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  },
  townhome_subdivision: {
    path: "townhome_subdivision",
    label: "Townhome Subdivision",
    description: "Lot-by-lot site plan, for-sale pro forma, and phasing strategy.",
    requiresPayment: true,
    paymentAmount: 99900,
    paymentTier: "commercial_standard",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "site_overview", label: "Site Overview", required: true, hint: "Full site from the street or access road" },
      { id: "site_interior", label: "Site Interior", required: false, hint: "Interior topography, vegetation, and drainage" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
    pricingTiers: [
      { maxUnits: 20,       amount:  99900, label: "Up to 20 units — $999"  },
      { maxUnits: 50,       amount: 149900, label: "21–50 units — $1,499"   },
      { maxUnits: Infinity, amount: 199900, label: "51+ units — $1,999"     },
    ],
  },
  single_family_subdivision: {
    path: "single_family_subdivision",
    label: "Single-Family Subdivision",
    description: "Horizontal land development — lot creation, infrastructure, and sellout analysis.",
    requiresPayment: true,
    paymentAmount: 119900,
    paymentTier: "commercial_premium",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "site_overview", label: "Site Overview", required: true, hint: "Full site from the street or access point" },
      { id: "site_interior", label: "Site Interior", required: false, hint: "Topography and existing vegetation" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
    pricingTiers: [
      { maxUnits: 15,       amount: 119900, label: "Up to 15 lots — $1,199" },
      { maxUnits: 40,       amount: 179900, label: "16–40 lots — $1,799"    },
      { maxUnits: Infinity, amount: 249900, label: "41+ lots — $2,499"      },
    ],
  },
  single_lot_development: {
    path: "single_lot_development",
    label: "Single-Lot Development",
    description: "SFR, duplex, or triplex — concept to pro forma on a single parcel.",
    requiresPayment: true,
    paymentAmount: 59900,
    paymentTier: "commercial_entry",
    requiresCapture: false,
    requiresVideo: false,
    photoZones: [
      { id: "site_overview", label: "Site Overview", required: true, hint: "Full lot from the street" },
      { id: "adjacent_context", label: "Adjacent Context", required: false, hint: "Neighboring structures that affect design" },
    ],
    minFields: ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  },
};
