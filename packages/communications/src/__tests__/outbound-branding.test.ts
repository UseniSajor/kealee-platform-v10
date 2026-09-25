import { describe, expect, it } from 'vitest'
import {
  interpolateHtmlVariables,
  renderBrandedDocumentChrome,
  renderBrandedEmailHtml,
  resolveTenantEmailEnvelope,
} from '../outbound-branding'

describe('outbound communication branding', () => {
  it('preserves the existing Kealee defaults', () => {
    const html = renderBrandedEmailHtml({ bodyHtml: '<p>Hello</p>' })
    expect(html).toContain('Kealee')
    expect(html).toContain('Powered by Kealee')
    expect(resolveTenantEmailEnvelope()).toEqual({
      from: 'Kealee <noreply@kealee.com>',
      replyTo: 'support@kealee.com',
    })
  })

  it('removes every Kealee reference in full white-label mode', () => {
    const branding = {
      companyName: 'Acme Builders',
      productName: 'Acme Project OS',
      emailFrom: 'updates@acme.test',
      emailReplyTo: 'help@acme.test',
      kealeeBrandingVisible: false,
    }
    const html = renderBrandedEmailHtml({
      bodyHtml: '<p>Your report is ready.</p>',
      projectName: 'Oak Street',
      branding,
    })
    expect(html).toContain('Acme Builders')
    expect(html).not.toMatch(/kealee/i)
    expect(resolveTenantEmailEnvelope(branding)).toEqual({
      from: 'Acme Builders <updates@acme.test>',
      replyTo: 'help@acme.test',
    })
  })

  it('fails closed if a full white-label tenant has no sender address', () => {
    expect(() => resolveTenantEmailEnvelope({
      companyName: 'Acme',
      kealeeBrandingVisible: false,
    })).toThrow('verified tenant emailFrom')
  })

  it('escapes variables and branded text while retaining approved markup', () => {
    const body = interpolateHtmlVariables(
      '<p>Hello {{name}}</p><p>{{message}}</p>',
      { name: '<img src=x onerror=alert(1)>', message: 'Tom & Sue' },
    )
    const html = renderBrandedEmailHtml({
      bodyHtml: body,
      projectName: '<script>alert(1)</script>',
      branding: {
        companyName: '<Acme & Co>',
        logoUrl: 'javascript:alert(1)',
        kealeeBrandingVisible: false,
      },
    })
    expect(html).toContain('<p>Hello &lt;img src=x onerror=alert(1)&gt;</p>')
    expect(html).toContain('Tom &amp; Sue')
    expect(html).toContain('&lt;Acme &amp; Co&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('javascript:')
  })

  it('renders safe, brand-neutral report and document chrome', () => {
    const chrome = renderBrandedDocumentChrome({
      title: '<script>Investment memo</script>',
      branding: {
        companyName: 'Acme & Sons',
        reportHeader: '<Acme Private Report>',
        reportFooter: 'Confidential & proprietary',
        legalDisclaimer: '<Not professional advice>',
        kealeeBrandingVisible: false,
      },
    })
    const combined = chrome.headerHtml + chrome.footerHtml
    expect(combined).toContain('Acme &amp; Sons')
    expect(combined).toContain('&lt;script&gt;Investment memo&lt;/script&gt;')
    expect(combined).not.toMatch(/kealee/i)
    expect(combined).not.toContain('<script>')
  })
})
