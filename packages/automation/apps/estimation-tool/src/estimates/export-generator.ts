/**
 * Export Generator
 * Generate estimate exports in various formats
 */

import { PrismaClient } from '@prisma/client';
// @ts-ignore - xlsx types may not be installed yet
import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Estimate, EstimateTotals } from './estimate-builder.js';
import { EstimateSection } from './section-manager.js';
import { EstimateLineItem } from './line-item-manager.js';

const prisma = new PrismaClient();

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

export interface ExportOptions {
  format: ExportFormat;
  includeBreakdown?: boolean;
  includeSections?: boolean;
  includeLineItems?: boolean;
  includeNotes?: boolean;
  includeCoverPage?: boolean;
  companyInfo?: CompanyInfo;
  projectInfo?: ProjectInfo;
  groupByDivision?: boolean;
  showUnitCosts?: boolean;
  roundTo?: number;
}

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface ProjectInfo {
  name: string;
  address?: string;
  owner?: string;
  architect?: string;
  bidDate?: Date;
  projectNumber?: string;
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  data: Buffer | string;
  mimeType: string;
  size: number;
}

export class ExportGenerator {
  /**
   * Export estimate
   */
  async exportEstimate(
    estimateId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const estimate = await this.getEstimateData(estimateId);

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    switch (options.format) {
      case 'PDF':
        return this.exportToPDF(estimate, options);
      case 'EXCEL':
        return this.exportToExcel(estimate, options);
      case 'CSV':
        return this.exportToCSV(estimate, options);
      case 'JSON':
        return this.exportToJSON(estimate, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Get estimate data with sections and items
   */
  private async getEstimateData(estimateId: string): Promise<{
    estimate: any;
    sections: any[];
    lineItems: any[];
  } | null> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: {
          include: { lineItems: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!estimate) return null;

    const lineItems = estimate.sections.flatMap(s => s.lineItems);

    return {
      estimate,
      sections: estimate.sections,
      lineItems,
    };
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(
    data: { estimate: any; sections: any[]; lineItems: any[] },
    options: ExportOptions
  ): Promise<ExportResult> {
    const { estimate, sections } = data;
    const totals = estimate.totals as EstimateTotals;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([612, 792]); // Letter size
    let y = 750;
    const leftMargin = 50;
    const rightMargin = 562;

    // Helper function to add text
    const addText = (text: string, x: number, yPos: number, size: number = 10, bold: boolean = false) => {
      page.drawText(text, {
        x,
        y: yPos,
        size,
        font: bold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
    };

    // Helper function to add new page
    const addNewPage = () => {
      page = pdfDoc.addPage([612, 792]);
      y = 750;
    };

    // Cover page
    if (options.includeCoverPage) {
      addText('CONSTRUCTION ESTIMATE', leftMargin, y, 24, true);
      y -= 40;

      if (options.companyInfo) {
        addText(options.companyInfo.name, leftMargin, y, 14, true);
        y -= 20;
        if (options.companyInfo.address) {
          addText(options.companyInfo.address, leftMargin, y, 10);
          y -= 15;
        }
        if (options.companyInfo.phone) {
          addText(options.companyInfo.phone, leftMargin, y, 10);
          y -= 15;
        }
      }

      y -= 30;
      addText(`Estimate: ${estimate.name}`, leftMargin, y, 14, true);
      y -= 25;

      if (options.projectInfo) {
        addText(`Project: ${options.projectInfo.name}`, leftMargin, y, 12);
        y -= 18;
        if (options.projectInfo.address) {
          addText(`Location: ${options.projectInfo.address}`, leftMargin, y, 10);
          y -= 15;
        }
        if (options.projectInfo.owner) {
          addText(`Owner: ${options.projectInfo.owner}`, leftMargin, y, 10);
          y -= 15;
        }
        if (options.projectInfo.bidDate) {
          addText(`Bid Date: ${options.projectInfo.bidDate.toLocaleDateString()}`, leftMargin, y, 10);
          y -= 15;
        }
      }

      y -= 30;
      addText(`Total: $${this.formatNumber(totals.grandTotal)}`, leftMargin, y, 18, true);
      y -= 30;
      addText(`Date: ${new Date().toLocaleDateString()}`, leftMargin, y, 10);

      addNewPage();
    }

    // Summary section
    addText('ESTIMATE SUMMARY', leftMargin, y, 16, true);
    y -= 30;

    const summaryItems = [
      { label: 'Direct Costs', value: totals.directCost },
      { label: '  Materials', value: totals.materialCost },
      { label: '  Labor', value: totals.laborCost },
      { label: '  Equipment', value: totals.equipmentCost },
      { label: '  Subcontractors', value: totals.subcontractorCost },
    ];

    if (totals.markupAmount > 0) {
      summaryItems.push({ label: `Markup (${totals.markup}%)`, value: totals.markupAmount });
    }
    if (totals.contingencyAmount > 0) {
      summaryItems.push({ label: `Contingency (${totals.contingency}%)`, value: totals.contingencyAmount });
    }
    if (totals.overheadAmount > 0) {
      summaryItems.push({ label: `Overhead (${totals.overhead}%)`, value: totals.overheadAmount });
    }
    if (totals.profitAmount > 0) {
      summaryItems.push({ label: `Profit (${totals.profit}%)`, value: totals.profitAmount });
    }
    if (totals.taxAmount > 0) {
      summaryItems.push({ label: `Tax (${totals.tax}%)`, value: totals.taxAmount });
    }

    summaryItems.push({ label: 'GRAND TOTAL', value: totals.grandTotal });

    for (const item of summaryItems) {
      const isTotal = item.label === 'GRAND TOTAL';
      addText(item.label, leftMargin, y, 10, isTotal);
      addText(`$${this.formatNumber(item.value)}`, 400, y, 10, isTotal);
      y -= 15;
    }

    // Section breakdown
    if (options.includeSections) {
      y -= 20;
      if (y < 100) addNewPage();

      addText('SECTION BREAKDOWN', leftMargin, y, 14, true);
      y -= 25;

      for (const section of sections) {
        if (y < 100) addNewPage();

        const sectionTotals = section.totals as any;
        addText(`${section.code} - ${section.name}`, leftMargin, y, 11, true);
        addText(`$${this.formatNumber(sectionTotals?.directCost || 0)}`, 450, y, 11);
        y -= 18;

        // Line items
        if (options.includeLineItems) {
          for (const item of section.lineItems) {
            if (y < 50) addNewPage();

            const itemText = `  ${item.code} - ${item.name}`;
            const truncated = itemText.length > 60 ? itemText.substring(0, 57) + '...' : itemText;
            addText(truncated, leftMargin + 10, y, 9);

            if (options.showUnitCosts) {
              addText(`${item.quantity} ${item.unit}`, 320, y, 9);
              addText(`@$${this.formatNumber(item.unitCost || 0)}`, 380, y, 9);
            }

            addText(`$${this.formatNumber(Number(item.totalCost) || 0)}`, 470, y, 9);
            y -= 12;
          }
        }

        y -= 10;
      }
    }

    // Footer on last page
    page.drawText(`Generated: ${new Date().toISOString()}`, {
      x: leftMargin,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return {
      success: true,
      format: 'PDF',
      filename: `${estimate.name.replace(/[^a-zA-Z0-9]/g, '_')}_Estimate.pdf`,
      data: Buffer.from(pdfBytes),
      mimeType: 'application/pdf',
      size: pdfBytes.length,
    };
  }

  /**
   * Export to Excel
   */
  private async exportToExcel(
    data: { estimate: any; sections: any[]; lineItems: any[] },
    options: ExportOptions
  ): Promise<ExportResult> {
    const { estimate, sections } = data;
    const totals = estimate.totals as EstimateTotals;

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['ESTIMATE SUMMARY'],
      [''],
      ['Name', estimate.name],
      ['Type', estimate.type],
      ['Status', estimate.status],
      ['Date', new Date().toLocaleDateString()],
      [''],
      ['COST BREAKDOWN'],
      ['Direct Costs', totals.directCost],
      ['  Materials', totals.materialCost],
      ['  Labor', totals.laborCost],
      ['  Equipment', totals.equipmentCost],
      ['  Subcontractors', totals.subcontractorCost],
      ['  Other', totals.otherCost],
      [''],
      ['ADJUSTMENTS'],
      [`Markup (${totals.markup}%)`, totals.markupAmount],
      [`Contingency (${totals.contingency}%)`, totals.contingencyAmount],
      [`Overhead (${totals.overhead}%)`, totals.overheadAmount],
      [`Profit (${totals.profit}%)`, totals.profitAmount],
      [`Tax (${totals.tax}%)`, totals.taxAmount],
      [''],
      ['GRAND TOTAL', totals.grandTotal],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Detail sheet
    const detailHeaders = [
      'Section',
      'Code',
      'Description',
      'Quantity',
      'Unit',
      'Unit Cost',
      'Material',
      'Labor',
      'Equipment',
      'Subcontractor',
      'Total',
    ];

    const detailData = [detailHeaders];

    for (const section of sections) {
      for (const item of section.lineItems) {
        detailData.push([
          `${section.code} - ${section.name}`,
          item.code,
          item.name,
          Number(item.quantity) || 0,
          item.unit,
          Number(item.unitCost) || 0,
          Number(item.materialCost) || 0,
          Number(item.laborCost) || 0,
          Number(item.equipmentCost) || 0,
          Number(item.subcontractorCost) || 0,
          Number(item.totalCost) || 0,
        ]);
      }
    }

    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail');

    // Section summary sheet
    const sectionHeaders = ['Section', 'Items', 'Material', 'Labor', 'Equipment', 'Total'];
    const sectionData = [sectionHeaders];

    for (const section of sections) {
      const sectionTotals = section.totals as any;
      sectionData.push([
        `${section.code} - ${section.name}`,
        section.lineItems.length,
        sectionTotals?.materialCost || 0,
        sectionTotals?.laborCost || 0,
        sectionTotals?.equipmentCost || 0,
        sectionTotals?.directCost || 0,
      ]);
    }

    const sectionSheet = XLSX.utils.aoa_to_sheet(sectionData);
    XLSX.utils.book_append_sheet(workbook, sectionSheet, 'Sections');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
      success: true,
      format: 'EXCEL',
      filename: `${estimate.name.replace(/[^a-zA-Z0-9]/g, '_')}_Estimate.xlsx`,
      data: excelBuffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: excelBuffer.length,
    };
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(
    data: { estimate: any; sections: any[]; lineItems: any[] },
    options: ExportOptions
  ): Promise<ExportResult> {
    const { estimate, sections } = data;

    const headers = [
      'Section Code',
      'Section Name',
      'Item Code',
      'Item Name',
      'Description',
      'Quantity',
      'Unit',
      'Unit Cost',
      'Material Cost',
      'Labor Cost',
      'Equipment Cost',
      'Subcontractor Cost',
      'Total Cost',
    ];

    const rows = [headers.join(',')];

    for (const section of sections) {
      for (const item of section.lineItems) {
        const row = [
          this.escapeCSV(section.code),
          this.escapeCSV(section.name),
          this.escapeCSV(item.code),
          this.escapeCSV(item.name),
          this.escapeCSV(item.description || ''),
          Number(item.quantity) || 0,
          this.escapeCSV(item.unit),
          Number(item.unitCost) || 0,
          Number(item.materialCost) || 0,
          Number(item.laborCost) || 0,
          Number(item.equipmentCost) || 0,
          Number(item.subcontractorCost) || 0,
          Number(item.totalCost) || 0,
        ];
        rows.push(row.join(','));
      }
    }

    const csvContent = rows.join('\n');

    return {
      success: true,
      format: 'CSV',
      filename: `${estimate.name.replace(/[^a-zA-Z0-9]/g, '_')}_Estimate.csv`,
      data: Buffer.from(csvContent, 'utf-8'),
      mimeType: 'text/csv',
      size: csvContent.length,
    };
  }

  /**
   * Export to JSON
   */
  private async exportToJSON(
    data: { estimate: any; sections: any[]; lineItems: any[] },
    options: ExportOptions
  ): Promise<ExportResult> {
    const { estimate, sections } = data;
    const totals = estimate.totals as EstimateTotals;

    const exportData = {
      meta: {
        exportDate: new Date().toISOString(),
        format: 'Kealee Estimate v1.0',
      },
      estimate: {
        id: estimate.id,
        name: estimate.name,
        type: estimate.type,
        status: estimate.status,
        version: estimate.version,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt,
      },
      totals: {
        directCost: totals.directCost,
        materialCost: totals.materialCost,
        laborCost: totals.laborCost,
        equipmentCost: totals.equipmentCost,
        subcontractorCost: totals.subcontractorCost,
        markup: totals.markup,
        markupAmount: totals.markupAmount,
        contingency: totals.contingency,
        contingencyAmount: totals.contingencyAmount,
        overhead: totals.overhead,
        overheadAmount: totals.overheadAmount,
        profit: totals.profit,
        profitAmount: totals.profitAmount,
        tax: totals.tax,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
      },
      sections: sections.map(section => ({
        code: section.code,
        name: section.name,
        description: section.description,
        totals: section.totals,
        items: section.lineItems.map((item: any) => ({
          code: item.code,
          name: item.name,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit: item.unit,
          unitCost: Number(item.unitCost) || 0,
          materialCost: Number(item.materialCost) || 0,
          laborCost: Number(item.laborCost) || 0,
          equipmentCost: Number(item.equipmentCost) || 0,
          subcontractorCost: Number(item.subcontractorCost) || 0,
          totalCost: Number(item.totalCost) || 0,
          markup: item.markup,
          wastePercent: item.wastePercent,
          notes: item.notes,
        })),
      })),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    return {
      success: true,
      format: 'JSON',
      filename: `${estimate.name.replace(/[^a-zA-Z0-9]/g, '_')}_Estimate.json`,
      data: Buffer.from(jsonContent, 'utf-8'),
      mimeType: 'application/json',
      size: jsonContent.length,
    };
  }

  /**
   * Format number with commas
   */
  private formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Escape CSV field
   */
  private escapeCSV(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Generate comparison report
   */
  async generateComparisonReport(
    estimateId1: string,
    estimateId2: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const [data1, data2] = await Promise.all([
      this.getEstimateData(estimateId1),
      this.getEstimateData(estimateId2),
    ]);

    if (!data1 || !data2) {
      throw new Error('One or both estimates not found');
    }

    const totals1 = data1.estimate.totals as EstimateTotals;
    const totals2 = data2.estimate.totals as EstimateTotals;

    const comparisonData = {
      estimates: [
        { name: data1.estimate.name, total: totals1.grandTotal },
        { name: data2.estimate.name, total: totals2.grandTotal },
      ],
      difference: totals2.grandTotal - totals1.grandTotal,
      percentChange: totals1.grandTotal > 0
        ? ((totals2.grandTotal - totals1.grandTotal) / totals1.grandTotal) * 100
        : 0,
      breakdown: {
        material: {
          estimate1: totals1.materialCost,
          estimate2: totals2.materialCost,
          difference: totals2.materialCost - totals1.materialCost,
        },
        labor: {
          estimate1: totals1.laborCost,
          estimate2: totals2.laborCost,
          difference: totals2.laborCost - totals1.laborCost,
        },
        equipment: {
          estimate1: totals1.equipmentCost,
          estimate2: totals2.equipmentCost,
          difference: totals2.equipmentCost - totals1.equipmentCost,
        },
      },
    };

    const jsonContent = JSON.stringify(comparisonData, null, 2);

    return {
      success: true,
      format: 'JSON',
      filename: `Estimate_Comparison_${Date.now()}.json`,
      data: Buffer.from(jsonContent, 'utf-8'),
      mimeType: 'application/json',
      size: jsonContent.length,
    };
  }
}

export const exportGenerator = new ExportGenerator();
