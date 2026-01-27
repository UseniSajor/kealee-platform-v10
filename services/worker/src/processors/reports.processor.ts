import { Worker, Job } from 'bullmq'
import PDFDocument from 'pdfkit'
import type { PDFDocument as PDFDocumentType } from 'pdfkit'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { redis } from '../config/redis.config'
import { ReportJobData, ReportResult } from '../types/report.types'
import { emailQueue } from '../queues/email.queue'

// Report storage directory
const REPORTS_DIR = process.env.REPORTS_DIR || join(process.cwd(), 'reports')
const REPORTS_URL_PREFIX = process.env.REPORTS_URL_PREFIX || '/reports'

// Ensure reports directory exists
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true })
}

/**
 * Generate PDF report using PDFKit
 */
async function generatePDFReport(
  job: Job<ReportJobData>
): Promise<ReportResult> {
  const { type, title, data, options = {} } = job.data

  try {
    const startTime = Date.now()

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${type}-${timestamp}.pdf`
    const filePath = join(REPORTS_DIR, filename)

    // Create PDF document
    const doc = new PDFDocument({
      size: options.pageSize || 'A4',
      layout: options.orientation || 'portrait',
      margins: {
        top: options.margins?.top || 50,
        bottom: options.margins?.bottom || 50,
        left: options.margins?.left || 50,
        right: options.margins?.right || 50,
      },
    })

    // Create write stream
    const stream = createWriteStream(filePath)
    doc.pipe(stream)

    // Add title
    doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' })
    doc.moveDown()

    // Add metadata
    if (job.data.metadata?.generatedAt) {
      doc.fontSize(10).font('Helvetica').text(
        `Generated: ${new Date(job.data.metadata.generatedAt).toLocaleString()}`,
        { align: 'right' }
      )
      doc.moveDown()
    }

    // Add report type
    doc.fontSize(12).font('Helvetica').text(`Report Type: ${type}`, {
      align: 'left',
    })
    doc.moveDown()

    // Add content based on report type
    switch (type) {
      case 'weekly_summary':
        await addWeeklySummaryContent(doc, data, options)
        break
      case 'project_status':
        await addProjectStatusContent(doc, data, options)
        break
      case 'financial_summary':
        await addFinancialSummaryContent(doc, data, options)
        break
      default:
        await addCustomContent(doc, data, options)
    }

    // Finalize PDF
    doc.end()

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve())
      stream.on('error', reject)
    })

    const duration = Date.now() - startTime

    // Get file size
    const fs = await import('fs/promises')
    const stats = await fs.stat(filePath)
    const fileSize = stats.size

    // Generate URL (if storage service is configured)
    const fileUrl = `${REPORTS_URL_PREFIX}/${filename}`

    console.log(`✅ Report generated successfully: ${job.id}`, {
      type,
      filePath,
      fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
      duration: `${duration}ms`,
    })

    return {
      success: true,
      filePath,
      fileUrl,
      fileSize,
      format: 'pdf',
      pages: 1, // PDFKit doesn't expose page count easily
      generatedAt: new Date(),
    }
  } catch (error: any) {
    console.error(`❌ Failed to generate report ${job.id}:`, error)
    throw new Error(`Report generation failed: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Add weekly summary content to PDF
 */
async function addWeeklySummaryContent(
  doc: PDFDocumentType,
  data: Record<string, any>,
  options: ReportJobData['options']
) {
  doc.fontSize(16).font('Helvetica-Bold').text('Summary', { underline: true })
  doc.moveDown()

  if (data.summary) {
    doc.fontSize(12).font('Helvetica').text(data.summary)
    doc.moveDown()
  }

  if (options?.includeTables && data.metrics) {
    doc.fontSize(14).font('Helvetica-Bold').text('Metrics')
    doc.moveDown(0.5)

    // Simple table representation
    Object.entries(data.metrics).forEach(([key, value]) => {
      doc.fontSize(11).font('Helvetica').text(`${key}: ${value}`)
    })
    doc.moveDown()
  }
}

/**
 * Add project status content to PDF
 */
async function addProjectStatusContent(
  doc: PDFDocumentType,
  data: Record<string, any>,
  options: ReportJobData['options']
) {
  doc.fontSize(16).font('Helvetica-Bold').text('Project Status', {
    underline: true,
  })
  doc.moveDown()

  if (data.status) {
    doc.fontSize(12).font('Helvetica').text(`Status: ${data.status}`)
    doc.moveDown()
  }

  if (data.progress !== undefined) {
    doc.fontSize(12).font('Helvetica').text(`Progress: ${data.progress}%`)
    doc.moveDown()
  }

  if (data.milestones && Array.isArray(data.milestones)) {
    doc.fontSize(14).font('Helvetica-Bold').text('Milestones')
    doc.moveDown(0.5)

    data.milestones.forEach((milestone: any) => {
      doc.fontSize(11).font('Helvetica').text(`- ${milestone.name || milestone}`)
    })
    doc.moveDown()
  }
}

/**
 * Add financial summary content to PDF
 */
async function addFinancialSummaryContent(
  doc: PDFDocumentType,
  data: Record<string, any>,
  options: ReportJobData['options']
) {
  doc.fontSize(16).font('Helvetica-Bold').text('Financial Summary', {
    underline: true,
  })
  doc.moveDown()

  if (data.total) {
    doc.fontSize(14).font('Helvetica-Bold').text(`Total: $${data.total}`)
    doc.moveDown()
  }

  if (data.budget) {
    doc.fontSize(12).font('Helvetica').text(`Budget: $${data.budget}`)
    doc.moveDown()
  }

  if (data.expenses && Array.isArray(data.expenses)) {
    doc.fontSize(14).font('Helvetica-Bold').text('Expenses')
    doc.moveDown(0.5)

    data.expenses.forEach((expense: any) => {
      doc.fontSize(11).font('Helvetica').text(
        `- ${expense.description || expense}: $${expense.amount || expense}`
      )
    })
    doc.moveDown()
  }
}

/**
 * Add custom content to PDF
 */
async function addCustomContent(
  doc: PDFDocumentType,
  data: Record<string, any>,
  options: ReportJobData['options']
) {
  doc.fontSize(16).font('Helvetica-Bold').text('Report Data', {
    underline: true,
  })
  doc.moveDown()

  // Add all data as text
  Object.entries(data).forEach(([key, value]) => {
    doc.fontSize(12).font('Helvetica-Bold').text(`${key}:`)
    doc.fontSize(11).font('Helvetica').text(String(value))
    doc.moveDown()
  })
}

/**
 * Process report job
 */
async function processReportJob(job: Job<ReportJobData>): Promise<ReportResult> {
  const { format = 'pdf' } = job.data

  try {
    switch (format) {
      case 'pdf':
        return await generatePDFReport(job)
      case 'html':
        // TODO: Implement HTML report generation
        throw new Error('HTML report generation not yet implemented')
      case 'csv':
        // TODO: Implement CSV report generation
        throw new Error('CSV report generation not yet implemented')
      default:
        throw new Error(`Unsupported report format: ${format}`)
    }
  } catch (error: any) {
    console.error(`❌ Failed to process report job ${job.id}:`, error)
    throw error
  }
}

/**
 * Create report worker
 */
export function createReportsWorker(): Worker<ReportJobData> {
  const worker = new Worker<ReportJobData>(
    'reports',
    async (job) => {
      return processReportJob(job)
    },
    {
      connection: redis as any,
      concurrency: 3, // Process up to 3 reports concurrently (PDF generation is CPU intensive)
      limiter: {
        max: 100, // Max 100 reports per
        duration: 60000, // 1 minute
      },
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`✅ Report job ${job.id} completed`, {
      type: job.data.type,
      format: result.format,
      fileSize: result.fileSize ? `${(result.fileSize / 1024).toFixed(2)} KB` : 'N/A',
    })

    // Optional: email the generated report if metadata requests it.
    // This supports the weekly GC reports flow where the cron job queues a report
    // and the email is sent once the PDF is generated.
    try {
      const meta = job.data.metadata as Record<string, any> | undefined
      const to = meta?.emailTo
      const subject = meta?.emailSubject
      if (result?.filePath && to && subject) {
        void (async () => {
          try {
            const fs = await import('fs/promises')
            const pdf = await fs.readFile(result.filePath)
            const content = Buffer.from(pdf).toString('base64')
            const intro = meta?.emailIntro || 'Your report is ready.'
            const portalPath = meta?.portalPath || '/portal/weekly-reports'
            const portalBase = process.env.PORTAL_BASE_URL || ''
            const portalUrl = portalBase ? `${portalBase}${portalPath}` : portalPath

            await emailQueue.sendEmail({
              to,
              subject,
              html: `
                <h1>${subject}</h1>
                <p>${intro}</p>
                <p>
                  Open in portal: <a href="${portalUrl}">${portalUrl}</a>
                </p>
              `,
              text: `${subject}\n\n${intro}\n\nOpen in portal: ${portalUrl}`,
              attachments: [
                {
                  content,
                  filename: `${job.data.type}-${job.id}.pdf`,
                  type: 'application/pdf',
                  disposition: 'attachment',
                },
              ],
              metadata: {
                eventType: meta?.eventType || 'report_email',
                reportJobId: job.id,
              },
            })
            console.log(`✅ Report email queued for job ${job.id}`)
          } catch (err: any) {
            console.error(`❌ Failed to queue report email for job ${job.id}:`, err?.message || err)
          }
        })()
      }
    } catch {
      // ignore
    }
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Report job ${job?.id} failed:`, {
      type: job?.data.type,
      error: err.message,
      attempts: job?.attemptsMade,
    })
  })

  worker.on('error', (err) => {
    console.error('❌ Report worker error:', err)
  })

  return worker
}
