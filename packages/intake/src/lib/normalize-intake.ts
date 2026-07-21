import type { IntakeInput } from "../schemas/intake-schemas";

export interface NormalizedIntake {
  projectPath: string;
  contact: {
    clientName: string;
    contactEmail: string;
    contactPhone?: string;
  };
  project: {
    projectAddress: string;
    projectType: string;
    propertyUse: string;
  };
  scope: Record<string, unknown>;
  budget: {
    budgetRange: string;
    timelineGoal?: string;
  };
  assets: {
    uploadedPhotos: string[];
  };
  goals: string[];
  knownConstraints: string[];
  stylePreferences: string[];
  source: string;
  funnelSessionId?: string;
  rawData: Record<string, unknown>;
}

function toLines(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return (value as string[]).map(String).filter(Boolean);
  return String(value).split(/\n/).map((s) => s.trim()).filter(Boolean);
}

export function normalizeIntake(input: IntakeInput): NormalizedIntake {
  const { projectPath, clientName, contactEmail, contactPhone, projectAddress,
          budgetRange, timelineGoal, uploadedPhotos, source, funnelSessionId } = input;

  const projectType = deriveProjectType(input);
  const propertyUse =
    ("propertyUse" in input && input.propertyUse ? input.propertyUse : "primary_residence");

  const stylePreferencesRaw =
    "stylePreferences" in input ? input.stylePreferences :
    "designStyle" in input ? (input as { designStyle?: string[] }).designStyle : [];
  const stylePreferences = (stylePreferencesRaw ?? []) as string[];

  const goalsRaw =
    "goals" in input ? (input as { goals?: string }).goals :
    "priorities" in input ? (input as { priorities?: string }).priorities :
    "deliverables" in input ? (input as { deliverables?: string }).deliverables :
    "renovationGoals" in input ? (input as { renovationGoals?: string }).renovationGoals :
    "projectDescription" in input ? (input as { projectDescription?: string }).projectDescription : "";
  const goals = toLines(goalsRaw);

  const constraintsRaw =
    "knownConstraints" in input ? (input as { knownConstraints?: string }).knownConstraints :
    "neighborhoodConstraints" in input ? (input as { neighborhoodConstraints?: string }).neighborhoodConstraints : "";
  const knownConstraints = toLines(constraintsRaw);

  const skip = new Set(["clientName","contactEmail","contactPhone","projectAddress",
    "budgetRange","timelineGoal","uploadedPhotos","source","funnelSessionId","projectPath"]);
  const scope: Record<string, unknown> = { projectPath };
  for (const [key, val] of Object.entries(input)) {
    if (!skip.has(key)) scope[key] = val;
  }

  return {
    projectPath,
    contact: { clientName, contactEmail, contactPhone },
    project: { projectAddress, projectType, propertyUse },
    scope,
    budget: { budgetRange, timelineGoal },
    assets: { uploadedPhotos: uploadedPhotos ?? [] },
    goals,
    knownConstraints,
    stylePreferences,
    source: source ?? "public_intake",
    funnelSessionId,
    rawData: input as unknown as Record<string, unknown>,
  };
}

function deriveProjectType(input: IntakeInput): string {
  switch (input.projectPath) {
    case "exterior_concept":    return input.exteriorProjectType ?? "exterior_concept";
    case "interior_renovation": return "interior_renovation";
    case "whole_home_remodel":  return "whole_home_remodel";
    case "addition_expansion":  return input.additionType ?? "rear_addition";
    case "design_build":        return `design_build_${input.projectScale ?? "medium"}`;
    case "permit_path_only":    return input.permitType ?? "residential_renovation";
    default:                    return (input as IntakeInput).projectPath;
  }
}
