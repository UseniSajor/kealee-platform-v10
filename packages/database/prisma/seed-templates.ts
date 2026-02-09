// ============================================================
// Kealee Platform – Message Template Seed Data
// Production-ready templates for email, SMS, and in-app channels
// ============================================================

interface TemplateDefinition {
  triggerEvent: string;
  name: string;
  description: string;
  type: string;
  channels: {
    EMAIL?: { subject: string; body: string };
    SMS?: { body: string };
    IN_APP?: { title: string; body: string };
  };
  variables: string[];
}

// ── Template Definitions ─────────────────────────────────────

const TEMPLATES: TemplateDefinition[] = [
  // ─────────────────────────────────────────────────────────
  // 1. WELCOME
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "user.signed_up",
    name: "Welcome",
    description: "Sent when a new user creates an account",
    type: "NOTIFICATION",
    variables: [
      "first_name",
      "role_homeowner",
      "role_contractor",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Welcome to Kealee — Let's Build Something Great",
        body: `Hi {{first_name}},

Welcome to Kealee! We're excited to have you on board.

{{#if role_homeowner}}
You're just a few steps away from finding the right contractor for your project. Here's what happens next:

1. Tell us about your project — what you're looking to build or renovate
2. We'll match you with qualified, vetted contractors in your area
3. You'll receive competitive bids within 24-48 hours
4. Choose the best fit and we'll handle the rest — contracts, payments, and project tracking

<a href="{{app_url}}/projects/new" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Describe Your Project</a>
{{/if}}

{{#if role_contractor}}
Your profile is being set up. Complete these steps to start receiving leads:

1. Add your trade specialties and service area
2. Upload your license and insurance
3. Add portfolio photos of your best work
4. Set up your payment account to receive funds

Once verified, you'll start receiving matched project leads immediately.

<a href="{{app_url}}/profile/setup" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Complete Your Profile</a>
{{/if}}

Questions? Reply to this email — a real person will get back to you.

— The Kealee Team`,
      },
      SMS: {
        body: "Welcome to Kealee, {{first_name}}! Log in to get started: app.kealee.com",
      },
      IN_APP: {
        title: "Welcome!",
        body: "Your account is ready. Let's get started.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 2. NEW LEAD NOTIFICATION
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "lead.created",
    name: "New Lead Notification",
    description: "Sent to matched contractors when a new project lead is available",
    type: "NOTIFICATION",
    variables: [
      "contractor_name",
      "project_type",
      "neighborhood",
      "city",
      "budget_range",
      "desired_timeline",
      "trades_list",
      "bid_deadline",
      "match_count",
      "lead_id",
      "app_url",
      "location",
    ],
    channels: {
      EMAIL: {
        subject: "New Project Lead: {{project_type}} in {{location}}",
        body: `Hi {{contractor_name}},

A new project matching your specialties is available:

Project: {{project_type}}
Location: {{neighborhood}}, {{city}}
Budget Range: {{budget_range}}
Timeline: {{desired_timeline}}
Trades Needed: {{trades_list}}

Bid Deadline: {{bid_deadline}}

You've been matched based on your trade specialties, service area, and availability. Submit your bid to be considered.

<a href="{{app_url}}/leads/{{lead_id}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Details & Submit Bid</a>

This lead was sent to {{match_count}} qualified contractors. First come, best positioned.

— The Kealee Team`,
      },
      SMS: {
        body: "New lead: {{project_type}} in {{city}} ({{budget_range}}). Bid by {{bid_deadline}}. View: app.kealee.com/leads/{{lead_id}}",
      },
      IN_APP: {
        title: "New Lead: {{project_type}}",
        body: "A new {{project_type}} project in {{city}} matches your specialties. Budget: {{budget_range}}. Submit your bid before {{bid_deadline}}.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 3. BID RECEIVED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "bid.submitted",
    name: "Bid Received",
    description: "Sent to the client when a new bid is submitted for their project",
    type: "NOTIFICATION",
    variables: [
      "client_name",
      "contractor_name",
      "bid_amount",
      "project_type",
      "project_name",
      "total_bids",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "New Bid Received for Your {{project_type}}",
        body: `Hi {{client_name}},

Great news — you've received a new bid for your {{project_type}} project.

Contractor: {{contractor_name}}
Bid Amount: \${{bid_amount}}
Total Bids Received: {{total_bids}}

Log in to review this bid, compare with others, and view the contractor's profile, ratings, and portfolio.

<a href="{{app_url}}/projects/{{project_id}}/bids" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Review Bids</a>

We recommend collecting at least 3 bids before making a decision. You're in control of the timeline.

— The Kealee Team`,
      },
      SMS: {
        body: "New bid received: {{contractor_name}} bid \${{bid_amount}} on your {{project_type}}. {{total_bids}} bids so far. Review at app.kealee.com",
      },
      IN_APP: {
        title: "New Bid: \${{bid_amount}}",
        body: "{{contractor_name}} submitted a bid of \${{bid_amount}} for your {{project_type}}. {{total_bids}} bids received so far.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 4. BID ACCEPTED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "bid.accepted",
    name: "Bid Accepted",
    description: "Sent to the winning contractor when their bid is accepted",
    type: "NOTIFICATION",
    variables: [
      "contractor_name",
      "client_name",
      "bid_amount",
      "project_name",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Congratulations! Your Bid Was Accepted",
        body: `Hi {{contractor_name}},

Great news — {{client_name}} has accepted your bid of \${{bid_amount}} for {{project_name}}.

The next step is reviewing and signing the contract. Once both parties sign, the project will be activated and escrow funding will begin.

Here's what to expect:

1. Review the contract generated from your bid details
2. Sign electronically through the Kealee platform
3. Client funds the escrow account
4. You'll receive a Notice to Proceed once funding is confirmed

<a href="{{app_url}}/projects/{{project_id}}/contract" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Review & Sign Contract</a>

Congratulations on winning this project!

— The Kealee Team`,
      },
      SMS: {
        body: "Your bid of \${{bid_amount}} for {{project_name}} was accepted! Log in to review and sign the contract: app.kealee.com",
      },
      IN_APP: {
        title: "Bid Accepted!",
        body: "{{client_name}} accepted your bid of \${{bid_amount}} for {{project_name}}. Review and sign the contract to get started.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 5. BID NOT SELECTED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "bid.not_selected",
    name: "Bid Not Selected",
    description: "Sent to contractors whose bid was not selected when another bid is accepted",
    type: "NOTIFICATION",
    variables: [
      "contractor_name",
      "project_name",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Update on Your Bid for {{project_name}}",
        body: `Hi {{contractor_name}},

Thank you for submitting a bid on {{project_name}}. After careful consideration, the client has selected another contractor for this project.

We appreciate the time and effort you put into your proposal. Here's the good news:

- You remain in the rotation for future leads matching your specialties
- Your profile is active and visible to new clients
- Your bid history strengthens your marketplace presence

New leads are posted daily. Keep your profile up to date and your response time quick to maximize your chances.

<a href="{{app_url}}/leads" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Available Leads</a>

— The Kealee Team`,
      },
      SMS: {
        body: "Your bid on {{project_name}} was not selected this time. You're still in the rotation — new leads are available now at app.kealee.com",
      },
      IN_APP: {
        title: "Bid Update: {{project_name}}",
        body: "The client selected another contractor for {{project_name}}. You remain in the rotation for future leads matching your specialties.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 6. CONTRACT READY
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "contract.generated",
    name: "Contract Ready for Review",
    description: "Sent to both parties when a contract is generated and ready for signatures",
    type: "NOTIFICATION",
    variables: [
      "recipient_name",
      "project_name",
      "contract_amount",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Contract Ready for Review: {{project_name}}",
        body: `Hi {{recipient_name}},

Your contract for {{project_name}} is ready for review and signature.

Contract Amount: \${{contract_amount}}

Please review the following carefully before signing:
- Scope of work and specifications
- Payment milestone schedule
- Timeline and completion dates
- Warranty terms and conditions
- Insurance requirements

Both parties must sign before the project can proceed. You can review and sign electronically through the platform.

<a href="{{app_url}}/projects/{{project_id}}/contract" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Review & Sign Contract</a>

If you have questions about any terms, please reach out before signing. We're here to help.

— The Kealee Team`,
      },
      SMS: {
        body: "Contract for {{project_name}} (\${{contract_amount}}) is ready for your review and signature. Review at app.kealee.com",
      },
      IN_APP: {
        title: "Contract Ready: {{project_name}}",
        body: "Your contract for {{project_name}} (\${{contract_amount}}) is ready for review and signature.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 7. CONTRACT SIGNED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "contract.signed",
    name: "Contract Signed",
    description: "Sent to all parties when the contract has been fully executed",
    type: "NOTIFICATION",
    variables: [
      "recipient_name",
      "project_name",
      "start_date",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Contract Signed — {{project_name}} is a Go!",
        body: `Hi {{recipient_name}},

All parties have signed the contract for {{project_name}}. The project is now active.

What happens next:

1. The client will fund the escrow account for the first milestone
2. Once funded, a formal Notice to Proceed will be issued
3. Work begins on the scheduled start date: {{start_date}}
4. Progress updates and milestone tracking will be available in your dashboard

A signed copy of the contract has been saved to the project documents section for your records.

<a href="{{app_url}}/projects/{{project_id}}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Go to Project Dashboard</a>

— The Kealee Team`,
      },
      SMS: {
        body: "Contract signed for {{project_name}}! Project is active. Start date: {{start_date}}. View details at app.kealee.com",
      },
      IN_APP: {
        title: "Contract Signed!",
        body: "All parties have signed the contract for {{project_name}}. The project is now active with a start date of {{start_date}}.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 8. ESCROW FUNDED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "escrow.funded",
    name: "Escrow Funded",
    description: "Sent to the contractor when the client funds the project escrow",
    type: "NOTIFICATION",
    variables: [
      "contractor_name",
      "project_name",
      "escrow_amount",
      "start_date",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Project Funded: {{project_name}}",
        body: `Hi {{contractor_name}},

The client has funded the escrow for {{project_name}}.

Escrow Amount: \${{escrow_amount}}
Scheduled Start: {{start_date}}

Work can begin as scheduled. Funds are held securely in escrow and will be released upon milestone completion and inspection approval.

Important reminders:
- Submit daily or weekly progress updates through the platform
- Upload photos as work progresses
- Schedule inspections through the platform when milestones are complete
- All change orders must be submitted and approved before additional work begins

<a href="{{app_url}}/projects/{{project_id}}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Project</a>

— The Kealee Team`,
      },
      SMS: {
        body: "{{project_name}} is funded (\${{escrow_amount}}). Work can begin {{start_date}}. Details at app.kealee.com",
      },
      IN_APP: {
        title: "Project Funded",
        body: "Escrow of \${{escrow_amount}} has been funded for {{project_name}}. Work can begin as scheduled on {{start_date}}.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 9. MILESTONE COMPLETE
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "project.milestone.completed",
    name: "Milestone Complete",
    description: "Sent to the client when a contractor marks a milestone as complete",
    type: "NOTIFICATION",
    variables: [
      "client_name",
      "milestone_name",
      "project_name",
      "milestone_amount",
      "inspection_date",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Milestone Complete: {{milestone_name}}",
        body: `Hi {{client_name}},

The contractor has completed a milestone on your project:

Project: {{project_name}}
Milestone: {{milestone_name}}
Payment Amount: \${{milestone_amount}}

An inspection has been scheduled to verify the work meets quality standards and code requirements. Once the inspection passes, you'll be asked to approve the payment release.

You do not need to take action now — we'll notify you after the inspection results are in.

<a href="{{app_url}}/projects/{{project_id}}/milestones" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Milestone Details</a>

— The Kealee Team`,
      },
      SMS: {
        body: "{{milestone_name}} is complete on {{project_name}}. Inspection scheduled. Payment of \${{milestone_amount}} pending approval.",
      },
      IN_APP: {
        title: "Milestone Complete: {{milestone_name}}",
        body: "{{milestone_name}} has been completed on {{project_name}}. Inspection scheduled. Payment of \${{milestone_amount}} pending approval.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 10. INSPECTION PASSED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "inspection.passed",
    name: "Inspection Passed",
    description: "Sent to the client when an inspection passes, requesting payment approval",
    type: "NOTIFICATION",
    variables: [
      "client_name",
      "milestone_name",
      "project_name",
      "milestone_amount",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Inspection Passed — Approve Payment for {{milestone_name}}",
        body: `Hi {{client_name}},

The inspection for {{milestone_name}} on {{project_name}} has passed. The work meets all quality standards and code requirements.

Action Required: Please review and approve the payment release of \${{milestone_amount}} to the contractor.

You have 5 business days to approve or raise concerns. If no action is taken, the payment will be automatically released per the contract terms.

<a href="{{app_url}}/projects/{{project_id}}/milestones" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Approve Payment</a>

If you have concerns about the completed work, you can flag them for review before approving payment.

— The Kealee Team`,
      },
      SMS: {
        body: "Inspection passed for {{milestone_name}} on {{project_name}}. Please approve payment of \${{milestone_amount}} at app.kealee.com",
      },
      IN_APP: {
        title: "Inspection Passed — Action Needed",
        body: "The inspection for {{milestone_name}} passed. Please approve the payment release of \${{milestone_amount}} to proceed.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 11. INSPECTION FAILED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "inspection.failed",
    name: "Inspection Corrections Needed",
    description: "Sent to the contractor when an inspection identifies issues requiring correction",
    type: "ALERT",
    variables: [
      "contractor_name",
      "milestone_name",
      "project_name",
      "corrections_count",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Inspection Corrections Needed: {{milestone_name}}",
        body: `Hi {{contractor_name}},

The inspection for {{milestone_name}} on {{project_name}} identified corrections that need to be addressed before the milestone can be approved.

Corrections Required: {{corrections_count}} item(s)

Please review the inspection report for details on each item, then schedule the corrective work. A re-inspection will be required after corrections are completed.

Important:
- Payment for this milestone will not be released until all corrections are resolved
- The correction deadline is noted in the inspection report
- Contact the project manager if you need to discuss any items

<a href="{{app_url}}/projects/{{project_id}}/inspections" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Inspection Report</a>

— The Kealee Team`,
      },
      SMS: {
        body: "Inspection for {{milestone_name}} on {{project_name}} requires {{corrections_count}} correction(s). Review at app.kealee.com",
      },
      IN_APP: {
        title: "Corrections Needed: {{milestone_name}}",
        body: "The inspection for {{milestone_name}} identified {{corrections_count}} correction(s). Review the report and schedule corrective work.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 12. PAYMENT RELEASED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "payment.released",
    name: "Payment Released",
    description: "Sent to the contractor when a milestone payment is released from escrow",
    type: "NOTIFICATION",
    variables: [
      "contractor_name",
      "amount",
      "milestone_name",
      "project_name",
      "deposit_date",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Payment Released: ${{amount}} for {{milestone_name}}",
        body: `Hi {{contractor_name}},

A payment has been released for completed work:

Project: {{project_name}}
Milestone: {{milestone_name}}
Amount: \${{amount}}
Estimated Deposit: {{deposit_date}}

Funds will be deposited to your bank account on file within 2-3 business days. You can view your full payment history and upcoming payments in your dashboard.

<a href="{{app_url}}/payments" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Payments</a>

Thank you for your work on this project.

— The Kealee Team`,
      },
      SMS: {
        body: "Payment of \${{amount}} released for {{milestone_name}} on {{project_name}}. Deposit in 2-3 business days.",
      },
      IN_APP: {
        title: "Payment Released: \${{amount}}",
        body: "A payment of \${{amount}} has been released for {{milestone_name}} on {{project_name}}. Deposit expected by {{deposit_date}}.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 13. WEEKLY PROGRESS REPORT
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "report.weekly",
    name: "Weekly Progress Report",
    description: "Weekly project progress summary sent to the client",
    type: "UPDATE",
    variables: [
      "client_name",
      "project_name",
      "week_start",
      "week_end",
      "summary_preview",
      "completion_pct",
      "tasks_completed",
      "tasks_upcoming",
      "budget_spent",
      "budget_total",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Weekly Progress Report: {{project_name}} — Week of {{week_start}}",
        body: `Hi {{client_name}},

Here's your weekly progress report for {{project_name}} ({{week_start}} – {{week_end}}).

Overall Completion: {{completion_pct}}%

This Week's Highlights:
{{summary_preview}}

Tasks Completed: {{tasks_completed}}
Upcoming This Week: {{tasks_upcoming}}

Budget: \${{budget_spent}} of \${{budget_total}} spent

View the full report with photos, inspection results, and detailed task breakdowns in your dashboard.

<a href="{{app_url}}/projects/{{project_id}}/reports" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Full Report</a>

— The Kealee Team`,
      },
      SMS: {
        body: "{{project_name}} weekly update: {{completion_pct}}% complete. {{summary_preview}} Full report: app.kealee.com",
      },
      IN_APP: {
        title: "Weekly Report: {{project_name}}",
        body: "Week of {{week_start}}: {{completion_pct}}% complete. {{summary_preview}}",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 14. BUDGET ALERT
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "budget.overrun_detected",
    name: "Budget Alert",
    description: "Sent to the PM when project spending exceeds the budget threshold",
    type: "ALERT",
    variables: [
      "pm_name",
      "project_name",
      "spent",
      "budget",
      "variance_pct",
      "variance_amount",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Budget Alert: {{project_name}}",
        body: `Hi {{pm_name}},

{{project_name}} has exceeded the budget threshold and requires your attention.

Current Spend: \${{spent}}
Approved Budget: \${{budget}}
Variance: \${{variance_amount}} ({{variance_pct}}% over)

Recommended actions:
1. Review recent expenditures and change orders for accuracy
2. Identify the source of the overrun (scope change, material cost increase, rework)
3. Determine whether a change order or budget amendment is needed
4. Update the client and stakeholders as appropriate

<a href="{{app_url}}/projects/{{project_id}}/budget" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Review Budget</a>

This alert was generated automatically based on the project's budget tracking settings.

— The Kealee Team`,
      },
      SMS: {
        body: "BUDGET ALERT: {{project_name}} is {{variance_pct}}% over budget. \${{spent}} of \${{budget}} spent. Review at app.kealee.com",
      },
      IN_APP: {
        title: "Budget Alert: {{project_name}}",
        body: "{{project_name}} has exceeded the budget threshold. Current spend: \${{spent}} of \${{budget}} ({{variance_pct}}% over). Please review.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 15. CHANGE ORDER REQUESTED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "change_order.requested",
    name: "Change Order Requires Approval",
    description: "Sent to the approver when a change order is submitted for review",
    type: "NOTIFICATION",
    variables: [
      "approver_name",
      "project_name",
      "co_title",
      "co_amount",
      "co_number",
      "requested_by",
      "schedule_impact",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Change Order Requires Approval: {{project_name}}",
        body: `Hi {{approver_name}},

A change order has been submitted for {{project_name}} and requires your approval.

Change Order #{{co_number}}: {{co_title}}
Amount: \${{co_amount}}
Requested By: {{requested_by}}
Schedule Impact: {{schedule_impact}}

Please review the change order details, including the cost breakdown, reason for change, and impact on the project timeline.

<a href="{{app_url}}/projects/{{project_id}}/change-orders/{{co_number}}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#000;border-radius:6px;text-decoration:none;font-weight:600;">Review Change Order</a>

Work related to this change order should not proceed until approval is granted.

— The Kealee Team`,
      },
      SMS: {
        body: "Change order for {{project_name}}: {{co_title}} (\${{co_amount}}). Approval needed. Review at app.kealee.com",
      },
      IN_APP: {
        title: "Change Order: {{project_name}}",
        body: "Change order #{{co_number}} ({{co_title}}, \${{co_amount}}) requires your approval for {{project_name}}.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 16. QA ISSUE FOUND
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "qa.issue_detected",
    name: "Quality Issue Detected",
    description: "Sent to the PM and contractor when a quality inspection identifies an issue",
    type: "ALERT",
    variables: [
      "recipient_name",
      "project_name",
      "severity",
      "issue_description",
      "location_detail",
      "detected_by",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Quality Issue Detected: {{project_name}}",
        body: `Hi {{recipient_name}},

A quality inspection has identified an issue on {{project_name}} that requires attention.

Severity: {{severity}}
Issue: {{issue_description}}
Location: {{location_detail}}
Detected By: {{detected_by}}

This issue should be addressed before the next milestone inspection. Failure to correct quality issues may delay milestone approval and payment release.

Please review the full inspection report, which includes photos and specific correction instructions.

<a href="{{app_url}}/projects/{{project_id}}/qa" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View QA Report</a>

— The Kealee Team`,
      },
      SMS: {
        body: "QA issue ({{severity}}) on {{project_name}}: {{issue_description}}. Action needed — review at app.kealee.com",
      },
      IN_APP: {
        title: "QA Issue: {{project_name}}",
        body: "A {{severity}} quality issue was detected: {{issue_description}}. Please address before the next inspection.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 17. PROJECT COMPLETED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "project.completed",
    name: "Project Complete",
    description: "Sent to all project parties when a project reaches completion",
    type: "NOTIFICATION",
    variables: [
      "recipient_name",
      "project_name",
      "completion_date",
      "final_cost",
      "duration_weeks",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Project Complete: {{project_name}}",
        body: `Hi {{recipient_name}},

Congratulations! {{project_name}} has been completed.

Completion Date: {{completion_date}}
Final Cost: \${{final_cost}}
Duration: {{duration_weeks}} weeks

Your closeout package is ready and includes:
- All inspection certificates and approvals
- Warranty documentation
- As-built drawings and specifications
- Final payment reconciliation
- Contractor rating invitation

Please download and retain these documents for your records.

<a href="{{app_url}}/projects/{{project_id}}/closeout" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Download Closeout Package</a>

We'd love your feedback. Please take a moment to rate your experience — it helps other homeowners and rewards great contractors.

Thank you for choosing Kealee.

— The Kealee Team`,
      },
      SMS: {
        body: "{{project_name}} is complete! Your closeout package with all certificates and warranties is ready at app.kealee.com",
      },
      IN_APP: {
        title: "Project Complete!",
        body: "{{project_name}} has been completed. Your closeout package including inspection certificates, warranties, and documentation is available for download.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 18. SUBSCRIPTION CONFIRMATION
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "subscription.created",
    name: "Subscription Confirmation",
    description: "Sent when a user subscribes to a Kealee plan",
    type: "NOTIFICATION",
    variables: [
      "subscriber_name",
      "plan_name",
      "amount",
      "billing_cycle",
      "next_billing_date",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Your {{plan_name}} Plan is Active",
        body: `Hi {{subscriber_name}},

Your subscription has been confirmed. Here are the details:

Plan: {{plan_name}}
Amount: \${{amount}}/{{billing_cycle}}
Next Billing Date: {{next_billing_date}}

All features included in your plan have been unlocked and are ready to use. You can manage your subscription, update your payment method, or change plans at any time from your account settings.

<a href="{{app_url}}/settings/billing" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Manage Subscription</a>

Thank you for your business.

— The Kealee Team`,
      },
      SMS: {
        body: "Your {{plan_name}} plan (\${{amount}}/{{billing_cycle}}) is now active. All features unlocked. Manage at app.kealee.com/settings",
      },
      IN_APP: {
        title: "Subscription Active",
        body: "Your {{plan_name}} subscription (\${{amount}}/{{billing_cycle}}) is now active. All features have been unlocked.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 19. PAYMENT FAILED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "invoice.payment_failed",
    name: "Payment Failed",
    description: "Sent when a subscription payment cannot be processed",
    type: "ALERT",
    variables: [
      "subscriber_name",
      "amount",
      "plan_name",
      "retry_date",
      "suspension_date",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Action Required: Payment Failed for Your Kealee Plan",
        body: `Hi {{subscriber_name}},

We were unable to process your payment of \${{amount}} for your {{plan_name}} plan.

This is usually caused by an expired card, insufficient funds, or a temporary bank hold.

What to do:
1. Log in and update your payment method
2. We'll automatically retry the charge on {{retry_date}}
3. If payment is not resolved by {{suspension_date}}, your account features will be temporarily limited

<a href="{{app_url}}/settings/billing" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Update Payment Method</a>

If you believe this is an error or need assistance, please contact support.

— The Kealee Team`,
      },
      SMS: {
        body: "Payment of \${{amount}} failed for your Kealee {{plan_name}} plan. Update your payment method at app.kealee.com/settings to avoid interruption.",
      },
      IN_APP: {
        title: "Payment Failed",
        body: "We couldn't process your \${{amount}} payment for the {{plan_name}} plan. Please update your payment method to avoid service interruption.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 20. DECISION NEEDED
  // ─────────────────────────────────────────────────────────
  {
    triggerEvent: "decision.needed",
    name: "Decision Needed",
    description: "Sent when a project decision requires input from the PM or client",
    type: "ALERT",
    variables: [
      "recipient_name",
      "project_name",
      "decision_title",
      "decision_description",
      "ai_recommendation",
      "deadline",
      "project_id",
      "app_url",
    ],
    channels: {
      EMAIL: {
        subject: "Action Required: {{decision_title}}",
        body: `Hi {{recipient_name}},

A decision is waiting for your input on {{project_name}}.

Decision: {{decision_title}}
Details: {{decision_description}}
Response Needed By: {{deadline}}

Our AI analysis recommends: {{ai_recommendation}}

This recommendation is based on project data, historical outcomes, and current conditions. You are not required to follow it — the final decision is yours.

<a href="{{app_url}}/projects/{{project_id}}/decisions" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#000;border-radius:6px;text-decoration:none;font-weight:600;">Review & Decide</a>

Delaying this decision may impact the project timeline. Please respond by {{deadline}}.

— The Kealee Team`,
      },
      SMS: {
        body: "Decision needed on {{project_name}}: {{decision_title}}. AI recommends: {{ai_recommendation}}. Respond by {{deadline}} at app.kealee.com",
      },
      IN_APP: {
        title: "Decision Needed: {{decision_title}}",
        body: "A decision on {{project_name}} awaits your input: {{decision_title}}. AI recommends: {{ai_recommendation}}. Please respond by {{deadline}}.",
      },
    },
  },
];

// ── Seed Function ────────────────────────────────────────────

export async function seedMessageTemplates(prisma: any): Promise<number> {
  let seeded = 0;

  for (const tmpl of TEMPLATES) {
    for (const [channel, content] of Object.entries(tmpl.channels)) {
      const subject =
        channel === "EMAIL"
          ? (content as any).subject
          : channel === "IN_APP"
            ? (content as any).title
            : null;

      const body =
        channel === "IN_APP"
          ? (content as any).body
          : (content as any).body;

      const name = `${tmpl.name} (${channel})`;

      await prisma.messageTemplate.upsert({
        where: {
          name_organizationId: {
            name,
            organizationId: null as any,
          },
        },
        update: {
          description: tmpl.description,
          type: tmpl.type,
          channel,
          subject,
          body,
          variables: tmpl.variables,
          isActive: true,
          isSystem: true,
        },
        create: {
          name,
          description: tmpl.description,
          type: tmpl.type,
          channel,
          subject,
          body,
          variables: tmpl.variables,
          isActive: true,
          isSystem: true,
          organizationId: null,
        },
      });

      seeded++;
    }
  }

  console.log(`  Seeded ${seeded} message templates (${TEMPLATES.length} events × 3 channels)`);
  return seeded;
}
