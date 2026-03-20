export const PROJECT_PATHS = [
  "exterior_concept",
  "interior_renovation",
  "kitchen_remodel",
  "bathroom_remodel",
  "whole_home_remodel",
  "addition_expansion",
  "design_build",
  "permit_path_only",
  "capture_site_concept",
] as const;

export type ProjectPath = (typeof PROJECT_PATHS)[number];

export function isValidProjectPath(path: string): path is ProjectPath {
  return (PROJECT_PATHS as readonly string[]).includes(path);
}

export interface ProjectPathMeta {
  path: ProjectPath;
  label: string;
  description: string;
  requiresPayment: boolean;
  paymentAmount: number;
  paymentTier: string;
  requiresCapture: boolean;
  minFields: string[];
}

export const PROJECT_PATH_META: Record<ProjectPath, ProjectPathMeta> = {
  exterior_concept: {
    path: "exterior_concept",
    label: "Exterior Concept",
    description: "Facade, curb appeal, landscape, and exterior design direction.",
    requiresPayment: true,
    paymentAmount: 58500,
    paymentTier: "essential",
    requiresCapture: false,
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
    minFields: ["clientName", "contactEmail", "projectAddress"],
  },
};
