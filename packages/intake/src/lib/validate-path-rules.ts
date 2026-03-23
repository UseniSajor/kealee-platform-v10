import type { ProjectPath } from "../config/project-path-config";

const REQUIRED_BY_PATH: Record<ProjectPath, string[]> = {
  exterior_concept:          ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  interior_renovation:       ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  kitchen_remodel:           ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  bathroom_remodel:          ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  whole_home_remodel:        ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  addition_expansion:        ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  design_build:              ["clientName", "contactEmail", "projectAddress", "budgetRange"],
  permit_path_only:          ["clientName", "contactEmail", "projectAddress", "permitJurisdiction", "projectDescription"],
  capture_site_concept:      ["clientName", "contactEmail", "projectAddress"],
  // Commercial paths
  multi_unit_residential:    ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  mixed_use:                 ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  commercial_office:         ["clientName", "contactEmail", "projectAddress", "totalGfaSqFt"],
  development_feasibility:   ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  townhome_subdivision:      ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  single_family_subdivision: ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
  single_lot_development:    ["clientName", "contactEmail", "projectAddress", "lotSizeSqFt", "askingPrice"],
};

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  errors: string[];
}

export function validatePathRules(
  projectPath: ProjectPath,
  data: Record<string, unknown>,
): ValidationResult {
  const required = REQUIRED_BY_PATH[projectPath] ?? [];
  const missingFields = required.filter((f) => {
    const v = data[f];
    return v === undefined || v === null || v === "";
  });

  const errors: string[] = missingFields.map((f) => `${f} is required`);

  const email = data["contactEmail"] as string | undefined;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("contactEmail must be a valid email address");
  }

  return { valid: errors.length === 0, missingFields, errors };
}
