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
        return { buffer, cachedUrl: existingPdfUrl, generated: false }
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
  let cachedUrl: string | undefined

  if (opts?.upload) {
    cachedUrl = await opts.upload(buffer, intake.id)
  }

  return { buffer, cachedUrl, generated: true }
}
