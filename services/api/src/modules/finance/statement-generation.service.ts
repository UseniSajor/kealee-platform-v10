/**
 * Statement Generation Service
 * Generates PDF financial statements and handles email delivery
 */

import PDFDocument from 'pdfkit';
import { PrismaClient } from '@kealee/database';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface StatementConfig {
  escrowId: string;
  periodStart: Date;
  periodEnd: Date;
  recipientUserId: string;
  includeTransactionDetails: boolean;
  includeFeeBreakdown: boolean;
  includeCharts: boolean;
}

export interface StatementData {
  statementNumber: string;
  escrowAccountNumber: string;
  period: {
    start: Date;
    end: Date;
  };
  recipient: {
    name: string;
    email: string;
    address?: string;
  };
  balances: {
    opening: number;
    closing: number;
    deposits: number;
    releases: number;
    fees: number;
  };
  transactions: Array<{
    date: Date;
    description: string;
    type: string;
    debit?: number;
    credit?: number;
    balance: number;
  }>;
  feeBreakdown: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export class StatementGenerationService {
  private readonly statementStoragePath = path.join(process.cwd(), 'storage', 'statements');

  constructor() {
    // Ensure storage directory exists
    if (!fs.existsSync(this.statementStoragePath)) {
      fs.mkdirSync(this.statementStoragePath, { recursive: true });
    }
  }

  /**
   * Generate statement PDF
   */
  async generateStatement(config: StatementConfig): Promise<{
    statementId: string;
    pdfPath: string;
    pdfBuffer: Buffer;
  }> {
    // Gather statement data
    const data = await this.gatherStatementData(config);

    // Generate PDF
    const pdfBuffer = await this.createPDF(data);

    // Generate unique statement ID
    const statementId = this.generateStatementId();

    // Save PDF to storage
    const pdfPath = path.join(
      this.statementStoragePath,
      `${statementId}.pdf`
    );
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Create statement record
    await prisma.statement.create({
      data: {
        id: statementId,
        statementType: 'CUSTOM',
        recipientId: config.recipientUserId,
        periodStart: config.periodStart,
        periodEnd: config.periodEnd,
        generatedAt: new Date(),
        documentUrl: pdfPath,
        status: 'GENERATED',
        metadata: { escrowId: config.escrowId },
      },
    });

    return {
      statementId,
      pdfPath,
      pdfBuffer,
    };
  }

  /**
   * Generate monthly statement for all escrows
   */
  async generateMonthlyStatements(): Promise<number> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all active escrows
    const escrows = await prisma.escrowAgreement.findMany({
      where: {
        status: { in: ['ACTIVE', 'FROZEN'] },
      },
      include: {
        contract: {
          include: {
            owner: true,
            contractor: true,
          },
        },
      },
    });

    let generated = 0;

    for (const escrow of escrows) {
      try {
        // Generate statement for owner
        await this.generateStatement({
          escrowId: escrow.id,
          periodStart: lastMonth,
          periodEnd: lastMonthEnd,
          recipientUserId: escrow.contract.ownerId,
          includeTransactionDetails: true,
          includeFeeBreakdown: true,
          includeCharts: false,
        });

        // Generate statement for contractor
        await this.generateStatement({
          escrowId: escrow.id,
          periodStart: lastMonth,
          periodEnd: lastMonthEnd,
          recipientUserId: escrow.contract.contractorId,
          includeTransactionDetails: true,
          includeFeeBreakdown: true,
          includeCharts: false,
        });

        generated += 2;
      } catch (error) {
        console.error(`Failed to generate statement for escrow ${escrow.id}:`, error);
      }
    }

    return generated;
  }

  /**
   * Send statement via email
   */
  async sendStatement(statementId: string): Promise<void> {
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { recipient: true },
    });

    if (!statement) {
      throw new Error('Statement not found');
    }

    // Read PDF file
    const pdfBuffer = fs.readFileSync(statement.documentUrl);

    // Send email with PDF attachment
    // NOTE: Replace with your actual email service
    console.log(`Sending statement ${statementId} to ${statement.recipient.email}`);

    // Update statement status
    await prisma.statement.update({
      where: { id: statementId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Gather statement data
   */
  private async gatherStatementData(config: StatementConfig): Promise<StatementData> {
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: config.escrowId },
      include: { contract: true },
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    const recipient = await prisma.user.findUnique({
      where: { id: config.recipientUserId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Get transactions in period
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        escrowAgreementId: config.escrowId,
        createdAt: {
          gte: config.periodStart,
          lte: config.periodEnd,
        },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate balances
    const openingBalance = await this.getBalanceAtDate(
      config.escrowId,
      config.periodStart
    );

    let runningBalance = openingBalance;
    const transactionDetails = transactions.map((tx) => {
      const isDebit = tx.type === 'RELEASE' || tx.type === 'FEE';
      const isCredit = tx.type === 'DEPOSIT' || tx.type === 'REFUND' || tx.type === 'INTEREST';

      if (isDebit) {
        runningBalance -= tx.amount;
      } else if (isCredit) {
        runningBalance += tx.amount;
      }

      return {
        date: tx.createdAt,
        description: tx.description || `${tx.type} Transaction`,
        type: tx.type,
        debit: isDebit ? tx.amount : undefined,
        credit: isCredit ? tx.amount : undefined,
        balance: runningBalance,
      };
    });

    const deposits = transactions
      .filter((tx) => tx.type === 'DEPOSIT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const releases = transactions
      .filter((tx) => tx.type === 'RELEASE')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const fees = transactions
      .filter((tx) => tx.type === 'FEE')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Fee breakdown
    const feeBreakdown = [
      {
        category: 'Platform Fees',
        amount: fees * 0.7,
        count: transactions.filter((tx) => tx.type === 'FEE').length,
      },
      {
        category: 'Processing Fees',
        amount: fees * 0.3,
        count: transactions.filter((tx) => tx.type === 'DEPOSIT').length,
      },
    ];

    return {
      statementNumber: this.generateStatementNumber(),
      escrowAccountNumber: escrow.escrowAccountNumber,
      period: {
        start: config.periodStart,
        end: config.periodEnd,
      },
      recipient: {
        name: `${recipient.firstName} ${recipient.lastName}`,
        email: recipient.email,
      },
      balances: {
        opening: openingBalance,
        closing: runningBalance,
        deposits,
        releases,
        fees,
      },
      transactions: transactionDetails,
      feeBreakdown,
    };
  }

  /**
   * Create PDF document
   */
  private async createPDF(data: StatementData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('KEALEE PLATFORM', 50, 50)
        .fontSize(10)
        .font('Helvetica')
        .text('Financial Statement', 50, 80)
        .moveDown();

      // Statement Info
      doc
        .fontSize(10)
        .text(`Statement #: ${data.statementNumber}`, 50, 110)
        .text(`Escrow Account: ${data.escrowAccountNumber}`, 50, 125)
        .text(
          `Period: ${this.formatDate(data.period.start)} - ${this.formatDate(data.period.end)}`,
          50,
          140
        )
        .text(`Generated: ${this.formatDate(new Date())}`, 50, 155);

      // Recipient Info
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Account Holder:', 400, 110)
        .font('Helvetica')
        .text(data.recipient.name, 400, 125)
        .text(data.recipient.email, 400, 140);

      // Balance Summary
      doc.moveDown(3);
      const summaryY = 200;
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Balance Summary', 50, summaryY)
        .fontSize(10)
        .font('Helvetica');

      const summaryTableY = summaryY + 25;
      doc
        .text('Opening Balance:', 50, summaryTableY)
        .text(this.formatCurrency(data.balances.opening), 200, summaryTableY, { align: 'right' });

      doc
        .text('Total Deposits:', 50, summaryTableY + 20)
        .text(`+ ${this.formatCurrency(data.balances.deposits)}`, 200, summaryTableY + 20, {
          align: 'right',
        });

      doc
        .text('Total Releases:', 50, summaryTableY + 40)
        .text(`- ${this.formatCurrency(data.balances.releases)}`, 200, summaryTableY + 40, {
          align: 'right',
        });

      doc
        .text('Total Fees:', 50, summaryTableY + 60)
        .text(`- ${this.formatCurrency(data.balances.fees)}`, 200, summaryTableY + 60, {
          align: 'right',
        });

      doc
        .moveTo(50, summaryTableY + 85)
        .lineTo(250, summaryTableY + 85)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .text('Closing Balance:', 50, summaryTableY + 95)
        .text(this.formatCurrency(data.balances.closing), 200, summaryTableY + 95, {
          align: 'right',
        });

      // Transaction History
      doc.addPage();
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Transaction History', 50, 50);

      // Table headers
      const tableY = 80;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 50, tableY);
      doc.text('Description', 120, tableY);
      doc.text('Debit', 340, tableY);
      doc.text('Credit', 400, tableY);
      doc.text('Balance', 460, tableY);

      // Table rows
      doc.font('Helvetica').fontSize(8);
      let currentY = tableY + 20;

      for (const tx of data.transactions) {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.text(this.formatDate(tx.date), 50, currentY, { width: 60 });
        doc.text(tx.description, 120, currentY, { width: 200 });
        doc.text(tx.debit ? this.formatCurrency(tx.debit) : '-', 340, currentY);
        doc.text(tx.credit ? this.formatCurrency(tx.credit) : '-', 400, currentY);
        doc.text(this.formatCurrency(tx.balance), 460, currentY);

        currentY += 15;
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This is an official financial statement from Kealee Platform. For questions, contact support@kealee.com',
          50,
          750,
          { align: 'center', width: 500 }
        );

      doc.end();
    });
  }

  private async getBalanceAtDate(escrowId: string, date: Date): Promise<number> {
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        escrowAgreementId: escrowId,
        createdAt: { lt: date },
        status: 'COMPLETED',
      },
    });

    let balance = 0;
    for (const tx of transactions) {
      if (tx.type === 'DEPOSIT' || tx.type === 'REFUND' || tx.type === 'INTEREST') {
        balance += tx.amount;
      } else if (tx.type === 'RELEASE' || tx.type === 'FEE') {
        balance -= tx.amount;
      }
    }

    return balance;
  }

  private generateStatementId(): string {
    return `STMT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStatementNumber(): string {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export const statementGenerationService = new StatementGenerationService();

