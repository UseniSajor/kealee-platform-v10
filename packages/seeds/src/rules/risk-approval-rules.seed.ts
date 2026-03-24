import { RuleSeed } from "../types";

export const ruleSeeds: RuleSeed[] = [
  {
    code: "rule_missing_address_blocks_zoning",
    version: "1.0.0",
    status: "active",
    type: "risk_rule",
    severity: "high",
    description: "Zoning check requires address or parcel identifier.",
    when: { toolName: "check_zoning", missingFields: ["address"], unlessFieldsPresent: ["parcelId"] },
    effect: { blockExecution: true, riskFlag: "missing_address", askFor: ["address_or_parcelId"] }
  },
  {
    code: "rule_checkout_requires_approval",
    version: "1.0.0",
    status: "active",
    type: "approval_rule",
    severity: "critical",
    description: "Any paid checkout creation requires user or operator approval.",
    when: { toolName: "create_checkout" },
    effect: { requireApproval: true, approvalRole: "homeowner|developer|operator|finance_reviewer" }
  },
  {
    code: "rule_assignment_requires_approval",
    version: "1.0.0",
    status: "active",
    type: "approval_rule",
    severity: "high",
    description: "Contractor assignment cannot finalize without approval.",
    when: { toolName: "assign_contractor" },
    effect: { requireApproval: true, approvalRole: "operator|homeowner|developer" }
  },
  {
    code: "rule_external_comms_require_template_or_approval",
    version: "1.0.0",
    status: "active",
    type: "approval_rule",
    severity: "high",
    description: "External email/SMS must use approved template or explicit approval.",
    when: { anyToolIn: ["send_email", "send_sms"] },
    effect: { requireApproval: true, allowIfTemplateApproved: true }
  },
  {
    code: "rule_estimate_confidence_low_without_plans_or_address",
    version: "1.0.0",
    status: "active",
    type: "risk_rule",
    severity: "medium",
    description: "Estimate confidence should be lowered when plans and address are absent.",
    when: { toolName: "create_estimate", missingAny: ["address", "plans"] },
    effect: { annotateOutput: { confidence: "low" }, riskFlag: "estimate_low_confidence" }
  },
  {
    code: "rule_high_complexity_route_professional_review",
    version: "1.0.0",
    status: "active",
    type: "routing_rule",
    severity: "high",
    description: "Complex or professional-dependent scopes route to architect/engineer review.",
    when: { anyOf: [{ projectTypeIn: ["commercial_improvement", "mixed_use", "multifamily"] }, { scopeFlagsInclude: ["structural", "occupancy_change", "complex_mep"] }] },
    effect: { routeTo: "architect|engineer|operator", addRiskFlags: ["professional_review_required"] }
  },
  {
    code: "rule_permit_status_requires_record",
    version: "1.0.0",
    status: "active",
    type: "risk_rule",
    severity: "medium",
    description: "Permit status lookup requires permit/application number or a supported property search pathway.",
    when: { toolName: "get_permit_status", missingFields: ["permitNumber"] },
    effect: { blockExecution: false, askFor: ["permitNumber"], riskFlag: "missing_permit_number" }
  },
  {
    code: "rule_financial_actions_operator_visible",
    version: "1.0.0",
    status: "active",
    type: "approval_rule",
    severity: "critical",
    description: "All financial actions must be logged and visible to operator/finance reviewer.",
    when: { sideEffectLevel: "financial" },
    effect: { notifyRoles: ["operator", "finance_reviewer"], requireAuditLog: true }
  },
  {
    code: "rule_verified_contractor_only",
    version: "1.0.0",
    status: "active",
    type: "risk_rule",
    severity: "high",
    description: "Only verified contractors may be assigned or surfaced as final candidates.",
    when: { toolName: "assign_contractor" },
    effect: { enforceFilters: { contractorVerified: true }, riskFlag: "verification_required" }
  },
  {
    code: "rule_jurisdiction_outside_seed_market",
    version: "1.0.0",
    status: "active",
    type: "routing_rule",
    severity: "medium",
    description: "Unsupported or unseeded jurisdictions route to operator review.",
    when: { jurisdictionNotIn: ["dc","montgomery_md","prince_georges_md","fairfax_va","arlington_va","alexandria_va","loudoun_va"] },
    effect: { routeTo: "operator", addRiskFlags: ["unsupported_jurisdiction"] }
  },
  {
    code: "rule_lender_outputs_approval",
    version: "1.0.0",
    status: "active",
    type: "approval_rule",
    severity: "high",
    description: "Lender-facing summaries, draw packages, or finance outputs require approval.",
    when: { audience: "lender" },
    effect: { requireApproval: true, approvalRole: "finance_reviewer|operator" }
  },
  {
    code: "rule_missing_scope_summary_blocks_project_quality",
    version: "1.0.0",
    status: "active",
    type: "risk_rule",
    severity: "medium",
    description: "Scope summary is required for useful routing and output quality.",
    when: { missingFields: ["scopeSummary"] },
    effect: { addRiskFlags: ["missing_scope_summary"], askFor: ["scopeSummary"] }
  }
];
