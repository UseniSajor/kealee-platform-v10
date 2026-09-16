/**
 * Load or generate a concept package PDF for an intake row.
 */

import { renderConceptPdf } from './render-concept-pdf'
import { resolveHomeownerDeliverablesForPdf, type IntakePdfSource } from './build-from-intake'

export interface ServeConceptPdfResult {
  buffer: Buffer
  cachedUrl?: string
  generated: boolean
}

function isPdf(buffer: Buffer, contentType?: string | null): boolean {
  const hasPdfSignature = buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  const typeIsPdf = !contentType || contentType.toLowerCase().includes('application/pdf')
  return hasPdfSignature && typeIsPdf
}

export async function serveConceptPackagePdf(
  intake: IntakePdfSource,
  opts?: {
    existingPdfUrl?: string | null
    upload?: (buffer: Buffer, intakeId: string) => Promise<string>
  },
): Promise<ServeConceptPdfResult> {
  const co = (intake.form_data ?? {}) as Record<string, unknown>
  const conceptOutput = (co.conceptOutput ?? co.v30ConceptOutput) as Record<string, unknown> | undefined
  const existingPdfUrl =
    opts?.existingPdfUrl ?? (typeof conceptOutput?.pdfUrl === 'string' ? conceptOutput.pdfUrl : null)

  if (existingPdfUrl?.startsWith('http')) {
    try {
      const res = await fetch(existingPdfUrl)
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        if (isPdf(buffer, res.headers.get('content-type'))) {
          return { buffer, cachedUrl: existingPdfUrl, generated: false }
        }
      }
    } catch {
      /* fall through to regenerate */
    }
  }

  const deliverables = resolveHomeownerDeliverablesForPdf(intake)
  if (!deliverables) {
    throw new Error('Concept package not ready — no concept output on this intake')
  }

  const buffer = await renderConceptPdf({ homeownerDeliverables: deliverables })
  if (!isPdf(buffer, 'application/pdf')) {
    throw new Error('Generated concept package failed PDF validation')
  }
  let cachedUrl: string | undefined

  if (opts?.upload) {
    cachedUrl = await opts.upload(buffer, intake.id)
  }

  return { buffer, cachedUrl, generated: true }
}
