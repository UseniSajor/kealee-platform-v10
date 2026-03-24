import { WorkflowTemplateSeed } from "../types";

export const workflowTemplateSeeds: WorkflowTemplateSeed[] = [
  {
    code: "wf_homeowner_concept_v1",
    version: "1.0.0",
    status: "active",
    name: "Homeowner Concept Workflow",
    appliesToIntents: ["design_concept"],
    mode: "assisted",
    entryCriteria: ["residential concept request", "early design intent"],
    steps: [
      { order: 1, code: "create_project", title: "Create project", type: "tool", target: "create_project", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 2, code: "update_project_context", title: "Normalize intake", type: "tool", target: "update_project_context", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 3, code: "check_zoning", title: "Check zoning", type: "tool", target: "check_zoning", required: false, approvalRequired: false, stopOnFailure: false },
      { order: 4, code: "run_feasibility", title: "Run feasibility light", type: "tool", target: "run_feasibility", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 5, code: "generate_concept_brief", title: "Generate concept brief", type: "tool", target: "generate_concept_brief", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 6, code: "create_estimate", title: "Create rough estimate", type: "tool", target: "create_estimate", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 7, code: "present_upgrade", title: "Present paid next steps", type: "approval", target: "request_human_approval", required: true, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["project_created", "concept_generated", "estimate_generated", "next_paid_step_recommended"],
    escalationTargets: ["design", "operator", "architect"]
  },
  {
    code: "wf_homeowner_renovation_v1",
    version: "1.0.0",
    status: "active",
    name: "Homeowner Renovation Workflow",
    appliesToIntents: ["renovation"],
    mode: "autonomous",
    entryCriteria: ["residential remodel", "addition", "tenant fit-out light"],
    steps: [
      { order: 1, code: "create_project", title: "Create project", type: "tool", target: "create_project", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 2, code: "check_zoning", title: "Check zoning", type: "tool", target: "check_zoning", required: false, approvalRequired: false, stopOnFailure: false },
      { order: 3, code: "run_feasibility", title: "Run feasibility", type: "tool", target: "run_feasibility", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 4, code: "create_estimate", title: "Create estimate", type: "tool", target: "create_estimate", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 5, code: "permit_path_review", title: "Determine permit path", type: "agent", target: "permit", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 6, code: "offer_checkout", title: "Offer permit path or concept checkout", type: "approval", target: "request_human_approval", required: true, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["estimate_generated", "permit_path_identified", "upsell_presented"]
  },
  {
    code: "wf_new_build_precon_v1",
    version: "1.0.0",
    status: "active",
    name: "New Build Preconstruction Workflow",
    appliesToIntents: ["new_build"],
    mode: "assisted",
    entryCriteria: ["ground-up scope", "new construction"],
    steps: [
      { order: 1, code: "create_project", title: "Create project", type: "tool", target: "create_project", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 2, code: "check_zoning", title: "Check zoning", type: "tool", target: "check_zoning", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 3, code: "run_feasibility", title: "Run feasibility", type: "tool", target: "run_feasibility", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 4, code: "generate_concept_brief", title: "Generate concept brief", type: "tool", target: "generate_concept_brief", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 5, code: "create_estimate", title: "Create estimate", type: "tool", target: "create_estimate", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 6, code: "professional_handoff", title: "Route to architect/engineer handoff", type: "agent", target: "design", required: true, approvalRequired: false, stopOnFailure: false }
    ],
    successCriteria: ["zoning_checked", "feasibility_generated", "concept_generated", "professional_handoff_ready"]
  },
  {
    code: "wf_permit_only_v1",
    version: "1.0.0",
    status: "active",
    name: "Permit Only Workflow",
    appliesToIntents: ["permit_only"],
    mode: "autonomous",
    entryCriteria: ["permit assistance request", "status or filing support"],
    steps: [
      { order: 1, code: "create_project", title: "Create project shell", type: "tool", target: "create_project", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 2, code: "check_zoning", title: "Check zoning context", type: "tool", target: "check_zoning", required: false, approvalRequired: false, stopOnFailure: false },
      { order: 3, code: "permit_review", title: "Review permit path", type: "agent", target: "permit", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 4, code: "request_plan_upload", title: "Ask for plans if missing", type: "question", target: "request_missing_documents", required: false, approvalRequired: false, stopOnFailure: false },
      { order: 5, code: "offer_permit_services", title: "Present permit services", type: "approval", target: "request_human_approval", required: true, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["permit_path_identified", "required_docs_defined", "service_offer_presented"]
  },
  {
    code: "wf_feasibility_light_v1",
    version: "1.0.0",
    status: "active",
    name: "Feasibility Light Workflow",
    appliesToIntents: ["feasibility_light"],
    mode: "autonomous",
    entryCriteria: ["viability check", "early site screening"],
    steps: [
      { order: 1, code: "create_project", title: "Create project shell", type: "tool", target: "create_project", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 2, code: "check_zoning", title: "Check zoning", type: "tool", target: "check_zoning", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 3, code: "run_feasibility", title: "Run feasibility", type: "tool", target: "run_feasibility", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 4, code: "present_findings", title: "Present findings and upgrade path", type: "approval", target: "request_human_approval", required: true, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["zoning_checked", "feasibility_generated", "upgrade_presented"]
  },
  {
    code: "wf_developer_feasibility_v1",
    version: "1.0.0",
    status: "active",
    name: "Developer Feasibility Workflow",
    appliesToIntents: ["developer_feasibility"],
    mode: "assisted",
    entryCriteria: ["developer, multifamily, mixed-use, or land evaluation"],
    steps: [
      { order: 1, code: "create_project", title: "Create developer project", type: "tool", target: "create_project", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 2, code: "check_zoning", title: "Check zoning", type: "tool", target: "check_zoning", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 3, code: "run_feasibility", title: "Run feasibility", type: "tool", target: "run_feasibility", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 4, code: "developer_summary", title: "Developer summary", type: "agent", target: "developer", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 5, code: "finance_review", title: "Finance review", type: "agent", target: "finance", required: false, approvalRequired: false, stopOnFailure: false },
      { order: 6, code: "offer_advisory_package", title: "Offer advisory package", type: "approval", target: "request_human_approval", required: true, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["developer_summary_generated", "feasibility_generated", "advisory_offer_presented"]
  },
  {
    code: "wf_estimate_only_v1",
    version: "1.0.0",
    status: "active",
    name: "Estimate Only Workflow",
    appliesToIntents: ["estimate_only"],
    mode: "autonomous",
    entryCriteria: ["cost question", "budget check"],
    steps: [
      { order: 1, code: "create_project", title: "Create project shell", type: "tool", target: "create_project", required: true, approvalRequired: false, stopOnFailure: true },
      { order: 2, code: "create_estimate", title: "Create estimate", type: "tool", target: "create_estimate", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 3, code: "present_estimate", title: "Present estimate and next steps", type: "approval", target: "request_human_approval", required: true, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["estimate_generated", "next_steps_presented"]
  },
  {
    code: "wf_contractor_match_v1",
    version: "1.0.0",
    status: "active",
    name: "Contractor Match Workflow",
    appliesToIntents: ["contractor_match"],
    mode: "assisted",
    entryCriteria: ["ready to match builders/contractors"],
    steps: [
      { order: 1, code: "project_readiness", title: "Assess readiness", type: "agent", target: "marketplace", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 2, code: "assign_contractor", title: "Assign contractor candidates", type: "tool", target: "assign_contractor", required: true, approvalRequired: true, stopOnFailure: false },
      { order: 3, code: "notify_candidates", title: "Notify candidates", type: "tool", target: "send_email", required: false, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["readiness_scored", "candidates_selected"]
  },
  {
    code: "wf_construction_execution_v1",
    version: "1.0.0",
    status: "active",
    name: "Construction Execution Workflow",
    appliesToIntents: ["construction_execution"],
    mode: "operator",
    entryCriteria: ["project in execution phase"],
    steps: [
      { order: 1, code: "create_milestone_schedule", title: "Create milestones", type: "tool", target: "create_milestone_schedule", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 2, code: "ops_monitor", title: "Monitor ops", type: "agent", target: "operations", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 3, code: "payments_monitor", title: "Monitor payments", type: "agent", target: "payments", required: true, approvalRequired: false, stopOnFailure: false }
    ],
    successCriteria: ["milestones_created", "ops_monitoring_active", "payments_monitoring_active"]
  },
  {
    code: "wf_payment_disbursement_v1",
    version: "1.0.0",
    status: "active",
    name: "Payment Disbursement Workflow",
    appliesToIntents: ["payment_disbursement"],
    mode: "operator",
    entryCriteria: ["milestone payment request", "escrow release"],
    steps: [
      { order: 1, code: "validate_milestone", title: "Validate milestone evidence", type: "agent", target: "payments", required: true, approvalRequired: false, stopOnFailure: false },
      { order: 2, code: "human_approval", title: "Obtain approval", type: "approval", target: "request_human_approval", required: true, approvalRequired: true, stopOnFailure: true },
      { order: 3, code: "create_checkout_or_release", title: "Create financial action", type: "tool", target: "create_checkout", required: false, approvalRequired: true, stopOnFailure: false }
    ],
    successCriteria: ["evidence_validated", "approval_recorded", "financial_action_ready"]
  }
];
