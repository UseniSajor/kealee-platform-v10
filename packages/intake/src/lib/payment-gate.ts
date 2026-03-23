import { PROJECT_PATH_META, resolvePaymentAmount, resolveTierLabel } from "../config/project-path-config";
import type { ProjectPath } from "../config/project-path-config";
import type { LeadScore } from "./score-lead";

export interface PaymentGateResult {
  requiresPayment: boolean;
  amount: number;
  tier: string;
  displayAmount: string;
  reason: string;
  /** Set when pricing is tiered — e.g. "Up to 20 units — $999" */
  tierLabel?: string;
  /** True when this path has tiered pricing so the UI can show a tier selector */
  hasTieredPricing: boolean;
}

export function evaluatePaymentGate(
  projectPath: ProjectPath,
  _score: LeadScore,
  /** Unit or lot count — used to resolve tiered pricing for subdivision paths */
  unitCount?: number,
): PaymentGateResult {
  const meta = PROJECT_PATH_META[projectPath];

  if (!meta.requiresPayment) {
    return {
      requiresPayment: false,
      amount: 0,
      tier: "free",
      displayAmount: "$0",
      reason: "Free intake path",
      hasTieredPricing: false,
    };
  }

  const amount     = resolvePaymentAmount(meta, unitCount);
  const tierLabel  = resolveTierLabel(meta, unitCount);

  return {
    requiresPayment: true,
    amount,
    tier: meta.paymentTier,
    displayAmount: `$${(amount / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    reason: PAYMENT_REASONS[projectPath],
    tierLabel,
    hasTieredPricing: !!(meta.pricingTiers && meta.pricingTiers.length > 0),
  };
}

const PAYMENT_REASONS: Record<ProjectPath, string> = {
  exterior_concept:          "Exterior concept package includes AI-generated design direction, site analysis, and visual concepts.",
  interior_renovation:       "Interior intake fee covers initial scope review, room-by-room analysis, and consultation scheduling.",
  kitchen_remodel:           "Kitchen remodel intake covers layout planning, scope review, and design direction.",
  bathroom_remodel:          "Bathroom remodel intake covers fixture placement, scope review, and design direction.",
  whole_home_remodel:        "Whole-home remodel intake includes project assessment, design direction, and scope review.",
  addition_expansion:        "Addition intake fee covers feasibility review, scope analysis, and path-to-permit guidance.",
  design_build:              "Design + Build intake includes project assessment, scope review, and team matching.",
  permit_path_only:          "Permit path intake covers jurisdiction review, document checklist, and approval pathway assessment.",
  capture_site_concept:      "Free capture-first path — no payment required.",
  // Commercial paths
  multi_unit_residential:    "Commercial concept fee covers AI unit mix optimization, multi-floor plate layout, and pro forma financials.",
  mixed_use:                 "Mixed-use concept package includes full development program, pro forma, and investor summary.",
  commercial_office:         "Office concept includes space program analysis, AI floor plan (3 variants), and efficiency metrics.",
  development_feasibility:   "Feasibility package includes full pro forma, zoning analysis, IRR, and investor executive summary.",
  townhome_subdivision:      "Subdivision concept includes site plan, lot layout, phasing strategy, and for-sale pro forma.",
  single_family_subdivision: "SFR subdivision package includes lot-by-lot site plan, infrastructure estimate, and sellout analysis.",
  single_lot_development:    "Single-lot concept covers building type analysis (SFR/duplex/triplex), cost estimate, and sell vs. hold comparison.",
};
