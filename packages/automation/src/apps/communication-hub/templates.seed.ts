/**
 * Default MessageTemplate seed data for the Communication Hub.
 *
 * Run via a seed script to populate the message_templates table.
 * Templates use {{variable}} placeholders that are interpolated at send time.
 */

import { PrismaClient } from '@prisma/client';

interface TemplateSeed {
  name: string;
  description: string;
  type: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[];
  isSystem: boolean;
}

const templates: TemplateSeed[] = [
  // -----------------------------------------------------------------------
  // Welcome & Onboarding
  // -----------------------------------------------------------------------
  {
    name: 'welcome_email',
    description: 'Welcome email sent when a new user signs up',
    type: 'NOTIFICATION',
    channel: 'EMAIL',
    subject: 'Welcome to Kealee, {{user_name}}!',
    body:
      '<h2>Welcome to Kealee!</h2>' +
      '<p>Hi {{user_name}},</p>' +
      '<p>Thank you for joining Kealee. Your account is ready to go.</p>' +
      '<p>Get started by creating your first project or exploring the dashboard.</p>' +
      '<p>If you have any questions, our support team is here to help.</p>' +
      '<p>Best regards,<br>The Kealee Team</p>',
    variables: ['user_name'],
    isSystem: true,
  },
  {
    name: 'welcome_inapp',
    description: 'In-app welcome notification for new users',
    type: 'NOTIFICATION',
    channel: 'IN_APP',
    subject: 'Welcome to Kealee!',
    body: 'Welcome, {{user_name}}! Your account is ready. Start by creating your first project.',
    variables: ['user_name'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Bids
  // -----------------------------------------------------------------------
  {
    name: 'bid_submitted',
    description: 'Notify PM when a new bid is submitted',
    type: 'UPDATE',
    channel: 'ALL',
    subject: 'New Bid Received for {{project_name}}',
    body:
      '<p>Hi {{user_name}},</p>' +
      '<p>A new bid has been submitted for <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>Contractor:</strong> {{contractor_name}}<br>' +
      '<strong>Bid Amount:</strong> {{bid_amount}}</p>' +
      '<p>Review and compare bids in your project dashboard.</p>',
    variables: ['user_name', 'project_name', 'contractor_name', 'bid_amount'],
    isSystem: true,
  },
  {
    name: 'bid_submitted_sms',
    description: 'SMS notification when a new bid is submitted',
    type: 'UPDATE',
    channel: 'SMS',
    subject: null,
    body: 'Kealee: New bid received for {{project_name}} from {{contractor_name}} — {{bid_amount}}. Review in your dashboard.',
    variables: ['project_name', 'contractor_name', 'bid_amount'],
    isSystem: true,
  },
  {
    name: 'bid_accepted',
    description: 'Notify contractor their bid was accepted',
    type: 'NOTIFICATION',
    channel: 'EMAIL',
    subject: 'Your Bid for {{project_name}} Has Been Accepted!',
    body:
      '<p>Hi {{contractor_name}},</p>' +
      '<p>Congratulations! Your bid for <strong>{{project_name}}</strong> has been accepted.</p>' +
      '<p>Next steps:</p>' +
      '<ol><li>Review and sign the contract</li>' +
      '<li>Confirm your availability and team</li>' +
      '<li>Prepare for the project kickoff</li></ol>' +
      '<p>Log in to Kealee to get started.</p>',
    variables: ['contractor_name', 'project_name'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Contracts & Escrow
  // -----------------------------------------------------------------------
  {
    name: 'contract_signed',
    description: 'Notify all parties when a contract is signed',
    type: 'NOTIFICATION',
    channel: 'ALL',
    subject: 'Contract Signed — {{project_name}}',
    body:
      '<p>The contract for <strong>{{project_name}}</strong> ({{contract_number}}) has been signed by all parties.</p>' +
      '<p>The project is now ready to move forward. Escrow funding will begin shortly.</p>',
    variables: ['project_name', 'contract_number'],
    isSystem: true,
  },
  {
    name: 'escrow_funded',
    description: 'Notify contractor when escrow is funded for a milestone',
    type: 'NOTIFICATION',
    channel: 'EMAIL',
    subject: 'Escrow Funded — {{milestone_name}} ({{project_name}})',
    body:
      '<p>Escrow has been funded for milestone <strong>{{milestone_name}}</strong> ' +
      'on project <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>Amount:</strong> {{amount}}</p>' +
      '<p>Work can proceed on this milestone.</p>',
    variables: ['project_name', 'milestone_name', 'amount'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Milestones
  // -----------------------------------------------------------------------
  {
    name: 'milestone_completed',
    description: 'Notify client when a milestone is completed',
    type: 'UPDATE',
    channel: 'ALL',
    subject: 'Milestone Completed — {{milestone_name}} ({{project_name}})',
    body:
      '<p>Great news! Milestone <strong>{{milestone_name}}</strong> has been ' +
      'completed on your project <strong>{{project_name}}</strong>.</p>' +
      '<p>An inspection will be scheduled to verify the work. You will receive ' +
      'an update once the inspection is complete.</p>',
    variables: ['project_name', 'milestone_name'],
    isSystem: true,
  },
  {
    name: 'milestone_completed_sms',
    description: 'SMS notification when a milestone is completed',
    type: 'UPDATE',
    channel: 'SMS',
    subject: null,
    body: 'Kealee: Milestone "{{milestone_name}}" completed on {{project_name}}. Inspection will be scheduled.',
    variables: ['project_name', 'milestone_name'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Inspections
  // -----------------------------------------------------------------------
  {
    name: 'inspection_passed',
    description: 'Notify client when an inspection passes',
    type: 'UPDATE',
    channel: 'ALL',
    subject: '{{inspection_type}} Passed — {{project_name}}',
    body:
      '<p>The <strong>{{inspection_type}}</strong> inspection for ' +
      '<strong>{{project_name}}</strong> has passed.</p>' +
      '<p>Payment for the associated milestone will be processed shortly.</p>',
    variables: ['project_name', 'inspection_type'],
    isSystem: true,
  },
  {
    name: 'inspection_failed',
    description: 'Notify contractor when an inspection fails',
    type: 'ALERT',
    channel: 'ALL',
    subject: '{{inspection_type}} Failed — {{project_name}}',
    body:
      '<p>The <strong>{{inspection_type}}</strong> inspection for ' +
      '<strong>{{project_name}}</strong> did not pass.</p>' +
      '<p><strong>Reason:</strong> {{failure_reason}}</p>' +
      '<p>Please address the noted issues and schedule a re-inspection.</p>',
    variables: ['project_name', 'inspection_type', 'failure_reason'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Payments
  // -----------------------------------------------------------------------
  {
    name: 'payment_released',
    description: 'Notify contractor when a payment is released',
    type: 'NOTIFICATION',
    channel: 'EMAIL',
    subject: 'Payment Released — {{project_name}}',
    body:
      '<p>A payment of <strong>{{amount}}</strong> has been released for ' +
      'milestone <strong>{{milestone_name}}</strong> on project ' +
      '<strong>{{project_name}}</strong>.</p>' +
      '<p>Funds will arrive in your account within 1-3 business days.</p>',
    variables: ['project_name', 'milestone_name', 'amount'],
    isSystem: true,
  },
  {
    name: 'payment_released_sms',
    description: 'SMS notification when a payment is released',
    type: 'NOTIFICATION',
    channel: 'SMS',
    subject: null,
    body: 'Kealee: Payment of {{amount}} released for {{milestone_name}} on {{project_name}}. Expect funds in 1-3 business days.',
    variables: ['project_name', 'milestone_name', 'amount'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Budget & Schedule Alerts
  // -----------------------------------------------------------------------
  {
    name: 'budget_overrun',
    description: 'Alert PM when a budget overrun is detected',
    type: 'ALERT',
    channel: 'ALL',
    subject: 'Budget Alert — {{project_name}} ({{alert_level}})',
    body:
      '<p><strong>Budget overrun detected</strong> on <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>Category:</strong> {{category}}<br>' +
      '<strong>Overrun Amount:</strong> {{overrun_amount}}<br>' +
      '<strong>Alert Level:</strong> {{alert_level}}</p>' +
      '<p>Review the budget in your dashboard and take corrective action.</p>',
    variables: ['project_name', 'category', 'overrun_amount', 'alert_level'],
    isSystem: true,
  },
  {
    name: 'schedule_disruption',
    description: 'Alert PM when a schedule disruption is detected',
    type: 'ALERT',
    channel: 'ALL',
    subject: 'Schedule Disruption — {{project_name}}',
    body:
      '<p>A schedule disruption has been detected on <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>Type:</strong> {{disruption_type}}<br>' +
      '<strong>Impact:</strong> {{impact_days}} day(s)</p>' +
      '<p>Review the schedule and consider adjustments or change orders.</p>',
    variables: ['project_name', 'disruption_type', 'impact_days'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Change Orders
  // -----------------------------------------------------------------------
  {
    name: 'change_order_requested',
    description: 'Notify PM when a change order is requested',
    type: 'UPDATE',
    channel: 'ALL',
    subject: 'Change Order Requested — {{co_number}} ({{project_name}})',
    body:
      '<p>A new change order has been requested for <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>CO#:</strong> {{co_number}}<br>' +
      '<strong>Title:</strong> {{co_title}}<br>' +
      '<strong>Estimated Cost:</strong> {{co_amount}}</p>' +
      '<p>Review and approve or reject in your decision queue.</p>',
    variables: ['project_name', 'co_number', 'co_title', 'co_amount'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Decisions
  // -----------------------------------------------------------------------
  {
    name: 'decision_needed',
    description: 'Notify PM when a decision requires their attention',
    type: 'ALERT',
    channel: 'ALL',
    subject: 'Decision Required — {{project_name}}',
    body:
      '<p>A decision requires your attention on <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>Type:</strong> {{decision_type}}<br>' +
      '<strong>Details:</strong> {{description}}</p>' +
      '<p>Review options and make your decision in the Command Center.</p>',
    variables: ['project_name', 'decision_type', 'description'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // QA Issues
  // -----------------------------------------------------------------------
  {
    name: 'qa_issue_pm',
    description: 'Notify PM when a QA issue is detected',
    type: 'ALERT',
    channel: 'ALL',
    subject: 'QA Issue Detected — {{project_name}} ({{severity}})',
    body:
      '<p>A QA issue has been detected on <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>Severity:</strong> {{severity}}<br>' +
      '<strong>Summary:</strong> {{issue_summary}}</p>' +
      '<p>Review the full QA report in your dashboard.</p>',
    variables: ['project_name', 'severity', 'issue_summary'],
    isSystem: true,
  },
  {
    name: 'qa_issue_contractor',
    description: 'Notify contractor when a QA issue is detected',
    type: 'ALERT',
    channel: 'EMAIL',
    subject: 'QA Issue Requires Attention — {{project_name}}',
    body:
      '<p>A QA issue has been flagged on <strong>{{project_name}}</strong>.</p>' +
      '<p><strong>Severity:</strong> {{severity}}<br>' +
      '<strong>Summary:</strong> {{issue_summary}}</p>' +
      '<p>Please review and address the issue as soon as possible.</p>',
    variables: ['project_name', 'severity', 'issue_summary'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Documents
  // -----------------------------------------------------------------------
  {
    name: 'document_generated',
    description: 'Notify PM when a document or report is generated',
    type: 'UPDATE',
    channel: 'IN_APP',
    subject: 'New {{document_type}} Ready',
    body: 'A new {{document_type}} has been generated for {{project_name}}. View it in your reports section.',
    variables: ['project_name', 'document_type', 'document_id'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Subscription
  // -----------------------------------------------------------------------
  {
    name: 'subscription_confirmed',
    description: 'Subscription confirmation email',
    type: 'NOTIFICATION',
    channel: 'EMAIL',
    subject: 'Subscription Confirmed — Kealee',
    body:
      '<p>Hi {{user_name}},</p>' +
      '<p>Your Kealee subscription is now active. Thank you for choosing us!</p>' +
      '<p>You now have access to all features included in your plan.</p>' +
      '<p>Best regards,<br>The Kealee Team</p>',
    variables: ['user_name'],
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // Project Completed
  // -----------------------------------------------------------------------
  {
    name: 'project_completed',
    description: 'Notify all parties when a project is completed',
    type: 'NOTIFICATION',
    channel: 'ALL',
    subject: 'Project Completed — {{project_name}}',
    body:
      '<p>Congratulations! Project <strong>{{project_name}}</strong> has been ' +
      'marked as complete.</p>' +
      '<p>A closeout package with final reports, inspection records, and financial ' +
      'summary will be generated and shared shortly.</p>' +
      '<p>Thank you for using Kealee!</p>',
    variables: ['project_name'],
    isSystem: true,
  },
];

/**
 * Seed the message_templates table with default system templates.
 * Uses upsert to avoid duplicates on re-run.
 */
export async function seedTemplates(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    let created = 0;
    let updated = 0;

    for (const tpl of templates) {
      const result = await prisma.messageTemplate.upsert({
        where: {
          name_organizationId: {
            name: tpl.name,
            organizationId: '',
          },
        },
        create: {
          name: tpl.name,
          description: tpl.description,
          type: tpl.type,
          channel: tpl.channel,
          subject: tpl.subject,
          body: tpl.body,
          variables: tpl.variables,
          isSystem: tpl.isSystem,
          isActive: true,
        },
        update: {
          description: tpl.description,
          type: tpl.type,
          channel: tpl.channel,
          subject: tpl.subject,
          body: tpl.body,
          variables: tpl.variables,
          isSystem: tpl.isSystem,
        },
      });

      // Check if it was just created or updated
      const age = Date.now() - result.createdAt.getTime();
      if (age < 5000) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(
      `[CommunicationHub] Templates seeded: ${created} created, ${updated} updated (${templates.length} total)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running directly: npx ts-node templates.seed.ts
if (typeof require !== 'undefined' && require.main === module) {
  seedTemplates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
