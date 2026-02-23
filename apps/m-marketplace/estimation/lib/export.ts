/**
 * Export utilities for estimates
 * Supports PDF (via print), Excel (XLSX-compatible CSV), and CSV formats
 */

import { downloadFile, formatCurrency, formatCurrencyDetailed, formatDate } from './utils';
import {
  calculateCostBreakdown,
  type Section,
  type EstimateSettings,
  type CostBreakdown,
} from './calculations';

export interface Estimate {
  id?: string;
  name: string;
  projectType?: string;
  clientName?: string;
  location?: string;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  sections: Section[];
  settings: EstimateSettings;
  notes?: string;
  exclusions?: string;
}

/**
 * Build a flat list of all line items with section context for export
 */
function flattenLineItems(estimate: Estimate) {
  const rows: {
    section: string;
    division: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    type: string;
  }[] = [];

  for (const section of estimate.sections) {
    for (const item of section.lineItems) {
      rows.push({
        section: section.name,
        division: section.division,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        type: item.type,
      });
    }
  }

  return rows;
}

/**
 * Escape a value for CSV: wrap in quotes if it contains commas, quotes, or newlines
 */
function escapeCsvValue(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export estimate as a printable PDF via window.print()
 * Generates a styled HTML document in a new window and triggers print dialog
 */
export function exportToPDF(estimate: Estimate): void {
  const breakdown = calculateCostBreakdown(estimate.sections, estimate.settings);
  const lineItems = flattenLineItems(estimate);

  // Group items by section
  const sectionMap = new Map<string, typeof lineItems>();
  for (const item of lineItems) {
    const key = `${item.division} - ${item.section}`;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, []);
    }
    sectionMap.get(key)!.push(item);
  }

  const sectionRows = Array.from(sectionMap.entries())
    .map(([sectionName, items]) => {
      const sectionTotal = items.reduce((sum, i) => sum + i.totalCost, 0);
      const itemRows = items
        .map(
          (item) => `
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">${item.description}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">${item.unit}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrencyDetailed(item.unitCost)}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrencyDetailed(item.totalCost)}</td>
        </tr>`
        )
        .join('');

      return `
        <tr style="background: #f8f9fa;">
          <td colspan="4" style="padding: 8px 12px; font-weight: 600;">${sectionName}</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: 600;">${formatCurrency(sectionTotal)}</td>
        </tr>
        ${itemRows}`;
    })
    .join('');

  const notesHtml = estimate.notes
    ? `<div style="margin-top: 24px;">
        <h3 style="margin-bottom: 8px; font-size: 14px;">Notes &amp; Assumptions</h3>
        <p style="font-size: 12px; color: #555; white-space: pre-wrap;">${estimate.notes}</p>
      </div>`
    : '';

  const exclusionsHtml = estimate.exclusions
    ? `<div style="margin-top: 16px;">
        <h3 style="margin-bottom: 8px; font-size: 14px;">Exclusions</h3>
        <p style="font-size: 12px; color: #555; white-space: pre-wrap;">${estimate.exclusions}</p>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${estimate.name} - Estimate</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    table { width: 100%; border-collapse: collapse; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 4px; font-size: 24px; color: #2563eb; }
    .header p { margin: 0; font-size: 13px; color: #666; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .meta-item label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .meta-item p { margin: 2px 0 0; font-size: 14px; font-weight: 500; }
    .summary-table { margin-top: 24px; }
    .summary-table td { padding: 6px 12px; font-size: 13px; }
    .summary-table .total-row td { border-top: 2px solid #1a1a1a; font-size: 16px; font-weight: 700; }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>

  <div class="header">
    <h1>${estimate.name}</h1>
    <p>Cost Estimate</p>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <label>Client</label>
      <p>${estimate.clientName || 'N/A'}</p>
    </div>
    <div class="meta-item">
      <label>Project Type</label>
      <p>${estimate.projectType || 'N/A'}</p>
    </div>
    <div class="meta-item">
      <label>Location</label>
      <p>${estimate.location || 'N/A'}</p>
    </div>
    <div class="meta-item">
      <label>Date</label>
      <p>${estimate.createdAt ? formatDate(estimate.createdAt) : new Date().toLocaleDateString()}</p>
    </div>
  </div>

  <h2 style="font-size: 16px; margin-bottom: 12px;">Line Items</h2>
  <table>
    <thead>
      <tr style="background: #1a1a1a; color: white;">
        <th style="padding: 8px 12px; text-align: left;">Description</th>
        <th style="padding: 8px 12px; text-align: right;">Qty</th>
        <th style="padding: 8px 12px; text-align: left;">Unit</th>
        <th style="padding: 8px 12px; text-align: right;">Unit Cost</th>
        <th style="padding: 8px 12px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${sectionRows}
    </tbody>
  </table>

  <table class="summary-table" style="width: 320px; margin-left: auto;">
    <tbody>
      <tr>
        <td style="color: #666;">Subtotal</td>
        <td style="text-align: right;">${formatCurrency(breakdown.subtotal)}</td>
      </tr>
      ${breakdown.overhead > 0 ? `<tr><td style="color: #666;">Overhead (${estimate.settings.overheadPercent || 0}%)</td><td style="text-align: right;">${formatCurrency(breakdown.overhead)}</td></tr>` : ''}
      ${breakdown.profit > 0 ? `<tr><td style="color: #666;">Profit (${estimate.settings.profitPercent || 0}%)</td><td style="text-align: right;">${formatCurrency(breakdown.profit)}</td></tr>` : ''}
      ${breakdown.contingency > 0 ? `<tr><td style="color: #666;">Contingency (${estimate.settings.contingencyPercent || 0}%)</td><td style="text-align: right;">${formatCurrency(breakdown.contingency)}</td></tr>` : ''}
      ${breakdown.tax > 0 ? `<tr><td style="color: #666;">Tax (${estimate.settings.taxPercent || 0}%)</td><td style="text-align: right;">${formatCurrency(breakdown.tax)}</td></tr>` : ''}
      <tr class="total-row">
        <td>TOTAL</td>
        <td style="text-align: right;">${formatCurrency(breakdown.total)}</td>
      </tr>
    </tbody>
  </table>

  ${notesHtml}
  ${exclusionsHtml}

  <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center;">
    Generated by Kealee Estimation Platform
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Export estimate as Excel-compatible CSV (with BOM for proper Excel encoding)
 * Includes a header section, line items table, and cost summary
 */
export function exportToExcel(estimate: Estimate): void {
  const breakdown = calculateCostBreakdown(estimate.sections, estimate.settings);
  const lineItems = flattenLineItems(estimate);

  const rows: string[][] = [];

  // Header section
  rows.push(['COST ESTIMATE']);
  rows.push([]);
  rows.push(['Project Name', estimate.name]);
  rows.push(['Client', estimate.clientName || 'N/A']);
  rows.push(['Project Type', estimate.projectType || 'N/A']);
  rows.push(['Location', estimate.location || 'N/A']);
  rows.push(['Date', estimate.createdAt ? formatDate(estimate.createdAt) : new Date().toLocaleDateString()]);
  rows.push(['Status', estimate.status || 'Draft']);
  rows.push([]);
  rows.push([]);

  // Line items header
  rows.push(['DIVISION', 'SECTION', 'DESCRIPTION', 'TYPE', 'QTY', 'UNIT', 'UNIT COST', 'TOTAL']);

  // Line items data
  for (const item of lineItems) {
    rows.push([
      item.division,
      item.section,
      item.description,
      item.type,
      String(item.quantity),
      item.unit,
      item.unitCost.toFixed(2),
      item.totalCost.toFixed(2),
    ]);
  }

  rows.push([]);
  rows.push([]);

  // Cost summary
  rows.push(['COST SUMMARY']);
  rows.push(['Material Cost', '', '', '', '', '', '', breakdown.materialCost.toFixed(2)]);
  rows.push(['Labor Cost', '', '', '', '', '', '', breakdown.laborCost.toFixed(2)]);
  rows.push(['Equipment Cost', '', '', '', '', '', '', breakdown.equipmentCost.toFixed(2)]);
  rows.push(['Other Cost', '', '', '', '', '', '', breakdown.otherCost.toFixed(2)]);
  rows.push([]);
  rows.push(['Subtotal', '', '', '', '', '', '', breakdown.subtotal.toFixed(2)]);
  rows.push([`Overhead (${estimate.settings.overheadPercent || 0}%)`, '', '', '', '', '', '', breakdown.overhead.toFixed(2)]);
  rows.push([`Profit (${estimate.settings.profitPercent || 0}%)`, '', '', '', '', '', '', breakdown.profit.toFixed(2)]);
  rows.push([`Contingency (${estimate.settings.contingencyPercent || 0}%)`, '', '', '', '', '', '', breakdown.contingency.toFixed(2)]);
  rows.push([`Tax (${estimate.settings.taxPercent || 0}%)`, '', '', '', '', '', '', breakdown.tax.toFixed(2)]);
  rows.push([]);
  rows.push(['GRAND TOTAL', '', '', '', '', '', '', breakdown.total.toFixed(2)]);

  if (estimate.notes) {
    rows.push([]);
    rows.push(['NOTES']);
    rows.push([estimate.notes]);
  }

  if (estimate.exclusions) {
    rows.push([]);
    rows.push(['EXCLUSIONS']);
    rows.push([estimate.exclusions]);
  }

  // Build CSV content with proper escaping
  const csvContent = rows
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  // Add BOM for Excel to recognize UTF-8 encoding
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const filename = `${estimate.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_Estimate.csv`;

  downloadFile(blob, filename);
}

/**
 * Export estimate as simple CSV
 * Contains just the line items data in a clean flat format
 */
export function exportToCSV(estimate: Estimate): void {
  const lineItems = flattenLineItems(estimate);
  const breakdown = calculateCostBreakdown(estimate.sections, estimate.settings);

  const headers = ['Division', 'Section', 'Description', 'Type', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost'];

  const dataRows = lineItems.map((item) => [
    item.division,
    item.section,
    item.description,
    item.type,
    String(item.quantity),
    item.unit,
    item.unitCost.toFixed(2),
    item.totalCost.toFixed(2),
  ]);

  // Add summary rows at the end
  const summaryRows = [
    [],
    ['', '', '', '', '', '', 'Subtotal', breakdown.subtotal.toFixed(2)],
    ['', '', '', '', '', '', `Overhead (${estimate.settings.overheadPercent || 0}%)`, breakdown.overhead.toFixed(2)],
    ['', '', '', '', '', '', `Profit (${estimate.settings.profitPercent || 0}%)`, breakdown.profit.toFixed(2)],
    ['', '', '', '', '', '', `Contingency (${estimate.settings.contingencyPercent || 0}%)`, breakdown.contingency.toFixed(2)],
    ['', '', '', '', '', '', `Tax (${estimate.settings.taxPercent || 0}%)`, breakdown.tax.toFixed(2)],
    ['', '', '', '', '', '', 'GRAND TOTAL', breakdown.total.toFixed(2)],
  ];

  const allRows = [headers, ...dataRows, ...summaryRows];

  const csvContent = allRows
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${estimate.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_Estimate.csv`;

  downloadFile(blob, filename);
}
