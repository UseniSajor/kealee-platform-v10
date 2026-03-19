import type { ExteriorConceptState } from "./types";

export const REQUIRED_FIELDS: Array<keyof ExteriorConceptState["intakeData"]> = [
  "clientName",
  "contactEmail",
  "projectAddress",
  "projectType",
  "budgetRange",
  "stylePreferences",
  "uploadedPhotos",
];

export function createInitialState(
  input?: Partial<ExteriorConceptState>,
): ExteriorConceptState {
  return {
    intakeId: input?.intakeId,
    userMessageHistory: input?.userMessageHistory ?? [],
    intakeData: input?.intakeData ?? {},
    missingFields: input?.missingFields ?? [],
    siteContext: input?.siteContext,
    visionAnalysis: input?.visionAnalysis,
    projectComplexity: input?.projectComplexity,
    humanReviewRequired: input?.humanReviewRequired ?? false,
    designBrief: input?.designBrief,
    exteriorConceptImages: input?.exteriorConceptImages ?? [],
    landscapeConceptImages: input?.landscapeConceptImages ?? [],
    permitPathSummary: input?.permitPathSummary,
    packageDraftId: input?.packageDraftId,
    status: input?.status ?? "NEW",
    humanDecision: input?.humanDecision,
    errors: input?.errors ?? [],
  };
}

export function detectMissingFields(
  intakeData: ExteriorConceptState["intakeData"],
): string[] {
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = intakeData[field];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missing.push(field);
    }
  }

  return missing;
}
