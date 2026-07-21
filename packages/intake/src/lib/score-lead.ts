import type { NormalizedIntake } from "./normalize-intake";

export interface LeadScore {
  total: number;
  tier: "hot" | "warm" | "cold";
  route: "fast_track" | "standard" | "nurture";
  flags: string[];
  breakdown: {
    budget: number;
    urgency: number;
    readiness: number;
    complexity: number;
  };
}

const BUDGET_SCORES: Record<string, number> = {
  under_10k: 10, under_50k: 12, "10k_25k": 18, "25k_50k": 22,
  "50k_150k": 22, "50k_100k": 25, "100k_250k": 26, "100k_plus": 28,
  "150k_300k": 26, "250k_500k": 28, "300k_500k": 28, "300k_plus": 27,
  "500k_1m": 29, "500k_plus": 30, "1m_plus": 30,
};

const TIMELINE_SCORES: Record<string, number> = {
  asap: 30, urgent: 30, "1_3_months": 24, "3_6_months": 18,
  "6_12_months": 10, planning: 4, flexible: 6,
};

export function scoreIntakeLead(intake: NormalizedIntake): LeadScore {
  const flags: string[] = [];
  const budget = BUDGET_SCORES[intake.budget.budgetRange] ?? 10;
  const urgency = TIMELINE_SCORES[intake.budget.timelineGoal ?? "planning"] ?? 4;
  const photos = intake.assets.uploadedPhotos.length;
  const readiness =
    (photos >= 3 ? 10 : photos >= 1 ? 5 : 0) +
    (intake.stylePreferences.length >= 2 ? 5 : 0) +
    (intake.goals.length > 0 ? 5 : 0) +
    (intake.contact.contactPhone ? 5 : 0);
  const complexity = 10;

  if (intake.project.propertyUse === "multifamily") flags.push("multifamily");
  if (budget <= 12) flags.push("low_budget");
  if (intake.projectPath === "whole_home_remodel") flags.push("whole_home");
  if (intake.projectPath === "design_build") flags.push("design_build");

  const total = Math.min(100, budget + urgency + readiness + complexity);
  const tier: LeadScore["tier"] = total >= 70 ? "hot" : total >= 45 ? "warm" : "cold";
  const route: LeadScore["route"] =
    tier === "hot" ? "fast_track" : tier === "cold" ? "nurture" : "standard";

  return { total, tier, route, flags, breakdown: { budget, urgency, readiness, complexity } };
}
