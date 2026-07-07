import { describe, it, expect } from 'vitest'
import { sanitizeMarketingExport, computeLeadSummary } from '..'

describe('marketing-privacy', () => {
  it('redacts email and phone from strings', () => {
    const result = sanitizeMarketingExport('Contact jane@example.com or 555-123-4567')
    expect(result).not.toContain('jane@example.com')
    expect(result).not.toContain('555-123-4567')
    expect(result).toContain('[REDACTED]')
  })

  it('strips blocked field names from objects', () => {
    const result = sanitizeMarketingExport({
      title: 'Campaign',
      contact_email: 'secret@test.com',
      client_name: 'Jane Doe',
      count: 5,
    }) as Record<string, unknown>
    expect(result.contact_email).toBeUndefined()
    expect(result.client_name).toBeUndefined()
    expect(result.count).toBe(5)
  })

  it('computes lead summary without PII fields', () => {
    const summary = computeLeadSummary([
      { project_path: 'adu', status: 'new', source_channel: 'facebook', routing_tag: 'hot', created_at: new Date().toISOString() },
      { project_path: 'kitchen', status: 'paid', source_channel: 'google', created_at: new Date().toISOString() },
    ])
    expect(summary.total).toBe(2)
    expect(summary.bySource.facebook).toBe(1)
    expect(summary.hotCount).toBe(1)
    expect(summary).not.toHaveProperty('contact_email')
  })
})
