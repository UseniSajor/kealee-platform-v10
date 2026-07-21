/**
 * core-agents/runtime/intake-normalizer.ts
 * Normalizes raw homeowner/developer intake from web-main into a structured object.
 *
 * Input: raw form submission (any shape from intake forms)
 * Output: NormalizedIntake with inferred jurisdiction, project type, raw text for classification
 *
 * Does NOT call any AI — purely deterministic normalization.
 * AI analysis is handled by ai-analysis.ts.
 */

import { NormalizedIntake } from "./intake-types";

// ─── Raw intake shapes ────────────────────────────────────────────────────────

export interface RawIntake {
  // Common fields from web-main intake forms
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  zipCode?: string;
  zip?: string;
  projectType?: string;
  project_type?: string;
  scopeSummary?: string;
  scope_summary?: string;
  description?: string;
  budgetRange?: string;
  budget_range?: string;
  budget?: string;
  timeline?: string;
  stylePreferences?: string;
  style_preferences?: string;
  // File/image uploads
  hasPlans?: boolean;
  has_plans?: boolean;
  hasImages?: boolean;
  has_images?: boolean;
  uploadedFiles?: Array<{ name: string; type: string; size: number }>;
  // Metadata
  source?: string;
  userId?: string;
  orgId?: string;
  sessionId?: string;
  // Garden-specific fields
  gardenType?: string;
  gardenSize?: string;
  // Developer-specific fields
  lotSize?: string;
  targetUnits?: number;
  // Capture-specific fields
  captureSessionId?: string;
}

// ─── Jurisdiction detection ───────────────────────────────────────────────────
// Keep in sync with check-zoning.tool.ts and get-permit-status.tool.ts

function detectJurisdiction(address: string, city?: string, county?: string): string | undefined {
  const parts = [address, city, county].filter(Boolean).join(" ").toLowerCase();

  if (parts.includes(", dc") || parts.includes("washington, d.c") || parts.includes("washington dc") || /\bdc\b/.test(parts)) return "dc";
  if (parts.includes("montgomery county") || (parts.includes(", md") && (parts.includes("rockville") || parts.includes("bethesda") || parts.includes("silver spring") || parts.includes("gaithersburg") || parts.includes("germantown")))) return "montgomery_md";
  if (parts.includes("prince george") || (parts.includes(", md") && (parts.includes("hyattsville") || parts.includes("college park") || parts.includes("bowie") || parts.includes("laurel") || parts.includes("greenbelt")))) return "prince_georges_md";
  if (parts.includes("fairfax") || (parts.includes(", va") && (parts.includes("reston") || parts.includes("herndon") || parts.includes("mclean") || parts.includes("annandale") || parts.includes("springfield")))) return "fairfax_va";
  if (parts.includes("arlington") && parts.includes("va")) return "arlington_va";
  if (parts.includes("alexandria") && parts.includes("va")) return "alexandria_va";
  if (parts.includes("loudoun") || (parts.includes(", va") && (parts.includes("leesburg") || parts.includes("ashburn") || parts.includes("sterling") || parts.includes("purcellville")))) return "loudoun_va";

  return undefined;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function normalizeIntake(raw: RawIntake): NormalizedIntake {
  // Coerce snake_case fields
  const address = raw.address ?? "";
  const city = raw.city ?? "";
  const county = raw.county ?? "";
  const state = raw.state ?? "";
  const zipCode = raw.zipCode ?? raw.zip ?? "";
  const projectType = raw.projectType ?? raw.project_type ?? "";
  const scopeSummary = raw.scopeSummary ?? raw.scope_summary ?? raw.description ?? "";
  const budgetRange = raw.budgetRange ?? raw.budget_range ?? raw.budget ?? "";
  const timeline = raw.timeline ?? "";
  const stylePreferences = raw.stylePreferences ?? raw.style_preferences ?? "";
  const hasPlans = raw.hasPlans ?? raw.has_plans ?? false;
  const hasImages = raw.hasImages ?? raw.has_images ?? (raw.uploadedFiles?.some((f) => f.type.startsWith("image/")) ?? false);

  // Detect jurisdiction
  const jurisdictionCode = detectJurisdiction(address, city, county) ??
    (raw.state?.toLowerCase() === "dc" ? "dc" : undefined);

  // Build combined raw text for AI classification
  const rawTextParts = [
    address && `Address: ${address}`,
    city && `City: ${city}`,
    county && `County: ${county}`,
    state && `State: ${state}`,
    projectType && `Project type: ${projectType}`,
    scopeSummary && `Scope: ${scopeSummary}`,
    budgetRange && `Budget: ${budgetRange}`,
    timeline && `Timeline: ${timeline}`,
    stylePreferences && `Style: ${stylePreferences}`,
    hasPlans && "Has existing plans: yes",
    hasImages && "Has uploaded images: yes",
    raw.gardenType && `Garden type: ${raw.gardenType}`,
    raw.lotSize && `Lot size: ${raw.lotSize}`,
    raw.targetUnits && `Target units: ${raw.targetUnits}`,
  ].filter(Boolean);

  return {
    address: address || undefined,
    city: city || undefined,
    county: county || undefined,
    state: state || undefined,
    zipCode: zipCode || undefined,
    projectType: projectType || undefined,
    scopeSummary: scopeSummary || undefined,
    budgetRange: budgetRange || undefined,
    timeline: timeline || undefined,
    stylePreferences: stylePreferences || undefined,
    hasPlans,
    hasImages,
    jurisdictionCode,
    rawText: rawTextParts.join("\n"),
  };
}
