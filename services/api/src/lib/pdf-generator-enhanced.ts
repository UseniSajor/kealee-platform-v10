/**
 * Enhanced PDF Generator using jsPDF
 * Generates professional PDFs for Concept, Estimation, and Permit deliverables
 * Pattern: Use jsPDF for text layout + Canvas for images → Production-quality PDFs
 */

import jsPDF from 'jspdf'
import { registerFont } from 'canvas'

// ============================================================================
// Types
// ============================================================================

export interface ConceptPDFData {
  title: string
  description?: string
  keyChanges?: string[]
  styleDirection?: string
  budgetRange?: { low?: number; mid?: number; high?: number }
  confidence?: number
  zone?: string
  setbacks?: string
  imageUrls?: string[]
}

export interface EstimationPDFData {
  title: string
  summary?: string
  lineItems?: Array<{ description: string; amount: number }>
  total?: number
  contingency?: number
  timeline?: string
  projectType?: string
}

export interface PermitPDFData {
  title: string
  jurisdiction?: string
  permitType?: string
  scope?: string
  requirements?: string[]
  timeline?: string
  estimatedCost?: number
  systems?: {
    electrical?: string
    plumbing?: string
    hvac?: string
    structural?: string
  }
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(n?: number): string {
  if (!n) return '$0'
  return `$${n.toLocaleString()}`
}

function confidenceColor(score?: number): [number, number, number] {
  if (!score) return [156, 163, 175] // gray
  if (score >= 0.8) return [56, 161, 105] // green
  if (score >= 0.6) return [232, 121, 58] // orange
  return [239, 68, 68] // red
}

function addWatermark(pdf: jsPDF, text: string): void {
  const pageHeight = pdf.internal.pageSize.getHeight()
  const pageWidth = pdf.internal.pageSize.getWidth()

  pdf.setTextColor(200, 200, 200)
  pdf.setFontSize(40)
  pdf.setFont(undefined, 'bold')
  pdf.text(text, pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
    opacity: 0.3,
  })

  // Restore text color
  pdf.setTextColor(0, 0, 0)
}

function addHeader(pdf: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  let yPosition = 20

  // Title
  pdf.setFontSize(24)
  pdf.setFont(undefined, 'bold')
  pdf.text(title, 20, yPosition)
  yPosition += 10

  // Subtitle
  if (subtitle) {
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(subtitle, 20, yPosition)
    yPosition += 8
  }

  // Horizontal line
  pdf.setDrawColor(200, 200, 200)
  pdf.line(20, yPosition + 2, pageWidth - 20, yPosition + 2)
  yPosition += 8

  // Reset text color
  pdf.setTextColor(0, 0, 0)

  return yPosition
}

function addFooter(pdf: jsPDF): void {
  const pageHeight = pdf.internal.pageSize.getHeight()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const timestamp = new Date().toLocaleDateString()

  pdf.setFontSize(9)
  pdf.setTextColor(150, 150, 150)
  pdf.text(`Generated: ${timestamp}`, 20, pageHeight - 10)
  pdf.text(`Page 1 of 1`, pageWidth - 40, pageHeight - 10)
}

// ============================================================================
// Concept PDF Generator (Enhancement 1)
// ============================================================================

export async function generateConceptPDFEnhanced(
  data: ConceptPDFData
): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = addHeader(pdf, data.title || 'Concept Package', 'Pre-Design Concept')

  // ========================================================================
  // Section 1: Overview
  // ========================================================================

  pdf.setFontSize(12)
  pdf.setFont(undefined, 'bold')
  pdf.text('Overview', 20, yPosition)
  yPosition += 8

  pdf.setFontSize(10)
  pdf.setFont(undefined, 'normal')
  if (data.description) {
    const descriptionLines = pdf.splitTextToSize(data.description, pageWidth - 40)
    pdf.text(descriptionLines, 20, yPosition)
    yPosition += descriptionLines.length * 5 + 5
  }

  // Confidence meter
  if (data.confidence !== undefined) {
    const confColor = confidenceColor(data.confidence)
    pdf.setTextColor(confColor[0], confColor[1], confColor[2])
    pdf.setFont(undefined, 'bold')
    pdf.text(`Confidence: ${Math.round(data.confidence * 100)}%`, 20, yPosition)
    pdf.setTextColor(0, 0, 0)
    yPosition += 8
  }

  // ========================================================================
  // Section 2: Key Changes
  // ========================================================================

  if (data.keyChanges && data.keyChanges.length > 0) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Key Changes', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    data.keyChanges.forEach((change) => {
      pdf.text(`• ${change}`, 25, yPosition)
      yPosition += 6
    })
  }

  // ========================================================================
  // Section 3: Style Direction
  // ========================================================================

  if (data.styleDirection) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Style Direction', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    const styleLines = pdf.splitTextToSize(data.styleDirection, pageWidth - 40)
    pdf.text(styleLines, 20, yPosition)
    yPosition += styleLines.length * 5 + 5
  }

  // ========================================================================
  // Section 4: Budget Range
  // ========================================================================

  if (data.budgetRange && (data.budgetRange.low || data.budgetRange.mid || data.budgetRange.high)) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Budget Range', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')

    const budgetX = 20
    const lowY = yPosition
    pdf.text('Low', budgetX, lowY)
    pdf.setFont(undefined, 'bold')
    pdf.text(formatCurrency(data.budgetRange.low), budgetX, lowY + 5)
    pdf.setFont(undefined, 'normal')

    const midX = budgetX + 50
    pdf.text('Estimated', midX, lowY)
    pdf.setFont(undefined, 'bold')
    pdf.setTextColor(232, 121, 58)
    pdf.text(formatCurrency(data.budgetRange.mid), midX, lowY + 5)
    pdf.setTextColor(0, 0, 0)
    pdf.setFont(undefined, 'normal')

    const highX = midX + 50
    pdf.text('High', highX, lowY)
    pdf.setFont(undefined, 'bold')
    pdf.text(formatCurrency(data.budgetRange.high), highX, lowY + 5)
    pdf.setFont(undefined, 'normal')

    yPosition += 18
  }

  // ========================================================================
  // Section 5: Zoning & Feasibility
  // ========================================================================

  if (data.zone || data.setbacks) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Zoning & Feasibility', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')

    if (data.zone) {
      pdf.text(`Zone: ${data.zone}`, 20, yPosition)
      yPosition += 6
    }

    if (data.setbacks) {
      pdf.text(`Setbacks: ${data.setbacks}`, 20, yPosition)
      yPosition += 6
    }
  }

  // Add footer
  addFooter(pdf)

  // Return PDF as buffer
  return Buffer.from(pdf.output('arraybuffer'))
}

// ============================================================================
// Estimation PDF Generator (Enhancement 3)
// ============================================================================

export async function generateEstimationPDFEnhanced(
  data: EstimationPDFData
): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  let yPosition = addHeader(pdf, data.title || 'Cost Estimate', 'Project Estimation')

  // ========================================================================
  // Section 1: Summary
  // ========================================================================

  if (data.summary) {
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Summary', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    const summaryLines = pdf.splitTextToSize(data.summary, pageWidth - 40)
    pdf.text(summaryLines, 20, yPosition)
    yPosition += summaryLines.length * 5 + 8
  }

  // ========================================================================
  // Section 2: Line Items
  // ========================================================================

  if (data.lineItems && data.lineItems.length > 0) {
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Cost Breakdown', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')

    // Table header
    pdf.setFillColor(240, 240, 240)
    pdf.rect(20, yPosition - 5, pageWidth - 40, 6, 'F')
    pdf.setFont(undefined, 'bold')
    pdf.text('Item', 25, yPosition)
    pdf.text('Amount', pageWidth - 35, yPosition, { align: 'right' })
    yPosition += 8

    // Table rows
    pdf.setFont(undefined, 'normal')
    let totalAmount = 0

    data.lineItems.forEach((item) => {
      const itemLines = pdf.splitTextToSize(item.description, pageWidth - 80)
      pdf.text(itemLines[0], 25, yPosition)
      pdf.text(formatCurrency(item.amount), pageWidth - 35, yPosition, { align: 'right' })
      yPosition += Math.max(6, itemLines.length * 5)
      totalAmount += item.amount
    })

    // Total row
    yPosition += 2
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 6

    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(11)
    pdf.text('Subtotal', 25, yPosition)
    pdf.text(formatCurrency(totalAmount), pageWidth - 35, yPosition, { align: 'right' })
    yPosition += 8

    // Contingency
    if (data.contingency && data.contingency > 0) {
      const contingencyAmount = totalAmount * (data.contingency / 100)
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Contingency (${data.contingency}%)`, 25, yPosition)
      pdf.text(formatCurrency(contingencyAmount), pageWidth - 35, yPosition, { align: 'right' })
      yPosition += 8
      totalAmount += contingencyAmount
    }

    // Grand total
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'bold')
    pdf.setTextColor(232, 121, 58)
    pdf.text('Total Estimated Cost', 25, yPosition)
    pdf.text(formatCurrency(totalAmount), pageWidth - 35, yPosition, { align: 'right' })
    pdf.setTextColor(0, 0, 0)
    yPosition += 10
  }

  // ========================================================================
  // Section 3: Timeline
  // ========================================================================

  if (data.timeline) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Timeline', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    pdf.text(data.timeline, 20, yPosition)
    yPosition += 6
  }

  addFooter(pdf)
  return Buffer.from(pdf.output('arraybuffer'))
}

// ============================================================================
// Permit PDF Generator (Enhancement 4)
// ============================================================================

export async function generatePermitPDFEnhanced(
  data: PermitPDFData
): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  let yPosition = addHeader(pdf, data.title || 'Permit Application', 'Permit Preparation Package')

  // ========================================================================
  // Section 1: Project Details
  // ========================================================================

  pdf.setFontSize(12)
  pdf.setFont(undefined, 'bold')
  pdf.text('Project Details', 20, yPosition)
  yPosition += 8

  pdf.setFontSize(10)
  pdf.setFont(undefined, 'normal')

  if (data.jurisdiction) {
    pdf.text(`Jurisdiction: ${data.jurisdiction}`, 20, yPosition)
    yPosition += 6
  }

  if (data.permitType) {
    pdf.text(`Permit Type: ${data.permitType}`, 20, yPosition)
    yPosition += 6
  }

  if (data.estimatedCost) {
    pdf.text(`Estimated Cost: ${formatCurrency(data.estimatedCost)}`, 20, yPosition)
    yPosition += 6
  }

  if (data.timeline) {
    pdf.text(`Timeline: ${data.timeline}`, 20, yPosition)
    yPosition += 6
  }

  // ========================================================================
  // Section 2: Scope of Work
  // ========================================================================

  if (data.scope) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Scope of Work', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    const scopeLines = pdf.splitTextToSize(data.scope, pageWidth - 40)
    pdf.text(scopeLines, 20, yPosition)
    yPosition += scopeLines.length * 5 + 5
  }

  // ========================================================================
  // Section 3: Systems Impact
  // ========================================================================

  if (data.systems && Object.values(data.systems).some(Boolean)) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Systems Impact', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')

    Object.entries(data.systems).forEach(([system, description]) => {
      if (description) {
        pdf.setFont(undefined, 'bold')
        pdf.text(`${system.charAt(0).toUpperCase() + system.slice(1)}:`, 20, yPosition)
        pdf.setFont(undefined, 'normal')
        pdf.text(description, 25, yPosition + 5)
        yPosition += 12
      }
    })
  }

  // ========================================================================
  // Section 4: Requirements Checklist
  // ========================================================================

  if (data.requirements && data.requirements.length > 0) {
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Permit Requirements', 20, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')

    data.requirements.forEach((req) => {
      pdf.text(`☐ ${req}`, 20, yPosition)
      yPosition += 6
    })
  }

  addFooter(pdf)
  return Buffer.from(pdf.output('arraybuffer'))
}
