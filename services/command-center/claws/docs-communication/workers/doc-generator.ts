/**
 * DOCUMENT GENERATOR WORKER
 *
 * Claw F -- docs-communication-claw
 *
 * Responsibilities:
 *   - Template rendering with variable interpolation
 *   - PDF generation (AIA G702/G703, lien waivers, RFIs, contracts, COs)
 *   - E-signature orchestration (DocuSign integration)
 *   - AI-powered narrative generation
 *
 * GUARDRAILS (PURE REPRESENTATION LAYER):
 *   - Cannot mutate contracts, budgets, schedules, or any domain data
 *   - Cannot make decisions or recommendations
 *   - Cannot trigger financial transactions
 *   - Must call assertWritable() before every Prisma write
 *   - Only writes to: Document, DocumentTemplate, GeneratedDocument
 *
 * Queue: KEALEE_QUEUES.DOCUMENT_GEN ('kealee-document-gen')
 *
 * Job names:
 *   generate-contract-doc       -- contract PDF from executed contract
 *   generate-change-order-doc   -- change order PDF
 *   generate-aia-g702           -- AIA G702 Application for Payment
 *   generate-aia-g703           -- AIA G703 Continuation Sheet
 *   generate-lien-waiver        -- conditional/unconditional lien waivers
 *   generate-rfi                -- Request for Information document
 *   generate-ai-narrative       -- AI-powered narrative sections
 *   request-esignature          -- DocuSign e-signature flow
 */

import type { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported document types for generation */
export type DocumentType =
  | 'CONTRACT'
  | 'CHANGE_ORDER'
  | 'AIA_G702'
  | 'AIA_G703'
  | 'LIEN_WAIVER'
  | 'RFI'
  | 'NARRATIVE'
  | 'PUNCH_LIST'
  | 'DAILY_REPORT'
  | 'MEETING_MINUTES';

/** Lien waiver subtypes */
export type LienWaiverType =
  | 'CONDITIONAL_PROGRESS'
  | 'UNCONDITIONAL_PROGRESS'
  | 'CONDITIONAL_FINAL'
  | 'UNCONDITIONAL_FINAL';

/** E-signature signer definition */
export interface Signer {
  email: string;
  name: string;
  role: string;
  order?: number;
}

/** Generated document structure for PDF rendering */
export interface DocumentStructure {
  title: string;
  header: {
    projectName: string;
    projectNumber?: string;
    date: string;
    preparedBy: string;
    documentNumber?: string;
  };
  sections: Array<{
    heading: string;
    content: string;
    table?: {
      headers: string[];
      rows: string[][];
    };
  }>;
  signatures?: Array<{
    role: string;
    name: string;
    date: string;
    signed?: boolean;
  }>;
  footer: {
    pageCount: boolean;
    confidential: boolean;
    company?: string;
  };
}

// ---------------------------------------------------------------------------
// AIA G702 -- Application and Certificate for Payment
// ---------------------------------------------------------------------------

export interface AiaG702Data {
  contractor: {
    name: string;
    address: string;
  };
  owner: {
    name: string;
    address: string;
  };
  architect: {
    name: string;
  };
  project: {
    name: string;
    number: string;
  };
  contract: {
    date: string;
    amount: number;
  };
  application: {
    number: number;
    periodTo: string;
    forPaymentOf: number;
  };
  changeOrders: {
    additions: number;
    deductions: number;
    netChange: number;
  };
  totalEarned: number;
  retainage: {
    completedWorkPercent: number;
    storedMaterialPercent: number;
    completedWorkAmount: number;
    storedMaterialAmount: number;
    totalRetainage: number;
  };
  totalEarnedLessRetainage: number;
  previousCertificates: number;
  currentPaymentDue: number;
  balanceToFinish: number;
}

/**
 * Build the AIA G702 data structure from project/contract records.
 */
export function buildG702Structure(data: AiaG702Data): DocumentStructure {
  return {
    title: 'APPLICATION AND CERTIFICATE FOR PAYMENT (AIA G702)',
    header: {
      projectName: data.project.name,
      projectNumber: data.project.number,
      date: data.application.periodTo,
      preparedBy: data.contractor.name,
      documentNumber: `Payment Application #${data.application.number}`,
    },
    sections: [
      {
        heading: 'Contractor',
        content: `${data.contractor.name}\n${data.contractor.address}`,
      },
      {
        heading: 'Contract Summary',
        content: '',
        table: {
          headers: ['Item', 'Amount'],
          rows: [
            ['Original Contract Sum', `$${data.contract.amount.toLocaleString()}`],
            ['Net Change by Change Orders', `$${data.changeOrders.netChange.toLocaleString()}`],
            ['Contract Sum to Date', `$${(data.contract.amount + data.changeOrders.netChange).toLocaleString()}`],
            ['Total Completed & Stored', `$${data.totalEarned.toLocaleString()}`],
            ['Total Retainage', `$${data.retainage.totalRetainage.toLocaleString()}`],
            ['Total Earned Less Retainage', `$${data.totalEarnedLessRetainage.toLocaleString()}`],
            ['Less Previous Certificates', `$${data.previousCertificates.toLocaleString()}`],
            ['CURRENT PAYMENT DUE', `$${data.currentPaymentDue.toLocaleString()}`],
            ['Balance to Finish', `$${data.balanceToFinish.toLocaleString()}`],
          ],
        },
      },
    ],
    signatures: [
      { role: 'Contractor', name: data.contractor.name, date: '' },
      { role: 'Architect', name: data.architect.name, date: '' },
      { role: 'Owner', name: data.owner.name, date: '' },
    ],
    footer: { pageCount: true, confidential: true, company: 'Kealee Construction' },
  };
}

// ---------------------------------------------------------------------------
// AIA G703 -- Continuation Sheet
// ---------------------------------------------------------------------------

export interface G703LineItem {
  number: string;
  description: string;
  scheduledValue: number;
  previousApplications: number;
  thisPeriodsWork: number;
  materialsStored: number;
  totalCompletedAndStored: number;
  percentComplete: number;
  balanceToFinish: number;
  retainage: number;
}

/**
 * Build a G703 Continuation Sheet table from line items.
 */
export function buildG703Table(items: G703LineItem[]): {
  headers: string[];
  rows: string[][];
  totals: string[];
} {
  const headers = [
    '#', 'Description of Work', 'Scheduled Value',
    'Previous Applications', "This Period's Work", 'Materials Stored',
    'Total Completed & Stored', '% Complete', 'Balance to Finish', 'Retainage',
  ];

  const rows = items.map((item) => [
    item.number,
    item.description,
    `$${item.scheduledValue.toLocaleString()}`,
    `$${item.previousApplications.toLocaleString()}`,
    `$${item.thisPeriodsWork.toLocaleString()}`,
    `$${item.materialsStored.toLocaleString()}`,
    `$${item.totalCompletedAndStored.toLocaleString()}`,
    `${item.percentComplete.toFixed(1)}%`,
    `$${item.balanceToFinish.toLocaleString()}`,
    `$${item.retainage.toLocaleString()}`,
  ]);

  // Compute totals
  const sum = (field: keyof G703LineItem) =>
    items.reduce((acc, item) => acc + (item[field] as number), 0);

  const totalScheduled = sum('scheduledValue');
  const totalPercent = totalScheduled > 0
    ? (sum('totalCompletedAndStored') / totalScheduled) * 100
    : 0;

  const totals = [
    '', 'TOTALS',
    `$${totalScheduled.toLocaleString()}`,
    `$${sum('previousApplications').toLocaleString()}`,
    `$${sum('thisPeriodsWork').toLocaleString()}`,
    `$${sum('materialsStored').toLocaleString()}`,
    `$${sum('totalCompletedAndStored').toLocaleString()}`,
    `${totalPercent.toFixed(1)}%`,
    `$${sum('balanceToFinish').toLocaleString()}`,
    `$${sum('retainage').toLocaleString()}`,
  ];

  return { headers, rows, totals };
}

// ---------------------------------------------------------------------------
// Lien Waiver Templates
// ---------------------------------------------------------------------------

export const LIEN_WAIVER_TEMPLATES: Record<LienWaiverType, {
  title: string;
  bodyTemplate: string;
}> = {
  CONDITIONAL_PROGRESS: {
    title: 'CONDITIONAL WAIVER AND RELEASE ON PROGRESS PAYMENT',
    bodyTemplate:
      'Upon receipt of a check from {owner} in the sum of ${amount} payable to ' +
      '{claimant} and when the check has been properly endorsed and has been paid ' +
      'by the bank on which it is drawn, this document becomes effective to release ' +
      'any mechanic\'s lien, stop payment notice, or bond right the claimant has on ' +
      'the job of {owner} located at {address} to the following extent: This document ' +
      'covers the following work through {throughDate}.',
  },
  UNCONDITIONAL_PROGRESS: {
    title: 'UNCONDITIONAL WAIVER AND RELEASE ON PROGRESS PAYMENT',
    bodyTemplate:
      'The claimant, {claimant}, has received a progress payment in the sum of ' +
      '${amount} for labor, services, equipment, or material furnished to {owner} ' +
      'on the job of {owner} located at {address} and does hereby release any ' +
      'mechanic\'s lien, stop payment notice, or bond right through {throughDate}.',
  },
  CONDITIONAL_FINAL: {
    title: 'CONDITIONAL WAIVER AND RELEASE ON FINAL PAYMENT',
    bodyTemplate:
      'Upon receipt of a check from {owner} in the sum of ${amount} payable to ' +
      '{claimant} and when the check has been properly endorsed and has been paid ' +
      'by the bank on which it is drawn, this document becomes effective to release ' +
      'any mechanic\'s lien, stop payment notice, or bond right the claimant has on ' +
      'the job of {owner} located at {address}. This document covers the final ' +
      'payment for all labor, services, equipment, or material furnished on the job.',
  },
  UNCONDITIONAL_FINAL: {
    title: 'UNCONDITIONAL WAIVER AND RELEASE ON FINAL PAYMENT',
    bodyTemplate:
      'The claimant, {claimant}, has been paid in full for all labor, services, ' +
      'equipment, or material furnished to {owner} on the job of {owner} located ' +
      'at {address} and does hereby waive and release any right to a mechanic\'s ' +
      'lien, stop payment notice, and any right to make a claim on the payment bond ' +
      'for said work.',
  },
};

/**
 * Interpolate lien waiver template variables.
 */
export function renderLienWaiver(
  waiverType: LienWaiverType,
  variables: Record<string, string>,
): { title: string; body: string } {
  const template = LIEN_WAIVER_TEMPLATES[waiverType];
  let body = template.bodyTemplate;

  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return { title: template.title, body };
}

// ---------------------------------------------------------------------------
// RFI Numbering
// ---------------------------------------------------------------------------

/**
 * Generate the next RFI number for a project.
 */
export async function getNextRfiNumber(
  prisma: PrismaClient,
  projectId: string,
): Promise<string> {
  const count = await prisma.document.count({
    where: { projectId, type: 'RFI' },
  });

  return `RFI-${String(count + 1).padStart(3, '0')}`;
}

// ---------------------------------------------------------------------------
// Template Variable Interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolate template variables in a string.
 * Variables are enclosed in double curly braces: {{variableName}}
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}
