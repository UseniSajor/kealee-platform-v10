import { PROJECT_PATH_META } from "../config/project-path-config";
import type { ProjectPath } from "../config/project-path-config";
import type { LeadScore } from "./score-lead";

export interface PaymentGateResult {
  requiresPayment: boolean;
  amount: number;
  tier: string;
  displayAmount: string;
  reason: string;
}

export function evaluatePaymentGate(
  projectPath: ProjectPath,
  _score: LeadScore
): PaymentGateResult {
  const meta = PROJECT_PATH_META[projectPath];

  if (!meta.requiresPayment) {
    return { requiresPayment: false, amount: 0, tier: "free", displayAmount: "$0", reason: "Free intake path" };
  }

  return {
    requiresPayment: true,
    amount: meta.paymentAmount,
    tier: meta.paymentTier,
    displayAmount: `$${(meta.paymentAmount / 100).toFixed(0)}`,
    reason: PAYMENT_REASONS[projectPath],
  };
}

const PAYMENT_REASONS: Record<ProjectPath, string> = {
  exterior_concept: "Exterior concept package includes AI-generated design direction, site analysis, and visual concepts.",
  interior_renovation: "Interior intake fee covers initial scope review, room-by-room analysis, and consultation scheduling.",
  kitchen_remodel: "Kitchen remodel intake covers layout planning, scope review, and design direction.",
  bathroom_remodel: "Bathroom remodel intake covers fixture placement, scope review, and design direction.",
  whole_home_remodel: "Whole-home remodel intake includes project assessment, design direction, and scope review.",
  addition_expansion: "Addition intake fee covers feasibility review, scope analysis, and path-to-permit guidance.",
  design_build: "Design + Build intake includes project assessment, scope review, and team matching.",
  permit_path_only: "Permit path intake covers jurisdiction review, document checklist, and approval pathway assessment.",
  capture_site_concept: "Free capture-first path — no payment required.",
};
