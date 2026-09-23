import { describe, expect, it } from 'vitest'
import {
  conceptDeliverablesAreComplete,
  conceptHasRenders,
} from '../v30-deliverable-state'

describe('v30 concept deliverable state', () => {
  it('does not trust a stale finalization marker without customer assets', () => {
    const formData = {
      v30ConceptDeliverablesFinalizedAt: '2026-09-23T03:05:47.664Z',
      conceptOutput: { renderUrls: [] },
    }

    expect(conceptDeliverablesAreComplete(formData)).toBe(false)
    expect(conceptHasRenders(formData)).toBe(false)
  })

  it('requires both a real render and a PDF before treating assembly as complete', () => {
    const base = {
      v30ConceptDeliverablesFinalizedAt: '2026-09-23T03:05:47.664Z',
      conceptOutput: { renderUrls: ['https://cdn.example.test/render.jpg'] },
    }

    expect(conceptDeliverablesAreComplete(base)).toBe(false)
    expect(conceptDeliverablesAreComplete({
      ...base,
      conceptOutput: {
        ...base.conceptOutput,
        pdfUrl: 'https://cdn.example.test/concept.pdf',
      },
    })).toBe(true)
  })

  it('supports the legacy v30ConceptOutput field while records are migrated', () => {
    expect(conceptHasRenders({
      v30ConceptOutput: { renderUrls: ['https://cdn.example.test/render.jpg'] },
    })).toBe(true)
  })
})
