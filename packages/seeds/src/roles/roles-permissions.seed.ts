import { RolePermissionSeed } from "../types";

export const rolePermissionSeeds: RolePermissionSeed[] = [
  {
    code: "role_homeowner",
    version: "1.0.0",
    status: "active",
    roleName: "Homeowner",
    audience: "external",
    description: "Retail owner/client using concept, permit, estimate, and project visibility flows.",
    permissions: ["project.read.own", "checkout.approve.own", "documents.upload.own", "approval.respond.own", "messages.read.own"],
    approvalScopes: ["service_purchase", "contractor_match", "payment_release_if_authorized"]
  },
  {
    code: "role_developer",
    version: "1.0.0",
    status: "active",
    roleName: "Developer",
    audience: "external",
    description: "Development-focused client using land, feasibility, finance, and project oversight modules.",
    permissions: ["project.read.own", "portfolio.read.own", "advisory.request", "documents.upload.own", "reports.read.own"],
    approvalScopes: ["service_purchase", "advisory_engagement", "capital_stack_review"]
  },
  {
    code: "role_contractor",
    version: "1.0.0",
    status: "active",
    roleName: "Contractor",
    audience: "external",
    description: "Marketplace contractor with leads, bids, credentials, and project engagement access.",
    permissions: ["profile.update.self", "leads.read.assigned", "bids.create", "documents.upload.credentials", "projects.read.assigned"],
    approvalScopes: ["engagement_acceptance"]
  },
  {
    code: "role_architect",
    version: "1.0.0",
    status: "active",
    roleName: "Architect",
    audience: "external",
    description: "Professional design collaborator for complex scope handoffs.",
    permissions: ["project.read.assigned", "documents.upload.design", "concept.review", "comment.create"],
    approvalScopes: ["professional_handoff_acceptance"]
  },
  {
    code: "role_engineer",
    version: "1.0.0",
    status: "active",
    roleName: "Engineer",
    audience: "external",
    description: "Engineering collaborator for structural, MEP, civil, or specialty review.",
    permissions: ["project.read.assigned", "documents.upload.technical", "comment.create", "review.submit"],
    approvalScopes: ["professional_handoff_acceptance"]
  },
  {
    code: "role_lender",
    version: "1.0.0",
    status: "active",
    roleName: "Lender",
    audience: "external",
    description: "Lender or finance stakeholder receiving controlled reporting and draw visibility.",
    permissions: ["project.read.finance_scoped", "draws.read", "reports.read.finance", "documents.read.finance_scoped"],
    approvalScopes: ["draw_acknowledgement"]
  },
  {
    code: "role_operator",
    version: "1.0.0",
    status: "active",
    roleName: "KeaCore Operator",
    audience: "internal",
    description: "Internal operator supervising sessions, approvals, and escalations.",
    permissions: ["session.read", "session.update", "task.read", "task.retry", "task.cancel", "approval.decide", "tool.execute.manual", "risk.override", "messages.send"],
    approvalScopes: ["all_internal_operational_approvals"]
  },
  {
    code: "role_admin",
    version: "1.0.0",
    status: "active",
    roleName: "Platform Admin",
    audience: "internal",
    description: "Administrative superuser across config, audit, disputes, and platform controls.",
    permissions: ["*"],
    approvalScopes: ["global_override"]
  },
  {
    code: "role_finance_reviewer",
    version: "1.0.0",
    status: "active",
    roleName: "Finance Reviewer",
    audience: "internal",
    description: "Finance/control role for disbursements, trust, and payment-related approvals.",
    permissions: ["payments.read", "escrow.read", "approval.decide.finance", "reports.read.finance", "milestones.read"],
    approvalScopes: ["checkout_approval", "disbursement_approval", "escrow_release"]
  },
  {
    code: "role_permit_reviewer",
    version: "1.0.0",
    status: "active",
    roleName: "Permit Reviewer",
    audience: "internal",
    description: "Internal permit specialist reviewing permit path, case packaging, and jurisdiction fit.",
    permissions: ["permit_cases.read", "permit_cases.update", "documents.read.permit_scoped", "approval.decide.permit"],
    approvalScopes: ["permit_strategy_approval", "submission_readiness"]
  },
  {
    code: "role_system",
    version: "1.0.0",
    status: "active",
    roleName: "System",
    audience: "system",
    description: "KeaCore and system automation principal.",
    permissions: ["task.run", "memory.write", "events.publish", "tool.execute.allowed"],
    approvalScopes: []
  }
];
