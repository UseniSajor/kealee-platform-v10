import { PrismaClient } from '@prisma/client';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-10';

type DocumentType =
  | 'contract'
  | 'proposal'
  | 'sow'
  | 'invoice'
  | 'punch_list'
  | 'letter'
  | 'closeout'
  | 'change_order'
  | 'subcontractor_agreement';

/** Map service-level type names to the schema DocumentTemplate.type field. */
const TYPE_MAP: Record<DocumentType, string> = {
  contract: 'CONTRACT',
  proposal: 'PROPOSAL',
  sow: 'CONTRACT',
  invoice: 'INVOICE',
  punch_list: 'REPORT',
  letter: 'REPORT',
  closeout: 'REPORT',
  change_order: 'CHANGE_ORDER',
  subcontractor_agreement: 'CONTRACT',
};

/** Map to Document schema category values. */
const CATEGORY_MAP: Record<DocumentType, string> = {
  contract: 'CONTRACTS',
  proposal: 'PROPOSALS',
  sow: 'CONTRACTS',
  invoice: 'FINANCIAL',
  punch_list: 'REPORTS',
  letter: 'ADMINISTRATIVE',
  closeout: 'REPORTS',
  change_order: 'FINANCIAL',
  subcontractor_agreement: 'CONTRACTS',
};

interface GenerateDocumentOpts {
  templateType: DocumentType;
  projectId: string;
  variables: Record<string, any>;
  sendForSignature?: boolean;
  signers?: Array<{ email: string; name: string; role: string }>;
}

interface Signer {
  email: string;
  name: string;
  role: string;
}

/**
 * Replace {{variable}} placeholders in a string.
 * Handles nested dot-access like {{project.name}} as flat keys.
 */
function interpolate(
  template: string,
  variables: Record<string, any>,
): string {
  return template.replace(/\{\{(\w[\w.]*)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

/**
 * Format a number as USD currency string.
 */
function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get DocuSign config (keys read at call time).
 */
function getDocuSignConfig() {
  return {
    apiKey: process.env.DOCUSIGN_API_KEY,
    accountId: process.env.DOCUSIGN_ACCOUNT_ID,
    baseUrl: process.env.DOCUSIGN_BASE_URL ?? 'https://demo.docusign.net/restapi',
  };
}

export class DocumentGeneratorService {
  // -----------------------------------------------------------------------
  // generateDocument
  // -----------------------------------------------------------------------

  async generateDocument(opts: GenerateDocumentOpts): Promise<{
    id: string;
    fileUrl: string | null;
    status: string;
  }> {
    // 1. Find the active document template
    const template = await prisma.documentTemplate.findFirst({
      where: {
        type: TYPE_MAP[opts.templateType] ?? opts.templateType.toUpperCase(),
        isActive: true,
      },
      orderBy: { version: 'desc' },
    });

    // 2. Get project data for auto-populating standard variables
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: opts.projectId },
      include: {
        client: true,
        phases: {
          include: { milestones: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Build milestone list from project phases
    const milestoneListItems: string[] = [];
    for (const phase of project.phases) {
      for (const ms of phase.milestones) {
        const dueStr = ms.dueDate
          ? ms.dueDate.toLocaleDateString('en-US')
          : 'TBD';
        const amtStr = ms.paymentAmount
          ? formatCurrency(Number(ms.paymentAmount))
          : '';
        milestoneListItems.push(
          `<li>${ms.name}${amtStr ? ` — ${amtStr}` : ''} (Due: ${dueStr})</li>`,
        );
      }
    }
    const milestoneListHtml =
      milestoneListItems.length > 0
        ? `<ol>${milestoneListItems.join('\n')}</ol>`
        : '<p>No milestones defined.</p>';

    // 3. Build standard + custom variables
    const allVariables: Record<string, any> = {
      project_name: project.name ?? 'Unnamed Project',
      project_address: [project.address, project.city, project.state, project.zipCode]
        .filter(Boolean)
        .join(', ') || 'N/A',
      client_name: project.client?.name ?? 'N/A',
      client_email: project.client?.email ?? '',
      client_phone: project.client?.phone ?? '',
      start_date: project.scheduledStartDate?.toLocaleDateString('en-US') ?? 'TBD',
      end_date: project.scheduledEndDate?.toLocaleDateString('en-US') ?? 'TBD',
      current_date: new Date().toLocaleDateString('en-US'),
      milestone_list: milestoneListHtml,
      budget: project.budget ? formatCurrency(Number(project.budget)) : 'N/A',
      // Overwrite with caller-supplied variables
      ...opts.variables,
    };

    // Format any currency fields passed as numbers
    for (const key of ['contract_amount', 'total_amount', 'amount', 'platform_fee', 'total_cost']) {
      if (allVariables[key] !== undefined && typeof allVariables[key] === 'number') {
        allVariables[key] = formatCurrency(allVariables[key]);
      }
    }

    // 4. Interpolate template content
    let htmlContent: string;
    if (template) {
      htmlContent = interpolate(template.content, allVariables);
    } else {
      // Fallback: generate a basic document without a template
      htmlContent = this.buildFallbackHtml(opts.templateType, allVariables);
    }

    // 5. Wrap in a full HTML document for PDF rendering
    const fullHtml = this.wrapInHtmlPage(
      allVariables.document_title ?? `${opts.templateType.replace(/_/g, ' ').toUpperCase()}`,
      htmlContent,
    );

    // 6. In a production system, convert HTML → PDF and upload to storage.
    //    For now, store the HTML content and simulate a file URL.
    const simulatedFileUrl = `https://storage.kealee.com/documents/${opts.projectId}/${Date.now()}-${opts.templateType}.pdf`;

    // 7. Create Document record
    const document = await prisma.document.create({
      data: {
        projectId: opts.projectId,
        templateId: template?.id,
        type: TYPE_MAP[opts.templateType] ?? opts.templateType.toUpperCase(),
        category: CATEGORY_MAP[opts.templateType] ?? 'ADMINISTRATIVE',
        name: allVariables.document_title ?? `${opts.templateType.replace(/_/g, ' ')} — ${allVariables.project_name}`,
        content: { html: fullHtml, variables: allVariables },
        fileUrl: simulatedFileUrl,
        format: 'PDF',
        status: 'GENERATED',
        metadata: {
          templateType: opts.templateType,
          generatedBy: SOURCE_APP,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // 8. If sendForSignature → initiate DocuSign flow
    if (opts.sendForSignature && opts.signers && opts.signers.length > 0) {
      await this.sendForSignature(document.id, opts.signers);
    }

    // 9. Publish event
    await eventBus.publish(
      EVENT_TYPES.DOCUMENT_GENERATED,
      {
        documentId: document.id,
        type: opts.templateType,
        projectName: allVariables.project_name,
        fileUrl: simulatedFileUrl,
      },
      SOURCE_APP,
      { projectId: opts.projectId },
    );

    console.log(
      `[DocumentGen] Generated ${opts.templateType} for project ${opts.projectId}: ${document.id}`,
    );

    return {
      id: document.id,
      fileUrl: simulatedFileUrl,
      status: document.status,
    };
  }

  // -----------------------------------------------------------------------
  // generateContractFromBid
  // -----------------------------------------------------------------------

  async generateContractFromBid(
    bidId: string,
    leadId: string,
  ): Promise<string> {
    // Get bid with evaluation + project
    const bid = await prisma.bid.findUniqueOrThrow({
      where: { id: bidId },
      include: {
        evaluation: {
          include: { project: { include: { client: true } } },
        },
      },
    });

    const project = bid.evaluation.project;
    const projectId = project.id;

    // Get contractor
    const contractor = await prisma.contractor.findUniqueOrThrow({
      where: { id: bid.contractorId },
    });

    // Get lead for additional context
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    // Build milestone schedule from timeline
    const totalDays = bid.timeline;
    const bidAmount = Number(bid.amount);
    const milestoneCount = Math.max(2, Math.min(6, Math.ceil(totalDays / 30)));
    const milestoneAmount = bidAmount / milestoneCount;
    const milestoneRows: string[] = [];
    const startDate = project.scheduledStartDate ?? new Date();

    for (let i = 0; i < milestoneCount; i++) {
      const daysOffset = Math.round(((i + 1) / milestoneCount) * totalDays);
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + daysOffset);
      const name = i === milestoneCount - 1
        ? 'Final Completion'
        : `Phase ${i + 1} Completion`;
      milestoneRows.push(
        `<tr><td>${i + 1}</td><td>${name}</td><td>${formatCurrency(milestoneAmount)}</td><td>${dueDate.toLocaleDateString('en-US')}</td></tr>`,
      );
    }

    const platformFee = bidAmount * 0.03; // 3% platform fee

    const variables: Record<string, any> = {
      document_title: `Construction Contract — ${project.name ?? 'Project'}`,
      contractor_name: contractor.contactName,
      contractor_company: contractor.companyName,
      contractor_email: contractor.email,
      contractor_phone: contractor.phone ?? '',
      contractor_address: [contractor.address, contractor.city, contractor.state, contractor.zipCode]
        .filter(Boolean)
        .join(', ') || 'N/A',
      contract_amount: formatCurrency(bidAmount),
      timeline_days: totalDays,
      scope: bid.scope ?? lead?.description ?? 'As per project plans and specifications.',
      milestone_schedule: `<table><thead><tr><th>#</th><th>Milestone</th><th>Amount</th><th>Due</th></tr></thead><tbody>${milestoneRows.join('\n')}</tbody></table>`,
      platform_fee: formatCurrency(platformFee),
      total_with_fee: formatCurrency(bidAmount + platformFee),
      bid_id: bidId,
      lead_category: lead?.category ?? '',
    };

    const result = await this.generateDocument({
      templateType: 'contract',
      projectId,
      variables,
      sendForSignature: true,
      signers: [
        {
          email: project.client?.email ?? '',
          name: project.client?.name ?? 'Client',
          role: 'client',
        },
        {
          email: contractor.email,
          name: contractor.contactName,
          role: 'contractor',
        },
      ],
    });

    return result.id;
  }

  // -----------------------------------------------------------------------
  // generateInvoice
  // -----------------------------------------------------------------------

  async generateInvoice(
    projectId: string,
    milestoneId: string,
  ): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { client: true },
    });

    // Try to find the milestone in PhaseMilestone first, then contract Milestone
    let milestoneName = 'Milestone';
    let milestoneAmount = 0;

    const phaseMilestone = await prisma.phaseMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (phaseMilestone) {
      milestoneName = phaseMilestone.name;
      milestoneAmount = Number(phaseMilestone.paymentAmount ?? 0);
    } else {
      const contractMilestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
      });
      if (contractMilestone) {
        milestoneName = contractMilestone.name;
        milestoneAmount = Number(contractMilestone.amount);
      }
    }

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const variables: Record<string, any> = {
      document_title: `Invoice ${invoiceNumber}`,
      invoice_number: invoiceNumber,
      milestone_name: milestoneName,
      amount: formatCurrency(milestoneAmount),
      invoice_date: new Date().toLocaleDateString('en-US'),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
    };

    const result = await this.generateDocument({
      templateType: 'invoice',
      projectId,
      variables,
    });

    return result.id;
  }

  // -----------------------------------------------------------------------
  // generatePunchList
  // -----------------------------------------------------------------------

  async generatePunchList(
    projectId: string,
    qaResultIds: string[],
  ): Promise<string> {
    const qaResults = await prisma.qAInspectionResult.findMany({
      where: { id: { in: qaResultIds }, projectId },
    });

    // Compile all unresolved issues
    const issueRows: string[] = [];
    let itemNum = 0;

    for (const qa of qaResults) {
      const issues = qa.issuesFound as any[] | null;
      if (!issues || !Array.isArray(issues)) continue;

      for (const issue of issues) {
        itemNum++;
        const severity = issue.severity ?? 'MEDIUM';
        const description = issue.description ?? issue.issue ?? 'Issue identified';
        const location = issue.location ?? 'See photo';
        issueRows.push(
          `<tr>` +
          `<td>${itemNum}</td>` +
          `<td>${location}</td>` +
          `<td>${description}</td>` +
          `<td><span class="severity-${severity.toLowerCase()}">${severity}</span></td>` +
          `<td>Open</td>` +
          `</tr>`,
        );
      }
    }

    const issueTable =
      `<table>` +
      `<thead><tr><th>#</th><th>Location</th><th>Description</th><th>Severity</th><th>Status</th></tr></thead>` +
      `<tbody>${issueRows.join('\n')}</tbody>` +
      `</table>`;

    const variables: Record<string, any> = {
      document_title: 'Punch List',
      issue_count: itemNum,
      issue_table: issueTable,
      qa_count: qaResults.length,
      generated_date: new Date().toLocaleDateString('en-US'),
    };

    const result = await this.generateDocument({
      templateType: 'punch_list',
      projectId,
      variables,
    });

    return result.id;
  }

  // -----------------------------------------------------------------------
  // generateChangeOrderDocument
  // -----------------------------------------------------------------------

  async generateChangeOrderDocument(
    changeOrderId: string,
  ): Promise<string> {
    const co = await prisma.changeOrder.findUniqueOrThrow({
      where: { id: changeOrderId },
      include: {
        project: { include: { client: true } },
      },
    });

    const variables: Record<string, any> = {
      document_title: `Change Order ${co.changeOrderNumber}`,
      co_number: co.changeOrderNumber,
      co_title: co.title,
      co_description: co.description ?? '',
      co_reason: co.reason ?? 'N/A',
      original_amount: formatCurrency(Number(co.originalAmount)),
      total_cost: formatCurrency(Number(co.totalCost)),
      labor_cost: co.laborCost ? formatCurrency(Number(co.laborCost)) : 'N/A',
      material_cost: co.materialCost ? formatCurrency(Number(co.materialCost)) : 'N/A',
      markup_percent: co.markupPercent ? `${Number(co.markupPercent)}%` : 'N/A',
      co_status: co.status,
    };

    const result = await this.generateDocument({
      templateType: 'change_order',
      projectId: co.projectId,
      variables,
    });

    return result.id;
  }

  // -----------------------------------------------------------------------
  // generateCloseoutDocument
  // -----------------------------------------------------------------------

  async generateCloseoutDocument(projectId: string): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { client: true },
    });

    const [inspections, changeOrders, siteVisits] = await Promise.all([
      prisma.inspection.findMany({
        where: { projectId },
        orderBy: { completedAt: 'asc' },
      }),
      prisma.changeOrder.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.siteVisit.findMany({
        where: { projectId },
        select: { id: true },
      }),
    ]);

    const inspectionRows = inspections.map(
      (i) =>
        `<tr><td>${i.inspectionType}</td><td>${i.result ?? 'Pending'}</td>` +
        `<td>${i.completedAt?.toLocaleDateString('en-US') ?? 'N/A'}</td></tr>`,
    );

    const coRows = changeOrders.map(
      (co) =>
        `<tr><td>${co.changeOrderNumber}</td><td>${co.title}</td>` +
        `<td>${formatCurrency(Number(co.totalCost))}</td><td>${co.status}</td></tr>`,
    );

    const variables: Record<string, any> = {
      document_title: `Project Closeout — ${project.name ?? projectId}`,
      actual_start: project.actualStartDate?.toLocaleDateString('en-US') ?? 'N/A',
      actual_end: project.actualEndDate?.toLocaleDateString('en-US') ?? 'N/A',
      planned_start: project.scheduledStartDate?.toLocaleDateString('en-US') ?? 'N/A',
      planned_end: project.scheduledEndDate?.toLocaleDateString('en-US') ?? 'N/A',
      inspection_count: inspections.length,
      inspections_passed: inspections.filter(
        (i) => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS',
      ).length,
      inspection_table:
        `<table><thead><tr><th>Type</th><th>Result</th><th>Date</th></tr></thead>` +
        `<tbody>${inspectionRows.join('\n')}</tbody></table>`,
      change_order_count: changeOrders.length,
      change_order_table:
        `<table><thead><tr><th>CO#</th><th>Title</th><th>Amount</th><th>Status</th></tr></thead>` +
        `<tbody>${coRows.join('\n')}</tbody></table>`,
      site_visit_count: siteVisits.length,
    };

    const result = await this.generateDocument({
      templateType: 'closeout',
      projectId,
      variables,
    });

    return result.id;
  }

  // -----------------------------------------------------------------------
  // sendForSignature (DocuSign integration)
  // -----------------------------------------------------------------------

  async sendForSignature(
    documentId: string,
    signers: Signer[],
  ): Promise<void> {
    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });

    const config = getDocuSignConfig();

    if (config.apiKey && config.accountId) {
      try {
        // Build DocuSign envelope
        const envelope = {
          emailSubject: `Please sign: ${document.name}`,
          documents: [
            {
              documentBase64: Buffer.from(
                JSON.stringify((document.content as any)?.html ?? ''),
              ).toString('base64'),
              name: document.name,
              fileExtension: 'html',
              documentId: '1',
            },
          ],
          recipients: {
            signers: signers.map((s, i) => ({
              email: s.email,
              name: s.name,
              recipientId: String(i + 1),
              routingOrder: String(i + 1),
              tabs: {
                signHereTabs: [
                  {
                    documentId: '1',
                    pageNumber: '1',
                    xPosition: '100',
                    yPosition: String(600 + i * 50),
                  },
                ],
              },
            })),
          },
          status: 'sent',
        };

        const url = `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(envelope),
        });

        if (res.ok) {
          const data = (await res.json()) as { envelopeId: string };
          await prisma.document.update({
            where: { id: documentId },
            data: {
              status: 'SENT_FOR_SIGNATURE',
              signatureStatus: 'PENDING',
              docusignEnvelopeId: data.envelopeId,
              metadata: {
                ...(document.metadata as Record<string, any> ?? {}),
                signers: signers.map((s) => ({ email: s.email, name: s.name, role: s.role })),
                sentForSignatureAt: new Date().toISOString(),
              },
            },
          });
          console.log(`[DocumentGen] DocuSign envelope sent: ${data.envelopeId}`);
        } else {
          const errText = await res.text();
          console.error(`[DocumentGen] DocuSign API error: ${errText}`);
          await prisma.document.update({
            where: { id: documentId },
            data: {
              signatureStatus: 'PENDING',
              metadata: {
                ...(document.metadata as Record<string, any> ?? {}),
                signatureError: errText,
              },
            },
          });
        }
      } catch (err) {
        console.error('[DocumentGen] DocuSign send failed:', (err as Error).message);
      }
    } else {
      // Dev mode: simulate signature flow
      const mockEnvelopeId = `mock-env-${Date.now().toString(36)}`;
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'SENT_FOR_SIGNATURE',
          signatureStatus: 'PENDING',
          docusignEnvelopeId: mockEnvelopeId,
          metadata: {
            ...(document.metadata as Record<string, any> ?? {}),
            signers: signers.map((s) => ({ email: s.email, name: s.name, role: s.role })),
            sentForSignatureAt: new Date().toISOString(),
            mockDocuSign: true,
          },
        },
      });
      console.log(
        `[DocumentGen] DocuSign (dev): mock envelope ${mockEnvelopeId} for ${signers.map((s) => s.email).join(', ')}`,
      );
    }
  }

  // -----------------------------------------------------------------------
  // handleSignatureComplete (webhook callback from DocuSign)
  // -----------------------------------------------------------------------

  async handleSignatureComplete(envelopeId: string): Promise<void> {
    const document = await prisma.document.findFirst({
      where: { docusignEnvelopeId: envelopeId },
    });

    if (!document) {
      console.warn(`[DocumentGen] No document found for envelope ${envelopeId}`);
      return;
    }

    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'SIGNED',
        signatureStatus: 'SIGNED',
        signedAt: new Date(),
      },
    });

    // If this is a contract document, publish contract.signed event
    if (document.type === 'CONTRACT') {
      await eventBus.publish(
        EVENT_TYPES.CONTRACT_SIGNED,
        {
          documentId: document.id,
          projectId: document.projectId,
          envelopeId,
        },
        SOURCE_APP,
        { projectId: document.projectId ?? undefined },
      );
    }

    console.log(
      `[DocumentGen] Signature complete for document ${document.id} (envelope ${envelopeId})`,
    );
  }

  // -----------------------------------------------------------------------
  // Private: HTML helpers
  // -----------------------------------------------------------------------

  private wrapInHtmlPage(title: string, bodyHtml: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
    h1 { color: #1a1a2e; border-bottom: 2px solid #16213e; padding-bottom: 10px; }
    h2 { color: #16213e; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f8f9fa; font-weight: 600; }
    .signature-block { margin-top: 60px; display: flex; gap: 80px; }
    .signature-line { border-top: 1px solid #333; padding-top: 5px; width: 250px; margin-top: 40px; }
    .severity-high, .severity-critical { color: #d32f2f; font-weight: 600; }
    .severity-medium { color: #f57c00; }
    .severity-low { color: #388e3c; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  ${bodyHtml}
  <div class="footer">
    <p>Generated by Kealee Platform &bull; ${new Date().toLocaleDateString('en-US')}</p>
  </div>
</body>
</html>`;
  }

  private buildFallbackHtml(
    templateType: DocumentType,
    variables: Record<string, any>,
  ): string {
    const title = variables.document_title ?? templateType.replace(/_/g, ' ').toUpperCase();
    const projectName = variables.project_name ?? 'N/A';
    const clientName = variables.client_name ?? 'N/A';
    const currentDate = variables.current_date ?? new Date().toLocaleDateString('en-US');

    switch (templateType) {
      case 'contract':
        return `<h1>${title}</h1>
<p><strong>Date:</strong> ${currentDate}</p>
<p><strong>Project:</strong> ${projectName}</p>
<p><strong>Client:</strong> ${clientName}</p>
<p><strong>Contractor:</strong> ${variables.contractor_name ?? 'N/A'}</p>
<p><strong>Contract Amount:</strong> ${variables.contract_amount ?? 'N/A'}</p>
<h2>Scope of Work</h2>
<p>${variables.scope ?? 'As per project plans and specifications.'}</p>
<h2>Milestone Schedule</h2>
${variables.milestone_schedule ?? variables.milestone_list ?? '<p>See project schedule.</p>'}
<h2>Terms and Conditions</h2>
<p>Standard Kealee construction contract terms apply. See full terms at kealee.com/terms.</p>
<div class="signature-block">
  <div><div class="signature-line">Client: ${clientName}</div></div>
  <div><div class="signature-line">Contractor: ${variables.contractor_name ?? ''}</div></div>
</div>`;

      case 'invoice':
        return `<h1>${title}</h1>
<p><strong>Invoice #:</strong> ${variables.invoice_number ?? 'N/A'}</p>
<p><strong>Date:</strong> ${variables.invoice_date ?? currentDate}</p>
<p><strong>Due Date:</strong> ${variables.due_date ?? 'N/A'}</p>
<p><strong>Project:</strong> ${projectName}</p>
<p><strong>Client:</strong> ${clientName}</p>
<h2>Line Items</h2>
<table>
  <thead><tr><th>Description</th><th>Amount</th></tr></thead>
  <tbody>
    <tr><td>${variables.milestone_name ?? 'Milestone completion'}</td><td>${variables.amount ?? 'N/A'}</td></tr>
  </tbody>
</table>
<p><strong>Total Due:</strong> ${variables.amount ?? 'N/A'}</p>`;

      case 'punch_list':
        return `<h1>${title}</h1>
<p><strong>Project:</strong> ${projectName}</p>
<p><strong>Date:</strong> ${variables.generated_date ?? currentDate}</p>
<p><strong>Total Items:</strong> ${variables.issue_count ?? 0}</p>
<p><strong>QA Inspections Reviewed:</strong> ${variables.qa_count ?? 0}</p>
<h2>Items</h2>
${variables.issue_table ?? '<p>No items.</p>'}`;

      case 'change_order':
        return `<h1>${title}</h1>
<p><strong>CO#:</strong> ${variables.co_number ?? 'N/A'}</p>
<p><strong>Project:</strong> ${projectName}</p>
<p><strong>Date:</strong> ${currentDate}</p>
<h2>Description</h2>
<p>${variables.co_description ?? 'N/A'}</p>
<p><strong>Reason:</strong> ${variables.co_reason ?? 'N/A'}</p>
<h2>Cost Breakdown</h2>
<table>
  <tr><td>Labor</td><td>${variables.labor_cost ?? 'N/A'}</td></tr>
  <tr><td>Materials</td><td>${variables.material_cost ?? 'N/A'}</td></tr>
  <tr><td>Markup</td><td>${variables.markup_percent ?? 'N/A'}</td></tr>
  <tr><td><strong>Total</strong></td><td><strong>${variables.total_cost ?? 'N/A'}</strong></td></tr>
</table>
<div class="signature-block">
  <div><div class="signature-line">Approved By</div></div>
  <div><div class="signature-line">Date</div></div>
</div>`;

      case 'closeout':
        return `<h1>${title}</h1>
<p><strong>Project:</strong> ${projectName}</p>
<p><strong>Client:</strong> ${clientName}</p>
<h2>Timeline</h2>
<table>
  <tr><td>Planned Start</td><td>${variables.planned_start ?? 'N/A'}</td></tr>
  <tr><td>Planned End</td><td>${variables.planned_end ?? 'N/A'}</td></tr>
  <tr><td>Actual Start</td><td>${variables.actual_start ?? 'N/A'}</td></tr>
  <tr><td>Actual End</td><td>${variables.actual_end ?? 'N/A'}</td></tr>
</table>
<h2>Inspections (${variables.inspection_count ?? 0} total, ${variables.inspections_passed ?? 0} passed)</h2>
${variables.inspection_table ?? '<p>No inspections recorded.</p>'}
<h2>Change Orders (${variables.change_order_count ?? 0})</h2>
${variables.change_order_table ?? '<p>No change orders.</p>'}
<p><strong>Site Visits:</strong> ${variables.site_visit_count ?? 0}</p>
<div class="signature-block">
  <div><div class="signature-line">Project Manager</div></div>
  <div><div class="signature-line">Client: ${clientName}</div></div>
</div>`;

      default:
        return `<h1>${title}</h1>
<p><strong>Project:</strong> ${projectName}</p>
<p><strong>Date:</strong> ${currentDate}</p>
<p>${variables.body ?? variables.content ?? 'Document content.'}</p>`;
    }
  }
}
