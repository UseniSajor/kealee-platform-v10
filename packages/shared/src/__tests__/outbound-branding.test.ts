import { describe, expect, it } from 'vitest'
import {
  createBrandedOutputMetadata,
  escapeHtml,
  resolveTenantOutboundBranding,
} from '../outbound-branding'

describe('tenant outbound branding', () => {
  it('preserves Kealee defaults when no tenant branding is supplied', () => {
    const brand = resolveTenantOutboundBranding(undefined)
    expect(brand.companyName).toBe('Kealee')
    expect(brand.emailFrom).toContain('kealee.com')
    expect(brand.attributionText).toBe('Powered by Kealee')
  })

  it('does not leak Kealee presentation into full white-label output', () => {
    const brand = resolveTenantOutboundBranding({
      companyName: 'Acme Builders',
      kealeeBrandingVisible: false,
    })
    const visibleStrings = Object.values(brand).filter((value): value is string => typeof value === 'string')
    expect(visibleStrings.join(' ').toLowerCase()).not.toContain('kealee')
    expect(brand.attributionText).toBeNull()
    expect(brand.emailFrom).toBeNull()
    expect(brand.emailReplyTo).toBeNull()
  })

  it('produces renderer-neutral document metadata', () => {
    expect(createBrandedOutputMetadata({
      companyName: 'Acme',
      reportHeader: 'Acme Feasibility Report',
      reportFooter: 'Confidential',
      legalDisclaimer: 'For planning use only.',
      kealeeBrandingVisible: false,
    })).toMatchObject({
      headerText: 'Acme Feasibility Report',
      footerText: 'Confidential',
      legalDisclaimer: 'For planning use only.',
      attributionText: null,
    })
  })

  it('rejects unsafe URLs, colors, and email header injection', () => {
    const brand = resolveTenantOutboundBranding({
      logoUrl: 'javascript:alert(1)',
      primaryColor: 'red; background:url(evil)',
      emailFrom: 'Acme <mail@acme.test>\r\nBcc: victim@example.com',
    })
    expect(brand.logoUrl).toBeNull()
    expect(brand.primaryColor).toBe('#1e293b')
    expect(brand.emailFrom).toBe('Kealee <noreply@kealee.com>')
  })

  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<script a="b">Tom & 'Sue'</script>`)).toBe(
      '&lt;script a=&quot;b&quot;&gt;Tom &amp; &#39;Sue&#39;&lt;/script&gt;',
    )
  })
})
