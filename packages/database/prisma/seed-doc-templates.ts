// ============================================================
// Kealee Platform – Document Template Seed Data
// Production-ready contract, change order, SOW, invoice,
// punch list, closeout, subcontractor, and NTP templates
// ============================================================

interface DocTemplateDefinition {
  name: string;
  description: string;
  type: string;
  category: string;
  content: string;
  variables: Record<string, string>;
  sections: string[];
}

// ── Template Definitions ─────────────────────────────────────

const DOC_TEMPLATES: DocTemplateDefinition[] = [
  // ─────────────────────────────────────────────────────────
  // 1. CONSTRUCTION CONTRACT
  // ─────────────────────────────────────────────────────────
  {
    name: "Construction Services Agreement",
    description: "Standard construction contract between client and contractor with milestone-based payment, escrow, and warranty provisions",
    type: "CONTRACT",
    category: "CONTRACTS",
    variables: {
      current_date: "string",
      project_name: "string",
      project_address: "string",
      client_name: "string",
      client_address: "string",
      client_email: "string",
      client_phone: "string",
      contractor_name: "string",
      contractor_company: "string",
      contractor_license: "string",
      contractor_email: "string",
      contractor_phone: "string",
      scope_of_work: "text",
      contract_amount: "currency",
      milestones: "array<{number, description, amount, due_condition}>",
      start_date: "date",
      end_date: "date",
      duration: "number",
      state: "string",
    },
    sections: [
      "Parties",
      "Scope of Work",
      "Contract Price",
      "Payment Schedule",
      "Project Timeline",
      "Change Orders",
      "Permits and Inspections",
      "Warranties",
      "Insurance",
      "Dispute Resolution",
      "Termination",
      "Signatures",
    ],
    content: `<div class="document contract">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">CONSTRUCTION SERVICES AGREEMENT</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr><td><strong>Date:</strong> {{current_date}}</td><td style="text-align:right;"><strong>Project:</strong> {{project_name}}</td></tr>
  <tr><td colspan="2"><strong>Project Address:</strong> {{project_address}}</td></tr>
</table>

<h2>PARTIES</h2>
<p><strong>Client ("Owner"):</strong><br/>
{{client_name}}<br/>
{{client_address}}<br/>
Email: {{client_email}} | Phone: {{client_phone}}</p>

<p><strong>Contractor:</strong><br/>
{{contractor_name}}, {{contractor_company}}<br/>
License #{{contractor_license}}<br/>
Email: {{contractor_email}} | Phone: {{contractor_phone}}</p>

<h2>1. SCOPE OF WORK</h2>
<p>Contractor agrees to furnish all labor, materials, equipment, and supervision necessary to perform the following work at the Project Address in a good and workmanlike manner, in accordance with all applicable building codes and industry standards:</p>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;">{{scope_of_work}}</div>
<p>Any work not specifically described above is excluded from this Agreement unless added by written Change Order.</p>

<h2>2. CONTRACT PRICE</h2>
<p>The total contract price for the work described herein is <strong>\${{contract_amount}}</strong> (the "Contract Price"), payable according to the milestone schedule in Section 3. The Contract Price includes all labor, materials, equipment, overhead, and profit necessary to complete the Scope of Work.</p>

<h2>3. PAYMENT SCHEDULE</h2>
<p>Payments shall be made according to the following milestone schedule. All payments are processed through the Kealee escrow system. Funds are released upon milestone completion and successful inspection.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Milestone</th>
      <th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Description</th>
      <th style="border:1px solid #d1d5db;padding:8px;text-align:right;">Amount</th>
      <th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Due Condition</th>
    </tr>
  </thead>
  <tbody>
    {{#each milestones}}
    <tr>
      <td style="border:1px solid #d1d5db;padding:8px;">{{this.number}}</td>
      <td style="border:1px solid #d1d5db;padding:8px;">{{this.description}}</td>
      <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{this.amount}}</td>
      <td style="border:1px solid #d1d5db;padding:8px;">{{this.due_condition}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>
<p>Contractor shall submit a payment application for each milestone upon completion. Owner shall review and approve or dispute the application within five (5) business days. Undisputed amounts shall be released from escrow within two (2) business days of approval.</p>

<h2>4. PROJECT TIMELINE</h2>
<p><strong>Estimated Start Date:</strong> {{start_date}}<br/>
<strong>Estimated Completion Date:</strong> {{end_date}}<br/>
<strong>Estimated Duration:</strong> {{duration}} weeks</p>
<p>Contractor shall commence work upon receipt of Notice to Proceed and shall prosecute the work diligently and continuously until completion. Delays caused by weather, material shortages, or Force Majeure events shall be documented and may extend the completion date by mutual agreement.</p>

<h2>5. CHANGE ORDERS</h2>
<p>Any changes to the Scope of Work, Contract Price, or project timeline must be documented through a written Change Order signed by both parties before the changed work begins. Each Change Order shall clearly state: (a) the description of the change; (b) the cost impact; (c) the schedule impact; and (d) the revised Contract Price. Verbal agreements for additional work are not enforceable under this Agreement.</p>

<h2>6. PERMITS AND INSPECTIONS</h2>
<p>Contractor is responsible for obtaining all necessary building permits and scheduling all required inspections with the applicable jurisdiction, unless otherwise agreed in writing. Contractor shall maintain copies of all permits on-site during construction. All permit fees are included in the Contract Price unless specified as a separate line item in the payment schedule. Contractor shall promptly notify Owner of any inspection failures and shall perform corrective work at no additional cost.</p>

<h2>7. WARRANTIES</h2>
<p>Contractor warrants that all work performed under this Agreement shall be free from defects in materials and workmanship for a period of <strong>one (1) year</strong> from the date of substantial completion. During the warranty period, Contractor shall promptly repair or replace, at Contractor's sole expense, any defective work upon written notice from Owner. This warranty is in addition to, and does not limit, any manufacturer warranties on materials and equipment, which are hereby assigned to Owner. This warranty does not cover damage caused by Owner negligence, misuse, or failure to maintain.</p>

<h2>8. INSURANCE</h2>
<p>Contractor shall maintain the following insurance coverage for the duration of the project and shall provide certificates of insurance to Owner prior to commencing work:</p>
<ul>
  <li><strong>Commercial General Liability:</strong> $1,000,000 per occurrence / $2,000,000 aggregate minimum</li>
  <li><strong>Workers' Compensation:</strong> Statutory limits as required by law in the state of {{state}}</li>
  <li><strong>Commercial Automobile Liability:</strong> $1,000,000 combined single limit</li>
</ul>
<p>Owner shall be named as Additional Insured on the General Liability policy. Contractor shall provide at least thirty (30) days written notice prior to cancellation or material change of any required coverage.</p>

<h2>9. DISPUTE RESOLUTION</h2>
<p>The parties agree to resolve disputes as follows:</p>
<ol>
  <li><strong>Negotiation:</strong> The parties shall first attempt to resolve any dispute through good-faith negotiation within fourteen (14) days of written notice.</li>
  <li><strong>Mediation:</strong> If negotiation fails, the dispute shall be submitted to mediation administered by a mutually agreed-upon mediator. The cost of mediation shall be shared equally.</li>
  <li><strong>Binding Arbitration:</strong> If mediation fails, the dispute shall be resolved through binding arbitration in accordance with the construction industry rules of the American Arbitration Association and the laws of the State of {{state}}.</li>
</ol>
<p>Notwithstanding the above, either party may seek injunctive relief in a court of competent jurisdiction to prevent irreparable harm.</p>

<h2>10. TERMINATION</h2>
<p><strong>Termination for Convenience:</strong> Either party may terminate this Agreement with fourteen (14) days written notice to the other party. Upon termination, Client shall pay for all work satisfactorily completed to date based on the milestone schedule, including a pro-rata share of any partially completed milestone.</p>
<p><strong>Termination for Cause:</strong> Either party may terminate this Agreement immediately upon written notice if the other party: (a) materially breaches this Agreement and fails to cure within seven (7) days of written notice; (b) becomes insolvent or files for bankruptcy; or (c) abandons the work for more than five (5) consecutive business days without justification.</p>
<p>Upon termination, Contractor shall leave the job site in a safe, clean, and secured condition.</p>

<h2>11. GENERAL PROVISIONS</h2>
<p><strong>Independent Contractor:</strong> Contractor is an independent contractor and not an employee, agent, or partner of Owner.</p>
<p><strong>Governing Law:</strong> This Agreement shall be governed by the laws of the State of {{state}}.</p>
<p><strong>Entire Agreement:</strong> This Agreement, together with all Change Orders, constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and agreements.</p>
<p><strong>Severability:</strong> If any provision of this Agreement is found unenforceable, the remaining provisions shall continue in full force and effect.</p>

<h2 style="margin-top:48px;">SIGNATURES</h2>
<p>By signing below, the parties acknowledge that they have read, understood, and agree to all terms and conditions of this Agreement.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Client Signature</strong><br/>
      <br/><br/>
      _________________________________________<br/>
      {{client_name}}<br/>
      Date: __________________
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Contractor Signature</strong><br/>
      <br/><br/>
      _________________________________________<br/>
      {{contractor_name}}, {{contractor_company}}<br/>
      Date: __________________
    </td>
  </tr>
</table>
</div>`,
  },

  // ─────────────────────────────────────────────────────────
  // 2. CHANGE ORDER FORM
  // ─────────────────────────────────────────────────────────
  {
    name: "Change Order Form",
    description: "Standard change order form documenting scope changes, cost impact, and schedule impact",
    type: "CHANGE_ORDER",
    category: "CONTRACTS",
    variables: {
      co_number: "number",
      project_name: "string",
      project_address: "string",
      current_date: "string",
      original_amount: "currency",
      previous_co_total: "currency",
      change_description: "text",
      change_reason: "string",
      material_cost: "currency",
      labor_cost: "currency",
      other_cost: "currency",
      total_change: "currency",
      revised_total: "currency",
      schedule_impact: "string",
      client_name: "string",
      contractor_name: "string",
      contractor_company: "string",
    },
    sections: [
      "Project Information",
      "Description of Change",
      "Reason for Change",
      "Cost Impact",
      "Schedule Impact",
      "Approval",
    ],
    content: `<div class="document change-order">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">CHANGE ORDER #{{co_number}}</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td><strong>Project:</strong> {{project_name}}</td>
    <td style="text-align:right;"><strong>Date:</strong> {{current_date}}</td>
  </tr>
  <tr>
    <td colspan="2"><strong>Project Address:</strong> {{project_address}}</td>
  </tr>
</table>

<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Original Contract Amount</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{original_amount}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Previous Change Orders Total</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{previous_co_total}}</td>
  </tr>
</table>

<h2>DESCRIPTION OF CHANGE</h2>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;min-height:80px;">{{change_description}}</div>

<h2>REASON FOR CHANGE</h2>
<p>{{change_reason}}</p>

<h2>COST IMPACT</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">Materials</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{material_cost}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">Labor</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{labor_cost}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">Other (permits, equipment, etc.)</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{other_cost}}</td>
  </tr>
  <tr style="background:#f3f4f6;font-weight:bold;">
    <td style="border:1px solid #d1d5db;padding:8px;">Total Change</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{total_change}}</td>
  </tr>
</table>
<p style="font-size:1.1em;font-weight:bold;">Revised Contract Total: \${{revised_total}}</p>

<h2>SCHEDULE IMPACT</h2>
<p>{{schedule_impact}}</p>

<h2 style="margin-top:36px;">APPROVAL</h2>
<p>By signing below, both parties agree to the changes described above, including the cost and schedule impact.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Client Approval</strong><br/><br/><br/>
      _________________________________________<br/>
      {{client_name}}<br/>
      Date: __________________
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Contractor Approval</strong><br/><br/><br/>
      _________________________________________<br/>
      {{contractor_name}}, {{contractor_company}}<br/>
      Date: __________________
    </td>
  </tr>
</table>
</div>`,
  },

  // ─────────────────────────────────────────────────────────
  // 3. SCOPE OF WORK (SOW)
  // ─────────────────────────────────────────────────────────
  {
    name: "Scope of Work",
    description: "Detailed scope of work document defining all tasks, materials, exclusions, and acceptance criteria",
    type: "PROPOSAL",
    category: "PROPOSALS",
    variables: {
      project_name: "string",
      project_address: "string",
      current_date: "string",
      client_name: "string",
      contractor_name: "string",
      contractor_company: "string",
      project_description: "text",
      work_items: "array<{number, description, location, materials, labor_hours}>",
      materials_specifications: "text",
      exclusions: "text",
      assumptions: "text",
      acceptance_criteria: "text",
      start_date: "date",
      end_date: "date",
      work_hours: "string",
    },
    sections: [
      "Project Overview",
      "Detailed Work Items",
      "Materials and Specifications",
      "Exclusions",
      "Assumptions",
      "Acceptance Criteria",
      "Schedule",
      "Acknowledgment",
    ],
    content: `<div class="document sow">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">SCOPE OF WORK</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td><strong>Project:</strong> {{project_name}}</td>
    <td style="text-align:right;"><strong>Date:</strong> {{current_date}}</td>
  </tr>
  <tr><td colspan="2"><strong>Address:</strong> {{project_address}}</td></tr>
  <tr>
    <td><strong>Client:</strong> {{client_name}}</td>
    <td style="text-align:right;"><strong>Contractor:</strong> {{contractor_name}}, {{contractor_company}}</td>
  </tr>
</table>

<h2>1. PROJECT OVERVIEW</h2>
<p>{{project_description}}</p>

<h2>2. DETAILED WORK ITEMS</h2>
<p>The Contractor shall perform the following work items. Each item includes the location, description, materials to be used, and estimated labor hours.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:8px;text-align:left;">#</th>
      <th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Description</th>
      <th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Location</th>
      <th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Materials</th>
      <th style="border:1px solid #d1d5db;padding:8px;text-align:right;">Est. Hours</th>
    </tr>
  </thead>
  <tbody>
    {{#each work_items}}
    <tr>
      <td style="border:1px solid #d1d5db;padding:8px;">{{this.number}}</td>
      <td style="border:1px solid #d1d5db;padding:8px;">{{this.description}}</td>
      <td style="border:1px solid #d1d5db;padding:8px;">{{this.location}}</td>
      <td style="border:1px solid #d1d5db;padding:8px;">{{this.materials}}</td>
      <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">{{this.labor_hours}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<h2>3. MATERIALS AND SPECIFICATIONS</h2>
<p>All materials shall meet or exceed the following specifications. Substitutions require written approval from the Owner prior to installation.</p>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;">{{materials_specifications}}</div>

<h2>4. EXCLUSIONS</h2>
<p>The following items are specifically excluded from this Scope of Work. Any work listed below, if required, will be handled through a separate Change Order.</p>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;">{{exclusions}}</div>

<h2>5. ASSUMPTIONS</h2>
<p>This Scope of Work is based on the following assumptions. If site conditions differ from these assumptions, a Change Order may be required.</p>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;">{{assumptions}}</div>

<h2>6. ACCEPTANCE CRITERIA</h2>
<p>Work shall be considered complete when the following criteria are met:</p>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;">{{acceptance_criteria}}</div>

<h2>7. SCHEDULE</h2>
<p><strong>Start Date:</strong> {{start_date}}<br/>
<strong>Estimated Completion:</strong> {{end_date}}<br/>
<strong>Work Hours:</strong> {{work_hours}}</p>
<p>Contractor shall notify Owner of any anticipated delays at least forty-eight (48) hours in advance. Work shall be performed during normal business hours unless otherwise agreed.</p>

<h2 style="margin-top:36px;">ACKNOWLEDGMENT</h2>
<p>By signing below, both parties acknowledge that they have reviewed this Scope of Work and agree to its terms.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Client</strong><br/><br/><br/>
      _________________________________________<br/>
      {{client_name}}<br/>
      Date: __________________
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Contractor</strong><br/><br/><br/>
      _________________________________________<br/>
      {{contractor_name}}, {{contractor_company}}<br/>
      Date: __________________
    </td>
  </tr>
</table>
</div>`,
  },

  // ─────────────────────────────────────────────────────────
  // 4. PROGRESS INVOICE
  // ─────────────────────────────────────────────────────────
  {
    name: "Progress Invoice",
    description: "Milestone-based progress invoice with completed work, retainage, and payment summary",
    type: "INVOICE",
    category: "FINANCIAL",
    variables: {
      invoice_number: "string",
      invoice_date: "string",
      due_date: "string",
      project_name: "string",
      project_address: "string",
      contractor_name: "string",
      contractor_company: "string",
      contractor_address: "string",
      contractor_ein: "string",
      client_name: "string",
      client_address: "string",
      billing_period: "string",
      line_items: "array<{description, scheduled_value, previous_billed, this_period, total_completed, pct_complete, balance}>",
      total_scheduled: "currency",
      total_previous: "currency",
      total_this_period: "currency",
      total_completed: "currency",
      retainage_pct: "number",
      retainage_amount: "currency",
      amount_due: "currency",
      payment_terms: "string",
    },
    sections: [
      "Invoice Header",
      "Line Items",
      "Summary",
      "Payment Instructions",
      "Certification",
    ],
    content: `<div class="document invoice">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">PROGRESS INVOICE</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td style="width:50%;">
      <strong>From:</strong><br/>
      {{contractor_name}}<br/>
      {{contractor_company}}<br/>
      {{contractor_address}}<br/>
      EIN: {{contractor_ein}}
    </td>
    <td style="width:50%;text-align:right;">
      <strong>Invoice #:</strong> {{invoice_number}}<br/>
      <strong>Date:</strong> {{invoice_date}}<br/>
      <strong>Due Date:</strong> {{due_date}}<br/>
      <strong>Billing Period:</strong> {{billing_period}}
    </td>
  </tr>
</table>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td>
      <strong>Bill To:</strong><br/>
      {{client_name}}<br/>
      {{client_address}}
    </td>
    <td style="text-align:right;">
      <strong>Project:</strong> {{project_name}}<br/>
      <strong>Address:</strong> {{project_address}}
    </td>
  </tr>
</table>

<h2>SCHEDULE OF VALUES</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.9em;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Description</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:right;">Scheduled Value</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:right;">Previous</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:right;">This Period</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:right;">Total Complete</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:right;">% Complete</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:right;">Balance</th>
    </tr>
  </thead>
  <tbody>
    {{#each line_items}}
    <tr>
      <td style="border:1px solid #d1d5db;padding:6px;">{{this.description}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:right;">\${{this.scheduled_value}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:right;">\${{this.previous_billed}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:right;">\${{this.this_period}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:right;">\${{this.total_completed}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:right;">{{this.pct_complete}}%</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:right;">\${{this.balance}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<h2>SUMMARY</h2>
<table style="width:50%;margin-left:auto;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">Total Scheduled Value</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{total_scheduled}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">Previously Billed</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{total_previous}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">This Period</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{total_this_period}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">Total Completed to Date</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{total_completed}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;">Retainage ({{retainage_pct}}%)</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">(\${{retainage_amount}})</td>
  </tr>
  <tr style="background:#f3f4f6;font-weight:bold;font-size:1.1em;">
    <td style="border:1px solid #d1d5db;padding:8px;">AMOUNT DUE THIS PERIOD</td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{amount_due}}</td>
  </tr>
</table>

<p style="margin-top:16px;"><strong>Payment Terms:</strong> {{payment_terms}}</p>
<p>Payment is processed through the Kealee escrow system. Approved amounts are released within two (2) business days.</p>

<h2 style="margin-top:36px;">CERTIFICATION</h2>
<p>The undersigned Contractor certifies that: (a) all work billed herein has been performed in accordance with the contract documents; (b) all labor and materials have been paid for through the previous billing period; and (c) the amounts requested are true and accurate.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Contractor</strong><br/><br/><br/>
      _________________________________________<br/>
      {{contractor_name}}, {{contractor_company}}<br/>
      Date: __________________
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Approved By (Owner/PM)</strong><br/><br/><br/>
      _________________________________________<br/>
      {{client_name}}<br/>
      Date: __________________
    </td>
  </tr>
</table>
</div>`,
  },

  // ─────────────────────────────────────────────────────────
  // 5. PUNCH LIST
  // ─────────────────────────────────────────────────────────
  {
    name: "Punch List",
    description: "Project punch list documenting items requiring correction or completion before final acceptance",
    type: "REPORT",
    category: "REPORTS",
    variables: {
      project_name: "string",
      project_address: "string",
      current_date: "string",
      inspection_date: "string",
      inspector_name: "string",
      contractor_name: "string",
      contractor_company: "string",
      client_name: "string",
      punch_items: "array<{number, location, description, trade, priority, status, due_date, notes}>",
      total_items: "number",
      critical_items: "number",
      completion_deadline: "date",
    },
    sections: [
      "Project Information",
      "Punch List Items",
      "Summary",
      "Acknowledgment",
    ],
    content: `<div class="document punch-list">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">PUNCH LIST</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td><strong>Project:</strong> {{project_name}}</td>
    <td style="text-align:right;"><strong>Date:</strong> {{current_date}}</td>
  </tr>
  <tr>
    <td><strong>Address:</strong> {{project_address}}</td>
    <td style="text-align:right;"><strong>Inspection Date:</strong> {{inspection_date}}</td>
  </tr>
  <tr>
    <td><strong>Inspector:</strong> {{inspector_name}}</td>
    <td style="text-align:right;"><strong>Contractor:</strong> {{contractor_name}}, {{contractor_company}}</td>
  </tr>
</table>

<p>The following items were identified during the substantial completion walkthrough and must be corrected or completed prior to final acceptance and release of retainage. All items must be resolved by <strong>{{completion_deadline}}</strong>.</p>

<h2>PUNCH LIST ITEMS</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.85em;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;">#</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Location</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Description</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Trade</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;">Priority</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;">Status</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Due</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Notes</th>
    </tr>
  </thead>
  <tbody>
    {{#each punch_items}}
    <tr>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">{{this.number}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;">{{this.location}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;">{{this.description}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;">{{this.trade}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">{{this.priority}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">{{this.status}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;">{{this.due_date}}</td>
      <td style="border:1px solid #d1d5db;padding:6px;">{{this.notes}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<h2>SUMMARY</h2>
<table style="width:50%;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Total Items</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">{{total_items}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#fef2f2;"><strong>Critical Items</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">{{critical_items}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Completion Deadline</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">{{completion_deadline}}</td>
  </tr>
</table>

<p style="margin-top:16px;">The Contractor shall notify the Owner/PM when all items have been corrected. A final walkthrough will be scheduled to verify completion. Retainage will not be released until all punch list items are satisfactorily resolved.</p>

<h2 style="margin-top:36px;">ACKNOWLEDGMENT</h2>
<p>By signing below, the Contractor acknowledges receipt of this punch list and agrees to complete all items by the deadline stated above.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Inspector / Project Manager</strong><br/><br/><br/>
      _________________________________________<br/>
      {{inspector_name}}<br/>
      Date: __________________
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Contractor</strong><br/><br/><br/>
      _________________________________________<br/>
      {{contractor_name}}, {{contractor_company}}<br/>
      Date: __________________
    </td>
  </tr>
</table>
</div>`,
  },

  // ─────────────────────────────────────────────────────────
  // 6. CLOSEOUT CHECKLIST
  // ─────────────────────────────────────────────────────────
  {
    name: "Project Closeout Checklist",
    description: "Comprehensive closeout checklist ensuring all deliverables, documentation, and warranty items are complete",
    type: "REPORT",
    category: "ADMINISTRATIVE",
    variables: {
      project_name: "string",
      project_address: "string",
      current_date: "string",
      completion_date: "string",
      contractor_name: "string",
      contractor_company: "string",
      client_name: "string",
      pm_name: "string",
      final_contract_amount: "currency",
      total_change_orders: "number",
      final_cost: "currency",
    },
    sections: [
      "Project Information",
      "Construction Completion",
      "Documentation",
      "Financial Closeout",
      "Warranty and Maintenance",
      "Final Acceptance",
    ],
    content: `<div class="document closeout">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">PROJECT CLOSEOUT CHECKLIST</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td><strong>Project:</strong> {{project_name}}</td>
    <td style="text-align:right;"><strong>Date:</strong> {{current_date}}</td>
  </tr>
  <tr>
    <td><strong>Address:</strong> {{project_address}}</td>
    <td style="text-align:right;"><strong>Completion Date:</strong> {{completion_date}}</td>
  </tr>
  <tr>
    <td><strong>Contractor:</strong> {{contractor_name}}, {{contractor_company}}</td>
    <td style="text-align:right;"><strong>Project Manager:</strong> {{pm_name}}</td>
  </tr>
</table>

<h2>A. CONSTRUCTION COMPLETION</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Item</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;width:80px;">Complete</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;width:80px;">N/A</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">All contract work completed per scope</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">All punch list items resolved</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Final cleaning completed</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">All temporary facilities, equipment, and debris removed</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Site restored to pre-construction condition (exterior)</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">All systems tested and operational (HVAC, plumbing, electrical)</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
  </tbody>
</table>

<h2>B. DOCUMENTATION</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Document</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;width:80px;">Received</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;width:80px;">N/A</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Certificate of Occupancy / Final Inspection Approval</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">All building permits closed out</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">As-built drawings and specifications</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Equipment operation and maintenance manuals</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Product data sheets and material certifications</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Test and inspection reports</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Warranty documentation for all materials and equipment</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Lien waivers from all subcontractors and suppliers</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Final signed change orders</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Project photos (before, during, after)</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
  </tbody>
</table>

<h2>C. FINANCIAL CLOSEOUT</h2>
<table style="width:60%;border-collapse:collapse;margin:12px 0;">
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Original Contract Amount</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">\${{final_contract_amount}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Total Change Orders</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;">{{total_change_orders}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;font-weight:bold;"><strong>Final Project Cost</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;text-align:right;font-weight:bold;">\${{final_cost}}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Financial Item</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;width:80px;">Complete</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">All milestone payments processed</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Final invoice submitted and approved</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Retainage released</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">All lien waivers collected (contractor and subs)</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Escrow account reconciled and closed</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
  </tbody>
</table>

<h2>D. WARRANTY AND MAINTENANCE</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Warranty Item</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:center;width:80px;">Provided</th>
      <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">1-year contractor workmanship warranty letter</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Manufacturer warranties registered and transferred</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">HVAC maintenance schedule provided</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Homeowner orientation completed (systems walkthrough)</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
    <tr><td style="border:1px solid #d1d5db;padding:6px;">Emergency contact information provided</td><td style="border:1px solid #d1d5db;padding:6px;text-align:center;">&#9744;</td><td style="border:1px solid #d1d5db;padding:6px;"></td></tr>
  </tbody>
</table>

<h2 style="margin-top:36px;">FINAL ACCEPTANCE</h2>
<p>By signing below, the Owner accepts the completed project, acknowledges receipt of all closeout documentation, and authorizes the release of final retainage to the Contractor.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:30%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Client / Owner</strong><br/><br/><br/>
      ________________________________<br/>
      {{client_name}}<br/>
      Date: ______________
    </td>
    <td style="width:5%;"></td>
    <td style="width:30%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Contractor</strong><br/><br/><br/>
      ________________________________<br/>
      {{contractor_name}}<br/>
      Date: ______________
    </td>
    <td style="width:5%;"></td>
    <td style="width:30%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Project Manager</strong><br/><br/><br/>
      ________________________________<br/>
      {{pm_name}}<br/>
      Date: ______________
    </td>
  </tr>
</table>
</div>`,
  },

  // ─────────────────────────────────────────────────────────
  // 7. SUBCONTRACTOR AGREEMENT
  // ─────────────────────────────────────────────────────────
  {
    name: "Subcontractor Agreement",
    description: "Agreement between general contractor and subcontractor for trade-specific work",
    type: "CONTRACT",
    category: "CONTRACTS",
    variables: {
      current_date: "string",
      project_name: "string",
      project_address: "string",
      gc_name: "string",
      gc_company: "string",
      gc_license: "string",
      gc_email: "string",
      gc_phone: "string",
      sub_name: "string",
      sub_company: "string",
      sub_license: "string",
      sub_email: "string",
      sub_phone: "string",
      trade: "string",
      scope_of_work: "text",
      sub_amount: "currency",
      payment_terms: "string",
      start_date: "date",
      end_date: "date",
      retainage_pct: "number",
      state: "string",
    },
    sections: [
      "Parties",
      "Scope of Work",
      "Compensation",
      "Schedule",
      "Standards and Compliance",
      "Insurance",
      "Indemnification",
      "Termination",
      "Signatures",
    ],
    content: `<div class="document subcontract">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">SUBCONTRACTOR AGREEMENT</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td><strong>Date:</strong> {{current_date}}</td>
    <td style="text-align:right;"><strong>Trade:</strong> {{trade}}</td>
  </tr>
  <tr><td colspan="2"><strong>Project:</strong> {{project_name}} — {{project_address}}</td></tr>
</table>

<h2>PARTIES</h2>
<p><strong>General Contractor ("Contractor"):</strong><br/>
{{gc_name}}, {{gc_company}}<br/>
License #{{gc_license}}<br/>
Email: {{gc_email}} | Phone: {{gc_phone}}</p>

<p><strong>Subcontractor ("Sub"):</strong><br/>
{{sub_name}}, {{sub_company}}<br/>
License #{{sub_license}}<br/>
Email: {{sub_email}} | Phone: {{sub_phone}}</p>

<h2>1. SCOPE OF WORK</h2>
<p>Subcontractor agrees to furnish all labor, materials, tools, and equipment necessary to perform the following {{trade}} work at the Project Address:</p>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;">{{scope_of_work}}</div>
<p>Subcontractor shall perform all work in accordance with the prime contract documents, applicable building codes, and industry standards for the {{trade}} trade.</p>

<h2>2. COMPENSATION</h2>
<p>Contractor shall pay Subcontractor a total of <strong>\${{sub_amount}}</strong> for the complete and satisfactory performance of the Scope of Work.</p>
<p><strong>Payment Terms:</strong> {{payment_terms}}</p>
<p><strong>Retainage:</strong> {{retainage_pct}}% of each progress payment will be withheld as retainage and released upon final completion and acceptance of all Subcontractor work, receipt of all required lien waivers, and closeout of any outstanding items.</p>
<p>Subcontractor shall submit invoices with supporting documentation (time sheets, material receipts). Contractor shall process approved invoices within fifteen (15) days of receipt.</p>

<h2>3. SCHEDULE</h2>
<p><strong>Start Date:</strong> {{start_date}}<br/>
<strong>Completion Date:</strong> {{end_date}}</p>
<p>Subcontractor shall maintain sufficient workforce and resources to meet the project schedule. Subcontractor shall coordinate all work with other trades as directed by the Contractor. Delays caused by the Subcontractor that impact the overall project schedule may result in back-charges for consequential damages.</p>

<h2>4. STANDARDS AND COMPLIANCE</h2>
<ul>
  <li>All work shall comply with applicable federal, state, and local codes, ordinances, and regulations</li>
  <li>Subcontractor shall obtain all trade-specific permits required for the work (unless included in Contractor's master permit)</li>
  <li>Subcontractor shall maintain a clean and safe work area at all times</li>
  <li>Subcontractor shall comply with all OSHA safety requirements and the project-specific safety plan</li>
  <li>Subcontractor shall protect all existing finishes, structures, and property adjacent to the work area</li>
  <li>All materials shall be new and of the quality specified in the contract documents</li>
</ul>

<h2>5. INSURANCE</h2>
<p>Subcontractor shall maintain the following insurance for the duration of the project:</p>
<ul>
  <li><strong>Commercial General Liability:</strong> $1,000,000 per occurrence / $2,000,000 aggregate</li>
  <li><strong>Workers' Compensation:</strong> Statutory limits per the laws of {{state}}</li>
  <li><strong>Commercial Auto:</strong> $1,000,000 combined single limit (if vehicles used)</li>
</ul>
<p>Contractor and Owner shall be named as Additional Insureds. Certificates of insurance must be provided before work begins.</p>

<h2>6. INDEMNIFICATION</h2>
<p>Subcontractor shall indemnify, defend, and hold harmless the Contractor, Owner, and their agents from any claims, damages, losses, or expenses arising from the Subcontractor's work, except to the extent caused by the negligence of the Contractor or Owner.</p>

<h2>7. WARRANTY</h2>
<p>Subcontractor warrants all work for a period of one (1) year from the date of final acceptance of the Subcontractor's work, or until the expiration of the Contractor's warranty to the Owner, whichever is longer. Subcontractor shall promptly correct any defective work at no additional cost during the warranty period.</p>

<h2>8. TERMINATION</h2>
<p>Contractor may terminate this Agreement for cause if Subcontractor: (a) fails to maintain adequate progress; (b) fails to provide sufficient workers or materials; (c) performs defective work and fails to correct it; or (d) violates any provision of this Agreement. Upon termination for cause, Contractor may complete the work using others and back-charge Subcontractor for any additional cost.</p>
<p>Contractor may terminate for convenience with seven (7) days written notice. Upon termination for convenience, Subcontractor shall be paid for all work satisfactorily completed to date.</p>

<h2>9. DISPUTE RESOLUTION</h2>
<p>Disputes shall be resolved through negotiation, then mediation, then binding arbitration in the State of {{state}}, consistent with the dispute resolution provisions of the prime contract.</p>

<h2 style="margin-top:48px;">SIGNATURES</h2>
<p>By signing below, both parties agree to all terms and conditions of this Agreement.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>General Contractor</strong><br/><br/><br/>
      _________________________________________<br/>
      {{gc_name}}, {{gc_company}}<br/>
      Date: __________________
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Subcontractor</strong><br/><br/><br/>
      _________________________________________<br/>
      {{sub_name}}, {{sub_company}}<br/>
      Date: __________________
    </td>
  </tr>
</table>
</div>`,
  },

  // ─────────────────────────────────────────────────────────
  // 8. NOTICE TO PROCEED
  // ─────────────────────────────────────────────────────────
  {
    name: "Notice to Proceed",
    description: "Formal authorization for the contractor to begin work on the project",
    type: "NOTICE",
    category: "ADMINISTRATIVE",
    variables: {
      current_date: "string",
      project_name: "string",
      project_address: "string",
      contractor_name: "string",
      contractor_company: "string",
      client_name: "string",
      contract_date: "date",
      contract_amount: "currency",
      proceed_date: "date",
      completion_date: "date",
      duration_days: "number",
      special_conditions: "text",
      pm_name: "string",
      pm_email: "string",
      pm_phone: "string",
    },
    sections: [
      "Authorization",
      "Project Details",
      "Pre-Construction Requirements",
      "Communication",
      "Acknowledgment",
    ],
    content: `<div class="document ntp">
<h1 style="text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;">NOTICE TO PROCEED</h1>

<table style="width:100%;margin-bottom:24px;">
  <tr>
    <td><strong>Date:</strong> {{current_date}}</td>
    <td style="text-align:right;"><strong>Project:</strong> {{project_name}}</td>
  </tr>
  <tr><td colspan="2"><strong>Project Address:</strong> {{project_address}}</td></tr>
</table>

<p>To: <strong>{{contractor_name}}, {{contractor_company}}</strong></p>
<p>From: <strong>{{client_name}}</strong></p>

<h2>AUTHORIZATION TO PROCEED</h2>
<p>You are hereby authorized and directed to proceed with the work described in the Construction Services Agreement dated <strong>{{contract_date}}</strong> for the project identified above.</p>

<h2>PROJECT DETAILS</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;width:40%;"><strong>Contract Amount</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;">\${{contract_amount}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Proceed Date (Day 1)</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;">{{proceed_date}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Contract Duration</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;">{{duration_days}} calendar days</td>
  </tr>
  <tr>
    <td style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;"><strong>Required Completion Date</strong></td>
    <td style="border:1px solid #d1d5db;padding:8px;">{{completion_date}}</td>
  </tr>
</table>

<h2>PRE-CONSTRUCTION REQUIREMENTS</h2>
<p>Prior to mobilizing to the job site, the Contractor shall ensure the following are in place:</p>
<ol>
  <li>Current certificates of insurance on file with the Owner (General Liability, Workers' Comp, Auto)</li>
  <li>All required building permits obtained and posted on-site</li>
  <li>Signed contract and all required bonds (if applicable) on file</li>
  <li>Project schedule submitted and approved by the Owner or Project Manager</li>
  <li>Site safety plan reviewed and acknowledged</li>
  <li>Emergency contact information provided for all supervisory personnel</li>
</ol>

<h2>SPECIAL CONDITIONS</h2>
<div style="padding:12px;border:1px solid #ccc;background:#f9f9f9;margin:12px 0;min-height:40px;">{{special_conditions}}</div>

<h2>PROJECT MANAGEMENT CONTACT</h2>
<p>All project communications should be directed to:</p>
<p><strong>{{pm_name}}</strong><br/>
Email: {{pm_email}}<br/>
Phone: {{pm_phone}}</p>

<h2>IMPORTANT NOTES</h2>
<ul>
  <li>The contract time begins on the Proceed Date stated above, regardless of when actual site work begins</li>
  <li>Any delay in starting work does not extend the completion date unless approved in writing</li>
  <li>Contractor shall submit progress reports through the Kealee platform as specified in the contract</li>
  <li>All change orders must be approved in writing before changed work begins</li>
</ul>

<h2 style="margin-top:36px;">ACKNOWLEDGMENT</h2>
<p>By signing below, the Contractor acknowledges receipt of this Notice to Proceed and agrees to commence work on the date specified above.</p>

<table style="width:100%;margin-top:24px;">
  <tr>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Issued By (Owner / PM)</strong><br/><br/><br/>
      _________________________________________<br/>
      {{client_name}}<br/>
      Date: __________________
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;padding:24px 0;border-top:1px solid #1a1a1a;">
      <strong>Received By (Contractor)</strong><br/><br/><br/>
      _________________________________________<br/>
      {{contractor_name}}, {{contractor_company}}<br/>
      Date: __________________
    </td>
  </tr>
</table>
</div>`,
  },
];

// ── Seed Function ────────────────────────────────────────────

export async function seedDocumentTemplates(prisma: any): Promise<number> {
  let seeded = 0;

  for (const tmpl of DOC_TEMPLATES) {
    await prisma.documentTemplate.upsert({
      where: {
        name_organizationId_version: {
          name: tmpl.name,
          organizationId: null as any,
          version: 1,
        },
      },
      update: {
        description: tmpl.description,
        type: tmpl.type,
        category: tmpl.category,
        content: tmpl.content,
        variables: tmpl.variables,
        sections: tmpl.sections,
        isActive: true,
        isSystem: true,
        format: "PDF",
        version: 1,
      },
      create: {
        name: tmpl.name,
        description: tmpl.description,
        type: tmpl.type,
        category: tmpl.category,
        content: tmpl.content,
        variables: tmpl.variables,
        sections: tmpl.sections,
        isActive: true,
        isSystem: true,
        format: "PDF",
        version: 1,
        organizationId: null,
      },
    });

    seeded++;
  }

  console.log(`  Seeded ${seeded} document templates`);
  return seeded;
}
