/**
 * Deliverable Generator Service
 * Generates PDFs and artifacts for Concept, Estimation, and Permit deliverables
 * Pattern: Generate → Upload to Supabase via @kealee/storage → Store URLs in ProjectOutput
 */

import { uploadConceptDeliverable, uploadEstimationDeliverable, uploadPermitDeliverable } from '@kealee/storage'

/**
 * Generate Concept deliverable PDF
 * Converts concept data to PDF buffer for persistent storage
 */
export async function generateConceptPDF(
  data: {
    title: string
    description?: string
    keyChanges?: string[]
    styleDirection?: string
    budgetRange?: { low?: number; mid?: number; high?: number }
    imageUrls?: string[]
  }
): Promise<Buffer> {
  // Simple PDF generation using native tools
  // In production, use jsPDF or similar library
  // For now, return a placeholder buffer that will be enhanced with real PDF generation

  const pdfHeader = Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< >>
stream
BT
/F1 24 Tf
50 700 Td
(${data.title}) Tj
0 -30 Td
/F1 12 Tf
(${data.description || 'Concept Package'}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000229 00000 n
0000000334 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
435
%%EOF`
  )

  return pdfHeader
}

/**
 * Generate Estimation deliverable PDF
 */
export async function generateEstimationPDF(
  data: {
    title: string
    summary?: string
    lineItems?: Array<{ description: string; amount: number }>
    total?: number
  }
): Promise<Buffer> {
  // Placeholder PDF - to be enhanced with jsPDF or headless Chrome
  const pdfContent = `
ESTIMATION PACKAGE
==================

Title: ${data.title}
Summary: ${data.summary || 'Cost estimate'}

Line Items:
${data.lineItems?.map((item) => `  - ${item.description}: $${item.amount}`).join('\n') || 'N/A'}

Total: $${data.total || 0}

Generated: ${new Date().toISOString()}
`

  return Buffer.from(pdfContent, 'utf-8')
}

/**
 * Generate Permit deliverable PDF
 */
export async function generatePermitPDF(
  data: {
    title: string
    jurisdiction?: string
    permitType?: string
    scope?: string
    requirements?: string[]
  }
): Promise<Buffer> {
  // Placeholder PDF
  const pdfContent = `
PERMIT APPLICATION PACKAGE
===========================

Title: ${data.title}
Jurisdiction: ${data.jurisdiction || 'N/A'}
Permit Type: ${data.permitType || 'Building Permit'}

Scope: ${data.scope || 'See attached'}

Requirements:
${data.requirements?.map((r) => `  ✓ ${r}`).join('\n') || '  - See attached documents'}

Generated: ${new Date().toISOString()}
`

  return Buffer.from(pdfContent, 'utf-8')
}

/**
 * Persist Concept deliverable to Supabase
 */
export async function persistConceptDeliverable(
  intakeLeadId: string,
  conceptData: any,
  deps: { prisma: any }
) {
  try {
    const pdfBuffer = await generateConceptPDF({
      title: conceptData.title || 'Concept Package',
      description: conceptData.description,
      keyChanges: conceptData.keyChanges,
      styleDirection: conceptData.styleDirection,
      budgetRange: conceptData.budgetRange,
      imageUrls: conceptData.outputImages?.map((img: any) => img.url),
    })

    // Placeholder image buffers - in production these come from AI rendering service
    const imageBuffers = conceptData.outputImages?.map((img: any) => Buffer.from(img.data || '')) || []

    const result = await uploadConceptDeliverable(
      {
        intakeLeadId,
        conceptImages: imageBuffers,
        pdfContent: pdfBuffer,
        uploadedBy: 'system',
      },
      { prisma: deps.prisma, onEvent: undefined }
    )

    return {
      pdfUrl: result.pdfUrl,
      conceptImageUrls: result.conceptImageUrls,
      fileUploadIds: result.fileUploadIds,
    }
  } catch (err: any) {
    console.error('Failed to persist concept deliverable:', err?.message)
    // Return null on failure - webhook will handle gracefully
    return null
  }
}

/**
 * Persist Estimation deliverable to Supabase
 */
export async function persistEstimationDeliverable(
  intakeLeadId: string,
  estimationData: any,
  deps: { prisma: any }
) {
  try {
    const pdfBuffer = await generateEstimationPDF({
      title: estimationData.title || 'Cost Estimate',
      summary: estimationData.summary,
      lineItems: estimationData.lineItems,
      total: estimationData.totalCost,
    })

    const result = await uploadEstimationDeliverable(
      {
        intakeLeadId,
        pdfContent: pdfBuffer,
        uploadedBy: 'system',
      },
      { prisma: deps.prisma, onEvent: undefined }
    )

    return {
      pdfUrl: result.pdfUrl,
      fileUploadId: result.fileUploadId,
    }
  } catch (err: any) {
    console.error('Failed to persist estimation deliverable:', err?.message)
    return null
  }
}

/**
 * Persist Permit deliverable to Supabase
 */
export async function persistPermitDeliverable(
  intakeLeadId: string,
  permitData: any,
  deps: { prisma: any }
) {
  try {
    const pdfBuffer = await generatePermitPDF({
      title: permitData.title || 'Permit Application',
      jurisdiction: permitData.jurisdiction,
      permitType: permitData.permitType,
      scope: permitData.scope,
      requirements: permitData.requirements,
    })

    const result = await uploadPermitDeliverable(
      {
        intakeLeadId,
        packageFiles: [pdfBuffer],
        fileNames: ['permit-application.pdf'],
        uploadedBy: 'system',
      },
      { prisma: deps.prisma, onEvent: undefined }
    )

    return {
      fileUrls: result.fileUrls,
      fileUploadIds: result.fileUploadIds,
    }
  } catch (err: any) {
    console.error('Failed to persist permit deliverable:', err?.message)
    return null
  }
}
