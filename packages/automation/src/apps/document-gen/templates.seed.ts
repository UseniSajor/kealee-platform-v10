/**
 * Default DocumentTemplate seed data for the Document Generator.
 *
 * Each template contains HTML content with {{variable}} placeholders
 * that are interpolated at generation time by DocumentGeneratorService.
 */

import { PrismaClient } from '@prisma/client';

interface DocumentTemplateSeed {
  name: string;
  description: string;
  type: string;
  category: string;
  content: string;
  variables: Record<string, string>;
  isSystem: boolean;
}

const templates: DocumentTemplateSeed[] = [
  // -----------------------------------------------------------------------
  // 1. Construction Contract
  // -----------------------------------------------------------------------
  {
    name: 'Standard Construction Contract',
    description: 'Standard construction contract with milestone schedule and payment terms.',
    type: 'CONTRACT',
    category: 'CONTRACTS',
    content: `<h1>CONSTRUCTION CONTRACT</h1>

<p><strong>Date:</strong> {{current_date}}</p>
<p><strong>Contract Amount:</strong> {{contract_amount}}</p>

<h2>1. Parties</h2>
<p><strong>Owner/Client:</strong> {{client_name}}<br>
<strong>Email:</strong> {{client_email}} &bull; <strong>Phone:</strong> {{client_phone}}</p>

<p><strong>Contractor:</strong> {{contractor_company}} ({{contractor_name}})<br>
<strong>Email:</strong> {{contractor_email}} &bull; <strong>Phone:</strong> {{contractor_phone}}<br>
<strong>Address:</strong> {{contractor_address}}</p>

<h2>2. Project</h2>
<p><strong>Project Name:</strong> {{project_name}}<br>
<strong>Project Address:</strong> {{project_address}}<br>
<strong>Scheduled Start:</strong> {{start_date}}<br>
<strong>Scheduled Completion:</strong> {{end_date}}<br>
<strong>Duration:</strong> {{timeline_days}} calendar days</p>

<h2>3. Scope of Work</h2>
<p>{{scope}}</p>

<h2>4. Contract Price &amp; Payment Schedule</h2>
<p>The total contract price is <strong>{{contract_amount}}</strong> plus a platform administration fee of <strong>{{platform_fee}}</strong>, for a total of <strong>{{total_with_fee}}</strong>.</p>
<p>Payments shall be made upon completion and inspection of each milestone per the following schedule:</p>
{{milestone_schedule}}

<h2>5. Payment Terms</h2>
<ul>
  <li>All payments are processed through the Kealee escrow system.</li>
  <li>Payment is released within 5 business days of milestone inspection approval.</li>
  <li>A 10% retainage shall be held until final completion and punch list resolution.</li>
  <li>Retainage is released within 30 days of project closeout acceptance.</li>
</ul>

<h2>6. Change Orders</h2>
<p>Any changes to the scope, schedule, or price must be documented via a written Change Order approved by both parties through the Kealee platform before work proceeds.</p>

<h2>7. Insurance &amp; Licensing</h2>
<p>Contractor shall maintain general liability insurance of no less than $1,000,000 per occurrence and workers' compensation insurance as required by law. Contractor warrants that all required licenses are current and valid.</p>

<h2>8. Warranties</h2>
<p>Contractor warrants all work for a period of one (1) year from the date of substantial completion. This warranty covers defects in workmanship and materials.</p>

<h2>9. Dispute Resolution</h2>
<p>Any disputes shall first be submitted to the Kealee dispute resolution process. If unresolved within 30 days, disputes shall proceed to binding arbitration in the jurisdiction of the project location.</p>

<h2>10. Termination</h2>
<p>Either party may terminate this contract with 14 days' written notice. In the event of termination, Contractor shall be paid for work satisfactorily completed to date.</p>

<h2>Signatures</h2>
<div class="signature-block">
  <div>
    <div class="signature-line">{{client_name}} (Owner/Client)</div>
    <p>Date: _______________</p>
  </div>
  <div>
    <div class="signature-line">{{contractor_name}} (Contractor)</div>
    <p>Date: _______________</p>
  </div>
</div>`,
    variables: {
      client_name: 'Owner/client name',
      client_email: 'Client email',
      client_phone: 'Client phone',
      contractor_name: 'Contractor contact name',
      contractor_company: 'Contractor company name',
      contractor_email: 'Contractor email',
      contractor_phone: 'Contractor phone',
      contractor_address: 'Contractor address',
      project_name: 'Project name',
      project_address: 'Project address',
      contract_amount: 'Total contract amount',
      platform_fee: 'Platform fee',
      total_with_fee: 'Total with platform fee',
      start_date: 'Scheduled start date',
      end_date: 'Scheduled end date',
      timeline_days: 'Project duration in days',
      scope: 'Scope of work description',
      milestone_schedule: 'HTML milestone schedule table',
    },
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // 2. Subcontractor Agreement
  // -----------------------------------------------------------------------
  {
    name: 'Subcontractor Agreement',
    description: 'Agreement between general contractor and subcontractor for specific trade work.',
    type: 'CONTRACT',
    category: 'CONTRACTS',
    content: `<h1>SUBCONTRACTOR AGREEMENT</h1>

<p><strong>Date:</strong> {{current_date}}</p>

<h2>1. Parties</h2>
<p><strong>General Contractor:</strong> {{gc_company}} ({{gc_name}})<br>
<strong>Subcontractor:</strong> {{sub_company}} ({{sub_name}})<br>
<strong>Trade:</strong> {{trade}}</p>

<h2>2. Project</h2>
<p><strong>Project:</strong> {{project_name}}<br>
<strong>Address:</strong> {{project_address}}</p>

<h2>3. Scope of Work</h2>
<p>{{scope}}</p>
<p>Work shall be performed in accordance with the project plans, specifications, and applicable building codes.</p>

<h2>4. Contract Price</h2>
<p>Subcontract Amount: <strong>{{contract_amount}}</strong></p>
<p>Payment upon completion of each phase as approved by the General Contractor.</p>

<h2>5. Schedule</h2>
<p><strong>Start Date:</strong> {{start_date}}<br>
<strong>Completion Date:</strong> {{end_date}}</p>
<p>Subcontractor shall maintain the project schedule and coordinate with other trades.</p>

<h2>6. Insurance Requirements</h2>
<ul>
  <li>General Liability: minimum $1,000,000 per occurrence</li>
  <li>Workers' Compensation: as required by law</li>
  <li>Auto Liability: minimum $500,000</li>
</ul>

<h2>7. Warranty</h2>
<p>Subcontractor warrants all work for one (1) year from date of acceptance.</p>

<h2>Signatures</h2>
<div class="signature-block">
  <div><div class="signature-line">{{gc_name}} (General Contractor)</div></div>
  <div><div class="signature-line">{{sub_name}} (Subcontractor)</div></div>
</div>`,
    variables: {
      gc_company: 'General contractor company',
      gc_name: 'GC contact name',
      sub_company: 'Subcontractor company',
      sub_name: 'Subcontractor contact name',
      trade: 'Trade specialty',
      scope: 'Scope of work',
      contract_amount: 'Subcontract amount',
    },
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // 3. Change Order Form
  // -----------------------------------------------------------------------
  {
    name: 'Change Order Form',
    description: 'Standard change order form for scope, cost, or schedule modifications.',
    type: 'CHANGE_ORDER',
    category: 'FINANCIAL',
    content: `<h1>CHANGE ORDER</h1>

<table>
  <tr><td><strong>CO Number:</strong></td><td>{{co_number}}</td></tr>
  <tr><td><strong>Project:</strong></td><td>{{project_name}}</td></tr>
  <tr><td><strong>Date:</strong></td><td>{{current_date}}</td></tr>
  <tr><td><strong>Status:</strong></td><td>{{co_status}}</td></tr>
</table>

<h2>Description of Change</h2>
<p><strong>Title:</strong> {{co_title}}</p>
<p>{{co_description}}</p>
<p><strong>Reason:</strong> {{co_reason}}</p>

<h2>Cost Impact</h2>
<table>
  <tr><td>Labor</td><td>{{labor_cost}}</td></tr>
  <tr><td>Materials</td><td>{{material_cost}}</td></tr>
  <tr><td>Markup ({{markup_percent}})</td><td>—</td></tr>
  <tr><td><strong>Total Change Order Amount</strong></td><td><strong>{{total_cost}}</strong></td></tr>
</table>

<p><strong>Original Contract Amount:</strong> {{original_amount}}</p>

<h2>Schedule Impact</h2>
<p>{{schedule_impact}}</p>

<h2>Approval</h2>
<div class="signature-block">
  <div>
    <div class="signature-line">Owner/Client Approval</div>
    <p>Date: _______________</p>
  </div>
  <div>
    <div class="signature-line">Contractor Acknowledgment</div>
    <p>Date: _______________</p>
  </div>
</div>`,
    variables: {
      co_number: 'Change order number',
      co_title: 'Change order title',
      co_description: 'Description of change',
      co_reason: 'Reason for change',
      labor_cost: 'Labor cost',
      material_cost: 'Material cost',
      markup_percent: 'Markup percentage',
      total_cost: 'Total change order cost',
      original_amount: 'Original contract amount',
      schedule_impact: 'Impact on schedule',
    },
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // 4. Progress Invoice
  // -----------------------------------------------------------------------
  {
    name: 'Progress Invoice',
    description: 'Invoice for milestone completion payment.',
    type: 'INVOICE',
    category: 'FINANCIAL',
    content: `<h1>INVOICE</h1>

<table>
  <tr><td><strong>Invoice #:</strong></td><td>{{invoice_number}}</td></tr>
  <tr><td><strong>Date:</strong></td><td>{{invoice_date}}</td></tr>
  <tr><td><strong>Due Date:</strong></td><td>{{due_date}}</td></tr>
</table>

<h2>Bill To</h2>
<p><strong>{{client_name}}</strong><br>
{{client_email}}</p>

<h2>Project</h2>
<p><strong>{{project_name}}</strong><br>
{{project_address}}</p>

<h2>Line Items</h2>
<table>
  <thead><tr><th>Description</th><th>Amount</th></tr></thead>
  <tbody>
    <tr><td>{{milestone_name}} — Milestone Completion</td><td>{{amount}}</td></tr>
  </tbody>
  <tfoot>
    <tr><td><strong>Total Due</strong></td><td><strong>{{amount}}</strong></td></tr>
  </tfoot>
</table>

<h2>Payment Instructions</h2>
<p>Payment is processed automatically through the Kealee escrow system upon milestone approval. No manual payment is required.</p>

<p><em>This invoice was generated by the Kealee platform and serves as a record of the milestone payment.</em></p>`,
    variables: {
      invoice_number: 'Invoice number',
      invoice_date: 'Invoice date',
      due_date: 'Payment due date',
      milestone_name: 'Milestone name',
      amount: 'Payment amount',
    },
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // 5. Punch List
  // -----------------------------------------------------------------------
  {
    name: 'Punch List',
    description: 'List of deficiencies and items to correct before project acceptance.',
    type: 'REPORT',
    category: 'REPORTS',
    content: `<h1>PUNCH LIST</h1>

<table>
  <tr><td><strong>Project:</strong></td><td>{{project_name}}</td></tr>
  <tr><td><strong>Address:</strong></td><td>{{project_address}}</td></tr>
  <tr><td><strong>Date:</strong></td><td>{{generated_date}}</td></tr>
  <tr><td><strong>Total Items:</strong></td><td>{{issue_count}}</td></tr>
  <tr><td><strong>QA Inspections Reviewed:</strong></td><td>{{qa_count}}</td></tr>
</table>

<h2>Instructions</h2>
<p>The following items require correction before the project (or milestone) can be accepted as complete. Address each item and mark as resolved in the Kealee platform. A re-inspection will be scheduled after all items are resolved.</p>

<h2>Punch List Items</h2>
{{issue_table}}

<h2>Contractor Acknowledgment</h2>
<p>I acknowledge receipt of this punch list and agree to complete all items within the timeframe specified.</p>
<div class="signature-block">
  <div><div class="signature-line">Contractor Signature</div><p>Date: _______________</p></div>
</div>`,
    variables: {
      generated_date: 'Date generated',
      issue_count: 'Number of punch list items',
      qa_count: 'Number of QA inspections reviewed',
      issue_table: 'HTML table of punch list items',
    },
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // 6. Scope of Work
  // -----------------------------------------------------------------------
  {
    name: 'Scope of Work',
    description: 'Detailed scope of work document for a project or trade.',
    type: 'CONTRACT',
    category: 'CONTRACTS',
    content: `<h1>SCOPE OF WORK</h1>

<table>
  <tr><td><strong>Project:</strong></td><td>{{project_name}}</td></tr>
  <tr><td><strong>Address:</strong></td><td>{{project_address}}</td></tr>
  <tr><td><strong>Client:</strong></td><td>{{client_name}}</td></tr>
  <tr><td><strong>Date:</strong></td><td>{{current_date}}</td></tr>
</table>

<h2>1. Project Overview</h2>
<p>{{project_overview}}</p>

<h2>2. Scope of Work</h2>
<p>{{scope}}</p>

<h2>3. Deliverables</h2>
{{deliverables}}

<h2>4. Schedule</h2>
<p><strong>Start Date:</strong> {{start_date}}<br>
<strong>End Date:</strong> {{end_date}}</p>
<h3>Milestones</h3>
{{milestone_list}}

<h2>5. Budget</h2>
<p><strong>Total Budget:</strong> {{budget}}</p>

<h2>6. Exclusions</h2>
<p>{{exclusions}}</p>

<h2>7. Assumptions</h2>
<p>{{assumptions}}</p>

<h2>Acceptance</h2>
<div class="signature-block">
  <div><div class="signature-line">{{client_name}} (Client)</div><p>Date: _______________</p></div>
  <div><div class="signature-line">Project Manager</div><p>Date: _______________</p></div>
</div>`,
    variables: {
      project_overview: 'Project overview description',
      scope: 'Detailed scope of work',
      deliverables: 'HTML list of deliverables',
      exclusions: 'Items excluded from scope',
      assumptions: 'Assumptions made',
    },
    isSystem: true,
  },

  // -----------------------------------------------------------------------
  // 7. Closeout Checklist
  // -----------------------------------------------------------------------
  {
    name: 'Closeout Checklist',
    description: 'Project closeout checklist and final documentation package.',
    type: 'REPORT',
    category: 'REPORTS',
    content: `<h1>PROJECT CLOSEOUT</h1>

<table>
  <tr><td><strong>Project:</strong></td><td>{{project_name}}</td></tr>
  <tr><td><strong>Address:</strong></td><td>{{project_address}}</td></tr>
  <tr><td><strong>Client:</strong></td><td>{{client_name}}</td></tr>
  <tr><td><strong>Date:</strong></td><td>{{current_date}}</td></tr>
</table>

<h2>Timeline Summary</h2>
<table>
  <tr><td>Planned Start</td><td>{{planned_start}}</td></tr>
  <tr><td>Planned End</td><td>{{planned_end}}</td></tr>
  <tr><td>Actual Start</td><td>{{actual_start}}</td></tr>
  <tr><td>Actual End</td><td>{{actual_end}}</td></tr>
</table>

<h2>Inspections Summary</h2>
<p><strong>Total Inspections:</strong> {{inspection_count}} &bull; <strong>Passed:</strong> {{inspections_passed}}</p>
{{inspection_table}}

<h2>Change Orders</h2>
<p><strong>Total Change Orders:</strong> {{change_order_count}}</p>
{{change_order_table}}

<h2>Site Activity</h2>
<p><strong>Total Site Visits:</strong> {{site_visit_count}}</p>

<h2>Closeout Checklist</h2>
<table>
  <thead><tr><th>Item</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>All inspections passed</td><td>☐</td></tr>
    <tr><td>Certificate of occupancy received</td><td>☐</td></tr>
    <tr><td>Punch list items resolved</td><td>☐</td></tr>
    <tr><td>As-built drawings submitted</td><td>☐</td></tr>
    <tr><td>O&amp;M manuals delivered</td><td>☐</td></tr>
    <tr><td>Warranties compiled and submitted</td><td>☐</td></tr>
    <tr><td>Final lien waivers collected</td><td>☐</td></tr>
    <tr><td>Final payment processed</td><td>☐</td></tr>
    <tr><td>Retainage released</td><td>☐</td></tr>
    <tr><td>Owner final walkthrough completed</td><td>☐</td></tr>
    <tr><td>Keys and access handed over</td><td>☐</td></tr>
  </tbody>
</table>

<h2>Acceptance</h2>
<p>I confirm that the project has been completed in accordance with the contract and all closeout items have been satisfactorily addressed.</p>
<div class="signature-block">
  <div><div class="signature-line">{{client_name}} (Owner/Client)</div><p>Date: _______________</p></div>
  <div><div class="signature-line">Project Manager</div><p>Date: _______________</p></div>
</div>`,
    variables: {
      planned_start: 'Planned start date',
      planned_end: 'Planned end date',
      actual_start: 'Actual start date',
      actual_end: 'Actual end date',
      inspection_count: 'Total inspections',
      inspections_passed: 'Inspections passed',
      inspection_table: 'HTML inspection results table',
      change_order_count: 'Total change orders',
      change_order_table: 'HTML change order table',
      site_visit_count: 'Total site visits',
    },
    isSystem: true,
  },
];

/**
 * Seed the document_templates table with default system templates.
 * Uses upsert to avoid duplicates on re-run.
 */
export async function seedDocumentTemplates(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    let created = 0;
    let updated = 0;

    for (const tpl of templates) {
      const result = await prisma.documentTemplate.upsert({
        where: {
          name_organizationId_version: {
            name: tpl.name,
            organizationId: '',
            version: 1,
          },
        },
        create: {
          name: tpl.name,
          description: tpl.description,
          type: tpl.type,
          category: tpl.category,
          content: tpl.content,
          variables: tpl.variables,
          isSystem: tpl.isSystem,
          isActive: true,
          version: 1,
        },
        update: {
          description: tpl.description,
          type: tpl.type,
          category: tpl.category,
          content: tpl.content,
          variables: tpl.variables,
          isSystem: tpl.isSystem,
        },
      });

      const age = Date.now() - result.createdAt.getTime();
      if (age < 5000) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(
      `[DocumentGen] Templates seeded: ${created} created, ${updated} updated (${templates.length} total)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running directly: npx ts-node templates.seed.ts
if (typeof require !== 'undefined' && require.main === module) {
  seedDocumentTemplates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
