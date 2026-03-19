import type { ValidatedIntakeData } from "./intake.schema";

export interface LeadScore {
  total: number;       // 0–100
  urgency: number;     // 0–30
  budget: number;      // 0–30
  readiness: number;   // 0–25
  complexity: number;  // 0–15 (inverse — higher complexity = lower score)
  tier: "hot" | "warm" | "cold";
  route: "fast_track" | "standard" | "nurture";
  flags: string[];
}

const BUDGET_SCORES: Record<string, number> = {
  under_10k:  10,
  "10k_25k":  18,
  "25k_50k":  25,
  "50k_100k": 28,
  "100k_plus": 30,
};

const TIMELINE_SCORES: Record<string, number> = {
  asap:          30,
  "1_3_months":  24,
  "3_6_months":  18,
  "6_12_months": 10,
  planning:       4,
};

const COMPLEXITY_PENALTY: Record<string, number> = {
  exterior_refresh:    0,
  facade_redesign:     2,
  landscape_redesign:  2,
  driveway_hardscape:  3,
  addition_concept:    8,
  porch_deck_concept:  5,
};

export function scoreIntakeLead(data: ValidatedIntakeData): LeadScore {
  const flags: string[] = [];

  // Budget score (0–30)
  const budget = BUDGET_SCORES[data.budgetRange] ?? 10;

  // Urgency/timeline score (0–30)
  const urgency = TIMELINE_SCORES[data.timelineGoal ?? "planning"] ?? 4;

  // Readiness score (0–25): based on completeness
  let readiness = 0;
  if (data.uploadedPhotos.length >= 3) readiness += 10;
  else if (data.uploadedPhotos.length >= 1) readiness += 5;
  if (data.stylePreferences.length >= 2) readiness += 5;
  if ((data.goals ?? []).length > 0) readiness += 5;
  if (data.contactPhone) readiness += 5;

  // Complexity penalty (0–15)
  const complexityPenalty = COMPLEXITY_PENALTY[data.projectType] ?? 0;
  const complexity = 15 - complexityPenalty;

  // Flags
  if (data.propertyUse === "multifamily") flags.push("multifamily");
  if (data.projectType === "addition_concept") flags.push("addition_requires_review");
  if ((data.knownConstraints ?? []).some((c) => /historic|hoa/i.test(c)))
    flags.push("regulatory_constraints");
  if (data.budgetRange === "under_10k") flags.push("low_budget");
  if (data.uploadedPhotos.length === 0) flags.push("no_photos");

  const total = Math.min(100, budget + urgency + readiness + complexity);

  const tier: LeadScore["tier"] =
    total >= 70 ? "hot" : total >= 45 ? "warm" : "cold";

  const route: LeadScore["route"] =
    tier === "hot" && complexityPenalty <= 3
      ? "fast_track"
      : tier === "cold"
      ? "nurture"
      : "standard";

  return { total, urgency, budget, readiness, complexity, tier, route, flags };
}
