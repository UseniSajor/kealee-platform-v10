import { IntentSeed } from "../types";

export const intentSeeds: IntentSeed[] = [
  {
    code: "design_concept",
    version: "1.0.0",
    status: "active",
    source: "kealee_domain+repo_summary",
    label: "Design Concept",
    description: "Early concept, layout, visual direction, basic buildability signal, and next-step guidance before full professional plans.",
    entrySignals: ["concept", "layout", "floor plan", "can i build", "design idea", "backyard unit", "addition idea"],
    negativeSignals: ["final stamped plans", "permit already approved"],
    defaultPrimaryAgent: "design",
    defaultWorkflowTemplate: "wf_homeowner_concept_v1",
    supportedModes: ["assisted", "operator"],
    requiredFields: ["projectType", "scopeSummary"],
    optionalFields: ["address", "budgetRange", "photos", "existingPlans"],
    qualificationRules: [
      "Best fit for small-to-medium residential scope",
      "Escalate to architect if code/path complexity exceeds concept thresholds",
      "Address strongly preferred for zoning-aware concepting"
    ],
    upsellTargets: ["feasibility_light", "permit_path_review", "architect_handoff"],
    downstreamIntents: ["permit_only", "construction_execution"]
  },
  {
    code: "renovation",
    version: "1.0.0",
    status: "active",
    source: "kealee_domain+repo_summary",
    label: "Renovation / Addition",
    description: "Interior or exterior renovation, addition, reconfiguration, or systems upgrade requiring scope triage, rough estimate, and permit path determination.",
    entrySignals: ["renovation", "addition", "remodel", "kitchen", "basement", "tenant fit-out", "build out"],
    defaultPrimaryAgent: "estimate",
    defaultWorkflowTemplate: "wf_homeowner_renovation_v1",
    supportedModes: ["autonomous", "assisted", "operator"],
    requiredFields: ["projectType", "scopeSummary"],
    optionalFields: ["address", "budgetRange", "timeline", "photos"],
    qualificationRules: [
      "If occupancy/use change is present, raise permit complexity",
      "If structural scope is likely, escalate professional review",
      "If user lacks address, zoning step remains partial"
    ],
    upsellTargets: ["estimate_package", "permit_path_review", "full_permit_coordination"]
  },
  {
    code: "new_build",
    version: "1.0.0",
    status: "active",
    label: "New Build",
    description: "Ground-up residential or light commercial project needing zoning, feasibility, estimate, and permit sequencing.",
    entrySignals: ["new build", "ground up", "build house", "build multifamily", "new construction"],
    defaultPrimaryAgent: "feasibility",
    defaultWorkflowTemplate: "wf_new_build_precon_v1",
    supportedModes: ["assisted", "operator"],
    requiredFields: ["projectType", "scopeSummary", "address"],
    optionalFields: ["budgetRange", "timeline", "parcelId"],
    qualificationRules: [
      "Address or parcel is mandatory",
      "Always run zoning first",
      "Professional handoff likely for final design"
    ],
    upsellTargets: ["feasibility_light", "permit_path_review", "developer_advisory"]
  },
  {
    code: "permit_only",
    version: "1.0.0",
    status: "active",
    label: "Permit Help Only",
    description: "Client already has plans or defined scope and needs permit path, permit prep, submission support, or status help.",
    entrySignals: ["permit", "pull permit", "submit permit", "permit status", "permit help"],
    defaultPrimaryAgent: "permit",
    defaultWorkflowTemplate: "wf_permit_only_v1",
    supportedModes: ["autonomous", "assisted", "operator"],
    requiredFields: ["address", "scopeSummary"],
    optionalFields: ["uploadedPlans", "jurisdictionHint", "permitNumber"],
    qualificationRules: [
      "If permit number is present, allow status path",
      "If plans missing, package may downgrade to permit path review",
      "If jurisdiction unsupported, route to operator"
    ],
    upsellTargets: ["permit_prep", "full_permit_coordination", "expediter_review"]
  },
  {
    code: "feasibility_light",
    version: "1.0.0",
    status: "active",
    label: "Feasibility Light",
    description: "Quick viability review focused on zoning, gross scope fit, constraints, and early cost/time framing.",
    entrySignals: ["feasibility", "is this possible", "worth building", "viable", "site potential"],
    defaultPrimaryAgent: "feasibility",
    defaultWorkflowTemplate: "wf_feasibility_light_v1",
    supportedModes: ["autonomous", "assisted", "operator"],
    requiredFields: ["address", "projectType", "scopeSummary"],
    optionalFields: ["budgetRange", "timeline", "parcelId"],
    qualificationRules: [
      "Must have address or parcel",
      "Output is advisory, not stamped or final",
      "Escalate if zoning relief appears likely"
    ],
    upsellTargets: ["developer_feasibility", "permit_path_review", "architect_handoff"]
  },
  {
    code: "developer_feasibility",
    version: "1.0.0",
    status: "active",
    label: "Developer Feasibility",
    description: "Land/development analysis for higher-value sites, mixed-use, multifamily, or redevelopment opportunities.",
    entrySignals: ["developer", "land deal", "mixed use", "multifamily", "yield study", "capital stack"],
    defaultPrimaryAgent: "developer",
    defaultWorkflowTemplate: "wf_developer_feasibility_v1",
    supportedModes: ["assisted", "operator"],
    requiredFields: ["address", "projectType", "scopeSummary"],
    optionalFields: ["parcelId", "targetUnits", "commercialSf", "parkingAssumptions", "budgetRange"],
    qualificationRules: [
      "Always include zoning and feasibility",
      "Escalate finance review if capital stack requested",
      "Escalate operator for municipal or unusual entitlement issues"
    ],
    upsellTargets: ["developer_advisory", "capital_stack_advisory", "permit_strategy"]
  },
  {
    code: "estimate_only",
    version: "1.0.0",
    status: "active",
    label: "Estimate Only",
    description: "Quick estimate or CSI-style cost framing without full permit or design engagement.",
    entrySignals: ["estimate", "how much", "budget", "cost", "price"],
    defaultPrimaryAgent: "estimate",
    defaultWorkflowTemplate: "wf_estimate_only_v1",
    supportedModes: ["autonomous", "assisted", "operator"],
    requiredFields: ["projectType", "scopeSummary"],
    optionalFields: ["address", "squareFootage", "budgetRange", "plans"],
    qualificationRules: [
      "Confidence drops without address or plans",
      "Commercial and complex projects should show wider range",
      "Not a GMP or bid commitment"
    ],
    upsellTargets: ["permit_path_review", "full_preconstruction", "contractor_match"]
  },
  {
    code: "contractor_match",
    version: "1.0.0",
    status: "active",
    label: "Contractor Match",
    description: "Client wants qualified contractor matching, bid comparison, or engagement setup.",
    entrySignals: ["find contractor", "match contractor", "bids", "GC", "builder"],
    defaultPrimaryAgent: "marketplace",
    defaultWorkflowTemplate: "wf_contractor_match_v1",
    supportedModes: ["assisted", "operator"],
    requiredFields: ["projectType", "scopeSummary"],
    optionalFields: ["address", "budgetRange", "scheduleGoal", "permitStatus"],
    qualificationRules: [
      "Assignment requires verified contractor pool",
      "Prefer readiness score before assignment",
      "Approval required before final match/assignment"
    ],
    upsellTargets: ["escrow_finance_trust", "construction_execution"]
  },
  {
    code: "construction_execution",
    version: "1.0.0",
    status: "active",
    label: "Construction Execution",
    description: "Active project execution support including milestones, payments, communications, and project controls.",
    entrySignals: ["construction started", "manage project", "milestones", "draw request", "closeout"],
    defaultPrimaryAgent: "construction",
    defaultWorkflowTemplate: "wf_construction_execution_v1",
    supportedModes: ["assisted", "operator"],
    requiredFields: ["projectId"],
    optionalFields: ["milestoneTemplate", "contractorId", "lenderId"],
    qualificationRules: [
      "Requires project record",
      "Financial actions require approval",
      "Escrow/disbursement steps must be auditable"
    ],
    upsellTargets: ["escrow_finance_trust", "ops_services"]
  },
  {
    code: "payment_disbursement",
    version: "1.0.0",
    status: "active",
    label: "Payment / Disbursement",
    description: "Milestone approvals, draw requests, escrow releases, and payment trail actions.",
    entrySignals: ["draw", "disbursement", "release payment", "escrow", "invoice paid"],
    defaultPrimaryAgent: "payments",
    defaultWorkflowTemplate: "wf_payment_disbursement_v1",
    supportedModes: ["assisted", "operator"],
    requiredFields: ["projectId"],
    optionalFields: ["milestoneId", "invoiceId", "escrowAgreementId"],
    qualificationRules: [
      "Always approval-gated",
      "Evidence requirements should be present",
      "Operator review for exceptions"
    ],
    upsellTargets: []
  }
];
