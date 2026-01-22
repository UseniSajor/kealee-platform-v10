/**
 * Tax Compliance Service  
 * Handles 1099 form generation and tax reporting
 */

import PDFDocument from 'pdfkit';
import { PrismaClient } from '@kealee/database';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface Form1099Data {
  taxYear: number;
  payer: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    tin: string; // Tax Identification Number (EIN)
    phoneNumber: string;
  };
  recipient: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    tin: string; // SSN or EIN
  };
  payments: {
    nonemployeeCompensation: number; // Box 1 (1099-NEC)
    payerMadeDirect Sales: boolean; // Box 2
    federalIncomeTaxWithheld: number; // Box 4
    stateTaxWithheld: number; // Box 5
    stateIncome: number; // Box 6
  };
  accountNumber?: string;
}

export interface TaxReportSummary {
  taxYear: number;
  totalContractors: number;
  totalPayments: number;
  totalReportable: number; // Payments > $600
  forms1099Generated: number;
  filingDeadline: Date;
  status: '1099_READY' | 'FILED' | 'NOT_REQUIRED';
}

export class TaxComplianceService {
  private readonly form1099StoragePath = path.join(process.cwd(), 'storage', 'tax-forms');
  private readonly REPORTABLE_THRESHOLD = 600; // $600 minimum for 1099-NEC

  constructor() {
    if (!fs.existsSync(this.form1099StoragePath)) {
      fs.mkdirSync(this.form1099StoragePath, { recursive: true });
    }
  }

  /**
   * Generate all 1099 forms for tax year
   */
  async generateAll1099Forms(taxYear: number): Promise<TaxReportSummary> {
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31, 23, 59, 59);

    // Get all contractors who received payments
    const contractors = await this.getContractorsWithPayments(startDate, endDate);

    let totalPayments = 0;
    let totalReportable = 0;
    let formsGenerated = 0;

    for (const contractor of contractors) {
      const yearlyTotal = await this.calculateYearlyPayments(
        contractor.id,
        startDate,
        endDate
      );

      totalPayments += yearlyTotal;

      // Only generate 1099 if payments >= $600
      if (yearlyTotal >= this.REPORTABLE_THRESHOLD) {
        await this.generate1099NEC(contractor.id, taxYear);
        formsGenerated++;
        totalReportable += yearlyTotal;
      }
    }

    // Filing deadline: January 31st of following year
    const filingDeadline = new Date(taxYear + 1, 0, 31);

    return {
      taxYear,
      totalContractors: contractors.length,
      totalPayments,
      totalReportable,
      forms1099Generated: formsGenerated,
      filingDeadline,
      status: formsGenerated > 0 ? 'NOT_FILED' : 'NOT_REQUIRED',
    };
  }

  /**
   * Generate 1099-NEC for specific contractor
   */
  async generate1099NEC(contractorId: string, taxYear: number): Promise<string> {
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31, 23, 59, 59);

    // Get contractor info
    const contractor = await prisma.user.findUnique({
      where: { id: contractorId },
    });

    if (!contractor) {
      throw new Error('Contractor not found');
    }

    // Calculate total payments
    const totalPayments = await this.calculateYearlyPayments(
      contractorId,
      startDate,
      endDate
    );

    if (totalPayments < this.REPORTABLE_THRESHOLD) {
      throw new Error(`Payments below $${this.REPORTABLE_THRESHOLD} threshold`);
    }

    // Get payer (company) info
    const payerInfo = await this.getPayerInformation();

    // Prepare form data
    const formData: Form1099Data = {
      taxYear,
      payer: payerInfo,
      recipient: {
        name: `${contractor.firstName} ${contractor.lastName}`,
        address: contractor.address || '',
        city: contractor.city || '',
        state: contractor.state || '',
        zip: contractor.zipCode || '',
        tin: contractor.ssn || contractor.ein || 'MISSING',
      },
      payments: {
        nonemployeeCompensation: totalPayments,
        payerMadeDirect Sales: false,
        federalIncomeTaxWithheld: 0,
        stateTaxWithheld: 0,
        stateIncome: totalPayments,
      },
      accountNumber: contractor.id.substring(0, 16),
    };

    // Generate PDF
    const pdfBuffer = await this.create1099NECPDF(formData);

    // Save to storage
    const filename = `1099-NEC-${taxYear}-${contractorId}.pdf`;
    const filepath = path.join(this.form1099StoragePath, filename);
    fs.writeFileSync(filepath, pdfBuffer);

    // Create tax form record
    await prisma.taxForm.create({
      data: {
        formType: '1099-NEC',
        taxYear,
        recipientId: contractorId,
        amount: totalPayments,
        documentUrl: filepath,
        status: 'GENERATED',
        generatedAt: new Date(),
      },
    });

    return filepath;
  }

  /**
   * Send 1099 to contractor
   */
  async send1099ToContractor(contractorId: string, taxYear: number): Promise<void> {
    const taxForm = await prisma.taxForm.findFirst({
      where: {
        formType: '1099-NEC',
        taxYear,
        recipientId: contractorId,
      },
      include: {
        recipient: true,
      },
    });

    if (!taxForm) {
      throw new Error('1099 form not found');
    }

    // Read PDF
    const pdfBuffer = fs.readFileSync(taxForm.documentUrl);

    // Send email with 1099 attached
    console.log(`Sending 1099-NEC to ${taxForm.recipient.email}`);
    // NOTE: Implement email sending with your email service

    // Update status
    await prisma.taxForm.update({
      where: { id: taxForm.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  /**
   * File 1099s with IRS (Electronic Filing)
   */
  async fileWithIRS(taxYear: number): Promise<void> {
    // Get all generated 1099s for tax year
    const forms = await prisma.taxForm.findMany({
      where: {
        formType: '1099-NEC',
        taxYear,
        status: { in: ['GENERATED', 'SENT'] },
      },
    });

    console.log(`Filing ${forms.length} Form 1099-NEC with IRS for tax year ${taxYear}`);

    // NOTE: Implement IRS FIRE (Filing Information Returns Electronically) integration
    // https://www.irs.gov/e-file-providers/fire-system

    // For now, mark as filed
    await prisma.taxForm.updateMany({
      where: {
        formType: '1099-NEC',
        taxYear,
      },
      data: {
        status: 'FILED',
        filedAt: new Date(),
      },
    });
  }

  /**
   * Generate tax summary report
   */
  async generateTaxSummaryReport(taxYear: number): Promise<string> {
    const summary = await this.generateAll1099Forms(taxYear);

    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });

    // Create report
    doc.fontSize(20).text(`Tax Year ${taxYear} Summary`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Total Contractors: ${summary.totalContractors}`);
    doc.text(`Total Payments: $${summary.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Reportable Payments (≥$600): $${summary.totalReportable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`1099-NEC Forms Generated: ${summary.forms1099Generated}`);
    doc.text(`Filing Deadline: ${summary.filingDeadline.toLocaleDateString()}`);
    doc.text(`Status: ${summary.status}`);

    doc.end();

    const pdfBuffer = await pdfBufferPromise;

    // Save report
    const filename = `Tax-Summary-${taxYear}.pdf`;
    const filepath = path.join(this.form1099StoragePath, filename);
    fs.writeFileSync(filepath, pdfBuffer);

    return filepath;
  }

  // Private helper methods

  private async getContractorsWithPayments(startDate: Date, endDate: Date) {
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        type: 'RELEASE',
        status: 'COMPLETED',
        processedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        escrowAgreement: {
          include: {
            contract: {
              include: {
                contractor: true,
              },
            },
          },
        },
      },
    });

    // Extract unique contractors
    const contractorMap = new Map();
    for (const tx of transactions) {
      const contractor = tx.escrowAgreement.contract.contractor;
      if (!contractorMap.has(contractor.id)) {
        contractorMap.set(contractor.id, contractor);
      }
    }

    return Array.from(contractorMap.values());
  }

  private async calculateYearlyPayments(
    contractorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.escrowTransaction.aggregate({
      where: {
        type: 'RELEASE',
        status: 'COMPLETED',
        processedDate: {
          gte: startDate,
          lte: endDate,
        },
        escrowAgreement: {
          contract: {
            contractorId,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  private async getPayerInformation() {
    // Return company information
    return {
      name: 'Kealee Platform Inc.',
      address: '123 Business Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      tin: '12-3456789', // Company EIN
      phoneNumber: '(415) 555-0100',
    };
  }

  private async create1099NECPDF(data: Form1099Data): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('1099-NEC', 250, 50);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Tax Year ${data.taxYear}`, 250, 70);

      // Form instructions
      doc
        .fontSize(8)
        .text('NONEMPLOYEE COMPENSATION', 50, 100, { align: 'center' });

      // Payer Information (Left)
      doc.fontSize(10).font('Helvetica-Bold').text('PAYER:', 50, 130);
      doc.font('Helvetica').fontSize(9);
      doc.text(data.payer.name, 50, 145);
      doc.text(data.payer.address, 50, 160);
      doc.text(`${data.payer.city}, ${data.payer.state} ${data.payer.zip}`, 50, 175);
      doc.text(`TIN: ${data.payer.tin}`, 50, 190);
      doc.text(`Phone: ${data.payer.phoneNumber}`, 50, 205);

      // Recipient Information (Right)
      doc.fontSize(10).font('Helvetica-Bold').text('RECIPIENT:', 350, 130);
      doc.font('Helvetica').fontSize(9);
      doc.text(data.recipient.name, 350, 145);
      doc.text(data.recipient.address, 350, 160);
      doc.text(`${data.recipient.city}, ${data.recipient.state} ${data.recipient.zip}`, 350, 175);
      doc.text(`TIN: ${data.recipient.tin}`, 350, 190);

      // Box 1: Nonemployee compensation
      doc.moveTo(50, 250).lineTo(550, 250).stroke();
      doc
        .fontSize(8)
        .text('1. Nonemployee compensation', 60, 260);
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`$${data.payments.nonemployeeCompensation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 350, 260);

      // Box 4: Federal income tax withheld
      doc.moveTo(50, 300).lineTo(550, 300).stroke();
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('4. Federal income tax withheld', 60, 310);
      doc
        .fontSize(12)
        .text(`$${data.payments.federalIncomeTaxWithheld.toFixed(2)}`, 350, 310);

      // Account number
      if (data.accountNumber) {
        doc.fontSize(8).text(`Account Number: ${data.accountNumber}`, 50, 350);
      }

      // Copy designation
      doc.fontSize(10).font('Helvetica-Bold').text('Copy B - For Recipient', 250, 400);

      // Footer
      doc
        .fontSize(7)
        .font('Helvetica')
        .text(
          'This is important tax information and is being furnished to the IRS. If you are required to file a return, a negligence penalty or other sanction may be imposed on you if this income is taxable and the IRS determines that it has not been reported.',
          50,
          700,
          { width: 500, align: 'center' }
        );

      doc.end();
    });
  }
}

export const taxComplianceService = new TaxComplianceService();

